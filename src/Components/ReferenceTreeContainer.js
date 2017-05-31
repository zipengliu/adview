/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, {Component} from 'react';
import {OverlayTrigger, ButtonGroup, Button, Tooltip, Glyphicon, Badge} from 'react-bootstrap';
import {connect} from 'react-redux';
import FullDendrogram from './FullDendrogram';
import ReferenceTreeAttributeExplorer from './ReferenceTreeAttributeExplorer';
import {compareWithReference, toggleUniversalBranchLength, toggleTaxaList, toggleRefAttributeExplorer} from '../actions';
import {createMappingFromArray} from '../utils';

class ReferenceTreeContainer extends Component {
    render() {
        let props = this.props;
        let viewBodyPos = this.viewBody? this.viewBody.getBoundingClientRect(): {bottom: 0, left: 0};

        return (
            <div className="view panel panel-default" style={{height: '100%'}} id="reference-tree">
                {/*<div className="view-header panel-heading">*/}
                    {/*<OverlayTrigger placement="bottom" overlay={<Tooltip id="ref-tree-title">{props.tree.name +*/}
                    {/*(props.comparingTree? (' (reference tree) vs. ' + props.comparingTree.name) + ' (comparing tree)': '')}</Tooltip>}>*/}
                        {/*<div className="view-title" style={{textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}>*/}
                            {/*Reference Tree ({props.tree.name})*/}
                            {/*{props.comparingTree? ` vs. ${props.comparingTree.name}`: ''}*/}
                        {/*</div>*/}
                    {/*</OverlayTrigger>*/}
                {/*</div>*/}
                <div className="view-body panel-body" ref={v => {this.viewBody = v}}>
                    {props.charts.show && !props.charts.float && <ReferenceTreeAttributeExplorer/>}
                    <div>
                        <ButtonGroup bsSize="xsmall">
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-toggle-ref-attr-explorer">
                                {(props.charts.show? 'show': 'hide') + 'distribution of branch attributes'} </Tooltip>}>
                                <Button onClick={props.toggleAE} active={props.charts.show}>
                                    Attributes <Glyphicon glyph="signal"/>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-toggle-taxa-list">
                                {props.taxaList.show? 'close taxa list': 'open taxa list'} </Tooltip>}>
                                <Button onClick={props.toggleTaxaList} active={props.taxaList.show}>
                                    <span>All taxa</span>
                                    <Badge style={{marginLeft: '5px'}}>{props.numAllEntities}</Badge>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-branch-len">
                                {props.universalBranchLen? 'Encode branch length': 'Use uniform branch length'} </Tooltip>}>
                                <Button onClick={props.toggleBranchLen}>
                                    {props.universalBranchLen? 'encoded': 'uniform'} branch length
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-import">Import a reference tree</Tooltip>}>
                                <Button disabled>
                                    import
                                </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        {props.comparingTree &&
                        <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-cancel-compare">Exit pairwise comparison</Tooltip>}>
                            <Button bsSize="xsmall" bsStyle="primary" onClick={props.cancelCompare}>
                                End pairwise comparison
                            </Button>
                        </OverlayTrigger>
                        }
                        {props.tree.missing &&
                        <div style={{float: 'right', fontSize: '12px', marginRight: '10px'}}>
                            #Taxa: {Object.keys(createMappingFromArray(props.tree.entities)).length}
                            {props.comparingTree? ` vs. ${Object.keys(createMappingFromArray(props.comparingTree.entities)).length} `: ''}
                        </div>
                        }
                    </div>

                    <FullDendrogram />

                    {props.checkingBranch &&
                    <div className="checking-branch-tooltip" style={{top: viewBodyPos.bottom + 'px', left: viewBodyPos.left + 'px'}}>
                        {props.tooltip.map((a, i) =>
                            <div key={i}>
                                {a.attribute}: {a.accessor(props.tree.branches[props.checkingBranch])}
                            </div>)}
                    </div>
                    }
                </div>
                {/*<div className="view-footer legends" style={{height: '40px'}}>*/}
                {/*<svg width="0" height="40">*/}
                {/*<g transform="translate(2, 10)">*/}
                {/*<g>*/}
                {/*<line className="branch-line selected" x1="0" y1="0" x2="20" y2="0"/>*/}
                {/*<text x="22" dy="4">expanded branch</text>*/}
                {/*</g>*/}
                {/*<g transform="translate(150, 0)">*/}
                {/*<line className="branch-line selected" x1="0" y1="0" x2="20" y2="0"/>*/}
                {/*<line className="branch-line last-selected-indicator" x1="0" y1="-3" x2="20" y2="-3"/>*/}
                {/*<line className="branch-line last-selected-indicator" x1="0" y1="3" x2="20" y2="3"/>*/}
                {/*<text x="22" dy="4">last expanded branch</text>*/}
                {/*</g>*/}
                {/*<g transform="translate(290, 0)">*/}
                {/*<line className="branch-line" x1="0" y1="0" x2="20" y2="0"/>*/}
                {/*<circle className="metric-branch-indicator" r="4" cx="10" cy="0"/>*/}
                {/*<text x="22" dy="4">branch for distance metric in Overview</text>*/}
                {/*</g>*/}

                {/*<g transform="translate(0, 12)">*/}
                {/*<g>*/}
                {/*<rect className="hover-box" x="0" y="-4" width="20" height="8"/>*/}
                {/*<text x="22" dy="4">highlighted monophyly</text>*/}
                {/*</g>*/}
                {/*<g transform="translate(150,0)">*/}
                {/*<line className="branch-line range-selected" x1="0" y1="0" x2="20" y2="0"/>*/}
                {/*<text x="22" dy="4">range selecting branch</text>*/}
                {/*</g>*/}
                {/*<g transform="translate(290, 0)">*/}
                {/*<rect className="block range-selected" x="0" y="-4" width="20" height="8"/>*/}
                {/*<text x="22" dy="4">block that has >=1 range selecting branch</text>*/}
                {/*</g>*/}
                {/*</g>*/}

                {/*<g transform="translate(0, 24)">*/}
                {/*<g>*/}
                {/*<g className="proportion">*/}
                {/*<rect className="total" x="0" y="-4" width="20" height="8"/>*/}
                {/*<rect className="num" x="0" y="-4" width="10" height="8"/>*/}
                {/*</g>*/}
                {/*</g>*/}
                {/*<text x="22" dy="4">proportion of trees represented by the cluster</text>*/}
                {/*</g>*/}
                {/*</g>*/}
                {/*</svg>*/}
                {/*</div>*/}
            </div>
        )
    }
}

let mapStateToProps = state => ({
    numAllEntities: Object.keys(state.inputGroupData.entities).length,
    tree: state.inputGroupData.referenceTree,
    isUserSpecified: state.referenceTree.isUserSpecified,
    comparingTree: state.pairwiseComparison.tid? state.inputGroupData.trees[state.pairwiseComparison.tid]: null,
    universalBranchLen: state.referenceTree.universalBranchLen,

    checkingBranch: state.referenceTree.checkingBranch,
    tooltip: state.referenceTree.tooltip,
    charts: state.referenceTree.charts,
    taxaList: state.taxaList,
});

let mapDispatchToProps = dispatch => ({
    cancelCompare: () => {dispatch(compareWithReference(null))},
    toggleBranchLen: () => {dispatch(toggleUniversalBranchLength())},
    toggleTaxaList: () => {dispatch(toggleTaxaList())},
    toggleAE: () => {dispatch(toggleRefAttributeExplorer())},
});

export default connect(mapStateToProps, mapDispatchToProps)(ReferenceTreeContainer);