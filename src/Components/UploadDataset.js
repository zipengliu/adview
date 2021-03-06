import React, { Component } from 'react';
import {connect} from 'react-redux';
import cn from 'classnames';
import {Form, FormGroup, ControlLabel, FormControl, HelpBlock, Col, Button, Radio, Checkbox} from 'react-bootstrap';
import {changeUploadDataset, uploadDataset, uploadOutgroup, selectOutgroupTaxa, changeOutgroupTaxaFile, toggleOutgroupBranch} from '../actions';
import {uploadProgressModal} from './Commons';
import './UploadDataset.css';

class UploadDataset extends Component {
    render() {
        let {upload, selectingOutgroup, dendrogramSpec, fullDendrogram} = this.props;
        let {entities, outgroupTaxa, uploadState, formData, outgroupBranches} = upload;
        let entArr;
        if (entities) {
            entArr = Object.keys(entities).sort((a ,b) => {
                if (entities[a] > entities[b]) return 1;
                if (entities[a] < entities[b]) return -1;
                return 0;
            });
        }
        let outgroupTaxaArr;
        if (outgroupTaxa) {
            outgroupTaxaArr = Object.keys(outgroupTaxa);
        }

        let renderDendrogram = (dendrogram, spec) => {
            let svgWidth = dendrogram.treeBoundingBox.width + spec.margin.left + spec.margin.right;
            let svgHeight = dendrogram.treeBoundingBox.height + spec.margin.top + spec.margin.bottom;

            let {branchSpecs, verticalLines, textSpecs, responsiveBoxes, hoverBoxes} = dendrogram;
            // let {branches} = upload.referenceTree;

            return (
                <svg width={svgWidth} height={svgHeight}>
                    <g transform={`translate(${spec.margin.left},${spec.margin.top})`}>
                        <g>
                            {Object.keys(outgroupBranches).map(bid =>
                                <rect key={bid} className="highlight-box" {...hoverBoxes[bid]}/>)}
                        </g>

                        <g className="topology">
                            {branchSpecs.map((d) =>
                                <g key={d.bid}>
                                    <line className={cn('branch-line', {selected: outgroupBranches.hasOwnProperty(d.bid)})}
                                          x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}/>
                                </g>
                            )}
                            {verticalLines.map((d, i) =>
                                <line className="branch-line" key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                            )}
                        </g>

                        <g className="names">
                            {textSpecs.map((d, i) =>
                                <text key={i} className="entity-name" x={d.x} y={d.y} dx={8} dy={3} textAnchor='start'>
                                    {entities[d.entity_id]}
                                </text>)}
                        </g>

                        <g className="responding-boxes">
                            {responsiveBoxes.map(d =>
                                <rect key={d.bid} className={cn("box")}
                                      x={d.x} y={d.y} width={d.width} height={d.height}
                                      onClick={this.props.onToggleOutgroupBranch.bind(null, d.bid)}
                                />
                            )}
                        </g>
                    </g>
                </svg>
            )
        };

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
                            <FormControl type="text" name="title" value={formData.title} onChange={handleChange}/>
                        </Col>
                    </FormGroup>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={labelCol}>Description</Col>
                        <Col sm={formCol}>
                            <FormControl componentClass="textarea" rows="5" name="description" value={formData.description} onChange={handleChange} />
                        </Col>
                    </FormGroup>

