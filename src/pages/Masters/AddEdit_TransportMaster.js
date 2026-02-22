
import React, { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { Col, Row, Container, Button, Card, CardHeader, CardBody } from "reactstrap";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Fn_AddEditData,
  Fn_DisplayData,
  Fn_FillListData,
} from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";

function AddEdit_TransportMaster() {
  const API_URL_SAVE = `${API_WEB_URLS.TransportMaster}/0/token`;
  const API_URL = `${API_WEB_URLS.MASTER}/0/token/TransportMaster`;
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/TransportMasterById/Id`;

  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {
      Tank: "",
      Transport: "",
    },
    isProgress: true,
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Validation Schema
  const validationSchema = Yup.object({
    Tank: Yup.string().required("Tank is required"),
    Transport: Yup.string().required("Transport is required"),
  });

  useEffect(() => {
    Fn_FillListData(dispatch, setState, "FillArray", API_URL + "/Id/0");
  }, []);

  // Fetch data when editing
  useEffect(() => {
    const fetchData = async () => {
      const Id = location.state?.Id || 0;

      if (Id > 0) {
        try {
          console.log("Fetching data for Id:", Id);
          const data = await Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT);
          console.log("Fetched Data:", data);

          // Update state with fetched data
          // setState((prevState) => ({
          //   ...prevState,
          //   id: Id,
          //   formData: { ...data },
          // }));
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [dispatch, location.state]);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSubmit = (values) => {
    const obj = JSON.parse(localStorage.getItem("authUser"));
    const formData = new FormData();

    Object.keys(values).forEach((key) => formData.append(key, values[key]));
    formData.append("UserId", obj.uid);

    return Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/TransportMaster"
    );
  };

  return (
    <div style={{ marginTop: !isMobile ? '3rem' : '0' }}>
      <Container fluid>
        <Row className="justify-content-center">
          <Col lg="8" xl="6">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-primary text-white text-center py-3">
                <h4 className="mb-0">
                  <i className="fas fa-box me-2"></i>
                  {state.id > 0 ? "Edit Transport Details" : "Add New Transport"}
                </h4>
              </CardHeader>
              
              <CardBody className="p-4">
                <Formik
                  initialValues={state.formData}
                  enableReinitialize={true}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ values, errors, touched, isSubmitting, setFieldValue }) => (
                    <Form>
                      <Row>
                        <Col lg="12" className="mb-3">
                          <div className="form-group">
                            <label className="form-label fw-semibold text-dark">
                              <i className="fas fa-truck me-1 text-primary"></i>
                              Tank <span className="text-danger">*</span>
                            </label>
                            <Field
                              className={`form-control form-control-lg ${
                                touched.Tank && errors.Tank ? "is-invalid" : ""
                              }`}
                              type="text"
                              name="Tank"
                              placeholder="Enter Tank"
                            />
                            <ErrorMessage
                              name="Tank"
                              component="div"
                              className="invalid-feedback d-block"
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col lg="12" className="mb-3">
                          <div className="form-group">
                            <label className="form-label fw-semibold text-dark">
                              <i className="fas fa-truck me-1 text-primary"></i>
                              Transport <span className="text-danger">*</span>
                            </label>
                            <Field
                              className={`form-control ${
                                touched.Transport && errors.Transport ? "is-invalid" : ""
                              }`}
                              type="text"
                              name="Transport"
                              placeholder="Enter Transport"
                            />
                            <ErrorMessage
                              name="Transport"
                              component="div"
                              className="invalid-feedback d-block"
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
                              className="px-4"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <i className="fas fa-spinner fa-spin me-1"></i>
                                  {state.id > 0 ? "Updating..." : "Saving..."}
                                </>
                              ) : (
                                <>
                                  <i className={`fas ${state.id > 0 ? 'fa-edit' : 'fa-save'} me-1`}></i>
                                  {state.id > 0 ? "Update Transport" : "Save Transport"}
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              color="secondary"
                              outline
                              className="px-4"
                              onClick={() => navigate("/TransportMaster")}
                            >
                              <i className="fas fa-times me-1"></i>
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
      </Container>
    </div>
  );
}

export default AddEdit_TransportMaster;
