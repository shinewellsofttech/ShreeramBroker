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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
} from "react-bootstrap"
import { API_WEB_URLS } from "constants/constAPI"
import { Fn_GetReport, Fn_DisplayData, Fn_FillListData } from "store/Functions"
import { useDispatch, useSelector } from "react-redux"
import { toast } from "react-toastify"
import { Search, Printer, X, LogOut, Calendar, Filter, Download, FileText } from "react-feather"
import EditContract from "../Transaction/EditContract"
import "./ContractRegister.scss"
import * as XLSX from 'xlsx'
import ExcelJS from 'exceljs'
import jsPDF from 'jspdf'
import { applyPlugin as applyAutoTable } from 'jspdf-autotable'
applyAutoTable(jsPDF)

function ContractRegister() {
  const dispatch = useDispatch()

  // Get global dates from Redux store
  const globalDates = useSelector(state => state.GlobalDates)

  // State and ref for scroll to top button
  const [showScrollTop, setShowScrollTop] = useState(false)
  const tableContainerRef = useRef(null)

  const [selectedItems, setSelectedItems] = useState([])
  const [itemOptions, setItemOptions] = useState([{ value: "", label: "All" }])
  const [shouldRefreshItemOptions, setShouldRefreshItemOptions] = useState(true)
  const [fromDate, setFromDate] = useState(new Date(globalDates.fromDate))
  const [toDate, setToDate] = useState(new Date(globalDates.toDate))
  const [selectedLedgerIds, setSelectedLedgerIds] = useState([])
  const [notLifted, setNotLifted] = useState(true)
  const [partialLift, setPartialLift] = useState(true)
  const [fullLift, setFullLift] = useState(false)
  const [selectedPeriods, setSelectedPeriods] = useState([])

  // Modal state for Commodity, Period, and Ledger
  const [showItemModal, setShowItemModal] = useState(false)
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [tempSelectedItems, setTempSelectedItems] = useState([])
  const [tempSelectedPeriods, setTempSelectedPeriods] = useState([])
  const [tempSelectedLedgerIds, setTempSelectedLedgerIds] = useState([])

  const [showTable, setShowTable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)

  const [error, setError] = useState("")

  // Checkbox selection state for multi-print
  const [selectedRows, setSelectedRows] = useState([])
  const [selectAll, setSelectAll] = useState(false)

  // Sorting state
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  })

  // Modal state for EditContract
  const [showEditContractModal, setShowEditContractModal] = useState(false)
  const [selectedContractData, setSelectedContractData] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  // PDF Remarks Modal state
  const [showRemarksModal, setShowRemarksModal] = useState(false)
  const [remarks, setRemarks] = useState('')
  // PDF ready – show "Share" button so share runs on user gesture
  const [pendingShareFile, setPendingShareFile] = useState(null)
  const [showSharePDFModal, setShowSharePDFModal] = useState(false)

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

  // Scroll event handler for table container
  const handleTableScroll = () => {
    const tableContainer = tableContainerRef.current
    if (tableContainer) {
      const scrollPosition = tableContainer.scrollTop
      if (scrollPosition > 200) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
  }

  // Scroll to top function for table container
  const scrollToTop = () => {
    const tableContainer = tableContainerRef.current
    if (tableContainer) {
      try {
        tableContainer.scrollTo({
          top: 0,
          behavior: "smooth"
        })
      } catch (error) {
        tableContainer.scrollTop = 0
      }
    }
  }

  // Scroll to top button visibility handler for table container
  useEffect(() => {
    const timer = setTimeout(() => {
      const tableContainer = tableContainerRef.current
      if (tableContainer) {
        handleTableScroll()
        tableContainer.addEventListener("scroll", handleTableScroll)
      }
    }, 100)

    return () => {
      clearTimeout(timer)
      const tableContainer = tableContainerRef.current
      if (tableContainer) {
        tableContainer.removeEventListener("scroll", handleTableScroll)
      }
    }
  }, [])

  useEffect(() => {
    if (!state.FillArray) return

    if (shouldRefreshItemOptions) {
      setItemOptions(buildItemOptions(state.FillArray))
    }
  }, [state.FillArray, shouldRefreshItemOptions])

  const API_URL_Get = `${API_WEB_URLS.ContractEditDataApp}/0/token`
  const API_URL_PeriodData = `${API_WEB_URLS.PeriodData}/0/token`
  const API_URL = API_WEB_URLS.MASTER + "/0/token/PartyAccount"
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

      // Convert selected ledger IDs to comma-separated string
      const ledgerIdsCsv = selectedLedgerIds.length > 0
        ? selectedLedgerIds.map(id => id.toString().trim()).filter(id => id !== "" && id !== "0").join(",")
        : ""
      vformData.append("LedgerIds", ledgerIdsCsv)

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

  }, [fromDate, toDate, selectedLedgerIds, selectedPeriods, notLifted, partialLift, fullLift])

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

  // Auto-select all rows when data is loaded
  useEffect(() => {
    if (filteredTableData && filteredTableData.length > 0) {
      const allRowIds = filteredTableData.map(row => row.Id)
      setSelectedRows(allRowIds)
      setSelectAll(true)
    }
  }, [filteredTableData])

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
    setSelectAll(checked)
    if (checked) {
      // Select all rows
      setSelectedRows(filteredTableData.map(row => row.Id))
    } else {
      setSelectedRows([])
    }
  }

  // Handle individual row selection
  const handleRowSelect = (rowId) => {
    setSelectedRows(prev => {
      if (prev.includes(rowId)) {
        const newSelection = prev.filter(id => id !== rowId)
        setSelectAll(false)
        return newSelection
      } else {
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
    setShowPeriodModal(false)
  }

  // Modal functions for Ledger
  const openLedgerModal = () => {
    setTempSelectedLedgerIds(selectedLedgerIds)
    setShowLedgerModal(true)
  }

  const closeLedgerModal = () => {
    setShowLedgerModal(false)
  }

  const handleLedgerModalDone = () => {
    setSelectedLedgerIds(tempSelectedLedgerIds)
    setShowLedgerModal(false)
  }

  const handleClear = () => {
    setSelectedItems([])
    setFromDate(new Date("2024-04-01"))
    setToDate(new Date("2026-03-31"))
    setSelectedLedgerIds([])
    setNotLifted(false)
    setPartialLift(false)
    setFullLift(false)
    setSelectedPeriods([])
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

  // Modal functions for EditContract
  const openEditContractModal = contractData => {
    setSelectedContractData(contractData)
    setShowEditContractModal(true)
    setModalLoading(true)

    // Set loading to false after a short delay
    setTimeout(() => {
      setModalLoading(false)
    }, 1000)
  }

  const closeEditContractModal = () => {
    setShowEditContractModal(false)
    setSelectedContractData(null)
    setModalLoading(false)
    // Refresh the data after closing modal
    fetchData()
  }

  // Handle period selection
  const handlePeriodToggle = (periodId) => {
    setSelectedPeriods(prev => {
      if (prev.includes(periodId)) {
        return prev.filter(id => id !== periodId)
      } else {
        return [...prev, periodId]
      }
    })
  }

  const handleSelectAllPeriods = () => {
    if (selectedPeriods.length === state.MonthArray.length) {
      setSelectedPeriods([])
    } else {
      setSelectedPeriods(state.MonthArray.map(p => p.Id))
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

  const handleLink = () => {
    // Validate period selection
    if (selectedPeriods.length === 0) {
      toast.warning("Please select exactly one period")
      return
    }
    if (selectedPeriods.length > 1) {
      toast.warning("Please select only one period. Currently " + selectedPeriods.length + " periods are selected.")
      return
    }

    // Validate checkbox selection - Only Black (Not Lifted) should be selected
    if (!notLifted) {
      toast.warning("Please select Black checkbox (Not Lifted) for chain analysis")
      return
    }
    if (partialLift || fullLift) {
      toast.warning("Only Black checkbox should be selected. Please uncheck Red and Blue checkboxes")
      return
    }

    // Start buyback chain analysis
    handleBuybackChainAnalysis()
  }

  const handleBuybackChainAnalysis = () => {
    try {
      // Filter contracts by selected period
      const periodId = selectedPeriods[0]
      const period = state.MonthArray.find(p => p.Id === periodId)
      const periodName = period ? period.Name : 'Unknown'

      // Filter data by the selected period
      const periodContracts = filteredTableData.filter(contract => {
        return contract.MonthName === periodName
      })

      if (periodContracts.length === 0) {
        toast.warning(`No contracts found for period: ${periodName}`)
        return
      }

      toast.info(`Analyzing ${periodContracts.length} contracts for period: ${periodName}`)

      // Build chains
      const chains = buildChains(periodContracts)

      // Export to Excel
      exportChainsToExcel(chains, periodName)

      toast.success(`Found ${chains.buybackChains.length} buyback chains and ${chains.regularChains.length} regular chains`)
    } catch (error) {
      console.error("Chain analysis error:", error)
      toast.error("Error analyzing chains. Please try again.")
    }
  }

  const buildChains = (contracts) => {
    const usedContracts = new Set()
    const buybackChains = []
    const regularChains = []

    // Create a map of seller -> buyers with contract details
    const sellerToBuyers = {}
    contracts.forEach(contract => {
      const seller = contract.SellerLedger
      const buyer = contract.BuyerLedger

      if (!sellerToBuyers[seller]) {
        sellerToBuyers[seller] = []
      }
      sellerToBuyers[seller].push({
        buyer: buyer,
        contract: contract
      })
    })

    // Function to detect buyback chains (cycles)
    const findBuybackChain = (startParty, currentParty, path, visited, itemType) => {
      if (visited.has(currentParty)) {
        // Found a cycle
        if (currentParty === startParty && path.length > 1) {
          return { found: true, chain: [...path] }
        }
        return { found: false }
      }

      if (!sellerToBuyers[currentParty]) {
        return { found: false }
      }

      visited.add(currentParty)

      for (let edge of sellerToBuyers[currentParty]) {
        if (usedContracts.has(edge.contract.Id)) continue

        // Check if item type matches (same commodity in the chain)
        if (itemType && edge.contract.ItemTypeName !== itemType) continue

        const newPath = [...path, edge]
        const newItemType = itemType || edge.contract.ItemTypeName
        const result = findBuybackChain(startParty, edge.buyer, newPath, new Set(visited), newItemType)

        if (result.found) {
          return result
        }
      }

      return { found: false }
    }

    // First, find all buyback chains (cycles)
    const allParties = new Set()
    contracts.forEach(c => {
      allParties.add(c.SellerLedger)
      allParties.add(c.BuyerLedger)
    })

    for (let party of allParties) {
      const result = findBuybackChain(party, party, [], new Set(), null)

      if (result.found && result.chain.length > 0) {
        // Mark contracts as used
        const chainContractIds = result.chain.map(edge => edge.contract.Id)
        const allUsed = chainContractIds.every(id => usedContracts.has(id))

        if (!allUsed) {
          result.chain.forEach(edge => usedContracts.add(edge.contract.Id))
          buybackChains.push(result.chain)
        }
      }
    }

    // Function to build linear chains
    const buildLinearChain = (startContract) => {
      const chain = []
      let currentContract = startContract
      const chainItemType = startContract.ItemTypeName

      // Go backward to find the start of the chain
      const visited = new Set()
      while (true) {
        if (visited.has(currentContract.Id)) break
        visited.add(currentContract.Id)

        // Find who sold to the current seller (with same item type)
        const previousSeller = contracts.find(c =>
          !usedContracts.has(c.Id) &&
          c.BuyerLedger === currentContract.SellerLedger &&
          c.ItemTypeName === chainItemType &&
          !visited.has(c.Id)
        )

        if (!previousSeller) break
        currentContract = previousSeller
      }

      // Now build forward from the start
      const chainVisited = new Set()
      while (currentContract) {
        if (chainVisited.has(currentContract.Id)) break
        chainVisited.add(currentContract.Id)

        chain.push({
          buyer: currentContract.BuyerLedger,
          contract: currentContract
        })
        usedContracts.add(currentContract.Id)

        // Find next contract where buyer becomes seller (with same item type)
        const nextContract = contracts.find(c =>
          !usedContracts.has(c.Id) &&
          c.SellerLedger === currentContract.BuyerLedger &&
          c.ItemTypeName === chainItemType &&
          !chainVisited.has(c.Id)
        )

        currentContract = nextContract
      }

      return chain
    }

    // Build linear chains for remaining contracts
    contracts.forEach(contract => {
      if (!usedContracts.has(contract.Id)) {
        const chain = buildLinearChain(contract)
        if (chain.length > 0) {
          regularChains.push(chain)
        }
      }
    })

    return { buybackChains, regularChains }
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

      // Share or download
      const file = new File([blob], fileName, { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })

      if (navigator.share) {
        try {
          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              title: 'Contract Register Report',
              text: 'Please find attached the Contract Register Report',
              files: [file]
            })
            toast.success('Excel file shared successfully!')
            return
          }
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.error('Share error:', shareError)
          }
        }
      }

      // Fallback: download
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

  // Called from Share button click – runs in user gesture so navigator.share() is allowed
  const handleSharePDFClick = async () => {
    if (!pendingShareFile || !navigator.share) return
    try {
      await navigator.share({
        title: 'Contract Register Report',
        text: 'Please find attached the Contract Register Report',
        files: [pendingShareFile]
      })
      toast.success('PDF shared successfully!')
      setShowSharePDFModal(false)
      setPendingShareFile(null)
    } catch (shareError) {
      if (shareError.name === 'AbortError') {
        toast.info('Share cancelled.')
      } else {
        console.error('Share error:', shareError)
        toast.error('Share failed. Try again.')
      }
      setShowSharePDFModal(false)
      setPendingShareFile(null)
    }
  }

  // PDF Export - Open Remarks Modal
  const handlePDFExport = () => {
    if (!filteredTableData || filteredTableData.length === 0) {
      toast.warning("No data to export")
      return
    }

    if (selectedRows.length === 0) {
      toast.warning("Please select at least one row to export")
      return
    }

    // Open remarks modal
    setRemarks('')
    setShowRemarksModal(true)
  }

  // Generate PDF with jsPDF + jspdf-autotable (no blank pages), then share
  const handleGeneratePDF = async () => {
    if (!filteredTableData || filteredTableData.length === 0) {
      toast.warning("No data to export")
      return
    }

    if (selectedRows.length === 0) {
      toast.warning("Please select at least one row to export")
      return
    }

    const selectedData = filteredTableData.filter(row => selectedRows.includes(row.Id))

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const filename = `Contract_Register_${new Date().toISOString().split('T')[0]}.pdf`

      doc.setFontSize(22)
      doc.text('Contract Register Report', 14, 15)
      doc.setFontSize(14)
      doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 14, 22)
      doc.text(`Total Records: ${selectedData.length}`, 14, 27)

      const head = [['Contract No', 'Date', 'Seller', 'Buyer', 'Item', 'Period', 'Qty', 'Rate', 'Lifted Qty', 'Adv Payment', 'Adv Date', 'Vessel']]
      const body = selectedData.map(row => [
        row.ContractNo || '-',
        row.Date ? new Date(row.Date).toLocaleDateString('en-GB') : '-',
        row.SellerLedger || '-',
        row.BuyerLedger || '-',
        row.ItemTypeName || '-',
        getPeriodValue(row),
        String(parseFloat(row.Qty) || 0),
        String(parseFloat(row.Rate) || 0),
        String(parseFloat(row.LiftedQuantity) || 0),
        String(parseFloat(row.AdvPayment) || 0),
        row.AdvDate ? new Date(row.AdvDate).toLocaleDateString('en-GB') : '-',
        row.Vessel || '-'
      ])

      doc.autoTable({
        head,
        body,
        startY: 32,
        margin: { left: 14 },
        styles: { fontSize: 12 },
        headStyles: { fillColor: [40, 167, 69] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })

      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40

      if (remarks && remarks.trim()) {
        doc.setFontSize(16)
        doc.text('Remarks', 14, finalY)
        finalY += 6
        doc.setFontSize(14)
        const splitRemarks = doc.splitTextToSize(remarks.trim(), 180)
        doc.text(splitRemarks, 14, finalY)
      }

      const pdfBlob = doc.output('blob')
      setShowRemarksModal(false)
      setRemarks('')

      const file = new File([pdfBlob], filename, { type: 'application/pdf' })

      if (navigator.share) {
        setPendingShareFile(file)
        setShowSharePDFModal(true)
      } else {
        toast.warning('Share not available on this device. Use a mobile device or browser that supports sharing.')
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Error generating PDF. Please try again.')
      setShowRemarksModal(false)
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
    <div
      className="contract-register-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 70px)',
        padding: 0,
        margin: 0,
        overflow: 'hidden',
        gap: 0
      }}
    >

      {/* Filter Form */}
      <Card className="shadow-sm border-0" style={{ flexShrink: 0, marginBottom: '0.25rem' }}>
        <Card.Header className="bg-primary text-white py-1">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="mb-0 d-none d-md-flex align-items-center">
              <Filter className="me-2" size={16} />
              Contract Register
            </h6>
            <div className="d-flex align-items-center d-md-none w-100 justify-content-center" style={{ gap: '5px' }}>
              {(() => {
                const selectedData = filteredTableData.filter(row => selectedRows.includes(row.Id))
                const totalQty = selectedData.reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0)
                const totalLifted = selectedData.reduce((sum, row) => sum + (parseFloat(row.LiftedQuantity) || 0), 0)
                const totalPending = totalQty - totalLifted

                return (
                  <>
                    <span className="badge bg-info" style={{ fontSize: '0.85rem', padding: '0', marginRight: '5px' }}>
                      Sel: {selectedRows.length}/{filteredTableData.length}
                    </span>
                    <span className="badge bg-primary" style={{ fontSize: '0.85rem', padding: '0', marginRight: '5px' }}>
                      TQ: {totalQty.toFixed(0)}
                    </span>
                    <span className="badge bg-success" style={{ fontSize: '0.85rem', padding: '0', marginRight: '5px' }}>
                      L: {totalLifted.toFixed(0)}
                    </span>
                    <span className="badge bg-warning" style={{ fontSize: '0.85rem', padding: '0' }}>
                      P: {totalPending.toFixed(0)}
                    </span>
                  </>
                )
              })()}
            </div>
          </div>
        </Card.Header>
        <Card.Body className="px-3 py-1" style={{ overflow: 'visible' }}>
          <Form>
            <div style={{ overflowX: "auto", overflowY: "hidden" }}>
              <Row className="g-2 align-items-center" style={{ flexWrap: "nowrap", minWidth: "fit-content" }}>
                <Col xs="auto" style={{ flex: "0 0 auto", display: 'flex', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, marginRight: '8px' }}>Filter:</span>
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
                        onChange={e => {
                          setNotLifted(e.target.checked)
                          setSelectedPeriods([])
                        }}
                        className="form-check-input-sm"
                        label={<span style={{ color: '#000000', fontSize: '0.7rem', fontWeight: '500' }}>Black</span>}
                      />
                      <Form.Check
                        type="checkbox"
                        checked={partialLift}
                        onChange={e => {
                          setPartialLift(e.target.checked)
                          setSelectedPeriods([])
                        }}
                        className="form-check-input-sm"
                        label={<span style={{ color: '#dc3545', fontSize: '0.7rem', fontWeight: '500' }}>Red</span>}
                      />
                      <Form.Check
                        type="checkbox"
                        checked={fullLift}
                        onChange={e => {
                          setFullLift(e.target.checked)
                          setSelectedPeriods([])
                        }}
                        className="form-check-input-sm"
                        label={<span style={{ color: '#0d6efd', fontSize: '0.7rem', fontWeight: '500' }}>Blue</span>}
                      />
                    </div>
                  </div>
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
                      minWidth: "120px",
                      maxWidth: "120px"
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
                    variant="outline-info"
                    size="sm"
                    onClick={handleLink}
                    className="d-flex align-items-center"
                    style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', whiteSpace: 'nowrap' }}
                    disabled={selectedPeriods.length !== 1 || !notLifted || partialLift || fullLift}
                    title={
                      selectedPeriods.length !== 1
                        ? "Select exactly one period"
                        : (!notLifted || partialLift || fullLift)
                          ? "Only Black checkbox should be selected"
                          : "Analyze buyback chains"
                    }
                  >
                    <i className="fas fa-link me-1" style={{ fontSize: '12px' }}></i>
                    Link
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

                <Col xs="auto" style={{ flex: "0 0 auto", display: 'flex', alignItems: 'center' }}>
                  <div style={{
                    border: '2px solid #0d6efd',
                    borderRadius: '4px',
                    padding: '0 0.6rem',
                    backgroundColor: '#e7f1ff',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    whiteSpace: 'nowrap',
                    height: '28px',
                    minHeight: '28px'
                  }}>
                    <span style={{ color: '#6c757d', fontWeight: '600', fontSize: '0.7rem' }}>Contracts:</span>
                    <span style={{ color: '#0d6efd', fontWeight: 'bold', fontSize: '0.7rem' }}>{selectedRows.length.toLocaleString()}</span>
                    <span style={{ color: '#0d6efd', fontSize: '0.7rem' }}>|</span>
                    <span style={{ color: '#6c757d', fontWeight: '600', fontSize: '0.7rem' }}>Qty:</span>
                    <span style={{ color: '#0d6efd', fontWeight: 'bold', fontSize: '0.7rem' }}>
                      {filteredTableData
                        .filter(row => selectedRows.includes(row.Id))
                        .reduce((sum, row) => sum + (parseFloat(row.Qty) || 0), 0)
                        .toLocaleString()}
                    </span>
                  </div>
                </Col>
              </Row>
            </div>
          </Form>
        </Card.Body>
      </Card>


      {/* Table Data Section - Full Height Layout; only table scrolls */}
      {(showTable || (filteredTableData && filteredTableData.length > 0)) && (
        <div
          className="row contract-register-table-section"
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
                      ref={tableContainerRef}
                      className="table-responsive position-relative contract-register-table-scroll"
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
                        className="table mb-0 table-hover"
                        style={{
                          fontSize: "0.7rem",
                          borderSpacing: "0",
                          borderCollapse: "collapse",
                          border: "1.5px solid black !important",
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
                                minWidth: "50px",
                                width: "50px",
                                cursor: "pointer",
                                border: "1.5px solid black !important",
                                boxShadow: "none",
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
                              }}
                            >
                              Item
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
                              }}
                            >
                              Period
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
                              }}
                            >
                              Qty
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
                              }}
                            >
                              Rate
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
                              }}
                            >
                              Lifted Qty
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
                              }}
                            >
                              Adv Payment
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
                              }}
                            >
                              Adv Date
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
                              }}
                            >
                              Vessel
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
                                    onChange={() => handleRowSelect(row.Id)}
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
                                  {row.ContractNo ? (
                                    <Button
                                      variant="link"
                                      className="p-0 text-decoration-none"
                                      onClick={(event) => {
                                        const button = event.target.closest("button")
                                        const originalText = button.innerHTML
                                        button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Loading...'
                                        button.disabled = true

                                        setTimeout(() => {
                                          openEditContractModal(row)
                                          button.innerHTML = originalText
                                          button.disabled = false
                                        }, 300)
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

                    {/* Bottom bar - Period, Commodity, PDF (like LedgerReport) */}
                    <div
                      className="bottom-filters-bar"
                      style={{
                        backgroundColor: "#6C244C",
                        color: "white",
                        borderRadius: 0,
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        marginTop: 0,
                        marginBottom: 0,
                        paddingTop: "6px",
                        paddingBottom: "6px",
                        flexShrink: 0,
                        width: "100%",
                        overflowX: "auto",
                        overflowY: "hidden",
                      }}
                    >
                      <div
                        className="d-flex align-items-center"
                        style={{
                          padding: "6px 12px",
                          gap: "8px",
                          flexWrap: "nowrap",
                          minWidth: "fit-content",
                        }}
                      >
                        <div className="d-flex align-items-center" style={{ flex: "0 0 auto" }}>
                          <i className="fas fa-filter me-2"></i>
                        </div>
                        <div style={{ flex: "0 0 auto", minWidth: "90px", maxWidth: "120px" }}>
                          <div
                            onClick={openPeriodModal}
                            className="bottom-filter-control"
                            style={{
                              backgroundColor: "#E3F2FD",
                              color: "#333",
                              border: "1px solid #2196F3",
                              borderRadius: "6px",
                              height: "32px",
                              minHeight: "32px",
                              padding: "0 8px",
                              fontSize: "0.65rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>
                              {selectedPeriods && selectedPeriods.length > 0
                                ? `${selectedPeriods.length} selected`
                                : "Period"}
                            </span>
                            <i className="fas fa-chevron-down ms-2"></i>
                          </div>
                        </div>
                        <div style={{ flex: "0 0 auto", minWidth: "90px", maxWidth: "120px" }}>
                          <div
                            onClick={openItemModal}
                            className="bottom-filter-control"
                            style={{
                              backgroundColor: "#E3F2FD",
                              color: "#333",
                              border: "1px solid #2196F3",
                              borderRadius: "6px",
                              height: "32px",
                              minHeight: "32px",
                              padding: "0 8px",
                              fontSize: "0.65rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>
                              {selectedItems && selectedItems.length > 0 && !(selectedItems.length === 1 && selectedItems[0] === "")
                                ? `${selectedItems.filter(item => item !== "").length} selected`
                                : "Commodity"}
                            </span>
                            <i className="fas fa-chevron-down ms-2"></i>
                          </div>
                        </div>
                        <div className="d-flex align-items-center" style={{ gap: "8px", flex: "0 0 auto" }}>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={handlePDFExport}
                            className="d-flex align-items-center shadow-sm"
                            style={{ fontSize: "0.6rem", whiteSpace: "nowrap", height: "32px", minHeight: "32px", padding: "0 10px" }}
                            disabled={selectedRows.length === 0}
                            title="Export selected rows to PDF"
                          >
                            <FileText className="me-1" size={14} />
                            PDF
                          </Button>
                        </div>
                      </div>
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
                    backgroundColor: tempSelectedPeriods.some(p => p === period.Id) ? "#e7f3ff" : "transparent",
                    marginBottom: "4px",
                  }}
                  onClick={() => {
                    const isSelected = tempSelectedPeriods.some(p => p === period.Id)
                    if (isSelected) {
                      setTempSelectedPeriods(tempSelectedPeriods.filter(p => p !== period.Id))
                    } else {
                      setTempSelectedPeriods([...tempSelectedPeriods, period.Id])
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!tempSelectedPeriods.some(p => p === period.Id)) {
                      e.currentTarget.style.backgroundColor = "#f8f9fa"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!tempSelectedPeriods.some(p => p === period.Id)) {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  <div className="d-flex align-items-center">
                    <input
                      type="checkbox"
                      checked={tempSelectedPeriods.some(p => p === period.Id)}
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

      {/* Ledger Filter Modal */}
      <Modal
        show={showLedgerModal}
        onHide={closeLedgerModal}
        size="lg"
        centered
        style={{ zIndex: 10000 }}
      >
        <ModalHeader className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center w-100">
            <h5 className="mb-0">
              <i className="fas fa-users me-2"></i>
              Select Ledger
            </h5>
            <Button
              variant="light"
              onClick={closeLedgerModal}
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
                Ledger
              </Form.Label>
            </div>
            <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>
              {state.LedgerArray.map((ledger) => (
                <div
                  key={ledger.Id}
                  style={{
                    padding: "8px",
                    cursor: "pointer",
                    borderRadius: "4px",
                    backgroundColor: tempSelectedLedgerIds.includes(ledger.Id) ? "#e7f3ff" : "transparent",
                    marginBottom: "4px",
                  }}
                  onClick={() => {
                    const isSelected = tempSelectedLedgerIds.includes(ledger.Id)
                    if (isSelected) {
                      setTempSelectedLedgerIds(tempSelectedLedgerIds.filter(id => id !== ledger.Id))
                    } else {
                      setTempSelectedLedgerIds([...tempSelectedLedgerIds, ledger.Id])
                    }
                  }}
                  onMouseEnter={(e) => {
                    if (!tempSelectedLedgerIds.includes(ledger.Id)) {
                      e.currentTarget.style.backgroundColor = "#f8f9fa"
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!tempSelectedLedgerIds.includes(ledger.Id)) {
                      e.currentTarget.style.backgroundColor = "transparent"
                    }
                  }}
                >
                  <div className="d-flex align-items-center">
                    <input
                      type="checkbox"
                      checked={tempSelectedLedgerIds.includes(ledger.Id)}
                      onChange={() => { }}
                      style={{ marginRight: "10px", cursor: "pointer" }}
                    />
                    <span>{ledger.Name}</span>
                  </div>
                </div>
              ))}
              {state.LedgerArray.length === 0 && (
                <div className="text-center text-muted py-3">
                  No ledgers available
                </div>
              )}
            </div>
          </Form>
        </ModalBody>
        <ModalFooter className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setTempSelectedLedgerIds([])}>
            Clear All
          </Button>
          <Button variant="outline-primary" size="sm" onClick={() => {
            const allLedgerIds = state.LedgerArray.map(ledger => ledger.Id)
            setTempSelectedLedgerIds(allLedgerIds)
          }}>
            Select All
          </Button>
          <Button variant="primary" onClick={handleLedgerModalDone}>
            <i className="fas fa-check me-2"></i>
            Done
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
        className="edit-contract-modal"
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

      {/* Scroll to Top Button for Table */}
      {showScrollTop && filteredTableData.length > 0 && (
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            scrollToTop()
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
            e.currentTarget.style.backgroundColor = "#0b5ed7"
            e.currentTarget.style.transform = "scale(1.1)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#0d6efd"
            e.currentTarget.style.transform = "scale(1)"
          }}
          title="Scroll to top of table"
        >
          <i className="fas fa-arrow-up"></i>
        </button>
      )}

      {/* Mobile responsive styles for scroll button */}
      <style>{`
        @media (max-width: 768px) {
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

      {/* Remarks Modal for PDF Export */}
      <Modal
        show={showRemarksModal}
        onHide={() => {
          setShowRemarksModal(false)
          setRemarks('')
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
              setShowRemarksModal(false)
              setRemarks('')
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

      {/* Share PDF Modal – Share runs on this button click (user gesture) */}
      <Modal
        show={showSharePDFModal}
        onHide={() => {
          setShowSharePDFModal(false)
          setPendingShareFile(null)
        }}
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
    </div>
  )
}

export default ContractRegister
