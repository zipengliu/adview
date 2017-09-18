import React, { Component } from 'react';
import {connect} from 'react-redux';
import {FormGroup, ControlLabel, FormControl, Col, Button} from 'react-bootstrap';
import {login, changeLoginForm} from '../actions';


class UserLogin extends Component {
    componentWillReceiveProps(nextProps) {
        if (nextProps.isAuthenticated) {
            this.props.router.push('/dataset-list');
        }
    }
    render() {
        let {form, loginRequest, loginError} = this.props;
        let handleChange = (e) => {
            this.props.onChange(e.target.name, e.target.value);
        };
        let handleSubmit = (e) => {
            e.preventDefault();
            this.props.onLogin(form);
        };

        return (
            <div style={{margin: '50px auto', width: '400px'}}>
                <form className="form-horizontal" onSubmit={handleSubmit}>
                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={4}>Username</Col>
                        <Col sm={8}>
                            <FormControl type="text" name="username" value={form.username} onChange={handleChange}/>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col componentClass={ControlLabel} sm={4}>Password</Col>
                        <Col sm={8}>
                            <FormControl type="password" name="password" value={form.password} onChange={handleChange}/>
                        </Col>
                    </FormGroup>

                    <FormGroup>
                        <Col smOffset={4} sm={8}>
                            <Button bsStyle={'primary'} disabled={loginRequest} type="submit">
                                Login
                            </Button>
                            {(loginRequest || loginError) &&
                            <span style={{marginLeft: '10px'}}>{loginRequest? 'Sending request...': loginError}</span>}
                        </Col>
                    </FormGroup>
                </form>
            </div>
        )
    }
}

let mapStateToProps = (state) => ({
    ...state.user,
});

let mapDispatchToProps = (dispatch) => ({
    onChange: (a, v) => {dispatch(changeLoginForm(a, v))},
    onLogin: (f) => {dispatch(login(f))},
});

export default connect(mapStateToProps, mapDispatchToProps)(UserLogin);
