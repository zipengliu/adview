/**
 * Created by Zipeng Liu on 2016-11-29.
 */

export const FETCH_DATASETS_REQUEST = 'FETCH_DATASETS_REQUEST';
export const FETCH_DATASETS_SUCCESS = 'FETCH_DATASETS_SUCCESS';
export const FETCH_DATASETS_FAILURE = 'FETCH_DATASETS_FAILURE';

export const OPEN_DATASET_REMOVAL = 'OPEN_DATASET_REMOVAL';
export const CONFIRM_DATASET_REMOVAL = 'CONFIRM_DATASET_REMOVAL';
export const REMOVE_DATASET_REQUEST = 'REMOVE_DATASET_REQUEST';
export const REMOVE_DATASET_SUCCESS = 'REMOVE_DATASET_SUCCESS';
export const REMOVE_DATASET_FAILURE = 'REMOVE_DATASET_FAILURE';


export const FETCH_INPUT_GROUP_REQUEST = 'FETCH_INPUT_GROUP_REQUEST';
export const FETCH_INPUT_GROUP_SUCCESS = 'FETCH_INPUT_GROUP_SUCCESS';
export const FETCH_INPUT_GROUP_FAILURE = 'FETCH_INPUT_GROUP_FAILURE';

// OVERALL
export const TOGGLE_SELECT_TREES = 'TOGGLE_SELECT_TREES';
export const MAKE_CONSENSUS_REQUEST = 'MAKE_CONSENSUS_REQUEST';
export const MAKE_CONSENSUS_SUCCESS = 'MAKE_CONSENSUS_SUCCESS';
export const MAKE_CONSENSUS_FAILURE = 'MAKE_CONSENSUS_FAILURE';
export const TOGGLE_STRETCH_MAINVIEW = 'TOGGLE_STRETCH_MAINVIEW';

// upload dataset
export const CHANGE_UPLOAD_DATASET = 'CHANGE_UPLOAD_DATASET';
export const UPLOAD_DATASET_REQUEST = 'UPLOAD_DATASET_REQUEST';
export const UPLOAD_DATASET_SUCCESS = 'UPLOAD_DATASET_SUCCESS';
export const UPLOAD_DATASET_FAILURE = 'UPLOAD_DATASET_FAILURE';
export const SELECT_OUTGROUP_TAXA = 'SELECT_OUTGROUP_TAXA';
export const CHANGE_OUTGROUP_TAXA_FILE = 'CHANGE_OUTGROUP_TAXA_FILE';
export const UPLOAD_OUTGROUP_REQUEST = 'UPLOAD_OUTGROUP_REQUEST';
export const UPLOAD_OUTGROUP_SUCCESS = 'UPLOAD_OUTGROUP_SUCCESS';
export const UPLOAD_OUTGROUP_FAILURE = 'UPLOAD_OUTGROUP_FAILURE';
export const CHECK_UPLOAD_STATUS_REQUEST = 'CHECK_UPLOAD_STATUS_REQUEST';
export const CHECK_UPLOAD_STATUS_SUCCESS = 'CHECK_UPLOAD_STATUS_SUCCESS';
export const CHECK_UPLOAD_STATUS_FAILUER = 'CHECK_UPLOAD_STATUS_FAILURE';



// Reference Tree actions
export const TOGGLE_HIGHLIGHT_MONOPHYLY = 'TOGGLE_HIGHLIGHT_MONOPHYLY';
export const SELECT_BRANCH = 'SELECT_BRANCH';
export const FETCH_TREE_REQUEST = 'FETCH_TREE_REQUEST';
export const FETCH_TREE_SUCCESS = 'FETCH_TREE_SUCCESS';
export const FETCH_TREE_FAILURE = 'FETCH_TREE_FAILURE';
export const CLEAR_ALL_SELECTION_AND_HIGHLIGHT = 'CLEAR_ALL_SELECTION_AND_HIGHLIGHT';
export const TOGGLE_CHECKING_BRANCH = 'TOGGLE_CHECKING_BRANCH';
export const TOGGLE_UNIVERSAL_BRANCH_LENGTH = 'TOGGLE_UNIVERSAL_BRANCH_LENGTH';
export const TOGGLE_HIGHLIGHT_DUPLICATE = 'TOGGLE_HIGHLIGHT_DUPLICATE';
export const TOGGLE_REFERENCE_TREE_ATTRIBUTE_EXPLORER = 'TOGGLE_REFERENCE_TREE_ATTRIBUTE_EXPLORER';
export const TOGGLE_POP_ATTRIBUTE_EXPLORER = 'TOGGLE_POP_ATTRIBUTE_EXPLORER';
export const TOGGLE_EXTENDED_MENU = 'TOGGLE_EXTENDED_MENU';
export const REROOT_REQUEST = 'REROOT_REQUEST';
export const REROOT_SUCCESS = 'REROOT_SUCCESS';
export const REROOT_FAILURE = 'REROOT_FAILURE';
export const CREATE_USER_SPECIFIED_TAXA_GROUP = 'CREATE_USER_SPECIFIED_TAXA_GROUP';
export const ADD_TO_USER_SPECIFIED_TAXA_GROUP = 'ADD_TO_USER_SPECIFIED_TAXA_GROUP';
export const REMOVE_FROM_USER_SPECIFIED_TAXA_GROUP = 'REMOVE_FROM_USER_SPECIFIED_TAXA_GROUP';
export const REMOVE_USER_SPECIFIED_TAXA_GROUP = 'REMOVE_USER_SPECIFIED_TAXA_GROUP';
export const EXPAND_USER_SPECIFIED_TAXA_GROUP = 'EXPAND_USER_SPECIFIED_TAXA_GROUP';
export const TOGGLE_REFERENCE_TREE_LEGENDS = 'TOGGLE_REFERENCE_TREE_LEGENDS';

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
export const CHANGE_DISTANCE_METRIC_REQUEST = 'CHANGE_DISTNACE_METRIC_REQUEST';
export const CHANGE_DISTANCE_METRIC_SUCCESS = 'CHANGE_DISTNACE_METRIC_SUCCESS';
export const CHANGE_DISTANCE_METRIC_FAILURE = 'CHANGE_DISTNACE_METRIC_FAILURE';
export const TOGGLE_TREE_SIMILARITY_COLLAPSE = 'TOGGLE_TREE_SIMILARITY_COLLAPSE';

