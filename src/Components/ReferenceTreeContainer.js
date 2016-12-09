/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {ButtonGroup, Button, OverlayTrigger, Tooltip, Glyphicon} from 'react-bootstrap';
import FullDendrogram from './FullDendrogram';
import {clearBranchSelection, toggleExploreMode} from '../actions';

let ReferenceTreeContainer = props => (<div style={{height: '100%', position: 'relative'}}>
    <p>Reference Tree: {props.title}</p>
    <div style={{height: '100%'}}>
        <FullDendrogram />
    </div>
    <div style={{position: 'absolute', right: '10px', top: 0}}>
        <ButtonGroup bsSize="xsmall">
            <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-explore">
                Enter explore mode (select a branch below to explore distribution in the aggregated dendrograms)
            </Tooltip>}>
                <Button active={props.exploreMode} onClick={props.onToggleExploreMode}>
                    <Glyphicon glyph="screenshot" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-rearrange">Rearrange the overview based on branch selections</Tooltip>}>
                <Button>
                    <Glyphicon glyph="knight" />
                </Button>
            </OverlayTrigger>
            <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-clear-selection">Clear all branch selections</Tooltip>}>
                <Button onClick={props.clearSelection}>
                    <Glyphicon glyph="refresh" />
                </Button>
            </OverlayTrigger>
        </ButtonGroup>
    </div>
</div>);

let mapStateToProps = state => ({
    title: state.inputGroupData.trees[state.referenceTree.id].name,
    exploreMode: state.referenceTree.exploreMode
});
let mapDispatchToProps = dispatch => ({
    clearSelection: () => {dispatch(clearBranchSelection())},
    onToggleExploreMode: () => {dispatch(toggleExploreMode())}
});

export default connect(mapStateToProps, mapDispatchToProps)(ReferenceTreeContainer);