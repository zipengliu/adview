/**
 * Created by zipeng on 2017-07-07.
 */


import {scaleLinear} from 'd3-scale';
import {createMappingFromArray, subtractMapping, areSetsEqual} from './utils';

export class Tree {
    constructor(initialData) {
        Object.assign(this, initialData);
    }

    // Fill in the field 'parent', 'entities' and also the in-order of every branch
    // Re-scale the support if necessary
    prepareBranches(supportRange=null) {
        let {branches, rootBranch} = this;
        let supportScale = supportRange? scaleLinear().domain(supportRange).range([0, 1]): null;
        let order = 0;
        this.maxDepth = 0;
        let dfs = (bid, depth) => {
            let b = branches[bid];
            //  The range of the support in the raw dataset is [0, 100], we are going to scale it down to [0,1]
            if (supportRange) {
                b.support = supportScale(b.support);
            }
            b.depth = depth;
            this.maxDepth = Math.max(depth, this.maxDepth);
            if (b.left) {
                b.isLeaf = false;
                branches[b.left].parent = bid;
                branches[b.right].parent = bid;
                dfs(b.left, depth + 1);
                b.order = order;
                order += 1;
                dfs(b.right, depth + 1);
                b.entities = branches[b.left].entities.concat(branches[b.right].entities)
            } else {
                b.isLeaf = true;
                b.entities = [b.entity];
                b.order = order;
                order += 1;
            }
        };
        dfs(rootBranch, 0);
        branches[rootBranch].parent = rootBranch;

        this.maxDepthLog2 = Math.ceil(Math.log2(this.maxDepth));
        this.getAncestors();

        return this;
    }

    normalizeBranchLength() {
        let {branches} = this;
        let extend = [999999, 0];
        for (let bid in this.branches) if (branches.hasOwnProperty(bid)) {
            extend[0] = Math.min(extend[0], branches[bid].length);
            extend[1] = Math.max(extend[1], branches[bid].length);
        }
        // console.log('extend=',extend);
        let normScale = scaleLinear().domain(extend).range([0.05, 1]);
        for (let bid in branches) if (branches.hasOwnProperty(bid)) {
            branches[bid].normalizedLen = normScale(branches[bid].length);
            // DO NOT NORMALIZE!!!
            // branches[bid].normalizedLen = branches[bid].length;
            // If the brangh length is 0, clip it to 5% of the max length (min must be 0)
            // if (branches[bid].length < 1e-6) {
            //     branches[bid].normalizedLen = extend[1] * 0.05;
            // }
        }
        return this;
    }

    // Preprocess and get the ancestor data for the LCA online algorithm
    // The function goes wrong if tree is not fully resolved (bifurcated)
    getAncestors() {
        let {branches, rootBranch} = this;
        let ans = {};
        // Init: ans[bid][0] = bid's parent, -1 means overflow
        for (let bid in branches) if (branches.hasOwnProperty(bid)) {
            ans[bid] = bid !== rootBranch? [branches[bid].parent]: [-1];
        }
        for (let i = 1; i < this.maxDepthLog2; i++) {
            for (let bid in branches) if (branches.hasOwnProperty(bid)) {
                if (ans[bid].length > i - 1 && ans[bid][i - 1] !== -1 && ans[ans[bid][i - 1]].length > i - 1) {
                    ans[bid].push(ans[ans[bid][i - 1]][i - 1]);
                }
            }
        }
        this.ancestors = ans;

        return this;
    }

    ladderize() {
        let {branches, rootBranch} = this;
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
        return this;
    };

    // calculate the percentage of trees that support a branch (gene support frequency)
    // n is the number of gene trees (or the number of trees in the tree collection, excluding the reference tree)
    getGSF(cb, n) {
        let {branches} = this;
        for (let bid in branches) if (branches.hasOwnProperty(bid)) {
            let b = branches[bid];
            let cnt = 0;
            for (let tid in b[cb]) if (b[cb].hasOwnProperty(tid)) {
                cnt += b[cb][tid].jac === 1
            }
            b.gsf = cnt / n;
        }
        return this;
    }

    findMissing(allEntities) {
        let geneEntities = this.entities;
        this.missing = [];
        if (geneEntities.length === Object.keys(allEntities).length) {
            return this;
        }
        let m = createMappingFromArray(geneEntities);
        for (let eid in allEntities)
            if (allEntities.hasOwnProperty(eid) && !m.hasOwnProperty(eid)) {
                this.missing.push(eid);
            }
        return this;
    }

