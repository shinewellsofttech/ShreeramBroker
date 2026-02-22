import React, { useState, useEffect } from "react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { Col, Row, Card, CardBody, CardHeader, Alert } from "reactstrap"
import {
  Fn_AddEditData,
  Fn_DisplayData,
  Fn_FillListData,
} from "../../store/Functions"
import { useDispatch } from "react-redux"
import { API_WEB_URLS, getGlobalOptions } from "../../constants/constAPI"
import { useLocation, useNavigate } from "react-router-dom"

// Validation Schema
const validationSchema = Yup.object().shape({
  Name: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must not exceed 100 characters")
    .required("Name is required"),
  Note1: Yup.string()
    .max(500, "Note must not exceed 500 characters"),
  Note2: Yup.string()
    .max(500, "Note must not exceed 500 characters"),
  Note3: Yup.string()
    .max(500, "Note must not exceed 500 characters"),
  Note4: Yup.string()
    .max(500, "Note must not exceed 500 characters"),
  Note5: Yup.string()
    .max(500, "Note must not exceed 500 characters"),
    Note6: Yup.string()
    .max(500, "Note must not exceed 500 characters"),
  F_UnitMaster: Yup.string()
    .required("Unit selection is required"),
  F_FinancialYearMaster: Yup.string()
    .required("Financial year selection is required"),
  GstNo: Yup.string().max(50),
  PanNo: Yup.string().max(50),
  Mobile: Yup.string().max(20),
  Address: Yup.string().max(300),
  City: Yup.string().max(100),
  State: Yup.string().max(100),
})

