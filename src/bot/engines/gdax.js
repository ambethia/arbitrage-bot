import EventEmitter from 'events'
import fetch from 'node-fetch'
import throttle from 'p-throttle'
import num from 'num'

const REST_BASE_URL = 'https://api.gdax.com'
const PUBLIC_REQUESTS_PER_SECOND = 3
const LIQUIDITY_DELTA = 0.001
const FEE = num(0.25)

class GDAX extends EventEmitter {
  products = []

  get name () {
    return 'GDAX'
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
      const id = [product.base, product.quote].join('-')
      const book = await get(`/products/${id}/book?level=2`)
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
    const products = await get('/products')
    products.forEach((product) => {
      const base = product.base_currency
      const quote = product.quote_currency
      const displayName = `${base}-${quote}`

      const productObject = {
        base,
        quote,
        displayName,
        exchange: this.name,
        bid: { price: num(0), depth: num(0) },
        ask: { price: num(0), depth: num(0) },
        fee: num(FEE)
      }
      console.log(`Registering product on ${this.name}: ${displayName}`)
      this.products.push(productObject)
    })
  }
}

const get = throttle(async (path) => {
  const response = await fetch(REST_BASE_URL + path)
  return response.json()
}, PUBLIC_REQUESTS_PER_SECOND, 1000)

export default GDAX
