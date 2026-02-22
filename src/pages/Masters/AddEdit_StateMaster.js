import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Col, Row, Card, CardBody, CardHeader, Button } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Fn_AddEditData, Fn_DisplayData } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';

function AddEdit_StateMaster() {
  const API_URL_SAVE = `${API_WEB_URLS.StateMaster}/0/token`;  
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/Masters/0/token/StateMasterId/Id/Id`;  
  
  const [state, setState] = useState({
    id: 0,
    formData: {
      Name: '',
    },
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const Id = (location.state && location.state.Id) || 0;
    
    if (Id > 0) {
      setState(prevState => ({
        ...prevState,
        id: Id
      }));
      Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT);
    }
  }, [location.state, dispatch]);

  const validationSchema = Yup.object({
    Name: Yup.string()
      .required('State name is required')
      .min(2, 'State name must be at least 2 characters')
      .max(50, 'State name cannot exceed 50 characters'),
  });

  const handleSubmit = (values) => {
    const formData = new FormData();
    formData.append("Name", values.Name);
    
    return Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      '#'
    );
  };

  return (
    <div className='page-content'>
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-title-box d-flex align-items-center justify-content-between">
              <h4 className="mb-0 text-primary fw-semibold">
                <i className="fas fa-map me-2"></i>
                {state.id > 0 ? 'Edit State' : 'Add New State'}
              </h4>
              <div className="page-title-right">
                <ol className="breadcrumb m-0">
                  <li className="breadcrumb-item">
                    <a href="#" className="text-muted">Masters</a>
                  </li>
                  <li className="breadcrumb-item active">State Master</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <Row className="justify-content-center">
          <Col lg={8} xl={6}>
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-primary text-white py-3">
                <h5 className="mb-0 fw-semibold">
                  <i className="fas fa-edit me-2"></i>
                  State Information
                </h5>
              </CardHeader>
              <CardBody className="p-4">
                <Formik
                  initialValues={state.formData}
                  enableReinitialize={true}
                  validationSchema={validationSchema}
                  onSubmit={(values) => handleSubmit(values)}
                >
                  {({ isSubmitting, dirty, isValid }) => (
                    <Form>
                      <Row>
                        <Col lg="12" className="mb-4">
                          <div className="form-group">
                            <label htmlFor="Name" className="form-label fw-semibold text-dark">
                              <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                              State Name
                            </label>
                            <Field 
                              className="form-control form-control-lg border-2" 
                              type="text" 
                              name="Name"
                              placeholder="Enter state name"
                              style={{
                                borderColor: '#e9ecef',
                                borderRadius: '8px',
                                padding: '12px 16px',
                                fontSize: '14px',
                                transition: 'all 0.3s ease'
                              }}
                            />
                            <ErrorMessage 
                              name="Name" 
                              component="div" 
                              className="text-danger mt-1 fw-medium"
                              style={{ fontSize: '12px' }}
                            />
                          </div>
                        </Col>
                      </Row>
                      
                      <Row className="mt-4">
                        <Col lg="12">
                          <div className="d-flex gap-2 justify-content-end">
                            
                            <Button
                              type="submit"
                              color="primary"
                              className="px-4 py-2 fw-semibold"
                              disabled={isSubmitting || !dirty || !isValid}
                              style={{
                                borderRadius: '8px',
                                transition: 'all 0.3s ease',
                                boxShadow: '0 2px 4px rgba(0,123,255,0.2)'
                              }}
                            >
                              {isSubmitting ? (
                                <>
                                  <i className="fas fa-spinner fa-spin me-2"></i>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <i className="fas fa-save me-2"></i>
                                  {state.id > 0 ? 'Update State' : 'Save State'}
                                </>
                              )}
                            </Button>


                            <Button
                              type="button"
                              color="light"
                              className="px-4 py-2 fw-semibold"
                              onClick={() => navigate(-1)}
                              style={{
                                borderRadius: '8px',
                                border: '1px solid #dee2e6',
                                transition: 'all 0.3s ease'
                              }}
                            >
                              <i className="fas fa-times me-2"></i>
                              Cancel
                            </Button>
                          </div>
                        </Col>
                      </Row>
                    </Form>
                  )}
                </Formik>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default AddEdit_StateMaster;
