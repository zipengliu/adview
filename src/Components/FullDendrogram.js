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
            textWidth: 100 - 10
        }
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
    renderTopo(topo) {
        let branches = topo.branches;
        let maxLength = this.getMaxLength(this.props.topo);
        let xScale = scaleLinear().domain([0, maxLength]).range([0, this.state.topoWidth]);
        let b = {};
        let connectLines = [];
        let curY = this.state.margin.top;
        let traverse = (bid, curX) => {
            let bLength = branches[bid].length;
            let t = xScale(bLength);
            b[bid] = {x1: curX, x2: curX + t};
            curX += t;
            if ('left' in branches[bid]) {
                traverse(branches[bid].left, curX);
                traverse(branches[bid].right, curX);
                b[bid].y1 = (b[branches[bid].left].y1 + b[branches[bid].right].y1) / 2;
                b[bid].y2 = b[bid].y1;
                connectLines.push({x1: curX, x2: curX, y1: b[branches[bid].left].y1, y2: b[branches[bid].right].y1});
            } else {
                // Leaf branch
                b[bid].y1 = curY;
                b[bid].y2 = curY;
                curY += this.state.marginOnEntity;
            }
        };

        traverse(topo.rootBranch, this.state.margin.left);

        let result = [];
        for (let bid in b) {
            result.push(<line className="branch-line" {...b[bid]} key={bid}></line>)
        }
        return result.concat(connectLines.map((d, i) => (<line className="branch-line" {...d} key={i}></line>)));
    }
    render() {
        return (
            <svg width={this.props.width} height={this.props.height}>
                <g className="topology">
                    {this.renderTopo(this.props.topo)}
                </g>
                <g className="names"></g>
            </svg>
        )
    }
}

export default FullDendrogram;
