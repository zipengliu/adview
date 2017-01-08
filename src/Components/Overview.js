/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, { Component } from 'react';
import {ButtonToolbar, Badge, Button, ButtonGroup, DropdownButton, MenuItem, Glyphicon, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import Dotplot from './Dotplot';
import PopupWindow from './PopupWindow';
import {runTSNE, getJaccardIndex} from '../utils';
import {popCreateNewSetWindow, addToSet, changeDistanceMetric, togglePickingMetricBranch} from '../actions';

let Overview = props => (
    <div>
        <div>Overview</div>
        <ButtonToolbar style={{marginBottom: '5px'}}>
            <Button bsSize="xsmall" onClick={props.onCreate} disabled={!props.hasSelection}>Create new set</Button>
            <DropdownButton bsSize="xsmall" title="Add to set" id="add-to-set"
                            onSelect={props.onAddToSet}
                            disabled={!props.hasSelection || props.sets.length == 0}>
                {props.sets.map((d, i) =>
                    <MenuItem eventKey={i} key={i}>
                        {d.title}
                        <Badge style={{marginLeft: '5px'}}>{d.tids.length}</Badge>
                        <div style={{
                            display: 'inline-block', background: d.color,
                            width: '10px', height: '10px', float: 'right', marginTop: '5px'
                        }}></div>
                    </MenuItem>
                )}
            </DropdownButton>
        </ButtonToolbar>
        <div style={{width: '100%', height: '100%', border: '1px solid black'}}>
            <Dotplot coordinates={props.coordinates}/>
        </div>
        <div>
            <span style={{fontSize: '12px'}}>Dist. Metric:</span>
            <ButtonGroup bsSize="xsmall" style={{padding: '2px'}}>
                <Button active={props.metricMode == 'global'}
                        onClick={props.onChangeMetricMode.bind(null, 'global')}>global</Button>
                <Button active={props.metricMode == 'local'}
                        onClick={props.onChangeMetricMode.bind(null, 'local')}>local</Button>
                <OverlayTrigger placement="top"
                                overlay={<Tooltip id="tooltip-pick-branch">Pick a partition on the reference tree as the
                                    scope of the local distance metric</Tooltip>}>
                    <Button bsSize="xsmall" style={{marginLeft: '5px'}} disabled={props.metricMode !== 'local'}
                            active={props.pickingBranch}
                            onClick={props.onTogglePicking}>
                        <Glyphicon glyph="screenshot"/>
                    </Button>
                </OverlayTrigger>
            </ButtonGroup>
        </div>

        <PopupWindow></PopupWindow>
    </div>);

let getCoordinates = createSelector(
    [state => state.inputGroupData.trees, state => state.referenceTree.id,
        state => state.overview.metricMode, state => state.overview.metricBranch],
    (trees, rid, mode, bid) => {
        // Concat all rf_dist in trees to a distance matrix
        // First, decide an order of trees for the matrix

        let order;
        let dist = [];
        let isLocal = mode == 'local' && rid && bid;
        if (isLocal) {
            // Local distance matrix
            console.log('Calculating local coordinates in Overview...');
            order = [];
            let corr = trees[rid].branches[bid].correspondingBranches;
            for (let tid in corr) {
                order.push({treeId: tid, branchId: corr[tid].branchId});
            }
        } else {
            console.log('Calculating global coordinates in Overview...');
            // Global distance matrix
            order = Object.keys(trees);
        }
        for (let i = 0; i < order.length; i++) {
            let cur = [];
            // let t = trees[order[i]];
            for (let j = 0; j < order.length; j++) {
                if (j > i) {
                    if (isLocal) {
                        // TODO: can make it faster by caching the entities first
                        cur.push(1.0 - getJaccardIndex(trees[order[i].treeId].branches[order[i].branchId].entities,
                                trees[order[j].treeId].branches[order[j].branchId].entities));
                    } else {
                        cur.push(trees[order[i]].rfDistance[order[j]]);
                    }
                } else if (j < i) {
                    // The distance matrix is symmetric
                    cur.push(dist[j][i]);
                } else {
                    cur.push(0);
                }
            }
            dist.push(cur);
        }

        // Second run t-SNE
        let coords = runTSNE(dist);

        return coords.map((d, i) => ({...d, treeId: isLocal? order[i].treeId: order[i]}))
    });

let mapStateToProps = state => ({
    sets: state.sets,
    hasSelection: state.overview.selectedDots && state.overview.selectedDots.length > 0,
    metricMode: state.overview.metricMode,
    pickingBranch: state.overview.pickingBranch,
    coordinates: getCoordinates(state)
});
let mapDispatchToProps = dispatch => ({
    onCreate: () => {dispatch(popCreateNewSetWindow())},
    onAddToSet: (idx) => {dispatch(addToSet(idx))},
    onChangeMetricMode: (mode) => {dispatch(changeDistanceMetric(mode))},
    onTogglePicking: () => {dispatch(togglePickingMetricBranch())}
});


export default connect(mapStateToProps, mapDispatchToProps)(Overview);

