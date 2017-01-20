/**
 * Created by Zipeng Liu on 2016-11-11.
 */

import React from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {Glyphicon} from 'react-bootstrap';
import cn from 'classnames';
import './TreeList.css';

let TreeList = (props) => (
    <div className="view" id="tree-list">
        <div className="view-header">
            <div className="view-title">Tree List</div>
        </div>
        <div className="view-body">
                {props.trees.map((t, i) =>
                    <div className="list-item" key={t.tid}>
                        {i === 0 && <Glyphicon glyph="tree-conifer" />}
                        <span className={cn('tree-name', {'current-set': t.isCurrentSet,
                            'selected': props.highlighted.length? props.highlighted.indexOf(t.tid) !== -1:
                                props.selected.indexOf(t.tid) !== -1})}>{t.name}</span>
                    </div>)}
        </div>
        <div className="view-footer legends">
            <Glyphicon glyph="tree-conifer" />
            <span>ref. tree</span>
            <span className="tree-name current-set" style={{marginLeft: '10px', marginRight: '10px'}}>in current set</span>
            <span className="tree-name selected">selected</span>
        </div>
    </div>
);

// let getDotColors = createSelector(
//     [state => state.sets],
//     (sets) => {
//         let colors = {};
//         for (let i = 0; i < sets.length; i++) {
//             let s = sets[i];
//             for (let j = 0; j < s.tids.length; j++) {
//                 if (!(s.tids[j] in colors)) {
//                     colors[s.tids[j]] = [];
//                 }
//                 colors[s.tids[j]].push(sets[i].color);
//             }
//         }
//         return colors;
//     }
// );

let getTrees = createSelector(
    [state => state.inputGroupData.trees, state => state.referenceTree.id,
    state => state.sets[state.aggregatedDendrogram.activeSetIndex]],
    (trees, ref, set) => {
        let res = [{tid: ref, name: trees[ref].name, isCurrentSet: set.tids.indexOf(ref) !== -1}];
        for (let i = 0; i < set.tids.length; i++)
            if (set.tids[i] !== ref) {
                res.push({tid: set.tids[i], name: trees[set.tids[i]].name, isCurrentSet: true});
            }
        for (let tid in trees)
            if (trees.hasOwnProperty(tid) && tid !== ref && set.tids.indexOf(tid) === -1) {
                res.push({tid, name: trees[tid].name, isCurrentSet: false})
            }
        return res;
    }
);

let mapStateToProps = state => ({
    trees: getTrees(state),
    selected: state.overview.selectedDots,
    highlighted: state.overview.highlightDots
});

export default connect(mapStateToProps)(TreeList);