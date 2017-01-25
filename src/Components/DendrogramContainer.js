/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component} from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {Tabs, Tab, Button, ButtonGroup, Glyphicon, Badge, OverlayTrigger, Tooltip, FormGroup, Radio} from 'react-bootstrap';
import cn from 'classnames';
import AggregatedDendrogram from './AggregatedDendrogram';
import {toggleHighlightTree, toggleSelectAggDendro, selectSet, changeReferenceTree, removeFromSet, removeSet,
    addTreeToInspector, toggleInspector, toggleSorting, toggleCLusterMode, clearBranchSelection} from '../actions';
import {createMappingFromArray, subtractMapping, getIntersection} from '../utils';
import './Dendrogram.css';


class DendrogramContainer extends Component {
    render() {
        let {spec, isClusterMode, dendrograms, activeTreeId, rangeSelection} = this.props;
        let isOrderStatic = this.props.treeOrder.static;
        // Padding + border + proportion bar
        let boxSize = spec.size + 2 * spec.margin + 4 + (isClusterMode? spec.proportionBarHeight + spec.proportionTopMargin: 0);
        let activeTids;
        if (isClusterMode && activeTreeId) {
            let activeDendrogram;
            for (let i = 0; i < dendrograms.length; i++) {
                if (dendrograms[i].tid === activeTreeId) {
                    activeDendrogram = dendrograms[i];
                    break;
                }
            }
            if (activeDendrogram) {
                activeTids = activeDendrogram.trees;
            }
        }
        let getDendroBox = (t, i) => {
            return (
            <div className={cn("agg-dendro-box", {selected: activeTreeId === t.tid})} key={i}
                 style={{width: boxSize + 'px', height: boxSize + 'px'}}
                 onMouseEnter={this.props.onToggleHighlightTree.bind(null, isClusterMode? t.trees:[t.tid], true)}
                 onMouseLeave={this.props.onToggleHighlightTree.bind(null, null, false)}
                 onClick={this.props.onClick.bind(null, activeTreeId === t.tid? null: t.tid,
                     isClusterMode? t.trees: null)}>
                <AggregatedDendrogram data={t} spec={spec} isClusterMode={isClusterMode} rangeSelection={rangeSelection} />
            </div>
            )};
        const disabledTools = activeTreeId == null;
        return (
            <div className="view" style={{height: '98%'}}>
                <div className="view-header">
                    <div style={{textAlign: 'center'}}>
                        <div className="view-title" style={{display: 'inline-block'}}>Aggregated Dendrograms</div>
                        <FormGroup style={{marginLeft: '10px', marginBottom: 0, display: 'inline-block'}}>
                            <span style={{marginRight: '5px'}}>(as</span>
                            <Radio inline checked={isClusterMode} onChange={this.props.onToggleClusterMode.bind(null, true)}>cluster</Radio>
                            <Radio inline checked={!isClusterMode} onChange={this.props.onToggleClusterMode.bind(null, false)}>individual</Radio>
                            )
                        </FormGroup>
                    </div>

                    <div style={{marginBottom: '5px'}}>
                        <ButtonGroup bsSize="xsmall" style={{display: 'inline-block', marginRight: '10px'}}>
                            <OverlayTrigger rootClose placement="top" overlay={<Tooltip id="tooltip-remove-set">Remove the current open set</Tooltip>}>
                                <Button disabled={this.props.activeSetIndex === 0}
                                        onClick={this.props.onRemoveSet.bind(null, this.props.activeSetIndex)}>
                                    <Glyphicon glyph="trash"/><span className="glyph-text">Remove set</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="top" overlay={<Tooltip id="tooltip-trash">Remove tree from the current set</Tooltip>}>
                                <Button disabled={disabledTools} onClick={this.props.onRemove.bind(null, isClusterMode? activeTids: [activeTreeId], this.props.activeSetIndex)}>
                                    <Glyphicon glyph="trash"/><span className="glyph-text">Remove tree</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="top" overlay={<Tooltip id="tooltip-ref-tree">Set tree as reference tree on the right</Tooltip>}>
                                <Button disabled={disabledTools || isClusterMode} onClick={this.props.onChangeReferenceTree.bind(null, activeTreeId)}>
                                    <Glyphicon glyph="tree-conifer"/><span className="glyph-text">Set as reference</span>

                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="top" overlay={<Tooltip id="tooltip-popup">Inspect tree with full detail</Tooltip>}>
                                <Button disabled={isClusterMode} onClick={this.props.onAddTreeToInspector.bind(null, activeTreeId)}>
                                    <Glyphicon glyph="new-window" /><span className="glyph-text">Inspect</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-clear-selection">Clear all branch expansion</Tooltip>}>
                                <Button onClick={this.props.clearSelection}>
                                    <Glyphicon glyph="refresh" /><span className="glyph-text">Reset</span>
                                </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        <div style={{fontSize: '12px', display: 'inline-block'}}>
                            <span style={{marginRight: '2px'}}>Sort by similarity to the </span>
                            {isClusterMode? <span>proportion of clusters</span>:
                                <ButtonGroup bsSize="xsmall">
                                    <Button active={isOrderStatic} onClick={isOrderStatic? null: this.props.onChangeSorting}>whole</Button>
                                    <Button active={!isOrderStatic} onClick={isOrderStatic? this.props.onChangeSorting: null}>highlighted subtree</Button>
                                </ButtonGroup>
                            }
                            <span style={{marginLeft: '2px'}}> of the ref. tree</span>
                        </div>
                    </div>

                    <div className="view-body">

                    </div>
                    <Tabs activeKey={this.props.activeSetIndex} onSelect={this.props.onSelectSet} id="set-tab">
                        {this.props.sets.map((s, i) => <Tab eventKey={i} key={i}
                                                            title={<div><div className="color-block" style={{backgroundColor: s.color}}></div>{s.title}<Badge style={{marginLeft: '5px'}}>{s.tids.length}</Badge></div>} >
                        </Tab>)}
                    </Tabs>
                </div>
                <div className="view-body dendrogram-container">
                    {dendrograms.map(getDendroBox)}
                </div>
            </div>
        )
    }
}

