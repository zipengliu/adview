/**
 * Created by zipeng on 2017-05-03.
 */

import React, {Component} from 'react';
import {connect} from 'react-redux';
import cn from 'classnames';
import {scaleLinear} from 'd3';
import {Button, ButtonGroup, Table, Badge, Glyphicon} from 'react-bootstrap';
import {toggleSubsetDistribution, toggleSelectTrees, toggleTreeDistributionCollapse, toggleHighlightSegment} from '../actions';


class TreeDistribution extends Component {
    render() {
        let {expandedBranches, sets, treeDistribution} = this.props;
        let {showSubsets, tooltipMsg, collapsed, data} = treeDistribution;
        let numTrees = sets[0].tids.length;
        let expandedArr = Object.keys(expandedBranches);

        let renderBars = (d, bid) => {
            let fullLength = Math.floor(d.n / numTrees * 100);
            let x = scaleLinear().domain([0, d.n]).range([0, 100]);
            let branchNo = expandedBranches[bid];
            let curN = 0;
            return (
                <div style={{position: 'relative', height: '100%', width: fullLength + '%', border: '1px solid #ccc'}}>
                    {d.bins.map((b, i) => {
                        let leftPos = x(curN);
                        curN += b.length;
                        return (
                            <div key={i} style={{position: 'absolute', height: '100%', borderRight: i !== d.bins.length - 1? '1px solid #ccc': 'none',
                                top: 0, left: leftPos + '%', width: x(b.length) + '%'}}
                                 onMouseEnter={this.props.onHighlightSegment.bind(null, b, d.entities[i],
                                     `This cluster (#trees=${b.length}) ${d.hasCompatibleTree && i === 0? 'agrees': 'disagrees'} with branch ${branchNo} in the reference tree.`)}
                                 onMouseLeave={this.props.onHighlightSegment.bind(null, [], [], null)}
                                 onClick={(e) => {this.props.onSelectTrees(b, e.shiftKey)}}
                            >
                                {d.hasCompatibleTree && i === 0 &&
                                <div style={{fontSize: '16px', position: 'relative', top: '50%', left: '2px', transform: 'translateY(-50%)'}}>
                                    <Glyphicon glyph="registration-mark" />
                                </div>}
                                {d.highlightCnt && d.highlightCnt[i] > 0 &&
                                <div style={{position: 'absolute', top: 0, left: 0, height: '100%',
                                    backgroundColor: '#b82e2e', opacity: '.6',
                                    width: d.highlightCnt[i] / b.length * 100 + '%'}} />}
                                {d.selectCnt && d.selectCnt[i] > 0 &&
                                <div style={{position: 'absolute', top: 0, left: 0, height: '100%',
                                    border: '3px solid #000', zIndex: 50,
                                    width: d.selectCnt[i] / b.length * 100 + '%'}} />}
                            </div>
                        )
                    })}
                </div>
            )
        };

        return (
            <div id="tree-distribution" className={cn("view panel panel-default", {'panel-collapsed': collapsed})}>
                <div className="view-header panel-heading">
                    <div className="view-title">
                        Tree Distribution by Reference Partition
                        <span style={{marginLeft: '10px', cursor: 'pointer', float: 'right'}} onClick={this.props.onToggleCollapsed}>
                            <Glyphicon glyph={collapsed? 'th-list': 'minus'}/>
                        </span>
                    </div>
                </div>

                <Table condensed bordered>
                    <thead>
                    <tr>
                        <th style={{width: '100px'}}>Tree collection</th>
                        <th style={{width: '50px'}}>Partition</th>
                        <th>Distribution</th>
                    </tr>
                    </thead>
                    <tbody>
                    {data.map((s, i) =>
                        (expandedArr.map((bid, j) =>
                            <tr key={`${i}-${j}`}>
                                {j === 0 &&
                                <td rowSpan={expandedArr.length}>
                                    {sets[i].title} {expandedArr.length > 1 && <br/>}
                                    <Badge style={{backgroundColor: sets[i].color}}>{sets[i].tids.length}</Badge>
                                </td>}
                                <td style={{color: '#e41a1c', fontWeight: 'bold', textAlign: 'center'}}>{expandedBranches[bid]}</td>
                                <td style={{height: '100%', padding: 0}}>
                                    {renderBars(s[bid], bid)}
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
                    <span> distribution for sub-collections. </span>
                    {!!tooltipMsg && <span>{tooltipMsg}</span>}
                </div>
            </div>
        )
    }
}


let mapStateToProps = state => ({
    expandedBranches: state.referenceTree.expanded,
    sets: state.sets,
    treeDistribution: state.treeDistribution,
});

let mapDispatchToProps = dispatch => ({
    onToggleSubsetDistribution: () => {dispatch(toggleSubsetDistribution())},
    onHighlightSegment: (tids, entities, msg) => {dispatch(toggleHighlightSegment(tids, entities, msg))},
    onSelectTrees: (tids, isAdd) => {dispatch(toggleSelectTrees(tids, isAdd))},
    onToggleCollapsed: () => {dispatch(toggleTreeDistributionCollapse())}
});

export default connect(mapStateToProps, mapDispatchToProps)(TreeDistribution);
