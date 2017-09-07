/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {fetchDatasets} from '../actions';
import './DatasetList.css';

class DatasetList extends Component {
    componentDidMount() {
        this.props.onRequestDatasets();
    }

    render() {
        return (
            <div style={{padding: '0 20px'}}>
                <h1>Datasets</h1>
                <div className="list-container">
                    {this.props.datasets.map((d, i) =>
                        <div className="dataset-item" key={i}>
                            <h3><a href={`/dataset/${d.inputGroupId}`}>{d.title}</a></h3>
                            <p>{d.description}</p>
                            <p>Reference tree: {d.referenceTreeFileName}<br/>
                            # trees: {d.numTrees}<br/>
                            # taxa: {d.numTaxa}</p>
                            <div className="timestamp">{(new Date(d.timeCreated)).toLocaleString()}</div>
                        </div>)}
                </div>
            </div>
        )
    }
}

let mapStateToProps = state => ({
    datasets: state.datasets,
});

let mapDispatchToProps = dispatch => ({
    onRequestDatasets: () => {dispatch(fetchDatasets())},
});

export default connect(mapStateToProps, mapDispatchToProps)(DatasetList);