function UpdateGlobalOptions() {
  const API_URL_SAVE = "UpdateGlobalOptions/0/token"
  const API_URL = API_WEB_URLS.MASTER + "/0/token/UpdateGlobalOptions"
  const API_URL1 = API_WEB_URLS.MASTER + "/0/token/UnitMaster"
  const API_URL2 = API_WEB_URLS.MASTER + "/0/token/FinancialYearMaster"

  const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/UpdateGlobalOptions/Id"

  const [state, setState] = useState({
    id: 0,
    formData: {
      Note1: "",
      Note2: "",
      Note3: "",
      Note4: "",
      Note5: "",
      Note6: "",
      Name: "",
      F_UnitMaster: "",
      F_FinancialYearMaster: "",
      GstNo: "",
      PanNo: "",
      Mobile: "",
      Address: "",
      City: "",
      State: "",
    },
    UnitArray: [],
    FinancialYearArray: [],
    isLoading: false,
    submitSuccess: false,
  })

  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    Fn_FillListData(dispatch, setState, "UnitArray", API_URL1 + "/Id/0")
    Fn_FillListData(dispatch, setState, "FinancialYearArray", API_URL2 + "/Id/0")
    }, [])

  useEffect(() => {
    const Id = 1

    if (Id > 0) {
      setState(prevState => ({ ...prevState, id: Id }))
      Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT)
    } else {
      navigate("/UpdateGlobalOptions")
    }
  }, [dispatch, location.state, navigate])

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setState(prevState => ({ ...prevState, isLoading: true }))
    
    const obj = JSON.parse(localStorage.getItem("authUser"))
    let formData = new FormData()

    formData.append("Name", values.Name)
    formData.append("Note1", values.Note1)
    formData.append("Note2", values.Note2)
    formData.append("Note3", values.Note3)
    formData.append("Note4", values.Note4)
    formData.append("Note5", values.Note5)
    formData.append("Note6", values.Note6)
    formData.append("F_UnitMaster", values.F_UnitMaster)
    formData.append("F_FinancialYearMaster", values.F_FinancialYearMaster)
    formData.append("GstNo", values.GstNo || "")
    formData.append("PanNo", values.PanNo || "")
    formData.append("Mobile", values.Mobile || "")
    formData.append("Address", values.Address || "")
    formData.append("City", values.City || "")
    formData.append("State", values.State || "")
    formData.append("UserId", obj.uid)

    try {
      await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: state.id, formData } },
        API_URL_SAVE,
        true,
        "memberid",
        navigate,
        "/UpdateGlobalOptions"
      )
      
      setState(prevState => ({ 
        ...prevState, 
        isLoading: false, 
        submitSuccess: true 
      }))

      // Update localStorage GlobalOptions so ContractPrint / reports use latest firm data
      try {
        const current = getGlobalOptions()
        const merged = current && current.length > 0 ? { ...current[0] } : {}
        merged.Name = values.Name
        merged.Note1 = values.Note1
        merged.Note2 = values.Note2
        merged.Note3 = values.Note3
        merged.Note4 = values.Note4
        merged.Note5 = values.Note5
        merged.Note6 = values.Note6
        merged.F_UnitMaster = values.F_UnitMaster
        merged.F_FinancialYearMaster = values.F_FinancialYearMaster
        merged.GstNo = values.GstNo || ""
        merged.PanNo = values.PanNo || ""
        merged.Mobile = values.Mobile || ""
        merged.Address = values.Address || ""
        merged.City = values.City || ""
        merged.State = values.State || ""
        localStorage.setItem("GlobalOptions", JSON.stringify([merged]))
      } catch (e) { console.warn("Update GlobalOptions in localStorage failed", e) }
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setState(prevState => ({ ...prevState, submitSuccess: false }))
      }, 3000)
      
    } catch (error) {
      setState(prevState => ({ ...prevState, isLoading: false }))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="page-content">
      <div className="container-fluid">
        <Row className="justify-content-center">
          <Col lg="10" xl="10">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-primary text-white">
                <div className="d-flex align-items-center">
                  <i className="fas fa-cog me-3 fs-4"></i>
                  <div>
                    <h4 className="mb-0 fw-semibold">Firm Master</h4>
                
                  </div>
                </div>
              </CardHeader>
              
              <CardBody className="p-4">
                {state.submitSuccess && (
                  <Alert color="success" className="mb-4">
                    <i className="fas fa-check-circle me-2"></i>
                    Global options updated successfully!
                  </Alert>
                )}

                <Formik
                  initialValues={{
                    Name: state.formData.Name || "",
                    Note1: state.formData.Note1 || "",
                    Note2: state.formData.Note2 || "",
                    Note3: state.formData.Note3 || "",
                    Note4: state.formData.Note4 || "",
                    Note5: state.formData.Note5 || "",
                    Note6: state.formData.Note6 || "",
                    F_UnitMaster: state.formData.F_UnitMaster || "",
                    F_FinancialYearMaster: state.formData.F_FinancialYearMaster || "",
                    GstNo: state.formData.GstNo || "",
                    PanNo: state.formData.PanNo || "",
                    Mobile: state.formData.Mobile || "",
                    Address: state.formData.Address || "",
                    City: state.formData.City || "",
                    State: state.formData.State || "",
                  }}
                  enableReinitialize={true}
                  validationSchema={validationSchema}
                  onSubmit={handleSubmit}
                >
                  {({ isSubmitting, errors, touched }) => (
                    <Form>
                      {/* Name Field */}
                   <Row>
                    <Col md="6">
                    <div className="mb-4">
                        <label htmlFor="Name" className="form-label fw-semibold text-dark">
                          <i className="fas fa-tag me-2 text-primary"></i>
                        Company Name
                        </label>
                        <Field
                          className={`form-control form-control-lg ${
                            errors.Name && touched.Name ? 'is-invalid' : ''
                          }`}
                          type="text"
                          name="Name"
                          placeholder="Enter configuration name"
                        />
                        <ErrorMessage name="Name" component="div" className="invalid-feedback" />
                      </div>
                    </Col>
                    <Col md="3">
                     
                            <label htmlFor="F_FinancialYearMaster" className="form-label fw-semibold text-dark">
                              <i className="fas fa-calendar-alt me-2 text-primary"></i>
                               Financial Year
                            </label>
                            <Field as="select" 
                              className={`form-select ${
                                errors.F_FinancialYearMaster && touched.F_FinancialYearMaster ? 'is-invalid' : ''
                              }`} 
                              name="F_FinancialYearMaster"
                            >
                              <option value="">Select a financial year</option>
                              {state.FinancialYearArray.map(type => (
                                <option key={type.Id} value={type.Id}>
                                  {type.Name}
                                </option>
                              ))}
                            </Field>
                            <ErrorMessage name="F_FinancialYearMaster" component="div" className="invalid-feedback" />
                          </Col>

                          <Col md="3">
                            <label htmlFor="F_UnitMaster" className="form-label fw-semibold text-dark">
                              <i className="fas fa-ruler me-2 text-primary"></i>
                              Unit
                            </label>
                            <Field as="select" 
                              className={`form-select ${
                                errors.F_UnitMaster && touched.F_UnitMaster ? 'is-invalid' : ''
                              }`} 
                              name="F_UnitMaster"
                            >
                              <option value="">Select a unit</option>
                              {state.UnitArray.map(type => (
                                <option key={type.Id} value={type.Id}>
                                  {type.Name}
                                </option>
                              ))}
                            </Field>
                            <ErrorMessage name="F_UnitMaster" component="div" className="invalid-feedback" />
                          </Col>
                   </Row>

                      {/* Address, City, State */}
                      <Row>
                        <Col md="6">
                          <div className="mb-3">
                            <label htmlFor="Address" className="form-label fw-semibold text-dark">
                              <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                              Address
                            </label>
                            <Field
                              className="form-control"
                              type="text"
                              name="Address"
                              placeholder="Enter address"
                            />
                            <ErrorMessage name="Address" component="div" className="invalid-feedback" />
                          </div>
                        </Col>
                        <Col md="3">
                          <div className="mb-3">
                            <label htmlFor="City" className="form-label fw-semibold text-dark">City</label>
                            <Field className="form-control" type="text" name="City" placeholder="City" />
                            <ErrorMessage name="City" component="div" className="invalid-feedback" />
                          </div>
                        </Col>
                        <Col md="3">
                          <div className="mb-3">
                            <label htmlFor="State" className="form-label fw-semibold text-dark">State</label>
                            <Field className="form-control" type="text" name="State" placeholder="State" />
                            <ErrorMessage name="State" component="div" className="invalid-feedback" />
                          </div>
                        </Col>
                      </Row>

                      {/* GstNo, PanNo, Mobile */}
                      <Row>
                        <Col md="4">
                          <div className="mb-3">
                            <label htmlFor="GstNo" className="form-label fw-semibold text-dark">GST No</label>
                            <Field className="form-control" type="text" name="GstNo" placeholder="GSTIN" />
                            <ErrorMessage name="GstNo" component="div" className="invalid-feedback" />
                          </div>
                        </Col>
                        <Col md="4">
                          <div className="mb-3">
                            <label htmlFor="PanNo" className="form-label fw-semibold text-dark">PAN No</label>
                            <Field className="form-control" type="text" name="PanNo" placeholder="PAN" />
                            <ErrorMessage name="PanNo" component="div" className="invalid-feedback" />
                          </div>
                        </Col>
                        <Col md="4">
                          <div className="mb-3">
                            <label htmlFor="Mobile" className="form-label fw-semibold text-dark">Mobile</label>
                            <Field className="form-control" type="text" name="Mobile" placeholder="Mobile" />
                            <ErrorMessage name="Mobile" component="div" className="invalid-feedback" />
                          </div>
                        </Col>
                      </Row>

                      {/* Notes Section */}
                      <div className="mb-4">
                        <h6 className="text-muted mb-3">
                          <i className="fas fa-sticky-note me-2"></i>
                          Additional Notes
                        </h6>
                        
                        {/* Note1 and Note2 in single row */}
                        <Row className="mb-3">
                          <Col md="6">
                            <label htmlFor="Note1" className="form-label fw-medium">
                              Note 1
                            </label>
                            <Field
                              className={`form-control ${
                                errors.Note1 && touched.Note1 ? 'is-invalid' : ''
                              }`}
                              type="text"
                              name="Note1"
                              placeholder="Enter note 1 (optional)"
                            />
                            <ErrorMessage name="Note1" component="div" className="invalid-feedback" />
                          </Col>
                          <Col md="6">
                            <label htmlFor="Note2" className="form-label fw-medium">
                              Note 2
                            </label>
                            <Field
                              className={`form-control ${
                                errors.Note2 && touched.Note2 ? 'is-invalid' : ''
                              }`}
                              type="text"
                              name="Note2"
                              placeholder="Enter note 2 (optional)"
                            />
                            <ErrorMessage name="Note2" component="div" className="invalid-feedback" />
                          </Col>
                        </Row>

                        {/* Note3 and Note4 in single row */}
                        <Row className="mb-3">
                          <Col md="6">
                            <label htmlFor="Note3" className="form-label fw-medium">
                              Note 3
                            </label>
                            <Field
                              className={`form-control ${
                                errors.Note3 && touched.Note3 ? 'is-invalid' : ''
                              }`}
                              type="text"
                              name="Note3"
                              placeholder="Enter note 3 (optional)"
                            />
                            <ErrorMessage name="Note3" component="div" className="invalid-feedback" />
                          </Col>
                          <Col md="6">
                            <label htmlFor="Note4" className="form-label fw-medium">
                              Note 4
                            </label>
                            <Field
                              className={`form-control ${
                                errors.Note4 && touched.Note4 ? 'is-invalid' : ''
                              }`}
                              type="text"
                              name="Note4"
                              placeholder="Enter note 4 (optional)"
                            />
                            <ErrorMessage name="Note4" component="div" className="invalid-feedback" />
                          </Col>
                        </Row>

                        {/* Note5 and Unit Master in single row */}
                        <Row className="mb-4">
                          <Col md="6">
                            <label htmlFor="Note5" className="form-label fw-medium">
                              Note 5
                            </label>
                            <Field
                              className={`form-control ${
                                errors.Note5 && touched.Note5 ? 'is-invalid' : ''
                              }`}
                              type="text"
                              name="Note5"
                              placeholder="Enter note 5 (optional)"
                            />
                            <ErrorMessage name="Note5" component="div" className="invalid-feedback" />
                          </Col>
                          <Col md="6">
                            <label htmlFor="Note6" className="form-label fw-medium">
                              Note 6
                            </label>
                            <Field
                              className={`form-control ${
                                errors.Note6 && touched.Note6 ? 'is-invalid' : ''
                              }`}
                              type="text"
                              name="Note6"
                              placeholder="Enter note 6 (optional)"
                            />
                            <ErrorMessage name="Note6" component="div" className="invalid-feedback" />
                          </Col>
                        
                        </Row>

                        
                      </div>

                      {/* Action Buttons */}
                      <div className="d-flex gap-3 pt-3">
                        <button 
                          type="submit" 
                          className="btn btn-primary btn-lg px-4 flex-fill"
                          disabled={isSubmitting || state.isLoading}
                        >
                          {isSubmitting || state.isLoading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Updating...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-save me-2"></i>
                              Update Configuration
                            </>
                          )}
                        </button>
                        
                        <button 
                          type="button" 
                          className="btn btn-outline-secondary btn-lg px-4"
                          onClick={() => navigate("/dashboard")}
                        >
                          <i className="fas fa-arrow-left me-2"></i>
                          Cancel
                        </button>
                      </div>
                    </Form>
                  )}
                </Formik>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  )
}

export default UpdateGlobalOptions
