/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, { Component } from 'react';
import {ButtonToolbar, Badge, Button, ButtonGroup, DropdownButton, MenuItem, Glyphicon, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import Dotplot from './Dotplot';
import PopupWindow from './PopupWindow';
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
            <Dotplot />
        </div>
        <div>
            <span style={{fontSize: '12px'}}>Dist. Metric:</span>
            <ButtonGroup bsSize="xsmall" style={{padding: '2px'}}>
                <Button active={props.metricMode == 'global'}
                        onClick={props.metricMode == 'global'? null: props.onChangeMetricMode.bind(null, 'global', props.metricBranch)}>global</Button>
                <Button active={props.metricMode == 'local'}
                        onClick={props.metricMode == 'local'? null: props.onChangeMetricMode.bind(null, 'local', props.metricBranch)}>local</Button>
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

        <PopupWindow />
    </div>);


let mapStateToProps = state => ({
    sets: state.sets,
    hasSelection: state.overview.selectedDots && state.overview.selectedDots.length > 0,
    metricMode: state.overview.metricMode,
    metricBranch: state.overview.metricBranch,
    pickingBranch: state.overview.pickingBranch,
});
let mapDispatchToProps = dispatch => ({
    onCreate: () => {dispatch(popCreateNewSetWindow())},
    onAddToSet: (idx) => {dispatch(addToSet(idx))},
    onChangeMetricMode: (mode, bid) => {dispatch(changeDistanceMetric(mode, bid))},
    onTogglePicking: () => {dispatch(togglePickingMetricBranch())}
});


export default connect(mapStateToProps, mapDispatchToProps)(Overview);

