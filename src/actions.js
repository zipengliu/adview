/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import 'whatwg-fetch';

export const HIGHLIGHT_MONOPHYLY = 'HIGHLIGHT_MONOPHYLY';
export const UNHIGHLIGHT_MONOPHYLY = 'UNHIGHLIGHT_MONOPHYLY';
export const SELECT_BRANCH = 'SELECT_BRANCH';
export const FETCH_INPUT_GROUP_REQUEST = 'FETCH_INPUT_GROUP_REQUEST';
export const FETCH_INPUT_GROUP_SUCCESS = 'FETCH_INPUT_GROUP_SUCCESS';
export const FETCH_INPUT_GROUP_FAILURE = 'FETCH_INPUT_GROUP_FAILURE';

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
