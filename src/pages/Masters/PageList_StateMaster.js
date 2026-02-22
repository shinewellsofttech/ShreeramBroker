import React, { useState, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Table,
  Button,
  Input,
  Badge,
  Pagination,
  PaginationItem,
  PaginationLink,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Spinner
} from "reactstrap";
import { API_WEB_URLS } from "../../constants/constAPI";
import { Fn_FillListData } from "../../store/Functions";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

const PageList_StateMaster = (props) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  // State management
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
  const [isLoading, setIsLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  
  const obj = JSON.parse(localStorage.getItem("authUser"));
  const modalTitle = "State Master";
  const rtPage_Add = "/AddState";
  const rtPage_Edit = "/EditState";
  const API_URL = API_WEB_URLS.MASTER + "/0/token/StateMaster";
  
  // Pagination settings
  const itemsPerPage = 10;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Fn_FillListData(dispatch, setGridData, 'gridDataSearch', API_URL + '/Id/0', setSearchKey, setSearchKeyArray);
      setIsLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    setFilteredData([...gridData]);
  }, [gridData]);

  const handleSearchChange = (event) => {
    const searchValue = event.target.value.toLowerCase();
    setSearchValue(event.target.value);

    const filteredData = gridData.filter((item) => {
      const searchKeyValue = item[searchKey]?.toLowerCase();
      return searchKeyValue?.includes(searchValue);
    });

    setFilteredData(filteredData);
    setCurrentPage(1);
  };

  const handleSearchKey = (item) => {
    setSearchKey(item);
    setSearchValue("");
    setFilteredData([...gridData]);
    setCurrentPage(1);
  };

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const btnAdd_onClick = (event, values) => {
    navigate(rtPage_Add, { state: { Id: 0 } });
  };

  const btnEdit_onClick = (e, formData) => {
    e.preventDefault();
    navigate(rtPage_Edit, { state: { Id: formData.Id } });
  };

  const btnDelete_onClick = (formData) => {
    // Fn_DeleteData(obj, formData.Id, API_URL, `${API_URL}/Id/0`);
  };

  const renderPagination = () => {
    const paginationItems = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    // Previous button
    paginationItems.push(
      <PaginationItem key="prev" disabled={currentPage === 1}>
        <PaginationLink onClick={() => handlePageChange(currentPage - 1)} href="#">
          <i className="fas fa-chevron-left"></i>
        </PaginationLink>
      </PaginationItem>
    );

    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      paginationItems.push(
        <PaginationItem key={i} active={i === currentPage}>
          <PaginationLink onClick={() => handlePageChange(i)} href="#">
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    // Next button
    paginationItems.push(
      <PaginationItem key="next" disabled={currentPage === totalPages}>
        <PaginationLink onClick={() => handlePageChange(currentPage + 1)} href="#">
          <i className="fas fa-chevron-right"></i>
        </PaginationLink>
      </PaginationItem>
    );

    return paginationItems;
  };

  return (
    <div className="state-list-wrap">
      <style>{`
        @media (min-width: 769px) {
          .state-list-wrap .container-fluid {
            padding-top: 3rem !important;
          }
        }
        @media (max-width: 768px) {
          .state-list-wrap .container-fluid {
            padding-top: 1rem !important;
          }
        }
      `}</style>
      <div className="container-fluid">
        {/* Main Content Card */}
        <Row>
          <Col lg="12">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-primary text-white py-3">
                <h5 className="mb-0 fw-semibold">
                  <i className="fas fa-list me-2"></i>
                  State List
                </h5>
              </CardHeader>
              <CardBody className="p-4">
                {/* Search and Filter Section */}
                <Row className="mb-4 g-2">
                  <Col xs="8" sm="6" md="6" lg="6">
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control border-2"
                        placeholder="Search..."
                        value={searchValue}
                        onChange={handleSearchChange}
                        style={{
                          borderRadius: '8px',
                          paddingLeft: '45px',
                          paddingRight: '10px',
                          borderColor: '#e9ecef',
                          transition: 'all 0.3s ease',
                          fontSize: '13px',
                          height: '38px'
                        }}
                      />
                      <i 
                        className="fas fa-search position-absolute"
                        style={{
                          left: '15px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          zIndex: 10,
                          fontSize: '14px'
                        }}
                      ></i>
                    </div>
                  </Col>
                  <Col xs="4" sm="6" md="6" lg="6" className="d-flex align-items-center">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={btnAdd_onClick}
                      className="fw-semibold py-1 px-2 w-100 d-flex align-items-center justify-content-center"
                      style={{
                        borderRadius: '4px',
                        fontSize: '11px',
                        lineHeight: 1.2,
                        maxWidth: '120px',
                        height: '38px'
                      }}
                    >
                      + Add New
                    </Button>
                  </Col>
                </Row>
                {SearchKeyArray && SearchKeyArray.length > 0 && (
                  <Row className="mb-3">
                    <Col xs="12">
                      <div className="d-flex flex-wrap gap-2">
                        {SearchKeyArray.map((item, index) => (
                          <Badge
                            key={index}
                            color={searchKey === item ? "primary" : "light"}
                            className="px-3 py-2 fw-medium cursor-pointer"
                            style={{
                              cursor: 'pointer',
                              borderRadius: '6px',
                              border: searchKey === item ? 'none' : '1px solid #dee2e6',
                              transition: 'all 0.3s ease'
                            }}
                            onClick={() => handleSearchKey(item)}
                          >
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Data Table */}
                {isLoading ? (
                  <div className="text-center py-5">
                    <Spinner color="primary" size="lg" className="mb-3">
                      Loading...
                    </Spinner>
                    <p className="text-muted">Loading states...</p>
                  </div>
                ) : filteredData.length === 0 ? (
                  <Alert color="info" className="text-center">
                    <i className="fas fa-info-circle me-2"></i>
                    {searchValue ? 'No states found matching your search criteria.' : 'No states available.'}
                  </Alert>
                ) : (
                  <>
                    <div className="table-responsive">
                      <Table className="table table-hover mb-0">
                        <thead className="table-light">
                          <tr>
                            <th className="border-0 fw-semibold text-dark">
                              <i className="fas fa-map-marker-alt me-2 text-primary"></i>
                              State Name
                            </th>
                            {/* <th className="border-0 fw-semibold text-dark text-center" style={{ width: '150px' }}>
                              Actions
                            </th> */}
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map((item, index) => (
                            <tr key={item.Id || index} className="align-middle">
                              <td className="border-0">
                                <div className="d-flex align-items-center">
                                  <div className="avatar-sm bg-primary bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center me-3">
                                    <i className="fas fa-map-marker-alt text-primary"></i>
                                  </div>
                                  <div>
                                    <h6 className="mb-0 fw-semibold text-dark">{item.Name}</h6>
                                    {/* <small className="text-muted">State ID: {item.Id}</small> */}
                                  </div>
                                </div>
                              </td>
                              {/* <td className="border-0 text-center">
                                <div className="d-flex gap-2 justify-content-center">
                                  <Button
                                    color="primary"
                                    size="sm"
                                    onClick={(e) => btnEdit_onClick(e, item)}
                                    className="px-3 py-1"
                                    style={{
                                      borderRadius: '6px',
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    <i className="fas fa-edit me-1"></i>
                                    Edit
                                  </Button>
                                </div>
                              </td> */}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                      <div className="d-flex justify-content-between align-items-center mt-4">
                        <div className="text-muted">
                          Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} states
                        </div>
                        <Pagination className="mb-0">
                          {renderPagination()}
                        </Pagination>
                      </div>
                    )}
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PageList_StateMaster;
