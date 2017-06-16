// import GDAX from './engines/gdax'
import Kraken from './engines/kraken'
import num from 'num'
import _ from 'lodash'

class Bot {
  engine = new Kraken()
  graph = { ROOT: {} }
  rates = {}

  constructor () {
    this.engine.on('update', (product) => {
      const { base, quote, fee, bid, ask } = product
      this.updateGraph(base, quote, bid.price, fee)
      this.updateGraph(quote, base, ask.price, fee)
      this.findArbitrage()
    })
  }

  updateGraph (c1, c2, rate, fee) {
    const r = rate.mul(num(1.0).sub(fee.div(100)))
    if (!this.graph[c1]) this.graph[c1] = {}
    this.graph[c1][c2] = num(Math.log10(r)).neg()
    this.graph.ROOT[c1] = num(0)
    if (!this.rates[c1]) this.rates[c1] = {}
    this.rates[c1][c2] = r
  }

  findArbitrage () {
    const dist = {}
    const pred = {}
    Object.keys(this.graph).forEach(v => { dist[v] = Number.MAX_VALUE })
    dist.ROOT = 0

    const n = Object.keys(this.graph).length
    // Relax every edge n - 1 times
    _.times(n - 1, () => {
      _.each(this.graph, (v1, e) => {
        _.each(e, (v2, w) => {
          if (dist[v2] > dist[v1] + w) {
            dist[v2] = dist[v1] + w
            pred[v2] = v1
          }
        })
      })
    })

    console.log(this.graph)

    // Relax every edge again to find negative-weight cycles
    // let arbitrage = false
    // const cyclic = {}
    // arbitrage = false
    // cyclic = {}
    // graph.each do |v_1, e|
    //   e.each do |v_2, w|
    //     if dist[v_2] > dist[v_1] + w
    //       arbitrage = true
    //       dist[v_2] = dist[v_1] + w
    //
    //       # Keep track of vertices in negative-weight cycles
    //       cyclic[v_2] = true
    //     end
    //   end
    // end
    //
    // if !arbitrage
    //   puts "No arbitrage found."
    //   exit
    // end
  }

  run () {
    this.engine.start()
  }
}

module.exports = Bot
