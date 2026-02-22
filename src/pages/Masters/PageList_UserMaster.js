import React, { useState, useEffect } from "react";

import { API_WEB_URLS } from "../../constants/constAPI";
import { Fn_FillListData } from "../../store/Functions";
import RCDisplayPage from "../../common/RCDisplayPage";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";


const PageList_UserMaster = (props) => {
    const navigate = useNavigate();
  const [modal, setModal] = useState(false);
  const [selectedFormData, setSelectedFormData] = useState({});
  const [gridData, setGridData] = useState([]);
  const [confirm_alert, setConfirmAlert] = useState(false);
  const [success_dlg, setSuccessDlg] = useState(false);
  const [dynamic_title, setDynamicTitle] = useState("");
  const [dynamic_description, setDynamicDescription] = useState("");
  const [SearchKeyArray, setSearchKeyArray] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [filteredData, setFilteredData] = useState([]);
  const [searchKey, setSearchKey] = useState("");
  const obj = JSON.parse(localStorage.getItem("authUser"));
  const modalTitle = "User Details";
  const rtPage_Add = "/AddUser";
  const rtPage_Edit = "/EditUser";
  const API_URL = API_WEB_URLS.MASTER + "/0/token/User";
  const dispatch = useDispatch();
  useEffect(() => {
   
    Fn_FillListData(dispatch, setGridData, 'gridDataSearch', API_URL + '/Id/0',setSearchKey,setSearchKeyArray);
  }, []);

  useEffect(()=>{
   setFilteredData([...gridData]);
  },[gridData])
  useEffect(()=>{console.log(searchKey,SearchKeyArray)},[searchKey])



  const handleSearchChange = (event) => {
    const searchValue = event.target.value.toLowerCase();

    const filteredData = gridData.filter((item) => {
      const searchKeyValue = item[searchKey]?.toLowerCase();
      return searchKeyValue?.includes(searchValue);
    });

    setFilteredData(filteredData);
    setCurrentPage(1);
  };

  const handleSearchKey = (item) => {
    setSearchKey(item);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const btnAdd_onClick = (event, values) => {
    // props.history.push(`${rtPage_Add}`);
    navigate(rtPage_Add, { state: { Id : 0 } });
  };

  const btnEdit_onClick = (e,formData) => {
    e.preventDefault();
    navigate(rtPage_Edit, { state: { Id : formData.Id } });
    
  };

  const btnDelete_onClick = (formData) => {
    // Fn_DeleteData(obj, formData.Id, API_URL, `${API_URL}/Id/0`);
  };

  const renderGridHeader = () => {
    return (
      <>
        <th>Name</th>
       
      </>
    );
  };

  const renderGridBody = (formData) => {
    return (
      <>
        <td>{formData.Name}</td>
        
      </>
    );
  };

  const renderModalBody = (selectedFormData) => {
    return (
      <>
        <p className="mb-4"></p>
      </>
    );
  };

  return (
    <div className="page-content">
      <RCDisplayPage
        SearchKeyArray={SearchKeyArray}
        currentPage={currentPage}
        searchKey={searchKey}
        Isbreadcrumb={false}
        breadCrumbTitle={"User Master"}
        breadcrumbItem={"List"}
        obj={obj}
        isSearchBox={true}
        isSNo={false}
        isCheckBox={false}
        isViewDetails={false}
        gridData={filteredData}
        gridHeader={renderGridHeader}
        gridBody={renderGridBody}
        handleSearchKey={handleSearchKey}
        handleSearchChange={handleSearchChange}
        handlePageChange={handlePageChange}
        btnAdd_onClick={btnAdd_onClick}
        btnEdit_onClick={btnEdit_onClick}
        confirm_alert={confirm_alert}
        success_dlg={success_dlg}
        dynamic_title={dynamic_title}
        dynamic_description={dynamic_description}
        // toggleDeleteConfirm={toggleDeleteConfirm}
        // toggleDeleteSuccess={toggleDeleteSuccess}
        btnDelete_onClick={btnDelete_onClick}
        isOpenModal={modal}
        modalTitle={modalTitle}
        selectedFormData={selectedFormData}
        modalBody={renderModalBody}
        // togglemodal={togglemodal}
        isAdd={true}
        isEdit={obj.UserType === "Admin"}
        isDelete={obj.UserType === "Admin"}
        isPagination={true}
      />
    </div>
  );
};

export default PageList_UserMaster;
