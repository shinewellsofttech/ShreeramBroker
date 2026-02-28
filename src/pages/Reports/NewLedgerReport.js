import React, { useState, useEffect, useCallback } from "react"
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  Card,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "react-bootstrap"
import { API_WEB_URLS } from "constants/constAPI"
import { Fn_GetReport, Fn_DisplayData, Fn_FillListData } from "store/Functions"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"
import {
  Search,
  Printer,
  X,
  LogOut,
  Calendar,
  Filter,
  Download,
} from "react-feather"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import DalaliModal from "./DalaliModal"
import LedgerReport from "./LedgerReport"
import { toast } from "react-toastify"
import useColumnResize from '../../helpers/useColumnResize'
import '../../helpers/columnResize.css'

function NewLedgerReport() {
  const dispatch = useDispatch()
  const navigate = useNavigate()

  // Column resize feature
  const { columnWidths, handleResizeMouseDown } = useColumnResize('newLedgerReport_columnWidths', {
      Checkbox: 40,
      Ledger: 150,
      SellerQty: 80,
      BuyerQty: 80,
      DalaliRate: 80,
      TotalSellerAmt: 100,
      TotalBuyerAmt: 100,
      AvgSellerRate: 90,
      AvgBuyerRate: 90,
      Total: 80,
      Action: 100,
  })

  // Get global dates from Redux store
  const globalDates = useSelector(state => state.GlobalDates)

  const [fromDate, setFromDate] = useState(globalDates.fromDate)
  const [toDate, setToDate] = useState(globalDates.toDate)
  const [ItemId, setItemId] = useState(0)
  const [selectedItemIds, setSelectedItemIds] = useState([])

  const [showTable, setShowTable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [selectAll, setSelectAll] = useState(false)
  const [isSelectingAll, setIsSelectingAll] = useState(false)
  const [ledgerFilter, setLedgerFilter] = useState("")
  const [totalFilter, setTotalFilter] = useState(new Set([">0"]))
  const [showDalaliDataModal, setShowDalaliDataModal] = useState(false)
  const [selectedLedgerId, setSelectedLedgerId] = useState(null)
  const [selectedFinancialYearId, setSelectedFinancialYearId] = useState(null)
  const [financialYearArray, setFinancialYearArray] = useState([])
  const [error, setError] = useState("")
  const [showItemModal, setShowItemModal] = useState(false)
  const [tempSelectedItemIds, setTempSelectedItemIds] = useState([])


  const [state, setState] = useState({
    FillArray: [],
    ItemArray: [],
    FromDate: globalDates.fromDate,
    ToDate: globalDates.toDate,
  })

  const API_URL_Get = `${API_WEB_URLS.LedgerDalaliCalculation}/0/token`
  const API_URL = API_WEB_URLS.MASTER + "/0/token/ItemMaster"
  const API_URL_Financial = API_WEB_URLS.MASTER + "/0/token/FinancialYearMaster"

  useEffect(() => {
    Fn_FillListData(dispatch, setState, "ItemArray", API_URL + "/Id/0")
    Fn_FillListData(dispatch, setFinancialYearArray, "gridData", API_URL_Financial + "/Id/0")
  }, [dispatch])

  // Auto-load data when component mounts 
  useEffect(() => {
    if (state.ItemArray.length > 0) {
      loadData()
    }
  }, [state.ItemArray])

  // Auto-load data when dates change
  useEffect(() => {
    if (state.ItemArray.length > 0) {
      loadData()
    }
  }, [fromDate, toDate])

  // Auto-load data when selected items change
  useEffect(() => {
    if (state.ItemArray.length > 0) {
      loadData()
    }
  }, [selectedItemIds])

  // Auto-show table when data is received
  useEffect(() => {
    if (state.FillArray && state.FillArray.length > 0) {
      setShowTable(true)
      setShowReport(true)
      setSelectedRows(new Set())
      setSelectAll(false)
      setIsSelectingAll(false)
    }
  }, [state.FillArray])

  // Helper function to format date in local time (YYYY-MM-DD)
  const formatDateLocal = (date) => {
    if (!date) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  const loadData = async () => {
    setLoading(true)
    setError("")

    try {
      let vformData = new FormData()
      vformData.append("FromDate", formatDateLocal(fromDate) || "")
      vformData.append("ToDate", formatDateLocal(toDate) || "")
      vformData.append("ItemIds", selectedItemIds.join(","))

      const result = await Fn_GetReport(
        dispatch,
        setState,
        "FillArray",
        API_URL_Get,
        { arguList: { id: 0, formData: vformData } },
        true
      )

      setShowTable(true)
      setShowReport(true)
    } catch (error) {
      setError("Error generating report. Please try again.")
      console.error("Report generation error:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRowDoubleClick = async (row) => {
    // Include double-clicked row's LedgerId + any selected rows (union)
    const ids = new Set(selectedRows)
    if (row != null) ids.add(row.LedgerId)
    const ledgerIdsToSend = Array.from(ids)

    if (ledgerIdsToSend.length === 0) {
      toast.error("Please select a party first or double-click on a row.")
      return
    }

    // Comma-separated LedgerIds (string) - ensure string IDs for API
    const ledgerIdsStr = ledgerIdsToSend.map(id => String(id)).join(",")
    const selectedLedgerNames = ledgerIdsToSend
      .map(ledgerId => {
        const r = state.FillArray.find(f => f.LedgerId === ledgerId)
        return r ? r.LedgerName : `Ledger ${ledgerId}`
      })
      .join(",")

    navigate("/LedgerReport", {
      state: {
        ledgerIds: ledgerIdsStr,
        ledgerNames: selectedLedgerNames,
        fromDate: fromDate,
        toDate: toDate,
        itemIds: Array.isArray(selectedItemIds) ? selectedItemIds.join(",") : (selectedItemIds || ""),
        completed: false,
        notStarted: true,
        pending: true,
      },
    })
  }

  const handleOpenDalali = ledgerId => {
    setSelectedLedgerId(ledgerId)
    setShowDalaliDataModal(true)
  }

  // Modal functions for Item selection
  const openItemModal = () => {
    setTempSelectedItemIds([...selectedItemIds])
    setShowItemModal(true)
  }

  const closeItemModal = () => {
    setShowItemModal(false)
  }

  const handleItemModalDone = () => {
    setSelectedItemIds([...tempSelectedItemIds])
    setShowItemModal(false)
  }

  // Checkbox selection handlers
  const handleSelectAll = useCallback(
    checked => {
      const filteredData = getFilteredAndSortedData()

      if (checked && filteredData.length > 1000) {
        setIsSelectingAll(true)
      }

      setSelectAll(checked)

      setTimeout(() => {
        if (checked) {
          const filteredLedgerIds = new Set(
            filteredData.map(row => row.LedgerId)
          )
          setSelectedRows(filteredLedgerIds)
        } else {
          setSelectedRows(new Set())
        }
        setIsSelectingAll(false)
      }, 0)
    },
    [state.FillArray, ledgerFilter, totalFilter]
  )

  const handleRowSelect = useCallback(
    (ledgerId, checked) => {
      setSelectedRows(prevSelected => {
        const newSelectedRows = new Set(prevSelected)
        if (checked) {
          newSelectedRows.add(ledgerId)
        } else {
          newSelectedRows.delete(ledgerId)
        }

        const filteredData = getFilteredAndSortedData()
        const filteredLedgerIds = filteredData.map(row => row.LedgerId)
        const allFilteredSelected =
          filteredLedgerIds.length > 0 &&
          filteredLedgerIds.every(id => newSelectedRows.has(id))

        setSelectAll(allFilteredSelected)
        return newSelectedRows
      })
    },
    [state.FillArray, ledgerFilter, totalFilter]
  )

  // Filter and sort data
  const getFilteredAndSortedData = () => {
    let filteredData = state.FillArray

    if (ledgerFilter.trim()) {
      filteredData = filteredData.filter(
        row =>
          row.LedgerName &&
          row.LedgerName.toLowerCase().includes(ledgerFilter.toLowerCase())
      )
    }

    if (totalFilter.size > 0) {
      filteredData = filteredData.filter(row => {
        const total = parseFloat(row.Total) || 0
        if (totalFilter.has(">0") && totalFilter.has("=0")) {
          return true
        }
        if (totalFilter.has(">0")) {
          return total > 0
        }
        if (totalFilter.has("=0")) {
          return total === 0
        }
        return true
      })
    }

    return filteredData.sort((a, b) => {
      const nameA = (a.LedgerName || "").toLowerCase()
      const nameB = (b.LedgerName || "").toLowerCase()
      return nameA.localeCompare(nameB)
    })
  }

  // Update selectAll state when filters change
  useEffect(() => {
    if (state.FillArray.length > 0) {
      const filteredData = getFilteredAndSortedData()
      const filteredLedgerIds = filteredData.map(row => row.LedgerId)
      const allFilteredSelected =
        filteredLedgerIds.length > 0 &&
        filteredLedgerIds.every(id => selectedRows.has(id))
      setSelectAll(allFilteredSelected)
    }
  }, [ledgerFilter, totalFilter, state.FillArray, selectedRows])

  // Calculate totals for selected rows
  const calculateSelectedTotals = () => {
    if (selectedRows.size === 0) {
      return {
        totalSellerQty: 0,
        totalBuyerQty: 0,
        weightedAvgSellerRate: 0,
        weightedAvgBuyerRate: 0,
        profitLoss: 0,
        totalSum: 0,
      }
    }

    let totalSellerQty = 0
    let totalBuyerQty = 0
    let totalSellerQtyRate = 0
    let totalBuyerQtyRate = 0
    let totalSum = 0

    selectedRows.forEach(ledgerId => {
      const row = state.FillArray.find(r => r.LedgerId === ledgerId)
      if (row) {
        const sellerQty = parseFloat(row.TotalSellerQty) || 0
        const buyerQty = parseFloat(row.TotalBuyerQty) || 0
        const avgSellerRate = parseFloat(row.AvgSellerRate) || 0
        const avgBuyerRate = parseFloat(row.AvgBuyerRate) || 0
        const rowTotal = parseFloat(row.Total) || 0

        totalSellerQty += sellerQty
        totalBuyerQty += buyerQty
        totalSum += rowTotal
        totalSellerQtyRate += sellerQty * avgSellerRate
        totalBuyerQtyRate += buyerQty * avgBuyerRate
      }
    })

    const weightedAvgSellerRate =
      totalSellerQty > 0 ? totalSellerQtyRate / totalSellerQty : 0
    const weightedAvgBuyerRate =
      totalBuyerQty > 0 ? totalBuyerQtyRate / totalBuyerQty : 0
    const profitLoss = totalSellerQtyRate - totalBuyerQtyRate

    return {
      totalSellerQty,
      totalBuyerQty,
      weightedAvgSellerRate,
      weightedAvgBuyerRate,
      profitLoss,
      totalSum,
    }
  }

  return (
    <div className="ledger-report-wrapper" style={{ height: "100dvh", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <style>{`
        .ledger-report-wrapper {
          margin: 0;
          padding: 0;
        }
        
        @media (max-width: 576px) {
          .ledger-report-wrapper {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
        }
        
        .table-scroll-container {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          overflow-x: auto;
          position: relative;
          -webkit-overflow-scrolling: touch;
        }
        
        .table-scroll-container table {
          margin-bottom: 0 !important;
          width: 100%;
          table-layout: auto;
          min-width: 100%;
        }
        
        .table-scroll-container table tbody tr.totals-row {
          position: -webkit-sticky;
          position: sticky;
          bottom: 0;
          z-index: 5;
          background-color: #000000 !important;
          display: table-row !important;
          visibility: visible !important;
          width: 100%;
        }
        
        .table-scroll-container table tbody tr.totals-row td {
          background-color: #000000 !important;
          color: #ffffff !important;
          font-weight: bold;
          border-top: 2px solid #fff !important;
          padding: 8px 4px !important;
          white-space: nowrap;
          position: relative;
        }
        
        .table-scroll-container table tbody tr.totals-row td .badge {
          color: #ffffff !important;
        }
        
        /* Ensure table cells align properly during horizontal scroll */
        .table-scroll-container table thead th,
        .table-scroll-container table tbody td {
          white-space: nowrap;
        }
        
        /* Ensure totals row scrolls horizontally with table */
        .table-scroll-container table tbody tr.totals-row {
          display: table-row;
        }
        
        @media (max-width: 576px) {
          .table-scroll-container {
            padding-bottom: 70px !important;
            margin-bottom: 0 !important;
            margin-top: -10px !important;
            overflow-y: auto !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          
          .table-scroll-container table {
            margin-bottom: 0 !important;
            padding-bottom: 0 !important;
            display: table !important;
            width: 100% !important;
            margin-top: 0 !important;
          }
          
          .table-scroll-container table tbody {
            display: table-row-group !important;
            padding-bottom: 0 !important;
          }
          
          .table-scroll-container table tbody tr:not(.totals-row) {
            margin-bottom: 0 !important;
          }
          
          .table-scroll-container table tbody tr.totals-row {
            display: none !important;
          }
          
          .table-scroll-container table tbody tr.totals-row td {
            padding: 8px 4px !important;
            font-size: 0.7rem !important;
            background-color: #000000 !important;
            color: #ffffff !important;
            display: table-cell !important;
            visibility: visible !important;
            opacity: 1 !important;
            border: 1px solid #333 !important;
            white-space: nowrap !important;
            position: relative !important;
          }
          
          .table-scroll-container table tbody tr.totals-row td span {
            font-size: 0.65rem !important;
            padding: 3px 5px !important;
            display: inline-block !important;
            color: #ffffff !important;
          }
          
          .table-scroll-container table tbody tr.totals-row td .badge {
            font-size: 0.65rem !important;
            padding: 3px 5px !important;
            display: inline-block !important;
            color: #ffffff !important;
            background-color: inherit !important;
          }
          
          .table-scroll-container table tbody tr.totals-row td .badge.bg-primary {
            background-color: #0d6efd !important;
            color: #ffffff !important;
          }
          
          .table-scroll-container table tbody tr.totals-row td .badge.bg-danger {
            background-color: #dc3545 !important;
            color: #ffffff !important;
          }
          
          .table-scroll-container table tbody tr.totals-row td .badge.bg-success {
            background-color: #198754 !important;
            color: #ffffff !important;
          }
          
          .table-scroll-container table tbody tr.totals-row td .badge.bg-info {
            background-color: #0dcaf0 !important;
            color: #000000 !important;
          }
          
          .table-scroll-container table tbody tr.totals-row td .badge.bg-warning {
            background-color: #ffc107 !important;
            color: #000000 !important;
          }
        }
        
        .form-check-input:not(:checked) {
          border: 3px solid #212529 !important;
          background-color: #fff !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2) !important;
        }
        
        .form-check-input:checked {
          border: 3px solid #0d6efd !important;
          background-color: #0d6efd !important;
          box-shadow: 0 1px 3px rgba(13, 110, 253, 0.3) !important;
        }
        
        .form-check-input:focus {
          border-color: #0d6efd !important;
          outline: 0;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25), 0 1px 3px rgba(0, 0, 0, 0.2) !important;
        }
        
        .form-check-input:hover:not(:checked) {
          border-color: #000 !important;
          background-color: #f8f9fa !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
        }
        
        .form-check-input:hover:checked {
          border-color: #0b5ed7 !important;
          background-color: #0b5ed7 !important;
          box-shadow: 0 2px 4px rgba(13, 110, 253, 0.4) !important;
        }
        
        /* Override Bootstrap striped table styles - no alternate colors */
        .table-scroll-container table tbody tr {
          background-color: inherit !important;
        }
        
        .table-scroll-container table tbody tr:nth-of-type(odd) {
          background-color: inherit !important;
        }
        
        .table-scroll-container table tbody tr:nth-of-type(even) {
          background-color: inherit !important;
        }
        
        .table-scroll-container table tbody tr.table-striped {
          background-color: inherit !important;
        }

        /* Hide calendar icon in native date inputs */
        input[type="date"]::-webkit-calendar-picker-indicator {
          display: none;
          -webkit-appearance: none;
        }
      `}</style>

      {/* Filter Form */}
      <Card className="shadow-sm border-0 mb-2" style={{ flexShrink: 0 }}>
        <Card.Header className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0 d-none d-md-block">
              <i className="fas fa-book me-2"></i>
              New Ledger Report
            </h5>
            <div className="d-flex flex-column align-items-center d-md-none w-100">
              <div className="d-flex align-items-center justify-content-center flex-wrap gap-1">
                <span className="badge bg-danger" style={{ fontSize: '0.7rem', padding: 0, marginRight: '6px' }}>
                  B.Qty: {calculateSelectedTotals().totalBuyerQty.toFixed(2)}
                </span>
                <span className="badge bg-primary" style={{ fontSize: '0.7rem', padding: 0, marginRight: '6px' }}>
                  S.Qty: {calculateSelectedTotals().totalSellerQty.toFixed(2)}
                </span>
                <span className="badge bg-success" style={{ fontSize: '0.7rem', padding: 0 }}>
                  ₹{calculateSelectedTotals().totalSum.toFixed(0)}
                </span>
              </div>
              <div className="d-flex align-items-center justify-content-center flex-wrap gap-2 mt-1" style={{ fontSize: '0.65rem' }}>
                <span className="text-white">
                  <span className="text-white-50">AvgS:</span> {calculateSelectedTotals().weightedAvgSellerRate.toFixed(2)}
                </span>
                <span className="text-white">
                  <span className="text-white-50">AvgB:</span> {calculateSelectedTotals().weightedAvgBuyerRate.toFixed(2)}
                </span>
                <span className={calculateSelectedTotals().profitLoss >= 0 ? 'text-success' : 'text-danger'}>
                  <span className="text-white-50">P/L:</span> {calculateSelectedTotals().profitLoss >= 0 ? '' : '-'}{Math.abs(calculateSelectedTotals().profitLoss).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </Card.Header>
        <Card.Body className="py-1 px-3" style={{ overflow: 'visible' }}>
          <Form>
            <div style={{ overflowX: "auto", overflowY: "hidden" }}>
              <Row className="g-2 align-items-center" style={{ flexWrap: "nowrap", minWidth: "fit-content" }}>
                {showTable && state.FillArray.length > 0 && (
                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <div style={{ border: '1px solid #000000', borderRadius: '4px', padding: '0.25rem 0.5rem', backgroundColor: '#f8f9fa', width: 'fit-content', whiteSpace: 'nowrap', height: '28px', display: 'flex', alignItems: 'center' }}>
                      <div className="d-flex gap-2 align-items-center">
                        <span style={{ fontSize: '0.65rem', fontWeight: '600', color: '#333', marginRight: '2px', whiteSpace: 'nowrap' }}>Filter:</span>
                        <div className="form-check mb-0">
                          <input
                            type="checkbox"
                            id="total-greater-than-zero"
                            className="form-check-input"
                            checked={totalFilter.has(">0")}
                            onClick={e => {
                              e.stopPropagation()
                              setTotalFilter(prev => {
                                const newFilter = new Set(prev)
                                if (newFilter.has(">0")) {
                                  newFilter.delete(">0")
                                } else {
                                  newFilter.add(">0")
                                }
                                return newFilter
                              })
                            }}
                            style={{ marginTop: '0' }}
                          />
                          <label htmlFor="total-greater-than-zero" className="form-check-label small" style={{ fontSize: '0.7rem', marginLeft: '4px' }}>
                            {">0"}
                          </label>
                        </div>
                        <div className="form-check mb-0">
                          <input
                            type="checkbox"
                            id="total-equals-zero"
                            className="form-check-input"
                            checked={totalFilter.has("=0")}
                            onClick={e => {
                              e.stopPropagation()
                              setTotalFilter(prev => {
                                const newFilter = new Set(prev)
                                if (newFilter.has("=0")) {
                                  newFilter.delete("=0")
                                } else {
                                  newFilter.add("=0")
                                }
                                return newFilter
                              })
                            }}
                            style={{ marginTop: '0' }}
                          />
                          <label htmlFor="total-equals-zero" className="form-check-label small" style={{ fontSize: '0.7rem', marginLeft: '4px' }}>
                            {"=0"}
                          </label>
                        </div>
                      </div>
                    </div>
                  </Col>
                )}

                <Col xs="auto" style={{ flex: "0 0 auto" }}>
                  <div style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                    <div style={{ width: '95px', height: '28px' }}>
                      <DatePicker
                        selected={fromDate ? new Date(fromDate) : null}
                        onChange={date => setFromDate(date)}
                        className="form-control form-control-sm custom-datepicker"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="From Date"
                        portalId="root-portal"
                        popperPlacement="bottom-start"
                        openToDate={new Date()}
                      />
                    </div>
                    <span style={{ fontSize: "0.6rem", fontWeight: "500", color: "#1976D2", margin: "0 2px" }}>To</span>
                    <div style={{ width: '95px', height: '28px' }}>
                      <DatePicker
                        selected={toDate ? new Date(toDate) : null}
                        onChange={date => setToDate(date)}
                        className="form-control form-control-sm custom-datepicker"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="To Date"
                        portalId="root-portal"
                        popperPlacement="bottom-start"
                        openToDate={new Date()}
                      />
                    </div>
                  </div>
                </Col>

                <Col xs="auto" style={{ flex: "0 0 auto" }}>
                  <div
                    onClick={openItemModal}
                    style={{
                      backgroundColor: "#E3F2FD",
                      color: "#333",
                      border: "1px solid #2196F3",
                      borderRadius: "6px",
                      height: "28px",
                      padding: "2px 8px",
                      fontSize: "0.65rem",
                      fontWeight: "bold",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      minWidth: "120px",
                      maxWidth: "120px"
                    }}
                  >
                    <span>
                      {selectedItemIds && selectedItemIds.length > 0
                        ? `${selectedItemIds.length} selected`
                        : "Item Name"}
                    </span>
                    <i className="fas fa-chevron-down ms-2"></i>
                  </div>
                </Col>

                {showTable && state.FillArray.length > 0 && (
                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <div className="d-flex align-items-center">
                      <Form.Control
                        type="text"
                        size="sm"
                        placeholder="Search ledger name..."
                        value={ledgerFilter}
                        onChange={e => setLedgerFilter(e.target.value)}
                        className="me-1"
                        style={{ minWidth: "120px", maxWidth: "120px", height: "28px", fontSize: "0.7rem", fontWeight: "bold", backgroundColor: "#E3F2FD", border: "1px solid #2196F3" }}
                      />
                      {ledgerFilter && (
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() => setLedgerFilter("")}
                          className="py-0"
                          title="Clear filter"
                          style={{ height: "28px", padding: "0 4px" }}
                        >
                          <X size={12} />
                        </Button>
                      )}
                    </div>
                  </Col>
                )}

                {selectedRows.size > 0 && (
                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <div className="alert alert-info d-flex justify-content-between align-items-center mb-0 py-1 px-2" style={{ whiteSpace: 'nowrap', minWidth: 'fit-content' }}>
                      <div className="d-flex align-items-center">
                        <span className="small me-2">
                          <strong>{selectedRows.size}/{getFilteredAndSortedData().length}</strong> rows
                          {(ledgerFilter || totalFilter.size > 0) && (
                            <span className="text-muted ms-1">({state.FillArray.length})</span>
                          )}
                        </span>
                        <span className="badge bg-success small ms-2">
                          ₹{calculateSelectedTotals().totalSum.toFixed(0)}
                        </span>
                      </div>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        className="py-0 px-2 ms-2"
                        onClick={() => {
                          setSelectedRows(new Set())
                          setSelectAll(false)
                          setIsSelectingAll(false)
                        }}
                        style={{ fontSize: '0.7rem', height: '24px' }}
                      >
                        Clear
                      </Button>
                    </div>
                  </Col>
                )}
              </Row>
            </div>
          </Form>
        </Card.Body>
      </Card>



      {/* DalaliModal */}
      <DalaliModal
        showDalaliDataModal={showDalaliDataModal}
        onHideDalaliDataModal={() => setShowDalaliDataModal(false)}
        ledgerId={selectedLedgerId}
        reportData={state.FillArray}
        fromDate={fromDate}
        toDate={toDate}
        financialYears={financialYearArray}
        selectedFinancialYearId={selectedFinancialYearId}
        onFinancialYearChange={id => setSelectedFinancialYearId(id)}
        onSaveSuccess={() => loadData()}
      />

      {/* Item Selection Modal */}
      <Modal show={showItemModal} onHide={closeItemModal} size="lg" centered style={{ zIndex: 10000 }}>
        <ModalHeader className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center w-100">
            <h5 className="mb-0">
              <i className="fas fa-box me-2"></i>
              Select Item
            </h5>
            <Button variant="light" onClick={closeItemModal} className="btn-close btn-close-white" style={{ border: "none", background: "transparent" }}>
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </ModalHeader>
        <ModalBody style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
          <Form>
            <div className="mb-3">
              <Form.Label className="fw-semibold mb-0">Item</Form.Label>
            </div>
            <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>
              {state.ItemArray.map((item) => (
                <div
                  key={item.Id}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderRadius: "4px",
                    backgroundColor: tempSelectedItemIds.includes(item.Id) ? "#e7f3ff" : "transparent",
                    marginBottom: "4px",
                  }}
                  onClick={() => {
                    const isSelected = tempSelectedItemIds.includes(item.Id)
                    if (isSelected) {
                      setTempSelectedItemIds(tempSelectedItemIds.filter(id => id !== item.Id))
                    } else {
                      setTempSelectedItemIds([...tempSelectedItemIds, item.Id])
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!tempSelectedItemIds.includes(item.Id)) {
                      e.currentTarget.style.backgroundColor = "#f8f9fa"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!tempSelectedItemIds.includes(item.Id)) {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  <div className="d-flex align-items-center">
                    <input
                      type="checkbox"
                      checked={tempSelectedItemIds.includes(item.Id)}
                      onChange={() => { }}
                      style={{ marginRight: "10px", cursor: "pointer" }}
                    />
                    <span>{item.Name}</span>
                  </div>
                </div>
              ))}
              {state.ItemArray.length === 0 && (
                <div className="text-center text-muted py-3">No items available</div>
              )}
            </div>
          </Form>
        </ModalBody>
        <ModalFooter className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setTempSelectedItemIds([])}>
            Clear All
          </Button>
          <Button variant="outline-primary" size="sm" onClick={() => {
            const allItemIds = state.ItemArray.map(item => item.Id)
            setTempSelectedItemIds(allItemIds)
          }}>
            Select All
          </Button>
          <Button variant="primary" onClick={handleItemModalDone}>
            <i className="fas fa-check me-2"></i>
            Done
          </Button>
        </ModalFooter>
      </Modal>

      {/* Results Table */}
      {(showTable || (state.FillArray && state.FillArray.length > 0)) && (
        <div className="table-scroll-container">
          {getFilteredAndSortedData().length > 0 ? (
            <Table bordered hover size="sm" className="mb-0 resizable-table" style={{ marginBottom: 0, tableLayout: 'fixed' }}>
              <thead className="table-success text-center" style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.Checkbox}px` }}>
                    <input
                      type="checkbox"
                      checked={selectAll}
                      disabled={isSelectingAll}
                      onClick={e => {
                        e.stopPropagation()
                        handleSelectAll(!selectAll)
                      }}
                      className="form-check-input"
                      title={isSelectingAll ? "Selecting all rows..." : ""}
                    />
                    {isSelectingAll && (
                      <div className="d-inline-block ms-2">
                        <div className="spinner-border spinner-border-sm text-primary" role="status">
                          <span className="visually-hidden">Loading...</span>
                        </div>
                      </div>
                    )}
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Checkbox')} onTouchStart={e => handleResizeMouseDown(e, 'Checkbox')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.Ledger}px` }}>
                    Ledger
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Ledger')} onTouchStart={e => handleResizeMouseDown(e, 'Ledger')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.SellerQty}px` }}>
                    Seller Qty
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'SellerQty')} onTouchStart={e => handleResizeMouseDown(e, 'SellerQty')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.BuyerQty}px` }}>
                    Buyer Qty
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'BuyerQty')} onTouchStart={e => handleResizeMouseDown(e, 'BuyerQty')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.DalaliRate}px` }}>
                    Dalali Rate
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'DalaliRate')} onTouchStart={e => handleResizeMouseDown(e, 'DalaliRate')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.TotalSellerAmt}px` }}>
                    Total Seller Amt
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'TotalSellerAmt')} onTouchStart={e => handleResizeMouseDown(e, 'TotalSellerAmt')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.TotalBuyerAmt}px` }}>
                    Total Buyer Amt
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'TotalBuyerAmt')} onTouchStart={e => handleResizeMouseDown(e, 'TotalBuyerAmt')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.AvgSellerRate}px` }}>
                    Avg Seller Rate
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'AvgSellerRate')} onTouchStart={e => handleResizeMouseDown(e, 'AvgSellerRate')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.AvgBuyerRate}px` }}>
                    Avg Buyer Rate
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'AvgBuyerRate')} onTouchStart={e => handleResizeMouseDown(e, 'AvgBuyerRate')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.Total}px` }}>
                    Total
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Total')} onTouchStart={e => handleResizeMouseDown(e, 'Total')} />
                  </th>
                  <th style={{ position: 'relative', overflow: 'hidden', width: `${columnWidths.Action}px` }}>
                    Action
                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Action')} onTouchStart={e => handleResizeMouseDown(e, 'Action')} />
                  </th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedData().map((row) => {
                  // Color based on Total value
                  const total = parseFloat(row.Total) || 0
                  const rowColor = total > 0 ? '#c8e6c9' : '#ffcdd2' // Light green for >0, light red for =0
                  const hoverColor = total > 0 ? '#a5d6a7' : '#ef9a9a' // Darker green/red on hover

                  return (
                    <tr
                      key={`row-${row.LedgerId}`}
                      onDoubleClick={() => handleRowDoubleClick(row)}
                      style={{ cursor: 'pointer', backgroundColor: rowColor, transition: 'background-color 0.2s ease' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = hoverColor
                        // Update all cells on hover
                        Array.from(e.currentTarget.children).forEach(cell => {
                          cell.style.backgroundColor = hoverColor
                        })
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = rowColor
                        // Reset all cells on leave
                        Array.from(e.currentTarget.children).forEach(cell => {
                          cell.style.backgroundColor = rowColor
                        })
                      }}
                      title="Double-click to view Ledger Report"
                    >
                      <td className="text-center" style={{ backgroundColor: rowColor }}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(row.LedgerId)}
                          disabled={isSelectingAll}
                          onClick={e => {
                            e.stopPropagation()
                            handleRowSelect(row.LedgerId, !selectedRows.has(row.LedgerId))
                          }}
                          className="form-check-input"
                        />
                      </td>
                      <td className="text-nowrap fw-semibold text-truncate" style={{ backgroundColor: rowColor }} title={row.LedgerName}>
                        {row.LedgerName}
                      </td>
                      <td className="text-nowrap text-truncate" style={{ backgroundColor: rowColor }} title={row.SellerQty}>
                        {row.TotalSellerQty}
                      </td>
                      <td className="text-nowrap text-truncate" style={{ backgroundColor: rowColor }} title={row.BuyerQty}>
                        {row.TotalBuyerQty}
                      </td>
                      <td className="text-nowrap text-truncate" style={{ backgroundColor: rowColor }} title={row.DalaliRate}>
                        {row.DalaliRate}
                      </td>
                      <td className="text-nowrap text-truncate" style={{ backgroundColor: rowColor }} title={row.TotalSellerAmount}>
                        {row.TotalSellerAmount}
                      </td>
                      <td className="text-nowrap text-truncate" style={{ backgroundColor: rowColor }} title={row.TotalBuyerAmount}>
                        {row.TotalBuyerAmount}
                      </td>
                      <td className="text-nowrap text-truncate" style={{ backgroundColor: rowColor }} title={row.AvgSellerRate}>
                        {row.AvgSellerRate}
                      </td>
                      <td className="text-nowrap text-truncate" style={{ backgroundColor: rowColor }} title={row.AvgBuyerRate}>
                        {row.AvgBuyerRate}
                      </td>
                      <td className="text-nowrap text-truncate" style={{ backgroundColor: rowColor }} title={row.Total}>
                        {row.Total}
                      </td>
                      <td className="text-nowrap text-truncate" style={{ backgroundColor: rowColor }} title={row.Action}>
                        <Button variant="primary" size="sm" onClick={() => handleOpenDalali(row.LedgerId)}>
                          Open Dalali
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {/* Totals Row - Fixed at bottom */}
                {selectedRows.size > 0 && (
                  <tr
                    className="totals-row"
                  >
                    <td className="text-center" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className="text-white small">
                        {selectedRows.size}/{getFilteredAndSortedData().length}
                      </span>
                    </td>
                    <td className="fw-bold" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className="text-white">Selected Totals</span>
                    </td>
                    <td className="text-end fw-bold" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className="badge bg-primary">{calculateSelectedTotals().totalSellerQty.toFixed(2)}</span>
                    </td>
                    <td className="text-end fw-bold" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className="badge bg-danger">{calculateSelectedTotals().totalBuyerQty.toFixed(2)}</span>
                    </td>
                    <td className="text-center" style={{ backgroundColor: '#000000', color: '#ffffff' }}>-</td>
                    <td className="text-end fw-bold" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className="text-white">{(calculateSelectedTotals().totalSellerQty * calculateSelectedTotals().weightedAvgSellerRate).toFixed(2)}</span>
                    </td>
                    <td className="text-end fw-bold" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className="text-white">{(calculateSelectedTotals().totalBuyerQty * calculateSelectedTotals().weightedAvgBuyerRate).toFixed(2)}</span>
                    </td>
                    <td className="text-end fw-bold" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className="badge bg-info">{calculateSelectedTotals().weightedAvgSellerRate.toFixed(2)}</span>
                    </td>
                    <td className="text-end fw-bold" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className="badge bg-warning">{calculateSelectedTotals().weightedAvgBuyerRate.toFixed(2)}</span>
                    </td>
                    <td className="text-end fw-bold" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className={`badge ${calculateSelectedTotals().profitLoss >= 0 ? "bg-success" : "bg-danger"}`}>
                        {calculateSelectedTotals().totalSum.toFixed(2)}
                      </span>
                    </td>
                    <td className="text-center" style={{ backgroundColor: '#000000', color: '#ffffff' }}>
                      <span className={`badge ${calculateSelectedTotals().profitLoss >= 0 ? "bg-success" : "bg-danger"}`}>
                        {calculateSelectedTotals().profitLoss >= 0 ? "Profit" : "Loss"}: {Math.abs(calculateSelectedTotals().profitLoss).toFixed(2)}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          ) : (
            <div className="text-center p-5">
              <div className="text-muted">
                <Search size={48} className="mb-3" />
                <h5>No Data Found</h5>
                <p>
                  {ledgerFilter || totalFilter.size > 0
                    ? `No ledgers found matching the current filters. Please try adjusting your filters.`
                    : "No records match the selected criteria. Please try adjusting your filters."}
                </p>
                {(ledgerFilter || totalFilter.size > 0) && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => {
                      setLedgerFilter("")
                      setTotalFilter(new Set())
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Generating report, please wait...</p>
        </div>
      )}
    </div>
  )
}

export default NewLedgerReport
