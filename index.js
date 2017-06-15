require('babel-register')
require('babel-polyfill')

const express = require('express')
const path = require('path')
const server = require('./src/server').default

const app = express()

server(app)

if (app.get('env') === 'development') {
  const webpack = require('webpack')
  const webpackConfig = require('./webpack.config')
  const compiler = webpack(webpackConfig)
  app.use(require('webpack-dev-middleware')(compiler, {
    hot: true,
    stats: {
      colors: true,
      chunks: false
    }
  }))
  app.use(require('webpack-hot-middleware')(compiler, {
    noInfo: true,
    publicPath: '/'
  }))
  app.use('*', function (req, res, next) {
    const filename = path.join(compiler.outputPath, 'index.html')
    compiler.outputFileSystem.readFile(filename, (error, result) => {
      if (error) return next(error)
      res.set('content-type', 'text/html')
      res.send(result)
      res.end()
    })
  })
} else {
  app.use(express.static('public'))
  app.get('*', (request, response) => {
    response.sendFile(path.resolve(__dirname, '../public/index.html'))
  })
}

app.listen(process.env.PORT || 3000)
