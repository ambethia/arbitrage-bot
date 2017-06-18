import _ from 'lodash'
// import hash from './hash'
import rotateToFiat from './rotateToFiat'

const arbitrage = (products) => {
  const graph = { ROOT: {} }
  const rates = {}
  const updateGraph = (c1, c2, rate, fee) => {
    rate *= 1 - fee / 100
    if (!graph[c1]) graph[c1] = {}
    graph[c1][c2] = -1 * Math.log(rate)
    if (!rates[c1]) rates[c1] = {}
    rates[c1][c2] = rate
  }

  products.forEach((product) => {
    const { base, quote, fee, bid, ask } = product
    updateGraph(base, quote, 1 / ask.price, fee)
    updateGraph(quote, base, bid.price, fee)
  })

  const dist = {}
  const pred = {}
  Object.keys(graph).forEach(v => {
    graph.ROOT[v] = 0
    dist[v] = Number.MAX_VALUE
  })
  dist.ROOT = 0

  const n = Object.keys(graph).length
  // Relax every edge n - 1 times
  _.times(n - 1, () => {
    _.each(graph, (e, v1) => {
      _.each(e, (w, v2) => {
        if (dist[v2] > dist[v1] + w) {
          dist[v2] = dist[v1] + w
          pred[v2] = v1
        }
      })
    })
  })

  // Relax every edge again to find negative-weight cycles
  let arbitrage = false
  const cyclic = {}
  _.each(graph, (e, v1) => {
    _.each(e, (w, v2) => {
      if (dist[v2] > dist[v1] + w) {
        arbitrage = true
        dist[v2] = dist[v1] + w
        cyclic[v2] = true
      }
    })
  })

  if (!arbitrage) { return [] }

  // Calculate the arbitrage sequences
  let sequences = {}
  Object.keys(cyclic).forEach((v) => {
    // visit predecessors to trace vertices in cycle
    const visited = { [v]: true }
    let seq = []
    let p = v
    do {
      seq.push(p)
      visited[p] = true
      p = pred[p]
    } while (p && !visited[p])
    seq.reverse()
    seq = rotateToFiat(seq)
    seq.push(seq[0])
    let msg = ''
    // Calculate the arbitrage amount
    const val = Array.apply(null, Array(seq.length - 1)).reduce((v, _, i) => {
      const rate = rates[seq[i]][seq[i + 1]]
      return rate ? v * rate : 0
    }, 1)
    if (seq.length === 4 && val > 1) {
      sequences[seq.join('-')] = val
      console.log(msg)
    }
  })
  return sequences
}

export default arbitrage
