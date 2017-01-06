/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import * as TYPE from './actionTypes';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {runTSNE, getJaccardIndex} from './utils';

let initialState = {
    isFetching: false,
    isFetchFailed: false,
    inputGroupData: null,
    datasets: [],
    toast: {
        msg: null,
    },
    inspector: {
        show: false,
        trees: [],
    },
    dendrogramSpec: {
        width: 500,
        height: 960,
        margin: {left: 5, right: 5, top: 10, bottom: 10},
        marginOnEntity: 8,
        labelWidth: 100,
        responsiveAreaSize: 7
    },
    referenceTree: {
        id: null,
        exploreMode: false,
        exploreBranch: null,
        highlightMonophyly: null,
        selected: {},
        isFetching: false,
    },
    sets: [],
    overview: {
        coordinates: [],
        createWindow: false,
        currentTitle: '',
        selectedDots: [],
        highlightDot: null,
        dotplotSize: 0,
        isSelecting: false,
        selectingArea: null
    },
    aggregatedDendrogram: {
        activeTreeId: null,
        activeSetIndex: 0,
        treeOrder: {
            static: false,      // if static is true, only order by tree id (preserving the order)
            treeId: null,
            branchId: null,     // when this is null, order by rf distance between trees;
                                // otherwise by similarity (jaccard index currently) between the corresponding branches
        }
    },
    attributeExplorer: {
        modes: ['global', 'set-wise', 'tree-wise', 'branch-wise'],
        currentModeId: 0,
        spec: {
            width: 180,
            histogramHeight: 80,
            sliderHeight: 30,
            margin: {left: 8, right: 8, top: 10, bottom: 2}
        },
        attributeNames: ['support'],
        controllingAttribute: null,
        movingHandle: null,
        selectedRange: {
            support: [0.2, 0.6]
        }
    }
};


let getCoordinates = (trees, refTree, selectedBranch) => {
    // Concat all rf_dist in trees to a distance matrix
    // First, decide an order of trees for the matrix

    let order;
    let dist = [];
    let isLocal = refTree && selectedBranch;
    if (isLocal) {
        // Local distance matrix
        console.log('Calculating local coordinates in Overview...');
        order = [];
        let corr = trees[refTree].branches[selectedBranch].correspondingBranches;
        for (let tid in corr) {
            order.push({treeId: tid, branchId: corr[tid].branchId});
        }
    } else {
        console.log('Calculating global coordinates in Overview...');
        // Global distance matrix
        order = Object.keys(trees);
    }
    for (let i = 0; i < order.length; i++) {
        let cur = [];
        // let t = trees[order[i]];
        for (let j = 0; j < order.length; j++) {
            if (j > i) {
                if (isLocal) {
                    // TODO: can make it faster by caching the entities first
                    cur.push(getJaccardIndex(trees[order[i].treeId].branches[order[i].branchId].entities,
                        trees[order[j].treeId].branches[order[j].branchId].entities));
                } else {
                    cur.push(trees[order[i]].rfDistance[order[j]]);
                }
            } else if (j < i) {
                // The distance matrix is symmetric
                cur.push(dist[j][i]);
            } else {
                cur.push(0);
            }
        }
        dist.push(cur);
    }

    // Second run t-SNE
    let coords = runTSNE(dist);

    return coords.map((d, i) => ({...d, treeId: isLocal? order[i].treeId: order[i]}))
};

let isDotWithinBox = (dot, box) => {
    let {x1, x2, y1, y2} = box;
    return Math.min(x1, x2) <= dot.x && dot.x <= Math.max(x1, x2)
        && Math.min(y1, y2) <= dot.y && dot.y <= Math.max(y1, y2);
};

let colorPallete = scaleOrdinal(schemeCategory10);
let getColor = idx => idx < 10? colorPallete(idx): 'black';


let mergeSets = (a, b) => {
    let c = a.slice();
    for (let i = 0; i < b.length; i++) {
        if (a.indexOf(b[i]) == -1) {c.push(b[i])}
    }
    return c;
}

