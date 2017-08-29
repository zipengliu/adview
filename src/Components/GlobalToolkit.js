/**
 * Created by zipeng on 2017-05-04.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import cn from 'classnames';
import BitSet from 'bitset.js';
import {ButtonGroup, Button, DropdownButton, Glyphicon, OverlayTrigger, Tooltip, MenuItem, Badge} from 'react-bootstrap';
import {clearAll, clearSelectedTrees, popCreateNewSetWindow, addToSet,
    removeFromSet, removeSet, compareWithReference, toggleJaccardMissing, makeConsensus, reverseSelection,
    downloadSelectedTrees, toggleStretchedMainView} from '../actions';
import {renderSubCollectionGlyph} from './Commons';

class GlobalToolkit extends Component {
    render() {
        let {selectedTrees, inputGroupId, consensusTrees, stretchedMainView} = this.props;
        let selectedTids = BitSet(selectedTrees.map(tid => tid.substring(1)));
        let isConsensusNotConsistent = consensusTrees && this.props.isComparingConsensus && !selectedTids.equals(consensusTrees);

        return (
            <div id="global-toolkit" className="panel panel-default">
                <div className="panel-body">
                    <div>
                        <ButtonGroup bsSize="xsmall">
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-compare">Compare tree with the reference tree in detail</Tooltip>}>
                                <Button disabled={selectedTrees.length !== 1|| selectedTrees[0] === this.props.referenceTid}
                                        onClick={this.props.onCompareWithReference.bind(null, selectedTrees[0])}>
                                    <Glyphicon glyph="zoom-in" /><span className="glyph-text">pairwise compare</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-consensus">Make a consensus tree of selected trees and pairwise compare with the reference tree</Tooltip>}>
                                <Button disabled={selectedTrees.length < 2} bsStyle={isConsensusNotConsistent? 'warning': 'default'}
                                        onClick={this.props.onMakeConsensus.bind(null, inputGroupId, selectedTrees)}>
                                    <Glyphicon glyph="zoom-in" /><span className="glyph-text">{isConsensusNotConsistent? 're-':''}make consensus</span>
                                </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        <ButtonGroup bsSize="xsmall" style={{margin: '0 10px'}}>
                            <OverlayTrigger placement="bottom" rootClose overlay={<Tooltip id="tooltip-reset">Clear all selected trees, expanded branches and highlights</Tooltip>}>
                                <Button onClick={this.props.onClearAll}>
                                    <Glyphicon glyph="refresh" /><span className="glyph-text">reset</span>
                                </Button>
                            </OverlayTrigger>
                            <DropdownButton bsSize="xsmall" disabled={!selectedTrees.length} id="selected-trees-dropdown" title={`selected trees (${selectedTrees.length})`}>
                                <MenuItem onSelect={() => {this.props.onClearSelectedTrees()}}>clear selection</MenuItem>
                                <MenuItem onSelect={() => {this.props.onReverseSelection()}}>reverse selection</MenuItem>
                                <MenuItem onSelect={() => {this.props.onDownload()}}>export as tree file (newick)</MenuItem>
                            </DropdownButton>
                        </ButtonGroup>

                        <DropdownButton bsSize="xsmall" title="sub-collection" id="sub-collection-dropdown" >
                            <MenuItem disabled={!selectedTrees.length} onSelect={() => {this.props.onCreateNewSet()}}>create</MenuItem>
                            <li className={cn('dropdown-submenu', {disabled: !selectedTrees.length || this.props.sets.length === 0})}>
                                <a href="#">add to</a>
                                <ul className="dropdown-menu" >
                                    {this.props.sets.map((d, i) =>
                                        <MenuItem eventKey={i} key={i} onSelect={this.props.onAddToSet}>
                                            {renderSubCollectionGlyph(d.glyph)}
                                            <span>{d.title}</span>
                                            <Badge style={{marginLeft: '5px', backgroundColor: 'black'}}>{d.tids.length}</Badge>
                                        </MenuItem>
                                    )}
                                </ul>
                            </li>
                            <MenuItem disabled={!selectedTrees.length} onSelect={() => {this.props.onRemoveFromSet(selectedTrees, this.props.activeSetIndex)}}>remove selected trees</MenuItem>
                            <MenuItem disabled={this.props.activeSetIndex === 0} onSelect={() => {this.props.onRemoveSet(this.props.activeSetIndex)}}>delete</MenuItem>
                        </DropdownButton>

                        <DropdownButton bsSize="xsmall" title="more" id="more-dropdown" style={{marginLeft: '10px'}}>
                            <MenuItem onClick={this.props.onToggleMainView}>{stretchedMainView? 'restrain to single page frame': 'expand to full web page (for screenshot)'}</MenuItem>
                        </DropdownButton>

                        {/*<span>Match monophyly </span>*/}
                        {/*<ButtonGroup bsSize="xsmall">*/}
                            {/*<Button active={cb === 'cb'} onClick={this.props.onChangeCB.bind(null, 'cb')}>with</Button>*/}
                            {/*<Button active={cb === 'cb2'} onClick={this.props.onChangeCB.bind(null, 'cb2')}>without</Button>*/}
                        {/*</ButtonGroup>*/}
                        {/*<span> missing taxa. </span>*/}
                    </div>
                </div>
            </div>
        )
    }
};

let mapStateToProps = state => ({
    sets: state.sets,
    selectedTrees: Object.keys(state.selectedTrees),
    consensusTrees: state.consensusTrees,
    isComparingConsensus: state.pairwiseComparison.tid && state.pairwiseComparison.tid.indexOf('consensus') !== -1,
    inputGroupId: state.inputGroupData.inputGroupId,
    activeSetIndex: state.aggregatedDendrogram.activeSetIndex,
    referenceTid: state.referenceTree.id,
    cb: state.cb,
    stretchedMainView: state.stretchedMainView,
});

let mapDispatchToProps = dispatch => ({
    onClearAll: () => {dispatch(clearAll())},
    onClearSelectedTrees: () => {dispatch(clearSelectedTrees())},

    onCreateNewSet: () => {dispatch(popCreateNewSetWindow())},
    onAddToSet: (idx) => {dispatch(addToSet(idx))},
    onRemoveFromSet: (tid, setIndex) => {dispatch(removeFromSet(tid, setIndex))},
    onRemoveSet: setIndex => {dispatch(removeSet(setIndex))},

    onCompareWithReference: (tid) => {dispatch(compareWithReference(tid))},

    onChangeCB: (cb) => {dispatch(toggleJaccardMissing(cb))},
    onMakeConsensus: (inputGroupId, tids) => {dispatch(makeConsensus(inputGroupId, tids))},
    onReverseSelection: () => {dispatch(reverseSelection())},
    onDownload: () => {dispatch(downloadSelectedTrees())},
    onToggleMainView: () => {dispatch(toggleStretchedMainView())},
});

export default connect(mapStateToProps, mapDispatchToProps)(GlobalToolkit);
