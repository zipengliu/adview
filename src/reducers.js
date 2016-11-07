/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import {HIGHLIGHT_MONOPHYLY, UNHIGHLIGHT_MONOPHYLY, SELECT_BRANCH,
    FETCH_INPUT_GROUP_REQUEST, FETCH_INPUT_GROUP_SUCCESS, FETCH_INPUT_GROUP_FAILURE}
    from './actions';

let initialState = {
    highlightMonophyly: null,
    isFetching: false,
    isFetchFailed: false
};

function visphyReducer(state = initialState, action) {
    switch (action.type) {
        case HIGHLIGHT_MONOPHYLY:
            return Object.assign({}, state, {
                highlightMonophyly: action.bid
            });
        case UNHIGHLIGHT_MONOPHYLY:
            return Object.assign({}, state, {
                highlightMonophyly: null
            });
        case FETCH_INPUT_GROUP_REQUEST:
            return Object.assign({}, state, {
                isFetching: true
            });
        case FETCH_INPUT_GROUP_SUCCESS:
            return Object.assign({}, state, {
                isFetching: false,
                inputGroupData: action.data
            });
        case FETCH_INPUT_GROUP_FAILURE:
            return Object.assign({}, state, {
                isFetchFailed: true,
                isFetching: false
            });
        default:
            return state;
    }
}

export default visphyReducer;