function visphyReducer(state = initialState, action) {
    switch (action.type) {
        case TYPE.HIGHLIGHT_MONOPHYLY:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    highlightMonophyly: action.bid
                }
            });
        case TYPE.UNHIGHLIGHT_MONOPHYLY:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    highlightMonophyly: null
                }
            });
        case TYPE.FETCH_TREE_REQUEST:
            return Object.assign({}, state, {
                toast: {
                    ...state.toast,
                    msg: 'Fetching tree from server...',
                },
                referenceTree: {
                    ...state.referenceTree,
                    highlightMonophyly: null,
                    selected: {},
                    isFetching: true,
                    exploreMode: false,
                    exploreBranch: null,
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
                            branches: action.data
                        }
                    }
                },
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    treeOrder: {
                        ...state.aggregatedDendrogram.treeOrder,
                        treeId: state.referenceTree.id,
                        branchId: null
                    }
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
                    selected: {
                        ...state.referenceTree.selected,
                        [action.bid]: !state.referenceTree.selected[action.bid]
                    }
                }
            });
        case TYPE.CLEAR_BRANCH_SELECTION:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    selected: {}
                }
            });
        case TYPE.TOGGLE_EXPLORE_MODE:
            let shouldChangeOverview = state.referenceTree.exploreBranch != null;
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    exploreMode: !state.referenceTree.exploreMode,
                    exploreBranch: null,
                },
                overview: {
                    ...state.overview,
                    coordinates: shouldChangeOverview? getCoordinates(state.inputGroupData.trees): state.overview.coordinates
                },
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    treeOrder: {
                        ...state.aggregatedDendrogram.treeOrder,
                        branchId: null
                    }
                }
            });
        case TYPE.TOGGLE_SELECT_EXPLORE_BRANCH:
            let newExploreBranch = action.bid == state.referenceTree.exploreBranch? null: action.bid;
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    exploreBranch: newExploreBranch,
                },
                overview: {
                    ...state.overview,
                    coordinates: getCoordinates(state.inputGroupData.trees, state.referenceTree.id, newExploreBranch)
                },
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    treeOrder: {
                        ...state.aggregatedDendrogram.treeOrder,
                        branchId: newExploreBranch,
                    }
                }
            };

        case TYPE.POP_CREATE_NEW_SET_WINDOW:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    createWindow: true
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
            let {coordinates, selectionArea, dotplotSize} = state.overview;
            let scale = scaleLinear().range([0, dotplotSize]);
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    isSelecting: false,
                    selectedDots: coordinates
                        .filter(d => isDotWithinBox({x: scale(d.x), y: scale(d.y)}, selectionArea))
                        .map(d => d.treeId),
                }
            });
        case TYPE.CHANGE_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    selectionArea: {...state.overview.selectionArea, x2: action.x, y2: action.y }
                }
            });

        case TYPE.TOGGLE_HIGHLIGHT_TREE:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    highlightDot: action.tid
                }
            });
        case TYPE.TOGGLE_SELECT_AGG_DENDRO:
            return Object.assign({}, state, {
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeTreeId: action.tid
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
                sets: state.sets.map((s, i) => i !== action.setIndex? s: {...s, tids: s.tids.filter(tid => tid != action.tid)}),
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
            let found = -1;
            let oldTrees = state.inspector.trees;
            for (let i = 0; i < oldTrees.length; i++) {
                if (oldTrees[i].id == action.tid) {
                    found = i; break;
                }
            }
            let newTrees;
            if (found !== -1) {
                // Bring that tree to the leftmost
                newTrees = [oldTrees[found], ...oldTrees.slice(0, found), ...oldTrees.slice(found+1)];
            } else {
                newTrees = [{id: action.tid, staticMode: true}, ...oldTrees];
            }
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    show: true,
                    trees: newTrees
                }
            };
        case TYPE.REMOVE_TREE_FROM_INSPECTOR:
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    trees: state.inspector.trees.filter(t => t.id != action.tid)
                }
            };


        case TYPE.CHANGE_ATTRIBUTE_EXPLORER_MODE:
            return {
                ...state,
                attributeExplorer: {
                    ...state.attributeExplorer,
                    currentModeId: action .currentModeId
                }
            };
        case TYPE.TOGGLE_MOVE_HANDLE:
            return {
                ...state,
                attributeExplorer: {
                    ...state.attributeExplorer,
                    controllingAttribute: action.attributeName,
                    movingHandle: action.handle
                }
            };
        case TYPE.MOVE_CONTROL_HANDLE:
            let oldRange = state.attributeExplorer.selectedRange[state.attributeExplorer.controllingAttribute];
            let newRange;
            if (state.attributeExplorer.movingHandle == 'left') {
                newRange = [Math.min(action.value, oldRange[1]), oldRange[1]];
            } else {
                newRange = [oldRange[0], Math.max(action.value, oldRange[0])];
            }

            return {
                ...state,
                attributeExplorer: {
                    ...state.attributeExplorer,
                    selectedRange: {
                        ...state.attributeExplorer.selectedRange,
                        [state.attributeExplorer.controllingAttribute]: newRange
                    }
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
                    title: 'Default',
                    tids: Object.keys(action.data.trees),
                    color: 'grey'
                }],
                overview: {
                    ...state.overview,
                    coordinates: getCoordinates(action.data.trees)
                },
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    treeOrder: {
                        ...state.aggregatedDendrogram.treeOrder,
                        treeId: action.data.defaultReferenceTree,
                        branchId: null
                    }
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
        default:
            return state;
    }
}


export default visphyReducer;