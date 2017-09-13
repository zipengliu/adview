/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component} from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {scaleLinear, hcl, extent} from 'd3';
import {Tabs, Tab, Badge, OverlayTrigger, Tooltip, DropdownButton, MenuItem, Glyphicon} from 'react-bootstrap';
import cn from 'classnames';
import AggregatedDendrogram from './AggregatedDendrogram';
import {selectSet, changeSorting, toggleSelectTrees, toggleHighlightADBlock, changeLayoutAlgorithm,
    changeClusterAlgorithm, toggleShowAD, changeADSize, changeSkeletonLayoutParameter} from '../actions';
import {createMappingFromArray, getIntersection, makeCompareFunc} from '../utils';
import {renderSubCollectionGlyph} from './Commons';
import layoutAlgorithms from '../aggregatedDendrogramLayout';
import './Dendrogram.css';


class DendrogramContainer extends Component {
    render() {
        let {clusters, individuals, showCluster, showIndividual, spec, order, selectedTrees, rangeSelection, expandedBranches} = this.props;
        let expandedArr = Object.keys(expandedBranches);
        // Padding + border + proportion bar
        let boxWidth = spec.width + spec.margin.left + spec.margin.right + 4;
        let boxHeight = spec.height + spec.margin.top + spec.margin.bottom + 4;

        let getDendroBox = (t, isCluster) => {
            let w = boxWidth, h = boxHeight;
            if (isCluster) {
                // Vertical space for the population bar of each cluster
                h += spec.proportionBarHeight + spec.proportionTopMargin;
            }
            t.selectedCnt = isCluster? t.trees.filter(tid => selectedTrees.hasOwnProperty(tid)).length:
                selectedTrees.hasOwnProperty(t.tid);
            return (
                <div className={cn("agg-dendro-box", {selected: isCluster? t.selectedCnt === t.num: selectedTrees.hasOwnProperty(t.tid)})}
                     key={t.tid}
                     style={{width: w + 'px', height: h + 'px'}}
                     onClick={(e) => {this.props.onSelectTrees(isCluster? t.trees: [t.tid], e.shiftKey)}}
                >
                    <AggregatedDendrogram data={t} spec={spec} isCluster={isCluster}
                                          isReferenceTree={t.tid === this.props.referenceTid}
                                          isComparing={t.tid === this.props.comparingTid}
                                          hoveredTrees={this.props.hoveredTrees}
                                          onToggleBlock={this.props.onToggleBlock}
                                          rangeSelection={rangeSelection}
                                          shadedGranularity={this.props.shadedHistogram.granularity} />
                </div>);
        };

        let getDisplayOrder = order => {
            if (order === 'RF') return 'RF distance';
            return `local similarity of block ${expandedBranches[order]}`;
        };

        return (
            <div className="view panel panel-default" id="aggregated-dendrograms">
                <div className="view-header panel-heading">
                        <div className="view-title" style={{display: 'inline-block'}}>Aggregated Dendrograms (AD)</div>
                </div>

                <div className="view-body panel-body" style={{display: 'flex', flexFlow: 'column nowrap'}}>
                    <div id="ad-params">
                        <span className="param-label">width: {spec.width}</span>
                        <div className="slider">
                                <input type="range" min={spec.sizeRange[0]} max={spec.sizeRange[1]} value={spec.width} step={10}
                                       onChange={(e) => {this.props.onChangeSize('width', parseInt(e.target.value))}}/>
                        </div>

                        <span className="param-label">height: {spec.height}</span>
                        <div className="slider">
                            <input type="range" min={spec.sizeRange[0]} max={spec.sizeRange[1]} value={spec.height} step={10}
                                   onChange={(e) => {this.props.onChangeSize('height', parseInt(e.target.value))}}/>
                        </div>

                        <span className="param-label">max #context levels: {spec.skeletonLayout.showDepth}</span>
                        <div className="slider" style={{width: '50px'}}>
                            <input type="range" min={spec.skeletonLayout.showDepthRange[0]} max={spec.skeletonLayout.showDepthRange[1]}
                                   value={spec.skeletonLayout.showDepth} step={1}
                                   onChange={(e) => {this.props.onChangeSkeletonParameter('showDepth', parseInt(e.target.value))}}/>
                        </div>

                        <span className="param-label">show labels: </span>
                        <input type="checkbox" checked={spec.showLabels} onChange={this.props.onChangeSize.bind(null, 'showLabels', !spec.showLabels)} />
                    </div>

                    <div>
                        <div>
                            <Glyphicon glyph={showCluster? 'triangle-bottom': 'triangle-right'}
                                       onClick={this.props.onToggleShow.bind(null, 'showCluster')}
                                       style={{marginRight: '5px', cursor: 'pointer'}}/>
                            <span>Clusters</span>
                            <Badge style={{margin: '0 5px', backgroundColor: 'black'}}>{clusters.length}</Badge>
                            {showCluster &&
                            <span>(caveat: trees in a cluster agree only on relations among named blocks (A, B, C, ...),
                                but not necessarily on context blocks)</span>
                            }
                        </div>
                        {showCluster &&
                        <div className="cluster-container">
                            {clusters.map(c => getDendroBox(c, true))}
                        </div>
                        }
                    </div>

                    <div>
                        <div>
                            <Glyphicon glyph={showIndividual? 'triangle-bottom': 'triangle-right'}
                                       onClick={this.props.onToggleShow.bind(null, 'showIndividual')}
                                       style={{marginRight: '5px', cursor: 'pointer'}}/>
                            <span>Individuals</span>
                            {showIndividual &&
                            <div style={{marginLeft: '5px', display: 'inline-block'}}>
                                <span>(sort by the </span>
                                {expandedArr.length === 0? 'RF distance ':
                                    <DropdownButton bsSize="xsmall" title={getDisplayOrder(order)} id="dropdown-sorting"
                                                    onSelect={this.props.onChangeSorting}>
                                        <MenuItem eventKey='RF'>RF distance</MenuItem>
                                        {expandedArr.map(bid =>
                                            <MenuItem key={bid} eventKey={bid}>
                                                {getDisplayOrder(bid)}
                                            </MenuItem>)}
                                    </DropdownButton>
                                }
                                <span style={{marginLeft: '2px'}}> to the reference tree)</span>
                            </div>
                            }
                        </div>

                        {showIndividual &&
                        <div>
                            <Tabs activeKey={this.props.activeSetIndex} onSelect={this.props.onSelectSet} id="set-tab">
                                {this.props.sets.map((s, i) =>
                                    <Tab eventKey={i} key={i}
                                         title={
                                             <OverlayTrigger key={i} placement="top"
                                                             overlay={<Tooltip id={`tab-${i}`}># Trees: {s.tids.length}</Tooltip>}>
                                                 <div>
                                                     {renderSubCollectionGlyph(s.glyph)}
                                                     <span>{s.title}</span>
                                                     <Badge style={{marginLeft: '5px', backgroundColor: 'black'}}>{s.tids.length}</Badge>
                                                 </div>
                                             </OverlayTrigger>
                                         } >
                                    </Tab>
                                )}
                            </Tabs>
                            <div className="individual-container">
                                {individuals.map(x => getDendroBox(x, false))}
                            </div>
                        </div>
                        }
                    </div>
                </div>

                <div className="panel-footer">
                    <div className="legend">
                        <div className="legend-section-title" style={{flexBasis: '30px'}}>Block: </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '8px', width: '14px', border: '1px solid grey'}}></div>
                            <span>context</span>
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '10px', width: '14px', border: '2px solid black'}}></div>
                            <span>exact matched (taxa membership)</span>
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '10px', width: '18px', border: '2px dotted black'}}></div>
                            <span>inexact matched</span>
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '12px', width: '16px', border: '2px dotted #888', borderRadius: '5px'}}></div>
                            <span>missing taxa</span>
                        </div>
                    </div>

                    <div className="legend">
                        <div className="legend-section-title" style={{flexBasis: '30px'}}>Tree: </div>
                        <div className="legend-item">
                            <div className="mark"><Glyphicon glyph="eye-open"/></div>
                            <span>pairwise target</span>
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '12px', width: '12px', marginTop: '2px', border: '2px solid black'}}></div>
                            <span>(bounding box) selected</span>
                        </div>
                        <div className="legend-item">
                            <div className="mark" style={{height: '12px', width: '12px', marginTop: '2px', backgroundColor: '#b82e2e', opacity: '.6'}}></div>
                            <span>hovered</span>
                        </div>
                    </div>
                </div>
            </div>
        )
    }
}



