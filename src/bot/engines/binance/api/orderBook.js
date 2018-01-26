const EventEmitter = require('events')
const Client = require('.')

// Send a subscribe message for the product of interest.
// Queue any messages received over the websocket stream.
// Make a REST request for the order book snapshot from the REST feed.
// Playback queued messages, discarding sequence numbers before or equal to the snapshot sequence number.
// Apply playback messages to the snapshot as needed (see below).
// After playback is complete, apply real-time stream messages as they arrive.

class OrderBook extends EventEmitter {
  constructor (symbol) {
    super()
    this.symbol = symbol
    this.updateId = 0
    this.queue = []
    this.client = new Client()
    this.book = {
      bids: {},
      asks: {}
    }
    this.client.startDepthStream(symbol)
    this.client.on('update', data => {
      if (data.e === 'depthUpdate') {
        if (Math.abs(data.u - this.updateId) > 100) {
          this.sync(data)
        } else {
          this.apply(data)
        }
      }
    })
  }

  async sync (data) {
    const { symbol } = this
    if (this.queue.length === 0 && !this.syncing) {
      console.log(`Syncing ${symbol}`)
      this.syncing = true
      const book = await this.client.orderBook(symbol)
      this.book.asks = {}
      this.book.bids = {}
      for (let side of ['bids', 'asks']) {
        for (let [price, amount] of book[side]) {
          this.book[side][price] = amount
        }
      }
      this.updateId = book.lastUpdateId
      while (this.queue.length) {
        this.apply(this.queue.shift())
      }
      this.syncing = false
    } else {
      this.queue.push(data)
    }
  }

  apply (data) {
    if (data.u > this.updateId) {
      for (let side of ['bids', 'asks']) {
        for (let [price, amount] of data[side[0]]) {
          if (parseFloat(amount) > 0) {
            this.book[side][price] = amount
          } else {
            delete this.book[side][price]
          }
        }
      }
      this.updateId = data.u
      this.emit('update')
    }
  }

  snapShot (limit = undefined) {
    return {
      bids: Object.keys(this.book.bids).sort().reverse().map(price => [price, this.book.bids[price]]).slice(0, limit),
      asks: Object.keys(this.book.asks).sort().map(price => [price, this.book.asks[price]]).slice(0, limit)
    }
  }
}

module.exports = OrderBook
