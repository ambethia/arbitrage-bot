import GDAX from './engines/gdax'
import Kraken from './engines/kraken'
import _ from 'lodash'

class Bot {
  engines = [
    new GDAX(),
    new Kraken()
  ]

  get uniqueProducts () {
    return _.uniq(
      _.flatMap(
        this.engines, e => e.products.map(p => p.displayName)
      ).sort()
    )
  }

  get snapshot () {
    return _.pickBy(_.groupBy(
      _.flatMap(this.engines, e => e.products),
      p => p.displayName
    ), p => p.length > 1)
  }

  constructor () {
    this.engines.forEach((engine) => {
      engine.on('update', (product) => {
        // const id = `${product.base}-${product.quote}`
        // const price = product.bid.price.add(product.ask.price).div(2).toString()
        // console.log('Update', engine.name, id, price)
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
