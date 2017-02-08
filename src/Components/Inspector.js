/**
 * Created by Zipeng Liu on 2016-12-07.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Modal, Glyphicon, OverlayTrigger, Tooltip, Button} from 'react-bootstrap';
import FullDendrogram from './FullDendrogram';
import {toggleInspector, removeTreeFromInspector, togglePairwiseComparison} from '../actions';

class Inspector extends Component {
    render() {
        let {pairwiseComparison, highlight} = this.props;
        return (
            <Modal show={this.props.show} onHide={this.props.onHideInspector}
                   dialogClassName="inspector-window">
                <Modal.Header>
                    <Modal.Title>Tree Inspector</Modal.Title>
                    <div className="close-btn" onClick={this.props.onHideInspector}><Glyphicon glyph="remove"/></div>
                </Modal.Header>

                <Modal.Body>
                    <div className="inspector-container">
                        {this.props.tids.map((t, i) =>
                            <div className="view" key={i}>
                                <div className="view-header">
                                    <div style={{textAlign: 'center'}}>
                                        {this.props.treeNames[i]}
                                    </div>
                                    <div style={{marginBottom: '5px'}}>
                                        <OverlayTrigger placement="top" overlay={<Tooltip id={`inspector-remove-${i}`}>Remove this tree from inspector</Tooltip>}>
                                            <Button bsSize="xsmall" style={{marginLeft: '20px'}} onClick={this.props.onRemoveTree.bind(null, t)}>
                                                <Glyphicon glyph="trash"/>
                                            </Button>
                                        </OverlayTrigger>

                                        {i < this.props.tids.length - 1 &&
                                        <OverlayTrigger placement="top" overlay={<Tooltip id={`inspector-remove-${i}`}>Remove this tree from inspector</Tooltip>}>
                                            <Button bsSize="xsmall" style={{float: 'right'}} bsStyle={pairwiseComparison === i? 'primary': 'default'}
                                                    onClick={this.props.onTogglePairwiseComparison.bind(null, pairwiseComparison === i? null: i)}>
                                                <Glyphicon glyph="triangle-left"/>
                                                <span>Compare</span>
                                                <Glyphicon glyph="triangle-right"/>
                                            </Button>
                                        </OverlayTrigger>
                                        }
                                    </div>
                                </div>
                                <div className="view-body">
                                    <FullDendrogram tid={t} isStatic={true}
                                                    isComparing={pairwiseComparison === i ||  pairwiseComparison + 1 === i}
                                                    comparingMonophyly={(highlight.direction === 'lr' && pairwiseComparison === i) || (highlight.direction === 'rl' && pairwiseComparison + 1 === i)? highlight.monophyly: null}
                                                    comparingEntities={(highlight.direction === 'rl' && pairwiseComparison === i) || (highlight.direction === 'lr' && pairwiseComparison + 1 === i)? highlight.entities: null}
                                                    alignToSide={pairwiseComparison == null? null:
                                                        (pairwiseComparison + 1 === i? 'left': (pairwiseComparison === i? 'right': null))} />
                                </div>
                            </div>)}
                    </div>
                </Modal.Body>
            </Modal>
        )
    }
}

let mapStateToProps = state => ({
    treeNames: state.inspector.tids.map(t => state.inputGroupData.trees[t].name),
    ...state.inspector,
});

let mapDispatchToProps = dispatch => ({
    onHideInspector: () => {dispatch(toggleInspector())},
    onRemoveTree: (tid) => {dispatch(removeTreeFromInspector(tid))},
    onTogglePairwiseComparison: (p) => {dispatch(togglePairwiseComparison(p))}
});

export default connect(mapStateToProps, mapDispatchToProps)(Inspector);