    // Find entities in tree.  Return a list of highest bids that can cover all the entities
    findEntities(entities) {
        let {branches, rootBranch, missing} = this;
        let entitiesMapping = createMappingFromArray(entities);
        let bids = [];
        let covered = {};
        // Traverse bottom-up
        let traverse = (bid) => {
            let b = branches[bid];
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
        traverse(rootBranch);
        // See if there is anything matched to the missing taxa
        if (missing && missing.length) {
            for (let i = 0; i < missing.length; i++) {
                if (entitiesMapping.hasOwnProperty(missing[i])) {
                    bids.push('m-' + missing[i]);
                }
            }
        }
        return bids;
    }

    getEntitiesByBid(bid) {
        if (bid ===  'missing_taxa') {
            return this.missing;
        } else if (bid.startsWith('m-')) {
            return [bid.substr(2)];
        } else {
            return this.branches[bid].entities;
        }
    }

    // Get the corresponding branch for rbid in referenceTree
    // Does not deal with duplicates
    getCB(referenceTree, rbid, withoutMissing=false, inGroupOnly=false) {
        let {missing, branches, rootBranch} = this;
        let treeMissingDict = createMappingFromArray(missing);
        let refMissingDict = createMappingFromArray(referenceTree.missing);
        let hasRefMissing = referenceTree.missing.length > 0;
        let comparingEntities = createMappingFromArray(referenceTree.branches[rbid].entities);
        let numComp = referenceTree.branches[rbid].entities.length;
        let comparingEntitiesWithoutMissing = subtractMapping(comparingEntities, treeMissingDict);
        let numCompWoMissing = Object.keys(comparingEntitiesWithoutMissing).length;

        // A mapping from branch in tree to its taxa dict
        let taxaDict = {}, taxaDictWithoutMissing = {};
        for (let bid in branches) if (branches.hasOwnProperty(bid)) {
            taxaDict[bid] = createMappingFromArray(branches[bid].entities);        // Potential improvement
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

            let b = branches[bid];
            if (b.isLeaf) {
                intersections[bid] = b.entity in comparingEntities? 1: 0;
            } else {
                traverse(b.left);
                traverse(b.right);
                intersections[bid] = intersections[b.left] + intersections[b.right];
            }

            let denominator = withoutMissing? numCompWoMissing + Object.keys(taxaDictWithoutMissing[bid]).length - intersections[bid]:
                numComp + branches[bid].entities.length - intersections[bid];
            let d = intersections[bid] / denominator;

            if (d > maxJaccard || (Math.abs(d - maxJaccard) < epsilon && intersections[bid] > maxIntersection)) {
                maxJaccard = d;
                corrNode = bid;
                maxIntersection = intersections[bid];
            }
        };
        traverse(rootBranch);

        // Check out-group
        if (!inGroupOnly && Math.abs(1.0 - maxJaccard) > epsilon) {
            let allEntities = createMappingFromArray(referenceTree.entities);
            for (let bid in branches) if (branches.hasOwnProperty(bid)) {
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

                let b = branches[bid];
                if (bid === rootBranch) {
                    intersectionOut[bid] = 0;
                } else {
                    let p = branches[b.parent];
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

            traverseOut(rootBranch);
        }

        return {bid: corrNode, jac: maxJaccard, in: isInGroup};
    }

    clone(cloneBranch=false) {
        let r = new Tree(this);
        if (cloneBranch) {
            r.branches = {...this.branches};
        }
        return r;
    }

    // Re-rooting to rid
    // Must be the reference tree to call this function
    // reroot(rid, trees) {
    //     let {branches, rootBranch} = this;
    //
    //     // Adjust the designated node to the left most position of the tree
    //     let bid = rid;
    //     while (bid !== rootBranch) {
    //         let b = branches[bid];
    //         let p = branches[b.parent];
    //         if (p.right === bid) {
    //             // Switch left and right child of p
    //             p.right = p.left;
    //             p.left = bid;
    //             // branches[p.parent] = {
    //             //     ...p,
    //             //     right: p.left,
    //             //     left: bid,
    //             // };
    //         }
    //         bid = b.parent;
    //     }
    //
    //     // Rotate the tree to make rid the new root
    //     let changedBranches = [];
    //     let traverseUp = bid => {
    //         if (bid === rootBranch) return;
    //         let b = branches[bid];
    //         let p = branches[b.parent];
    //
    //         b.left = b.right;
    //         b.right = b.parent !== rootBranch? b.parent: p.right;
    //         changedBranches.push(bid);
    //
    //         traverseUp(b.parent);
    //
    //         if (b.parent !== rootBranch) {
    //             p.parent = bid;
    //         } else {
    //             branches[p.right].parent = bid;
    //         }
    //     };
    //
    //     let old_parent = branches[rid].parent;
    //     traverseUp(old_parent);
    //
    //     branches[rid].parent = 'b0';
    //     branches[old_parent].parent = 'b0';
    //     branches['b0'].left = rid;
    //     branches['b0'].right = old_parent;
    //
    //     // Update data like entities
    //     this.prepareBranches().ladderize();
    //
    //     // Re-calculate CB for those changed branches
    //     for (let i = 0; i < changedBranches.length; i++) {
    //         let bid = changedBranches[i];
    //         this.getAllCB(bid, trees, false);
    //         console.log(bid, Object.keys(branches[bid].entities));
    //         console.log(branches[bid].cb);
    //     }
    //
    //     return this;
    // }

    // Can only be invoked on a reference tree
    getAllCB(rbid, trees, inGroupOnly=false) {
        let cb = {}, cb2 = {};
        for (let tid in trees) if (trees.hasOwnProperty(tid)) {
            cb[tid] = trees[tid].getCB(this, rbid, false, inGroupOnly);
            if (this.missing.length || trees[tid].missing.length) {
                cb2[tid] = trees[tid].getCB(this, rbid, true, false);
            } else {
                cb2[tid] = cb[tid];
            }
        }
        Object.assign(this.branches[rbid], {cb, cb2});

        return this;
    }

    // Get the LCA branch for an array of branches
    getLCAforMultiple(bids) {
        let {branches, ancestors} = this;
        let pointers = bids.slice();
        // Find the highest depth branch
        let highest = bids[0];
        for (let bid of bids) {
            if (branches[bid].depth < branches[highest].depth) highest = bid;
        }

        // Move pointers for all nodes up to the same depth as highest
        for (let i = this.maxDepthLog2 - 1; i >= 0; i--) {
            for (let j = 0; j < pointers.length; j++) {
                let p = pointers[j];
                if (ancestors[p].length > i && ancestors[p][i] !== -1 && branches[ancestors[p][i]].depth >= branches[highest].depth) {
                    pointers[j] = ancestors[p][i];
                }
            }
        }

        let isConverged = (step=null) => {
            if (step === null) {
                for (let j = 1; j < pointers.length; j++) {
                    if (pointers[j] !== pointers[0]) return false;
                }
                return true;
            } else {
                for (let j = 1; j < pointers.length; j++) {
                    let p = pointers[j];
                    if (ancestors[p].length <= step || ancestors[p][step] === -1) return false;
                    if (ancestors[p][step] !== ancestors[pointers[0]][step]) return false;
                }
                return true;
            }
        };
        // Check if they already converged
        if (isConverged()) {
            return pointers[0];
        }

        // Move all pointers up until they converge to a single node (branch)
        let i;
        for (i = ancestors[pointers[0]].length - 1; i >= 0; i--) {
            if (ancestors[pointers[0]][i] !== -1) {
                if (!isConverged(i)) {
                    for (let j = 0; j < pointers.length; j++) {
                        pointers[j] = ancestors[pointers[j]][i];
                    }
                }
            }
        }

        return ancestors[pointers[0]][0];
    }

    isAncestor(a, c) {
        let {branches, ancestors, maxDepthLog2} = this;
        let i = maxDepthLog2;
        while (c !== a && branches[c].depth > branches[a].depth && i >= 0) {
            if (ancestors[c].length > i && ancestors[c][i] !== -1 &&
                branches[a].depth <= branches[ancestors[c][i]].depth) {
                c = ancestors[c][i];
            }
            i -= 1;
            if (c === a) return true;
        }
        return false;
    }

    getHash(layout, param) {
        let {branches, rootBranch} = this;
        let {blocks, rootBlockId} = layout;

        // let childrenSortFunc = makeCompareFunc(blocks, 'no');
        // Use a trailing '+' or '-' to differentiate exact/ inexact match
        // let traverse = (bid) => {
        //     let b = blocks[bid];
        //     if (b.children && b.children.length > 0) {
        //         // If it has children, it must be a matched (expanded) block
        //         let sortedChildren = b.children.filter(c => !!blocks[c].no).sort(childrenSortFunc);
        //         let sisterIndicator = '';
        //         // sister-group relation check only works for 2 children case
        //         if (param.checkForSister && sortedChildren.length === 2) {
        //             let c1 = sortedChildren[0], c2 = sortedChildren[1];
        //             // Use a trailing '|' or '/' to differentiate whether two children are sisters
        //             sisterIndicator = tree.branches[c1].parent === tree.branches[c2].parent? '|': '/';
        //         }
        //         return '(' + sortedChildren.map(c => traverse(c)).join(',') + ')' + sisterIndicator + getBlockRep(b);
        //     } else if (b.no) {
        //         return getBlockRep(b);
        //     }
        // };
        // return traverse(rootBlockId);

        if (!blocks[rootBlockId].children.length) {
            return '()';
        }

        let getBlockRep = b => param.checkForExact? (b.no + (b.matched? '+': '-')): b.no;

        // TODO resolve left/right flip
        // Traverse the tree structure bottom-up and construct the hash string
        // traverse() returns a hash string and an array of sorting keys,
        //      which is used for determine the order of left/right children
        let traverse = (bid) => {
            // console.log('traversing ' + bid);
            let b = branches[bid];
            let left = {hash: ''}, right = {hash: ''};
            let leftString = '', rightString = '', r = '', sortingKeys = [];
            if (b.left && !(blocks.hasOwnProperty(bid) && !blocks[bid].children.length)) {
                left = traverse(b.left);
                right = traverse(b.right);
                sortingKeys = sortingKeys.concat(left.sortingKeys, right.sortingKeys);
            }
            if (blocks.hasOwnProperty(bid) && !!blocks[bid].no) {
                r = getBlockRep(blocks[bid]);
                sortingKeys.push(blocks[bid].no);
            }
            sortingKeys.sort();

            // Test if left or right is empty to decide whether use () or not
            if (!left.hash && !right.hash) {
                return {hash: r, sortingKeys};
            } else {
                let sisterIndicator = '';
                if (param.checkForSister) {
                    sisterIndicator = '/';
                    if (blocks.hasOwnProperty(b.left) && !!blocks[b.left].no &&
                        blocks.hasOwnProperty(b.right) && !!blocks[b.right].no) {
                        sisterIndicator = '|';
                    }
                }

                if (left.hash && right.hash) {
                    // Determine the order of left and right children if both have named clades
                    if (left.sortingKeys.join('') < right.sortingKeys.join('')) {
                        leftString = left.hash;
                        rightString = right.hash;
                    } else {
                        leftString = right.hash;
                        rightString = left.hash;
                    }
                    return {hash: `(${leftString},${rightString})${sisterIndicator}${r}`, sortingKeys};
                } else {
                    // Merge the two hashes without checking order because one of them is an empty string
                    if (!!r) {
                        return {hash: `(${left.hash + right.hash})${sisterIndicator}${r}`, sortingKeys};
                    } else {
                        return {hash: left.hash + right.hash, sortingKeys};
                    }
                }
            }
        };
        return `(${traverse(rootBranch).hash})`;
        // Alternative algorithm: Visit CB in depth order, find the nearest CB (which has lowest LCA)
    }
}



export let getVirtualBid = group => 'virtual-' + group;


let binSortFunc = (a, b) => (b.length - a.length);

export let clusterTreesByBranch = (trees, ref, cb, bid) => {
    console.log('Binning trees by ', bid, ' in reference tree under mode ', cb);
    let bins = [], treeToBin = {};
    let withoutMissing = cb === 'cb2';
    // FIXME: what if USTG!!!!!
    let correspondingBranches = ref.branches[bid][cb];

    // Push the exact matching trees first
    let exactMatchBin = Object.keys(trees).filter(tid => correspondingBranches.hasOwnProperty(tid) && correspondingBranches[tid].jac === 1.0);

    let missingMap = {};
    if (withoutMissing) {
        for (let tid in trees) if (trees.hasOwnProperty(tid)) {
            missingMap[tid] = createMappingFromArray(trees[tid].missing);
        }
    }
    let taxaSetByTree = {};
    // Extract the corresponding set of taxa
    for (let tid in trees) if (trees.hasOwnProperty(tid)) {
        if (correspondingBranches.hasOwnProperty(tid) && correspondingBranches[tid].jac < 1.0) {
            taxaSetByTree[tid] = {};
            let corr = correspondingBranches[tid];
            if (corr.bid) {
                taxaSetByTree[tid] = createMappingFromArray(trees[tid].branches[correspondingBranches[tid].bid].entities);
            }
        }
    }


    // Bin all other the trees
    for (let tid in trees) if (trees.hasOwnProperty(tid) && taxaSetByTree.hasOwnProperty(tid)) {
        let found = false;
        for (let j = 0; j < bins.length; j++) {
            let s = bins[j];
            let set1 = withoutMissing? subtractMapping(taxaSetByTree[s[0]], missingMap[tid]): taxaSetByTree[s[0]];
            let set2 = withoutMissing? subtractMapping(taxaSetByTree[tid], missingMap[s[0]]): taxaSetByTree[tid];
            if (areSetsEqual(set1, set2)) {
                found = true;
                s.push(tid);
                break;
            }
        }
        if (!found) {
            // create a new bin
            bins.push([tid]);
        }
    }

    // Sort the bins except the first one
    bins = exactMatchBin.length > 0? [exactMatchBin, ...bins.sort(binSortFunc)]:
        bins.sort(binSortFunc);
    let entities = [];
    for (let i = 0; i < bins.length; i++) {
        for (let j = 0; j < bins[i].length; j++) {
            treeToBin[bins[i][j]] = i;
        }
        let e = i === 0 && exactMatchBin.length > 0? ref.branches[bid].entities: Object.keys(taxaSetByTree[bins[i][0]]);
        entities.push(e);
    }

    return {bins, treeToBin, entities, n: Object.keys(trees).length, hasCompatibleTree: exactMatchBin.length > 0};
};

export let getHighlightProportion = (distribution, tids) => {
    let {bins, treeToBin} = distribution;
    let highlightCnt = (new Array(bins.length)).fill(0);
    for (let tid in tids) if (tids.hasOwnProperty(tid)) {
        if (treeToBin.hasOwnProperty(tid)) {
            if (Array.isArray(treeToBin[tid])) {
                for (let i = 0; i < treeToBin[tid].length; i++) {
                    highlightCnt[treeToBin[tid][i]] += 1;
                }
            } else {
                highlightCnt[treeToBin[tid]] += 1;
            }
        }
    }
    return highlightCnt;
};

export let updateDistriutionHighlightCnt = (distribution, cntField, highlightTrees) => {
    let newDistData = [];
    for (let i = 0; i < distribution.length; i++) {
        let d = distribution[i];
        newDistData.push({});
        for (let bid in d) if (d.hasOwnProperty(bid)) {
            newDistData[i][bid] = {
                ...d[bid],
                [cntField]: getHighlightProportion(d[bid], highlightTrees)
            }
        }
    }
    return newDistData;
};

export let getSubsetDistribution = (fullDistribution, sets, targetBid=null, setIndex=null) => {
    let filter = (fd, bid, set) => {
        // Init the bins for subset[i] and bipartition j
        let bins = [];
        for (let k = 0; k < fd.bins.length; k++) {
            bins.push([]);
        }

        // Bin the trees according to full distribution
        for (let k = 0; k < set.tids.length; k++) {
            let tid = set.tids[k];
            bins[fd.treeToBin[tid]].push(tid);
        }
        let hasCompatibleTree = bins[0].length > 0;

        // Filter and sort the bins
        let filteredBins = bins.filter(b => b.length > 0);
        if (hasCompatibleTree) {
            filteredBins = [filteredBins[0], ...filteredBins.slice(1).sort(binSortFunc)];
        } else {
            filteredBins = filteredBins.sort(binSortFunc);
        }

        // Fill in its treeToBin and entities
        let treeToBin = {};
        let entities = [];
        for (let k = 0; k < filteredBins.length; k++) {
            for (let x = 0; x < filteredBins[k].length; x++) {
                treeToBin[filteredBins[k][x]] = k;
            }
            entities.push(fd.entities[fd.treeToBin[filteredBins[k][0]]]);
        }

        return {
            bins: filteredBins,
            treeToBin,
            hasCompatibleTree,
            n: set.tids.length,
            entities
        };
    };

    let s;
    if (setIndex) {
        s = {};
        for (let bid in fullDistribution) if (fullDistribution.hasOwnProperty(bid)) {
            s[bid] = filter(fullDistribution[bid], bid, sets[setIndex]);
        }
    } else {
        s = [];
        for (let i = 1; i < sets.length; i++) {         // The first set is the full set, so skip it
            if (targetBid) {
                s.push(filter(fullDistribution, targetBid, sets[i]));
            } else {
                s.push({});
                for (let bid in fullDistribution) if (fullDistribution.hasOwnProperty(bid)) {
                    s[i - 1][bid] = filter(fullDistribution[bid], bid, sets[i]);
                }
            }
        }
    }
    return s;
};

