/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, { Component } from 'react';
import {ButtonToolbar, Badge, Button, DropdownButton, MenuItem} from 'react-bootstrap';
import {connect} from 'react-redux';
import Dotplot from './Dotplot';
import PopupWindow from './PopupWindow';
import {popCreateNewSetWindow, addToSet} from '../actions';

let Overview = props =>
    (<div>
        <div>Overview</div>
        <ButtonToolbar  style={{marginBottom: '5px'}}>
            <Button bsSize="xsmall" onClick={props.onCreate} disabled={!props.hasSelection}>Create new set</Button>
            <DropdownButton bsSize="xsmall" title="Add to set" id="add-to-set"
                            onSelect={props.onAddToSet}
                            disabled={!props.hasSelection || props.sets.length == 0}>
                {props.sets.map((d, i) =>
                    <MenuItem eventKey={i} key={i}>
                        {d.title}
                        <Badge style={{marginLeft: '5px'}}>{d.tids.length}</Badge>
                        <div style={{display: 'inline-block', background: d.color,
                            width: '10px', height: '10px', float: 'right', marginTop: '5px'}}></div>
                    </MenuItem>
                )}
            </DropdownButton>
        </ButtonToolbar>
        <div style={{width: '100%', height: '100%', border: '1px solid black'}}>
            <Dotplot></Dotplot>
        </div>

        <PopupWindow></PopupWindow>
    </div>);

let mapStateToProps = state => ({sets: state.sets,
    hasSelection: state.overview.selectedDots && state.overview.selectedDots.length > 0});
let mapDispatchToProps = dispatch => ({
    onCreate: () => {dispatch(popCreateNewSetWindow())},
    onAddToSet: (idx) => {dispatch(addToSet(idx))}
});


export default connect(mapStateToProps, mapDispatchToProps)(Overview);

