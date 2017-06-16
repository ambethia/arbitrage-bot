import EventEmitter from 'events'
import fetch from 'node-fetch'
import throttle from 'p-throttle'
import num from 'num'

const REST_BASE_URL = 'https://api.kraken.com/0/public'
const PUBLIC_REQUESTS_PER_SECOND = 3
const LIQUIDITY_DELTA = 0.001

class Kraken extends EventEmitter {
  products = []
  graph = {}
  rates = {}

  get name () {
    return 'Kraken'
  }

  async start () {
    await this.getProducts()
    await this.connect()
  }

  async stop () {
    if (this.connectRequest) {
      clearInterval(this.connectRequest)
    }
  }

  async updatePrices () {
    this.products.forEach(async product => {
      const data = await get(`/Depth?pair=${product.name}`)
      const book = Object.values(data)[0]
      const bids = book.bids.slice()
      const asks = book.asks.slice()
      let [bidPrice, bidDepth] = bids.shift().map(n => num(n))
      let [askPrice, askDepth] = asks.shift().map(n => num(n))
      for (let [price, depth] of bids) {
        if (bidPrice.sub(price).gt(bidPrice.mul(LIQUIDITY_DELTA))) break
        bidDepth = bidDepth.add(depth)
      }
      for (let [price, depth] of asks) {
        if (askPrice.sub(price).abs().gt(askPrice.mul(LIQUIDITY_DELTA))) break
        askDepth = askDepth.add(depth)
      }
      let changed = false
      if (!product.bid.price.eq(bidPrice)) {
        product.bid.price = bidPrice
        changed = true
      }
      if (!product.bid.depth.eq(bidDepth)) {
        product.bid.depth = bidDepth
        changed = true
      }
      if (!product.ask.price.eq(askPrice)) {
        product.ask.price = askPrice
        changed = true
      }
      if (!product.ask.depth.eq(askDepth)) {
        product.ask.depth = askDepth
        changed = true
      }
      if (changed) {
        this.emit('update', product)
      }
    })
  }

  async connect () {
    const delay = Math.ceil(PUBLIC_REQUESTS_PER_SECOND / this.products.length) * 1000
    this.connectRequest = setInterval(() => this.updatePrices(), delay)
  }

  async getProducts () {
    const products = await get('/AssetPairs')
    Object.values(products).forEach((product) => {
      if (!product.altname.includes('.d')) {
        const base = normalize(product.base)
        const quote = normalize(product.quote)
        const displayName = `${base}-${quote}`
        const fee = num(product.fees[0][1]).set_precision(8)
        const productObject = {
          base,
          quote,
          name: product.altname,
          displayName,
          exchange: this.name,
          bid: { price: num(0), depth: num(0) },
          ask: { price: num(0), depth: num(0) },
          fee
        }
        console.log(`Registering product on ${this.name}: ${displayName}`)
        this.products.push(productObject)
      }
    })
  }
}

const get = throttle(async (path) => {
  const response = await fetch(REST_BASE_URL + path)
  const data = await response.json()
  if (data.error.length > 0) {
    data.error.forEach(console.error)
  }
  return data.result
}, PUBLIC_REQUESTS_PER_SECOND, 1000)

const normalize = (currency) => {
  if (currency === 'XXBT' || currency === 'XBT') return 'BTC'
  if (currency.length === 3) return currency
  return currency.slice(1)
}

export default Kraken
