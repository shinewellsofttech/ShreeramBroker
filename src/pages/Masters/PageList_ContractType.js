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

const PageList_ContractType = () => {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const rtPage_Add = "/AddContractType";
  const rtPage_Edit = "/EditContractType";
  const API_URL = API_WEB_URLS.MASTER + "/0/token/ContractType";
  const API_URL_Delete = API_WEB_URLS.MASTER + "/0/token/DeleteContractType";

  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {},
    isProgress: true,
  });

  const fetchData = async () => {
    setLoading(true);
    await Fn_FillListData(dispatch, setGridData, "gridData", API_URL + "/Id/0");
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [dispatch]);

  const btnAddOnClick = () => navigate(rtPage_Add, { state: { Id: 0 } });
  const btnEditOnClick = (Id) => navigate(rtPage_Edit, { state: { Id } });

  const btnDeleteOnClick = async (Id) => {
    const confirmed = window.confirm("Are you sure you want to delete this contract type?");
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

  const filteredData = gridData.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (item.Name && item.Name.toLowerCase().includes(searchLower));
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] || "";
    const bValue = b[sortConfig.key] || "";
    if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        return { key, direction: prevConfig.direction === "asc" ? "desc" : "asc" };
      } else {
        return { key, direction: "asc" };
      }
    });
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ height: "60vh" }}>
            <div className="text-center">
              <Spinner color="primary" size="lg" className="mb-3">Loading...</Spinner>
              <p className="text-muted">Loading contract type data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-type-list-wrap">
      <style>{`
        @media (max-width: 768px) {
          .contract-type-table-container { -webkit-overflow-scrolling: touch; }
          .contract-type-table th, .contract-type-table td { font-size: 9px !important; padding: 4px 2px !important; }
          .contract-type-table .btn { font-size: 8px !important; padding: 2px 4px !important; min-width: 30px !important; }
        }
        @media (max-width: 576px) {
          .contract-type-table th, .contract-type-table td { font-size: 8px !important; padding: 3px 1px !important; }
        }
        .contract-type-table-container::-webkit-scrollbar { height: 8px; width: 8px; }
        .contract-type-table-container::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
        .contract-type-table-container::-webkit-scrollbar-thumb { background: #888; border-radius: 4px; }
        .contract-type-table-container::-webkit-scrollbar-thumb:hover { background: #555; }
        .contract-type-table thead th { position: sticky; top: 0; z-index: 10; background-color: #212529 !important; }
        .contract-type-table { border-collapse: separate; border-spacing: 0; }
        .contract-type-table th, .contract-type-table td { border: 1px solid #dee2e6 !important; }
        .contract-type-table tbody tr { background-color: inherit !important; }
        .contract-type-table tbody tr:nth-of-type(odd) { background-color: inherit !important; }
        .contract-type-table tbody tr:nth-of-type(even) { background-color: inherit !important; }
      `}</style>
      <style>{`
        @media (min-width: 769px) { .contract-type-list-wrap .container-fluid { padding-top: 3rem !important; } }
        @media (max-width: 768px) {
          .contract-type-list-wrap .container-fluid {
            padding-top: 1rem !important;
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
        }
      `}</style>

      <div className="container-fluid" style={{ maxWidth: "100%", padding: "0 15px", overflow: "hidden" }}>
        <Row>
          <Col lg="12">
            <Card className="shadow-sm border-0" style={{ minHeight: "calc(100vh - 100px)" }}>
              <CardHeader className="bg-primary text-white py-3">
                <h5 className="mb-0 fw-semibold" style={{ fontSize: "14px" }}>
                  <i className="fas fa-file-contract me-2" style={{ fontSize: "12px" }}></i>
                  Contract Type List ({sortedData.length})
                </h5>
              </CardHeader>

              <CardBody className="p-2 p-md-3">
                <div className="mb-3">
                  {/* Desktop Layout */}
                  <Row className="d-none d-md-flex g-2">
                    <Col md="8" lg="9">
                      <div className="search-box position-relative">
                        <Input
                          type="text"
                          className="form-control border-2"
                          placeholder="Search by name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            borderRadius: "8px",
                            paddingLeft: "45px",
                            backgroundColor: "#E3F2FD",
                            borderColor: "#2196F3",
                            transition: "all 0.3s ease",
                            fontSize: "13px",
                            height: "38px",
                          }}
                          onFocus={(e) => {
                            e.target.style.backgroundColor = "#E3F2FD";
                            e.target.style.borderColor = "#2196F3";
                            e.target.style.boxShadow = "0 0 0 0.2rem rgba(33, 150, 243, 0.25)";
                          }}
                          onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                        />
                        <i className="fas fa-search position-absolute"
                          style={{ left: "15px", top: "50%", transform: "translateY(-50%)", color: "#6c757d", zIndex: 10, fontSize: "14px" }}
                        ></i>
                      </div>
                    </Col>
                    <Col md="4" lg="3">
                      <Button
                        color="primary"
                        size="sm"
                        onClick={btnAddOnClick}
                        className="fw-semibold py-1 px-2 w-100 d-flex align-items-center justify-content-center"
                        style={{ borderRadius: "4px", fontSize: "11px", lineHeight: 1.2, height: "38px" }}
                      >
                        + Add New
                      </Button>
                    </Col>
                  </Row>

                  {/* Mobile Layout */}
                  <div className="d-md-none">
                    <div className="d-flex gap-1 align-items-center" style={{ flexWrap: "nowrap" }}>
                      <div className="search-box position-relative" style={{ flex: "1 1 auto", minWidth: "120px" }}>
                        <Input
                          type="text"
                          className="form-control border-2"
                          placeholder="Search..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          style={{
                            borderRadius: "6px",
                            paddingLeft: "32px",
                            backgroundColor: "#E3F2FD",
                            borderColor: "#2196F3",
                            fontSize: "11px",
                            height: "32px",
                          }}
                          onFocus={(e) => { e.target.style.boxShadow = "0 0 0 0.2rem rgba(33, 150, 243, 0.25)"; }}
                          onBlur={(e) => { e.target.style.boxShadow = "none"; }}
                        />
                        <i className="fas fa-search position-absolute"
                          style={{ left: "10px", top: "50%", transform: "translateY(-50%)", color: "#6c757d", zIndex: 10, fontSize: "11px" }}
                        ></i>
                      </div>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={btnAddOnClick}
                        className="fw-semibold"
                        style={{ borderRadius: "4px", fontSize: "10px", height: "32px", padding: "4px 8px", minWidth: "75px" }}
                      >
                        + Add New
                      </Button>
                    </div>
                  </div>
                </div>

                {gridData.length === 0 ? (
                  <Alert color="info" className="text-center">
                    <i className="fas fa-info-circle me-2" style={{ fontSize: "12px" }}></i>
                    <span style={{ fontSize: "13px" }}>No contract type data available.</span>
                  </Alert>
                ) : sortedData.length === 0 ? (
                  <Alert color="warning" className="text-center">
                    <i className="fas fa-exclamation-triangle me-2" style={{ fontSize: "12px" }}></i>
                    <span style={{ fontSize: "13px" }}>No results found for "{searchTerm}"</span>
                  </Alert>
                ) : (
                  <div className="contract-type-table-container" style={{
                    width: "100%",
                    overflowX: "auto",
                    overflowY: "auto",
                    maxHeight: "calc(100vh - 250px)",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    WebkitOverflowScrolling: "touch",
                  }}>
                    <table className="table table-hover contract-type-table mb-0" style={{ width: "100%", minWidth: "700px" }}>
                      <thead className="table-dark">
                        <tr>
                          <th className="text-center fw-semibold" style={{ fontSize: "10px", padding: "8px 4px", whiteSpace: "nowrap", width: "50px" }}>Sr</th>
                          <th className="text-center fw-semibold" onClick={() => handleSort("Name")}
                            style={{ cursor: "pointer", fontSize: "10px", padding: "8px 4px", whiteSpace: "nowrap" }}>
                            Name {sortConfig.key === "Name" && <i className={`fas fa-sort-${sortConfig.direction === "asc" ? "up" : "down"} ms-1`} style={{ fontSize: "8px" }}></i>}
                          </th>
                          <th className="text-center fw-semibold" style={{ fontSize: "10px", padding: "8px 4px", whiteSpace: "nowrap" }}>Vessel</th>
                          <th className="text-center fw-semibold" style={{ fontSize: "10px", padding: "8px 4px", whiteSpace: "nowrap" }}>Shipment Month</th>
                          <th className="text-center fw-semibold" style={{ fontSize: "10px", padding: "8px 4px", whiteSpace: "nowrap" }}>Shipment Period</th>
                          <th className="text-center fw-semibold" style={{ fontSize: "10px", padding: "8px 4px", whiteSpace: "nowrap" }}>Lifting Period</th>
                          <th className="text-center fw-semibold" style={{ fontSize: "10px", padding: "8px 4px", whiteSpace: "nowrap", width: "100px" }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {sortedData.map((item, index) => {
                          const bgColor = index % 2 === 0 ? "#e3f2fd" : "#f0f8ff";
                          const FlagBadge = ({ value }) =>
                            value ? (
                              <span className="badge bg-success" style={{ fontSize: "8px" }}>Yes</span>
                            ) : (
                              <span className="badge bg-secondary" style={{ fontSize: "8px" }}>No</span>
                            );
                          return (
                            <tr key={item.Id || index} className="align-middle" style={{ backgroundColor: bgColor }}>
                              <td className="text-center" style={{ padding: "6px 4px", fontSize: "10px", backgroundColor: bgColor }}>
                                <span className="text-dark fw-semibold">{index + 1}</span>
                              </td>
                              <td className="text-start" style={{ padding: "6px 4px", fontSize: "10px", backgroundColor: bgColor }}>
                                <span className="text-dark fw-bold">{item.Name || "-"}</span>
                              </td>
                              <td className="text-center" style={{ padding: "6px 4px", fontSize: "10px", backgroundColor: bgColor }}>
                                <FlagBadge value={item.IsVessel} />
                              </td>
                              <td className="text-center" style={{ padding: "6px 4px", fontSize: "10px", backgroundColor: bgColor }}>
                                <FlagBadge value={item.IsShipmentMonth} />
                              </td>
                              <td className="text-center" style={{ padding: "6px 4px", fontSize: "10px", backgroundColor: bgColor }}>
                                <FlagBadge value={item.IsShipmentPeriod} />
                              </td>
                              <td className="text-center" style={{ padding: "6px 4px", fontSize: "10px", backgroundColor: bgColor }}>
                                <FlagBadge value={item.IsLiftingPeriod} />
                              </td>
                              <td className="text-center" style={{ padding: "6px 4px", whiteSpace: "nowrap", backgroundColor: bgColor }}>
                                <div className="d-flex gap-1 justify-content-center flex-nowrap">
                                  <Button
                                    color="primary"
                                    size="sm"
                                    onClick={() => btnEditOnClick(item.Id)}
                                    className="btn px-2 py-1"
                                    style={{ borderRadius: "4px", fontSize: "9px", lineHeight: "1.2", whiteSpace: "nowrap", flexShrink: 0 }}
                                  >
                                    <i className="fas fa-edit me-1" style={{ fontSize: "8px" }}></i>
                                    Edit
                                  </Button>
                                  <Button
                                    color="danger"
                                    size="sm"
                                    onClick={() => btnDeleteOnClick(item.Id)}
                                    className="btn px-2 py-1"
                                    style={{ borderRadius: "4px", fontSize: "9px", lineHeight: "1.2", whiteSpace: "nowrap", flexShrink: 0 }}
                                  >
                                    <i className="fas fa-trash me-1" style={{ fontSize: "8px" }}></i>
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

export default PageList_ContractType;
