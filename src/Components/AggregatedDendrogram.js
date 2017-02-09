/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import cn from 'classnames';
import {scaleLog} from 'd3';
import {createArrayFromMapping} from '../utils';
import './Dendrogram.css';

class AggregatedDendrogram extends Component {
    render() {
        // console.log(this.props.data);
        let {spec, isClusterMode, isSuperCluster, shadedGranularity, onToggleBlock} = this.props;
        let {size, margin, proportionBarHeight, proportionTopMargin} = spec;
        let {blocks, branches, num, total, lastSelected} = this.props.data;
        let blockArr = createArrayFromMapping(blocks);
        let branchArr = createArrayFromMapping(branches);
        let numScale = scaleLog().base(1.01).domain([1, total]).range([0, size]);

        let hasUncertainty = block => {
            if (!block) return false;
            if (isClusterMode) {
                for (let i = 0; i < block.similarity.length; i++) {
                    if (block.similarity[i] < 1.0) return true;
                }
                return false;
            } else {
                return block.similarity < 1.0;
            }
        };

        let getCertainEntities = block =>
            isClusterMode? Object.keys(block.entities).filter(e => block.entities[e] === num): Object.keys(block.entities);
        let getUncertainEntities = block =>
            isClusterMode? Object.keys(block.entities).filter(e => block.entities[e] < num): [];

        // Debounce the hovering
        let timer;
        let onMouseEnterBlock = (b) => {
            timer = setTimeout(() => {
                onToggleBlock(getCertainEntities(b), getUncertainEntities(b));
            }, 500);
        };
        let onMouseLeaveBlock = () => {
            if (timer) {
                clearTimeout(timer);
            } else {
                onToggleBlock([], []);
            }
        };
        return (
            <svg width={size + 2 * margin} height={size + 2 * margin + (isClusterMode? proportionBarHeight + proportionTopMargin: 0)}>
                <g transform={`translate(${margin},${margin})`}>
                    {isClusterMode &&
                    <g className="proportion" >
                        <rect x="0" y="0" width={size} height={proportionBarHeight} className="total"/>
                        <rect x="0" y="0" width={numScale(num)} height={proportionBarHeight} className="num" />
                        <text x={size} dx="-14" dy="9">{num}</text>
                    </g>
                    }
                    <g transform={`translate(0,${isClusterMode? proportionBarHeight + proportionTopMargin: 0})`}>
                       <g className="blocks" >
                            {blockArr.filter(b => b.width > 0).map(b =>
                                <g key={b.id}>
                                    <rect className={cn('block', {'range-selected': b.rangeSelected > 0, 'fuzzy': hasUncertainty(b),
                                        'is-missing': b.isMissing})} rx={b.isMissing? 5: 0} ry={b.isMissing? 5: 0}
                                          x={b.x} y={b.y} width={b.width} height={b.height}
                                          filter={hasUncertainty(b)? `url(#blur${this.props.data.tid})`: ''}
                                    />

                                    {!isClusterMode && b.fillPercentage > 0.001 &&
                                    <rect className="highlight-block" x={b.x} y={b.y}
                                          width={b.fillPercentage * b.width} height={b.height} />}
                                    {!isClusterMode && b.fillPercentage > 0.5 && b.isLeaf &&
                                    <rect className="highlight-block" x={size - b.highlightWidth} y={b.y}
                                          width={b.highlightWidth} height={b.height} />}

                                    {isClusterMode && b.colorBins &&
                                    b.colorBins.map((d, i) =>
                                        <line key={i} className="highlight-block fuzzy" style={{stroke: d, strokeWidth: shadedGranularity}}
                                              x1={b.x + i * shadedGranularity + 1} y1={b.y}
                                              x2={b.x + i * shadedGranularity + 1} y2={b.y+b.height}/>)}
                                    {isClusterMode && !b.colorBins && b.fillPercentage[0] > 0.001 &&
                                    <rect className="highlight-block" x={b.x} y={b.y}
                                          width={b.fillPercentage[0] * b.width} height={b.height} />}

                                    <rect className="respond-box"
                                          x={b.x} y={b.y} width={b.width} height={b.height}
                                          onMouseEnter={() => {onMouseEnterBlock(b)}}
                                          onMouseLeave={onMouseLeaveBlock}
                                    />

                                    {!isSuperCluster && b.n > 1 && <text className="label" x={b.x} y={b.y} dx={5} dy={10}>{b.n}</text>}
                                </g>
                            )}
                        </g>
                        <g className="branches">
                            {branchArr.map(b => <line className="branch" key={b.bid}
                                                      filter={hasUncertainty(blocks[b.bid])? `url(#blurBranch${this.props.data.tid})`: ''}
                                                      x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
                            {branches[lastSelected] && <g filter={hasUncertainty(blocks[lastSelected])? `url(#blurBranch${this.props.data.tid})`: ''}>
                                <line className="last-selected-indicator" x1={branches[lastSelected].x1} y1={branches[lastSelected].y1-2}
                                      x2={branches[lastSelected].x2} y2={branches[lastSelected].y2-2}/>
                                <line className="last-selected-indicator" x1={branches[lastSelected].x1} y1={branches[lastSelected].y1+2}
                                      x2={branches[lastSelected].x2} y2={branches[lastSelected].y2+2}/>
                            </g>}
                        </g>
                    </g>
                </g>
                <defs>
                    <filter id={`blur${this.props.data.tid}`} filterUnits="userSpaceOnUse" x="-20%" y="-20%" width="150%" height="150%">
                        <feGaussianBlur in="StrokePaint" stdDeviation="1" />
                    </filter>
                    <filter id={`blurBranch${this.props.data.tid}`} filterUnits="userSpaceOnUse" x="-20%" y="-20%" width="150%" height="150%">
                        <feGaussianBlur in="StrokePaint" stdDeviation="0,2" />
                    </filter>
                </defs>
            </svg>
        )
    }
}

export default AggregatedDendrogram;
