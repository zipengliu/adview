/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import cn from 'classnames';
import {scaleLog, path as d3Path} from 'd3';
import {createArrayFromMapping} from '../utils';
import './Dendrogram.css';

class AggregatedDendrogram extends Component {
    render() {
        // console.log(this.props.data);
        let {spec, mode, shadedGranularity, onToggleBlock} = this.props;
        let isClusterMode = mode.indexOf('cluster') !== -1;
        let {size, margin, proportionBarHeight, proportionTopMargin} = spec;
        let {blocks, branches, num, total, lastSelected, isCBinRange} = this.props.data;
        let blockArr = createArrayFromMapping(blocks);
        let branchArr = createArrayFromMapping(branches);
        let numScale = scaleLog().base(1.01).domain([1, total]).range([0, size]);

        let numMatches = 0;
        let numNonMatches = 0;
        // if (isClusterMode) {
        //     if (lastSelected) {
        //         let s = blocks[lastSelected].similarity;
        //         numMatches = s.filter(a => a === 1.0).length;
        //         if (s.length > 5) {
        //             numMatches = Math.ceil(5 * numMatches / s.length);
        //         }
        //         numNonMatches = Math.min(s.length, 5) - numMatches;
        //     }
        // } else {
        //     numMatches = lastSelected && blocks[lastSelected] && blocks[lastSelected].similarity === 1.0? 1: 0;
        // }

        let hasUncertainty = block => {
            if (!block) return false;
            if (isClusterMode) {
                for (let i = 0; i < block.similarity.length; i++) {
                    if (block.matched === false) return true;
                }
                return false;
            } else {
                return block.matched ===  false;
            }
        };

        let getCertainEntities = block =>
            isClusterMode? Object.keys(block.entities).filter(e => block.entities[e] === num): Object.keys(block.entities);
        let getUncertainEntities = block =>
            isClusterMode? Object.keys(block.entities).filter(e => block.entities[e] < num): [];

        // Debounce the hovering
        let timer = null;
        let onMouseEnterBlock = (b) => {
            timer = setTimeout(() => {
                timer = null;
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

        let getLastExpandedGlyph = (blk) => {
            let w = Math.min(8, Math.max(blk.height, blk.width));
            let p = d3Path();
            p.moveTo(blk.x, blk.y + blk.height);
            p.lineTo(blk.x + w, blk.y + blk.height);
            p.lineTo(blk.x, blk.y + blk.height - w);
            p.closePath();
            return <path d={p.toString()} style={{stroke: 'none', fill: '#e41a1c'}}></path>;
        };

        return (
            <svg width={size + margin.left + margin.right} height={size + margin.top + margin.bottom + (isClusterMode? proportionBarHeight + proportionTopMargin: 0)}>
                {this.props.isReferenceTree && <rect className="reference-tree-indicator" x="0" y="0"
                                                     width={size + margin.left + margin.right} height={size + margin.top + margin.bottom}/>}
                {isCBinRange && <rect className="range-selected-cb-indicator" x="0" y="0"
                                                     width={size + margin.left + margin.right} height={size + margin.top + margin.bottom}/>}
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
                                    <rect className={cn('block', {'range-selected': b.rangeSelected > 0,
                                        expanded: !b.context && b.id !== 'missing', fuzzy: !b.context && !b.matched,
                                        'is-missing': b.isMissing})} rx={b.isMissing? 5: 0} ry={b.isMissing? 5: 0}
                                          x={b.x} y={b.y} width={b.width} height={b.height}
                                    />
                                    {!b.context && b.lastExpanded && b.n > 0 && getLastExpandedGlyph(b)}

                                    {!isClusterMode && b.fill &&
                                        b.fill.map((f, i) => <rect key={i} className="highlight-block"
                                                                   style={{fill: f.color}}
                                                                   x={b.x + f.start * b.width} y={b.y} width={f.width * b.width} height={b.height} />) }

                                    {/*TODO*/}
                                    {!isClusterMode && b.fill && b.isLeaf && false &&
                                    <rect className="highlight-block" x={size - b.highlightWidth} y={b.y}
                                          width={b.highlightWidth} height={b.height} />}

                                    {false && isClusterMode && b.colorBins &&
                                    b.colorBins.map((d, i) =>
                                        <line key={i} className="highlight-block fuzzy" style={{stroke: d, strokeWidth: shadedGranularity}}
                                              x1={b.x + i * shadedGranularity + 1} y1={b.y}
                                              x2={b.x + i * shadedGranularity + 1} y2={b.y+b.height}/>)}
                                    {false && isClusterMode && !b.colorBins && b.fillPercentage[0] > 0.001 &&
                                    <rect className="highlight-block" x={b.x} y={b.y}
                                          width={b.fillPercentage[0] * b.width} height={b.height} />}

                                    <rect className="respond-box"
                                          x={b.x} y={b.y} width={b.width} height={b.height}
                                          onMouseEnter={() => {onMouseEnterBlock(b)}}
                                          onMouseLeave={onMouseLeaveBlock}
                                    />

                                    {mode !== 'supercluster' && b.n > 1 && <text className="label" x={b.x} y={b.y} dx={1} dy={10}>{b.n}</text>}
                                </g>
                            )}
                        </g>
                        <g className="branches">
                            {branchArr.map(b =>
                                <line className={cn('branch', {background: (mode === 'fine-grained' || mode === 'frond') && !b.expanded,
                                    'range-selected': b.rangeSelected})}
                                      key={b.bid}
                                      x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
                        </g>
                    </g>
                </g>
            </svg>
        )
    }
}

export default AggregatedDendrogram;
