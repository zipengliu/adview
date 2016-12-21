/**
 * Created by Zipeng Liu on 2016-11-29.
 */

export const FETCH_INPUT_GROUP_REQUEST = 'FETCH_INPUT_GROUP_REQUEST';
export const FETCH_INPUT_GROUP_SUCCESS = 'FETCH_INPUT_GROUP_SUCCESS';
export const FETCH_INPUT_GROUP_FAILURE = 'FETCH_INPUT_GROUP_FAILURE';

// Reference Tree actions
export const HIGHLIGHT_MONOPHYLY = 'HIGHLIGHT_MONOPHYLY';
export const UNHIGHLIGHT_MONOPHYLY = 'UNHIGHLIGHT_MONOPHYLY';
export const SELECT_BRANCH = 'SELECT_BRANCH';
// export const CHANGE_REFERENCE_TREE = 'CHANGE_REFERENCE_TREE';
export const FETCH_TREE_REQUEST = 'FETCH_TREE_REQUEST';
export const FETCH_TREE_SUCCESS = 'FETCH_TREE_SUCCESS';
export const FETCH_TREE_FAILURE = 'FETCH_TREE_FAILURE';
export const CLEAR_BRANCH_SELECTION = 'CLEAR_BRANCH_SELECTION';
export const REARRANGE_OVERVIEW = 'REARRANGE_OVERVIEW';
export const TOGGLE_EXPLORE_MODE = 'TOGGLE_EXPLORE_MODE';
export const TOGGLE_SELECT_EXPLORE_BRANCH = 'TOGGLE_SELECT_EXPLORE_BRANCH';

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

// Aggregated dendrogram actions
export const TOGGLE_HIGHLIGHT_TREE = 'TOGGLE_HIGHLIGHT_TREE';
export const TOGGLE_SELECT_AGG_DENDRO = 'TOGGLE_SELECT_AGG_DENDRO';
export const SELECT_SET = 'SELECT_SET';
export const REMOVE_FROM_SET = 'REMOVE_FROM_SET';

// Inspector
export const TOGGLE_INSPECTOR = 'TOGGLE_INSPECTOR';
export const ADD_TREE_TO_INSPECTOR = 'ADD_TO_INSPECTOR';
export const REMOVE_TREE_FROM_INSPECTOR = 'REMOVE_TREE_FROM_INSPECTOR';

// Attribute Explorer
export const CHANGE_ATTRIBUTE_EXPLORER_MODE = 'CHANGE_ATTRIBUTE_EXPLORER_MODE';
