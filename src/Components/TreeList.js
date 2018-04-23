/**
 * Created by Zipeng Liu on 2016-11-11.
 */

import React from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {Glyphicon, Badge, Clearfix} from 'react-bootstrap';
import cn from 'classnames';
import {toggleTreeListCollapse, toggleSelectTrees} from '../actions';
import './TreeList.css';

let TreeList = (props) => (
    <div className={cn("view panel panel-default", {'panel-collapsed': props.collapsed})} id="tree-list">
        <div className="view-header panel-heading">
            <div className="view-title">Tree List
                <Badge style={{marginLeft: '5px'}}>{props.trees.length}</Badge>
                <span style={{marginLeft: '10px', cursor: 'pointer', float: 'right'}} onClick={props.onToggleCollapsed}>
                <Glyphicon glyph={props.collapsed? 'th-list': 'minus'}/>
                </span>
            </div>
            <Clearfix/>
        </div>
        <div className="view-body panel-body">
                {props.trees.map((t) =>
                    <div className="list-item" key={t.tid}>
                        <input type="checkbox" checked={props.selectedTrees.hasOwnProperty(t.tid)}
                               onChange={props.onSelectTree.bind(null, t.tid, props.selectedTrees.hasOwnProperty(t.tid))} />
                        <span className={cn('tree-name', {hovered: props.hoveredTrees.hasOwnProperty(t.tid)})}>
                            {t.name}
                        </span>
                        {props.selectedTrees.hasOwnProperty(t.tid) &&
                        <div className="selected-tree-indicator-box" style={{background: props.selectedTreeColor}} />
                        }
                    </div>)}
        </div>
        {/*<div className="view-footer legends panel-footer">*/}
            {/*<Glyphicon glyph="tree-conifer" />*/}
            {/*<span>ref. tree</span>*/}
            {/*<span className="tree-name current-set" style={{marginLeft: '10px', marginRight: '10px'}}>in current set</span>*/}
            {/*<span className="tree-name selected">selected</span>*/}
        {/*</div>*/}
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
    [state => state.inputGroupData.trees],
    (trees) => Object.keys(trees)
        .sort((a, b) => {
            if (trees[a].name < trees[b].name) return -1;
            if (trees[a].name > trees[b].name) return 1;
            return 0;
        })
        .map(tid => ({tid, name: trees[tid].name}))
);

let mapStateToProps = state => ({
    trees: getTrees(state),
    selectedTrees: state.selectedTrees,
    hoveredTrees: state.hoveredTrees,
    selectedTreeColor: state.selectedTreeColor,
    ...state.treeList
});

let mapDispatchToProps = dispatch => ({
    onToggleCollapsed: () => {dispatch(toggleTreeListCollapse())},
    onSelectTree: (tid, isRemove) => {dispatch(toggleSelectTrees([tid], !isRemove, isRemove))}
});

export default connect(mapStateToProps, mapDispatchToProps)(TreeList);