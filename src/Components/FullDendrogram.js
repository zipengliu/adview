/**
 * Created by Zipeng Liu on 2016-11-04.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import cn from 'classnames';
import {toggleHighlightMonophyly, selectBranchOnFullDendrogram, toggleCheckingBranch,
    toggleHighlightDuplicate, toggleExtendedMenu} from '../actions';
import {createMappingFromArray} from '../utils';

import './FullDendrogram.css';

class FullDendrogram extends Component {
    render() {
        let {dendrogram, isStatic,  spec, tree, referenceTree, comparingTree, highlight,
             entities, rangeSelection, distributions} = this.props;
        let {expanded, highlightEntities, highlightUncertainEntities, userSpecified, membershipViewer} = referenceTree;
        let isComparing = comparingTree !== null;
        let taxaMembership = membershipViewer.map(m => {
            let d = distributions[0][m.bid];
            return createMappingFromArray(d.entities[d.treeToBin[m.tid]]);
        });

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

            let order = [];
            for (let h of highlight.bids) if (h.hasOwnProperty(tree.tid)) {
                let c = highlight.colorScheme[h.color];
                for (let bid of h[tree.tid]) {
                    order.push({bid, color: c});
                }
            }

            let highlightBoxes =
                order.sort((o1, o2) => (hoverBoxes[o2.bid].height - hoverBoxes[o1.bid].height))
                    .map((o, i) => <rect className="highlight-box" key={i}
                                      {...hoverBoxes[o.bid]} style={{fill: o.color}} />);


            let names = textSpecs.map((d, i) =>
                <text key={i} className="entity-name"
                      x={d.x} y={d.y} dx={side === 'left'? -8: 8} dy={3}
                      textAnchor={side === 'left'? 'end': 'start'}
                      onMouseEnter={this.props.onHighlightDup.bind(null, d.entity_id)}
                      onMouseLeave={this.props.onHighlightDup.bind(null, null)}
                >
                    {entities[d.entity_id].name}
                </text>);

            // let missingBranch = missing && missing.length? branchSpecs.filter(d => d.bid === 'missing_taxa')[0]: null;
            let firstMissingTaxa, missingBoxRect;
            if (missing && missing.length) {
                firstMissingTaxa = textSpecs[textSpecs.length - missing.length];
                missingBoxRect = side === 'left'? {
                    x: 5, width: firstMissingTaxa.x + 10
                }: {
                    x: firstMissingTaxa.x - 5, width: dendrogram.treeBoundingBox.width - firstMissingTaxa.x + 5
                };
                missingBoxRect.y = firstMissingTaxa.y - 5;
                missingBoxRect.height = textSpecs[textSpecs.length - 1].y - firstMissingTaxa.y + 10;
            }

            return (
               <g className={cn({'reference-tree-g': tree.tid === referenceTree.id, 'comparing-tree-g': tree.tid !== referenceTree.id})}>
                   {tree.tid !== referenceTree.id && false &&
                   <use xlinkHref="#comparing-tree-indicator-in-full" x={dendrogram.treeBoundingBox.width - 10} y="5"
                        width="16" height="16"/>
                   }

                   <g>{highlightBoxes}</g>
                   <g className="topology">
                       {branchSpecs.map((d, i) =>
                           (<g key={d.bid}>
                               <line className={cn('branch-line', {expanded: expandedBranches.hasOwnProperty(d.bid),
                                   'range-selected': tree.tid === referenceTree.id && inRange(d),
                                   'checking': referenceTree.checkingBranchTid === tree.tid && referenceTree.checkingBranch === d.bid})}
                                     x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                               {tree.tid === referenceTree.id && this.props.metricBranch === d.bid && d.bid != null &&
                               <circle className="metric-branch-indicator" r="4" cx={(d.x1 + d.x2) / 2} cy={d.y1} />}
                           </g>))}
                       {verticalLines.map((d, i) =>
                           <line className="branch-line" key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                       )}
                   </g>

                   <g className="names"
                      transform={`translate(${membershipViewer.length * spec.membershipViewerGap * (side === 'left'? -1: 1)},0)`}>
                       {names}
                   </g>
                   {textSpecs.filter(d => highlightEntitiesMapping.hasOwnProperty(d.entity_id)).map((d, i)=>
                       <use xlinkHref="#ref-tree-taxon-pointer" key={i}
                            x={side === 'left'? d.x - 6: d.x} y={d.y - 3}
                            width={8} height={8} />
                   )}
                   {textSpecs.filter(d => highlightUncertainEntitiesMapping.hasOwnProperty(d.entity_id)).map((d, i)=>
                       <use xlinkHref="#ref-tree-taxon-pointer-uncertain" key={i}
                            x={side === 'left'? d.x - 6: d.x} y={d.y - 3}
                            width={8} height={8} />
                   )}

                   {membershipViewer.length > 0 &&
                   <g transform={`translate(${side === 'left'? dendrogram.treeBoundingBox.width - dendrogram.topologyWidth - spec.membershipViewerGap * membershipViewer.length: dendrogram.topologyWidth + spec.membershipViewerGap},0)`}>
                       <circle r="7" cx={tree.tid === referenceTree.id? -spec.membershipViewerGap + 4: membershipViewer.length * spec.membershipViewerGap + 3}
                               cy={-8} className="taxa-membership-highlight-marker" />
                       <text dx={tree.tid === referenceTree.id? -spec.membershipViewerGap: membershipViewer.length * spec.membershipViewerGap}
                             dy={-4} style={{fill: 'white'}}>H</text>
                       {membershipViewer.map((_, i) => <g key={i} className="taxa-membership-markers"
                                                          transform={`translate(${(tree.tid === referenceTree.id? i: membershipViewer.length - 1 - i) * spec.membershipViewerGap},0)`}>
                           <circle r="7" cx={3} cy={-8} className="taxa-membership-highlight-marker" />
                           <text dy={-4}>{i + 1}</text>
                           {textSpecs.filter(d => taxaMembership[i].hasOwnProperty(d.entity_id)).map((d, j) =>
                               <use xlinkHref="#ref-tree-taxon-pointer" key={j}
                                    x={0} y={d.y - 3}
                                    width={8} height={8} />
                           )}
                       </g>)}
                   </g>}

                   {missing && missing.length &&
                   <g>
                       {/*<text x={missingBranch.x1} y={missingBranch.y1} dx="1" dy="-2" textAnchor={side === 'left'? 'end': 'start'} >missing</text>*/}
                       {/*<text x={missingBranch.x1} y={missingBranch.y1} dx="1" dy="12" textAnchor={side === 'left'? 'end': 'start'} >taxa</text>*/}
                       <text x={firstMissingTaxa.x - 5} y={firstMissingTaxa.y}
                             style={{textAnchor: side === 'left'? 'start': 'end'}}>Missing </text>
                       <rect {...missingBoxRect} rx="5" ry="5"
                             style={{fill: 'none', stroke: 'grey', strokeWidth: '1px', strokeDasharray: '5,5'}} />
                   </g>}

                   {(!isStatic || isComparing) &&
                   <g className="responding-boxes">
                       {responsiveBoxes.map(d =>
                           <rect className={cn("box")}
                                 x={d.x} y={d.y} width={d.width} height={d.height}
                                 onMouseEnter={branches.hasOwnProperty(d.bid)?
                                     this.props.onToggleCheckingBranch.bind(null, d.bid, tree.tid): null}
                                 onMouseLeave={tree.tid === referenceTree.checkingBranchTid
                                 && branches.hasOwnProperty(d.bid)? this.props.onToggleCheckingBranch.bind(null, null, null): null}
                                 onClick={(e) => {
                                     console.log('clicking on :', d.bid, 'ctrl: ', e.ctrlKey, ' alt: ', e.altKey, 'meta: ', e.metaKey);
                                     e.stopPropagation();
                                     e.preventDefault();
                                     let isCtrl = e.ctrlKey || e.metaKey;
                                     if (e.altKey) {
                                         if (branches.hasOwnProperty(d.bid) && tree.tid === referenceTree.id)
                                             this.props.onOpenExtendedMenu(d.bid, e.clientX, e.clientY);
                                     } else if (isCtrl) {
                                         this.props.toggleHighlightMonophyly(tree.tid, d.bid, e.shiftKey)
                                     } else {
                                         if (branches.hasOwnProperty(d.bid) && tree.tid === referenceTree.id)
                                             this.props.onSelectBranch(d.bid);
                                     }
                                 }}
                                 key={d.bid}>
                           </rect>)}
                   </g>
                   }

                   {tree.tid === referenceTree.id && branchSpecs.filter(d => userSpecified.hasOwnProperty(d.bid)).map((d, i) =>
                       <text key={i} className="clade-name"
                             x={d.x1} y={d.y1} dy="4">
                           {userSpecified[d.bid]}
                       </text>
                   )}
                   {branchSpecs.filter(d => expandedBranches.hasOwnProperty(d.bid)).map((d, i) =>
                       <g key={i}>
                           <text className="clade-name" x={d.x1} y={d.y1} dy="4">
                               {expandedBranches[d.bid]}
                           </text>
                           {tree.tid === referenceTree.id &&
                           <text className="named-clade-taxa-num"
                                 x={hoverBoxes[d.bid].x + hoverBoxes[d.bid].width} y={hoverBoxes[d.bid].y} dx="-4" dy="12">
                               {branches[d.bid].entities.length}
                           </text>
                           }
                       </g>
                   )}
               </g>
            )
        };

        let svgWidth = (isComparing? dendrogram[0].treeBoundingBox.width + dendrogram[1].treeBoundingBox.width + spec.marginBetweenPair:
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
                            <g transform={`translate(${dendrogram[0].treeBoundingBox.width + spec.marginBetweenPair}, 0)`}>
                                {renderDendrogram(this.props.comparingTree, dendrogram[1], 'left', this.props.comparingTreeExpansion)}
                            </g>
                        </g>
                    }
                    {!isComparing && renderDendrogram(tree, dendrogram, 'right', expanded)}
                </g>

                <defs>
                    <symbol id="ref-tree-taxon-pointer" viewBox="0 0 10 10">
                        <circle r={4} cx="4" cy="4" style={{fill: 'black'}} />
                    </symbol>
                    <symbol id="ref-tree-taxon-pointer-uncertain" viewBox="0 0 10 10">
                        <circle r={3} cx="4" cy="4" style={{fill: 'none', stroke: 'black', strokeWidth: '2px'}} />
                    </symbol>
                    <symbol id="comparing-tree-indicator-in-full" viewBox="0 0 16 16">
                        <path d="M8 3c-3.489 0-6.514 2.032-8 5 1.486 2.968 4.511 5 8 5s6.514-2.032 8-5c-1.486-2.968-4.511-5-8-5zM11.945 5.652c0.94 0.6 1.737 1.403 2.335 2.348-0.598 0.946-1.395 1.749-2.335 2.348-1.181 0.753-2.545 1.152-3.944 1.152s-2.763-0.398-3.945-1.152c-0.94-0.6-1.737-1.403-2.335-2.348 0.598-0.946 1.395-1.749 2.335-2.348 0.061-0.039 0.123-0.077 0.185-0.114-0.156 0.427-0.241 0.888-0.241 1.369 0 2.209 1.791 4 4 4s4-1.791 4-4c0-0.481-0.085-0.942-0.241-1.369 0.062 0.037 0.124 0.075 0.185 0.114v0zM8 6.5c0 0.828-0.672 1.5-1.5 1.5s-1.5-0.672-1.5-1.5 0.672-1.5 1.5-1.5 1.5 0.672 1.5 1.5z"></path>
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
        state => state.referenceTree.universalBranchLen,
        state => state.dendrogramSpec,
        state => state.referenceTree.membershipViewer],
    (tree, entities, side, ignoreBranchLen, spec, membershipViewer) => {
        return tree.renderFullDendrogram(entities, side, ignoreBranchLen, spec, membershipViewer);
    }
);


function mapStateToProps(state, ownProps) {
    let ref = state.inputGroupData.referenceTree;
    let c = state.pairwiseComparison;
    let den, den1, den2;
    let compExp = {};
    if (c.tid) {
        den1 = getDendrogramSpecs(state, null, 'right');
        den2 = getDendrogramSpecs(state, c.tid, 'left');

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
        den = getDendrogramSpecs(state, null, state.referenceTree.membershipViewer.length > 0? 'right': null);
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
        distributions: state.treeDistribution.data,
    };
}

function mapDispatchToProps(dispatch) {
    return {
        toggleHighlightMonophyly: (tid, bid, addictive=false) => {
            dispatch(toggleHighlightMonophyly(tid, bid, addictive));
        },
        onToggleCheckingBranch: (bid, tid) => {dispatch(toggleCheckingBranch(bid, tid))},
        onSelectBranch: (bid) => {dispatch(selectBranchOnFullDendrogram(bid))},
        onHighlightDup: eid => {dispatch(toggleHighlightDuplicate(eid))},
        onOpenExtendedMenu: (bid, x, y) => {dispatch(toggleExtendedMenu(bid, x, y))},
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FullDendrogram);
