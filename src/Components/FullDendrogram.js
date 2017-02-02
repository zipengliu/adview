/**
 * Created by Zipeng Liu on 2016-11-04.
 */

import React, { Component } from 'react';
import {connect} from 'react-redux';
import {scaleLinear} from 'd3-scale';
import {createSelector} from 'reselect';
import cn from 'classnames';
import {toggleHighlightMonophyly, selectBranchOnFullDendrogram, changeDistanceMetric} from '../actions';
import {createMappingFromArray} from '../utils';

import './FullDendrogram.css';

class FullDendrogram extends Component {
    render() {
        let {isStatic, spec, tree, referenceTree, branchSpecs, verticalLines, responsiveBoxes,
            hoverBoxes, textSpecs, entities, rangeSelection} = this.props;
        let {selected, persist, highlightMonophyly, highlightEntities, highlightUncertainEntities} = referenceTree;
        let {missing} = tree;
        let highlightEntitiesMapping = createMappingFromArray(highlightEntities);
        let highlightUncertainEntitiesMapping = createMappingFromArray(highlightUncertainEntities);
        let {attrName, range} = rangeSelection || {};

        let inRange = d => rangeSelection && !d.isLeaf &&
        range[0] <= tree.branches[d.bid][attrName] && tree.branches[d.bid][attrName] <= range[1];

        let names = textSpecs.map(d => (<text className={cn('entity-name', {highlighted: highlightEntitiesMapping.hasOwnProperty(d.entity_id),
            'uncertain-highlighted': highlightUncertainEntitiesMapping.hasOwnProperty(d.entity_id)})}
                                              x={d.x} y={d.y} dx={5} dy={3}
                                              textAnchor="start" key={d.entity_id}>{entities[d.entity_id].name}</text>));
        let missingBranchPos = missing? (missing.length - 1) / 2 * spec.marginOnEntity: null;

        return (
            <svg width={spec.width + spec.margin.left + spec.margin.right}
                 height={spec.height + spec.margin.top + spec.margin.bottom}>
                <g transform={`translate(${spec.margin.left},${spec.margin.top})`}>
                    <g>
                        {referenceTree.highlightMonophyly &&
                        <rect className="hover-box" {...hoverBoxes[referenceTree.highlightMonophyly]}></rect>}
                    </g>
                    <g className="topology">
                        {branchSpecs.map((d, i) =>
                            (<g key={d.bid}>
                                <line className={cn('branch-line', {selected: selected && selected.indexOf(d.bid) !== -1, 'range-selected': inRange(d) })}
                                      x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                                {this.props.metricBranch === d.bid && d.bid != null &&
                                <circle className="metric-branch-indicator" r="4" cx={(d.x1 + d.x2) / 2} cy={d.y1} />}
                                {selected.length && selected[0] === d.bid &&
                                <g>
                                    <line className="last-selected-indicator" x1={d.x1} y1={d.y1-3} x2={d.x2} y2={d.y2-3} />
                                    <line className="last-selected-indicator" x1={d.x1} y1={d.y1+3} x2={d.x2} y2={d.y2+3} />
                                </g>}
                            </g>))}
                        {verticalLines.map((d, i) =>
                            <line className="branch-line" key={i} x1={d.x1} y1={d.y1} x2={d.x2} y2={d.y2}  />
                        )}
                    </g>
                    <g className="names">{names}</g>
                    {!isStatic &&
                    <g className="responding-boxes">
                        {responsiveBoxes.map(d =>
                            <rect className={cn("box")}
                                  x={d.x} y={d.y} width={d.width} height={d.height}
                                  onMouseEnter={persist? null: this.props.toggleHighlightMonophyly.bind(null, d.bid)}
                                  onMouseLeave={persist? null: this.props.toggleHighlightMonophyly.bind(null, null)}
                                  onClick={() => {if (this.props.pickingBranch) {
                                      if (this.props.metricBranch !== d.bid) this.props.onChangeDistanceMetric(d.bid)
                                  } else {
                                      if (persist) {
                                          this.props.toggleHighlightMonophyly(highlightMonophyly === d.bid? null: d.bid)
                                      } else {
                                          this.props.onSelectBranch(d.bid)
                                      }
                                  } }}
                                  key={d.bid}>
                            </rect>)}
                    </g>
                    }
                    {missing && missing.length &&
                    <g className="missing" transform={`translate(0,${(tree.branches[tree.rootBranch].entities.length + 2) * spec.marginOnEntity})`}>
                        <line className="branch-line" x1="0" y1={missingBranchPos} x2="50" y2={missingBranchPos}/>
                        <line className="branch-line" x1="50" y1="0" x2="50" y2={(missing.length - 1) * spec.marginOnEntity}/>
                        <text style={{fontSize: '12px'}} x="0" y={missingBranchPos} dy="-2" >missing</text>
                        <text style={{fontSize: '12px'}} x="0" y={missingBranchPos} dy="12" >taxa</text>
                        {missing.map((eid, i) => <g key={i}>
                            <line className="branch-line" x1="50" y1={i * spec.marginOnEntity} x2="70" y2={i * spec.marginOnEntity} />
                            <text className={cn('entity-name', {highlighted: highlightEntitiesMapping.hasOwnProperty(eid)})}
                                              x={70} y={i * spec.marginOnEntity} dx={5} dy={3}>{entities[eid].name}</text>
                        </g>)}
                        {highlightMonophyly === 'missing' &&
                        <rect className="hover-box" x="0" y="-4" width={spec.width} height={missing.length * spec.marginOnEntity} />}
                        {!isStatic && <rect className="box" x="0" y={missingBranchPos - 12} width="50" height={24}
                                            onMouseEnter={persist? null: this.props.toggleHighlightMonophyly.bind(null, 'missing')}
                                            onMouseLeave={persist? null: this.props.toggleHighlightMonophyly.bind(null, null)}
                                            onClick={() => {persist? this.props.toggleHighlightMonophyly(highlightMonophyly === 'missing'? null: 'missing'): null}}
                        />}
                    </g>
                    }
                </g>
            </svg>
        )
    }
}

