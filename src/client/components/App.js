import React, { Component } from 'react'

class App extends Component {
  state = {
    opportunities: []
  }

  async componentDidMount () {
    this.setStateInterval = window.setInterval(() => this.fetchData(), 1000)
  }

  componentWillUnmount () {
    window.clearInterval(this.setStateInterval)
  }

  async fetchData () {
    const opportunities = await window.fetch('/opportunities').then(r => r.json())
    this.setState({ opportunities })
  }

  render () {
    return <div className='container'>
      <h1>Arbitrage</h1>
      <table>
        {Object.keys(this.state.opportunities).map(exchange => {
          const opportunities = this.state.opportunities[exchange]
          return <tbody key={exchange}>
            <tr>
              <th>{exchange}</th>
              <th />
              <th>Profit</th>
            </tr>
            {Object.keys(opportunities).map(o => (
              <tr key={o}>
                <td>{o.replace(/-/g, '▸')}</td>
                <td>
                  <pre><code>{JSON.stringify(opportunities[o], null, '\t')}</code></pre>
                </td>
                <td>{((opportunities[o].arbitrage - 1) * 100).toFixed(2)}%</td>
              </tr>
              ))}
          </tbody>
        })}
      </table>
    </div>
  }
}

export default App
