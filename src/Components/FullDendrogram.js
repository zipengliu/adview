/**
 * Created by Zipeng Liu on 2016-11-04.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import cn from 'classnames';
import {scaleLinear} from 'd3';
import {toggleHighlightMonophyly, selectBranchOnFullDendrogram, changeDistanceMetric, toggleCheckingBranch,
toggleHighlightDuplicate} from '../actions';
import {createMappingFromArray} from '../utils';

import './FullDendrogram.css';

class FullDendrogram extends Component {
    render() {
        let {dendrogram, isStatic,  spec, tree, referenceTree, comparingTree, highlight,
             entities, rangeSelection, cb} = this.props;
        let {selected, highlightEntities, highlightUncertainEntities} = referenceTree;
        let isComparing = comparingTree !== null;

        highlightUncertainEntities = isStatic? null: highlightUncertainEntities;
        let highlightEntitiesMapping = createMappingFromArray(highlightEntities || []);
        let highlightUncertainEntitiesMapping = createMappingFromArray(highlightUncertainEntities || []);
        let {attribute, range} = rangeSelection || {};


        // // Debounce the hovering
        // let timer = null;
        // let onMouseEnterBranch = (bid) => {
        //     timer = setTimeout(() => {
        //         this.props.toggleHighlightMonophyly(bid);
        //         timer = null;
        //     }, 300);
        // };
        // let onMouseLeaveBranch = () => {
        //     if (timer) {
        //         clearTimeout(timer);
        //     } else {
        //         this.props.toggleHighlightMonophyly(null);
        //     }
        // };


        let renderDendrogram = (tree, dendrogram, side='right', expandedBranches=[]) => {
            let {branchSpecs, verticalLines, responsiveBoxes,hoverBoxes, textSpecs} = dendrogram;
            let {missing, branches} = tree;

            let inRange = d => rangeSelection && !rangeSelection.cb && !d.isLeaf
            && branches.hasOwnProperty(d.bid) && range[0] <= branches[d.bid][attribute] && branches[d.bid][attribute] <= range[1];

            let cbInRange = false;
            if (rangeSelection && rangeSelection.cb && tree.tid !== referenceTree.id) {
                let corr = this.props.tree.branches[selected[0]][cb][tree.tid];
                if (corr) {
                    let v = attribute === 'similarity'? corr.jac: tree.branches[corr.bid][attribute];
                    cbInRange = range[0] <= v && v <= range[1];
                }
            }

            let highlightBoxes = [];
            for (let i = 0; i < highlight.bids.length; i++) {
                let h = highlight.bids[i];
                if (h.hasOwnProperty(tree.tid)) {
                    let c = highlight.colorScheme(h.color);
                    for (let j = 0; j < h[tree.tid].length; j++) {
                        let bid = h[tree.tid][j];
                        highlightBoxes.push(
                            <rect className={cn('highlight-box', {'highlight-src': h.src === tree.tid, 'highlight-tgt': h.tgt === tree.tid})}
                                  key={tree.tid + bid + j}
                                  {...hoverBoxes[bid]}
                                  style={{fill: c, stroke: isComparing && h.src === tree.tid? c: 'none'}} />)
                    }
                }
            }

            let names = textSpecs.map((d, i) => (
                <text key={i} className={cn('entity-name', {highlighted: highlightEntitiesMapping.hasOwnProperty(d.entity_id),
                    'uncertain-highlighted': highlightUncertainEntitiesMapping.hasOwnProperty(d.entity_id)})}
                      x={d.x} y={d.y} dx={side === 'left'? -5: 5} dy={3}
                      textAnchor={side === 'left'? 'end': 'start'}
                      onMouseEnter={this.props.onHighlightDup.bind(null, d.entity_id)}
                      onMouseLeave={this.props.onHighlightDup.bind(null, null)}
                >
                    {entities[d.entity_id].name}
                </text>));
            let missingBranch = missing && missing.length? branchSpecs.filter(d => d.bid === 'missing_taxa')[0]: null;

            return (
               <g>
                   {tree.tid === referenceTree.id &&
                   <rect className='reference-tree-indicator' x="0" y="-4"
                         width={dendrogram.treeBoundingBox.width} height={dendrogram.treeBoundingBox.height} />
                   }
                   {tree.tid !== referenceTree.id &&
                   <rect className='comparing-tree-indicator' x="2" y="-4"
                         width={dendrogram.treeBoundingBox.width} height={dendrogram.treeBoundingBox.height} />
                   }

                   {tree.tid !== referenceTree.id && rangeSelection && rangeSelection.cb && cbInRange &&
                   <rect className='range-selected-cb-indicator' x="0" y="-4"
                         width={dendrogram.treeBoundingBox.width} height={dendrogram.treeBoundingBox.height} />
                   }
                   <g>
                       {highlightBoxes}
                   </g>
                   <g className="topology">
                       {branchSpecs.map((d, i) =>
                           (<g key={d.bid}>
                               <line className={cn('branch-line', {selected: expandedBranches.indexOf(d.bid) !== -1,
                                   'range-selected': inRange(d),
                                   'checking': tree.tid === referenceTree.id && referenceTree.checkingBranch === d.bid})}
                                     x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                               {tree.tid === referenceTree.id && this.props.metricBranch === d.bid && d.bid != null &&
                               <circle className="metric-branch-indicator" r="4" cx={(d.x1 + d.x2) / 2} cy={d.y1} />}
                               {expandedBranches.length && expandedBranches[0] === d.bid &&
                               <g>
                                   <use xlinkHref="#icon-triangle-up" x={(d.x1 + d.x2) / 2 - 4} y={d.y1 + 2} width="10" height="10" style={{fill: '#e41a1c'}} />
                               </g>
                               }
                           </g>))}
                       {verticalLines.map((d, i) =>
                           <line className="branch-line" key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                       )}
                   </g>
                   <g className="names">{names}</g>

                   {missing && missing.length &&
                   <g>
                       <text x={missingBranch.x1} y={missingBranch.y1} dx="1" dy="-2" textAnchor={side === 'left'? 'end': 'start'} >missing</text>
                       <text x={missingBranch.x1} y={missingBranch.y1} dx="1" dy="12" textAnchor={side === 'left'? 'end': 'start'} >taxa</text>
                   </g>}

                   {(!isStatic || isComparing) &&
                   <g className="responding-boxes">
                       {responsiveBoxes.map(d =>
                           <rect className={cn("box")}
                                 x={d.x} y={d.y} width={d.width} height={d.height}
                                 onMouseEnter={tree.tid === referenceTree.id && branches.hasOwnProperty(d.bid)? this.props.onToggleCheckingBranch.bind(null, d.bid): null}
                                 onMouseLeave={tree.tid === referenceTree.id && branches.hasOwnProperty(d.bid)? this.props.onToggleCheckingBranch.bind(null, null): null}
                                 onClick={(e) => {
                                     console.log('clicking on :', d.bid, 'ctrl: ', e.ctrlKey, ' alt: ', e.altKey, 'meta: ', e.metaKey);
                                     let isCtrl = e.ctrlKey || e.metaKey;
                                     if (e.altKey && isCtrl) {
                                         if (branches.hasOwnProperty(d.bid) && this.props.metricBranch !== d.bid)
                                             this.props.onChangeDistanceMetric(d.bid)
                                     } else if (isCtrl) {
                                         // TODO should allow missing to be expanded
                                         if (branches.hasOwnProperty(d.bid))
                                             this.props.onSelectBranch(d.bid);
                                     } else {
                                         this.props.toggleHighlightMonophyly(tree.tid, d.bid, e.shiftKey)
                                     } }}
                                 key={d.bid}>
                           </rect>)}
                   </g>
                   }
               </g>
            )
        };

        let svgWidth = (isComparing? dendrogram[0].treeBoundingBox.width + dendrogram[1].treeBoundingBox.width:
            dendrogram.treeBoundingBox.width) + spec.margin.left + spec.margin.right;
        let svgHeight = (isComparing? Math.max(dendrogram[0].treeBoundingBox.height, dendrogram[1].treeBoundingBox.height):
                dendrogram.treeBoundingBox.height) + spec.margin.top + spec.margin.bottom;
        return (
            <svg width={svgWidth}
                 height={svgHeight}>
                <g transform={`translate(${spec.margin.left},${spec.margin.top})`}>
                    {isComparing &&
                        <g>
                            <g>
                                {renderDendrogram(tree, dendrogram[0], 'right', selected)}
                            </g>
                            <g transform={`translate(${dendrogram[0].treeBoundingBox.width}, 0)`}>
                                {renderDendrogram(this.props.comparingTree, dendrogram[1], 'left', this.props.comparingTreeExpansion)}
                            </g>
                        </g>
                    }
                    {!isComparing && renderDendrogram(tree, dendrogram, 'right', selected)}
                </g>
                <symbol id="icon-triangle-up" viewBox="0 0 12 16">
                    <title>triangle-up</title>
                    <path d="M5.996 4l-5.996 5.996h11.992l-5.996-5.996z"></path>
                </symbol>
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
            let topo = 0, longestEntity = spec.minLabelWidth;
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
                    width: treeWidth - b[bid].x1 - spec.boundingBoxSideMargin,
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
                    width: treeWidth - b[bid].x1 - spec.boundingBoxSideMargin,
                    height: spec.responsiveAreaSize};
                text.push({entity_id: ent_id,  x: !aligned? curX: (side === 'right'? topologyWidth: treeWidth - topologyWidth), y: curY});
                curY += spec.marginOnEntity;
            }
        };

        traverse(tree.rootBranch, 0);

        // Construct a tree for the missing taxa
        let missing = tree.missing;
        if (missing && missing.length) {
            // curY += 20;
            let missingTaxaBranchPos = (missing.length - 1) / 2 * spec.marginOnEntity + curY;
            b['missing_taxa'] = {bid: 'missing_taxa', x1: topologyWidth - 80, x2: topologyWidth - 30,
                y1: missingTaxaBranchPos, y2: missingTaxaBranchPos,
                isLeaf: false};
            boundingBox['missing_taxa'] = {x: topologyWidth - 80, y: curY - boxHalfWidth,
                width: treeWidth - topologyWidth + 80 - spec.boundingBoxSideMargin,
                height: missing.length * spec.marginOnEntity};
            connectLines.push({x1: topologyWidth - 30, x2: topologyWidth - 30, y1: curY, y2: curY + (missing.length - 1) * spec.marginOnEntity});
            for (let i = 0; i < missing.length; i++) {
                let bid = 'm-' + missing[i];
                b[bid] = {bid, x1: topologyWidth - 30, x2: topologyWidth, y1: curY, y2: curY, isLeaf: true};
                boundingBox[bid] = {x: topologyWidth, y: curY - boxHalfWidth,
                    width: treeWidth - topologyWidth - spec.boundingBoxSideMargin, height: spec.responsiveAreaSize};
                text.push({entity_id: missing[i],  x: !aligned? topologyWidth: (side === 'right'? topologyWidth: treeWidth - topologyWidth), y: curY});
                curY += spec.marginOnEntity;
            }
        }

        let branchSpecs = [];
        let responsiveBoxes = [];
        for (let bid in b) if (b.hasOwnProperty(bid)) {
            branchSpecs.push({...b[bid], bid, isLeaf: bid in branches? branches[bid].isLeaf: b[bid].isLeaf});
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
            treeBoundingBox: {width: treeWidth, height: curY + 10},
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
    let compExp = [];
    if (c.tid) {
        den1 = getDendrogramSpecs(state, null, 'right', true);
        den2 = getDendrogramSpecs(state, c.tid, 'left', true);
        let tree = state.inputGroupData.trees[state.referenceTree.id];
        compExp = state.referenceTree.selected.map(s => tree.branches[s][state.cb][c.tid].bid);
    } else {
        den = getDendrogramSpecs(state, null, null, state.referenceTree.universalBranchLen);
    }
    return {
        dendrogram: c.tid? [den1, den2]: den,
        highlight: state.highlight,
        referenceTree: state.referenceTree,
        tree: state.inputGroupData.trees[ownProps.tid? ownProps.tid: state.referenceTree.id],
        comparingTree: c.tid? state.inputGroupData.trees[c.tid]: null,
        comparingTreeExpansion: c.tid? compExp: null,
        spec: state.dendrogramSpec,
        entities: state.inputGroupData.entities,
        metricBranch: state.overview.metricMode === 'global'? null: state.overview.metricBranch,
        rangeSelection: state.attributeExplorer.activeSelectionId >= 0?
            state.attributeExplorer.selection[state.attributeExplorer.activeSelectionId]: null,
        cb: state.cb
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleHighlightMonophyly: (tid, bid, addictive=false) => {
            dispatch(toggleHighlightMonophyly(tid, bid, addictive));
        },
        onToggleCheckingBranch: bid => {dispatch(toggleCheckingBranch(bid))},
        onSelectBranch: (bid) => {
            dispatch(selectBranchOnFullDendrogram(bid));
        },
        onChangeDistanceMetric: (bid) => {
            dispatch(changeDistanceMetric('local', bid));
        },
        onHighlightDup: eid => {dispatch(toggleHighlightDuplicate(eid))},
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FullDendrogram);
