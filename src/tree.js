/**
 * Created by zipeng on 2017-07-07.
 */


import {scaleLinear} from 'd3-scale';
import {createMappingFromArray, subtractMapping} from './utils';

// Basic operations for a tree

// Fill in the field 'parent', 'entities' and also the in-order of every branch
// Re-scale the support if necessary
export let prepareBranches = (branches, rootBranch, supportRange=null) => {
    let supportScale = supportRange? scaleLinear().domain(supportRange).range([0, 1]): null;
    let order = 0;
    let dfs = (bid) => {
        let b = branches[bid];
        //  The range of the support in the raw dataset is [0, 100], we are going to scale it down to [0,1]
        if (supportRange) {
            b.support = supportScale(b.support);
        }
        if (b.left) {
            b.isLeaf = false;
            branches[b.left].parent = bid;
            branches[b.right].parent = bid;
            dfs(b.left);
            b.order = order;
            order += 1;
            dfs(b.right);
            b.entities = branches[b.left].entities.concat(branches[b.right].entities)
        } else {
            b.isLeaf = true;
            b.entities = [b.entity];
            b.order = order;
            order += 1;
        }
    };
    dfs(rootBranch);
    branches[rootBranch].parent = rootBranch;

    return branches;
};

export let ladderize = (branches, rootBranch) => {
    let traverse = bid => {
        let b = branches[bid];
        if (!b.isLeaf) {
            let left = branches[b.left];
            let right = branches[b.right];
            if (left.entities.length > right.entities.length) {
                let tmp = b.left;
                b.left = b.right;
                b.right = tmp;
            }
            traverse(b.left);
            traverse(b.right);
        }
    };
    traverse(rootBranch);
    return branches;
};

// calculate the percentage of trees that support a branch (gene support frequency)
// n is the number of gene trees (or the number of trees in the tree collection, excluding the reference tree)
export let getGSF = (branches, cb, n, createNewObject=false) => {
    let res = branches;
    if (createNewObject) {
        res = {};
    }
    for (let bid in branches) if (branches.hasOwnProperty(bid)) {
        let b = branches[bid];
        let cnt = 0;
        for (let tid in b[cb]) if (b[cb].hasOwnProperty(tid)) {
            cnt += b[cb][tid].jac === 1
        }
        if (createNewObject) {
            res[bid] = {...b, gsf: cnt / n};
        } else {
            b.gsf = cnt / n;
        }
    }
    return res;
};

export let findMissing = (geneTree, allEntities) => {
    let geneEntities = geneTree.entities;
    if (geneEntities.length === Object.keys(allEntities).length) return [];
    let m = createMappingFromArray(geneEntities);
    let missing = [];
    for (let eid in allEntities)
        if (allEntities.hasOwnProperty(eid) && !m.hasOwnProperty(eid)) {
            missing.push(eid);
        }
    return missing;
};

// Find entities in tree.  Return a list of highest bids that can cover all the entities
export let findEntities = (entities, tree) => {
    let entitiesMapping = createMappingFromArray(entities);
    let bids = [];
    let covered = {};
    // Traverse bottom-up
    let traverse = (bid) => {
        let b = tree.branches[bid];
        if (b.left) {
            traverse(b.left);
            traverse(b.right);
            if (covered[b.left] && covered[b.right]) {
                covered[bid] = true
            } else if (covered[b.left]) {
                bids.push(b.left);
            } else if (covered[b.right]) {
                bids.push(b.right);
            }
        } else {
            if (entitiesMapping.hasOwnProperty(b.entity)) {
                covered[bid] = true;
            }
        }
    };
    traverse(tree.rootBranch);
    // See if there is anything matched to the missing taxa
    let {missing} = tree;
    if (missing && missing.length) {
        for (let i = 0; i < missing.length; i++) {
            if (entitiesMapping.hasOwnProperty(missing[i])) {
                bids.push('m-' + missing[i]);
            }
        }
    }
    return bids;
};

export let getEntitiesByBid = (tree, bid) => {
    if (bid ===  'missing_taxa') {
        return tree.missing;
    } else if (bid.startsWith('m-')) {
        return [bid.substr(2)];
    } else {
        return tree.branches[bid].entities;
    }
};

