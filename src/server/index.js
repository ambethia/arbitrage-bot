import Bot from '../bot'

const bot = new Bot()
bot.run()

const server = (app) => {
  app.get('/arbs', (req, res) => {
    res.json([])
  })

  app.get('/products', (req, res) => {
    res.json(bot.uniqueProducts)
  })

  app.get('/snapshot', (req, res) => {
    res.json(bot.snapshot)
  })
}

export default server
