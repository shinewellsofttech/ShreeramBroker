import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import * as Yup from "yup";
import { Col, Row, Container, Button, Card, CardHeader, CardBody } from "reactstrap";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Fn_AddEditData,
  Fn_DisplayData,
} from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import Breadcrumbs from "../../components/Common/Breadcrumb";

function AddEdit_ContractType() {
  const API_URL_SAVE = `${API_WEB_URLS.ContractType}/0/token`;
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/ContractTypeEdit/Id`;

  const [state, setState] = useState({
    id: 0,
    formData: {
      Name: "",
      IsVessel: false,
      IsShipmentMonth: false,
      IsShipmentPeriod: false,
      IsLiftingPeriod: false,
    },
    isProgress: true,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const validationSchema = Yup.object({
    Name: Yup.string()
      .required("Name is required")
      .min(2, "Name must be at least 2 characters")
      .max(100, "Name must not exceed 100 characters"),
  });

  // Fetch data when editing
  useEffect(() => {
    const fetchData = async () => {
      const Id = location.state?.Id || 0;
      setState(prev => ({ ...prev, id: Id }));
      if (Id > 0) {
        try {
          await Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT);
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };
    fetchData();
  }, [dispatch, location.state]);

  const handleSubmit = (values, { setSubmitting }) => {
    const obj = JSON.parse(localStorage.getItem("authUser"));
    const formData = new FormData();

    formData.append("Name", values.Name || "");
    formData.append("IsVessel", values.IsVessel ? "true" : "false");
    formData.append("IsShipmentMonth", values.IsShipmentMonth ? "true" : "false");
    formData.append("IsShipmentPeriod", values.IsShipmentPeriod ? "true" : "false");
    formData.append("IsLiftingPeriod", values.IsLiftingPeriod ? "true" : "false");
    formData.append("UserId", obj.uid);

    Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/ContractTypeMaster"
    ).finally(() => setSubmitting(false));
  };

  const breadCrumbTitle = state.id > 0 ? "Edit Contract Type" : "Add Contract Type";
  const breadcrumbItem = "Contract Type Master";

  return (
    <div className="page-content">
      <Container fluid>
        <Breadcrumbs title={breadCrumbTitle} breadcrumbItem={breadcrumbItem} />

        <Row className="justify-content-center">
          <Col lg="8" xl="6">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-primary text-white text-center py-3">
                <h4 className="mb-0">
                  <i className="fas fa-file-contract me-2"></i>
                  {state.id > 0 ? "Edit Contract Type" : "Add Contract Type"}
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
                      {/* Name */}
                      <Row>
                        <Col lg="12" className="mb-3">
                          <div className="form-group">
                            <label className="form-label fw-semibold text-dark">
                              <i className="fas fa-tag me-1 text-primary"></i>
                              Contract Type Name <span className="text-danger">*</span>
                            </label>
                            <Field
                              className={`form-control form-control-lg ${errors.Name && touched.Name ? "is-invalid" : ""}`}
                              type="text"
                              name="Name"
                              placeholder="Enter contract type name"
                            />
                            {errors.Name && touched.Name && (
                              <div className="invalid-feedback">{errors.Name}</div>
                            )}
                          </div>
                        </Col>
                      </Row>

                      {/* Flags */}
                      <Row>
                        <Col lg="12" className="mb-3">
                          <label className="form-label fw-semibold text-dark">
                            <i className="fas fa-toggle-on me-1 text-primary"></i>
                            Options
                          </label>
                          <div className="d-flex flex-wrap gap-4 mt-1">
                            {[
                              { name: "IsVessel", label: "Vessel" },
                              { name: "IsShipmentMonth", label: "Shipment Month" },
                              { name: "IsShipmentPeriod", label: "Shipment Period" },
                              { name: "IsLiftingPeriod", label: "Lifting Period" },
                            ].map(({ name, label }) => (
                              <div key={name} className="form-check form-switch">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  id={name}
                                  name={name}
                                  checked={!!values[name]}
                                  onChange={() => {}}
                                  onClick={() => setFieldValue(name, !values[name])}
                                  style={{ cursor: "pointer", width: "2.5em", height: "1.25em" }}
                                />
                                <label className="form-check-label fw-semibold ms-2" htmlFor={name}>
                                  {label}
                                </label>
                              </div>
                            ))}
                          </div>
                        </Col>
                      </Row>

                      {/* Buttons */}
                      <Row className="mt-4">
                        <Col className="d-flex justify-content-end gap-2">
                          <Button
                            type="button"
                            color="secondary"
                            onClick={() => navigate("/ContractTypeMaster")}
                            disabled={isSubmitting}
                          >
                            <i className="fas fa-times me-1"></i>
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            color="primary"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
                                Saving...
                              </>
                            ) : (
                              <>
                                <i className="fas fa-save me-1"></i>
                                {state.id > 0 ? "Update" : "Save"}
                              </>
                            )}
                          </Button>
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

export default AddEdit_ContractType;
