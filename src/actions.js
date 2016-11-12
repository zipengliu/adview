/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import 'whatwg-fetch';

// Fetch data actions
export const FETCH_INPUT_GROUP_REQUEST = 'FETCH_INPUT_GROUP_REQUEST';
export const FETCH_INPUT_GROUP_SUCCESS = 'FETCH_INPUT_GROUP_SUCCESS';
export const FETCH_INPUT_GROUP_FAILURE = 'FETCH_INPUT_GROUP_FAILURE';

// Reference Tree actions
export const HIGHLIGHT_MONOPHYLY = 'HIGHLIGHT_MONOPHYLY';
export const UNHIGHLIGHT_MONOPHYLY = 'UNHIGHLIGHT_MONOPHYLY';
export const SELECT_BRANCH = 'SELECT_BRANCH';
export const CHANGE_REFERENCE_TREE = 'CHANGE_REFERENCE_TREE';

// Overview actions
export const POP_CREATE_NEW_SET_WINDOW = 'POP_CREATE_NEW_SET_WINDOW';
export const CLOSE_CREATE_NEW_SET_WINDOW = 'CLOSE_CREATE_NEW_SET_WINDOW';
export const CREATE_NEW_SET = 'CREATE_NEW_SET';
export const TYPING_TITLE = 'TYPING_TITLE';
export const REMOVE_SET = 'REMOVE_SET';
export const ADD_TO_SET = 'ADD_TO_SET';
export const START_SELECTION = 'START_SELECTION';
export const END_SELECTION = 'END_SELECTION';
export const CHANGE_SELECTION = 'CHANGE_SELECTION';

// Trigger the UI change
function requestInputGroup(id) {
    return {
        type: FETCH_INPUT_GROUP_REQUEST,
        inputGroupId: id
    }
}

// Called on loading.  It will fetch the data and dispatch other actions
export function fetchInputGroup(id) {
    return function (dispatch) {
        dispatch(requestInputGroup(id));
        return fetch('http://localhost:33333/input_groups/' + id).then(function(response) {
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
        type: FETCH_INPUT_GROUP_SUCCESS,
        data
    }
}

function fetchInputGroupFailure(err) {
    return {
        type: FETCH_INPUT_GROUP_FAILURE,
        error: err
    }
}

export function highlightMonophyly(bid) {
    return {
        type: HIGHLIGHT_MONOPHYLY,
        bid
    }
}

export function unhighlightMonophyly() {
    return {
        type: UNHIGHLIGHT_MONOPHYLY,
    }
}

export function selectBranchOnFullDendrogram(bid) {
    return {
        type: SELECT_BRANCH,
        bid
    }
}

export function changeReferenceTree(tid) {
    return {
        type: CHANGE_REFERENCE_TREE,
        tid
    }
}

export function createNewSet() {
    return {
        type: CREATE_NEW_SET,
    }
}

export function addToSet(sid) {
    return {
        type: ADD_TO_SET,
        sid
    }
}

export function typingTitle(value) {
    return {
        type: TYPING_TITLE,
        value
    }
}

export function removeSet(sid) {
    return {
        type: REMOVE_SET,
        sid
    }
}

export function popCreateNewSetWindow() {
    return {
        type: POP_CREATE_NEW_SET_WINDOW,
    }
}

export function closeCreateNewSetWindow() {
    return {
        type: CLOSE_CREATE_NEW_SET_WINDOW
    }
}

export function startSelection(x, y, size) {
    return {
        type: START_SELECTION,
        x, y, size
    }
}

export function endSelection() {
    return {
        type: END_SELECTION
    }
}

export function changeSelection(x, y) {
    return {
        type: CHANGE_SELECTION,
        x, y
    }
}
