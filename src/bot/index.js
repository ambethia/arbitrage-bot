import GDAX from './engines/gdax'
import Kraken from './engines/kraken'

class Bot {
  opportunities = {}
  engines = [
    new Kraken(),
    new GDAX()
  ]

  constructor () {
    this.engines.forEach((engine) => {
      this.opportunities[engine.name] = {}
      engine.on('update', () => {
        engine.opportunities.forEach(({ seq, val, md5 }) => {
          const opportunities = this.opportunities[engine.name]
          if (opportunities[md5]) {
            opportunities[md5].seen = new Date()
            opportunities[md5].val = val
          } else {
            const open = new Date()
            opportunities[md5] = { md5, seq, val, open, seen: open }
          }
        })
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
