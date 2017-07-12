/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import * as TYPE from './actionTypes';
import BitSet from 'bitset.js';
import {getCoordinates, createMappingFromArray, guid, mergeArrayToMapping, mergeMappingToArray} from './utils';
// import BipartitionList from './bipartitions';
import {getGSF, getEntitiesByBid, prepareBranches, findMissing, findEntities, getAllCB, getVirtualBid} from './tree';

let initialState = {
    isFetching: false,
    isFetchFailed: false,
    inputGroupData: null,
    // bipartitions: {},
    datasets: [],
    toast: {
        msg: null,
    },
    cb: 'cb2',                      // 'cb' means match with missing taxa, 'cb2' w/o
    inspector: {
        show: false,
        pairwiseComparison: null,
        highlight: {
            direction: null,    // can be 'lr' or 'rl' meaning from left to right, or right to left
            monophyly: null,
            entities: null
        },
        tids: [],
    },
    dendrogramSpec: {
        // width: 500,
        defaultTopologyWidth: 300,
        height: 840,
        margin: {left: 5, right: 5, top: 10, bottom: 0},
        marginOnEntity: 8,
        boundingBoxSideMargin: 5,
        minLabelWidth: 40,
        labelUnitCharWidth: 4.5,          // an estimate of the width of a character in the label
        labelWidth: 150,                // default max width for the label
        responsiveAreaSize: 7,          // height of a transparent box over a branch to trigger interaction
        unitBranchLength: 10,            // When using a unit length for branch in regardless of the length of the branch in the original dataset
                                        //      used in pairwise comparison to save space
        minBranchLength: 3,              // the minimum length of a branch in pixel
        comparingTopologyWidth: 200,
        comparingLabelWidth: 100
    },
    referenceTree: {
        id: null,
        checkingBranchTid: null,
        checkingBranch: null,           // the branch that is being displayed in details
        expanded: {},
        userSpecified: {},              // mapping of the user specified taxa group pool, from bid to letter
        userSpecifiedByGroup: {},       // reverse mapping of the above, maintain this for performance
        isFetching: false,
        highlightEntities: [],          // highlighted by the blocks in the aggregated dendrograms
        highlightUncertainEntities: [],
        universalBranchLen: false,
        extendedMenu: {
            bid: null,                  // The bid of the extensive menu that is triggered by
            x: null,
            y: null,
        },

        charts: {
            show: true,
            float: false,
            floatPosition: {left: 500, top: 100},
            attributes: [
                {propertyName: 'support', displayName: 'support'},
                {propertyName: 'gsf', displayName: '%exact match (GSF)'}],
            activeSelectionId: 0,
            selection: [
                {isMoving: false, range: [0.6, 0.9], attribute: 'support'},
                {isMoving: false, range: [0, 1], attribute: 'gsf'},
            ]
        },
        tooltip: [             // for showing a tooltip of branch attributes of the current focal branch
            {attribute: 'support', accessor: b => b.hasOwnProperty('support')? Math.floor(b.support * 100): 'NA' },
            {attribute: '% exact match', accessor: b => b.hasOwnProperty('gsf')? Math.floor(b.gsf * 100) + '%': 'NA' }
        ],
    },
    highlight: {
        // colorScheme: scaleOrdinal(schemeCategory10),
        colorScheme: ["#3366cc", "#ff9900", "#109618", "#dd4477", "#0099c6", "#dd4477" ],
        limit: 5,
        currentColor: 0,
        bids: [],
        colors: (new Array(5)).fill(false),
    },
    pairwiseComparison: {
        tid: null,
    },
    sets: [],
    overview: {
        coordinates: [],
        metricMode: 'global',
        metricBranch: null,
        createWindow: false,
        currentTitle: '',
        dotplotSize: 0,
        isSelecting: false,
        selectingArea: null
    },
    selectedTrees: {},
    consensusTrees: null,
    hoveredTrees: {},
    aggregatedDendrogram: {
        activeSetIndex: 0,
        mode: 'frond',            // topo-cluster, taxa-cluster, supercluster, remainder, fine-grained, frond
        spec: {
            size: 80,
            margin: {left: 6, top: 6, right: 6, bottom: 6},
            verticalGap: 5,
            branchLen: 6,
            leaveHeight: 4,
            leaveHighlightWidth: 16,
            proportionTopMargin: 4,
            proportionBarHeight: 10,
            frondLeafGap: 5,
            frondLeafAngle: Math.PI / 4,
            frondBaseLength: 14,
            nestMargin: 4,
        },
        order: 'RF',                    // It can be RF or a branch ID
        shadedHistogram: {
            granularity: 1,
            binsFunc: width => Math.floor(width / 1),
            // kernel: x => Math.pow(Math.E, -50*x*x)
            // kernel: x => x < 0? Math.pow(Math.E, -0.1*x*x): Math.pow(Math.E, -50*x*x)
            kernel: x => x < 0? Math.E: Math.pow(Math.E, -50*x*x)
        }
    },
    attributeChartSpec: {
        width: 154,
        chartHeight: 50,
        sliderHeight: 18,
        margin: {left: 25, right: 8, top: 20, bottom: 2}
    },
    cbAttributeExplorer: {
        activeExpandedBid: null,
        attributes: [
            {propertyName: 'support', displayName: 'support'},
            {propertyName: 'similarity', displayName: 'similarity'}],
        selection: [
            {isMoving: false, range: [0, 1], attribute: 'support'},       // for the support in the corresponding branches section
            {isMoving: false, range: [0, 1], attribute: 'similarity'},   // for the similarity in the cb section
            ],
        activeSelectionId: null,
    },
    treeList: {
        collapsed: true
    },
    taxaList: {
        show: false,
        position: {left: 400, top: 10},
        selected: {}
    },
    treeDistribution: {
        collapsed: false,
        showSubsets: false,
        tooltipMsg: null,
    },
    // bipartitionDistribution: {
    //     collapsed: true,
    //     tooltipMsg: null,
    // }
};



