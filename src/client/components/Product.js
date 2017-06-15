import React, { Component } from 'react'
import { VictoryChart, VictoryLine } from 'victory'

class Product extends Component {
  state = {
    lines: {
      'kraken:bid': [],
      'kraken:ask': [],
      'gdax:bid': [],
      'gdax:ask': []
    }
  }

  componentWillReceiveProps (nextProps) {
    const time = new Date()
    if (parseFloat(nextProps.snapshot.find(s => s.exchange === 'Kraken').bid.price) > 0) {
      this.setState({
        lines: {
          'kraken:bid': [...this.state.lines['kraken:bid'].slice(0, 120), { y: parseFloat(nextProps.snapshot.find(s => s.exchange === 'Kraken').bid.price), x: time }],
          'kraken:ask': [...this.state.lines['kraken:ask'].slice(0, 120), { y: parseFloat(nextProps.snapshot.find(s => s.exchange === 'Kraken').ask.price), x: time }],
          'gdax:bid': [...this.state.lines['gdax:bid'].slice(0, 120), { y: parseFloat(nextProps.snapshot.find(s => s.exchange === 'GDAX').bid.price), x: time }],
          'gdax:ask': [...this.state.lines['gdax:ask'].slice(0, 120), { y: parseFloat(nextProps.snapshot.find(s => s.exchange === 'GDAX').ask.price), x: time }]
        }
      })
    }
  }

  render () {
    return <div className='Product'>
      <h2>{this.props.name}</h2>
      <table>
        <tbody>
          {this.props.snapshot.map(snapshot => {
            return <tr key={snapshot.exchange}>
              <th>{snapshot.exchange}</th>
              <td>{snapshot.bid.price}</td>
              <td>{snapshot.ask.price}</td>
            </tr>
          })}
        </tbody>
      </table>
      <VictoryChart
        height={140}
        scale={{x: 'time', y: 'linear'}}
        animate={{duration: 1000, onLoad: { duration: 0 }}}
        domainPadding={20}
        easing='linear'
      >
        {Object.keys(this.state.lines).map((name) => {
          const line = this.state.lines[name]
          return <VictoryLine interpolation='natural' data={line} key={name} />
        })}
      </VictoryChart>
    </div>
  }
}

export default Product
