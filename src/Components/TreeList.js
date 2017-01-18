/**
 * Created by Zipeng Liu on 2016-11-11.
 */

import React from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import './TreeList.css';

let TreeList = (props) => (
    <div className="tree-list">
        <div className="view-title">Tree List</div>
        <div className="list">
            {Object.keys(props.trees).map(k =>
                <div className="list-item" key={k}>
                    {/*<div className="color-block" style={{background: 'grey'}}></div>*/}
                    <div className="tree-name">{props.trees[k].name}</div>
                </div>)}
        </div>
    </div>
);

let getDotColors = createSelector(
    [state => state.sets],
    (sets) => {
        let colors = {};
        for (let i = 0; i < sets.length; i++) {
            let s = sets[i];
            for (let j = 0; j < s.tids.length; j++) {
                if (!(s.tids[j] in colors)) {
                    colors[s.tids[j]] = [];
                }
                colors[s.tids[j]].push(sets[i].color);
            }
        }
        return colors;
    }
);

let mapStateToProps = state => ({
    trees: state.inputGroupData.trees,
    colors: getDotColors(state)
});

export default connect(mapStateToProps)(TreeList);