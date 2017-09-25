/**
 * Created by zipeng on 2017-05-23.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import Draggable from 'react-draggable';
import {Button, Glyphicon} from 'react-bootstrap';
import {histogram, scaleLinear} from 'd3';
import {toggleMoveHandle, moveControlHandle, changeActiveRangeSelection, changeSelectionRange,
    toggleRefAttributeExplorer, togglePopAttributeExplorer} from '../actions';
import Histogram from './HistogramSlider';


class ReferenceTreeAttributeExplorer extends Component {
    render() {
        let {charts, data, spec, selectionColor} = this.props;
        let panel = (
            <div id="reference-tree-attribute-explorer" className="panel panel-default"
                 style={{display: charts.show? 'block': 'none', position: charts.float? 'fixed': 'relative'}}>
                {charts.float &&
                <div className="view-header panel-heading" style={{cursor: 'move'}}>
                    <div className="view-title">
                        Reference Tree Branch Attributes
                        <div className="close-btn">
                            <Glyphicon onClick={this.props.togglePopAE} glyph="minus" />
                            <Glyphicon onClick={this.props.toggleAE} glyph="remove" />
                        </div>
                    </div>
                </div>}
                <div className="panel-body" style={{position: 'relative'}}>
                    {!charts.float && <div style={{cursor: 'pointer', position: 'absolute', right: '5px', top: '5px', fontWeight: 'normal', color: 'grey'}}>
                        <Glyphicon glyph="modal-window" onClick={this.props.togglePopAE} />
                        <Glyphicon glyph="remove" onClick={this.props.toggleAE} />
                    </div>}
                    <div style={{display: 'flex'}}>
                        {charts.attributes.map((a, i) =>
                            <div key={i} style={{margin: '0px 10px'}}>
                                <div>
                                    <Histogram foregroundBins={data[i]} attributeName={a.displayName} selectionId={i}
                                               selection={i === charts.activeSelectionId? charts.selection[i]: null}
                                               toggleMoveHandle={this.props.toggleMoveHandle}
                                               moveControlHandle={this.props.moveControlHandle}
                                               changeSelectionRange={this.props.onChangeSelectionRange}
                                               spec={spec}
                                               selectionColor={selectionColor}
                                    />
                                </div>
                                <Button bsSize="xsmall" style={{}}
                                        onClick={this.props.onChangeActiveRangeSelection.bind(null, charts.activeSelectionId === i? null: i)}>
                                    {charts.activeSelectionId === i? 'deactivate range selection': 'activate range selection'}
                                </Button>

                            </div>)}
                    </div>
                </div>
            </div>
        );
        if (charts.float) {
            return (<Draggable
                axis="both"
                defaultPosition={{x: charts.floatPosition.left, y: charts.floatPosition.top}}
                handle="#reference-tree-attribute-explorer .panel-heading"
                bounds="body"
            >
                {panel}
            </Draggable>)
        } else {
            return panel
        }
    }
}

let getBinsFromArray = values => {
    let hist = histogram().domain([0, 1]).thresholds(scaleLinear().ticks(20));
    return hist(values);
};

let getAttributeValues = (tree, attrName) => {
    let values = [];
    for (let bid in tree.branches) if (tree.branches.hasOwnProperty(bid)) {
        let b = tree.branches[bid];
        if (!b.isLeaf && bid !== tree.rootBranch && tree.branches[tree.rootBranch].left !== bid) {    // non-trivial bipartition
            values.push(b[attrName]);
        }
    }
    return values;
};

let getReferenceTreeHistograms = createSelector(
    [state => state.inputGroupData.referenceTree, state => state.referenceTree.charts.attributes],
    (referenceTree, attributes) => {
        return attributes.map(a => getBinsFromArray(getAttributeValues(referenceTree, a.propertyName)));
    }
);

let mapStateToProps = state => ({
    charts: state.referenceTree.charts,
    data: getReferenceTreeHistograms(state),
    spec: state.attributeChartSpec,
    selectionColor: state.branchRangeSelectionColor,
});

let mapDispatchToProps = dispatch => ({
    toggleMoveHandle: (h) => {dispatch(toggleMoveHandle(h, true))},
    moveControlHandle: (v) => {dispatch(moveControlHandle(v, true))},
    onChangeActiveRangeSelection: (id) => {dispatch(changeActiveRangeSelection(id, true))},
    onChangeSelectionRange: (l, r, c) => {dispatch(changeSelectionRange(l, r, c, true))},
    toggleAE: () => {dispatch(toggleRefAttributeExplorer())},
    togglePopAE: () => {dispatch(togglePopAttributeExplorer())},
});


export default connect(mapStateToProps, mapDispatchToProps)(ReferenceTreeAttributeExplorer);

