import React, { useState, useEffect } from "react";
import { Formik, Form, Field } from "formik";
import { Col, Row, Container, Button, Card, CardHeader, CardBody } from "reactstrap";
import { useDispatch } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Fn_AddEditData,
  Fn_DisplayData,
  Fn_FillListData,
} from "../../store/Functions";
import { API_WEB_URLS } from "../../constants/constAPI";
import Breadcrumbs from "../../components/Common/Breadcrumb";

function AddEdit_LedgerMaster() {
  const API_URL_SAVE = `${API_WEB_URLS.LedgerMaster}/0/token`;
  const API_URL = `${API_WEB_URLS.MASTER}/0/token/LedgerMaster`;
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/LedgerMasterEdit/Id`;
  const API_URL1 = API_WEB_URLS.MASTER + "/0/token/CityMasterById";
  const API_URL2 = API_WEB_URLS.MASTER + "/0/token/StateMaster";

  const [state, setState] = useState({
    id: 0,
    FillArrayL: [
      { Id: 4, Name: "Bank A/C" },
      { Id: 8, Name: "Cash A/C" },
 
    ],
    CityArray: [],
    StateArray: [],
    FillArray: [],
    formData: {
      F_LedgerGroupMaster: 8,
      Name: "",
      Address: "",
      AccNo: "",
      IFSC: "",
      IsActive: true,
    },
    isProgress: true,
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();


  useEffect(() => {
    Fn_FillListData(dispatch, setState, "CityArray", API_URL1 + "/Id/0");
    Fn_FillListData(dispatch, setState, "StateArray", API_URL2 + "/Id/0");
    Fn_FillListData(dispatch, setState, "FillArray", API_URL + "/Id/0");
  }, []);

  // Fetch data when editing
  useEffect(() => {
    const fetchData = async () => {
      const Id = location.state?.Id || 0;
      setState((prevState) => ({
        ...prevState,
        id: Id,
      }));
      if (Id > 0) {
        try {
          console.log("Fetching data for Id:", Id);
          const data = await Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT);
          console.log("Fetched Data:", data);

          // Update state with fetched data
       
        } catch (error) {
          console.error("Error fetching data:", error);
        }
      }
    };

    fetchData();
  }, [dispatch, location.state]);



  // const handleSubmit = (values) => {
  //   const obj = JSON.parse(localStorage.getItem("authUser"));
  //   const formData = new FormData();

  //   Object.keys(values).forEach((key) => {
  //     // Ensure empty values are sent as empty strings instead of null/undefined
  //     const value = values[key] || "";
  //     formData.append(key, value);
  //   });
  //   formData.append("UserId", obj.uid);
  //   formData.append("F_LedgerGroupMaster", 40);

  //   Fn_AddEditData(
  //     dispatch,
  //     setState,
  //     { arguList: { id: state.id, formData } },
  //     API_URL_SAVE,
  //     true,
  //     "memberid",
  //     navigate,
  //     "/LedgerMaster"
  //   );
  // };


  const handleSubmit = (values) => {
    const obj = JSON.parse(localStorage.getItem("authUser"));
    const formData = new FormData();

    formData.append("Name", values.Name || "");
    formData.append("Address", values.Address || "");
    formData.append("AccNo", values.AccNo || "");
    formData.append("IFSC", values.IFSC || "");
    formData.append("IsActive", values.IsActive ? "true" : "false");
    formData.append("UserId", obj.uid);
    formData.append("F_LedgerGroupMaster", values.F_LedgerGroupMaster);

    return Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "/LedgerMaster"
    );
  };









  const breadCrumbTitle = state.id > 0 ? "Edit Ledger" : "Add New Ledger";
  const breadcrumbItem = "Ledger Master";

  return (
    <div >
      <Container fluid>
        <Breadcrumbs title={breadCrumbTitle} breadcrumbItem={breadcrumbItem} />
        
        <Row className="justify-content-center">
          <Col lg="10" xl="8">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-primary text-white text-center py-3">
                <h4 className="mb-0">
                  <i className="fas fa-address-book me-2"></i>
                  {state.id > 0 ? "Edit Ledger Details" : "Add New Ledger"}
                </h4>
              </CardHeader>
              
              <CardBody className="p-4">
                <Formik
                  initialValues={state.formData}
                  enableReinitialize={true}
                  onSubmit={handleSubmit}
                >
                  {({ values, isSubmitting, setFieldValue }) => {
                    const isBankAccount = values.F_LedgerGroupMaster == 4;

                    const handleAccountTypeChange = (event) => {
                      const selectedType = event.target.value;
                      setFieldValue("F_LedgerGroupMaster", selectedType);

                      if (selectedType === "Cash A/C") {
                        setFieldValue("Address", "");
                        setFieldValue("AccNo", "");
                        setFieldValue("IFSC", "");
                      }
                    };
                    return (
                      <Form>
                      <Row>
                        <Col lg="6" className="mb-3">
                          <div className="form-group">
                            <label className="form-label fw-semibold text-dark">
                              <i className="fas fa-list me-1 text-primary"></i>
                              Account Type
                            </label>
                            <Field
                              as="select"
                              className="form-select form-select-lg"
                              name="F_LedgerGroupMaster"
                              value={values.F_LedgerGroupMaster}
                              onChange={handleAccountTypeChange}
                            >
                              {state.FillArrayL.map((item) => (
                                <option key={item.Id} value={item.Id}>
                                  {item.Name}
                                </option>
                              ))}
                            </Field>
                          </div>
                        </Col>
                      </Row>

                      {/* Basic Information */}
                      <Row>
                        <Col lg="6" className="mb-3">
                          <div className="form-group">
                            <label className="form-label fw-semibold text-dark">
                              <i className="fas fa-user me-1 text-primary"></i>
                              Ledger Name
                            </label>
                            <Field
                              className="form-control form-control-lg"
                              type="text"
                              name="Name"
                              placeholder="Enter ledger name"
                            />
                          </div>
                        </Col>

                      </Row>

                      {isBankAccount && (
                        <>
                          <Row>
                            <Col lg="12" className="mb-3">
                              <div className="form-group">
                                <label className="form-label fw-semibold text-dark">
                                  <i className="fas fa-map-marker-alt me-1 text-primary"></i>
                                  Address
                                </label>
                                <Field
                                  as="textarea"
                                  className="form-control"
                                  name="Address"
                                  placeholder="Enter complete address"
                                  rows="3"
                                />
                              </div>
                            </Col>
                          </Row>

                          <Row>
                            <Col lg="6" className="mb-3">
                              <div className="form-group">
                                <label className="form-label fw-semibold text-dark">
                                  <i className="fas fa-bank me-1 text-primary"></i>
                                  A/C No
                                </label>
                                <Field
                                  className="form-control"
                                  type="text"
                                  name="AccNo"
                                  placeholder="Enter account number"
                                />
                              </div>
                            </Col>

                            <Col lg="6" className="mb-3">
                              <div className="form-group">
                                <label className="form-label fw-semibold text-dark">
                                  <i className="fas fa-university me-1 text-primary"></i>
                                  IFSC Code
                                </label>
                                <Field
                                  className="form-control"
                                  type="text"
                                  name="IFSC"
                                  placeholder="Enter IFSC Code"
                                />
                              </div>
                            </Col>
                          </Row>
                        </>
                      )}

                      {/* Status Toggle */}
                      <Row>
                        <Col lg="12" className="mb-3">
                          <div className="form-group">
                            <label className="form-label fw-semibold text-dark">
                              <i className="fas fa-toggle-on me-1 text-primary"></i>
                              Status
                            </label>
                            <div className="d-flex align-items-center">
                              <Field name="IsActive">
                                {({ field }) => (
                                  <div className="form-check form-switch">
                                    <input
                                      {...field}
                                      className="form-check-input"
                                      type="checkbox"
                                      id="IsActive"
                                      checked={field.value}
                                    />
                                    <label className="form-check-label" htmlFor="IsActive">
                                      {field.value ? (
                                        <span className="text-success">
                                          <i className="fas fa-check-circle me-1"></i>
                                          Active
                                        </span>
                                      ) : (
                                        <span className="text-danger">
                                          <i className="fas fa-times-circle me-1"></i>
                                          Inactive
                                        </span>
                                      )}
                                    </label>
                                  </div>
                                )}
                              </Field>
                            </div>
                          </div>
                        </Col>
                      </Row>

                      {/* Action Buttons */}
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
                                  {state.id > 0 ? "Update Ledger" : "Save Ledger"}
                                </>
                              )}
                            </Button>

                            <Button
                              type="button"
                              color="secondary"
                              outline
                              className="px-4"
                              onClick={() => navigate("/LedgerMaster")}
                            >
                              <i className="fas fa-times me-1"></i>
                              Cancel
                            </Button>
                          </div>
                        </Col>
                      </Row>
                      </Form>
                    );
                  }}
                </Formik>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default AddEdit_LedgerMaster;