// Get the layout of all trees
let getLayouts = createSelector(
    [state => state.inputGroupData.referenceTree,
    state => state.referenceTree.expanded,
    state => state.cb,
    state => state.inputGroupData.trees,
    state => state.aggregatedDendrogram.layoutAlg,
    state => state.aggregatedDendrogram.spec],
    (referenceTree, expanded, cb, trees, layoutAlg, spec) => {
        let layoutFunc = layoutAlgorithms[layoutAlg];

        let layouts = {};
        // Order must be consistent to deal with double matching otherwise cluster algorithm (the getHash) might be compromised
        let rBids = Object.keys(expanded).sort((x, y) => {
            if (expanded[x] === expanded[y]) return 0;
            if (expanded[x] < expanded[y]) return -1;
            return 1;
        });
        for (let tid in trees) if (trees.hasOwnProperty(tid)) {
            // Get corresponding branches in the tree
            let e = {};
            for (let rBid of rBids) {
                let corr = referenceTree.branches[rBid][cb];
                if (corr.hasOwnProperty(tid) && corr[tid].bid) {
                    let corrBid = corr[tid].bid;
                    if (e.hasOwnProperty(corrBid)) {
                        // We have multiple reference branches matched to the same block
                        e[corrBid].no += '&' + expanded[rBid];
                        if (!e[corrBid].hasOwnProperty('jacs')) {
                            e[corrBid].jacs = [e[corrBid].jac];
                        }
                        e[corrBid].jacs.push(corr[tid].jac);
                    } else {
                        e[corrBid] = {
                            ...corr[tid],
                            no: expanded[rBid]
                        };
                    }
                }
            }

            // calculate the layout
            layouts[tid] = layoutFunc(trees[tid], e, spec);
        }

        return layouts;
    }
);

