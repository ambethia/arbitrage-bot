const FIAT = ['USD', 'EUR']

const seqs = [
  ['BTC', 'ETH', 'USD'],
  ['ETH', 'USD', 'BTC'],
  ['EUR', 'ETH', 'BTC'],
  ['ETH', 'BTC', 'EUR']
]

const rotateSeq = (seq) => {
  if (seq.some(s => FIAT.includes(s))) {
    while (!FIAT.includes(seq[0])) {
      seq.push(seq.shift())
    }
  }
  return seq
}

seqs.forEach((seq) => {
  console.log(rotateSeq(seq))
})
