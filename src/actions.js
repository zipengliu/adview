/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import 'whatwg-fetch';
import * as TYPE from './actionTypes';
import {getCoordinates} from './utils';
import {reroot} from './tree';

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
        return fetch(baseUrl + '/dataset/' + id).then(function(response) {
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

export function makeConsensus(inputGroupId, tids) {
    return function (dispatch) {
        dispatch(makeConsensusRequest(tids));
        let requestBody = new FormData();
        requestBody.append('inputGroupId', inputGroupId);
        requestBody.append('trees', tids.join(','));
        return fetch(baseUrl + '/consensus', {method: 'POST', body: requestBody}).then(function (response) {
            if (response.status >= 400) {
                console.log("Bad response from server");
                dispatch(fetchInputGroupFailure(response.statusText))
            }
            return response.json();
        }).then(function (data) {
            console.log('Get consensus tree succeeded!');
            dispatch(makeConsensusSuccess(data));
        }).catch(function (error) {
            dispatch(makeConsensusFailure(error));
        })
    }
}

function makeConsensusRequest(tids) {
    return {type: TYPE.MAKE_CONSENSUS_REQUEST, tids}
}

function makeConsensusSuccess(data) {
    return {type: TYPE.MAKE_CONSENSUS_SUCCESS, data}
}

function makeConsensusFailure(error) {
    return {type: TYPE.MAKE_CONSENSUS_FAILURE, error}
}

export function toggleHighlightMonophyly(tid, bid, addictive=false) {
    return {
        type: TYPE.TOGGLE_HIGHLIGHT_MONOPHYLY,
        tid, bid, addictive
    }
}

export function toggleCheckingBranch(bid, tid) {
    return {type: TYPE.TOGGLE_CHECKING_BRANCH, bid, tid};
}

export function toggleUniversalBranchLength() {
    return {type: TYPE.TOGGLE_UNIVERSAL_BRANCH_LENGTH};
}

export function selectBranchOnFullDendrogram(bid) {
    return {
        type: TYPE.SELECT_BRANCH,
        bid
    }
}

export function clearAll() {
    return {type: TYPE.CLEAR_ALL_SELECTION_AND_HIGHLIGHT}
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

export function toggleHighlightDuplicate(e) {
    return {type: TYPE.TOGGLE_HIGHLIGHT_DUPLICATE, e};
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

export function changeActiveExpandedBranch(bid) {
    return {type: TYPE.CHANGE_ACTIVE_EXPANDED_BRANCH, bid};
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
                    getCoordinates(state.inputGroupData.referenceTree, state.inputGroupData.trees, state.cb, mode === 'global' || bid == null, bid)));
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

export function changeSorting(order) {
    return {type: TYPE.CHANGE_SORTING, order}
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

export function toggleMoveHandle(handle, isRef) {
    return {type: TYPE.TOGGLE_MOVE_HANDLE, handle, isRef}
}
export function moveControlHandle(value, isRef) {
    return {type: TYPE.MOVE_CONTROL_HANDLE, value, isRef}
}

export function toggleHistogramOrCDF(isHistogram) {
    return {type: TYPE.TOGGLE_HISTOGRAM_OR_CDF, isHistogram};
}

export function changeActiveRangeSelection(id, isRef) {
    return {type: TYPE.CHANGE_ACTIVE_RANGE_SELECTION, id, isRef};
}

export function changeSelectionRange(l, r, sid, isRef) {
    return {type: TYPE.CHANGE_SELECTION_RANGE, l, r, sid, isRef};
}

export function togglePopAttributeExplorer() {
    return {type: TYPE.TOGGLE_POP_ATTRIBUTE_EXPLORER};
}

export function toggleExtendedMenu(bid, x, y) {
    return {type: TYPE.TOGGLE_EXTENDED_MENU, bid, x, y};
}

export function rerootReferenceTree(rid) {
    return function (dispatch, getState) {
        let state = getState();
        dispatch(rerootRequest(rid));

        return new Promise(() => {
            console.log('Re-rooting to ', rid);

            // The timeout here is to yield to update cycle of React so that it can display the toast message
            setTimeout(() => {
                // Do the heavy lifting of re-root
                let {trees, referenceTree} = state.inputGroupData;
                let newReferenceTree = reroot(referenceTree, rid, trees);
                dispatch(rerootSuccess(newReferenceTree));
            }, 0);
        }).catch(err => {
            console.error(err);
            dispatch(rerootFailure(err.toString()));
        });
    }
}

// Re-rooting is a blocking procedure at frontend currently. Should move to backend and run async later
export function rerootRequest(bid) {
    return {type: TYPE.REROOT_REQUEST, bid};
}

export function rerootSuccess(data) {
    return {type: TYPE.REROOT_SUCCESS, data};
}

export function rerootFailure(error) {
    return {type: TYPE.REROOT_FAILURE, error};
}

export function createUserSpecifiedTaxaGroup(bid) {
    return {type: TYPE.CREATE_USER_SPECIFIED_TAXA_GROUP, bid};
}

export function addToUserSpecifiedTaxaGroup(bid, group) {
    return {type: TYPE.ADD_TO_USER_SPECIFIED_TAXA_GROUP, bid, group};
}

export function removeFromUserSpecifiedTaxaGroup(bid, group) {
    return {type: TYPE.REMOVE_FROM_USER_SPECIFIED_TAXA_GROUP, bid, group};
}

export function removeUserSpecifiedTaxaGroup(group) {
    return {type: TYPE.REMOVE_USER_SPECIFIED_TAXA_GROUP, group};
}

export function expandUserSpecifiedTxaGroup(group, collapse=false) {
    return {type: TYPE.EXPAND_USER_SPECIFIED_TAXA_GROUP, group, collapse};
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

export function toggleSelectTaxa(e) {
    return {type: TYPE.TOGGLE_SELECT_TAXA, e};
}


export function toggleSubsetDistribution() {
    return {type: TYPE.TOGGLE_SHOW_SUBSET_DISTRIBUTION};
}

export function toggleHighlightTrees(tids, msg, isMsgForBip=false) {
    return {type: TYPE.TOGGLE_HIGHLIGHT_TREES, tids, msg, isMsgForBip};
}


export function toggleSelectTrees(tids, isAdd) {
    return {type: TYPE.TOGGLE_SELECT_TREES, tids, isAdd};
}


export function toggleTaxaList() {
    return {type: TYPE.TOGGLE_TAXA_LIST};
}


export function clearSelectedTrees() {
    return {type: TYPE.CLEAR_SELECTED_TREES};
}

export function toggleRefAttributeExplorer() {
    return {type: TYPE.TOGGLE_REFERENCE_TREE_ATTRIBUTE_EXPLORER};
}

export function toggleTreeDistributionCollapse() {
    return {type: TYPE.TOGGLE_TREE_DISTRIBUTION_COLLAPSE}
}

export function toggleBipDistributionCollapse() {
    return {type: TYPE.TOGGLE_BIP_DISTRIBUTION_COLLAPSE}
}

export function toggleHighlightSegment(tids, entities, tooltipMsg) {
    return {type: TYPE.TOGGLE_HIGHLIGHT_SEGMENT, tids, entities, tooltipMsg};
}