/**
 * Created by zipeng on 2017-01-06.
 */

import React from 'react';
import {scaleLinear, line, format} from 'd3';

let LineChart = props => {
    let {spec, data, attributeName, selection} = props;
    let hasData = !!data;

    let effectiveWidth = spec.width - spec.margin.left - spec.margin.right;
    let xScale = scaleLinear().domain([0, 1]).range([0, effectiveWidth]).clamp(true);
    let tickFormat = xScale.tickFormat(5, '.1f');
    let controlPos = selection? selection.range.map(xScale): null;
    let rangeFormat = format('.2f');

    let yScale, yTicks, yTickFormat, onDragging, points, l;
    if (hasData) {
        yScale = scaleLinear().domain([0, 1]).range([0, spec.chartHeight]);
        yTicks = yScale.ticks(3);
        yTickFormat = yScale.tickFormat(3, '%');
        onDragging = (event) => {
            let parentPos = event.currentTarget.getBoundingClientRect();
            let x = event.clientX - parentPos.left - spec.margin.left;
            let v = xScale.invert(x);
            props.moveControlHandle(v);
        };

        points = [{x: 0, y: spec.chartHeight}];
        for (let i = 0; i < data.length; i++) {
            points.push({x: xScale(data[i]), y: spec.chartHeight - yScale((i+1) / data.length)});
        }
        points.push({x: xScale(1), y: 0});

        l = line().x(d => d.x).y(d => d.y);
    }



    return (
        <svg width={spec.width} height={spec.chartHeight + spec.sliderHeight} className="attribute-chart"
             onMouseMove={hasData && selection && selection.isMoving? onDragging: null}
             onMouseUp={hasData? props.toggleMoveHandle: null}
        >
            <g transform={`translate(${spec.margin.left},${spec.margin.top})`}>
                <text className="title" dx="5">{hasData? attributeName + ' (%)': 'Not Applicable'}</text>
                {hasData && selection &&
                <text className="range-text" dx="5" dy="12">{`${rangeFormat(selection.range[0])} - ${rangeFormat(selection.range[1])}`}</text>
                }

                {hasData &&
                <path className="line" d={l(points)}/>
                }

                <g className="axis">
                    <line x1="-2" y1="0" x2="-2" y2={spec.chartHeight} />
                    {hasData && yTicks.map((t, i) => <g key={i}>
                        <line x1="-5" y1={spec.chartHeight - yScale(t)} x2="-2" y2={spec.chartHeight - yScale(t)} />
                        <text x="-5" y={spec.chartHeight - yScale(t)} dx="-2" dy="5" textAnchor="end">{yTickFormat(t).slice(0, -1)}</text>
                    </g>)}
                </g>
                <g className="slider" transform={`translate(0,${spec.chartHeight})`}>
                    <g className="axis" transform="translate(0, 1)">
                        <line x1="0" y1="1" x2={effectiveWidth} y2="1"/>
                        {xScale.ticks(5).map((t, i) => <g key={i} transform={`translate(${xScale(t)},0)`}>
                            <line x1="0" y1="0" x2="0" y2="5" />
                            <text dx="-7" dy="16">{tickFormat(t)}</text>
                        </g>)}
                    </g>
                    {selection &&
                    <g transform="translate(0,2)">
                        <path d="M0,0L-4,8L4,8Z" className="control" transform={`translate(${controlPos[0]}, 0)`}
                              onMouseDown={hasData? props.toggleMoveHandle.bind(null, attributeName, 'left'): null}/>
                        <path d="M0,0L-4,8L4,8Z" className="control" transform={`translate(${controlPos[1]}, 0)`}
                              onMouseDown={hasData? props.toggleMoveHandle.bind(null, attributeName, 'right'): null}/>
                        <rect className="selected-area" x={controlPos[0]} y="-3" width={controlPos[1] - controlPos[0]} height="6"/>
                    </g>
                    }
                </g>
            </g>
        </svg>
    )

};

export default LineChart;

