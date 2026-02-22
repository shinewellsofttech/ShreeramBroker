// functions.js
import toastr from "toastr";
import "toastr/build/toastr.css";
import { callAdd_Data_Multipart, callDelete_Data, callEdit_Data, callEdit_Data_Multipart, callFill_GridData, callGet_Data } from './common-actions';

// Helper function to handle 401 unauthorized
const handleUnauthorized = () => {
    localStorage.clear();
    window.location.href = '/login';
};

export const Fn_FillListData = (dispatch, setState, gridName, apiURL, setKey, setSearchKeyArray, headers = null) => { 
    return new Promise((resolve, reject) => {
        // Get auth token from localStorage
        const authToken = JSON.parse(localStorage.getItem('authUser'))?.token;
        
        // Prepare headers with authorization
        const requestHeaders = {
            Authorization: `Bearer ${authToken}`,
            ...headers
        };
        
        const request = {
            apiURL: apiURL,
            headers: requestHeaders,
            callback: (response) => {
                if (response && response.status === 200 && response.data) {
                    const dataList = response.data.dataList;
                    if (gridName == "gridDataSearch") {
                        const firstObject = response.data.dataList[0];
                        const keysArray = Object.keys(firstObject).filter((item) => item !== 'Id');
                        setSearchKeyArray(keysArray);
                        setState(response.data.dataList);
                        setKey(keysArray[0]);
                        resolve(response.data.dataList);
                    } else if (gridName === "productData" || gridName === "OtherDataScore") {
                        setState(prevState => ({
                            ...prevState,
                            [gridName]: dataList,
                            rows: [Object.keys(dataList[0])],
                            isProgress: false
                        }));
                        resolve(dataList);
                    } 
                    else if(gridName=='gridData' ){
                        setState(dataList);
                        resolve(dataList);
                    }else if(gridName =='FileNo'){
                        setState(prevState => ({
                            ...prevState,
                            ['FileNo']: response.data.dataList[0].FileNo
                        }));
                        resolve(response.data.dataList[0].FileNo);
                    }
                    else {
                        setState(prevState => ({
                            ...prevState,
                            [gridName]: dataList,
                            isProgress: false
                        }));
                        resolve(dataList);
                    }
                    // showToastWithCloseButton("success", "Data loaded successfully");
                } else if (response && response.status === 401) {
                    handleUnauthorized();
                    reject(new Error("Unauthorized access"));
                } else {
                    // showToastWithCloseButton("error", "Error loading data");
                    reject(new Error("Error loading data"));
                }
            },
            errorCallback: (error) => {
                if (error && error.response && error.response.status === 401) {
                    handleUnauthorized();
                    reject(new Error("Unauthorized access"));
                } else {
                    // showToastWithCloseButton("error", "Error loading data");
                    reject(new Error("Error loading data"));
                }
            }
        };
        dispatch(callFill_GridData(request));
    });
};


// export const Fn_DeleteData = (
//     dispatch,
//     setState,
//     id,
//     apiURL,
//     apiURL_Display
//   ) => {
//     return new Promise((resolve, reject) => {
//       const request = {
//         id: id,
//         apiURL: apiURL,
//         callback: response => {
//           if (response && response.status === 200) {
//             setState(prevState => ({
//               ...prevState,
//               confirm_alert: false,
//               success_dlg: true,
//               dynamic_title: "Deleted",
//               dynamic_description: "Selected data has been deleted.",
//             }))
//             showToastWithCloseButton("success", "Data deleted successfully")
  
//             // If apiURL_Display is provided, refresh the list
//             if (apiURL_Display) {
//               // Fn_FillListData(dispatch, setState, "gridData", apiURL_Display);
//               // Fn_FillListData(dispatch, setState, "Invoice", apiURL_Display);
//               // window.location.reload()
//             }
  
//             resolve(response) // Resolve the Promise with the response
//           } else {
//             setState(prevState => ({
//               ...prevState,
//               confirm_alert: false,
//               dynamic_title: "Error",
//               dynamic_description: "Some error occurred while deleting data.",
//             }))
//             showToastWithCloseButton(
//               "error",
//               "Some error occurred while deleting data"
//             )
//             reject(new Error("Error deleting data")) // Reject the Promise with an error
//           }
//         },
//       }
  
//       // Dispatch the delete action
//       dispatch(callDelete_Data(request))
//     })
//   }


