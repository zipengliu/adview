/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';

class GroupList extends Component {
    constructor(props) {
        super(props);
        this.state = {
            groups: [{inputGroupId: 1, title: '69 Species Trees'}]
        }
    }
    ComponentDidMount() {
        // Get a list of the input groups
    }

    render() {
        return (
            <div><h1>This is the grouplist page</h1>

            </div>
        )
    }
}

export default GroupList;
