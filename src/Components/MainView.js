/**
 * Created by Zipeng Liu on 2016-10-30.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {Glyphicon, DropdownButton, MenuItem, Badge} from 'react-bootstrap';
import {fetchInputGroup, closeToast, toggleTaxaList, toggleRefAttributeExplorer} from '../actions';
import cn from 'classnames';
import ReferenceTreeContainer from './ReferenceTreeContainer';
import Overview from './Overview';
import DendrogramContainer from './DendrogramContainer';
import TreeList from './TreeList';
import Inspector from './Inspector';
import TaxaList from './TaxaList';
import ReferenceTreeAttributeExplorer from './ReferenceTreeAttributeExplorer';
import CBAttributeExplorer from './CBAttributeExplorer';
import TreeDistribution from './TreeDistribution';
import GlobalToolkit from './GlobalToolkit';
// import BipartitionDistribution from './BipartitionDistribution';
import {getWindowHeight} from '../utils';

import './MainView.css';

class MainView extends Component {
    componentDidMount() {
        this.props.onRequestInputGroup(this.props.params.inputGroupId);
    }
    render() {
        let {charts, taxaList, inputGroupData, toast} = this.props;
        return (
            <div>
                <div className={cn('toast', {show: toast.msg != null})}>
                    <p>{toast.msg}</p>
                    <div style={{position: 'absolute', top: 5, right: 5, cursor: 'pointer'}} onClick={this.props.onCloseToast}>
                        <Glyphicon glyph="remove"/>
                    </div>
                </div>


                {!this.props.isFetching && !this.props.isFetchFailed && inputGroupData &&
                <div>
                    <TaxaList/>
                    {charts.show && charts.float && <ReferenceTreeAttributeExplorer/>}
                    <div className="mainview-container" style={{height: (getWindowHeight() - 60) + 'px'}}>
                        <div className="left-column">
                            <div className="chapter-title">
                                <Glyphicon glyph="registration-mark"/>eference Tree
                                <DropdownButton bsSize="xsmall" title="" id="reference-tree-dropdown-more" style={{marginLeft: '5px'}}>
                                    <MenuItem eventKey="attributes" onSelect={() => {this.props.toggleAE()}}>
                                        {charts.show? 'Hide': 'Show'} branch attributes <Glyphicon glyph="signal"/>
                                    </MenuItem>
                                    <MenuItem eventKey="taxa_list" onSelect={() => {this.props.toggleTaxaList()}}>
                                        <span>{taxaList.show? 'Hide': 'Show'} taxa list</span>
                                        <Badge style={{marginLeft: '5px'}}>{Object.keys(inputGroupData.entities).length}</Badge>
                                    </MenuItem>
                                    <MenuItem eventKey="import" disabled>Import another reference tree from file</MenuItem>
                                </DropdownButton>
                            </div>
                            <ReferenceTreeContainer />
                        </div>
                        <div className="right-column">
                            <div className="chapter-title">Tree Collection</div>
                            <GlobalToolkit/>
                            <div style={{flex: '1 1 auto', display: 'flex', flexFlow: 'row nowrap'}}>
                                <div className="views-column" style={{flex: '1 1 auto', marginRight: '10px'}}>
                                    <TreeDistribution />
                                    {/*{!inputGroupData.withParalogs && <BipartitionDistribution />}*/}
                                    <DendrogramContainer />
                                </div>
                                <div className="views-column" style={{flex: '0 0 auto', width: '200px'}}>
                                    <TreeList />
                                    <Overview />
                                    <CBAttributeExplorer />
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
    return {
        isFetching: state.isFetching,
        isFetchFailed: state.isFetchFailed,
        inputGroupData: state.inputGroupData,
        charts: state.referenceTree.charts,
        taxaList: state.taxaList,
        toast: state.toast,
    }
}

let mapDispatchToProps = dispatch => ({
    onRequestInputGroup: (id) => {dispatch(fetchInputGroup(id))},
    onCloseToast: () => {dispatch(closeToast())},
    toggleTaxaList: () => {dispatch(toggleTaxaList())},
    toggleAE: () => {dispatch(toggleRefAttributeExplorer())},
});

export default connect(mapStateToProps, mapDispatchToProps)(MainView);
