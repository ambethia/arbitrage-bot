const got = require('got')
const crypto = require('crypto')
const qs = require('qs')
const EventEmitter = require('events')
const WebSocket = require('ws')

const API_BASE = 'https://www.binance.com/api/v1'
const WS_BASE = 'wss://stream.binance.com:9443/ws'
const WINDOW = 5000

const ENUM = {
  SYMBOL_TYPE: ['SPOT'],
  ORDER_STATUS: ['NEW', 'PARTIALLY_FILLED', 'FILLED', 'CANCELED', 'PENDING_CANCEL', 'REJECTED', 'EXPIRED'],
  ORDER_TYPES: ['LIMIT', 'MARKET'],
  ORDER_SIDES: ['BUY', 'SELL'],
  TIME_IN_FORCE: ['GTC', 'IOC'],
  KLINE_INTERVALS: ['1m', '3m', '5m', '15m', '30m', '1h', '2h', '4h', '6h', '8h', '12h', '1d', '3d', '1w', '1M']
}

class Binance extends EventEmitter {
  constructor (key, secret) {
    super()
    this.key = key
    this.secret = secret
    this.streams = {}
  }

  async ping () {
    return this.publicRequest('/ping')
  }

  async time () {
    return this.publicRequest('/time')
  }

  async orderBook (symbol, options = {}) {
    return this.publicRequest('/depth', { symbol, ...options })
  }

  async aggregateTrades (symbol, options = {}) {
    return this.publicRequest('/aggTrades', { symbol, ...options })
  }

  async candles (symbol, interval = '1h', options = {}) {
    validateIn(ENUM.KLINE_INTERVALS, interval)
    return this.publicRequest('/klines', { symbol, interval, ...options })
  }

  async ticker (symbol) {
    return this.publicRequest('/ticker/24hr', { symbol })
  }

  async order (symbol, side, quantity, price, type = 'LIMIT', timeInForce = 'GTC', options = {}) {
    validateIn(ENUM.ORDER_SIDES, side)
    validateIn(ENUM.ORDER_TYPES, type)
    validateIn(ENUM.TIME_IN_FORCE, timeInForce)
    return this.signedRequest('/order/test', 'POST', { symbol, side, quantity, price, type, timeInForce, ...options })
  }

  async queryOrder (symbol, options = {}) {
    if (!(options.orderId || options.origClientOrderId)) { throw new Error('Either orderId or origClientOrderId must be sent') }
    return this.signedRequest('/order', 'GET', { symbol, ...options })
  }

  async cancelOrder (symbol, options = {}) {
    if (!(options.orderId || options.origClientOrderId)) { throw new Error('Either orderId or origClientOrderId must be sent') }
    return this.signedRequest('/order', 'DELETE', { symbol, ...options })
  }

  async openOrders (symbol, options = {}) {
    return this.signedRequest('/openOrders', 'GET', { symbol, ...options })
  }

  async allOrders (symbol, options = {}) {
    return this.signedRequest('/allOrders', 'GET', { symbol, ...options })
  }

  async account () {
    return this.signedRequest('/account', 'GET')
  }

  async trades (symbol, options = {}) {
    return this.signedRequest('/myTrades', 'GET', { symbol, ...options })
  }

  startDepthStream (symbol) {
    this.startStream(`${symbol.toLowerCase()}@depth`)
  }

  closeDepthStream (symbol) {
    this.closeStream(`${symbol.toLowerCase()}@depth`)
  }

  startCandleStream (symbol, interval) {
    validateIn(ENUM.KLINE_INTERVALS, interval)
    this.startStream(`${symbol.toLowerCase()}@kline_${interval}`)
  }

  closeCandleStream (symbol, interval) {
    validateIn(ENUM.KLINE_INTERVALS, interval)
    this.closeStream(`${symbol.toLowerCase()}@kline_${interval}`)
  }

  startTradeStream (symbol) {
    this.startStream(`${symbol.toLowerCase()}@trades`)
  }

  closeTradeStream (symbol) {
    this.closeStream(`${symbol.toLowerCase()}@trades`)
  }

  async startUserStream () {
    const { listenKey } = await this.keyedRequest(API_BASE + '/userDataStream', 'POST')
    this.listenKey = listenKey
    this.startStream('user', listenKey)
    this.userDataInterval = setInterval(() => {
      this.pingUserStream()
    }, 30 * 1000)
  }

  pingUserStream () {
    this.keyedRequest(API_BASE + '/userDataStream?listenKey=' + this.listenKey, 'PUT')
  }

  closeUserStream () {
    this.keyedRequest(API_BASE + '/userDataStream?listenKey=' + this.listenKey, 'DELETE')
    this.closeStream('user')
    clearInterval(this.userDataInterval)
  }

  // Intermal Methods

  startStream (name, action) {
    if (action === undefined) action = name
    const url = WS_BASE + '/' + action
    const ws = new WebSocket(url)

    ws.on('open', () => {
      this.emit('open', name)
    })

    ws.on('close', () => {
      this.emit('close', name)
    })

    ws.on('error', error => {
      console.error(error)
      this.emit('error', error, name)
    })

    ws.on('message', data => {
      this.emit('update', JSON.parse(data), name)
    })

    this.streams[name] = ws
  }

  closeStream (name) {
    if (this.streams[name]) {
      this.streams.userData.close()
      delete this.streams.userData
    }
  }

  async signedRequest (action, method, params = {}) {
    params.timestamp = Date.now()
    params.recvWindow = WINDOW
    const hash = crypto.createHash('sha256')
    const totalParams = qs.stringify(params)
    const signature = hash.update([this.secret, totalParams].join('|')).digest('hex')
    const queryString = totalParams + '&signature=' + signature
    const url = API_BASE + action + '?' + queryString
    return this.keyedRequest(url, method)
  }

  async publicRequest (action, params = {}) {
    const queryString = qs.stringify(params)
    const url = API_BASE + action + '?' + queryString
    return this.rawRequest(url)
  }

  async keyedRequest (url, method) {
    const options = {
      method,
      headers: {
        'X-MBX-APIKEY': this.key
      }
    }
    return this.rawRequest(url, options)
  }

  async rawRequest (url, options = {}) {
    const { body } = await got(url, options)
    const data = JSON.parse(body)

    return data
  }
}

const validateIn = (list, value) => {
  if (!list.includes(value)) {
    throw new Error(`${value} is not one of ${list.join(', ')}`)
  }
}

module.exports = Binance
