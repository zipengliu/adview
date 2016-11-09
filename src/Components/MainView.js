/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Grid, Row, Col} from 'react-bootstrap';
import {fetchInputGroup} from '../actions';
// import FullDendrogram from './FullDendrogram';
import ReferenceTreeContainer from './ReferenceTreeContainer';
import Overview from './Overview';
import 'whatwg-fetch';
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
                <Grid>
                    <Row>
                        <Col md={2}>
                            <Row className="view-area">
                                    <div className="overview">
                                        <Overview></Overview>
                                    </div>
                            </Row>
                            <Row className="view-area">
                                <div className="filter show-bg">

                                </div>
                            </Row>
                            <Row className="view-area">
                                <div className="tree-list show-bg">

                                </div>
                            </Row>
                        </Col>

                        <Col md={5}>
                            <div className="agg-dendro show-bg"></div>
                        </Col>
                        <Col md={5}>
                            <h3>Reference Tree</h3>
                            <div className="full-dendro">
                                <ReferenceTreeContainer></ReferenceTreeContainer>
                            </div>
                        </Col>
                    </Row>
                </Grid>}
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {...state}
}

export default connect(mapStateToProps)(MainView);
