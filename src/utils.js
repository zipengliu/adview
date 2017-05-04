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

export function getIntersectionSet(a, b) {
    let r = {};
    for (let k in a) {
        if (b.hasOwnProperty(k)) {
            r[k] = true;
        }
    }
    return r;
}

export function areSetsEqual(a, b) {
    if (Object.keys(a).length !== Object.keys(b).length) return false;
    for (let k in a)
        if (a.hasOwnProperty(k) && !b.hasOwnProperty(k)) return false;
    return true;
}

export function getJaccardIndex(x, y) {
    let a = isArray(x)? createMappingFromArray(x): x;
    let la = isArray(x)? x.length: Object.keys(x).length;
    let b = isArray(y)? createMappingFromArray(y): y;
    let lb = isArray(y)? y.length: Object.keys(y).length;
    let c = getIntersection(a, b);
    return  la + lb === 0? 0: c / (la + lb - c);
}

function isArray(obj){
    return !!obj && obj.constructor === Array;
}

export function getCoordinates(trees, cb, isGlobal, rid, bid) {
    // Concat all rf_dist in trees to a distance matrix
    // First, decide an order of trees for the matrix

    let order = [];
    let dist = [];
    if (!isGlobal) {
        // Local distance matrix
        let corr = trees[rid].branches[bid][cb];
        for (let tid in corr) if (corr.hasOwnProperty(tid) && corr[tid]) {
            // It is possible that we cannot find any cb in that tree.  Possible reason: all entities in our radar are missing from that tree
            let e = !corr[tid].bid? []: trees[tid].branches[corr[tid].bid].entities;
            order.push({tid,
                bid: corr[tid].bid,
                entities: !corr[tid].bid || corr[tid].in? e:
                    subtractMapping(createMappingFromArray(trees[tid].entities), createMappingFromArray(e))
            });
        }
        // Don't forget the reference tree itself!
        order.push({tid: rid, bid, entities: createMappingFromArray(trees[rid].branches[bid].entities)});

        console.log('Calculating local coordinates in Overview... #dots: ', order.length);
    } else {
        // Global distance matrix
        for (let tid in trees) if (trees.hasOwnProperty(tid) && tid !== rid) {
            order.push(tid);
        }
        order.push(rid);
        console.log('Calculating global coordinates in Overview... #dots: ', order.length);
    }
    for (let i = 0; i < order.length; i++) {
        let cur = [];
        // let t = trees[order[i]];
        for (let j = 0; j < order.length; j++) {
            if (j > i) {
                if (!isGlobal) {
                    // TODO: can make it faster by caching the entities first
                    cur.push(1.0 - getJaccardIndex(order[i].entities, order[j].entities));
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

export function textEllipsis(s, l) {
    if (s.length > l) {
        return s.substring(0, l) + '...';
    } else {
        return s;
    }
}

export function guid() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
}
