/**
 * Created by Zipeng Liu on 2016-11-10.
 */

import React, { Component } from 'react';
import {Button, Modal, FormGroup, FormControl, ControlLabel, HelpBlock} from 'react-bootstrap';
import {connect} from 'react-redux';
import {closeCreateNewSetWindow, typingTitle, createNewSet} from '../actions';

class PopupWindow extends Component {
    render() {
        return (
            <Modal show={this.props.showWindow} onHide={this.props.onHide}>
                <Modal.Header>
                    <Modal.Title>Creating New Set</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <form>
                        <FormGroup controlId="create-new-set-form">
                            <ControlLabel>Set title:</ControlLabel>
                            <FormControl type="text" value={this.props.title} placeholder={this.props.placeholder}
                            onChange={this.props.onChange}/>
                        </FormGroup>
                        <HelpBlock>Number of trees selected: {this.props.numTrees}</HelpBlock>
                    </form>
                </Modal.Body>

                <Modal.Footer>
                    <Button onClick={this.props.onHide}>Cancel</Button>
                    <Button onClick={this.props.onSubmit}>Confirm</Button>

                </Modal.Footer>
            </Modal>
        )
    }
}

function mapStateToProps(state) {
    return {
        showWindow: state.overview.createWindow,
        sets: state.sets,
        title: state.overview.currentTitle,
        placeholder: 'Enter set title',
        numTrees: state.overview.selectedDots.length
    }
}

function mapDispatchToProps(dispatch) {
    return {
        onHide: () => {dispatch(closeCreateNewSetWindow())},
        onChange: (e) => {dispatch(typingTitle(e.target.value))},
        onSubmit: () => {dispatch(createNewSet())}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(PopupWindow);
