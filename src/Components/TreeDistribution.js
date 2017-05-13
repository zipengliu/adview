/**
 * Created by zipeng on 2017-05-03.
 */

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {createSelector, createSelectorCreator} from 'reselect';
import {scaleLinear} from 'd3';
import {Button, ButtonGroup, OverlayTrigger, Tooltip, Table, Badge} from 'react-bootstrap';
import {toggleSubsetDistribution, toggleHighlightTrees, toggleSelectTrees} from '../actions';
import {createMappingFromArray, subtractMapping, areSetsEqual} from '../utils';


class TreeDistribution extends Component {
    render() {
        let {expandedBranches, sets, distributions} = this.props;
        let {showSubsets, tooltipMsg} = this.props.treeDistribution;
        let numTrees = sets[0].tids.length;


        let renderBars = (d, sid, bid, branchNo) => {
            let fullLength = Math.floor(d.n / numTrees * 100);
            let x = scaleLinear().domain([0, d.n]).range([0, 100]);
            let curN = 0;
            return (
                <div style={{position: 'relative', height: '100%', width: fullLength + '%', border: '1px solid #000'}}>
                    {d.bins.map((b, i) => {
                        let leftPos = x(curN);
                        curN += b.length;
                        return (
                            <div key={i} style={{position: 'absolute', height: '100%', borderRight: i !== d.bins.length - 1? '1px solid #000': 'none',
                                backgroundColor: d.hasCompatibleTree && i === 0? 'rgba(128, 128, 128, .3)': 'none',
                                top: 0, left: leftPos + '%', width: x(b.length) + '%'}}
                                 onMouseEnter={this.props.onHighlightTrees.bind(null, b,
                                     `This cluster (#trees=${b.length}) ${d.hasCompatibleTree && i === 0? 'agrees': 'disagrees'} with branch ${branchNo} in the reference tree.`)}
                                 onMouseLeave={this.props.onHighlightTrees.bind(null, [], null)}
                                 onClick={(e) => {this.props.onSelectTrees(b, e.shiftKey)}}
                            >
                                {d.highlightCnt && d.highlightCnt[i] > 0 &&
                                <div style={{position: 'absolute', top: 0, left: 0, height: '100%',
                                    backgroundColor: 'rgba(31, 119, 180, .3)',
                                    width: d.highlightCnt[i] / b.length * 100 + '%'}} />}
                                {d.selectCnt && d.selectCnt[i] > 0 &&
                                <div style={{position: 'absolute', top: 0, left: 0, height: '100%',
                                    border: '1px solid #e41a1c',
                                    width: d.selectCnt[i] / b.length * 100 + '%'}} />}
                            </div>
                        )
                    })}
                </div>
            )
        };

        return (
            <div id="tree-distribution" className="view panel panel-default">
                <div className="view-header panel-heading">
                    <div className="view-title">Tree Distribution by Reference Partition</div>
                </div>

                <Table condensed bordered>
                    <thead>
                    <tr>
                        <th style={{width: '100px'}}>Tree set</th>
                        <th style={{width: '50px'}}>Partition</th>
                        <th>Distribution</th>
                    </tr>
                    </thead>
                    <tbody>
                    {distributions.map((s, i) =>
                        (expandedBranches.map((bid, j) =>
                            <tr key={`${i}-${j}`}>
                                {j === 0 &&
                                <td rowSpan={expandedBranches.length}>
                                    {sets[i].title} {expandedBranches.length > 1 && <br/>}
                                    <Badge style={{backgroundColor: sets[i].color}}>{sets[i].tids.length}</Badge>
                                </td>}
                                <td style={{color: '#e41a1c', fontWeight: 'bold', textAlign: 'center'}}>{j + 1}</td>
                                <td style={{height: '100%', padding: 0}}>
                                    {renderBars(distributions[i][j], i, bid, j + 1)}
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </Table>
                <div className="panel-footer">
                    <ButtonGroup bsSize="xsmall">
                        <Button active={showSubsets} onClick={this.props.onToggleSubsetDistribution}>Show</Button>
                        <Button active={!showSubsets} onClick={this.props.onToggleSubsetDistribution}>Hide</Button>
                    </ButtonGroup>
                    <span> distribution for subsets. </span>
                    {!!tooltipMsg && <span>{tooltipMsg}</span>}
                </div>
            </div>
        )
    }
}

let memoizeDistribution = (func) => {
    let lastArgs = null;
    let memoizedResults = {};

    return function() {
        // Check if arguments are the same as last time
        let bid = arguments[3];
        if (!lastArgs || lastArgs[0] !== arguments[0] || lastArgs[1] !== arguments[1] || lastArgs[2] !== arguments[2]) {
            memoizedResults = {
                [bid]: func.apply(null, arguments)
            };
        } else if (!memoizedResults.hasOwnProperty(bid)) {
            memoizedResults[bid] = func.apply(null, arguments);
        }

        lastArgs = arguments;
        return memoizedResults[bid];
    }
};

export let clusterSelector = createSelectorCreator(memoizeDistribution);

let binSortFunc = (a, b) => (b.length - a.length);
let clusterTreesByBranch = clusterSelector(
    state => state.inputGroupData.trees,
    state => state.referenceTree.id,
    state => state.cb,
    (_, bid) => bid,
    (trees, rid, cb, bid) => {
        console.log('Binning trees by ', rid, bid, cb);
        let bins = [], treeToBin = {};
        let withoutMissing = cb === 'cb2';
        let correspondingBranches = trees[rid].branches[bid][cb];

        let missingMap = {};
        if (withoutMissing) {
            for (let tid in trees) if (trees.hasOwnProperty(tid)) {
                missingMap[tid] = createMappingFromArray(trees[tid].missing);
            }
        }
        let taxaSetByTree = {
            [rid]: createMappingFromArray(trees[rid].branches[bid].entities)
        };
        // Extract the corresponding set of taxa
        for (let tid in trees) if (trees.hasOwnProperty(tid) && tid !== rid) {
            taxaSetByTree[tid] = {};
            if (correspondingBranches.hasOwnProperty(tid)) {
                let corr = correspondingBranches[tid];
                if (corr.bid) {
                    taxaSetByTree[tid] = createMappingFromArray(trees[tid].branches[correspondingBranches[tid].bid].entities);
                    if (!corr.in) {
                        taxaSetByTree[tid] = subtractMapping(createMappingFromArray(trees[tid].entities), taxaSetByTree[tid]);
                    }
                }
            }
        }

        // First bin is always the one that is in line with the reference tree
        bins.push([rid]);
        treeToBin[rid] = 0;


        // Bin all other the trees
        for (let tid in trees) if (trees.hasOwnProperty(tid) && tid !== rid) {
            let found = false;
            for (let j = 0; j < bins.length; j++) {
                let s = bins[j];
                let set1 = withoutMissing? subtractMapping(taxaSetByTree[s[0]], missingMap[tid]): taxaSetByTree[s[0]];
                let set2 = withoutMissing? subtractMapping(taxaSetByTree[tid], missingMap[s[0]]): taxaSetByTree[tid];
                if (areSetsEqual(set1, set2)) {
                    found = true;
                    s.push(tid);
                    break;
                }
            }
            if (!found) {
                // create a new bin
                bins.push([tid]);
            }
        }

        // Sort the bins except the first one
        bins = [bins[0], ...bins.slice(1).sort(binSortFunc)];
        for (let i = 0; i < bins.length; i++) {
            for (let j = 0; j < bins[i].length; j++) {
                treeToBin[bins[i][j]] = i;
            }

        }

        return {bins, treeToBin, n: Object.keys(trees).length, hasCompatibleTree: true};
    }
);

export let getHighlightProportion = (distribution, tids) => {
    let {bins, treeToBin} = distribution;
    let highlightCnt = (new Array(bins.length)).fill(0);
    for (let tid in tids) if (tids.hasOwnProperty(tid)) {
        if (treeToBin.hasOwnProperty(tid)) {
            if (Array.isArray(treeToBin[tid])) {
                for (let i = 0; i < treeToBin[tid].length; i++) {
                    highlightCnt[treeToBin[tid][i]] += 1;
                }
            } else {
                highlightCnt[treeToBin[tid]] += 1;
            }
        }
    }
    return highlightCnt;
};

let getSubsetDistribution = createSelector(
    [full => full, (_, sets) => sets],
    (fullDistribution, sets) => {
        let s = [];
        for (let i = 1; i < sets.length; i++) {         // The first set is the full set, so skip it
            s.push([]);
            for (let j = 0; j < fullDistribution.length; j++) {
                let fd = fullDistribution[j];

                // Init the bins for subset[i] and bipartition j
                let bins = [];
                for (let k = 0; k < fd.bins.length; k++) {
                    bins.push([]);
                }

                // Bin the trees according to full distribution
                for (let k = 0; k < sets[i].tids.length; k++) {
                    let tid = sets[i].tids[k];
                    bins[fd.treeToBin[tid]].push(tid);
                }
                let hasCompatibleTree = bins[0].length > 0;

                // Filter and sort the bins
                let filteredBins = bins.filter(b => b.length > 0);
                if (hasCompatibleTree) {
                    filteredBins = [filteredBins[0], ...filteredBins.slice(1).sort(binSortFunc)];
                } else {
                    filteredBins = filteredBins.sort(binSortFunc);
                }

                // Fill in its treeToBin
                let treeToBin = {};
                for (let k = 0; k < filteredBins.length; k++) {
                    for (let x = 0; x < filteredBins[k].length; x++) {
                        treeToBin[filteredBins[k][x]] = k;
                    }
                }

                // Store the distribution data
                s[i - 1].push({bins: filteredBins, treeToBin, hasCompatibleTree, n: sets[i].tids.length});
            }
        }
        console.log('subset distribution:',  s);
        return s;
    }
);

let mapStateToProps = state => {
    let distributions = [[]];
    for (let i = state.referenceTree.selected.length - 1; i >= 0; i--) {
        let bid = state.referenceTree.selected[i];
        let d = clusterTreesByBranch(state, bid);
        d.highlightCnt = getHighlightProportion(d, state.hoveredTrees);
        d.selectCnt = getHighlightProportion(d, state.selectedTrees);
        distributions[0].push(d);
    }

    let sets = state.sets;
    if (state.treeDistribution.showSubsets) {
        distributions = distributions.concat(getSubsetDistribution(distributions[0], sets));
        for (let i = 1; i < sets.length; i++) {
            for (let j = 0; j < state.referenceTree.selected.length; j++) {
                distributions[i][j].highlightCnt = getHighlightProportion(distributions[i][j], state.hoveredTrees);
                distributions[i][j].selectCnt = getHighlightProportion(distributions[i][j], state.selectedTrees);
            }
        }
    }

    return {
        expandedBranches: state.referenceTree.selected,
        sets: state.sets,
        treeDistribution: state.treeDistribution,
        distributions
    };
};

let mapDispatchToProps = dispatch => ({
    onToggleSubsetDistribution: () => {dispatch(toggleSubsetDistribution())},
    onHighlightTrees: (tids, msg) => {dispatch(toggleHighlightTrees(tids, msg))},
    onSelectTrees: (tids, isAdd) => {dispatch(toggleSelectTrees(tids, isAdd))},
});

export default connect(mapStateToProps, mapDispatchToProps)(TreeDistribution);
