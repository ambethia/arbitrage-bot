const EventEmitter = require('events')
const Gdax = require('gdax')
const arbitrage = require('../arbitrage')

const { GDAX_API_KEY, GDAX_SECRET, GDAX_PASSPHRASE } = process.env

const LIQUIDITY_DELTA = 0.0005
const FEE = 0.0025

const PAIRS = [
  // ['BTC', 'EUR'],
  // ['BTC', 'GBP'],
  // ['ETH', 'EUR'],
  // ['LTC', 'EUR']
  ['BTC', 'USD'],
  ['ETH', 'USD'],
  ['ETH', 'BTC'],
  ['LTC', 'USD'],
  ['LTC', 'BTC']
]

const OPPORTUNITIES = [
  // 'EUR-BTC-ETH-EUR',
  // 'EUR-ETH-BTC-EUR',
  // 'EUR-BTC-LTC-EUR',
  // 'EUR-LTC-BTC-EUR',

  'USD-BTC-ETH-USD',
  'USD-ETH-BTC-USD',
  'USD-BTC-LTC-USD',
  'USD-LTC-BTC-USD'
]

const PRECISION = 8

class GDAX extends EventEmitter {
  products = {}
  opportunities = {}

  get name () {
    return 'GDAX'
  }

  get id () {
    return 1
  }

  start () {
    this.client = new Gdax.AuthenticatedClient(GDAX_API_KEY, GDAX_SECRET, GDAX_PASSPHRASE)
    this.connectOrderBook()
    this.updatePrices()
  }

  async accounts () {
    return new Promise((resolve, reject) => {
      this.client.getAccounts((err, resp, accounts) => {
        if (err) {
          reject(err)
        } else {
          resolve(
            accounts.reduce((a, { currency, balance }) => {
              a[currency] = +balance.toString()
              return a
            }, {})
          )
        }
      })
    })
  }

  connectOrderBook () {
    this.book = new Gdax.OrderbookSync(PAIRS.map(p => p.join('-')))
  }

  arbitrage () {
    this.opportunities = arbitrage(this.products, OPPORTUNITIES)
  }

  async placeOrder (side, product, amount) {
    const options = {
      type: 'market',
      product_id: product
    }
    return new Promise((resolve, reject) => {
      const callback = (err, response, data) => {
        if (err) reject(err)
        resolve(data)
      }
      if (side === 'buy') {
        options.funds = amount.toFixed(PRECISION)
        this.client.buy(options, callback)
      } else {
        options.size = amount.toFixed(PRECISION)
        this.client.sell(options, callback)
      }
      this.log('ORDER', options)
    })
  }

  async getOrder (id) {
    return new Promise((resolve, reject) => {
      this.client.getOrder(id, (err, response, data) => {
        if (err) reject(err)
        if (data && data.settled) {
          const received = data.side === 'buy' ? data.filled_size : data.executed_value
          resolve({ completed: true, result: data, received })
        } else {
          resolve({ completed: false })
        }
      })
    })
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
          this.emit('update')
        }
      }
    })
    setTimeout(() => this.updatePrices(), 0)
    if (!this.book.socket) setTimeout(() => this.book.connect(), 5000)
  }

  log (...messages) {
    console.log(this.name, ...messages.map(m => JSON.stringify(m)))
  }
}

module.exports = GDAX
