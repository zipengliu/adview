/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component} from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {Tabs, Tab, Button, ButtonGroup, Glyphicon, Badge, OverlayTrigger, Tooltip} from 'react-bootstrap';
import cn from 'classnames';
import AggregatedDendrogram from './AggregatedDendrogram';
import {toggleHighlightTree, toggleSelectAggDendro, selectSet, changeReferenceTree, removeFromSet, removeSet,
    addTreeToInspector, toggleInspector, toggleSorting, toggleCLusterMode} from '../actions';
import {createMappingFromArray, subtractMapping, getIntersection, createArrayFromMapping} from '../utils';
import './Dendrogram.css';


class DendrogramContainer extends Component {
    render() {
        let {spec, isClusterMode, dendrograms, activeTreeId} = this.props;
        // Padding + border + proportion bar
        let boxSize = spec.size + 2 * spec.margin + 4 + (isClusterMode? spec.proportionBarHeight + spec.proportionTopMargin: 0);
        let activeTids;
        if (isClusterMode && activeTreeId) {
            let activeDendrogram;
            for (let i = 0; i < dendrograms.length; i++) {
                if (dendrograms[i].treeId == activeTreeId) {
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
            <div className={cn("agg-dendro-box", {selected: activeTreeId === t.treeId})} key={i}
                 style={{width: boxSize + 'px', height: boxSize + 'px'}}
                 onMouseEnter={this.props.onToggleHighlightTree.bind(null, isClusterMode? t.trees:[t.treeId], true)}
                 onMouseLeave={this.props.onToggleHighlightTree.bind(null, null, false)}
                 onClick={this.props.onClick.bind(null, activeTreeId === t.treeId? null: t.treeId,
                     isClusterMode? t.trees: null)}>
                <AggregatedDendrogram data={t} spec={spec} isClusterMode={isClusterMode} />
            </div>
        )};
        const disabledTools = activeTreeId == null;
        return (
            <div style={{height: '100%', position: 'relative'}}>
                <div className="tools">
                    <ButtonGroup bsSize="xsmall">
                        <Button active={isClusterMode} onClick={this.props.onToggleClusterMode.bind(null, true)}>
                            Cluster
                        </Button>
                        <Button active={!isClusterMode} onClick={this.props.onToggleClusterMode.bind(null, false)}>
                            Individual
                        </Button>
                    </ButtonGroup>

                    <ButtonGroup bsSize="small" style={{marginLeft: '10px'}}>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-remove-set">Remove the current open set</Tooltip>}>
                            <Button disabled={this.props.activeSetIndex === 0}
                                onClick={this.props.onRemoveSet.bind(null, this.props.activeSetIndex)}>
                                <Glyphicon glyph="remove" />
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-trash">Remove tree from the current set</Tooltip>}>
                            <Button disabled={disabledTools} onClick={this.props.onRemove.bind(null, isClusterMode? activeTids: [activeTreeId], this.props.activeSetIndex)}>
                                <Glyphicon glyph="trash" />
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-ref-tree">Set tree as reference tree on the right</Tooltip>}>
                            <Button disabled={disabledTools || isClusterMode} onClick={this.props.onChangeReferenceTree.bind(null, activeTreeId)}>
                                <Glyphicon glyph="tree-conifer" />
                            </Button>
                        </OverlayTrigger>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-sort-tree">{
                             `${this.props.treeOrder.static? 'Enable': 'Disable'} sorting by similarity to reference tree`}</Tooltip>}>
                            <Button active={!this.props.treeOrder.static} onClick={this.props.onChangeSorting}>
                                <Glyphicon glyph="sort-by-attributes" />
                            </Button>
                        </OverlayTrigger>
                    </ButtonGroup>

                    <ButtonGroup bsSize="small" style={{marginLeft: '10px'}}>
                        <OverlayTrigger placement="top" overlay={<Tooltip id="tooltip-popup">Inspect tree with full detail</Tooltip>}>
                            <Button disabled={isClusterMode} onClick={this.props.onAddTreeToInspector.bind(null, activeTreeId)}>
                                <Glyphicon glyph="fullscreen" />
                            </Button>
                        </OverlayTrigger>
                    </ButtonGroup>
                </div>
                <Tabs activeKey={this.props.activeSetIndex} onSelect={this.props.onSelectSet} id="set-tab">
                    {this.props.sets.map((s, i) => <Tab eventKey={i} key={i}
                                                        title={<div><div className="color-block" style={{backgroundColor: s.color}}></div>{s.title}<Badge style={{marginLeft: '5px'}}>{s.tids.length}</Badge></div>} >
                    </Tab>)}
                </Tabs>
                <div className="dendrogram-container">
                    {dendrograms.map(getDendroBox)}
                </div>
            </div>
        )
    }
}

