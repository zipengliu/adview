/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React from 'react';
import {Button, ButtonGroup, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import Dotplot from './Dotplot';
import PopupWindow from './PopupWindow';
import { changeDistanceMetric} from '../actions';

let Overview = props => (
    <div id="overview" className="view">
        <div className="view-header">
            <div className="view-title">Overview</div>
            <div>
                <span style={{fontSize: '12px'}}>Distance:</span>
                <ButtonGroup bsSize="xsmall" style={{padding: '2px'}}>
                    <OverlayTrigger placement="top" overlay={<Tooltip id="dist-metric-full">RF distance between trees</Tooltip>}>
                        <Button active={props.metricMode === 'global'}
                                onClick={props.metricMode === 'global'? null: props.onChangeMetricMode.bind(null, 'global', props.metricBranch)}>full</Button>
                    </OverlayTrigger>
                    <OverlayTrigger placement="top" overlay={<Tooltip id="dist-metric-subtree">
                        Distance between trees is calculated by comparing two corresponding subtrees (Jaccard Index of the two sets of taxa).</Tooltip>}>
                        <Button active={props.metricMode === 'local'}
                                onClick={props.metricMode === 'local'? null: props.onChangeMetricMode.bind(null, 'local', props.metricBranch)}>subtree</Button>
                    </OverlayTrigger>
                </ButtonGroup>
            </div>
        </div>

        <div className="view-body">
            <Dotplot />
        </div>

        <PopupWindow />
    </div>);


let mapStateToProps = state => ({
    metricMode: state.overview.metricMode,
    metricBranch: state.overview.metricBranch,
});
let mapDispatchToProps = dispatch => ({
    onChangeMetricMode: (mode, bid) => {dispatch(changeDistanceMetric(mode, bid))},
});


export default connect(mapStateToProps, mapDispatchToProps)(Overview);

