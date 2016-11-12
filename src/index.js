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
import GroupList from './Components/GroupList';
import MainView from './Components/MainView';
import Playground from './Components/Playground';

console.log('Welcome to VisPhy!');

let loggerMiddleware = createLogger();
let store = createStore(visphyReducer, applyMiddleware(thunkMiddleware, loggerMiddleware));

let root = (
    <Provider store={store}>
        <Router history={browserHistory}>
            <Route path="/" component={App}>

                <IndexRoute component={About} />
                <Route path="input_group/:inputGroupId" component={MainView} />
                <Route path="group_list" component={GroupList}/>
            </Route>
            <Route path="/playground" component={Playground} />
        </Router>
    </Provider>
);

ReactDOM.render(root, document.getElementById('root'));


// import {changeReferenceTree} from './actions';
// setTimeout(function() {
//     store.dispatch(changeReferenceTree('581be6867443ee23c7436421'))
// }, 8000);
