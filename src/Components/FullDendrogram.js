/**
 * Created by Zipeng Liu on 2016-11-04.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import cn from 'classnames';
import {scaleLinear} from 'd3';
import {toggleHighlightMonophyly, selectBranchOnFullDendrogram, changeDistanceMetric, toggleComparingHighlightMonophyly,
    toggleCheckingBranch} from '../actions';
import {createMappingFromArray} from '../utils';

import './FullDendrogram.css';

class FullDendrogram extends Component {
    render() {
        let {dendrogram, pairwiseComparison, isStatic,  spec, tree, referenceTree,
             entities, rangeSelection} = this.props;
        let {selected, persist, highlightMonophyly, highlightEntities, highlightUncertainEntities} = referenceTree;
        let isComparing = pairwiseComparison.tid !== null;


        highlightMonophyly = isStatic? this.props.comparingMonophyly: highlightMonophyly;
        highlightEntities = isStatic? this.props.comparingEntities: highlightEntities;
        highlightUncertainEntities = isStatic? null: highlightUncertainEntities;
        let {missing} = tree;
        let highlightEntitiesMapping = createMappingFromArray(highlightEntities || []);
        let highlightUncertainEntitiesMapping = createMappingFromArray(highlightUncertainEntities || []);
        let {attrName, range} = rangeSelection || {};

        let inRange = d => rangeSelection && !d.isLeaf &&
        range[0] <= tree.branches[d.bid][attrName] && tree.branches[d.bid][attrName] <= range[1];


        // Debounce the hovering
        let timer = null;
        let onMouseEnterBranch = (bid) => {
            timer = setTimeout(() => {
                if (isComparing) {
                    this.props.toggleComparingHighlightMonophyly(tree.tid, bid);
                } else {
                    this.props.toggleHighlightMonophyly(bid);
                }
                timer = null;
            }, 300);
        };
        let onMouseLeaveBranch = () => {
            if (timer) {
                clearTimeout(timer);
            } else {
                if (isComparing) {
                    this.props.toggleComparingHighlightMonophyly(null, null);
                } else {
                    this.props.toggleHighlightMonophyly(null);
                }
            }
        };


        let renderDendrogram = (tree, dendrogram, side='right') => {
            let {treeBoundingBox, branchSpecs, verticalLines, responsiveBoxes,hoverBoxes, textSpecs} = dendrogram;
            let highlightBoxes = null;
            if (isComparing) {
                // if (pairwiseComparison.highlight.bids.hasOwnProperty(tree.tid)) {
                //     highlightBoxes = <g>
                //         {pairwiseComparison.highlight.bids[tree.tid].map(h => <rect key={h} className="hover-box" {...hoverBoxes[h]}/>)}
                //     </g>
                // }
            } else {
                if (highlightMonophyly) {
                    if (typeof highlightMonophyly === 'object') {
                        highlightBoxes = <g>
                            {Object.keys(highlightMonophyly).map(h => <rect key={h} className="hover-box" {...hoverBoxes[h]}/>)}
                        </g>
                    } else {
                        highlightBoxes = <rect className="hover-box" {...hoverBoxes[highlightMonophyly]} />
                    }
                }
            }
            let names = textSpecs.map(d => (<text className={cn('entity-name', {highlighted: highlightEntitiesMapping.hasOwnProperty(d.entity_id),
                'uncertain-highlighted': highlightUncertainEntitiesMapping.hasOwnProperty(d.entity_id)})}
                                                  x={d.x} y={d.y} dx={side === 'left'? -5: 5} dy={3}
                                                  textAnchor={side === 'left'? 'end': 'start'} key={d.entity_id}>{entities[d.entity_id].name}</text>));
            let missingBranchPos = missing? (missing.length - 1) / 2 * spec.marginOnEntity: null;

            return (
               <g>
                   {highlightBoxes}
                   <g className="topology">
                       {branchSpecs.map((d, i) =>
                           (<g key={d.bid}>
                               <line className={cn('branch-line', {selected: referenceTree.id === tree.tid && selected && selected.indexOf(d.bid) !== -1, 'range-selected': inRange(d) })}
                                     x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                               {this.props.metricBranch === d.bid && d.bid != null &&
                               <circle className="metric-branch-indicator" r="4" cx={(d.x1 + d.x2) / 2} cy={d.y1} />}
                               {tree.tid === referenceTree.id && selected.length && selected[0] === d.bid &&
                               <g>
                                   <line className="last-selected-indicator" x1={d.x1} y1={d.y1-3} x2={d.x2} y2={d.y2-3} />
                                   <line className="last-selected-indicator" x1={d.x1} y1={d.y1+3} x2={d.x2} y2={d.y2+3} />
                               </g>}
                           </g>))}
                       {verticalLines.map((d, i) =>
                           <line className="branch-line" key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                       )}
                   </g>
                   <g className="names">{names}</g>
                   {(!isStatic || isComparing) &&
                   <g className="responding-boxes">
                       {responsiveBoxes.map(d =>
                           <rect className={cn("box")}
                                 x={d.x} y={d.y} width={d.width} height={d.height}
                                 onMouseEnter={() => {if (!persist) {
                                     onMouseEnterBranch(d.bid);
                                 } else {
                                     this.props.onToggleCheckingBranch(d.bid);
                                 }}}
                                 onMouseLeave={() => {if (!persist) {
                                     onMouseLeaveBranch()
                                 } else {
                                     this.props.onToggleCheckingBranch(null);
                                 }}}
                                 onClick={() => {if (this.props.pickingBranch) {
                                     if (this.props.metricBranch !== d.bid) this.props.onChangeDistanceMetric(d.bid)
                                 } else {
                                     if (persist) {
                                         this.props.toggleHighlightMonophyly(d.bid, true)
                                     } else if (!isComparing) {
                                         this.props.onSelectBranch(d.bid)
                                     }
                                 } }}
                                 key={d.bid}>
                           </rect>)}
                   </g>
                   }
                   {missing && missing.length &&
                   <g className="missing" transform={`translate(0,${(tree.entities.length + 2) * spec.marginOnEntity})`}>
                       <line className="branch-line" x1="0" y1={missingBranchPos} x2="50" y2={missingBranchPos}/>
                       <line className="branch-line" x1="50" y1="0" x2="50" y2={(missing.length - 1) * spec.marginOnEntity}/>
                       <text style={{fontSize: '12px'}} x="0" y={missingBranchPos} dy="-2" >missing</text>
                       <text style={{fontSize: '12px'}} x="0" y={missingBranchPos} dy="12" >taxa</text>
                       {missing.map((eid, i) => <g key={i}>
                           <line className="branch-line" x1="50" y1={i * spec.marginOnEntity} x2="70" y2={i * spec.marginOnEntity} />
                           <text className={cn('entity-name', {highlighted: highlightEntitiesMapping.hasOwnProperty(eid)})}
                                 x={70} y={i * spec.marginOnEntity} dx={5} dy={3}>{entities[eid].name}</text>
                       </g>)}
                       {highlightMonophyly === 'missing' &&
                       <rect className="hover-box" x="0" y="-4" width={treeBoundingBox.width} height={missing.length * spec.marginOnEntity} />}
                       {(!isStatic || isComparing) &&
                       <rect className="box" x="0" y={missingBranchPos - 12} width="50" height={24}
                             onMouseEnter={() => {if (!persist) {onMouseEnterBranch('missing')}}}
                             onMouseLeave={() => {if (!persist) {onMouseLeaveBranch()}}}
                             onClick={persist? this.props.toggleHighlightMonophyly.bind(null, highlightMonophyly === 'missing'? null: 'missing'): null}
                       />}
                   </g>
                   }
               </g>
            )
        };

        let svgWidth = (pairwiseComparison.tid? dendrogram[0].treeBoundingBox.width + dendrogram[1].treeBoundingBox.width:
            dendrogram.treeBoundingBox.width) + spec.margin.left + spec.margin.right;
        let svgHeight = (pairwiseComparison.tid? Math.max(dendrogram[0].treeBoundingBox.height, dendrogram[1].treeBoundingBox.height):
                dendrogram.treeBoundingBox.height) + spec.margin.top + spec.margin.bottom;
        return (
            <svg width={svgWidth}
                 height={svgHeight}>
                <g transform={`translate(${spec.margin.left},${spec.margin.top})`}>
                    {pairwiseComparison.tid &&
                        <g>
                            <g>{renderDendrogram(tree, dendrogram[0], 'right')}</g>
                            <g transform={`translate(${dendrogram[0].treeBoundingBox.width}, 0)`}>
                                {renderDendrogram(this.props.comparingTree, dendrogram[1], 'left')}
                            </g>
                        </g>
                    }
                    {!pairwiseComparison.tid &&
                        renderDendrogram(tree, dendrogram)
                    }
                </g>
            </svg>
        )
    }
}


let getDendrogramSpecs = createSelector(
    [(state, tid) => tid? state.inputGroupData.trees[tid]: state.inputGroupData.trees[state.referenceTree.id],
        state => state.inputGroupData.entities,
        (_, tid, alignToSide) => alignToSide,
        (_, tid, alignToSide, ignoreBranchLen) => ignoreBranchLen,
        state => state.dendrogramSpec],
    (tree, entities, side, ignoreBranchLen, spec) => {

        let {branches} = tree;
        let aligned = side === 'left' || side === 'right';

        let getTreeWidth = function() {
            let topo = 0, longestEntity = 0;
            let traverse = function(bid, cur) {
                let b = branches[bid];
                cur += ignoreBranchLen? spec.unitBranchLength: b.length;
                topo = Math.max(cur, topo);
                if ('left' in b) {
                    traverse(b.left, cur);
                    traverse(b.right, cur);
                } else {
                    longestEntity = Math.max(longestEntity, entities[b.entity].name.length * spec.labelUnitCharWidth);
                }
            };

            traverse(tree.rootBranch, 0);
            let topologyWidth = ignoreBranchLen? topo: spec.defaultTopologyWidth;
            return {treeWidth: topologyWidth + longestEntity, topologyWidth, maxLength: topo};
        };
        let {treeWidth, topologyWidth, maxLength} = getTreeWidth();

        let xScale = ignoreBranchLen? null: scaleLinear().domain([0, maxLength]).range([0, topologyWidth]);
        let b = {};
        let connectLines = [];
        let curY = 0;
        let text = [];

        // THe bounding box for a subtree, keyed by the leading branch
        let boundingBox = {};
        let boxHalfWidth = (spec.responsiveAreaSize - 1) / 2;

        let traverse = (bid, curX) => {
            let bLength = branches[bid].length;
            let t = ignoreBranchLen? spec.unitBranchLength: xScale(bLength);
            b[bid] = {x1: curX, x2: curX + t};
            curX += t;
            if ('left' in branches[bid]) {
                let {left, right} = branches[bid];
                traverse(left, curX);
                traverse(right, curX);
                b[bid].y1 = (b[left].y1 + b[right].y1) / 2;
                b[bid].y2 = b[bid].y1;
                connectLines.push({x1: curX, x2: curX, y1: b[left].y1, y2: b[right].y1});
                // Merge the two children bounding box to for his bounding box
                boundingBox[bid] = {x: b[bid].x1, y: boundingBox[left].y,
                    width: treeWidth - b[bid].x1,
                    height: boundingBox[right].y + boundingBox[right].height - boundingBox[left].y};
            } else {
                // Leaf branch
                let ent_id = branches[bid].entities[0];
                b[bid].y1 = curY;
                b[bid].y2 = curY;
                if (aligned) {
                    b[bid].x2 = topologyWidth;
                    // b[bid].x2 += Math.max(0, spec.labelWidth - entities[ent_id].name.length * 4.3 - 5);
                }
                boundingBox[bid] = {x: b[bid].x1, y: b[bid].y1 - boxHalfWidth,
                    width: treeWidth - b[bid].x1, height: spec.responsiveAreaSize};
                text.push({entity_id: ent_id,  x: !aligned? curX: (side === 'right'? topologyWidth: treeWidth - topologyWidth), y: curY});
                curY += spec.marginOnEntity;
            }
        };

        traverse(tree.rootBranch, 0);

        let branchSpecs = [];
        let responsiveBoxes = [];
        for (let bid in b) if (b.hasOwnProperty(bid)) {
            branchSpecs.push({...b[bid], bid, isLeaf: branches[bid].isLeaf});
            responsiveBoxes.push({x: b[bid].x1, y: b[bid].y1 - boxHalfWidth,
                width: b[bid].x2 - b[bid].x1, height: spec.responsiveAreaSize, bid});
        }

        // Align the left, right side or none
        if (side === 'left') {
            for (let bid in boundingBox) if (b.hasOwnProperty(bid)) {
                boundingBox[bid].x = treeWidth - boundingBox[bid].x - boundingBox[bid].width;
            }
            for (let i = 0; i < branchSpecs.length; i++) {
                branchSpecs[i].x1 = treeWidth - branchSpecs[i].x1;
                branchSpecs[i].x2 = treeWidth - branchSpecs[i].x2;
            }
            for (let i = 0; i < connectLines.length; i++) {
                connectLines[i].x1 = treeWidth - connectLines[i].x1;
                connectLines[i].x2 = treeWidth - connectLines[i].x2;
            }
            for (let i = 0; i < responsiveBoxes.length; i++) {
                responsiveBoxes[i].x = treeWidth - responsiveBoxes[i].x - responsiveBoxes[i].width;
            }
        } else if (side === 'right') {

        }

        return {
            treeBoundingBox: {width: treeWidth, height: curY + 20},
            branchSpecs,
            verticalLines: connectLines,
            responsiveBoxes,
            textSpecs: text,
            hoverBoxes: boundingBox,
        };
    }
);


function mapStateToProps(state, ownProps) {
    let c = state.pairwiseComparison;
    let den, den1, den2;
    if (c.tid) {
        den1 = getDendrogramSpecs(state, null, 'right', true);
        den2 = getDendrogramSpecs(state, c.tid, 'left', true);
    } else {
        den = getDendrogramSpecs(state, null, null, false);
    }
    return {
        dendrogram: c.tid? [den1, den2]: den,
        pairwiseComparison: state.pairwiseComparison,
        referenceTree: state.referenceTree,
        tree: state.inputGroupData.trees[ownProps.tid? ownProps.tid: state.referenceTree.id],
        comparingTree: c.tid? state.inputGroupData.trees[c.tid]: null,
        spec: state.dendrogramSpec,
        entities: state.inputGroupData.entities,
        pickingBranch: state.overview.pickingBranch,
        metricBranch: state.overview.metricMode === 'global'? null: state.overview.metricBranch,
        rangeSelection: state.attributeExplorer.activeSelectionId === 0? {
                attrName: 'support',
                range: state.attributeExplorer.selection[state.attributeExplorer.activeSelectionId].range
            }: null,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleHighlightMonophyly: (bid, multiple=false) => {
            dispatch(toggleHighlightMonophyly(bid, multiple));
        },
        onToggleCheckingBranch: bid => {dispatch(toggleCheckingBranch(bid))},
        onSelectBranch: (bid) => {
            dispatch(selectBranchOnFullDendrogram(bid));
        },
        onChangeDistanceMetric: (bid) => {
            dispatch(changeDistanceMetric('local', bid));
        },
        toggleComparingHighlightMonophyly: (tid, m) => {dispatch(toggleComparingHighlightMonophyly(tid, m))}
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FullDendrogram);
