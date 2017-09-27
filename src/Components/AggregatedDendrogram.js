/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import cn from 'classnames';
import {scaleLinear} from 'd3';
import {createArrayFromMapping} from '../utils';
import './Dendrogram.css';

class AggregatedDendrogram extends Component {
    render() {
        let {spec, isCluster, shadedGranularity, onToggleBlock, isComparing, data, hoveredTreeCnt,
            isSelected, selectedTreeColor} = this.props;
        let {width, height, margin, proportionBarHeight, proportionTopMargin, showLabels} = spec;
        let {trees, blocks, branches, num, total, selectedCnt} = data;
        let blockArr = createArrayFromMapping(blocks);
        let branchArr = createArrayFromMapping(branches);
        let numScale = scaleLinear().domain([0, total]).range([0, width]);

        let getCertainEntities = block =>
            isCluster? Object.keys(block.entities).filter(e => block.entities[e] === num): Object.keys(block.entities);
        let getUncertainEntities = block =>
            isCluster? Object.keys(block.entities).filter(e => block.entities[e] < num): [];

        // Debounce the hovering
        let timer = null;
        let onMouseEnterBlock = (b) => {
            timer = setTimeout(() => {
                timer = null;
                onToggleBlock(isCluster? trees: [data.tid], getCertainEntities(b), getUncertainEntities(b));
            }, 300);
        };
        let onMouseLeaveBlock = () => {
            if (timer) {
                clearTimeout(timer);
            } else {
                setTimeout(() => {onToggleBlock([], [], [])}, 0);
            }
        };

        let svgWidth = width + margin.left + margin.right;
        let svgHeight = height + margin.top + margin.bottom + (isCluster? proportionBarHeight + proportionTopMargin: 0);

        return (
            <svg width={svgWidth} height={svgHeight}>
                {isSelected &&
                <rect className="selected-tree-indicator" x="0" y="0" width={svgWidth} height={svgHeight}
                 style={{fill: selectedTreeColor}}/>}

                <g transform={`translate(${margin.left},${margin.top})`}>
                    {isCluster &&
                    <g className="proportion" >
                        <rect x="0" y="0" width={width} height={proportionBarHeight} className="total"/>
                        <rect x="0" y="0" width={numScale(num)} height={proportionBarHeight} className="num" />
                        {selectedCnt > 0 && selectedCnt < num &&
                        <rect x="0" y="0" width={numScale(selectedCnt)} height={proportionBarHeight} className="selected"
                              style={{fill: selectedTreeColor}} />}
                        {hoveredTreeCnt > 0 && hoveredTreeCnt < num &&
                        <rect x="0" y="0" width={numScale(hoveredTreeCnt)} height={proportionBarHeight} className="hovered" />}

                        <text x="0" y="0" dx="4" dy="9">{num}</text>
                    </g>
                    }
                    <g transform={`translate(0,${isCluster? proportionBarHeight + proportionTopMargin: 0})`}>
                       <g className="blocks" >
                            {blockArr.filter(b => b.width > 0).map(b =>
                                <g key={b.id}>
                                    <rect className={cn('block', {expanded: !b.collapsed && !b.context && b.id !== 'missing',
                                        fuzzy: !b.context && !b.collapsed && !b.matched, 'is-missing': b.isMissing})}
                                          rx={b.isMissing? 5: 0} ry={b.isMissing? 5: 0}
                                          x={b.x} y={b.y} width={b.width} height={b.height}
                                    />

                                    {!isCluster && b.fill &&
                                        b.fill.map((f, i) =>
                                            <rect key={i} className="highlight-block"
                                                  style={{fill: f.color}}
                                                  x={b.x} y={b.y + i * (b.height / b.fill.length)}
                                                  width={f.proportion * b.width} height={b.height / b.fill.length} />) }

                                    {isCluster && b.fill &&
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

                                    {showLabels && b.n > 1 && b.width > 12 && b.height > 12 &&
                                    <g>
                                        {!isCluster && b.width > 24 &&
                                        <text className="label" x={b.x + b.width} y={b.y} dx="-2" dy="10" style={{textAnchor: 'end'}}>{b.n}</text>}
                                        {b.no && b.width > 12 &&
                                        <text className="label" x={b.x} y={b.y} dx="1" dy="10">{b.no}</text>}
                                    </g>}
                                </g>
                            )}
                        </g>
                        <g className="branches">
                            {branchArr.map(b =>
                                b.collapsed?
                                    (b.x2 - b.x1 > 22?
                                            <g key={b.bid}>
                                                <line className="branch collapsed"
                                                      x1={b.x1} y1={b.y1} x2={(b.x1 + b.x2) / 2 - 2} y2={b.y2} />
                                                <line className="branch collapsed"
                                                      x1={(b.x1 + b.x2) / 2 + 2} y1={b.y1} x2={b.x2} y2={b.y2} />
                                                <line className="branch" x1={(b.x1 + b.x2) / 2 - 2} y1={b.y1 - 4} x2={(b.x1 + b.x2) / 2 - 2} y2={b.y1 + 4} />
                                                <line className="branch" x1={(b.x1 + b.x2) / 2 + 2} y1={b.y1 - 4} x2={(b.x1 + b.x2) / 2 + 2} y2={b.y1 + 4} />
                                            </g>:
                                            <g key={b.bid}>
                                                <line className="branch collapsed"
                                                      x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />
                                                <line className="branch" x1={(b.x1 + b.x2) / 2 + 1} y1={b.y1 - 4} x2={(b.x1 + b.x2) / 2 - 1} y2={b.y1 + 4} />
                                            </g>
                                    ):
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
