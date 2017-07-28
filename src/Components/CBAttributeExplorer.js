/**
 * Created by Zipeng Liu on 2016-12-20.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {Button, DropdownButton, MenuItem} from 'react-bootstrap';
import {histogram, scaleLinear} from 'd3';
import {toggleMoveHandle, moveControlHandle, changeActiveExpandedBranch,
    changeActiveRangeSelection, changeSelectionRange, changeActiveCollection} from '../actions';
import Histogram from './HistogramSlider';
import LineChart from './LineChart';

import './AttributeExplorer.css';

class CBAttributeExplorer extends Component {
    render() {
        let {expanded, data, attributes, activeSelectionId, activeExpandedBid, activeSetId, sets} = this.props;
        let shownAsHistogram = true;

        let renderChart = (data, foregroundData=null, att, id) => shownAsHistogram?
            (<Histogram foregroundBins={foregroundData} backgroundBins={data} attributeName={att}
                        selectionId={id}
                        selection={id === activeSelectionId? this.props.selection[id]: null}
                        toggleMoveHandle={this.props.toggleMoveHandle}
                        moveControlHandle={this.props.moveControlHandle}
                        changeSelectionRange={this.props.onChangeSelectionRange}
                        spec={this.props.spec} />):
            (<LineChart data={data} attributeName={att}
                        selectionId={id}
                        selection={id === activeSelectionId? this.props.selection[id]: null}
                        toggleMoveHandle={this.props.toggleMoveHandle}
                        moveControlHandle={this.props.moveControlHandle}
                        spec={this.props.spec} />);

        let getSelectionButton = (id, disabled) =>
            <Button bsSize="xsmall" disabled={disabled} style={{float: 'right'}}
                    onClick={this.props.onChangeActiveRangeSelection.bind(null, activeSelectionId === id? null: id)}>
                {activeSelectionId === id? 'deactivate range selection': 'activate range selection'}
            </Button>;

        return (
            <div id="cb-attribute-explorer" className="view panel panel-default">

                <div className="view-header panel-heading">
                    <div className="view-title">Corresponding Branch Attributes</div>
                    {/*<FormGroup style={{textAlign: 'center'}}>*/}
                        {/*<span style={{marginRight: '2px'}}>as</span>*/}
                        {/*<Radio inline checked={shownAsHistogram} onChange={this.props.toggleHistogram.bind(null, true)}>histogram</Radio>*/}
                        {/*<Radio inline checked={!shownAsHistogram} onChange={this.props.toggleHistogram.bind(null, false)}>CDF</Radio>*/}
                    {/*</FormGroup>*/}
                </div>

                {activeExpandedBid &&
                <div className="view-body panel-body">

                    <div>
                        <span>For tree collection</span>
                        <DropdownButton bsSize="xsmall" pullRight id="cb-ae-select-col" title={sets[activeSetId].title}
                                        style={{marginLeft: '5px'}}
                                        onSelect={this.props.onChangeActiveCollection}>
                            {sets.map((s, i) =>
                                <MenuItem key={i} eventKey={i}>{s.title}</MenuItem>)}
                        </DropdownButton>
                    </div>
                    <div>
                        <span>For reference tree branch</span>
                        <DropdownButton bsSize="xsmall" pullRight id="cb-ae-select-branch" title={expanded[activeExpandedBid]}
                                        style={{marginLeft: '5px'}}
                                        onSelect={this.props.onChangeActiveExpandedBranch}>
                            {Object.keys(expanded).map(bid =>
                                <MenuItem key={bid} eventKey={bid}>{expanded[bid]}</MenuItem>)}
                        </DropdownButton>
                    </div>

                    {data.bins.map((d, i) => <div key={i}>
                        {renderChart(d, data.binsForExact[i], attributes[i].displayName, i)}
                        {getSelectionButton(i, false)}
                    </div>)}

                    {/*<Button bsSize="xsmall" style={{width: '90%', marginTop: '20px'}}>Create customized chart</Button>*/}

                    {/*<OverlayTrigger placement="right" overlay={<Tooltip id="corr-desc">branches that correspond to the last selected one on the reference tree </Tooltip>}>*/}
                        {/*<div className="attribute-heading">&diams; Corresponding branches to*/}
                            {/*{referenceTree.checkingBranch? ' hovered reference branch':*/}
                                {/*(referenceTree.selected.length? ` branch ${referenceTree.selected.length}`: ' none')}</div>*/}
                    {/*</OverlayTrigger>*/}
                    {/*<div style={{marginLeft: '18px'}}>*/}
                        {/*<ButtonGroup bsSize="xsmall">*/}
                            {/*<OverlayTrigger placement="top" overlay={<Tooltip id="att-corr-all-trees">*/}
                                {/*Show distribution of attributes of corresponding branches from all trees in this dataset.</Tooltip>}>*/}
                                {/*<Button active={modes.corr.scope === 'all'} onClick={onChangeMode.bind(null, 'corr', 'all', null)}>all trees</Button>*/}
                            {/*</OverlayTrigger>*/}
                            {/*<OverlayTrigger placement="top" overlay={<Tooltip id="att-corr-current-set">*/}
                                {/*Show distribution of attributes of corresponding branches from trees of the current subset.</Tooltip>}>*/}
                                {/*<Button active={modes.corr.scope === 'set'}*/}
                                        {/*onClick={onChangeMode.bind(null, 'corr', 'set', null)}>cur. set</Button>*/}
                            {/*</OverlayTrigger>*/}
                        {/*</ButtonGroup>*/}
                        {/*<FormGroup>*/}
                            {/*<OverlayTrigger placement="right" overlay={<Tooltip id="att-corr-in-context">*/}
                                {/*Show the global distribution as background and partial one as foreground</Tooltip>}>*/}
                                {/*<Radio inline disabled={modes.corr.scope === 'all' || !shownAsHistogram} checked={modes.corr.context}*/}
                                       {/*onChange={onChangeMode.bind(null, 'corr', null, !modes.corr.context)}>show in context</Radio>*/}
                            {/*</OverlayTrigger>*/}
                        {/*</FormGroup>*/}

                        {/*{withSupport && renderChart(data.corr[attrName].fg, data.corr[attrName].bg, attrName, 1)}*/}
                        {/*{withSupport && getSelectionButton(1, !data.corr[attrName].fg && !data.corr[attrName].bg)}*/}

                        {/*{renderChart(data.corr.similarity.fg, data.corr.similarity.bg, 'similarity', 2)}*/}
                        {/*{getSelectionButton(2, !data.corr.similarity.fg && !data.corr.similarity.bg)}*/}

                    {/*</div>*/}

                </div>
                }
            </div>
        )
    }
}


