/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import './Dendrogram.css';

class AggregatedDendrogram extends Component {
    calcLayout(data, width, height) {
        const gap = 5;
        const branchLen = 8;
        const blockWidth = 30;

        let blocks = {
            [data.rootBranch]: {children: [], height, width: blockWidth, x: 0, y: 0, level: 1, id: data.rootBranch,
                n: data.branches[data.rootBranch].entities.length}
        };
        // Generate all blocks needed to display
        let splitBlock = function (blockId, curBid) {
            let b = data.branches[curBid];
            let newBlockId = blockId;
            if (data.expand[curBid] && curBid != data.rootBranch) {
                // split block
                blocks[curBid] = {children: [], level: blocks[blockId].level + 1, id: curBid, width: blockWidth,
                    isLeaf: !!b.isLeaf, n: b.entities.length};
                blocks[blockId].n -= b.entities.length;
                blocks[blockId].children.push(curBid);
                newBlockId = curBid;
            }
            // otherwise recursively go down the children
            if (!b['isLeaf']) {
                splitBlock(newBlockId, b['left']);
                splitBlock(newBlockId, b['right']);
            }
        };
        splitBlock(data.rootBranch, data.rootBranch);

        // Calculate the position, width and height of blocks and expanding branches
        let branches = {};
        // console.log(blocks);
        let widthCoeff = width;
        let calcHeight = function (blockId, height, y, accN) {
            let b = blocks[blockId];
            accN += Math.log(b.n || 1);
            // accN += b.n;
            if (b.children.length) {
                let h = (height - gap * (b.children.length - 1.0)) / b.children.length;
                for (let i = 0; i < b.children.length; i++) {
                    let c = blocks[b.children[i]];
                    c.height = c.isLeaf? 0: h;
                    c.y = y + i * (h + gap);
                    let branchPosY = (c.y + c.y + h) / 2;

                    branches[b.children[i]] = {id: b.children[i], y1: branchPosY, y2: branchPosY};
                    calcHeight(b.children[i], h, c.y, accN);
                }
            } else {
                let k = (width - (b.level - 1) * branchLen) / accN;
                widthCoeff = Math.min(k, widthCoeff);
            }
        };
        calcHeight(data.rootBranch, height, 0, 0);

        let calcWidth = function (blockId, x) {
            let b = blocks[blockId];
            b.width = widthCoeff * Math.log(b.n || 1);
            // b.width = Math.max(widthCoeff * b.n, 1);
            for (let i = 0; i < b.children.length; i++) {
                let c = blocks[b.children[i]];
                c.x = x + b.width + branchLen;
                branches[b.children[i]].x1 = x + b.width;
                branches[b.children[i]].x2 = x + b.width + branchLen;
                calcWidth(b.children[i], c.x);
            }
        };
        calcWidth(data.rootBranch, 0);

        let blockArr = [];
        for (let bid in blocks) {
            blockArr.push(blocks[bid]);
        }
        let branchArr = [];
        for (let bid in branches) {
            branchArr.push(branches[bid]);
        }

        return {blks: blockArr, branches: branchArr};
    }
    render() {
        // console.log(this.props.data);
        let size = 150;
        let {blks, branches} = this.calcLayout(this.props.data, size - 5, size);

        return (
            <div className="agg-dendro-box">
                <div>
                    <svg width={size} height={size}>
                        <g className="blocks">
                            {blks.map(b =>
                                <g key={b.id}>
                                    <rect className="block" x={b.x} y={b.y} width={b.width} height={b.height} />
                                    <text className="label" x={b.x} y={b.y} dx={5} dy={10}>{b.n}</text>
                                </g>
                            )}
                        </g>
                        <g className="branches">
                            {branches.map(b => <line className="branch" key={b.id}
                                                     x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
                        </g>
                    </svg>
                </div>
            </div>
        )
    }
}

export default AggregatedDendrogram;