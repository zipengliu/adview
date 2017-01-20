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
import Inspector from './Inspector';
import AttributeExplorer from './AttributeExplorer';

import './MainView.css';

class MainView extends Component {
    componentDidMount() {
        this.props.onRequestInputGroup(this.props.params.inputGroupId);
    }
    render() {
        return (
            <div>
                <div className={cn('toast', {show: this.props.toast.msg != null})}>{this.props.toast.msg}</div>
                {!this.props.isFetching && !this.props.isFetchFailed && this.props.inputGroupData &&
                <div className="mainview-container">
                    <div className="left-column">
                        <Overview />
                        <AttributeExplorer />
                        <TreeList />
                    </div>
                    <div className="middle-column">
                        <DendrogramContainer />
                    </div>
                    <div className="right-column">
                        <ReferenceTreeContainer></ReferenceTreeContainer>
                    </div>
                </div>}

                <Inspector />
            </div>
        )
    }
}

function mapStateToProps(state) {
    return {...state}
}

let mapDispatchToProps = dispatch => ({
    onRequestInputGroup: (id) => {dispatch(fetchInputGroup(id))},
});

export default connect(mapStateToProps, mapDispatchToProps)(MainView);
