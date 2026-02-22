import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Container, Row, Col, Form, Button, Table, Pagination } from "react-bootstrap";
import "./DalaliReport.css";
import { API_WEB_URLS } from "constants/constAPI";
import { Fn_GetReport, Fn_DisplayData, Fn_FillListData } from "store/Functions";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import Breadcrumbs from "../../components/Common/Breadcrumb";

function DalaliReport() {
  const dispatch = useDispatch();

  // Get global dates from Redux store
  const globalDates = useSelector(state => state.GlobalDates);
  
  // Set default dates from global state
  const defaultFromDate = new Date(globalDates.fromDate);
  const defaultToDate = new Date(globalDates.toDate);

  const [fromDate, setFromDate] = useState(defaultFromDate);
  const [toDate, setToDate] = useState(defaultToDate);
 
  const [showTable, setShowTable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20); // Show 20 items per page
  const [state, setState] = useState({
    FillArray: [],
    LedgerArray: [],
    FromDate: globalDates.fromDate,
    ToDate: globalDates.toDate,   
  });

  const API_URL_Get = `${API_WEB_URLS.LedgerDalaliCalculation}/0/token`
  const API_URL = API_WEB_URLS.MASTER + "/0/token/LedgerReportMaster"

  useEffect(() => {
    Fn_FillListData(
      dispatch,
      setState,
      "LedgerArray",
      API_URL + "/Id/0"
    )
  }, [])
   
  // handlers
  const handleShow = () => setShowTable(true);
  const handleClear = () => {
    setFromDate(defaultFromDate);
    setToDate(defaultToDate);
    setState(prevState => ({
      ...prevState,
      FromDate: defaultFromDate,
      ToDate: defaultToDate
    }));
    setShowTable(false);
    setCurrentPage(1);
  };
  const handleExit = () => {
    window.close(); // or redirect to home
  };
  
  const handlePrint = () => {
    // Open a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (printWindow) {
      // Create the print content with all data
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dalali Report - Print</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              font-size: 12px;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
            }
            .print-header h1 {
              margin: 0;
              color: #333;
              font-size: 24px;
            }
            .print-header .date-range {
              margin-top: 10px;
              font-size: 16px;
              color: #666;
            }
            .print-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .print-table th,
            .print-table td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: center;
              font-size: 11px;
            }
            .print-table th {
              background-color: #f5f5f5;
              font-weight: bold;
            }
            .print-table tbody tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .print-summary {
              margin-top: 30px;
              padding: 20px;
              border: 1px solid #ddd;
              background-color: #f9f9f9;
            }
            .print-summary h3 {
              margin-top: 0;
              color: #333;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              margin: 10px 0;
              font-weight: bold;
            }
            .text-end {
              text-align: right;
            }
            .fw-bold {
              font-weight: bold;
            }
            @media print {
              body { margin: 0; }
              .print-header { margin-bottom: 20px; }
              .print-table { font-size: 10px; }
              .print-table th,
              .print-table td { padding: 6px; }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Dalali Report</h1>
            <div class="date-range">
              From: ${fromDate.toLocaleDateString('en-GB')} To: ${toDate.toLocaleDateString('en-GB')}
            </div>
            <div>Generated on: ${new Date().toLocaleString('en-GB')}</div>
          </div>
          
          <table class="print-table">
            <thead>
              <tr>
                <th>Ledger Name</th>
                <th>Total Seller Qty</th>
                <th>Total Seller Amount</th>
                <th>Total Buyer Qty</th>
                <th>Total Buyer Amount</th>
                <th>Dalali Rate</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${state.FillArray && state.FillArray.length > 0 ? 
                state.FillArray.map(row => `
                  <tr>
                    <td class="fw-bold">${row.LedgerName || ''}</td>
                    <td class="text-end">${row.TotalSellerQty?.toLocaleString() || '0'}</td>
                    <td class="text-end">₹${row.TotalSellerAmount?.toLocaleString() || '0'}</td>
                    <td class="text-end">${row.TotalBuyerQty?.toLocaleString() || '0'}</td>
                    <td class="text-end">₹${row.TotalBuyerAmount?.toLocaleString() || '0'}</td>
                    <td class="text-end">${row.DalaliRate || '0'}</td>
                    <td class="text-end fw-bold">₹${row.Total?.toLocaleString() || '0'}</td>
                  </tr>
                `).join('') : 
                '<tr><td colspan="7" style="text-align: center;">No data available</td></tr>'
              }
            </tbody>
          </table>
          
          ${state.FillArray && state.FillArray.length > 0 ? `
            <div class="print-summary">
              <h3>Report Summary</h3>
              <div class="summary-row">
                <span>Total Records:</span>
                <span>${state.FillArray.length}</span>
              </div>
              <div class="summary-row">
                <span>Total Seller Quantity:</span>
                <span>${state.FillArray.reduce((sum, row) => sum + (row.TotalSellerQty || 0), 0).toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>Total Seller Amount:</span>
                <span>₹${state.FillArray.reduce((sum, row) => sum + (row.TotalSellerAmount || 0), 0).toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>Total Buyer Quantity:</span>
                <span>${state.FillArray.reduce((sum, row) => sum + (row.TotalBuyerQty || 0), 0).toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>Total Buyer Amount:</span>
                <span>₹${state.FillArray.reduce((sum, row) => sum + (row.TotalBuyerAmount || 0), 0).toLocaleString()}</span>
              </div>
              <div class="summary-row">
                <span>Total Dalali Amount:</span>
                <span>₹${state.FillArray.reduce((sum, row) => sum + (row.Total || 0), 0).toLocaleString()}</span>
              </div>
            </div>
          ` : ''}
        </body>
        </html>
      `;
      
      // Write content to the new window
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load, then print
      printWindow.onload = function() {
        setTimeout(() => {
          printWindow.print();
          // Close the window after printing (optional)
          // printWindow.close();
        }, 500);
      };
    } else {
      // Fallback if popup is blocked
      toast.error("Please allow popups to print the report");
    }
  };

  const handleSubmit = async e => {
    e.preventDefault()

    if (!fromDate || !toDate) {
      toast.error("Please select both from and to dates");
      return;
    }

    setLoading(true);

    try {
      let vformData = new FormData()
   
      vformData.append("FromDate", fromDate.toISOString().split("T")[0] || "")
      vformData.append("ToDate", toDate.toISOString().split("T")[0] || "")
       
      await Fn_GetReport(
        dispatch,
        setState,
        "FillArray",
        API_URL_Get,
        { arguList: { id: 0, formData: vformData } },
        true
      )

      setShowReport(true)
      setShowTable(true)
      setCurrentPage(1); // Reset to first page when new data loads
      toast.success("Report generated successfully")
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = state.FillArray ? state.FillArray.slice(indexOfFirstItem, indexOfLastItem) : [];
  const totalPages = state.FillArray ? Math.ceil(state.FillArray.length / itemsPerPage) : 0;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderPaginationItems = () => {
    const items = [];
    
    // Previous button
    items.push(
      <Pagination.Prev 
        key="prev" 
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
      />
    );

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let number = startPage; number <= endPage; number++) {
      items.push(
        <Pagination.Item
          key={number}
          active={number === currentPage}
          onClick={() => handlePageChange(number)}
        >
          {number}
        </Pagination.Item>
      );
    }

    // Next button
    items.push(
      <Pagination.Next 
        key="next" 
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      />
    );

    return items;
  };

  return (
    <div className="dalali-report-container">
      {/* Sticky Header */}
      <div className="sticky-header">
        <div className="header-spacer"></div>
        <Breadcrumbs title={"Dalali Report"} />
        
        {/* Report Controls */}
        <div className="report-controls">
          <Container fluid>
            <Row className="g-3">
              <Col lg={2} md={3} sm={6}>
                <Form.Label className="control-label">From Date</Form.Label>
                <DatePicker
                  selected={fromDate}
                  onChange={(date) => {
                    setFromDate(date);
                    setState(prevState => ({
                      ...prevState,
                      FromDate: date
                    }));
                  }}
                  className="form-control form-control-sm"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select from date"
                  portalId="root-portal"
                  popperPlacement="bottom-start"
                  openToDate={new Date()}
                />
              </Col>

              <Col lg={2} md={3} sm={6}>
                <Form.Label className="control-label">To Date</Form.Label>
                <DatePicker
                  selected={toDate}
                  onChange={(date) => {
                    setToDate(date);
                    setState(prevState => ({
                      ...prevState,
                      ToDate: date
                    }));
                  }}
                  className="form-control form-control-sm"
                  dateFormat="dd/MM/yyyy"
                  placeholderText="Select to date"
                  portalId="root-portal"
                  popperPlacement="bottom-start"
                  openToDate={new Date()}
                />
              </Col>

              <Col lg={5} md={2} sm={12} className="d-flex align-items-end">
                <div className="button-group">
                  <Button variant="primary" size="sm" className="me-2" onClick={handleSubmit} disabled={loading}>
                    <i className="fas fa-eye me-1"></i>{loading ? 'Loading...' : 'Show'}
                  </Button>
                  <Button variant="secondary" size="sm" className="me-2" onClick={handleClear}>
                    <i className="fas fa-eraser me-1"></i>Clear
                  </Button>
                  <Button variant="success" size="sm" className="me-2" onClick={handlePrint}>
                    <i className="fas fa-print me-1"></i>Print
                  </Button>
                  <Button variant="danger" size="sm" onClick={handleExit}>
                    <i className="fas fa-times me-1"></i>Exit
                  </Button>
                </div>
              </Col>
            </Row>
          </Container>
        </div>
      </div>

      {/* Scrollable Table Area */}
      {showTable && (
        <div className="table-scroll-area">
          <div className="table-container">
            <Table className="full-page-table" striped bordered hover>
              <thead className="table-header">
                <tr>
                  <th className="text-center">Ledger Name</th>
                  <th className="text-center">Total Seller Qty</th>
                  <th className="text-center">Total Seller Amount</th>
                  <th className="text-center">Total Buyer Qty</th>
                  <th className="text-center">Total Buyer Amount</th>
                  <th className="text-center">Dalali Rate</th>
                  <th className="text-center">Total</th>
                </tr>
              </thead>
              <tbody>
                {currentItems && currentItems.length > 0 ? (
                  currentItems.map((row, i) => (
                    <tr key={i}>
                      <td className="fw-bold">{row.LedgerName}</td>
                      <td className="text-end">{row.TotalSellerQty?.toLocaleString() || '0'}</td>
                      <td className="text-end">₹{row.TotalSellerAmount?.toLocaleString() || '0'}</td>
                      <td className="text-end">{row.TotalBuyerQty?.toLocaleString() || '0'}</td>
                      <td className="text-end">₹{row.TotalBuyerAmount?.toLocaleString() || '0'}</td>
                      <td className="text-end">{row.DalaliRate || '0'}</td>
                      <td className="text-end fw-bold">₹{row.Total?.toLocaleString() || '0'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center">No data available</td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>

          {/* Pagination */}
          {state.FillArray && state.FillArray.length > itemsPerPage && (
            <div className="pagination-container">
              <div className="pagination-info">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, state.FillArray.length)} of {state.FillArray.length} entries
              </div>
              <Pagination className="justify-content-center">
                {renderPaginationItems()}
              </Pagination>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DalaliReport;