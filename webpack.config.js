const path = require('path')
const HtmlWebpackPlugin = require('html-webpack-plugin')

const ROOT_PATH = path.resolve(__dirname)
const SRC_PATH = path.resolve(ROOT_PATH, 'src/client')
const BUILD_PATH = path.resolve(ROOT_PATH, 'public')

module.exports = {
  entry: [
    'babel-polyfill',
    SRC_PATH
  ],
  output: {
    path: BUILD_PATH,
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(SRC_PATH, 'index.html'),
      inject: 'body',
      filename: 'index.html'
    })
  ]
}
