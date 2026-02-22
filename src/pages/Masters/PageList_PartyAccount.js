import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  CardBody,
  CardHeader,
  Button,
  Input,
  Alert,
  Spinner,
} from "reactstrap";
import { API_WEB_URLS } from "../../constants/constAPI";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_DeleteData } from "../../store/Functions";
import { useNavigate } from "react-router-dom";
import toastr from "toastr";
import "toastr/build/toastr.css";

const PageList_PartyAccount = () => {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [activeFilter, setActiveFilter] = useState('Active'); // 'All', 'Active', 'InActive'
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const rtPage_Add = "/AddPartyAccount";
  const rtPage_Edit = "/EditPartyAccount";
  const API_URL = API_WEB_URLS.MASTER + "/0/token/LedgerMaster";
  const API_URL_Delete = API_WEB_URLS.MASTER + "/0/token/DeletePartyAccount";

  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {},
    OtherDataScore: [],
    isProgress: true,
  });

  const fetchData = async () => {
    setLoading(true);
    await Fn_FillListData(dispatch, setGridData, "gridData", API_URL + "/Id/0");
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dispatch, API_URL]);

  const btnAddOnClick = () => {
    navigate(rtPage_Add, { state: { Id: 0 } });
  };

  const btnEditOnClick = (Id) => {
    navigate(rtPage_Edit, { state: { Id } });
  };

  const btnDeleteOnClick = async (Id) => {
    const confirmed = window.confirm("Are you sure you want to delete this party account?");
    if (confirmed) {
      try {
        setLoading(true);
        const response = await Fn_DeleteData(dispatch, setState, Id, `${API_URL_Delete}`, true);
        const msg = response?.data?.message || response?.message || "";
        if (response && response.status === 200 && (msg.toLowerCase().includes("record deleted") || msg.toLowerCase().includes("deleted"))) {
          toastr.success("Delete success");
        }
        await fetchData();
      } catch (error) {
        console.error("Error deleting record:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter data based on search term and active status
  const filteredData = gridData.filter(item => {
    // Filter by active status
    if (activeFilter === 'Active' && !item.IsActive) {
      return false;
    }
    if (activeFilter === 'InActive' && item.IsActive) {
      return false;
    }
    
    // Filter by search term
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.Name && item.Name.toLowerCase().includes(searchLower)) ||
      (item.Person && item.Person.toLowerCase().includes(searchLower)) ||
      (item.Address && item.Address.toLowerCase().includes(searchLower)) ||
      (item.City && item.City.toLowerCase().includes(searchLower)) ||
      (item.State && item.State.toLowerCase().includes(searchLower)) ||
      (item.IFS && item.IFS.toLowerCase().includes(searchLower)) ||
      (item.PanNo && item.PanNo.toLowerCase().includes(searchLower)) ||
      (item.PhoneNo && item.PhoneNo.toLowerCase().includes(searchLower)) ||
      (item.MobileNo && item.MobileNo.toLowerCase().includes(searchLower)) ||
      (item.email && item.email.toLowerCase().includes(searchLower)) ||
      (item.GSTNo && item.GSTNo.toLowerCase().includes(searchLower)) ||
      (item.AccNo && item.AccNo.toLowerCase().includes(searchLower))
    );
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      } else {
        return {
          key,
          direction: 'asc'
        };
      }
    });
  };

  if (loading) {
    return (
      <div className="page-content" >
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
              <Spinner color="primary" size="lg" className="mb-3">
                Loading...
              </Spinner>
              <p className="text-muted">Loading party account data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="party-list-wrap">
      <style>{`
        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .party-table-container {
            -webkit-overflow-scrolling: touch;
          }
          
          .party-table th,
          .party-table td {
            font-size: 9px !important;
            padding: 4px 2px !important;
          }
          
          .party-table .btn {
            font-size: 8px !important;
            padding: 2px 4px !important;
            min-width: 30px !important;
          }
        }
        
        @media (max-width: 576px) {
          .party-table th,
          .party-table td {
            font-size: 8px !important;
            padding: 3px 1px !important;
          }
        }
        
        /* Scrollbar styling */
        .party-table-container::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        
        .party-table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .party-table-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .party-table-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        /* Sticky header */
        .party-table thead th {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #212529 !important;
        }
        
        /* Table borders */
        .party-table {
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .party-table th,
        .party-table td {
          border: 1px solid #dee2e6 !important;
        }
        
        /* Override Bootstrap striped table styles */
        .party-table tbody tr {
          background-color: inherit !important;
        }
        
        .party-table tbody tr:nth-of-type(odd) {
          background-color: inherit !important;
        }
        
        .party-table tbody tr:nth-of-type(even) {
          background-color: inherit !important;
        }
      `}</style>
      <style>{`
        @media (min-width: 769px) {
          .party-list-wrap .container-fluid {
            padding-top: 3rem !important;
          }
        }
        @media (max-width: 768px) {
          .party-list-wrap .container-fluid {
            padding-top: 1rem !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
        }
      `}</style>
      <div className="container-fluid" style={{ maxWidth: '100%', padding: '0 15px', overflow: 'hidden' }}>

        {/* Main Content Card */}
        <Row>
          <Col lg="12">
            <Card className="shadow-sm border-0" style={{ minHeight: 'calc(100vh - 100px)' }}>
              <CardHeader className="bg-primary text-white py-3">
                <h5 className="mb-0 fw-semibold" style={{ fontSize: '14px' }}>
                  <i className="fas fa-list me-2" style={{ fontSize: '12px' }}></i>
                  Party Account List ({sortedData.length})
                </h5>
              </CardHeader>
              <CardBody className="p-2 p-md-3">
                {/* Search Section */}
                <div className="mb-3">
                  {/* Desktop Layout */}
                  <Row className="d-none d-md-flex g-2">
                    <Col md="6" lg="5">
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control border-2" 
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          paddingLeft: '45px',
                          paddingRight: '0px',
                          backgroundColor: '#E3F2FD',
                          borderColor: '#2196F3',
                          transition: 'all 0.3s ease',
                          fontSize: '13px',
                          height: '38px'
                        }}
                        onFocus={(e) => {
                          e.target.style.backgroundColor = '#E3F2FD';
                          e.target.style.borderColor = '#2196F3';
                          e.target.style.boxShadow = '0 0 0 0.2rem rgba(33, 150, 243, 0.25)';
                        }}
                        onBlur={(e) => {
                          e.target.style.boxShadow = 'none';
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
                    <Col md="6" lg="7">
                      <div className="d-flex gap-2 align-items-center h-100">
                        <Button
                          color={activeFilter === 'All' ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => setActiveFilter('All')}
                          className="fw-semibold"
                          style={{
                            borderRadius: '6px',
                            transition: 'all 0.3s ease',
                            fontSize: '12px',
                            height: '38px',
                            flex: 1
                          }}
                        >
                          All
                        </Button>
                        <Button
                          color={activeFilter === 'Active' ? 'success' : 'secondary'}
                          size="sm"
                          onClick={() => setActiveFilter('Active')}
                          className="fw-semibold"
                          style={{
                            borderRadius: '6px',
                            transition: 'all 0.3s ease',
                            fontSize: '12px',
                            height: '38px',
                            flex: 1
                          }}
                        >
                          Active
                        </Button>
                    <Button
                          color={activeFilter === 'InActive' ? 'danger' : 'secondary'}
                      size="sm"
                          onClick={() => setActiveFilter('InActive')}
                          className="fw-semibold"
                      style={{
                        borderRadius: '6px',
                        transition: 'all 0.3s ease',
                        fontSize: '12px',
                            height: '38px',
                            flex: 1
                      }}
                    >
                          InActive
                    </Button>
                        <Button
                          color="primary"
                          size="sm"
                          onClick={btnAddOnClick}
                          className="fw-semibold py-1 px-2 d-flex align-items-center justify-content-center"
                          style={{
                            borderRadius: '4px',
                            fontSize: '11px',
                            lineHeight: 1.2,
                            minWidth: '90px',
                            height: '38px'
                          }}
                        >
                          + Add New
                        </Button>
                      </div>
                  </Col>
                </Row>
                  
                  {/* Mobile Layout - Compact Single Line */}
                  <div className="d-md-none">
                    <div className="d-flex gap-1 align-items-center" style={{ flexWrap: 'nowrap' }}>
                      <div className="search-box position-relative" style={{ flex: '1 1 auto', minWidth: '120px' }}>
                        <Input
                          type="text"
                          className="form-control border-2"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            borderRadius: '6px',
                            paddingLeft: '32px',
                            paddingRight: '0px',
                            backgroundColor: '#E3F2FD',
                            borderColor: '#2196F3',
                            transition: 'all 0.3s ease',
                            fontSize: '11px',
                            height: '32px'
                          }}
                          onFocus={(e) => {
                            e.target.style.backgroundColor = '#E3F2FD';
                            e.target.style.borderColor = '#2196F3';
                            e.target.style.boxShadow = '0 0 0 0.2rem rgba(33, 150, 243, 0.25)';
                          }}
                          onBlur={(e) => {
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <i 
                          className="fas fa-search position-absolute"
                          style={{
                            left: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#6c757d',
                            zIndex: 10,
                            fontSize: '11px'
                          }}
                        ></i>
                      </div>
                      <Button
                        color={activeFilter === 'All' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setActiveFilter('All')}
                        className="fw-semibold"
                        style={{
                          borderRadius: '4px',
                          transition: 'all 0.3s ease',
                          fontSize: '10px',
                          height: '32px',
                          padding: '4px 8px',
                          minWidth: '45px'
                        }}
                      >
                        All
                      </Button>
                      <Button
                        color={activeFilter === 'Active' ? 'success' : 'secondary'}
                        size="sm"
                        onClick={() => setActiveFilter('Active')}
                        className="fw-semibold"
                        style={{
                          borderRadius: '4px',
                          transition: 'all 0.3s ease',
                          fontSize: '10px',
                          height: '32px',
                          padding: '4px 8px',
                          minWidth: '50px'
                        }}
                      >
                        Active
                      </Button>
                      <Button
                        color={activeFilter === 'InActive' ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => setActiveFilter('InActive')}
                        className="fw-semibold"
                        style={{
                          borderRadius: '4px',
                          transition: 'all 0.3s ease',
                          fontSize: '10px',
                          height: '32px',
                          padding: '4px 8px',
                          minWidth: '60px'
                        }}
                      >
                        InActive
                      </Button>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={btnAddOnClick}
                        className="fw-semibold"
                        style={{
                          borderRadius: '4px',
                          fontSize: '10px',
                          height: '32px',
                          padding: '4px 8px',
                          minWidth: '75px'
                        }}
                      >
                        + Add New
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                {gridData.length === 0 ? (
                  <Alert color="info" className="text-center">
                    <i className="fas fa-info-circle me-2" style={{ fontSize: '12px' }}></i>
                    <span style={{ fontSize: '13px' }}>No party account data available.</span>
                  </Alert>
                ) : sortedData.length === 0 ? (
                  <Alert color="warning" className="text-center">
                    <i className="fas fa-exclamation-triangle me-2" style={{ fontSize: '12px' }}></i>
                    <span style={{ fontSize: '13px' }}>No results found for "{searchTerm}"</span>
                  </Alert>
                ) : (
                  <div className="party-table-container" style={{ 
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 250px)',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    WebkitOverflowScrolling: 'touch'
                  }}>
                    <table className="table table-hover party-table mb-0" style={{ 
                      width: '100%',
                      minWidth: '1400px'
                    }}>
                      <thead className="table-dark">
                        <tr>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap', width: '50px' }}>
                            Sr
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            onClick={() => handleSort('Name')}
                            style={{ cursor: 'pointer', fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}
                          >
                            Name {sortConfig.key === 'Name' && <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '8px' }}></i>}
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            onClick={() => handleSort('Person')}
                            style={{ cursor: 'pointer', fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}
                          >
                            Person {sortConfig.key === 'Person' && <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '8px' }}></i>}
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            onClick={() => handleSort('Address')}
                            style={{ cursor: 'pointer', fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}
                          >
                            Address {sortConfig.key === 'Address' && <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '8px' }}></i>}
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            onClick={() => handleSort('City')}
                            style={{ cursor: 'pointer', fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}
                          >
                            City {sortConfig.key === 'City' && <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '8px' }}></i>}
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            onClick={() => handleSort('State')}
                            style={{ cursor: 'pointer', fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}
                          >
                            State {sortConfig.key === 'State' && <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '8px' }}></i>}
                          </th>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}>IFS</th>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}>PAN</th>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}>Phone</th>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}>Mobile</th>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}>Email</th>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}>Fax</th>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}>GST</th>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap' }}>A/C No</th>
                          <th className="text-center fw-semibold" style={{ fontSize: '10px', padding: '8px 4px', whiteSpace: 'nowrap', width: '100px' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.map((item, index) => {
                          // Active rows: light green and lighter green
                          // InActive rows: light red and lighter red
                          let bgColor;
                          if (item.IsActive) {
                            // Active: alternating light green shades
                            bgColor = index % 2 === 0 ? '#c8e6c9' : '#e8f5e9';
                          } else {
                            // InActive: alternating light red shades
                            bgColor = index % 2 === 0 ? '#ffcdd2' : '#ffebee';
                          }
                          return (
                            <tr key={item.Id || index} className="align-middle" style={{ backgroundColor: bgColor }}>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }}>
                                <span className="text-dark fw-semibold">{index + 1}</span>
                              </td>
                              <td className="text-start" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }} title={item.Name}>
                                <span className="text-dark fw-bold">{item.Name || '-'}</span>
                              </td>
                              <td className="text-start" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }} title={item.Person}>
                                <span className="text-dark">{item.Person || '-'}</span>
                              </td>
                              <td className="text-start" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }} title={item.Address}>
                                <span className="text-dark">{item.Address || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }}>
                                <span className="text-dark">{item.City || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }}>
                                <span className="text-dark">{item.State || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }}>
                                <span className="text-dark">{item.IFS || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }}>
                                <span className="text-dark">{item.PanNo || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }}>
                                <span className="text-dark">{item.PhoneNo || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }}>
                                <span className="text-dark">{item.MobileNo || '-'}</span>
                              </td>
                              <td className="text-start" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }} title={item.email}>
                                <span className="text-dark">{item.email || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }}>
                                <span className="text-dark">{item.Fax || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }} title={item.GSTNo}>
                                <span className="text-dark">{item.GSTNo || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', fontSize: '10px', backgroundColor: bgColor }}>
                                <span className="text-dark">{item.AccNo || '-'}</span>
                              </td>
                              <td className="text-center" style={{ padding: '6px 4px', whiteSpace: 'nowrap', backgroundColor: bgColor }}>
                                <div className="d-flex gap-1 justify-content-center flex-nowrap">
                                  <Button
                                    color="primary"
                                    size="sm"
                                    onClick={() => btnEditOnClick(item.Id)}
                                    className="btn px-2 py-1"
                                    style={{
                                      borderRadius: '4px',
                                      fontSize: '9px',
                                      lineHeight: '1.2',
                                      whiteSpace: 'nowrap',
                                      flexShrink: 0
                                    }}
                                  >
                                    <i className="fas fa-edit me-1" style={{ fontSize: '8px' }}></i>
                                    Edit
                                  </Button>
                                  <Button
                                    color="danger"
                                    size="sm"
                                    onClick={() => btnDeleteOnClick(item.Id)}
                                    className="btn px-2 py-1"
                                    style={{
                                      borderRadius: '4px',
                                      fontSize: '9px',
                                      lineHeight: '1.2',
                                      whiteSpace: 'nowrap',
                                      flexShrink: 0
                                    }}
                                  >
                                    <i className="fas fa-trash me-1" style={{ fontSize: '8px' }}></i>
                                    Del
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default PageList_PartyAccount;