function getMaxLength(topo) {
    let r = topo.rootBranch;
    let branches = topo.branches;
    let maxLength = 0;

    let traverse = function(bid, cur) {
        cur += branches[bid].length;
        maxLength = Math.max(cur, maxLength);
        if ('left' in branches[bid]) {
            traverse(branches[bid].left, cur);
            traverse(branches[bid].right, cur);
        }
    };

    traverse(r, 0);
    // console.log('max length in ref tree: ' + maxLength);
    return maxLength;
}

let getDendrogramSpecs = createSelector(
    [(state, ownProps) => ownProps.tree? state.inputGroupData.trees[ownProps.tree.id]: state.inputGroupData.trees[state.referenceTree.id],
        state => state.dendrogramSpec],
    (tree, spec) => {

        let branches = tree.branches;
        let maxLength = getMaxLength(tree);
        let topologyWidth = spec.width - spec.labelWidth;
        let xScale = scaleLinear().domain([0, maxLength]).range([0, topologyWidth]);
        let b = {};
        let connectLines = [];
        let curY = 0;
        let text = [];

        // THe bounding box for a subtree, keyed by the leading branch
        let boundingBox = {};
        let boxHalfWidth = (spec.responsiveAreaSize - 1) / 2;

        let traverse = (bid, curX) => {
            let bLength = branches[bid].length;
            let t = xScale(bLength);
            b[bid] = {x1: curX, x2: curX + t};
            curX += t;
            if ('left' in branches[bid]) {
                let {left, right} = branches[bid];
                traverse(left, curX);
                traverse(right, curX);
                b[bid].y1 = (b[left].y1 + b[right].y1) / 2;
                b[bid].y2 = b[bid].y1;
                connectLines.push({x1: curX, x2: curX, y1: b[left].y1, y2: b[right].y1});
                // Merge the two children bounding box to for his bounding box
                boundingBox[bid] = {x: b[bid].x1, y: boundingBox[left].y,
                    width: spec.width - b[bid].x1,
                    height: boundingBox[right].y + boundingBox[right].height - boundingBox[left].y};
            } else {
                // Leaf branch
                b[bid].y1 = curY;
                b[bid].y2 = curY;
                boundingBox[bid] = {x: b[bid].x1, y: b[bid].y1 - boxHalfWidth,
                    width: spec.width - b[bid].x1, height: spec.responsiveAreaSize};
                let ent_id = branches[bid].entities[0];
                text.push({entity_id: ent_id,  x: curX, y: curY});
                curY += spec.marginOnEntity;
            }
        };

        traverse(tree.rootBranch, 0);

        let branchSpecs = [];
        let responsiveBoxes = [];
        for (let bid in b) if (b.hasOwnProperty(bid)) {
            branchSpecs.push({...b[bid], bid, isLeaf: branches[bid].isLeaf});
            responsiveBoxes.push({x: b[bid].x1, y: b[bid].y1 - boxHalfWidth,
                width: b[bid].x2 - b[bid].x1, height: spec.responsiveAreaSize, bid});
        }
        return {
            branchSpecs,
            verticalLines: connectLines,
            responsiveBoxes,
            textSpecs: text,
            hoverBoxes: boundingBox,
        };
    }
);

function mapStateToProps(state, ownProps) {
    return {
        isStatic: !!ownProps.isStatic,
        ...getDendrogramSpecs(state, ownProps),
        referenceTree: state.referenceTree,
        tree: state.inputGroupData.trees[ownProps.tree? ownProps.tree.id: state.referenceTree.id],
        spec: state.dendrogramSpec,
        entities: state.inputGroupData.entities,
        pickingBranch: state.overview.pickingBranch,
        metricBranch: state.overview.metricMode === 'global'? null: state.overview.metricBranch,
        rangeSelection: state.attributeExplorer.activeSelectionId === 0? {
                attrName: 'support',
                range: state.attributeExplorer.selection[state.attributeExplorer.activeSelectionId].range
            }: null,
    }
}

function mapDispatchToProps(dispatch) {
    return {
        toggleHighlightMonophyly: (bid) => {
            dispatch(toggleHighlightMonophyly(bid));
        },
        onSelectBranch: (bid) => {
            dispatch(selectBranchOnFullDendrogram(bid));
        },
        onChangeDistanceMetric: (bid) => {
            dispatch(changeDistanceMetric('local', bid));
        }
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(FullDendrogram);
