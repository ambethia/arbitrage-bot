// const CEX = [
//   ['BTC', 'USD'],
//   ['BTC', 'EUR'],
//   ['ETH', 'BTC'],
//   ['ETH', 'USD'],
//   ['ETH', 'EUR']
// ]

const GDAX = [
  ['BTC', 'USD'],
  // ['BTC', 'EUR'],
  ['ETH', 'USD'],
  ['ETH', 'BTC'],
  // ['ETH', 'EUR'],
  ['LTC', 'USD'],
  ['LTC', 'BTC']
  // ['LTC', 'EUR']
]

const FIAT = ['USD', 'EUR']

const rotate = (seq) => {
  if (seq.some(s => FIAT.includes(s))) {
    while (!FIAT.includes(seq[0])) {
      seq.push(seq.shift())
    }
  }
  return seq
}

const graph = {}

const pairs = GDAX
// const pairs = CEX

pairs.forEach(pair => {
  const [base, quote] = pair
  if (!graph[base]) graph[base] = []
  graph[base].push(quote)
  if (!graph[quote]) graph[quote] = []
  graph[quote].push(base)
})

const triangles = new Set()

for (let a in graph) {
  for (let b of graph[a]) {
    for (let c of graph[b]) {
      if (a !== b && b !== c && c !== a) {
        const seq = rotate([a, b, c])
        seq.push(seq[0])
        let valid = true
        for (let i = 0; i < seq.length - 1; i++) {
          if (!graph[seq[i]].includes(seq[i + 1])) valid = false
        }
        if (valid) triangles.add(seq.join('-'))
      }
    }
  }
}

for (let triangle of Array.from(triangles).sort()) {
  console.log(triangle)
}