export const Fn_DeleteData = (
    dispatch,
    setState,
    id,
    apiURL,
    apiURL_Display
  ) => {
    return new Promise((resolve, reject) => {
      const token = JSON.parse(localStorage.getItem('authUser'))?.token;
      if (!token) {
        // showToastWithCloseButton("error", "Authentication required. Please log in.");
        reject(new Error("No authentication token"));
        return;
      }
  
      const request = {
        id: id,
        apiURL: apiURL,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        callback: (response) => {
          if (response && response.status === 200) {
            setState((prevState) => ({
              ...prevState,
              confirm_alert: false,
              success_dlg: true,
              dynamic_title: "Deleted",
              dynamic_description: "Selected data has been deleted.",
            }));
            // showToastWithCloseButton("success", "Data deleted successfully");

            // If apiURL_Display is provided, refresh the list
            if (apiURL_Display) {
              // Fn_FillListData(dispatch, setState, "gridData", apiURL_Display);
              // Fn_FillListData(dispatch, setState, "Invoice", apiURL_Display);
              // window.location.reload();
            }

            resolve(response);
          } else {
            const isNotFound = response && (response.status === 404 || response?.data?.message === "Not Found" || response?.message === "Not Found");
            const errorMsg = isNotFound ? "This Data is used." : "Some error occurred while deleting data.";
            if (isNotFound) {
              toastr.error(errorMsg);
            }
            setState((prevState) => ({
              ...prevState,
              confirm_alert: false,
              dynamic_title: "Error",
              dynamic_description: errorMsg,
            }));
            // 404: resolve so no uncaught rejection (toast already shown); other errors reject
            if (isNotFound) {
              resolve(response);
            } else {
              reject(new Error(errorMsg));
            }
          }
        },
      };
  
      // Dispatch the delete action with token included
      dispatch(callDelete_Data(request));
    });
  };
  

export const Fn_DisplayData = (dispatch, setState, id, apiURL, gridname, headers = null) => {
    return new Promise((resolve, reject) => {
        // Get auth token from localStorage
        const authToken = JSON.parse(localStorage.getItem('authUser'))?.token;
        
        // Prepare headers with authorization
        const requestHeaders = {
            Authorization: `Bearer ${authToken}`,
            ...headers
        };
        
        const request = {
            id: id,
            apiURL: apiURL,
            headers: requestHeaders,
            callback: response => {
                if (response && response.status === 200 && response.data) {
                    const dataList = response.data.dataList;
                    setState(prevState => ({
                        ...prevState,
                        formData: dataList[0],
                    }));
                    resolve(dataList);
                    // showToastWithCloseButton("success", "Data displayed successfully");
                } else if (response && response.status === 401) {
                    handleUnauthorized();
                    reject(new Error("Unauthorized access"));
                } else {
                    // showToastWithCloseButton("error", "Error displaying data");
                    reject(new Error("Error displaying data"));
                }
            },
            errorCallback: (error) => {
                if (error && error.response && error.response.status === 401) {
                    handleUnauthorized();
                    reject(new Error("Unauthorized access"));
                } else {
                    // showToastWithCloseButton("error", "Error displaying data");
                    reject(new Error("Error displaying data"));
                }
            }
        };
        dispatch(callGet_Data(request));
    });
};

