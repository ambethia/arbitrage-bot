const arbitrage = (products, opportunityList, fee) => {
  const opportunities = {}
  for (let key of opportunityList) {
    const trades = []
    const rates = []
    const seq = key.split('-')
    for (let i = 0; i < 3; i++) {
      const c1 = seq[i]
      const c2 = seq[i + 1]
      if (products.hasOwnProperty(`${c2}-${c1}`)) {
        const product = products[`${c2}-${c1}`]
        const price = product.ask.price
        const message = `buy ${c2} with ${c1} at ${price}`
        if (price > 0) {
          rates.push(1 / price)
          trades.push(message)
        }
      } else if (products.hasOwnProperty(`${c1}-${c2}`)) {
        const product = products[`${c1}-${c2}`]
        const price = product.bid.price
        const message = `sell ${c1} for ${c2} at ${price}`
        if (price > 0) {
          rates.push(price)
          trades.push(message)
        }
      }
    }
    if (rates.length === 3) {
      const arb = rates.reduce((p, n) => p * n * (1 - fee / 100))
      opportunities[key] = arb
      if (arb > 1) {
        console.log(rates.join(' * ') + ' = ' + arb)
        console.log(trades.join(', then '))
      }
    }
  }
  return opportunities
}

export default arbitrage
