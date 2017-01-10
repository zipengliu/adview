/**
 * Created by zipeng on 2017-01-06.
 */

import React from 'react';
import {scaleLinear, line} from 'd3';

let LineChart = props => {
    let {spec, data} = props;

    let effectiveWidth = spec.width - spec.margin.left - spec.margin.right;
    let xScale = scaleLinear().domain([0, 1]).range([0, effectiveWidth]).clamp(true);
    let tickFormat = xScale.tickFormat(5, '.1f');
    // let rangeFormat = format('.2f');
    let yScale = scaleLinear().domain([0, 1]).range([0, spec.histogramHeight]);

    let points = [{x: 0, y: spec.histogramHeight}];
    for (let i = 0; i < data.length; i++) {
        points.push({x: xScale(data[i]), y: spec.histogramHeight - yScale((i+1) / data.length)});
    }
    points.push({x: xScale(1), y: 0});

    let l = line().x(d => d.x).y(d => d.y);

    return (
        <svg width={spec.width} height={spec.histogramHeight + spec.sliderHeight} className="attribute-chart">
            <g transform={`translate(${spec.margin.left},${spec.margin.top})`}>
                <text className="title">CDF of similarity to selected branch </text>
                <text className="title" dy="12">on reference tree</text>
                <path className="line" d={l(points)}/>

                <g className="slider" transform={`translate(0,${spec.histogramHeight})`}>
                    <g className="axis" transform="translate(0, 1)">
                        <line x1="0" y1="1" x2={effectiveWidth} y2="1"/>
                        {xScale.ticks(5).map((t, i) => <g key={i} transform={`translate(${xScale(t)},0)`}>
                            <line x1="0" y1="0" x2="0" y2="5" />
                            <text dx="-7" dy="16">{tickFormat(t)}</text>
                        </g>)}
                    </g>
                </g>
            </g>
        </svg>
    )

};

export default LineChart;

