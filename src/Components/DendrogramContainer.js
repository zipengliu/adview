/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import AggregatedDendrogram from './AggregatedDendrogram';
import './Dendrogram.css';


class DendrogramContainer extends Component {
    render() {
        return (
            <div style={{overflow: "scroll", height: '100%'}}>
                <div className="dendrogram-container">
                    {this.props.trees.map(t => <AggregatedDendrogram data={t} key={t._id} />)}
                </div>
            </div>
        )
    }
}

let getTrees = createSelector(
    [state => state.inputGroupData.trees, state => state.referenceTree.id, state => state.referenceTree.selected],
    (trees, rid, selected) => {
        let res = [];
        let ref = trees[rid];
        for (let tid in trees) {
            res.push({
                ...trees[tid],
                expand: selected.map(b => ref.branches[b]['corresponding_branches'][tid]['corr_branch_id'])
            })
        }
        return res;
    }
);

let mapStateToProps = (state) => ({
    trees: getTrees(state)
});

export default connect(mapStateToProps)(DendrogramContainer);