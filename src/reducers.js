/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import * as TYPE from './actionTypes';
import {scaleOrdinal, scaleLinear, schemeCategory10} from 'd3-scale';
import {getCoordinates, createMappingFromArray, guid, mergeArrayToMapping, mergeMappingToArray} from './utils';
import BipartitionList from './bipartitions';

let initialState = {
    isFetching: false,
    isFetchFailed: false,
    inputGroupData: null,
    bipartitions: {},
    datasets: [],
    toast: {
        msg: null,
    },
    cb: 'cb2',                      // 'cb' means match with missing taxa, 'cb2' w/o
    inspector: {
        show: false,
        pairwiseComparison: null,
        highlight: {
            direction: null,    // can be 'lr' or 'rl' meaning from left to right, or right to left
            monophyly: null,
            entities: null
        },
        tids: [],
    },
    dendrogramSpec: {
        // width: 500,
        defaultTopologyWidth: 300,
        height: 840,
        margin: {left: 5, right: 5, top: 10, bottom: 0},
        marginOnEntity: 8,
        boundingBoxSideMargin: 5,
        minLabelWidth: 40,
        labelUnitCharWidth: 4.5,          // an estimate of the width of a character in the label
        labelWidth: 150,                // default max width for the label
        responsiveAreaSize: 7,          // height of a transparent box over a branch to trigger interaction
        unitBranchLength: 10,            // When using a unit length for branch in regardless of the length of the branch in the original dataset
                                        //      used in pairwise comparison to save space
        minBranchLength: 3,              // the minimum length of a branch in pixel
        comparingTopologyWidth: 200,
        comparingLabelWidth: 100
    },
    referenceTree: {
        id: null,
        checkingBranch: null,           // the branch that is being displayed in details
        selected: [],                   // expanded branches
        isFetching: false,
        highlightEntities: [],          // highlighted by the blocks in the aggregated dendrograms
        highlightUncertainEntities: [],
        universalBranchLen: false,
    },
    highlight: {
        colorScheme: scaleOrdinal(schemeCategory10),
        limit: 5,
        currentColor: 0,
        bids: [],
        colors: (new Array(5)).fill(false),
    },
    pairwiseComparison: {
        tid: null,
    },
    sets: [],
    overview: {
        coordinates: [],
        metricMode: 'global',
        metricBranch: null,
        createWindow: false,
        currentTitle: '',
        dotplotSize: 0,
        isSelecting: false,
        selectingArea: null
    },
    selectedTrees: {},
    hoveredTrees: {},
    aggregatedDendrogram: {
        // activeTreeId: null,
        activeSetIndex: 0,
        mode: 'frond',            // topo-cluster, taxa-cluster, supercluster, remainder, fine-grained, frond
        spec: {
            size: 100,
            margin: {left: 6, top: 6, right: 6, bottom: 6},
            verticalGap: 5,
            branchLen: 6,
            leaveHeight: 4,
            leaveHighlightWidth: 16,
            proportionTopMargin: 4,
            proportionBarHeight: 10,
            frondLeafGap: 5,
            frondLeafAngle: Math.PI / 4,
            frondBaseLength: 14,
            nestMargin: 4,
        },
        // treeOrder: 'static',        // either 'static' or 'dynamic'
        //                             // static means sort by similarity to reference tree
        //                             // dynamic means sort by similarity to highlighting subtree in reference tree
        treeOrder: {
            static: true,      // if static is true, only order by tree id (preserving the order)
            // treeId: null,
            // branchId: null,     // when this is null, order by rf distance between trees;
            //                     // otherwise by similarity (jaccard index currently) between the corresponding branches
        },
        shadedHistogram: {
            granularity: 1,
            binsFunc: width => Math.floor(width / 1),
            // kernel: x => Math.pow(Math.E, -50*x*x)
            kernel: x => x < 0? Math.pow(Math.E, -0.1*x*x): Math.pow(Math.E, -50*x*x)
        }
    },
    attributeExplorer: {
        withSupport: true,
        branchAttributes: [             // for showing a tooltip of branch attributes of the current focal branch
            {attribute: 'support', accessor: b => b.hasOwnProperty('support')? Math.floor(b.support * 100): 'NA' },
            {attribute: '% exact match', accessor: b => b.hasOwnProperty('gsf')? Math.floor(b.gsf * 100) + '%': 'NA' }
        ],
        modes: {
            all: {
                scope: 'tree',           // could be 'all', 'set', 'tree'
                context: false,
            },
            corr: {
                scope: 'all',           // could be 'all', 'set'
                context: false,
            },
            ref: {

            }
        },
        shownAsHistogram: true,
        spec: {
            width: 154,
            chartHeight: 50,
            sliderHeight: 18,
            margin: {left: 25, right: 8, top: 20, bottom: 2}
        },
        attributeNames: ['support'],
        selection: [
            {isMoving: false, range: [0, 1], cb: false, attribute: 'support'},      // for the support in the all branches section
            {isMoving: false, range: [0, 1], cb: true, attribute: 'support'},       // for the support in the corresponding branches section
            {isMoving: false, range: [0, 1], cb: true, attribute: 'similarity'},   // for the similarity in the cb section
            {isMoving: false, range: [0, 1], cb: false, attribute: 'gsf'},
            ],
        activeSelectionId: null,
    },
    treeList: {
        collapsed: true
    },
    taxaList: {
        collapsed: true,
        selected: {}
    },
    treeDistribution: {
        showSubsets: false,
        tooltipMsg: null,
    },
    bipartitionDistribution: {
        tooltipMsg: null,
    },
    globalToolkit: {
        show: true,
        position: {left: 400, top: 10},
        isMoving: false
    }
};




