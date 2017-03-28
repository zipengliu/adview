/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import * as TYPE from './actionTypes';
import {scaleOrdinal, schemeCategory10} from 'd3-scale';
import {getCoordinates, createMappingFromArray} from './utils';

let initialState = {
    isFetching: false,
    isFetchFailed: false,
    inputGroupData: null,
    datasets: [],
    toast: {
        msg: null,
    },
    cb: 'cb',
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
        labelUnitCharWidth: 4.5,          // an estimate of the width of a character in the label
        labelWidth: 150,                // default max width for the label
        responsiveAreaSize: 7,          // height of a transparent box over a branch to trigger interaction
        unitBranchLength: 10,            // When using a unit length for branch in regardless of the length of the branch in the original dataset
                                        //      used in pairwise comparison to save space
    },
    referenceTree: {
        id: null,
        checkingBranch: null,           // the branch that is being displayed in details
        highlightMonophyly: null,       // entities in these monophylies would be highlighted in the aggregated dendrograms,
        selected: [],                   // expanded branches
        isFetching: false,
        persist: false,
        highlightEntities: [],          // highlighted by the blocks in the aggregated dendrograms
        highlightUncertainEntities: [],
    },
    pairwiseComparison: {
        tid: null,
        highlight: {
            limit: 5,
            pointer: 0,
            colors: scaleOrdinal(schemeCategory10),
            bids: [],
        }
    },
    sets: [],
    overview: {
        coordinates: [],
        metricMode: 'global',
        pickingBranch: false,
        metricBranch: null,
        createWindow: false,
        currentTitle: '',
        selectedDots: [],
        highlightDots: [],
        dotplotSize: 0,
        isSelecting: false,
        selectingArea: null
    },
    aggregatedDendrogram: {
        activeTreeId: null,
        activeSetIndex: 0,
        mode: 'frond',            // topo-cluster, taxa-cluster, supercluster, remainder, fine-grained, frond
        spec: {
            size: 100,
            margin: {left: 2, top: 2, right: 2, bottom: 2},
            verticalGap: 5,
            branchLen: 6,
            leaveHeight: 4,
            leaveHighlightWidth: 16,
            proportionTopMargin: 4,
            proportionBarHeight: 10,
            frondLeafGap: 5,
            frondBaseLength: 12,
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
        modes: {
            all: {
                scope: 'all',           // could be 'all', 'set', 'tree'
                context: false,
            },
            corr: {
                scope: 'all',           // could be 'all', 'set'
                context: false,
            }
        },
        shownAsHistogram: true,
        spec: {
            width: 180,
            chartHeight: 50,
            sliderHeight: 34,
            margin: {left: 25, right: 8, top: 14, bottom: 2}
        },
        attributeNames: ['support'],
        selection: [{isMoving: false, range: [0.2, 0.6]}, {isMoving: false, range: [0.2, 0.6]}, {isMoving: false, range: [0.2, 0.6]}],
        activeSelectionId: null,
    },
    treeList: {
        collapsed: true
    }
};




let colorPallete = scaleOrdinal(schemeCategory10);
let getColor = idx => idx < 10? colorPallete(idx): 'black';

let mergeSets = (a, b) => {
    let c = a.slice();
    for (let i = 0; i < b.length; i++) {
        if (a.indexOf(b[i]) === -1) {c.push(b[i])}
    }
    return c;
};

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