let getTrees = createSelector(
    [state => state.inputGroupData.trees, state => state.sets[state.aggregatedDendrogram.activeSetIndex].tids,
        state => state.aggregatedDendrogram.treeOrder,
        state => state.aggregatedDendrogram.treeOrder.static? null: state.referenceTree.highlightMonophyly,
        state => state.referenceTree.id, state => state.referenceTree.selected],
    (trees, setTids, order, bid, rid, selected) => {
        console.log('Getting new trees in the dendrogram container');
        let res = [];
        let ref = trees[rid];
        let sortFunc;
        if (order.static || !bid) {
            sortFunc = (t1, t2) => (ref.rfDistance[t1] || 0) - (ref.rfDistance[t2] || 0);
        } else {
            let corr = ref.branches[bid].correspondingBranches;
            sortFunc = (t1, t2) => (t2 in corr? corr[t2].jaccard: 1.1) - (t1 in corr? corr[t1].jaccard: 1.1)
        }
        let sortedTids = setTids.slice().sort(sortFunc);

        for (let i = 0; i < sortedTids.length; i++) {
            let tid = sortedTids[i];
            let expansion = {};
            for (let j = 0; j < selected.length; j++) {
                let e = selected[j];
                let corr = tid === rid? e: ref.branches[e]['correspondingBranches'][tid]['branchId'];
                if (corr !== trees[tid].rootBranch) {
                    expansion[corr] = true;
                }
            }
            res.push({
                ...trees[tid],
                expand: expansion
            })
        }
        return res;
    }
);

