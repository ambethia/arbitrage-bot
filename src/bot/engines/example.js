const EventEmitter = require('events')

// Example API for exchange engines. Should emit an `update` event when properties change.
class Example extends EventEmitter {
  // An object representing a summary of the order book on this exchange. Depth is in the base currency.
  //
  // {
  //   "BTC-USD": {
  //     "base": "BTC",
  //     "quote": "USD",
  //     "displayName": "BTC-USD",
  //     "exchange": "Example",
  //     "bid": {
  //       "price": 2583.1,
  //       "depth": 3.72828426
  //     },
  //     "ask": {
  //       "price": 2580.3,
  //       "depth": 12.33989392
  //     },
  //     "fee": 0.0025
  //   }
  // }
  products = {}

  // An object representing current state of potential arbitrage opportunities on the exchange.
  //
  // "USD-BTC-ETH-USD": {
  //   "maximum": 3957.8708091693,
  //   "potential": "-0.55",
  //   "arbitrage": 0.99451082266754,
  //   "amount": 100,
  //   "trades": [
  //     {
  //       "c1": "USD",
  //       "c2": "BTC",
  //       "productId": "BTC-USD",
  //       "action": "buy",
  //       "depth": 12.33989392,
  //       "rate": 0.00038755183505794,
  //       "fiatRate": 2580.3,
  //       "fiatDepth": 31840.628281776,
  //       "fee": 0.0025,
  //       "amount": 100,
  //       "expect": 0.038658295547029,
  //       "message": "Buy 0.0387 BTC with 100 USD at 2580.3."
  //     },
  //     {
  //       "c1": "BTC",
  //       "c2": "ETH",
  //       "productId": "ETH-BTC",
  //       "action": "buy",
  //       "depth": 50.69156683,
  //       "rate": 8.2788310290587,
  //       "fiatRate": 312.31,
  //       "fiatDepth": 15831.483236677,
  //       "fee": 0.0025,
  //       "amount": 0.038658295547029,
  //       "expect": 0.31924538296351,
  //       "message": "Buy 0.3192 ETH with 0.0387 BTC at 0.1208."
  //     },
  //     {
  //       "c1": "ETH",
  //       "c2": "USD",
  //       "productId": "ETH-USD",
  //       "action": "sell",
  //       "depth": 138.55707223,
  //       "rate": 312.3,
  //       "fiatRate": 312.3,
  //       "fiatDepth": 43271.373657429,
  //       "fee": 0.0025,
  //       "amount": 0.31924538296351,
  //       "expect": 99.451082266754,
  //       "message": "Sell 0.3192 for 99.45 USD at 312.3."
  //     }
  //   ]
  // }
  opportunities = {}

  get name () {
    return 'Example'
  }

  // The row in the DB for this exchange, this is fixed in `schema.sql`
  get id () {
    return 0
  }

  // Start updating `products` and `opportunities` for this exchange
  start () {
  }

  // Returns a promise that resolves to some object with at least an ID
  async placeOrder (side, product, amount) {
    return new Promise((resolve, reject) => {
      resolve({
        id: 123
      })
    })
  }

  // Gets the status of an order, returns a promise that resolves with one of:
  //   { completed: false } or
  //   { completed: true, result: [result response from API], received: [amount received by the trade] }
  async getOrder (id) {
    return new Promise((resolve, reject) => {
      resolve({ completed: true, result: {}, received: 0 })
    })
  }

  log (...messages) {
    console.log(this.name, ...messages.map(m => JSON.stringify(m)))
  }
}

module.exports = Example
