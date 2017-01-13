/**
 * Created by Zipeng Liu on 2016-12-19.
 */

import React from 'react';
import {scaleLinear, scaleLog, max as d3Max, format} from 'd3';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

let HistogramSlider = props => {
    let {foregroundBins, backgroundBins, spec, selectedRange, attributeName} = props;
    let effectiveWidth = spec.width - spec.margin.left - spec.margin.right;
    // The x domain is always [0, 1]
    let xScale = scaleLinear().domain([0, 1]).range([0, effectiveWidth]).clamp(true);
    let xTickFormat = xScale.tickFormat(5, '.1f');
    let rangeFormat = format('.2f');

    let yMax = d3Max(backgroundBins? backgroundBins: foregroundBins, d => d.length + 1);
    let yScale = scaleLog().base(10).domain([1, yMax]).rangeRound([0, spec.histogramHeight]);
    let yTicks = [];
    for (let i = 0; i <= Math.floor(Math.log(yMax) / Math.log(10)); i++) {
        yTicks.push(Math.pow(10, i));
    }
    let controlPos = selectedRange.map(xScale);

    let onDragging = (event) => {
        let parentPos = event.currentTarget.getBoundingClientRect();
        let x = event.clientX - parentPos.left - spec.margin.left;
        let v = xScale.invert(x);
        props.moveControlHandle(v);
    };

    return (
        <svg width={spec.width} height={spec.histogramHeight + spec.sliderHeight} className="attribute-chart"
             onMouseMove={props.isMovingHandle? onDragging: null}
             onMouseUp={props.toggleMoveHandle}
        >
            <g transform={`translate(${spec.margin.left},${spec.margin.top})`}>
                <text className="title">{attributeName}</text>
                <text className="range-text" dy="12">{`${rangeFormat(selectedRange[0])} - ${rangeFormat(selectedRange[1])}`}</text>
                <g className="bars">
                    {!!backgroundBins &&
                    backgroundBins.map((b, i) =>
                        <OverlayTrigger key={i} placement="top" overlay={<Tooltip id={`background-bar-${i}`}>{b.length}</Tooltip>}>
                        <rect className="bar background" x={xScale(b.x0)} y={spec.histogramHeight - yScale(b.length + 1)}
                        width={xScale(b.x1) - xScale(b.x0) - 1} height={yScale(b.length + 1)} />
                        </OverlayTrigger>)
                    }
                    {foregroundBins &&
                    foregroundBins.map((b, i) =>
                        <OverlayTrigger key={i} placement="top" overlay={<Tooltip id={`foreground-bar-${i}`}>{b.length}</Tooltip>}>
                            <rect className="bar foreground" x={xScale(b.x0)} y={spec.histogramHeight - yScale(b.length + 1)}
                                  width={xScale(b.x1) - xScale(b.x0) - 1} height={yScale(b.length + 1)} />
                        </OverlayTrigger>)}
                </g>
                <g className="axis">
                    <line x1="-2" y1="0" x2="-2" y2={spec.histogramHeight} />
                    {yTicks.map((t, i) => <g key={i}>
                        <line x1="-5" y1={spec.histogramHeight - yScale(t + 1)} x2="-2" y2={spec.histogramHeight - yScale(t + 1)} />
                        <text x="-5" y={spec.histogramHeight - yScale(t + 1)} dx="-17" dy="5">{i === 0? 1: 10}</text>
                        {i > 1 &&
                        <text x="-5" y={spec.histogramHeight - yScale(t + 1)} dx="-5" dy="0" style={{fontSize: '8px'}}>{i}</text>
                        }
                    </g>)}
                </g>
                <g className="slider" transform={`translate(0,${spec.histogramHeight})`}>
                    <g className="axis" transform="translate(0, 1)">
                        <line x1="0" y1="1" x2={effectiveWidth} y2="1"/>
                        {xScale.ticks(5).map((t, i) => <g key={i} transform={`translate(${xScale(t)},0)`}>
                            <line x1="0" y1="0" x2="0" y2="5" />
                            <text dx="-7" dy="16">{xTickFormat(t)}</text>
                        </g>)}
                    </g>
                    <g transform="translate(0,2)">
                        <path d="M0,0L-4,8L4,8Z" className="control" transform={`translate(${controlPos[0]}, 0)`}
                              onMouseDown={props.toggleMoveHandle.bind(null, attributeName, 'left')}/>
                        <path d="M0,0L-4,8L4,8Z" className="control" transform={`translate(${controlPos[1]}, 0)`}
                              onMouseDown={props.toggleMoveHandle.bind(null, attributeName, 'right')}/>
                        <rect className="selected-area" x={controlPos[0]} y="-3" width={controlPos[1] - controlPos[0]} height="6"/>
                    </g>
                </g>
            </g>
        </svg>
    )
};

export default HistogramSlider;
