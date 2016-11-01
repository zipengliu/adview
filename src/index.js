import React from 'react';
import ReactDOM from 'react-dom';
import { Router, IndexRoute, Route, browserHistory} from 'react-router';

import './index.css';

import App from './Components/App';
import About from './Components/About';
import GroupList from './Components/GroupList';
import MainView from './Components/MainView';
import Playground from './Components/Playground';

console.log('Welcome to VisPhy!');

let root = (
    <Router history={browserHistory}>
        <Route path="/" component={App}>

            <IndexRoute component={About} />
            <Route path="input_group/:inputGroupId" component={MainView} />
            <Route path="group_list" component={GroupList}/>
        </Route>
        <Route path="/playground" component={Playground} />
    </Router>
);

ReactDOM.render(root, document.getElementById('root'));
