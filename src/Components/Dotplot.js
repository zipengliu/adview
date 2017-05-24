/**
 * Created by Zipeng Liu on 2016-11-11.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import Dimensions from 'react-dimensions';
import cn from 'classnames';
import {scaleLinear} from 'd3-scale';
import {createSelector} from 'reselect';
import {startSelection, endSelection, changeSelection} from '../actions';
import './Dotplot.css';

let isDotWithinBox = (dot, box) => {
    let {x1, x2, y1, y2} = box;
    return Math.min(x1, x2) <= dot.x && dot.x <= Math.max(x1, x2)
        && Math.min(y1, y2) <= dot.y && dot.y <= Math.max(y1, y2);
};

class Dotplot extends Component {
    render() {
        let s = this.props.containerWidth;
        let {coordinates, selectionArea, glyphs, selectedTrees, hoveredTrees, isSelecting} = this.props;
        let rect = {};
        if (isSelecting) {
            let {x1, x2, y1, y2} = selectionArea;
            rect = {x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x1 - x2), height: Math.abs(y1 - y2)};
        }

        let scale = scaleLinear().range([0, s]);
        let getDotsWithinBox = (coordinates, box) => {
            return coordinates.filter(d => isDotWithinBox({x: scale(d.x), y: scale(d.y)}, box)).map(d => d.tid);
        };

        // Reorder the coordinates array so that reference tree dot is rendered at last
        let i;
        for (i = 0; i < coordinates.length; i++) {
            if (coordinates[i].tid === this.props.rid) break;
        }
        let t = coordinates[coordinates.length - 1];
        coordinates[coordinates.length - 1] = coordinates[i];
        coordinates[i] = t;

        let refGlyphSize = 16;
        let dotSize = {
            circle: 6,
            plus: 9,
            'triangle-right': 8,
            square: 8,
            diamond: 8
        };

        // Transform the coordinates from [0, 1] to [s, s]
        return <svg width={s} height={s} style={{border: '1px solid black'}}
                    onMouseDown={this.props.onDragStart.bind(null, s)}
                    onMouseMove={this.props.onDrag.bind(null, this.props.isSelecting)}
                    onMouseUp={() => {this.props.onDragEnd(getDotsWithinBox(coordinates, selectionArea))}}>
            {coordinates.map(d => d.tid === this.props.rid?
                <use xlinkHref="#reference-tree-glyph" key={d.tid} x={scale(d.x) - refGlyphSize / 2} y={scale(d.y) - refGlyphSize / 2}
                     width={refGlyphSize} height={refGlyphSize} style={{stroke: 'black'}} /> :
                <use xlinkHref={`#sub-col-glyph-${glyphs[d.tid]}`}
                     className={cn('dot', {selected: selectedTrees.hasOwnProperty(d.tid), highlight:  hoveredTrees.hasOwnProperty(d.tid)})}
                     key={d.tid} x={scale(d.x) - dotSize[glyphs[d.tid]] / 2} y={scale(d.y) - dotSize[glyphs[d.tid]] / 2}
                     width={dotSize[glyphs[d.tid]]} height={dotSize[glyphs[d.tid]]}
                     style={{fill: 'grey'}}
                />)}
            {isSelecting && rect.width && rect.height && <rect {...rect} className="selecting-box"></rect>}

            <defs>
                <symbol id="reference-tree-glyph" viewBox="0 0 14 14">
                    <path d="M8.141 5.492c0-0.453-0.156-0.773-0.469-0.945-0.156-0.086-0.375-0.141-0.914-0.141h-0.961v2.195h1.266c0.688 0 1.078-0.406 1.078-1.109zM8.547 7.719l1.602 2.914c0.039 0.078 0.039 0.172-0.008 0.242-0.039 0.078-0.125 0.125-0.211 0.125h-1.187c-0.094 0-0.18-0.047-0.219-0.133l-1.516-2.852h-1.211v2.734c0 0.141-0.109 0.25-0.25 0.25h-1.047c-0.141 0-0.25-0.109-0.25-0.25v-7.5c0-0.141 0.109-0.25 0.25-0.25h2.297c0.82 0 1.18 0.070 1.484 0.187 0.883 0.328 1.43 1.195 1.43 2.258 0 0.961-0.477 1.773-1.234 2.148 0.023 0.039 0.047 0.078 0.070 0.125zM7 1.25c-3.172 0-5.75 2.578-5.75 5.75s2.578 5.75 5.75 5.75 5.75-2.578 5.75-5.75-2.578-5.75-5.75-5.75zM14 7c0 3.867-3.133 7-7 7s-7-3.133-7-7 3.133-7 7-7v0c3.867 0 7 3.133 7 7z"></path>
                </symbol>
                <symbol id="sub-col-glyph-circle" viewBox="0 0 10 10">
                    <circle cx={5} cy={5} r={5}/>
                </symbol>
                <symbol id="sub-col-glyph-plus" viewBox="0 0 14 14">
                    <rect x="0" y="5" width="14" height="4" />
                    <rect x="5" y="0" width="4" height="14" />
                </symbol>
                <symbol id="sub-col-glyph-triangle-right" viewBox="0 0 10 10">
                    <path d="M0 0 L0 10 L10 5 Z" />
                </symbol>
                <symbol id="sub-col-glyph-square" viewBox="0 0 10 10">
                    <rect x="0" y="0" width="8" height="8"/>
                </symbol>
                <symbol id="sub-col-glyph-diamond" viewBox="0 0 10 10">
                    <path d="M5 0 L0 5 L5 10 L10 5 Z" />
                </symbol>

            </defs>
        </svg>
    }
};

let getDotGlyph = createSelector(
    [state => state.sets],
    (sets) => {
        let glyph = {};
        for (let i = 0; i < sets.length; i++) {
            for (let j = 0; j < sets[i].tids.length; j++) {
                glyph[sets[i].tids[j]] = sets[i].glyph;
            }
        }
        return glyph;
    }
);

let mapStateToProps = state => ({
    ...state.overview,
    glyphs: getDotGlyph(state),
    rid: state.referenceTree.id,
    selectedTrees: state.selectedTrees,
    hoveredTrees: state.hoveredTrees
});

let mapDispatchToProps = dispatch => ({
    onDragStart: (size, e) => {
        let svgPos = e.currentTarget.getBoundingClientRect();
        dispatch(startSelection(e.clientX - svgPos.left, e.clientY- svgPos.top, size));
    },
    onDragEnd: (dots)=> {
        dispatch(endSelection(dots));
    },
    onDrag: (isSelecting, e) => {
        if (isSelecting) {
            let svgPos = e.currentTarget.getBoundingClientRect();
            dispatch(changeSelection(e.clientX - svgPos.left, e.clientY- svgPos.top));
        }
    }
});

let ConnectedDotplot = connect(mapStateToProps, mapDispatchToProps)(Dotplot);
let DotplotContainer = Dimensions()(ConnectedDotplot);

export default DotplotContainer;
