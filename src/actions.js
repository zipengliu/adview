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
                dispatch(makeConsensusFailure(response.statusText))
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



export function changeUploadDataset(name, value) {
    return {type: TYPE.CHANGE_UPLOAD_DATASET, name, value};
}

export function uploadDataset() {
    return (dispatch, getState) => {
        dispatch(uploadDatasetRequest());
        let data = new FormData();
        let state = getState();
        for (let name in state.upload.rawData) if (state.upload.rawData.hasOwnProperty(name)) {
            console.log(name, state.upload.rawData[name]);
            data.append(name, state.upload.rawData[name]);
        }
        console.log('submitting dataset:');
        console.log(data);

        return fetch(baseUrl + '/dataset', {method: 'POST', body: data}).then((response) => {
            if (response.status >= 400) {
                console.log("Bad response from server");
                dispatch(uploadDatasetFailure(response.statusText))
            }
            return response.json();
        }).then(function (data) {
            console.log('uploadind dataset succeeded!');
            dispatch(uploadDatasetSuccess(data));
        }).catch(function (error) {
            dispatch(uploadDatasetFailure(error));
        })
    }
}

function uploadDatasetRequest() {
    return {type: TYPE.UPLOAD_DATASET_REQUEST};
}

function uploadDatasetSuccess(data) {
    return {type: TYPE.UPLOAD_DATASET_SUCCESS, data};
}

function uploadDatasetFailure(error) {
    return {type: TYPE.UPLOAD_DATASET_FAILURE, error};
}

export function selectOutgroupTaxa(eid) {
    return {type: TYPE.SELECT_OUTGROUP_TAXA, eid};
}

export function changeOutgroupTaxaFile(t) {
    return {type: TYPE.CHANGE_OUTGROUP_TAXA_FILE, t};
}

export function uploadOutgroup() {
    return (dispatch, getState) => {
        dispatch(uploadOutgroupRequest());

        let state = getState();
        let data = new FormData();
        data.append('inputGroupId', state.upload.inputGroupId);
        data.append('outgroup', Object.keys(state.upload.outgroupTaxa).map(eid => state.upload.entities[eid]).join(','));

        return fetch(baseUrl + '/outgroup', {method: 'POST', body: data}).then((response) => {
            if (response.status >= 400) {
                console.log("Bad response from server");
                dispatch(uploadOutgroupFailure(response.statusText))
            }
            return response.json();
        }).then(data => {
            dispatch(uploadOutgroupSuccess(data));
            dispatch(checkUploadStatus(baseUrl + '/upload_status/' + data.taskId));
        }).catch(error => {
            dispatch(uploadOutgroupFailure(error))
        })
    }
}

function uploadOutgroupRequest() {
    return {type: TYPE.UPLOAD_OUTGROUP_REQUEST};
}

function uploadOutgroupSuccess(checkStatusUrl) {
    return {type: TYPE.UPLOAD_OUTGROUP_SUCCESS, checkStatusUrl};
}

function uploadOutgroupFailure() {
    return {type: TYPE.UPLOAD_DATASET_FAILURE};
}

export function checkUploadStatus(url) {
    return (dispatch, getState) => {
        // dispatch(checkUploadStatusRequest());
        let retry = getState().upload.checkStatusRetry;

        return fetch(url).then(response => {
            if (response.status >= 400) {
                console.log("Bad response from server");
                dispatch(checkUploadStatusFailure(response.statusText))
            }
            return response.json();
        }).then(status => {
            if (status.state === 'PROGRESS' || status.state === 'PENDING') {
                // Keep track of the progress
                setTimeout(() => {
                    dispatch(checkUploadStatus(url))
                }, 2000);
            }
            dispatch(checkUploadStatusSuccess(status));     // reducer to act according to different state
        }).catch(error => {
            dispatch(checkUploadStatusFailure(error));
            if (retry > 0) {
                setTimeout(() => {
                    dispatch(checkUploadStatus(url))
                }, 2000);
            }
        })
    }
}

function checkUploadStatusRequest() {}

function checkUploadStatusSuccess(data) {
    return {type: TYPE.CHECK_UPLOAD_STATUS_SUCCESS, data}
}

function checkUploadStatusFailure(error) {
    return {type: TYPE.CHECK_UPLOAD_STATUS_FAILUER, error}
}


