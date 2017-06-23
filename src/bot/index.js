const massive = require('massive')
const AsyncLock = require('async-lock')
const GDAX = require('./engines/gdax')
// const CEX = require('./engines/cex')
// const Kraken = require('./engines/kraken')
const player = require('play-sound')()

const MIN_ARBITRAGE = 1.001  // 10 basis points

class Bot {
  opportunities = {}
  engines = [
    new GDAX()
    // new CEX()
    // new Kraken()
  ]

  constructor () {
    massive({ connectionString: process.env.DATABASE_URL }).then(db => { this.db = db })
    this.lock = new AsyncLock()
    this.engines.forEach((engine) => {
      this.opportunities[engine.name] = {}
      engine.on('update', () => {
        this.db.exchanges.update({
          id: engine.id,
          data: {
            products: engine.products,
            opportunities: engine.opportunities
          },
          updated: new Date()
        })
      })
    })
  }

  async executeTradesAll () {
    for (let engine of this.engines) {
      await this.executeTrades(engine)
    }
    setTimeout(() => this.executeTradesAll(), 50)
  }

  async executeTrades (engine) {
    for (let sequence in engine.opportunities) {
      const opportunity = engine.opportunities[sequence]
      const { arbitrage, maximum, potential, amount } = opportunity
      if (arbitrage >= MIN_ARBITRAGE) {
        this.lock.acquire(engine.name, async (done) => {
          player.play('./coin.wav')
          // Persist opportunity in DB
          const opportunityResult = await this.db.opportunities.insert({
            exchange_id: engine.id,
            sequence,
            arbitrage,
            maximum,
            potential,
            amount,
            updated: new Date()
          })
          for (let i = 0; i < opportunity.trades.length; i++) {
            const trade = opportunity.trades[i]
            const { action, productId, size } = trade
            try {
              const order = await engine.placeOrder(action, productId, size)
              await this.db.trades.insert({
                exchange_id: engine.id,
                opportunity_id: opportunityResult.id,
                seq: i,
                order_identity: order.id,
                placed: order,
                details: trade,
                updated: new Date()
              })
            } catch (err) {
              console.warn('ERROR', err)
            }
          }
          setTimeout(() => this.resolveTrades(engine, done), 0)
        })
      }
    }
  }

  async resolveTrades (engine, done) {
    const trades = await this.db.trades.find({ completed: false, exchange_id: engine.id })
    let unresolved = false
    trades.forEach(async trade => {
      const { completed, result } = await engine.getOrder(trade.order_identity)
      if (completed) {
        this.db.trades.update({ id: trade.id, completed, result, updated: new Date() })
      } else {
        unresolved = true
      }
    })
    if (unresolved) {
      setTimeout(() => this.resolveTrades(engine, done), 0)
      // TODO: handle stale incomplete trades
    } else {
      // Wait before trading again.
      setTimeout(() => { console.log('done'); done() }, 60 * 1000)
    }
  }

  run () {
    this.engines.forEach((engine) => {
      engine.start()
    })
    this.executeTradesAll()
  }
}

module.exports = Bot