// Pick out the layouts that belong to the current active sub-collection
let filterLayouts = createSelector(
    [(_, layouts) => layouts,
        state => state.sets[state.aggregatedDendrogram.activeSetIndex].tids],
    (layouts, tids) => {
        let filteredLayouts = {};
        for (let i = 0; i < tids.length; i++) {
            filteredLayouts[tids[i]] = layouts[tids[i]];
        }
        return filteredLayouts;
    }
);

// Cluster trees by topology of the aggregated dendrogram
// layouts is an array of tree objects {tid, blocks, rootBlockId, branches}
// Return a dictionary of clusters, with each one {blockArr, branchArr, num}
//      Each block in the blockArr is stuffed with a mapping between the tree this cluster represents and the block id this block represents
let clusterLayoutsByTopology = createSelector(
    [state => state.aggregatedDendrogram.clusterParameter,
        (_, layouts) => layouts],
    (param, layouts) => {
        let numLayouts = Object.keys(layouts).length;

        let getHash = (blocks, rootBlockId) => {
            let getBlockRep = b => b.no? (param.checkForExact? (b.no + (b.matched? '+': '-')): b.no) : '';
            let traverse = (bid) => {
                let b = blocks[bid];
                if (b.children && b.children.length > 0) {
                    // If it has children, it must be a matched (expanded) block
                    return '(' +
                        b.children.filter(c => !!blocks[c].no).map(c => traverse(c)).join(',') +
                        ')' + getBlockRep(b);
                } else if (b.no) {
                    return getBlockRep(b);
                }
            };
            return traverse(rootBlockId);
        };

        let addTreeToCluster= (cluster, tree) => {
            cluster.trees.push(tree.tid);
            cluster.num += 1;

            // Find the same matched block in cluster.blocks
            let getClusterBlockByNo = (no) => {
                for (let bid in cluster.blocks)
                    if (cluster.blocks.hasOwnProperty(bid) && cluster.blocks[bid].no === no) {
                        return cluster.blocks[bid];
                    }
                return null;
            };

            for (let treeBlockId in tree.blocks)
                if (tree.blocks.hasOwnProperty(treeBlockId) && tree.blocks[treeBlockId].no) {
                    // Must be a matched block otherwise it is not guaranteed to be the same block
                    let tBlock = tree.blocks[treeBlockId];
                    let cBlock = getClusterBlockByNo(tBlock.no);
                    if (cBlock) {
                        cBlock.represent[tree.tid] = treeBlockId;
                        cBlock.matched = cBlock.matched && tBlock.matched;
                        for (let eid in tBlock.entities) if (tBlock.entities.hasOwnProperty(eid)) {
                            if (!cBlock.entities.hasOwnProperty(eid)) {
                                cBlock.entities[eid] = 0;
                            }
                            cBlock.entities[eid] += 1;
                        }
                    }
                }
        };

        let createEmptyClusterFromTree = (t) => {
            let c = {...t, blocks: {...t.blocks}, branches: {...t.branches},
                tid: t.tid + '-c',
                num: 0, trees: [], total: numLayouts};
            let traverse = (bid) => {
                // Each block has a distribution of similarity, a distribution of entities as a map of entity to frequency.
                c.blocks[bid] = {
                    ...t.blocks[bid],
                    fill: null,
                    represent: {},
                    entities: {},
                };
                if (t.blocks[bid].children) {
                    for (let i = 0; i < t.blocks[bid].children.length; i++) {
                        traverse(t.blocks[bid].children[i]);
                    }
                }
            };
            traverse(t.rootBlockId);
            return c;
        };

        // Hash the layouts
        let clusters = {};
        for (let tid in layouts) if (layouts.hasOwnProperty(tid)) {
            let t = layouts[tid];
            let h = getHash(t.blocks, t.rootBlockId);
            if (!clusters.hasOwnProperty(h)) {
                clusters[h] = createEmptyClusterFromTree(t);
            }
            addTreeToCluster(clusters[h], t);
        }
        
        // Sort clusters by popularity
        return Object.keys(clusters)
            .sort(makeCompareFunc(clusters, 'num', false))
            .map(h => clusters[h]);
    }
);