// Calculating the blocks of the aggregaated dendrogram
// given a tree (tree document from DB) (tree),
// a dictionary of branches to be expanded (tree.expand),
// an array of highlighting entities (exploreEntities)
// and size specification (spec)
// Return the dictionary of blocks and branches
let calcLayout = (tree, spec) => {
    let {branchLen, verticalGap, leaveHeight, leaveHighlightWidth, size} = spec;
    let height = size, width = size;

    // Generate all blocks needed to display.  Blocks are indexed by their expanded branch id except the root block.
    let blocks = {
        [tree.rootBranch]: {id: tree.rootBranch, children: [], level: 1,
            height, width: 0, x: 0, y: 0,
            n: tree.branches[tree.rootBranch].entities.length,          // the number of entities this block reprensents
            branches: createMappingFromArray(Object.keys(tree.branches)),
            entities: createMappingFromArray(tree.branches[tree.rootBranch].entities)}
    };
    let getBranchesInSubtree = (bid) => {
        let res = {};
        let dfs = (bid) => {
            res[bid] = true;
            if (!tree.branches[bid].isLeaf) {
                dfs(tree.branches[bid].left);
                dfs(tree.branches[bid].right);
            }
        };
        dfs(bid);
        return res;
    };
    let splitBlock = function (blockId, curBid) {
        let b = tree.branches[curBid];
        let newBlockId = blockId;
        if (tree.expand[curBid] && curBid !== tree.rootBranch) {
            // split block
            blocks[curBid] = {children: [], level: blocks[blockId].level + 1, id: curBid, width: 0,
                branches: getBranchesInSubtree(curBid),
                isLeaf: !!b.isLeaf, n: b.entities.length, entities: createMappingFromArray(b.entities)};
            blocks[blockId].n -= b.entities.length;
            blocks[blockId].entities = subtractMapping(blocks[blockId].entities, blocks[curBid].entities);
            blocks[blockId].branches = subtractMapping(blocks[blockId].branches, blocks[curBid].branches);
            blocks[blockId].children.push(curBid);
            newBlockId = curBid;
        }
        // otherwise recursively go down the children
        if (!b['isLeaf']) {
            splitBlock(newBlockId, b['left']);
            splitBlock(newBlockId, b['right']);
        }
    };
    splitBlock(tree.rootBranch, tree.rootBranch);

    // branches are the lines connecting the blocks
    let branches = {};
    // Calculate the position, width and height of blocks and expanding branches
    let widthCoeff = width;
    let calcHeight = function (blockId, height, y, accN) {
        let b = blocks[blockId];
        accN += Math.log(b.n || 1);
        if (b.children.length) {
            // The leaf branch should not take a lot of space
            // calculate the number of leaves
            let numLeaves = b.children.filter(bid => blocks[bid].isLeaf).length;
            // If all children are leaves, then nonLeaveHeight is useless
            let nonLeaveHeight = numLeaves === b.children.length? 10:
                (height - verticalGap * (b.children.length - 1.0) - numLeaves * leaveHeight) / (b.children.length - numLeaves);
            // console.log(height, numLeaves, nonLeaveHeight, b.children);
            let curNumLeaves = 0;
            for (let i = 0; i < b.children.length; i++) {
                let c = blocks[b.children[i]];
                c.height = c.isLeaf? leaveHeight: nonLeaveHeight;
                c.y = y + (i - curNumLeaves) * nonLeaveHeight + curNumLeaves * leaveHeight + i * verticalGap;
                let branchPosY = (c.y + c.y + c.height) / 2;

                branches[b.children[i]] = {id: b.children[i], y1: branchPosY, y2: branchPosY};
                curNumLeaves += c.isLeaf;
                calcHeight(b.children[i], nonLeaveHeight, c.y, accN);
            }
        } else {
            let k = (width - (b.level - 1) * branchLen) / accN;
            widthCoeff = Math.min(k, widthCoeff);
        }
    };
    calcHeight(tree.rootBranch, height, 0, 0);

    let calcWidth = function (blockId, x) {
        let b = blocks[blockId];
        if (b.n === 0) {
            // Add a branch to connect the children
            // If this block does not contain any entity, it should has at least two children
            branches[blockId + '-x'] = {id: blockId + '-x', y1: branches[b.children[0]].y1, y2: branches[b.children[b.children.length - 1]].y1, x1: x, x2: x};
        }
        b.width = widthCoeff * Math.log(b.n || 1);
        // b.width = Math.max(widthCoeff * b.n, 1);
        for (let i = 0; i < b.children.length; i++) {
            let c = blocks[b.children[i]];
            c.x = x + b.width + branchLen;
            branches[b.children[i]].x1 = x + b.width;
            branches[b.children[i]].x2 = c.isLeaf? width: x + b.width + branchLen;
            c.highlightWidth = c.isLeaf? Math.min((branches[b.children[i]].x2 - branches[b.children[i]].x1) * 0.67, leaveHighlightWidth): 0;
            calcWidth(b.children[i], c.x);
        }
    };
    calcWidth(tree.rootBranch, 0);

    return {blocks, branches, rootBlockId: tree.rootBranch, tid: tree._id};
};

