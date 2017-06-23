import React, { Component } from 'react'
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom'
import Layout from './Layout'
import Exchanges from './Exchanges'
import History from './History'

class App extends Component {
  render () {
    return <Router>
      <Layout>
        <Switch>
          <Route path='/history' component={History} />
          <Route path='/' exact component={Exchanges} />
        </Switch>
      </Layout>
    </Router>
  }
}

export default App
