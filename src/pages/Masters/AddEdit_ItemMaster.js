

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

function AddEdit_ItemMaster() {
  const API_URL_SAVE = `${API_WEB_URLS.ItemMaster}/0/token`;
  const API_URL = `${API_WEB_URLS.MASTER}/0/token/ItemMaster`;
  const API_URL1 = `${API_WEB_URLS.MASTER}/0/token/UnitMaster`;
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/ItemMasterById/Id`;

  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    FillArray1: [],
    formData: {
      Name: "",
      Code: "",
      Brokerage: "",
      F_UnitMaster: "",
    },
    isProgress: true,
  });

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  // Validation Schema - only Name is mandatory
  const validationSchema = Yup.object({
    Name: Yup.string()
      .required("Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),
    Code: Yup.string()
      .max(20, "Code must not exceed 20 characters"),
    Brokerage: Yup.string()
      .nullable()
      .test('valid-number', 'Please enter a valid number (e.g., 10.50)', (value) => !value || /^\d+(\.\d{1,2})?$/.test(value)),
    F_UnitMaster: Yup.string().nullable(),
  });

  useEffect(() => {
    Fn_FillListData(dispatch, setState, "FillArray", API_URL + "/Id/0");
    Fn_FillListData(dispatch, setState, "FillArray1", API_URL1 + "/Id/0");
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
      "/ItemMaster"
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
                  {state.id > 0 ? "Edit Item Details" : "Add New Item"}
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
                              <i className="fas fa-tag me-1 text-primary"></i>
                              Item Name <span className="text-danger">*</span>
                            </label>
                            <Field
                              className={`form-control form-control-lg ${
                                touched.Name && errors.Name ? "is-invalid" : ""
                              }`}
                              type="text"
                              name="Name"
                              placeholder="Enter item name"
                            />
                            <ErrorMessage
                              name="Name"
                              component="div"
                              className="invalid-feedback d-block"
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col lg="6" className="mb-3">
                          <div className="form-group">
                            <label className="form-label fw-semibold text-dark">
                              <i className="fas fa-barcode me-1 text-primary"></i>
                              Item Code
                            </label>
                            <Field
                              className={`form-control ${
                                touched.Code && errors.Code ? "is-invalid" : ""
                              }`}
                              type="text"
                              name="Code"
                              placeholder="Enter item code"
                            />
                            <ErrorMessage
                              name="Code"
                              component="div"
                              className="invalid-feedback d-block"
                            />
                          </div>
                        </Col>

                        <Col lg="6" className="mb-3">
                          <div className="form-group">
                            <label className="form-label fw-semibold text-dark">
                              <i className="fas fa-percentage me-1 text-primary"></i>
                              Brokerage (mt)
                            </label>
                            <Field
                              className={`form-control ${
                                touched.Brokerage && errors.Brokerage ? "is-invalid" : ""
                              }`}
                              type="text"
                              name="Brokerage"
                              placeholder="Enter brokerage percentage"
                            />
                            <ErrorMessage
                              name="Brokerage"
                              component="div"
                              className="invalid-feedback d-block"
                            />
                          </div>
                        </Col>
                      </Row>

                      <Row>
                        <Col lg="12" className="mb-4">
                          <div className="form-group">
                            <label className="form-label fw-semibold text-dark">
                              <i className="fas fa-ruler me-1 text-primary"></i>
                              Unit
                            </label>
                            <Field
                              as="select"
                              className={`form-select ${
                                touched.F_UnitMaster && errors.F_UnitMaster ? "is-invalid" : ""
                              }`}
                              name="F_UnitMaster"
                            >
                              <option value="">Select a unit</option>
                              {state.FillArray1.map((unit) => (
                                <option key={unit.Id} value={unit.Id}>
                                  {unit.Name}
                                </option>
                              ))}
                            </Field>
                            <ErrorMessage
                              name="F_UnitMaster"
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
                                  {state.id > 0 ? "Update Item" : "Save Item"}
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              color="secondary"
                              outline
                              className="px-4"
                              onClick={() => navigate("/ItemMaster")}
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

export default AddEdit_ItemMaster;
