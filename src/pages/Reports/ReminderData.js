import { API_WEB_URLS } from 'constants/constAPI';
import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react'
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
import { registerHindiFont, setHindiFont } from '../../helpers/pdfHindiFont';
import useColumnResize from '../../helpers/useColumnResize';
import '../../helpers/columnResize.css';

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

  // ─── Column Resize Feature ─────────────────────────────────────
  const { columnWidths, handleResizeMouseDown } = useColumnResize('reminderData_columnWidths', {
    Checkbox: 40,
    ContractNo: 100,
    Date: 85,
    Seller: 120,
    Buyer: 120,
    Item: 90,
    Deposit: 80,
    Qty: 70,
    Rate: 70,
    Period: 120,
  });

  // ─── Column Reorder Feature ─────────────────────────────────────
  const RD_ALL_COLUMNS = [
    { key: 'Checkbox', label: '', sortKey: null },
    { key: 'ContractNo', label: 'Contract No', sortKey: 'ContractNo' },
    { key: 'Date', label: 'Date', sortKey: 'ContractDate' },
    { key: 'Seller', label: 'Seller', sortKey: 'SellerLedger' },
    { key: 'Buyer', label: 'Buyer', sortKey: 'BuyerLedger' },
    { key: 'Item', label: 'Item', sortKey: 'ItemTypeName' },
    { key: 'Deposit', label: 'Deposit', sortKey: 'AdvPayment' },
    { key: 'Qty', label: 'Qty', sortKey: 'Qty' },
    { key: 'Rate', label: 'Rate', sortKey: 'Rate' },
    { key: 'Period', label: 'Period', sortKey: null },
  ];
  const RD_DEFAULT_ORDER = RD_ALL_COLUMNS.map(c => c.key);
  const RD_ORDER_KEY = 'reminderData_columnOrder';

  const rdGetInitialOrder = () => {
    try {
      const saved = localStorage.getItem(RD_ORDER_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return [
          ...parsed.filter(k => RD_DEFAULT_ORDER.includes(k)),
          ...RD_DEFAULT_ORDER.filter(k => !parsed.includes(k)),
        ];
      }
    } catch (e) {}
    return [...RD_DEFAULT_ORDER];
  };

  const [rdColumnOrder, setRdColumnOrder] = useState(rdGetInitialOrder);
  const [rdDragOverKey, setRdDragOverKey] = useState(null);
  const rdDragSrcRef = useRef(null);

  const rdSaveOrder = (order) => {
    try { localStorage.setItem(RD_ORDER_KEY, JSON.stringify(order)); } catch (e) {}
  };

  const rdDragStart = (e, key) => {
    rdDragSrcRef.current = key;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  };
  const rdDragOver = (e, key) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (key !== rdDragSrcRef.current) setRdDragOverKey(key);
  };
  const rdDrop = (e, targetKey) => {
    e.preventDefault();
    const srcKey = rdDragSrcRef.current;
    if (!srcKey || srcKey === targetKey) { setRdDragOverKey(null); return; }
    setRdColumnOrder(prev => {
      const next = [...prev];
      const from = next.indexOf(srcKey);
      const to = next.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, srcKey);
      rdSaveOrder(next);
      return next;
    });
    setRdDragOverKey(null);
    rdDragSrcRef.current = null;
  };
  const rdDragEnd = () => { setRdDragOverKey(null); rdDragSrcRef.current = null; };
  const rdVisibleColumns = () => rdColumnOrder.map(k => RD_ALL_COLUMNS.find(c => c.key === k)).filter(Boolean);
  // ─── End Column Reorder Feature ──────────────────────────────────

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

  // Filter color mapping
  const filterColors = {
    dep:     { bg: '#e74c3c', light: '#fdedec', row: '#f5b7b1', text: '#fff' },  // Red
    shipMon: { bg: '#3498db', light: '#ebf5fb', row: '#aed6f1', text: '#fff' },  // Blue
    lift:    { bg: '#f39c12', light: '#fef9e7', row: '#f9e79f', text: '#fff' },  // Orange
    shipPd:  { bg: '#27ae60', light: '#eafaf1', row: '#a9dfbf', text: '#fff' },  // Green
  };

  // Get the active filter's row color (stronger tint matching the box color)
  const getRowBackgroundColor = (index) => {
    const evenOdd = index % 2 === 0;
    if (dep) return evenOdd ? filterColors.dep.row : filterColors.dep.light;
    if (shipMon) return evenOdd ? filterColors.shipMon.row : filterColors.shipMon.light;
    if (lift) return evenOdd ? filterColors.lift.row : filterColors.lift.light;
    if (shipPd) return evenOdd ? filterColors.shipPd.row : filterColors.shipPd.light;
    return 'white';
  };

  // Get active filter bg color for header
  const getActiveHeaderColor = () => {
    if (dep) return filterColors.dep.bg;
    if (shipMon) return filterColors.shipMon.bg;
    if (lift) return filterColors.lift.bg;
    if (shipPd) return filterColors.shipPd.bg;
    return '#343a40';
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

        // Apply background color based on active filter
        const bgColor = getRowBackgroundColor(index);
        if (bgColor !== 'white') {
          const colorMap = {
            '#f5b7b1': 'F5B7B1', '#fdedec': 'FDEDEC', // Red (Dep)
            '#aed6f1': 'AED6F1', '#ebf5fb': 'EBF5FB', // Blue (ShipMon)
            '#f9e79f': 'F9E79F', '#fef9e7': 'FEF9E7', // Orange (Lift)
            '#a9dfbf': 'A9DFBF', '#eafaf1': 'EAFAF1', // Green (ShipPd)
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
      await registerHindiFont(doc);
      setHindiFont(doc);
      const filename = `ReminderData_${new Date().toISOString().split('T')[0]}.pdf`;

      setHindiFont(doc, 'bold');
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
        styles: { fontSize: 8, font: 'NotoSansDevanagari' },
        headStyles: { fillColor: [40, 167, 69] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      });

      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40;

      if (remarks && remarks.trim()) {
        setHindiFont(doc, 'bold');
        doc.setFontSize(12);
        doc.text('Remarks', 14, finalY);
        finalY += 6;
        setHindiFont(doc, 'normal');
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
                {/* Filters Section - Date Pickers Only */}
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
                    </Row>
                  </div>
                )}
                
                {/* No separate filter section when date filters are hidden - filters are in the fixed bottom bar */}

                {/* Table Section */}
                {loading && (
                  <div className="text-center py-5">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Loading reminder data...</p>
                  </div>
                )}

                {showTable && !loading && filteredTableData.length > 0 && (
                  <div className="table-responsive" style={{ overflowX: 'auto', width: '100%', margin: hideDateFilters ? 0 : undefined, padding: hideDateFilters ? 0 : undefined, paddingBottom: '130px' }}>
                    <Table bordered hover className="resizable-table" style={{ tableLayout: 'fixed', minWidth: '100%', whiteSpace: 'nowrap', margin: hideDateFilters ? 0 : undefined, padding: hideDateFilters ? 0 : undefined }}>
                      <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                        <tr>
                          {rdVisibleColumns().map((col) => (
                            <th
                              key={col.key}
                              className={`text-center align-middle${rdDragOverKey === col.key ? ' col-drag-over' : ''}`}
                              draggable={col.key !== 'Checkbox'}
                              onDragStart={col.key !== 'Checkbox' ? (e => rdDragStart(e, col.key)) : undefined}
                              onDragOver={e => rdDragOver(e, col.key)}
                              onDrop={e => rdDrop(e, col.key)}
                              onDragEnd={rdDragEnd}
                              style={{
                                backgroundColor: getActiveHeaderColor(),
                                color: 'white',
                                height: '25px',
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                padding: col.key === 'Checkbox' ? '6px 12px' : '0 8px',
                                width: `${columnWidths[col.key] || 80}px`,
                                minWidth: '30px',
                                cursor: col.key === 'Checkbox' ? 'default' : 'grab',
                                border: '1.5px solid black',
                                position: 'relative',
                                overflow: 'hidden',
                                userSelect: 'none',
                              }}
                              onClick={() => col.sortKey && handleSort(col.sortKey)}
                            >
                              {col.key === 'Checkbox' ? (
                                <div className="d-flex justify-content-center align-items-center">
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
                                    title="Select All"
                                    style={{ margin: 0 }}
                                  />
                                </div>
                              ) : (
                                <div className="d-flex justify-content-between align-items-center" style={{ pointerEvents: 'none' }}>
                                  <div className="d-flex align-items-center gap-1">
                                    <span>{col.label}</span>
                                    <i className="fas fa-grip-vertical" style={{ fontSize: '0.4rem', opacity: 0.5 }} title="Drag to reorder"></i>
                                  </div>
                                  {col.sortKey && (
                                    <div className="d-flex flex-column" style={{ marginLeft: '4px' }}>
                                      <i className={`fas fa-sort-up ${sortConfig.key === col.sortKey && sortConfig.direction === 'asc' ? 'text-warning' : 'text-light'}`} style={{ fontSize: '0.5rem', lineHeight: '0.5rem' }}></i>
                                      <i className={`fas fa-sort-down ${sortConfig.key === col.sortKey && sortConfig.direction === 'desc' ? 'text-warning' : 'text-light'}`} style={{ fontSize: '0.5rem', lineHeight: '0.5rem' }}></i>
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, col.key)} onTouchStart={e => handleResizeMouseDown(e, col.key)} />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTableData.map((row, index) => {
                          const rowId = getRowIdentifier(row);
                          const bgColor = getRowBackgroundColor(index);
                          return (
                            <tr key={rowId || index} style={{ border: '1.5px solid black' }}>
                              {rdVisibleColumns().map((col) => {
                                const s = { backgroundColor: bgColor, padding: '2px 4px', border: '1.5px solid black', fontSize: '0.7rem' };
                                switch (col.key) {
                                  case 'Checkbox': return (
                                    <td key={col.key} className="text-center align-middle" style={s}>
                                      <Form.Check type="checkbox" checked={selectedRows.includes(rowId)} onClick={e => { e.stopPropagation(); handleRowSelect(rowId); }} onChange={() => {}} style={{ margin: 0 }} />
                                    </td>
                                  );
                                  case 'ContractNo': return (
                                    <td key={col.key} className="fw-semibold align-middle" style={s}>
                                      {row.ContractNo ? (
                                        <Button variant="link" className="p-0 text-decoration-none" onClick={event => { const button = event.target.closest('button'); const orig = button.innerHTML; button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Loading...'; button.disabled = true; setTimeout(() => { openEditContractModal(row); button.innerHTML = orig; button.disabled = false; }, 300); }} title={`Click to edit contract: ${row.ContractNo}`} tabIndex={0} role="button" style={{ fontSize: '0.7rem' }}>
                                          <i className="fas fa-edit text-primary me-1"></i>
                                          <span>{row.ContractNo}</span>
                                        </Button>
                                      ) : '-'}
                                    </td>
                                  );
                                  case 'Date': return <td key={col.key} className="text-center align-middle" style={s}>{row.ContractDate ? new Date(row.ContractDate).toLocaleDateString('en-GB') : '-'}</td>;
                                  case 'Seller': return <td key={col.key} className="align-middle" style={{ ...s, color: '#E91E63', fontWeight: 'bold' }}>{row.SellerLedger || '-'}</td>;
                                  case 'Buyer': return <td key={col.key} className="align-middle" style={{ ...s, color: '#2196F3', fontWeight: 'bold' }}>{row.BuyerLedger || '-'}</td>;
                                  case 'Item': return <td key={col.key} className="align-middle" style={s}>{row.ItemTypeName || '-'}</td>;
                                  case 'Deposit': return <td key={col.key} className="text-end fw-semibold align-middle" style={s}>{row.AdvPayment || '0'}</td>;
                                  case 'Qty': return <td key={col.key} className="text-end fw-semibold align-middle" style={s}>{row.Qty || '0'}</td>;
                                  case 'Rate': return <td key={col.key} className="text-end fw-semibold align-middle" style={s}>₹{row.Rate || '0'}</td>;
                                  case 'Period': return <td key={col.key} className="align-middle" style={{ ...s, color: '#FF0000', fontWeight: 'bold' }}>{getPeriodValue(row)}</td>;
                                  default: return null;
                                }
                              })}
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

      {/* Fixed Bottom Filter Bar - just above the NavigationFooter */}
      <style>{`
        .reminder-filter-bar {
          position: fixed;
          bottom: 75px;
          left: 0;
          right: 0;
          z-index: 1040;
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 0px;
          background-color: #1a1a2e;
          padding: 6px 10px;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.3);
        }
        @media (min-width: 769px) {
          .reminder-filter-bar {
            bottom: 0;
          }
        }
      `}</style>
      <div className="reminder-filter-bar">
        {/* Dep Box */}
        <div
          onClick={() => { setDep(true); setShipMon(false); setLift(false); setShipPd(false); }}
          style={{
            flex: 1,
            maxWidth: '20%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: dep ? filterColors.dep.bg : '#444',
            color: '#fff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: dep ? '700' : '500',
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
            border: dep ? '2px solid #fff' : '2px solid transparent',
            margin: '0 3px',
            boxShadow: dep ? '0 0 8px ' + filterColors.dep.bg : 'none',
          }}
        >
          <span style={{
            width: '16px', height: '16px', borderRadius: '3px',
            border: '2px solid #fff',
            backgroundColor: dep ? '#fff' : 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', color: filterColors.dep.bg, fontWeight: 'bold',
          }}>{dep ? '✓' : ''}</span>
          Dep
        </div>

        {/* ShipMon Box */}
        <div
          onClick={() => { setDep(false); setShipMon(true); setLift(false); setShipPd(false); }}
          style={{
            flex: 1,
            maxWidth: '20%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: shipMon ? filterColors.shipMon.bg : '#444',
            color: '#fff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: shipMon ? '700' : '500',
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
            border: shipMon ? '2px solid #fff' : '2px solid transparent',
            margin: '0 3px',
            boxShadow: shipMon ? '0 0 8px ' + filterColors.shipMon.bg : 'none',
          }}
        >
          <span style={{
            width: '16px', height: '16px', borderRadius: '3px',
            border: '2px solid #fff',
            backgroundColor: shipMon ? '#fff' : 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', color: filterColors.shipMon.bg, fontWeight: 'bold',
          }}>{shipMon ? '✓' : ''}</span>
          ShipMon
        </div>

        {/* Lift Box */}
        <div
          onClick={() => { setDep(false); setShipMon(false); setLift(true); setShipPd(false); }}
          style={{
            flex: 1,
            maxWidth: '20%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: lift ? filterColors.lift.bg : '#444',
            color: '#fff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: lift ? '700' : '500',
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
            border: lift ? '2px solid #fff' : '2px solid transparent',
            margin: '0 3px',
            boxShadow: lift ? '0 0 8px ' + filterColors.lift.bg : 'none',
          }}
        >
          <span style={{
            width: '16px', height: '16px', borderRadius: '3px',
            border: '2px solid #fff',
            backgroundColor: lift ? '#fff' : 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', color: filterColors.lift.bg, fontWeight: 'bold',
          }}>{lift ? '✓' : ''}</span>
          Lift
        </div>

        {/* ShipPd Box */}
        <div
          onClick={() => { setDep(false); setShipMon(false); setLift(false); setShipPd(true); }}
          style={{
            flex: 1,
            maxWidth: '20%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: shipPd ? filterColors.shipPd.bg : '#444',
            color: '#fff',
            borderRadius: '6px',
            cursor: 'pointer',
            fontWeight: shipPd ? '700' : '500',
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
            border: shipPd ? '2px solid #fff' : '2px solid transparent',
            margin: '0 3px',
            boxShadow: shipPd ? '0 0 8px ' + filterColors.shipPd.bg : 'none',
          }}
        >
          <span style={{
            width: '16px', height: '16px', borderRadius: '3px',
            border: '2px solid #fff',
            backgroundColor: shipPd ? '#fff' : 'transparent',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '10px', color: filterColors.shipPd.bg, fontWeight: 'bold',
          }}>{shipPd ? '✓' : ''}</span>
          ShipPd
        </div>

        {/* PDF Box */}
        <div
          onClick={() => { if (selectedRows.length > 0) handlePDFExport(); }}
          style={{
            flex: 1,
            maxWidth: '20%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            padding: '8px 12px',
            backgroundColor: selectedRows.length > 0 ? '#8e44ad' : '#555',
            color: '#fff',
            borderRadius: '6px',
            cursor: selectedRows.length > 0 ? 'pointer' : 'not-allowed',
            fontWeight: '600',
            fontSize: '0.85rem',
            transition: 'all 0.2s ease',
            border: '2px solid transparent',
            margin: '0 3px',
            opacity: selectedRows.length > 0 ? 1 : 0.6,
          }}
        >
          <FileText size={16} />
          PDF
        </div>
      </div>

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