let getLayouts = createSelector(
    [trees => trees, (_, spec) => spec],
    (trees, spec) => trees.map(t => calcLayout(t, spec))
)

let getHash = (blocks, rootBlockId) => {
    let traverse = (bid) => {
        let b = blocks[bid];
        if (b.children.length > 0) {
            return '(' + b.children.map(c => traverse(c)).join(',') + ')' + b.n;
        } else {
            return b.n.toString();
        }
    };
    return traverse(rootBlockId);
};

// Cluster trees by visual representations
// trees is an array of tree objects {tid, blocks, rootBlockId, branches}
// Return an array of clusters, with each one {blockArr, branchArr, num}
//      Each block in the blockArr is stuffed with a mapping between the tree this cluster represents and the block id this block represents
let getClusters = createSelector(
    [trees => trees],
    (trees) => {
        console.log('Clustering trees...');
        // Get the tree hashes
        for (let i = 0; i < trees.length; i++) {
            trees[i].hash = getHash(trees[i].blocks, trees[i].rootBlockId);
        }

        // Sort the trees according to their hashes
        trees.sort((a, b) => {
            if (a.hash > b.hash) return 1;
            if (a.hash < b.hash) return -1;
            return 0;
        });

        let addRepresent = (clusterBlocks, clusterRootBlockId, addingBlocks, addingTreeId, addingRootBlockId) => {
            let traverse = (clusterBid, addingBid) => {
                let b = clusterBlocks[clusterBid];
                if (!b.hasOwnProperty('represent')) {
                    b.represent = {};
                }
                b.represent[addingTreeId] = addingBid;
                for (let i = 0; i < b.children.length; i++) {
                    traverse(b.children[i], addingBlocks[addingBid].children[i])
                }
            };
            traverse(clusterRootBlockId, addingRootBlockId);
            return clusterBlocks;
        };

        // Scan the array to construct cluster
        let clusters = [];
        let c;
        for (let i = 0; i < trees.length; i++) {
            let t = trees[i];
            if (i === 0 || t.hash !== trees[i - 1].hash) {
                // create a new cluster
                c = {tid: t.tid + '-r', blocks: t.blocks, rootBlockId: t.rootBlockId, branches: t.branches,
                    num: 0, trees: [], total: trees.length};
                clusters.push(c);
            }
            c.num += 1;
            c.trees.push(t.tid);
            addRepresent(c.blocks, c.rootBlockId, t.blocks, t.tid, t.rootBlockId);
        }

        return clusters.sort((a, b) => b.num - a.num);
    });


