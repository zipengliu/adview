/**
 * Created by Zipeng Liu on 2016-12-19.
 */

import React, { Component } from 'react';
import {scaleLinear, scaleLog, max as d3Max} from 'd3';

import './histogramSlider.css';

let Histogram = props => {
    let {width, height, bins} = props;
    const margin = 2, marginTop = 10;
    let xScale = scaleLinear().domain([0, 1]).range([0, width - margin * 2]);
    let yScale = scaleLog().base(2).domain([1, d3Max(bins, d => d.length + 1)]).rangeRound([0, height - marginTop]);

    return (
        <svg width={width} height={height} className="histogram">
            <g transform={`translate(${margin},${marginTop})`}>
                {bins.map((b, i) => <rect key={i} className="bar" x={xScale(b.x0)} y={height - marginTop - yScale(b.length + 1)}
                                     width={xScale(b.x1) - xScale(b.x0) - 1} height={yScale(b.length + 1)} />)}
            </g>
        </svg>
    )
};

export default Histogram;
