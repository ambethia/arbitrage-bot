import React, { Component } from 'react'
import { Menu, Segment, Item } from 'semantic-ui-react'

class History extends Component {
  state = {
    page: 1,
    opportunities: []
  }

  async fetchData () {
    const opportunities = await window.fetch('/api/opportunities?p=' + this.state.page).then(r => r.json())
    this.setState({ opportunities })
  }

  componentDidMount () {
    this.fetchData()
  }

  componentDidUpdate (prevProps, prevState) {
    if (prevState.page !== this.state.page) this.fetchData()
  }

  _prevPage = () => {
    this.setState({ page: Math.max(this.state.page - 1, 1) })
  }

  _nextPage = () => {
    this.setState({ page: this.state.page + 1 })
  }

  render () {
    return <div className='History'>
      <div>
        {this.state.opportunities.map((o) => <Opportunity {...o} key={o.id} />)}
      </div>
      <Menu floated='right' pagination>
        <Menu.Item icon='left chevron' disabled={this.state.page === 1} onClick={this._prevPage} />
        <Menu.Item icon='right chevron' onClick={this._nextPage} />
      </Menu>
    </div>
  }
}

class Opportunity extends Component {
  state = {
    trades: [],
    actual: 0.0
  }

  componentDidMount () {
    const { amount } = this.props
    window.fetch(`/api/opportunities/${this.props.id}/trades`)
      .then(r => r.json())
      .then(trades => {
        const arbitrage = trades
          .filter(t => t.result)
          .reduce((a, t) => a * (t.result.side === 'buy' ? (t.result.executed_value / t.result.filled_size) : (t.result.filled_size / t.result.executed_value)), 1)
        this.setState({
          trades,
          actual: (amount * arbitrage - amount).toFixed(2)
        })
      })
  }

  render () {
    const { sequence, arbitrage, potential, updated } = this.props
    return <Segment.Group>
      <Segment.Group horizontal>
        <Segment>
          <strong>{sequence}</strong>
        </Segment>
        <Segment>
          {arbitrage}
        </Segment>
        <Segment>
          ${potential}
        </Segment>
        <Segment>
          {updated}
        </Segment>
        <Segment>
          ${this.state.actual}
        </Segment>
      </Segment.Group>
      <Segment.Group horizontal>
        {this.state.trades.map((trade) => {
          if (trade.result) {
            return <Segment key={trade.id}>
              <Item.Group>
                <Item>
                  <Item.Content>
                    <Item.Header>{trade.details.action.toUpperCase()}</Item.Header>
                    <Item.Meta>{trade.details.productId}</Item.Meta>
                    <Item.Description>
                      expect: {p(trade.expected)} <br />
                      <br />
                      value: {p(trade.received)} <br />
                    </Item.Description>
                    <Item.Description>
                      {((trade.received / trade.expected) * 100).toFixed(2)}%
                    </Item.Description>
                    <Item.Extra>{trade.details.message}</Item.Extra>
                  </Item.Content>
                </Item>
              </Item.Group>
            </Segment>
          } else {
            return null
          }
        })}
      </Segment.Group>
    </Segment.Group>
  }
}

const p = (n) => +parseFloat(n).toFixed(8)

export default History
