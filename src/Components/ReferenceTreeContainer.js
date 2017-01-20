/**
 * Created by Zipeng Liu on 2016-11-07.
 */

import React from 'react';
import {connect} from 'react-redux';
import FullDendrogram from './FullDendrogram';

let ReferenceTreeContainer = props => (
    <div className="view" style={{height: '98%'}}>
        <div className="view-header">
            <div style={{textAlign: 'center'}}>
                <span className="view-title">Reference Tree </span>
                <span>({props.title})</span>
            </div>
        </div>
        <div className="view-body">
            <FullDendrogram />
        </div>
</div>);

let mapStateToProps = state => ({
    title: state.inputGroupData.trees[state.referenceTree.id].name,
});

export default connect(mapStateToProps)(ReferenceTreeContainer);