let sortLayouts = createSelector(
    [state => state.aggregatedDendrogram.order,
        (_, layouts) => layouts,
        state => state.inputGroupData.referenceTree,
        state => state.cb
    ],
    (order, layouts, referenceTree, cb) => {
        let layoutsArray = [];
        for (let x in layouts) if (layouts.hasOwnProperty(x)) {
            layoutsArray.push(layouts[x]);
        }

        let sortFunc;
        if (order === 'RF') {
            // Sort by RF distance to reference tree
            sortFunc = (t1, t2) => referenceTree.rfDistance[t1.tid] - referenceTree.rfDistance[t2.tid];
        } else {
            // Sort by a branch similarity to the reference tree
            let corr = referenceTree.branches[order][cb];
            sortFunc = (t1, t2) => (t2.tid in corr? corr[t2.tid].jac: 1.1) - (t1.tid in corr? corr[t1.tid].jac: 1.1)
        }

        return layoutsArray.sort(sortFunc);
    }
);


let getKDEBins = (n, values, kernel, color) => {
    let valueExtent = extent(values);
    let hclColor = hcl(color);
    if (valueExtent[0] === valueExtent[1]) {
        // No uncertainty
        return false;
    }

    let scale, bins = [];
    let min = 100, max = 0;
    for (let j = 0; j < n; j++) {
        let b = 0;
        for (let i = 0; i < values.length; i++) {
            b += kernel(j/n - values[i])
        }
        if (b < min) min = b;
        if (b > max) max = b;
        bins.push(b);
    }
    scale = scaleLinear().domain([min, max]).range([150, hclColor.l]);
    let colorBins = bins.map(scale).map(l => hcl(hclColor.h, hclColor.c, l).toString());
    return colorBins;
};

let fillCluster = createSelector(
    [(_, clusterArr) => clusterArr,
        (_, clusterArr, layoutsMapping) => layoutsMapping,
        state => state.highlight,
        state => state.aggregatedDendrogram.shadedHistogram],
    (clusters, layoutsMapping, highlight, shadedHistogramSpec) => {
        // Do not change the original otherwise breaking the memoization of previous function in the pipeline
        // deep copy for the blocks esp.
        let copyBlocks = blks => {
            let newBlks = {};
            for (let bid in blks) if (blks.hasOwnProperty(bid)) {
                newBlks[bid] = {...blks[bid]};
            }
            return newBlks;
        };
        let filledClusters = clusters.map(c => ({...c, blocks: copyBlocks(c.blocks)}));
        let highlightEntities = highlight.bids.map(h => createMappingFromArray(h.entities));

        for (let cluster of filledClusters) {
            for (let bid in cluster.blocks)
                // only color the matched blocks in cluster
                if (cluster.blocks.hasOwnProperty(bid) && cluster.blocks[bid].no) {
                    let b = cluster.blocks[bid];
                    b.fill = [];
                    for (let i = 0; i < highlightEntities.length; i++) {
                        if (b.isNested && b.no.indexOf(highlight.bids[i].no) === -1) {      // The nested block only shows its own color
                            continue
                        }
                        let h = highlightEntities[i];
                        let newFill = {
                            proportion: [],
                            color: highlight.colorScheme[highlight.bids[i].color],
                            colorBins: null
                        };

                        let hasIntersection = false;
                        for (let tid in b.represent) if (b.represent.hasOwnProperty(tid)) {
                            let e = layoutsMapping[tid].blocks[b.represent[tid]].entities;
                            let intersection = getIntersection(e, h);
                            if (intersection) {
                                hasIntersection = true;
                            }
                            newFill.proportion.push(intersection / Object.keys(e).length);
                        }
                        if (hasIntersection) {
                            newFill.colorBins = getKDEBins(shadedHistogramSpec.binsFunc(b.width - 2), newFill.proportion, shadedHistogramSpec.kernel, newFill.color);
                            b.fill.push(newFill);
                        }
                    }
                }
        }
        return filledClusters;
    }
);

