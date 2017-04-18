/**
 * Created by Zipeng Liu on 2016-11-11.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import Dimensions from 'react-dimensions';
import classNames from 'classnames';
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
        let {coordinates, selectionArea, colors, selectedDots, isSelecting} = this.props;
        let rect = {};
        if (isSelecting) {
            let {x1, x2, y1, y2} = selectionArea;
            rect = {x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x1 - x2), height: Math.abs(y1 - y2)};
        }

        let scale = scaleLinear().range([0, s]);
        let getDotsWithinBox = (coordinates, box) => {
            return coordinates.filter(d => isDotWithinBox({x: scale(d.x), y: scale(d.y)}, box)).map(d => d.treeId);
        };

        // Transform the coordinates from [0, 1] to [s, s]
        return <svg width={s} height={s} style={{border: '1px solid black'}}
                    onMouseDown={this.props.onDragStart.bind(null, s)}
                    onMouseMove={this.props.onDrag.bind(null, this.props.isSelecting)}
                    onMouseUp={() => {this.props.onDragEnd(getDotsWithinBox(coordinates, selectionArea))}}>
            {coordinates.map(d => <circle className={classNames('dot', {selected: selectedDots.indexOf(d.treeId) !== -1,
                highlight: this.props.highlightDots.indexOf(d.treeId) !== -1, 'reference-tree-indicator': d.treeId === this.props.rid})}
                                          style={{fill: colors[d.treeId] || 'black'}}
                                          r={this.props.highlightDot === d.treeId? 6: 3}
                                          cx={scale(d.x)} cy={scale(d.y)} key={d.treeId}></circle>)}
            {isSelecting && rect.width && rect.height && <rect {...rect} className="selecting-box"></rect>}
        </svg>
    }
};

let getDotColors = createSelector(
    [state => state.sets],
    (sets) => {
        let colors = {};
        for (let i = 0; i < sets.length; i++) {
            for (let j = 0; j < sets[i].tids.length; j++) {
                colors[sets[i].tids[j]] = sets[i].color;
            }
        }
        return colors;
    }
);

let mapStateToProps = state => ({
    ...state.overview,
    colors: getDotColors(state),
    rid: state.referenceTree.id,
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
