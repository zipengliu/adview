/**
 * Created by Zipeng Liu on 2016-11-04.
 */

import React, { Component } from 'react';
import {scaleLinear} from 'd3-scale';
import './FullDendrogram.css';

class FullDendrogram extends Component {
    constructor(props) {
        super(props);
        this.state = {
            margin: {left: 5, right: 5, top: 10, bottom: 10},
            marginOnEntity: 8,
            topoWidth: props.width - 100 - 10,
            textWidth: 100 - 10,
            boxWidth: 7,
            highlightBranch: [],
            hoverBranch: null,
        };

        this.hoverBranch = this.hoverBranch.bind(this);
    }
    getMaxLength(topo) {
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
        console.log('max length in ref tree: ' + maxLength);
        return maxLength;
    }
    renderTopo(topo, ent) {
        let branches = topo.branches;
        let maxLength = this.getMaxLength(this.props.topo);
        let xScale = scaleLinear().domain([0, maxLength]).range([0, this.state.topoWidth]);
        let b = {};
        let connectLines = [];
        let curY = this.state.margin.top;
        let text = [];
        // THe bounding box for a subtree, keyed by the leading branch
        this.boundingBox = {};
        let boxHalfWidth = (this.state.boxWidth - 1) / 2;

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
                this.boundingBox[bid] = {x: b[bid].x1, y: this.boundingBox[left].y,
                    width: this.props.width - b[bid].x1,
                    height: this.boundingBox[right].y + this.boundingBox[right].height - this.boundingBox[left].y};
            } else {
                // Leaf branch
                b[bid].y1 = curY;
                b[bid].y2 = curY;
                this.boundingBox[bid] = {x: b[bid].x1, y: b[bid].y1 - boxHalfWidth,
                    width: this.props.width - b[bid].x1, height: this.state.boxWidth};
                let ent_id = branches[bid].entities[0];
                text.push({entity_id: ent_id,  x: curX, y: curY});
                curY += this.state.marginOnEntity;
            }
        };

        traverse(topo.rootBranch, this.state.margin.left);

        let result = [];
        let boxes = [];
        for (let bid in b) {
            result.push(<line className="branch-line" {...b[bid]} key={bid}></line>);
            boxes.push(<rect className="box" x={b[bid].x1} y={b[bid].y1 - boxHalfWidth}
                        width={b[bid].x2 - b[bid].x1} height={this.state.boxWidth}
                             onMouseOver={this.hoverBranch}
                        key={bid} data-branchId={bid}></rect>);
        }
        return {
            topo: result.concat(connectLines.map((d, i) => (<line className="branch-line" {...d} key={i}></line>))),
            box: boxes,
            text: text.map(d => (<text className="entity-name" x={d.x} y={d.y} dx={5} dy={3}
                                       textAnchor="start" key={d.entity_id}>{ent[d.entity_id].name}</text>))
        }
    }
    hoverBranch(event) {
        event.preventDefault();
        event.stopPropagation();
        let bid = event.target.getAttribute('data-branchId');
        console.log('Clicking on branch ' + bid);
        this.setState({hoverBranch: bid});
    }
    render() {
        console.log('Rendering full dendrogram');
        let {topo, box, text} = this.renderTopo(this.props.topo, this.props.entities);
        return (
            <svg width={this.props.width} height={this.props.height}>
                <g>{this.state.hoverBranch &&
                <rect className="hover-box" {...this.boundingBox[this.state.hoverBranch]}></rect>}</g>
                <g className="topology">{topo}</g>
                <g className="names">{text}</g>
                <g className="responding-boxes">{box}</g>
            </svg>
        )
    }
}

export default FullDendrogram;
