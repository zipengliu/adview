/**
 * Created by Zipeng Liu on 2016-11-06.
 */

import * as TYPE from './actionTypes';
import BitSet from 'bitset.js';
import {getCoordinates, createMappingFromArray, guid, mergeArrayToMapping, mergeMappingToArray, getWindowHeight} from './utils';
// import BipartitionList from './bipartitions';
import {Tree, getVirtualBid, clusterTreesByBranch, getHighlightProportion, getSubsetDistribution,
    updateDistriutionHighlightCnt} from './tree';

let initialState = {
    user: {
        isAuthenticated: false,
        form: {
            username: '',
            password: '',
        },
        loginRequest: false,
        loginError: null
    },
    upload: {
        isProcessingEntities: false,
        uploadState: null,          // one of SENDING, RECEIVED, PENDING, PROGRESS, SUCCESS, FAILURE or null
        checkStatusRetry: 2,       // the number of times to retry if a check status request fail.  This should be reset on each upload outgroup request
        progress: null,
        checkStatusUrl: null,
        datasetUrl: null,
        formData: {
            title: '',
            description: '',
            isPublic: 'N',
            isReferenceRooted: 'N',
            isTCRooted: 'N',
            supportValues: 'NA'
        },
        outgroupTaxa: {}
    },
    isFetching: false,
    isFetchFailed: false,
    inputGroupData: null,
    // bipartitions: {},

    datasets: [],
    datasetRemoval: {
        id: null,
        showConfirmOption: false,
    },

    stretchedMainView: false,
    toast: {
        msg: null,
        downloadingTreeUrl: null,
    },
    cb: 'cb',
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
        margin: {left: 5, right: 5, top: 15, bottom: 0},
        marginOnEntity: 8,
        boundingBoxSideMargin: 5,
        labelUnitCharWidth: 4.5,            // an estimate of the width of a character in the label
        responsiveAreaSize: 7,              // height of a transparent box over a branch to trigger interaction
        unitBranchLength: 12,               // How long is a branch with normalized length 1
        minBranchLength: 5,
        uniformBranchLength: 10,            // How long is each branch when we do not encode branch length
        membershipViewerGap: 16,            // How wide for one column of membership indication marks
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
        showLegends: true,
        membershipViewer: [],

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
            {attribute: '% exact match', accessor: b => b.hasOwnProperty('gsf')? Math.floor(b.gsf * 100) + '%': 'NA' },
            {attribute: 'label', accessor: b => b.label || 'NA'}
        ],
    },
    highlight: {
        // colorScheme: scaleOrdinal(schemeCategory10),
        // colorScheme: ["#3366cc", "#ff9900", "#109618", "#dd4477", "#0099c6"],
        // colorScheme: ["#6699FF", "#ffb31a", "#2AB032", "#F75E91", "#1AB3E0"],
        // We de-saturated the first 5 colors from d3 category10() to get these colors
        colorScheme: ["#6BAAD6", "#FFA04C", "#52A052", "#D66B6C", "#A284BD"],
        limit: 5,
        currentColor: 0,
        bids: [],
        colors: (new Array(5)).fill(false),
    },
    selectedTreeColor: "#8a6c66",
    branchRangeSelectionColor: "#e377c2",
    pairwiseComparison: {
        tid: null,
    },
    sets: [],
    overview: {
        collapsed: false,
        coordinates: [],
        metricMode: 'global',
        metricBranch: null,
        createWindow: false,
        currentTitle: '',
        dotplotSize: 0,
        isSelecting: false,
        selectingArea: null,
    },
    selectedTrees: {},
    // A bitmap of which trees are being used to make the consensus, used for determining if this set of trees
    // gets modified (and notify the user if yes)
    consensusTrees: null,
    hoveredTrees: {},
    aggregatedDendrogram: {
        showCluster: true,
        showIndividual: true,
        activeSetIndex: 0,      // Show individual ADs of which sub-collection
        layoutAlg: 'skeleton',
        // clusterAlg: 'none',
        clusterParameter: {
            checkForExact: true,
            checkForSister: true,
        },
        showLegends: true,
        spec: {
            width: 80,
            height: 80,
            sizeRange: [30, 300],
            margin: {left: 6, top: 6, right: 6, bottom: 6},
            verticalGap: 3,
            branchLen: 6,
            leaveHeight: 4,
            leaveHighlightWidth: 16,
            proportionTopMargin: 4,
            proportionBarHeight: 10,
            missingCompressRatio: .6,
            showLabels: true,
            showColors: true,

            frondLayout: {
                frondLeafGap: 5,
                frondLeafAngle: Math.PI / 4,
                frondBaseLength: 14,
                nestMargin: 4,
            },
            containerLayout: {
                verticalGapRatio: .12,
            },
            skeletonLayout: {
                showDepth: 2,           // Granularity
                showDepthRange: [1, 5],
                collapsedBlockHeight: 6,
                collapsedBlockWidth: 20,
                matchedBlockMinHeight: 12,
                firstNestedBlockVerticalGap: 12,
                nestingBlockGapInside: 3,
                nestingBlockExtraWidth: 20,
                collapsedBranchLength: 16
            },
        },
        order: 'RF',                    // It can be RF or a branch ID
        shadedHistogram: {
            granularity: 1,
            binsFunc: width => Math.floor(width / 1),
            // kernel: x => Math.pow(Math.E, -50*x*x)
            // kernel: x => x < 0? Math.pow(Math.E, -0.1*x*x): Math.pow(Math.E, -50*x*x)
            kernel: x => x < 0? Math.E: Math.pow(Math.E, -50*x*x)
        },
    },
    attributeChartSpec: {
        width: 154,
        chartHeight: 50,
        sliderHeight: 18,
        margin: {left: 25, right: 8, top: 20, bottom: 2}
    },
    cbAttributeExplorer: {
        collapsed: false,
        activeExpandedBid: null,
        activeSetId: null,
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
        data: [{}],                 // Data structure for the tree distribution.  data[0] is for the whole collection, data[i] is for the ith sub-collection.
                                    // Each item in the data array is a mapping from bid to a segmentation of trees.
        extendedMenu: {
            bid: null,
            tid: null,
            x: null, y: null,
            viewerIndex: null,
        }
    },
    // bipartitionDistribution: {
    //     collapsed: true,
    //     tooltipMsg: null,
    // }
};



