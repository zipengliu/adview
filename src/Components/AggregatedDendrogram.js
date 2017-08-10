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
        let {spec, mode, shadedGranularity, onToggleBlock, hoveredTrees, isComparing, data} = this.props;
        let isClusterMode = mode.indexOf('cluster') !== -1;
        let {size, margin, proportionBarHeight, proportionTopMargin} = spec;
        let {trees, blocks, branches, num, total, selectedCnt} = data;
        let blockArr = createArrayFromMapping(blocks);
        let branchArr = createArrayFromMapping(branches);
        let numScale = scaleLog().base(1.01).domain([1, total]).range([0, size]);
        let highlightTreeCnt = isClusterMode? trees.filter(tid => hoveredTrees.hasOwnProperty(tid)).length:
            hoveredTrees.hasOwnProperty(this.props.data.tid);

        let getCertainEntities = block =>
            isClusterMode? Object.keys(block.entities).filter(e => block.entities[e] === num): Object.keys(block.entities);
        let getUncertainEntities = block =>
            isClusterMode? Object.keys(block.entities).filter(e => block.entities[e] < num): [];

        // Debounce the hovering
        let timer = null;
        let onMouseEnterBlock = (b) => {
            timer = setTimeout(() => {
                timer = null;
                onToggleBlock(isClusterMode? trees: [data.tid], getCertainEntities(b), getUncertainEntities(b));
            }, 300);
        };
        let onMouseLeaveBlock = () => {
            if (timer) {
                clearTimeout(timer);
            } else {
                setTimeout(() => {onToggleBlock([], [], [])}, 0);
            }
        };

        let svgWidth = size + margin.left + margin.right;
        let svgHeight = size + margin.top + margin.bottom + (isClusterMode? proportionBarHeight + proportionTopMargin: 0);

        let isHighlighted = (!isClusterMode && highlightTreeCnt) || (isClusterMode && highlightTreeCnt === num);

        return (
            <svg width={svgWidth} height={svgHeight}>
                {/*{!isHighlighted && rangeSelected &&*/}
                {/*<rect className="range-selected-cb-indicator" x="0" y="0" width={svgWidth} height={svgHeight}/>}*/}
                {isHighlighted &&
                <rect className="highlight-tree-indicator" x="0" y="0" width={svgWidth} height={svgHeight}/>}

                <g transform={`translate(${margin.left},${margin.top})`}>
                    {isClusterMode &&
                    <g className="proportion" >
                        <rect x="0" y="0" width={size} height={proportionBarHeight} className="total"/>
                        <rect x="0" y="0" width={numScale(num)} height={proportionBarHeight} className="num" />
                        {highlightTreeCnt > 0 && highlightTreeCnt < num &&
                        <rect x="0" y="0" width={numScale(highlightTreeCnt)} height={proportionBarHeight} className="highlight" />}
                        {selectedCnt > 0 && selectedCnt < num &&
                        <rect x="0" y="0" width={numScale(selectedCnt)} height={proportionBarHeight} className="selected" />}

                        <text x="0" y="0" dx="4" dy="9">{num}</text>
                    </g>
                    }
                    <g transform={`translate(0,${isClusterMode? proportionBarHeight + proportionTopMargin: 0})`}>
                       <g className="blocks" >
                            {blockArr.filter(b => b.width > 0).map(b =>
                                <g key={b.id}>
                                    <rect className={cn('block', {expanded: !b.collapsed && !b.context && b.id !== 'missing',
                                        fuzzy: !b.context && !b.collapsed && !b.matched, 'is-missing': b.isMissing})}
                                          rx={b.isMissing? 5: 0} ry={b.isMissing? 5: 0}
                                          x={b.x} y={b.y} width={b.width} height={b.height}
                                    />

                                    {!isClusterMode && b.fill &&
                                        b.fill.map((f, i) =>
                                            <rect key={i} className="highlight-block"
                                                  style={{fill: f.color}}
                                                  x={b.x} y={b.y + i * (b.height / b.fill.length)}
                                                  width={f.proportion * b.width} height={b.height / b.fill.length} />) }

                                    {!isClusterMode && b.fill && b.isLeaf && false &&
                                    <rect className="highlight-block" x={size - b.highlightWidth} y={b.y}
                                          width={b.highlightWidth} height={b.height} />}

                                    {isClusterMode && b.fill &&
                                    b.fill.map((f, i) =>
                                        <g key={i}>
                                            {f.colorBins?
                                                f.colorBins.map((binColor, j) =>
                                                    <line key={j} className="highlight-block fuzzy" style={{stroke: binColor, strokeWidth: shadedGranularity}}
                                                          x1={b.x + j * shadedGranularity + 1} y1={b.y + i * b.height / b.fill.length}
                                                          x2={b.x + j * shadedGranularity + 1} y2={b.y + (i + 1) * b.height / b.fill.length} />):
                                                <rect className="highlight-block" style={{fill: f.color}}
                                                      x={b.x} y={b.y + i * b.height / b.fill.length}
                                                      width={f.proportion[0] * b.width} height={b.height / b.fill.length} />
                                            }
                                        </g>)}

                                    <rect className="respond-box"
                                          x={b.x} y={b.y} width={b.width} height={b.height}
                                          onMouseEnter={() => {onMouseEnterBlock(b)}}
                                          onMouseLeave={onMouseLeaveBlock}
                                    />

                                    {mode !== 'supercluster' && b.n > 1 && b.width > 12 &&
                                    <g>
                                        {((b.context || b.isMissing) && b.height > 12) || b.height > 22?
                                            <text className="label" x={b.x} y={b.y} dx={1} dy={10}>{b.n}</text>:
                                            (b.width > 22? <text className="label" x={b.x + b.width} y={b.y} dx="-2" dy="10" style={{textAnchor: 'end'}}>{b.n}</text>:
                                                <g></g>)
                                        }
                                    </g>}
                                    {mode !== 'supercluster' && b.no && b.width > 12 &&
                                    <text className="label" x={b.x} y={b.y + b.height} dx="1" dy="-2">{b.no}</text>}
                                </g>
                            )}
                        </g>
                        <g className="branches">
                            {branchArr.map(b =>
                                b.collapsed?
                                    <g key={b.bid}>
                                        <line className="branch collapsed"
                                              x1={b.x1 + 4} y1={b.y1} x2={b.x2} y2={b.y2} />
                                        <line className="branch" x1={b.x1} y1={b.y1 - 4} x2={b.x1} y2={b.y1 + 4} />
                                        <line className="branch" x1={b.x1 + 4} y1={b.y1 - 4} x2={b.x1 + 4} y2={b.y1 + 4} />
                                    </g>:
                                    <line className='branch' key={b.bid}
                                          x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
                        </g>
                    </g>
                </g>
                {isComparing &&
                <use xlinkHref="#comparing-tree-indicator-in-full" x={svgWidth - 16} y="0"
                     width="12" height="12"/>
                }
            </svg>
        )
    }
}

export default AggregatedDendrogram;
