/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import {HIGHLIGHT_MONOPHYLY, UNHIGHLIGHT_MONOPHYLY, SELECT_BRANCH, CHANGE_REFERENCE_TREE,
    POP_CREATE_NEW_SET_WINDOW, CLOSE_CREATE_NEW_SET_WINDOW, CREATE_NEW_SET, REMOVE_SET, ADD_TO_SET, TYPING_TITLE,
    START_SELECTION, END_SELECTION, CHANGE_SELECTION,
    TOGGLE_HIGHLIGHT_TREE,
    FETCH_INPUT_GROUP_REQUEST, FETCH_INPUT_GROUP_SUCCESS, FETCH_INPUT_GROUP_FAILURE}
    from './actions';
import {scaleLinear, scaleOrdinal, schemeCategory10} from 'd3-scale';
import {runTSNE} from './utils';

let initialState = {
    isFetching: false,
    isFetchFailed: false,
    fetchError: null,
    inputGroupData: null,
    referenceTree: {
        id: null,
        highlightMonophyly: null,
        selected: {}
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
    }
};


let getCoordinates = (trees) => {
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
        case HIGHLIGHT_MONOPHYLY:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    highlightMonophyly: action.bid
                }
            });
        case UNHIGHLIGHT_MONOPHYLY:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    highlightMonophyly: null
                }
            });
        case CHANGE_REFERENCE_TREE:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    id: action.tid,
                    highlightMonophyly: null
                }
            });
        case SELECT_BRANCH:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    selected: {
                        ...state.referenceTree.selected,
                        [action.bid]: !state.referenceTree.selected[action.bid]
                    }
                }
            });




        case POP_CREATE_NEW_SET_WINDOW:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    createWindow: true
                }
            });
        case CLOSE_CREATE_NEW_SET_WINDOW:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    createWindow: false
                }
            });
        case CREATE_NEW_SET:
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
        case TYPING_TITLE:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    currentTitle: action.value
                }

            });
        case ADD_TO_SET:
            return Object.assign({}, state, {
                sets: state.sets.map((s, i) => i !== action.sid? s: {...s, tids: mergeSets(s.tids, state.overview.selectedDots)}),
                overview: {
                    ...state.overview,
                    selectedDots: []
                }
            });
        case REMOVE_SET:
            return Object.assign({}, state, {

            });

        case START_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    isSelecting: true,
                    dotplotSize: action.size,
                    selectionArea: {x1: action.x, y1: action.y, x2: action.x, y2: action.y}
                }
            });
        case END_SELECTION:
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
        case CHANGE_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    selectionArea: {...state.overview.selectionArea, x2: action.x, y2: action.y }
                }
            });

        case TOGGLE_HIGHLIGHT_TREE:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    highlightDot: action.tid
                }
            });

        case FETCH_INPUT_GROUP_REQUEST:
            return Object.assign({}, state, {
                isFetching: true
            });
        case FETCH_INPUT_GROUP_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false,
                inputGroupData: action.data,
                referenceTree: {
                    ...state.referenceTree,
                    id: action.data.defaultReferenceTree
                },
                overview: {
                    ...state.overview,
                    coordinates: getCoordinates(action.data.trees)
                }
            });
        case FETCH_INPUT_GROUP_FAILURE:
            return Object.assign({}, state, {
                isFetchFailed: true,
                isFetching: false,
                fetchError: action.error
            });
        default:
            return state;
    }
}


export default visphyReducer;