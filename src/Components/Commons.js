/**
 * Created by zipeng on 2017-05-24.
 */

import React from 'react';
import {Glyphicon, Modal, ProgressBar} from 'react-bootstrap';
import cn from 'classnames';

let glyphStyle = {
    display: 'inline-block',
    fontSize: '12px',
    marginRight: '2px',
    top: '0',
    height: '10px',
    width: '10px',
    color: 'black'
};

export function renderSubCollectionGlyph(glyph, color='black') {
    switch (glyph) {
        case 'circle': return <div style={{...glyphStyle, borderRadius: '5px', backgroundColor: color}} />;
        case 'plus':
        case 'triangle-right': return <Glyphicon glyph={glyph} style={{...glyphStyle, color}} />;
        case 'square': return <div style={{...glyphStyle, backgroundColor: color}} />;
        case 'diamond': return <div style={{...glyphStyle, backgroundColor: color, marginRight: '4px', transform: 'rotate(45deg)'}} />;
        default:
    }
}


export function uploadProgressModal(status, progress, error, datasetUrl) {
    let onGoingStep = null;
    if (progress && progress.progress) {
        onGoingStep = progress.progress;
    }
    return (
        <Modal.Dialog>
            <Modal.Header>
                <Modal.Title>Progress</Modal.Title>
            </Modal.Header>

            <Modal.Body>
                {status === 'SENDING' && <div>
                    Sending data to server...
                </div>}

                {status === 'SENT' && <div>Data received by server.  Waiting to start processing data...</div>}

                {status === 'PENDING' && <div>Data received by server.  Waiting to start processing data... (Server is probably busy now, please be patient.)</div>}

                {progress &&
                <ol className="upload-progress-steps">
                    {progress.steps.map((s, i) =>
                        <li key={i} className={cn({done: progress.current > i, doing: progress.current === i})}>
                            {s}
                            {progress.current > i && <Glyphicon glyph="ok-circle"/>}
                            {progress.current === i && status === 'FAILURE' && <Glyphicon glyph='remove-circle'/>}
                            {progress.current === i && status === 'PROGRESS' && !onGoingStep &&
                            <span className="glyphicon glyphicon-repeat spin" />
                            }
                            {progress.current === i && status === 'PROGRESS' && onGoingStep &&
                            <ProgressBar bsStyle="success" now={onGoingStep.done / onGoingStep.total * 100}
                                         label={`${onGoingStep.done} / ${onGoingStep.total}`} />
                            }
                        </li>)}
                </ol>}

                {status === 'SUCCESS' && <div>
                    Successfully processed!  Please click <a href={datasetUrl}>HERE</a> to load it.
                </div>}

                {status === 'FAILURE' && <div>
                    Processing failed: {error}
                </div>}
            </Modal.Body>
        </Modal.Dialog>
    )
}