                    <FormGroup style={{marginBottom: '30px'}}>
                        <Col componentClass={ControlLabel} sm={labelCol} />
                        <Col sm={formCol}>
                            <Radio inline name="isPublic" value="Y" checked={formData.isPublic === 'Y'} onChange={handleChange}>Public</Radio>
                            <Radio inline name="isPublic" value="N" checked={formData.isPublic === 'N'} onChange={handleChange}>Private</Radio>
                        </Col>
                        <Col sm={formCol} smOffset={labelCol}><HelpBlock>
                            All users can see public datasets, while only you can see your own private datasets.
                        </HelpBlock></Col>
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
                            <Radio inline name="isReferenceRooted" value="Y" checked={formData.isReferenceRooted === 'Y'}
                                   onChange={handleChange}>rooted</Radio>
                            <Radio inline name="isReferenceRooted" value="N" checked={formData.isReferenceRooted === 'N'}
                                   onChange={handleChange}>unrooted</Radio>
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
                            <Radio inline name="isTCRooted" value="Y" checked={formData.isTCRooted === 'Y'}
                                   onChange={handleChange}>rooted</Radio>
                            <Radio inline name="isTCRooted" value="N" checked={formData.isTCRooted === 'N'}
                                   onChange={handleChange}>unrooted</Radio>
                        </Col>
                        <Col sm={formCol} smOffset={labelCol}><HelpBlock>
                            Same as above.
                        </HelpBlock></Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={labelCol}>Tree Names</Col>
                        <Col sm={formCol}>
                            <FormControl type="file" name="treeCollectionNames" onChange={handleChangeFile} />
                        </Col>
                        <Col sm={formCol}><HelpBlock>
                            (Optional) A name of tree each line corresponding to tree collection file.
                            If not, default names will be assigned.</HelpBlock></Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={labelCol}>Support Values</Col>
                        <Col sm={formCol}>
                            <Radio inline name="supportValues" value="NA" checked={formData.supportValues === 'NA'}
                                   onChange={handleChange}>NA</Radio>
                            <Radio inline name="supportValues" value="1" checked={formData.supportValues === '1'}
                                   onChange={handleChange}>[0, 1]</Radio>
                            <Radio inline name="supportValues" value="100" checked={formData.supportValues === '100'}
                                   onChange={handleChange}>[0, 100]</Radio>
                        </Col>
                        <Col sm={formCol} smOffset={labelCol}><HelpBlock>
                            The range of the support values used in the tree files.
                        </HelpBlock></Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={labelCol}>Taxa attributes</Col>
                        <Col sm={formCol}>
                            <FormControl type="file" name="taxaAttributes" onChange={handleChangeFile} />
                        </Col>
                        <Col sm={formCol}><HelpBlock>
                            (Optional) A CSV file to specify the attributes of each taxon.  Each row corresponds to
                            a taxon, and each coloumn represents an attribute.  The value in the cell can be 1 or 0
                            or simply nothing.
                        </HelpBlock></Col>
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
                        {renderDendrogram(fullDendrogram, dendrogramSpec)}
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

                {uploadState !== null &&
                uploadProgressModal(uploadState, upload.progress, upload.error, upload.datasetUrl)}
            </div>
            }
        </div>)
    }
}

let mapStateToProps = state => {
    let selectingOutgroup = !state.isProcessingEntities && state.upload.referenceTree;
    let dendro = null;
    if (selectingOutgroup) {
        let t = state.upload.referenceTree;

        // Change the format of state.upload.entities to match up with the one in state.inputGroupData.entities
        // Don't want to change the server response because that will affect other components sigh
        let entities = {};
        for (let eid in state.upload.entities) if (state.upload.entities.hasOwnProperty(eid)) {
            entities[eid] = {name: state.upload.entities[eid]}
        }

        let spec = {...state.dendrogramSpec};
        // We want them to be a bit longer in the upload page
        spec.unitBranchLength = 20;
        spec.uniformBranchLength = 12;
        // And more room to see the taxa
        spec.marginOnEntity = 12;

        // This can be potentially optimized with createSelector
        dendro = t.renderFullDendrogram(entities, 'right', false, spec, []);
    }
    return {
        upload: state.upload,
        selectingOutgroup,
        fullDendrogram: dendro,
        dendrogramSpec: state.dendrogramSpec,
    }
};
let mapDispatchToProps = dispatch => ({
    onChangeDataset: (n, v) => {dispatch(changeUploadDataset(n, v))},
    onUploadDataest: () => {dispatch(uploadDataset())},
    onSelectOutgroupTaxa: (eid) => {dispatch(selectOutgroupTaxa(eid))},
    onChangeOutgroupFile: (v) => {dispatch(changeOutgroupTaxaFile(v))},
    onUploadOutgroup: () => {dispatch(uploadOutgroup())},
    onToggleOutgroupBranch: (bid) => {dispatch(toggleOutgroupBranch(bid))},
});

export default connect(mapStateToProps, mapDispatchToProps)(UploadDataset);
