/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import 'whatwg-fetch';
import * as TYPE from './actionTypes';
import {getCoordinates} from './utils';

// Fetch data actions
const baseUrl = process.env.NODE_ENV === 'production'? 'http://visphy.cs.ubc.ca/api': 'http://localhost:33333';

// Trigger the UI change
function requestInputGroup(id) {
    return {
        type: TYPE.FETCH_INPUT_GROUP_REQUEST,
        inputGroupId: id
    }
}

// Called on loading.  It will fetch the data and dispatch other actions
export function fetchInputGroup(id) {
    return function (dispatch) {
        dispatch(requestInputGroup(id));
        return fetch(baseUrl + '/input_groups/' + id).then(function(response) {
            if (response.status >= 400) {
                console.log("Bad response from server");
                dispatch(fetchInputGroupFailure(response.statusText))
            }
            return response.json();
        }).then(function (data) {
            console.log('Get data succeeded!');
            dispatch(fetchInputGroupSuccess(data));
        }).catch(function(error) {
            dispatch(fetchInputGroupFailure(error));
        });

    }
}

function fetchInputGroupSuccess(data) {
    return {
        type: TYPE.FETCH_INPUT_GROUP_SUCCESS,
        data
    }
}

function fetchInputGroupFailure(err) {
    return {
        type: TYPE.FETCH_INPUT_GROUP_FAILURE,
        error: err
    }
}

export function toggleHighlightMonophyly(tid, bid, addictive=false) {
    return {
        type: TYPE.TOGGLE_HIGHLIGHT_MONOPHYLY,
        tid, bid, addictive
    }
}

export function toggleCheckingBranch(bid) {
    return {type: TYPE.TOGGLE_CHECKING_BRANCH, bid};
}

export function selectBranchOnFullDendrogram(bid) {
    return {
        type: TYPE.SELECT_BRANCH,
        bid
    }
}

export function clearBranchSelection() {
    return {type: TYPE.CLEAR_BRANCH_SELECTION}
}

export function fetchTreeRequest(tid) {
    return {type: TYPE.FETCH_TREE_REQUEST, tid}
}

export function fetchTreeSuccess(tid, data) {
    return {type: TYPE.FETCH_TREE_SUCCESS, tid, data}
}

export function fetchTreeFailure(error) {
    return {type: TYPE.FETCH_TREE_FAILURE, error}
}

export function changeReferenceTree(inputGroupId, tid) {
    return function (dispatch) {
        dispatch(fetchTreeRequest(tid));
        return fetch(baseUrl + '/dataset/' + inputGroupId + '/trees/' + tid + '/branches').then(function(response) {
            if (response.status >= 400) {
                console.log("Bad response from server");
                dispatch(fetchTreeFailure(response.statusText))
            }
            return response.json();
        }).then(function (data) {
            console.log('Get tree data succeeded!');
            dispatch(fetchTreeSuccess(tid, data));
        }).catch(function(error) {
            dispatch(fetchTreeFailure(error));
        });

    };
}

export function togglePersistHighlight() {
    return {type: TYPE.TOGGLE_PERSIST_HIGHLIGHT};
}


export function createNewSet() {
    return {
        type: TYPE.CREATE_NEW_SET,
    }
}

export function addToSet(sid) {
    return {
        type: TYPE.ADD_TO_SET,
        sid
    }
}

export function typingTitle(value) {
    return {
        type: TYPE.TYPING_TITLE,
        value
    }
}

export function removeSet(setIndex) {
    return {type: TYPE.REMOVE_SET, setIndex}
}

export function popCreateNewSetWindow() {
    return {
        type: TYPE.POP_CREATE_NEW_SET_WINDOW,
    }
}

export function closeCreateNewSetWindow() {
    return {
        type: TYPE.CLOSE_CREATE_NEW_SET_WINDOW
    }
}

export function startSelection(x, y, size) {
    return {
        type: TYPE.START_SELECTION,
        x, y, size
    }
}

export function endSelection(tids) {
    return {
        type: TYPE.END_SELECTION, tids
    }
}

export function changeSelection(x, y) {
    return {
        type: TYPE.CHANGE_SELECTION,
        x, y
    }
}

export function changeDistanceMetric(mode, bid) {
    return function (dispatch, getState) {
        let state = getState();
        dispatch(changeDistanceMetricRequest(mode, bid));

        // calculate coordinates
        if (mode === 'local' && bid == null) {
            dispatch(changeDistanceMetricFailure('Should pick a branch to get local distance metric using CTRL + ALT + Click Branch'))
        } else if (mode === 'global'  && !state.overview.metricBranch) {
            // Previously its actually the global overview being shown, and now it does not change the coordinates
            dispatch(changeDistanceMetricSuccess(state.overview.coordinates));
        } else {
            setTimeout(() => {
                dispatch(changeDistanceMetricSuccess(
                    getCoordinates(state.inputGroupData.trees, state.cb, mode === 'global' || bid == null, state.referenceTree.id, bid)));
            }, 100);
        }
    }
}


