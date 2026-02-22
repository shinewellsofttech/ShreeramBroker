import React, { useState, useEffect } from "react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { Col, Row } from "reactstrap"
import {
  Fn_AddEditData,
  Fn_DisplayData,
  Fn_FillListData,
  showToastWithCloseButton,
} from "../../store/Functions"
import { useDispatch } from "react-redux"
import { API_WEB_URLS } from "../../constants/constAPI"
import { useLocation } from "react-router-dom"
import { ProgressBar } from "react-bootstrap"
import axios from 'axios';

function AddEdit_CourseMasterL() {
  const API_URL = API_WEB_URLS.MASTER + "/0/token/CourseMasterH"
  const API_URL_SAVE = API_WEB_URLS.BASE +"CourseMasterL/0/token"
  const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/CourseMasterL/Id"

  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {},
    OtherDataScore: [],
    isProgress: true,
  })
  const [FileType, setFileType] = useState(null)
  const dispatch = useDispatch()
  const location = useLocation()
  const [uploadProgress, setUploadProgress] = useState(0);
  useEffect(() => {
    Fn_FillListData(dispatch, setState, "FillArray", API_URL + "/Id/0")

    const Id = (location.state && location.state.Id) || 0

    if (Id > 0) {
      setState(prevState => ({
        ...prevState,
        id: Id,
      }))
      Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT)
    }
  }, [dispatch, location.state])

  useEffect(() => {
    console.log(state.FillArray)
  }, [state.FillArray])

  const validationSchema = Yup.object({
    F_CourseMasterH: Yup.string().required("F_CourseMasterH is required"),
    Description: Yup.string().required("Description is required"),
    Title: Yup.string().required("Title is required"),
    fileUpload: Yup.mixed().required("File or video upload is required"),
  })
  const handleFileChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0]
    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.slice(-3)
    console.log(FileType, fileExtension)
    if (FileType == "PDF" && fileExtension == "pdf") {
      setFieldValue("fileUpload", file)
    } else if (
      FileType == "Video" &&
      (fileExtension == "mp4" || fileExtension == "mkv")
    ) {
      setFieldValue("fileUpload", file)
    } else {
      setFieldValue("fileUpload", null)
      alert("File type does not match. Please upload a valid file.")
      event.target.value = null
    }
  }
  const handleSubmit = async (values) => {
    let formData = new FormData();
    formData.append("F_CourseMasterH", values.F_CourseMasterH);
    formData.append("Title", values.Title);
    formData.append("Description", values.Description);

    if (values.fileUpload) {
      formData.append("File.ImageFileName", "FileName")
      formData.append("File.ImageFile", values.fileUpload)
    }
    console.log('yhape')
    try {
      await axios.post(API_URL_SAVE, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
          console.log(`Upload progress: ${percentCompleted}%`);
        },
      });
     showToastWithCloseButton('success',"Data added successfully")
    } catch (error) {
      console.error("Upload failed:", error);
      // Handle error (e.g., show an error message)
    }
  };
 
  useEffect(() => {
    console.log(FileType)
  }, [FileType])

  const handleCourseChange = (event, setFieldValue) => {
    const selectedCourseId = event.target.value
    setFieldValue("F_CourseMasterH", selectedCourseId)
    const obj = state.FillArray.find(data => data.Id == selectedCourseId)
    if (obj.Type != null) {
      let type = obj.UploadType == 1 ? "PDF" : "Video"
      setFileType(type)
    }
  }

  return (
    <div className="page-content">
      <Formik
        initialValues={state.formData}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={values => {
          handleSubmit(values)
        }}
      >
        {({ setFieldValue, values }) => (
          <Form className="form-horizontal">
            <Row>
              <Col lg="6" className="mb-3">
                <label htmlFor="F_CourseMasterH" className="form-label">
                  Course
                </label>
                <Field
                  className="form-control"
                  as="select"
                  name="F_CourseMasterH"
                  onChange={event => handleCourseChange(event, setFieldValue)}
                >
                  <option value="">Select Course</option>
                  {state.FillArray.map(type => (
                    <option key={type.Id} value={type.Id}>
                      {type.Name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage
                  name="F_CourseMasterH"
                  component="div"
                  className="text-danger"
                />
              </Col>
            </Row>

            <Row>
              <Col lg="6" className="mb-3">
                <label htmlFor="Title" className="form-label">
                  Title
                </label>
                <Field className="form-control" type="text" name="Title" />
                <ErrorMessage
                  name="Title"
                  component="div"
                  className="text-danger"
                />
              </Col>
            </Row>

            <Row>
              <Col lg="6" className="mb-3">
                <label htmlFor="Description" className="form-label">
                  Description
                </label>
                <Field
                  className="form-control"
                  type="text"
                  name="Description"
                />
                <ErrorMessage
                  name="Description"
                  component="div"
                  className="text-danger"
                />
              </Col>
            </Row>
            {FileType != null && (
              <Row>
                <Col lg="6" className="mb-3">
                  <label htmlFor="fileUpload" className="form-label">
                    Upload {FileType}
                  </label>
                  <input
                    className="form-control"
                    type="file"
                    name="fileUpload"
                    onChange={event => handleFileChange(event, setFieldValue)}
                  />
                  {typeof state.formData.FileUpload === "string" ? (
                    <span>{state.formData.FileUpload}</span>
                  ) : (
                    <> </>
                  )}
                  <ErrorMessage
                    name="fileUpload"
                    component="div"
                    className="text-danger"
                  />
                </Col>
              </Row>
            )}
            {/* {uploadProgress > 0 && (
              <Row>
                <Col lg="6" className="mb-3">
                  <label className="form-label">Upload Progress</label>
                  <ProgressBar now={uploadProgress} label={`${uploadProgress}%`} />
                </Col>
              </Row>
            )} */}
            <button type="submit" className="btn btn-primary btn-block">
              Submit
            </button>
          </Form>
        )}
      </Formik>
    </div>
  )
}

export default AddEdit_CourseMasterL