export const Fn_AddEditData = (
    dispatch,
    setState,
    data,
    apiURL,
    isMultiPart = false,
    getid,
    navigate,
    forward,
    headers = null
) => {
    console.log('in function')
    return new Promise((resolve, reject) => {
        const { arguList } = data;
        
        // Get auth token from localStorage
        const authToken = JSON.parse(localStorage.getItem('authUser'))?.token;
        
        // Prepare headers with authorization
        const requestHeaders = {
            Authorization: `Bearer ${authToken}`,
            ...headers
        };
        
        const request = {
            arguList: arguList,
            apiURL: apiURL,
            headers: requestHeaders,
            callback: response => {
                const isDuplicateResponse = (r) => {
                    if (!r || typeof r !== 'object') return false;
                    const status = r.status ?? r.data?.status;
                    if (Number(status) === 208) return true;
                    if (r.data?.data?.id === -1) return true;
                    const msg = (r.message ?? r.data?.message ?? r.data?.data?.message ?? '').toString().toLowerCase();
                    if (msg.includes('already exists') || msg.includes('duplicate')) return true;
                    try {
                        const str = JSON.stringify(r);
                        if (str.includes('Data already exists') || str.includes('already exists')) return true;
                    } catch (e) {}
                    return false;
                };
                if (response && response.status === 200) {
                    console.log('arguList',arguList);
                    if (getid === 'certificate') {
                        if (response.data.response[0].Id > 0) {
                            setState(response.data.response[0].RegNo);
                            showToastWithCloseButton("success", "File downloaded successfully");
                        } else {
                            showToastWithCloseButton("error", "Duplicate mobile number");
                        }
                    }else if(response.data.response && response.data.response[0].Id>0){
                       setState(true);
                        localStorage.setItem("YesBank", JSON.stringify(response.data.response[0]));
                        
                    }else if(getid=='TenderH'){
                    
                        
                        setState(prevState => ({
                            ...prevState,
                            F_TenderFileMasterH : response.data.data.id
                        }));
                        
                    }
                    
                    if (arguList.id === 0 ) {
                        
                        showToastWithCloseButton("success", "Data added successfully");
                        resolve(response);
                        if (navigate) {
                            navigate(forward, { state: { Id: 0 } });
                        }
                    }  else {
                        if (navigate) {
                            navigate(forward, { state: { Id: 0 } });
                        }
                        showToastWithCloseButton("success", "Data updated successfully");
                        resolve(response);
                    }
                } else if (response && response.status === 401) {
                    handleUnauthorized();
                    reject('Unauthorized access');
                } else if (response && isDuplicateResponse(response)) {
                    showToastWithCloseButton("error", "Duplicate Data");
                    resolve(response);
                } else {
                    if (response && isDuplicateResponse(response)) {
                        showToastWithCloseButton("error", "Duplicate Data");
                    } else if (arguList.id === 0) {
                        showToastWithCloseButton("error", "Error adding data");
                    } else {
                        showToastWithCloseButton("error", "Error updating data");
                    }
                    resolve(response);
                }
            },
            errorCallback: (error) => {
                if (error && error.response && error.response.status === 401) {
                    handleUnauthorized();
                    reject('Unauthorized access');
                } else {
                    const msg = (error?.response?.data?.message || error?.response?.data?.data?.message || error?.message || '').toString().toLowerCase();
                    const status = error?.response?.status;
                    const msgHas208 = (error?.message || '').includes('208');
                    const isDuplicate = status === 208 || (error?.response?.data && Number(error.response.data.status) === 208) || msg.includes('already exists') || msg.includes('duplicate') || msgHas208;
                    if (isDuplicate) {
                        showToastWithCloseButton("error", "Duplicate Data");
                    } else if (arguList.id === 0) {
                        showToastWithCloseButton("error", "Error adding data");
                    } else {
                        showToastWithCloseButton("error", "Error updating data");
                    }
                    resolve();
                }
            }
        };

        if (arguList.id === 0) {
            if (isMultiPart) dispatch(callAdd_Data_Multipart(request));
            
        } else {
            if (isMultiPart) dispatch(callEdit_Data_Multipart(request));
        
        }
    });
};

export const Fn_GetReport = (dispatch, setState, gridName, apiURL, data, isMultiPart = false) => {
    return new Promise((resolve, reject) => {
        const { arguList } = data;
        
        // Get auth token from localStorage
        const authToken = JSON.parse(localStorage.getItem('authUser'))?.token;
        
        // Prepare headers with authorization
        const requestHeaders = {
            Authorization: `Bearer ${authToken}`
        };
        
        const request = {
            arguList: arguList,
            apiURL: apiURL,
            headers: requestHeaders,
            callback: (response) => {
                try {
                    if (response && response.status === 200 && response.data) {
                        const responseData = response.data.response;
                        if (gridName === "productData" || gridName === "productDataAssest") {
                            setState(prevState => ({
                                ...prevState,
                                [gridName]: responseData,
                                rows: [Object.keys(responseData[0])],
                                isProgress: false
                            }));
                        } else if(gridName=='tenderData'){
                            setState(responseData);
                        }
                        else {
                            setState(prevState => ({
                                ...prevState,
                                [gridName]: responseData,
                                isProgress: false
                            }));
                        }
                        
                        showToastWithCloseButton("success", "Report generated successfully");
                        resolve(responseData);
                    } else if (response && response.status === 401) {
                        handleUnauthorized();
                        reject(new Error("Unauthorized access"));
                    } else {
                        showToastWithCloseButton("warning", "Data not found");
                        setState(prevState => ({ ...prevState, isProgress: false }));
                        resolve(null);
                    }
                } catch (error) {
                    console.error("Error processing report data:", error);
                    setState(prevState => ({ ...prevState, isProgress: false }));
                    showToastWithCloseButton("error", "Failed to process report data");
                    reject(error);
                }
            },
            errorCallback: (error) => {
                 if (error && error.response && error.response.status === 401) {
                     handleUnauthorized();
                     reject(new Error("Unauthorized access"));
                } else {
                     console.error("Error fetching report:", error);
                     setState(prevState => ({ ...prevState, isProgress: false }));
                     showToastWithCloseButton("error", "Failed to fetch report");
                     reject(error);
                 }
            }
        };

        dispatch(callAdd_Data_Multipart(request));
    });
};

export function showToastWithCloseButton(toastType, message) {
    toastr.options = {
        closeButton: true,
        preventDuplicates: true,
        newestOnTop: true,
        progressBar: true,
        timeOut: 2000,
    };

    if (toastType === "success") {
        toastr.success(message);
    } else if (toastType === "error") {
        toastr.error(message);
    } else if (toastType === "warning") {
        toastr.warning(message);
    }
}