let subCollectionGlyphs = ['circle', 'plus', 'triangle-right', 'square', 'diamond'];
let getAvailableGlyph = sets => {
    if (!sets || sets.length == 0) return subCollectionGlyphs[0];
    for (let i = 0; i < subCollectionGlyphs.length; i++) {
        let j;
        for (j = 0; j < sets.length; j++) {
            if (sets[j].glyph === subCollectionGlyphs[i]) break;
        }
        if (j === sets.length) return subCollectionGlyphs[i];
    }
    return null;
};


let getTreeByTid = (state, tid) => {
    return tid === state.referenceTree.id? state.inputGroupData.referenceTree: state.inputGroupData.trees[tid];
};

let getNewGroupID = (exps, backward=false) => {
    let usedID = {};
    for (let bid in exps) if (exps.hasOwnProperty(bid))
        usedID[exps[bid]] = true;
    for (let i = 0; i < 26; i++) {
        let id = String.fromCharCode(backward? 90 - i: i + 65);
        if (!usedID.hasOwnProperty(id)) return id;
    }
    return 'BOOM';
};


// Search the {tid, bid} in the bids data structure to locate the highlight group
// Return the index if found, -1 is not found,
let findHighlight = (bids, tid, bid) => {
    for (let i = 0; i < bids.length; i++) {
        let h = bids[i];
        if (h.src === tid || h.tgt === tid) {
            if (Array.isArray(bid)) {
                // Check if the two arrays are the same
                let temp = createMappingFromArray(h[tid]);
                let found = true;
                for (let j = 0; j < bid.length; j++) {
                    if (!temp.hasOwnProperty(bid[i])) {
                        found = false;
                        break;
                    }
                }
                if (found) return i;
            } else if (h[tid].indexOf(bid) !== -1) {
                return i;
            }
        }
    }
    return -1;
};

let findHighlightByVirtualBid = (bids, tid, virtualBid) => {
    for (let i = 0; i < bids.length; i++) {
        let h = bids[i];
        if ((h.src === tid || h.tgt === tid) && (h.virtualBid === virtualBid)) {
            return i;
        }
    }
    return -1;
};

let removeHighlightGroup = (highlight, idx) => ({
    ...highlight,
    colors: highlight.colors.map((c, i) => i === highlight.bids[idx].color? false: c),
    bids: highlight.bids.filter((_, i) => i !== idx),
});

let getNextColor = (colors) => {
    for (let i = 0; i < colors.length; i++) {
        if (!colors[i]) return i;
    }
    return -1;
};

let addHighlightGroup = (state, action, updateGroupIdx=null) => {
    let otherTid = action.tid === state.referenceTree.id? state.pairwiseComparison.tid: state.referenceTree.id;
    let tgtEntities = action.targetEntities || getEntitiesByBid(getTreeByTid(state, action.tid), action.bid);
    let bids;

    if (otherTid) {
        bids = findEntities(tgtEntities, getTreeByTid(state, otherTid));
    }

    // create a new highlight group
    let newHighlightGroup = {
        src: action.tid, tgt: otherTid, [action.tid]: action.bids || [action.bid], entities: tgtEntities,
    };
    if (otherTid) {
        newHighlightGroup[otherTid] = bids;
    }
    if (action.virtualBid) {
        newHighlightGroup.virtualBid = action.virtualBid;
    }

    let nextColor;
    if (updateGroupIdx !== null && updateGroupIdx >= 0) {
        newHighlightGroup.color = state.highlight.bids[updateGroupIdx].color;
        return {
            ...state.highlight,
            bids: state.highlight.bids.map((v, i) => i === updateGroupIdx? newHighlightGroup: v)
        }
    } else if (state.highlight.bids.length < state.highlight.limit) {
        nextColor = getNextColor(state.highlight.colors);
        newHighlightGroup.color = nextColor;
        return {
            ...state.highlight,
            bids: [...state.highlight.bids, newHighlightGroup],
            colors: state.highlight.colors.map((c, i) => i === nextColor? true: c)
        }
    } else {
        nextColor = state.highlight.bids[0].color;
        newHighlightGroup.color = nextColor;
        return {
            ...state.highlight,
            // remove the last recent added group
            bids: [...state.highlight.bids.slice(1), newHighlightGroup],
        }
    }
};


