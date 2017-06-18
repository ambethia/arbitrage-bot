const FIAT = ['USD', 'EUR']

export default (seq) => {
  if (seq.some(s => FIAT.includes(s))) {
    while (!FIAT.includes(seq[0])) {
      seq.push(seq.shift())
    }
  }
  return seq
}