// Get the highlight portion of each block
let fillIndividual = createSelector(
    [(_, layouts) => layouts,
        (_, layouts, layoutsMapping) => layoutsMapping,
        state => state.highlight],
    (layouts, layoutsMapping, highlight) => {
        // Same reason to slice as in the fillCluster()
        let copyBlocks = blks => {
            let newBlks = {};
            for (let bid in blks) if (blks.hasOwnProperty(bid)) {
                newBlks[bid] = {...blks[bid]};
            }
            return newBlks;
        };
        let filledLayouts = layouts.map(l => ({...l, blocks: copyBlocks(l.blocks)}));
        let highlightEntities = highlight.bids.map(h => createMappingFromArray(h.entities));

        for (let t of filledLayouts) {
            for (let bid in t.blocks) if (t.blocks.hasOwnProperty(bid) && !!t.blocks[bid].entities) {
                let b = t.blocks[bid];
                b.fill = highlightEntities.map((h, i) => ({
                    proportion: b.isNested && !!b.no && b.no.indexOf(highlight.bids[i].no) === -1? 0:         // The nested block only shows its own color
                        getIntersection(b.entities, h) / Object.keys(b.entities).length,
                    color: highlight.colorScheme[highlight.bids[i].color]
                })).filter(a => a.proportion > 0);
            }
        }
        return filledLayouts;
    }
);

let mapStateToProps = (state) => {
    let layouts = getLayouts(state);
    let clusterLayouts = clusterLayoutsByTopology(state, layouts);

    let filteredLayouts = filterLayouts(state, layouts);
    let layoutArray = sortLayouts(state, filteredLayouts);

    let filledClusters = fillCluster(state, clusterLayouts, layouts);
    let filledIndividuals = fillIndividual(state, layoutArray, layouts);

    return {
        ...state.aggregatedDendrogram,
        referenceTid: state.referenceTree.id,
        isFetching: state.referenceTree.isFetching,
        fetchError: state.referenceTree.fetchError,
        sets: state.sets,
        comparingTid: state.pairwiseComparison.tid,
        rangeSelection: state.cbAttributeExplorer.activeSelectionId === 0? {
            attrName: 'support',
            range: state.cbAttributeExplorer.selection[state.cbAttributeExplorer.activeSelectionId].range
        }: null,
        selectedTrees: state.selectedTrees,
        hoveredTrees: state.hoveredTrees,
        expandedBranches: state.referenceTree.expanded,

        clusters: filledClusters,
        individuals: filledIndividuals,
    }
};

let mapDispatchToProps = (dispatch) => ({
    onSelectTrees: (tids, isAdd) => {dispatch(toggleSelectTrees(tids, isAdd))},
    onSelectSet: i => {dispatch(selectSet(i))},
    onChangeSorting: (key) => {dispatch(changeSorting(key))},
    onToggleShow: (category) => {dispatch(toggleShowAD(category))},
    onToggleBlock: (tids, e, e1) => {dispatch(toggleHighlightADBlock(tids, e, e1))},
    onChangeSize: (dim, v) => {dispatch(changeADSize(dim, v))},
    onChangeSkeletonParameter: (a, v) => {dispatch(changeSkeletonLayoutParameter(a, v))},
});

export default connect(mapStateToProps, mapDispatchToProps)(DendrogramContainer);