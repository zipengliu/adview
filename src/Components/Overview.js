/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React, { Component } from 'react';
import {ButtonToolbar, Button} from 'react-bootstrap';
import {connect} from 'react-redux';
import Dimensions from 'react-dimensions';
import {scaleLinear} from 'd3-scale';
import {extent, deviation} from 'd3-array';
import {createSelector} from 'reselect';
import tSNE from '../tsne';

class Overview extends Component {
    render() {
        return <div>
            <div>Overview</div>
            <ButtonToolbar  style={{marginBottom: '5px'}}>
                <Button bsSize="xsmall">Create new set</Button>
                <Button bsSize="xsmall">Add to</Button>
            </ButtonToolbar>
            <div style={{width: '100%', height: '100%', border: '1px solid black'}}>
                <DotplotContainer></DotplotContainer>
            </div>
        </div>
    }
}

class Dotplot extends Component {
    render() {
        let s = this.props.containerWidth;
        // Transform the coordinates from [0, 1] to [s, s]
        let scale = scaleLinear().range([0, s]);
        let dotStyle = {fill: 'steelblue'};
        return <svg width={s} height={s}>
            {this.props.coordinates.map(d => <circle style={dotStyle} cx={scale(d.x)} cy={scale(d.y)} r={2}
                                                     key={d.treeId}></circle>)}
        </svg>
    }
}

// Input: a distance matrix
// Output: an array of coordinates (x, y)
function runTSNE(dist) {
    let opt = {epsilon: 10, perplexity: 30, dim: 2};
    let tsne = new tSNE.tSNE(opt);
    tsne.initDataDist(dist);

    console.log('Begin tSNE');
    for (let k = 0; k < 500; k++) {
        tsne.step();
    }
    console.log('Finish tSNE');

    // Normalize the coordinates to (0, 1) by linear transformation
    // how much do you want to relax the extent of the coordinates so that they don't show up on the border of the dotplot
    let relaxCoefficient = 0.1;
    let coords = tsne.getSolution();
    let xArr = coords.map(x => x[0]);
    let yArr = coords.map(x => x[1]);
    let xExtent = extent(xArr);
    let xDeviation = deviation(xArr);
    let yExtent = extent(yArr);
    let yDeviation = deviation(yArr);
    xExtent[0] -= relaxCoefficient * xDeviation;
    xExtent[1] += relaxCoefficient * xDeviation;
    yExtent[0] -= relaxCoefficient * yDeviation;
    yExtent[1] += relaxCoefficient * yDeviation;
    console.log('extents: ' + xExtent + ' ' + yExtent);

    let xScale = scaleLinear().domain(xExtent);
    let yScale = scaleLinear().domain(yExtent);

    coords = coords.map(d => ({x: xScale(d[0]), y: yScale(d[1])}));

    return coords;
}

let getCoordinates = createSelector(
    [state => state.inputGroupData.trees],
    (trees) => {
        console.log('Calculating coordinates in Overview...');
        // Concat all rf_dist in trees to a distance matrix
        // First, decide an order of trees for the matrix

        // let order = Object.keys(trees[orderBasisTree].rf_dist).concat([orderBasisTree]);
        let order = Object.keys(trees);

        let dist = [];
        for (var i = 0; i < order.length; i++) {
            let cur = [];
            let t = trees[order[i]];
            for (var j = 0; j < order.length; j++) {
                if (j !== i) {
                    cur.push(t.rf_dist[order[j]]);
                } else {
                    cur.push(0);
                }
            }
            dist.push(cur);
        }

        // Second run t-SNE
        let coords = runTSNE(dist);

        return {
            coordinates: coords.map((d, i) => ({...d, treeId: order[i]}))
        };
    }
);

let ConnectedDotplot = connect(getCoordinates)(Dotplot);
let DotplotContainer = Dimensions()(ConnectedDotplot);

export default Overview;