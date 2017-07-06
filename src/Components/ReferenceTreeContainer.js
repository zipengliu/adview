/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, {Component} from 'react';
import {OverlayTrigger, ButtonGroup, Button, Tooltip, MenuItem} from 'react-bootstrap';
import {connect} from 'react-redux';
import FullDendrogram from './FullDendrogram';
import ReferenceTreeAttributeExplorer from './ReferenceTreeAttributeExplorer';
import {compareWithReference, toggleUniversalBranchLength,
    toggleExtendedMenu, changeDistanceMetric, selectBranchOnFullDendrogram, toggleHighlightMonophyly, reroot} from '../actions';
import {createMappingFromArray} from '../utils';

class ReferenceTreeContainer extends Component {
    render() {
        let props = this.props;
        let {tree, comparingTree, extendedMenu, universalBranchLen} = props;
        let viewBodyPos = this.viewBody? this.viewBody.getBoundingClientRect(): {bottom: 0, left: 0};

        return (
            <div className="view panel panel-default" style={{height: '100%'}} id="reference-tree">
                <div className="view-body panel-body" >
                    {props.charts.show && !props.charts.float && <ReferenceTreeAttributeExplorer/>}

                    <div className="reference-tree-name">
                        {tree.name} ({Object.keys(createMappingFromArray(tree.entities)).length} taxa)
                        {comparingTree? ` vs. ${comparingTree.name} (${Object.keys(createMappingFromArray(props.comparingTree.entities)).length} taxa)`: ''}
                    </div>

                    <div>
                        <ButtonGroup bsSize="xsmall">
                            <Button active={!universalBranchLen} onClick={universalBranchLen? props.toggleBranchLen: Function.prototype}>
                                Encode
                            </Button>
                            <Button active={universalBranchLen} onClick={!universalBranchLen? props.toggleBranchLen: Function.prototype}>
                                Ignore
                            </Button>
                        </ButtonGroup>
                        <div style={{display: 'inline-block', marginLeft: '5px', marginRight: '10px'}}> branch length.</div>

                        {props.comparingTree &&
                        <ButtonGroup bsSize="xsmall">
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-cancel-compare">Exit pairwise comparison</Tooltip>}>
                                <Button bsStyle="primary" onClick={props.cancelCompare}>
                                    End pairwise comparison
                                </Button>
                            </OverlayTrigger>
                            {props.comparingTree.tid.indexOf('consensus') !== -1 &&
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-export-consensus">Export consensus tree to a file</Tooltip>}>
                                <Button onClick={Function.prototype}>
                                    Export consensus tree
                                </Button>
                            </OverlayTrigger>
                            }
                        </ButtonGroup>
                        }

                    </div>

                    <div ref={v => {this.viewBody = v}} onClick={extendedMenu.bid? props.closeExtendedMenu: Function.prototype}>
                        <FullDendrogram />
                    </div>

                    {extendedMenu.bid &&
                    <ul className="dropdown-menu open reference-tree-extended-menu"
                        style={{left: extendedMenu.x + 'px', top: extendedMenu.y + 'px'}}>
                        <OverlayTrigger rootClose placement="right" overlay={<Tooltip id="ext-menu-highlight-monophyly">
                            Highlight / De-highlight this monophyly with color here and in aggregated dendrograms</Tooltip>}>
                            <MenuItem onSelect={() => {props.toggleHighlightMonophyly(tree.tid, extendedMenu.bid)}}>
                                Highlight / De-highlight this monophyly
                            </MenuItem>
                        </OverlayTrigger>

                        <OverlayTrigger rootClose placement="right" overlay={<Tooltip id="ext-menu-expand-branch">
                            Expand / Un-expand this branch in all views</Tooltip>}>
                            <MenuItem onSelect={() => {props.selectBranch(extendedMenu.bid)}}>
                                Expand / Un-expand this branch
                            </MenuItem>
                        </OverlayTrigger>

                        <OverlayTrigger rootClose placement="right" overlay={<Tooltip id="ext-menu-re-compute">
                            Re-compute tree similarities by this branch (local similarity)</Tooltip>}>
                            <MenuItem onSelect={() => {props.changeDistanceMetric(extendedMenu.bid)}}>
                                Re-compute Tree Similarity View
                            </MenuItem>
                        </OverlayTrigger>

                        <OverlayTrigger rootClose placement="right" overlay={<Tooltip id="ext-menu-re-root">
                            Re-root the reference tree to this branch</Tooltip>}>
                            <MenuItem onSelect={() => {props.reroot(extendedMenu.bid)}}>Re-root reference tree</MenuItem>
                        </OverlayTrigger>
                    </ul>}

                    {props.checkingBranch &&
                    <div className="checking-branch-tooltip" style={{top: viewBodyPos.top + 10 + 'px', left: viewBodyPos.right - 120 + 'px'}}>
                        {props.tooltip.map((a, i) =>
                            <div key={i}>
                                {a.attribute}: {a.accessor(props.checkingBranchTid === tree.tid?
                                tree.branches[props.checkingBranch]: props.comparingTree.branches[props.checkingBranch])}
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
    tree: state.inputGroupData.referenceTree,
    isUserSpecified: state.referenceTree.isUserSpecified,
    comparingTree: state.pairwiseComparison.tid? state.inputGroupData.trees[state.pairwiseComparison.tid]: null,
    universalBranchLen: state.referenceTree.universalBranchLen,

    extendedMenu: state.referenceTree.extendedMenu,
    checkingBranch: state.referenceTree.checkingBranch,
    checkingBranchTid: state.referenceTree.checkingBranchTid,
    tooltip: state.referenceTree.tooltip,
    charts: state.referenceTree.charts,
});

let mapDispatchToProps = dispatch => ({
    cancelCompare: () => {dispatch(compareWithReference(null))},
    toggleBranchLen: () => {dispatch(toggleUniversalBranchLength())},
    closeExtendedMenu: () => {dispatch(toggleExtendedMenu())},
    changeDistanceMetric: (bid) => {dispatch(changeDistanceMetric('local', bid))},
    selectBranch: (bid) => {dispatch(selectBranchOnFullDendrogram(bid))},
    toggleHighlightMonophyly: (tid, bid, addictive=false) => {
        dispatch(toggleHighlightMonophyly(tid, bid, addictive));
    },
    reroot: bid => {dispatch(reroot(bid))},
});

export default connect(mapStateToProps, mapDispatchToProps)(ReferenceTreeContainer);