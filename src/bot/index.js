import GDAX from './engines/gdax'
import Kraken from './engines/kraken'
import CEX from './engines/cex'

class Bot {
  opportunities = {}
  engines = [
    // new Kraken(),
    // new GDAX()
    new CEX()
  ]

  constructor () {
    this.engines.forEach((engine) => {
      this.opportunities[engine.name] = {}
      engine.on('update', () => {
        this.opportunities[engine.name] = engine.opportunities
      })
    })
  }

  run () {
    this.engines.forEach((engine) => {
      engine.start()
    })
  }
}

module.exports = Bot
