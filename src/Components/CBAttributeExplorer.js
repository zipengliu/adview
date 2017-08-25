/**
 * Created by Zipeng Liu on 2016-12-20.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import cn from 'classnames';
import {Button, DropdownButton, MenuItem, Clearfix, Glyphicon, Table} from 'react-bootstrap';
import {histogram, scaleLinear} from 'd3';
import {toggleMoveHandle, moveControlHandle, changeActiveExpandedBranch,
    changeActiveRangeSelection, changeSelectionRange, changeActiveCollection, toggleCBAECollapse} from '../actions';
import Histogram from './HistogramSlider';
import LineChart from './LineChart';

import './AttributeExplorer.css';

class CBAttributeExplorer extends Component {
    render() {
        let {expanded, data, attributes, activeSelectionId, activeExpandedBid, activeSetId, sets, collapsed, activeTreeCBInfo} = this.props;
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
            <div id="cb-attribute-explorer" className={cn("view panel panel-default", {'panel-collapsed': collapsed})}>

                <div className="view-header panel-heading">
                    <div className="view-title">Corresponding Br. Attr.
                        <span style={{marginLeft: '10px', cursor: 'pointer', float: 'right'}} onClick={this.props.onToggleCollapsed}>
                        <Glyphicon glyph={collapsed? 'th-list': 'minus'}/>
                        </span>
                    </div>
                    {/*<FormGroup style={{textAlign: 'center'}}>*/}
                    {/*<span style={{marginRight: '2px'}}>as</span>*/}
                    {/*<Radio inline checked={shownAsHistogram} onChange={this.props.toggleHistogram.bind(null, true)}>histogram</Radio>*/}
                    {/*<Radio inline checked={!shownAsHistogram} onChange={this.props.toggleHistogram.bind(null, false)}>CDF</Radio>*/}
                    {/*</FormGroup>*/}
                </div>

                <div className="view-body panel-body">
                    {activeExpandedBid &&
                    <div>
                        {activeTreeCBInfo.length > 0 &&
                        <div>
                            <div>Tree {this.props.isActiveHovered? 'hovered': 'selected'}: {this.props.activeTreeName}</div>
                            <Table condensed>
                                <thead>
                                <tr>
                                    <th>corr.br.</th>
                                    <th>exact?</th>
                                    {activeTreeCBInfo[0].support >= 0 && <th>support</th>}
                                    <th>similarity</th>
                                </tr>
                                </thead>
                                <tbody>
                                {activeTreeCBInfo.map((v, i) => <tr key={i}>
                                    <td style={{color: 'red'}}>{v.no}</td>
                                    <td><Glyphicon glyph={v.isExact? 'ok': 'remove'} /></td>
                                    <td>{v.similarity.toFixed(1)}</td>
                                    {v.support >= 0 && <td>{v.support.toFixed(1)}</td>}
                                </tr>)}
                                </tbody>
                            </Table>
                        </div>
                        }

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


                        <Clearfix/>
                        <div className="legend" style={{marginTop: '5px'}}>
                            <div className="legend-item">
                                <div style={{display: 'inline-block', margin: '0 2px', height: '16px', width: '5px', background: 'grey'}}></div>
                                <span>trees in chosen collection</span>
                            </div>
                            <div className="legend-item">
                                <div style={{display: 'inline-block', margin: '0 2px', height: '16px', width: '5px', background: 'black'}}></div>
                                <span>trees with exact match</span>
                            </div>
                        </div>
                    </div>
                    }
                    {!activeExpandedBid && <p>No branch of interest yet.</p>}
                </div>
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
    let activeTreeCBInfo = [];
    let t = Object.keys(state.hoveredTrees);
    let t2 = Object.keys(state.selectedTrees);
    let activeTreeName, isActiveHovered;
    if (t.length === 1 || (t.length === 0 && t2.length === 1)) {
        let tid = t.length === 1? t[0]: t2[0];
        isActiveHovered = t.length === 1;
        let {expanded} = state.referenceTree;
        let {referenceTree, trees} = state.inputGroupData;
        let {cb} = state;
        activeTreeName = trees[tid].name;

        for (let rBid in expanded) if (expanded.hasOwnProperty(rBid)) {
            let corr = referenceTree.branches[rBid][cb];
            if (corr.hasOwnProperty(tid) && corr[tid].bid) {
                activeTreeCBInfo.push({no: expanded[rBid], isExact: corr[tid].jac === 1.0, similarity: corr[tid].jac});
                if (trees[tid].branches[corr[tid].bid].support) {
                    activeTreeCBInfo[activeTreeCBInfo.length - 1].support = trees[tid].branches[corr[tid].bid].support;
                }
            }
        }
    }

    return {
        ...state.cbAttributeExplorer,
        expanded: state.referenceTree.expanded,
        spec: state.attributeChartSpec,
        data,
        activeTreeCBInfo,
        activeTreeName,
        isActiveHovered,
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
    onToggleCollapsed: () => {dispatch(toggleCBAECollapse())},
});

export default connect(mapStateToProps, mapDispatchToProps)(CBAttributeExplorer);


