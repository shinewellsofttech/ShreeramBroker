import PropTypes from "prop-types";
import React from "react";

import { Row, Col, CardBody, Card, Alert, Container, Form, Input, FormFeedback, Label, Button } from "reactstrap";

//redux
import { useSelector, useDispatch } from "react-redux";
import { createSelector } from "reselect";
import { Link } from "react-router-dom";
import withRouter from "components/Common/withRouter";

// Formik validation
import * as Yup from "yup";
import { useFormik } from "formik";

// actions
import { loginUser, socialLogin } from "../../store/actions";

// import images
import profile from "assets/images/profile-img.png";
import logo from "assets/images/logo.svg";
import shreeRam from "assets/images/contract/ShreeRam.jpeg";

const Login = props => {

  document.title = "Login | Welcome";

  const dispatch = useDispatch();

  const validation = useFormik({
    // enableReinitialize : use this  flag when initial values needs to be changed
    enableReinitialize: true,

    initialValues: {
      email: "" || '',
      password: "" || '',
    },
    validationSchema: Yup.object({
      email: Yup.string().required("Please Enter Your Email"),
      password: Yup.string().required("Please Enter Your Password"),
    }),
    onSubmit: (values) => {
      dispatch(loginUser(values, props.router.navigate));
    }
  });


  const LoginProperties = createSelector(
    (state) => state.Login,
    (login) => ({
      error: login.error
    })
  );

  const {
    error
  } = useSelector(LoginProperties);

  const signIn = type => {
    dispatch(socialLogin(type, props.router.navigate));
  };

  

  return (
    <React.Fragment>
      <div className="account-pages my-5 pt-sm-5" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Container fluid>
          <Row className="justify-content-center align-items-center">
            {/* Left Side - Company Design with Blue Background */}
            <Col lg={7} xl={8} className="d-none d-lg-block">
              <div className="text-center text-white p-5">
                <div className="mb-5">
                  <div className="bg-white bg-opacity-20 rounded-circle d-inline-flex align-items-center justify-content-center mb-4" 
                       style={{ width: '150px', height: '150px', overflow: 'hidden' }}>
                    <img 
                      src={shreeRam} 
                      alt="Shree Ram" 
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '50%'
                      }} 
                    />
                  </div>
                  <h1 className="display-4 fw-bold mb-3 text-white">
                    Welcome
                  </h1>
                  <div className="bg-white" style={{ height: '4px', width: '100px', margin: '0 auto 30px auto' }}></div>
                  <p className="lead mb-4 text-white-50" style={{ fontSize: '20px' }}>
                    Your Trusted Partner in Agricultural Trading
                  </p>
                   
                </div>
                
                {/* Additional Design Elements */}
                 
              </div>
            </Col>

            {/* Right Side - Login Form */}
            <Col lg={4} xl={4} className="mb-4 mb-lg-0">
              <Card className="border-0 shadow-lg" style={{ 
                borderRadius: '20px',
                backgroundColor: 'rgba(255, 255, 255, 0.98)'
              }}>
                <CardBody className="p-5">
                  {/* Header Section */}
                  <div className="text-center mb-4">
                    <div className="mb-3">
                       
                    </div>
                    <h3 className="text-dark fw-bold mb-2">
                      Welcome Back!
                    </h3>
                    <p className="text-muted mb-0">
                      Sign in to your account to continue
                    </p>
                  </div>

                  {/* Form Section */}
                  <Form
                    className="form-horizontal"
                    onSubmit={(e) => {
                      e.preventDefault();
                      validation.handleSubmit();
                      return false;
                    }}
                  >
                    {error ? (
                      <Alert color="danger" className="border-0 shadow-sm mb-4" style={{ borderRadius: '12px' }}>
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {error}
                      </Alert>
                    ) : null}

                    {/* Email Field */}
                    <div className="mb-4">
                      <Label className="form-label fw-semibold text-dark mb-2">
                        <i className="fas fa-envelope me-2 text-primary"></i>
                        User Name
                      </Label>
                      <div className="position-relative">
                        <Input
                          name="email"
                          className="form-control form-control-lg border-2"
                          placeholder="Enter your User Name"
                          type="text"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          value={validation.values.email || ""}
                          invalid={
                            validation.touched.email && validation.errors.email ? true : false
                          }
                          style={{
                            borderRadius: '12px',
                            borderColor: '#e9ecef',
                            padding: '15px 20px 15px 50px',
                            transition: 'all 0.3s ease',
                            fontSize: '16px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        />
                        <i 
                          className="fas fa-envelope position-absolute"
                          style={{
                            left: '18px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#667eea',
                            zIndex: 10,
                            fontSize: '18px'
                          }}
                        ></i>
                      </div>
                      {validation.touched.email && validation.errors.email ? (
                        <FormFeedback type="invalid" className="d-flex align-items-center mt-2">
                          <i className="fas fa-exclamation-circle me-1"></i>
                          {validation.errors.email}
                        </FormFeedback>
                      ) : null}
                    </div>

                    {/* Password Field */}
                    <div className="mb-4">
                      <Label className="form-label fw-semibold text-dark mb-2">
                        <i className="fas fa-lock me-2 text-primary"></i>
                        Password
                      </Label>
                      <div className="position-relative">
                        <Input
                          name="password"
                          value={validation.values.password || ""}
                          type="password"
                          placeholder="Enter your password"
                          onChange={validation.handleChange}
                          onBlur={validation.handleBlur}
                          invalid={
                            validation.touched.password && validation.errors.password ? true : false
                          }
                          className="form-control form-control-lg border-2"
                          style={{
                            borderRadius: '12px',
                            borderColor: '#e9ecef',
                            padding: '15px 20px 15px 50px',
                            transition: 'all 0.3s ease',
                            fontSize: '16px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}
                        />
                        <i 
                          className="fas fa-lock position-absolute"
                          style={{
                            left: '18px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#667eea',
                            zIndex: 10,
                            fontSize: '18px'
                          }}
                        ></i>
                      </div>
                      {validation.touched.password && validation.errors.password ? (
                        <FormFeedback type="invalid" className="d-flex align-items-center mt-2">
                          <i className="fas fa-exclamation-circle me-1"></i>
                          {validation.errors.password}
                        </FormFeedback>
                      ) : null}
                    </div>

                    {/* Remember Me */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="customControlInline"
                          style={{ borderRadius: '4px' }}
                        />
                        <label
                          className="form-check-label text-muted fw-medium"
                          htmlFor="customControlInline"
                        >
                          Remember me
                        </label>
                      </div>
                    </div>

                    {/* Login Button */}
                    <div className="d-grid mb-4">
                      <Button
                        className="btn btn-primary btn-lg fw-semibold"
                        type="submit"
                        style={{
                          borderRadius: '12px',
                          padding: '15px',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          border: 'none',
                          boxShadow: '0 6px 20px rgba(102, 126, 234, 0.3)',
                          transition: 'all 0.3s ease',
                          fontSize: '16px'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.transform = 'translateY(-2px)';
                          e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.transform = 'translateY(0)';
                          e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)';
                        }}
                      >
                        <i className="fas fa-sign-in-alt me-2"></i>
                        Sign In
                      </Button>
                    </div>
                  </Form>
                </CardBody>
              </Card>
            </Col>
          </Row>

          {/* Footer */}
          <div className="mt-5 text-center">
            <p className="text-white-50 mb-0">
              © {new Date().getFullYear()} Welcome. All rights reserved.
            </p>
          </div>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default withRouter(Login);

Login.propTypes = {
  history: PropTypes.object,
};
