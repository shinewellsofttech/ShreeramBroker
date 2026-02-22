 



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

function AddEdit_UnitMaster() {
  const API_URL_SAVE = `${API_WEB_URLS.UnitMaster}/0/token`;
  const API_URL = `${API_WEB_URLS.MASTER}/0/token/UnitMaster`;
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/UnitMasterById/Id`;

  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {
      Code: "",
      Name: "",
    },
    isProgress: true,
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Validation Schema
  const validationSchema = Yup.object({
    Code: Yup.string().required("Code is required"),
    Name: Yup.string().required("Name is required"),
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
      "/UnitMaster"
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
                  {state.id > 0 ? "Edit Unit Details" : "Add New Unit"}
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
                              <i className="fas fa-code me-1 text-primary"></i>
                              Code <span className="text-danger">*</span>
                            </label>
                            <Field
                              className={`form-control form-control-lg ${
                                touched.Code && errors.Code ? "is-invalid" : ""
                              }`}
                              type="text"
                              name="Code"
                              placeholder="Enter Code"
                            />
                            <ErrorMessage
                              name="Code"
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
                              <i className="fas fa-box me-1 text-primary"></i>
                                Name <span className="text-danger">*</span>
                            </label>
                            <Field
                              className={`form-control ${
                                touched.Name && errors.Name ? "is-invalid" : ""
                              }`}
                              type="text"
                              name="Name"
                              placeholder="Enter Name"
                            />
                            <ErrorMessage
                              name="Name"
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
                                  {state.id > 0 ? "Update Unit" : "Save Unit"}
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              color="secondary"
                              outline
                              className="px-4"
                              onClick={() => navigate("/UnitMaster")}
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

export default AddEdit_UnitMaster;
