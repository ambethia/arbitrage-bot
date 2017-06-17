import Bot from '../bot'

const bot = new Bot()
bot.run()

const server = (app) => {
  app.get('/opportunities', (req, res) => {
    res.json(bot.opportunities)
  })
}

export default server
