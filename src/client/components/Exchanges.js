import React, { Component } from 'react'
import { Statistic, Table } from 'semantic-ui-react'

class Exchanges extends Component {
  state = {
    exchanges: []
  }

  async componentDidMount () {
    this.setStateInterval = window.setInterval(() => this.fetchData(), 1000)
  }

  componentWillUnmount () {
    window.clearInterval(this.setStateInterval)
  }

  async fetchData () {
    const exchanges = await window.fetch('/api/exchanges').then(r => r.json())
    this.setState({ exchanges })
  }

  render () {
    const exchanges = this.state.exchanges.map(exchange => {
      if (exchange.data) {
        const { opportunities, products } = exchange.data
        const items = Object.values(products).map(p => ({
          label: p.displayName,
          value: ((p.bid.price + p.ask.price) / 2).toFixed(precision(p.displayName))
        }))

        return <div key={exchange.id}>
          <Table>
            <Table.Header>
              <Table.Row>
                <Table.HeaderCell colSpan={2}>
                  { exchange.name }
                </Table.HeaderCell>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              { Object.keys(opportunities).map(o => (
                <Table.Row key={o}>
                  <Table.Cell>{o.replace(/-/g, '▸')}</Table.Cell>
                  <Table.Cell textAlign='right'>{((opportunities[o].arbitrage - 1) * 100).toFixed(2)}%</Table.Cell>
                </Table.Row>
            )) }
            </Table.Body>
          </Table>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <Statistic.Group items={items} size='mini' />
          </div>
        </div>
      } else {
        return null
      }
    })

    return <div className='Opportunities'>
      {exchanges}
    </div>
  }
}

const precision = (product) => {
  return ['USD', 'EUR'].includes(product.split('-')[1]) ? 2 : 4
}

export default Exchanges

// return <div key={exchange.id}>
//   <h2>{exchange.name}</h2>
//   {Object.keys(products).map(p => {
//     const product = products[p]
//       return <div className='product'>
//         <strong>{p}</strong>
//         <span>{((product.bid.price + product.ask.price) / 2).toFixed(2)}</span>
//       </div>
//   })}
// </div>
