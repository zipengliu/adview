/**
 * Created by Zipeng Liu on 2016-11-11.
 */


import {scaleLinear, extent, deviation, forceSimulation, forceCollide} from 'd3';
import tSNE from './tsne';


// Input: a distance matrix
// Output: an array of coordinates (x, y)
export function runTSNE(dist) {
    let opt = {epsilon: 10, perplexity: 30, dim: 2};
    let tsne = new tSNE.tSNE(opt);
    tsne.initDataDist(dist);

    console.log('Begin tSNE');
    let iterations;
    if (dist.length < 100) {
        iterations = 400;
    } else if (dist.length < 500) {
        iterations = 300;
    } else if (dist.length < 1000) {
        iterations = 200;
    } else {
        iterations = 200;
    }
    console.log('tsne iterations: ', iterations);
    for (let k = 0; k < iterations; k++) {
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

// Check if a is a subset of b.  a and b are both objects
export function isSubset(a, b) {
    for (let x in a) {
        if (!b.hasOwnProperty(x)) return false;
    }
    return true;
}

export function mergeArrayToMapping(m, a) {
    return a.reduce((acc, ele) => {acc[ele] = true; return acc}, m);
}
export function mergeMappingToArray(a, m) {
    for (let k in m) if (m.hasOwnProperty(k)) {
        if (a.indexOf(k) === -1) a.push(k)
    }
    return a;
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

export function getCoordinates(ref, trees, cb, isGlobal, bid) {
    // Concat all rf_dist in trees to a distance matrix
    // First, decide an order of trees for the matrix

    let order = [];
    let dist = [];
    let isDummyData = false;

    if (!isGlobal) {
        // Local distance matrix
        let corr = ref.branches[bid][cb];
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
        order.push({tid: ref.tid, bid, entities: createMappingFromArray(ref.branches[bid].entities)});

        console.log('Calculating local coordinates in Overview... #dots: ', order.length);
    } else {
        // Global distance matrix
        for (let tid in trees) if (trees.hasOwnProperty(tid)) {
            order.push(tid);
        }
        order.push(ref.tid);
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
                    let t = order[i] === ref.tid? ref: trees[order[i]];
                    if (t.rfDistance.hasOwnProperty(order[j])) {
                        cur.push(t.rfDistance[order[j]]);
                    } else {
                        cur.push(Math.random());
                        isDummyData = true;
                    }
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

    if (isDummyData) {
        // Don't run tSNE
        return order.map(o => ({tid: !isGlobal? o.tid: o, x: 0.5, y: 0.5}))
    }

    // Second run t-SNE and normalize
    let coords = runTSNE(dist);

    // Third avoid collision of points
    coords = avoidOverlap(coords, 0.01);

    return coords.map((d, i) => ({...d, tid: !isGlobal? order[i].tid: order[i]}))
}

function avoidOverlap(coords, r) {
    let nodes = coords.map((d, i) => ({...d, index: i}));
    let simulation = forceSimulation(nodes).force('collide', forceCollide(r)).stop();
    for (let i = 0; i < 100; i++) {
        simulation.tick();
    }
    return nodes.map(d => ({x: d.x, y: d.y}));
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

export function makeCompareFunc(d, field, isIncreasing=true) {
    if (isIncreasing) {
        return (a, b) => {
            if (d[a][field] === d[b][field]) return 0;
            if (d[a][field] < d[b][field]) return -1;
            return 1;
        };
    } else {
        return (a, b) => {
            if (d[a][field] === d[b][field]) return 0;
            if (d[a][field] < d[b][field]) return 1;
            return -1;
        };
    }
}

export function transformRect(r, ratioW, ratioH) {
    return {
        ...r,
        x: r.x * ratioW,
        y: r.y * ratioH,
        width: r.width * ratioW,
        height: r.height * ratioH
    }
}


export function transformLine(l, ratioW, ratioH) {
    return {
        ...l,
        x1: l.x1 * ratioW,
        y1: l.y1 * ratioH,
        x2: l.x2 * ratioW,
        y2: l.y2 * ratioH,
    }
}

// This estimation is based on font size of 8pt
//  For bigger font, need to use a scaling factor
export function estimateTextWidth(text, scaling=1) {
    let lowercaseCharLength = 4.5;
    let uppercaseCharLengthExtra = 3.5;
    let narrowCharLengthDecduction = 2.2;
    let narrwoChars = {
        f: 1, i: 1, j: 1, l: 1, r: 1, t: 1, 1: 1
    };
    let upperCount = 0;
    let narrowCount = 0;
    for (let c of text) {
        let code = c.charCodeAt(0);
        if (65 <= code && code <= 90) upperCount += 1;
        if (c in narrwoChars) narrowCount += 1;
    }
    let l = text.length * lowercaseCharLength + uppercaseCharLengthExtra * upperCount - narrowCharLengthDecduction * narrowCount;

    return l * scaling;
}
