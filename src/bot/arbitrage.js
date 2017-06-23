const EXPOSURE = 100 // Max USD (or EUR) to trade
const MAX_DEPTH = 0.25 // How far into the current depth (within the LIQUIDITY_DELTA) we're willing to go.

const arbitrage = (products, opportunityList) => {
  const opportunities = {}
  for (let key of opportunityList) {
    const trades = []
    const seq = key.split('-')
    for (let i = 0; i < 3; i++) {
      const c1 = seq[i]
      const c2 = seq[i + 1]
      if (products.hasOwnProperty(`${c2}-${c1}`)) {
        const productId = `${c2}-${c1}`
        const product = products[productId]
        const { price, depth } = product.ask
        const fiatRate = products[`${c2}-${seq[0]}`].ask.price
        if (price > 0) {
          trades.push({
            c1,
            c2,
            productId,
            action: 'buy',
            depth,
            rate: 1 / price,
            fiatRate,
            fiatDepth: depth * fiatRate,
            fee: product.fee
          })
        }
      } else if (products.hasOwnProperty(`${c1}-${c2}`)) {
        const productId = `${c1}-${c2}`
        const product = products[productId]
        const { price, depth } = product.bid
        const fiatRate = products[`${c1}-${seq[0]}`].bid.price
        if (price > 0) {
          trades.push({
            c1,
            c2,
            productId,
            action: 'sell',
            depth,
            rate: price,
            fiatRate,
            fiatDepth: depth * fiatRate,
            fee: product.fee
          })
        }
      }
    }
    if (trades.length === 3) {
      const arbitrage = trades.reduce((a, t) => a * t.rate * (1 - t.fee), 1)
      const maximum = Math.min(...trades.map(t => t.fiatDepth * MAX_DEPTH))
      const amount = Math.min(maximum, EXPOSURE)
      const potential = (amount * arbitrage - amount).toFixed(2)
      // Figure out amount for market order on each trade
      for (let i = 0; i < trades.length; i++) {
        const trade = trades[i]
        trade.amount = i === 0 ? amount : trades[i - 1].expect
        trade.expect = trade.amount * trade.rate * (1 - trade.fee)
        if (trade.action === 'buy') {
          trade.size = trade.expect
          trade.message = `buy ${trade.expect} ${trade.c2} with ${trade.amount} ${trade.c1} at ${1 / trade.rate}`
        } else {
          trade.size = trade.amount
          trade.message = `sell ${trade.amount} ${trade.c1} for ${trade.expect} ${trade.c2} at ${trade.rate}`
        }
      }
      opportunities[key] = {
        maximum,
        potential,
        arbitrage,
        amount,
        trades
      }
    }
  }
  return opportunities
}

module.exports = arbitrage
