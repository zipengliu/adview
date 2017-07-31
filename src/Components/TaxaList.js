/**
 * Created by zipeng on 2017-04-13.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import Draggable from 'react-draggable';
import {Badge, Glyphicon} from 'react-bootstrap';
import {toggleSelectTaxa, toggleHighlightDuplicate, toggleTaxaList} from '../actions';

class TaxaList extends Component {
    render() {
        let {entities, show, position} = this.props;
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
                    <div className="view-header panel-heading" style={{position: 'relative', cursor: 'move'}}>
                        <div className="view-title">Taxa List
                            <Badge style={{marginLeft: '5px'}}>{entArr.length}</Badge>
                            <div className="close-btn" onClick={this.props.onToggleTaxaList}><Glyphicon glyph="remove"/></div>
                        </div>
                    </div>

                    <div className="view-body panel-body" style={{maxHeight: '300px'}}>
                        {entArr.map((e, i) =>
                            <div key={i} className="list-item"
                                 onMouseEnter={this.props.onHighlightDup.bind(null, e)}
                                 onMouseLeave={this.props.onHighlightDup.bind(null, null)}
                            >
                                {entities[e].name}
                            </div>)}
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