function visphyReducer(state = initialState, action) {
    let newBids, newColors, curAE, updatedSelection, highlightIdx, newHighlights, newUS, newUSGroup, newUSByGroup, newReferenceTree;
    switch (action.type) {
        case TYPE.TOGGLE_HIGHLIGHT_MONOPHYLY:
            // Check if this branch is already highlighted
            highlightIdx = findHighlight(state.highlight.bids, action.tid, action.bid);
            // if (highlightIdx === -2) {
            //     // do not cancel or add, signal to the user
            //     return {
            //         ...state,
            //         referenceTree: {
            //             ...state.referenceTree,
            //             extendedMenu: {
            //                 bid: null,
            //             }
            //         },
            //         toast: {
            //             msg: 'This monophyly is already highlighted.  If you want to undo the highlight, ' +
            //             'please click the monophyly that triggers this highlight (the one with silhouette)'
            //         }
            //     }
            // } else
            if (highlightIdx !== -1) {
                // cancel highlight
                return {
                    ...state,
                    referenceTree: {
                        ...state.referenceTree,
                        extendedMenu: {
                            bid: null
                        }
                    },
                    highlight: removeHighlightGroup(state.highlight, highlightIdx)
                };
            } else {
                return {
                    ...state,
                    referenceTree: {
                        ...state.referenceTree,
                        extendedMenu: {
                            bid: null
                        }
                    },
                    highlight: addHighlightGroup(state, action)
                };
            }
            return state;
        case TYPE.TOGGLE_CHECKING_BRANCH:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    checkingBranch: action.bid,
                    checkingBranchTid: action.tid
                }
            };
        case TYPE.TOGGLE_UNIVERSAL_BRANCH_LENGTH:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    universalBranchLen: !state.referenceTree.universalBranchLen
                }
            };

        case TYPE.SELECT_BRANCH:
            let newExpanded = {...state.referenceTree.expanded};
            let newActiveEB = state.cbAttributeExplorer.activeExpandedBid;
            newHighlights = state.highlight;
            highlightIdx = findHighlight(state.highlight.bids, state.referenceTree.id, action.bid);
            if (newExpanded.hasOwnProperty(action.bid)) {
                delete newExpanded[action.bid];
                if (highlightIdx >= 0) {
                    // cancel the highlight
                    newHighlights = removeHighlightGroup(state.highlight, highlightIdx);
                }
                if (newActiveEB === action.bid) {
                    // Pick a random one from the eb list
                    if (Object.keys(newExpanded).length > 0) {
                        newActiveEB = Object.keys(newExpanded)[0];
                    } else {
                        newActiveEB = null;
                    }
                }
            } else {
                newExpanded[action.bid] = getNewGroupID(newExpanded, false);
                if (highlightIdx === -1) {
                    newHighlights = addHighlightGroup(state, {tid: state.referenceTree.id, bid: action.bid})
                }
                newActiveEB = action.bid;
            }
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    expanded: newExpanded,
                    extendedMenu: {
                        bid: null
                    }
                },
                highlight: newHighlights,
                cbAttributeExplorer: {
                    ...state.cbAttributeExplorer,
                    activeExpandedBid: newActiveEB,
                    activeSelectionId: newActiveEB === state.cbAttributeExplorer.activeExpandedBid?
                        state.cbAttributeExplorer.activeSelectionId: null
                },
            });
        case TYPE.EXPAND_USER_SPECIFIED_TAXA_GROUP:
            newExpanded = {...state.referenceTree.expanded};
            let virtualBid = getVirtualBid(action.group);
            highlightIdx = findHighlightByVirtualBid(state.highlight.bids, state.referenceTree.id, virtualBid);

            if (action.collapse) {
                // Clear the expansion
                delete newExpanded[virtualBid];
                newHighlights = highlightIdx >= 0? removeHighlightGroup(state.highlight, highlightIdx): state.highlight;
                newReferenceTree = {
                    ...state.inputGroupData.referenceTree,
                    branches: {
                        ...state.inputGroupData.referenceTree.branches,
                    }
                };
                delete newReferenceTree.branches[virtualBid];
            } else {
                newExpanded[virtualBid] = action.group;
                // Compile a list of all taxa in that taxa group and construct a virtual branch of these taxa
                let bids = state.referenceTree.userSpecifiedByGroup[action.group];
                let entities = bids.reduce((acc, bid) => (acc.concat(state.inputGroupData.referenceTree.branches[bid].entities)), []);

                newReferenceTree = {
                    ...state.inputGroupData.referenceTree,
                    branches: {
                        ...state.inputGroupData.referenceTree.branches,
                        [virtualBid]: {
                            entities,
                        }
                    }
                };
                let cbData = getAllCB(newReferenceTree, virtualBid, state.inputGroupData.trees, false);
                Object.assign(newReferenceTree.branches[virtualBid], cbData);

                // In case the taxa group is previously highlighted but now it got changed
                newHighlights = addHighlightGroup(state, {tid: state.referenceTree.id, bids, targetEntities: entities, virtualBid}, highlightIdx);
            }

            return {
                ...state,
                inputGroupData: {
                    ...state.inputGroupData,
                    referenceTree: newReferenceTree,
                },
                referenceTree: {
                    ...state.referenceTree,
                    expanded: newExpanded,
                    extendedMenu: {
                        bid: null
                    }
                },
                highlight: newHighlights,
            };

        case TYPE.CLEAR_ALL_SELECTION_AND_HIGHLIGHT:
            return Object.assign({}, state, {
                referenceTree: {
                    ...state.referenceTree,
                    expanded: {},
                    userSpecified: {},
                    userSpecifiedByGroup: {},
                    charts: {
                        ...state.referenceTree.charts,
                        activeSelectionId: null
                    }
                },
                highlight: {
                    ...state.highlight,
                    bids: [],
                    colors: (new Array(state.highlight.limit)).fill(false)
                },
                cbAttributeExplorer: {
                    ...state.cbAttributeExplorer,
                    activeExpandedBid: null,
                    activeSelectionId: null
                },
                selectedTrees: {},
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    treeOrder: {
                        ...state.aggregatedDendrogram.treeOrder,
                        static: true
                    }
                }
            });
        case TYPE.TOGGLE_HIGHLIGHT_DUPLICATE:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    highlightEntities: action.e? [action.e]: []
                }
            };
        case TYPE.REROOT_REQUEST:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    extendedMenu: {
                        bid: null
                    }
                },
                toast: {
                    ...state.toast,
                    msg: 'Re-rooting...',
                }
            };
        case TYPE.REROOT_SUCCESS:
            return {
                ...state,
                inputGroupData: {
                    ...state.inputGroupData,
                    referenceTree: {
                        ...action.data,
                        branches: getGSF(action.data.branches, state.cb, Object.keys(state.inputGroupData.trees).length, false)
                    }
                },
                toast: {
                    ...state.toast,
                    msg: null
                }
            };
        case TYPE.REROOT_FAILURE:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: action.error
                }
            };
        case TYPE.CREATE_USER_SPECIFIED_TAXA_GROUP:
            let newGroupId = getNewGroupID(state.referenceTree.userSpecified, true);
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    userSpecified: {
                        ...state.referenceTree.userSpecified,
                        [action.bid]: newGroupId,
                    },
                    userSpecifiedByGroup: {
                        ...state.referenceTree.userSpecifiedByGroup,
                        [newGroupId]: [action.bid]
                    },
                    extendedMenu: {
                        ...state.referenceTree.extendedMenu,
                        bid: null,
                    }
                }
            };
        case TYPE.ADD_TO_USER_SPECIFIED_TAXA_GROUP:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    userSpecified: {
                        ...state.referenceTree.userSpecified,
                        [action.bid]: action.group
                    },
                    userSpecifiedByGroup: {
                        ...state.referenceTree.userSpecifiedByGroup,
                        [action.group]: [...state.referenceTree.userSpecifiedByGroup[action.group], action.bid]
                    },
                    extendedMenu: {
                        ...state.referenceTree.extendedMenu,
                        bid: null,
                    }
                }
            };
        case TYPE.REMOVE_FROM_USER_SPECIFIED_TAXA_GROUP:
            newUS = {...state.referenceTree.userSpecified};
            delete newUS[action.bid];
            // The triggered aciton ensures that the group has more than one branch, so the newUSGroup would NOT be empty
            newUSGroup = state.referenceTree.userSpecifiedByGroup[action.group].filter(bid => bid !== action.bid);
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    userSpecified: newUS,
                    userSpecifiedByGroup: {
                        ...state.referenceTree.userSpecifiedByGroup,
                        [action.group]: newUSGroup
                    },
                    extendedMenu: {
                        ...state.referenceTree.extendedMenu,
                        bid: null,
                    }
                }
            };
        case TYPE.REMOVE_USER_SPECIFIED_TAXA_GROUP:
            newUS = {};
            for (let bid in state.referenceTree.userSpecified)
                if (state.referenceTree.userSpecified.hasOwnProperty(bid) && state.referenceTree.userSpecified[bid] !== action.group) {
                    newUS[bid] = state.referenceTree.userSpecified[bid];
                }
            newUSByGroup = {...state.referenceTree.userSpecifiedByGroup};
            delete newUSByGroup[action.group];

            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    userSpecified: newUS,
                    userSpecifiedByGroup: newUSByGroup,
                    extendedMenu: {
                        ...state.referenceTree.extendedMenu,
                        bid: null,
                    }
                }
            };

        case TYPE.POP_CREATE_NEW_SET_WINDOW:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    createWindow: true,
                    currentTitle: `Sub-collection ${state.sets.length}`
                }
            });
        case TYPE.CLOSE_CREATE_NEW_SET_WINDOW:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    createWindow: false
                }
            });
        case TYPE.CREATE_NEW_SET:
            let newSetIndex = state.sets.length;
            // TODO: LIMIT the number of sub-collections!
            if (newSetIndex > 4) {
                return {
                    ...state,
                    overview: {
                        ...state.overview,
                        currentTitle: '',
                        createWindow: false
                    },
                    toast: {
                        ...state.toast,
                        msg: 'Maximum number of sub-collection exceeded.  Please try to remove a sub-collection before creating a new one.'
                    }
                }
            }
            return Object.assign({}, state, {
                sets: [...state.sets, {
                    sid: guid(),
                    title: state.overview.currentTitle,
                    tids: Object.keys(state.selectedTrees),
                    glyph: getAvailableGlyph(state.sets)
                }],
                overview: {
                    ...state.overview,
                    currentTitle: '',
                    createWindow: false
                },
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeSetIndex: newSetIndex
                }
            });
        case TYPE.TYPING_TITLE:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    currentTitle: action.value
                }

            });
        case TYPE.ADD_TO_SET:
            return Object.assign({}, state, {
                sets: state.sets.map((s, i) => i !== action.sid? s: {...s, tids: mergeMappingToArray(s.tids, state.selectedTrees).slice()}),
            });
        case TYPE.REMOVE_SET:
            return Object.assign({}, state, {
                sets: state.sets.filter((s, i) => i !== action.setIndex),
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeSetIndex: 0,
                    activeTreeId: null
                }
            });

        case TYPE.START_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    isSelecting: true,
                    dotplotSize: action.size,
                    selectionArea: {x1: action.x, y1: action.y, x2: action.x, y2: action.y}
                }
            });
        case TYPE.END_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    isSelecting: false,
                },
                selectedTrees: createMappingFromArray(action.tids)
            });
        case TYPE.CHANGE_SELECTION:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    selectionArea: {...state.overview.selectionArea, x2: action.x, y2: action.y }
                }
            });
        case TYPE.CHANGE_DISTANCE_METRIC_REQUEST:
            return {
                ...state,
                overview: {
                    ...state.overview,
                    metricMode: action.mode,
                    metricBranch: action.mode === 'local'? action.bid: state.overview.metricBranch,
                },
                toast: {
                    ...state.toast,
                    msg: 'Calculating overview...'
                },
                referenceTree: {
                    ...state.referenceTree,
                    extendedMenu: {
                        bid: null,
                    }
                }
            };
        case TYPE.CHANGE_DISTANCE_METRIC_SUCCESS:
            return {
                ...state,
                overview: {
                    ...state.overview,
                    coordinates: action.coordinates,
                },
                toast: {...state.toast, msg: null}
            };
        case TYPE.CHANGE_DISTANCE_METRIC_FAILURE:
            return {
                ...state,
                overview: {
                    ...state.overview,
                },
                toast: {
                    ...state.toast,
                    msg: action.error.toString()
                }
            };


        case TYPE.SELECT_SET:
            return Object.assign({}, state, {
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeSetIndex: action.setIndex
                }
            });
        case TYPE.REMOVE_FROM_SET:
            return Object.assign({}, state, {
                sets: state.sets.map((s, i) => i !== action.setIndex? s: {...s, tids: s.tids.filter(tid => action.tids.indexOf(tid) === -1)}),
            });
        case TYPE.CHANGE_SORTING:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    order: action.order
                }
            };
        case TYPE.TOGGLE_AGGREGATION_MODE:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    mode: action.mode,
                }
            };
        case TYPE.TOGGLE_HIGHLIGHT_ENTITIES:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    highlightEntities: action.entities,
                    highlightUncertainEntities: action.uncertainEntities
                }
            };


        case TYPE.TOGGLE_INSPECTOR:
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    show: !state.inspector.show
                }
            };
        case TYPE.ADD_TREE_TO_INSPECTOR:
            // Find out whether the tree is already in the inspector
            let oldTrees = state.inspector.tids;
            let found = oldTrees.indexOf(action.tid);
            let newTrees;
            if (found !== -1) {
                // Bring that tree to the leftmost
                newTrees = [oldTrees[found], ...oldTrees.slice(0, found), ...oldTrees.slice(found+1)];
            } else {
                newTrees = [action.tid, ...oldTrees];
            }
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    show: true,
                    tids: newTrees,
                    pairwiseComparison: null
                }
            };
        case TYPE.REMOVE_TREE_FROM_INSPECTOR:
            let idxOfTree = state.inspector.tids.indexOf(action.tid);
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    pairwiseComparison: state.inspector.pairwiseComparison === idxOfTree || state.inspector.pairwiseComparison === idxOfTree + 1?
                        null: state.inspector.pairwiseComparison,
                    tids: state.inspector.tids.filter(t => t !== action.tid)
                }
            };
        case TYPE.TOGGLE_PAIRWISE_COMPARISON:
            return {
                ...state,
                inspector: {
                    ...state.inspector,
                    pairwiseComparison: action.p
                }
            };
        case TYPE.COMPARE_WITH_REFERENCE:
            if (action.tid) {
                // Entering pairwise comparison mode
                newBids = state.highlight.bids.map(h => (
                    {...h, tgt: action.tid,
                        [action.tid]: findEntities(getEntitiesByBid(getTreeByTid(state, h.src), h.virtualBid || h[h.src][0]),
                            getTreeByTid(state, action.tid))}
                ));
                newColors = state.highlight.colors;
            } else {
                // Exiting
                // Remove highlight groups who do not trigger that highlight
                newColors = state.highlight.colors.slice();
                newBids = state.highlight.bids.filter(h => {
                    if (h.src !== state.referenceTree.id) {
                        newColors[h.color] = false;     // If this group is to be removed, recycle the color
                        return false;
                    }
                    return true;
                });
            }
            return {
                ...state,
                pairwiseComparison: {
                    ...state.pairwiseComparison,
                    tid: action.tid,
                },
                highlight: {
                    ...state.highlight,
                    bids: newBids,
                    colors: newColors
                }
            };

        case TYPE.TOGGLE_MOVE_HANDLE:
            curAE = action.isRef? state.referenceTree.charts: state.cbAttributeExplorer;
            updatedSelection = curAE.selection.map((s, i) => i === curAE.activeSelectionId?
                                {...s, isMoving: action.handle? true: false, movingHandle: action.handle}: s);
            if (action.isRef) {
                return {
                    ...state,
                    referenceTree: {
                        ...state.referenceTree,
                        charts: {
                            ...state.referenceTree.charts,
                            selection: updatedSelection
                        }
                    }
                }
            } else {
                return {
                    ...state,
                    cbAttributeExplorer: {
                        ...state.cbAttributeExplorer,
                        selection: updatedSelection
                    }
                };
            }
        case TYPE.MOVE_CONTROL_HANDLE:
            curAE = action.isRef? state.referenceTree.charts: state.cbAttributeExplorer;
            let sel = curAE.selection[curAE.activeSelectionId];
            let newRange;
            if (sel.movingHandle === 'left') {
                newRange = [Math.min(action.value, sel.range[1]), sel.range[1]];
            } else {
                newRange = [sel.range[0], Math.max(action.value, sel.range[0])];
            }
            updatedSelection = curAE.selection.map((s, i) => i === curAE.activeSelectionId? {...s, range: newRange}: s);

            if (action.isRef) {
                return {
                    ...state,
                    referenceTree: {
                        ...state.referenceTree,
                        charts: {
                            ...state.referenceTree.charts,
                            selection: updatedSelection
                        }
                    }
                }
            } else {
                return {
                    ...state,
                    cbAttributeExplorer: {
                        ...state.cbAttributeExplorer,
                        selection: updatedSelection
                    }
                };
            }
        case TYPE.CHANGE_ACTIVE_RANGE_SELECTION:
            if (action.isRef) {
                return {
                    ...state,
                    referenceTree: {
                        ...state.referenceTree,
                        charts: {
                            ...state.referenceTree.charts,
                            activeSelectionId: action.id
                        }
                    }
                }
            } else {
                return {
                    ...state,
                    cbAttributeExplorer: {
                        ...state.cbAttributeExplorer,
                        activeSelectionId: action.id,
                    }
                };
            }
        case TYPE.CHANGE_SELECTION_RANGE:
            curAE = action.isRef? state.referenceTree.charts: state.cbAttributeExplorer;
            updatedSelection = curAE.selection.map((s, i) => i === action.sid? {...s, range: [action.l, action.r]}: s);
            if (action.isRef) {
                return {
                    ...state,
                    referenceTree: {
                        ...state.referenceTree,
                        charts: {
                            ...state.referenceTree.charts,
                            selection: updatedSelection,
                            activeSelectionId: action.sid
                        }
                    }
                }
            } else {
                return {
                    ...state,
                    cbAttributeExplorer: {
                        ...state.cbAttributeExplorer,
                        selection: updatedSelection,
                        activeSelectionId: action.sid
                    }
                };
            }
        case TYPE.CHANGE_ACTIVE_EXPANDED_BRANCH:
            return {
                ...state,
                cbAttributeExplorer: {
                    ...state.cbAttributeExplorer,
                    activeExpandedBid: action.bid
                }
            };

        case TYPE.FETCH_INPUT_GROUP_REQUEST:
            return Object.assign({}, state, {
                isFetching: true,
                toast: {
                    ...state.toast,
                    msg: 'Fetching data from server...'
                }
            });
        case TYPE.FETCH_INPUT_GROUP_SUCCESS:
            let newCB = action.data.hasMissingTaxa? 'cb2': 'cb';
            for (let tid in action.data.trees) if (action.data.trees.hasOwnProperty(tid)) {
                // action.data.trees[tid].tid = tid;
                action.data.trees[tid].branches = prepareBranches(action.data.trees[tid].branches,
                    action.data.trees[tid].rootBranch, action.data.supportRange);
                action.data.trees[tid].missing = findMissing(action.data.trees[tid], action.data.entities);
            }
            action.data.referenceTree.branches =
                getGSF(prepareBranches(action.data.referenceTree.branches, action.data.referenceTree.rootBranch, action.data.supportRange),
                    newCB, Object.keys(action.data.trees).length);
            action.data.referenceTree.missing = findMissing(action.data.referenceTree, action.data.entities);

            return Object.assign({}, state, {
                isFetching: false,
                inputGroupData: action.data,
                // bipartitions: new BipartitionList(action.data.referenceTree, action.data.trees, action.data.entities),
                toast: {
                    ...state.toast,
                    msg: null
                },
                referenceTree: {
                    ...state.referenceTree,
                    id: action.data.referenceTree.tid,
                    charts: {
                        ...state.referenceTree.charts,
                        attributes: state.referenceTree.charts.attributes.slice(!!action.data.supportRange? 0: 1),
                        selection: state.referenceTree.charts.selection.slice(!!action.data.supportRange? 0: 1)
                    },
                    tooltip: !!action.data.supportRange? state.referenceTree.tooltip:
                        [{attribute: 'support', accessor: b => 'NA'}, ...state.referenceTree.tooltip.slice(1)]
                },
                sets: [{
                    sid: guid(),
                    title: 'All Trees',
                    tids: Object.keys(action.data.trees),
                    glyph: getAvailableGlyph()
                }],
                overview: {
                    ...state.overview,
                    coordinates: getCoordinates(action.data.referenceTree, action.data.trees, newCB, true, null)
                },
                cb: newCB,
                cbAttributeExplorer: {
                    ...state.cbAttributeExplorer,
                    attributes: state.cbAttributeExplorer.attributes.slice(!!action.data.supportRange? 0: 1),
                    selection: state.cbAttributeExplorer.selection.slice(!!action.data.supportRange? 0: 1)
                }
            });
        case TYPE.FETCH_INPUT_GROUP_FAILURE:
            return Object.assign({}, state, {
                isFetchFailed: true,
                isFetching: false,
                toast: {
                    ...state.toast,
                    msg: 'Error fetching data from server: ' + action.error.toString()
                }
            });
        case TYPE.FETCH_DATASETS_REQUEST:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: 'Fetching dataset list from server...'
                }
            };
        case TYPE.FETCH_DATASETS_SUCCESS:
            return {
                ...state,
                datasets: action.data,
                toast: {
                    ...state.toast,
                    msg: null
                }
            };
        case TYPE.FETCH_DATASETS_FAILURE:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: 'Error fetching dataset list: ' + action.error.toString()
                }
            };
        case TYPE.TOGGLE_TREE_LIST_COLLAPSE:
            return {
                ...state,
                treeList: {
                    ...state.treeList,
                    collapsed: !state.treeList.collapsed
                }
            };
        case TYPE.TOGGLE_JACCARD_MISSING:
            // TODO if cb2 (cb when ignoring missing taxa) is not present, falls back to cb
            // This is a quick hack
            if (state.inputGroupData.inputGroupId === 1 && action.cb === 'cb2') {
                return state;
            }
            return {
                ...state,
                inputGroupData: {
                    ...state.inputGroupData,
                    trees: {
                        ...state.inputGroupData.trees,
                        [state.referenceTree.id]: {
                            ...state.inputGroupData.trees[state.referenceTree.id],
                            branches: getGSF(state.inputGroupData.trees[state.referenceTree.id].branches, action.cb, Object.keys(state.inputGroupData.trees).length - 1, true)
                        }
                    }
                },
                cb: action.cb,
                overview: {
                    ...state.overview,
                    coordinates: getCoordinates(state.inputGroupData.referenceTree, state.inputGroupData.trees, state.cb,
                        state.overview.metricMode === 'global' || state.overview.metricBranch == null, state.overview.metricBranch)
                }
            };
        case TYPE.CLOSE_TOAST:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: null
                }
            };
        case TYPE.TOGGLE_TAXA_LIST:
            return {
                ...state,
                taxaList: {
                    ...state.taxaList,
                    show: !state.taxaList.show
                }
            };
        case TYPE.TOGGLE_SELECT_TAXA:
            return {
                ...state,
                taxaList: {
                    ...state.taxaList,
                    selected: {...state.taxaList.selected, [action.e]: !state.taxaList.selected[action.e]}
                }
            };

        case TYPE.TOGGLE_SHOW_SUBSET_DISTRIBUTION:
            return {
                ...state,
                treeDistribution: {
                    ...state.treeDistribution,
                    showSubsets: !state.treeDistribution.showSubsets
                }
            };
        case TYPE.TOGGLE_HIGHLIGHT_TREES:
            return {
                ...state,
                hoveredTrees: action.tids && action.tids.length? createMappingFromArray(action.tids): {},
                treeDistribution: action.isMsgForBip? state.treeDistribution: {
                    ...state.treeDistribution,
                    tooltipMsg: action.msg
                },
                // bipartitionDistribution: action.isMsgForBip? {
                //     ...state.treeDistribution,
                //     tooltipMsg: action.msg
                // }: state.bipartitionDistribution
            };
        case TYPE.TOGGLE_SELECT_TREES:
            // If select a different tree for pairwise comparison
            if (action.tids.length === 1 && state.pairwiseComparison.tid && state.pairwiseComparison.tid !== action.tids[0]
                && (!action.isAdd || action.isAdd && !Object.keys(state.selectedTrees).length)) {
                // Update data for pairwise comparison and highlights
                newColors = state.highlight.colors.slice();
                let comparingTid = action.tids[0];
                newBids = state.highlight.bids.filter(h => {
                    if (h.src !== state.referenceTree.id) {
                        newColors[h.color] = false;     // If this group is to be removed, recycle the color
                        return false;
                    }
                    return true;
                }).map(h => (
                    {...h, tgt: comparingTid,
                        [comparingTid]: findEntities(getEntitiesByBid(getTreeByTid(state, h.src), h.virtualBid || h[h.src][0]),
                            getTreeByTid(state, comparingTid))}
                ));
                return {
                    ...state,
                    selectedTrees: createMappingFromArray(action.tids),
                    pairwiseComparison: {
                        ...state.pairwiseComparison,
                        tid: comparingTid
                    },
                    highlight: {
                        ...state.highlight,
                        bids: newBids,
                        colors: newColors
                    }
                }
            }

            // If not for pairwise comparison
            return {
                ...state,
                selectedTrees: action.isAdd? {...mergeArrayToMapping(state.selectedTrees, action.tids)}: createMappingFromArray(action.tids)
            };
        case TYPE.TOGGLE_TREE_DISTRIBUTION_COLLAPSE:
            return {
                ...state,
                treeDistribution: {
                    ...state.treeDistribution,
                    collapsed: !state.treeDistribution.collapsed
                }
            };

        // case TYPE.TOGGLE_BIP_DISTRIBUTION_COLLAPSE:
        //     return {
        //         ...state,
        //         bipartitionDistribution: {
        //             ...state.bipartitionDistribution,
        //             collapsed: !state.bipartitionDistribution.collapsed
        //         }
        //     };

        case TYPE.CLEAR_SELECTED_TREES:
            return {
                ...state,
                selectedTrees: {}
            };

        case TYPE.TOGGLE_REFERENCE_TREE_ATTRIBUTE_EXPLORER:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    charts: {
                        ...state.referenceTree.charts,
                        show: !state.referenceTree.charts.show
                    }
                }
            };

        case TYPE.TOGGLE_POP_ATTRIBUTE_EXPLORER:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    charts: {
                        ...state.referenceTree.charts,
                        float: !state.referenceTree.charts.float
                    }
                }
            };
        case TYPE.TOGGLE_EXTENDED_MENU:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    extendedMenu: {
                        bid: action.bid,
                        x: action.x,
                        y: action.y + 10,
                    }
                }
            };

        case TYPE.MAKE_CONSENSUS_REQUEST:
            return {
                ...state,
                consensusTrees: BitSet(action.tids.map(tid => tid.substring(1))),
                toast: {
                    ...state.toast,
                    msg: `Building consensus tree for the selected trees (${action.tids.length}).`
                }
            };
        case TYPE.MAKE_CONSENSUS_SUCCESS:
            // Copy from the TYPE.COMPARE_WITH_REFERENCE
            let consensusTid = action.data.tid;
            newBids = state.highlight.bids.map(h => (
                {...h, tgt: consensusTid,
                    [consensusTid]: findEntities(getEntitiesByBid(getTreeByTid(state, h.src), h.virtualBid || h[h.src][0]),
                        getTreeByTid(state, consensusTid))}
            ));
            newColors = state.highlight.colors;
            return {
                ...state,
                inputGroupData: {
                    ...state.inputGroupData,
                    trees: {
                        ...state.inputGroupData.trees,
                        [action.data.tid]: {
                            ...action.data,
                            branches: prepareBranches(action.data.branches, action.data.rootBranch, [0, 1]),
                            missing: findMissing(action.data, state.inputGroupData.entities)
                        }
                    }
                },
                pairwiseComparison: {
                    ...state.pairwiseComparison,
                    tid: consensusTid
                },
                highlight: {
                    ...state.highlight,
                    bids: newBids,
                    colors: newColors
                },
                toast: {
                    ...state.toast,
                    msg: null
                }
            };
        case TYPE.MAKE_CONSENSUS_FAILURE:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: 'Failed to build consensus tree: ' + action.error.toString()
                }
            };
        case TYPE.TOGGLE_HIGHLIGHT_SEGMENT:
            // This is actually combination of HIGHLIGHT_TREES and HIGHLIGHT_ENTITIES
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    highlightEntities: action.entities,
                },
                hoveredTrees: action.tids && action.tids.length? createMappingFromArray(action.tids): {},
                treeDistribution: {
                    ...state.treeDistribution,
                    tooltipMsg: action.tooltipMsg
                },
            };

        default:
            return state;

    }
}


export default visphyReducer;