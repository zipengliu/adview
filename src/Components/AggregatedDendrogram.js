/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import cn from 'classnames';
import {createArrayFromMapping} from '../utils';
import './Dendrogram.css';

class AggregatedDendrogram extends Component {
    render() {
        // console.log(this.props.data);
        let {spec, isClusterMode, shadedGranularity, onToggleBlock} = this.props;
        let {size, margin, proportionBarHeight, proportionTopMargin} = spec;
        let {blocks, branches, num, total, lastSelected} = this.props.data;
        let blockArr = createArrayFromMapping(blocks);
        let branchArr = createArrayFromMapping(branches);

        return (
            <svg width={size + 2 * margin} height={size + 2 * margin + (isClusterMode? proportionBarHeight + proportionTopMargin: 0)}>
                <g transform={`translate(${margin},${margin})`}>
                    <g className="blocks">
                        {blockArr.map(b =>
                            <g key={b.id}>
                                {b.width > 0 &&
                                <rect className={cn('block', {'range-selected': b.rangeSelected > 0, 'fuzzy': !isClusterMode && b.similarity < 1.0})}
                                      x={b.x} y={b.y} width={b.width} height={b.height}
                                />}

                                {!isClusterMode && b.fillPercentage > 0.001 &&
                                <rect className="highlight-block" x={b.x} y={b.y}
                                      width={b.fillPercentage * b.width} height={b.height} />}
                                {!isClusterMode && b.fillPercentage > 0.5 && b.isLeaf &&
                                <rect className="highlight-block" x={size - b.highlightWidth} y={b.y}
                                      width={b.highlightWidth} height={b.height} />}

                                {isClusterMode && b.colorBins &&
                                b.colorBins.map((d, i) =>
                                    <line key={i} style={{stroke: d, strokeWidth: shadedGranularity}}
                                          x1={b.x + i * shadedGranularity} y1={b.y}
                                          x2={b.x + i * shadedGranularity} y2={b.y+b.height}/>)}

                                {!isClusterMode &&
                                <rect className="respond-box"
                                    x={b.x} y={b.y} width={b.width} height={b.height}
                                    onMouseEnter={isClusterMode? null: onToggleBlock.bind(null, Object.keys(b.entities))}
                                    onMouseLeave={isClusterMode? null: onToggleBlock.bind(null, [])}
                                />}

                                {b.n > 1 && <text className="label" x={b.x} y={b.y} dx={5} dy={10}>{b.n}</text>}
                            </g>
                        )}
                    </g>
                    <g className="branches">
                        {branchArr.map(b => <line className="branch" key={b.bid}
                                                 x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
                        {branches[lastSelected] && <g>
                            <line className="last-selected-indicator" x1={branches[lastSelected].x1} y1={branches[lastSelected].y1-2}
                            x2={branches[lastSelected].x2} y2={branches[lastSelected].y2-2}/>
                            <line className="last-selected-indicator" x1={branches[lastSelected].x1} y1={branches[lastSelected].y1+2}
                                  x2={branches[lastSelected].x2} y2={branches[lastSelected].y2+2}/>
                        </g>}
                    </g>
                    {isClusterMode &&
                    <g className="proportion" transform={`translate(0,${size + proportionTopMargin})`}>
                        <rect x="0" y="0" width={size} height={proportionBarHeight} className="total"/>
                        <rect x="0" y="0" width={num / total * size} height={proportionBarHeight} className="num" />
                        <text dx="1" dy="9">{`${num}/${total}`}</text>
                    </g>
                    }
                </g>
            </svg>
        )
    }
}

export default AggregatedDendrogram;
