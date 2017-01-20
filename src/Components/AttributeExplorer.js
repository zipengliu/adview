/**
 * Created by Zipeng Liu on 2016-12-20.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {ButtonGroup, Button, FormGroup, Radio, OverlayTrigger, Tooltip} from 'react-bootstrap';
import {histogram, scaleLinear} from 'd3';
import {toggleMoveHandle, moveControlHandle, toggleHistogramOrCDF, changeAttributeExplorerMode, changeActiveRangeSelection} from '../actions';
import Histogram from './HistogramSlider';
import LineChart from './LineChart';

import './AttributeExplorer.css';

class AttributeExplorer extends Component {
    render() {
        let {modes, onChangeMode, shownAsHistogram, data, activeSelectionId} = this.props;
        let attrName = this.props.attributeNames[0];

        let renderChart = (fgData, bgData, att, id) => shownAsHistogram?
            (<Histogram foregroundBins={fgData} backgroundBins={bgData} attributeName={att}
                        selection={id === activeSelectionId? this.props.selection[id]: null}
                        toggleMoveHandle={this.props.toggleMoveHandle}
                        moveControlHandle={this.props.moveControlHandle}
                        spec={this.props.spec} />):
            (<LineChart data={fgData} attributeName={att}
                        selection={id === activeSelectionId? this.props.selection[id]: null}
                        toggleMoveHandle={this.props.toggleMoveHandle}
                        moveControlHandle={this.props.moveControlHandle}
                        spec={this.props.spec} />);

        let getSelectionButton = (id, disabled) =>
            <Button bsSize="xsmall" disabled={disabled || id === 2}
                    onClick={this.props.onChangeActiveRangeSelection.bind(null, activeSelectionId === id? null: id)}>
                {activeSelectionId === id? 'deactivate range selection': 'activate range selection'}
            </Button>;

        return (
            <div id="attribute-explorer" className="view">
                <div className="view-header">
                    <div className="view-title">Attribute Explorer</div>
                    <FormGroup style={{textAlign: 'center'}}>
                        <span style={{marginRight: '2px'}}>as</span>
                        <Radio inline checked={shownAsHistogram} onChange={this.props.toggleHistogram.bind(null, true)}>histogram</Radio>
                        <Radio inline checked={!shownAsHistogram} onChange={this.props.toggleHistogram.bind(null, false)}>CDF</Radio>
                    </FormGroup>
                </div>

                <div className="view-body">
                    <div className="attribute-heading">&bull; All branches</div>
                    <ButtonGroup bsSize="xsmall">
                        <OverlayTrigger placement="top" overlay={<Tooltip id="att-all-trees">
                            Show distribution of attributes of all branches from all trees in this dataset.</Tooltip>}>
                            <Button active={modes.all.scope === 'all'} onClick={onChangeMode.bind(null, 'all', 'all', null)}>all trees</Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="att-current-set">
                            Show distribution of attributes of all branches from trees of the current subset.</Tooltip>}>
                            <Button active={modes.all.scope === 'set'}
                                    onClick={onChangeMode.bind(null, 'all', 'set', null)}>cur. set</Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="att-selected-trees">
                            Show distribution of attributes of all branches from the selected trees (reference tree if none is selected).</Tooltip>}>
                            <Button active={modes.all.scope === 'tree'}
                                    onClick={onChangeMode.bind(null, 'all', 'tree', null)}>sel. trees</Button>
                        </OverlayTrigger>
                    </ButtonGroup>
                    <FormGroup>
                        <OverlayTrigger placement="right" overlay={<Tooltip id="att-in-context">
                            Show the global distribution as background and partial one as foreground</Tooltip>}>
                            <Radio inline disabled={modes.all.scope === 'all' || !shownAsHistogram} checked={modes.all.context}
                                   onChange={onChangeMode.bind(null, 'all', null, !modes.all.context)}>show in context</Radio>
                        </OverlayTrigger>
                    </FormGroup>

                    {getSelectionButton(0, !data.all[attrName].fg && !data.all[attrName].bg)}
                    {renderChart(data.all[attrName].fg, data.all[attrName].bg, attrName, 0)}

                    <OverlayTrigger placement="right" overlay={<Tooltip id="corr-desc">branches that correspond to the last selected one on the reference tree </Tooltip>}>
                        <div className="attribute-heading">&bull; Corresponding branches</div>
                    </OverlayTrigger>
                    <ButtonGroup bsSize="xsmall">
                        <OverlayTrigger placement="top" overlay={<Tooltip id="att-corr-all-trees">
                            Show distribution of attributes of corresponding branches from all trees in this dataset.</Tooltip>}>
                            <Button active={modes.corr.scope === 'all'} onClick={onChangeMode.bind(null, 'corr', 'all', null)}>all trees</Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="att-corr-current-set">
                            Show distribution of attributes of corresponding branches from trees of the current subset.</Tooltip>}>
                            <Button active={modes.corr.scope === 'set'}
                                    onClick={onChangeMode.bind(null, 'corr', 'set', null)}>cur. set</Button>
                        </OverlayTrigger>
                    </ButtonGroup>
                    <FormGroup>
                        <OverlayTrigger placement="right" overlay={<Tooltip id="att-corr-in-context">
                            Show the global distribution as background and partial one as foreground</Tooltip>}>
                            <Radio inline disabled={modes.corr.scope === 'all' || !shownAsHistogram} checked={modes.corr.context}
                                   onChange={onChangeMode.bind(null, 'corr', null, !modes.corr.context)}>show in context</Radio>
                        </OverlayTrigger>
                    </FormGroup>

                    {getSelectionButton(1, !data.corr[attrName].fg && !data.corr[attrName].bg)}
                    {renderChart(data.corr[attrName].fg, data.corr[attrName].bg, attrName, 1)}
                    {getSelectionButton(2, !data.corr.similarity.fg && !data.corr.similarity.bg)}
                    {renderChart(data.corr.similarity.fg, data.corr.similarity.bg, 'similarity', 2)}

                </div>
            </div>
        )
    }
}


let getBinsFromArray = values => {
    let hist = histogram().domain([0, 1]).thresholds(scaleLinear().ticks(20));
    return hist(values);
};

let getGlobalValues = createSelector(
    [state => state.inputGroupData.trees, (_, attrName) => attrName],
    (trees, attrName) => {
        let values = [];
        for (let i in trees) if (trees.hasOwnProperty(i)) {
            let t = trees[i];
            for (let j in t.branches) if (t.branches.hasOwnProperty(j)) {
                values.push(t.branches[j][attrName]);
            }
        }
        return values;
    }
);

let getSetWiseValues = createSelector(
    [state => state.inputGroupData.trees, (_, attrName) => attrName,
        state => state.sets[state.aggregatedDendrogram.activeSetIndex]],
    (trees, attrName, set) => {
        let values = [];
        for (let i = 0; i < set.tids.length; i++) {
            let t = trees[set.tids[i]];
            for (let j in t.branches) if (t.branches.hasOwnProperty(j)) {
                values.push(t.branches[j][attrName]);
            }
        }
        return values;
    }
);

let getTreeWiseValues = createSelector(
    [state => state.inputGroupData.trees[state.aggregatedDendrogram.activeTreeId] || state.inputGroupData.trees[state.referenceTree.id],
        (_, attrName) => attrName],
    (tree, attrName) => {
        let values = [];
        for (let j in tree.branches) if (tree.branches.hasOwnProperty(j)) {
            values.push(tree.branches[j][attrName]);
        }
        return values;
    }
);

let getCorrGlobalValues = createSelector(
    [state => state.inputGroupData.trees, (_, attrNames) => attrNames,
        state => state.referenceTree.id, state => state.referenceTree.selected[0]],
    (trees, attrName, referenceTreeId, highlightMonophyly) => {
        if (highlightMonophyly == null) return null;
        let b = trees[referenceTreeId].branches[highlightMonophyly];
        let values = [b[attrName]];
        let corr = b.correspondingBranches;

        for (let tid in corr)
            if (corr.hasOwnProperty(tid)) {
                let bid = corr[tid].branchId;
                values.push(trees[tid].branches[bid][attrName]);
            }
        return values;
    }
);

let getCorrSetWiseValues = createSelector(
    [state => state.inputGroupData.trees, (_, attrNames) => attrNames,
        state => state.referenceTree.id, state => state.referenceTree.selected[0],
        state => state.sets[state.aggregatedDendrogram.activeSetIndex]],
    (trees, attrName, referenceTreeId, highlightMonophyly, set) => {
        if (highlightMonophyly == null || set.tids.length === 0) return null;
        let b = trees[referenceTreeId].branches[highlightMonophyly];
        let values = [b[attrName]];
        let corr = b.correspondingBranches;

        for (let tid in corr)
            if (corr.hasOwnProperty(tid) && set.tids.indexOf(tid)!== -1) {
                let bid = corr[tid].branchId;
                values.push(trees[tid].branches[bid][attrName]);
            }
        return values;
    }
);

let getGlobalJaccardArray = createSelector(
    [state => state.inputGroupData.trees, state => state.referenceTree.id, state => state.referenceTree.selected[0]],
    (trees, rid, bid) => {
        if (!bid) return null;
        let corr = trees[rid].branches[bid].correspondingBranches;
        return Object.keys(corr).map(tid => corr[tid].jaccard);
    }
);
let getSetWiseJaccardArray = createSelector(
    [state => state.inputGroupData.trees, state => state.referenceTree.id, state => state.referenceTree.selected[0],
        state => state.sets[state.aggregatedDendrogram.activeSetIndex]],
    (trees, rid, bid, set) => {
        if (!bid) return null;
        let corr = trees[rid].branches[bid].correspondingBranches;
        return Object.keys(corr).filter(tid => set.tids.indexOf(tid) !== -1).map(tid => corr[tid].jaccard);
    }
);

let mapStateToProps = state => {
    let {attributeNames, modes, shownAsHistogram} = state.attributeExplorer;
    let attrName = attributeNames[0];
    let data = {
        all: {
            [attrName]: {fg: null, bg: null}
        },
        corr: {
            [attrName]: {fg: null, bg: null},
            similarity: {fg: null, bg: null}
        }
    };

    // all section
    if (modes.all.scope === 'all') {
        data.all[attrName].fg = getGlobalValues(state, attrName);
    } else {
        if (modes.all.scope === 'set') {
            data.all[attrName].fg = getSetWiseValues(state, attrName);
        } else if (modes.all.scope === 'tree') {
            data.all[attrName].fg = getTreeWiseValues(state, attrName);
        }
        if (modes.all.context) {
            data.all[attrName].bg = getGlobalValues(state, attrName);
        }
    }

    // corr section
    let {selected} = state.referenceTree;
    if (selected.length > 0) {
        if (modes.corr.scope === 'all') {
            data.corr[attrName].fg = getCorrGlobalValues(state, attrName);
            data.corr.similarity.fg = getGlobalJaccardArray(state);
        } else if (modes.corr.scope === 'set') {
            data.corr[attrName].fg = getCorrSetWiseValues(state, attrName);
            data.corr.similarity.fg = getSetWiseJaccardArray(state);

            if (modes.corr.context) {
                data.corr[attrName].bg = getCorrGlobalValues(state, attrName);
                data.corr.similarity.bg = getGlobalJaccardArray(state);
            }
        }
    }

    // if shown as histogram: bin the data values; if shown as CDF, sort the data values
    for (let i in data) if (data.hasOwnProperty(i)) {
        for (let j in data[i]) if (data[i].hasOwnProperty(j)) {
            if (data[i][j].bg)
                data[i][j].bg = shownAsHistogram? getBinsFromArray(data[i][j].bg): data[i][j].bg.sort();
            if (data[i][j].fg)
                data[i][j].fg = shownAsHistogram? getBinsFromArray(data[i][j].fg): data[i][j].fg.sort();
        }
    }

    return {
        ...state.attributeExplorer,
        data,
    };
};

let mapDispatchToProps = dispatch => ({
    onChangeMode: (section, scope, context) => {dispatch(changeAttributeExplorerMode(section, scope, context))},
    toggleMoveHandle: (h) => {dispatch(toggleMoveHandle(h))},
    moveControlHandle: (v) => {dispatch(moveControlHandle(v))},
    toggleHistogram: (a) => {dispatch(toggleHistogramOrCDF(a))},
    onChangeActiveRangeSelection: (id) => {dispatch(changeActiveRangeSelection(id))}
});

export default connect(mapStateToProps, mapDispatchToProps)(AttributeExplorer);


