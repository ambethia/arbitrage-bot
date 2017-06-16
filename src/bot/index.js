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
      const { base, quote, fee, ask } = product
      this.updateGraph(base, quote, ask.price, fee)
      this.updateGraph(quote, base, num(1).div(ask.price), fee)
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
    Object.keys(this.graph).forEach(v => { dist[v] = num(Number.MAX_VALUE) })
    dist.ROOT = num(0)

    const n = Object.keys(this.graph).length
    // Relax every edge n - 1 times
    _.times(n - 1, () => {
      _.each(this.graph, (e, v1) => {
        _.each(e, (w, v2) => {
          if (dist[v2].gt(dist[v1].add(w))) {
            dist[v2] = dist[v1].add(w)
            pred[v2] = v1
          }
        })
      })
    })

    // Relax every edge again to find negative-weight cycles
    let arbitrage = false
    const cyclic = {}
    _.each(this.graph, (e, v1) => {
      _.each(e, (w, v2) => {
        if (dist[v2].gt(dist[v1].add(w))) {
          arbitrage = true
          dist[v2] = dist[v1].add(w)
          cyclic[v2] = true
        }
      })
    })

    if (!arbitrage) {
      console.log('No arbitrage found')
      return
    }

    // Calculate the arbitrage sequences
    const sequences = []
    Object.keys(cyclic).forEach((v) => {
      // Recursively visit predecessors to trace vertices in cycle
      const visited = { [v]: true }
      const seq = []
      let p = v
      do {
        seq.push(p)
        visited[p] = true
        p = pred[p]
      } while (p && !visited[p])
      seq.reverse().push(seq[0])
      // Calculate the arbitrage amount
      const val = _.range(0, seq.length - 2).reduce((v, i) => {
        console.log(this.rates[seq[i]][seq[i + 1]].toString())
        return v.mul(this.rates[seq[i]][seq[i + 1]])
      }, num(1.0))
      sequences.push({ currencies: seq, value: val.toString() })

      console.log(sequences)
    })
  }

  run () {
    this.engine.start()
  }
}

module.exports = Bot
