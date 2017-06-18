import EventEmitter from 'events'
import WebSocket from 'ws'
import fetch from 'node-fetch'
import throttle from 'p-throttle'
import Gdax from 'gdax'

const REST_BASE_URL = 'https://api.gdax.com'
const WS_URL = 'wss://ws-feed.gdax.com'
const PUBLIC_REQUESTS_PER_SECOND = 3
const LIQUIDITY_DELTA = 0.001
const PRECISION = 8
const FEE = 0.25

const PAIRS = [
  ['BTC', 'USD'],
  ['BTC', 'EUR'],
  // ['BTC', 'GBP'],
  ['ETH', 'USD'],
  ['ETH', 'BTC'],
  ['ETH', 'EUR']
  // ['LTC', 'USD'],
  // ['LTC', 'BTC'],
  // ['LTC', 'EUR']
]

const OPPORTUNITIES = [
  'EUR-BTC-ETH-EUR',
  'EUR-ETH-BTC-EUR',
  'USD-BTC-ETH-USD',
  'USD-ETH-BTC-USD'
  // 'EUR-BTC-LTC-EUR',
  // 'EUR-LTC-BTC-EUR',
  // 'USD-BTC-LTC-USD',
  // 'USD-LTC-BTC-USD'
]

class GDAX extends EventEmitter {
  products = {}
  opportunities = {}

  get name () {
    return 'GDAX'
  }

  async start () {
    this.book = new Gdax.OrderbookSync(PAIRS.map(p => p.join('-')))
    this.book.on('message', (data) => { this.updatePrices() })
  }

  arbitrage () {
    for (let key of OPPORTUNITIES) {
      const trades = []
      const rates = []
      const seq = key.split('-')
      for (let i = 0; i < 3; i++) {
        const c1 = seq[i]
        const c2 = seq[i + 1]
        if (this.products.hasOwnProperty(`${c2}-${c1}`)) {
          const product = this.products[`${c2}-${c1}`]
          const price = product.ask.price
          const message = `buy ${c2} with ${c1} at ${price}`
          if (price > 0) {
            rates.push(1 / price)
            trades.push(message)
          }
        } else if (this.products.hasOwnProperty(`${c1}-${c2}`)) {
          const product = this.products[`${c1}-${c2}`]
          const price = product.bid.price
          const message = `sell ${c1} for ${c2} at ${price}`
          if (price > 0) {
            rates.push(price)
            trades.push(message)
          }
        }
      }
      if (rates.length === 3) {
        const arb = rates.reduce((p, n) => p * n * (1 - FEE / 100))
        this.opportunities[key] = arb
        if (arb > 1) {
          console.log(rates.join(' * ') + ' = ' + arb)
          console.log(trades.join(', then '))
        }
      }
    }
  }

  updatePrices () {
    PAIRS.forEach(([base, quote]) => {
      const displayName = `${base}-${quote}`
      if (!this.products[displayName]) {
        this.products[displayName] = {
          base,
          quote,
          displayName,
          exchange: this.name,
          bid: { price: 0, depth: 0 },
          ask: { price: 0, depth: 0 },
          fee: FEE
        }
        console.log(`Registering product on ${this.name}: ${displayName}`)
      }
      const product = this.products[displayName]
      const book = this.book.books[displayName].state()
      let i = 0
      let j = 0
      const bid = book.bids[i]
      const ask = book.asks[j]
      if (bid && ask) {
        const bidPrice = parseFloat(bid.price)
        let bidDepth = parseFloat(bid.size)
        let _bidPrice = bidPrice
        while (bidPrice - _bidPrice <= bidPrice * LIQUIDITY_DELTA) {
          _bidPrice = parseFloat(book.bids[i].price)
          bidDepth += parseFloat(book.bids[i].size)
          i++
        }
        const askPrice = parseFloat(ask.price)
        let askDepth = parseFloat(ask.size)
        let _askPrice = askPrice
        while (Math.abs(askPrice - _askPrice) <= askPrice * LIQUIDITY_DELTA) {
          _askPrice = parseFloat(book.asks[j].price)
          askDepth += parseFloat(book.asks[j].size)
          j++
        }
        let changed = false
        if (product.bid.price !== bidPrice) {
          product.bid.price = bidPrice
          changed = true
        }
        if (product.bid.depth !== bidDepth) {
          product.bid.depth = bidDepth
          changed = true
        }
        if (product.ask.price !== askPrice) {
          product.ask.price = askPrice
          changed = true
        }
        if (product.ask.depth !== askDepth) {
          product.ask.depth = askDepth
          changed = true
        }
        if (changed) {
          this.arbitrage()
          this.emit('update', product)
        }
      }
      // let [bidPrice, bidDepth] = bids.shift().map(n => parseFloat(n))
      // let [askPrice, askDepth] = asks.shift().map(n => parseFloat(n))
    })
  }

  log (...messages) {
    console.log('GDAX', JSON.stringify(messages))
  }
}

export default GDAX