let getTrees = createSelector(
    [state => state.inputGroupData.trees, state => state.sets[state.aggregatedDendrogram.activeSetIndex].tids,
        state => state.aggregatedDendrogram.treeOrder,
        state => state.referenceTree.id, state => state.referenceTree.selected],
    (trees, setTids, order, rid, selected) => {
        console.log('Getting new trees in the dendrogram container');
        let res = [];
        let ref = trees[rid];
        let sortFunc;
        if (order.static) {
            sortFunc = (t1, t2) => t1 === t2? 0: (t1 > t2? 1: -1);
        } else if (order.branchId) {
            let corr = ref.branches[order.branchId].correspondingBranches;
            sortFunc = (t1, t2) => (t2 in corr? corr[t2].jaccard: 1.1) - (t1 in corr? corr[t1].jaccard: 1.1)
        } else {
            sortFunc = (t1, t2) => (ref.rfDistance[t1] || 0) - (ref.rfDistance[t2] || 0);
        }
        let sortedTids = setTids.slice().sort(sortFunc);

        for (let i = 0; i < sortedTids.length; i++) {
            let tid = sortedTids[i];
            let expansion = {};
            for (let e in selected) {
                if (selected[e]) {
                    let corr = tid === rid? e: ref.branches[e]['correspondingBranches'][tid]['branchId'];
                    if (corr !== trees[tid].rootBranch) {
                        expansion[corr] = true;
                    }
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
            entities: createMappingFromArray(tree.branches[tree.rootBranch].entities)}
    };
    let splitBlock = function (blockId, curBid) {
        let b = tree.branches[curBid];
        let newBlockId = blockId;
        if (tree.expand[curBid] && curBid !== tree.rootBranch) {
            // split block
            blocks[curBid] = {children: [], level: blocks[blockId].level + 1, id: curBid, width: 0,
                isLeaf: !!b.isLeaf, n: b.entities.length, entities: createMappingFromArray(b.entities)};
            blocks[blockId].n -= b.entities.length;
            blocks[blockId].entities = subtractMapping(blocks[blockId].entities, blocks[curBid].entities);
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

    return {blocks, branches, rootBlockId: tree.rootBranch, treeId: tree._id};
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
// trees is an array of tree objects {treeId, blocks, rootBlockId, branches}
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
                c = {treeId: t.treeId + '-r', blocks: t.blocks, rootBlockId: t.rootBlockId, branches: t.branches,
                    num: 0, trees: [], total: trees.length};
                clusters.push(c);
            }
            c.num += 1;
            c.trees.push(t.treeId);
            addRepresent(c.blocks, c.rootBlockId, t.blocks, t.treeId, t.rootBlockId);
        }

        return clusters.sort((a, b) => b.num - a.num)
            .map(c => ({num: c.num, trees: c.trees, total: c.total, treeId: c.treeId,
                blockArr: createArrayFromMapping(c.blocks), branchArr: createArrayFromMapping(c.branches)}));
    });

// the highlight monophyly is prone to change, so to make it faster, need to extract the part calculating the fillPercentage
let getDendrograms = createSelector(
    [state => state.aggregatedDendrogram.isClusterMode, (_, trees) => trees,
    state => state.referenceTree.highlightMonophyly != null?
                state.inputGroupData.trees[state.referenceTree.id].branches[state.referenceTree.highlightMonophyly].entities: [],
    state => state.aggregatedDendrogram.spec],
    (isClusterMode, trees, highlightEntities, spec) => {
        let layouts = getLayouts(trees, spec);
        let dendros = isClusterMode? getClusters(layouts):
            layouts.map(t => ({...t, blockArr: createArrayFromMapping(t.blocks), branchArr: createArrayFromMapping(t.branches)}));

        // Get the highlight portion of each block
        let h = createMappingFromArray(highlightEntities);
        for (let i = 0; i < layouts.length; i++) {
            let t = layouts[i];
            for (let bid in t.blocks) if (t.blocks.hasOwnProperty(bid)) {
                let b = t.blocks[bid];
                b.fillPercentage = getIntersection(b.entities, h) / parseFloat(Object.keys(b.entities).length);
            }
        }
        return dendros;
    }
);


let mapStateToProps = (state) => {
    let trees = getTrees(state);
    return {
        ...state.aggregatedDendrogram,
        isFetching: state.referenceTree.isFetching,
        fetchError: state.referenceTree.fetchError,
        sets: state.sets,
        dendrograms: getDendrograms(state, trees)
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
    onToggleClusterMode: (m) => {dispatch(toggleCLusterMode(m))}
});

export default connect(mapStateToProps, mapDispatchToProps)(DendrogramContainer);