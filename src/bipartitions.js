/**
 * Created by zipeng on 2017-05-09.
 */

import BitSet from 'bitset.js';
import {createMappingFromArray, subtractMapping} from './utils';

const hashTableSizes = [64, 128, 256, 512, 1024, 2048, 4096, 8192, 16384,
    32768, 65536, 131072, 262144, 524288, 1048576, 2097152,
    4194304, 8388608, 16777216, 33554432, 67108864, 134217728,
    268435456, 536870912, 1073741824, 2147483648
];
const numConflictsThreshold = 20;


// Hash the bit vector.  v is a BitSet object, size is the size of the hash table.
function getBitVectorHash(v, size) {
    let s = v.toString(16);
    // FIXME
    return s;

    let i = 0;
    let h = 0;
    while (i + 8 < s.length) {
        let val = parseInt(s.slice(i, i + 7), 16);
        h = (h + val) % size;
        i += 8;
    }
    if (i < s.length) {
        let val = parseInt(s.slice(i), 16);
        h = (h + val) % size;
    }
    return h;
}

function getBitVector(entityArr) {
    let idx = entityArr.map(eid => parseInt(eid.slice(1))).sort();
    return BitSet(idx);
}

// Get the bit vector for an entity array in canonical form.
//  Canonical form: the bit corresponding to the present taxa with the lowest index must be zero.
//  This is for avoiding different bit vectors for the same bipartition because of bit is set for ingroup vs. outgroup.
function getCanonicalBitVector(inGroupEntities, present) {
    let inGroupIdx = inGroupEntities.map(eid => parseInt(eid.slice(1))).sort();
    let ingroupMapping = createMappingFromArray(inGroupIdx);

    // FIXME: this is wrong when there are duplicates!
    let getOutgroupIdx = () => {
        let o = [];
        for (let i = 0; i < present.length; i++) {
            if (!ingroupMapping.hasOwnProperty(present[i])) o.push(present[i]);
        }
        return o;
    };

    let bitSetArr = ingroupMapping.hasOwnProperty(present[0])? getOutgroupIdx(): inGroupIdx;
    return BitSet(bitSetArr);
}

function getHashTableSize(n, t, loadRatio=2) {
    let numBranches = n * (t - 3);
    for (let i = 0; i < hashTableSizes.length; i++) {
        if (numBranches * loadRatio <= hashTableSizes[i]) {
            return hashTableSizes[i];
        }
    }
    // Too many branches
    return -1;
}

function getPresentEntities(all, missing) {
    let r = [];
    let m = createMappingFromArray(missing);
    for (let eid in all) if (all.hasOwnProperty(eid) && !m.hasOwnProperty(eid)) {
        r.push(parseInt(eid.slice(1)))
    }
    return r.sort();
}

class BipartitionList {
    constructor(trees, allEntities, referenceTreeId) {
        let numTrees = Object.keys(trees).length;
        let numTaxa = Object.keys(allEntities).length;

        this.numEntries = 0;
        this.hash = {};
        this.size = getHashTableSize(numTrees, numTaxa, 2);
        // A mapping from bid in reference tree to hash table entry
        this.referenceBranches = {};
        // entries sorted by frequency
        this.entriesArray = [];

        for (let tid in trees) if (trees.hasOwnProperty(tid)) {
            let tIdx = parseInt(tid.slice(1));
            let branches = trees[tid].branches;
            let vMissing = getBitVector(trees[tid].missing);
            let entitiesInTree = getPresentEntities(allEntities, trees[tid].missing);

            for (let bid in branches) if (branches.hasOwnProperty(bid)) {
                let b = branches[bid];
                // Filter the trivial branches
                if (!b.isLeaf && bid !== trees[tid].rootBranch && bid !== branches[trees[tid].rootBranch].right) {
                    let v = getCanonicalBitVector(b.entities, entitiesInTree);
                    let h = getBitVectorHash(v, this.size);
                    let found = false;

                    if (this.hash.hasOwnProperty(h)) {
                        let bucket = this.hash[h];
                        for (let i = 0; i < bucket.length; i++) {
                            if (v.equals(bucket[i].bitVector) && vMissing.equals(bucket[i].missingMask)) {
                                found = true;
                                bucket[i].n += 1;
                                bucket[i].treeVector.set(tIdx);
                                if (tid === referenceTreeId) {
                                    this.referenceBranches[bid] = bucket[i];
                                }
                                break;
                            }
                        }
                    } else {
                        this.hash[h] = [];
                    }
                    if (!found) {
                        this.numEntries += 1;
                        let newEntry = {
                            entities: b.entities,
                            bitVector: v,
                            missingMask: vMissing,
                            treeVector: BitSet([tIdx]),
                            n: 1,
                        };
                        this.hash[h].push(newEntry);
                        this.entriesArray.push(newEntry);
                        if (tid === referenceTreeId) {
                            this.referenceBranches[bid] = newEntry;
                        }
                    }
                }
            }
        }

        this.entriesArray.sort((a, b) => (b.n - a.n));
        console.log('Number of entries in hash table: ', this.numEntries);
        console.log('load of hash table: ', Object.keys(this.hash).length);
    }

    static isCompatible(a, b) {
        let l = Math.max(a.bitVector.msb(), a.bitVector.msb());
        let i;

        // FIXME: checking each bit in an iteration is slow! check an 32 bit int is good
        for (i = 0; i < l; i++) {
            if (a.bitVector.get(i) && !b.bitVector.get(i) && !a.missingMask.get(i) && !b.missingMask.get(i)) {
                break;
            }
        }
        if (i === l) return true;

        for (i = 0; i < l; i++) {
            if (a.bitVector.get(i) && b.bitVector.get(i) && !a.missingMask.get(i) && !b.missingMask.get(i)) {
                break;
            }
        }
        if (i === l) return true;

        for (i = 0; i < l; i++) {
            if (!a.bitVector.get(i) && b.bitVector.get(i) && !a.missingMask.get(i) && !b.missingMask.get(i)) {
                break;
            }
        }
        if (i === l) return true;

        for (i = 0; i < l; i++) {
            if (!a.bitVector.get(i) && !b.bitVector.get(i) && !a.missingMask.get(i) && !b.missingMask.get(i)) {
                break;
            }
        }
        if (i === l) return true;

        return false;
    }

    static getTidsFromTreeVector(v) {

    }

    // Return the distribution of the bipartitions by branch bid in tree
    getBipartitionDistribution(bid) {
        let entries = [this.referenceBranches[bid]];
        let d = {
            bins: [],
            treeToBin: {},
            hasCompatibleTree: true
        };

        for (let i = 0; i < this.entriesArray.length, d.bins.length < numConflictsThreshold; i++) {
            let e = this.entriesArray[i];

            let j;
            for (j = 0; j < entries.length; j++) {
                if (BipartitionList.isCompatible(e, entries[j])) break;
            }

            if (j === entries.length) {
                entries.push(e);
            }
        }

        d.bins = entries.map(e => BipartitionList.getTidsFromTreeVector(e));
        for (let i = 0; i < d.bins.length; i++) {
            for (let j = 0; j < d.bins[i].length; j++) {
                d.treeToBin[d.bins[i][j]] = i;
            }
        }

        return d;
    }
}


export default BipartitionList;
