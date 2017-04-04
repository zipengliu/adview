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
    for (let k = 0; k < 300; k++) {
        tsne.step();
    }
    console.log('Finish tSNE');

    // Normalize the coordinates to (0, 1) by linear transformation
    // how much do you want to relax the extent of the coordinates so that they don't show up on the border of the dotplot
    let relaxCoefficient = 0.2;
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

export function createArrayFromMapping(a) {
    let r = [];
    for (let k in a) if (a.hasOwnProperty(k)) {
        r.push(a[k]);
    }
    return r;
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

export function getJaccardIndex(x, y) {
    let a = createMappingFromArray(x);
    let b = createMappingFromArray(y);
    let c = getIntersection(a, b);
    return  c / (x.length + y.length - c);
}

export function getCoordinates(trees, cb, isGlobal, rid, bid) {
    // Concat all rf_dist in trees to a distance matrix
    // First, decide an order of trees for the matrix

    let order;
    let dist = [];
    if (!isGlobal) {
        // Local distance matrix
        console.log('Calculating local coordinates in Overview...');
        order = [];
        let corr = trees[rid].branches[bid][cb];
        for (let tid in corr) if (corr.hasOwnProperty(tid)) {
            order.push({tid, bid: corr[tid].bid});
        }
    } else {
        console.log('Calculating global coordinates in Overview...');
        // Global distance matrix
        order = Object.keys(trees);
    }
    for (let i = 0; i < order.length; i++) {
        let cur = [];
        // let t = trees[order[i]];
        for (let j = 0; j < order.length; j++) {
            if (j > i) {
                if (!isGlobal) {
                    // TODO: can make it faster by caching the entities first
                    cur.push(1.0 - getJaccardIndex(trees[order[i].tid].branches[order[i].bid].entities,
                            trees[order[j].tid].branches[order[j].bid].entities));
                } else {
                    cur.push(trees[order[i]].rfDistance[order[j]]);
                }
            } else if (j < i) {
                // The distance matrix is symmetric
                cur.push(dist[j][i]);
            } else {
                cur.push(0);
            }
        }
        dist.push(cur);
    }

    // Second run t-SNE
    let coords = runTSNE(dist);

    return coords.map((d, i) => ({...d, treeId: !isGlobal? order[i].tid: order[i]}))
}


export function getWindowHeight() {
    let w  = window,
        d  = w.document,
        de = d.documentElement,
        db = d.body || d.getElementsByTagName('body')[0];
    return w.innerHeight|| de.clientHeight|| db.clientHeight;
}
