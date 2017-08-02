/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React from 'react';
import {Button, ButtonGroup, OverlayTrigger, Tooltip, Glyphicon} from 'react-bootstrap';
import {connect} from 'react-redux';
import Dotplot from './Dotplot';
import PopupWindow from './PopupWindow';
import { changeDistanceMetric} from '../actions';
import {renderSubCollectionGlyph} from './Commons';


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

            {/*<Button bsSize="xsmall" style={{width: '100%'}}> Create plot for local similarity </Button>*/}
            <div className="legend">
                <div className="legend-item" style={{color: 'grey'}}>
                    {renderSubCollectionGlyph('circle', 'grey')}
                    {renderSubCollectionGlyph('plus', 'grey')}
                    {renderSubCollectionGlyph('triangle-right', 'grey')}
                    {renderSubCollectionGlyph('square', 'grey')}
                    {renderSubCollectionGlyph('diamond', 'grey')}
                    <span style={{color: 'black'}}>sub-collection mark</span>
                </div>
                <div className="legend-item">
                    <Glyphicon glyph="registration-mark" style={{fontSize: '12px', margin: '0 2px'}} />
                    <span>ref.</span>
                </div>
                <div className="legend-item">
                    <div className="mark" style={{width: '8px', height: '8px', borderRadius: '50%', border: '1px solid black', background: 'grey'}}></div>
                    <span>selected</span>
                </div>
                <div className="legend-item">
                    <div className="mark" style={{width: '8px', height: '8px', borderRadius: '50%', background: '#b82e2e'}}></div>
                    <span>hovered</span>
                </div>
            </div>
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

