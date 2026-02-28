import React, { useState, useEffect, useMemo } from "react";
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
  Table,
  FormGroup,
  Label
} from "reactstrap";
import { API_WEB_URLS } from "../../constants/constAPI";
import { useDispatch } from "react-redux";
import { Fn_FillListData, Fn_DeleteData } from "../../store/Functions";
import { toast } from "react-toastify";
import { Download, FileText, Search, Trash2 } from "react-feather";
import ExcelJS from "exceljs";
import useColumnResize from '../../helpers/useColumnResize'
import '../../helpers/columnResize.css'

const LinkRegisterShow = () => {
  const [gridData, setGridData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Column resize feature
  const { columnWidths, handleResizeMouseDown } = useColumnResize('linkRegisterShow_columnWidths', {
      Checkbox: 30,
      CreatedOn: 160,
      Period: 80,
      LinkQty: 100,
      ContractChain: 400,
      Actions: 90,
  })
  const dispatch = useDispatch();

  const API_URL = API_WEB_URLS.MASTER + "/0/token/LinkRegister";
  const API_URL_Delete = API_WEB_URLS.MASTER + "/0/token/DeleteLinkRegister";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Fn_FillListData(dispatch, setGridData, "gridData", API_URL + "/Id/0");
      setLoading(false);
    };

    fetchData();
  }, [dispatch, API_URL]);

  const btnDeleteOnClick = async (Id) => {
    if (window.confirm("Are you sure you want to delete this link register?")) {
      try {
        setLoading(true);
      
        await Fn_FillListData(dispatch, setGridData, "gridData", API_URL_Delete + "/Id/"+Id);
        
        // Refresh data after delete
          await Fn_FillListData(dispatch, setGridData, "gridData", API_URL + "/Id/0");
        toast.success("Link register deleted successfully");
      } catch (error) {
        console.error("Delete error:", error);
        toast.error("Error deleting link register");
      } finally {
          setLoading(false);
      }
    }
  };

  // Function to parse ContractDetails string
  const parseContractDetails = (contractDetails) => {
    if (!contractDetails) return [];
    
    // Split by " -> " to get individual contracts
    const contracts = contractDetails.split(" -> ");
    
    return contracts.map((contract, index) => {
      const parts = contract.split(" || ");
      const contractObj = {};
      
      parts.forEach(part => {
        const [key, value] = part.split(" : ").map(s => s.trim());
        if (key && value) {
          contractObj[key] = value;
        }
      });
      
      return {
        ...contractObj,
        contractIndex: index + 1
      };
    });
  };

  // Group data by LinkRegisterId - one row per chain
  const chainData = useMemo(() => {
    if (!gridData || gridData.length === 0) return [];
    
    return gridData.map((item) => {
      const contracts = parseContractDetails(item.ContractDetails);
      const chainString = contracts.map((contract, index) => {
        const contractNo = contract.ContractNo || "-";
        const contractDate = contract.ContractDate || "-";
        const rate = contract.Rate || "-";
        const sellerName = contract.SellerName || "-";
        const buyerName = contract.BuyerName || "-";
        return `${contractNo} (Date: ${contractDate}, Rate: ${rate}, ${sellerName} → ${buyerName})`;
      }).join(" → ");
      
      return {
        linkRegisterId: item.LinkRegisterId,
        createdOn: item.CreatedOn || item.createdOn || null,
        period: item.Period || item.period || '',
        linkQty: item.LinkQty || 0,
        chainString: chainString,
        contracts: contracts,
        totalContracts: contracts.length
      };
    });
  }, [gridData]);

  // Function to render chain with colored text
  const renderColoredChain = (contracts) => {
    return contracts.map((contract, index) => {
      const contractNo = contract.ContractNo || "-";
      const contractDate = contract.ContractDate || "-";
      const rate = contract.Rate || "-";
      const sellerName = contract.SellerName || "-";
      const buyerName = contract.BuyerName || "-";
      
      return (
        <span key={index}>
          {contractNo} (
          <span style={{ color: '#000000', fontWeight: '600' }}>Date: {contractDate}</span>
          , <span style={{ color: '#000000', fontWeight: '600' }}>Rate: {rate}</span>
          , <span style={{ color: '#dc3545', fontWeight: '600' }}>{sellerName}</span>
          {" → "}
          <span style={{ color: '#28a745', fontWeight: '600' }}>{buyerName}</span>
          )
          {index < contracts.length - 1 && " → "}
        </span>
      );
    });
  };

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return chainData;
    
    const term = searchTerm.toLowerCase();
    return chainData.filter(row => {
      const createdOnStr = row.createdOn 
        ? new Date(row.createdOn).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })
        : '';
      return (
        row.chainString.toLowerCase().includes(term) ||
        String(row.linkRegisterId).includes(term) ||
        String(row.linkQty).includes(term) ||
        createdOnStr.toLowerCase().includes(term)
      );
    });
  }, [chainData, searchTerm]);

  // Auto-select all rows when filtered data changes
  useEffect(() => {
    if (filteredData && filteredData.length > 0) {
      const allIds = filteredData.map(row => row.linkRegisterId);
      setSelectedRows(allIds);
      setSelectAll(true);
    } else {
      setSelectedRows([]);
      setSelectAll(false);
    }
  }, [filteredData.length]);

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    const checked = e.target.checked;
    setSelectAll(checked);
    if (checked) {
      setSelectedRows(filteredData.map(row => row.linkRegisterId));
    } else {
      setSelectedRows([]);
    }
  };

  // Handle individual row selection
  const handleRowSelect = (linkRegisterId) => {
    setSelectedRows(prev => {
      if (prev.includes(linkRegisterId)) {
        const newSelection = prev.filter(id => id !== linkRegisterId);
        setSelectAll(false);
        return newSelection;
      } else {
        const newSelection = [...prev, linkRegisterId];
        if (newSelection.length === filteredData.length) {
          setSelectAll(true);
        }
        return newSelection;
      }
    });
  };

  // Export to Excel
  const handleExcelExport = async () => {
    const selectedData = filteredData.filter(row => selectedRows.includes(row.linkRegisterId));
    
    if (selectedData.length === 0) {
      toast.warning("Please select at least one row to export");
      return;
    }

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Link Register');

      // Define columns
      worksheet.columns = [
        { header: 'Created On', key: 'createdOn', width: 18 },
        { header: 'Period', key: 'period', width: 12 },
        { header: 'Link Qty', key: 'linkQty', width: 12 },
        { header: 'Contract Chain', key: 'chainString', width: 80 }
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '28a745' }
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      // Add data rows (only selected)
      selectedData.forEach((row) => {
        const createdOnFormatted = row.createdOn 
          ? new Date(row.createdOn).toLocaleDateString('en-GB', { 
              day: '2-digit', 
              month: '2-digit', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : '-';
        
        const excelRow = worksheet.addRow({
          createdOn: createdOnFormatted,
          period: row.period || '-',
          linkQty: parseFloat(row.linkQty) || 0,
          chainString: row.chainString
        });

        excelRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } }
          };
        });
        
        // Right align numeric columns
        excelRow.getCell('createdOn').alignment = { horizontal: 'center', vertical: 'middle' };
        excelRow.getCell('period').alignment = { horizontal: 'center', vertical: 'middle' };
        excelRow.getCell('linkQty').alignment = { horizontal: 'right', vertical: 'middle' };
        
        // Wrap text for chain column
        excelRow.getCell('chainString').alignment = { wrapText: true, vertical: 'top' };
      });

      // Generate filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const fileName = `Link_Register_${timestamp}.xlsx`;

      // Save the workbook
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Excel file downloaded: ${fileName}`);
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Error exporting to Excel. Please try again.');
    }
  };

  // Export to PDF
  const handlePDFExport = () => {
    const selectedData = filteredData.filter(row => selectedRows.includes(row.linkRegisterId));
    
    if (selectedData.length === 0) {
      toast.warning("Please select at least one row to export");
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    
    if (printWindow) {
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Link Register Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 12px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .header h1 {
              margin: 0;
              color: #333;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0;
              color: #666;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
              font-size: 11px;
            }
            th {
              background-color: #28a745;
              color: white;
              font-weight: bold;
              text-align: center;
            }
            .text-center { text-align: center; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Link Register Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th class="text-center">Created On</th>
                <th class="text-center">Period</th>
                <th class="text-center">Link Qty</th>
                <th>Contract Chain</th>
              </tr>
            </thead>
            <tbody>
              ${selectedData.map(row => {
                const createdOnFormatted = row.createdOn 
                  ? new Date(row.createdOn).toLocaleDateString('en-GB', { 
                      day: '2-digit', 
                      month: '2-digit', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : '-';
                return `
                <tr>
                  <td class="text-center">${createdOnFormatted}</td>
                  <td class="text-center">${row.period || '-'}</td>
                  <td class="text-end">${row.linkQty ? parseFloat(row.linkQty).toLocaleString() : '0'}</td>
                  <td>${row.chainString}</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `;
      
      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
      };
    }
  };

  if (loading) {
    return (
      <div className="page-content">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
              <Spinner color="primary" size="lg" className="mb-3">
                Loading...
              </Spinner>
              <p className="text-muted">Loading link register data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div >
      <div className="container-fluid">
        {/* Page Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="page-title-box d-flex align-items-center justify-content-between">
              <h4 className="mb-0 text-primary fw-semibold">
                <i className="fas fa-link me-2"></i>
                Link Register Show
              </h4>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <Row>
          <Col lg="12">
            <Card className="shadow-sm border-0">
              <CardHeader className="bg-primary text-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 fw-semibold">
                    <i className="fas fa-list me-2"></i>
                    Link Register Report
                  </h5>
                  <div className="d-flex gap-2">
                    <Button
                      color="success"
                      size="sm"
                      onClick={handleExcelExport}
                      className="fw-semibold"
                      style={{
                        borderRadius: '6px',
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <Download className="me-2" size={14} />
                      Export Excel
                    </Button>
                  <Button
                      color="danger"
                    size="sm"
                      onClick={handlePDFExport}
                    className="fw-semibold"
                    style={{
                      borderRadius: '6px',
                      transition: 'all 0.3s ease'
                    }}
                  >
                      <FileText className="me-2" size={14} />
                      Export PDF
                  </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="p-4">
                {/* Search Section */}
                <Row className="mb-4">
                  <Col lg="6" md="8" sm="12" className="mb-3">
                    <div className="search-box position-relative">
                      <Input
                        type="text"
                        className="form-control form-control-lg border-2"
                        placeholder="Search by Contract No, Seller, Buyer, Created On, or Link Qty..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                          borderRadius: '8px',
                          paddingLeft: '45px',
                          borderColor: '#e9ecef',
                          transition: 'all 0.3s ease'
                        }}
                      />
                      <Search 
                        className="position-absolute"
                        style={{
                          left: '15px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          color: '#6c757d',
                          zIndex: 10
                        }}
                        size={18}
                      />
                    </div>
                  </Col>
                </Row>

                {/* Data Table */}
                {filteredData.length === 0 ? (
                  <Alert color="info" className="text-center">
                    <i className="fas fa-info-circle me-2"></i>
                    No data available.
                  </Alert>
                ) : (
                    <div className="table-responsive">
                    <Table bordered hover className="mb-0 resizable-table" style={{ tableLayout: 'fixed' }}>
                      <thead className="table-success">
                        <tr>
                          <th className="text-center" style={{ width: `${columnWidths.Checkbox}px`, padding: '8px 4px', position: 'relative', overflow: 'hidden' }}>
                            <Input
                              type="checkbox"
                              checked={selectAll}
                              onChange={handleSelectAll}
                              title="Select All"
                            />
                            <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Checkbox')} onTouchStart={e => handleResizeMouseDown(e, 'Checkbox')} />
                          </th>
                          <th className="text-center" style={{ width: `${columnWidths.CreatedOn}px`, position: 'relative', overflow: 'hidden' }}>
                            Created On
                            <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'CreatedOn')} onTouchStart={e => handleResizeMouseDown(e, 'CreatedOn')} />
                          </th>
                          <th className="text-center" style={{ width: `${columnWidths.Period}px`, position: 'relative', overflow: 'hidden' }}>
                            Period
                            <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Period')} onTouchStart={e => handleResizeMouseDown(e, 'Period')} />
                          </th>
                          <th className="text-center" style={{ width: `${columnWidths.LinkQty}px`, position: 'relative', overflow: 'hidden' }}>
                            Link Qty
                            <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'LinkQty')} onTouchStart={e => handleResizeMouseDown(e, 'LinkQty')} />
                          </th>
                          <th style={{ width: `${columnWidths.ContractChain}px`, position: 'relative', overflow: 'hidden' }}>
                            Contract Chain
                            <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'ContractChain')} onTouchStart={e => handleResizeMouseDown(e, 'ContractChain')} />
                          </th>
                          <th className="text-center" style={{ width: `${columnWidths.Actions}px`, position: 'relative', overflow: 'hidden' }}>
                            Actions
                            <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Actions')} onTouchStart={e => handleResizeMouseDown(e, 'Actions')} />
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.map((row, index) => (
                          <tr key={`${row.linkRegisterId}-${index}`}>
                            <td className="text-center" style={{ width: '30px', padding: '8px 4px' }}>
                              <Input
                                type="checkbox"
                                checked={selectedRows.includes(row.linkRegisterId)}
                                onChange={() => handleRowSelect(row.linkRegisterId)}
                                onClick={e => e.stopPropagation()}
                              />
                            </td>
                            <td className="text-center fw-semibold" style={{ width: '160px', minWidth: '160px' }}>
                              {row.createdOn 
                                ? new Date(row.createdOn).toLocaleDateString('en-GB', { 
                                    day: '2-digit', 
                                    month: '2-digit', 
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'}
                            </td>
                            <td className="text-center fw-semibold" style={{ width: '80px', minWidth: '80px' }}>
                              {row.period || '-'}
                            </td>
                            <td className="text-center fw-semibold" style={{ width: '100px', minWidth: '100px' }}>
                              {row.linkQty ? parseFloat(row.linkQty).toLocaleString() : '0'}
                            </td>
                            <td style={{ wordBreak: 'break-word' }}>
                              <span className="fw-semibold">
                                {renderColoredChain(row.contracts)}
                              </span>
                            </td>
                            <td className="text-center" style={{ width: '90px', minWidth: '90px' }}>
                              <Button
                                color="danger"
                                size="sm"
                                onClick={() => btnDeleteOnClick(row.linkRegisterId)}
                                className="px-2 py-1"
                                style={{
                                  borderRadius: '6px',
                                  transition: 'all 0.3s ease'
                                }}
                                title="Delete Link Register"
                              >
                                <Trash2 size={14} />
                              </Button>
                            </td>
                            </tr>
                          ))}
                        </tbody>
                    </Table>
                    </div>
                )}

                {/* Summary */}
                {filteredData.length > 0 && (
                  <div className="mt-3 text-muted small">
                    <strong>Total Link Registers:</strong> {filteredData.length} | 
                    <strong> Selected:</strong> {selectedRows.length} |
                    <strong> Total Contracts:</strong> {filteredData.reduce((sum, row) => sum + row.totalContracts, 0)} |
                    <strong> Total Link Qty:</strong> {filteredData.reduce((sum, row) => sum + (parseFloat(row.linkQty) || 0), 0).toLocaleString()}
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

export default LinkRegisterShow;
