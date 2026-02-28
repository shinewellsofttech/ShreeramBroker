import { API_WEB_URLS, getGlobalOptions as getCachedGlobalOptions, getDefaultFinancialYearId } from 'constants/constAPI';
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Fn_GetReport, Fn_FillListData } from 'store/Functions';
import { Card, CardBody, Col, Container, Row, Table, Input, Modal, ModalHeader, ModalBody, ModalFooter, Button, Label, Spinner } from 'reactstrap';
import { Filter } from 'react-feather';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import { applyPlugin as applyAutoTable } from 'jspdf-autotable';
applyAutoTable(jsPDF);
import { toast } from 'react-toastify';
import useColumnResize from '../../helpers/useColumnResize'
import '../../helpers/columnResize.css'

function BrokerageCalculation() {
    const dispatch = useDispatch();
    const globalDates = useSelector(state => state.GlobalDates);
    
    // State and ref for scroll to top button
    const [showScrollTop, setShowScrollTop] = useState(false);
    const tableContainerRef = useRef(null);

    // Column resize feature
    const { columnWidths, handleResizeMouseDown } = useColumnResize('brokerageCalculation_columnWidths', {
        Checkbox: 36,
        SrNo: 40,
        LedgerName: 150,
        SellQty: 80,
        PurQty: 80,
        TotalBrokerage: 100,
        CrAmount: 90,
        DrAmount: 90,
        Balance: 100,
    })
    
    const [state, setState] = useState({
        FillArray: [],
        LedgerArray: [],
        DalaliArray: [],
        GlobalArray: [],
        FromDate: globalDates.fromDate,
        ToDate: globalDates.toDate,   
    });
    
    // Modal state for Ledger multi-select
    const [showLedgerModal, setShowLedgerModal] = useState(false);
    const [selectedLedgerIds, setSelectedLedgerIds] = useState([]);
    const [tempSelectedLedgerIds, setTempSelectedLedgerIds] = useState([]);
    
    // Detailed view state
    const [isDetailed, setIsDetailed] = useState(false);
    const [isLoadingDetailed, setIsLoadingDetailed] = useState(false);
    
    // Dalali data per ledger
    const [dalaliDataMap, setDalaliDataMap] = useState(new Map());
    const [dalaliDataVersion, setDalaliDataVersion] = useState(0);
    
    // Checkbox selection state
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // PDF Remarks Modal (same as ReminderData)
    const [showRemarksModal, setShowRemarksModal] = useState(false);
    const [remarks, setRemarks] = useState('');
    const [pendingShareFile, setPendingShareFile] = useState(null);
    const [showSharePDFModal, setShowSharePDFModal] = useState(false);
    
    const compactCellStyle = { padding: '0.35rem 0.5rem', fontSize: '0.85rem' };

    const API_URL_Get = `${API_WEB_URLS.BrokerageCalculation}/0/token`
    const API_URL_Dalali = `${API_WEB_URLS.GetDalaliLedgerData}/0/token`
    const API_URL_GlobalOptions = API_WEB_URLS.MASTER + "/0/token/GlobalOptions"
    
    // Helper function to format date in local time (YYYY-MM-DD) without timezone conversion
    const formatDateLocal = (date) => {
        if (!date) return ''
        // If date is already a string in YYYY-MM-DD format, return it
        if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date
        }
        // If date is a string, parse it as local date
        const dateObj = typeof date === 'string' 
            ? new Date(date + 'T00:00:00') 
            : new Date(date)
        const year = dateObj.getFullYear()
        const month = String(dateObj.getMonth() + 1).padStart(2, '0')
        const day = String(dateObj.getDate()).padStart(2, '0')
        return `${year}-${month}-${day}`
    }
    
    // Format date for API (ISO string format like DalaliModal)
    const formatDateForAPI = (date) => {
        if (!date) return '';
        if (typeof date === 'string') return date;
        if (date instanceof Date) {
            return date.toISOString();
        }
        return date.toString();
    }
    
    // Use cached GlobalOptions (set at login); fallback to API if empty
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
    
const getBrokerageCalculation = async () => {
    try {
        const formData = new FormData();
        const fromDate = formatDateLocal(state.FromDate);
        const toDate = formatDateLocal(state.ToDate);
        formData.append("FromDate", fromDate);
        formData.append("ToDate", toDate);
        const response = await Fn_GetReport(dispatch, setState, "FillArray", API_URL_Get, { arguList: { id: 0, formData: formData } }, true);
   
    } catch (error) {
        console.log("error", error);
    }
}

