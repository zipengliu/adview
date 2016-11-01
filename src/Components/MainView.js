/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';

class MainView extends Component {
    render() {
        return (
            <div><h1>This is the main view {this.props.params.inputGroupId} page</h1></div>
        )
    }
}

export default MainView;
