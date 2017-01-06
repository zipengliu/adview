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
        let {currentModeId, modes, bins} = this.props;
        return (
            <div id="attribute-explorer" style={{position: 'relative'}}>
                <div style={{textAlign: 'left', paddingLeft: '8px', paddingTop: '5px'}}>Attribute Explorer</div>
                <DropdownButton bsSize="xsmall"
                                title={modes[currentModeId]} id="att-mode"
                                onSelect={this.props.onChangeMode}>
                    {modes.map((m, i) => <MenuItem key={i} eventKey={i}>{m}</MenuItem>)}
                </DropdownButton>

                <div>
                    {bins != null &&
                    Object.keys(bins).map((attrName, i) => <Histogram key={i} bins={bins[attrName]} attributeName={attrName}
                                                                      selectedRange={this.props.selectedRange[attrName]}
                                                                      isMovingHandle={this.props.controllingAttribute == attrName}
                                                                      toggleMoveHandle={this.props.toggleMoveHandle}
                                                                      moveControlHandle={this.props.moveControlHandle}
                                                                      spec={this.props.spec} />)
                    }
                </div>
                <div>
                    {modes[currentModeId] == 'global' && this.props.jaccardArray &&
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
    for (let key in values) {
        bins[key] = hist(values[key]);
    }
    return bins;
};

let getGlobalBins = createSelector(
    [state => state.inputGroupData.trees, (_, attrNames) => attrNames],
    (trees, attrNames) => {
        let values = attrNames.reduce((acc, a) => {acc[a] = []; return acc}, {});
        for (let i in trees) {
            let t = trees[i];
            for (let j in t.branches) {
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
            for (let j in t.branches) {
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
        for (let j in tree.branches) {
            for (let k = 0; k < attrNames.length; k++) {
                values[attrNames[k]].push(tree.branches[j][attrNames[k]]);
            }
        }
        return getBins(values);
    }
);

let getBranchWiseBins = createSelector(
    [state => state.inputGroupData.trees, (_, attrNames) => attrNames,
        state => state.referenceTree.id, state => state.referenceTree.exploreBranch],
    (trees, attrNames, referenceTreeId, exploreBranch) => {
        if (exploreBranch == null) return null;
        let values = attrNames.reduce((acc, a) => {acc[a] = []; return acc}, {});
        let b = trees[referenceTreeId].branches[exploreBranch];
        let corr = b.correspondingBranches;
        for (let k = 0; k < attrNames.length; k++) {
            values[attrNames[k]].push(b[attrNames[k]]);
        }
        for (let tid in corr) {
            let bid = corr[tid].branchId;
            for (let k = 0; k < attrNames.length; k++) {
                values[attrNames[k]].push(trees[tid].branches[bid][attrNames[k]]);
            }
        }
        return getBins(values);
    }
);

let getJaccardArray = createSelector(
    [state => state.inputGroupData.trees, state => state.referenceTree.id, state => state.referenceTree.exploreBranch],
    (trees, rid, bid) => {
        let corr = trees[rid].branches[bid].correspondingBranches;
        return Object.keys(corr).map(b => corr[b].jaccard).sort();
    }
);

let mapStateToProps = state => {
    let {attributeNames, modes, currentModeId} = state.attributeExplorer;
    let mode = modes[currentModeId];
    let bins = null;
    if (mode == 'global') {
        bins = getGlobalBins(state, attributeNames);
    } else if (mode == 'set-wise') {
        bins = getSetWiseBins(state, attributeNames);
    } else if (mode == 'tree-wise') {
        bins = getTreeWiseBins(state, attributeNames);
    } else {
        bins = getBranchWiseBins(state, attributeNames);
    }

    return {
        ...state.attributeExplorer,
        bins,
        jaccardArray: state.referenceTree.exploreBranch? getJaccardArray(state): null
    };
};

let mapDispatchToProps = dispatch => ({
    onChangeMode: (k) => {dispatch(changeAttributeExplorerMode(k))},
    toggleMoveHandle: (a, h) => {dispatch(toggleMoveHandle(a, h))},
    moveControlHandle: (v) => {dispatch(moveControlHandle(v))}
});

export default connect(mapStateToProps, mapDispatchToProps)(AttributeExplorer);


