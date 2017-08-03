/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, {Component} from 'react';
import {OverlayTrigger, ButtonGroup, Button, Tooltip, MenuItem, DropdownButton} from 'react-bootstrap';
import {connect} from 'react-redux';
import cn from 'classnames';
import FullDendrogram from './FullDendrogram';
import ReferenceTreeAttributeExplorer from './ReferenceTreeAttributeExplorer';
import {compareWithReference, toggleUniversalBranchLength, toggleExtendedMenu, changeDistanceMetric,
    selectBranchOnFullDendrogram, toggleHighlightMonophyly, rerootReferenceTree,
    createUserSpecifiedTaxaGroup, addToUserSpecifiedTaxaGroup, removeFromUserSpecifiedTaxaGroup,
    removeUserSpecifiedTaxaGroup, expandUserSpecifiedTxaGroup} from '../actions';
import {createMappingFromArray} from '../utils';
import {getVirtualBid} from '../tree';

class ReferenceTreeContainer extends Component {
    render() {
        let props = this.props;
        let {tree, comparingTree, extendedMenu, universalBranchLen, userSpecified, userSpecifiedByGroup, expandedBranches, colorScheme} = props;
        let isExtLeaf = extendedMenu.bid && tree.branches[extendedMenu.bid].isLeaf;
        let isExtSpecified = userSpecified.hasOwnProperty(extendedMenu.bid);
        let isExtExpanded = expandedBranches.hasOwnProperty(extendedMenu.bid) ||
            (isExtSpecified && expandedBranches.hasOwnProperty(getVirtualBid(userSpecified[extendedMenu.bid])));
        let groups = Object.keys(userSpecifiedByGroup);
        let {branches} = tree;
        let viewBodyPos = this.viewBody? this.viewBody.getBoundingClientRect(): {bottom: 0, left: 0};

        let isContained = (bid, gid) => {
            let g = userSpecifiedByGroup[gid];
            let goUp = (id, target) => {
                if (id === target) return true;
                if (id === tree.rootBranch) return false;
                return goUp(branches[id].parent, target);
            };
            for (let i = 0; i < g.length; i++) {
                // Check if bid is a descendant of g[i]
                if (goUp(bid, g[i])) {
                    return true;
                }
            }
            return false;
        };

        return (
            <div className="view panel panel-default"  id="reference-tree">
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

                        {groups.length > 0 &&
                        <DropdownButton bsSize="xsmall" title="Match user specified taxa group" id="exp-user-specified-taxa-group"
                        onSelect={(gid) => {props.expandUSTG(gid)}}>
                            {groups.map((gid, i) =>
                                <MenuItem key={i} eventKey={gid}>{gid}</MenuItem>
                            )}
                        </DropdownButton>
                        }

                        {props.comparingTree &&
                        <ButtonGroup bsSize="xsmall">
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-cancel-compare">Exit pairwise comparison</Tooltip>}>
                                <Button bsStyle="primary" onClick={props.cancelCompare}>
                                    End pairwise comparison
                                </Button>
                            </OverlayTrigger>
                            {props.comparingTree.tid.indexOf('consensus') !== -1 &&
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-export-consensus">Export consensus tree to a file</Tooltip>}>
                                <Button>
                                    <a href={props.consensusURL} download="consensus.newick">Export consensus tree</a>
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

                        <MenuItem header>Branch exploration</MenuItem>
                        <OverlayTrigger rootClose placement="right" overlay={<Tooltip id="ext-menu-highlight-monophyly">
                            Highlight / De-highlight this monophyly with color here and in aggregated dendrograms</Tooltip>}>
                            <MenuItem disabled={isExtLeaf} onSelect={() => {props.toggleHighlightMonophyly(tree.tid, extendedMenu.bid)}}>
                                Highlight / De-highlight
                            </MenuItem>
                        </OverlayTrigger>

                        <OverlayTrigger rootClose placement="right" overlay={<Tooltip id="ext-menu-expand-branch">
                            (Undo) Find matches of this monophyly in the tree collection</Tooltip>}>
                            <MenuItem disabled={isExtLeaf} onSelect={() => {
                                isExtSpecified && isExtExpanded? props.expandUSTG(userSpecified[extendedMenu.bid], true):
                                    props.selectBranch(extendedMenu.bid)}}>
                                {isExtExpanded? 'Undo match': 'Match'}
                            </MenuItem>
                        </OverlayTrigger>
                        <MenuItem divider/>

                        <MenuItem header>User specified taxa group</MenuItem>

                        <MenuItem disabled={isExtSpecified} onSelect={() => {props.createUSTG(extendedMenu.bid)}}>
                            Create new taxa group
                        </MenuItem>
                        <li className={cn("dropdown-submenu", {disabled: isExtSpecified || groups.length === 0})}>
                            <a href="#">Add to an existent taxa group</a>
                            {groups.length > 0 &&
                            <ul className="dropdown-menu" >
                                {groups.map((gid, i) =>
                                    <MenuItem key={i} disabled={isContained(extendedMenu.bid, gid)}
                                              onSelect={() => {props.addToUSTG(extendedMenu.bid, gid)}}>{gid}</MenuItem>
                                )}
                            </ul>}
                        </li>
                        <MenuItem disabled={!isExtSpecified || userSpecifiedByGroup[userSpecified[extendedMenu.bid]].length === 1}
                                  onSelect={() => {props.removeFromUSTG(extendedMenu.bid, userSpecified[extendedMenu.bid])}}>
                            Remove from its taxa group
                        </MenuItem>
                        <MenuItem disabled={!isExtSpecified} onSelect={() => {props.removeUSTG(userSpecified[extendedMenu.bid])}}>
                            Delete this taxa group
                        </MenuItem>
                        <MenuItem divider/>

                        <MenuItem header>Others</MenuItem>

                        <OverlayTrigger rootClose placement="right" overlay={<Tooltip id="ext-menu-re-compute">
                            Re-compute tree similarities by this branch (local similarity)</Tooltip>}>
                            <MenuItem disabled={isExtLeaf} onSelect={() => {props.changeDistanceMetric(extendedMenu.bid)}}>
                                Re-compute Tree Similarity View
                            </MenuItem>
                        </OverlayTrigger>

                        <OverlayTrigger rootClose placement="right" overlay={<Tooltip id="ext-menu-re-root">
                            Re-root the reference tree to this branch</Tooltip>}>
                            <MenuItem disabled={isExtLeaf} onSelect={() => {props.reroot(extendedMenu.bid)}}>Re-root reference tree</MenuItem>
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
                <div className="panel-footer">
                    <div className="legend">
                        <div className="legend-section-title">
                            Branch:
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '5px', width: '12px', background: 'purple'}}></div>
                            <span>in attribute range</span>
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '7px', width: '12px', background: 'black'}}></div>
                            <span>hovered</span>
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '1px', width: '20px', background: 'black', border: 'none', position: 'relative', verticalAlign: 'middle'}}>
                                <div style={{width: '8px', height: '8px', borderRadius: '50%', background: 'grey', position: 'absolute', left: '6px', top: '-3px'}}></div>
                            </div>
                            <span>for tree similarity</span>
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '5px', width: '12px', background: 'red'}}></div>
                            <span>matched</span>
                        </div>
                    </div>
                    <div className="legend">
                        <div className="legend-section-title">
                            Taxon:
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{width: '8px', height: '8px', borderRadius: '50%', background: 'black'}}></div>
                            <span>taxon hovered</span>
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{width: '8px', height: '8px', borderRadius: '50%', background: 'none', border: '1px solid black'}}></div>
                            <span>uncertain taxon hovered</span>
                        </div>
                        <div className="legend-item">
                            {[1,2,3].map(i =>
                                <div className="mark" key={i} style={{width: '14px', height: '14px', borderRadius: '50%', background: 'black', color: 'white',
                                    textAlign: 'center', verticalAlign: 'middle'}}>{i}</div>
                            )}
                            <span>for partition segments</span>
                        </div>
                    </div>
                    <div className="legend">
                        <div className="legend-section-title">
                            Monophyly:
                        </div>
                        <div className="legend-item">
                            {colorScheme.map((c, i) =>
                                <div className="mark" key={i} style={{width: '10px', height: '10px', background: c, opacity: .5}}></div>
                            )}
                            <span>highlight 1-5</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}

