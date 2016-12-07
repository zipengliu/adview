/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import * as TYPE from './actionTypes';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {runTSNE} from './utils';

let initialState = {
    isFetching: false,
    isFetchFailed: false,
    inputGroupData: null,
    toast: {
        msg: null,
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
        activeSetIndex: 0
    }
};


let getCoordinates = (trees, branchSelection) => {
    console.log('Calculating coordinates in Overview...');
    // Concat all rf_dist in trees to a distance matrix
    // First, decide an order of trees for the matrix

    // let order = Object.keys(trees[orderBasisTree].rf_dist).concat([orderBasisTree]);
    let order = Object.keys(trees);

    let dist = [];
    for (let i = 0; i < order.length; i++) {
        let cur = [];
        let t = trees[order[i]];
        for (let j = 0; j < order.length; j++) {
            if (j !== i) {
                cur.push(t.rfDistance[order[j]]);
            } else {
                cur.push(0);
            }
        }
        dist.push(cur);
    }

    // Second run t-SNE
    let coords = runTSNE(dist);

    return coords.map((d, i) => ({...d, treeId: order[i]}))
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
                    id: action.tid,
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
        case TYPE.REARRANGE_OVERVIEW:
            let s = [];
            for (let bid in state.referenceTree.selected) {
                if (state.referenceTree.selected[bid]) s.push(bid);
            }
            if (s.length) {
                return Object.assign({}, state, {
                    overview: {
                        ...state.overview,
                        coordinates: getCoordinates(action.data.trees, s)
                    }
                });
            } else {
                return state;
            }
        case TYPE.TOGGLE_EXPLORE_MODE:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    exploreMode: !state.referenceTree.exploreMode,
                    exploreBranch: null,
                }
            });
        case TYPE.TOGGLE_SELECT_EXPLORE_BRANCH:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    exploreBranch: action.bid == state.referenceTree.exploreBranch? null: action.bid,
                }
            });



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
        default:
            return state;
    }
}


export default visphyReducer;