/**
 * Created by zipeng on 2017-04-13.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Badge, Glyphicon, FormGroup, Checkbox, Button} from 'react-bootstrap';
import {toggleTaxaListCollapse, toggleSelectTaxa} from '../actions';
import './taxa-list.css';

class TaxaList extends Component {
    render() {
        let {collapsed, entities, selected} = this.props;
        let entArr = Object.keys(entities);
        return <div className="view" id="taxa-list" style={{height: collapsed? '40px': '200px'}}>
            <div className="view-header">
                <div className="view-title">Taxa List
                    <Badge style={{marginLeft: '5px'}}>{entArr.length}</Badge>
                    <span style={{marginLeft: '10px', cursor: 'pointer'}} onClick={this.props.onToggleCollapsed}>
                        <Glyphicon glyph={collapsed? 'triangle-top': 'triangle-bottom'}/>
                    </span>
                </div>
                <Button bsSize="xsmall">
                    Expand this monophyly
                </Button>
            </div>
            <div className="view-body">
                <FormGroup>
                    {entArr.map((e, i) =>
                        <div key={i} className="list-item">
                            <Checkbox inline checked={selected[e]} onChange={this.props.onToggleSelectTaxa.bind(null, e)}>{entities[e].name}</Checkbox>
                        </div>)}
                </FormGroup>
            </div>
        </div>
    }

}

let mapStateToProps = (state) => ({
    ...state.taxaList,
    entities: state.inputGroupData.entities,
});

let mapDispatchToProps = dispatch => ({
    onToggleCollapsed: () => {dispatch(toggleTaxaListCollapse())},
    onToggleSelectTaxa: e => {dispatch(toggleSelectTaxa(e))}
});

export default connect(mapStateToProps, mapDispatchToProps)(TaxaList);