let subCollectionGlyphs = ['circle', 'plus', 'triangle-right', 'square', 'diamond'];
let getAvailableGlyph = sets => {
    if (!sets || sets.length === 0) return subCollectionGlyphs[0];
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

let getTreesBySelection = (state) => {
    let res = {};
    let corr = state.inputGroupData.referenceTree.branches[state.cbAttributeExplorer.activeExpandedBid][state.cb];
    let activeTids = state.sets[state.cbAttributeExplorer.activeSetId].tids;
    let selection = state.cbAttributeExplorer.selection[state.cbAttributeExplorer.activeSelectionId];
    for (let tid of activeTids) if (corr.hasOwnProperty(tid)) {
        let v;
        if (selection.attribute === 'similarity') {
            v = corr[tid].jac;
        } else {
            v = state.inputGroupData.trees[tid].branches[corr[tid].bid][selection.attribute];
        }
        if (selection.range[0] <= v && v <= selection.range[1]) {
            res[tid] = true;
        }
    }
    return res;
};

let addHighlightGroup = (state, action, updateGroupIdx=null, no=null) => {
    let otherTid = action.tid === state.referenceTree.id? state.pairwiseComparison.tid: state.referenceTree.id;
    let tgtEntities = action.targetEntities || getTreeByTid(state, action.tid).getEntitiesByBid(action.bid);
    let bids;

    if (otherTid) {
        bids = getTreeByTid(state, otherTid).findEntities(tgtEntities);
    }

    // create a new highlight group
    let newHighlightGroup = {
        src: action.tid, tgt: otherTid, [action.tid]: action.bids || [action.bid], entities: tgtEntities, no
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
        // Add a new highlight group
        nextColor = getNextColor(state.highlight.colors);
        newHighlightGroup.color = nextColor;
        return {
            ...state.highlight,
            bids: [...state.highlight.bids, newHighlightGroup],
            colors: state.highlight.colors.map((c, i) => i === nextColor? true: c)
        }
    } else {
        // Out of color limit
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
    let newBids, newColors, curAE, updatedSelection, highlightIdx, newHighlights, newUS, newUSGroup, newUSByGroup,
        newReferenceTree, newActiveEB;
    let newDistData, newSets, sub, newHoveredTrees, newSelectedTrees, newState;

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
                    highlight: addHighlightGroup(state, action, null,
                        action.tid === state.referenceTree.id? state.referenceTree.expanded[action.bid]: null)
                };
            }
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
            newActiveEB = state.cbAttributeExplorer.activeExpandedBid;
            newHighlights = state.highlight;
            highlightIdx = findHighlight(state.highlight.bids, state.referenceTree.id, action.bid);
            newDistData = state.treeDistribution.data.slice();
            let d;
            if (newExpanded.hasOwnProperty(action.bid)) {       // Cancel the match of this branch
                for (let i = 0; i < newDistData.length; i++) {
                    d = {...newDistData[i]};
                    delete d[action.bid];
                    newDistData[i] = d;
                }
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
            } else {                        // Find match for this branch
                let full = clusterTreesByBranch(state.inputGroupData.trees, state.inputGroupData.referenceTree, state.cb, action.bid);
                let subs = state.treeDistribution.showSubsets? getSubsetDistribution(full, state.sets, action.bid): null;
                for (let i = 0; i < newDistData.length; i++) {
                    d = i === 0? full: subs[i - 1];
                    d.highlightCnt = getHighlightProportion(d, state.hoveredTrees);
                    d.selectCnt = getHighlightProportion(d, state.selectedTrees);
                    newDistData[i] = {
                        ...newDistData[i],
                        [action.bid]: d
                    };
                }

                newExpanded[action.bid] = getNewGroupID(newExpanded, false);
                if (highlightIdx === -1) {
                    newHighlights = addHighlightGroup(state, {tid: state.referenceTree.id, bid: action.bid}, null,
                        newExpanded[action.bid])
                } else {
                    newHighlights = {
                        ...state.highlight,
                        bids: state.highlight.bids.map((h, i) => (i === highlightIdx? {...h, no: newExpanded[action.bid]}: h))
                    };
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
                treeDistribution: {
                    ...state.treeDistribution,
                    data: newDistData
                }
            });
        case TYPE.EXPAND_USER_SPECIFIED_TAXA_GROUP:
            newExpanded = {...state.referenceTree.expanded};
            newActiveEB = state.cbAttributeExplorer.activeExpandedBid;
            let virtualBid = getVirtualBid(action.group);
            highlightIdx = findHighlightByVirtualBid(state.highlight.bids, state.referenceTree.id, virtualBid);
            newDistData = state.treeDistribution.data.slice();

            if (action.collapse) {
                // Clear the expansion
                for (let i = 0; i < newDistData.length; i++) {
                    d = {...newDistData[i]};
                    delete d[virtualBid];
                    newDistData[i] = d;
                }
                delete newExpanded[virtualBid];
                newHighlights = highlightIdx >= 0? removeHighlightGroup(state.highlight, highlightIdx): state.highlight;
                newReferenceTree = {
                    ...state.inputGroupData.referenceTree,
                    branches: {
                        ...state.inputGroupData.referenceTree.branches,
                    }
                };
                delete newReferenceTree.branches[virtualBid];
                if (newActiveEB === virtualBid) {
                    // Pick a random one from the eb list
                    if (Object.keys(newExpanded).length > 0) {
                        newActiveEB = Object.keys(newExpanded)[0];
                    } else {
                        newActiveEB = null;
                    }
                }
            } else {

                newExpanded[virtualBid] = action.group;
                // Compile a list of all taxa in that taxa group and construct a virtual branch of these taxa
                let bids = state.referenceTree.userSpecifiedByGroup[action.group];
                let entities = bids.reduce((acc, bid) => (acc.concat(state.inputGroupData.referenceTree.branches[bid].entities)), []);

                newReferenceTree = state.inputGroupData.referenceTree.clone(true);
                newReferenceTree.branches[virtualBid] = {entities};
                newReferenceTree.getAllCB(virtualBid, state.inputGroupData.trees, false);

                let full = clusterTreesByBranch(state.inputGroupData.trees, newReferenceTree, state.cb, virtualBid);
                let subs = state.treeDistribution.showSubsets? getSubsetDistribution(full, state.sets, virtualBid): null;
                for (let i = 0; i < newDistData.length; i++) {
                    d = i === 0? full: subs[i - 1];
                    d.highlightCnt = getHighlightProportion(d, state.hoveredTrees);
                    d.selectCnt = getHighlightProportion(d, state.selectedTrees);
                    newDistData[i] = {
                        ...newDistData[i],
                        [virtualBid]: d
                    };
                }

                // In case the taxa group is previously highlighted but now it got changed
                newHighlights = addHighlightGroup(state, {tid: state.referenceTree.id, bids, targetEntities: entities, virtualBid},
                    highlightIdx, action.group);

                newActiveEB = virtualBid;
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
                treeDistribution: {
                    ...state.treeDistribution,
                    data: newDistData
                },
                cbAttributeExplorer: {
                    ...state.cbAttributeExplorer,
                    activeExpandedBid: newActiveEB,
                    activeSelectionId: newActiveEB === state.cbAttributeExplorer.activeExpandedBid?
                        state.cbAttributeExplorer.activeSelectionId: null
                }
            };
        case TYPE.TOGGLE_LEGENDS:
            return {
                ...state,
                [action.view]: {
                    ...state[action.view],
                    showLegends: !state[action.view].showLegends
                }
            };

        case TYPE.RESET:
            return Object.assign({}, state, {
                referenceTree: {                    // Clear all named clades
                    ...state.referenceTree,
                    expanded: {},
                    userSpecified: {},
                    userSpecifiedByGroup: {},
                    charts: {
                        ...state.referenceTree.charts,
                        activeSelectionId: null
                    },
                    highilghtEntities: [],
                    highlightUncertainEntities: [],
                    membershipViewer: []            // Clear membership inspection
                },
                pairwiseComparison: {               // End pairwise comparison
                    tid: null
                },
                sets: state.sets.slice(0, 1),       // Remove all sub-collections
                highlight: {                        // Clear highlight colors
                    ...state.highlight,
                    bids: [],
                    colors: (new Array(state.highlight.limit)).fill(false)
                },
                cbAttributeExplorer: {              // Clear CBAE selection
                    ...state.cbAttributeExplorer,
                    activeExpandedBid: null,
                    activeSelectionId: null
                },
                selectedTrees: {},                  // Clear selected trees
                hoveredTrees: {},                   //   and hovered trees
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    order: 'RF',                    // order back to rf distance
                },
                treeDistribution: {                 // Clear tree distribution
                    ...state.treeDistribution,
                    data: [{}]
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
        // case TYPE.REROOT_REQUEST:
        //     return {
        //         ...state,
        //         referenceTree: {
        //             ...state.referenceTree,
        //             extendedMenu: {
        //                 bid: null
        //             }
        //         },
        //         toast: {
        //             ...state.toast,
        //             msg: 'Re-rooting...',
        //         }
        //     };
        // case TYPE.REROOT_SUCCESS:
        //     return {
        //         ...state,
        //         inputGroupData: {
        //             ...state.inputGroupData,
        //             referenceTree: action.data
        //         },
        //         toast: {
        //             ...state.toast,
        //             msg: null
        //         }
        //     };
        // case TYPE.REROOT_FAILURE:
        //     return {
        //         ...state,
        //         toast: {
        //             ...state.toast,
        //             msg: action.error
        //         }
        //     };
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
            newSets = [...state.sets, {
                    sid: guid(),
                    title: state.overview.currentTitle,
                    tids: Object.keys(state.selectedTrees),
                    glyph: getAvailableGlyph(state.sets)
                }];
            if (state.treeDistribution.showSubsets) {
                sub = getSubsetDistribution(state.treeDistribution.data[0], newSets, null, newSets.length - 1);
                for (let bid in sub) if (sub.hasOwnProperty(bid)) {
                    sub[bid].highlightCnt = getHighlightProportion(sub[bid], state.hoveredTrees);
                    sub[bid].selectCnt = getHighlightProportion(sub[bid], state.selectedTrees);
                }
            }
            return Object.assign({}, state, {
                sets: newSets,
                overview: {
                    ...state.overview,
                    currentTitle: '',
                    createWindow: false
                },
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeSetIndex: newSetIndex
                },
                treeDistribution: state.treeDistribution.showSubsets? {
                    ...state.treeDistribution,
                    data: [...state.treeDistribution.data, sub]
                }: state.treeDistribution
            });
        case TYPE.TYPING_TITLE:
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    currentTitle: action.value
                }

            });
        case TYPE.ADD_TO_SET:
            newSets = state.sets.map((s, i) => i !== action.setIndex? s: {...s, tids: mergeMappingToArray(s.tids, state.selectedTrees).slice()});
            if (state.treeDistribution.showSubsets) {
                sub = getSubsetDistribution(state.treeDistribution.data[0], newSets, null, action.setIndex);
                for (let bid in sub) if (sub.hasOwnProperty(bid)) {
                    sub[bid].highlightCnt = getHighlightProportion(sub[bid], state.hoveredTrees);
                    sub[bid].selectCnt = getHighlightProportion(sub[bid], state.selectedTrees);
                }
            }
            return Object.assign({}, state, {
                sets: newSets,
                treeDistribution: state.treeDistribution.showSubsets? {
                    ...state.treeDistribution,
                    data: state.treeDistribution.data.map((s, i) => i === action.setIndex? sub: s)
                }: state.treeDistribution
            });
        case TYPE.REMOVE_SET:
            return Object.assign({}, state, {
                sets: state.sets.filter((_, i) => i !== action.setIndex),
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    activeSetIndex: 0,
                    activeTreeId: null
                },
                treeDistribution: state.treeDistribution.showSubsets? {
                    ...state.treeDistribution,
                    data: state.treeDistribution.data.filter((_, i) => i !== action.setIndex)
                }: state.treeDistribution
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
            newSelectedTrees = createMappingFromArray(action.tids);
            newDistData = [];
            for (let i = 0; i < state.treeDistribution.data.length; i++) {
                let d = state.treeDistribution.data[i];
                newDistData.push({});
                for (let bid in d) if (d.hasOwnProperty(bid)) {
                    newDistData[i][bid] = {
                        ...d[bid],
                        selectCnt: getHighlightProportion(d[bid], newSelectedTrees)
                    }
                }
            }
            return Object.assign({}, state, {
                overview: {
                    ...state.overview,
                    isSelecting: false,
                },
                selectedTrees: newSelectedTrees,
                treeDistribution: {
                    ...state.treeDistribution,
                    data: newDistData
                }
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
        case TYPE.TOGGLE_TREE_SIMILARITY_COLLAPSE:
            return {
                ...state,
                overview: {
                    ...state.overview,
                    collapsed: !state.overview.collapsed
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
            newSets = state.sets.map((s, i) => i !== action.setIndex? s: {...s, tids: s.tids.filter(tid => action.tids.indexOf(tid) === -1)});
            if (state.treeDistribution.showSubsets) {
                sub = getSubsetDistribution(state.treeDistribution.data[0], newSets, null, action.setIndex);
                for (let bid in sub) if (sub.hasOwnProperty(bid)) {
                    sub[bid].highlightCnt = getHighlightProportion(sub[bid], state.hoveredTrees);
                    sub[bid].selectCnt = getHighlightProportion(sub[bid], state.selectedTrees);
                }
            }
            return Object.assign({}, state, {
                sets: newSets,
                treeDistribution: state.treeDistribution.showSubsets? {
                    ...state.treeDistribution,
                    data: state.treeDistribution.data.map((s, i) => i === action.setIndex? sub: s)
                }: state.treeDistribution
            });
        case TYPE.CHANGE_SORTING:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    order: action.order
                }
            };
        case TYPE.CHANGE_LAYOUT_ALGORITHM:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    layoutAlg: action.layout
                }
            };
        case TYPE.CHANGE_CLUSTER_ALGORITHM:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    clusterAlg: action.cluster
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
        case TYPE.TOGGLE_SHOW_AD:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    [action.category]: !state.aggregatedDendrogram[action.category]
                }
            };
        case TYPE.CHANGE_AD_SIZE:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    spec: {
                        ...state.aggregatedDendrogram.spec,
                        [action.dimension]: action.value
                    }
                }
            };
        case TYPE.CHANGE_SKELETON_LAYOUT_PARAMETER:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    spec: {
                        ...state.aggregatedDendrogram.spec,
                        skeletonLayout: {
                            ...state.aggregatedDendrogram.spec.skeletonLayout,
                            [action.attr]: action.val
                        }
                    }
                }
            };
        case TYPE.CHANGE_CLUSTER_PARAMETER:
            return {
                ...state,
                aggregatedDendrogram: {
                    ...state.aggregatedDendrogram,
                    clusterParameter: {
                        ...state.aggregatedDendrogram.clusterParameter,
                        [action.attr]: action.val
                    }
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
                        [action.tid]: getTreeByTid(state, action.tid).findEntities(
                            getTreeByTid(state, h.src).getEntitiesByBid(h.virtualBid || h[h.src][0]))}
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
                // Revoke the consensus url
                if (state.pairwiseComparison.tid.indexOf('consensus') !== -1) {
                    window.URL.revokeObjectURL(state.inputGroupData.trees[state.pairwiseComparison.tid].consensusURL);
                }
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
                newState = {
                    ...state,
                    cbAttributeExplorer: {
                        ...state.cbAttributeExplorer,
                        selection: updatedSelection
                    }
                };
                newState.selectedTrees = getTreesBySelection(newState);
                newState.treeDistribution = {
                    ...state.treeDistribution,
                    data: updateDistriutionHighlightCnt(state.treeDistribution.data, 'selectCnt', newState.selectedTrees)
                };

                return newState;
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
                newState = {
                    ...state,
                    cbAttributeExplorer: {
                        ...state.cbAttributeExplorer,
                        activeSelectionId: action.id,
                    }
                };
                if (action.id !== null) {
                    newState.selectedTrees = getTreesBySelection(newState);
                } else if (state.cbAttributeExplorer.activeSelectionId !== null) {
                    // If previously there are selected trees by the cb-ae, we need to clear it out
                    newState.selectedTrees = {};
                }
                newState.treeDistribution = {
                    ...state.treeDistribution,
                    data: updateDistriutionHighlightCnt(state.treeDistribution.data, 'selectCnt', newState.selectedTrees)
                };
                return newState;
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
                newState = {
                    ...state,
                    cbAttributeExplorer: {
                        ...state.cbAttributeExplorer,
                        selection: updatedSelection,
                        activeSelectionId: action.sid
                    }
                };
                newState.selectedTrees = getTreesBySelection(newState);
                newState.treeDistribution = {
                    ...state.treeDistribution,
                    data: updateDistriutionHighlightCnt(state.treeDistribution.data, 'selectCnt', newState.selectedTrees)
                };
                return newState;
            }
        case TYPE.CHANGE_ACTIVE_EXPANDED_BRANCH:
            return {
                ...state,
                cbAttributeExplorer: {
                    ...state.cbAttributeExplorer,
                    activeExpandedBid: action.bid
                }
            };
        case TYPE.CHANGE_ACTIVE_COLLECTION:
            return {
                ...state,
                cbAttributeExplorer: {
                    ...state.cbAttributeExplorer,
                    activeSetId: action.setIndex
                }
            };
        case TYPE.TOGGLE_CBAE_COLLAPSE:
            return {
                ...state,
                cbAttributeExplorer: {
                    ...state.cbAttributeExplorer,
                    collapsed: !state.cbAttributeExplorer.collapsed
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
            let trees = {};
            for (let tid in action.data.trees) if (action.data.trees.hasOwnProperty(tid)) {
                trees[tid] = new Tree(action.data.trees[tid]);
                trees[tid].prepareBranches(action.data.supportRange).findMissing(action.data.entities);
            }
            newReferenceTree = new Tree(action.data.referenceTree);
            newReferenceTree.prepareBranches(action.data.supportRange)
                .getGSF(state.cb, Object.keys(action.data.trees).length)
                .normalizeBranchLength()
                .findMissing(action.data.entities);

            return Object.assign({}, state, {
                user: {
                    ...state.user,
                    isAuthenticated: true
                },
                isFetching: false,
                inputGroupData: {
                    ...action.data,
                    trees,
                    referenceTree: newReferenceTree
                },
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
                    coordinates: getCoordinates(newReferenceTree, trees, state.cb, true, null)
                },
                cbAttributeExplorer: {
                    ...state.cbAttributeExplorer,
                    activeSetId: 0,
                    attributes: state.cbAttributeExplorer.attributes.slice(!!action.data.supportRange? 0: 1),
                    selection: state.cbAttributeExplorer.selection.slice(!!action.data.supportRange? 0: 1)
                },
                treeDistribution: {
                    ...state.treeDistribution,
                    data: [{}]
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
                user: {
                    ...state.user,
                    isAuthenticated: true
                },
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
        case TYPE.OPEN_DATASET_REMOVAL:
            return {
                ...state,
                datasetRemoval: {
                    ...state.datasetRemoval,
                    id: action.inputGroupId,
                    showConfirmOption: true
                }
            };
        case TYPE.CONFIRM_DATASET_REMOVAL:
            return {
                ...state,
                datasetRemoval: {
                    ...state.datasetRemoval,
                    showConfirmOption: false,       // Only when the user cancel the removal will this reducer be called
                    id: null,
                }
            };
        case TYPE.REMOVE_DATASET_REQUEST:
            return {
                ...state,
                datasetRemoval: {
                    ...state.datasetRemoval,
                    showConfirmOption: false,
                },
                toast: {
                    ...state.toast,
                    msg: 'Deleting dataset from database...'
                }
            };
        case TYPE.REMOVE_DATASET_SUCCESS:
            return {
                ...state,
                datasets: state.datasets.filter(d => d.inputGroupId !== action.inputGroupId),
                datasetRemoval: {
                    ...state.datasetRemoval,
                    id: null,
                    showConfirmOption: false,
                },
                toast: {
                    ...state.toast,
                    msg: null
                }
            };
        case TYPE.REMOVE_DATASET_FAILURE:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: action.error.toString()
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
        // case TYPE.TOGGLE_JACCARD_MISSING:
        //     // This is a quick hack to fall back to cb if cb2 is absent
        //     if (state.inputGroupData.inputGroupId === 1 && action.cb === 'cb2') {
        //         return state;
        //     }
        //     // Or a shortcut: clear first and then switch
        //     return {
        //         ...state,
        //         inputGroupData: {
        //             ...state.inputGroupData,
        //             referenceTree: (state.inputGroupData.referenceTree.clone(true))
        //                 .getGSF(action.cb, Object.keys(state.inputGroupData.trees).length)
        //         },
        //         cb: action.cb,
        //         overview: {
        //             ...state.overview,
        //             coordinates: getCoordinates(state.inputGroupData.referenceTree, state.inputGroupData.trees, state.cb,
        //                 state.overview.metricMode === 'global' || state.overview.metricBranch == null, state.overview.metricBranch)
        //         }
        //     };
        case TYPE.CLOSE_TOAST:
            if (state.toast.downloadingTreeUrl) {
                window.URL.revokeObjectURL(state.toast.downloadingTreeUrl);
            }
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: null,
                    downloadingTreeUrl: null
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
            if (!state.treeDistribution.showSubsets) {       // show
                let subs = getSubsetDistribution(state.treeDistribution.data[0], state.sets);
                for (let i = 0; i < subs.length; i++) {
                    for (let bid in subs[i]) if (subs[i].hasOwnProperty(bid)) {
                        subs[i][bid].highlightCnt = getHighlightProportion(subs[i][bid], state.hoveredTrees);
                        subs[i][bid].selectCnt = getHighlightProportion(subs[i][bid], state.selectedTrees);
                    }
                }
                newDistData = state.treeDistribution.data.concat(subs);
            } else {                                        // collapse
                newDistData = state.treeDistribution.data.slice(0, 1);
            }
            return {
                ...state,
                treeDistribution: {
                    ...state.treeDistribution,
                    showSubsets: !state.treeDistribution.showSubsets,
                    data: newDistData
                }
            };
        case TYPE.TOGGLE_HIGHLIGHT_TREES:
            newHoveredTrees = action.tids && action.tids.length? createMappingFromArray(action.tids): {};
            return {
                ...state,
                hoveredTrees: newHoveredTrees,
                treeDistribution: {
                    ...state.treeDistribution,
                    data: updateDistriutionHighlightCnt(state.treeDistribution.data, 'highlightCnt', newHoveredTrees)
                }
            };
        case TYPE.TOGGLE_SELECT_TREES:
            newSelectedTrees = action.isAdd? {...mergeArrayToMapping(state.selectedTrees, action.tids)}: createMappingFromArray(action.tids);
            // If select a different tree for pairwise comparison
            if (state.pairwiseComparison.tid && state.pairwiseComparison.tid !== action.tids[0]
                && (!action.isAdd || (action.isAdd && !Object.keys(state.selectedTrees).length))) {
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
                        [comparingTid]: getTreeByTid(state, comparingTid).findEntities(
                            getTreeByTid(state, h.src).getEntitiesByBid(h.virtualBid || h[h.src][0]))}
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
                    },
                    treeDistribution: {
                        ...state.treeDistribution,
                        data: updateDistriutionHighlightCnt(state.treeDistribution.data, 'selectCnt', newSelectedTrees)
                    }
                }
            }

            // If not for pairwise comparison
            return {
                ...state,
                selectedTrees: newSelectedTrees,
                treeDistribution: {
                    ...state.treeDistribution,
                    data: updateDistriutionHighlightCnt(state.treeDistribution.data, 'selectCnt', newSelectedTrees)
                }
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
            newDistData = [];
            for (let i = 0; i < state.treeDistribution.data.length; i++) {
                let d = state.treeDistribution.data[i];
                newDistData.push({});
                for (let bid in d) if (d.hasOwnProperty(bid)) {
                    newDistData[i][bid] = {
                        ...d[bid],
                        selectCnt: (new Array(d[bid].bins.length)).fill(0)
                    }
                }
            }
            return {
                ...state,
                selectedTrees: {},
                treeDistribution: {
                    ...state.treeDistribution,
                    data: newDistData
                }
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
                        moveUp: action.y + 350 > getWindowHeight()
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
            let consensusTree = new Tree(action.data);
            newBids = state.highlight.bids.map(h => (
                {...h, tgt: consensusTid,
                    [consensusTid]: consensusTree.findEntities(getTreeByTid(state, h.src).getEntitiesByBid(h.virtualBid || h[h.src][0]))}
            ));
            newColors = state.highlight.colors;
            consensusTree.prepareBranches([0, 1]).findMissing(state.inputGroupData.entities);
            consensusTree.consensusURL = window.URL.createObjectURL(new Blob([action.data.newickString], {type: 'text/plain'}));

            return {
                ...state,
                inputGroupData: {
                    ...state.inputGroupData,
                    trees: {
                        ...state.inputGroupData.trees,
                        [consensusTid]: consensusTree
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
        case TYPE.TOGGLE_STRETCH_MAINVIEW:
            return {
                ...state,
                stretchedMainView: !state.stretchedMainView
            };
        case TYPE.CHANGE_UPLOAD_DATASET:
            return {
                ...state,
                upload: {
                    ...state.upload,
                    formData: {
                        ...state.upload.formData,
                        [action.name]: action.value
                    },
                }
            };
        case TYPE.UPLOAD_DATASET_REQUEST:
            return {
                ...state,
                upload: {
                    ...state.upload,
                    isProcessingEntities: true,
                }
            };
        case TYPE.UPLOAD_DATASET_FAILURE:
            return {
                ...state,
                upload: {
                    ...state.upload,
                    error: action.error
                }
            };
        case TYPE.UPLOAD_DATASET_SUCCESS:
            return {
                ...state,
                upload: {
                    ...state.upload,
                    ...action.data,
                    isProcessingEntities: false,
                    outgroupTaxa: {}
                }
            };
        case TYPE.SELECT_OUTGROUP_TAXA:
            return {
                ...state,
                upload: {
                    ...state.upload,
                    outgroupTaxa: state.upload.outgroupTaxa.hasOwnProperty(action.eid)?
                        (() => {let r = {...state.upload.outgroupTaxa}; delete r[action.eid]; return r})():
                        {...state.upload.outgroupTaxa, [action.eid]: true}
                }
            };
        case TYPE.CHANGE_OUTGROUP_TAXA_FILE:
            let newOutgroupTaxa = {};
            let lines = action.t.split('\n');
            for (let l of lines) {
                for (let eid in state.upload.entities) if (state.upload.entities.hasOwnProperty(eid)) {
                    if (state.upload.entities[eid].toLowerCase() === l.toLowerCase()) {
                        newOutgroupTaxa[eid] = true; break;
                    }
                }
            }
            return {
                ...state,
                upload: {
                    ...state.upload,
                    outgroupTaxa: newOutgroupTaxa
                }
            };

        case TYPE.UPLOAD_OUTGROUP_REQUEST:
            return {
                ...state,
                upload: {
                    ...state.upload,
                    uploadState: 'SENDING',
                    checkStatusRetry: 2,
                },
                referenceTree: {
                    ...state.referenceTree,
                    extendedMenu: {
                        ...state.referenceTree.extendedMenu,
                        bid: null,
                    }
                }
            };
        case TYPE.UPLOAD_OUTGROUP_SUCCESS:
            return {
                ...state,
                upload: {
                    ...state.upload,
                    uploadState: 'RECEIVED',
                    checkStatusUrl: action.checkStatusUrl
                }
            };
        case TYPE.UPLOAD_OUTGROUP_FAILURE:
            return {
                ...state,
                upload: {
                    uploadState: 'FAILURE',
                    error: action.error.toString(),
                }
            };
        case TYPE.CHECK_UPLOAD_STATUS_SUCCESS:
            if (action.data.state === 'SUCCESS') {
                return {
                    ...state,
                    upload: {
                        ...state.upload,
                        uploadState: action.data.state,
                        progress: null,
                        datasetUrl: action.data.url
                    }
                }
            } else if (action.data.state === 'PENDING') {
                return {
                    ...state,
                    upload: {
                        ...state.upload,
                        uploadState: action.data.state,
                    }
                };
            } else if (action.data.state === 'PROGRESS') {
                return {
                    ...state,
                    upload: {
                        ...state.upload,
                        uploadState: action.data.state,
                        progress: action.data
                    }
                };
            } else {
                // The upload has failed
                return {
                    ...state,
                    upload: {
                        ...state.upload,
                        uploadState: action.data.state,
                        // progress: null,          // do not clear this out to see which step went wrong
                        error: action.data.error
                    }
                }
            }
        case TYPE.CHECK_UPLOAD_STATUS_FAILUER:
            return {
                ...state,
                upload: {
                    ...state.upload,
                    checkStatusRetry: state.upload.checkStatusRetry - 1
                }
            };

        case TYPE.TOGGLE_HIGHLIGHT_SEGMENT:
            // This is actually combination of HIGHLIGHT_TREES and HIGHLIGHT_ENTITIES
            newHoveredTrees = action.tids && action.tids.length? createMappingFromArray(action.tids): {};
            newDistData = [];
            for (let i = 0; i < state.treeDistribution.data.length; i++) {
                let d = state.treeDistribution.data[i];
                newDistData.push({});
                for (let bid in d) if (d.hasOwnProperty(bid)) {
                    newDistData[i][bid] = {
                        ...d[bid],
                        highlightCnt: getHighlightProportion(d[bid], newHoveredTrees)
                    }
                }
            }
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    highlightEntities: action.entities,
                },
                hoveredTrees: newHoveredTrees,
                treeDistribution: {
                    ...state.treeDistribution,
                    tooltipMsg: action.tooltipMsg,
                    data: newDistData
                },
            };
        case TYPE.TOGGLE_TD_EXTENDED_MENU:
            return {
                ...state,
                treeDistribution: {
                    ...state.treeDistribution,
                    extendedMenu: {
                        ...state.treeDistribution.extendedMenu,
                        bid: action.bid,
                        tid: action.tid,
                        x: action.x,
                        y: action.y,
                        viewerIndex: action.viewerIndex
                    }
                }
            };
        case TYPE.TOGGLE_TAXA_MEMBERSHIP_VIEW:
            return {
                ...state,
                referenceTree: {
                    ...state.referenceTree,
                    membershipViewer: action.viewerIndex !== null? state.referenceTree.membershipViewer.filter((_, i) => i !== action.viewerIndex):
                        [...state.referenceTree.membershipViewer, {setIndex: action.setIndex, bid: action.bid, tid: action.tid}]
                },
                treeDistribution: {
                    ...state.treeDistribution,
                    extendedMenu: {
                        ...state.extendedMenu,
                        bid: null,
                        viewerIndex: null,
                    }
                }
            };
        case TYPE.DOWNLOAD_SELECTED_TREES_REQUEST:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: 'Preparing for download...',
                }
            };
        case TYPE.DOWNLOAD_SELECTED_TREES_SUCCESS:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: 'Click the following link to download:',
                    downloadingTreeUrl: action.url
                },
            };
        case TYPE.DOWNLOAD_SELECTED_TREES_FAILURE:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: action.error.toString()
                }
            };
        case TYPE.FINISH_DOWNLOAD_SELECTED_TREES:
            if (state.toast.downloadingTreeUrl) {
                window.URL.revokeObjectURL(state.toast.downloadingTreeUrl);
            }
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: null,
                    downloadingTreeUrl: null
                },
            };

        case TYPE.CHANGE_LOGIN_FORM:
            return {
                ...state,
                user: {
                    ...state.user,
                    form: {
                        ...state.user.form,
                        [action.attr]: [action.val]
                    }
                }
            };
        case TYPE.LOGIN_REQUEST:
            return {
                ...state,
                user: {
                    ...state.user,
                    loginRequest: true
                }
            };
        case TYPE.LOGIN_SUCCESS:
            return {
                ...state,
                user: {
                    ...state.user,
                    isAuthenticated: true,
                    loginRequest: false,
                    loginError: null
                }
            };
        case TYPE.LOGIN_FAILURE:
            return {
                ...state,
                user: {
                    ...state.user,
                    isAuthenticated: false,
                    loginRequest: false,
                    loginError: action.error
                }
            };
        case TYPE.LOGOUT_REQUEST:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: 'Logging out...'
                }
            };
        case TYPE.LOGOUT_FAILURE:
            return {
                ...state,
                toast: {
                    ...state.toast,
                    msg: action.error
                }
            };
        case TYPE.LOGOUT_SUCCESS:
            return {
                ...state,
                user: {
                    ...state.user,
                    isAuthenticated: false
                },
                toast: {
                    ...state.toast,
                    msg: null
                }
            };

        default:
            return state;

    }
}


export default visphyReducer;