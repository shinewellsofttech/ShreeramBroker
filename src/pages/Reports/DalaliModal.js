import React, { useState, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Table, Form } from "react-bootstrap";
import { useDispatch } from "react-redux";
import { toast } from "react-toastify";
import { API_WEB_URLS, getGlobalOptions as getCachedGlobalOptions, getDefaultFinancialYearId, getCompanyName } from "constants/constAPI";
import { Fn_FillListData, Fn_AddEditData } from "store/Functions";
import DalaliPrint from "./DalaliPrint";
import { Fn_GetReport } from "store/Functions";
import { useNavigate } from "react-router-dom";


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
    if (typeof date === 'string') return date;
    if (date instanceof Date) {
      // Convert to ISO string format (YYYY-MM-DDTHH:mm:ss.sssZ)
      return date.toISOString();
    }
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
    
  const handlePrintDalaliData = () => {
    if (!ledgerId) {
      toast.error("Please select a ledger first to print Dalali Data");
      return;
    }

    if (!dalaliData || dalaliData.length === 0) {
      toast.error("Please generate Dalali Data data first");
      return;
    }
    
        // Open DalaliPrint in a new window instead of modal
        const printWindow = window.open(
          "",
          "_blank",
          "width=1000,height=800,scrollbars=yes,resizable=yes"
        )
    
        if (printWindow) {
          // Get today's date in DD/MM/YYYY format
          const today = new Date()
          const todayFormatted = today.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })
    
          // Initialize form data from dalali data
                const items = dalaliData.map(item => ({
            itemName: item.ItemName || "",
            buyerQty: item.BuyerQty || 0,
            sellerQty: item.SellerQty || 0,
            rate: item.DalaliRate || 0,
            dalali: item.DalaliAmount || 0,
            LedgerName: item.LedgerName || "",
            
          }))
    
          // Generate a unique bill number based on current timestamp
          const billNumber = `DB${Date.now().toString().slice(-6)}`
    
          const formData = {
            partyName: dalaliData.length > 0 ? dalaliData[0].LedgerName || "" : "",
            fromDate: "01/04/2024",
            toDate: todayFormatted,
            contactPerson: "KAILASH CHANDAK",
            billNo: billNumber,
            pan: "ACSPC 3779 L",
            gstin: "ACSPC 3779 L ST 001",
            items: items,
          };
    
          // Calculate totals
          const totals = items.reduce(
            (acc, item) => {
              acc.totalPurQty += parseFloat(item.buyerQty) || 0;
              acc.totalSelQty += parseFloat(item.sellerQty) || 0;
              acc.totalDalali += parseFloat(item.dalali) || 0;
              return acc;
            },
            { totalPurQty: 0, totalSelQty: 0, totalDalali: 0 }
          );
    
          // Number to words function
          const numberToWords = num => {
            const ones = [
              "",
              "One",
              "Two",
              "Three",
              "Four",
              "Five",
              "Six",
              "Seven",
              "Eight",
              "Nine",
            ]
            const tens = [
              "",
              "",
              "Twenty",
              "Thirty",
              "Forty",
              "Fifty",
              "Sixty",
              "Seventy",
              "Eighty",
              "Ninety",
            ]
            const teens = [
              "Ten",
              "Eleven",
              "Twelve",
              "Thirteen",
              "Fourteen",
              "Fifteen",
              "Sixteen",
              "Seventeen",
              "Eighteen",
              "Nineteen",
            ]
    
            if (num === 0) return "Zero"
            if (num < 10) return ones[num]
            if (num < 20) return teens[num - 10]
            if (num < 100)
              return (
                tens[Math.floor(num / 10)] +
                (num % 10 !== 0 ? " " + ones[num % 10] : "")
              )
            if (num < 1000)
              return (
                ones[Math.floor(num / 100)] +
                " Hundred" +
                (num % 100 !== 0 ? " and " + numberToWords(num % 100) : "")
              )
            if (num < 100000)
              return (
                numberToWords(Math.floor(num / 1000)) +
                " Thousand" +
                (num % 1000 !== 0 ? " " + numberToWords(num % 1000) : "")
              )
            if (num < 10000000)
              return (
                numberToWords(Math.floor(num / 100000)) +
                " Lakh" +
                (num % 100000 !== 0 ? " " + numberToWords(num % 100000) : "")
              )
            return (
              numberToWords(Math.floor(num / 10000000)) +
              " Crore" +
              (num % 10000000 !== 0 ? " " + numberToWords(num % 10000000) : "")
            )
          }
    
          // Create the complete HTML content for the new window
          const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <title>Dalali Bill - ${formData.partyName}</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
              <style>
                body { font-family: Arial, sans-serif; }
                .table th, .table td { padding: 4px 8px; font-size: 11px; }
                .dalali-bill-container { font-size: 12px; line-height: 1.4; }
                @media print {
                  .no-print { display: none !important; }
                }
              </style>
            </head>
            <body>
              <div class="container-fluid p-3">
                <div class="no-print mb-3">
                  <button onclick="window.print()" class="btn btn-primary">Print</button>
                  <button onclick="window.close()" class="btn btn-secondary ms-2">Close</button>
                </div>
                <div class="dalali-bill-container" style="font-family: Arial, sans-serif;">
                  <!-- Header -->
                  <div class="text-center mb-4">
                    <h3 class="mb-1"><strong>${getCompanyName().toUpperCase()}</strong></h3>
                    <p class="mb-1">V-4, MANDORE MANDI, JODHPUR</p>
                  </div>
    
                  <!-- Bill Details -->
                  <div class="row mb-4">
                    <div class="col-md-6">
                      <div class="mb-2">
                        <strong>Party Name:</strong> ${formData.partyName}
                      </div>
                      <div class="mb-2">
                        <strong>Dalali Bill from Date:</strong> ${formData.fromDate}
                      </div>
                      <div class="mb-2">
                        <strong>To Date:</strong> ${formData.toDate}
                      </div>
                      <div class="mb-2">
                        ${formData.contactPerson}
                      </div>
                    </div>
                    <div class="col-md-6 text-end">
                      <div class="mb-2">
                        <strong>PAN:</strong> ${formData.pan}
                      </div>
                      <div class="mb-2">
                        <strong>GSTIN:</strong> ${formData.gstin}
                      </div>
                    </div>
                  </div>
    
                  <!-- Items Table -->
                  <table class="table table-bordered mb-4">
                    <thead>
                      <tr class="text-center">
                        <th><strong>Item Name</strong></th>
                        <th><strong>Pur.Qty</strong></th>
                        <th><strong>Sel.Qty</strong></th>
                        <th><strong>Dalali Rate</strong></th>
                        <th><strong>Dalali Amount</strong></th>
                     
                      </tr>
                    </thead>
                    <tbody>
                      ${items
                        .map(
                          item => `
                        <tr>
                          <td>
                            ${item.itemName}
                            
                          </td>
                          <td class="text-end">${
                            item.buyerQty > 0 ? item.buyerQty.toLocaleString() : ""
                          }</td>
                          <td class="text-end">${
                            item.sellerQty > 0 ? item.sellerQty.toLocaleString() : ""
                          }</td>
                          <td class="text-end">${item.rate}</td>
                          <td class="text-end">${item.dalali}</td>
    
                          
                        </tr>
                      `
                        )
                        .join("")}
                    </tbody>
                    <tfoot>
                      <tr class="table-active">
                        <td><strong>Total</strong></td>
                        <td class="text-end"><strong>${totals.totalPurQty.toLocaleString()}</strong></td>
                        <td class="text-end"><strong>${totals.totalSelQty.toLocaleString()}</strong></td>
                        <td></td>
                      
                        <td class="text-end"><strong>${totals.totalDalali.toLocaleString()}</strong></td>
                         
                      </tr>
                    </tfoot>
                  </table>
    
                  <!-- Summary -->
                  <div class="row mb-4">
                    <div class="col-md-6">
                      <div class="mb-2">
                        <strong>Total Pur.Qty:</strong> ${totals.totalPurQty.toLocaleString()}
                      </div>
                      <div class="mb-2">
                        <strong>Total Sel.Qty:</strong> ${totals.totalSelQty.toLocaleString()}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-2">
                        <strong>Total Dalali:</strong> ₹${totals.totalDalali.toLocaleString()}
                      </div>
                      <div class="mb-2">
                        <strong>Rupees (In Words):</strong> ${numberToWords(
                          Math.floor(totals.totalDalali)
                        )} Only
                      </div>
                    </div>
                  </div>
    
                  <!-- Footer -->
                  <div class="text-center mt-5">
                    <p>For : ${getCompanyName().toUpperCase()}</p>
                    <div class="mt-4">
                      <p>_________________________</p>
                      <p>Authorized Signatory</p>
                    </div>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
    
          // Write the content to the new window
          printWindow.document.write(htmlContent)
          printWindow.document.close()
    
          // Focus on the new window
          printWindow.focus()
        } else {
          // Fallback to modal if popup is blocked
          setShowDalaliPrintModal(true)
        }
      }
    
  const handleExitDalaliData = () => {
        closeDalaliDataModal();
        onHideDalaliDataModal();
  };

  const closeDalaliPrintModal = () => {
    setShowDalaliPrintModal(false);
  };

  const handleDalaliPrintData = printData => {
    // Handle print functionality
    console.log("Printing Dalali Data:", printData);
    toast.success("Dalali Data sent to printer");
    // You can implement actual print logic here
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
            title="Print dalali bill"
            disabled={isLoading || !dataLoaded || dalaliData.length === 0}
          >
            <i className="fas fa-print me-2"></i>
            Print
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
    </>
  );
};

DalaliModal.displayName = 'DalaliModal';

export default DalaliModal;
