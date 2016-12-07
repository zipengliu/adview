/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {fetchInputGroup} from '../actions';
import cn from 'classnames';
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
        console.log('toast: ', this.props.toast.msg);
        return (
            <div>
                <div className={cn('toast', {show: this.props.toast.msg != null})}>{this.props.toast.msg}</div>
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
                            <ReferenceTreeContainer></ReferenceTreeContainer>
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
