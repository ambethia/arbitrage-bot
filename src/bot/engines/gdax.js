import EventEmitter from 'events'
import Gdax from 'gdax'
import arbitrage from '../arbitrage'

const LIQUIDITY_DELTA = 0.001
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
    this.opportunities = arbitrage(this.products, OPPORTUNITIES, FEE)
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
        this.log(`Registering product on ${this.name}: ${displayName}`)
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
    })
  }

  log (...messages) {
    console.log('GDAX', JSON.stringify(messages))
  }
}

export default GDAX
