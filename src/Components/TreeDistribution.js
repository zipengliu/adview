/**
 * Created by zipeng on 2017-05-03.
 */

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {createSelector, createSelectorCreator} from 'reselect';
import {scaleLinear} from 'd3';
import {Button, ButtonGroup, OverlayTrigger, Tooltip, Table} from 'react-bootstrap';
import {toggleJaccardMissing} from '../actions';
import {createMappingFromArray, subtractMapping, areSetsEqual} from '../utils';


class TreeDistribution extends Component {
    render() {
        let {cb, expandedBranches, fullDistribution, sets} = this.props;

        let renderBars = (d, sid, bid) => {
            let x = scaleLinear().domain([0, d.n]).range([0, 100]);
            let curN = 0;
            return (
                <div style={{position: 'relative', height: '100%', width: '100%'}}>
                    {d.bins.map((b, i) => {
                        let leftPos = x(curN);
                        curN += b.length;
                        return <OverlayTrigger key={i} placement="top"
                                               overlay={<Tooltip id={`tree-dist-${sid}-${bid}-${i}`}>
                                                   # Trees in this cluster: {b.length}. <br/> This cluster {i === 0? 'agrees': 'disagrees'} with the reference tree on this partition.
                                               </Tooltip>}>
                            <div style={{position: 'absolute', height: '100%', borderRight: '1px solid #000',
                                backgroundColor: i === 0? 'grey': 'none', opacity: .15,
                                top: 0, left: leftPos + '%', width: x(b.length) + '%'}} />
                            </OverlayTrigger>
                    })}
                </div>
            )
        };

        return (
            <div id="tree-distribution" className="view">
                <div className="view-header">
                    <div className="view-title">Tree Distribution by Partition</div>
                    <div style={{marginBottom: '5px', fontSize: '12px'}}>
                        <ButtonGroup bsSize="xsmall">
                            <Button >Show</Button>
                            <Button >Hide</Button>
                        </ButtonGroup>
                        <span> distribution for subsets. </span>

                        <span>Matching monophyly </span>
                        <ButtonGroup bsSize="xsmall">
                            <Button active={cb === 'cb'} onClick={this.props.onChangeCB.bind(null, 'cb')}>with</Button>
                            <Button active={cb === 'cb2'} onClick={this.props.onChangeCB.bind(null, 'cb2')}>without</Button>
                        </ButtonGroup>
                        <span> missing taxa. </span>
                    </div>
                </div>

                <div className="view-body" style={{fontSize: '12px'}}>
                    <Table condensed bordered>
                        <thead>
                            <tr>
                                <th style={{width: '67px'}}>Tree set</th>
                                <th style={{width: '50px'}}>Partition</th>
                                <th>Distribution</th>
                            </tr>
                        </thead>
                        <tbody>
                        {expandedBranches.map((bid, i) =>
                            <tr key={i}>
                                {i === 0 && <td rowSpan={expandedBranches.length}>All Trees</td>}
                                <td>{i + 1}</td>
                                <td style={{height: '100%', padding: 0}}>
                                    {renderBars(fullDistribution[i], 0, bid)}
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </Table>
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

let clusterSelector = createSelectorCreator(memoizeDistribution);
let clusterTreesByBranch = clusterSelector(
    state => state.inputGroupData.trees,
    state => state.referenceTree.id,
    state => state.cb,
    (_, bid) => bid,
    (trees, rid, cb, bid) => {
        console.log('Binning trees by ', rid, bid);
        let bins = [], treeToBin = {};
        let withoutMissing = cb === 'cb2';
        let correspondingBranches = trees[rid].branches[bid][cb];

        let taxaSetByTree = {
            [rid]: createMappingFromArray(trees[rid].branches[bid].entities)
        };
        // Extract the corresponding set of taxa
        for (let tid in trees) if (trees.hasOwnProperty(tid) && tid !== rid) {
            taxaSetByTree[tid] = correspondingBranches.hasOwnProperty(tid) && correspondingBranches[tid].hasOwnProperty('bid')?
                createMappingFromArray(trees[tid].branches[correspondingBranches[tid].bid].entities): {};
        }

        // First bin is always the one that is in line with the reference tree
        bins.push([rid]);
        treeToBin[rid] = 0;

        // Bin all other the trees
        for (let tid in trees) if (trees.hasOwnProperty(tid) && tid !== rid) {
            let found = false;
            for (let j = 0; j < bins.length; j++) {
                let s = bins[j];
                let set1 = withoutMissing? subtractMapping(taxaSetByTree[s[0]], trees[tid].missing): taxaSetByTree[s[0]];
                let set2 = withoutMissing? subtractMapping(taxaSetByTree[tid], trees[s[0]].missing): taxaSetByTree[tid];
                if (areSetsEqual(set1, set2)) {
                    found = true;
                    s.push(tid);
                    treeToBin[tid] = j;
                    break;
                }
            }
            if (!found) {
                // create a new bin
                bins.push([tid]);
                treeToBin[tid] = bins.length - 1;
            }
        }

        // Sort the bins except the first one
        bins = [bins[0], ...bins.slice(1).sort((a, b) => (b.length - a.length))];

        console.log('bins = ', bins);
        return {bins, treeToBin, n: Object.keys(trees).length};
    }
);

let mapStateToProps = state => {
    let fullDistribution = [];
    for (let i = state.referenceTree.selected.length - 1; i >= 0; i--) {
        let bid = state.referenceTree.selected[i];
        fullDistribution.push(clusterTreesByBranch(state, bid));
    }

    return {
        cb: state.cb,
        expandedBranches: state.referenceTree.selected,
        sets: state.sets,
        fullDistribution,
    };
};

let mapDispatchToProps = dispatch => ({
    onChangeCB: (cb) => {dispatch(toggleJaccardMissing(cb))}
});

export default connect(mapStateToProps, mapDispatchToProps)(TreeDistribution);