let mapStateToProps = state => ({
    tree: state.inputGroupData.referenceTree,
    isUserSpecified: state.referenceTree.isUserSpecified,
    comparingTree: state.pairwiseComparison.tid? state.inputGroupData.trees[state.pairwiseComparison.tid]: null,
    universalBranchLen: state.referenceTree.universalBranchLen,

    expandedBranches: state.referenceTree.expanded,
    userSpecifiedByGroup: state.referenceTree.userSpecifiedByGroup,
    userSpecified: state.referenceTree.userSpecified,
    extendedMenu: state.referenceTree.extendedMenu,
    checkingBranch: state.referenceTree.checkingBranch,
    checkingBranchTid: state.referenceTree.checkingBranchTid,
    tooltip: state.referenceTree.tooltip,
    charts: state.referenceTree.charts,

    consensusURL: state.pairwiseComparison.tid && state.pairwiseComparison.tid.indexOf('consensus') !== -1?
        state.inputGroupData.trees[state.pairwiseComparison.tid].consensusURL: null,

    colorScheme: state.highlight.colorScheme
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
    reroot: bid => {dispatch(rerootReferenceTree(bid))},
    createUSTG: bid => {dispatch(createUserSpecifiedTaxaGroup(bid))},
    addToUSTG: (bid, group) => {dispatch(addToUserSpecifiedTaxaGroup(bid, group))},
    removeFromUSTG: (bid, group) => {dispatch(removeFromUserSpecifiedTaxaGroup(bid, group))},
    removeUSTG: group => {dispatch(removeUserSpecifiedTaxaGroup(group))},
    expandUSTG: (group, collapse=false) => {dispatch(expandUserSpecifiedTxaGroup(group, collapse))}
});

export default connect(mapStateToProps, mapDispatchToProps)(ReferenceTreeContainer);