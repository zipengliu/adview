/**
 * Created by Zipeng Liu on 2016-11-23.
 */

import React, { Component } from 'react';
import './Dendrogram.css';

class AggregatedDendrogram extends Component {
    render() {
        // console.log(this.props.data);
        let {spec, isClusterMode} = this.props;
        let {size, margin, proportionBarHeight, proportionTopMargin} = spec;
        let {blockArr, branchArr, num, total} = this.props.data;
        return (
            <svg width={size + 2 * margin} height={size + 2 * margin + (isClusterMode? proportionBarHeight + proportionTopMargin: 0)}>
                <g transform={`translate(${margin},${margin})`}>
                    <g className="blocks">
                        {blockArr.map(b =>
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
                        {branchArr.map(b => <line className="branch" key={b.id}
                                                 x1={b.x1} y1={b.y1} x2={b.x2} y2={b.y2} />)}
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
