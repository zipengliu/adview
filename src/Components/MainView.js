/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Glyphicon, Button} from 'react-bootstrap';
import {fetchInputGroup, closeToast, toggleGlobalToolkit} from '../actions';
import cn from 'classnames';
import ReferenceTreeContainer from './ReferenceTreeContainer';
import Overview from './Overview';
import DendrogramContainer from './DendrogramContainer';
import TreeList from './TreeList';
import Inspector from './Inspector';
import AttributeExplorer from './AttributeExplorer';
import TaxaList from './TaxaList';
import TreeDistribution from './TreeDistribution';
import GlobalToolkit from './GlobalToolkit';
import BipartitionDistribution from './BipartitionDistribution';
import {getWindowHeight} from '../utils';

import './MainView.css';

class MainView extends Component {
    componentDidMount() {
        this.props.onRequestInputGroup(this.props.params.inputGroupId);
    }
    render() {
        return (
            <div>
                <div className={cn('toast', {show: this.props.toast.msg != null})}>
                    <p>{this.props.toast.msg}</p>
                    <div style={{position: 'absolute', top: 5, right: 5, cursor: 'pointer'}} onClick={this.props.onCloseToast}>
                        <Glyphicon glyph="remove"/>
                    </div>
                </div>

                <Button bsStyle="primary" bsSize="xsmall" active={this.props.globalToolkit.show} style={{position: 'fixed', top: 65, right: 5}}
                        onClick={this.props.onToggleGlobalToolkit}>
                    <Glyphicon glyph="wrench"/>
                </Button>

                {!this.props.isFetching && !this.props.isFetchFailed && this.props.inputGroupData &&
                <div className="mainview-container" style={{height: (getWindowHeight() - 60) + 'px'}}>
                    <GlobalToolkit/>
                    <div className="left-column">
                        <Overview />
                        <AttributeExplorer />
                        <TaxaList />
                        <TreeList />
                    </div>
                    <div className="middle-column">
                        <ReferenceTreeContainer></ReferenceTreeContainer>
                    </div>
                    <div className="right-column">
                        <TreeDistribution />
                        {!this.props.inputGroupData.withParalogs &&
                        <BipartitionDistribution />}
                        <DendrogramContainer />
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
    onCloseToast: () => {dispatch(closeToast())},
    onToggleGlobalToolkit: () => {dispatch(toggleGlobalToolkit())}
});

export default connect(mapStateToProps, mapDispatchToProps)(MainView);
