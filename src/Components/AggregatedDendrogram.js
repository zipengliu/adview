/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import './Dendrogram.css';
import {createMappingFromArray, subtractMapping, getIntersection} from '../utils';

class AggregatedDendrogram extends Component {
    calcLayout(data, width, height, exploreEntities) {
        let gap = this.props.spec.verticalGap;
        let {branchLen, leaveHeight, leaveHighlightWidth} = this.props.spec;

        // Generate all blocks needed to display
        let blocks = {
            [data.rootBranch]: {children: [], height, width: 0, x: 0, y: 0, level: 1, id: data.rootBranch,
                n: data.branches[data.rootBranch].entities.length,
                entities: createMappingFromArray(data.branches[data.rootBranch].entities)}
        };
        let splitBlock = function (blockId, curBid) {
            let b = data.branches[curBid];
            let newBlockId = blockId;
            if (data.expand[curBid] && curBid !== data.rootBranch) {
                // split block
                blocks[curBid] = {children: [], level: blocks[blockId].level + 1, id: curBid, width: 0,
                    isLeaf: !!b.isLeaf, n: b.entities.length, entities: createMappingFromArray(b.entities)};
                blocks[blockId].n -= b.entities.length;
                blocks[blockId].entities = subtractMapping(blocks[blockId].entities, blocks[curBid].entities);
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
            if (b.children.length) {
                // The leaf branch should not take a lot of space
                // calculate the number of leaves
                let numLeaves = b.children.filter(bid => blocks[bid].isLeaf).length;
                // If all children are leaves, then nonLeaveHeight is useless
                let nonLeaveHeight = numLeaves === b.children.length? 10:
                    (height - gap * (b.children.length - 1.0) - numLeaves * leaveHeight) / (b.children.length - numLeaves);
                // console.log(height, numLeaves, nonLeaveHeight, b.children);
                let curNumLeaves = 0;
                for (let i = 0; i < b.children.length; i++) {
                    let c = blocks[b.children[i]];
                    c.height = c.isLeaf? leaveHeight: nonLeaveHeight;
                    c.y = y + (i - curNumLeaves) * nonLeaveHeight + curNumLeaves * leaveHeight + i * gap;
                    let branchPosY = (c.y + c.y + c.height) / 2;

                    branches[b.children[i]] = {id: b.children[i], y1: branchPosY, y2: branchPosY};
                    curNumLeaves += c.isLeaf;
                    calcHeight(b.children[i], nonLeaveHeight, c.y, accN);
                }
            } else {
                let k = (width - (b.level - 1) * branchLen) / accN;
                widthCoeff = Math.min(k, widthCoeff);
            }
        };
        calcHeight(data.rootBranch, height, 0, 0);

        let calcWidth = function (blockId, x) {
            let b = blocks[blockId];
            if (b.n === 0) {
                // Add a branch to connect the children
                // If this block does not contain any entity, it should has at least two children
                branches[blockId + '-x'] = {id: blockId + '-x', y1: branches[b.children[0]].y1, y2: branches[b.children[b.children.length - 1]].y1, x1: x, x2: x};
            }
            b.width = widthCoeff * Math.log(b.n || 1);
            // b.width = Math.max(widthCoeff * b.n, 1);
            for (let i = 0; i < b.children.length; i++) {
                let c = blocks[b.children[i]];
                c.x = x + b.width + branchLen;
                branches[b.children[i]].x1 = x + b.width;
                branches[b.children[i]].x2 = c.isLeaf? width: x + b.width + branchLen;
                c.highlightWidth = c.isLeaf? Math.min((branches[b.children[i]].x2 - branches[b.children[i]].x1) * 0.67, leaveHighlightWidth): 0;
                calcWidth(b.children[i], c.x);
            }
        };
        calcWidth(data.rootBranch, 0);

        let blockArr = [];
        let e = createMappingFromArray(exploreEntities);
        for (let bid in blocks) if (blocks.hasOwnProperty(bid)) {
            blocks[bid].fillPercentage = getIntersection(blocks[bid].entities, e) / parseFloat(Object.keys(blocks[bid].entities).length);
            blockArr.push(blocks[bid]);
        }
        let branchArr = [];
        for (let bid in branches) if (branches.hasOwnProperty(bid)) {
            branchArr.push(branches[bid]);
        }

        return {blks: blockArr, branches: branchArr};
    }
    render() {
        // console.log(this.props.data);
        let {spec} = this.props;
        let {size, margin} = spec;
        let {blks, branches} = this.calcLayout(this.props.data, size, size, this.props.exploreEntities);
        return (
            <svg width={size + 2 * margin} height={size + 2 * margin}>
                <g transform={`translate(${margin},${margin})`}>
                    <g className="blocks">
                        {blks.map(b =>
                            <g key={b.id}>
                                {b.width > 0 &&
                                <rect className="block" x={b.x} y={b.y} width={b.width} height={b.height} />}
                                {b.fillPercentage > 0.001 &&
                                <rect className="highlight-block" x={b.x + (1 - b.fillPercentage) * b.width} y={b.y}
                                      width={b.fillPercentage * b.width} height={b.height} />}
                                {b.fillPercentage > 0.5 && b.isLeaf &&
                                <rect className="highlight-block" x={size - b.highlightWidth} y={b.y}
                                      width={b.highlightWidth} height={b.height} />}
                                {b.n > 1 && <text className="label" x={b.x} y={b.y} dx={5} dy={10}>{b.n}</text>}
                            </g>
                        )}
                    </g>
                    <g className="branches">
                        {branches.map(b => <line className="branch" key={b.id}
                                                 x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
                    </g>
                </g>
            </svg>
        )
    }
}

export default AggregatedDendrogram;