// Does not deal with duplicates
export function getCB(referenceTree, rbid, tree, withoutMissing=false, inGroupOnly=false) {
    let treeMissingDict = createMappingFromArray(tree.missing);
    let refMissingDict = createMappingFromArray(referenceTree.missing);
    let hasRefMissing = referenceTree.missing.length > 0;
    let comparingEntities = createMappingFromArray(referenceTree.branches[rbid].entities);
    let numComp = referenceTree.branches[rbid].entities.length;
    let comparingEntitiesWithoutMissing = subtractMapping(comparingEntities, treeMissingDict);
    let numCompWoMissing = Object.keys(comparingEntitiesWithoutMissing).length;

    // A mapping from branch in tree to its taxa dict
    let taxaDict = {}, taxaDictWithoutMissing = {};
    for (let bid in tree.branches) if (tree.branches.hasOwnProperty(bid)) {
        taxaDict[bid] = createMappingFromArray(tree.branches[bid].entities);        // Potential improvement
        if (hasRefMissing) {
            taxaDictWithoutMissing[bid] = subtractMapping(taxaDict[bid], refMissingDict);
        }
    }
    if (!hasRefMissing) {
        taxaDictWithoutMissing = taxaDict;
    }

    // Check in-group
    let intersections = {};
    let maxJaccard = 0;
    let maxIntersection = 0;
    let epsilon = .0001;
    let corrNode = null;
    let isInGroup = true;

    // Traverse tree in post-order (bottom-up)
    let traverse = (bid) => {
        if (Math.abs(1.0 - maxJaccard) < epsilon) return;

        let b = tree.branches[bid];
        if (b.isLeaf) {
            intersections[bid] = b.entity in comparingEntities? 1: 0;
        } else {
            traverse(b.left);
            traverse(b.right);
            intersections[bid] = intersections[b.left] + intersections[b.right];
        }

        let denominator = withoutMissing? numCompWoMissing + Object.keys(taxaDictWithoutMissing[bid]).length - intersections[bid]:
            numComp + tree.branches[bid].entities.length - intersections[bid];
        let d = intersections[bid] / denominator;

        if (d > maxJaccard || (Math.abs(d - maxJaccard) < epsilon && intersections[bid] > maxIntersection)) {
            maxJaccard = d;
            corrNode = bid;
            maxIntersection = intersections[bid];
        }
    };
    traverse(tree.rootBranch);

    // Check out-group
    if (!inGroupOnly && Math.abs(1.0 - maxJaccard) > epsilon) {
        let allEntities = createMappingFromArray(referenceTree.entities);
        for (let bid in tree.branches) if (tree.branches.hasOwnProperty(bid)) {
            taxaDict[bid] = subtractMapping(allEntities, taxaDict[bid]);
            if (hasRefMissing) {
                taxaDictWithoutMissing[bid] = subtractMapping(taxaDict[bid], refMissingDict);
            }
        }
        if (!hasRefMissing) {
            taxaDictWithoutMissing = taxaDict;
        }

        let intersectionOut = {};
        let traverseOut = bid => {
            if (Math.abs(1.0 - maxJaccard) < epsilon) return;

            let b = tree.branches[bid];
            if (bid === tree.rootBranch) {
                intersectionOut[bid] = 0;
            } else {
                let p = tree.branches[b.parent];
                let sister = p.left === bid? p.right: p.left;
                intersectionOut[bid] = intersectionOut[b.parent] + intersections[sister];
            }
            let denominator = withoutMissing? numCompWoMissing + Object.keys(taxaDictWithoutMissing[bid]).length - intersectionOut[bid]:
                numComp + Object.keys(taxaDict[bid]).length - intersectionOut[bid];
            let d = intersectionOut[bid] / denominator;
            if (d > maxJaccard || (Math.abs(d - maxJaccard) < epsilon && intersectionOut[bid] > maxIntersection)) {
                maxJaccard = d;
                corrNode = bid;
                maxIntersection = intersectionOut[bid];
                isInGroup = false;
            }

            if (!b.isLeaf) {
                traverseOut(b.left);
                traverseOut(b.right);
            }
        };

        traverseOut(tree.rootBranch);
    }

    return {bid: corrNode, jac: maxJaccard, in: isInGroup};
}

export function reroot(referenceTree, rid, trees) {
    let newReferenceTree = {
        ...referenceTree,
        branches: {...referenceTree.branches}
    };
    let {branches} = newReferenceTree;

    // Adjust the designated node to the left most position of the tree
    let bid = rid;
    while (bid !== referenceTree.rootBranch) {
        let b = branches[bid];
        let p = branches[b.parent];
        if (p.right === bid) {
            // Switch left and right child of p
            p.right = p.left;
            p.left = bid;
            // branches[p.parent] = {
            //     ...p,
            //     right: p.left,
            //     left: bid,
            // };
        }
        bid = b.parent;
    }

    // Rotate the tree to make rid the new root
    let changedBranches = [];
    let traverseUp = bid => {
        if (bid === referenceTree.rootBranch) return;
        let b = branches[bid];
        let p = branches[b.parent];

        b.left = b.right;
        b.right = b.parent !== referenceTree.rootBranch? b.parent: p.right;
        changedBranches.push(bid);
        // branches[bid] = {
        //     ...b,
        //     left: b.right,
        //     right: b.parent !== referenceTree.rootBranch? b.parent: p.right
        // };

        traverseUp(b.parent);

        if (b.parent !== referenceTree.rootBranch) {
            p.parent = bid;
        } else {
            branches[p.right].parent = bid;
        }
    };

    let old_parent = branches[rid].parent;
    traverseUp(old_parent);

    branches[rid].parent = 'b0';
    branches[old_parent].parent = 'b0';
    branches['b0'].left = rid;
    branches['b0'].right = old_parent;

    // Update data like entities
    branches = ladderize(prepareBranches(branches, 'b0'), 'b0');

    // Re-calculate CB for those changed branches
    for (let i = 0; i < changedBranches.length; i++) {
        let bid = changedBranches[i];
        branches[bid].cb = {};
        branches[bid].cb2 = {};
        for (let tid in trees) if (trees.hasOwnProperty(tid)) {
            branches[bid].cb[tid] = getCB(newReferenceTree, bid, trees[tid], false, false);
            if (referenceTree.missing.length || trees[tid].missing.length) {
                branches[bid].cb2[tid] = getCB(newReferenceTree, bid, trees[tid], true, false);
            } else {
                branches[bid].cb2[tid] = branches[bid].cb[tid];
            }
        }
        console.log(bid, Object.keys(branches[bid].entities));
        console.log(branches[bid].cb);
    }

    return newReferenceTree;
}
