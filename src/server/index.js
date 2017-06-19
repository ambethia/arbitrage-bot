import Bot from '../bot'

const server = (app) => {
  app.get('/opportunities', (req, res) => {
    res.json(bot.opportunities)
  })
}

const bot = new Bot()
bot.run()

export default server
