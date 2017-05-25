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
             entities, rangeSelection} = this.props;
        let {expanded, highlightEntities, highlightUncertainEntities} = referenceTree;
        let isComparing = comparingTree !== null;

        highlightUncertainEntities = isStatic? null: highlightUncertainEntities;
        let highlightEntitiesMapping = createMappingFromArray(highlightEntities || []);
        let highlightUncertainEntitiesMapping = createMappingFromArray(highlightUncertainEntities || []);
        let {attribute, range} = rangeSelection || {};

        let renderDendrogram = (tree, dendrogram, side='right', expandedBranches=[]) => {
            let {branchSpecs, verticalLines, responsiveBoxes,hoverBoxes, textSpecs} = dendrogram;
            let {missing, branches} = tree;

            let inRange = d => rangeSelection && !rangeSelection.cb && !d.isLeaf
            && branches.hasOwnProperty(d.bid) && branches[d.bid].hasOwnProperty(attribute)
            && range[0] <= branches[d.bid][attribute] && branches[d.bid][attribute] <= range[1];

            let cbInRange = false;
            // if (rangeSelection && rangeSelection.cb && tree.tid !== referenceTree.id) {
            //     let corr = this.props.tree.branches[selected[0]][cb][tree.tid];
            //     if (corr) {
            //         let v = attribute === 'similarity'? corr.jac: tree.branches[corr.bid][attribute];
            //         cbInRange = range[0] <= v && v <= range[1];
            //     }
            // }

            let highlightBoxes = [];
            for (let i = 0; i < highlight.bids.length; i++) {
                let h = highlight.bids[i];
                if (h.hasOwnProperty(tree.tid)) {
                    let c = highlight.colorScheme[h.color];
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

            let names = textSpecs.map((d, i) =>
                <text key={i} className="entity-name"
                      x={d.x} y={d.y} dx={side === 'left'? -5: 5} dy={3}
                      textAnchor={side === 'left'? 'end': 'start'}
                      onMouseEnter={this.props.onHighlightDup.bind(null, d.entity_id)}
                      onMouseLeave={this.props.onHighlightDup.bind(null, null)}
                >
                    {entities[d.entity_id].name}
                </text>);
            let getPointerXPosition = (d, side) => {
                let x;
                if (side === 'left') {
                    x = d.x - spec.labelUnitCharWidth * entities[d.entity_id].name.length - 20;
                } else {
                    x = d.x + spec.labelUnitCharWidth * entities[d.entity_id].name.length;
                }
                return x;
            };
            let pointerStyle = {
                fill: 'black',
                // transform: side === 'left'? 'rotateY(180deg)': 'none'
            };

            let missingBranch = missing && missing.length? branchSpecs.filter(d => d.bid === 'missing_taxa')[0]: null;

            return (
               <g>
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
                               <line className={cn('branch-line', {expanded: expandedBranches.hasOwnProperty(d.bid),
                                   'range-selected': tree.tid === referenceTree.id && inRange(d),
                                   'checking': tree.tid === referenceTree.id && referenceTree.checkingBranch === d.bid})}
                                     x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                               {tree.tid === referenceTree.id && this.props.metricBranch === d.bid && d.bid != null &&
                               <circle className="metric-branch-indicator" r="4" cx={(d.x1 + d.x2) / 2} cy={d.y1} />}
                           </g>))}
                       {verticalLines.map((d, i) =>
                           <line className="branch-line" key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                       )}
                   </g>

                   <g className="names">{names}</g>
                   {textSpecs.filter(d => highlightEntitiesMapping.hasOwnProperty(d.entity_id)).map((d, i)=>
                       <use xlinkHref={`#ref-tree-taxon-pointer${side === 'left'? '-left': ''}`} key={i} style={pointerStyle}
                            x={getPointerXPosition(d, side)} y={d.y - 2}
                            width={20} height={10} />
                   )}
                   {textSpecs.filter(d => highlightUncertainEntitiesMapping.hasOwnProperty(d.entity_id)).map((d, i)=>
                       <use xlinkHref={`#ref-tree-taxon-pointer-uncertain${side === 'left'? '-left': ''}`} key={i} style={pointerStyle}
                            x={getPointerXPosition(d, side)} y={d.y - 2}
                            width={20} height={10} />
                   )}

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

                   {branchSpecs.filter(d => expandedBranches.hasOwnProperty(d.bid)).map((d, i) =>
                       <text key={i} x={(d.x1 + d.x2) / 2 - 4} y={d.y1} dy="-4" style={{fill: '#e41a1c', fontSize: '12px', fontWeight: 'bold'}}>
                           {expandedBranches[d.bid]}
                       </text>
                   )}
               </g>
            )
        };

        let svgWidth = (isComparing? dendrogram[0].treeBoundingBox.width + dendrogram[1].treeBoundingBox.width:
            dendrogram.treeBoundingBox.width) + spec.margin.left + spec.margin.right;
        let svgHeight = (isComparing? Math.max(dendrogram[0].treeBoundingBox.height, dendrogram[1].treeBoundingBox.height):
                dendrogram.treeBoundingBox.height) + spec.margin.top + spec.margin.bottom;

        return (
            <svg width={svgWidth} height={svgHeight}>
                <g transform={`translate(${spec.margin.left},${spec.margin.top})`}>
                    {isComparing &&
                        <g>
                            <g>
                                {renderDendrogram(tree, dendrogram[0], 'right', expanded)}
                            </g>
                            <g transform={`translate(${dendrogram[0].treeBoundingBox.width}, 0)`}>
                                {renderDendrogram(this.props.comparingTree, dendrogram[1], 'left', this.props.comparingTreeExpansion)}
                            </g>
                        </g>
                    }
                    {!isComparing && renderDendrogram(tree, dendrogram, 'right', expanded)}
                </g>

                <defs>
                    <symbol id="ref-tree-taxon-pointer" viewBox="0 0 22 10">
                        <path d="M5 0 L0 3L5 6Z"/>
                        <path d="M11 0 L6 3L11 6Z"/>
                        <path d="M17 0 L12 3L17 6Z"/>
                        {/*<line x1="1" y1="3" x2="22" y2="3" style={{strokeWidth: '1px', stroke: 'black'}}/>*/}
                    </symbol>
                    <symbol id="ref-tree-taxon-pointer-uncertain" viewBox="0 0 20 10">
                        <path d="M5 0 L0 3L5 6Z"/>
                    </symbol>
                    <symbol id="ref-tree-taxon-pointer-left" viewBox="0 0 20 10">
                        <path d="M0 0 L0 6L5 3Z"/>
                        <path d="M7 0 L7 6L12 3Z"/>
                        <path d="M14 0 L14 6L19 3Z"/>
                    </symbol>
                    <symbol id="ref-tree-taxon-pointer-uncertain-left" viewBox="0 0 20 10">
                        <path d="M0 0 L0 6L5 3Z"/>
                    </symbol>
                </defs>
            </svg>
        )
    }
}


