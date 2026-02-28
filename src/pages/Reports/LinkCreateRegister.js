import React, { useState, useEffect, useRef, useMemo } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  Card,
  Alert,
  Dropdown,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "react-bootstrap"
import { API_WEB_URLS } from "constants/constAPI"
import { Fn_GetReport, Fn_DisplayData, Fn_FillListData, Fn_AddEditData } from "store/Functions"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Search, Printer, X, LogOut, Calendar, Filter, Download } from "react-feather"
import "./ContractRegister.scss"
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import MultiSelectDropdown from "../../components/Common/MultiSelectDropdown"
import useColumnResize from '../../helpers/useColumnResize'
import '../../helpers/columnResize.css'

function LinkCreateRegister() {
  const dispatch = useDispatch()

  // Get global dates from Redux store
  const globalDates = useSelector(state => state.GlobalDates)

  const [selectedItems, setSelectedItems] = useState([])
  const [itemOptions, setItemOptions] = useState([{ value: "", label: "All" }])
  const [shouldRefreshItemOptions, setShouldRefreshItemOptions] = useState(true)
  const [fromDate, setFromDate] = useState(new Date(globalDates.fromDate))
  const [toDate, setToDate] = useState(new Date(globalDates.toDate))
  const [ledgerId, setLedgerId] = useState(0)
  const [notLifted, setNotLifted] = useState(true)
  const [partialLift, setPartialLift] = useState(true)
  const [fullLift, setFullLift] = useState(false)
  const [selectedPeriods, setSelectedPeriods] = useState([])

  // Modal state for Commodity and Period
  const [showItemModal, setShowItemModal] = useState(false)
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [tempSelectedItems, setTempSelectedItems] = useState([])
  const [tempSelectedPeriods, setTempSelectedPeriods] = useState([])
  // Period dropdown display text - only updated when user confirms in modal or clears (not on row checkbox)
  const [periodDisplayText, setPeriodDisplayText] = useState('Select Period')

  const [showTable, setShowTable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const [error, setError] = useState("")

  // Checkbox selection state for multi-print
  // selectedRows maintains the order of selection
  const [selectedRows, setSelectedRows] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Column resize feature
  const { columnWidths, handleResizeMouseDown } = useColumnResize('linkCreateRegister_columnWidths', {
      Checkbox: 50,
      ContractNo: 90,
      Date: 80,
      Seller: 120,
      Buyer: 120,
      Item: 100,
      Period: 80,
      Qty: 70,
      LinkedQty: 80,
      Rate: 70,
      LiftedQty: 80,
      AdvPayment: 90,
      AdvDate: 80,
      Vessel: 80,
  })

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  })


  const [state, setState] = useState({
    FillArray: [],
    LedgerArray: [],
    MonthArray: [],
    FromDate: globalDates.fromDate,
    ToDate: globalDates.toDate,
  })

  const buildItemOptions = data => {
    if (!data || data.length === 0) {
      return [{ value: "", label: "All" }]
    }

    const uniqueItemsMap = new Map()
    data.forEach(row => {
      const label = row.ItemTypeName && row.ItemTypeName.trim()
      const id = row.F_ItemType

      if (label && id !== null && id !== undefined) {
        const key = String(id)
        if (!uniqueItemsMap.has(key)) {
          uniqueItemsMap.set(key, label)
        }
      }
    })

    const items = Array.from(uniqueItemsMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }))

    return [{ value: "", label: "All" }, ...items]
  }

  useEffect(() => {
    if (!state.FillArray) return

    if (shouldRefreshItemOptions) {
      setItemOptions(buildItemOptions(state.FillArray))
    }
  }, [state.FillArray, shouldRefreshItemOptions])

  const API_URL_Get = `${API_WEB_URLS.ContractForLinkRegister}/0/token`
  const API_URL_PeriodData = `${API_WEB_URLS.PeriodData}/0/token`
  const API_URL = API_WEB_URLS.MASTER + "/0/token/LedgerReportMaster"
  const API_URL1 = API_WEB_URLS.MASTER + "/0/token/ItemMaster"
  const API_URL2 = API_WEB_URLS.MASTER + "/0/token/MonthMaster"

  // Helper function to format date in local time (YYYY-MM-DD)
  const formatDateLocal = (date) => {
    if (!date) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  useEffect(() => {
    Fn_FillListData(dispatch, setState, "LedgerArray", API_URL + "/Id/0")


  }, [dispatch])

  // Auto-show table when data is received
  useEffect(() => {
    console.log("FillArray updated:", state.FillArray)
    if (state.FillArray && state.FillArray.length > 0) {
      console.log("Setting showTable to true")
      setShowTable(true)
      setShowReport(true)
    }
  }, [state.FillArray])


  // Fetch data function
  const fetchData = async (refreshItemOptions = true) => {
    setShouldRefreshItemOptions(refreshItemOptions)
    setLoading(true)
    setError("")

    try {
      let vformData = new FormData()

      // Get selected period names
      const periodValue = selectedPeriods.length === 0
        ? 'All'
        : selectedPeriods.map(id => {
          const period = state.MonthArray.find(p => p.Id === id)
          return period ? period.Name : ''
        }).filter(name => name !== '').join(',')

      vformData.append("FromDate", formatDateLocal(fromDate))
      vformData.append("ToDate", formatDateLocal(toDate))
      vformData.append("LedgerId", ledgerId)
      vformData.append("SearchValue", periodValue)
      vformData.append("NotLifted", notLifted)
      vformData.append("PartialLift", partialLift)
      vformData.append("FullLift", fullLift)
      vformData.append("Filter", 0)
      vformData.append("F_ItemType", 0)

      const selectedItemIds =
        selectedItems && selectedItems.length > 0
          ? selectedItems.filter(item => item !== "")
          : []

      const itemIdsCsv =
        selectedItemIds.length > 0
          ? selectedItemIds.map(id => id.toString().trim()).filter(id => id !== "").join(",")
          : ""

      vformData.append("ItemIds", itemIdsCsv)



      const result = await Fn_GetReport(
        dispatch,
        setState,
        "FillArray",
        API_URL_Get,
        { arguList: { id: 0, formData: vformData } },
        true
      )
      Fn_GetReport(
        dispatch,
        setState,
        "MonthArray",
        API_URL_PeriodData,
        { arguList: { id: 0, formData: vformData } },
        true
      )
      // Show table after data is received
      setShowTable(true)
      setShowReport(true)

    } catch (error) {
      setError("Error generating report. Please try again.")
      console.error("Report generation error:", error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-fetch data when non-item filters change
  useEffect(() => {

    fetchData(true)

  }, [fromDate, toDate, ledgerId, selectedPeriods, notLifted, partialLift, fullLift])

  // Fetch data when item selection changes without refreshing item options
  useEffect(() => {
    if (state.MonthArray.length > 0) {
      fetchData(false)
    }
  }, [selectedItems])

  // Sorting function
  const handleSort = (key) => {
    setSortConfig(prevConfig => {
      if (prevConfig.key === key) {
        // If same column, toggle direction
        return {
          key,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        }
      } else {
        // If different column, start with ascending
        return {
          key,
          direction: 'asc'
        }
      }
    })
  }

  // Filter and sort table data
  const filteredTableData = useMemo(() => {
    if (!state.FillArray) return []

    let filtered = state.FillArray

    const hasSpecificItemsSelected =
      selectedItems &&
      selectedItems.length > 0 &&
      !(selectedItems.length === 1 && selectedItems[0] === "")

    if (hasSpecificItemsSelected) {
      filtered = filtered.filter(row => {
        if (row.F_ItemType === null || row.F_ItemType === undefined) return false
        return selectedItems.some(itemId => String(row.F_ItemType) === String(itemId))
      })
    }

    // Apply sorting
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key] || ''
        const bValue = b[sortConfig.key] || ''

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1
        }
        return 0
      })
    }

    return filtered
  }, [state.FillArray, selectedItems, sortConfig])

  // Do not auto-select all rows on page load - user must manually select

  // Function to determine row background color based on lifted quantity
  const getRowBackgroundColor = (row) => {
    const qty = parseFloat(row.Qty) || 0
    const liftedQty = parseFloat(row.LiftedQuantity) || 0

    if (qty > 0 && liftedQty === qty) {
      return '#d1ecf1' // Light blue - fully lifted
    } else if (qty > 0 && liftedQty === 0) {
      return '#e9ecef' // Light grey - not lifted
    } else if (qty > 0 && liftedQty > 0 && liftedQty < qty) {
      return '#f8d7da' // Light red - partially lifted
    }
    return 'white' // Default white background
  }

  // Function to get Period value
  const getPeriodValue = (row) => {
    // First priority: MonthName
    if (row.MonthName) {
      return row.MonthName + " " + (row.Year ? row.Year : '')
    }

    // Second priority: Shipment dates
    if (row.ShipmentFromDate || row.ShipmentToDate) {
      const fromDate = row.ShipmentFromDate ? new Date(row.ShipmentFromDate).toLocaleDateString('en-GB') : '-'
      const toDate = row.ShipmentToDate ? new Date(row.ShipmentToDate).toLocaleDateString('en-GB') : '-'
      return `${fromDate} - ${toDate}`
    }

    // Third priority: Lifted dates
    if (row.LiftedFromDate || row.LiftedToDate) {
      const fromDate = row.LiftedFromDate ? new Date(row.LiftedFromDate).toLocaleDateString('en-GB') : '-'
      const toDate = row.LiftedToDate ? new Date(row.LiftedToDate).toLocaleDateString('en-GB') : '-'
      return `${fromDate} - ${toDate}`
    }

    return '-'
  }

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    const checked = e.target.checked

    // If trying to select (check), require period selection first
    if (checked) {
      if (!selectedPeriods || selectedPeriods.length === 0) {
        // Prevent checkbox from being checked by resetting it
        setTimeout(() => {
          e.target.checked = false
        }, 0)
        toast.warning("Please select a period first before selecting rows")
        return
      }
    }

    setSelectAll(checked)
    if (checked) {
      // Select all rows in the order they appear in filteredTableData
      setSelectedRows(filteredTableData.map(row => row.Id))
    } else {
      setSelectedRows([])
    }
  }

  // Handle individual row selection - maintains EXACT order of selection
  // When user clicks checkboxes: 70th row, then 37th, then 59th
  // selectedRows will be [70, 37, 59] in that exact order
  const handleRowSelect = (rowId, event) => {
    // Check if this is a selection (not deselection)
    const isCurrentlySelected = selectedRows.includes(rowId)

    if (!isCurrentlySelected) {
      // User is trying to select - check if period is selected first
      if (!selectedPeriods || selectedPeriods.length === 0) {
        // Prevent checkbox from being checked
        alert("Please select a period first before selecting rows")
        if (event && event.target) {
          setTimeout(() => {
            event.target.checked = false
          }, 0)
        }

        return
      }
    }

    // Proceed with selection/deselection
    setSelectedRows(prev => {
      if (prev.includes(rowId)) {
        // Allow deselection (unchecking) even without period selection
        // Remove from selection while maintaining order of remaining items
        const newSelection = prev.filter(id => id !== rowId)
        setSelectAll(false)
        return newSelection
      } else {
        // Add to end of selection array to maintain EXACT selection order
        // This ensures the order matches the sequence in which user clicked checkboxes
        const newSelection = [...prev, rowId]
        // Check if all rows are now selected
        if (newSelection.length === filteredTableData.length) {
          setSelectAll(true)
        }
        return newSelection
      }
    })
  }

  const handleSelectedItemsChange = newSelectedItems => {
    if (!newSelectedItems || newSelectedItems.length === 0) {
      setSelectedItems([])
      return
    }

    let normalized = newSelectedItems.map(item => (item === "" ? "" : String(item)))

    if (normalized.includes("") && normalized.length > 1) {
      normalized = [""]
    }

    setSelectedItems(normalized)
  }

  // Modal functions for Commodity
  const openItemModal = () => {
    setTempSelectedItems(selectedItems)
    setShowItemModal(true)
  }

  const closeItemModal = () => {
    setShowItemModal(false)
  }

  const handleItemModalDone = () => {
    // Handle items with normalization
    if (!tempSelectedItems || tempSelectedItems.length === 0) {
      setSelectedItems([])
    } else {
      let normalized = tempSelectedItems.map(item => (item === "" ? "" : String(item)))
      if (normalized.includes("") && normalized.length > 1) {
        normalized = normalized.filter(item => item !== "")
      }
      setSelectedItems(normalized)
    }
    setShowItemModal(false)
  }

  // Modal functions for Period
  const openPeriodModal = () => {
    setTempSelectedPeriods(selectedPeriods)
    setShowPeriodModal(true)
  }

  const closePeriodModal = () => {
    setShowPeriodModal(false)
  }

  const handlePeriodModalDone = () => {
    setSelectedPeriods(tempSelectedPeriods)
    // Update period dropdown display only when user confirms (so row checkbox does not change it)
    if (tempSelectedPeriods.length === 0) {
      setPeriodDisplayText('Select Period')
    } else if (tempSelectedPeriods.length === state.MonthArray.length) {
      setPeriodDisplayText('All Selected')
    } else if (tempSelectedPeriods.length === 1) {
      const period = state.MonthArray.find(p => p.Id === tempSelectedPeriods[0])
      setPeriodDisplayText(period ? period.Name : 'Select Period')
    } else {
      setPeriodDisplayText(`${tempSelectedPeriods.length} Selected`)
    }
    // If all periods are deselected, clear row selections
    if (tempSelectedPeriods.length === 0) {
      setSelectedRows([])
      setSelectAll(false)
    }
    setShowPeriodModal(false)
  }

  const handleClear = () => {
    setSelectedItems([])
    setFromDate(new Date("2024-04-01"))
    setToDate(new Date("2026-03-31"))
    setLedgerId(0)
    setNotLifted(false)
    setPartialLift(false)
    setFullLift(false)
    setSelectedPeriods([])
    setPeriodDisplayText('Select Period')
    setSelectedRows([])
    setSelectAll(false)

    setShowTable(false)
    setShowReport(false)
    setState({
      ...state,
      FillArray: []
    })
    setError("")
  }

  const handleExit = () => {
    window.close() // Or navigate to another page
  }

  // Function to handle button click - processes rows in order of selection
  const handleButtonClick = async () => {
    if (selectedRows.length === 0) {
      toast.warning("No row selected")
      console.log("No row selected")
      return
    }

    // Process rows in the order they were selected (selectedRows maintains order)
    // Create a map for quick lookup of row data
    const rowDataMap = new Map()
    filteredTableData.forEach(row => {
      rowDataMap.set(row.Id, row)
    })

    // Get selected row data in the order of selection
    const selectedRowData = selectedRows
      .map(rowId => rowDataMap.get(rowId))
      .filter(row => row !== undefined) // Filter out any undefined rows

    // Validate that all selected rows have the same period
    if (selectedRowData.length > 1) {
      const periods = selectedRowData.map(row => getPeriodValue(row))
      const uniquePeriods = [...new Set(periods)]

      if (uniquePeriods.length > 1) {
        toast.error(`Selected rows have different periods. Please select rows with the same period.`)
        console.log("Periods mismatch:", uniquePeriods)
        return
      }
    }

    // Extract row.Id values in EXACT selection order and create comma-separated string
    // selectedRows array maintains the order in which checkboxes were clicked
    // Example: If user selects row 70, then 37, then 59, idsString will be "70,37,59"
    const idsString = selectedRows.join(',')
    console.log("Selected Row IDs (in EXACT selection order):", selectedRows)
    console.log("ContractIds string (comma-separated, in selection order):", idsString)

    // Get period value from first selected row (all should have same period)
    const periodValue = selectedRowData.length > 0 ? getPeriodValue(selectedRowData[0]) : ''

    // Calculate minimum Qty from all selected contracts
    // If LinkedQty exists, use (Qty - LinkedQty), otherwise use Qty
    const minQty = selectedRowData.length > 0
      ? Math.min(...selectedRowData.map(row => {
        const qty = parseFloat(row.Qty) || 0
        const linkedQty = parseFloat(row.LinkedQty) || 0
        // If LinkedQty exists, calculate Qty - LinkedQty, otherwise use Qty
        return linkedQty > 0 ? (qty - linkedQty) : qty
      }))
      : 0
    console.log("Minimum Qty (after LinkedQty adjustment):", minQty)
    console.log("Period Value:", periodValue)
    console.log("Processing rows in selection order:", selectedRows)

    try {
      setLoading(true)
      const formData = new FormData()
      formData.append("ContractIds", idsString)
      formData.append("Qty", minQty)
      formData.append("Period", periodValue)
      formData.append('UserId', 1)

      await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: 0, formData } },
        'LinkRegister/0/token',
        true,
        "memberid"
      )

      // Refresh data after successful link creation
      await fetchData(true)

      // Clear selection after successful operation
      setSelectedRows([])
      setSelectAll(false)

      toast.success("Link register created successfully")
    } catch (error) {
      console.error("Error creating link register:", error)
      toast.error("Error creating link register. Please try again.")
    } finally {
      setLoading(false)
    }
  }


  const getPeriodDisplayText = () => {
    if (selectedPeriods.length === 0) {
      return 'Select Period'
    } else if (selectedPeriods.length === state.MonthArray.length) {
      return 'All Selected'
    } else if (selectedPeriods.length === 1) {
      const period = state.MonthArray.find(p => p.Id === selectedPeriods[0])
      return period ? period.Name : 'Select Period'
    } else {
      return `${selectedPeriods.length} Selected`
    }
  }

  const handleMultiPrint = async () => {
    if (selectedRows.length === 0) {
      toast.warning("Please select at least one contract to print")
      return
    }

    try {
      // Convert selected IDs to comma-separated string
      const selectedIds = selectedRows.join(',')

      // Open ContractPrint in a new window/tab with the selected contract IDs
      const printUrl = `/contract-print?id=${selectedIds}`
      window.open(printUrl, '_blank')

      // Show success message
      toast.success(`Opening print view for ${selectedRows.length} contract${selectedRows.length > 1 ? 's' : ''}`)

    } catch (error) {
      console.error("Print preparation error:", error)
      toast.error("Error preparing print data. Please try again.")
    }
  }


  // Excel export function with colorful rows and totals
  const handleExcelExport = async () => {
    if (!filteredTableData || filteredTableData.length === 0) {
      toast.warning("No data to export")
      return
    }

    if (selectedRows.length === 0) {
      toast.warning("Please select at least one row to export")
      return
    }

    // Filter data to only include selected rows
    const selectedData = filteredTableData.filter(row => selectedRows.includes(row.Id))

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Contract Register')

      // Define columns
      worksheet.columns = [
        { header: 'Contract No', key: 'contractNo', width: 15 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Seller', key: 'seller', width: 20 },
        { header: 'Buyer', key: 'buyer', width: 20 },
        { header: 'Item', key: 'item', width: 15 },
        { header: 'Period', key: 'period', width: 20 },
        { header: 'Qty', key: 'qty', width: 12 },
        { header: 'LinkedQty', key: 'linkedQty', width: 12 },
        { header: 'Rate', key: 'rate', width: 12 },
        { header: 'Lifted Qty', key: 'liftedQty', width: 12 },
        { header: 'Adv Payment', key: 'advPayment', width: 15 },
        { header: 'Adv Date', key: 'advDate', width: 12 },
        { header: 'Vessel', key: 'vessel', width: 15 }
      ]

      // Style header row
      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '28a745' } // Green background
      }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
      headerRow.height = 25

      // Add data rows with colors
      selectedData.forEach((row, index) => {
        const excelRow = worksheet.addRow({
          contractNo: row.ContractNo || '-',
          date: row.Date ? new Date(row.Date).toLocaleDateString('en-GB') : '-',
          seller: row.SellerLedger || '-',
          buyer: row.BuyerLedger || '-',
          item: row.ItemTypeName || '-',
          period: getPeriodValue(row),
          qty: parseFloat(row.Qty) || 0,
          linkedQty: parseFloat(row.LinkedQty) || 0,
          rate: parseFloat(row.Rate) || 0,
          liftedQty: parseFloat(row.LiftedQuantity) || 0,
          advPayment: parseFloat(row.AdvPayment) || 0,
          advDate: row.AdvDate ? new Date(row.AdvDate).toLocaleDateString('en-GB') : '-',
          vessel: row.Vessel || '-'
        })

        // Apply row styling based on lifted quantity (same colors as table)
        const qty = parseFloat(row.Qty) || 0
        const liftedQty = parseFloat(row.LiftedQuantity) || 0
        let fillColor = 'FFFFFF' // Default white

        if (qty > 0 && liftedQty === qty) {
          fillColor = 'D1ECF1' // Light blue - fully lifted
        } else if (qty > 0 && liftedQty === 0) {
          fillColor = 'E9ECEF' // Light grey - not lifted
        } else if (qty > 0 && liftedQty > 0 && liftedQty < qty) {
          fillColor = 'F8D7DA' // Light red - partially lifted
        }

        // Apply background color to all cells in the row
        excelRow.eachCell({ includeEmpty: true }, (cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: fillColor }
          }
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'thin', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } }
          }
        })

        // Style numeric columns (right align)
        excelRow.getCell('qty').alignment = { horizontal: 'right' }
        excelRow.getCell('linkedQty').alignment = { horizontal: 'right' }
        excelRow.getCell('rate').alignment = { horizontal: 'right' }
        excelRow.getCell('liftedQty').alignment = { horizontal: 'right' }
        excelRow.getCell('advPayment').alignment = { horizontal: 'right' }

        // Make contract number bold
        excelRow.getCell('contractNo').font = { bold: true }
      })

      // Add totals row
      const totalsRow = worksheet.addRow({
        contractNo: 'TOTAL',
        date: '',
        seller: '',
        buyer: '',
        item: '',
        period: '',
        qty: selectedData.reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0),
        linkedQty: selectedData.reduce((sum, row) => sum + (parseFloat(row.LinkedQty) || 0), 0),
        rate: '',
        liftedQty: selectedData.reduce((sum, row) => sum + (parseFloat(row.LiftedQuantity) || 0), 0),
        advPayment: selectedData.reduce((sum, row) => sum + (parseFloat(row.AdvPayment) || 0), 0),
        advDate: '',
        vessel: ''
      })

      // Style totals row
      totalsRow.font = { bold: true, color: { argb: 'FFFFFF' } }
      totalsRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '0d6efd' } // Blue background
      }
      totalsRow.alignment = { horizontal: 'center', vertical: 'middle' }
      totalsRow.height = 25

      // Style totals row cells
      totalsRow.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '0d6efd' }
        }
        cell.font = { bold: true, color: { argb: 'FFFFFF' } }
        cell.border = {
          top: { style: 'thick', color: { argb: '000000' } },
          left: { style: 'thin', color: { argb: '000000' } },
          bottom: { style: 'thick', color: { argb: '000000' } },
          right: { style: 'thin', color: { argb: '000000' } }
        }
      })

      // Right align numeric columns in totals row
      totalsRow.getCell('qty').alignment = { horizontal: 'right' }
      totalsRow.getCell('linkedQty').alignment = { horizontal: 'right' }
      totalsRow.getCell('liftedQty').alignment = { horizontal: 'right' }
      totalsRow.getCell('advPayment').alignment = { horizontal: 'right' }

      // Add summary information
      worksheet.addRow({}) // Empty row
      const summaryRow = worksheet.addRow({
        contractNo: 'SUMMARY',
        date: '',
        seller: '',
        buyer: '',
        item: '',
        period: '',
        qty: '',
        rate: '',
        liftedQty: '',
        advPayment: '',
        advDate: '',
        vessel: ''
      })

      summaryRow.font = { bold: true }
      summaryRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'F8F9FA' }
      }

      // Add summary details
      const summaryDetails = [
        { label: 'Selected Contracts', value: selectedData.length },
        { label: 'Report Generated', value: new Date().toLocaleString('en-GB') },
        { label: 'Date Range', value: `${fromDate.toLocaleDateString('en-GB')} - ${toDate.toLocaleDateString('en-GB')}` }
      ]

      summaryDetails.forEach((detail, index) => {
        const detailRow = worksheet.addRow({
          contractNo: detail.label,
          date: '',
          seller: '',
          buyer: '',
          item: '',
          period: detail.value,
          qty: '',
          rate: '',
          liftedQty: '',
          advPayment: '',
          advDate: '',
          vessel: ''
        })

        detailRow.getCell('contractNo').font = { bold: true }
        detailRow.getCell('period').font = { bold: true }
      })

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      const fileName = `Contract_Register_Selected_${selectedRows.length}_rows_${timestamp}.xlsx`

      // Save the workbook
      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success(`Excel file downloaded: ${fileName}`)
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error('Error exporting to Excel. Please try again.')
    }
  }

  const exportChainsToExcel = (chains, periodName) => {
    const workbook = XLSX.utils.book_new()

    // Prepare Buyback Chains data
    const buybackData = []
    chains.buybackChains.forEach((chain, index) => {
      const chainItem = chain[0].contract.ItemTypeName || 'Unknown'
      buybackData.push({
        'Chain #': `Buyback Chain ${index + 1} - ${chainItem}`,
        'Contract No': '',
        'Date': '',
        'Seller': chain[0].contract.SellerLedger,
        'Buyer': '',
        'Item': chainItem,
        'Qty': '',
        'Rate': '',
        'Chain Flow': ''
      })

      chain.forEach((edge, edgeIndex) => {
        const flow = edgeIndex === 0
          ? `${edge.contract.SellerLedger} → ${edge.buyer}`
          : `→ ${edge.buyer}`

        buybackData.push({
          'Chain #': '',
          'Contract No': edge.contract.ContractNo,
          'Date': edge.contract.Date ? new Date(edge.contract.Date).toLocaleDateString('en-GB') : '-',
          'Seller': edge.contract.SellerLedger,
          'Buyer': edge.buyer,
          'Item': edge.contract.ItemTypeName || '-',
          'Qty': edge.contract.Qty || 0,
          'Rate': edge.contract.Rate || 0,
          'Chain Flow': flow
        })
      })

      // Add chain summary
      const chainFlow = [chain[0].contract.SellerLedger, ...chain.map(e => e.buyer)].join(' → ')
      buybackData.push({
        'Chain #': '',
        'Contract No': '',
        'Date': '',
        'Seller': '',
        'Buyer': '',
        'Item': '',
        'Qty': '',
        'Rate': '',
        'Chain Flow': `Complete: ${chainFlow}`
      })
      buybackData.push({}) // Empty row
    })

    // Prepare Regular Chains data
    const regularData = []
    chains.regularChains.forEach((chain, index) => {
      const chainItem = chain[0].contract.ItemTypeName || 'Unknown'
      regularData.push({
        'Chain #': `Regular Chain ${index + 1} - ${chainItem}`,
        'Contract No': '',
        'Date': '',
        'Seller': chain[0].contract.SellerLedger,
        'Buyer': '',
        'Item': chainItem,
        'Qty': '',
        'Rate': '',
        'Chain Flow': ''
      })

      chain.forEach((edge, edgeIndex) => {
        const flow = edgeIndex === 0
          ? `${edge.contract.SellerLedger} → ${edge.buyer}`
          : `→ ${edge.buyer}`

        regularData.push({
          'Chain #': '',
          'Contract No': edge.contract.ContractNo,
          'Date': edge.contract.Date ? new Date(edge.contract.Date).toLocaleDateString('en-GB') : '-',
          'Seller': edge.contract.SellerLedger,
          'Buyer': edge.buyer,
          'Item': edge.contract.ItemTypeName || '-',
          'Qty': edge.contract.Qty || 0,
          'Rate': edge.contract.Rate || 0,
          'Chain Flow': flow
        })
      })

      // Add chain summary
      const chainFlow = [chain[0].contract.SellerLedger, ...chain.map(e => e.buyer)].join(' → ')
      regularData.push({
        'Chain #': '',
        'Contract No': '',
        'Date': '',
        'Seller': '',
        'Buyer': '',
        'Item': '',
        'Qty': '',
        'Rate': '',
        'Chain Flow': `Complete: ${chainFlow}`
      })
      regularData.push({}) // Empty row
    })

    // Create worksheets
    if (buybackData.length > 0) {
      const buybackSheet = XLSX.utils.json_to_sheet(buybackData)
      XLSX.utils.book_append_sheet(workbook, buybackSheet, 'Buyback Chains')
    }

    if (regularData.length > 0) {
      const regularSheet = XLSX.utils.json_to_sheet(regularData)
      XLSX.utils.book_append_sheet(workbook, regularSheet, 'Regular Chains')
    }

    // Create summary sheet
    const summaryData = [
      { 'Description': 'Period', 'Value': periodName },
      { 'Description': 'Total Buyback Chains', 'Value': chains.buybackChains.length },
      { 'Description': 'Total Regular Chains', 'Value': chains.regularChains.length },
      { 'Description': 'Total Contracts in Buyback Chains', 'Value': chains.buybackChains.reduce((sum, chain) => sum + chain.length, 0) },
      { 'Description': 'Total Contracts in Regular Chains', 'Value': chains.regularChains.reduce((sum, chain) => sum + chain.length, 0) },
      { 'Description': 'Report Generated', 'Value': new Date().toLocaleString('en-GB') }
    ]
    const summarySheet = XLSX.utils.json_to_sheet(summaryData)
    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')

    // Download the file
    const fileName = `Chain_Analysis_${periodName.replace(/\s+/g, '_')}_${new Date().getTime()}.xlsx`
    XLSX.writeFile(workbook, fileName)

    toast.success(`Excel file downloaded: ${fileName}`)
  }

  const handlePrint = () => {
    // Create a new window with only the table data
    const printWindow = window.open('', '_blank', 'width=1200,height=800')

    if (printWindow) {
      const tableData = filteredTableData

      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Contract Register Report</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              font-size: 14px;
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
              font-size: 26px;
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
              font-size: 13px;
            }
            th {
              background-color: #f2f2f2;
              font-weight: bold;
              text-align: center;
            }
            .text-end { text-align: right; }
            .text-center { text-align: center; }
            .fw-semibold { font-weight: 600; }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Contract Register Report</h1>
            <p>Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Contract No</th>
                <th>Date</th>
                <th>Seller</th>
                <th>Buyer</th>
                <th>Item</th>
                <th>Period</th>
                <th>Qty</th>
                <th>LinkedQty</th>
                <th>Rate</th>
                <th>Lifted Qty</th>
                <th>Adv Payment</th>
                <th>Adv Date</th>
                <th>Vessel</th>
              </tr>
            </thead>
            <tbody>
              ${tableData.map(row => {
        const qty = parseFloat(row.Qty) || 0
        const liftedQty = parseFloat(row.LiftedQuantity) || 0
        let bgColor = 'transparent'

        if (liftedQty === qty && qty > 0) {
          bgColor = '#d1ecf1' // Light blue - fully lifted
        } else if (liftedQty === 0) {
          bgColor = '#e9ecef' // Light grey - not lifted
        } else if (liftedQty > 0 && liftedQty < qty) {
          bgColor = '#f8d7da' // Light red - partially lifted
        }

        // Get Period value
        let periodValue = '-'
        if (row.MonthName) {
          periodValue = row.MonthName
        } else if (row.ShipmentFromDate || row.ShipmentToDate) {
          const fromDate = row.ShipmentFromDate ? new Date(row.ShipmentFromDate).toLocaleDateString('en-GB') : '-'
          const toDate = row.ShipmentToDate ? new Date(row.ShipmentToDate).toLocaleDateString('en-GB') : '-'
          periodValue = `${fromDate} - ${toDate}`
        } else if (row.LiftedFromDate || row.LiftedToDate) {
          const fromDate = row.LiftedFromDate ? new Date(row.LiftedFromDate).toLocaleDateString('en-GB') : '-'
          const toDate = row.LiftedToDate ? new Date(row.LiftedToDate).toLocaleDateString('en-GB') : '-'
          periodValue = `${fromDate} - ${toDate}`
        }

        return `
                <tr style="background-color: ${bgColor}">
                  <td class="fw-semibold">${row.ContractNo || '-'}</td>
                  <td>${row.Date ? new Date(row.Date).toLocaleDateString('en-GB') : '-'}</td>
                  <td>${row.SellerLedger || '-'}</td>
                  <td>${row.BuyerLedger || '-'}</td>
                  <td>${row.ItemTypeName || '-'}</td>
                  <td>${periodValue}</td>
                  <td class="text-end fw-semibold">${row.Qty ? row.Qty.toLocaleString() : '0'}</td>
                  <td class="text-end fw-semibold">${row.LinkedQty ? row.LinkedQty.toLocaleString() : '0'}</td>
                  <td class="text-end fw-semibold">${row.Rate ? row.Rate.toLocaleString() : '0'}</td>
                  <td class="text-end fw-semibold">${row.LiftedQuantity ? row.LiftedQuantity.toLocaleString() : '0'}</td>
                  <td class="text-end fw-semibold">${row.AdvPayment ? row.AdvPayment.toLocaleString() : '0'}</td>
                  <td>${row.AdvDate ? new Date(row.AdvDate).toLocaleDateString('en-GB') : '-'}</td>
                  <td>${row.Vessel || '-'}</td>
                </tr>
              `}).join('')}
            </tbody>
          </table>
        </body>
        </html>
      `

      printWindow.document.write(printContent)
      printWindow.document.close()

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print()
        printWindow.close()
      }
    }
  }

  return (
    <>
      <style>
        {`
          .link-create-register-card-body {
            padding-top: 0 !important;
          }
          @media (min-width: 768px) {
            .lcr-wrapper {
              padding-top: 46px !important;
            }
          }
        `}
      </style>
      <div className="lcr-wrapper" style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 70px)',
        padding: 0,
        margin: 0,
        overflow: 'hidden',
        gap: 0
      }}>

        {/* Filter Form */}
        <Card className="shadow-sm border-0" style={{ flexShrink: 0, marginBottom: '0.25rem' }}>
          <Card.Header className="bg-primary text-white py-1">
            <h6 className="mb-0 d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <Filter className="me-2" size={16} />
                <span className="d-none d-md-inline">Link Register</span>
                <span className="d-inline d-md-none">Cont. Reg.</span>
              </div>
              {/* Mobile only - checkboxes in header */}
              <div className="d-block d-md-none">
                <div style={{
                  border: '1px solid #ffffff',
                  borderRadius: '4px',
                  padding: '0.25rem 0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  width: 'fit-content',
                  whiteSpace: 'nowrap'
                }}>
                  <div className="d-flex gap-2">
                    <Form.Check
                      type="checkbox"
                      checked={notLifted}
                      onChange={e => setNotLifted(e.target.checked)}
                      className="form-check-input-sm"
                      label={<span style={{ color: '#ffffff', fontSize: '0.7rem', fontWeight: '500' }}>Black</span>}
                    />
                    <Form.Check
                      type="checkbox"
                      checked={partialLift}
                      onChange={e => setPartialLift(e.target.checked)}
                      className="form-check-input-sm"
                      label={<span style={{ color: '#ffcccc', fontSize: '0.7rem', fontWeight: '500' }}>Red</span>}
                    />
                    <Form.Check
                      type="checkbox"
                      checked={fullLift}
                      onChange={e => setFullLift(e.target.checked)}
                      className="form-check-input-sm"
                      label={<span style={{ color: '#b3d9ff', fontSize: '0.7rem', fontWeight: '500' }}>Blue</span>}
                    />
                  </div>
                </div>
              </div>
            </h6>
          </Card.Header>
          <Card.Body className="px-3 link-create-register-card-body" style={{ overflow: 'visible', paddingTop: '0.25rem', paddingBottom: '0.25rem' }}>
            <Form>
              <div style={{ overflowX: "auto", overflowY: "hidden" }}>
                <Row className="align-items-center gx-0" style={{ flexWrap: "nowrap", minWidth: "fit-content", gap: '0.1rem' }}>
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
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        width: '90px',
                        maxWidth: '90px'
                      }}
                    >
                      <span>
                        {selectedItems && selectedItems.length > 0 && !(selectedItems.length === 1 && selectedItems[0] === "")
                          ? `${selectedItems.filter(item => item !== "").length} selected`
                          : "Commodity"}
                      </span>
                      <i className="fas fa-chevron-down ms-2"></i>
                    </div>
                  </Col>

                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <div
                      onClick={openPeriodModal}
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
                        width: '90px',
                        maxWidth: '90px'
                      }}
                    >
                      <span className="text-truncate">{periodDisplayText}</span>
                      <i className="fas fa-chevron-down ms-2"></i>
                    </div>
                  </Col>
                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <Button
                      variant="outline-info"
                      size="sm"
                      onClick={() => window.open('/LinkRegisterShow', '_blank')}
                      className="d-flex align-items-center"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                    >
                      <Search className="me-1" size={14} />
                      Show
                    </Button>
                  </Col>
                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleButtonClick}
                      className="d-flex align-items-center"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                      disabled={selectedRows.length === 0}
                    >
                      Process
                    </Button>
                  </Col>
                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <div style={{ width: '102px', height: '28px' }}>
                      <DatePicker
                        selected={fromDate}
                        onChange={date => setFromDate(date)}
                        className="form-control form-control-sm custom-datepicker"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="From Date"
                        portalId="root-portal"
                        popperPlacement="bottom-start"
                        style={{
                          fontSize: '0.7rem',
                          height: '28px',
                          padding: '0 8px',
                          lineHeight: '28px'
                        }}
                        openToDate={new Date()}
                      />
                    </div>
                  </Col>
                  <Col xs="auto" style={{ flex: "0 0 auto", display: 'flex', alignItems: 'center', padding: '0 4px' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>To</span>
                  </Col>
                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <div style={{ width: '102px', height: '28px' }}>
                      <DatePicker
                        selected={toDate}
                        onChange={date => setToDate(date)}
                        className="form-control form-control-sm custom-datepicker"
                        dateFormat="dd/MM/yyyy"
                        placeholderText="To Date"
                        portalId="root-portal"
                        popperPlacement="bottom-start"
                        style={{
                          fontSize: '0.7rem',
                          height: '28px',
                          padding: '0 8px',
                          lineHeight: '28px'
                        }}
                        openToDate={new Date()}
                      />
                    </div>
                  </Col>
                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <Form.Select
                      value={ledgerId}
                      onChange={e => setLedgerId(e.target.value)}
                      className="form-select-sm"
                      style={{
                        fontSize: '0.7rem',
                        minWidth: '120px',
                        maxWidth: '120px',
                        height: '28px',
                        backgroundColor: '#E3F2FD',
                        borderColor: '#2196F3',
                        borderWidth: '1px',
                        borderStyle: 'solid'
                      }}
                    >
                      <option value={0}>Search Party</option>
                      {state.LedgerArray.map(ledger => (
                        <option key={ledger.Id} value={ledger.Id}>
                          {ledger.Name}
                        </option>
                      ))}
                    </Form.Select>
                  </Col>

                  {/* Desktop only - checkboxes in form row */}
                  <Col xs="auto" className="d-none d-md-block" style={{ flex: "0 0 auto" }}>
                    <div style={{
                      border: '1px solid #000000',
                      borderRadius: '4px',
                      padding: '0.25rem 0.5rem',
                      backgroundColor: '#f8f9fa',
                      width: 'fit-content',
                      whiteSpace: 'nowrap'
                    }}>
                      <div className="d-flex gap-2">
                        <Form.Check
                          type="checkbox"
                          checked={notLifted}
                          onChange={e => setNotLifted(e.target.checked)}
                          className="form-check-input-sm"
                          label={<span style={{ color: '#000000', fontSize: '0.7rem', fontWeight: '500' }}>Black</span>}
                        />
                        <Form.Check
                          type="checkbox"
                          checked={partialLift}
                          onChange={e => setPartialLift(e.target.checked)}
                          className="form-check-input-sm"
                          label={<span style={{ color: '#dc3545', fontSize: '0.7rem', fontWeight: '500' }}>Red</span>}
                        />
                        <Form.Check
                          type="checkbox"
                          checked={fullLift}
                          onChange={e => setFullLift(e.target.checked)}
                          className="form-check-input-sm"
                          label={<span style={{ color: '#0d6efd', fontSize: '0.7rem', fontWeight: '500' }}>Blue</span>}
                        />
                      </div>
                    </div>
                  </Col>

                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleClear}
                      className="d-flex align-items-center"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                    >
                      <X className="me-1" size={14} />
                      Clear
                    </Button>
                  </Col>

                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <Button
                      variant="outline-primary"
                      size="sm"
                      onClick={handleMultiPrint}
                      className="d-flex align-items-center"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                      disabled={selectedRows.length === 0}
                    >
                      <Printer className="me-1" size={14} />
                      Print {selectedRows.length > 0 ? `(${selectedRows.length})` : ''}
                    </Button>
                  </Col>
                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <Button
                      variant="outline-success"
                      size="sm"
                      onClick={handleExcelExport}
                      className="d-flex align-items-center"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                      disabled={selectedRows.length === 0}
                      title="Export selected rows to Excel with colorful rows and totals"
                    >
                      <Download className="me-1" size={14} />
                      Excel
                    </Button>
                  </Col>

                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={handleExit}
                      className="d-flex align-items-center"
                      style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                    >
                      <LogOut className="me-1" size={14} />
                      Exit
                    </Button>
                  </Col>

                  <Col xs="auto" style={{ flex: "0 0 auto" }}>
                    <div style={{
                      border: '2px solid #0d6efd',
                      borderRadius: '4px',
                      padding: '0.3rem 0.6rem',
                      backgroundColor: '#e7f1ff',
                      display: 'flex',
                      gap: '0.5rem',
                      whiteSpace: 'nowrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                        <span style={{ color: '#6c757d', fontWeight: '600' }}>Contracts:</span>
                        <span style={{ color: '#0d6efd', fontWeight: 'bold' }}>{selectedRows.length.toLocaleString()}</span>
                        <span style={{ color: '#0d6efd' }}>|</span>
                        <span style={{ color: '#6c757d', fontWeight: '600' }}>Qty:</span>
                        <span style={{ color: '#0d6efd', fontWeight: 'bold' }}>
                          {filteredTableData
                            .filter(row => selectedRows.includes(row.Id))
                            .reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0)
                            .toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </Col>
                </Row>
              </div>
            </Form>
          </Card.Body>
        </Card>


        {/* Table Data Section - Full Height Layout */}
        {(showTable || (filteredTableData && filteredTableData.length > 0)) && (
          <div
            className="row"
            style={{
              flex: "1 1 auto",
              marginBottom: "0",
              marginTop: "0",
              minHeight: "0",
              overflow: "hidden",
            }}
          >
            <div
              className="col-12"
              style={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                padding: "0",
              }}
            >
              <div
                className="card"
                style={{ height: "100%", marginBottom: "0", border: "none" }}
              >
                <div
                  className="card-body"
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    padding: "0",
                    overflow: "hidden",
                    margin: "0",
                  }}
                >
                  {filteredTableData.length > 0 ? (
                    <>
                      <div
                        className="table-responsive position-relative"
                        style={{
                          flex: "1 1 auto",
                          overflowY: "auto",
                          border: "1px solid #dee2e6",
                          borderRadius: "0",
                          minHeight: "0",
                          height: "100%",
                        }}
                      >
                        <Table
                          className="table mb-0 table-hover resizable-table"
                          style={{
                            fontSize: "0.7rem",
                            borderSpacing: "0",
                            borderCollapse: "collapse",
                            border: "1.5px solid black !important",
                            tableLayout: "fixed",
                          }}
                        >
                          <thead
                            style={{
                              position: "sticky",
                              top: 0,
                              zIndex: 10,
                              border: "1.5px solid black !important",
                            }}
                          >
                            <tr
                              style={{ border: "1.5px solid black !important" }}
                            >
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "6px 12px",
                                  width: `${columnWidths.Checkbox}px`,
                                  cursor: "pointer",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                <div className="d-flex justify-content-center align-items-center">
                                  <Form.Check
                                    type="checkbox"
                                    checked={selectAll}
                                    onChange={handleSelectAll}
                                    title="Select All"
                                    style={{ margin: 0 }}
                                  />
                                </div>
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Checkbox')} onTouchStart={e => handleResizeMouseDown(e, 'Checkbox')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  cursor: "pointer",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.ContractNo}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                                onClick={() => handleSort("ContractNo")}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>Contract No</span>
                                  <div className="d-flex flex-column">
                                    <i
                                      className={`fas fa-sort-up ${sortConfig.key === "ContractNo" &&
                                        sortConfig.direction === "asc"
                                        ? "text-warning"
                                        : "text-light"
                                        }`}
                                      style={{
                                        fontSize: "0.5rem",
                                        lineHeight: "0.5rem",
                                      }}
                                    ></i>
                                    <i
                                      className={`fas fa-sort-down ${sortConfig.key === "ContractNo" &&
                                        sortConfig.direction === "desc"
                                        ? "text-warning"
                                        : "text-light"
                                        }`}
                                      style={{
                                        fontSize: "0.5rem",
                                        lineHeight: "0.5rem",
                                      }}
                                    ></i>
                                  </div>
                                </div>
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'ContractNo')} onTouchStart={e => handleResizeMouseDown(e, 'ContractNo')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  cursor: "pointer",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.Date}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                                onClick={() => handleSort("Date")}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>Date</span>
                                  <div className="d-flex flex-column">
                                    <i
                                      className={`fas fa-sort-up ${sortConfig.key === "Date" &&
                                        sortConfig.direction === "asc"
                                        ? "text-warning"
                                        : "text-light"
                                        }`}
                                      style={{
                                        fontSize: "0.5rem",
                                        lineHeight: "0.5rem",
                                      }}
                                    ></i>
                                    <i
                                      className={`fas fa-sort-down ${sortConfig.key === "Date" &&
                                        sortConfig.direction === "desc"
                                        ? "text-warning"
                                        : "text-light"
                                        }`}
                                      style={{
                                        fontSize: "0.5rem",
                                        lineHeight: "0.5rem",
                                      }}
                                    ></i>
                                  </div>
                                </div>
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Date')} onTouchStart={e => handleResizeMouseDown(e, 'Date')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  cursor: "pointer",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.Seller}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                                onClick={() => handleSort("SellerLedger")}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>Seller</span>
                                  <div className="d-flex flex-column">
                                    <i
                                      className={`fas fa-sort-up ${sortConfig.key === "SellerLedger" &&
                                        sortConfig.direction === "asc"
                                        ? "text-warning"
                                        : "text-light"
                                        }`}
                                      style={{
                                        fontSize: "0.5rem",
                                        lineHeight: "0.5rem",
                                      }}
                                    ></i>
                                    <i
                                      className={`fas fa-sort-down ${sortConfig.key === "SellerLedger" &&
                                        sortConfig.direction === "desc"
                                        ? "text-warning"
                                        : "text-light"
                                        }`}
                                      style={{
                                        fontSize: "0.5rem",
                                        lineHeight: "0.5rem",
                                      }}
                                    ></i>
                                  </div>
                                </div>
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Seller')} onTouchStart={e => handleResizeMouseDown(e, 'Seller')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  cursor: "pointer",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.Buyer}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                                onClick={() => handleSort("BuyerLedger")}
                              >
                                <div className="d-flex justify-content-between align-items-center">
                                  <span>Buyer</span>
                                  <div className="d-flex flex-column">
                                    <i
                                      className={`fas fa-sort-up ${sortConfig.key === "BuyerLedger" &&
                                        sortConfig.direction === "asc"
                                        ? "text-warning"
                                        : "text-light"
                                        }`}
                                      style={{
                                        fontSize: "0.5rem",
                                        lineHeight: "0.5rem",
                                      }}
                                    ></i>
                                    <i
                                      className={`fas fa-sort-down ${sortConfig.key === "BuyerLedger" &&
                                        sortConfig.direction === "desc"
                                        ? "text-warning"
                                        : "text-light"
                                        }`}
                                      style={{
                                        fontSize: "0.5rem",
                                        lineHeight: "0.5rem",
                                      }}
                                    ></i>
                                  </div>
                                </div>
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Buyer')} onTouchStart={e => handleResizeMouseDown(e, 'Buyer')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.Item}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                Item
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Item')} onTouchStart={e => handleResizeMouseDown(e, 'Item')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.Period}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                Period
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Period')} onTouchStart={e => handleResizeMouseDown(e, 'Period')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.Qty}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                Qty
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Qty')} onTouchStart={e => handleResizeMouseDown(e, 'Qty')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.LinkedQty}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                LinkedQty
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'LinkedQty')} onTouchStart={e => handleResizeMouseDown(e, 'LinkedQty')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.Rate}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                Rate
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Rate')} onTouchStart={e => handleResizeMouseDown(e, 'Rate')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.LiftedQty}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                Lifted Qty
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'LiftedQty')} onTouchStart={e => handleResizeMouseDown(e, 'LiftedQty')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.AdvPayment}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                Adv Payment
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'AdvPayment')} onTouchStart={e => handleResizeMouseDown(e, 'AdvPayment')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.AdvDate}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                Adv Date
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'AdvDate')} onTouchStart={e => handleResizeMouseDown(e, 'AdvDate')} />
                              </th>
                              <th
                                className="text-center align-middle"
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: "0",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  width: `${columnWidths.Vessel}px`,
                                  position: "relative",
                                  overflow: "hidden",
                                }}
                              >
                                Vessel
                                <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Vessel')} onTouchStart={e => handleResizeMouseDown(e, 'Vessel')} />
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {filteredTableData.map((row, i) => {
                              const bgColor = getRowBackgroundColor(row);
                              return (
                                <tr key={i} style={{ border: "1.5px solid black !important" }}>
                                  <td
                                    className="text-center align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    <Form.Check
                                      type="checkbox"
                                      checked={selectedRows.includes(row.Id)}
                                      onChange={(e) => handleRowSelect(row.Id, e)}
                                      onClick={e => e.stopPropagation()}
                                      style={{ margin: 0 }}
                                    />
                                  </td>
                                  <td
                                    className="fw-semibold align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.ContractNo || "-"}
                                  </td>
                                  <td
                                    className="text-center align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.Date ? new Date(row.Date).toLocaleDateString('en-GB') : '-'}
                                  </td>
                                  <td
                                    className="align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.SellerLedger || '-'}
                                  </td>
                                  <td
                                    className="align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.BuyerLedger || '-'}
                                  </td>
                                  <td
                                    className="align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.ItemTypeName || '-'}
                                  </td>
                                  <td
                                    className="align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {getPeriodValue(row)}
                                  </td>
                                  <td
                                    className="text-end fw-semibold align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.Qty ? row.Qty.toLocaleString() : '0'}
                                  </td>
                                  <td
                                    className="text-end fw-semibold align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.LinkedQty ? row.LinkedQty.toLocaleString() : '0'}
                                  </td>
                                  <td
                                    className="text-end fw-semibold align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.Rate ? row.Rate.toLocaleString() : '0'}
                                  </td>
                                  <td
                                    className="text-end fw-semibold align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.LiftedQuantity ? row.LiftedQuantity.toLocaleString() : '0'}
                                  </td>
                                  <td
                                    className="text-end fw-semibold align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.AdvPayment ? row.AdvPayment.toLocaleString() : '0'}
                                  </td>
                                  <td
                                    className="text-center align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.AdvDate ? new Date(row.AdvDate).toLocaleDateString('en-GB') : '-'}
                                  </td>
                                  <td
                                    className="align-middle"
                                    style={{
                                      backgroundColor: bgColor,
                                      padding: "2px 4px",
                                      border: "1.5px solid black !important",
                                      fontSize: "0.7rem",
                                    }}
                                  >
                                    {row.Vessel || '-'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </Table>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-3">
                      <div className="text-muted">
                        <Search size={36} className="mb-2" />
                        <h6>No Data Found</h6>
                        <p className="small mb-0">
                          No records match the selected criteria. Please try adjusting your filters.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Period Filter Modal */}
        <Modal
          show={showPeriodModal}
          onHide={closePeriodModal}
          size="lg"
          centered
          style={{ zIndex: 10000 }}
        >
          <ModalHeader className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center w-100">
              <h5 className="mb-0">
                <i className="fas fa-calendar-alt me-2"></i>
                Select Period
              </h5>
              <Button
                variant="light"
                onClick={closePeriodModal}
                className="btn-close btn-close-white"
                style={{ border: "none", background: "transparent" }}
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
          </ModalHeader>
          <ModalBody style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
            <Form>
              <div className="mb-3">
                <Form.Label className="fw-semibold mb-0">
                  Period
                </Form.Label>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>
                {state.MonthArray.map((period) => (
                  <div
                    key={period.Id}
                    style={{
                      padding: "8px",
                      cursor: "pointer",
                      borderRadius: "4px",
                      backgroundColor: tempSelectedPeriods.includes(period.Id) ? "#e7f3ff" : "transparent",
                      marginBottom: "4px",
                    }}
                    onClick={() => {
                      const isSelected = tempSelectedPeriods.includes(period.Id)
                      if (isSelected) {
                        setTempSelectedPeriods(tempSelectedPeriods.filter(p => p !== period.Id))
                      } else {
                        setTempSelectedPeriods([...tempSelectedPeriods, period.Id])
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!tempSelectedPeriods.includes(period.Id)) {
                        e.currentTarget.style.backgroundColor = "#f8f9fa"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!tempSelectedPeriods.includes(period.Id)) {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <input
                        type="checkbox"
                        checked={tempSelectedPeriods.includes(period.Id)}
                        onChange={() => { }}
                        style={{ marginRight: "10px", cursor: "pointer" }}
                      />
                      <span>{period.Name}</span>
                    </div>
                  </div>
                ))}
                {state.MonthArray.length === 0 && (
                  <div className="text-center text-muted py-3">
                    No periods available
                  </div>
                )}
              </div>
            </Form>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setTempSelectedPeriods([])}>
              Clear All
            </Button>
            <Button variant="outline-primary" size="sm" onClick={() => {
              const allPeriods = state.MonthArray.map(p => p.Id)
              setTempSelectedPeriods(allPeriods)
            }}>
              Select All
            </Button>
            <Button variant="primary" onClick={handlePeriodModalDone}>
              <i className="fas fa-check me-2"></i>
              Done
            </Button>
          </ModalFooter>
        </Modal>

        {/* Commodity Filter Modal */}
        <Modal
          show={showItemModal}
          onHide={closeItemModal}
          size="lg"
          centered
          style={{ zIndex: 10000 }}
        >
          <ModalHeader className="bg-primary text-white">
            <div className="d-flex justify-content-between align-items-center w-100">
              <h5 className="mb-0">
                <i className="fas fa-box me-2"></i>
                Select Commodity
              </h5>
              <Button
                variant="light"
                onClick={closeItemModal}
                className="btn-close btn-close-white"
                style={{ border: "none", background: "transparent" }}
              >
                <i className="fas fa-times"></i>
              </Button>
            </div>
          </ModalHeader>
          <ModalBody style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
            <Form>
              <div className="mb-3">
                <Form.Label className="fw-semibold mb-0">
                  Commodity
                </Form.Label>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>
                {itemOptions.map((item) => (
                  <div
                    key={item.value}
                    style={{
                      padding: "8px",
                      cursor: "pointer",
                      borderRadius: "4px",
                      backgroundColor: tempSelectedItems.some(i => String(i) === String(item.value)) ? "#e7f3ff" : "transparent",
                      marginBottom: "4px",
                    }}
                    onClick={() => {
                      const isSelected = tempSelectedItems.some(i => String(i) === String(item.value))
                      let newSelected = [...tempSelectedItems]

                      if (isSelected) {
                        newSelected = newSelected.filter(i => String(i) !== String(item.value))
                      } else {
                        newSelected.push(item.value)
                      }

                      // Normalize items
                      let normalized = newSelected.map(i => (i === "" ? "" : String(i)))
                      if (normalized.includes("") && normalized.length > 1) {
                        normalized = normalized.filter(i => i !== "")
                      }

                      setTempSelectedItems(normalized)
                    }}
                    onMouseEnter={(e) => {
                      if (!tempSelectedItems.some(i => String(i) === String(item.value))) {
                        e.currentTarget.style.backgroundColor = "#f8f9fa"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!tempSelectedItems.some(i => String(i) === String(item.value))) {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <input
                        type="checkbox"
                        checked={tempSelectedItems.some(i => String(i) === String(item.value))}
                        onChange={() => { }}
                        style={{ marginRight: "10px", cursor: "pointer" }}
                      />
                      <span>{item.label}</span>
                    </div>
                  </div>
                ))}
                {itemOptions.length === 0 && (
                  <div className="text-center text-muted py-3">
                    No items available
                  </div>
                )}
              </div>
            </Form>
          </ModalBody>
          <ModalFooter className="d-flex justify-content-end gap-2">
            <Button variant="outline-secondary" size="sm" onClick={() => setTempSelectedItems([])}>
              Clear All
            </Button>
            <Button variant="outline-primary" size="sm" onClick={() => {
              const allItems = itemOptions.map(i => i.value)
              let normalized = allItems.map(item => (item === "" ? "" : String(item)))
              if (normalized.includes("") && normalized.length > 1) {
                normalized = normalized.filter(item => item !== "")
              }
              setTempSelectedItems(normalized)
            }}>
              Select All
            </Button>
            <Button variant="primary" onClick={handleItemModalDone}>
              <i className="fas fa-check me-2"></i>
              Done
            </Button>
          </ModalFooter>
        </Modal>

        {/* Loading State - Overlay */}
        {loading && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
          }}>
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted small mb-0" style={{ fontSize: '1rem', fontWeight: 500 }}>Generating report, please wait...</p>
          </div>
        )}
      </div >
    </>
  )
}

export default LinkCreateRegister
