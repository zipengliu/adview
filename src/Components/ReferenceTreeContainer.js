/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, { Component } from 'react';
import Dimensions from 'react-dimensions';
import FullDendrogram from './FullDendrogram';

class ReferenceTreeContainer extends Component {
    render() {
        return <FullDendrogram width={this.props.containerWidth} height={this.props.containerHeight} />
    }
}

export default Dimensions()(ReferenceTreeContainer);