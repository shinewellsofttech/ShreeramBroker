import React, { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Table, Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { API_WEB_URLS, getGlobalOptions as getCachedGlobalOptions, getDefaultFinancialYearId, getCompanyName } from "constants/constAPI";
import { Fn_FillListData, Fn_AddEditData } from "store/Functions";
import DalaliPrint from "./DalaliPrint";
import { Fn_GetReport } from "store/Functions";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { registerHindiFont, setHindiFont } from "../../helpers/pdfHindiFont";
import { FileText, Download } from "react-feather";


const DalaliModal = ({ 
  showDalaliDataModal, 
  onHideDalaliDataModal, 
  ledgerId,
  reportData = [],
  fromDate,
  toDate,
  financialYears = [],
  selectedFinancialYearId = null,
  onFinancialYearChange,
  onSaveSuccess,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Modal state for Dalali Bill - use parent controlled state
  // const [isDalaliDataModalOpen, setIsDalaliDataModalOpen] = useState(showDalaliDataModal);
  const [dalaliData, setDalaliData] = useState([]);
  const [dalaliRates, setDalaliRates] = useState({});
  const [isExistingDataLoaded, setIsExistingDataLoaded] = useState(false);
  const [showDalaliPrintModal, setShowDalaliPrintModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  // PDF / Remarks state
  const [showRemarksModal, setShowRemarksModal] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [pendingShareFile, setPendingShareFile] = useState(null);
  const [showSharePDFModal, setShowSharePDFModal] = useState(false);

  const [state, setState] = useState({
    FillArray: [],
    ItemArray: [],
    DalaliArray: [],
    LedgerArray: [],
    GlobalArray: [],
  });
  const [defaultFinancialYearId, setDefaultFinancialYearId] = useState(null);

  const API_URL_SAVE_DALALI = `${API_WEB_URLS.DalaliMaster}/0/token`;
  const API_URL_Get = `${API_WEB_URLS.GetDalaliLedgerData}/0/token`;
  const API_URL_GlobalOptions = API_WEB_URLS.MASTER + "/0/token/GlobalOptions";

  async function getGlobalOptions() {
    const cached = getCachedGlobalOptions();
    if (cached && cached.length > 0) {
      setState(prev => ({ ...prev, GlobalArray: cached }));
      return cached[0].F_FinancialYearMaster ?? getDefaultFinancialYearId();
    }
    const response = await Fn_FillListData(dispatch, setState, "GlobalArray", API_URL_GlobalOptions + "/Id/0");
    if (response && response.length > 0) return response[0].F_FinancialYearMaster;
    return 0;
  }
  // Convert dates to proper format (ISO string or specific format)
  const formatDateForAPI = (date) => {
    if (!date) return '';
    if (date instanceof Date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
    if (typeof date === 'string') return date.split('T')[0];
    return date.toString();
  };

  // Load dalali data function
  const loadDalaliData = async (financialYearIdParam = null) => {
    if (!ledgerId) return;

    setIsLoading(true);
    setDataLoaded(false);

    const vformData = new FormData();

    try {
      let resolvedFinancialYearId;
      
      if (financialYearIdParam !== null) {
        // Use the provided financial year ID (from dropdown change)
        resolvedFinancialYearId = financialYearIdParam;
      } else {
        // Get default financial year ID on initial load
        const financialYearId = await getGlobalOptions();
        resolvedFinancialYearId =
          typeof financialYearId === "number" ? financialYearId : parseInt(financialYearId, 10) || 0;

        setDefaultFinancialYearId(resolvedFinancialYearId || null);
        if (
          onFinancialYearChange &&
          (selectedFinancialYearId === null || selectedFinancialYearId === undefined)
        ) {
          onFinancialYearChange(resolvedFinancialYearId || null);
        }
      }

      vformData.append("LedgerId", ledgerId);
      vformData.append("F_FinancialYearMaster", resolvedFinancialYearId);
      vformData.append("FromDate", formatDateForAPI(fromDate));
      vformData.append("ToDate", formatDateForAPI(toDate));

      await Fn_GetReport(
        dispatch,
        setState,
        "DalaliArray",
        API_URL_Get,
        { arguList: { id: 0, formData: vformData } },
        true
      );

      setIsLoading(false);
      setDataLoaded(true);
    } catch (error) {
      console.error("Error fetching dalali data:", error);
      setIsLoading(false);
      setDataLoaded(false);
      toast.error("Failed to load dalali data");
    }
  };

  // Load dalali data only once when modal opens
  useEffect(() => {
    if (showDalaliDataModal && ledgerId) {
      loadDalaliData();
    }
  }, [showDalaliDataModal, ledgerId]);

  // Auto-open modal when parent component triggers it and data is loaded
  useEffect(() => {
    if (showDalaliDataModal && ledgerId && reportData.length > 0 && dataLoaded && !isLoading) {
      openDalaliDataModal();
    }
  }, [showDalaliDataModal, ledgerId, reportData, dataLoaded, isLoading]);

  // Auto-calculate dalali amounts when rates change
  useEffect(() => {
    if (Object.keys(dalaliRates).length === 0) {
      return;
    }
    setDalaliData(prevData => {
      if (!prevData || prevData.length === 0) {
        return prevData;
      }
      return calculateDalaliAmounts(prevData, dalaliRates);
    });
  }, [dalaliRates]);

  const openDalaliDataModal = () => {
    if (!ledgerId) {
      toast.error("Please select a ledger first to view Dalali Data");
      return;
    }

    console.log("Opening Dalali Modal for ledgerId:", ledgerId);

    // Check if there's existing dalali data for the selected ledger from getDalaliledgerData response
    const existingDalaliData = state.DalaliArray || [];
    console.log("Existing Dalali Data from API:", existingDalaliData);
    console.log("State DalaliArray:", state.DalaliArray);
    
    let dalaliData = [];
    let initialRates = {};

    if (existingDalaliData.length > 0) {
      // Use existing dalali data from getDalaliledgerData response - EDIT MODE
      existingDalaliData.forEach(item => {
        // Create dalali data row from response
        dalaliData.push({
          ItemId: item.ItemId,
          ItemName: item.ItemName,
          BuyerQty: item.BuyerQty || 0,
          SellerQty: item.SellerQty || 0,
          DalaliRate: item.DalaliRate || 0,
          DalaliAmount: item.DalaliAmount || 0,
          Type: item.Type || (item.BuyerQty > 0 ? "P" : "S"),
          isExisting: true,
          DalaliId: item.Id || 0,
          LedgerId: item.LedgerId,
          LedgerName: item.LedgerName
        });

        // Set initial rates for input fields
        const rateKey = `${item.ItemId}_${item.Type}`;
        initialRates[rateKey] = item.DalaliRate || 0;
      });

      setIsExistingDataLoaded(true);
      toast.success(`Loaded existing dalali data from getDalaliledgerData - Edit Mode`);
    } else {
      // Create new dalali bill data from reportData - ADD MODE
      const itemQuantities = {};

      // Process each row from reportData to sum quantities by item
      reportData.forEach(row => {
        if (row.ItemId && row.ItemName) {
          if (!itemQuantities[row.ItemId]) {
            itemQuantities[row.ItemId] = {
              ItemId: row.ItemId,
              ItemName: row.ItemName,
              BuyerQty: 0,
              SellerQty: 0,
            };
          }

          // Sum quantities
          if (row.TotalBuyerQty) {
            itemQuantities[row.ItemId].BuyerQty += parseFloat(row.TotalBuyerQty) || 0;
          }
          if (row.TotalSellerQty) {
            itemQuantities[row.ItemId].SellerQty += parseFloat(row.TotalSellerQty) || 0;
          }
        }
      });

      // Convert to array format with separate rows for PurQty and SelQty
      Object.values(itemQuantities).forEach(item => {
        // Add row for Sales Quantity if > 0
        if (item.SellerQty > 0) {
          dalaliData.push({
            ItemId: item.ItemId,
            ItemName: item.ItemName,
            BuyerQty: 0,
            SellerQty: item.SellerQty,
            DalaliRate: 0,
            DalaliAmount: 0,
            Type: "S", // Always 'S' for Sales quantity
            isExisting: false, // Flag to identify new data
            LedgerId: ledgerId,
            LedgerName: item.LedgerName
          });
          initialRates[`${item.ItemId}_S`] = 0;
        }

        // Add row for Purchase Quantity if > 0
        if (item.BuyerQty > 0) {
          dalaliData.push({
            ItemId: item.ItemId,
            ItemName: item.ItemName,
            BuyerQty: item.BuyerQty,
            SellerQty: 0,
            DalaliRate: 0,
            DalaliAmount: 0,
            Type: "P", // Always 'P' for Purchase quantity
            isExisting: false, // Flag to identify new data
            LedgerId: ledgerId,
            LedgerName: item.LedgerName
          });
          initialRates[`${item.ItemId}_P`] = 0;
        }
      });

      setIsExistingDataLoaded(false);
      toast.success(`Created new dalali data from report - Add Mode`);
    }

    if (dalaliData.length === 0) {
      toast.error("No items found in dalali data");
      return;
    }

    console.log("Final Dalali Data created:", dalaliData);
    console.log("Initial Rates set:", initialRates);

    setDalaliRates(initialRates);
    setDalaliData(dalaliData);

    toast.success(`Dalali Data opened with ${dalaliData.length} rows`);
  };
    
  const closeDalaliDataModal = () => {
    // setIsDalaliDataModalOpen(false); // Modal is controlled by parent
    setDalaliData([]);
    setDalaliRates({});
    setIsExistingDataLoaded(false);
    setIsLoading(false);
    setDataLoaded(false);
  };
    
  const calculateDalaliAmounts = (data = [], rates = {}) => {
    return data.map(item => {
      // Use the correct rate key format: ItemId_Type (P or S)
      const rateKey = `${item.ItemId}_${item.Type}`;
      const rate = rates[rateKey] || 0;

      // Calculate amount based on the quantity that exists
      const quantity = item.BuyerQty > 0 ? item.BuyerQty : item.SellerQty;
      const totalDalaliAmt = (quantity * rate).toFixed(2);

      return {
        ...item,
        DalaliRate: rate,
        DalaliAmount: parseFloat(totalDalaliAmt),
      };
    });
  };
    
  const handleSaveDalaliData = async (e) => {
    e.preventDefault();
    try {
      // Calculate dalali amounts first
      const recalculatedData = calculateDalaliAmounts(dalaliData, dalaliRates);
      setDalaliData(recalculatedData);

      const financialYearValue =
        selectedFinancialYearId ??
        defaultFinancialYearId ??
        0;

      // Prepare data for existing and new records
      const existingRecords = recalculatedData.filter(
        item => item.isExisting && item.DalaliId
      );
      const newRecords = recalculatedData.filter(item => !item.isExisting);

      let successMessage = "";

      // Update existing records if any
      if (existingRecords.length > 0) {
        for (const item of existingRecords) {
          let vformData = new FormData();
          vformData.append(
            "F_FinancialYearMaster",
            financialYearValue
          );
          vformData.append("F_ItemType", item.ItemId|| 0);
          vformData.append("F_LedgerMaster", ledgerId || 0);

          vformData.append("DalaliRate", item.DalaliRate || 0);

          vformData.append("Type", item.Type || ""); // P for Purchase, S for Sales

        const response = await Fn_AddEditData(
            dispatch,
            setState,
            { arguList: { id: item.DalaliId, formData: vformData } },
            API_URL_SAVE_DALALI,
            true,
            "LedgerReport",
            navigate,
            "#"
          );

        }
        successMessage += `${existingRecords.length} existing records updated. `;
      }

      // Add new records if any
      if (newRecords.length > 0) {
        const newData = newRecords.map(item => ({
          F_FinancialYearMaster:
            financialYearValue,
          F_ItemType: item.ItemId || 0,
          F_LedgerMaster: ledgerId || 0,
          PurQty: item.BuyerQty || 0,
          SelQty: item.SellerQty || 0,
          DalaliRate: item.DalaliRate || 0,
          DalaliAmount: item.DalaliAmount || 0,
          Type: item.Type || "", // P for Purchase, S for Sales
        }));

        let vformData = new FormData();
        vformData.append("data", JSON.stringify(newData));

        await Fn_AddEditData(
          dispatch,
          setState,
          { arguList: { id: 0, formData: vformData } },
          API_URL_SAVE_DALALI,
          true,
          "LedgerReport",
          navigate,
          "#"
        );

        successMessage += `${newRecords.length} new records added. `;
      }

      toast.success(`Dalali Bill data saved successfully! ${successMessage}`);

      // Close modal and reload parent data
      closeDalaliDataModal();
      onHideDalaliDataModal();
      
      // Call the callback to reload table data in NewLedgerReport
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    } catch (error) {
      console.error("Error saving dalali bill:", error);
      toast.error("Failed to save dalali bill data");
    }
  };
    
  // Open remarks modal before PDF generation
  const handlePrintDalaliData = () => {
    if (!ledgerId) {
      toast.error("Please select a ledger first to print Dalali Data");
      return;
    }
    if (!dalaliData || dalaliData.length === 0) {
      toast.error("Please generate Dalali Data data first");
      return;
    }
    setRemarks('');
    setShowRemarksModal(true);
  };

  const generateDalaliPDF = async () => {
    setShowRemarksModal(false);
    try {
      const today = new Date();
      const todayFormatted = today.toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
      const items = dalaliData.map(item => ({
        itemName: item.ItemName || "",
        buyerQty: item.BuyerQty || 0,
        sellerQty: item.SellerQty || 0,
        rate: item.DalaliRate || 0,
        dalali: item.DalaliAmount || 0,
        LedgerName: item.LedgerName || "",
      }));
      const partyName = dalaliData.length > 0 ? dalaliData[0].LedgerName || "" : "";
      const totals = items.reduce((acc, item) => {
        acc.totalPurQty += parseFloat(item.buyerQty) || 0;
        acc.totalSelQty += parseFloat(item.sellerQty) || 0;
        acc.totalDalali += parseFloat(item.dalali) || 0;
        return acc;
      }, { totalPurQty: 0, totalSelQty: 0, totalDalali: 0 });

      const numberToWords = num => {
        const ones = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine"];
        const tens = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
        const teens = ["Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
        if (num === 0) return "Zero";
        if (num < 10) return ones[num];
        if (num < 20) return teens[num - 10];
        if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? " " + ones[num % 10] : "");
        if (num < 1000) return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 !== 0 ? " and " + numberToWords(num % 100) : "");
        if (num < 100000) return numberToWords(Math.floor(num / 1000)) + " Thousand" + (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "");
        if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + " Lakh" + (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "");
        return numberToWords(Math.floor(num / 10000000)) + " Crore" + (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "");
      };

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      await registerHindiFont(doc);
      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const filename = `Dalali_Bill_${partyName.replace(/\s+/g, '_')}_${today.toISOString().split('T')[0]}.pdf`;

      // Header
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 150);
      doc.text(getCompanyName().toUpperCase(), pageW / 2, 12, { align: 'center' });
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text('V-4, MANDORE MANDI, JODHPUR', pageW / 2, 17, { align: 'center' });
      doc.setDrawColor(0, 0, 150);
      doc.setLineWidth(0.5);
      doc.line(14, 20, pageW - 14, 20);

      // Bill details
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(`Party Name: ${partyName}`, 14, 27);
      doc.text(`From Date: 01/04/2024   To Date: ${todayFormatted}`, 14, 32);
      doc.text('KAILASH CHANDAK', 14, 37);
      doc.setFont('helvetica', 'normal');
      doc.text(`PAN: ACSPC 3779 L`, pageW - 14, 27, { align: 'right' });
      doc.text(`GSTIN: ACSPC 3779 L ST 001`, pageW - 14, 32, { align: 'right' });

      doc.line(14, 40, pageW - 14, 40);

      // Table
      autoTable(doc, {
        startY: 43,
        margin: { left: 14, right: 14 },
        head: [['Item Name', 'Pur. Qty', 'Sel. Qty', 'Dalali Rate', 'Dalali Amount']],
        body: items.map(item => [
          item.itemName,
          item.buyerQty > 0 ? item.buyerQty.toLocaleString() : '',
          item.sellerQty > 0 ? item.sellerQty.toLocaleString() : '',
          item.rate,
          item.dalali,
        ]),
        foot: [['Total', totals.totalPurQty.toLocaleString(), totals.totalSelQty.toLocaleString(), '', totals.totalDalali.toLocaleString()]],
        styles: { fontSize: 8.5, font: 'helvetica', fontStyle: 'bold', textColor: [0,0,0], lineColor: [0,0,0], lineWidth: 0.4 },
        headStyles: { fillColor: [40, 167, 69], fontStyle: 'bold', fontSize: 9, halign: 'center' },
        footStyles: { fillColor: [220, 220, 220], fontStyle: 'bold', textColor: [0,0,0] },
        columnStyles: { 0: { halign: 'left' }, 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      });

      let fy = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 43) + 8;

      // Summary
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Total Pur. Qty: ${totals.totalPurQty.toLocaleString()}`, 14, fy);
      doc.text(`Total Sel. Qty: ${totals.totalSelQty.toLocaleString()}`, 14, fy + 6);
      doc.text(`Total Dalali: Rs.${totals.totalDalali.toLocaleString()}`, pageW - 14, fy, { align: 'right' });
      doc.text(`Rupees: ${numberToWords(Math.floor(totals.totalDalali))} Only`, pageW - 14, fy + 6, { align: 'right' });
      fy += 18;

      // Remarks (canvas-based for Hindi support)
      if (remarks && remarks.trim()) {
        const scale = 3;
        const pxPerMm = 3.78 * scale;
        const availWidthMm = 182;
        const availWidthPx = Math.round(availWidthMm * pxPerMm);
        const fontSizePx = 60 * scale;
        const lineHeightPx = Math.round(fontSizePx * 1.5);
        const fontFace = `"Noto Sans Devanagari", "Nirmala UI", Arial, sans-serif`;

        const measCanvas = document.createElement('canvas');
        measCanvas.width = availWidthPx;
        measCanvas.height = lineHeightPx * 2;
        const measCtx = measCanvas.getContext('2d');
        measCtx.font = `${fontSizePx}px ${fontFace}`;
        const words = remarks.trim().split(' ');
        const wrappedLines = [];
        let curLine = '';
        for (const word of words) {
          const test = curLine ? curLine + ' ' + word : word;
          if (measCtx.measureText(test).width > availWidthPx - 10 && curLine) {
            wrappedLines.push(curLine);
            curLine = word;
          } else {
            curLine = test;
          }
        }
        if (curLine) wrappedLines.push(curLine);

        const totalLines = 1 + wrappedLines.length;
        const canvasH = (totalLines + 1) * lineHeightPx;
        const canvas = document.createElement('canvas');
        canvas.width = availWidthPx;
        canvas.height = canvasH;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#000000';
        ctx.font = `bold ${fontSizePx}px ${fontFace}`;
        ctx.fillText('Remarks:', 0, lineHeightPx);
        ctx.font = `${fontSizePx}px ${fontFace}`;
        wrappedLines.forEach((l, i) => { ctx.fillText(l, 0, (i + 2) * lineHeightPx); });

        const imgData = canvas.toDataURL('image/png');
        const imgHMm = canvasH / pxPerMm;
        if (fy + imgHMm > pageH - 30) { doc.addPage(); fy = 14; }
        doc.addImage(imgData, 'PNG', 14, fy, availWidthMm, imgHMm);
        fy += imgHMm + 8;
      }

      // Footer signature
      if (fy + 25 > pageH - 10) { doc.addPage(); fy = 14; }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`For: ${getCompanyName().toUpperCase()}`, pageW / 2, fy + 10, { align: 'center' });
      doc.line(pageW / 2 - 30, fy + 22, pageW / 2 + 30, fy + 22);
      doc.text('Authorized Signatory', pageW / 2, fy + 27, { align: 'center' });

      // Page footer
      doc.setFontSize(6.5);
      doc.setTextColor(130, 130, 130);
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.text(`Page ${i} of ${totalPages}   |   Dalali Bill   |   ${today.toLocaleDateString()}`, pageW / 2, pageH - 4, { align: 'center' });
      }

      const pdfBlob = doc.output('blob');
      setRemarks('');
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      setPendingShareFile(file);
      setShowSharePDFModal(true);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Error generating PDF. Please try again.');
    }
  };

  const handleDownloadPDF = () => {
    if (!pendingShareFile) return;
    const url = URL.createObjectURL(pendingShareFile);
    const a = document.createElement('a');
    a.href = url;
    a.download = pendingShareFile.name;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('PDF downloaded!');
    setShowSharePDFModal(false);
    setPendingShareFile(null);
  };

  const handleSharePDFClick = async () => {
    if (!pendingShareFile || !navigator.share) return;
    try {
      await navigator.share({ title: 'Dalali Bill', text: 'Please find attached the Dalali Bill', files: [pendingShareFile] });
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

  const handleExitDalaliData = () => {
        closeDalaliDataModal();
        onHideDalaliDataModal();
  };

  const closeDalaliPrintModal = () => {
    setShowDalaliPrintModal(false);
  };

  const handleDalaliPrintData = printData => {
    console.log("Printing Dalali Data:", printData);
    toast.success("Dalali Data sent to printer");
  };

  const handleFinancialYearSelect = event => {
    const selectedId = event.target.value ? parseInt(event.target.value, 10) : null;
    if (onFinancialYearChange) {
      onFinancialYearChange(selectedId);
    }
    console.log("Selected Financial Year Id:", selectedId);
    
    // Reload dalali data when financial year changes
    if (selectedId !== null) {
      loadDalaliData(selectedId);
    }
  };

  return (
    <>
     

      {/* Dalali Data Modal */}
      <Modal
        show={showDalaliDataModal}
        onHide={() => {
          closeDalaliDataModal();
          onHideDalaliDataModal();
        }}
        size="xl"
        centered
        className="dalali-data-modal"
        style={{ zIndex: 9999 }}
      >
        <ModalHeader className="bg-warning text-dark">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div>
              <h5 className="mb-0">
                <i className="fas fa-file-invoice-dollar me-2"></i>
                Dalali Data Report
                {isExistingDataLoaded && (
                  <span className="badge bg-info ms-2">
                    <i className="fas fa-edit me-1"></i>
                    Edit Mode
                  </span>
                )}
                {!isExistingDataLoaded && (
                  <span className="badge bg-success ms-2">
                    <i className="fas fa-plus me-1"></i>
                    Add Mode
                  </span>
                )}
              </h5>
            </div>
            <Button
              variant="light"
              onClick={() => {
                closeDalaliDataModal();
                onHideDalaliDataModal();
              }}
              className="btn-sm"
              title="Close"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </ModalHeader>
        <ModalBody className="p-3">
          {financialYears.length > 0 && (
            <div className="mb-3">
              <Form.Label className="fw-semibold small mb-1">
                Financial Year
              </Form.Label>
              <Form.Select
                size="sm"
                value={
                  selectedFinancialYearId ??
                  defaultFinancialYearId ??
                  ""
                }
                onChange={handleFinancialYearSelect}
              >
                <option value="">Select Financial Year</option>
                {financialYears.map(year => (
                  <option key={year.Id} value={year.Id}>
                    {year.Name}
                  </option>
                ))}
              </Form.Select>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2 text-muted">Loading dalali data...</p>
            </div>
          )}

          {/* Data Source Info - Only show when data is loaded */}
          {!isLoading && dataLoaded && (
            <div
              className={`alert ${
                isExistingDataLoaded ? "alert-warning" : "alert-info"
              } mb-3`}
            >
              <div className="row">
                <div className="col-md-6">
                  <strong>Selected Ledger:</strong>{" "}
                  {dalaliData.length > 0 && dalaliData[0].LedgerName 
                    ? dalaliData[0].LedgerName 
                    : (state.LedgerArray.find(l => l.Id === parseInt(ledgerId))?.Name || "Unknown Ledger")}
                </div>
                <div className="col-md-6 text-end">
                  <strong>Total Rows:</strong> {dalaliData.length}
                </div>
              </div>
            </div>
          )}

          {/* Table - Only show when data is loaded and not empty */}
          {!isLoading && dataLoaded && dalaliData.length > 0 && (
            <div
              className="table-responsive"
              style={{ maxHeight: "400px", overflowY: "auto" }}
            >
            <Table striped bordered hover className="mb-0">
              <thead className="table-warning">
                <tr>
                  <th className="text-center">Item Name</th>
                  <th
                    className="text-center"
                    title="Purchase Quantity (summed from report data for same Item Type)"
                  >
                    Pur. Qty 
                  </th>
                  <th
                    className="text-center"
                    title="Sales Quantity (summed from report data for same Item Type)"
                  >
                    Sel. Qty
                  </th>
                  <th
                    className="text-center"
                    title="Type is automatically determined: P = Purchase (when PurQty > 0), S = Sales (when SelQty > 0)"
                  >
                    Type
                  </th>
                  <th className="text-center">Dalali Rate</th>
                  <th className="text-center">Total Dalali Amount</th>
                </tr>
              </thead>
              <tbody>
                {dalaliData.map((item, index) => (
                  <tr key={index}>
                    <td
                      className="text-center fw-semibold"
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#6c757d",
                        fontStyle: "italic",
                      }}
                      title="Item Name"
                    >
                      {item.ItemName}
                    </td>
                    <td
                      className="text-center fw-semibold"
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#6c757d",
                        fontStyle: "italic",
                      }}
                      title="Quantity from report data (read-only)"
                    >
                      {parseFloat(item.BuyerQty || 0).toFixed(2)}
                    </td>
                    <td
                      className="text-center fw-semibold"
                      style={{
                        backgroundColor: "#f8f9fa",
                        color: "#6c757d",
                        fontStyle: "italic",
                      }}
                      title="Quantity from report data (read-only)"
                    >
                      {parseFloat(item.SellerQty || 0).toFixed(2)}
                    </td>
                    <td className="text-center">
                      {/* Type is automatically determined: P for Purchase (PurQty > 0), S for Sales (SelQty > 0) */}
                      <div
                        className={`badge ${
                          item.BuyerQty > 0 ? "bg-primary" : "bg-success"
                        } fw-bold text-white px-2 py-1`}
                        style={{ fontSize: "0.75rem" }}
                      >
                        {item.BuyerQty > 0 ? "P" : "S"}
                      </div>
                    </td>

                    <td className="text-center">
                      <div className="position-relative">
                        <input
                          type="number"
                          className={`form-control form-control-sm text-center ${
                            item.isExisting
                              ? "border-success"
                              : "border-primary"
                          }`}
                          value={
                            dalaliRates[
                              `${item.ItemId}_${item.Type}`
                            ] || ""
                          }
                          onChange={e => {
                            const newRate = parseFloat(e.target.value) || 0;
                            const rateKey = `${item.ItemId}_${item.Type}`;
                            setDalaliRates(prev => ({
                              ...prev,
                              [rateKey]: newRate,
                            }));

                            // Calculate amount immediately for this row
                            const updatedData = [...dalaliData];
                            const itemIndex = updatedData.findIndex(
                              row =>
                                row.ItemId === item.ItemId &&
                                row.Type === item.Type
                            );
                            if (itemIndex !== -1) {
                              updatedData[itemIndex].DalaliRate = newRate;
                              const quantity =
                                item.BuyerQty > 0 ? item.BuyerQty : item.SellerQty;
                              updatedData[itemIndex].DalaliAmount =
                                parseFloat((quantity * newRate).toFixed(2));
                              setDalaliData(state.DalaliArray);
                            }
                          }}
                          style={{ width: "80px" }}
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </td>
                    <td className="text-end fw-bold text-primary">
                      <div className="d-flex flex-column align-items-end">
                        <span>
                          ₹
                          {item.DalaliAmount
                            ? parseFloat(item.DalaliAmount).toFixed(2)
                            : "0.00"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Summary Row */}
                {dalaliData.length > 0 && (
                  <tr className="table-primary fw-bold">
                    <td className="text-center">
                      <i className="fas fa-calculator me-1"></i>
                      TOTALS
                    </td>
                    <td className="text-center">
                      {dalaliData
                        .reduce(
                          (sum, item) => sum + parseFloat(item.BuyerQty || 0),
                          0
                        )
                        .toFixed(2)}
                    </td>
                    <td className="text-center">
                      {dalaliData
                        .reduce(
                          (sum, item) => sum + parseFloat(item.SellerQty || 0),
                          0
                        )
                        .toFixed(2)}
                    </td>
                    <td className="text-center">-</td>
                    <td className="text-center">-</td>
                    <td className="text-end text-primary">
                      <div className="d-flex align-items-center justify-content-end gap-2">
                        <span>
                          ₹
                          {dalaliData
                            .reduce(
                              (sum, item) =>
                                sum + parseFloat(item.DalaliAmount || 0),
                              0
                            )
                            .toFixed(2)}
                        </span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
            </div>
          )}

          {/* No Data Message */}
          {!isLoading && dataLoaded && dalaliData.length === 0 && (
            <div className="text-center p-5">
              <div className="text-muted">
                <i className="fas fa-info-circle fa-3x mb-3"></i>
                <h5>No Dalali Data Found</h5>
                <p>No dalali records found for the selected ledger and date range.</p>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter className="justify-content-center">
          <Button
            color="success"
            onClick={handleSaveDalaliData}
            className="px-4 py-2"
            title="Save dalali bill data"
            disabled={isLoading || !dataLoaded || dalaliData.length === 0}
          >
            <i className="fas fa-save me-2"></i>
            Save
          </Button>

          <Button
            color="primary"
            onClick={handlePrintDalaliData}
            className="px-4 py-2"
            title="Export as PDF"
            disabled={isLoading || !dataLoaded || dalaliData.length === 0}
          >
            <i className="fas fa-file-pdf me-2"></i>
            PDF
          </Button>
          <Button
            color="secondary"
            onClick={handleExitDalaliData}
            className="px-4 py-2"
            title="Close modal"
          >
            <i className="fas fa-times me-2"></i>
            Exit
          </Button>
        </ModalFooter>
      </Modal>

      {/* DalaliPrint Modal */}
      <DalaliPrint
        show={showDalaliPrintModal}
        onHide={closeDalaliPrintModal}
        selectedLedgerId={ledgerId}
        dalaliData={dalaliData}
        onPrint={handleDalaliPrintData}
        ledgerName={
          state.LedgerArray.find(l => l.Id === parseInt(ledgerId))
            ?.Name || "Unknown"
        }
        fromDate={new Date().toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      />

      {/* Remarks Modal */}
      <Modal show={showRemarksModal} onHide={() => { setShowRemarksModal(false); setRemarks(''); }} centered style={{ zIndex: 10001 }}>
        <ModalHeader closeButton>
          <h5 className="mb-0">
            <FileText className="me-2" size={18} />
            Add Remarks (Optional)
          </h5>
        </ModalHeader>
        <ModalBody>
          <textarea
            className="form-control"
            rows={4}
            placeholder="Enter remarks in English or Hindi (हिंदी में लिख सकते हैं)..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            style={{ fontSize: '1rem', fontFamily: '"Noto Sans Devanagari", "Nirmala UI", Arial, sans-serif' }}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setShowRemarksModal(false); setRemarks(''); }}>Cancel</Button>
          <Button variant="primary" onClick={generateDalaliPDF}>Generate PDF</Button>
        </ModalFooter>
      </Modal>

      {/* Share PDF Modal */}
      <Modal show={showSharePDFModal} onHide={() => { setShowSharePDFModal(false); setPendingShareFile(null); }} centered style={{ zIndex: 10001 }}>
        <ModalHeader closeButton>
          <h5 className="mb-0">
            <FileText className="me-2" size={18} />
            PDF Ready
          </h5>
        </ModalHeader>
        <ModalBody>
          <p className="mb-0">Click Download to save the PDF or Share to send it.</p>
        </ModalBody>
        <ModalFooter>
          <Button variant="secondary" onClick={() => { setShowSharePDFModal(false); setPendingShareFile(null); }}>Cancel</Button>
          <Button variant="success" onClick={handleDownloadPDF}><Download size={14} className="me-1" />Download PDF</Button>
          <Button variant="primary" onClick={handleSharePDFClick}>Share PDF</Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

DalaliModal.displayName = 'DalaliModal';

export default DalaliModal;
