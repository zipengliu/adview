import React, { Component } from 'react';
import {connect} from 'react-redux';
import cn from 'classnames';
import {Form, FormGroup, ControlLabel, FormControl, HelpBlock, Col, Button, Radio, Checkbox, Glyphicon, ProgressBar} from 'react-bootstrap';
import {changeUploadDataset, uploadDataset, uploadOutgroup, selectOutgroupTaxa, changeOutgroupTaxaFile} from '../actions';
import './UploadDataset.css';

class UploadDataset extends Component {
    render() {
        let {upload} = this.props;
        let {entities, outgroupTaxa, progress, uploadState} = upload;
        let entArr;
        if (entities) {
            entArr = Object.keys(entities).sort((a ,b) => {
                if (entities[a] > entities[b]) return 1;
                if (entities[a] < entities[b]) return -1;
                return 0;
            });
        }
        let onGoingStep = null;
        if (progress && progress.progress) {
            onGoingStep = progress.progress;
        }
        let outgroupTaxaArr;
        if (outgroupTaxa) {
            outgroupTaxaArr = Object.keys(outgroupTaxa);
        }
        let selectingOutgroup = !upload.isProcessingEntities && upload.referenceTree;

        let labelCol = 4, formCol = 8;
        let handleChange = (e) => {this.props.onChangeDataset(e.target.name, e.target.value)};
        let handleChangeFile = (e) => {this.props.onChangeDataset(e.target.name, e.target.files[0])};
        return (<div style={{margin: '10px 20px 50px 20px'}}>
            <h1>Upload New Dataset</h1>
            <div style={{maxWidth: '600px', fontSize: '14px'}}>
                <form className="form-horizontal" onSubmit={(e) => {e.preventDefault(); this.props.onUploadDataest()}}>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={labelCol}>Title</Col>
                        <Col sm={formCol}>
                            <FormControl type="text" name="title" onChange={handleChange}/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={labelCol}>Description</Col>
                        <Col sm={formCol}>
                            <FormControl type="text" name="description" onChange={handleChange} />
                        </Col>
                    </FormGroup>

                    <FormGroup style={{marginBottom: '0'}}>
                        <Col componentClass={ControlLabel} sm={labelCol}>Reference Tree</Col>
                        <Col sm={formCol}>
                            <FormControl type="file" name="reference" onChange={handleChangeFile} />
                        </Col>
                        <Col sm={formCol}><HelpBlock>Tree must be in newick format. File name is taken as the name of reference tree. </HelpBlock></Col>
                    </FormGroup>

                    <FormGroup style={{marginBottom: '30px'}}>
                        <Col componentClass={ControlLabel} sm={labelCol}>Reference Rooting</Col>
                        <Col sm={formCol}>
                            <Radio inline name="isReferenceRooted" value="Y" onChange={handleChange}>rooted</Radio>
                            <Radio inline name="isReferenceRooted" value="N" onChange={handleChange}>unrooted</Radio>
                        </Col>
                        <Col sm={formCol} smOffset={labelCol}><HelpBlock>
                            We will automatically reroot the trees based on the outgroup you provide
                            (if you do have outgroup) later no matter what you choose here.
                            If you do not have outgroup, please submit a rooted tree.  You cannot deal with
                            unrooted trees without outgroup for the time being.
                        </HelpBlock></Col>
                    </FormGroup>

                    <FormGroup style={{marginBottom: '0'}}>
                        <Col componentClass={ControlLabel} sm={labelCol}>Tree Collection</Col>
                        <Col sm={formCol}>
                            <FormControl type="file" name="treeCollection" onChange={handleChangeFile} />
                        </Col>
                        <Col sm={formCol}><HelpBlock>Each line contains a tree in newick format.</HelpBlock></Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={labelCol}>Tree Collection Rooting</Col>
                        <Col sm={formCol}>
                            <Radio inline name="isTCRooted" value="Y" onChange={handleChange}>rooted</Radio>
                            <Radio inline name="isTCRooted" value="N" onChange={handleChange}>unrooted</Radio>
                        </Col>
                        <Col sm={formCol} smOffset={labelCol}><HelpBlock>
                            Same as above.
                        </HelpBlock></Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={labelCol}>Tree Collection Names</Col>
                        <Col sm={formCol}>
                            <FormControl type="file" name="treeCollectionNames" onChange={handleChangeFile} />
                        </Col>
                        <Col sm={formCol}><HelpBlock>
                            (Optional) A name of tree each line corresponding to tree collection file.
                            If omitted, random names will be assigned.</HelpBlock></Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={labelCol}>Support Values</Col>
                        <Col sm={formCol}>
                            <Radio inline name="supportValues" value="NA" onChange={handleChange}>NA</Radio>
                            <Radio inline name="supportValues" value="1" onChange={handleChange}>range [0, 1]</Radio>
                            <Radio inline name="supportValues" value="100" onChange={handleChange}>range [0, 100]</Radio>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col smOffset={labelCol} sm={formCol}>
                            <Button bsStyle={selectingOutgroup? 'success': 'primary'} disabled={uploadState !== null} type="submit">
                                {!selectingOutgroup? 'Upload': 'Uploaded'}
                            </Button>
                            {upload.isProcessingEntities &&
                            <span style={{marginLeft: '10px'}}>Uploading and processing...</span>}
                        </Col>
                    </FormGroup>

                </form>
            </div>


            {selectingOutgroup &&
            <div ref={(outgroupSection) => {this.outgroupSection = outgroupSection}} style={{marginBottom: '20px'}}>
                <h1>Specify Outgroup</h1>
                <div>
                    Note: by specifying the outgroup, we are going to re-root the trees you provided regardless of
                    their original rooting.
                    If you want to explore different choices of outgroup, please provide a hypothesized one here as
                    we allow you to change it later on the interface.
                    If trees are unrooted, you MUST provide an outgroup to proceed because we are currently incapable
                    of processing unrooted trees without an outgroup.
                </div>
                <div id="outgroup-sel">
                    <div id="outgroup-sel-taxa-list">
                        <h3>Option 1: Check taxa in the outgroup</h3>
                        <div style={{overflowX: 'scroll'}}>
                            {entArr.map(eid =>
                                <div key={eid} className="list-item">
                                    <Checkbox inline checked={outgroupTaxa.hasOwnProperty(eid)}
                                              onChange={() => {this.props.onSelectOutgroupTaxa(eid)}}>{entities[eid]}</Checkbox>
                                </div>)}
                        </div>
                    </div>
                    <div id="outgroup-sel-dendrogram">
                        <h3>Option 2: Click branch in the dendrogram</h3>
                        <p>TODO</p>
                    </div>
                    <div id="outgroup-sel-file">
                        <h3>Option 3: List taxa names</h3>
                        <Form horizontal>
                            <FormGroup>
                                <FormControl componentClass="textarea" rows="10"
                                             onChange={(e) => {this.props.onChangeOutgroupFile(e.target.value)}} />
                                <HelpBlock>One taxon name per line.  Names must be consistent with tree files provided before.</HelpBlock>
                            </FormGroup>
                        </Form>
                    </div>
                </div>

                <div>
                    <h5>You have selected {outgroupTaxaArr.length} taxa as outgroup:</h5>
                    <div>
                        {outgroupTaxaArr.length === 0 && <span>none</span>}
                        {outgroupTaxaArr.map(eid =>
                            <span key={eid} style={{margin: '0 10px'}}>{entities[eid]}</span>)}
                    </div>
                    <Button bsStyle="primary" disabled={uploadState !== null} onClick={this.props.onUploadOutgroup}>Confirm</Button>
                </div>
            </div>
            }

            {uploadState === 'SENDING' && <div>
                Sending data to server...
            </div>}

            {uploadState === 'SENT' && <div>Data received by server.  Waiting to start processing data...</div>}

            {uploadState === 'PENDING' && <div>Data received by server.  Waiting to start processing data... (Server is probably busy now, please be patient.)</div>}

            {(uploadState === 'PROGRESS' || uploadState === 'FAILURE') && <div>
                <h3>Server is processing your dataset:</h3>
                <ol className="upload-progress-steps">
                    {progress.steps.map((s, i) =>
                        <li key={i} className={cn({done: progress.current > i, doing: progress.current === i})}>
                            {s}
                            {progress.current > i && <Glyphicon glyph="ok-circle"/>}
                            {progress.current === i && uploadState === 'FAILURE' && <Glyphicon glyph='remove-circle'/>}
                            {progress.current === i && uploadState === 'PROGRESS' && !onGoingStep &&
                                <span className="glyphicon glyphicon-repeat spin" />
                            }
                            {progress.current === i && uploadState === 'PROGRESS' && onGoingStep &&
                                <ProgressBar bsStyle="success" now={onGoingStep.done / onGoingStep.total * 100}
                                             label={`${onGoingStep.done} / ${onGoingStep.total}`} />
                            }
                        </li>)}
                </ol>
            </div>
            }

            {uploadState === 'SUCCESS' && <div>
                <h4>Server successfully processed this dataset. <a href={upload.datasetUrl}>Click here</a> to explore!</h4>
            </div>}

            {uploadState === 'FAILURE' && <div>
                Processing failed: {upload.error}
            </div>}
        </div>)
    }
}

let mapStateToProps = state => ({
    upload: state.upload
});
let mapDispatchToProps = dispatch => ({
    onChangeDataset: (n, v) => {dispatch(changeUploadDataset(n, v))},
    onUploadDataest: () => {dispatch(uploadDataset())},
    onSelectOutgroupTaxa: (eid) => {dispatch(selectOutgroupTaxa(eid))},
    onChangeOutgroupFile: (v) => {dispatch(changeOutgroupTaxaFile(v))},
    onUploadOutgroup: () => {dispatch(uploadOutgroup())},
});

export default connect(mapStateToProps, mapDispatchToProps)(UploadDataset);
