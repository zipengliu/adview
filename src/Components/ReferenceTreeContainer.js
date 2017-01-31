/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React from 'react';
import {OverlayTrigger, Button, Tooltip} from 'react-bootstrap';
import {connect} from 'react-redux';
import FullDendrogram from './FullDendrogram';
import {togglePersistHighlight} from '../actions';

let ReferenceTreeContainer = props => (
    <div className="view" style={{height: '98%'}}>
        <div className="view-header">
            <div style={{textAlign: 'center'}}>
                <span className="view-title">Reference Tree </span>
                <span>({props.tree.name})</span>
            </div>
            <div style={{marginBottom: '5px'}}>
                <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-persist">Persist highlighting of taxa in aggregated dendrograms</Tooltip>}>
                    <Button bsSize="xsmall" onClick={props.togglePersist} bsStyle={props.persist? 'primary': 'default'}>
                        Persist highlight
                    </Button>
                </OverlayTrigger>
                {props.tree.missing &&
                <div style={{float: 'right', fontSize: '12px', marginRight: '10px'}}>
                    {props.tree.branches[props.tree.rootBranch].entities.length} out of {props.tree.branches[props.tree.rootBranch].entities.length + props.tree.missing.length} taxa are present
                </div>
                }
            </div>
        </div>
        <div className="view-body">
            <FullDendrogram />
        </div>
        <div className="view-footer legends">
            <svg width="500" height="40">
                <g transform="translate(2, 10)">
                    <g>
                        <line className="branch-line selected" x1="0" y1="0" x2="20" y2="0"/>
                        <text x="22" dy="4">expanded branch</text>
                    </g>
                    <g transform="translate(150, 0)">
                        <line className="branch-line selected" x1="0" y1="0" x2="20" y2="0"/>
                        <line className="branch-line last-selected-indicator" x1="0" y1="-3" x2="20" y2="-3"/>
                        <line className="branch-line last-selected-indicator" x1="0" y1="3" x2="20" y2="3"/>
                        <text x="22" dy="4">last expanded branch</text>
                    </g>
                    <g transform="translate(290, 0)">
                        <line className="branch-line" x1="0" y1="0" x2="20" y2="0"/>
                        <circle className="metric-branch-indicator" r="4" cx="10" cy="0"/>
                        <text x="22" dy="4">branch for distance metric in Overview</text>
                    </g>

                    <g transform="translate(0, 12)">
                        <g>
                            <rect className="hover-box" x="0" y="-4" width="20" height="8"/>
                            <text x="22" dy="4">highlighted monophyly</text>
                        </g>
                        <g transform="translate(150,0)">
                            <line className="branch-line range-selected" x1="0" y1="0" x2="20" y2="0"/>
                            <text x="22" dy="4">range selecting branch</text>
                        </g>
                        <g transform="translate(290, 0)">
                            <rect className="block range-selected" x="0" y="-4" width="20" height="8"/>
                            <text x="22" dy="4">block that has >=1 range selecting branch</text>
                        </g>
                    </g>

                    <g transform="translate(0, 24)">
                        <g>
                            <g className="proportion">
                                <rect className="total" x="0" y="-4" width="20" height="8"/>
                                <rect className="num" x="0" y="-4" width="10" height="8"/>
                            </g>
                        </g>
                        <text x="22" dy="4">proportion of trees represented by the cluster</text>
                    </g>
                </g>
            </svg>
        </div>
</div>);

let mapStateToProps = state => ({
    tree: state.inputGroupData.trees[state.referenceTree.id],
    persist: state.referenceTree.persist,
});

let mapDispatchToProps = dispatch => ({
    togglePersist: () => {dispatch(togglePersistHighlight())}
});

export default connect(mapStateToProps, mapDispatchToProps)(ReferenceTreeContainer);