let getDendrogramSpecs = createSelector(
    [(state, tid) => tid? state.inputGroupData.trees[tid]: state.inputGroupData.referenceTree,
        state => state.inputGroupData.entities,
        (_, tid, alignToSide) => alignToSide,
        (_, tid, alignToSide, ignoreBranchLen) => ignoreBranchLen,
        state => state.dendrogramSpec],
    (tree, entities, side, ignoreBranchLen, spec) => {

        let {branches} = tree;
        let aligned = side === 'left' || side === 'right';

        let getTreeWidth = function() {
            let maxTopoWidth = 0, depth = 0;
            let longestEntity = aligned? spec.comparingLabelWidth: spec.minLabelWidth;
            let traverse = function(bid, cur, dep) {
                let b = branches[bid];
                cur += ignoreBranchLen? spec.unitBranchLength: b.length;
                maxTopoWidth = Math.max(cur, maxTopoWidth);
                depth = Math.max(depth, dep);
                if ('left' in b) {
                    traverse(b.left, cur, dep + 1);
                    traverse(b.right, cur, dep + 1);
                } else {
                    longestEntity = Math.max(longestEntity, entities[b.entity].name.length * spec.labelUnitCharWidth);
                }
            };
            longestEntity += 20;        // For the taxon pointer mark

            traverse(tree.rootBranch, 0, 1);
            let topologyWidth = ignoreBranchLen? maxTopoWidth: (aligned? spec.comparingTopologyWidth: spec.defaultTopologyWidth);
            return {treeWidth: topologyWidth + longestEntity, topologyWidth, maxLength: maxTopoWidth, depth};
        };
        let {treeWidth, topologyWidth, maxLength, depth} = getTreeWidth();

        let xScale = ignoreBranchLen? null: scaleLinear().domain([0, maxLength]).range([0, topologyWidth - depth * spec.minBranchLength]);
        let b = {};
        let connectLines = [];
        let curY = 0;
        let text = [];

        // THe bounding box for a subtree, keyed by the leading branch
        let boundingBox = {};
        let boxHalfWidth = (spec.responsiveAreaSize - 1) / 2;

        let traverse = (bid, curX) => {
            let bLength = branches[bid].length;
            let t = ignoreBranchLen? spec.unitBranchLength: (xScale(bLength) + spec.minBranchLength);
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


function mapStateToProps(state) {
    let ref = state.inputGroupData.referenceTree;
    let c = state.pairwiseComparison;
    let den, den1, den2;
    let compExp = {};
    if (c.tid) {
        den1 = getDendrogramSpecs(state, null, 'right', state.referenceTree.universalBranchLen);
        den2 = getDendrogramSpecs(state, c.tid, 'left', state.referenceTree.universalBranchLen);

        // Get the corresponding branches in the comparing tree
        let refExp = state.referenceTree.expanded;
        for (let bid in refExp) if (refExp.hasOwnProperty(bid)) {
            let corr = ref.branches[bid][state.cb];
            if (corr.hasOwnProperty(c.tid) && corr[c.tid].bid) {
                let corrBid = corr[c.tid].bid;
                // It is possible that two different branches in the reference tree correspond to the same branch in the comparing tree
                compExp[corrBid] = compExp.hasOwnProperty(corrBid)? compExp[corrBid] + ',' + refExp[bid]: refExp[bid];
            }
        }
    } else {
        den = getDendrogramSpecs(state, null, null, state.referenceTree.universalBranchLen);
    }

    let ae = state.referenceTree.charts;
    return {
        dendrogram: c.tid? [den1, den2]: den,
        highlight: state.highlight,
        referenceTree: state.referenceTree,
        tree: ref,
        comparingTree: c.tid? state.inputGroupData.trees[c.tid]: null,
        comparingTreeExpansion: c.tid? compExp: null,
        spec: state.dendrogramSpec,
        entities: state.inputGroupData.entities,
        metricBranch: state.overview.metricMode === 'global'? null: state.overview.metricBranch,
        rangeSelection: ae.activeSelectionId >= 0? ae.selection[ae.activeSelectionId]: null,
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
