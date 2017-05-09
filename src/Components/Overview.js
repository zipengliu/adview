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
    <div id="overview" className="view panel panel-default">
        <div className="view-header panel-heading">
            <div className="view-title">Tree Similarity</div>
        </div>

        <div className="view-body panel-body">
            <div>
                <span>Distance:</span>
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

