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

class Dotplot extends Component {
    render() {
        let s = this.props.containerWidth;
        let rect = {};
        if (this.props.isSelecting) {
            let {x1, x2, y1, y2} = this.props.selectionArea;
            rect = {x: Math.min(x1, x2), y: Math.min(y1, y2), width: Math.abs(x1 - x2), height: Math.abs(y1 - y2)};
        }

        // Transform the coordinates from [0, 1] to [s, s]
        let scale = scaleLinear().range([0, s]);
        return <svg width={s} height={s}
                    onMouseDown={this.props.onDragStart.bind(null, s)}
                    onMouseMove={this.props.onDrag.bind(null, this.props.isSelecting)}
                    onMouseUp={this.props.onDragEnd}>
            {this.props.coordinates.map(d => <circle className={classNames('dot', {selected: this.props.selectedDots.indexOf(d.treeId) != -1})}
                                                     style={{fill: this.props.colors[d.treeId] || 'grey'}}
                                                     cx={scale(d.x)} cy={scale(d.y)} r={3} key={d.treeId}></circle>)}
            {this.props.isSelecting && rect.width && rect.height && <rect {...rect} className="selecting-box"></rect>}
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
    colors: getDotColors(state)
});

let mapDispatchToProps = dispatch => ({
    onDragStart: (size, e) => {
        let svgPos = e.currentTarget.getBoundingClientRect();
        dispatch(startSelection(e.pageX - svgPos.left, e.pageY - svgPos.top, size));
    },
    onDragEnd: ()=> {
        dispatch(endSelection());
    },
    onDrag: (isSelecting, e) => {
        if (isSelecting) {
            let svgPos = e.currentTarget.getBoundingClientRect();
            dispatch(changeSelection(e.pageX - svgPos.left, e.pageY - svgPos.top));
        }
    }
});

let ConnectedDotplot = connect(mapStateToProps, mapDispatchToProps)(Dotplot);
let DotplotContainer = Dimensions()(ConnectedDotplot);

export default DotplotContainer;