// Aggregated dendrogram actions
export const SELECT_SET = 'SELECT_SET';
export const REMOVE_FROM_SET = 'REMOVE_FROM_SET';
export const CHANGE_SORTING = 'CHANGE_SORTING';
export const CHANGE_LAYOUT_ALGORITHM = 'CHANGE_LAYOUT_ALGORITHM';
export const CHANGE_CLUSTER_ALGORITHM = 'CHANGE_CLUSTER_ALGORITHM';
export const TOGGLE_HIGHLIGHT_ENTITIES = 'TOGGLE_HIGHLIGHT_ENTITIES';
export const TOGGLE_SHOW_AD = 'TOGGLE_SHOW_AD';
export const CHANGE_AD_SIZE = 'CHANGE_AD_SIZE';
export const CHANGE_SKELETON_LAYOUT_PARAMETER = 'CHANGE_SKELETON_LAYOUT_PARAMETER';
export const CHANGE_CLUSTER_PARAMETER = 'CHANGE_CLUSTER_PARAMTER';

// Inspector
export const TOGGLE_INSPECTOR = 'TOGGLE_INSPECTOR';
export const ADD_TREE_TO_INSPECTOR = 'ADD_TO_INSPECTOR';
export const REMOVE_TREE_FROM_INSPECTOR = 'REMOVE_TREE_FROM_INSPECTOR';
export const TOGGLE_PAIRWISE_COMPARISON = 'TOGGLE_PAIRWISE_COMPARISON';
export const COMPARE_WITH_REFERENCE = 'COMPARE_WITH_REFERENCE';

// Attribute Explorer
export const CHANGE_ATTRIBUTE_EXPLORER_MODE = 'CHANGE_ATTRIBUTE_EXPLORER_MODE';
export const MOVE_CONTROL_HANDLE = 'MOVE_CONTROL_HANDLE';
export const TOGGLE_MOVE_HANDLE = 'TOGGLE_MOVE_HANDLE';
export const CHANGE_SELECTION_RANGE = 'CHANGE_SELECTION_RANGE';
export const TOGGLE_HISTOGRAM_OR_CDF = 'TOGGLE_HISTOGRAM_OR_CDF';
export const CHANGE_ACTIVE_RANGE_SELECTION = 'CHANGE_ACTIVE_RANGE_SELECTION';
export const CHANGE_ACTIVE_EXPANDED_BRANCH = 'CHANGE_ACTIVE_EXPANDED_BRANCH';
export const CHANGE_ACTIVE_COLLECTION = 'CHANGE_ACTIVE_COLLECTION';
export const TOGGLE_CBAE_COLLAPSE = 'TOGGLE_CBAE_COLLAPSE';

// Tree list
export const TOGGLE_TREE_LIST_COLLAPSE = 'TOGGLE_TREE_LIST_COLLAPSE';


// Global
// export const TOGGLE_JACCARD_MISSING = 'TOGGLE_JACCARD_MISSING';
export const CLOSE_TOAST = 'CLOSE_TOAST';


// Taxa List
export const TOGGLE_TAXA_LIST = 'TOGGLE_TAXA_LIST';
export const TOGGLE_SELECT_TAXA = 'TOGGLE_SELECT_TAXA';


// Tree Distribution
export const TOGGLE_SHOW_SUBSET_DISTRIBUTION = 'TOGGLE_SHOW_SUBSET_DISTRIBUTION';
export const TOGGLE_HIGHLIGHT_TREES = 'TOGGLE_HIGHLIGHT_TREES';
export const TOGGLE_TREE_DISTRIBUTION_COLLAPSE = 'TOGGLE_TREE_DISTRIBUTION_COLLAPSE';

export const TOGGLE_BIP_DISTRIBUTION_COLLAPSE = 'TOGGLE_BIP_DISTRIBUTION_COLLAPSE';
export const TOGGLE_HIGHLIGHT_SEGMENT = 'TOGGLE_HIGHLIGHT_SEGMENT';

export const TOGGLE_TD_EXTENDED_MENU = 'TOGGLE_TD_EXTENDED_MENU';
export const TOGGLE_TAXA_MEMBERSHIP_VIEW = 'TOGGLE_TAXA_MEMBERSHIP_VIEW';


// Global Toolkit
export const CLEAR_SELECTED_TREES = 'CLEAR_SELECTED_TREES';

export const DOWNLOAD_SELECTED_TREES_REQUEST = 'DOWNLOAD_SELECTED_TREES_REQUEST';
export const DOWNLOAD_SELECTED_TREES_SUCCESS = 'DOWNLOAD_SELECTED_TREES_SUCCESS';
export const DOWNLOAD_SELECTED_TREES_FAILURE = 'DOWNLOAD_SELECTED_TREES_FAILURE';
export const FINISH_DOWNLOAD_SELECTED_TREES = 'FINISH_DOWNLOAD_SELECTED_TREES';

export const DOWNLOAD_CONSENSUS_TREE = 'DOWNLOAD_CONSENSUS_TREE';
