require('babel-register')
require('babel-polyfill')

const Bot = require('./index')
const bot = new Bot()
bot.run()
