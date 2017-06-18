import GDAX from './engines/gdax'
import CEX from './engines/cex'
// import Kraken from './engines/kraken'

class Bot {
  opportunities = {}
  engines = [
    new GDAX(),
    new CEX()
    // new Kraken(),
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
