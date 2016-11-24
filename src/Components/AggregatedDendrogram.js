/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import './Dendrogram.css';

class AggregatedDendrogram extends Component {
    render() {
        let size = 150;
        return (
            <div className="agg-dendro-box">
                <div>
                    <svg width={size} height={size}>

                    </svg>
                </div>
            </div>
        )
    }
}

export default AggregatedDendrogram;