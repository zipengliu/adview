/**
 * Created by zipeng on 2017-05-18.
 */

import {scaleLog} from 'd3';
import {createMappingFromArray, subtractMapping, isMonophyly} from './utils';
import {fetchInputGroup} from "./actions";

// Get the "pivot" branch for rendering an AD
// If there is branch matched to outgroup, use the lowest one
// otherwise get the LCA
let getPivotBranch = (tree, expanded, lcaOnly=true) => {
    if (Object.keys(expanded).length === 0) {
        return {pivot: tree.rootBranch, distanceToLCA: null}
    }
    let l = [];
    let anc = {};
    let eitherOne = null;
    let getAncestorList = (bid) => {
        let b = tree.branches[bid];
        l.push(bid);
        if (expanded.hasOwnProperty(bid)) {
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

    if (!lcaOnly) {
        let lowestOutgroupBid = null;
        for (let bid in expanded) if (expanded.hasOwnProperty(bid)) {
            if (!expanded[bid].in && (lowestOutgroupBid === null || anc[bid].length > anc[lowestOutgroupBid].length)) {
                lowestOutgroupBid = bid;
            }
        }
        if (lowestOutgroupBid) {
            return {pivot: lowestOutgroupBid};
        }
    }

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
    return {pivot: anc[eitherOne][i - 1], distanceToLCA};
};



// Get the height of the missing block given the number of missing and present taxa
let getMissingHeight = (missing, present, spec) => {
    return missing / (missing +  present) * (spec.height - spec.verticalGap) * spec.missingCompressRatio;
};

// Calculating the blocks of the aggregaated dendrogram
// given a tree (tree document from DB) (tree),
// a dictionary of branches to be expanded,
// and size specification (spec)
// Return the dictionary of blocks and branches
let calcRemainderLayout = (tree, expanded, spec) => {
    let {branchLen, verticalGap, leaveHeight, leaveHighlightWidth, width, height} = spec;

    let blocks = {};
    let missingHeight = 0;
    if (tree.missing) {
        missingHeight = getMissingHeight(tree.missing.length, tree.branches[tree.rootBranch].entities.length, spec);
        blocks.missing = {
            id: 'missing', children: [],
            isMissing: true,
            height: missingHeight,
            width, x: 0, y: height - missingHeight,
            n: tree.missing.length,          // the number of entities this block represents
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
        context: true,
        entities: createMappingFromArray(tree.branches[tree.rootBranch].entities)
    };

    let splitBlock = function (blockId, curBid) {
        let b = tree.branches[curBid];
        let newBlockId = blockId;
        if (expanded.hasOwnProperty(curBid)) {
            // split block
            blocks[curBid] = {children: [], level: blocks[blockId].level + 1, id: curBid, width: 0,
                // similarity: expanded[curBid].in? expanded[curBid].jac: null,
                matched: expanded[curBid].jac === 1 && expanded[curBid].in,
                no: expanded[curBid].in? expanded[curBid].no: null,
                context: !expanded[curBid].in,
                isLeaf: !!b.isLeaf,
                n: b.entities.length,
                entities: createMappingFromArray(b.entities)};
            blocks[blockId].n -= b.entities.length;
            blocks[blockId].entities = subtractMapping(blocks[blockId].entities, blocks[curBid].entities);
            blocks[blockId].isNotMonophyly = !isMonophyly(tree, blocks[blockId].entities);
            blocks[blockId].children.push(curBid);
            if (!expanded[curBid].in) {
                blocks[blockId].matched = expanded[curBid].jac === 1;
                blocks[blockId].no = expanded[curBid].no;
                blocks[blockId].context = false;
            }
            newBlockId = curBid;
        }
        // otherwise recursively go down the children
        if (!b.isLeaf) {
            splitBlock(newBlockId, b.left);
            splitBlock(newBlockId, b.right);
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

    return {blocks, branches, rootBlockId, tid: tree.tid, name: tree.name, missing: createMappingFromArray(tree.missing)};
};

let calcFrondLayout = (tree, expanded, spec) => {
    let expansion = Object.keys(expanded);
    if (expansion.length !== 2) return calcRemainderLayout(tree, expanded, spec);

    let {pivot, distanceToLCA} = getPivotBranch(tree, expanded);

    let {branchLen, verticalGap, width, height} = spec;
    let {frondLeafGap, frondLeafAngle, frondBaseLength, nestMargin} = spec.frondLayout;

    let blocks = {};
    let missingHeight = 0;
    if (tree.missing) {
        missingHeight = getMissingHeight(tree.missing.length, tree.branches[tree.rootBranch].entities.length, spec);
        blocks.missing = {
            id: 'missing',
            isMissing: true,
            context: true,
            height: missingHeight,
            width, x: 0, y: height - missingHeight,
            n: tree.missing.length,          // the number of entities this block represents
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
    //let outgroupOnTop = pivot !== tree.rootBranch && tree.branches[tree.branches[pivot].parent].left === pivot;
    let branches = {
        [pivot + '-vertical']: {
            bid: pivot + '-vertical',
            x1: 0, x2: 0,
            y1: blockHeight / 2, y2: 2 * blockHeight + 1.5 * verticalGap
        },
        [pivot + '-in'] :{
            bid: pivot + '-in',
            x1: 0, x2: branchLen,
            y1: 2 * blockHeight + 1.5 * verticalGap,
            y2: 2 * blockHeight + 1.5 * verticalGap,
        },
        [pivot + '-out']: {
            bid: pivot + '-out',
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

    // TODO: it might be a child of the LCA instead of LCA: might not occupy the centeral position
    let addIngroupContextBlock = e => {
        let bid = e + '-in';
        blocks[rootBlockId].children.push(bid);
        blocks[bid] = {
            id: bid,
            x: branchLen, y: 1.5 * (blockHeight + verticalGap),
            height: blockHeight, width: 50,
            n: tree.branches[e].entities.length,
            entities: createMappingFromArray(tree.branches[e].entities),
            context: true,
        };
        maxN = Math.max(maxN, blocks[bid].n);
    };

    let isLeftOfLCA = (e, pivot) => tree.branches[e].order < tree.branches[pivot].order;
    let addInGroupBlockAndBranches = (e, isCentered=false) => {
        let frondLevel = getNumFrond(distanceToLCA[e]);
        let isLeft = isLeftOfLCA(e, pivot);
        let bl = e === pivot? 0: (tree.branches[e].parent === pivot? branchLen: frondBaseLength + (frondLevel - 1) * frondLeafGap);
        blocks[rootBlockId].children.push(e);
        blocks[e] = {
            id: e, children: [],
            x: branchLen + bl, y: isCentered? 1.5 * (blockHeight + verticalGap): (isLeft? blockHeight + verticalGap: 2 * (blockHeight + verticalGap)),
            height: blockHeight, width: 50,
            n: tree.branches[e].entities.length,
            entities: createMappingFromArray(tree.branches[e].entities),
            matched: expanded[e].jac === 1,
            no: expanded[e].no,
            context: false,
        };
        branchXMax = Math.max(branchXMax, blocks[e].x);
        maxN = Math.max(maxN, blocks[e].n);
        if (e === pivot) {
        } else if (tree.branches[e].parent === pivot) { // do not frondify
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
            matched: expanded.hasOwnProperty(e) && expanded[e].jac === 1,
            no: expanded.hasOwnProperty(e) && !isContext? expanded[e].no: null,
            context: isContext,
        };
        maxN = Math.max(maxN, blocks[bid].n);
    };

    let addNestedBlock = (e, nestedTo, isIngroup) => {
        let nestBlock = blocks[nestedTo];
        let frondLevel = getNumFrond(isIngroup? distanceToLCA[e]: distanceToLCA[nestedTo]);
        let bl = e === pivot || tree.branches[e].parent === pivot? 15: frondBaseLength + (frondLevel - 1) * frondLeafGap;
        nestBlock.children.push(e);
        blocks[e] = {
            id: e,
            x: nestBlock.x + bl, y: nestBlock.y + nestMargin,
            height: nestBlock.height - 2 * nestMargin,
            n: isIngroup? tree.branches[e].entities.length: tree.entities.length - tree.branches[e].entities.length,
            entities: isIngroup? createMappingFromArray(tree.branches[e].entities):
                subtractMapping(createMappingFromArray(tree.entities), createMappingFromArray(tree.branches[e].entities)),
            matched: expanded[e].jac === 1,
            context: false,
            no: expanded[e].no,
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


    if (expanded.hasOwnProperty(pivot)) {
        // the two expanded nodes has nesting relation
        let expB = pivot === expansion[0]? expansion[1]: expansion[0];
        if (expanded[pivot].in && expanded[expB].in) {
            // nesting: (expA-in, expB-in)   expA-in contains expB-in
            addInGroupBlockAndBranches(pivot, true);        // FIXME: centered this block
            addNestedBlock(expB, pivot, true);
            addOutgroupBlock(pivot);
        } else if (!expanded[pivot].in && !expanded[expB].in) {
            // nesting: (expA-out, expB-out)  expB-out contains expA-out
            addOutgroupBlock(expB, false);
            addNestedBlock(pivot, expB, false);
            addIngroupContextBlock(expB);
        } else if (!expanded[pivot].in && expanded[expB].in){
            // (pivot-out, expB-in)
            addOutgroupBlock(pivot, false);
            addInGroupBlockAndBranches(expB);
            // addIngroupContextBlock(exp)         // TODO: The context in-group
        } else {
            // (pivot-in, expB-out)       TODO: partial overlap
            return calcRemainderLayout(tree, expanded, spec);
        }
    } else {
        // The two expanded node is parallel
        let expA = expansion[0], expB = expansion[1];
        if (expanded[expA].in && expanded[expB].in) {
            // (A-in, B-in)
            addInGroupBlockAndBranches(expA);
            addInGroupBlockAndBranches(expB);
            addOutgroupBlock(pivot, true);
        } else if (!expanded[expA].in && expanded[expB].in) {
            // (A-out, B-in)
            addOutgroupBlock(expA, false);
            addNestedBlock(expB, expA, true);
            // addOutgroupBlock(expB, true);
            addIngroupContextBlock(expA);
        } else if (expanded[expA].in && !expanded[expB].in) {
            // (A-in, B-out)
            addOutgroupBlock(expB, false);
            addNestedBlock(expA, expB, true);
            // addOutgroupBlock(expA, true);
            addIngroupContextBlock(expB);
        } else {
            // (A-out, B-out)
            return calcRemainderLayout(tree, expanded, spec)
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

    return {blocks, branches, tid: tree.tid, name: tree.name, rootBlockId, missing: createMappingFromArray(tree.missing)};
};

let calcContainerLayout = (tree, expanded, spec) => {
    let {pivot} = getPivotBranch(tree, expanded, false);
    let {rootBranch, missing} = tree;
    let {verticalGap, width, height, branchLen} = spec;

    let branches = {};
    let rootBlockId = 'root';
    let blocks = {
        [rootBlockId]: {
            id: rootBlockId,
            n: 0,
            entities: {},
            children: []
        }
    };

    let missingHeight = 0;
    if (missing) {
        missingHeight = getMissingHeight(missing.length, tree.branches[rootBranch].entities.length, spec);
        blocks.missing = {
            id: 'missing',
            isMissing: true,
            context: true,
            height: missingHeight,
            width, x: 0, y: height - missingHeight,
            n: missing.length,          // the number of entities this block represents
            entities: createMappingFromArray(missing)
        };
    }
    let nonMissingHeight = missingHeight? height - missingHeight - verticalGap: height;
    // let blockHeight = (nonMissingHeight - 2 * verticalGap) / 3;

    let getRelativeHeight = (bid) => {
        if (!blocks[bid].children.length) return 1;
        let h = 0;
        for (let i = 0; i < blocks[bid].children.length; i++) {
            let c = blocks[bid].children[i];
            h += blocks[c].height;
        }
        return h + spec.containerLayout.verticalGapRatio * (blocks[bid].children.length + 1);
    };

    let createNestedBlock = (bid, parentBlockId) => {
        let e = tree.branches[bid].entities;
        let p = blocks[parentBlockId];
        blocks[bid] = {
            id: bid,
            context: false,
            no: expanded[bid].no,
            matched: expanded[bid].jac === 1.0,
            height: 1,
            width: 0,
            x: 0, y: 0,
            entities: createMappingFromArray(e),
            n: e.length,
            children: [],
        };
        p.children.push(bid);
        p.entities = subtractMapping(p.entities, blocks[bid].entities);
    };

    let traverseIngroup = (bid, parentBlockId) => {
        let b = tree.branches[bid];
        let newParentBlockId = parentBlockId;
        let blockId = bid === pivot? 'pivot-right': null;
        if (bid !== pivot && expanded.hasOwnProperty(bid)) {
            createNestedBlock(bid, parentBlockId);
            newParentBlockId = bid;
            blockId = bid;
        }
        if (!b.isLeaf) {
            traverseIngroup(b.left, newParentBlockId);
            traverseIngroup(b.right, newParentBlockId);
        }
        if (blockId) {
            blocks[blockId].height = getRelativeHeight(blockId);
            blocks[blockId].levels = blocks[blockId].children.length? blocks[blocks[blockId].children[0]].levels + 1: 1;
        }
    };
    let traverseOutgroup = (bid, parentBlockId) => {
        let newParentBlockId = parentBlockId;
        let blockId = bid === pivot? 'pivot-left': null;
        if (bid !== pivot && expanded.hasOwnProperty(bid)) {
            createNestedBlock(bid, parentBlockId);
            newParentBlockId = bid;
            blockId = bid;
        }
        if (bid !== rootBranch) {
            let parent = tree.branches[bid].parent;
            // Visit parent
            traverseOutgroup(parent, newParentBlockId);
            // Visit sibling
            traverseIngroup(tree.branches[parent].left === bid? tree.branches[parent].right: tree.branches[parent].left, newParentBlockId);
        }
        if (blockId) {
            blocks[blockId].height = getRelativeHeight(blockId);
            blocks[blockId].levels = blocks[blockId].children.length? blocks[blocks[blockId].children[0]].levels + 1: 1;
        }
    };

    // Start from the pivot
    let p = blocks[rootBlockId];
    let entitiesMapping = createMappingFromArray(tree.branches[pivot].entities);
    if (pivot !== rootBranch) {
        // The left block
        let outgroupEntities = subtractMapping(createMappingFromArray(tree.entities), entitiesMapping);
        let num = Object.keys(outgroupEntities).length;
        // the width tof this block should remain in a reasonable range
        blocks['pivot-left'] = {      // This block does not have any inner block for certain
            id: 'pivot-left',
            context: !expanded.hasOwnProperty(pivot) || expanded[pivot].in,
            height: 0,
            width: 0,
            x: 0, y: 0,
            entities: outgroupEntities,
            n: num,
            children: []
        };
        if (!blocks['pivot-left'].context) {
            blocks['pivot-left'].no = expanded[pivot].no;
            blocks['pivot-left'].matched = expanded[pivot].jac === 1.0;
        }
        p.children.push('pivot-left');

        branches[pivot] = {
            bid: pivot,
            x1: blocks['pivot-left'].width, y1: nonMissingHeight / 2,
            x2: blocks['pivot-left'].width + branchLen, y2: nonMissingHeight / 2
        };

        traverseOutgroup(pivot, 'pivot-left');
    }

    // The right block
    blocks['pivot-right'] = {
        id: 'pivot-right',
        context: !expanded.hasOwnProperty(pivot) || !expanded[pivot].in,
        height: 0,
        width: 0,
        x: 0, y: 0,
        entities: entitiesMapping,
        n: tree.branches[pivot].entities.length,
        children: []
    };
    if (!blocks['pivot-right'].context) {
        blocks['pivot-right'].no = expanded[pivot].no;
        blocks['pivot-right'].matched = expanded[pivot].jac === 1.0;
    }
    p.children.push('pivot-right');

    traverseIngroup(pivot, 'pivot-right');

    // Calculate the absolute height of all blocks
    let unitHeight;
    let getAbsoluteHeight = (blockId) => {
        let curY = spec.containerLayout.verticalGapRatio * unitHeight;
        let b = blocks[blockId];
        for (let i = 0; i < b.children.length; i++) {
            let c = b.children[i];
            blocks[c].height *= unitHeight;
            blocks[c].y = b.y + curY;
            curY += blocks[c].height + spec.containerLayout.verticalGapRatio * unitHeight;
            if (blocks[c].children.length) {
                getAbsoluteHeight(c);
            }
        }
    };

    if ('pivot-left' in blocks) {
        unitHeight = nonMissingHeight / blocks['pivot-left'].height;
        blocks['pivot-left'].height = nonMissingHeight;
        if (blocks['pivot-left'].children.length) {
            getAbsoluteHeight('pivot-left');
        }
    }
    unitHeight = nonMissingHeight / blocks['pivot-right'].height;
    blocks['pivot-right'].height = nonMissingHeight;
    if (blocks['pivot-right'].children.length) {
        getAbsoluteHeight('pivot-right');
    }

    // Fix the width and x coordinate
    let fillX = (blockId) => {
        let b = blocks[blockId];
        for (let i = 0; i < b.children.length; i++) {
            let c = b.children[i];
            blocks[c].width = b.width - 20;
            blocks[c].x = b.x + 15;
            if (blocks[c].children.length) {
                fillX(c);
            }
        }
    };
    let leftBlockWidth = 0;
    if ('pivot-left' in blocks) {
        leftBlockWidth = (width - 15 * (blocks['pivot-left'].levels + blocks['pivot-right'].levels) - branchLen) *
            (1 - tree.branches[pivot].entities.length / tree.entities.length) +
            15 * blocks['pivot-left'].levels;
        blocks['pivot-left'].width = leftBlockWidth;
        fillX('pivot-left');
        branches[pivot].x1 = leftBlockWidth;
        branches[pivot].x2 = leftBlockWidth + branchLen;
    }
    blocks['pivot-right'].width = width - ('pivot-left' in blocks? branchLen: 0) - leftBlockWidth;
    blocks['pivot-right'].x = leftBlockWidth + ('pivot-left' in blocks? branchLen: 0);
    fillX('pivot-right');

    return {blocks, branches, tid: tree.tid, name: tree.name, rootBlockId, missing: createMappingFromArray(tree.missing)};
};

let getMissingBlock = (tree, spec) => {
    let {missing, rootBranch} = tree;
    let missingHeight = getMissingHeight(missing.length, tree.branches[rootBranch].entities.length, spec);
    return {
        id: 'missing',
        isMissing: true,
        context: true,
        height: missingHeight,
        width: spec.width,
        x: 0, y: spec.height - missingHeight,
        n: missing.length,          // the number of entities this block represents
        entities: createMappingFromArray(missing)
    };
};


let degenerateSpec = (spec, dimension='height') => {
    // console.log('degenerate the specs...', spec);

    let {skeletonLayout} = spec;
    let newSpec = {...spec, skeletonLayout: {...spec.skeletonLayout}};

    // First try to decrease the showDepth
    if (skeletonLayout.showDepth > 1) {
        // console.log('shrinking levels');
        newSpec.skeletonLayout.showDepth -= 1;
        return newSpec;
    }

    let tryYourBest = (fields) => {
        let hope = false;
        for (let f of fields) {
            if (skeletonLayout[f] >= 4) {       // Limit is 2px
                hope = true;
                newSpec.skeletonLayout[f] /= 2;
            }
        }
        if (hope) {
            // console.log(newSpec);
        }
        return hope;
    };

    if (dimension === 'height') {
        // Half all vertical specs
        // console.log('shrinking height');
        let verticalFields = ['collapsedBlockHeight', 'matchedBlockMinHeight', 'firstNestedBlockVerticalGap'];
        if (tryYourBest(verticalFields)) return newSpec;
    }

    if (dimension === 'width') {
        // console.log('shrinking width');
        let horizontalFields = ['collapsedBlockWidth', 'nestingBlockExtraWidth', 'collapsedBranchLength'];
        if (tryYourBest(horizontalFields)) return newSpec;
    }

    // console.warn('DESPERATE!!!!');
    // Desperate
    return null;
};


let calcSkeletonLayout = (tree, expanded, spec) => {
    let {rootBranch, missing, outgroupBranch} = tree;
    let {verticalGap, width, height, branchLen} = spec;
    let rootBlockId = 'root';
    let ingroupBranch = outgroupBranch? tree.branches[rootBranch].right: rootBranch;

    let expandedBidArray = Object.keys(expanded);
    let blocks = {}, branches = {};
    if (missing.length > 0) {
        blocks.missing = getMissingBlock(tree, spec);
        height -= blocks.missing.height + verticalGap;
    }
    if (expandedBidArray.length === 0) {
        // There is no expanded branch
        blocks[rootBlockId] = {
            id: rootBlockId,
            n: tree.entities.length,
            entities: createMappingFromArray(tree.entities),
            x: 0, y: 0,
            width, height,
            context: true,
            children: []
        };
        // Exit
        return {blocks, branches, tid: tree.tid, name: tree.name, rootBlockId, missing: createMappingFromArray(tree.missing),
            width: spec.width, height: spec.height};
    }

    // console.log(tree.tid, expandedBidArray, spec);

    blocks[rootBlockId] = {
        id: rootBlockId,
        n: 0,
        entities: {},
        children: []
    };

    let createNewBlock = (bid, parentBlockId, attributes={}) => {
        let p = blocks[parentBlockId];
        blocks[bid] = {
            id: bid,
            context: false,
            no: bid in expanded? expanded[bid].no: null,
            matched: bid in expanded?
                (expanded[bid].jacs? expanded[bid].jacs.reduce((a, b) =>(a + b), 0) / expanded[bid].jacs.length === 1.0:
                    expanded[bid].jac === 1.0):
                false,
            height: 1,
            width: 0,
            x: 0, y: 0,
            entities: createMappingFromArray(tree.branches[bid].entities),
            n: tree.branches[bid].entities.length,
            children: [],
            isNested: parentBlockId !== rootBlockId,
            ...attributes
        };

        // Insert this block to the parent and keep the order of all children
        // increasing order of tree.branches[bid]
        let i = 0;
        for (; i < p.children.length; i++) {
            if (tree.branches[bid].order < tree.branches[p.children[i]].order) break;
        }
        p.children.splice(i, 0, bid);
    };

    if (outgroupBranch === tree.branches[rootBranch].left) {
        // Show the outgroup block
        createNewBlock(outgroupBranch, rootBlockId, {isOutgroup: true, collapsed: true});
    }

    // Get all the expanded blocks
    let dfs = (bid, parentBlockId) => {
        let b = tree.branches[bid];
        let newParent = parentBlockId;
        if (expanded.hasOwnProperty(bid)) {
            createNewBlock(bid, parentBlockId);
            newParent = bid;
        }
        if (!b.isLeaf) {
            dfs(b.left, newParent);
            dfs(b.right, newParent);
        }
    };
    dfs(ingroupBranch, rootBlockId);

    // Connect the blocks with branches
    // 'h-': horizontal lines; 'v-': vertical ones

    let getBranchIdFromBlockId = (blockId) => {
        let parts = blockId.split('-');
        return parts.length === 1? parts[0]: parts[1];
    };

    // Draw branches between an ancestor to all its direct children
    // (in the blocks hierarchy data structure, not the tree)
    // branchToAttach is null for the root, but a horizontal branch line for nested blocks
    // Return the id the highest branch
    let connectBlocks = (parentBranchId, parentBlockId, branchToAttach) => {
        let block = blocks[parentBlockId];

        // Add branches between two branches.
        // upper is a branch id in branches, which is higher in the hierarchy.
        // x is either a block id in blocks, or a branch id in tree.branches ('v-' + x is the branch id in branches)
        // Return the leftmost branch id
        let addBranchesBetween = (upper, x, branchToAttach) => {
            // console.log('adding branches in between branches', upper, x, branchToAttach);

            let xBranchId = getBranchIdFromBlockId(x);

            let leftMostBid = 'h-' + upper;
            if (leftMostBid in branches) {
                leftMostBid = 'h-' + upper + '-';
            }
            if (xBranchId === upper) {
                // A single branch to connect them
                branches[leftMostBid] = {left: branchToAttach, right: x};
                if (x in blocks) {
                    blocks[x].connectingBranch = leftMostBid;
                }
            } else if (Math.abs(tree.branches[xBranchId].depth - tree.branches[upper].depth) > spec.skeletonLayout.showDepth) {
                // Hide all stuff in the middle with a glyph
                branches[leftMostBid] = {left: branchToAttach, right: x, collapsed: true};
                if (x in blocks) {
                    blocks[x].connectingBranch = leftMostBid;
                }
            } else {
                // Show all branches from upper to x
                branches[leftMostBid] = {left: branchToAttach};
                if (x in blocks) {
                    blocks[x].connectingBranch = 'h-' + x;
                }

                // Traverse from x up to upper
                let up = (bid) => {
                    // console.log(`up(${bid})`);
                    let b = tree.branches[bid];
                    let p = tree.branches[b.parent];
                    Object.assign(branches, {
                        ['v-' + b.parent]: {top: 'h-' + p.left, bottom: 'h-' + p.right},
                        ['h-' + p.left]: {left: 'v-' + b.parent, },
                        ['h-' + p.right]: {left: 'v-' + b.parent, }
                    });
                    if (p.left === bid) {
                        // console.log('target is on the LEFT', p);
                        branches['h-' + p.left].right = bid === x && x in blocks? x: 'v-' + bid;
                        branches['h-' + p.right].right = p.right;
                        createNewBlock(p.right, parentBlockId, {collapsed: true});
                    } else {
                        // console.log('target is on the RIGHT', p);
                        branches['h-' + p.right].right = bid === x && x in blocks? x: 'v-' + bid;
                        branches['h-' + p.left].right = p.left;
                        createNewBlock(p.left, parentBlockId, {collapsed: true});
                        // This new collapsed block should go before its right siblings
                    }
                    if (b.parent !== upper) {
                        up(b.parent);
                    } else {
                        branches[leftMostBid].right = 'v-' + b.parent;
                    }
                };
                up(xBranchId);
            }
            return leftMostBid;
        };

        let mergeChildren = (children) => {
            // console.log('Merge children', children);
            if (children.length === 1) {
                return children[0];
            } else {
                let lca = tree.getLCAforMultiple(children);
                if (!lca) {
                    console.error(tree);
                    console.error(expandedBidArray);
                    console.error(lca);
                    console.error(children);
                    console.error(blocks);
                }
                let l = tree.branches[lca].left, r = tree.branches[lca].right;
                let x, y;
                if (children.length === 2) {
                    x = children[0];
                    y = children[1];
                    if (tree.branches[x].order > tree.branches[y].order) {
                        let t = x; x = y; y = t;
                    }
                } else {
                    // Split
                    let leftChildren = children.filter(c => tree.branches[c].order <= tree.branches[lca].order);
                    let rightChildren = children.filter(c => tree.branches[c].order > tree.branches[lca].order);
                    console.assert(leftChildren.length > 0, 'Split on a branch that has no left matched blocks');
                    console.assert(rightChildren.length > 0, 'Split on a branch that has no right matched blocks');
                    x = mergeChildren(leftChildren);
                    y = mergeChildren(rightChildren);
                }

                let lcaBranchId = 'v-' + lca;
                branches[lcaBranchId] = {
                    top: addBranchesBetween(l, x, lcaBranchId),       // branches from LCA's left to x
                    bottom: addBranchesBetween(r, y, lcaBranchId)     // branches from LCA's right to y
                };
                return lcaBranchId;
            }
        };
        let dangle = mergeChildren(block.children);

        // Connect the converged branch with the outside: from merged[0] to parentBranchId
        let attachingBranch = addBranchesBetween(parentBranchId, dangle, branchToAttach);

        // Recursively deal with the expanded children
        for (let c of block.children) {
            if (!blocks[c].collapsed && blocks[c].children.length > 0) {
                branches[blocks[c].connectingBranch].rightBranch = connectBlocks(c, c, blocks[c].connectingBranch);
            }
        }

        return attachingBranch;
    };
    connectBlocks(rootBranch, rootBlockId, null);

    // Determine the height of the blocks: top-down approach
    // Calculate the fixed parts of height of each block first
    let traverseBlocksForHeight = (blockId) => {
        let b = blocks[blockId];
        if (b.children.length > 0) {
            b.heightFixed = (b.children.length - 1) * verticalGap +
                (blockId === rootBlockId? 0: spec.skeletonLayout.firstNestedBlockVerticalGap + verticalGap);
            b.heightVar = 0;
            for (let c of b.children) {
                traverseBlocksForHeight(c);
                b.heightFixed += blocks[c].heightFixed;
                b.heightVar += blocks[c].heightVar;
            }
            b.heightVar = Math.max(b.heightVar, b.n);
        } else {
            b.heightFixed = b.collapsed? spec.skeletonLayout.collapsedBlockHeight: spec.skeletonLayout.matchedBlockMinHeight;
            b.heightVar = b.collapsed? 0: b.n;
        }
    };
    traverseBlocksForHeight(rootBlockId);

    // The coefficient for the log part in height
    let coefficient = (height - blocks[rootBlockId].heightFixed) / blocks[rootBlockId].heightVar;
    // console.log('height coefficient = ', coefficient);

    if (coefficient < 0) {
        let newSpec = degenerateSpec(spec);
        if (newSpec) {
            return calcSkeletonLayout(tree, expanded, newSpec);
        } else {
            console.warn('SCREWEED! YOU CANNOT FIT IN');
            return {hopeless: true, dimension: 'height', tid: tree.tid, name: tree.name};
        }
    }
    for (let bid in blocks) if (blocks.hasOwnProperty(bid) && bid !== rootBlockId && bid !== 'missing') {
        let b = blocks[bid];
        b.height = coefficient * b.heightVar + b.heightFixed;
    }

    let fillYPosition = (blockId, curY) => {
        let b = blocks[blockId];
        b.y = curY;
        if (b.children.length > 0) {
            let sumHeights = 0;
            for (let c of b.children) {
                sumHeights += blocks[c].height;
            }
            // If it is nested, center children to the nesting block
            let deltaY = blockId === rootBlockId? 0:
                Math.max((b.height - sumHeights - (b.children.length - 1) * verticalGap) / 2,
                    spec.skeletonLayout.firstNestedBlockVerticalGap);
            for (let c of b.children) {
                fillYPosition(c, curY + deltaY);
                deltaY += blocks[c].height + verticalGap;
            }
        }
    };
    fillYPosition(rootBlockId, 0);


    let traverseBranchesForWidth = (branchId, curX, nestingLevel) => {
        let b = branches[branchId];
        let bLen = b.collapsed? spec.skeletonLayout.collapsedBranchLength: branchLen;
        if (branchId.startsWith('v-')) {
            if (!traverseBranchesForWidth(b.top, curX, nestingLevel)) return false;
            if (!traverseBranchesForWidth(b.bottom, curX, nestingLevel)) return false;
            Object.assign(b, {
                x1: curX, x2: curX,
                y1: branches[b.top].y1,
                y2: branches[b.bottom].y1,
            });
        } else if (branchId.startsWith('h-')) {
            if (b.right in blocks) {
                // The right side of this branch connects to a block
                let yCoord = blocks[b.right].y + blocks[b.right].height / 2;
                Object.assign(b, {
                    x1: curX, x2: curX + bLen,
                    y1: yCoord,
                    y2: yCoord
                });
                blocks[b.right].x = curX + bLen;
                let leftOverSpace = width - curX - bLen;
                leftOverSpace -= 3 * nestingLevel;        // Give it a little gap on the right of a nested block
                blocks[b.right].width = Math.min(blocks[b.right].collapsed?
                    spec.skeletonLayout.collapsedBlockWidth: leftOverSpace,
                    leftOverSpace);

                if (blocks[b.right].width < 2) {
                    return false;
                }

                if (b.rightBranch) {        // Nested block
                    if (!traverseBranchesForWidth(b.rightBranch, curX + bLen, nestingLevel + 1)) return false;
                    // Align the nested branch to the branch it is connecting to
                    // branches[b.rightBranch].y1 = yCoord;
                    // branches[b.rightBranch].y2 = yCoord;
                }
            } else if (b.right.startsWith('v-')) {
                if (!traverseBranchesForWidth(b.right, curX + bLen, nestingLevel)) return false;
                Object.assign(b, {
                    x1: curX, x2: curX + bLen,
                    y1: (branches[b.right].y1 + branches[b.right].y2) / 2,
                    y2: (branches[b.right].y1 + branches[b.right].y2) / 2
                })
            } else {
                console.error('THIS SHOULD NEVER HAPPEN', branchId, b);
            }
        } else {
            console.error('WHAAAAAT?', branchId, b);
        }
        return true
    };

    if (branches.hasOwnProperty('h-' + rootBranch) && !traverseBranchesForWidth('h-' + rootBranch, 0, 0)) {
        let newSpec = degenerateSpec(spec, 'width');
        if (newSpec) {
            return calcSkeletonLayout(tree, expanded, newSpec);
        } else {
            console.warn('hopeless if fit it the horizontal space!');
            return {hopeless: true, dimension: 'width', tid: tree.tid, name: tree.name};
        }
    }

    // Fill a bid to the branches in order to have the "key" attribute for react component
    for (let bid in branches) if (branches.hasOwnProperty(bid)) {
        branches[bid].bid = bid;
    }

    // console.log(blocks);
    // console.log(branches);
    return {blocks, branches, tid: tree.tid, name: tree.name, rootBlockId, missing: createMappingFromArray(tree.missing),
        width: spec.width, height: spec.height};
};

let layoutAlgorithms = {
    'skeleton': calcSkeletonLayout,
    'remainder': calcRemainderLayout,
    'container': calcContainerLayout,
    'frond': calcFrondLayout
};

export default layoutAlgorithms;
