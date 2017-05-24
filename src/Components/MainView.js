/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Glyphicon} from 'react-bootstrap';
import {fetchInputGroup, closeToast, toggleGlobalToolkit} from '../actions';
import cn from 'classnames';
import ReferenceTreeContainer from './ReferenceTreeContainer';
import Overview from './Overview';
import DendrogramContainer from './DendrogramContainer';
import TreeList from './TreeList';
import Inspector from './Inspector';
import TaxaList from './TaxaList';
import ReferenceTreeAttributeExplorer from './ReferenceTreeAttributeExplorer';
import AttributeExplorer from './AttributeExplorer';
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


                {!this.props.isFetching && !this.props.isFetchFailed && this.props.inputGroupData &&
                <div>
                    <TaxaList/>
                    {this.props.referenceTree.charts.show && this.props.referenceTree.charts.float && <ReferenceTreeAttributeExplorer/>}
                    <div className="mainview-container" style={{height: (getWindowHeight() - 60) + 'px'}}>
                        <div className="left-column">
                            <div className="chapter-title"><Glyphicon glyph="registration-mark"/>eference Tree</div>
                            <ReferenceTreeContainer />
                        </div>
                        <div className="right-column">
                            <div className="chapter-title">Tree Collection</div>
                            <GlobalToolkit/>
                            <div style={{flex: '1 1 auto', display: 'flex', flexFlow: 'row nowrap'}}>
                                <div className="views-column" style={{flex: '1 1 auto', marginRight: '10px'}}>
                                    <TreeDistribution />
                                    {!this.props.inputGroupData.withParalogs && <BipartitionDistribution />}
                                    <DendrogramContainer />
                                </div>
                                <div className="views-column" style={{flex: '0 0 auto', width: '200px'}}>
                                    <TreeList />
                                    <Overview />
                                    <AttributeExplorer />
                                </div>
                            </div>
                        </div>
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
