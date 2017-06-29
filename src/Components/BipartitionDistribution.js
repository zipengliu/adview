/**
 * Created by zipeng on 2017-05-10.
 */

import React, {Component} from 'react';
import {connect} from 'react-redux';
import {scaleLinear} from 'd3';
import {Table, Glyphicon} from 'react-bootstrap';
import {toggleHighlightTrees, toggleSelectTrees} from '../actions';
import {getHighlightProportion, clusterSelector} from './TreeDistribution';


class BipartitionDistribution extends Component {
    render() {
        let {expandedBranches, distributions, numBips} = this.props;
        let {tooltipMsg} = this.props.bipartitionDistribution;
        let expandedArr = Object.keys(expandedBranches);

        let renderBars = (d, bid) => {
            let branchNo = expandedBranches[bid];
            let numBips = d.bipBins.reduce((acc, x) => (acc + x), 0);
            let x = scaleLinear().domain([0, numBips]).range([0, 100]);
            let curN = 0;

            return (
                <div style={{position: 'relative', height: '100%', width: '100%', border: '1px solid #ccc'}}>
                    {d.bipBins.map((b, i) => {
                        let leftPos = x(curN);
                        curN += b;
                        return (
                            <div key={i} style={{position: 'absolute', height: '100%', borderRight: i !== d.bins.length - 1? '1px solid #ccc': 'none',
                                top: 0, left: leftPos + '%', width: x(b) + '%'}}
                                 onMouseEnter={this.props.onHighlightTrees.bind(null, d.bins[i],
                                     `This cluster (#bips = ${b}, #trees=${d.bins[i].length}) ${d.hasCompatibleTree && i === 0? 'is': 'is not'} compatible with branch ${branchNo} in the reference tree.`)}
                                 onMouseLeave={this.props.onHighlightTrees.bind(null, [], null)}
                                 onClick={(e) => {this.props.onSelectTrees(d.bins[i], e.shiftKey)}}
                            >
                                {d.hasCompatibleTree && i == 0 &&
                                <div style={{fontSize: '16px', position: 'relative', top: '50%', left: '2px', transform: 'translateY(-50%)'}}>
                                    <Glyphicon glyph="registration-mark" />
                                </div>}
                                {d.highlightCnt && d.highlightCnt[i] > 0 &&
                                <div style={{position: 'absolute', top: 0, left: 0, height: '100%',
                                    backgroundColor: '#b82e2e', opacity: '.6',
                                    width: d.highlightCnt[i] / d.bins[i].length * 100 + '%'}} />}
                                {d.selectCnt && d.selectCnt[i] > 0 &&
                                <div style={{position: 'absolute', top: 0, left: 0, height: '100%',
                                    border: '3px solid #000', zIndex: 50,
                                    width: d.selectCnt[i] / d.bins[i].length * 100 + '%'}} />}
                            </div>
                        )
                    })}
                </div>
            )
        };

        return (
            <div id="bip-distribution" className="view panel panel-default">
                <div className="view-header panel-heading">
                    <div className="view-title">Bipartition Distribution</div>
                </div>

                <Table condensed bordered>
                    <thead>
                    <tr>
                        <th style={{width: '50px'}}>Partition</th>
                        <th>Distribution</th>
                    </tr>
                    </thead>
                    <tbody>
                    {expandedArr.map((bid, i) =>
                        <tr key={i}>
                            <td style={{color: '#e41a1c', fontWeight: 'bold', textAlign: 'center'}}>{expandedBranches[bid]}</td>
                            <td style={{height: '100%', padding: 0}}>
                                {renderBars(distributions[bid], bid)}
                            </td>
                        </tr>
                    )}
                    </tbody>
                </Table>

                <div className="panel-footer">
                    {!!tooltipMsg && <span>{tooltipMsg}</span>}
                </div>
            </div>
        )
    }
}


let getDistribution = clusterSelector(
    state => state.bipartitions,
    (_, bid) => bid,
    (bips, bid) => {
        return bips.getDistribution(bid);
    }
);


let mapStateToProps = state => {
    let expanded = state.referenceTree.expanded;
    let distributions = {};
    for (let bid in expanded) if (expanded.hasOwnProperty(bid)) {
        let d = getDistribution(state, bid);
        d.highlightCnt = getHighlightProportion(d, state.hoveredTrees);
        d.selectCnt = getHighlightProportion(d, state.selectedTrees);
        distributions[bid] = d;
    }
    // console.log(distributions);

    return {
        expandedBranches: state.referenceTree.expanded,
        numBips: state.bipartitions.numBips,
        bipartitionDistribution: state.bipartitionDistribution,
        distributions
    };
};

let mapDispatchToProps = dispatch => ({
    onHighlightTrees: (tids, msg) => {dispatch(toggleHighlightTrees(tids, msg, true))},
    onSelectTrees: (tids, isAdd) => {dispatch(toggleSelectTrees(tids, isAdd))},
});

export default connect(mapStateToProps, mapDispatchToProps)(BipartitionDistribution);
