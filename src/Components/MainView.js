/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {Grid, Row, Col} from 'react-bootstrap';
import FullDendrogram from './FullDendrogram';
import Measure from 'react-measure';
import 'whatwg-fetch';
import './MainView.css';

class MainView extends Component {
    constructor(props) {
        super(props);
        this.state = {
            data: null
        }
    }
    componentDidMount() {
        var that = this;
        fetch('http://localhost:33333/input_groups/' + this.props.params.inputGroupId).then(function(response) {
            if (response.status >= 400) {
                throw new Error("Bad response from server");
            }
            return response.json();
        }).then(function (data) {
            console.log('Get data succeeded!');
            that.setState({'data': data});
        });

    }
    render() {
        return (
            <div>
                <h1>This is the main view {this.props.params.inputGroupId} page</h1>
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
                                        {this.state.data &&
                                        <FullDendrogram topo={this.state.data.trees[this.state.data.defaultReferenceTree]}
                                        width={dimensions.width} height={dimensions.height} />
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

export default MainView;