let colorPallete = scaleOrdinal(schemeCategory10);
let getColor = idx => idx < 10? colorPallete(idx): 'black';


let findMissing = (geneTree, allEntities) => {
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
let findEntities = (entities, tree) => {
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

let getEntitiesByBid = (tree, bid) => {
    if (bid ===  'missing_taxa') {
        return tree.missing;
    } else if (bid.startsWith('m-')) {
        return [bid.substr(2)];
    } else {
        return tree.branches[bid].entities;
    }
};

let getTreeByTid = (state, tid) => {
    return tid === state.referenceTree.id? state.inputGroupData.referenceTree: state.inputGroupData.trees[tid];
}

// let ladderize = (branches, rootBranch) => {
//    let traverse = bid => {
//        let b = branches[bid];
//        if (!b.isLeaf) {
//            let left = branches[b.left];
//            let right = branches[b.right];
//            if (left.entities.length > right.entities.length) {
//                let tmp = b.left;
//                b.left = b.right;
//                b.right = tmp;
//            }
//            traverse(b.left);
//            traverse(b.right);
//        }
//    };
//    traverse(rootBranch);
//    return branches;
// };

// calculate the percentage of trees that support a branch (gene support frequency)
// n is the number of gene trees (or the number of trees in the tree collection, excluding the reference tree)
let getGSF = (branches, cb, n, createNewObject=false) => {
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

// Fill in the field 'parent', 'entities' and also the in-order of every branch
// Re-scale the support if necessary
let prepareBranches = (branches, rootBranch, supportRange=null) => {
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

// let getOrder = (branches, rootBranch) => {
//     let order = 0;
//     let dfs = (bid) => {
//         let b = branches[bid];
//         if (b.left) {
//             dfs(b.left);
//             b.order = order;
//             order += 1;
//             dfs(b.right);
//         } else {
//             b.order = order;
//             order += 1;
//         }
//     };
//     dfs(rootBranch);
//     return branches;
// };

let findHighlight = (bids, tid, bid) => {
    for (let i = 0; i < bids.length; i++) {
        let h = bids[i];
        if ((h.src === tid && h[tid][0] === bid) || (h.tgt === tid && h[tid].length === 1 && h[tid][0] === bid)) {
            return i;
        }
        if (h.tgt === tid) {
            if (h[tid].length === 1 && h[tid][0] === bid) {
                return i;
            }
            if (h[tid].indexOf(bid) !== -1) {
                return -2;
            }
        }
    }
    return -1;
};

// Determine is a is a subset of b.  a and b are both arrays.
let isSubset = (a, b) => {
    for (let i = 0; i < a.length; i++) {
        if (b.indexOf(a[i]) === -1) return false;
    }
    return true;
};

let getNextColor = (colors) => {
    for (let i = 0; i < colors.length; i++) {
        if (!colors[i]) return i;
    }
    return -1;
};

function visphyReducer(state = initialState, action) {
    let newBids, newColors;
    switch (action.type) {
        case TYPE.TOGGLE_HIGHLIGHT_MONOPHYLY:
            // Check if this branch is already highlighted
            let idx = findHighlight(state.highlight.bids, action.tid, action.bid);
            if (idx === -2) {
                // do not cancel or add, signal to the user
                return {
                    ...state,
                    toast: {
                        msg: 'This monophyly is already highlighted.  If you want to undo the highlight, ' +
                        'please click the monophyly that triggers this highlight (the one with silhouette)'
                    }
                }
            } else if (idx !== -1) {
                // cancel highlight
                return {
                    ...state,
                    highlight: {
                        ...state.highlight,
                        colors: state.highlight.colors.map((c, i) => i === state.highlight.bids[idx].color? false: c),
                        bids: state.highlight.bids.filter((_, i) => i !== idx),
                    }
                }
            } else {
                let otherTid = action.tid === state.referenceTree.id? state.pairwiseComparison.tid: state.referenceTree.id;
                let tgtEntities = getEntitiesByBid(getTreeByTid(state, action.tid), action.bid);
                let bids;

                if (otherTid) {
                    bids = findEntities(tgtEntities, getTreeByTid(state, otherTid));
                }
                if (action.addictive && state.highlight.bids.length) {
                    // Add to the current (last) highlight group
                    // let mergingGroup = state.highlight.bids[state.highlight.bids.length - 1];
                    //
                    // if (isSubset(bids, mergingGroup)) {
                    //     return {
                    //         ...state,
                    //         toast: {
                    //             msg: 'This monophyly is already highlighted.'
                    //         }
                    //     }
                    // }
                    //
                    // // Merge the bids into highlight group
                    // let mergedGroup = {
                    //     ...mergingGroup,
                    //     // TODO what if user select a bid of the tgt tree?
                    // }
                } else {
                    // create a new highlight group
                    let newHighlightGroup = {
                        src: action.tid, tgt: otherTid, [action.tid]: [action.bid], entities: tgtEntities,
                    };
                    if (otherTid) {
                        newHighlightGroup[otherTid] = bids;
                    }
                    let nextColor;
                    if (state.highlight.bids.length < state.highlight.limit) {
                        nextColor = getNextColor(state.highlight.colors);
                        newHighlightGroup.color = nextColor;
                        return {
                            ...state,
                            highlight: {
                                ...state.highlight,
                                bids: [...state.highlight.bids, newHighlightGroup],
                                colors: state.highlight.colors.map((c, i) => i === nextColor? true: c)
                            }
                        }
                    } else {
                        nextColor = state.highlight.bids[0].color;
                        newHighlightGroup.color = nextColor;
                        return {
                            ...state,
                            highlight: {
                                ...state.highlight,
                                // remove the last recent added group
                                bids: [...state.highlight.bids.slice(1), newHighlightGroup],
                            }
                        }
                    }
                }
            }
            return state;
        case TYPE.TOGGLE_CHECKING_BRANCH:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    checkingBranch: action.bid
                }
            };
        case TYPE.TOGGLE_UNIVERSAL_BRANCH_LENGTH:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    universalBranchLen: !state.referenceTree.universalBranchLen
                }
            };

        case TYPE.FETCH_TREE_REQUEST:
            return Object.assign({}, state, {
                toast: {
                    ...state.toast,
                    msg: 'Fetching tree from server...',
                },
                referenceTree: {
                    ...state.referenceTree,
                    selected: [],
                    isFetching: true,
                }
            });
        case TYPE.FETCH_TREE_SUCCESS:
            return state;
            // return Object.assign({}, state, {
            //     toast: {
            //         ...state.toast,
            //         msg: null
            //     },
            //     referenceTree: {
            //         ...state.referenceTree,
            //         id: action.tid,
            //         isFetching: false,
            //     },
            //     inputGroupData: {
            //         ...state.inputGroupData,
            //         trees: {
            //             ...state.inputGroupData.trees,
            //             [action.tid]: {
            //                 ...state.inputGroupData.trees[action.tid],
            //                 branches: getGSF(getOrder(ladderize(prepareBranches(action.data, state.inputGroupData.trees[action.tid].rootBranch),
            //                     state.inputGroupData.trees[action.tid].rootBranch), state.inputGroupData.trees[action.tid].rootBranch),
            //                     state.cb, Object.keys(state.inputGroupData.trees).length - 1)
            //             }
            //         }
            //     },
            //     overview: {
            //         ...state.overview,
            //         coordinates: getCoordinates(state.inputGroupData.trees, state.cb, true, state.referenceTree.id, null),
            //         metricMode: 'global',
            //         metricBranch: null,
            //     }
            // });

        case TYPE.FETCH_TREE_FAILURE:
            return Object.assign({}, state, {
                toast: {
                    ...state.toast,
                    msg: action.error.toString(),
                },
                referenceTree: {
                    ...state.referenceTree,
                    isFetching: false,
                }
            });

        case TYPE.SELECT_BRANCH:
            let newSelected = state.referenceTree.selected.indexOf(action.bid) !== -1?
                        state.referenceTree.selected.filter(bid => bid !== action.bid):
                        [action.bid, ...state.referenceTree.selected];
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    selected: newSelected
                },
                attributeExplorer: newSelected.length === 0 && state.attributeExplorer.activeSelectionId !== null &&
                state.attributeExplorer.selection[state.attributeExplorer.activeSelectionId].cb?
                    {   // if there is no selection and cb range selection is activated, deactivate it
                        ...state.attributeExplorer,
                        activeSelectionId: null
                    }: state.attributeExplorer,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    treeOrder: {
                        ...state.aggregatedDendrogram.treeOrder,
                        static: newSelected.length === 0? true: state.aggregatedDendrogram.treeOrder.static
                    }
                }
            });
        case TYPE.CLEAR_ALL_SELECTION_AND_HIGHLIGHT:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    selected: []
                },
                highlight: {
                    ...state.highlight,
                    bids: [],
                    colors: (new Array(state.highlight.limit)).fill(false)
                },
                attributeExplorer: {
                    ...state.attributeExplorer,
                    activeSelectionId: null
                },
                selectedTrees: {},
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    treeOrder: {
                        ...state.aggregatedDendrogram.treeOrder,
                        static: true
                    }
                }
            });
        case TYPE.TOGGLE_HIGHLIGHT_DUPLICATE:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    highlightEntities: action.e? [action.e]: []
                }
            };

        case TYPE.POP_CREATE_NEW_SET_WINDOW:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    createWindow: true,
                    currentTitle: `Set ${state.sets.length}`
                }
            });
        case TYPE.CLOSE_CREATE_NEW_SET_WINDOW:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    createWindow: false
                }
            });
        case TYPE.CREATE_NEW_SET:
            let newSetIndex = state.sets.length;
            return Object.assign({}, state, {
                sets: [...state.sets, {
                    sid: guid(),
                    title: state.overview.currentTitle,
                    tids: Object.keys(state.selectedTrees),
                    color: getColor(state.sets.length)
                }],
                overview: {
                    ...state.overview,
                    currentTitle: '',
                    createWindow: false
                },
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeSetIndex: newSetIndex
                }
            });
        case TYPE.TYPING_TITLE:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    currentTitle: action.value
                }

            });
        case TYPE.ADD_TO_SET:
            return Object.assign({}, state, {
                sets: state.sets.map((s, i) => i !== action.sid? s: {...s, tids: mergeMappingToArray(s.tids, state.selectedTrees).slice()}),
            });
        case TYPE.REMOVE_SET:
            return Object.assign({}, state, {
                sets: state.sets.filter((s, i) => i !== action.setIndex),
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeSetIndex: 0,
                    activeTreeId: null
                }
            });

        case TYPE.START_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    isSelecting: true,
                    dotplotSize: action.size,
                    selectionArea: {x1: action.x, y1: action.y, x2: action.x, y2: action.y}
                }
            });
        case TYPE.END_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    isSelecting: false,
                },
                selectedTrees: createMappingFromArray(action.tids)
            });
        case TYPE.CHANGE_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    selectionArea: {...state.overview.selectionArea, x2: action.x, y2: action.y }
                }
            });
        case TYPE.CHANGE_DISTANCE_METRIC_REQUEST:
            return {
                ...state,
                overview: {
                    ...state.overview,
                    metricMode: action.mode,
                    metricBranch: action.mode === 'local'? action.bid: state.overview.metricBranch,
                },
                toast: {
                    ...state.toast,
                    msg: 'Calculating overview...'
                }
            };
        case TYPE.CHANGE_DISTANCE_METRIC_SUCCESS:
            return {
                ...state,
                overview: {
                    ...state.overview,
                    coordinates: action.coordinates,
                },
                toast: {...state.toast, msg: null}
            };
        case TYPE.CHANGE_DISTANCE_METRIC_FAILURE:
            return {
                ...state,
                overview: {
                    ...state.overview,
                },
                toast: {
                    ...state.toast,
                    msg: action.error.toString()
                }
            };


        case TYPE.SELECT_SET:
            return Object.assign({}, state, {
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeSetIndex: action.setIndex
                }
            });
        case TYPE.REMOVE_FROM_SET:
            return Object.assign({}, state, {
                sets: state.sets.map((s, i) => i !== action.setIndex? s: {...s, tids: s.tids.filter(tid => action.tids.indexOf(tid) === -1)}),
            });
        case TYPE.TOGGLE_SORTING:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    treeOrder: {
                        ...state.aggregatedDendrogram.treeOrder,
                        static: !state.aggregatedDendrogram.treeOrder.static
                    }
                }
            };
        case TYPE.TOGGLE_AGGREGATION_MODE:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    mode: action.mode,
                }
            };
        case TYPE.TOGGLE_HIGHLIGHT_ENTITIES:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    highlightEntities: action.entities,
                    highlightUncertainEntities: action.uncertainEntities
                }
            };


        case TYPE.TOGGLE_INSPECTOR:
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    show: !state.inspector.show
                }
            };
        case TYPE.ADD_TREE_TO_INSPECTOR:
            // Find out whether the tree is already in the inspector
            let oldTrees = state.inspector.tids;
            let found = oldTrees.indexOf(action.tid);
            let newTrees;
            if (found !== -1) {
                // Bring that tree to the leftmost
                newTrees = [oldTrees[found], ...oldTrees.slice(0, found), ...oldTrees.slice(found+1)];
            } else {
                newTrees = [action.tid, ...oldTrees];
            }
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    show: true,
                    tids: newTrees,
                    pairwiseComparison: null
                }
            };
        case TYPE.REMOVE_TREE_FROM_INSPECTOR:
            let idxOfTree = state.inspector.tids.indexOf(action.tid);
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    pairwiseComparison: state.inspector.pairwiseComparison === idxOfTree || state.inspector.pairwiseComparison === idxOfTree + 1?
                        null: state.inspector.pairwiseComparison,
                    tids: state.inspector.tids.filter(t => t !== action.tid)
                }
            };
        case TYPE.TOGGLE_PAIRWISE_COMPARISON:
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    pairwiseComparison: action.p
                }
            };
        case TYPE.COMPARE_WITH_REFERENCE:
            if (action.tid) {
                // Entering pairwise comparison mode
                newBids = state.highlight.bids.map(h => (
                    {...h, tgt: action.tid,
                        [action.tid]: findEntities(getEntitiesByBid(getTreeByTid(state, h.src), h[h.src][0]),
                            getTreeByTid(state, action.tid))}
                ));
                newColors = state.highlight.colors;
            } else {
                // Exiting
                // Remove highlight groups who do not trigger that highlight
                newColors = state.highlight.colors.slice();
                newBids = state.highlight.bids.filter(h => {
                    if (h.src !== state.referenceTree.id) {
                        newColors[h.color] = false;     // If this group is to be removed, recycle the color
                        return false;
                    }
                    return true;
                });
            }
            return {
                ...state,
                pairwiseComparison: {
                    ...state.pairwiseComparison,
                    tid: action.tid,
                },
                highlight: {
                    ...state.highlight,
                    bids: newBids,
                    colors: newColors
                }
            };

        case TYPE.CHANGE_ATTRIBUTE_EXPLORER_MODE:
            return {
                ...state,
                attributeExplorer: {
                    ...state.attributeExplorer,
                    modes: {
                        ...state.attributeExplorer.modes,
                        [action.section]: {
                            scope: action.scope? action.scope: state.attributeExplorer.modes[action.section].scope,
                            context: action.isContext != null? action.isContext: state.attributeExplorer.modes[action.section].context
                        }
                    }
                }
            };
        case TYPE.TOGGLE_MOVE_HANDLE:
            return {
                ...state,
                attributeExplorer: {
                    ...state.attributeExplorer,
                    selection: state.attributeExplorer.selection.map((s, i) => i === state.attributeExplorer.activeSelectionId?
                        {...s, isMoving: action.handle? true: false, movingHandle: action.handle}: s)
                }
            };
        case TYPE.MOVE_CONTROL_HANDLE:
            let sel = state.attributeExplorer.selection[state.attributeExplorer.activeSelectionId];
            let newRange;
            if (sel.movingHandle === 'left') {
                newRange = [Math.min(action.value, sel.range[1]), sel.range[1]];
            } else {
                newRange = [sel.range[0], Math.max(action.value, sel.range[0])];
            }

            return {
                ...state,
                attributeExplorer: {
                    ...state.attributeExplorer,
                    selection: state.attributeExplorer.selection.map((s, i) => i === state.attributeExplorer.activeSelectionId? {...s, range: newRange}: s),
                }
            };
        case TYPE.TOGGLE_HISTOGRAM_OR_CDF:
            return {
                ...state,
                attributeExplorer: {
                    ...state.attributeExplorer,
                    shownAsHistogram: action.isHistogram
                }
            };
        case TYPE.CHANGE_ACTIVE_RANGE_SELECTION:
            return {
                ...state,
                attributeExplorer: {
                    ...state.attributeExplorer,
                    activeSelectionId: action.id,
                }
            };
        case TYPE.CHANGE_SELECTION_RANGE:
            return {
                ...state,
                attributeExplorer: {
                    ...state.attributeExplorer,
                    selection: state.attributeExplorer.selection.map((s, i) => i === action.sid? {...s, range: [action.l, action.r]}: s),
                    activeSelectionId: action.sid
                }
            };

        case TYPE.FETCH_INPUT_GROUP_REQUEST:
            return Object.assign({}, state, {
                isFetching: true,
                toast: {
                    ...state.toast,
                    msg: 'Fetching data from server...'
                }
            });
        case TYPE.FETCH_INPUT_GROUP_SUCCESS:
            let newCB = action.data.hasMissingTaxa? 'cb2': 'cb';
            for (let tid in action.data.trees) if (action.data.trees.hasOwnProperty(tid)) {
                // action.data.trees[tid].tid = tid;
                action.data.trees[tid].branches = prepareBranches(action.data.trees[tid].branches,
                    action.data.trees[tid].rootBranch, action.data.supportRange);
                action.data.trees[tid].missing = findMissing(action.data.trees[tid], action.data.entities);
            }
            action.data.referenceTree.branches =
                getGSF(prepareBranches(action.data.referenceTree.branches, action.data.referenceTree.rootBranch, action.data.supportRange),
                    newCB, Object.keys(action.data.trees).length);
            action.data.referenceTree.missing = findMissing(action.data.referenceTree, action.data.entities);

            return Object.assign({}, state, {
                isFetching: false,
                inputGroupData: action.data,
                bipartitions: new BipartitionList(action.data.referenceTree, action.data.trees, action.data.entities),
                toast: {
                    ...state.toast,
                    msg: null
                },
                referenceTree: {
                    ...state.referenceTree,
                    id: action.data.referenceTree.tid
                },
                sets: [{
                    sid: guid(),
                    title: 'All Trees',
                    tids: Object.keys(action.data.trees),
                    color: 'black'
                }],
                overview: {
                    ...state.overview,
                    coordinates: getCoordinates(action.data.referenceTree, action.data.trees, newCB, true, null)
                },
                attributeExplorer: {
                    ...state.attributeExplorer,
                    withSupport: !!action.data.supportRange,
                    branchAttributes: !!action.data.supportRange? state.attributeExplorer.branchAttributes:
                        [{attribute: 'support', accessor: b => 'NA'},
                            ...state.attributeExplorer.branchAttributes.slice(1)
                        ]
                },
                cb: newCB
            });
        case TYPE.FETCH_INPUT_GROUP_FAILURE:
            return Object.assign({}, state, {
                isFetchFailed: true,
                isFetching: false,
                toast: {
                    ...state.toast,
                    msg: 'Error fetching data from server: ' + action.error.toString()
                }
            });
        case TYPE.FETCH_DATASETS_REQUEST:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: 'Fetching dataset list from server...'
                }
            };
        case TYPE.FETCH_DATASETS_SUCCESS:
            return {
                ...state,
                datasets: action.data,
                toast: {
                    ...state.toast,
                    msg: null
                }
            };
        case TYPE.FETCH_DATASETS_FAILURE:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: 'Error fetching dataset list: ' + action.error.toString()
                }
            };
        case TYPE.TOGGLE_TREE_LIST_COLLAPSE:
            return {
                ...state,
                treeList: {
                    ...state.treeList,
                    collapsed: !state.treeList.collapsed
                }
            };
        case TYPE.TOGGLE_JACCARD_MISSING:
            // TODO if cb2 (cb when ignoring missing taxa) is not present, falls back to cb
            // This is a quick hack
            if (state.inputGroupData.inputGroupId === 1 && action.cb === 'cb2') {
                return state;
            }
            return {
                ...state,
                inputGroupData: {
                    ...state.inputGroupData,
                    trees: {
                        ...state.inputGroupData.trees,
                        [state.referenceTree.id]: {
                            ...state.inputGroupData.trees[state.referenceTree.id],
                            branches: getGSF(state.inputGroupData.trees[state.referenceTree.id].branches, action.cb, Object.keys(state.inputGroupData.trees).length - 1, true)
                        }
                    }
                },
                cb: action.cb,
                overview: {
                    ...state.overview,
                    coordinates: getCoordinates(state.inputGroupData.referenceTree, state.inputGroupData.trees, state.cb,
                        state.overview.metricMode === 'global' || state.overview.metricBranch == null, state.overview.metricBranch)
                }
            };
        case TYPE.CLOSE_TOAST:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: null
                }
            };
        case TYPE.TOGGLE_TAXA_LIST_COLLAPSE:
            return {
                ...state,
                taxaList: {
                    ...state.taxaList,
                    collapsed: !state.taxaList.collapsed
                }
            };
        case TYPE.TOGGLE_SELECT_TAXA:
            return {
                ...state,
                taxaList: {
                    ...state.taxaList,
                    selected: {...state.taxaList.selected, [action.e]: !state.taxaList.selected[action.e]}
                }
            };

        case TYPE.TOGGLE_SHOW_SUBSET_DISTRIBUTION:
            return {
                ...state,
                treeDistribution: {
                    ...state.treeDistribution,
                    showSubsets: !state.treeDistribution.showSubsets
                }
            };
        case TYPE.TOGGLE_HIGHLIGHT_TREES:
            return {
                ...state,
                hoveredTrees: action.tids && action.tids.length? createMappingFromArray(action.tids): {},
                treeDistribution: action.isMsgForBip? state.treeDistribution: {
                    ...state.treeDistribution,
                    tooltipMsg: action.msg
                },
                bipartitionDistribution: action.isMsgForBip? {
                    ...state.treeDistribution,
                    tooltipMsg: action.msg
                }: state.bipartitionDistribution
            };
        case TYPE.TOGGLE_SELECT_TREES:
            // If select a different tree for pairwise comparison
            if (action.tids.length === 1 && state.pairwiseComparison.tid && state.pairwiseComparison.tid !== action.tids[0]
                && (!action.isAdd || action.isAdd && !Object.keys(state.selectedTrees).length)) {
                // Update data for pairwise comparison and highlights
                newColors = state.highlight.colors.slice();
                let comparingTid = action.tids[0];
                newBids = state.highlight.bids.filter(h => {
                    if (h.src !== state.referenceTree.id) {
                        newColors[h.color] = false;     // If this group is to be removed, recycle the color
                        return false;
                    }
                    return true;
                }).map(h => (
                    {...h, tgt: action.tid,
                        [action.tid]: findEntities(getEntitiesByBid(getTreeByTid(state, h.src), h[h.src][0]),
                            getTreeByTid(state, action.tid))}
                ));
                return {
                    ...state,
                    selectedTrees: createMappingFromArray(action.tids),
                    pairwiseComparison: {
                        ...state.pairwiseComparison,
                        tid: comparingTid
                    },
                    highlight: {
                        ...state.highlight,
                        bids: newBids,
                        colors: newColors
                    }
                }
            }

            // If not for pairwise comparison
            return {
                ...state,
                selectedTrees: action.isAdd? {...mergeArrayToMapping(state.selectedTrees, action.tids)}: createMappingFromArray(action.tids)
            };

        case TYPE.TOGGLE_GLOBAL_TOOLKIT:
            return {
                ...state,
                globalToolkit: {
                    ...state.globalToolkit,
                    show: !state.globalToolkit.show
                }
            };
        case TYPE.MOVE_GLOBAL_TOOLKIT:
            let {positionBeforeDrag, mousePosition} = state.globalToolkit;
            return {
                ...state,
                globalToolkit: {
                    ...state.globalToolkit,
                    position: {left: positionBeforeDrag.left + (action.mousePosition.x - mousePosition.x),
                        top: positionBeforeDrag.top + (action.mousePosition.y - mousePosition.y)}
                }
            };
        case TYPE.MOVE_TOOLKIT_START:
            return {
                ...state,
                globalToolkit: {
                    ...state.globalToolkit,
                    isMoving: true,
                    mousePosition: action.mousePosition,
                    positionBeforeDrag: {...state.globalToolkit.position}
                }
            };
        case TYPE.MOVE_TOOLKIT_END:
            return {
                ...state,
                globalToolkit: {
                    ...state.globalToolkit,
                    isMoving: false,
                    mousePosition: null,
                    positionBeforeDrag: null
                }
            };

        case TYPE.CLEAR_SELECTED_TREES:
            return {
                ...state,
                selectedTrees: {}
            };

        default:
            return state;

    }
}


export default visphyReducer;