export function toggleStretchedMainView() {
    return {type: TYPE.TOGGLE_STRETCH_MAINVIEW}
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

export function addToSet(setIndex) {
    return {
        type: TYPE.ADD_TO_SET,
        setIndex
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

export function changeActiveCollection(setIndex) {
    return {type: TYPE.CHANGE_ACTIVE_COLLECTION, setIndex};
}

export function toggleCBAECollapse() {
    return {type: TYPE.TOGGLE_CBAE_COLLAPSE};
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

export function toggleTreeSimilarityCollapse() {
    return {type: TYPE.TOGGLE_TREE_SIMILARITY_COLLAPSE}
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

export function changeLayoutAlgorithm(layout) {
    return {type: TYPE.CHANGE_LAYOUT_ALGORITHM, layout};
}

export function changeClusterAlgorithm(cluster) {
    return {type: TYPE.CHANGE_CLUSTER_ALGORITHM, cluster};
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
                let newReferenceTree = referenceTree.clone(true);
                console.log('new missing: ', newReferenceTree.missing);
                newReferenceTree.reroot(rid, trees).getGSF(state.cb, Object.keys(state.inputGroupData.trees).length);
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

export function toggleReferenceTreeLegends() {
    return {type: TYPE.TOGGLE_REFERENCE_TREE_LEGENDS};
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

export function openDatasetRemoval(inputGroupId) {
    return {type: TYPE.OPEN_DATASET_REMOVAL, inputGroupId};
}

export function confirmDatasetRemoval(toDelete) {
    if (!toDelete) {
        return {type: TYPE.CONFIRM_DATASET_REMOVAL, toDelete: false};
    } else {
        return (dispatch, getState) => {
            let state = getState();
            let id = state.datasetRemoval.id;
            dispatch(removeDatasetRequest());

            return fetch(baseUrl + '/dataset/' + id, {method: 'DELETE'}).then(response => {
                if (response.status >= 400) {
                    console.log("Bad response from server");
                    dispatch(removeDatasetFailure(response.statusText))
                }
                dispatch(removeDatasetSuccess(id))
            }).catch(error => {
                dispatch(removeDatasetFailure(error));
            })
        }
    }
}

function removeDatasetRequest() {
    return {type: TYPE.REMOVE_DATASET_REQUEST};
}

function removeDatasetSuccess(inputGroupId) {
    return {type: TYPE.REMOVE_DATASET_SUCCESS, inputGroupId};
}

function removeDatasetFailure(error) {
    return {type: TYPE.REMOVE_DATASET_FAILURE, error};
}


export function toggleTreeListCollapse() {
    return {type: TYPE.TOGGLE_TREE_LIST_COLLAPSE};
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

export function toggleTDExtendedMenu(bid, tid, x, y, viewerIndex=null) {
    return {type: TYPE.TOGGLE_TD_EXTENDED_MENU, bid, tid, x, y, viewerIndex};
}

export function toggleTaxaMembershipView(bid, tid, viewerIndex=null) {
    return {type: TYPE.TOGGLE_TAXA_MEMBERSHIP_VIEW, bid, tid, viewerIndex};
}

export function reverseSelection() {
    return (dispatch, getState) => {
        let state = getState();
        let tids = state.selectedTrees;
        let others = Object.keys(state.inputGroupData.trees).filter(tid => !tids.hasOwnProperty(tid));
        dispatch(toggleSelectTrees(others));
    }
}

export function toggleHighlightADBlock(tids, entities, uncertainEntities=[]) {
    return (dispatch) => {
        dispatch(toggleHighlightEntities(entities, uncertainEntities));
        dispatch(toggleHighlightTrees(tids));
    };
}


export function downloadSelectedTrees() {
    return (dispatch, getState) => {
        let state = getState();
        dispatch(downloadSelectedTreesRequest());
        let request = new FormData();
        request.append('inputGroupId', state.inputGroupData.inputGroupId);
        request.append('tids', Object.keys(state.selectedTrees).join(','));
        return fetch(baseUrl + '/tree_newick', {method: 'POST', body: request}).then(response => {
            if (response.status >= 400) {
                console.log("Bad response from server");
                dispatch(fetchInputGroupFailure(response.statusText))
            }
            return response.blob();
        }).then(blob => {
            let url = window.URL.createObjectURL(blob);
            dispatch(downloadSelectedTreesSuccess(url));
        }).catch(error => {
            dispatch(downloadSelectedTreesFailure(error))
        })
    }
}

function downloadSelectedTreesRequest() {
    return {type: TYPE.DOWNLOAD_SELECTED_TREES_REQUEST};
}

function downloadSelectedTreesSuccess(url) {
    return {type: TYPE.DOWNLOAD_SELECTED_TREES_SUCCESS, url};
}

function downloadSelectedTreesFailure(error) {
    return {type: TYPE.DOWNLOAD_SELECTED_TREES_FAILURE, error};
}

export function finishDownloadSelectedTrees() {
    return {type: TYPE.FINISH_DOWNLOAD_SELECTED_TREES};
}
