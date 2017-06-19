const EXPOSURE = 1000 // Max USD to trade
const MAX_DEPTH = 0.5 // How far into the current depth (within the LIQUIDITY_DELTA) we're willing to go.

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
          trades.push({
            message,
            depth: product.ask.depth,
            depthUSD: product.ask.depth * products[`${c2}-USD`].ask.price
          })
        }
      } else if (products.hasOwnProperty(`${c1}-${c2}`)) {
        const product = products[`${c1}-${c2}`]
        const price = product.bid.price
        const message = `sell ${c1} for ${c2} at ${price}`
        if (price > 0) {
          rates.push(price)
          trades.push({
            message,
            depth: product.bid.depth,
            depthUSD: product.bid.depth * products[`${c1}-USD`].bid.price
          })
        }
      }
    }
    if (rates.length === 3) {
      const arbitrage = rates.reduce((p, n) => p * n * (1 - fee / 100))
      const amount = Math.min(Math.min(...trades.map(t => t.depthUSD * MAX_DEPTH)), EXPOSURE)
      const potential = (amount * arbitrage - amount).toFixed(2)
      opportunities[key] = {
        potential,
        arbitrage,
        amount,
        trades
      }
      if (arbitrage > 1) {
        // TODO Execute trades
      }
    }
  }
  return opportunities
}

export default arbitrage
