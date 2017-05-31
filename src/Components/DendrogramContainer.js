/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component} from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {scaleLinear, hsl, extent} from 'd3';
import {Tabs, Tab, Button, ButtonGroup, Badge, OverlayTrigger, Tooltip, FormGroup, Radio, DropdownButton, MenuItem} from 'react-bootstrap';
import cn from 'classnames';
import AggregatedDendrogram from './AggregatedDendrogram';
import {selectSet, changeSorting, toggleAggregationMode, toggleHighlightEntities, toggleSelectTrees, toggleHighlightTrees} from '../actions';
import {createMappingFromArray, getIntersectionSet, isSubset} from '../utils';
import {renderSubCollectionGlyph} from './Commons';
import {calcFrondLayout, calcRemainderLayout} from '../aggregatedDendrogramLayout';
import './Dendrogram.css';


class DendrogramContainer extends Component {
    render() {
        let {spec, mode, order, dendrograms, selectedTrees, rangeSelection, expandedBranches} = this.props;
        let isClusterMode = mode.indexOf('cluster') !== -1;
        let expandedArr = Object.keys(expandedBranches);
        // Padding + border + proportion bar
        let boxWidth = spec.size + spec.margin.left + spec.margin.right + 4;
        let boxHeight = spec.size + spec.margin.top + spec.margin.bottom + 4 + (isClusterMode? spec.proportionBarHeight + spec.proportionTopMargin: 0);

        let getDendroBox = t => {
            t.selectedCnt = isClusterMode? t.trees.filter(tid => selectedTrees.hasOwnProperty(tid)).length:
                selectedTrees.hasOwnProperty(t.tid);
            let div = (
                <div className={cn("agg-dendro-box", {selected: isClusterMode? t.selectedCnt === t.num: selectedTrees.hasOwnProperty(t.tid)})}
                     key={t.tid}
                     style={{width: boxWidth + 'px', height: boxHeight + 'px'}}
                     onMouseEnter={this.props.onHighlightTrees.bind(null, isClusterMode? t.trees: [t.tid])}
                     onMouseLeave={this.props.onHighlightTrees.bind(null, null)}
                     onClick={(e) => {this.props.onSelectTrees(isClusterMode? t.trees: [t.tid], e.shiftKey)}}
                >
                    <AggregatedDendrogram data={t} spec={spec} mode={mode}
                                          isReferenceTree={t.tid === this.props.referenceTid}
                                          hoveredTrees={this.props.hoveredTrees}
                                          onToggleBlock={this.props.onToggleBlock}
                                          rangeSelection={rangeSelection} shadedGranularity={this.props.shadedHistogram.granularity} />
                </div>);
            if (isClusterMode) {
                return div;
            } else {
                return (
                    <OverlayTrigger key={t.tid} rootClose placement="top" overlay={<Tooltip id={`tree-name-${t.tid}`}>{t.name}</Tooltip>}>
                        {div}
                    </OverlayTrigger>
                )
            }
        };

        let getDisplayOrder = order => {
            if (order === 'RF') return 'RF distance';
            return `local similarity of block ${expandedBranches[order]}`;
        };

        return (
            <div className="view panel panel-default" id="aggregated-dendrograms">
                <div className="view-header panel-heading">
                        <div className="view-title" style={{display: 'inline-block'}}>Aggregated Dendrograms</div>
                </div>

                <div className="view-body panel-body" style={{display: 'flex', flexFlow: 'column nowrap'}}>

                    <div>
                        <FormGroup style={{display: 'inline-block'}}>
                            <Radio inline checked={mode === 'frond'} onChange={this.props.onToggleMode.bind(null, 'frond')}>individual: frond</Radio>
                            <Radio inline checked={mode === 'supercluster'} onChange={this.props.onToggleMode.bind(null, 'supercluster')}>cluster: relaxed-topo</Radio>
                            <Radio inline checked={mode === 'topo-cluster'} onChange={this.props.onToggleMode.bind(null, 'topo-cluster')}>cluster: topo</Radio>
                            <Radio inline checked={mode === 'remainder'} onChange={this.props.onToggleMode.bind(null, 'remainder')}>
                                <span style={{textDecoration: 'line-through'}}>remainder</span>
                            </Radio>
                        </FormGroup>

                        <div style={{marginLeft: '20px', display: 'inline-block'}}>
                            <span>Sort by the </span>
                            {isClusterMode? <span>#trees of a cluster</span>:
                                (expandedArr.length === 0? 'RF distance ':
                                        <DropdownButton bsSize="xsmall" title={getDisplayOrder(order)} id="dropdown-sorting"
                                        onSelect={this.props.onChangeSorting}>
                                            <MenuItem eventKey='RF'>RF distance</MenuItem>
                                            {expandedArr.map(bid =>
                                                <MenuItem key={bid} eventKey={bid}>
                                                    {getDisplayOrder(bid)}
                                                </MenuItem>)}
                                        </DropdownButton>
                                )
                            }
                            {!isClusterMode && <span style={{marginLeft: '2px'}}> to the reference tree.</span>}
                        </div>

                    </div>

                    <Tabs activeKey={this.props.activeSetIndex} onSelect={this.props.onSelectSet} id="set-tab">
                        {this.props.sets.map((s, i) =>
                            <Tab eventKey={i} key={i}
                                 title={
                                     <OverlayTrigger key={i} placement="top"
                                                     overlay={<Tooltip id={`tab-${i}`}>
                                                         {isClusterMode? `# Clusters: ${dendrograms.length}; ` :''}
                                                         # Trees: {s.tids.length}</Tooltip>}>
                                         <div>
                                             {renderSubCollectionGlyph(s.glyph)}
                                             <span>{s.title}</span>
                                             {i === this.props.activeSetIndex &&
                                             <Badge style={{marginLeft: '5px', backgroundColor: 'black'}}>{dendrograms.length}</Badge>
                                             }
                                         </div>
                                     </OverlayTrigger>
                                 } >
                            </Tab>
                        )}
                    </Tabs>

                    <div className="dendrogram-container">
                        {dendrograms.map(getDendroBox)}
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
    state => state.aggregatedDendrogram.mode,
    state => state.aggregatedDendrogram.spec],
    (referenceTree, expanded, cb, trees, mode, spec) => {
        console.log('getLayouts...');

        let layoutFunc = calcFrondLayout;
        if (mode === 'remainder') layoutFunc = calcRemainderLayout;

        let layouts = {};
        for (let tid in trees) if (trees.hasOwnProperty(tid)) {
            // Get corresponding branches in the tree
            let e = {};
            for (let rBid in expanded) if (expanded.hasOwnProperty(rBid)) {
                let corr = referenceTree.branches[rBid][cb];
                if (corr.hasOwnProperty(tid) && corr[tid].bid) {
                    e[corr[tid].bid] = {
                        ...corr[tid],
                        no: expanded[rBid]
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
        console.log('Filtering layouts...');
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
    [state => state.aggregatedDendrogram.mode === 'supercluster',
        (_, layouts) => layouts],
    (isSuperCluster, layouts) => {
        console.log('Clustering layouts by topology...');
        let numLayouts = Object.keys(layouts).length;

        let getHash = (blocks, rootBlockId) => {
            // if b.n is 0, it means it is not gonna show up, it's different than those presented blocks
            let getBlockRep = b => isSuperCluster? (b.n === 0? '0': 'x'): b.n.toString();
            let traverse = (bid) => {
                let b = blocks[bid];
                if (b.children && b.children.length > 0) {
                    return '(' + b.children.map(c => traverse(c)).join(',') + ')' + getBlockRep(b);
                } else {
                    return getBlockRep(b);
                }
            };
            return traverse(rootBlockId);
        };

        let addRepresent = (clusterBlocks, clusterRootBlockId, addingBlocks, addingTreeId, addingRootBlockId) => {
            let traverse = (clusterBid, addingBid) => {
                let b = clusterBlocks[clusterBid];
                if (!addingBlocks.hasOwnProperty(addingBid)) {
                    // A cluster might not share the same topology
                    return;
                }
                b.represent[addingTreeId] = addingBid;
                b.matched = b.matched && addingBlocks[addingBid].matched;       // Here is problematic, outgroup does not align with ingroup!
                for (let e in addingBlocks[addingBid].entities) if (addingBlocks[addingBid].entities.hasOwnProperty(e)) {
                    if (!b.entities.hasOwnProperty(e)) {
                        b.entities[e] = 0;
                    }
                    b.entities[e] += 1;
                }

                if (b.children) {
                    for (let i = 0; i < b.children.length; i++) {
                        traverse(b.children[i], addingBlocks[addingBid].children[i])
                    }
                }
            };
            traverse(clusterRootBlockId, addingRootBlockId);
            return clusterBlocks;
        };

        let createEmptyClusterFromTree = (t) => {
            let c = {...t, blocks: {...t.blocks}, branches: {...t.branches},
                tid: t.tid + '-c',
                num: 0, trees: [], total: numLayouts};
            let traverse = (bid) => {
                // Each block has a distribution of similarity, a distribution of entities as a map of entity to frequency.
                c.blocks[bid] = {
                    ...c.blocks[bid],
                    represent: {},
                    entities: {},
                    matched: true,
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
            clusters[h].num += 1;
            clusters[h].trees.push(tid);
            addRepresent(clusters[h].blocks, clusters[h].rootBlockId, t.blocks, tid, t.rootBlockId);
        }
        return clusters;
    }
);

let sortLayouts = createSelector(
    [state => state.aggregatedDendrogram.mode.indexOf('cluster') !== -1,
        state => state.aggregatedDendrogram.order,
        (_, layouts) => layouts,
        state => state.inputGroupData.referenceTree,
        state => state.cb
    ],
    (isCluster, order, layouts, referenceTree, cb) => {
        console.log('Sorting layouts...', isCluster, order);

        let res = [];
        for (let x in layouts) if (layouts.hasOwnProperty(x)) {
            res.push(layouts[x]);
        }

        let sortFunc;
        if (isCluster) {
            // Cluster AD is sort by the population of cluster
            sortFunc = (t1, t2) => t2.num - t1.num;
        } else {
            if (order === 'RF') {
                // Sort by RF distance to reference tree
                sortFunc = (t1, t2) => referenceTree.rfDistance[t1.tid] - referenceTree.rfDistance[t2.tid];
            } else {
                // Sort by a branch similarity to the reference tree
                let corr = referenceTree.branches[order][cb];
                sortFunc = (t1, t2) => (t2.tid in corr? corr[t2.tid].jac: 1.1) - (t1.tid in corr? corr[t1.tid].jac: 1.1)
            }
        }

        return res.sort(sortFunc);
    }
);


let getKDEBins = (n, values, kernel) => {
    let valueExtent = extent(values);
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
    scale = scaleLinear().domain([min, max]).range([1, .49]);
    let colorBins = bins.map(scale).map(l => hsl(207, .44, l).toString());
    return colorBins;
};

let fillLayouts = createSelector(
    [(_, layouts) => layouts,
        state => state.highlight,
        state => state.aggregatedDendrogram.mode,
        state => state.aggregatedDendrogram.shadedHistogram],
    (layouts, highlight, mode, shadedHistogramSpec) => {
        let isClusterMode = mode.indexOf('cluster') !== -1;
        let filledLayouts = layouts.slice();
        if (isClusterMode) {

        } else {
            let highlightEntities = highlight.bids.map(h => createMappingFromArray(h.entities));

            for (let i = 0; i < filledLayouts.length; i++) {
                let t = filledLayouts[i];
                for (let bid in t.blocks) if (t.blocks.hasOwnProperty(bid)) {
                    let b = t.blocks[bid];
                    let intersections = highlightEntities
                        .map((h, i) => ({entities: getIntersectionSet(b.entities, h), color: highlight.colorScheme[highlight.bids[i].color]}))
                        .filter(a => Object.keys(a.entities).length > 0)
                        .sort((a, b) => Object.keys(b.entities).length - Object.keys(a.entities).length);
                    // Check for overlap.  For now, subset relationship is the only possible overlap relation
                    b.fill = [];
                    let curEnd = 0;
                    for (let i = 0; i < intersections.length; i++) {
                        let j;
                        for (j = 0; j < i; j++) {
                            if (isSubset(intersections[i].entities, intersections[j].entities)) break;
                        }
                        let proportion = Object.keys(intersections[i].entities).length / Object.keys(b.entities).length;
                        b.fill.push({
                            start: i === j? curEnd: b.fill[j].start,
                            width: proportion,
                            color: intersections[i].color
                        });
                        curEnd += i === j? proportion: 0;
                    }

                }
            }
        }
        return filledLayouts;
    }
);

let selectLayoutsByAttribute = createSelector(
    [(_, layouts) => layouts],
    (layouts) => {
        return layouts;
    }
);

// Get the highlight portion of each block
// Also determine whether there is branch that falls into the range selection
// FIXME: bottleneck!
let getFill = (dendroMapping, clusters, isClusterMode, highlightGroups, trees, shadedHistogram) => {
    if (isClusterMode) {
        // TODO
        // let h = createMappingFromArray(highlightGroups[0].entities);
        // for (let i = 0; i < clusters.length; i++) {
        //     let t = clusters[i];
        //     for (let bid in t.blocks) if (t.blocks.hasOwnProperty(bid)) {
        //         let b = t.blocks[bid];
        //         b.fillPercentage = [];
        //         b.rangeSelected = 0;
        //         for (let tid in b.represent) if (b.represent.hasOwnProperty(tid)) {
        //             let e = dendroMapping[tid].blocks[b.represent[tid]].entities;
        //             b.fillPercentage.push(getIntersection(e, h) / Object.keys(e).length);
        //
        //             if (rangeSelection && b.rangeSelected === 0) {
        //                 let checkingBlock = dendroMapping[tid].blocks[b.represent[tid]];
        //                 for (let bid1 in checkingBlock.branches)
        //                     if (checkingBlock.branches.hasOwnProperty(bid1) && range[0] <= trees[tid].branches[bid1][attrName]
        //                         && trees[tid].branches[bid1][attrName] <= range[1]) {
        //                         b.rangeSelected += 1;
        //                         break;
        //                     }
        //             }
        //         }
        //
        //         // construct the shaded histogram
        //         // b.colorBins = entities.length > 0?
        //         //     getKDEBins(shadedHistogram.binsFunc(b.width - 2), b.fillPercentage, shadedHistogram.kernel): null;
        //     }
        // }
    } else {
    }
};

let checkRangeSelection = (dendros, rangeSelection, referenceTree, trees, cb) => {
    let {attribute, range} = rangeSelection || {};
    let r, correspondingBranches;
    if (rangeSelection && rangeSelection.cb) {
        // only check the cb for the last expanded branch of the reference tree
        r = trees[referenceTree.id];
        correspondingBranches = r.branches[referenceTree.selected[0]][cb];
    }
    for (let tid in dendros) if (dendros.hasOwnProperty(tid)) {
        let t = dendros[tid];
        for (let bid in t.blocks) if (t.blocks.hasOwnProperty(bid)) {
            let b = t.blocks[bid];
            // Check if this block has any branches falls into an active range
            b.rangeSelected = 0;
            if (rangeSelection && !rangeSelection.cb && rangeSelection.attribute !== 'gsf') {
                for (let bid1 in b.branches)
                    if (b.branches.hasOwnProperty(bid1) && range[0] <= trees[tid].branches[bid1][attribute]
                        && trees[tid].branches[bid1][attribute] <= range[1]) {
                        b.rangeSelected += 1;
                        break;
                    }
            }
        }
        for (let bid in t.branches) if (t.branches.hasOwnProperty(bid)) {
            let b = t.branches[bid];
            // Check if any branch in the aggregated dendrogram falls into this range
            b.rangeSelected = false;
            if (rangeSelection && !rangeSelection.cb) {
                if (trees[tid].branches.hasOwnProperty(bid)) {
                    let v = trees[tid].branches[bid][attribute];
                    if (range[0] <= v && v <= range[1]) {
                        b.rangeSelected = true;
                    }
                }
            }
        }
        t.isCBinRange = false;
        if (r) {
            // if range selection is for cb, check cb's value
            let corr = correspondingBranches[tid];
            if (corr && t.branches.hasOwnProperty(corr.bid)) {
                let v = attribute === 'similarity'? corr.jac: trees[tid].branches[corr.bid][attribute];
                if (range[0] <= v && v <= range[1]) {
                    // t.branches[corr.bid].rangeSelected = true;
                    t.isCBinRange = true;
                }
            }
        }
    }
};


let mapStateToProps = (state) => {
    let mode = state.aggregatedDendrogram.mode;
    let layouts = getLayouts(state);
    let filteredLayouts = filterLayouts(state, layouts);
    let layoutArray;
    if (mode.indexOf('cluster') !== -1) {
        let clusteredLayouts = clusterLayoutsByTopology(state, filteredLayouts);
        layoutArray = sortLayouts(state, clusteredLayouts);
    } else {
        layoutArray = sortLayouts(state, filteredLayouts);
    }
    let dendrograms = fillLayouts(state, selectLayoutsByAttribute(state, layoutArray));

    return {
        ...state.aggregatedDendrogram,
        referenceTid: state.referenceTree.id,
        isFetching: state.referenceTree.isFetching,
        fetchError: state.referenceTree.fetchError,
        sets: state.sets,
        dendrograms,
        rangeSelection: state.cbAttributeExplorer.activeSelectionId === 0? {
            attrName: 'support',
            range: state.cbAttributeExplorer.selection[state.cbAttributeExplorer.activeSelectionId].range
        }: null,
        selectedTrees: state.selectedTrees,
        hoveredTrees: state.hoveredTrees,
        expandedBranches: state.referenceTree.expanded,
    }
};

let mapDispatchToProps = (dispatch) => ({
    onSelectTrees: (tids, isAdd) => {dispatch(toggleSelectTrees(tids, isAdd))},
    onHighlightTrees: (tids) => {dispatch(toggleHighlightTrees(tids))},
    onSelectSet: i => {dispatch(selectSet(i))},
    onChangeSorting: (key) => {dispatch(changeSorting(key))},
    onToggleMode: (m) => {dispatch(toggleAggregationMode(m))},
    onToggleBlock: (e, e1) => {dispatch(toggleHighlightEntities(e, e1))},
});

export default connect(mapStateToProps, mapDispatchToProps)(DendrogramContainer);