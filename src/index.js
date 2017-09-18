import React from 'react';
import ReactDOM from 'react-dom';
import { Router, IndexRoute, Route, browserHistory} from 'react-router';
import {createStore, applyMiddleware} from 'redux';
import {Provider} from 'react-redux';
import visphyReducer from './reducers';
import createLogger from 'redux-logger';
import thunkMiddleware from 'redux-thunk';


import './index.css';

import App from './Components/App';
import About from './Components/About';
import DatasetList from './Components/DatasetList';
import MainView from './Components/MainView';
import UserManual from './Components/UserManual';
import UploadDataset from './Components/UploadDataset';
import UserLogin from './Components/UserLogin';

console.log('Welcome to VisPhy!');

let loggerMiddleware = createLogger({
    collapsed: true
});
let store = createStore(visphyReducer, applyMiddleware(thunkMiddleware, loggerMiddleware));

let root = (
    <Provider store={store}>
        <Router history={browserHistory}>
            <Route path="/" component={App}>

                {/*<Route onEnter={requireAuth}>*/}
                    <IndexRoute component={DatasetList} />
                    <Route path="dataset/:inputGroupId" component={MainView} />
                    <Route path="dataset-list" component={DatasetList}/>
                    <Route path="upload" component={UploadDataset}/>
                {/*</Route>*/}

                <Route path="about" component={About} />
                <Route path="user-manual" component={UserManual}/>
                <Route path="login" component={UserLogin}/>
            </Route>
        </Router>
    </Provider>
);

ReactDOM.render(root, document.getElementById('root'));

