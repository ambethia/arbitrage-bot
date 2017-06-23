import React, { Component } from 'react'
import { Menu, Container } from 'semantic-ui-react'
import { NavLink } from 'react-router-dom'

class Layout extends Component {
  render () {
    return <div className='Layout'>
      <Menu fixed='top' inverted>
        <Container>
          <Menu.Item header>
            Arc
          </Menu.Item>
          <Menu.Item as={NavLink} exact to='/'>
            Exchanges
          </Menu.Item>
          <Menu.Item as={NavLink} to='/history'>
            History
          </Menu.Item>
        </Container>
      </Menu>
      <Container className='main'>
        {this.props.children}
      </Container>
    </div>
  }
}

export default Layout
