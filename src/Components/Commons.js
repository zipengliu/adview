/**
 * Created by zipeng on 2017-05-24.
 */

import React from 'react';
import {Glyphicon} from 'react-bootstrap';

let glyphStyle = {
    display: 'inline-block',
    fontSize: '12px',
    marginRight: '2px',
    top: '0',
    height: '10px',
    width: '10px',
    color: 'grey'
};

export function renderSubCollectionGlyph(glyph) {
    switch (glyph) {
        case 'circle': return <div style={{...glyphStyle, borderRadius: '5px', backgroundColor: 'grey'}} />;
        case 'plus':
        case 'triangle-right': return <Glyphicon glyph={glyph} style={glyphStyle} />;
        case 'square': return <div style={{...glyphStyle, backgroundColor: 'grey'}} />;
        case 'diamond': return <div style={{...glyphStyle, backgroundColor: 'grey', marginRight: '4px', transform: 'rotate(45deg)'}} />;
    }
}
