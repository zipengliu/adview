import React, { Component } from 'react';
import {Navbar, Nav, NavItem} from 'react-bootstrap';
import './App.css';

class App extends Component {
    render() {
        return (
            <div className="App">
                <Navbar inverse>
                    <Navbar.Header>
                        <Navbar.Brand>
                            <a href="/">VisPhy</a>
                        </Navbar.Brand>
                    </Navbar.Header>
                    <Nav>
                        <NavItem eventKey={1} href="/group_list">Input List</NavItem>
                        <NavItem eventKey={2} href="/">About</NavItem>
                    </Nav>
                </Navbar>

                {this.props.children}
            </div>
        );
    }
}

export default App;
