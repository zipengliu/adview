/**
 * Created by zipeng on 2017-04-13.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import cn from 'classnames';
import {Badge, Glyphicon, FormGroup, Checkbox, Button, Clearfix} from 'react-bootstrap';
import {toggleTaxaListCollapse, toggleSelectTaxa, toggleHighlightDuplicate} from '../actions';
import './taxa-list.css';

class TaxaList extends Component {
    render() {
        let {collapsed, entities, selected} = this.props;
        let entArr = Object.keys(entities).sort((a ,b) => {
            if (entities[a].name > entities[b].name) return 1;
            if (entities[a].name < entities[b].name) return -1;
            return 0;
        });
        return <div className={cn("view panel panel-default", {'panel-collapsed': collapsed})} id="taxa-list">
            <div className="view-header panel-heading">
                <div className="view-title">Taxa List
                    <Badge style={{marginLeft: '5px'}}>{entArr.length}</Badge>
                    <span style={{marginLeft: '10px', cursor: 'pointer', float: 'right'}} onClick={this.props.onToggleCollapsed}>
                        <Glyphicon glyph={collapsed? 'triangle-top': 'triangle-bottom'}/>
                    </span>
                </div>
                {/*<Button bsSize="xsmall">*/}
                    {/*Expand this monophyly*/}
                {/*</Button>*/}
            </div>

            <div className="view-body panel-body">
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
    }

}

let mapStateToProps = (state) => ({
    ...state.taxaList,
    entities: state.inputGroupData.entities,
});

let mapDispatchToProps = dispatch => ({
    onToggleCollapsed: () => {dispatch(toggleTaxaListCollapse())},
    onToggleSelectTaxa: e => {dispatch(toggleSelectTaxa(e))},
    onHighlightDup: eid => {dispatch(toggleHighlightDuplicate(eid))},
});

export default connect(mapStateToProps, mapDispatchToProps)(TaxaList);