let getBinsFromArray = values => {
    let hist = histogram().domain([0, 1]).thresholds(scaleLinear().ticks(20));
    return hist(values);
};

let getCBHistograms = createSelector(
    [state => state.cbAttributeExplorer.activeExpandedBid,
    state => state.inputGroupData.referenceTree,
    state => state.inputGroupData.trees,
    state => state.sets[state.cbAttributeExplorer.activeSetId],
    state => state.cbAttributeExplorer.attributes,
    state => state.cb],
    (bid, referenceTree, trees, activeSet, attributes, cb) => {
        if (!bid) return null;
        let values = [];
        let valuesForExact = [];
        for (let i = 0; i < attributes.length; i++) {
            values.push([]);
            valuesForExact.push([]);
        }
        for (let i = 0; i < activeSet.tids.length; i++) {
        // for (let tid in trees) if (trees.hasOwnProperty(tid)) {
            let tid = activeSet.tids[i];
            let corr = referenceTree.branches[bid][cb];
            if (corr.hasOwnProperty(tid) && corr[tid].bid) {
                for (let i = 0; i < attributes.length; i++) {
                    let v;
                    if (attributes[i].propertyName === 'similarity') {
                        v = corr[tid].jac;
                    } else {
                        v = trees[tid].branches[corr[tid].bid][attributes[i].propertyName];
                    }
                    values[i].push(v);
                    if (corr[tid].jac === 1.0) {
                        valuesForExact[i].push(v);
                    }
                }
            }
        }
        return {
            bins: values.map(v => getBinsFromArray(v)),
            binsForExact: valuesForExact.map(v => getBinsFromArray(v))
        };
    }
);

let mapStateToProps = state => {
    let data = getCBHistograms(state);

    return {
        ...state.cbAttributeExplorer,
        expanded: state.referenceTree.expanded,
        spec: state.attributeChartSpec,
        data,
        sets: state.sets,
    };
};

let mapDispatchToProps = dispatch => ({
    toggleMoveHandle: (h) => {dispatch(toggleMoveHandle(h))},
    moveControlHandle: (v) => {dispatch(moveControlHandle(v))},
    onChangeActiveRangeSelection: (id) => {dispatch(changeActiveRangeSelection(id))},
    onChangeSelectionRange: (l, r, c) => {dispatch(changeSelectionRange(l, r, c))},
    onChangeActiveExpandedBranch: (bid) => {dispatch(changeActiveExpandedBranch(bid))},
    onChangeActiveCollection: (index) => {dispatch(changeActiveCollection(index))},
});

export default connect(mapStateToProps, mapDispatchToProps)(CBAttributeExplorer);


