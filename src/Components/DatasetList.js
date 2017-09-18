/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Glyphicon, Modal, Button} from 'react-bootstrap';
import cn from  'classnames';
import {fetchDatasets, openDatasetRemoval, confirmDatasetRemoval, closeToast} from '../actions';
import './DatasetList.css';

class DatasetList extends Component {
    componentDidMount() {
        this.props.onRequestDatasets();
    }

    render() {
        let {datasetRemoval, datasets, toast} = this.props;

        return (
            <div style={{padding: '0 20px'}}>
                <div className={cn('toast', {show: toast.msg != null})}>
                    <p>{toast.msg}</p>
                    <div style={{position: 'absolute', top: 5, right: 5, cursor: 'pointer'}} onClick={this.props.onCloseToast}>
                        <Glyphicon glyph="remove"/>
                    </div>
                </div>

                <h1>Datasets</h1>
                <div className="list-container">
                    {datasets.map((d, i) =>
                        <div className="dataset-item" key={i}>
                            <h3><a href={`/dataset/${d.inputGroupId}`}>{d.title}</a></h3>
                            <p>{d.description}</p>
                            <p>Reference tree: {d.referenceTreeFileName}<br/>
                            # trees: {d.numTrees}<br/>
                            # taxa: {d.numTaxa}</p>
                            <div className="timestamp">
                                {d.isPublic? 'public dataset': 'private dataset'}<br/>
                                {(new Date(d.timeCreated)).toLocaleString()}
                            </div>

                            <div className="del-btn" onClick={this.props.onOpenRemoval.bind(null, d.inputGroupId)}>
                                <Glyphicon glyph="trash" />
                            </div>
                        </div>)}
                </div>

                {datasetRemoval.showConfirmOption &&
                <Modal.Dialog>
                    <Modal.Header>
                        <Modal.Title>Delete dataset</Modal.Title>
                    </Modal.Header>

                    <Modal.Body>
                        Are you sure to delete dataset "{datasets.filter(d => d.inputGroupId === datasetRemoval.id)[0].title}"?
                    </Modal.Body>

                    <Modal.Footer>
                        <Button onClick={this.props.onConfirmRemoval.bind(null, false)}>Cancel</Button>
                        <Button bsStyle="danger" onClick={this.props.onConfirmRemoval.bind(null, true)}>Confirm</Button>
                    </Modal.Footer>
                </Modal.Dialog>}
            </div>
        )
    }
}

let mapStateToProps = state => ({
    datasets: state.datasets,
    datasetRemoval: state.datasetRemoval,
    toast: state.toast,
});

let mapDispatchToProps = dispatch => ({
    onRequestDatasets: () => {dispatch(fetchDatasets())},
    onOpenRemoval: (id) => {dispatch(openDatasetRemoval(id))},
    onConfirmRemoval: (toDel) => {dispatch(confirmDatasetRemoval(toDel))},
    onCloseToast: () => {dispatch(closeToast())},
});

export default connect(mapStateToProps, mapDispatchToProps)(DatasetList);
