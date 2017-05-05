/**
 * Created by zipeng on 2017-05-04.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {ButtonGroup, Button, DropdownButton, Glyphicon, OverlayTrigger, Tooltip, MenuItem, Badge} from 'react-bootstrap';
import {toggleGlobalToolkit, clearAll, clearSelectedTrees, popCreateNewSetWindow, addToSet, changeReferenceTree,
    removeFromSet, removeSet, compareWithReference, toggleJaccardMissing} from '../actions';
import './GlobalToolkit.css';

class GlobalToolkit extends Component {
    render() {
        let {selectedTrees, cb} = this.props;
        let {show, position} = this.props.globalToolkit;

        return (
            <div id="global-toolkit" className="panel panel-primary"
                 style={{display: show? 'block': 'none', position: 'fixed', ...position}}>
                <div className="panel-heading">
                    <div>Toolkit</div>
                    <div className="close-btn" onClick={this.props.onToggleGlobalToolkit}><Glyphicon glyph="remove"/></div>
                </div>
                <div className="panel-body">
                    <div>
                        <span>Matching monophyly </span>
                        <ButtonGroup bsSize="xsmall">
                            <Button active={cb === 'cb'} onClick={this.props.onChangeCB.bind(null, 'cb')}>with</Button>
                            <Button active={cb === 'cb2'} onClick={this.props.onChangeCB.bind(null, 'cb2')}>without</Button>
                        </ButtonGroup>
                        <span> missing taxa. </span>
                    </div>

                    <ButtonGroup bsSize="xsmall">
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
                        <OverlayTrigger placement="bottom" rootClose overlay={<Tooltip id="tooltip-export-selected-trees">Export the list of selected trees as text file</Tooltip>}>
                            <Button disabled={!selectedTrees.length}>
                                <Glyphicon glyph="" /><span className="glyph-text">export selected trees</span>
                            </Button>
                        </OverlayTrigger>
                    </ButtonGroup>

                    <div></div>

                    <ButtonGroup bsSize="xsmall">
                        <Button onClick={this.props.onCreateNewSet} disabled={!selectedTrees.length}>create new set</Button>
                        <DropdownButton bsSize="xsmall" title="add to set" id="add-to-set"
                                        onSelect={this.props.onAddToSet}
                                        disabled={!selectedTrees.length || this.props.sets.length === 0}>
                            {this.props.sets.map((d, i) =>
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
                        <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-remove-from-set">Remove selected trees from the current set</Tooltip>}>
                            <Button disabled={!selectedTrees.length} onClick={this.props.onRemoveFromSet.bind(null, selectedTrees, this.props.activeSetIndex)}>
                                <Glyphicon glyph="trash"/><span className="glyph-text">remove trees from set</span>
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-remove-set">Remove the current open set</Tooltip>}>
                            <Button disabled={this.props.activeSetIndex === 0}
                                    onClick={this.props.onRemoveSet.bind(null, this.props.activeSetIndex)}>
                                <Glyphicon glyph="trash"/><span className="glyph-text">remove set</span>
                            </Button>
                        </OverlayTrigger>
                    </ButtonGroup>

                    <div></div>

                    <ButtonGroup bsSize="xsmall">
                        <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-ref-tree">Set the selected tree as the reference tree</Tooltip>}>
                            <Button disabled={selectedTrees.length !== 1} onClick={this.props.onChangeReferenceTree.bind(null, this.props.inputGroupId, selectedTrees[0])}>
                                <Glyphicon glyph="tree-conifer"/><span className="glyph-text">set as reference</span>
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-import">Import a reference tree</Tooltip>}>
                            <Button disabled>
                                import a reference tree
                            </Button>
                        </OverlayTrigger>
                    </ButtonGroup>

                    <div></div>


                    <ButtonGroup bsSize="xsmall">
                        <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-compare">Compare tree with the reference tree in detail</Tooltip>}>
                            <Button disabled={selectedTrees.length !== 1|| selectedTrees[0] === this.props.referenceTid}
                                    onClick={this.props.onCompareWithReference.bind(null, selectedTrees[0])}>
                                <Glyphicon glyph="zoom-in" /><span className="glyph-text">compare</span>
                            </Button>
                        </OverlayTrigger>
                    </ButtonGroup>
                </div>
            </div>
        )
    }
};

let mapStateToProps = state => ({
    globalToolkit: state.globalToolkit,
    sets: state.sets,
    selectedTrees: Object.keys(state.selectedTrees),
    inputGroupId: state.inputGroupData.inputGroupId,
    activeSetIndex: state.aggregatedDendrogram.activeSetIndex,
    referenceTid: state.referenceTree.id,
    cb: state.cb,
});

let mapDispatchToProps = dispatch => ({
    onToggleGlobalToolkit: () => {dispatch(toggleGlobalToolkit())},
    onClearAll: () => {dispatch(clearAll())},
    onClearSelectedTrees: () => {dispatch(clearSelectedTrees())},

    onCreateNewSet: () => {dispatch(popCreateNewSetWindow())},
    onAddToSet: (idx) => {dispatch(addToSet(idx))},
    onRemoveFromSet: (tid, setIndex) => {dispatch(removeFromSet(tid, setIndex))},
    onRemoveSet: setIndex => {dispatch(removeSet(setIndex))},

    onChangeReferenceTree: (iid, tid) => {dispatch(changeReferenceTree(iid, tid))},


    onCompareWithReference: (tid) => {dispatch(compareWithReference(tid))},

    onChangeCB: (cb) => {dispatch(toggleJaccardMissing(cb))},
});

export default connect(mapStateToProps, mapDispatchToProps)(GlobalToolkit);
