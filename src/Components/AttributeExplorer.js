/**
 * Created by Zipeng Liu on 2016-12-20.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {DropdownButton, MenuItem} from 'react-bootstrap';
import {histogram, scaleLinear} from 'd3';
import {changeAttributeExplorerMode} from '../actions';
import {toggleMoveHandle, moveControlHandle} from '../actions';
import Histogram from './HistogramSlider';
import LineChart from './LineChart';

import './AttributeExplorer.css';

class AttributeExplorer extends Component {
    render() {
        let {currentModeId, modes, bins, globalBins} = this.props;
        return (
            <div id="attribute-explorer" style={{position: 'relative'}}>
                <div style={{textAlign: 'left', paddingLeft: '8px', paddingTop: '5px'}}>Attribute Explorer</div>
                <DropdownButton bsSize="xsmall"
                                title={modes[currentModeId]} id="att-mode"
                                onSelect={this.props.onChangeMode}>
                    {modes.map((m, i) => <MenuItem key={i} eventKey={i}>{m}</MenuItem>)}
                </DropdownButton>

                <div>
                    {(bins != null || globalBins != null) &&
                    Object.keys(bins? bins: globalBins)
                        .map((attrName, i) => <Histogram key={i} foregroundBins={bins? bins[attrName]: null}
                                                         backgroundBins={globalBins? globalBins[attrName]: null}
                                                         attributeName={attrName}
                                                         selectedRange={this.props.selectedRange[attrName]}
                                                         isMovingHandle={this.props.controllingAttribute === attrName}
                                                         toggleMoveHandle={this.props.toggleMoveHandle}
                                                         moveControlHandle={this.props.moveControlHandle}
                                                         spec={this.props.spec} />)
                    }
                </div>
                <div>
                    {modes[currentModeId].indexOf('counterpart') !== -1 && this.props.jaccardArray &&
                    <LineChart spec={this.props.spec} data={this.props.jaccardArray}/>
                    }
                </div>

            </div>
        )
    }
}


let getBins = values => {
    let hist = histogram().domain([0, 1]).thresholds(scaleLinear().ticks(20));
    let bins = {};
    for (let key in values) if (values.hasOwnProperty(key)) {
        bins[key] = hist(values[key]);
    }
    return bins;
};

let getGlobalBins = createSelector(
    [state => state.inputGroupData.trees, (_, attrNames) => attrNames],
    (trees, attrNames) => {
        let values = attrNames.reduce((acc, a) => {acc[a] = []; return acc}, {});
        for (let i in trees) if (trees.hasOwnProperty(i)) {
            let t = trees[i];
            for (let j in t.branches) if (t.branches.hasOwnProperty(j)) {
                for (let k = 0; k < attrNames.length; k++) {
                    values[attrNames[k]].push(t.branches[j][attrNames[k]]);
                }
            }
        }
        return getBins(values);
    }
);

let getSetWiseBins = createSelector(
    [state => state.inputGroupData.trees, (_, attrNames) => attrNames,
        state => state.sets[state.aggregatedDendrogram.activeSetIndex]],
    (trees, attrNames, set) => {
        let values = attrNames.reduce((acc, a) => {acc[a] = []; return acc}, {});
        for (let i = 0; i < set.tids.length; i++) {
            let t = trees[set.tids[i]];
            for (let j in t.branches) if (t.branches.hasOwnProperty(j)) {
                for (let k = 0; k < attrNames.length; k++) {
                    values[attrNames[k]].push(t.branches[j][attrNames[k]]);
                }
            }
        }
        return getBins(values);
    }
);

let getTreeWiseBins = createSelector(
    [state => state.inputGroupData.trees[state.aggregatedDendrogram.activeTreeId || state.referenceTree.id],
        (_, attrNames) => attrNames],
    (tree, attrNames) => {
        let values = attrNames.reduce((acc, a) => {acc[a] = []; return acc}, {});
        for (let j in tree.branches) if (tree.branches.hasOwnProperty(j)) {
            for (let k = 0; k < attrNames.length; k++) {
                values[attrNames[k]].push(tree.branches[j][attrNames[k]]);
            }
        }
        return getBins(values);
    }
);

let getBranchWiseBins = createSelector(
    [state => state.inputGroupData.trees, (_, attrNames) => attrNames,
        state => state.referenceTree.id, state => state.referenceTree.highlightMonophyly,
        (state, _, isSetWise) => isSetWise? state.sets[state.aggregatedDendrogram.activeSetIndex]: null],
    (trees, attrNames, referenceTreeId, highlightMonophyly, set) => {
        if (highlightMonophyly == null) return null;
        let values = attrNames.reduce((acc, a) => {acc[a] = []; return acc}, {});
        let b = trees[referenceTreeId].branches[highlightMonophyly];
        let corr = b.correspondingBranches;
        for (let k = 0; k < attrNames.length; k++) {
            values[attrNames[k]].push(b[attrNames[k]]);
        }
        for (let tid in corr)
            if (corr.hasOwnProperty(tid) && (!set || (set && set.tids.indexOf(tid)!== -1))) {
                let bid = corr[tid].branchId;
                for (let k = 0; k < attrNames.length; k++) {
                    values[attrNames[k]].push(trees[tid].branches[bid][attrNames[k]]);
                }
            }
        return getBins(values);
    }
);

let getGlobalJaccardArray = createSelector(
    [state => state.inputGroupData.trees, state => state.referenceTree.id, state => state.referenceTree.highlightMonophyly],
    (trees, rid, bid) => {
        if (!bid) return null;
        let corr = trees[rid].branches[bid].correspondingBranches;
        return Object.keys(corr).map(tid => corr[tid].jaccard).sort();
    }
);
let getSetWiseJaccardArray = createSelector(
    [state => state.inputGroupData.trees, state => state.referenceTree.id, state => state.referenceTree.highlightMonophyly,
        state => state.sets[state.aggregatedDendrogram.activeSetIndex]],
    (trees, rid, bid, set) => {
        if (!bid) return null;
        let corr = trees[rid].branches[bid].correspondingBranches;
        return Object.keys(corr).filter(tid => set.tids.indexOf(tid) !== -1).map(tid => corr[tid].jaccard).sort();
    }
);

let mapStateToProps = state => {
    let {attributeNames, modes, currentModeId} = state.attributeExplorer;
    let mode = modes[currentModeId];
    let bins = null, globalBins, jac;
    if (mode.indexOf('|') !== -1) {
        globalBins = getGlobalBins(state, attributeNames);
    }
    if (mode === 'global') {
        bins = getGlobalBins(state, attributeNames);
    } else if (mode.indexOf('counterpart') !== -1) {
        if (mode.indexOf('set-wise counterpart') !== -1) {
            jac = getGlobalJaccardArray(state);
            bins = getBranchWiseBins(state, attributeNames, true);
        } else {
            jac = getSetWiseJaccardArray(state);
            bins = getBranchWiseBins(state, attributeNames, false);
        }
    } else if (mode.indexOf('set-wise') !== -1) {
        bins = getSetWiseBins(state, attributeNames);
    } else if (mode.indexOf('tree-wise') !== -1) {
        bins = getTreeWiseBins(state, attributeNames);
    }

    return {
        ...state.attributeExplorer,
        globalBins,
        bins,
        jaccardArray: state.referenceTree.highlightMonophyly? jac: null
    };
};

let mapDispatchToProps = dispatch => ({
    onChangeMode: (k) => {dispatch(changeAttributeExplorerMode(k))},
    toggleMoveHandle: (a, h) => {dispatch(toggleMoveHandle(a, h))},
    moveControlHandle: (v) => {dispatch(moveControlHandle(v))}
});

export default connect(mapStateToProps, mapDispatchToProps)(AttributeExplorer);


