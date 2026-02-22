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

const PageList_LedgerMaster = () => {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const rtPage_Add = "/AddLedger";
  const rtPage_Edit = "/EditLedger";
  const API_URL = API_WEB_URLS.MASTER + "/0/token/Banks";
  const API_URL_Delete = API_WEB_URLS.MASTER + "/0/token/DeleteBanks";

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
    try {
      const response = await Fn_DeleteData(dispatch, setState, Id, `${API_URL_Delete}`, true);
      const msg = response?.data?.message || response?.message || "";
      if (response && response.status === 200 && (msg.toLowerCase().includes("record deleted") || msg.toLowerCase().includes("deleted"))) {
        toastr.success("Delete success");
        await fetchData();
      }
    } catch (e) {}
  };

  // Filter data based on search term
  const filteredData = gridData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (item.Name && item.Name.toLowerCase().includes(searchLower)) ||
      (item.Address && item.Address.toLowerCase().includes(searchLower)) ||
      (item.IFSC && item.IFSC.toLowerCase().includes(searchLower)) ||
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
              <p className="text-muted">Loading ledger data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ledger-list-wrap">
      <style>{`
        /* Mobile-specific styles */
        @media (max-width: 768px) {
          .ledger-table-container {
            -webkit-overflow-scrolling: touch;
          }
          
          .ledger-table th,
          .ledger-table td {
            font-size: 10px !important;
            padding: 6px 4px !important;
          }
          
          .ledger-table .btn {
            font-size: 9px !important;
            padding: 3px 6px !important;
            min-width: 35px !important;
          }
        }
        
        @media (max-width: 576px) {
          .ledger-table th,
          .ledger-table td {
            font-size: 9px !important;
            padding: 4px 2px !important;
          }
        }
        
        /* Scrollbar styling */
        .ledger-table-container::-webkit-scrollbar {
          height: 8px;
          width: 8px;
        }
        
        .ledger-table-container::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        
        .ledger-table-container::-webkit-scrollbar-thumb {
          background: #888;
          border-radius: 4px;
        }
        
        .ledger-table-container::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
        
        /* Sticky header */
        .ledger-table thead th {
          position: sticky;
          top: 0;
          z-index: 10;
          background-color: #212529 !important;
        }
        
        /* Table borders */
        .ledger-table {
          border-collapse: separate;
          border-spacing: 0;
        }
        
        .ledger-table th,
        .ledger-table td {
          border: 1px solid #dee2e6 !important;
        }
      `}</style>
      <style>{`
        @media (min-width: 769px) {
          .ledger-list-wrap .container-fluid {
            padding-top: 3rem !important;
          }
        }
        @media (max-width: 768px) {
          .ledger-list-wrap .container-fluid {
            padding-top: 1rem !important;
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
                  Ledger List ({sortedData.length} records)
                </h5>
              </CardHeader>
              <CardBody className="p-2 p-md-3">
                {/* Search Section + Add New */}
                <Row className="mb-3 align-items-center">
                  <Col xs="12" sm="8" md="9" lg="10">
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control border-2"
                        placeholder="Search by name, address, IFSC, or A/C No..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
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
                  <Col xs="12" sm="4" md="3" lg="2" className="mt-2 mt-sm-0">
                    <Button
                      color="primary"
                      size="sm"
                      onClick={btnAddOnClick}
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

                {/* Data Table */}
                {gridData.length === 0 ? (
                  <Alert color="info" className="text-center">
                    <i className="fas fa-info-circle me-2" style={{ fontSize: '12px' }}></i>
                    <span style={{ fontSize: '13px' }}>No ledger data available.</span>
                  </Alert>
                ) : sortedData.length === 0 ? (
                  <Alert color="warning" className="text-center">
                    <i className="fas fa-exclamation-triangle me-2" style={{ fontSize: '12px' }}></i>
                    <span style={{ fontSize: '13px' }}>No results found for "{searchTerm}"</span>
                  </Alert>
                ) : (
                  <div className="ledger-table-container" style={{ 
                    width: '100%',
                    overflowX: 'auto',
                    overflowY: 'auto',
                    maxHeight: 'calc(100vh - 250px)',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    WebkitOverflowScrolling: 'touch'
                  }}>
                    <table className="table table-striped table-hover ledger-table mb-0" style={{ 
                      width: '100%',
                      minWidth: '700px'
                    }}>
                      <thead className="table-dark">
                        <tr>
                          <th 
                            className="text-center fw-semibold"
                            style={{ 
                              fontSize: '11px',
                              padding: '10px 8px',
                              whiteSpace: 'nowrap',
                              width: '60px'
                            }}
                          >
                            Sr No
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            onClick={() => handleSort('Name')}
                            style={{ 
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '10px 8px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Name
                            {sortConfig.key === 'Name' && (
                              <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '9px' }}></i>
                            )}
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            onClick={() => handleSort('Address')}
                            style={{ 
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '10px 8px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            Address
                            {sortConfig.key === 'Address' && (
                              <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '9px' }}></i>
                            )}
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            onClick={() => handleSort('IFSC')}
                            style={{ 
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '10px 8px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            IFSC
                            {sortConfig.key === 'IFSC' && (
                              <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '9px' }}></i>
                            )}
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            onClick={() => handleSort('AccNo')}
                            style={{ 
                              cursor: 'pointer',
                              fontSize: '11px',
                              padding: '10px 8px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            A/C No
                            {sortConfig.key === 'AccNo' && (
                              <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-1`} style={{ fontSize: '9px' }}></i>
                            )}
                          </th>
                          <th 
                            className="text-center fw-semibold"
                            style={{ 
                              fontSize: '11px',
                              padding: '10px 8px',
                              whiteSpace: 'nowrap',
                              width: '120px'
                            }}
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.map((item, index) => (
                          <tr key={item.Id || index} className="align-middle">
                            <td className="text-center" style={{ 
                              padding: '8px',
                              fontSize: '11px'
                            }}>
                              <span className="text-dark fw-semibold">{index + 1}</span>
                            </td>
                            <td className="text-start" style={{ 
                              padding: '8px',
                              fontSize: '11px'
                            }}>
                              <span className="text-dark">{item.Name || '-'}</span>
                            </td>
                            <td className="text-start" style={{ 
                              padding: '8px',
                              fontSize: '11px'
                            }}>
                              <span className="text-dark">{item.Address || '-'}</span>
                            </td>
                            <td className="text-center" style={{ 
                              padding: '8px',
                              fontSize: '11px'
                            }}>
                              <span className="text-dark">{item.IFSC || '-'}</span>
                            </td>
                            <td className="text-center" style={{ 
                              padding: '8px',
                              fontSize: '11px'
                            }}>
                              <span className="text-dark">{item.AccNo || '-'}</span>
                            </td>
                            <td className="text-center" style={{ 
                              padding: '8px'
                            }}>
                              <div className="d-flex gap-1 justify-content-center flex-wrap">
                                <Button
                                  color="primary"
                                  size="sm"
                                  onClick={() => btnEditOnClick(item.Id)}
                                  className="btn px-2 py-1"
                                  style={{
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    lineHeight: '1.2',
                                    minWidth: '45px'
                                  }}
                                >
                                  <i className="fas fa-edit me-1" style={{ fontSize: '9px' }}></i>
                                  Edit
                                </Button>
                                <Button
                                  color="danger"
                                  size="sm"
                                  onClick={() => btnDeleteOnClick(item.Id)}
                                  className="btn px-2 py-1"
                                  style={{
                                    borderRadius: '4px',
                                    fontSize: '10px',
                                    lineHeight: '1.2',
                                    minWidth: '45px'
                                  }}
                                >
                                  <i className="fas fa-trash me-1" style={{ fontSize: '9px' }}></i>
                                  Del
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
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

export default PageList_LedgerMaster;

