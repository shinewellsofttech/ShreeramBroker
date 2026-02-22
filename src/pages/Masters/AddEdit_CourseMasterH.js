import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Col, Row } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Fn_AddEditData, Fn_DisplayData } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';


function AddEdit_CourseMasterH() {
  const API_URL_SAVE = `${API_WEB_URLS.CourseMasterH}/0/token`;
  const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/CourseMasterH/Id`;
  
  const [state, setState] = useState({
    id: 0,
    formData: {
      Name: '',
      Description: '',
      UploadType: '',
      Tenure: '',
      Price: '',
      Type: '',
      fileUpload: null,
    },
    isProgress: true,
  });

  const dispatch = useDispatch();
  const location = useLocation();

  const UploadType = [
    { Id: 1, Name: 'PDF' },
    { Id: 2, Name: 'Video' },
  ];

  const Type = [
    { Id: 1, Name: 'Beginner' },
    { Id: 2, Name: 'Intermediate' },
    { Id: 3, Name: 'Advanced' },
  ];

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
    Name: Yup.string().required('Name is required'),
    Description: Yup.string().required('Description is required'),
    UploadType: Yup.string().required('Upload Type is required'),
    Tenure: Yup.string().required('Tenure is required'),
    Price: Yup.string().required('Price is required'),
    Type: Yup.string().required('Type is required'),
  });

  const handleFileChange = (event, setFieldValue) => {
    const file = event.currentTarget.files[0];
    setFieldValue("fileUpload", file);
  };

  const handleSubmit = (values) => {
    const formData = new FormData();
    formData.append("Name", values.Name);
    formData.append("Description", values.Description);
    formData.append("UploadType", values.UploadType);
    formData.append("Tenure", values.Tenure);
    formData.append("Price", values.Price);
    formData.append("Type", values.Type);
    if (values.fileUpload) {
      formData.append("ID_ImageURL.ImageFileName", "FileName")
      formData.append("ID_ImageURL.ImageFile", values.fileUpload)
    }
    
    return Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData } },
      API_URL_SAVE,
      true,
      "memberid"
    );
  };

  return (
    <div className='page-content'>
      <Formik
        initialValues={state.formData}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={(values) => handleSubmit(values)}
      >
        {({ setFieldValue }) => (
          <Form className="form-horizontal">
            <Row>
              <Col lg='6' className="mb-3">
                <label htmlFor="Name" className="form-label">Name</label>
                <Field className="form-control" type="text" name="Name" />
                <ErrorMessage name="Name" component="div" className="text-danger" />
              </Col>
            </Row>
            <Row>
              <Col lg='6' className="mb-3">
                <label htmlFor="Description" className="form-label">Description</label>
                <Field className="form-control" type="text" name="Description" />
                <ErrorMessage name="Description" component="div" className="text-danger"/>
              </Col>
            </Row>
            <Row>
              <Col lg='6' className="mb-3">
                <label htmlFor="UploadType" className="form-label">Upload Type</label>
                <Field className="form-control" as="select" name="UploadType">
                  <option value="">Select Upload Type</option>
                  {UploadType.map((type) => (
                    <option key={type.Id} value={type.Id}>{type.Name}</option>
                  ))}
                </Field>
                <ErrorMessage name="UploadType" component="div" className="text-danger"/>
              </Col>
            </Row>
            <Row>
              <Col lg='6' className="mb-3">
                <label htmlFor="Tenure" className="form-label">Tenure</label>
                <Field className="form-control" type="number" name="Tenure" />
                <ErrorMessage name="Tenure" component="div" className="text-danger"/>
              </Col>
            </Row>
            <Row>
              <Col lg='6' className="mb-3">
                <label htmlFor="Price" className="form-label">Price</label>
                <Field className="form-control" type="number" name="Price" />
                <ErrorMessage name="Price" component="div" className="text-danger"/>
              </Col>
            </Row>
            <Row>
              <Col lg='6' className="mb-3">
                <label htmlFor="Type" className="form-label">Type</label>
                <Field className="form-control" as="select" name="Type">
                  <option value="">Select Type</option>
                  {Type.map((type) => (
                    <option key={type.Id} value={type.Id}>{type.Name}</option>
                  ))}
                </Field>  
                <ErrorMessage name="Type" component="div" className="text-danger"/>
              </Col>
            </Row>
            <Row>
              <Col lg="6" className="mb-3">
                <label htmlFor="fileUpload" className="form-label">Course Image</label>
                <input
                  className="form-control"
                  type="file"
                  name="fileUpload"
                  onChange={event => handleFileChange(event, setFieldValue)}
                />
                {typeof state.formData.fileUpload === "string" ? (
                  <span>{state.formData.fileUpload}</span>
                ) : null}
                <ErrorMessage name="fileUpload" component="div" className="text-danger" />
              </Col>
            </Row>
            <button type="submit" className="btn btn-primary btn-block">Submit</button>
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default AddEdit_CourseMasterH;
