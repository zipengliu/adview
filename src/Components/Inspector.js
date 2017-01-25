/**
 * Created by Zipeng Liu on 2016-12-07.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Modal, Glyphicon, OverlayTrigger, Tooltip, ButtonGroup, Button} from 'react-bootstrap';
import FullDendrogram from './FullDendrogram';
import {toggleInspector, removeTreeFromInspector} from '../actions';

class Inspector extends Component {
    render() {
        return (
            <Modal show={this.props.show} onHide={this.props.onHideInspector}
                   dialogClassName="inspector-window">
                <Modal.Header>
                    <Modal.Title>Tree Inspector</Modal.Title>
                    <div className="close-btn" onClick={this.props.onHideInspector}><Glyphicon glyph="remove"/></div>
                </Modal.Header>

                <Modal.Body>
                    <div className="inspector-container">
                        {this.props.trees.map((t, i) =>
                            <div key={t.id} style={{position: 'relative'}}>
                                <p style={{textAlign: 'center'}}>{this.props.treeNames[i]}</p>
                                <div style={{position: 'absolute', top: '5px', right: '40px'}}>
                                    <ButtonGroup bsSize="xsmall">
                                        <OverlayTrigger placement="top" overlay={<Tooltip id={`inspector-remove-${i}`}>Remove this tree from inspector</Tooltip>}>
                                            <Button onClick={this.props.onRemoveTree.bind(null, t.id)}>
                                                <Glyphicon glyph="trash"/>
                                            </Button>
                                        </OverlayTrigger>
                                    </ButtonGroup>
                                </div>
                                <FullDendrogram key={t.id} tree={t} isStatic={true} />
                            </div>)}
                    </div>
                </Modal.Body>
            </Modal>
        )
    }
}

let mapStateToProps = state => ({
    treeNames: state.inspector.trees.map(t => state.inputGroupData.trees[t.id].name),
    ...state.inspector,
});

let mapDispatchToProps = dispatch => ({
    onHideInspector: () => {dispatch(toggleInspector())},
    onRemoveTree: (tid) => {dispatch(removeTreeFromInspector(tid))}
});

export default connect(mapStateToProps, mapDispatchToProps)(Inspector);