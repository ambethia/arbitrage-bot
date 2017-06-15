import React, { Component } from 'react'
import Product from './Product'

class App extends Component {
  state = {
    snapshot: {}
  }

  async componentDidMount () {
    this.setStateInterval = window.setInterval(() => this.fetchData(), 1000)
  }

  componentWillUnmount () {
    window.clearInterval(this.setStateInterval)
  }

  async fetchData () {
    const snapshot = await window.fetch('/snapshot').then(r => r.json())
    this.setState({ snapshot })
  }

  render () {
    const products = Object.keys(this.state.snapshot)
    return <div>
      {products.map(product => (
        <Product name={product} snapshot={this.state.snapshot[product]} key={product} />
      ))}
    </div>
  }
}

export default App
