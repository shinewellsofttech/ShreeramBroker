import React, { useState, useEffect } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { Country, State, City } from 'country-state-city';
import { Col, Row } from 'reactstrap';
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData } from '../../store/Functions';
import { useDispatch } from 'react-redux';
import { API_WEB_URLS } from '../../constants/constAPI';
import { useLocation } from 'react-router-dom';

function AddEdit_UserMaster() {
    const API_URL = API_WEB_URLS.MASTER + "/0/token/UserType"; 
    const API_URL_SAVE = API_WEB_URLS.UserMaster + "/0/token";
    const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/User/Id";
  const [state, setState] = useState({
    id: 0,
    FillArray : [],
    formData: {},
    OtherDataScore: [],
    isProgress: true,
  });
  const dispatch = useDispatch();
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedState, setSelectedState] = useState('');
  const location = useLocation();
  useEffect(() => {
    Fn_FillListData(dispatch, setState, 'FillArray', API_URL + '/Id/0');
    const indianStates = State.getStatesOfCountry('IN');
    setStates(indianStates);
    const Id = (location.state &&  location.state.Id) || 0 ;
  
    if(Id > 0 ){
        Fn_DisplayData(dispatch,setState,Id,API_URL_EDIT)
    }
  }, []);
 
  useEffect(() => {
    
    if (selectedState) {
        const code = states.find(state => state.name === selectedState)?.isoCode;
      const stateCities = City.getCitiesOfState('IN', code);
      setCities(stateCities);
    } else {
      setCities([]);
    }
  }, [selectedState]);

  const validationSchema = Yup.object({
    Name: Yup.string().required('Name is required'),
    Phone: Yup.string().required('Phone is required'),
    Email: Yup.string().email('Invalid email format').required('Email is required'),
    Password: Yup.string().min(4, 'Password must be at least 8 characters').required('Password is required'),
    Address: Yup.string().required('Address is required'),
    State: Yup.string().required('State is required'),
    City: Yup.string().required('City is required'),
  });

  const handleSubmit = (values) => {
    const obj = JSON.parse(localStorage.getItem("authUser"));
    console.log(values);
    let vformData = new FormData();
   
    vformData.append("F_UserType", values.F_UserType);
    vformData.append("Name", values.Name);
    vformData.append("Password", values.Password);
    vformData.append("Phone", values.Phone);
    vformData.append("Email", values.Email);
    vformData.append("Address", values.Email);
    vformData.append("State", values.State);
    vformData.append("City", values.City);
    vformData.append("UserId", obj.uid);
    return Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: 0, formData: vformData } },
        API_URL_SAVE,
        true,
        "memberid"
      );
  };

  return (
    <div className='page-content'>
      <Formik
        initialValues={ state.formData }
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={(values) => handleSubmit(values)}
      >
        {({  setFieldValue }) => (
          <Form className="form-horizontal">
          <Row>
            <Col lg='6' className="mb-3">
              <label htmlFor="F_UserType" className="form-label">UserType</label>
              <Field className="form-control" as="select" name="F_UserType">
                <option value="">Select UserType</option>
                {state.FillArray.map((UserType) => (
                  <option key={UserType.Id} value={UserType.Id}>{UserType.Name}</option>
                ))}
              </Field>
              <ErrorMessage name="F_UserType" component="div" className="text-danger"/>
            </Col>
            </Row>
            <Row>
            <Col lg='6' className="mb-3">
              <label htmlFor="Name" className="form-label">Name</label>
              <Field className="form-control" type="text" name="Name" />
              <ErrorMessage name="Name" component="div" className="text-danger" />
            </Col>
            </Row>
            <Row>
            <Col lg='6' className="mb-3">
              <label htmlFor="Phone" className="form-label">Phone</label>
              <Field className="form-control" type="number" name="Phone" />
              <ErrorMessage name="Phone" component="div" className="text-danger" />
            </Col>
            </Row>
          
            <Row>
            <Col lg='6' className="mb-3">
              <label htmlFor="Email" className="form-label">Email</label>
              <Field className="form-control" type="email" name="Email" />
              <ErrorMessage name="Email" component="div" className="text-danger"/>
            </Col>
            </Row>
            <Row>
            <Col lg='6' className="mb-3">
              <label htmlFor="Password" className="form-label">Password</label>
              <Field className="form-control" type="password" name="Password" />
              <ErrorMessage name="Password" component="div" className="text-danger"/>
            </Col>
            </Row>
            <Row>
            <Col lg='6' className="mb-3">
              <label htmlFor="Address" className="form-label">Address</label>
              <Field className="form-control" type="text" name="Address" />
              <ErrorMessage name="Address" component="div" className="text-danger" />
            </Col>
            </Row>
            <Row>
            <Col lg='6' className="mb-3">
              <label htmlFor="State" className="form-label">State</label>
              <Field className="form-control" as="select" name="State" onChange={(e) => {
                const stateIsoCode = e.target.value;
            
                setFieldValue('State', stateIsoCode);
                setSelectedState(stateIsoCode);
              }}>
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state.name} value={state.name}>{state.name}</option>
                ))}
              </Field>
              <ErrorMessage name="State" component="div" className="text-danger"/>
            </Col>
            </Row>
            <Row>
            <Col lg='6' className="mb-3">
              <label htmlFor="City" className="form-label">City</label>
              <Field className="form-control" as="select" name="City">
                <option value="">Select City</option>
                {cities.map((city) => (
                  <option key={city.name} value={city.name}>{city.name}</option>
                ))}
              </Field>
              <ErrorMessage name="City" component="div" className="text-danger"/>
            </Col>
            </Row>
         
            <button type="submit" className="btn btn-primary btn-block">
              Submit
            </button>
           
          </Form>
        )}
      </Formik>
    </div>
  );
}

export default AddEdit_UserMaster;
