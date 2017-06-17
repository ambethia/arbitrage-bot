import React, { Component } from 'react'
import moment from 'moment'

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
              <th>Profit</th>
              <th>Created</th>
              <th>Duration</th>
            </tr>
            {Object.values(opportunities).sort((a, b) => new Date(b.open) - new Date(a.open)).map(o => (
              <tr key={o.md5} style={{ backgroundColor: moment(o.seen).isSameOrAfter(moment().subtract(2, 'seconds')) ? '#d7f6d5' : 'inherit' }}>
                <td>{o.seq.join('▸')}</td>
                <td>{((o.val - 1) * 100).toFixed(2)}%</td>
                <td>{moment(o.open).fromNow()}</td>
                <td>{moment(o.seen).to(o.open, true)}</td>
              </tr>
              ))}
          </tbody>
        })}
      </table>
    </div>
  }
}

export default App
