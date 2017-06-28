const massive = require('massive')
const AsyncLock = require('async-lock')
const GDAX = require('./engines/gdax')
// const CEX = require('./engines/cex')
// const Kraken = require('./engines/kraken')
const player = require('play-sound')()

const MIN_ARBITRAGE = 1.0025  // 25 basis points
const MIN_PROFIT = 2

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
      if (arbitrage >= MIN_ARBITRAGE && potential >= MIN_PROFIT) {
        this.lock.acquire(engine.name, async (done) => {
          player.play('./coin.wav')
          this.snapshot(engine)
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
            const { action, productId, amount } = trade
            try {
              const order = await engine.placeOrder(action, productId, amount)
              await this.db.trades.insert({
                exchange_id: engine.id,
                opportunity_id: opportunityResult.id,
                expected: trade.expect,
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
    let resolvedCount = 0
    trades.forEach(async trade => {
      const { completed, result, received } = await engine.getOrder(trade.order_identity)
      if (completed) {
        await this.db.trades.update({ id: trade.id, completed, result, received, updated: new Date() })
        resolvedCount++
      }
    })
    if (resolvedCount === 3) {
      // Wait before trading again.
      // console.log('done')
      setTimeout(() => { done() }, 0.5 * 60 * 1000)
      this.snapshot(engine)
    } else {
      // TODO: handle stale incomplete trades
      setTimeout(() => this.resolveTrades(engine, done), 0)
    }
  }

  async snapshot (engine) {
    const accounts = await engine.accounts()
    return this.db.snapshots.insert({ exchange_id: engine.id, accounts, taken: new Date() })
  }

  run () {
    this.engines.forEach((engine) => {
      engine.start()
    })
    this.executeTradesAll()
  }
}

module.exports = Bot
