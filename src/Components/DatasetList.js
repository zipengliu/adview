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
            <div>
                <h1 style={{textAlign: 'center'}}>Example datasets from 1KP</h1>
                <div className="list-container">
                    {this.props.datasets.map((d, i) => <div className="dataset-item" key={i}>
                        <h3><a href={`/dataset/${d.inputGroupId}`}>{d.title}</a></h3>
                        <p>Number of Trees: {d.numTrees}</p>
                        <div style={{textAlign: 'left'}}>{d.description}</div>
                    </div>)}
                </div>
            </div>
        )
    }
}

let mapStateToProps = state => ({
    datasets: state.datasets
});

let mapDispatchToProps = dispatch => ({
    onRequestDatasets: () => {dispatch(fetchDatasets())},
});

export default connect(mapStateToProps, mapDispatchToProps)(DatasetList);