function changeDistanceMetricRequest(mode, bid) {
    return {type: TYPE.CHANGE_DISTANCE_METRIC_REQUEST, mode, bid};
}

function changeDistanceMetricSuccess(coordinates) {
    return {type: TYPE.CHANGE_DISTANCE_METRIC_SUCCESS, coordinates};
}

function changeDistanceMetricFailure(error) {
    return {type: TYPE.CHANGE_DISTANCE_METRIC_FAILURE, error}
}

export function togglePickingMetricBranch() {
    return {type: TYPE.TOGGLE_PICKING_METRIC_BRANCH}
}

export function toggleHighlightTree(tids, isHighlight) {
    return {
        type: TYPE.TOGGLE_HIGHLIGHT_TREE,
        tids,
        isHighlight
    }
}

export function toggleSelectAggDendro(tid, tids) {
    return {
        type: TYPE.TOGGLE_SELECT_AGG_DENDRO,
        tid, tids
    }
}

export function selectSet(i) {
    return {
        type: TYPE.SELECT_SET,
        setIndex: i
    }
}

export function removeFromSet(tids, setIndex) {
    return {
        type: TYPE.REMOVE_FROM_SET, tids, setIndex
    }
}

export function toggleSorting() {
    return {type: TYPE.TOGGLE_SORTING}
}

export function toggleAggregationMode(mode) {
    return {type: TYPE.TOGGLE_AGGREGATION_MODE, mode};
}

export function toggleHighlightEntities(entities, uncertainEntities=[]) {
    return {type: TYPE.TOGGLE_HIGHLIGHT_ENTITIES, entities, uncertainEntities};
}


export function toggleInspector() {
    return {type: TYPE.TOGGLE_INSPECTOR}
}

export function addTreeToInspector(tid) {
    return {type: TYPE.ADD_TREE_TO_INSPECTOR, tid}
}

export function removeTreeFromInspector(tid) {
    return {type: TYPE.REMOVE_TREE_FROM_INSPECTOR, tid}

}

export function togglePairwiseComparison(p) {
    return {type: TYPE.TOGGLE_PAIRWISE_COMPARISON, p};
}

export function compareWithReference(tid) {
    return {type: TYPE.COMPARE_WITH_REFERENCE, tid};
}


export function changeAttributeExplorerMode(section, scope, isContext) {
    return {type: TYPE.CHANGE_ATTRIBUTE_EXPLORER_MODE, section, scope, isContext}
}

export function toggleMoveHandle(handle) {
    return {type: TYPE.TOGGLE_MOVE_HANDLE, handle}
}
export function moveControlHandle(value) {
    return {type: TYPE.MOVE_CONTROL_HANDLE, value}
}

export function toggleHistogramOrCDF(isHistogram) {
    return {type: TYPE.TOGGLE_HISTOGRAM_OR_CDF, isHistogram};
}

export function changeActiveRangeSelection(id) {
    return {type: TYPE.CHANGE_ACTIVE_RANGE_SELECTION, id};
}

export function changeSelectionRange(l, r) {
    return {type: TYPE.CHANGE_SELECTION_RANGE, l, r};
}

export function fetchDatasets() {
    return function (dispatch) {
        dispatch(requestDatasets());
        return fetch(baseUrl + '/datasets').then(function(response) {
            if (response.status >= 400) {
                console.log("Bad response from server");
                dispatch(fetchDatasetsFailure(response.statusText))
            }
            return response.json();
        }).then(function (data) {
            console.log('Get data succeeded!');
            dispatch(fetchDatasetsSuccess(data));
        }).catch(function(error) {
            dispatch(fetchDatasetsFailure(error));
        });

    }
}

export function requestDatasets() {
    return {type: TYPE.FETCH_DATASETS_REQUEST};
}

export function fetchDatasetsSuccess(data) {
    return {type: TYPE.FETCH_DATASETS_SUCCESS, data};
}

export function fetchDatasetsFailure(error) {
    return {type: TYPE.FETCH_DATASETS_FAILURE, error};
}


export function toggleTreeListCollapse() {
    return {type: TYPE.TOGGLE_TREE_LIST_COLLAPSE};
}


export function toggleJaccardMissing(cb) {
    return {type: TYPE.TOGGLE_JACCARD_MISSING, cb};
}


export function closeToast() {
    return {type: TYPE.CLOSE_TOAST};
}