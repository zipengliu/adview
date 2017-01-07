/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component} from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {Tabs, Tab, Button, ButtonGroup, Glyphicon, OverlayTrigger, Tooltip} from 'react-bootstrap';
import cn from 'classnames';
import AggregatedDendrogram from './AggregatedDendrogram';
import {toggleHighlightTree, toggleSelectAggDendro, selectSet, changeReferenceTree, removeFromSet, removeSet,
    addTreeToInspector, toggleInspector, toggleSorting} from '../actions';
import './Dendrogram.css';


class DendrogramContainer extends Component {
    render() {
        let {spec} = this.props;
        let boxSize = spec.size + 2 * spec.margin + 4;     // Padding + border
        let getDendroBox = t => {
            return (
            <div className={cn("agg-dendro-box", {selected: this.props.activeTreeId == t._id})} key={t._id}
                 style={{width: boxSize + 'px', height: boxSize + 'px'}}
                 onMouseEnter={this.props.onEnter.bind(null, t._id)}
                 onMouseOut={this.props.onExit}
                 onClick={this.props.onClick.bind(null, this.props.activeTreeId == t._id? null: t._id)}>
                <AggregatedDendrogram key={t._id} data={t} exploreEntities={this.props.exploreEntities} spec={spec} />
            </div>
        )};
        const disabledTools = this.props.activeTreeId == null;
        return (
            <div style={{height: '100%', position: 'relative'}}>
                <div className="tools">
                    <ButtonGroup bsSize="small">
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-remove-set">Remove the current open set</Tooltip>}>
                            <Button disabled={this.props.activeSetIndex == 0}
                                onClick={this.props.onRemoveSet.bind(null, this.props.activeSetIndex)}>
                                <Glyphicon glyph="remove" />
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-pin">Blabla</Tooltip>}>
                            <Button disabled={disabledTools}>
                                <Glyphicon glyph="pushpin" />
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-trash">Remove tree from the current set</Tooltip>}>
                            <Button disabled={disabledTools} onClick={this.props.onRemove.bind(null, this.props.activeTreeId, this.props.activeSetIndex)}>
                                <Glyphicon glyph="trash" />
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-ref-tree">Set tree as reference tree on the right</Tooltip>}>
                            <Button disabled={disabledTools} onClick={this.props.onChangeReferenceTree.bind(null, this.props.activeTreeId)}>
                                <Glyphicon glyph="tree-conifer" />
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-sort-tree">{
                             `${this.props.treeOrder.static? 'Enable': 'Disable'} sorting by similarity to reference tree`}</Tooltip>}>
                            <Button active={!this.props.treeOrder.static} onClick={this.props.onChangeSorting}>
                                <Glyphicon glyph="sort-by-attributes" />
                            </Button>
                        </OverlayTrigger>
                    </ButtonGroup>

                    <ButtonGroup bsSize="small" style={{marginLeft: '10px'}}>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-popup">Inspect tree with full detail</Tooltip>}>
                            <Button onClick={this.props.onAddTreeToInspector.bind(null, this.props.activeTreeId)}>
                                <Glyphicon glyph="fullscreen" />
                            </Button>
                        </OverlayTrigger>
                    </ButtonGroup>
                </div>
                <Tabs activeKey={this.props.activeSetIndex} onSelect={this.props.onSelectSet} id="set-tab">
                    {this.props.sets.map((s, i) => <Tab eventKey={i} key={i} title={<div><div className="color-block" style={{backgroundColor: s.color}}></div>{s.title}</div>} ></Tab>)}
                </Tabs>
                <div className="dendrogram-container">
                    {this.props.trees.map(getDendroBox)}
                </div>
            </div>
        )
    }
}

let getTrees = createSelector(
    [state => state.inputGroupData.trees, state => state.sets[state.aggregatedDendrogram.activeSetIndex].tids,
        state => state.aggregatedDendrogram.treeOrder,
        state => state.referenceTree.id, state => state.referenceTree.selected],
    (trees, setTids, order, rid, selected) => {
        console.log('Getting new trees in the dendrogram container');
        let res = [];
        let ref = trees[rid];
        let sortFunc;
        if (order.static) {
            sortFunc = (t1, t2) => t1 == t2? 0: (t1 > t2? 1: -1);
        } else if (order.branchId) {
            let corr = ref.branches[order.branchId].correspondingBranches;
            sortFunc = (t1, t2) => (t2 in corr? corr[t2].jaccard: 1.1) - (t1 in corr? corr[t1].jaccard: 1.1)
        } else {
            sortFunc = (t1, t2) => (ref.rfDistance[t1] || 0) - (ref.rfDistance[t2] || 0);
        }
        let sortedTids = setTids.slice().sort(sortFunc);

        for (let i = 0; i < sortedTids.length; i++) {
            let tid = sortedTids[i];
            let expansion = {};
            for (let e in selected) {
                if (selected[e]) {
                    let corr = tid == rid? e: ref.branches[e]['correspondingBranches'][tid]['branchId'];
                    if (corr != trees[tid].rootBranch) {
                        expansion[corr] = true;
                    }
                }
            }
            res.push({
                ...trees[tid],
                expand: expansion
            })
        }
        return res;
    }
);

let mapStateToProps = (state) => ({
    ...state.aggregatedDendrogram,
    isFetching: state.referenceTree.isFetching,
    fetchError: state.referenceTree.fetchError,
    exploreEntities: state.referenceTree.exploreBranch != null?
        state.inputGroupData.trees[state.referenceTree.id].branches[state.referenceTree.exploreBranch].entities: [],
    sets: state.sets,
    trees: getTrees(state)
});

let mapDispatchToProps = (dispatch) => ({
    onEnter: tid => {dispatch(toggleHighlightTree(tid))},
    onExit: () => {dispatch(toggleHighlightTree(null))},
    onClick: tid => {dispatch(toggleSelectAggDendro(tid))},
    onSelectSet: i => {dispatch(selectSet(i))},
    onRemove: (tid, setIndex) => {dispatch(removeFromSet(tid, setIndex))},
    onChangeReferenceTree: tid => {dispatch(changeReferenceTree(tid))},
    onRemoveSet: setIndex => {dispatch(removeSet(setIndex))},
    onAddTreeToInspector: (tid) => {
        if (tid != null) {
            dispatch(addTreeToInspector(tid))
        } else {
            dispatch(toggleInspector())
        }
    },
    onChangeSorting: () => {dispatch(toggleSorting())}
});

export default connect(mapStateToProps, mapDispatchToProps)(DendrogramContainer);