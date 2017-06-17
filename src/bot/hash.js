import crypto from 'crypto'

export default (input) => crypto.createHash('md5').update(input).digest('hex')