const getDalaliData = async () => {
    setIsLoadingDetailed(true);
    try {
        // Get F_FinancialYearMaster from GlobalOptions
        const financialYearId = await getGlobalOptions();
        const resolvedFinancialYearId = typeof financialYearId === "number" ? financialYearId : parseInt(financialYearId, 10) || 0;
        
        // Get unique LedgerIds - only selected ones if any are selected
        const uniqueLedgerIds = new Set();
        if (selectedLedgerIds && selectedLedgerIds.length > 0) {
            // Only fetch data for selected ledgers
            selectedLedgerIds.forEach(id => {
                const ledgerId = typeof id === 'string' ? parseInt(id, 10) : id;
                if (ledgerId !== null && ledgerId !== undefined && !isNaN(ledgerId)) {
                    uniqueLedgerIds.add(ledgerId);
                }
            });
        } else {
            // If no selection, get all unique LedgerIds from FillArray
            state.FillArray.forEach(item => {
                if (item.LedgerId !== null && item.LedgerId !== undefined) {
                    uniqueLedgerIds.add(item.LedgerId);
                }
            });
        }
        
        // Call GetDalaliLedgerData API for each LedgerId
        const newDalaliDataMap = new Map();
        
        for (const ledgerId of uniqueLedgerIds) {
            try {
                const formData = new FormData();
                formData.append("LedgerId", ledgerId);
                formData.append("F_FinancialYearMaster", resolvedFinancialYearId);
                formData.append("FromDate", formatDateForAPI(state.FromDate));
                formData.append("ToDate", formatDateForAPI(state.ToDate));
                
                // Fn_GetReport returns a Promise that resolves with the responseData
                // Use a dummy setState since we'll use the resolved value
                const responseData = await Fn_GetReport(
                    dispatch,
                    () => ({}), // Dummy setState, we use the resolved value
                    "DalaliArray",
                    API_URL_Dalali,
                    { arguList: { id: 0, formData: formData } },
                    true
                );
                
                // responseData contains the actual data array
                const dalaliDataForLedger = responseData || [];
                
                // Store dalali data for this ledger
                if (dalaliDataForLedger.length > 0) {
                    newDalaliDataMap.set(String(ledgerId), dalaliDataForLedger);
                }
            } catch (error) {
                console.log(`Error fetching dalali data for LedgerId ${ledgerId}:`, error);
            }
        }
        
        setDalaliDataMap(newDalaliDataMap);
        setDalaliDataVersion(prev => prev + 1);
    } catch (error) {
        console.log("error fetching dalali data", error);
        toast.error("Error loading detailed data. Please try again.");
    } finally {
        setIsLoadingDetailed(false);
    }
}

    // Scroll event handler for table container
    const handleTableScroll = () => {
        const tableContainer = tableContainerRef.current;
        if (tableContainer) {
            const scrollPosition = tableContainer.scrollTop;
            if (scrollPosition > 200) {
                setShowScrollTop(true);
            } else {
                setShowScrollTop(false);
            }
        }
    }

    // Scroll to top function for table container
    const scrollToTop = () => {
        const tableContainer = tableContainerRef.current;
        if (tableContainer) {
            try {
                tableContainer.scrollTo({
                    top: 0,
                    behavior: "smooth"
                });
            } catch (error) {
                tableContainer.scrollTop = 0;
            }
        }
    }

    // Scroll to top button visibility handler for table container
    useEffect(() => {
        const timer = setTimeout(() => {
            const tableContainer = tableContainerRef.current;
            if (tableContainer) {
                handleTableScroll();
                tableContainer.addEventListener("scroll", handleTableScroll);
            }
        }, 100);

        return () => {
            clearTimeout(timer);
            const tableContainer = tableContainerRef.current;
            if (tableContainer) {
                tableContainer.removeEventListener("scroll", handleTableScroll);
            }
        }
    }, []);

    const handleDateChange = (field, value) => {
        setState(prev => ({
            ...prev,
            [field]: value
        }));
    }

    // Build ledger options from FillArray
    const ledgerOptions = useMemo(() => {
        if (!state.FillArray || state.FillArray.length === 0) {
            return [];
        }
        const uniqueLedgersMap = new Map();
        state.FillArray.forEach(item => {
            const ledgerId = item.LedgerId;
            const ledgerName = item.LedgerName;
            if (ledgerId !== null && ledgerId !== undefined && ledgerName) {
                const key = String(ledgerId);
                if (!uniqueLedgersMap.has(key)) {
                    uniqueLedgersMap.set(key, { id: ledgerId, name: ledgerName });
                }
            }
        });
        return Array.from(uniqueLedgersMap.values())
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [state.FillArray]);

    // Structure detailed data with ledger-wise items (like Dalali Modal)
    const detailedData = useMemo(() => {
        if (!isDetailed || dalaliDataMap.size === 0) {
            return [];
        }

        // Group brokerage data by LedgerId - only include selected ledgers if any are selected
        const brokerageMap = new Map();
        const ledgerIdsToProcess = selectedLedgerIds && selectedLedgerIds.length > 0 
            ? selectedLedgerIds.map(id => String(id))
            : null; // null means process all
        
        state.FillArray.forEach(item => {
            const ledgerId = item.LedgerId;
            const key = String(ledgerId);
            
            // If ledgerIdsToProcess is not null, only process selected ledgers
            if (ledgerIdsToProcess && !ledgerIdsToProcess.includes(key)) {
                return;
            }
            
            if (!brokerageMap.has(key)) {
                brokerageMap.set(key, {
                    LedgerId: ledgerId,
                    LedgerName: item.LedgerName,
                    TotalSellerQty: item.TotalSellerQty || 0,
                    TotalBuyerQty: item.TotalBuyerQty || 0,
                    TotalBrokerage: item.TotalBrokerage || 0,
                    CrAmountTotal: item.CrAmountTotal || 0,
                    DrAmountTotal: item.DrAmountTotal || 0,
                    LedgerBalance: item.LedgerBalance || 0,
                    Items: []
                });
            }
        });

        // Process dalali data - structure like Dalali Modal (separate rows for P and S)
        // The API might return item-wise data with Type (P/S) or aggregated data
        // Group by LedgerId first, then by ItemId
        const ledgerItemsMap = new Map();
        
        // Iterate through dalaliDataMap (keyed by LedgerId) - only process selected ledgers if any are selected
        dalaliDataMap.forEach((dalaliArray, ledgerKey) => {
            if (!dalaliArray || dalaliArray.length === 0) return;
            
            // If ledgerIdsToProcess is not null, only process selected ledgers
            if (ledgerIdsToProcess && !ledgerIdsToProcess.includes(ledgerKey)) {
                return;
            }
            
            dalaliArray.forEach(dalaliItem => {
            // Use ledgerKey from the outer forEach (from dalaliDataMap)
            const itemId = dalaliItem.ItemId || dalaliItem.F_ItemType || dalaliItem.F_ItemMaster;
            const itemName = dalaliItem.ItemName || dalaliItem.Item || dalaliItem.ItemTypeName || 'Unknown Item';
            
            // Skip if no item ID
            if (!itemId) return;
            
            if (!ledgerItemsMap.has(ledgerKey)) {
                ledgerItemsMap.set(ledgerKey, new Map());
            }
            
            const itemMap = ledgerItemsMap.get(ledgerKey);
            const itemKey = String(itemId);
            
            // Check if this row has Type field (P or S) - like GetDalaliLedgerData API
            const type = dalaliItem.Type;
            const buyerQty = dalaliItem.BuyerQty || dalaliItem.TotalBuyerQty || 0;
            const sellerQty = dalaliItem.SellerQty || dalaliItem.TotalSellerQty || 0;
            const buyerAmount = dalaliItem.BuyerAmount || dalaliItem.TotalBuyerAmount || 0;
            const sellerAmount = dalaliItem.SellerAmount || dalaliItem.TotalSellerAmount || 0;
            const dalaliRate = dalaliItem.DalaliRate || 0;
            const dalaliAmount = dalaliItem.DalaliAmount || dalaliItem.Total || 0;
            
            if (type) {
                // Data has Type field (like GetDalaliLedgerData) - separate P and S rows
                if (!itemMap.has(itemKey)) {
                    itemMap.set(itemKey, {
                        ItemId: itemId,
                        ItemName: itemName,
                        PurchaseRow: null,
                        SalesRow: null
                    });
                }
                
                const itemData = itemMap.get(itemKey);
                
                if (type === "P") {
                    // Purchase row
                    itemData.PurchaseRow = {
                        ItemId: itemId,
                        ItemName: itemName,
                        Type: "P",
                        Qty: buyerQty,
                        Amount: buyerAmount,
                        DalaliRate: dalaliRate,
                        DalaliAmount: dalaliAmount || (buyerQty * dalaliRate)
                    };
                } else if (type === "S") {
                    // Sales row
                    itemData.SalesRow = {
                        ItemId: itemId,
                        ItemName: itemName,
                        Type: "S",
                        Qty: sellerQty,
                        Amount: sellerAmount,
                        DalaliRate: dalaliRate,
                        DalaliAmount: dalaliAmount || (sellerQty * dalaliRate)
                    };
                }
            } else {
                // Aggregated data - create both P and S rows if quantities exist
                if (!itemMap.has(itemKey)) {
                    itemMap.set(itemKey, {
                        ItemId: itemId,
                        ItemName: itemName,
                        PurchaseRow: null,
                        SalesRow: null
                    });
                }
                
                const itemData = itemMap.get(itemKey);
                
                // Create Purchase row if buyer qty exists
                if (buyerQty > 0) {
                    itemData.PurchaseRow = {
                        ItemId: itemId,
                        ItemName: itemName,
                        Type: "P",
                        Qty: buyerQty,
                        Amount: buyerAmount,
                        DalaliRate: dalaliRate,
                        DalaliAmount: dalaliAmount || (buyerQty * dalaliRate)
                    };
                }
                
                // Create Sales row if seller qty exists
                if (sellerQty > 0) {
                    itemData.SalesRow = {
                        ItemId: itemId,
                        ItemName: itemName,
                        Type: "S",
                        Qty: sellerQty,
                        Amount: sellerAmount,
                        DalaliRate: dalaliRate,
                        DalaliAmount: dalaliAmount || (sellerQty * dalaliRate)
                    };
                }
            }
            });
        });

        // Combine dalali items with brokerage data
        const result = [];
        
        // Process all ledgers from brokerage data
        brokerageMap.forEach((brokerageData, ledgerKey) => {
            const items = [];
            const itemMap = ledgerItemsMap.get(ledgerKey);
            
            if (itemMap) {
                // Get all items for this ledger and sort by ItemName
                const sortedItems = Array.from(itemMap.values()).sort((a, b) => 
                    (a.ItemName || '').localeCompare(b.ItemName || '')
                );
                
                sortedItems.forEach(itemData => {
                    // Add Purchase row if exists
                    if (itemData.PurchaseRow && itemData.PurchaseRow.Qty > 0) {
                        items.push(itemData.PurchaseRow);
                    }
                    // Add Sales row if exists
                    if (itemData.SalesRow && itemData.SalesRow.Qty > 0) {
                        items.push(itemData.SalesRow);
                    }
                });
            }
            
            result.push({
                ...brokerageData,
                Items: items
            });
        });
        
        // Add ledgers that have dalali but no brokerage - only if selected or all if none selected
        ledgerItemsMap.forEach((itemMap, ledgerKey) => {
            // If ledgerIdsToProcess is not null, only process selected ledgers
            if (ledgerIdsToProcess && !ledgerIdsToProcess.includes(ledgerKey)) {
                return;
            }
            
            if (!brokerageMap.has(ledgerKey)) {
                const firstItem = Array.from(itemMap.values())[0];
                const ledgerName = firstItem?.PurchaseRow?.LedgerName || firstItem?.SalesRow?.LedgerName || "Unknown";
                const ledgerId = parseInt(ledgerKey);
                
                const items = [];
                const sortedItems = Array.from(itemMap.values()).sort((a, b) => 
                    (a.ItemName || '').localeCompare(b.ItemName || '')
                );
                
                sortedItems.forEach(itemData => {
                    if (itemData.PurchaseRow && itemData.PurchaseRow.Qty > 0) {
                        items.push(itemData.PurchaseRow);
                    }
                    if (itemData.SalesRow && itemData.SalesRow.Qty > 0) {
                        items.push(itemData.SalesRow);
                    }
                });
                
                result.push({
                    LedgerId: ledgerId,
                    LedgerName: ledgerName,
                    TotalSellerQty: 0,
                    TotalBuyerQty: 0,
                    TotalBrokerage: 0,
                    CrAmountTotal: 0,
                    DrAmountTotal: 0,
                    LedgerBalance: 0,
                    Items: items
                });
            }
        });

        return result.sort((a, b) => (a.LedgerName || '').localeCompare(b.LedgerName || ''));
    }, [state.FillArray, dalaliDataVersion, isDetailed, selectedLedgerIds]);

        // Filter data based on selected ledger IDs
    const filteredData = useMemo(() => {
        if (isDetailed) {
            const data = detailedData;
            if (!selectedLedgerIds || selectedLedgerIds.length === 0) {
                return data; // Show all if nothing selected
            }
            return data.filter(item => 
                selectedLedgerIds.some(id => String(item.LedgerId) === String(id))
            );
        } else {
            const data = state.FillArray ?? [];
            if (!selectedLedgerIds || selectedLedgerIds.length === 0) {
                return data; // Show all if nothing selected
            }
            return data.filter(item => 
                selectedLedgerIds.some(id => String(item.LedgerId) === String(id))
            );
        }
    }, [state.FillArray, selectedLedgerIds, isDetailed, detailedData]);

    // Modal handlers
    const openLedgerModal = () => {
        setTempSelectedLedgerIds([...selectedLedgerIds]);
        setShowLedgerModal(true);
    };

    const closeLedgerModal = () => {
        setShowLedgerModal(false);
    };

    const handleLedgerModalDone = () => {
        setSelectedLedgerIds([...tempSelectedLedgerIds]);
        setShowLedgerModal(false);
    };

    // Handle individual row selection
    const handleRowSelect = (rowId) => {
        setSelectedRows(prev => {
            if (prev.includes(rowId)) {
                const newSelection = prev.filter(id => id !== rowId);
                setSelectAll(false);
                return newSelection;
            } else {
                const newSelection = [...prev, rowId];
                // Check if all rows are now selected
                if (isDetailed) {
                    // For detailed view, count all ledger rows
                    const totalRows = filteredData.reduce((count, ledger) => {
                        return count + 1 + (ledger.Items ? ledger.Items.length : 0);
                    }, 0);
                    if (newSelection.length === totalRows) {
                        setSelectAll(true);
                    }
                } else {
                    if (newSelection.length === filteredData.length) {
                        setSelectAll(true);
                    }
                }
                return newSelection;
            }
        });
    };

    // Handle select all
    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedRows([]);
            setSelectAll(false);
        } else {
            if (isDetailed) {
                // For detailed view, select all ledger and item rows
                const allRowIds = [];
                filteredData.forEach((ledger) => {
                    allRowIds.push(`ledger_${ledger.LedgerId}`);
                    if (ledger.Items && ledger.Items.length > 0) {
                        ledger.Items.forEach((item) => {
                            allRowIds.push(`item_${ledger.LedgerId}_${item.ItemId}_${item.Type}`);
                        });
                    }
                });
                setSelectedRows(allRowIds);
            } else {
                // For normal view, select all ledger rows
                const allRowIds = filteredData.map(item => `ledger_${item.LedgerId}`);
                setSelectedRows(allRowIds);
            }
            setSelectAll(true);
        }
    };

    const totals = useMemo(() => {
        const initialTotals = {
            sellerQty: 0,
            buyerQty: 0,
            brokerage: 0,
            crAmount: 0,
            drAmount: 0,
            balance: 0,
            dalaliSellerQty: 0,
            dalaliSellerAmount: 0,
            dalaliBuyerQty: 0,
            dalaliBuyerAmount: 0,
            dalaliTotal: 0
        };

        if (isDetailed) {
            return filteredData.reduce((sum, ledger) => {
                const ledgerTotals = {
                    sellerQty: sum.sellerQty + (ledger.TotalSellerQty || 0),
                    buyerQty: sum.buyerQty + (ledger.TotalBuyerQty || 0),
                    brokerage: sum.brokerage + (ledger.TotalBrokerage || 0),
                    crAmount: sum.crAmount + (ledger.CrAmountTotal || 0),
                    drAmount: sum.drAmount + (ledger.DrAmountTotal || 0),
                    balance: sum.balance + (ledger.LedgerBalance || 0),
                    dalaliSellerQty: sum.dalaliSellerQty,
                    dalaliSellerAmount: sum.dalaliSellerAmount,
                    dalaliBuyerQty: sum.dalaliBuyerQty,
                    dalaliBuyerAmount: sum.dalaliBuyerAmount,
                    dalaliTotal: sum.dalaliTotal
                };

                // Add item-wise dalali totals (like Dalali Modal structure)
                if (ledger.Items && ledger.Items.length > 0) {
                    ledger.Items.forEach(item => {
                        if (item.Type === 'S') {
                            // Sales row
                            ledgerTotals.dalaliSellerQty += (item.Qty || 0);
                            ledgerTotals.dalaliSellerAmount += (item.Amount || 0);
                        } else if (item.Type === 'P') {
                            // Purchase row
                            ledgerTotals.dalaliBuyerQty += (item.Qty || 0);
                            ledgerTotals.dalaliBuyerAmount += (item.Amount || 0);
                        }
                        ledgerTotals.dalaliTotal += (item.DalaliAmount || 0);
                    });
                }

                return ledgerTotals;
            }, initialTotals);
        } else {
            return filteredData.reduce((sum, item) => ({
                sellerQty: sum.sellerQty + (item.TotalSellerQty || 0),
                buyerQty: sum.buyerQty + (item.TotalBuyerQty || 0),
                brokerage: sum.brokerage + (item.TotalBrokerage || 0),
                crAmount: sum.crAmount + (item.CrAmountTotal || 0),
                drAmount: sum.drAmount + (item.DrAmountTotal || 0),
                balance: sum.balance + (item.LedgerBalance || 0),
                dalaliSellerQty: 0,
                dalaliSellerAmount: 0,
                dalaliBuyerQty: 0,
                dalaliBuyerAmount: 0,
                dalaliTotal: 0
            }), initialTotals);
        }
    }, [filteredData, isDetailed]);

    useEffect(() => {
        getBrokerageCalculation();
    }, [dispatch, state.FromDate, state.ToDate])

    useEffect(() => {
        if (isDetailed && state.FillArray && state.FillArray.length > 0) {
            getDalaliData();
        }
    }, [isDetailed, state.FromDate, state.ToDate, state.FillArray, selectedLedgerIds])

    // Excel Export Function
    const handleExcelExport = async () => {
        if (!filteredData || filteredData.length === 0) {
            toast.warning("No data to export");
            return;
        }

        try {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Brokerage Register');

            if (isDetailed) {
                // Detailed View Excel Export
                worksheet.columns = [
                    { header: 'Sr. No.', key: 'srNo', width: 10 },
                    { header: 'Ledger/Item Name', key: 'ledgerItem', width: 30 },
                    { header: 'Sell Qty', key: 'sellQty', width: 12 },
                    { header: 'Pur Qty', key: 'purQty', width: 12 },
                    { header: 'Total Brokerage', key: 'brokerage', width: 15 },
                    { header: 'Cr Amount', key: 'crAmount', width: 15 },
                    { header: 'Dr Amount', key: 'drAmount', width: 15 },
                    { header: 'Balance', key: 'balance', width: 15 },
                    { header: 'Dalali Sell Qty', key: 'dalaliSellQty', width: 15 },
                    { header: 'Dalali Sell Amt', key: 'dalaliSellAmt', width: 15 },
                    { header: 'Dalali Pur Qty', key: 'dalaliPurQty', width: 15 },
                    { header: 'Dalali Pur Amt', key: 'dalaliPurAmt', width: 15 },
                    { header: 'Dalali Rate', key: 'dalaliRate', width: 15 },
                    { header: 'Dalali Total', key: 'dalaliTotal', width: 15 },
                ];

                let rowIndex = 1;
                filteredData.forEach((ledger, ledgerIndex) => {
                    // Ledger Header Row
                    const ledgerRow = worksheet.addRow({
                        srNo: ledgerIndex + 1,
                        ledgerItem: ledger.LedgerName,
                        sellQty: ledger.TotalSellerQty || 0,
                        purQty: ledger.TotalBuyerQty || 0,
                        brokerage: ledger.TotalBrokerage || 0,
                        crAmount: ledger.CrAmountTotal || 0,
                        drAmount: ledger.DrAmountTotal || 0,
                        balance: ledger.LedgerBalance || 0,
                        dalaliSellQty: '',
                        dalaliSellAmt: '',
                        dalaliPurQty: '',
                        dalaliPurAmt: '',
                        dalaliRate: '',
                        dalaliTotal: ''
                    });
                    ledgerRow.font = { bold: true };
                    ledgerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE9ECEF' } };

                    // Item Rows
                    if (ledger.Items && ledger.Items.length > 0) {
                        ledger.Items.forEach((item) => {
                            const itemRow = worksheet.addRow({
                                srNo: '',
                                ledgerItem: `  → ${item.ItemName} [${item.Type === 'P' ? 'Pur' : 'Sel'}]`,
                                sellQty: '',
                                purQty: '',
                                brokerage: '',
                                crAmount: '',
                                drAmount: '',
                                balance: '',
                                dalaliSellQty: item.Type === 'S' ? (item.Qty || 0) : '',
                                dalaliSellAmt: item.Type === 'S' ? (item.Amount || 0) : '',
                                dalaliPurQty: item.Type === 'P' ? (item.Qty || 0) : '',
                                dalaliPurAmt: item.Type === 'P' ? (item.Amount || 0) : '',
                                dalaliRate: item.DalaliRate || 0,
                                dalaliTotal: item.DalaliAmount || 0
                            });
                            itemRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } };
                        });
                    }
                });

                // Totals Row
                const totalsRow = worksheet.addRow({
                    srNo: 'TOTAL',
                    ledgerItem: '',
                    sellQty: totals.sellerQty,
                    purQty: totals.buyerQty,
                    brokerage: totals.brokerage,
                    crAmount: totals.crAmount,
                    drAmount: totals.drAmount,
                    balance: totals.balance,
                    dalaliSellQty: totals.dalaliSellerQty,
                    dalaliSellAmt: totals.dalaliSellerAmount,
                    dalaliPurQty: totals.dalaliBuyerQty,
                    dalaliPurAmt: totals.dalaliBuyerAmount,
                    dalaliRate: '',
                    dalaliTotal: totals.dalaliTotal
                });
                totalsRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
            } else {
                // Normal View Excel Export
                worksheet.columns = [
                    { header: 'Sr. No.', key: 'srNo', width: 10 },
                    { header: 'Ledger Name', key: 'ledgerName', width: 30 },
                    { header: 'Sell Qty', key: 'sellQty', width: 12 },
                    { header: 'Pur Qty', key: 'purQty', width: 12 },
                    { header: 'Total Brokerage', key: 'brokerage', width: 15 },
                    { header: 'Cr Amount', key: 'crAmount', width: 15 },
                    { header: 'Dr Amount', key: 'drAmount', width: 15 },
                    { header: 'Balance', key: 'balance', width: 15 },
                ];

                filteredData.forEach((item, index) => {
                    worksheet.addRow({
                        srNo: index + 1,
                        ledgerName: item.LedgerName,
                        sellQty: item.TotalSellerQty || 0,
                        purQty: item.TotalBuyerQty || 0,
                        brokerage: item.TotalBrokerage || 0,
                        crAmount: item.CrAmountTotal || 0,
                        drAmount: item.DrAmountTotal || 0,
                        balance: item.LedgerBalance || 0
                    });
                });

                // Totals Row
                const totalsRow = worksheet.addRow({
                    srNo: 'TOTAL',
                    ledgerName: '',
                    sellQty: totals.sellerQty,
                    purQty: totals.buyerQty,
                    brokerage: totals.brokerage,
                    crAmount: totals.crAmount,
                    drAmount: totals.drAmount,
                    balance: totals.balance
                });
                totalsRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
                totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
            }

            // Style header row
            const headerRow = worksheet.getRow(1);
            headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
            headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF28A745' } };
            headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
            headerRow.height = 25;

            // Add borders to all cells
            worksheet.eachRow((row) => {
                row.eachCell((cell) => {
                    cell.border = {
                        top: { style: 'thin', color: { argb: 'FF000000' } },
                        left: { style: 'thin', color: { argb: 'FF000000' } },
                        bottom: { style: 'thin', color: { argb: 'FF000000' } },
                        right: { style: 'thin', color: { argb: 'FF000000' } }
                    };
                });
            });

            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
            const fileName = `Brokerage_Register_${isDetailed ? 'Detailed' : 'Normal'}_${timestamp}.xlsx`;

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

            if (navigator.share) {
                try {
                    if (navigator.canShare && navigator.canShare({ files: [file] })) {
                        await navigator.share({
                            title: 'Brokerage Register',
                            text: 'Please find attached the Brokerage Register',
                            files: [file]
                        });
                        toast.success('Excel file shared successfully!');
                        return;
                    }
                } catch (shareError) {
                    if (shareError.name !== 'AbortError') {
                        console.error('Share error:', shareError);
                    }
                }
            }

            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = fileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(navigator.share ? `Excel downloaded. Share is available on mobile.` : `Excel file downloaded: ${fileName}`);
        } catch (error) {
            console.error('Excel export error:', error);
            toast.error('Error exporting to Excel. Please try again.');
        }
    };

    const handleSharePDFClick = async () => {
        if (!pendingShareFile || !navigator.share) return;
        try {
            await navigator.share({
                title: 'Brokerage Register',
                text: 'Please find attached the Brokerage Register',
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

    // PDF Export - open remarks modal (same as ReminderData)
    const handlePDFExport = () => {
        if (!filteredData || filteredData.length === 0) {
            toast.warning("No data to export");
            return;
        }
        setRemarks('');
        setShowRemarksModal(true);
    };

    // Generate PDF with jsPDF + jspdf-autotable, then share - only selected rows
    const handleGeneratePDF = async () => {
        if (!filteredData || filteredData.length === 0) {
            toast.warning("No data to export");
            return;
        }
        if (!selectedRows || selectedRows.length === 0) {
            toast.warning("Please select rows to export to PDF");
            return;
        }

        try {
            // Build data for PDF: only selected rows
            let pdfData;
            let pdfTotals;
            if (isDetailed) {
                pdfData = filteredData
                    .filter(ledger =>
                        selectedRows.includes(`ledger_${ledger.LedgerId}`) ||
                        (ledger.Items || []).some(item => selectedRows.includes(`item_${ledger.LedgerId}_${item.ItemId}_${item.Type}`))
                    )
                    .map(ledger => ({
                        ...ledger,
                        Items: (ledger.Items || []).filter(item => selectedRows.includes(`item_${ledger.LedgerId}_${item.ItemId}_${item.Type}`))
                    }));
                pdfTotals = pdfData.reduce((sum, ledger) => {
                    const out = { ...sum };
                    out.sellerQty += ledger.TotalSellerQty || 0;
                    out.buyerQty += ledger.TotalBuyerQty || 0;
                    out.brokerage += ledger.TotalBrokerage || 0;
                    out.crAmount += ledger.CrAmountTotal || 0;
                    out.drAmount += ledger.DrAmountTotal || 0;
                    out.balance += ledger.LedgerBalance || 0;
                    (ledger.Items || []).forEach(item => {
                        if (item.Type === 'S') {
                            out.dalaliSellerQty += item.Qty || 0;
                            out.dalaliSellerAmount += item.Amount || 0;
                        } else if (item.Type === 'P') {
                            out.dalaliBuyerQty += item.Qty || 0;
                            out.dalaliBuyerAmount += item.Amount || 0;
                        }
                        out.dalaliTotal += item.DalaliAmount || 0;
                    });
                    return out;
                }, { sellerQty: 0, buyerQty: 0, brokerage: 0, crAmount: 0, drAmount: 0, balance: 0, dalaliSellerQty: 0, dalaliSellerAmount: 0, dalaliBuyerQty: 0, dalaliBuyerAmount: 0, dalaliTotal: 0 });
            } else {
                pdfData = filteredData.filter(item => selectedRows.includes(`ledger_${item.LedgerId}`));
                pdfTotals = pdfData.reduce((s, item) => ({
                    sellerQty: s.sellerQty + (item.TotalSellerQty || 0),
                    buyerQty: s.buyerQty + (item.TotalBuyerQty || 0),
                    brokerage: s.brokerage + (item.TotalBrokerage || 0),
                    crAmount: s.crAmount + (item.CrAmountTotal || 0),
                    drAmount: s.drAmount + (item.DrAmountTotal || 0),
                    balance: s.balance + (item.LedgerBalance || 0)
                }), { sellerQty: 0, buyerQty: 0, brokerage: 0, crAmount: 0, drAmount: 0, balance: 0 });
            }

            const doc = new jsPDF({ orientation: isDetailed ? 'landscape' : 'portrait', unit: 'mm', format: 'a4' });
            const filename = `Brokerage_Register_${isDetailed ? 'Detailed' : 'Normal'}_${new Date().toISOString().split('T')[0]}.pdf`;

            const marginX = isDetailed ? 7 : 14;

            doc.setFontSize(20);
            doc.text(`Brokerage Register - ${isDetailed ? 'Detailed View' : 'Normal View'}`, marginX, 12);
            doc.setFontSize(13);
            doc.text(`From: ${state.FromDate ? new Date(state.FromDate).toLocaleDateString('en-GB') : '-'}  To: ${state.ToDate ? new Date(state.ToDate).toLocaleDateString('en-GB') : '-'}`, marginX, 19);
            doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}  |  Selected: ${selectedRows.length} row(s)`, marginX, 25);

            if (isDetailed) {
                const head = [['Sr', 'Ledger/Item', 'Sell Qty', 'Pur Qty', 'Brokerage', 'Cr Amt', 'Dr Amt', 'Balance', 'Dal Sell Qty', 'Dal Sell Amt', 'Dal Pur Qty', 'Dal Pur Amt', 'Dal Rate', 'Dal Total']];
                const body = [];
                pdfData.forEach((ledger, ledgerIndex) => {
                    if (selectedRows.includes(`ledger_${ledger.LedgerId}`)) {
                        body.push([
                            String(ledgerIndex + 1),
                            ledger.LedgerName || '',
                            (ledger.TotalSellerQty || 0).toFixed(2),
                            (ledger.TotalBuyerQty || 0).toFixed(2),
                            (ledger.TotalBrokerage || 0).toFixed(2),
                            (ledger.CrAmountTotal || 0).toFixed(2),
                            (ledger.DrAmountTotal || 0).toFixed(2),
                            (ledger.LedgerBalance || 0).toFixed(2),
                            '', '', '', '', '', ''
                        ]);
                    }
                    (ledger.Items || []).forEach((item) => {
                        body.push([
                            '',
                            '→ ' + (item.ItemName || '') + (item.Type === 'P' ? ' [Pur]' : ' [Sel]'),
                            '', '', '', '', '', '',
                            item.Type === 'S' ? (item.Qty || 0).toFixed(2) : '',
                            item.Type === 'S' ? (item.Amount || 0).toFixed(2) : '',
                            item.Type === 'P' ? (item.Qty || 0).toFixed(2) : '',
                            item.Type === 'P' ? (item.Amount || 0).toFixed(2) : '',
                            (item.DalaliRate || 0).toFixed(2),
                            (item.DalaliAmount || 0).toFixed(2)
                        ]);
                    });
                });
                body.push([
                    { content: 'TOTAL', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
                    pdfTotals.sellerQty.toFixed(2),
                    pdfTotals.buyerQty.toFixed(2),
                    pdfTotals.brokerage.toFixed(2),
                    pdfTotals.crAmount.toFixed(2),
                    pdfTotals.drAmount.toFixed(2),
                    pdfTotals.balance.toFixed(2),
                    pdfTotals.dalaliSellerQty.toFixed(2),
                    pdfTotals.dalaliSellerAmount.toFixed(2),
                    pdfTotals.dalaliBuyerQty.toFixed(2),
                    pdfTotals.dalaliBuyerAmount.toFixed(2),
                    '',
                    pdfTotals.dalaliTotal.toFixed(2)
                ]);

                doc.autoTable({
                    head,
                    body,
                    startY: 31,
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 8, cellPadding: 1, overflow: 'linebreak' },
                    headStyles: { fillColor: [40, 167, 69], halign: 'center', valign: 'middle' },
                    columnStyles: {
                        0: { cellWidth: 10, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { halign: 'right' },
                        3: { halign: 'right' },
                        4: { halign: 'right' },
                        5: { halign: 'right' },
                        6: { halign: 'right' },
                        7: { halign: 'right' },
                        8: { halign: 'right' },
                        9: { halign: 'right' },
                        10: { halign: 'right' },
                        11: { halign: 'right' },
                        12: { halign: 'right' },
                        13: { halign: 'right' }
                    },
                    alternateRowStyles: { fillColor: [248, 249, 250] }
                });
            } else {
                const head = [['Sr', 'Ledger Name', 'Sell Qty', 'Pur Qty', 'Brokerage', 'Cr Amount', 'Dr Amount', 'Balance']];
                const body = pdfData.map((item, index) => [
                    String(index + 1),
                    item.LedgerName || '',
                    (item.TotalSellerQty || 0).toFixed(2),
                    (item.TotalBuyerQty || 0).toFixed(2),
                    (item.TotalBrokerage || 0).toFixed(2),
                    (item.CrAmountTotal || 0).toFixed(2),
                    (item.DrAmountTotal || 0).toFixed(2),
                    (item.LedgerBalance || 0).toFixed(2)
                ]);
                body.push([
                    { content: 'TOTAL', colSpan: 2, styles: { halign: 'center', fontStyle: 'bold' } },
                    pdfTotals.sellerQty.toFixed(2),
                    pdfTotals.buyerQty.toFixed(2),
                    pdfTotals.brokerage.toFixed(2),
                    pdfTotals.crAmount.toFixed(2),
                    pdfTotals.drAmount.toFixed(2),
                    pdfTotals.balance.toFixed(2)
                ]);

                doc.autoTable({
                    head,
                    body,
                    startY: 31,
                    margin: { left: marginX, right: marginX },
                    styles: { fontSize: 10, cellPadding: 1.5, overflow: 'linebreak' },
                    headStyles: { fillColor: [40, 167, 69], halign: 'center', valign: 'middle' },
                    columnStyles: {
                        0: { cellWidth: 10, halign: 'center' },
                        1: { cellWidth: 'auto' },
                        2: { halign: 'right' },
                        3: { halign: 'right' },
                        4: { halign: 'right' },
                        5: { halign: 'right' },
                        6: { halign: 'right' },
                        7: { halign: 'right' }
                    },
                    alternateRowStyles: { fillColor: [248, 249, 250] }
                });
            }

            let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40;
            if (remarks && remarks.trim()) {
                doc.setFontSize(14);
                doc.text('Remarks', marginX, finalY);
                finalY += 6;
                doc.setFontSize(13);
                const splitRemarks = doc.splitTextToSize(remarks.trim(), doc.internal.pageSize.getWidth() - (marginX * 2));
                doc.text(splitRemarks, marginX, finalY);
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

  return (
    <div className="brokerage-calculation-wrapper" style={{ paddingTop: '36px' }}>
        <Container fluid style={{ padding: 0, margin: 0 }}>
            <Row style={{ margin: 0 }}>
                <Col lg={12} style={{ padding: 0, margin: 0 }}>
                    <Card className="shadow-sm border-0" style={{ flexShrink: 0, marginBottom: '0.5rem', margin: 0, borderRadius: 0 }}>
                        <div className="bg-primary text-white py-2 px-3" style={{ borderRadius: 0 }}>
                            <h6 className="mb-0 d-flex align-items-center justify-content-between flex-wrap" style={{ gap: '6px' }}>
                                <div className="d-flex align-items-center">
                                    <Filter className="me-2 desktop-only" size={16} />
                                    <span className="desktop-only">Brokerage Register</span>
                                    <span className="mobile-only">Total Parties: {filteredData ? filteredData.length : 0}</span>
                                </div>
                                <div className="d-flex align-items-center" style={{ gap: '4px', flexWrap: 'nowrap' }}>
                                    <Button
                                        color="light"
                                        size="sm"
                                        className="py-0 px-1 text-dark border"
                                        style={{ fontSize: '0.6rem', height: '24px', minWidth: '36px', whiteSpace: 'nowrap' }}
                                        onClick={() => window.open('/VoucherList', '_blank')}
                                        title="Voucher List"
                                    >
                                        <i className="fas fa-receipt"></i> Vch
                                    </Button>
                                    <Button
                                        color="light"
                                        size="sm"
                                        className="py-0 px-1 text-dark border desktop-only"
                                        style={{ fontSize: '0.6rem', height: '24px', minWidth: '28px' }}
                                        onClick={() => window.open('/Contract', '_blank')}
                                        title="New Contract"
                                    >
                                        <i className="fas fa-plus"></i>
                                    </Button>
                                    <Label className="mb-0 me-2 text-white" style={{ fontSize: '0.875rem', cursor: isLoadingDetailed ? 'not-allowed' : 'pointer' }}>
                                        Detailed
                                    </Label>
                                    <Input
                                        type="checkbox"
                                        id="detailedCheckbox"
                                        checked={isDetailed}
                                        onChange={(e) => setIsDetailed(e.target.checked)}
                                        disabled={isLoadingDetailed}
                                        className="detailed-checkbox-orange"
                                        style={{
                                            cursor: isLoadingDetailed ? 'not-allowed' : 'pointer',
                                            width: '18px',
                                            height: '18px',
                                            accentColor: '#ff9800'
                                        }}
                                    />
                                </div>
                            </h6>
                        </div>
                        <CardBody className="py-2 px-3 brokerage-card-body" style={{ position: 'relative', overflow: 'visible', padding: '0.5rem' }}>
                            <div style={{ overflowX: "auto", overflowY: "visible", minHeight: '32px' }}>
                                <Row className="align-items-end" style={{ flexWrap: "nowrap", minWidth: "fit-content", gap: 0, margin: 0, marginBottom: '4px' }}>
                                    <Col xs="auto" style={{ flex: "0 0 auto", padding: 0, margin: 0 }}>
                                        <div style={{ width: '85px' }}>
                                            <DatePicker
                                                selected={state.FromDate ? new Date(state.FromDate) : null}
                                                onChange={(date) => handleDateChange('FromDate', date)}
                                                disabled={isLoadingDetailed}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="From Date"
                                                className="form-control form-control-sm custom-datepicker"
                                                openToDate={new Date()}
                                                portalId="root-portal"
                                                popperPlacement="bottom-start"
                                                style={{
                                                    fontSize: '0.7rem',
                                                    height: '28px',
                                                    padding: '0 4px',
                                                    lineHeight: '20px',
                                                    backgroundColor: '#E3F2FD',
                                                    border: '1px solid #2196F3',
                                                    borderRadius: '0.25rem',
                                                    color: '#333',
                                                    boxSizing: 'border-box',
                                                    display: 'block'
                                                }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs="auto" style={{ flex: "0 0 auto", display: 'flex', alignItems: 'flex-end', padding: '0 0.5rem', margin: 0, paddingBottom: '2px' }}>
                                        <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>To</span>
                                    </Col>
                                    <Col xs="auto" style={{ flex: "0 0 auto", padding: 0, margin: 0 }}>
                                        <div style={{ width: '85px' }}>
                                            <DatePicker
                                                selected={state.ToDate ? new Date(state.ToDate) : null}
                                                onChange={(date) => handleDateChange('ToDate', date)}
                                                disabled={isLoadingDetailed}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="To Date"
                                                className="form-control form-control-sm custom-datepicker"
                                                openToDate={new Date()}
                                                portalId="root-portal"
                                                popperPlacement="bottom-start"
                                                style={{
                                                    fontSize: '0.7rem',
                                                    height: '28px',
                                                    padding: '0 4px',
                                                    lineHeight: '20px',
                                                    backgroundColor: '#E3F2FD',
                                                    border: '1px solid #2196F3',
                                                    borderRadius: '0.25rem',
                                                    color: '#333',
                                                    boxSizing: 'border-box',
                                                    display: 'block'
                                                }}
                                            />
                                        </div>
                                    </Col>
                                    <Col xs="auto" style={{ flex: "0 0 auto", padding: 0, margin: 0 }}>
                                        <div
                                            onClick={openLedgerModal}
                                            style={{
                                                backgroundColor: "#E3F2FD",
                                                color: "#333",
                                                border: "1px solid #2196F3",
                                                borderRadius: "6px",
                                                height: "28px",
                                                padding: "2px 8px",
                                                fontSize: "0.65rem",
                                                cursor: "pointer",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "space-between",
                                                minWidth: "80px",
                                                maxWidth: "80px"
                                            }}
                                        >
                                            <span>
                                                {selectedLedgerIds && selectedLedgerIds.length > 0
                                                    ? `${selectedLedgerIds.length} selected`
                                                    : "Ledger"}
                                            </span>
                                            <i className="fas fa-chevron-down ms-2"></i>
                                        </div>
                                    </Col>
                                    <Col xs="auto" style={{ flex: "0 0 auto", padding: 0, margin: 0 }}>
                                        <Button
                                            color="success"
                                            outline
                                            onClick={handleExcelExport}
                                            disabled={isLoadingDetailed || !filteredData || filteredData.length === 0}
                                            className="d-flex align-items-center"
                                            style={{
                                                fontSize: '0.7rem',
                                                padding: '0.25rem 0.5rem',
                                                whiteSpace: 'nowrap',
                                                height: '28px'
                                            }}
                                        >
                                            <i className="fas fa-file-excel me-1" style={{ fontSize: '14px' }}></i>
                                            Excel
                                        </Button>
                                    </Col>
                                    <Col xs="auto" style={{ flex: "0 0 auto", padding: 0, margin: 0 }}>
                                        <Button
                                            color="danger"
                                            outline
                                            onClick={handlePDFExport}
                                            disabled={isLoadingDetailed || !filteredData || filteredData.length === 0}
                                            className="d-flex align-items-center"
                                            style={{
                                                fontSize: '0.7rem',
                                                padding: '0.25rem 0.5rem',
                                                whiteSpace: 'nowrap',
                                                height: '28px'
                                            }}
                                        >
                                            <i className="fas fa-file-pdf me-1" style={{ fontSize: '14px' }}></i>
                                            PDF
                                        </Button>
                                    </Col>
                                </Row>
                            </div>
                            
                            {/* Loading Overlay for Detailed View */}
                            {isLoadingDetailed && (
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    bottom: 0,
                                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    zIndex: 9999,
                                    borderRadius: '4px'
                                }}>
                                    <Spinner color="primary" style={{ width: '3rem', height: '3rem' }}>
                                        Loading...
                                    </Spinner>
                                    <p className="mt-3 text-muted" style={{ fontSize: '1rem', fontWeight: 500 }}>
                                        Loading detailed data, please wait...
                                    </p>
                                </div>
                            )}
                            <div 
                                ref={tableContainerRef}
                                className="table-responsive" 
                                style={{maxHeight: '65vh', overflowY: 'auto', paddingBottom: '1rem'}}
                            >
                                <Table size="sm" className="table table-bordered mb-0 resizable-table" style={{ tableLayout: 'fixed' }}>
                                    <thead className="table-light">
                                        <tr>
                                            <th rowSpan={isDetailed ? 2 : 1} style={{ ...compactCellStyle, width: `${columnWidths.Checkbox}px`, position: 'relative', overflow: 'hidden' }} className="text-center">
                                                <Input
                                                    type="checkbox"
                                                    checked={selectAll}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleSelectAll();
                                                    }}
                                                    onChange={() => {}}
                                                    style={{ margin: 0, cursor: 'pointer' }}
                                                />
                                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Checkbox')} onTouchStart={e => handleResizeMouseDown(e, 'Checkbox')} />
                                            </th>
                                            <th rowSpan={isDetailed ? 2 : 1} style={{ ...compactCellStyle, width: `${columnWidths.SrNo}px`, position: 'relative', overflow: 'hidden' }}>
                                                Sr. No.
                                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'SrNo')} onTouchStart={e => handleResizeMouseDown(e, 'SrNo')} />
                                            </th>
                                            <th rowSpan={isDetailed ? 2 : 1} style={{ ...compactCellStyle, width: `${columnWidths.LedgerName}px`, position: 'relative', overflow: 'hidden' }}>
                                                {isDetailed ? 'Ledger/Item Name' : 'Ledger Name'}
                                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'LedgerName')} onTouchStart={e => handleResizeMouseDown(e, 'LedgerName')} />
                                            </th>
                                            {isDetailed ? (
                                                <>
                                                    <th colSpan="2" className="text-center" style={compactCellStyle}>Brokerage Qty</th>
                                                    <th className="text-center" style={compactCellStyle}>Total Brokerage</th>
                                                    <th colSpan="2" className="text-center" style={compactCellStyle}>Amount</th>
                                                    <th rowSpan={isDetailed ? 2 : 1} className="text-end" style={compactCellStyle}>Balance</th>
                                                    <th colSpan="6" className="text-center" style={compactCellStyle}>Dalali</th>
                                                </>
                                            ) : (
                                                <>
                                                    <th className="text-end" style={{ ...compactCellStyle, width: `${columnWidths.SellQty}px`, position: 'relative', overflow: 'hidden' }}>
                                                        Sell Qty
                                                        <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'SellQty')} onTouchStart={e => handleResizeMouseDown(e, 'SellQty')} />
                                                    </th>
                                                    <th className="text-end" style={{ ...compactCellStyle, width: `${columnWidths.PurQty}px`, position: 'relative', overflow: 'hidden' }}>
                                                        Pur Qty
                                                        <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'PurQty')} onTouchStart={e => handleResizeMouseDown(e, 'PurQty')} />
                                                    </th>
                                                    <th className="text-end" style={{ ...compactCellStyle, width: `${columnWidths.TotalBrokerage}px`, position: 'relative', overflow: 'hidden' }}>
                                                        Total Brokerage
                                                        <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'TotalBrokerage')} onTouchStart={e => handleResizeMouseDown(e, 'TotalBrokerage')} />
                                                    </th>
                                                    <th className="text-end" style={{ ...compactCellStyle, width: `${columnWidths.CrAmount}px`, position: 'relative', overflow: 'hidden' }}>
                                                        Cr Amount
                                                        <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'CrAmount')} onTouchStart={e => handleResizeMouseDown(e, 'CrAmount')} />
                                                    </th>
                                                    <th className="text-end" style={{ ...compactCellStyle, width: `${columnWidths.DrAmount}px`, position: 'relative', overflow: 'hidden' }}>
                                                        Dr Amount
                                                        <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'DrAmount')} onTouchStart={e => handleResizeMouseDown(e, 'DrAmount')} />
                                                    </th>
                                                    <th className="text-end" style={{ ...compactCellStyle, width: `${columnWidths.Balance}px`, position: 'relative', overflow: 'hidden' }}>
                                                        Balance
                                                        <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Balance')} onTouchStart={e => handleResizeMouseDown(e, 'Balance')} />
                                                    </th>
                                                </>
                                            )}
                                        </tr>
                                        {isDetailed && (
                                            <tr>
                                                <th className="text-end" style={compactCellStyle}>Sell Qty</th>
                                                <th className="text-end" style={compactCellStyle}>Pur Qty</th>
                                                <th className="text-end" style={compactCellStyle}>Total Brokerage</th>
                                                <th className="text-end" style={compactCellStyle}>Cr Amount</th>
                                                <th className="text-end" style={compactCellStyle}>Dr Amount</th>
                                                <th className="text-end" style={compactCellStyle}>Dalali Sell Qty</th>
                                                <th className="text-end" style={compactCellStyle}>Dalali Sell Amt</th>
                                                <th className="text-end" style={compactCellStyle}>Dalali Pur Qty</th>
                                                <th className="text-end" style={compactCellStyle}>Dalali Pur Amt</th>
                                                <th className="text-end" style={compactCellStyle}>Dalali Rate</th>
                                                <th className="text-end" style={compactCellStyle}>Dalali Total</th>
                                            </tr>
                                        )}
                                    </thead>
                                    <tbody>
                                        {filteredData && filteredData.length > 0 ? (
                                            isDetailed ? (
                                                filteredData.map((ledger, ledgerIndex) => {
                                                    let rowIndex = 0;
                                                    return (
                                                        <React.Fragment key={ledger.LedgerId}>
                                                            {/* Ledger Header Row */}
                                                            <tr style={{backgroundColor: '#ffe0b2', fontWeight: 'bold'}}>
                                                                <td className="text-center" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}>
                                                                    <Input
                                                                        type="checkbox"
                                                                        checked={selectedRows.includes(`ledger_${ledger.LedgerId}`)}
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            handleRowSelect(`ledger_${ledger.LedgerId}`);
                                                                        }}
                                                                        onChange={() => {}}
                                                                        style={{ margin: 0, cursor: 'pointer' }}
                                                                    />
                                                                </td>
                                                                <td style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}>{ledgerIndex + 1}</td>
                                                                <td style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}>{ledger.LedgerName}</td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}>{(ledger.TotalSellerQty || 0).toFixed(2)}</td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}>{(ledger.TotalBuyerQty || 0).toFixed(2)}</td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}>{(ledger.TotalBrokerage || 0).toFixed(2)}</td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}>{(ledger.CrAmountTotal || 0).toFixed(2)}</td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}>{(ledger.DrAmountTotal || 0).toFixed(2)}</td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}>{(ledger.LedgerBalance || 0).toFixed(2)}</td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}></td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}></td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}></td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}></td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}></td>
                                                                <td className="text-end" style={{...compactCellStyle, backgroundColor: '#ffe0b2'}}></td>
                                                            </tr>
                                                            {/* Item Rows - Like Dalali Modal (separate P and S rows) */}
                                                            {ledger.Items && ledger.Items.length > 0 ? (
                                                                ledger.Items.map((item, itemIndex) => {
                                                                    const itemRowId = `item_${ledger.LedgerId}_${item.ItemId}_${item.Type}`;
                                                                    return (
                                                                        <tr key={`${ledger.LedgerId}_${item.ItemId}_${item.Type}_${itemIndex}`} style={{backgroundColor: '#fff3e0'}}>
                                                                            <td className="text-center" style={compactCellStyle}>
                                                                                <Input
                                                                                    type="checkbox"
                                                                                    checked={selectedRows.includes(itemRowId)}
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        handleRowSelect(itemRowId);
                                                                                    }}
                                                                                    onChange={() => {}}
                                                                                    style={{ margin: 0, cursor: 'pointer' }}
                                                                                />
                                                                            </td>
                                                                            <td style={compactCellStyle}></td>
                                                                            <td style={{...compactCellStyle, paddingLeft: '2rem'}}>
                                                                                <i className="fas fa-arrow-right me-1" style={{fontSize: '0.7rem'}}></i>
                                                                                {item.ItemName} <span className="badge bg-info ms-1" style={{fontSize: '0.65rem'}}>{item.Type === 'P' ? 'Pur' : 'Sel'}</span>
                                                                            </td>
                                                                            <td className="text-end" style={compactCellStyle}></td>
                                                                            <td className="text-end" style={compactCellStyle}></td>
                                                                            <td className="text-end" style={compactCellStyle}></td>
                                                                            <td className="text-end" style={compactCellStyle}></td>
                                                                            <td className="text-end" style={compactCellStyle}></td>
                                                                            <td className="text-end" style={compactCellStyle}></td>
                                                                            <td className="text-end" style={compactCellStyle}>
                                                                                {item.Type === 'S' ? (item.Qty || 0).toFixed(2) : ''}
                                                                            </td>
                                                                            <td className="text-end" style={compactCellStyle}>
                                                                                {item.Type === 'S' ? (item.Amount || 0).toFixed(2) : ''}
                                                                            </td>
                                                                            <td className="text-end" style={compactCellStyle}>
                                                                                {item.Type === 'P' ? (item.Qty || 0).toFixed(2) : ''}
                                                                            </td>
                                                                            <td className="text-end" style={compactCellStyle}>
                                                                                {item.Type === 'P' ? (item.Amount || 0).toFixed(2) : ''}
                                                                            </td>
                                                                            <td className="text-end" style={compactCellStyle}>
                                                                                <strong>{(item.DalaliRate || 0).toFixed(2)}</strong>
                                                                            </td>
                                                                            <td className="text-end" style={compactCellStyle}>
                                                                                <span style={{fontWeight: 'bold'}}>{(item.DalaliAmount || 0).toFixed(2)}</span>
                                                                            </td>
                                                                        </tr>
                                                                    );
                                                                })
                                                            ) : (
                                                                <tr style={{backgroundColor: '#fff3e0'}}>
                                                                    <td colSpan="15" style={{...compactCellStyle, paddingLeft: '2rem', fontStyle: 'italic', color: '#6c757d'}}>
                                                                        No items available
                                                                    </td>
                                                                </tr>
                                                            )}
                                                        </React.Fragment>
                                                    );
                                                })
                                            ) : (
                                                filteredData.map((item, index) => {
                                                    const bgColor = index % 2 === 0 ? '#ffe0b2' : '#fff8e1';
                                                    const rowId = `ledger_${item.LedgerId}`;
                                                    return (
                                                        <tr key={item.LedgerId} style={{backgroundColor: bgColor}}>
                                                            <td className="text-center" style={{...compactCellStyle, backgroundColor: bgColor}}>
                                                                <Input
                                                                    type="checkbox"
                                                                    checked={selectedRows.includes(rowId)}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleRowSelect(rowId);
                                                                    }}
                                                                    onChange={() => {}}
                                                                    style={{ margin: 0, cursor: 'pointer' }}
                                                                />
                                                            </td>
                                                            <td style={{...compactCellStyle, backgroundColor: bgColor}}>{index + 1}</td>
                                                            <td style={{...compactCellStyle, backgroundColor: bgColor}}>{item.LedgerName}</td>
                                                            <td className="text-end" style={{...compactCellStyle, backgroundColor: bgColor}}>{(item.TotalSellerQty || 0).toFixed(2)}</td>
                                                            <td className="text-end" style={{...compactCellStyle, backgroundColor: bgColor}}>{(item.TotalBuyerQty || 0).toFixed(2)}</td>
                                                            <td className="text-end" style={{...compactCellStyle, backgroundColor: bgColor}}>{(item.TotalBrokerage || 0).toFixed(2)}</td>
                                                            <td className="text-end" style={{...compactCellStyle, backgroundColor: bgColor}}>{(item.CrAmountTotal || 0).toFixed(2)}</td>
                                                            <td className="text-end" style={{...compactCellStyle, backgroundColor: bgColor}}>{(item.DrAmountTotal || 0).toFixed(2)}</td>
                                                            <td className="text-end" style={{...compactCellStyle, backgroundColor: bgColor}}>{(item.LedgerBalance || 0).toFixed(2)}</td>
                                                        </tr>
                                                    );
                                                })
                                            )
                                        ) : (
                                            <tr>
                                                <td colSpan={isDetailed ? 15 : 9} className="text-center" style={compactCellStyle}>No data available</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </Table>
                            </div>
                            {filteredData && filteredData.length > 0 && (
                                <div 
                                    className="d-flex align-items-center justify-content-between gap-2 flex-wrap mt-3"
                                    style={{
                                        position: 'sticky',
                                        bottom: 0,
                                        backgroundColor: '#fff',
                                        padding: '0.75rem 0.5rem',
                                        boxShadow: '0 -2px 6px rgba(0,0,0,0.08)',
                                        zIndex: 2
                                    }}
                                >
                                    <div className="fw-semibold" style={{minWidth: '120px'}}>Total</div>
                                    <div className="ms-auto text-end" style={{minWidth: '120px'}}>
                                        Sell Qty: <strong>{totals.sellerQty.toFixed(2)}</strong>
                                    </div>
                                    <div className="text-end" style={{minWidth: '120px'}}>
                                        Pur Qty: <strong>{totals.buyerQty.toFixed(2)}</strong>
                                    </div>
                                    <div className="text-end" style={{minWidth: '150px'}}>
                                        Brokerage: <strong>{totals.brokerage.toFixed(2)}</strong>
                                    </div>
                                    <div className="text-end" style={{minWidth: '120px'}}>
                                        Cr Amount: <strong>{totals.crAmount.toFixed(2)}</strong>
                                    </div>
                                    <div className="text-end" style={{minWidth: '120px'}}>
                                        Dr Amount: <strong>{totals.drAmount.toFixed(2)}</strong>
                                    </div>
                                    <div className="text-end" style={{minWidth: '150px'}}>
                                        Balance: <strong>{totals.balance.toFixed(2)}</strong>
                                    </div>
                                    {isDetailed && (
                                        <>
                                            <div className="text-end" style={{minWidth: '150px'}}>
                                                Dalali Sell Qty: <strong>{totals.dalaliSellerQty.toFixed(2)}</strong>
                                            </div>
                                            <div className="text-end" style={{minWidth: '150px'}}>
                                                Dalali Sell Amt: <strong>{totals.dalaliSellerAmount.toFixed(2)}</strong>
                                            </div>
                                            <div className="text-end" style={{minWidth: '150px'}}>
                                                Dalali Pur Qty: <strong>{totals.dalaliBuyerQty.toFixed(2)}</strong>
                                            </div>
                                            <div className="text-end" style={{minWidth: '150px'}}>
                                                Dalali Pur Amt: <strong>{totals.dalaliBuyerAmount.toFixed(2)}</strong>
                                            </div>
                                            <div className="text-end" style={{minWidth: '150px'}}>
                                                Dalali Total: <strong>{totals.dalaliTotal.toFixed(2)}</strong>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </CardBody>
                    </Card>
                </Col>
            </Row>
        </Container>

        {/* Scroll to Top Button for Table */}
        {showScrollTop && filteredData.length > 0 && (
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    scrollToTop();
                }}
                className="scroll-to-top-btn"
                style={{
                    position: "fixed",
                    bottom: "20px",
                    right: "20px",
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: "#0d6efd",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)",
                    zIndex: 99999,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    transition: "all 0.3s ease",
                    outline: "none",
                    WebkitTapHighlightColor: "transparent"
                }}
                onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#0b5ed7";
                    e.currentTarget.style.transform = "scale(1.1)";
                }}
                onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#0d6efd";
                    e.currentTarget.style.transform = "scale(1)";
                }}
                title="Scroll to top of table"
            >
                <i className="fas fa-arrow-up"></i>
            </button>
        )}
        
        {/* Checkbox orange color and table row styles */}
        <style>{`
            /* Date input styling - Light blue background and blue border (same as ContractRegister) */
            input[type="date"] {
                background-color: #E3F2FD !important;
                border: 1px solid #2196F3 !important;
                border-radius: 0.25rem !important;
                color: #333 !important;
                vertical-align: middle !important;
                width: 75px !important;
                min-width: 75px !important;
                max-width: 75px !important;
                box-sizing: border-box !important;
                display: block !important;
            }
            input[type="date"]:focus {
                background-color: #E3F2FD !important;
                border-color: #2196F3 !important;
                box-shadow: 0 0 0 0.2rem rgba(33, 150, 243, 0.25) !important;
                outline: none !important;
            }
            input[type="date"]:disabled {
                background-color: #E3F2FD !important;
                border-color: #2196F3 !important;
                opacity: 0.6;
                cursor: not-allowed;
            }
            input[type="date"]::placeholder {
                color: #666 !important;
            }
            #detailedCheckbox:checked,
            .detailed-checkbox-orange:checked {
                background-color: #ff9800 !important;
                border-color: #ff9800 !important;
            }
            #detailedCheckbox:checked::before,
            .detailed-checkbox-orange:checked::before {
                background-color: #ff9800 !important;
            }
            input[type="checkbox"]#detailedCheckbox:checked {
                background-color: #ff9800 !important;
                border-color: #ff9800 !important;
            }
            /* Mobile/Desktop visibility classes */
            .desktop-only {
                display: inline-block;
            }
            .mobile-only {
                display: none;
            }
            @media (max-width: 768px) {
                .desktop-only {
                    display: none !important;
                }
                .mobile-only {
                    display: inline-block !important;
                }
            }
            /* Desktop: top margin 36px */
            .brokerage-calculation-wrapper {
                padding-top: 36px !important;
            }
            /* Mobile - Remove top margin and all padding/margin from sides */
            @media (max-width: 768px) {
                .brokerage-calculation-wrapper {
                    padding: 0 !important;
                    margin: 0 !important;
                    padding-top: 0 !important;
                }
                .brokerage-calculation-wrapper .container-fluid,
                .brokerage-calculation-wrapper .container {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    padding-top: 0 !important;
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                    margin-top: 0 !important;
                }
                .brokerage-calculation-wrapper .row {
                    margin-left: 0 !important;
                    margin-right: 0 !important;
                    margin-top: 0 !important;
                }
                .brokerage-calculation-wrapper .col,
                .brokerage-calculation-wrapper [class*="col-"] {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    padding-top: 0 !important;
                }
                .brokerage-calculation-wrapper .card {
                    margin: 0 !important;
                    border-radius: 0 !important;
                }
                .brokerage-card-body {
                    padding-left: 0.25rem !important;
                    padding-right: 0.25rem !important;
                    padding-top: 0.25rem !important;
                    padding-bottom: 0.75rem !important;
                }
                .brokerage-calculation-wrapper .card .bg-primary {
                    border-radius: 0 !important;
                    padding-left: 0.5rem !important;
                    padding-right: 0.5rem !important;
                }
            }
            @media (max-width: 576px) {
                .brokerage-card-body {
                    padding-left: 0 !important;
                    padding-right: 0 !important;
                    padding-top: 0.25rem !important;
                    padding-bottom: 0.75rem !important;
                }
                .brokerage-calculation-wrapper .card .bg-primary {
                    padding-left: 0.5rem !important;
                    padding-right: 0.5rem !important;
                }
                .scroll-to-top-btn {
                    width: 45px !important;
                    height: 45px !important;
                    bottom: 15px !important;
                    right: 15px !important;
                    font-size: 18px !important;
                }
            }
            @media (max-width: 576px) {
                .scroll-to-top-btn {
                    width: 42px !important;
                    height: 42px !important;
                    bottom: 12px !important;
                    right: 12px !important;
                    font-size: 17px !important;
                }
            }
            @media (max-width: 480px) {
                .scroll-to-top-btn {
                    width: 38px !important;
                    height: 38px !important;
                    bottom: 10px !important;
                    right: 10px !important;
                    font-size: 15px !important;
                    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3) !important;
                }
            }
            @media (max-width: 375px) {
                .scroll-to-top-btn {
                    width: 35px !important;
                    height: 35px !important;
                    bottom: 8px !important;
                    right: 8px !important;
                    font-size: 14px !important;
                    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
                }
            }
            @media (max-width: 320px) {
                .scroll-to-top-btn {
                    width: 32px !important;
                    height: 32px !important;
                    bottom: 6px !important;
                    right: 6px !important;
                    font-size: 13px !important;
                    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
                }
            }
        `}</style>

        {/* Ledger Filter Modal */}
        <Modal
            isOpen={showLedgerModal}
            toggle={closeLedgerModal}
            size="lg"
            centered
            style={{ zIndex: 10000 }}
        >
            <ModalHeader toggle={closeLedgerModal} className="bg-primary text-white">
                <div className="d-flex justify-content-between align-items-center w-100">
                    <h5 className="mb-0">
                        <i className="fas fa-filter me-2"></i>
                        Select Ledger
                    </h5>
                </div>
            </ModalHeader>
            <ModalBody style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
                <div className="mb-3">
                    <label className="fw-semibold mb-0">Ledger</label>
                </div>
                <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>
                    {ledgerOptions.map((ledger) => {
                        const isSelected = tempSelectedLedgerIds.some(id => String(id) === String(ledger.id));
                        return (
                            <div
                                key={ledger.id}
                                style={{
                                    padding: "8px",
                                    cursor: "pointer",
                                    borderRadius: "4px",
                                    backgroundColor: isSelected ? "#e7f3ff" : "transparent",
                                    marginBottom: "4px",
                                }}
                                onClick={() => {
                                    const isCurrentlySelected = tempSelectedLedgerIds.some(id => String(id) === String(ledger.id));
                                    if (isCurrentlySelected) {
                                        setTempSelectedLedgerIds(tempSelectedLedgerIds.filter(id => String(id) !== String(ledger.id)));
                                    } else {
                                        setTempSelectedLedgerIds([...tempSelectedLedgerIds, String(ledger.id)]);
                                    }
                                }}
                                onMouseEnter={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = "#f8f9fa";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!isSelected) {
                                        e.currentTarget.style.backgroundColor = "transparent";
                                    }
                                }}
                            >
                                <div className="d-flex align-items-center">
                                    <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => {}}
                                        style={{ marginRight: "10px", cursor: "pointer" }}
                                    />
                                    <span>{ledger.name}</span>
                                </div>
                            </div>
                        );
                    })}
                    {ledgerOptions.length === 0 && (
                        <div className="text-center text-muted py-3">
                            No ledgers available
                        </div>
                    )}
                </div>
            </ModalBody>
            <ModalFooter className="d-flex justify-content-end gap-2">
                <Button color="secondary" outline size="sm" onClick={() => setTempSelectedLedgerIds([])}>
                    Clear All
                </Button>
                <Button color="primary" outline size="sm" onClick={() => {
                    const allLedgerIds = ledgerOptions.map(l => String(l.id));
                    setTempSelectedLedgerIds(allLedgerIds);
                }}>
                    Select All
                </Button>
                <Button color="primary" onClick={handleLedgerModalDone}>
                    <i className="fas fa-check me-2"></i>
                    Done
                </Button>
            </ModalFooter>
        </Modal>

        {/* Remarks Modal for PDF Export (same as ReminderData) */}
        <Modal isOpen={showRemarksModal} toggle={() => { setShowRemarksModal(false); setRemarks(''); }} centered size="lg">
            <ModalHeader toggle={() => { setShowRemarksModal(false); setRemarks(''); }}>
                <span className="d-flex align-items-center">
                    <i className="fas fa-file-pdf me-2"></i>
                    Add Remarks for PDF Export
                </span>
            </ModalHeader>
            <ModalBody>
                <Label className="fw-semibold">Remarks</Label>
                <Input
                    type="textarea"
                    rows={5}
                    placeholder="Enter remarks (optional)..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    style={{ resize: 'vertical' }}
                />
                <small className="text-muted">Remarks will be added at the end of the PDF document.</small>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={() => { setShowRemarksModal(false); setRemarks(''); }}>
                    Cancel
                </Button>
                <Button color="primary" onClick={handleGeneratePDF}>
                    <i className="fas fa-file-pdf me-2"></i>
                    Generate PDF
                </Button>
            </ModalFooter>
        </Modal>

        <Modal isOpen={showSharePDFModal} toggle={() => { setShowSharePDFModal(false); setPendingShareFile(null); }} centered>
            <ModalHeader toggle={() => { setShowSharePDFModal(false); setPendingShareFile(null); }}>
                <span className="d-flex align-items-center">
                    <i className="fas fa-file-pdf me-2"></i>
                    PDF Ready
                </span>
            </ModalHeader>
            <ModalBody>
                <p className="mb-0">Click Share to open the share dialog and send the PDF.</p>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={() => { setShowSharePDFModal(false); setPendingShareFile(null); }}>
                    Cancel
                </Button>
                <Button color="primary" onClick={handleSharePDFClick}>
                    Share PDF
                </Button>
            </ModalFooter>
        </Modal>
    </div>
  )
}

export default BrokerageCalculation