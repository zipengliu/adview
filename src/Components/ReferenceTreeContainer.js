/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import Dimensions from 'react-dimensions';
import {ButtonGroup, Button, OverlayTrigger, Tooltip, Glyphicon} from 'react-bootstrap';
import FullDendrogram from './FullDendrogram';
import {clearBranchSelection} from '../actions';

class DimensionContainer extends Component {
    render() {
        return <FullDendrogram width={this.props.containerWidth} height={this.props.containerHeight} />
    }
}

let RefTree = Dimensions()(DimensionContainer);


let ReferenceTreeContainer = props => (<div style={{height: '100%', position: 'relative'}}>
    <p>Reference Tree: {props.title}</p>
    <div style={{height: '100%'}}>
        <RefTree />
    </div>
    <div style={{position: 'absolute', right: '10px', top: 0}}>
        <ButtonGroup bsSize="small">
            <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-clear-selection">Clear all branch selections</Tooltip>}>
                <Button onClick={props.clearSelection}>
                    <Glyphicon glyph="refresh" />
                </Button>
            </OverlayTrigger>
        </ButtonGroup>
    </div>
</div>);

let mapStateToProps = state => ({title: state.inputGroupData.trees[state.referenceTree.id].name});
let mapDispatchToProps = dispatch => ({
    clearSelection: () => {dispatch(clearBranchSelection())}
})

export default connect(mapStateToProps, mapDispatchToProps)(ReferenceTreeContainer);