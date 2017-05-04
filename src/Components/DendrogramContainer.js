/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component} from 'react';
import {connect} from 'react-redux';
import {createSelector} from 'reselect';
import {scaleLinear, hsl, extent, scaleLog} from 'd3';
import {Tabs, Tab, Button, ButtonGroup, Glyphicon, Badge, OverlayTrigger, Tooltip, FormGroup, Radio} from 'react-bootstrap';
import cn from 'classnames';
import AggregatedDendrogram from './AggregatedDendrogram';
import {toggleHighlightTree, toggleSelectAggDendro, selectSet, changeReferenceTree, removeFromSet, removeSet,
    addTreeToInspector, toggleInspector, toggleSorting, toggleAggregationMode, clearBranchSelection, toggleHighlightEntities,
    compareWithReference} from '../actions';
import {createMappingFromArray, subtractMapping, getIntersectionSet, areSetsEqual} from '../utils';
import './Dendrogram.css';


class DendrogramContainer extends Component {
    render() {
        let {spec, mode, dendrograms, activeTreeId, rangeSelection} = this.props;
        let isClusterMode = mode.indexOf('cluster') !== -1;
        let isOrderStatic = this.props.treeOrder.static;
        // Padding + border + proportion bar
        let boxWidth = spec.size + spec.margin.left + spec.margin.right + 4;
        let boxHeight = spec.size + spec.margin.top + spec.margin.bottom + 4 + (isClusterMode? spec.proportionBarHeight + spec.proportionTopMargin: 0);
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
            let div = (
                <div className={cn("agg-dendro-box", {selected: activeTreeId === t.tid})} key={t.tid}
                     style={{width: boxWidth + 'px', height: boxHeight + 'px'}}
                     onMouseEnter={true? null: this.props.onToggleHighlightTree.bind(null, isClusterMode? t.trees:[t.tid], true)}
                     onMouseLeave={true? null: this.props.onToggleHighlightTree.bind(null, null, false)}
                     onClick={this.props.onClick.bind(null, activeTreeId === t.tid? null: t.tid,
                         isClusterMode && activeTreeId !== t.tid? t.trees: [])}>
                    <AggregatedDendrogram data={t} spec={spec} mode={mode} isReferenceTree={t.tid === this.props.referenceTid}
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
        const disabledTools = activeTreeId == null;
        return (
            <div className="view" id="aggregated-dendrograms">
                <div className="view-header">
                    <div style={{textAlign: 'center'}}>
                        <div className="view-title" style={{display: 'inline-block'}}>Aggregated Dendrograms</div>
                        <FormGroup style={{marginLeft: '10px', marginBottom: 0, display: 'inline-block'}}>
                            <span style={{marginRight: '5px'}}>(as</span>
                            <Radio inline checked={mode === 'supercluster'} onChange={this.props.onToggleMode.bind(null, 'supercluster')}>supercluster</Radio>
                            <Radio inline checked={mode === 'topo-cluster'} onChange={this.props.onToggleMode.bind(null, 'topo-cluster')}>topo-cluster</Radio>
                            <Radio inline checked={mode === 'taxa-cluster'} onChange={this.props.onToggleMode.bind(null, 'taxa-cluster')}>taxa-cluster</Radio>
                            <Radio inline checked={mode === 'remainder'} onChange={this.props.onToggleMode.bind(null, 'remainder')}>remainder</Radio>
                            <Radio inline checked={mode === 'fine-grained'} onChange={this.props.onToggleMode.bind(null, 'fine-grained')}>fine-grained</Radio>
                            <Radio inline checked={mode === 'frond'} onChange={this.props.onToggleMode.bind(null, 'frond')}>frond</Radio>
                            )
                        </FormGroup>
                    </div>

                    <div style={{marginBottom: '5px'}}>
                        <ButtonGroup bsSize="xsmall" style={{display: 'inline-block', marginRight: '10px'}}>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-remove-set">Remove the current open set</Tooltip>}>
                                <Button disabled={this.props.activeSetIndex === 0}
                                        onClick={this.props.onRemoveSet.bind(null, this.props.activeSetIndex)}>
                                    <Glyphicon glyph="trash"/><span className="glyph-text">Remove set</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-trash">Remove tree from the current set</Tooltip>}>
                                <Button disabled={disabledTools} onClick={this.props.onRemove.bind(null, isClusterMode? activeTids: [activeTreeId], this.props.activeSetIndex)}>
                                    <Glyphicon glyph="trash"/><span className="glyph-text">Remove tree</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-ref-tree">Set tree as reference tree on the right</Tooltip>}>
                                <Button disabled={disabledTools || isClusterMode} onClick={this.props.onChangeReferenceTree.bind(null, this.props.inputGroupId, activeTreeId)}>
                                    <Glyphicon glyph="tree-conifer"/><span className="glyph-text">Set as reference</span>

                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-popup">Inspect tree with full detail</Tooltip>}>
                                <Button disabled={isClusterMode? true: true} onClick={this.props.onAddTreeToInspector.bind(null, activeTreeId)}>
                                    <Glyphicon glyph="new-window" /><span className="glyph-text">Inspect</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger rootClose placement="bottom" overlay={<Tooltip id="tooltip-compare">Compare tree with the reference tree in detail</Tooltip>}>
                                <Button disabled={isClusterMode || activeTreeId === this.props.referenceTid}
                                        onClick={this.props.onCompareWithReference.bind(null, activeTreeId)}>
                                    <Glyphicon glyph="zoom-in" /><span className="glyph-text">Compare</span>
                                </Button>
                            </OverlayTrigger>
                            <OverlayTrigger placement="bottom" overlay={<Tooltip id="tooltip-clear-selection">Clear all branch expansion</Tooltip>}>
                                <Button onClick={this.props.clearSelection}>
                                    <Glyphicon glyph="refresh" /><span className="glyph-text">Reset</span>
                                </Button>
                            </OverlayTrigger>
                        </ButtonGroup>

                        <div style={{marginLeft: '5px', fontSize: '12px', display: 'inline-block'}}>
                            <span style={{marginRight: '2px'}}>Sort by similarity to the </span>
                            {isClusterMode? <span>#trees in a cluster</span>:
                                <ButtonGroup bsSize="xsmall">
                                    <Button active={isOrderStatic} onClick={isOrderStatic? null: this.props.onChangeSorting}>whole</Button>
                                    <Button active={!isOrderStatic} onClick={isOrderStatic? this.props.onChangeSorting: null}>highlighted subtree</Button>
                                </ButtonGroup>
                            }
                            <span style={{marginLeft: '2px'}}> of the ref. tree.</span>
                        </div>


                        {isClusterMode && false &&
                        <div className="partition-distribution">
                            {dendrograms.map((d, i) =>
                                <OverlayTrigger key={i} placement="bottom" overlay={<Tooltip id={`dist-${i}`}># trees in this cluster: {d.num}</Tooltip>}>
                                    <div style={{width: (d.num / d.total * 100) + '%'}}
                                         onClick={this.props.onClick.bind(null, activeTreeId === d.tid? null: d.tid,
                                             isClusterMode && activeTreeId !== d.tid? d.trees: [])} />
                                </OverlayTrigger>
                            )}
                        </div>
                        }
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
                                             <div className="color-block" style={{backgroundColor: s.color}}></div>
                                             {s.title}
                                             {i === this.props.activeSetIndex &&
                                             <Badge style={{marginLeft: '5px'}}>{dendrograms.length}</Badge>
                                             }
                                         </div>
                                     </OverlayTrigger>
                                 } >
                            </Tab>
                        )}
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
        state => state.referenceTree.id, state => state.referenceTree.selected,
        state => state.cb],
    (trees, setTids, order, bid, rid, selected, cb) => {
        console.log('Getting new trees in the dendrogram container');
        let res = [];
        let ref = trees[rid];
        let sortFunc;
        if (order.static || !bid || typeof bid === 'object') {
            sortFunc = (t1, t2) => (t1 in ref.rfDistance? ref.rfDistance[t1]: -1) - (t2 in ref.rfDistance? ref.rfDistance[t2]: -1);
        } else {
            let corr = ref.branches[bid][cb];
            sortFunc = (t1, t2) => (t2 in corr? corr[t2].jac: 1.1) - (t1 in corr? corr[t1].jac: 1.1)
        }
        let sortedTids = setTids.slice().sort(sortFunc);

        for (let i = 0; i < sortedTids.length; i++) {
            let tid = sortedTids[i];
            let expansion = {};
            let last = null;
            for (let j = 0; j < selected.length; j++) {
                let e = selected[j];
                if (tid === rid) {
                    expansion[e] = {jac: 1, in: true};
                    if (j === 0) last = e;
                } else {
                    let corr = ref.branches[e][cb][tid];
                    if (corr && corr.bid) {
                        expansion[corr.bid] = {jac: corr.jac, in: corr.in};
                        if (j === 0) last = corr.bid;
                    }
                }
            }
            res.push({
                ...trees[tid],
                expand: expansion,
                lastSelected: last
            })
        }
        return res;
    }
);


