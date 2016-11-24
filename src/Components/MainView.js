/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {fetchInputGroup} from '../actions';
import ReferenceTreeContainer from './ReferenceTreeContainer';
import Overview from './Overview';
import DendrogramContainer from './DendrogramContainer';
import TreeList from './TreeList';

import './MainView.css';

class MainView extends Component {
    componentDidMount() {
        this.props.dispatch(fetchInputGroup(this.props.params.inputGroupId));
    }
    render() {
        return (
            <div>
                {this.props.isFetching && <h1>Fetching data...</h1>}
                {!this.props.isFetching && this.props.isFetchFailed &&
                    <h1>{this.props.fetchError.toString() || 'Failed to fetch data.'}</h1>}
                {!this.props.isFetching && !this.props.isFetchFailed && this.props.inputGroupData &&
                    <div className="mainview-container">
                        <div className="left-column">
                            <div className="overview">
                                <Overview></Overview>
                            </div>
                            <div className="filter show-bg">

                            </div>
                            <div className="tree-list">
                                <TreeList />
                            </div>
                        </div>
                        <div className="middle-column">
                            <DendrogramContainer />
                        </div>
                        <div className="right-column">
                            <h3>Reference Tree</h3>
                            <div className="full-dendro">
                            <ReferenceTreeContainer></ReferenceTreeContainer>
                            </div>
                        </div>
                    </div>}
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {...state}
}

export default connect(mapStateToProps)(MainView);
