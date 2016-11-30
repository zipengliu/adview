/**
 * Created by Zipeng Liu on 2016-11-11.
 */


import {scaleLinear} from 'd3-scale';
import {extent, deviation} from 'd3-array';
import tSNE from './tsne';


// Input: a distance matrix
// Output: an array of coordinates (x, y)
export function runTSNE(dist) {
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

export function createMappingFromArray(a) {
    return a.reduce((acc, k) => {acc[k] = true; return acc}, {});
}
export function subtractMapping(a, b) {
    let r = {};
    for (let k in a) {
        if (!b[k]) {
            r[k] = a[k]
        }
    }
    return r;
}
export function getIntersection(a, b) {
    let r = 0;
    for (let k in a) {
        if (b[k]) {
            r += 1;
        }
    }
    return r;
}