let getBranchesInSubtree = (tree, bid) => {
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

// Compute LCA of all expanded branches (ndoes) in a tree
// as well as the pre-order of each expanded node
let getLCA = tree => {
    let l = [];
    let anc = {};
    let eitherOne = null;
    let getAncestorList = (bid) => {
        let b = tree.branches[bid];
        l.push(bid);
        if (tree.expand.hasOwnProperty(bid)) {
            if (!eitherOne) eitherOne = bid;
            anc[bid] = l.slice();
        }
        if (!b.isLeaf) {
            getAncestorList(b.left);
            getAncestorList(b.right);
        }
        l.pop();
    };
    getAncestorList(tree.rootBranch);

    // If they share a common ancestor at the same index, return true, otherwise false
    let compare = idx => {
        if (idx >= anc[eitherOne].length) return false;
        for (let j in anc) if (anc.hasOwnProperty(j)) {
            if (idx >= anc[j].length) return false;
            if (anc[j][idx] !== anc[eitherOne][idx]) return false;
        }
        return true;
    };

    let i = 0;
    while (compare(i)) {
        i += 1;
    }
    let distanceToLCA = {};
    for (let j in anc) if (anc.hasOwnProperty(j)) {
        distanceToLCA[j] = anc[j].length - i - 1;
    }
    return {lca: anc[eitherOne][i - 1], distanceToLCA};
};

// Calculating the blocks of the aggregaated dendrogram
// given a tree (tree document from DB) (tree),
// a dictionary of branches to be expanded (tree.expand),
// an array of highlighting entities (exploreEntities)
// and size specification (spec)
// Return the dictionary of blocks and branches
let calcRemainderLayout = (tree, spec) => {
    let {branchLen, verticalGap, leaveHeight, leaveHighlightWidth, size} = spec;
    let height = size, width = size;

    let blocks = {};
    let missingHeight = 0;
    if (tree.missing) {
        missingHeight = tree.missing.length / (tree.missing.length + tree.branches[tree.rootBranch].entities.length) * (height - verticalGap);
        blocks.missing = {
            id: 'missing', children: [],
            isMissing: true,
            height: missingHeight,
            width, x: 0, y: height - missingHeight,
            n: tree.missing.length,          // the number of entities this block represents
            branches: {},
            entities: createMappingFromArray(tree.missing)
        };
    }
    // Generate all blocks needed to display.  Blocks are indexed by their expanded branch id except the root block.
    // Create a seudo root with id rootBranchId + "-a"
    let rootBlockId = tree.rootBranch + '-a';
    blocks[rootBlockId] = {
        id: rootBlockId, children: [], level: 1,
        height: missingHeight? height - missingHeight - verticalGap: height, width: 0, x: 0, y: 0,
        n: tree.branches[tree.rootBranch].entities.length,          // the number of entities this block reprensents
        branches: createMappingFromArray(Object.keys(tree.branches)),
        context: true,
        entities: createMappingFromArray(tree.branches[tree.rootBranch].entities)
    };

    let splitBlock = function (blockId, curBid) {
        let b = tree.branches[curBid];
        let newBlockId = blockId;
        if (tree.expand.hasOwnProperty(curBid)) {
            // split block
            blocks[curBid] = {children: [], level: blocks[blockId].level + 1, id: curBid, width: 0,
                // similarity: tree.expand[curBid].in? tree.expand[curBid].jac: null,
                lastExpanded: curBid === tree.lastSelected && tree.expand[curBid].in,
                matched: tree.expand[curBid].jac === 1 && tree.expand[curBid].in,
                context: !tree.expand[curBid].in,
                branches: getBranchesInSubtree(tree, curBid),
                isLeaf: !!b.isLeaf,
                n: b.entities.length,
                entities: createMappingFromArray(b.entities)};
            blocks[blockId].n -= b.entities.length;
            blocks[blockId].entities = subtractMapping(blocks[blockId].entities, blocks[curBid].entities);
            blocks[blockId].branches = subtractMapping(blocks[blockId].branches, blocks[curBid].branches);
            blocks[blockId].children.push(curBid);
            blocks[blockId].lastExpanded = !tree.expand[curBid].in && curBid === tree.lastSelected;
            if (!tree.expand[curBid].in) {
                blocks[blockId].matched = tree.expand[curBid].jac === 1;
                blocks[blockId].context = false;
                // blocks[blockId].similarity = tree.expand[curBid].jac;
            }
            newBlockId = curBid;
        }
        // otherwise recursively go down the children
        if (!b['isLeaf']) {
            splitBlock(newBlockId, b['left']);
            splitBlock(newBlockId, b['right']);
        }
    };
    splitBlock(rootBlockId, tree.rootBranch);

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

                branches[b.children[i]] = {bid: b.children[i], y1: branchPosY, y2: branchPosY, similarity: c.similarity};
                curNumLeaves += c.isLeaf;
                calcHeight(b.children[i], nonLeaveHeight, c.y, accN);
            }
        } else {
            let k = (width - (b.level - 1) * branchLen) / accN;
            widthCoeff = Math.min(k, widthCoeff);
        }
    };
    calcHeight(rootBlockId, missingHeight? height - missingHeight - verticalGap: height, 0, 0);

    let calcWidth = function (blockId, x) {
        let b = blocks[blockId];
        if (b.n === 0) {
            // Add a branch to connect the children
            // If this block does not contain any entity, it should has at least two children
            branches[blockId + '-x'] = {bid: blockId + '-x', y1: branches[b.children[0]].y1, y2: branches[b.children[b.children.length - 1]].y1, x1: x, x2: x};
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
    calcWidth(rootBlockId, 0);
    if (tree.missing) {
        blocks[rootBlockId].children.push('missing');
    }

    return {blocks, branches, rootBlockId, tid: tree.tid, lastSelected: tree.lastSelected, name: tree.name,
        missing: createMappingFromArray(tree.missing)};
};

let calcFrondLayout = (tree, spec) => {
    let expansion = Object.keys(tree.expand);
    if (expansion.length !== 2) return calcRemainderLayout(tree, spec);

    let {lca, distanceToLCA} = getLCA(tree);

    let {branchLen, verticalGap, size, frondLeafGap, frondLeafAngle, frondBaseLength, nestMargin} = spec;
    let height = size, width = size;

    let blocks = {};
    let missingHeight = 0;
    if (tree.missing) {
        missingHeight = tree.missing.length / (tree.missing.length + tree.branches[tree.rootBranch].entities.length) * (height - verticalGap);
        blocks.missing = {
            id: 'missing',
            isMissing: true,
            context: true,
            height: missingHeight,
            width, x: 0, y: height - missingHeight,
            n: tree.missing.length,          // the number of entities this block represents
            branches: {},
            entities: createMappingFromArray(tree.missing)
        };
    }
    let nonMissingHeight = missingHeight? height - missingHeight - verticalGap: height;
    let blockHeight = (nonMissingHeight - 2 * verticalGap) / 3;

    // A virtual root block
    let rootBlockId = 'root';
    blocks[rootBlockId] = {
        id: rootBlockId,
        n: 0,
        entities: {},
        children: []
    };


    // determine if LCA's outgroup is on top or bottom
    // FIXME
    //let outgroupOnTop = lca !== tree.rootBranch && tree.branches[tree.branches[lca].parent].left === lca;
    let branches = {
        [lca + '-vertical']: {
            bid: lca + '-vertical',
            x1: 0, x2: 0,
            y1: blockHeight / 2, y2: 2 * blockHeight + 1.5 * verticalGap
        },
        [lca + '-in'] :{
            bid: lca + '-in',
            x1: 0, x2: branchLen,
            y1: 2 * blockHeight + 1.5 * verticalGap,
            y2: 2 * blockHeight + 1.5 * verticalGap,
        },
        [lca + '-out']: {
            bid: lca + '-out',
            x1: 0, x2: branchLen,
            y1: blockHeight / 2, y2: blockHeight / 2
        },
    };


    // Determine how many "frondified" leaves on a branch by its distance to the LCA
    let getNumFrond = dist => {
        return Math.floor(Math.log2(dist + 1));
    };

    // These two variables are used to determine the scale of the block width
    let maxN = 0;           // The max number of taxa in each block
    let branchXMax = branchLen;     // the largest x coordinate of all branches

    let addFrondifyLeaves = (e, frondLevel) => {
        let b = branches[e];
        let isHorizontal = b.y1 === b.y2;
        let isGoingUp = b.y1 > b.y2;
        for (let i = 0; i < frondLevel; i++) {
            let t = .4 + i * 0.5 / frondLevel;
            // Find the point to "grow" two leaves on both sides
            let x = (1 - t) * branches[e].x1 + t * branches[e].x2;
            let y = (1 - t) * branches[e].y1 + t * branches[e].y2;
            branches[e + '-frond-' + i] = {
                bid: e + '-frond-' + i,
                x1: x, x2: x + 5,
                y1: y, y2: isHorizontal? y - 5: y
            };
            branches[e + '-frond-' + i + '-v'] = {
                bid: e + '-frond-' + i + '-v',
                x1: x, x2: isHorizontal? x + 5: x, y1: y, y2: isHorizontal? y + 5: (y + 5 * (isGoingUp? -1: 1))
            };
        }

    };

    let addIngroupContextBlock = e => {
        let bid = e + '-in';
        blocks[rootBlockId].children.push(bid);
        blocks[bid] = {
            id: bid,
            x: branchLen, y: 1.5 * (blockHeight + verticalGap),
            height: blockHeight, width: 50,
            n: tree.branches[e].entities.length,
            entities: createMappingFromArray(tree.branches[e].entities),
            branches: getBranchesInSubtree(tree, e),
            context: true,
        };
        maxN = Math.max(maxN, blocks[bid].n);
    };

    let addInGroupBlockAndBranches = (e, isCentered=false) => {
        let frondLevel = getNumFrond(distanceToLCA[e]);
        let isLeft = tree.branches[e].order < tree.branches[lca].order;
        let bl = e === lca? 0: (tree.branches[e].parent === lca? branchLen: frondBaseLength + (frondLevel - 1) * frondLeafGap);
        blocks[rootBlockId].children.push(e);
        blocks[e] = {
            id: e, children: [],
            x: branchLen + bl, y: isCentered? 1.5 * (blockHeight + verticalGap): (isLeft? blockHeight + verticalGap: 2 * (blockHeight + verticalGap)),
            height: blockHeight, width: 50,
            n: tree.branches[e].entities.length,
            entities: createMappingFromArray(tree.branches[e].entities),
            branches: getBranchesInSubtree(tree, e),
            matched: tree.expand[e].jac === 1,
            lastExpanded: tree.lastSelected === e,
            context: false,
        };
        branchXMax = Math.max(branchXMax, blocks[e].x);
        maxN = Math.max(maxN, blocks[e].n);
        if (e === lca) {
        } else if (tree.branches[e].parent === lca) { // do not frondify
            branches[e + '-vertical'] = {
                bid: e + '-vertical',
                x1: branchLen, x2: branchLen,
                // y1: blocks[e].y + blocks[e].height + verticalGap / 2,
                y1: 2 * blockHeight + 1.5 * verticalGap,
                y2: blocks[e].y + blocks[e].height / 2
            };
            branches[e] = {
                bid: e,
                x1: branchLen, x2: blocks[e].x,
                y1: branches[e + '-vertical'].y2,
                y2: branches[e + '-vertical'].y2,
            }
        } else {
            branches[e] = {
                bid: e,
                x1: branchLen, x2: blocks[e].x,
                y1: 2 * blockHeight + 1.5 * verticalGap,
                y2: blocks[e].y + blocks[e].height / 2
            };
            addFrondifyLeaves(e, frondLevel, frondLeafAngle);
        }
    };

    let addOutgroupBlock = (e, isContext=true) => {
        let bid = e + (isContext? '-out': '');
        blocks[rootBlockId].children.push(bid);
        blocks[bid] = {
            id: bid, children: [],
            x: branchLen, y: 0,
            height: blockHeight, width: 50,
            n: tree.entities.length - tree.branches[e].entities.length,
            entities: subtractMapping(createMappingFromArray(tree.entities), createMappingFromArray(tree.branches[e].entities)),
            branches: subtractMapping(getBranchesInSubtree(tree, tree.rootBranch), getBranchesInSubtree(tree, e)),
            matched: tree.expand.hasOwnProperty(e) && tree.expand[e].jac === 1,
            context: isContext,
            lastExpanded: e === tree.lastSelected,
        };
        maxN = Math.max(maxN, blocks[bid].n);
    };

    let addNestedBlock = (e, nestedTo, isIngroup) => {
        let nestBlock = blocks[nestedTo];
        let frondLevel = getNumFrond(isIngroup? distanceToLCA[e]: distanceToLCA[nestedTo]);
        let bl = e === lca || tree.branches[e].parent === lca? 15: frondBaseLength + (frondLevel - 1) * frondLeafGap;
        nestBlock.children.push(e);
        blocks[e] = {
            id: e,
            x: nestBlock.x + bl, y: nestBlock.y + nestMargin,
            height: nestBlock.height - 2 * nestMargin,
            n: isIngroup? tree.branches[e].entities.length: tree.entities.length - tree.branches[e].entities.length,
            entities: isIngroup? createMappingFromArray(tree.branches[e].entities):
                subtractMapping(createMappingFromArray(tree.entities), createMappingFromArray(tree.branches[e].entities)),
            branches: isIngroup? getBranchesInSubtree(tree, e):
                subtractMapping(getBranchesInSubtree(tree, tree.rootBranch), getBranchesInSubtree(tree, e)),
            matched: tree.expand[e].jac === 1,
            lastExpanded: tree.lastSelected === e,
            context: false,
            nestedTo,
        };
        branchXMax = Math.max(branchXMax, blocks[e].x);
        maxN = Math.max(maxN, blocks[e].n);
        if ((isIngroup && tree.branches[e].parent === nestedTo) || (!isIngroup && tree.branches[nestedTo] === e)) {
            branches[e] = {
                bid: e,
                x1: nestBlock.x, y1: nestBlock.y + nestBlock.height / 2,
                x2: nestBlock.x + bl, y2: nestBlock.y + nestBlock.height / 2
            };
        } else {
            branches[e] = {
                bid: e,
                x1: nestBlock.x, x2: nestBlock.x + bl,
                y1: nestBlock.y + nestBlock.height / 2,
                y2: nestBlock.y + nestBlock.height / 2
            };
            addFrondifyLeaves(e, frondLevel);
        }
    };


    if (tree.expand.hasOwnProperty(lca)) {
        // the two expanded nodes has nesting relation
        let expB = lca === expansion[0]? expansion[1]: expansion[0];
        if (tree.expand[lca].in && tree.expand[expB].in) {
            // nesting: (expA-in, expB-in)   expA-in contains expB-in
            addInGroupBlockAndBranches(lca, true);        // FIXME: centered this block
            addNestedBlock(expB, lca, true);
            addOutgroupBlock(lca);
        } else if (!tree.expand[lca].in && !tree.expand[expB].in) {
            // nesting: (expA-out, expB-out)  expB-out contains expA-out
            addOutgroupBlock(expB, false);
            addNestedBlock(lca, expB, false);
            addIngroupContextBlock(expB);
        } else if (!tree.expand[lca].in && tree.expand[expB].in){
            // (lca-out, expB-in)
            addOutgroupBlock(lca, false);
            addInGroupBlockAndBranches(expB);
        } else {
            // (lca-in, expB-out)       TODO: partial overlap
            return calcRemainderLayout(tree, spec);
        }
    } else {
        // The two expanded node is parallel
        let expA = expansion[0], expB = expansion[1];
        if (tree.expand[expA].in && tree.expand[expB].in) {
            // (A-in, B-in)
            addInGroupBlockAndBranches(expA);
            addInGroupBlockAndBranches(expB);
            addOutgroupBlock(lca, true);
        } else if (!tree.expand[expA].in && tree.expand[expB].in) {
            // (A-out, B-in)
            addOutgroupBlock(expA, false);
            addNestedBlock(expB, expA, true);
            // addOutgroupBlock(expB, true);
            addIngroupContextBlock(expA);
        } else if (tree.expand[expA].in && !tree.expand[expB].in) {
            // (A-in, B-out)
            addOutgroupBlock(expB, false);
            addNestedBlock(expA, expB, true);
            // addOutgroupBlock(expA, true);
            addIngroupContextBlock(expB);
        } else {
            // (A-out, B-out)
            return calcRemainderLayout(tree, spec)
        }
    }

    // Fill in thw width
    let xScale = scaleLog().domain([1, maxN]).range([0, width - branchXMax]);
    for (let bid in blocks) if (blocks.hasOwnProperty(bid) && bid !== 'missing') {
        blocks[bid].width = xScale(blocks[bid].n);
        if (blocks[bid].nestedTo) {
            // cap the width so that the block is truly contained
            let nestBlock = blocks[blocks[bid].nestedTo];
            blocks[bid].width = Math.min(blocks[bid].width, nestBlock.width - (blocks[bid].x - nestBlock.x) - nestMargin);
        }
    }

    return {blocks, branches, tid: tree.tid, lastSelected: tree.lastSelected, name: tree.name, rootBlockId,
        missing: createMappingFromArray(tree.missing)};
};


let calcFineGrainedLayout = (tree, spec) => {
    let expansion = Object.keys(tree.expand);
    if (expansion.length === 0) return calcRemainderLayout(tree, spec);

    let {lca} = getLCA(tree);
    // console.log('LCA = ', lca);

    // FIXME: duplicate code
    let {branchLen, verticalGap, leaveHeight, size} = spec;
    let height = size, width = size;

    let blocks = {};
    let missingHeight = 0;
    if (tree.missing) {
        missingHeight = tree.missing.length / (tree.missing.length + tree.branches[tree.rootBranch].entities.length) * (height - verticalGap);
        blocks.missing = {
            id: 'missing',
            isMissing: true,
            height: missingHeight,
            width, x: 0, y: height - missingHeight,
            n: tree.missing.length,          // the number of entities this block represents
            branches: {},
            context: true,
            entities: createMappingFromArray(tree.missing)
        };
    }
    // Generate all blocks needed to display.  Blocks are indexed by their expanded branch id except the root block.
    // Create a seudo root with id rootBranchId + "-a"
    let rootBlockId = tree.rootBranch + '-a';
    let allEntities = tree.branches[tree.rootBranch].entities;
    let lcaEntities = tree.branches[lca].entities;
    // let rootBlockWidth = width - lcaEntities.length / allEntities.length * (width - branchLen);
    let rootBlockWidth = width / 2;
    let nonMissingHeight = missingHeight? height - missingHeight - verticalGap: height;
    blocks[rootBlockId] = {
        id: rootBlockId,
        height: nonMissingHeight, width: rootBlockWidth,
        x: 0, y: 0,
        n: allEntities.length - lcaEntities.length,
        context: true,
        branches: subtractMapping(createMappingFromArray(Object.keys(tree.branches)), getBranchesInSubtree(tree, lca)),
        entities: subtractMapping(createMappingFromArray(allEntities), createMappingFromArray(lcaEntities))
    };
    let maxN = blocks[rootBlockId].n;

    let tmpExp = {};
    for (let i = 0; i < expansion.length; i++) {
        let e = expansion[i];
        if (e) {
            while (e !== lca) {
                e = tree.branches[e].parent;
                tmpExp[tree.branches[e].left] = 1;
                tmpExp[tree.branches[e].right] = 1;
            }
        }
    }
    tmpExp[lca] = 1;

    let branches = {};
    let numBlocks = 0;
    let numLeaves = 0;
    let traverse = (bid, curX) => {
        let b = tree.branches[bid];
        branches[bid] = {bid, x1: curX, x2: curX + branchLen, expanded: tree.expand.hasOwnProperty(bid)};
        if (!b.isLeaf) {
            if (tmpExp.hasOwnProperty(b.left)) {
                branches[bid + '-x'] = {bid: bid + '-x', x1: curX + branchLen, x2: curX + branchLen};
                traverse(b.left, curX + branchLen);
                traverse(b.right, curX + branchLen);
            } else {
                // Generate a block because it is the "end" side of expansion
                numBlocks += 1;
                blocks[bid] = {
                    id: bid,
                    width: 20, x: curX + branchLen,
                    matched: tree.expand[bid],
                    context: !tree.expand[bid],
                    lastExpanded: bid === tree.lastSelected,
                    branches: getBranchesInSubtree(tree, bid),
                    isLeaf: !!b.isLeaf, n: b.entities.length, entities: createMappingFromArray(b.entities)
                };
                maxN = Math.max(maxN, blocks[bid].n);
            }
        } else {
            numLeaves += 1;
        }
    };
    traverse(lca, rootBlockWidth);

    // let xScale = scaleLog().domain([1, maxN + 1]).range([0, width / 2]);
    // for (let bid in blocks) if (blocks.hasOwnProperty(bid) && bid !== 'missing') {
    //     blocks[bid].width = xScale(blocks[bid].n + 1);
    // }

    let blockHeight = (nonMissingHeight - verticalGap * (numBlocks - 1) - numLeaves * leaveHeight) / numBlocks;
    let noBlocks = 0, noLeaves = 0;
    let traverse2 = (bid) => {
        let b = tree.branches[bid];
        if (!b.isLeaf) {
            if (tmpExp.hasOwnProperty(b.left)) {
                traverse2(b.left);
                traverse2(b.right);
                branches[bid].y1 = (branches[b.left].y1 + branches[b.right].y1) / 2;
                branches[bid].y2 = (branches[b.left].y1 + branches[b.right].y1) / 2;
                branches[bid + '-x'].y1 = branches[b.left].y1;
                branches[bid + '-x'].y2 = branches[b.right].y1;
            } else {
                blocks[bid].y = noBlocks * (blockHeight + verticalGap) + noLeaves * leaveHeight;
                blocks[bid].height = blockHeight;
                noBlocks += 1;
                branches[bid].y1 = (blocks[bid].y * 2 + blockHeight) / 2;
                branches[bid].y2 = (blocks[bid].y * 2 + blockHeight) / 2;
            }
        } else {
            branches[bid].y1 = noBlocks * (blockHeight + verticalGap) + noLeaves * leaveHeight + leaveHeight / 2;
            branches[bid].y2 = noBlocks * (blockHeight + verticalGap) + noLeaves * leaveHeight + leaveHeight / 2;
            noLeaves += 1;
        }
    };
    traverse2(lca);

    return {blocks, branches, rootBlockId, tid: tree.tid, lastSelected: tree.lastSelected, name: tree.name,
        missing: createMappingFromArray(tree.missing)};
};

let getLayouts = createSelector(
    [trees => trees, (_, spec) => spec, (_, spec, mode) => mode],
    (trees, spec, mode) => {
        let layout = calcFrondLayout;
        if (mode === 'remainder') layout = calcRemainderLayout;
        if (mode === 'fine-grained') layout = calcFineGrainedLayout;
        return trees.map(t => layout(t, spec));
    }
);

let getHash = (blocks, rootBlockId, mode) => {
    if (mode === 'taxa-cluster') {
        // Only consider the most-recent expanded block
        for (let bid in blocks) if (blocks.hasOwnProperty(bid) && blocks[bid].lastExpanded) {
            return Object.keys(blocks[bid].entities).sort().join();
        }
        // if not found
        return 'NA';
    }

    let getBlockRep = b => {
        if (mode === 'supercluster') return b.n === 0? '0': 'x'; // if b.n is 0, it means it is not gonna show up, it's different than those presented blocks
        if (mode === 'topo-cluster') return b.n.toString();
        // if (mode === 'taxa-cluster') return Object.keys(b.entities).sort().join();
    };
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


// Cluster trees by visual representations
// trees is an array of tree objects {tid, blocks, rootBlockId, branches}
// Return an array of clusters, with each one {blockArr, branchArr, num}
//      Each block in the blockArr is stuffed with a mapping between the tree this cluster represents and the block id this block represents
let getClusters = createSelector(
    [trees => trees, (_, mode) => mode,  (_, mode, withoutMissing) => withoutMissing],
    (trees, mode, withoutMissing) => {
        console.log('Clustering trees... mode: ', mode, 'without missing taxa: ', withoutMissing);

        // FIXME: if they don't share the same topo, this won't work!!!
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
                num: 0, trees: [], total: trees.length};
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

        let clusters = [];
        let c, t;
        if (mode === 'taxa-cluster' && withoutMissing) {
            let taxaSetByTree = {};
            let treeMapping = {};
            for (let i = 0; i < trees.length; i++) {
                t = trees[i];
                taxaSetByTree[t.tid] = t.lastSelected? t.blocks[t.lastSelected].entities: {};
                treeMapping[t.tid] = t;
            }

            for (let i = 0; i < trees.length; i++) {
                t = trees[i];
                c = null;
                for (let j = 0; j < clusters.length; j++) {
                    let s = clusters[j];
                    if (areSetsEqual(subtractMapping(taxaSetByTree[s.trees[0]], treeMapping[t.tid].missing),
                            subtractMapping(taxaSetByTree[t.tid], treeMapping[s.trees[0]].missing))) {
                        c = s;
                        break;
                    }
                }
                if (!c) {
                    c = createEmptyClusterFromTree(t);
                    clusters.push(c);
                }
                c.num += 1;
                c.trees.push(t.tid);
                addRepresent(c.blocks, c.rootBlockId, t.blocks, t.tid, t.rootBlockId);
            }
        } else {
            // Get the tree hashes
            for (let i = 0; i < trees.length; i++) {
                trees[i].hash = getHash(trees[i].blocks, trees[i].rootBlockId, mode);
            }

            // Sort the trees according to their hashes
            trees.sort((a, b) => {
                if (a.hash > b.hash) return 1;
                if (a.hash < b.hash) return -1;
                return 0;
            });

            // Scan the array to construct cluster
            for (let i = 0; i < trees.length; i++) {
                let t = trees[i];
                if (i === 0 || t.hash !== trees[i - 1].hash) {
                    // create a new cluster
                    c = createEmptyClusterFromTree(t);
                    clusters.push(c);
                }
                c.num += 1;
                c.trees.push(t.tid);
                addRepresent(c.blocks, c.rootBlockId, t.blocks, t.tid, t.rootBlockId);
            }

        }

        return clusters.sort((a, b) => b.num - a.num);
    });


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
        let highlightEntities = highlightGroups.bids.map(h => createMappingFromArray(h.entities));

        // Check if a is a subset of b.  a and b are both objects
        let isSubset = (a, b) => {
            for (let x in a) {
                if (!b.hasOwnProperty(x)) return false;
            }
            return true;
        };

        for (let tid in dendroMapping) if (dendroMapping.hasOwnProperty(tid)) {
            let t = dendroMapping[tid];
            for (let bid in t.blocks) if (t.blocks.hasOwnProperty(bid)) {
                let b = t.blocks[bid];
                let intersections = highlightEntities
                    .map((h, i) => ({entities: getIntersectionSet(b.entities, h), color: highlightGroups.colorScheme(highlightGroups.bids[i].color)}))
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

// the highlight monophyly is prone to change, so to make it faster, need to extract the part calculating the fillPercentage
let getDendrograms = createSelector(
    [state => state.aggregatedDendrogram.mode,
        (_, trees) => trees,
        state => state.highlight,
        state => state.aggregatedDendrogram.spec,
        state => state.inputGroupData.trees,
        state => state.attributeExplorer.activeSelectionId !== null?
            state.attributeExplorer.selection[state.attributeExplorer.activeSelectionId]: null,
        state => state.attributeExplorer.activeSelectionId !== null &&
        state.attributeExplorer.selection[state.attributeExplorer.activeSelectionId].cb? state.referenceTree: null,
        state => state.cb,
        state => state.aggregatedDendrogram.shadedHistogram],
    (mode, trees, highlight, spec, rawTrees, rangeSelection, refTree, cb, shadedHistogram) => {
        let dendros = getLayouts(trees, spec, mode);
        let isClusterMode = mode.indexOf('cluster') !== -1;
        let clusters = isClusterMode? getClusters(dendros, mode, cb === 'cb2').slice(): [];
        dendros = dendros.slice();
        let dendroMapping = {};
        for (let i = 0; i < dendros.length; i++) {
            dendroMapping[dendros[i].tid] = dendros[i];
        }

        getFill(dendroMapping, clusters, isClusterMode, highlight, rawTrees, shadedHistogram);
        checkRangeSelection(dendroMapping, rangeSelection, refTree, rawTrees, cb);
        return isClusterMode? clusters: dendros;
    }
);


let mapStateToProps = (state) => {
    let trees = getTrees(state);
    return {
        ...state.aggregatedDendrogram,
        inputGroupId: state.inputGroupData.inputGroupId,
        referenceTid: state.referenceTree.id,
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
    onChangeReferenceTree: (iid, tid) => {dispatch(changeReferenceTree(iid, tid))},
    onRemoveSet: setIndex => {dispatch(removeSet(setIndex))},
    onAddTreeToInspector: (tid) => {
        if (tid != null) {
            dispatch(addTreeToInspector(tid))
        } else {
            dispatch(toggleInspector())
        }
    },
    onCompareWithReference: (tid) => {dispatch(compareWithReference(tid))},
    onChangeSorting: () => {dispatch(toggleSorting())},
    clearSelection: () => {dispatch(clearBranchSelection())},
    onToggleMode: (m) => {dispatch(toggleAggregationMode(m))},
    onToggleBlock: (e, e1) => {dispatch(toggleHighlightEntities(e, e1))},
});

export default connect(mapStateToProps, mapDispatchToProps)(DendrogramContainer);