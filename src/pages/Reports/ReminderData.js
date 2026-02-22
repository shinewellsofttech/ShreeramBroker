import { API_WEB_URLS } from 'constants/constAPI';
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { Fn_GetReport } from 'store/Functions';
import { useDispatch, useSelector } from 'react-redux';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import {
  Container,
  Row,
  Col,
  Form,
  Table,
  Card,
  Spinner,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "react-bootstrap";
import { toast } from "react-toastify";
import { Calendar, FileText } from "react-feather";
import ExcelJS from 'exceljs';
import { Button } from "react-bootstrap";
import EditContract from "../Transaction/EditContract";
import jsPDF from 'jspdf';
import { applyPlugin as applyAutoTable } from 'jspdf-autotable';
applyAutoTable(jsPDF);

function ReminderData({ hideDateFilters = false, onTotalChange }) {
  const dispatch = useDispatch();
  
  // Get global dates from Redux store
  const globalDates = useSelector(state => state.GlobalDates);

  const [state, setState] = useState({
    FillArray: [],
    isProgress: false,
  });

  const [fromDate, setFromDate] = useState(new Date(globalDates.fromDate));
  const [toDate, setToDate] = useState(new Date(globalDates.toDate));
  // Separate boolean states for each filter checkbox (like ContractRegister)
  const [dep, setDep] = useState(true); // Filter 4
  const [shipMon, setShipMon] = useState(false); // Filter 1
  const [lift, setLift] = useState(false); // Filter 3
  const [shipPd, setShipPd] = useState(false); // Filter 2
  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  
  // PDF Remarks Modal state
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [pendingShareFile, setPendingShareFile] = useState(null);
  const [showSharePDFModal, setShowSharePDFModal] = useState(false);
  
  // Modal state for EditContract
  const [showEditContractModal, setShowEditContractModal] = useState(false);
  const [selectedContractData, setSelectedContractData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  const API_URL_Get = `${API_WEB_URLS.ReminderData}/0/token`;

  // Helper function to format date in local time (YYYY-MM-DD)
  const formatDateLocal = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const fetchData = useCallback(async () => {
    if (!fromDate || !toDate) {
      return;
    }

    // Determine which filter is selected (only one can be selected at a time)
    let filterValue = 0;
    if (dep) filterValue = 4;
    else if (shipMon) filterValue = 1;
    else if (lift) filterValue = 3;
    else if (shipPd) filterValue = 2;

    // If no filter is selected, clear data
    if (filterValue === 0) {
      setState(prev => ({ ...prev, FillArray: [] }));
      setShowTable(false);
      return;
    }

    setLoading(true);
    setShowTable(false);
    
    try {
      const formData = new FormData();
      formData.append("Filter", filterValue);
      formData.append("FromDate", formatDateLocal(fromDate));
      formData.append("ToDate", formatDateLocal(toDate));
      
      await Fn_GetReport(
        dispatch, 
        setState, 
        "FillArray", 
        API_URL_Get, 
        { arguList: { id: 0, formData: formData } }, 
        true
      );
      
      setShowTable(true);
    } catch (error) {
      console.error("Error fetching reminder data:", error);
      setState(prev => ({ ...prev, FillArray: [] }));
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, dep, shipMon, lift, shipPd, dispatch]);

  useEffect(() => {
    if (state.FillArray && state.FillArray.length > 0) {
      setShowTable(true);
    }
  }, [state.FillArray]);

  // Auto-fetch data on mount and when filters change
  useEffect(() => {
    if (fromDate && toDate) {
      fetchData();
    }
  }, [fetchData]);

  // Auto-cycle through checkboxes every 1 minute: Dep → ShipMon → Lift → ShipPd → Dep (repeat)
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Determine current selection and move to next in sequence
      if (dep) {
        // Dep → ShipMon
        setDep(false);
        setShipMon(true);
        setLift(false);
        setShipPd(false);
      } else if (shipMon) {
        // ShipMon → Lift
        setDep(false);
        setShipMon(false);
        setLift(true);
        setShipPd(false);
      } else if (lift) {
        // Lift → ShipPd
        setDep(false);
        setShipMon(false);
        setLift(false);
        setShipPd(true);
      } else if (shipPd) {
        // ShipPd → Dep
        setDep(true);
        setShipMon(false);
        setLift(false);
        setShipPd(false);
      } else {
        // If none selected, start with Dep
        setDep(true);
        setShipMon(false);
        setLift(false);
        setShipPd(false);
      }
    }, 60000); // 1 minute = 60000 milliseconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(intervalId);
    };
  }, [dep, shipMon, lift, shipPd]);

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

  // Filter and sort table data
  const filteredTableData = useMemo(() => {
    if (!state.FillArray) return [];
    
    let filtered = [...state.FillArray];
    
    // Apply sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key] || '';
        const bValue = b[sortConfig.key] || '';
        
        // Handle numeric sorting for ContractNo, Qty, Rate, etc.
        if (sortConfig.key === 'ContractNo' || sortConfig.key === 'Qty' || sortConfig.key === 'Rate' || sortConfig.key === 'AdvPayment') {
          const aNum = parseFloat(aValue) || 0;
          const bNum = parseFloat(bValue) || 0;
          if (aNum < bNum) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aNum > bNum) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }
        
        // Handle date sorting
        if (sortConfig.key === 'ContractDate') {
          const aDate = new Date(aValue);
          const bDate = new Date(bValue);
          if (aDate < bDate) {
            return sortConfig.direction === 'asc' ? -1 : 1;
          }
          if (aDate > bDate) {
            return sortConfig.direction === 'asc' ? 1 : -1;
          }
          return 0;
        }
        
        // String sorting
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [state.FillArray, sortConfig]);

  // Function to determine row background color based on lifted quantity
  const getRowBackgroundColor = (row) => {
    const qty = parseFloat(row.Qty) || 0;
    const totalLifted = parseFloat(row.TotalLifted) || 0;
    
    if (qty > 0 && totalLifted === qty) {
      return '#d1ecf1'; // Light blue - fully lifted
    } else if (qty > 0 && totalLifted === 0) {
      return '#e9ecef'; // Light grey - not lifted
    } else if (qty > 0 && totalLifted > 0 && totalLifted < qty) {
      return '#f8d7da'; // Light red - partially lifted
    }
    return 'white'; // Default white background
  };

  // Function to get Period value
  const getPeriodValue = (row) => {
    if (row.MonthName) {
      return row.MonthName;
    } else if (row.ShipmentFromDate && row.ShipmentToDate) {
      return `${new Date(row.ShipmentFromDate).toLocaleDateString()} - ${new Date(row.ShipmentToDate).toLocaleDateString()}`;
    } else if (row.LiftedFromDate && row.LiftedToDate) {
      return `${new Date(row.LiftedFromDate).toLocaleDateString()} - ${new Date(row.LiftedToDate).toLocaleDateString()}`;
    }
    return '-';
  };

  // Calculate totals
  const totals = useMemo(() => {
    if (!state.FillArray || state.FillArray.length === 0) {
      if (onTotalChange) {
        onTotalChange(0);
      }
      return { totalQty: 0, totalContracts: 0, totalParties: 0 };
    }

    const uniqueParties = new Set();
    state.FillArray.forEach(item => {
      if (item.SellerLedger) uniqueParties.add(item.SellerLedger);
      if (item.BuyerLedger) uniqueParties.add(item.BuyerLedger);
    });

    const totalQty = state.FillArray.reduce((sum, item) => {
      return sum + (parseFloat(item.Qty) || 0);
    }, 0);

    // Call callback with total quantity (without comma) if provided
    if (onTotalChange) {
      onTotalChange(totalQty);
    }

    return {
      totalQty: totalQty.toLocaleString(),
      totalContracts: state.FillArray.length,
      totalParties: uniqueParties.size,
    };
  }, [state.FillArray, onTotalChange]);

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <span style={{ opacity: 0.3 }}>⇅</span>;
    }
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  // Get unique row identifier
  const getRowIdentifier = (row) => {
    if (row.Id !== undefined && row.Id !== null) {
      return String(row.Id);
    }
    // Fallback to combination of unique fields
    return `${row.ContractNo || 'NA'}_${row.ContractDate || 'NA'}_${row.SellerLedger || 'NA'}_${row.BuyerLedger || 'NA'}`;
  };

  // Handle row selection
  const handleRowSelect = (rowId) => {
    if (!rowId) return;
    setSelectedRows(prev => {
      if (prev.includes(rowId)) {
        return prev.filter(id => id !== rowId);
      } else {
        return [...prev, rowId];
      }
    });
  };

  // Excel Export
  const handleExcelExport = async () => {
    if (!filteredTableData || filteredTableData.length === 0) {
      toast.warning("No data to export");
      return;
    }

    if (selectedRows.length === 0) {
      toast.warning("Please select at least one row to export");
      return;
    }

    const selectedData = filteredTableData.filter(row => selectedRows.includes(getRowIdentifier(row)));

    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Reminder Data');

      // Define columns
      worksheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Contract No', key: 'contractNo', width: 15 },
        { header: 'Seller', key: 'seller', width: 20 },
        { header: 'Buyer', key: 'buyer', width: 20 },
        { header: 'Item', key: 'item', width: 15 },
        { header: 'Deposit', key: 'deposit', width: 12 },
        { header: 'Qty', key: 'qty', width: 12 },
        { header: 'Rate', key: 'rate', width: 12 },
        { header: 'Period', key: 'period', width: 20 }
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '28a745' } // Green background
      };
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
      headerRow.height = 25;

      // Add data rows
      selectedData.forEach((row, index) => {
        const dataRow = worksheet.addRow({
          date: row.ContractDate ? new Date(row.ContractDate).toLocaleDateString() : '-',
          contractNo: row.ContractNo || '-',
          seller: row.SellerLedger || '-',
          buyer: row.BuyerLedger || '-',
          item: row.ItemTypeName || '-',
          deposit: row.AdvPayment || '0',
          qty: row.Qty || '0',
          rate: `₹${row.Rate || '0'}`,
          period: getPeriodValue(row)
        });

        // Apply background color based on lifted status
        const bgColor = getRowBackgroundColor(row);
        if (bgColor !== 'white') {
          const colorMap = {
            '#d1ecf1': 'D1ECF1', // Light blue
            '#e9ecef': 'E9ECEF', // Light grey
            '#f8d7da': 'F8D7DA'  // Light red
          };
          dataRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: colorMap[bgColor] || 'FFFFFF' }
          };
        }
      });

      // Generate buffer
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const fileName = `ReminderData_${new Date().toISOString().split('T')[0]}.xlsx`;
      
      // Share or download
      const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      if (navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Reminder Data Report',
              text: 'Please find attached the Reminder Data Report',
              files: [file]
            });
            toast.success('Excel file shared successfully!');
            return;
          }
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.error('Share error:', shareError);
          }
          // Continue to download fallback
        }
      }
      
      // Fallback: download the Excel file
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      if (navigator.share) {
        toast.success(`Excel file downloaded. Share feature is available on mobile devices.`);
      } else {
        toast.success(`Excel file downloaded: ${fileName}`);
      }
    } catch (error) {
      console.error('Excel export error:', error);
      toast.error('Error exporting to Excel. Please try again.');
    }
  };

  // PDF Export - Open Remarks Modal
  const handlePDFExport = () => {
    if (!filteredTableData || filteredTableData.length === 0) {
      toast.warning("No data to export");
      return;
    }

    if (selectedRows.length === 0) {
      toast.warning("Please select at least one row to export");
      return;
    }

    // Open remarks modal
    setRemarks('');
    setShowRemarksModal(true);
  };

  // Generate PDF with jsPDF + jspdf-autotable, then share
  const handleGeneratePDF = async () => {
    if (!filteredTableData || filteredTableData.length === 0) {
      toast.warning("No data to export");
      return;
    }

    if (selectedRows.length === 0) {
      toast.warning("Please select at least one row to export");
      return;
    }

    const selectedData = filteredTableData.filter(row => selectedRows.includes(getRowIdentifier(row)));

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const filename = `ReminderData_${new Date().toISOString().split('T')[0]}.pdf`;

      doc.setFontSize(18);
      doc.text('Reminder Data Report', 14, 15);
      doc.setFontSize(10);
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 14, 22);
      doc.text(`Total Records: ${selectedData.length}`, 14, 27);

      const head = [['Date', 'Contract No', 'Seller', 'Buyer', 'Item', 'Deposit', 'Qty', 'Rate', 'Period']];
      const body = selectedData.map(row => [
        row.ContractDate ? new Date(row.ContractDate).toLocaleDateString() : '-',
        row.ContractNo || '-',
        row.SellerLedger || '-',
        row.BuyerLedger || '-',
        row.ItemTypeName || '-',
        String(row.AdvPayment || '0'),
        String(row.Qty || '0'),
        `₹${row.Rate || '0'}`,
        getPeriodValue(row)
      ]);

      doc.autoTable({
        head,
        body,
        startY: 32,
        margin: { left: 14 },
        styles: { fontSize: 8 },
        headStyles: { fillColor: [40, 167, 69] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40;

      if (remarks && remarks.trim()) {
        doc.setFontSize(12);
        doc.text('Remarks', 14, finalY);
        finalY += 6;
        doc.setFontSize(10);
        const splitRemarks = doc.splitTextToSize(remarks.trim(), 180);
        doc.text(splitRemarks, 14, finalY);
      }

      const pdfBlob = doc.output('blob');
      setShowRemarksModal(false);
      setRemarks('');

      const file = new File([pdfBlob], filename, { type: 'application/pdf' });

      if (navigator.share) {
        setPendingShareFile(file);
        setShowSharePDFModal(true);
      } else {
        toast.warning('Share not available on this device. Use a mobile device or browser that supports sharing.');
      }
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Error generating PDF. Please try again.');
      setShowRemarksModal(false);
    }
  };

  const handleSharePDFClick = async () => {
    if (!pendingShareFile || !navigator.share) return;
    try {
      await navigator.share({
        title: 'Reminder Data Report',
        text: 'Please find attached the Reminder Data Report',
        files: [pendingShareFile]
      });
      toast.success('PDF shared successfully!');
      setShowSharePDFModal(false);
      setPendingShareFile(null);
    } catch (shareError) {
      if (shareError.name === 'AbortError') {
        toast.info('Share cancelled.');
      } else {
        console.error('Share error:', shareError);
        toast.error('Share failed. Try again.');
      }
      setShowSharePDFModal(false);
      setPendingShareFile(null);
    }
  };

  // Modal functions for EditContract
  const openEditContractModal = (contractData) => {
    setSelectedContractData(contractData);
    setShowEditContractModal(true);
    setModalLoading(true);

    // Set loading to false after a short delay
    setTimeout(() => {
      setModalLoading(false);
    }, 1000);
  };

  const closeEditContractModal = () => {
    setShowEditContractModal(false);
    setSelectedContractData(null);
    setModalLoading(false);
    // Refresh the data after closing modal
    fetchData();
  };

  return (
    <div style={hideDateFilters ? { margin: 0, padding: 0 } : {}}>
      <Container fluid style={hideDateFilters ? { margin: 0, padding: 0 } : {}}>
        <Row style={hideDateFilters ? { margin: 0 } : {}}>
          <Col style={hideDateFilters ? { margin: 0, padding: 0 } : {}}>
            <Card style={hideDateFilters ? { margin: 0, border: 'none' } : {}}>
              <Card.Body style={hideDateFilters ? { margin: 0, padding: 0 } : {}}>
                {/* Filters Section */}
                {!hideDateFilters && (
                  <div style={{ overflowX: "auto", overflowY: "hidden" }}>
                    <Row className="g-2 align-items-end mb-3" style={{ flexWrap: "nowrap", minWidth: "fit-content" }}>
                      <Col xs="auto" style={{ flex: "0 0 auto" }}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-1 small">
                            <Calendar className="feather-icon me-1" size={14} />
                            From Date
                          </Form.Label>
                          <div style={{ width: '120px', height: '28px' }}>
                            <DatePicker
                              selected={fromDate}
                              onChange={(date) => setFromDate(date)}
                              dateFormat="dd/MM/yyyy"
                              className="form-control form-control-sm"
                              maxDate={toDate}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs="auto" style={{ flex: "0 0 auto" }}>
                        <Form.Group>
                          <Form.Label className="fw-semibold mb-1 small">
                            <Calendar className="feather-icon me-1" size={14} />
                            To Date
                          </Form.Label>
                          <div style={{ width: '120px', height: '28px' }}>
                            <DatePicker
                              selected={toDate}
                              onChange={(date) => setToDate(date)}
                              dateFormat="dd/MM/yyyy"
                              className="form-control form-control-sm"
                              minDate={fromDate}
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs="auto" style={{ flex: "0 0 auto" }}>
                        <Form.Group>
                          <div className="d-flex gap-2" style={{ whiteSpace: 'nowrap' }}>
                            <Form.Check
                              type="checkbox"
                              label="Dep"
                              checked={dep}
                              onClick={e => {
                                e.stopPropagation();
                                setDep(true);
                                setShipMon(false);
                                setLift(false);
                                setShipPd(false);
                              }}
                              onChange={() => {}}
                              id="filter-dep"
                              className="form-check-sm"
                            />
                            <Form.Check
                              type="checkbox"
                              label="ShipMon"
                              checked={shipMon}
                              onClick={e => {
                                e.stopPropagation();
                                setDep(false);
                                setShipMon(true);
                                setLift(false);
                                setShipPd(false);
                              }}
                              onChange={() => {}}
                              id="filter-shipmon"
                              className="form-check-sm"
                            />
                            <Form.Check
                              type="checkbox"
                              label="Lift"
                              checked={lift}
                              onClick={e => {
                                e.stopPropagation();
                                setDep(false);
                                setShipMon(false);
                                setLift(true);
                                setShipPd(false);
                              }}
                              onChange={() => {}}
                              id="filter-lift"
                              className="form-check-sm"
                            />
                            <Form.Check
                              type="checkbox"
                              label="ShipPd"
                              checked={shipPd}
                              onClick={e => {
                                e.stopPropagation();
                                setDep(false);
                                setShipMon(false);
                                setLift(false);
                                setShipPd(true);
                              }}
                              onChange={() => {}}
                              id="filter-shippd"
                              className="form-check-sm"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs="auto" style={{ flex: "0 0 auto" }}>
                        <Form.Group>
                          <div className="d-flex gap-2 align-items-end" style={{ marginLeft: '20px' }}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={handlePDFExport}
                              disabled={selectedRows.length === 0}
                              title="Export to PDF"
                            >
                              <FileText size={16} />
                            </Button>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}
                
                {/* Filter Type Only (when date filters are hidden) */}
                {hideDateFilters && (
                  <div style={{ overflowX: "auto", overflowY: "hidden", margin: 0, padding: 0, marginBottom: '0.5rem' }}>
                    <Row className="g-2 align-items-end" style={{ flexWrap: "nowrap", minWidth: "fit-content", margin: 0 }}>
                      <Col xs="auto" style={{ flex: "0 0 auto", margin: 0, padding: 0 }}>
                        <Form.Group>
                          <div className="d-flex gap-2" style={{ whiteSpace: 'nowrap' }}>
                            <Form.Check
                              type="checkbox"
                              label="Dep"
                              checked={dep}
                              onClick={e => {
                                e.stopPropagation();
                                setDep(true);
                                setShipMon(false);
                                setLift(false);
                                setShipPd(false);
                              }}
                              onChange={() => {}}
                              id="filter-dep-dashboard"
                              className="form-check-sm"
                            />
                            <Form.Check
                              type="checkbox"
                              label="ShipMon"
                              checked={shipMon}
                              onClick={e => {
                                e.stopPropagation();
                                setDep(false);
                                setShipMon(true);
                                setLift(false);
                                setShipPd(false);
                              }}
                              onChange={() => {}}
                              id="filter-shipmon-dashboard"
                              className="form-check-sm"
                            />
                            <Form.Check
                              type="checkbox"
                              label="Lift"
                              checked={lift}
                              onClick={e => {
                                e.stopPropagation();
                                setDep(false);
                                setShipMon(false);
                                setLift(true);
                                setShipPd(false);
                              }}
                              onChange={() => {}}
                              id="filter-lift-dashboard"
                              className="form-check-sm"
                            />
                            <Form.Check
                              type="checkbox"
                              label="ShipPd"
                              checked={shipPd}
                              onClick={e => {
                                e.stopPropagation();
                                setDep(false);
                                setShipMon(false);
                                setLift(false);
                                setShipPd(true);
                              }}
                              onChange={() => {}}
                              id="filter-shippd-dashboard"
                              className="form-check-sm"
                            />
                          </div>
                        </Form.Group>
                      </Col>
                      <Col xs="auto" style={{ flex: "0 0 auto", margin: 0, padding: 0 }}>
                        <Form.Group>
                          <div className="d-flex gap-2 align-items-end" style={{ marginLeft: '20px' }}>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={handlePDFExport}
                              disabled={selectedRows.length === 0}
                              title="Export to PDF"
                            >
                              <FileText size={16} />
                            </Button>
                          </div>
                        </Form.Group>
                      </Col>
                    </Row>
                  </div>
                )}

                {/* Table Section */}
                {loading && (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading reminder data...</p>
                  </div>
                )}

                {showTable && !loading && filteredTableData.length > 0 && (
                  <div className="table-responsive" style={{ overflowX: 'auto', width: '100%', margin: hideDateFilters ? 0 : undefined, padding: hideDateFilters ? 0 : undefined }}>
                    <Table striped bordered hover style={{ minWidth: '100%', whiteSpace: 'nowrap', margin: hideDateFilters ? 0 : undefined, padding: hideDateFilters ? 0 : undefined }}>
                      <thead className="table-dark">
                        <tr>
                          <th className="text-center" style={{ width: '50px' }}>
                            <Form.Check
                              type="checkbox"
                              checked={selectedRows.length === filteredTableData.length && filteredTableData.length > 0}
                              onClick={e => {
                                e.stopPropagation();
                                if (selectedRows.length === filteredTableData.length && filteredTableData.length > 0) {
                                  setSelectedRows([]);
                                } else {
                                  setSelectedRows(filteredTableData.map(row => getRowIdentifier(row)));
                                }
                              }}
                              onChange={() => {}}
                            />
                          </th>
                          <th 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('ContractNo')}
                          >
                            Contract No {getSortIcon('ContractNo')}
                          </th>
                          <th 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('ContractDate')}
                          >
                            Date {getSortIcon('ContractDate')}
                          </th>
                          <th 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('SellerLedger')}
                          >
                            Seller {getSortIcon('SellerLedger')}
                          </th>
                          <th 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('BuyerLedger')}
                          >
                            Buyer {getSortIcon('BuyerLedger')}
                          </th>
                          <th 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('ItemTypeName')}
                          >
                            Item {getSortIcon('ItemTypeName')}
                          </th>
                          <th 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('AdvPayment')}
                          >
                            Deposit {getSortIcon('AdvPayment')}
                          </th>
                          <th 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('Qty')}
                          >
                            Qty {getSortIcon('Qty')}
                          </th>
                          <th 
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleSort('Rate')}
                          >
                            Rate {getSortIcon('Rate')}
                          </th>
                          <th>Period</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTableData.map((row, index) => {
                          const rowId = getRowIdentifier(row);
                          return (
                          <tr
                            key={rowId || index}
                            style={{ backgroundColor: getRowBackgroundColor(row) }}
                          >
                            <td className="text-center">
                              <Form.Check
                                type="checkbox"
                                checked={selectedRows.includes(rowId)}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleRowSelect(rowId);
                                }}
                                onChange={() => {}}
                                style={{ margin: 0 }}
                              />
                            </td>
                            <td
                              className="fw-semibold align-middle"
                              style={{
                                backgroundColor: getRowBackgroundColor(row),
                                padding: "2px 4px",
                                border: "1.5px solid black !important",
                                fontSize: "0.7rem",
                              }}
                            >
                              {row.ContractNo ? (
                                <Button
                                  variant="link"
                                  className="p-0 text-decoration-none"
                                  onClick={(event) => {
                                    const button = event.target.closest("button");
                                    const originalText = button.innerHTML;
                                    button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Loading...';
                                    button.disabled = true;

                                    setTimeout(() => {
                                      openEditContractModal(row);
                                      button.innerHTML = originalText;
                                      button.disabled = false;
                                    }, 300);
                                  }}
                                  title={`Click to edit contract: ${row.ContractNo}`}
                                  tabIndex={0}
                                  role="button"
                                  aria-label={`Edit contract ${row.ContractNo}`}
                                  style={{ fontSize: "0.7rem" }}
                                >
                                  <i className="fas fa-edit text-primary me-1"></i>
                                  <span>{row.ContractNo}</span>
                                </Button>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td>
                              {row.ContractDate
                                ? new Date(row.ContractDate).toLocaleDateString()
                                : '-'}
                            </td>
                            <td style={{ color: '#E91E63', fontWeight: 'bold' }}>
                              {row.SellerLedger || '-'}
                            </td>
                            <td style={{ color: '#2196F3', fontWeight: 'bold' }}>
                              {row.BuyerLedger || '-'}
                            </td>
                            <td>{row.ItemTypeName || '-'}</td>
                            <td>{row.AdvPayment || '0'}</td>
                            <td>{row.Qty || '0'}</td>
                            <td>₹{row.Rate || '0'}</td>
                            <td style={{ color: '#FF0000', fontWeight: 'bold' }}>
                              {getPeriodValue(row)}
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  </div>
                )}

                {showTable && !loading && filteredTableData.length === 0 && (
                  <div className="text-center py-5">
                    <p>No reminder data found for the selected criteria.</p>
                  </div>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Remarks Modal for PDF Export */}
      <Modal
        show={showRemarksModal}
        onHide={() => {
          setShowRemarksModal(false);
          setRemarks('');
        }}
        centered
        size="lg"
      >
        <ModalHeader closeButton>
          <h5 className="mb-0">
            <FileText className="me-2" size={18} />
            Add Remarks for PDF Export
          </h5>
        </ModalHeader>
        <ModalBody>
          <Form.Group>
            <Form.Label className="fw-semibold">Remarks</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              placeholder="Enter remarks (optional)..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              style={{ resize: 'vertical' }}
            />
            <Form.Text className="text-muted">
              Remarks will be added at the end of the PDF document.
            </Form.Text>
          </Form.Group>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="secondary"
            onClick={() => {
              setShowRemarksModal(false);
              setRemarks('');
            }}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleGeneratePDF}
          >
            <FileText className="me-2" size={16} />
            Generate PDF
          </Button>
        </ModalFooter>
      </Modal>

      <Modal
        show={showSharePDFModal}
        onHide={() => { setShowSharePDFModal(false); setPendingShareFile(null); }}
        centered
      >
        <ModalHeader closeButton>
          <h5 className="mb-0">
            <FileText className="me-2" size={18} />
            PDF Ready
          </h5>
        </ModalHeader>
        <ModalBody>
          <p className="mb-0">Click Share to open the share dialog and send the PDF.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setShowSharePDFModal(false); setPendingShareFile(null); }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSharePDFClick}>
            Share PDF
          </Button>
        </ModalFooter>
      </Modal>

      {/* EditContract Modal */}
      <Modal
        show={showEditContractModal}
        onHide={closeEditContractModal}
        size="xl"
        fullscreen="lg-down"
        centered
        style={{ zIndex: 9999 }}
      >
        <ModalHeader className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div>
              <h5 className="mb-0">
                <i className="fas fa-edit me-2"></i>
                Edit Contract: {selectedContractData?.ContractNo || "Unknown"}
                {modalLoading && (
                  <Spinner
                    animation="border"
                    size="sm"
                    className="ms-2 text-light"
                  />
                )}
              </h5>
            </div>
            <Button
              variant="light"
              onClick={closeEditContractModal}
              className="btn-sm"
              title="Back to Report"
            >
              <i className="fas fa-arrow-left me-1"></i>
              Back to Report
            </Button>
          </div>
        </ModalHeader>
        <ModalBody
          className="p-0"
          style={{ minHeight: "70vh", maxHeight: "80vh" }}
        >
          {selectedContractData && (
            <>
              <EditContract
                isModal={true}
                contractData={selectedContractData}
                onClose={closeEditContractModal}
              />
            </>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
}

export default ReminderData;