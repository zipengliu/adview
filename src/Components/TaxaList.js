/**
 * Created by zipeng on 2017-04-13.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import Draggable from 'react-draggable';
import {Badge, Glyphicon, FormGroup, Checkbox, Button} from 'react-bootstrap';
import {toggleSelectTaxa, toggleHighlightDuplicate, toggleTaxaList} from '../actions';
import './taxa-list.css';

class TaxaList extends Component {
    render() {
        let {entities, selected, show, position} = this.props;
        let entArr = Object.keys(entities).sort((a ,b) => {
            if (entities[a].name > entities[b].name) return 1;
            if (entities[a].name < entities[b].name) return -1;
            return 0;
        });
        return (
            <Draggable
                axis="both"
                defaultPosition={{x: position.left, y: position.top}}
                handle="#taxa-list .panel-heading"
                bounds="body"
            >
                <div className="view panel panel-default" id="taxa-list" style={{display: show? 'block': 'none', position: 'absolute'}}>
                    <div className="view-header panel-heading">
                        <div className="view-title">Taxa List
                            <Badge style={{marginLeft: '5px'}}>{entArr.length}</Badge>
                            <div className="close-btn" onClick={this.props.onToggleTaxaList}><Glyphicon glyph="remove"/></div>
                        </div>
                    </div>

                    <div className="view-body panel-body" style={{flex: 'initial', maxHeight: '300px'}}>
                        <Button bsSize="xsmall">
                            Expand this monophyly
                        </Button>
                        <FormGroup>
                            {entArr.map((e, i) =>
                                <div key={i} className="list-item"
                                     onMouseEnter={this.props.onHighlightDup.bind(null, e)}
                                     onMouseLeave={this.props.onHighlightDup.bind(null, null)}
                                >
                                    <Checkbox inline checked={selected[e]} onChange={this.props.onToggleSelectTaxa.bind(null, e)}>{entities[e].name}</Checkbox>
                                </div>)}
                        </FormGroup>
                    </div>
                </div>
            </Draggable>);
    }

}

let mapStateToProps = (state) => ({
    ...state.taxaList,
    entities: state.inputGroupData.entities,
});

let mapDispatchToProps = dispatch => ({
    onToggleSelectTaxa: e => {dispatch(toggleSelectTaxa(e))},
    onHighlightDup: eid => {dispatch(toggleHighlightDuplicate(eid))},
    onToggleTaxaList: () => {dispatch(toggleTaxaList())}
});

export default connect(mapStateToProps, mapDispatchToProps)(TaxaList);

