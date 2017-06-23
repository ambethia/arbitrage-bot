const EventEmitter = require('events')
const crypto = require('crypto')
const WebSocket = require('ws')
const arbitrage = require('../arbitrage')

const WS_URL = 'wss://ws.cex.io/ws/'
const API_KEY = process.env.CEX_API_KEY
const API_SECRET = process.env.CEX_SECRET
const LIQUIDITY_DELTA = 0.001
const FEE = 0.002
const PRECISION = 8
const PAIRS = [
  ['BTC', 'USD'],
  ['BTC', 'EUR'],
  ['ETH', 'BTC'],
  ['ETH', 'USD'],
  ['ETH', 'EUR']
]

const OPPORTUNITIES = [
  'EUR-BTC-ETH-EUR',
  'EUR-ETH-BTC-EUR',
  'USD-BTC-ETH-USD',
  'USD-ETH-BTC-USD'
]

class CEX extends EventEmitter {
  opportunities = {}
  products = {}
  subscriptions = {}

  get name () {
    return 'CEX'
  }

  get id () {
    return 2
  }

  start () {
    this.ws = new WebSocket(WS_URL, { perMessageDeflate: false })
    this.ws.on('message', (data) => this.receive(data))
    this.ws.on('close', () => this.start())
    setInterval(() => this.resetSubscriptions(), 120 * 1000)
  }

  async placeOrder (side, amount) {
    return {
      id: 123
    }
  }

  async getOrder (id) {
    return {
      result: { a: 123 },
      completed: true
    }
  }

  auth () {
    this.log('Sending Authentication')
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = crypto.createHmac('sha256', API_SECRET).update(timestamp + API_KEY).digest('hex')
    this.send('auth', { auth: { signature, timestamp, key: API_KEY } })
  }

  arbitrage () {
    this.opportunities = arbitrage(this.products, OPPORTUNITIES)
  }

  resetSubscriptions () {
    PAIRS.forEach(([base, quote]) => {
      this.subscribe(base, quote)
    })
  }

  subscribe (base, quote) {
    this.send('order-book-subscribe', {
      data: {
        'pair': [base, quote],
        'subscribe': true,
        'depth': 42
      }
    })
    const displayName = `${base}-${quote}`
    const productObject = {
      base,
      quote,
      displayName,
      exchange: this.name,
      bid: { price: 0, depth: 0 },
      ask: { price: 0, depth: 0 },
      fee: FEE
    }
    this.products[displayName] = productObject
  }

  updateProduct (pair) {
    const product = this.products[pair.replace(':', '-')]
    let bids = Object.keys(this.subscriptions[pair].bids).sort().reverse().map((price) => [price, this.subscriptions[pair].bids[price]])
    let asks = Object.keys(this.subscriptions[pair].asks).sort().map((price) => [price, this.subscriptions[pair].asks[price]])
    let [bidPrice, bidDepth] = bids.shift().map(n => parseFloat(n))
    let [askPrice, askDepth] = asks.shift().map(n => parseFloat(n))
    for (let [price, depth] of bids) {
      if (bidPrice - parseFloat(price) > bidPrice * LIQUIDITY_DELTA) break
      bidDepth += parseFloat(depth)
    }
    for (let [price, depth] of asks) {
      if (Math.abs(askPrice - parseFloat(price)) > askPrice * LIQUIDITY_DELTA) break
      askDepth += parseFloat(depth)
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

  updateSubscription ({ id, pair, bids, asks }) {
    const updateSide = (existing, updates) => {
      updates.forEach((line) => {
        let [price, amount] = line
        price = price.toFixed(PRECISION)
        if (amount > 0) {
          existing[price] = line[1]
        } else {
          delete existing[price]
        }
      })
    }
    const subscription = this.subscriptions[pair]
    if (id === subscription.id + 1) {
      updateSide(subscription.bids, bids)
      updateSide(subscription.asks, asks)
      subscription.id = id
    } else {
      this.log(`${pair} book out of sync`)
      this.subscribe(...pair.split(':'))
    }
    this.updateProduct(pair)
  }

  initializeSubscription ({ pair, id, bids, asks }) {
    const buildSide = (orders) => {
      return orders.reduce((prices, line) => {
        const [price, amount] = line
        prices[price.toFixed(PRECISION)] = amount
        return prices
      }, {})
    }
    this.subscriptions[pair] = {
      id,
      bids: buildSide(bids),
      asks: buildSide(asks)
    }
    this.updateProduct(pair)
  }

  receive (data) {
    const message = JSON.parse(data)
    switch (message.e) {
      case 'disconnecting':
        this.start()
        break
      case 'connected':
        this.auth()
        break
      case 'auth':
        if (message.ok === 'ok') {
          this.log('Authenticated')
          this.resetSubscriptions()
        }
        break
      case 'ping':
        this.send('pong')
        break
      case 'order-book-subscribe':
        if (message.ok === 'ok') {
          this.initializeSubscription(message.data)
        }
        break
      case 'md_update':
        this.updateSubscription(message.data)
        break
      default:
        this.log('unhandled', message)
        break
    }
  }

  send (e, data = {}) {
    const json = JSON.stringify({ e, ...data })
    this.ws.send(json)
  }

  log (...messages) {
    console.log(this.name, ...messages.map(m => JSON.stringify(m)))
  }
}

module.exports = CEX
