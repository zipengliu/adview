/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import 'whatwg-fetch';
import * as TYPE from './actionTypes';

// Fetch data actions
const baseUrl = 'http://localhost:33333';

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

export function highlightMonophyly(bid) {
    return {
        type: TYPE.HIGHLIGHT_MONOPHYLY,
        bid
    }
}

export function unhighlightMonophyly() {
    return {
        type: TYPE.UNHIGHLIGHT_MONOPHYLY,
    }
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

export function rearrangeOverview() {
    return {type: TYPE.REARRANGE_OVERVIEW}
}

export function toggleExploreMode() {
    return {type: TYPE.TOGGLE_EXPLORE_MODE};
}

export function toggleSelectExploreBranch(bid) {
    return {type: TYPE.TOGGLE_SELECT_EXPLORE_BRANCH, bid}
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

export function changeReferenceTree(tid) {
    return function (dispatch) {
        dispatch(fetchTreeRequest(tid));
        return fetch(baseUrl + '/trees/' + tid + '/branches').then(function(response) {
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

export function endSelection() {
    return {
        type: TYPE.END_SELECTION
    }
}

export function changeSelection(x, y) {
    return {
        type: TYPE.CHANGE_SELECTION,
        x, y
    }
}


export function toggleHighlightTree(tid) {
    return {
        type: TYPE.TOGGLE_HIGHLIGHT_TREE,
        tid
    }
}

export function toggleSelectAggDendro(tid) {
    return {
        type: TYPE.TOGGLE_SELECT_AGG_DENDRO,
        tid
    }
}

export function selectSet(i) {
    return {
        type: TYPE.SELECT_SET,
        setIndex: i
    }
}

export function removeFromSet(tid, setIndex) {
    return {
        type: TYPE.REMOVE_FROM_SET, tid, setIndex
    }
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