// Get the highlight portion of each block
// Also determine whether there is branch that falls into the range selection
// FIXME: bottleneck!
let getFill = (dendroMapping, clusters, isClusterMode, entities, rangeSelection, trees) => {
    let h = createMappingFromArray(entities);
    let {attrName, range} = rangeSelection || {};
    if (isClusterMode) {
        for (let i = 0; i < clusters.length; i++) {
            let t = clusters[i];
            for (let bid in t.blocks) if (t.blocks.hasOwnProperty(bid)) {
                let b = t.blocks[bid];
                b.fillPercentage = [];
                b.rangeSelected = 0;
                for (let tid in b.represent) if (b.represent.hasOwnProperty(tid)) {
                    let e = dendroMapping[tid].blocks[b.represent[tid]].entities;
                    b.fillPercentage.push(getIntersection(e, h) / Object.keys(e).length);

                    if (rangeSelection) {
                        let checkingBlock = dendroMapping[tid].blocks[b.represent[tid]];
                        for (let bid1 in checkingBlock.branches)
                            if (checkingBlock.branches.hasOwnProperty(bid1) && range[0] <= trees[tid].branches[bid1][attrName]
                                && trees[tid].branches[bid1][attrName] <= range[1]) {
                                b.rangeSelected += 1;
                            }
                    }
                }
            }
        }
    } else {
        for (let tid in dendroMapping) if (dendroMapping.hasOwnProperty(tid)) {
            let t = dendroMapping[tid];
            for (let bid in t.blocks) if (t.blocks.hasOwnProperty(bid)) {
                let b = t.blocks[bid];
                b.fillPercentage = getIntersection(b.entities, h) / Object.keys(b.entities).length;

                b.rangeSelected = 0;
                if (rangeSelection) {
                    for (let bid1 in b.branches)
                        if (b.branches.hasOwnProperty(bid1) && range[0] <= trees[tid].branches[bid1][attrName]
                            && trees[tid].branches[bid1][attrName] <= range[1]) {
                            b.rangeSelected += 1;
                        }
                }
            }
        }
    }
};

// the highlight monophyly is prone to change, so to make it faster, need to extract the part calculating the fillPercentage
let getDendrograms = createSelector(
    [state => state.aggregatedDendrogram.isClusterMode, (_, trees) => trees,
        state => state.referenceTree.highlightMonophyly != null?
            state.inputGroupData.trees[state.referenceTree.id].branches[state.referenceTree.highlightMonophyly].entities: [],
        state => state.aggregatedDendrogram.spec,
        state => state.inputGroupData.trees,
        state => state.attributeExplorer.activeSelectionId === 0? {
                attrName: 'support',
                range: state.attributeExplorer.selection[state.attributeExplorer.activeSelectionId].range
            }: null],
    (isClusterMode, trees, highlightEntities, spec, rawTrees, rangeSelection) => {
        let dendros = getLayouts(trees, spec).slice();
        let clusters = isClusterMode? getClusters(dendros).slice(): [];
        let dendroMapping = {};
        for (let i = 0; i < dendros.length; i++) {
            dendroMapping[dendros[i].tid] = dendros[i];
        }
        getFill(dendroMapping, clusters, isClusterMode, highlightEntities, rangeSelection, rawTrees);
        return isClusterMode? clusters: dendros;
    }
);


let mapStateToProps = (state) => {
    let trees = getTrees(state);
    return {
        ...state.aggregatedDendrogram,
        isFetching: state.referenceTree.isFetching,
        fetchError: state.referenceTree.fetchError,
        sets: state.sets,
        dendrograms: getDendrograms(state, trees),
        rangeSelection: state.attributeExplorer.activeSelectionId === 0? {
            attrName: 'support',
            range: state.attributeExplorer.selection[state.attributeExplorer.activeSelectionId].range
        }: null,
    }
};

let mapDispatchToProps = (dispatch) => ({
    onToggleHighlightTree: (tids, isHighlight) => {dispatch(toggleHighlightTree(tids, isHighlight))},
    onClick: (tid, tids) => {dispatch(toggleSelectAggDendro(tid, tids))},
    onSelectSet: i => {dispatch(selectSet(i))},
    onRemove: (tid, setIndex) => {dispatch(removeFromSet(tid, setIndex))},
    onChangeReferenceTree: tid => {dispatch(changeReferenceTree(tid))},
    onRemoveSet: setIndex => {dispatch(removeSet(setIndex))},
    onAddTreeToInspector: (tid) => {
        if (tid != null) {
            dispatch(addTreeToInspector(tid))
        } else {
            dispatch(toggleInspector())
        }
    },
    onChangeSorting: () => {dispatch(toggleSorting())},
    clearSelection: () => {dispatch(clearBranchSelection())},
    onToggleClusterMode: (m) => {dispatch(toggleCLusterMode(m))}
});

export default connect(mapStateToProps, mapDispatchToProps)(DendrogramContainer);