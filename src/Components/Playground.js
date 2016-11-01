/**
 * Created by Zipeng Liu on 2016-10-30.
 */


import React, { Component } from 'react';
import tsnejs from '../tsne';

class TestTSNE extends Component {
    generateDistMatrix(n) {
        let mat = [];
        for (let i = 0; i < n; i++) {
            mat.push([]);
            for (let j = 0; j < n; j++) {
                mat[mat.length - 1].push(Math.random());
            }
        }
        return mat;
    }

    render() {
        let dist = this.generateDistMatrix(500);
        var opt = {};
        opt.epsilon = 10;
        opt.perplexity = 30;
        opt.dim = 2;
        var tsne = new tsnejs.tSNE(opt);
        tsne.initDataDist(dist);

        console.log('Begin tSNE');
        for(var k = 0; k < 200; k++) {
            tsne.step();
        }
        console.log('Finish tSNE');

        var transform = x => (x + 2) * 300;
        var coords = tsne.getSolution();
        console.log(Math.min.apply(null, coords.map(x => x[0])));
        console.log(Math.max.apply(null, coords.map(x => x[0])));
        console.log(Math.min.apply(null, coords.map(x => x[1])));
        console.log(Math.max.apply(null, coords.map(x => x[1])));
        coords = coords.map(x => [transform(x[0]), transform(x[1])]);

        return (
            <div>
                <p>{this.props.count}</p>
                <svg width="1000" height="600">
                    {coords.map((c, i) => (<circle cx={c[0]} cy={c[1]} r="3" key={i}></circle>))}
                </svg>
            </div>
        )

    }
}

class Playground extends Component {

    constructor(props) {
        super(props);
        this.state = {count: 0};
        this.updateTSNE = this.updateTSNE.bind(this);
    }
    updateTSNE() {
        this.setState(prevState => ({count: prevState.count + 1}));
    }
    render() {
        return (
            <div>
                <h1>This is the playground page</h1>
                <button onClick={this.updateTSNE}>Rerender</button>
                <TestTSNE count={this.state.count}></TestTSNE>
            </div>
        )
    }
}

export default Playground;
