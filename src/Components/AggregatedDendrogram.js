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
        let {spec, mode, shadedGranularity, onToggleBlock} = this.props;
        let isClusterMode = mode.indexOf('cluster') !== -1;
        let {size, margin, proportionBarHeight, proportionTopMargin} = spec;
        let {blocks, branches, num, total, lastSelected} = this.props.data;
        let blockArr = createArrayFromMapping(blocks);
        let branchArr = createArrayFromMapping(branches);
        let numScale = scaleLog().base(1.01).domain([1, total]).range([0, size]);

        let numMatches = 0;
        let numNonMatches = 0;
        if (isClusterMode) {
            if (lastSelected) {
                let s = blocks[lastSelected].similarity;
                numMatches = s.filter(a => a === 1.0).length;
                if (s.length > 5) {
                    numMatches = Math.ceil(5 * numMatches / s.length);
                }
                numNonMatches = Math.min(s.length, 5) - numMatches;
            }
        } else {
            numMatches = lastSelected && blocks[lastSelected] && blocks[lastSelected].similarity === 1.0? 1: 0;
        }

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
            }, 300);
        };
        let onMouseLeaveBlock = () => {
            if (timer) {
                clearTimeout(timer);
            } else {
                onToggleBlock([], []);
            }
        };
        return (
            <svg width={size + margin.left + margin.right} height={size + margin.top + margin.bottom + (isClusterMode? proportionBarHeight + proportionTopMargin: 0)}>
                <g transform={`translate(${margin.left},${margin.top})`}>
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

                                    {mode !== 'supercluster' && b.n > 1 && <text className="label" x={b.x} y={b.y} dx={5} dy={10}>{b.n}</text>}
                                </g>
                            )}
                        </g>
                        <g className="branches">
                            {branchArr.map(b => <line className={cn('branch', {background: mode === 'fine-grained' && !b.expanded})} key={b.bid}
                                                      filter={hasUncertainty(blocks[b.bid])? `url(#blurBranch${this.props.data.tid})`: ''}
                                                      x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
                            {branches[lastSelected] && <g filter={hasUncertainty(blocks[lastSelected])? `url(#blurBranch${this.props.data.tid})`: ''}>
                                <line className="last-selected-indicator" x1={branches[lastSelected].x1} y1={branches[lastSelected].y1-2}
                                      x2={branches[lastSelected].x2} y2={branches[lastSelected].y2-2}/>
                                <line className="last-selected-indicator" x1={branches[lastSelected].x1} y1={branches[lastSelected].y1+2}
                                      x2={branches[lastSelected].x2} y2={branches[lastSelected].y2+2}/>
                            </g>}
                        </g>
                        {(numMatches > 0 || numNonMatches > 0) &&
                        <g transform={`translate(${size},0)`}>
                            {Array(numMatches).fill(1).map((d, i) =>
                                <use key={i} xlinkHref={`#tick${this.props.data.tid}`} y={i * 15}></use>
                            )}
                            {Array(numNonMatches).fill(1).map((d, i) =>
                                <use key={i} xlinkHref={`#tick${this.props.data.tid}`} y={(numMatches + i) * 15} style={{fillOpacity: .3}}></use>
                            )}
                        </g>}
                    </g>
                </g>
                <symbol id={`tick${this.props.data.tid}`}>
                    <circle cx="8" cy="6" r="6" style={{fill: 'steelblue'}} />
                    <text dx="4" dy="10" style={{fill: '#e37d7d', fontSize: '10px'}}>&#10003;</text>
                </symbol>
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
