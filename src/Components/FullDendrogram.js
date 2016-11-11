/**
 * Created by Zipeng Liu on 2016-11-04.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {scaleLinear} from 'd3-scale';
import {createSelector} from 'reselect';
import {highlightMonophyly, unhighlightMonophyly} from '../actions';


import './FullDendrogram.css';

class FullDendrogram extends Component {
    render() {
        console.log('Rendering full dendrogram');
        let {sizes, branchSpecs, verticalLines, responsiveBoxes,
            highlightMonophyly, hoverBoxes, textSpecs, entities} = this.props;
        let allLines = branchSpecs.concat(verticalLines).map((d, i) =>
            (<line className="branch-line" x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2} key={d.bid || i}></line>));
        let names = textSpecs.map(d => (<text className="entity-name" x={d.x} y={d.y} dx={5} dy={3}
                                              textAnchor="start" key={d.entity_id}>{entities[d.entity_id].name}</text>))
        return (
            <svg width={sizes.width} height={sizes.height}>
                <g>{highlightMonophyly &&
                <rect className="hover-box" {...hoverBoxes[highlightMonophyly]}></rect>}
                </g>
                <g className="topology">{allLines}</g>
                <g className="names">{names}</g>
                <g className="responding-boxes">
                    {responsiveBoxes.map(d =>
                    <rect className="box" x={d.x} y={d.y} width={d.width} height={d.height}
                          onMouseOver={() => {this.props.onMouseOver(d.bid)}}
                          onMouseOut={this.props.onMouseOut}
                          key={d.bid}></rect>)}
                </g>
            </svg>
        )
    }
}

function getMaxLength(topo) {
    let r = topo.rootBranch;
    let branches = topo.branches;
    let maxLength = 0;

    let traverse = function(bid, cur) {
        cur += branches[bid].length;
        maxLength = Math.max(cur, maxLength);
        if ('left' in branches[bid]) {
            traverse(branches[bid].left, cur);
            traverse(branches[bid].right, cur);
        }
    };

    traverse(r, 0);
    // console.log('max length in ref tree: ' + maxLength);
    return maxLength;
}

function renderTopo(topo, sizes) {
    let branches = topo.branches;
    let maxLength = getMaxLength(topo);
    let xScale = scaleLinear().domain([0, maxLength]).range([0, sizes.topoWidth]);
    let b = {};
    let connectLines = [];
    let curY = sizes.margin.top;
    let text = [];
    // THe bounding box for a subtree, keyed by the leading branch
    let boundingBox = {};
    let boxHalfWidth = (sizes.boxWidth - 1) / 2;

    let traverse = (bid, curX) => {
        let bLength = branches[bid].length;
        let t = xScale(bLength);
        b[bid] = {x1: curX, x2: curX + t};
        curX += t;
        if ('left' in branches[bid]) {
            let {left, right} = branches[bid];
            traverse(left, curX);
            traverse(right, curX);
            b[bid].y1 = (b[left].y1 + b[right].y1) / 2;
            b[bid].y2 = b[bid].y1;
            connectLines.push({x1: curX, x2: curX, y1: b[left].y1, y2: b[right].y1});
            // Merge the two children bounding box to for his bounding box
            boundingBox[bid] = {x: b[bid].x1, y: boundingBox[left].y,
                width: sizes.width - b[bid].x1,
                height: boundingBox[right].y + boundingBox[right].height - boundingBox[left].y};
        } else {
            // Leaf branch
            b[bid].y1 = curY;
            b[bid].y2 = curY;
            boundingBox[bid] = {x: b[bid].x1, y: b[bid].y1 - boxHalfWidth,
                width: sizes.width - b[bid].x1, height: sizes.boxWidth};
            let ent_id = branches[bid].entities[0];
            text.push({entity_id: ent_id,  x: curX, y: curY});
            curY += sizes.marginOnEntity;
        }
    };

    traverse(topo.rootBranch, sizes.margin.left);

    let branchSpecs = [];
    let responsiveBoxes = [];
    for (let bid in b) {
        branchSpecs.push({...b[bid], bid});
        responsiveBoxes.push({x: b[bid].x1, y: b[bid].y1 - boxHalfWidth,
            width: b[bid].x2 - b[bid].x1, height: sizes.boxWidth, bid});
    }
    return {
        branchSpecs,
        verticalLines: connectLines,
        responsiveBoxes,
        textSpecs: text,
        hoverBoxes: boundingBox,
    }
}

function mapStateToProps(state, ownProps) {
    return {
        ...getDendrogramSpecs(state, ownProps),
        highlightMonophyly: state.highlightMonophyly
    }
}

let getDendrogramSpecs = createSelector(
    [state => state.inputGroupData, state => state.inputGroupData.defaultReferenceTree || state.referenceTree,
        (state, props) => props.width, (state, props) => props.height],
    (data, referenceTreeId, width, height) => {
        console.log('Calculating FullDendrogram: ' + referenceTreeId);
        let {entities} = data;
        let tree = data.trees[referenceTreeId];

        let sizes = {
            width: width,
            height: height,
            margin: {left: 5, right: 5, top: 10, bottom: 10},
            marginOnEntity: 8,
            topoWidth: width - 100 - 10,
            textWidth: 100 - 10,
            boxWidth: 7,
        };

        let specs = renderTopo(tree, sizes);
        return {
            sizes,
            ...specs,
            entities,
        }
    }
);

function mapDispatchToProps(dispatch) {
    return {
        onMouseOver: (bid) => {
            dispatch(highlightMonophyly(bid));
        },
        onMouseOut: () => {
            dispatch(unhighlightMonophyly());
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FullDendrogram);