let ladderize = (branches, rootBranch) => {
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

// Fill in the field 'parent' and 'entities' on every branch
let prepareBranches = (branches, rootBranch) => {
    let dfs = (bid) => {
        let b = branches[bid];
        //  The range of the support in the raw dataset is [0, 100], we are going to scale it down to [0,1]
        b.support /= 100;
        if (b.left) {
            b.isLeaf = false;
            branches[b.left].parent = bid;
            branches[b.right].parent = bid;
            dfs(b.left);
            dfs(b.right);
            b.entities = branches[b.left].entities.concat(branches[b.right].entities)
        } else {
            b.isLeaf = true;
            b.entities = [b.entity];
        }
    };
    dfs(rootBranch);
    branches[rootBranch].parent = rootBranch;

    return branches;
};

let getOrder = (branches, rootBranch) => {
    let order = 0;
    let dfs = (bid) => {
        let b = branches[bid];
        if (b.left) {
            dfs(b.left);
            b.order = order;
            order += 1;
            dfs(b.right);
        } else {
            b.order = order;
            order += 1;
        }
    };
    dfs(rootBranch);
    return branches;
};

function visphyReducer(state = initialState, action) {
    switch (action.type) {
        case TYPE.TOGGLE_HIGHLIGHT_MONOPHYLY:
            let newHighlight = action.bid;
            if (action.multiple) {
                if (!state.referenceTree.highlightMonophyly) {
                    newHighlight = {[action.bid]: true};
                } else {
                    newHighlight = {...state.referenceTree.highlightMonophyly};
                    if (newHighlight.hasOwnProperty(action.bid)) {
                        delete newHighlight[action.bid];
                    } else {
                        newHighlight[action.bid] = true;
                    }
                }
            }
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    checkingBranch: action.bid,
                    highlightMonophyly: newHighlight
                },
            });
        case TYPE.TOGGLE_CHECKING_BRANCH:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    checkingBranch: action.bid
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
                    highlightMonophyly: null,
                    selected: [],
                    isFetching: true,
                }
            });
        case TYPE.FETCH_TREE_SUCCESS:
            return Object.assign({}, state, {
                toast: {
                    ...state.toast,
                    msg: null
                },
                referenceTree: {
                    ...state.referenceTree,
                    id: action.tid,
                    isFetching: false,
                },
                inputGroupData: {
                    ...state.inputGroupData,
                    trees: {
                        ...state.inputGroupData.trees,
                        [action.tid]: {
                            ...state.inputGroupData.trees[action.tid],
                            branches: getOrder(ladderize(prepareBranches(action.data, state.inputGroupData.trees[action.tid].rootBranch),
                                state.inputGroupData.trees[action.tid].rootBranch), state.inputGroupData.trees[action.tid].rootBranch)
                        }
                    }
                },
                overview: {
                    ...state.overview,
                    coordinates: getCoordinates(state.inputGroupData.trees, true, null, null),
                    metricMode: 'global',
                    metricBranch: null,
                    pickingBranch: false
                }
            });

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
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    selected: state.referenceTree.selected.indexOf(action.bid) !== -1?
                        state.referenceTree.selected.filter(bid => bid !== action.bid):
                        [action.bid, ...state.referenceTree.selected]
                }
            });
        case TYPE.CLEAR_BRANCH_SELECTION:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    selected: []
                }
            });
        case TYPE.TOGGLE_PERSIST_HIGHLIGHT:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    highlightMonophyly: state.referenceTree.persist? null: state.referenceTree.highlightMonophyly,
                    persist: !state.referenceTree.persist
                }
            };
        case TYPE.TOGGLE_USER_SPECIFIED:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    isUserSpecified: !state.referenceTree.isUserSpecified,
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
            return Object.assign({}, state, {
                sets: [...state.sets, {
                    title: state.overview.currentTitle,
                    tids: state.overview.selectedDots,
                    color: getColor(state.sets.length)
                }],
                overview: {
                    ...state.overview,
                    currentTitle: '',
                    selectedDots: [],
                    createWindow: false
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
                sets: state.sets.map((s, i) => i !== action.sid? s: {...s, tids: mergeSets(s.tids, state.overview.selectedDots)}),
                overview: {
                    ...state.overview,
                    selectedDots: []
                }
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
                    selectedDots: action.tids
                }
            });
        case TYPE.CHANGE_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    selectionArea: {...state.overview.selectionArea, x2: action.x, y2: action.y }
                }
            });
        case TYPE.TOGGLE_PICKING_METRIC_BRANCH:
            return {
                ...state,
                overview: {
                    ...state.overview,
                    pickingBranch: !state.overview.pickingBranch,
                },
            };
        // case TYPE.CHANGE_DISTANCE_METRIC:
        //     return {
        //         ...state,
        //         overview: {
        //             ...state.overview,
        //             metricMode: action.mode,
        //             pickingBranch: false
        //         },
        //         toast: action.mode == 'local' && state.overview.metricBranch == null?
        //             {msg: ''}: state.toast
        //     };
        case TYPE.CHANGE_DISTANCE_METRIC_REQUEST:
            return {
                ...state,
                overview: {
                    ...state.overview,
                    metricMode: action.mode,
                    metricBranch: action.mode === 'local'? action.bid: state.overview.metricBranch,
                    pickingBranch: false
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
                    pickingBranch: false
                },
                toast: {...state.toast, msg: null}
            };
        case TYPE.CHANGE_DISTANCE_METRIC_FAILURE:
            return {
                ...state,
                overview: {
                    ...state.overview,
                    pickingBranch: true,
                },
                toast: {
                    ...state.toast,
                    msg: action.error.toString()
                }
            };


        case TYPE.TOGGLE_HIGHLIGHT_TREE:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    highlightDots: action.isHighlight? action.tids: []
                }
            });
        case TYPE.TOGGLE_SELECT_AGG_DENDRO:
            return Object.assign({}, state, {
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeTreeId: action.tid
                },
                overview: {
                    ...state.overview,
                    selectedDots: state.aggregatedDendrogram.mode.indexOf('cluster') !== -1? action.tids: ([action.tid] || [])
                }
            });
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
        case TYPE.TOGGLE_COMPARING_HIGHLIGHT_MONOPHYLY:
            let otherTid = action.tid === state.referenceTree.id? state.pairwiseComparison.tid: state.referenceTree.id;
            let oldBidsArr = state.pairwiseComparison.highlight.bids;
            // Find out where are the highlighted entities in the other tree
            // The list of branches returned contains exactly all the highlighted entities
            let tgtEntities;
            if (action.bid ===  'missing_taxa') {
                tgtEntities = state.inputGroupData.trees[action.tid].missing;
            } else if (action.bid.startsWith('m-')) {
                tgtEntities = [action.bid.substr(2)];
            } else {
                tgtEntities = state.inputGroupData.trees[action.tid].branches[action.bid].entities;
            }
            let bids = findEntities(tgtEntities, state.inputGroupData.trees[otherTid]);
            let newBid = {src: action.tid, [action.tid]: [action.bid], [otherTid]: bids};
            let newBidsArr;
            let newPointer = state.pairwiseComparison.highlight.pointer;
            if (oldBidsArr.length + 1 > state.pairwiseComparison.highlight.limit) {
                newBidsArr = oldBidsArr.map((d, i) => (i === newPointer? newBid: d));
                newPointer += 1;
            } else {
                newBidsArr = oldBidsArr.concat([newBid]);
            }
            return {
                ...state,
                pairwiseComparison: {
                    ...state.pairwiseComparison,
                    highlight: {
                        ...state.pairwiseComparison.highlight,
                        bids: newBidsArr,
                        pointer: newPointer
                    }
                }
            };
        case TYPE.COMPARE_WITH_REFERENCE:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    persist: !!action.tid,
                },
                pairwiseComparison: {
                    ...state.pairwiseComparison,
                    tid: action.tid,
                    highlight: {
                        ...state.pairwiseComparison.highlight,
                        bids: []
                    }
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

        case TYPE.FETCH_INPUT_GROUP_REQUEST:
            return Object.assign({}, state, {
                isFetching: true,
                toast: {
                    ...state.toast,
                    msg: 'Fetching data from server...'
                }
            });
        case TYPE.FETCH_INPUT_GROUP_SUCCESS:
            for (let tid in action.data.trees) if (action.data.trees.hasOwnProperty(tid)) {
                action.data.trees[tid].tid = tid;
                action.data.trees[tid].branches = getOrder(ladderize(prepareBranches(action.data.trees[tid].branches,
                    action.data.trees[tid].rootBranch), action.data.trees[tid].rootBranch), action.data.trees[tid].rootBranch);
                action.data.trees[tid].missing = findMissing(action.data.trees[tid], action.data.entities);
            }
            return Object.assign({}, state, {
                isFetching: false,
                inputGroupData: action.data,
                toast: {
                    ...state.toast,
                    msg: null
                },
                referenceTree: {
                    ...state.referenceTree,
                    id: action.data.defaultReferenceTree
                },
                sets: [{
                    title: 'All Trees',
                    tids: Object.keys(action.data.trees),
                    color: 'grey'
                }],
                overview: {
                    ...state.overview,
                    coordinates: getCoordinates(action.data.trees, true, null, null)
                }
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
            return {
                ...state,
                cb: action.cb
            };
        default:
            return state;

    }
}


export default visphyReducer;