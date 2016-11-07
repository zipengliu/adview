/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Grid, Row, Col} from 'react-bootstrap';
import {fetchInputGroup} from '../actions';
import FullDendrogram from './FullDendrogram';
import Measure from 'react-measure';
import 'whatwg-fetch';
import './MainView.css';

class MainView extends Component {
    componentDidMount() {
        this.props.dispatch(fetchInputGroup(this.props.params.inputGroupId));
    }
    render() {
        return (
            <div>
                <Grid>
                    <Row>
                        <Col md={2}>
                            <Row className="view-area">
                                <Col md={12}>
                                    <div className="overview show-bg">

                                    </div>
                                </Col>
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
                            <Measure>
                                {dimensions =>
                                    <div className="full-dendro">
                                        {this.props.inputGroupData &&
                                        <FullDendrogram width={dimensions.width} height={dimensions.height} />
                                        }
                                    </div>
                                }
                            </Measure>
                        </Col>
                    </Row>
                </Grid>
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {...state}
}

export default connect(mapStateToProps)(MainView);
