import {put, takeLatest,takeEvery, call, select} from 'redux-saga/effects';
//Constants
import {API_WEB_URLS} from '../constants/constAPI';

//From Store Base
import * as base_acTypes from './actionTypes';
import {API_HELPER} from './../helpers/ApiHelper';




console.log('API_WEB_URLS.BASE', API_WEB_URLS.BASE);
function* sagaFill_GridData(action) {
  const {callback, errorCallback, apiURL, headers} = action.data;
  try {
   
    const response = yield call(API_HELPER.apiGET, API_WEB_URLS.BASE + apiURL, headers);
    //console.log(json);
    if (callback) {
      callback(response);
    }
  } catch (error) {
    console.log("error_Fill_GridData : " + error);
    if (errorCallback) {
      errorCallback(error);
    }
  }
}
function* sagaGet_Data(action) {
  const { callback, errorCallback, id, apiURL, headers} = action.data;
  try {
    //console.log(API_WEB_URLS.BASE + apiURL + '/' + id);
    const response = yield call(API_HELPER.apiGET, API_WEB_URLS.BASE + apiURL + '/' + id, headers);
    if (callback) {
        callback(response);
    }
  } catch (error) {
    console.log("error_Get_Data : " + error);
    if (errorCallback) {
      errorCallback(error);
    }
  }
}
function* sagaAdd_Data(action) {
  const { callback, errorCallback, apiURL, arguList, headers } = action.data;
  try {
    const response = yield call(API_HELPER.apiPOST, API_WEB_URLS.BASE + apiURL, arguList, headers);
    if (callback) {
        callback(response);
    }
  } catch (error) {
    console.log("error_Add_Data : " + error);
    if (errorCallback) {
      errorCallback(error);
    }
  }
}
function* sagaAdd_Data_MultiPart(action) {
    const { callback, errorCallback, apiURL, arguList, headers } = action.data;
    //console.log(arguList);
    try {
        const response = yield call(API_HELPER.apiPOST_Multipart, API_WEB_URLS.BASE + apiURL, arguList.formData, headers);
        if (callback) {
            callback(response);
        }
    } catch (error) {
        console.log("error_Add_Data_MultiPart : " + error);
        if (errorCallback) {
          errorCallback(error);
        }
    }
}
function* sagaEdit_Data_MultiPart(action) {
    const { callback, errorCallback, apiURL, arguList, headers } = action.data;
    try {
        const response = yield call(API_HELPER.apiPUT_Multipart, API_WEB_URLS.BASE + apiURL + '/' + arguList.id, arguList.formData, headers);
        if (callback) {
            callback(response);
        }
    } catch (error) {
        console.log("error_Edit_Data_MultiPart : " + error);
        if (errorCallback) {
          errorCallback(error);
        }
    }
}
function* sagaEdit_Data(action) {
  const { callback, errorCallback, apiURL, arguList, headers } = action.data;
  try {
    const response = yield call(API_HELPER.apiPUT, API_WEB_URLS.BASE + apiURL + '/' + arguList.id, arguList, headers);
    if (callback) {
        callback(response);
    }
  } catch (error) {
    console.log("error_Edit_Data : " + error);
    if (errorCallback) {
      errorCallback(error);
    }
  }
}
function* sagaDelete_Data(action) {
  const { callback, errorCallback, id, apiURL, headers } = action.data;
  try {
    const response = yield call(API_HELPER.apiDELETE, API_WEB_URLS.BASE + apiURL + '/' + id, null, headers);
    if (callback) {
        callback(response);
    }
  } catch (error) {
    console.log("error_Delete_Data : " + error);
    if (errorCallback) {
      errorCallback(error);
    }
  }
}
export function* commonActionWatcher() {
  yield takeEvery(base_acTypes.FILL_GRID_DATA, sagaFill_GridData);
  yield takeEvery(base_acTypes.GET_DATA, sagaGet_Data)
  yield takeEvery(base_acTypes.ADD_DATA, sagaAdd_Data)
  yield takeEvery(base_acTypes.ADD_DATA_MULTIPART, sagaAdd_Data_MultiPart)
  yield takeEvery(base_acTypes.EDIT_DATA_MULTIPART, sagaEdit_Data_MultiPart)
  yield takeEvery(base_acTypes.EDIT_DATA, sagaEdit_Data)
  yield takeEvery(base_acTypes.DELETE_DATA, sagaDelete_Data)
}
