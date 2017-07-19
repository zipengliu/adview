/**
 * Created by zipeng on 2017-05-04.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import BitSet from 'bitset.js';
import {ButtonGroup, Button, DropdownButton, Glyphicon, OverlayTrigger, Tooltip, MenuItem, Badge} from 'react-bootstrap';
import {clearAll, clearSelectedTrees, popCreateNewSetWindow, addToSet,
    removeFromSet, removeSet, compareWithReference, toggleJaccardMissing, makeConsensus, reverseSelection} from '../actions';
import {renderSubCollectionGlyph} from './Commons';

class GlobalToolkit extends Component {
    render() {
        let {selectedTrees, cb, inputGroupId, consensusTrees} = this.props;
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
                                <Button disabled={selectedTrees.length < 2}
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
                            <OverlayTrigger placement="bottom" rootClose overlay={<Tooltip id="tooltip-clear-selected-trees">Clear all selected trees</Tooltip>}>
                                <Button disabled={!selectedTrees.length} onClick={this.props.onClearSelectedTrees}>
                                    <Glyphicon glyph="" /><span className="glyph-text">clear selected trees</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger placement="bottom" rootClose overlay={<Tooltip id="tooltip-reverse-selection">Reverse tree selection</Tooltip>}>
                                <Button disabled={!selectedTrees.length} onClick={this.props.onReverseSelection}>
                                    <span className="glyph-text">reverse selection</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger placement="bottom" rootClose overlay={<Tooltip id="tooltip-export-selected-trees">Export the list of selected trees as text file</Tooltip>}>
                                <Button disabled={!selectedTrees.length}>
                                    <Glyphicon glyph="" /><span className="glyph-text">export selected trees</span>
                                </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        <span>Match monophyly </span>
                        <ButtonGroup bsSize="xsmall">
                            <Button active={cb === 'cb'} onClick={this.props.onChangeCB.bind(null, 'cb')}>with</Button>
                            <Button active={cb === 'cb2'} onClick={this.props.onChangeCB.bind(null, 'cb2')}>without</Button>
                        </ButtonGroup>
                        <span> missing taxa. </span>
                    </div>

                    <div>
                        <ButtonGroup bsSize="xsmall">
                            <Button onClick={this.props.onCreateNewSet} disabled={!selectedTrees.length}>create sub-collection</Button>
                            <DropdownButton bsSize="xsmall" title="add to sub-collection" id="add-to-set"
                                            onSelect={this.props.onAddToSet}
                                            disabled={!selectedTrees.length || this.props.sets.length === 0}>
                                {this.props.sets.map((d, i) =>
                                    <MenuItem eventKey={i} key={i}>
                                        {renderSubCollectionGlyph(d.glyph)}
                                        <span>{d.title}</span>
                                        <Badge style={{marginLeft: '5px', backgroundColor: 'black'}}>{d.tids.length}</Badge>
                                    </MenuItem>
                                )}
                            </DropdownButton>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-remove-from-set">Remove selected trees from the current sub-collection</Tooltip>}>
                                <Button disabled={!selectedTrees.length} onClick={this.props.onRemoveFromSet.bind(null, selectedTrees, this.props.activeSetIndex)}>
                                    <Glyphicon glyph="trash"/><span className="glyph-text">remove selected trees from sub-collection</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-remove-set">Remove the current sub-collection</Tooltip>}>
                                <Button disabled={this.props.activeSetIndex === 0}
                                        onClick={this.props.onRemoveSet.bind(null, this.props.activeSetIndex)}>
                                    <Glyphicon glyph="trash"/><span className="glyph-text">remove sub-collection</span>
                                </Button>
                            </OverlayTrigger>
                        </ButtonGroup>
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
});

export default connect(mapStateToProps, mapDispatchToProps)(GlobalToolkit);
