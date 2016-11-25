/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import './Dendrogram.css';

class AggregatedDendrogram extends Component {
    calcLayout(data, height) {
        const gap = 5;
        const branchLen = 8;
        const blockWidth = 30;

        let blocks = {
            [data.rootBranch]: {children: [], height, width: blockWidth, x: 0, y: 0, level: 1, id: data.rootBranch}
        };
        // Generate all blocks needed to display
        let splitBlock = function (blockId, curBid) {
            let b = data.branches[curBid];
            let newBlockId = blockId;
            if (data.expand[curBid] && curBid != data.rootBranch) {
                // split block
                blocks[curBid] = {children: [], level: blocks[blockId].level + 1, id: curBid, width: blockWidth,
                    isLeaf: !!b.is_leaf};
                blocks[blockId].children.push(curBid);
                newBlockId = curBid;
            }
            // otherwise recursively go down the children
            if (!b['is_leaf']) {
                splitBlock(newBlockId, b['left']);
                splitBlock(newBlockId, b['right']);
            }
        };
        splitBlock(data.rootBranch, data.rootBranch);

        // Calculate the position, width and height of blocks and expanding branches
        let branches = {};
        // console.log(data.expand + ' '  + (data.expand[data.expand.length - 1] in data.branches));
        // console.log(blocks);
        let calcWidth = function (blockId, height, y) {
            let b = blocks[blockId];
            if (b.children.length) {
                let w = (height - gap * (b.children.length - 1.0)) / b.children.length;
                for (let i = 0; i < b.children.length; i++) {
                    let c = blocks[b.children[i]];
                    c.height = c.isLeaf? 0: w;
                    c.y = y + i * (w + gap);
                    c.x = b.x + blockWidth + branchLen;
                    let branchPosY = (c.y + c.y + w) / 2;

                    branches[b.children[i]] = {id: b.children[i], y1: branchPosY, y2: branchPosY,
                        x1: b.x + blockWidth, x2: b.x + blockWidth + branchLen};
                    calcWidth(b.children[i], w, c.y);
                }
            }
        };
        calcWidth(data.rootBranch, height, 0);

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
        let {blks, branches} = this.calcLayout(this.props.data, size);

        return (
            <div className="agg-dendro-box">
                <div>
                    <svg width={size} height={size}>
                        <g className="blocks">
                            {blks.map(b => <rect className="block" key={b.id}
                                                 x={b.x} y={b.y} width={b.width} height={b.height} />)}
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