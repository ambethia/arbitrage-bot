const PP = 10

const server = (app) => {
  app.get('/api/exchanges', async (req, res) => {
    const data = await req.app.get('db').exchanges.find()
    res.json(data)
  })

  app.get('/api/opportunities', async (req, res) => {
    const data = await req.app.get('db').opportunities.find({}, {
      order: 'updated desc',
      limit: PP,
      offset: ((req.query.p || 1) - 1) * PP
    })
    res.json(data)
  })

  app.get('/api/opportunities/:id/trades', async (req, res) => {
    const data = await req.app.get('db').trades.find({ opportunity_id: req.params.id })
    res.json(data)
  })
}

module.exports = server
