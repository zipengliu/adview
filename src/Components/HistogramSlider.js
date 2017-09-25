/**
 * Created by Zipeng Liu on 2016-12-19.
 */

import React from 'react';
import {scaleLinear, scaleLog, max as d3Max, format} from 'd3';
import {OverlayTrigger, Tooltip} from 'react-bootstrap';

let HistogramSlider = props => {
    let {foregroundBins, backgroundBins, spec, attributeName, selection, changeSelectionRange, selectionId,
        selectionColor} = props;
    let hasData = !!foregroundBins || !!backgroundBins;
    let effectiveWidth = spec.width - spec.margin.left - spec.margin.right;
    // The x domain is always [0, 1]
    let xScale = scaleLinear().domain([0, 1]).range([0, effectiveWidth]).clamp(true);
    let xTickFormat = xScale.tickFormat(5, '.1f');
    let rangeFormat = format('.2f');
    let controlPos = selection? selection.range.map(xScale): null;

    let yMax, yScale, yTicks = [], onDragging;
    if (hasData) {
        yMax = d3Max(backgroundBins? backgroundBins: foregroundBins, d => d.length + 1);
        yScale = scaleLog().base(10).domain([1, yMax]).rangeRound([0, spec.chartHeight]);
        yTicks = [];
        for (let i = 0; i <= Math.floor(Math.log(yMax) / Math.log(10)); i++) {
            yTicks.push(Math.pow(10, i));
        }

        onDragging = (event) => {
            let parentPos = event.currentTarget.getBoundingClientRect();
            let x = event.clientX - parentPos.left - spec.margin.left;
            let v = xScale.invert(x);
            props.moveControlHandle(v);
        };
    }

    return (
        <svg width={spec.width} height={spec.chartHeight + spec.sliderHeight + spec.margin.top + spec.margin.bottom} className="attribute-chart"
             onMouseMove={hasData && selection && selection.isMoving? onDragging: null}
             onMouseUp={hasData? props.toggleMoveHandle.bind(null, null): null}
        >
            <text className="title" x="0" y="14">
                {hasData? 'Dist. ' + attributeName: 'Not Applicable'}
            </text>
            <g transform={`translate(${spec.margin.left},${spec.margin.top})`}>
                {hasData &&
                <g className="bars">
                    {!!backgroundBins &&
                    backgroundBins.map((b, i) =>
                        <OverlayTrigger key={i} placement="top" overlay={<Tooltip id={`background-bar-${i}`}>{b.length}</Tooltip>}>
                            <rect className="bar background" x={xScale(b.x0)} y={spec.chartHeight - yScale(b.length + 1)}
                                  width={xScale(b.x1) - xScale(b.x0) - 1} height={yScale(b.length + 1)}
                                  onClick={changeSelectionRange? changeSelectionRange.bind(null, b.x0, b.x1, selectionId): null}
                            />
                        </OverlayTrigger>)
                    }
                    {foregroundBins &&
                    foregroundBins.map((b, i) =>
                        <OverlayTrigger key={i} placement="top" overlay={<Tooltip id={`foreground-bar-${i}`}>{b.length}</Tooltip>}>
                            <rect className="bar foreground" x={xScale(b.x0)} y={spec.chartHeight - yScale(b.length + 1)}
                                  width={xScale(b.x1) - xScale(b.x0) - 1} height={yScale(b.length + 1)}
                                  onClick={changeSelectionRange? changeSelectionRange.bind(null, b.x0, b.x1, selectionId): null}
                            />
                        </OverlayTrigger>)}
                </g>
                }
                <g className="axis">
                    <line x1="-2" y1="0" x2="-2" y2={spec.chartHeight} />
                    {hasData && yTicks.map((t, i) => <g key={i}>
                        <line x1="-5" y1={spec.chartHeight - yScale(t + 1)} x2="-2" y2={spec.chartHeight - yScale(t + 1)} />
                        <text x="-5" y={spec.chartHeight - yScale(t + 1)} dx="-8" dy="5" textAnchor="end">{i === 0? 1: 10}</text>
                        {i > 1 &&
                        <text x="-5" y={spec.chartHeight - yScale(t + 1)} dx="-2" dy="0" textAnchor="end" style={{fontSize: '8px'}}>{i}</text>
                        }
                    </g>)}
                </g>
                <g className="slider" transform={`translate(0,${spec.chartHeight})`}>
                    <g className="axis" transform="translate(0, 1)">
                        <line x1="0" y1="1" x2={effectiveWidth} y2="1"/>
                        {xScale.ticks(5).map((t, i) => <g key={i} transform={`translate(${xScale(t)},0)`}>
                            <line x1="0" y1="0" x2="0" y2="5" />
                            <text dx="-7" dy="16">{xTickFormat(t)}</text>
                        </g>)}
                    </g>
                    {selection &&
                    <g transform="translate(0,2)">
                        <path d="M0,0L-4,8L4,8Z" className="control" transform={`translate(${controlPos[0]}, 0)`}
                              style={{fill: selectionColor}}
                              onMouseDown={hasData? props.toggleMoveHandle.bind(null, 'left'): null}/>
                        <path d="M0,0L-4,8L4,8Z" className="control" transform={`translate(${controlPos[1]}, 0)`}
                              style={{fill: selectionColor}}
                              onMouseDown={hasData? props.toggleMoveHandle.bind(null, 'left'): null}/>
                              onMouseDown={hasData? props.toggleMoveHandle.bind(null, 'right'): null}/>
                        <rect className="selected-area" x={controlPos[0]} y={-spec.chartHeight - 3}
                              style={{fill: selectionColor}}
                              width={controlPos[1] - controlPos[0]} height={spec.chartHeight + 6} />
                        <use xlinkHref="#slider-handle-left" x={controlPos[0] - 5} y={-spec.chartHeight + 10} width={5} height={30}
                             className="control"
                             onMouseDown={hasData? props.toggleMoveHandle.bind(null, 'left'): null}/>
                        <use xlinkHref="#slider-handle-right" x={controlPos[1]} y={-spec.chartHeight + 10} width={5} height={30}
                             className="control"
                             onMouseDown={hasData? props.toggleMoveHandle.bind(null, 'right'): null}/>
                    </g>
                    }
                </g>
            </g>
            <text x={spec.margin.left} y="24">
                {hasData && selection && `   (${rangeFormat(selection.range[0])} - ${rangeFormat(selection.range[1])})`}
            </text>

            <symbol id="slider-handle-left" viewBox="0 0 5 30">
                <rect x="0" y="0" width="10" height="30" rx="4" ry="4"
                      style={{stroke: 'black', strokeWidth: '1px', fill: 'grey', fillOpacity: '.3'}} />
                <line x1="4" y1="10" x2="4" y2="20" style={{stroke: 'black', strokeWidth: '1px'}} />
            </symbol>
            <symbol id="slider-handle-right" viewBox="0 0 5 30">
                <rect x="-5" y="0" width="10" height="30" rx="4" ry="4"
                      style={{stroke: 'black', strokeWidth: '1px', fill: 'grey', fillOpacity: '.3'}} />
                <line x1="1" y1="10" x2="1" y2="20" style={{stroke: 'black', strokeWidth: '1px'}} />
            </symbol>
        </svg>
    )
};

export default HistogramSlider;
