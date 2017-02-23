import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Navbar, Nav, NavItem} from 'react-bootstrap';
import './App.css';

function Navigation({title}) {
    return (
        <Navbar inverse>
            <Navbar.Header>
                <Navbar.Brand>
                    <a href="/">VisPhy</a>
                </Navbar.Brand>
            </Navbar.Header>
            <Nav>
                <NavItem eventKey={1} href="/dataset-list">Dataset List</NavItem>
                <NavItem eventKey={2} href="/user-manual">User Manual</NavItem>
                <NavItem eventKey={3} href="/about">About</NavItem>
            </Nav>
            <Nav pullRight>
                {title && <NavItem eventKey={1}>Dataset: {title}</NavItem>}
            </Nav>
        </Navbar>
    )
}
let mapStateToProps = state => ({
    title: state.inputGroupData? state.inputGroupData.title : null
});
let ConnectedNavbar = connect(mapStateToProps)(Navigation);

class App extends Component {
    render() {
        return (
            <div className="App">
                <ConnectedNavbar />
                {this.props.children}
            </div>
        );
    }
}


export default App;
