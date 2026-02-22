import React, { useState, useEffect, useRef } from "react"
import {
  Row,
  Col,
  Card,
  CardBody,
  Form,
  FormGroup,
  FormLabel,
  Button,
  Table,
  Spinner,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "react-bootstrap"
import { Container } from "reactstrap"
import { useNavigate, useLocation } from "react-router-dom"
import Breadcrumbs from "../../components/Common/Breadcrumb"
import { API_WEB_URLS } from "../../constants/constAPI"
import { useDispatch } from "react-redux"
import {
  Fn_FillListData,
  Fn_GetReport,
  Fn_AddEditData,
  Fn_DeleteData,
} from "../../store/Functions"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { Input } from "reactstrap"
import Select from "react-select"
import EditContract from "../Transaction/EditContract"
import MultiSelectDropdown from "../../components/Common/MultiSelectDropdown"
import ExcelJS from "exceljs"
import { FileText } from "react-feather"
import jsPDF from "jspdf"
import { applyPlugin as applyAutoTable } from "jspdf-autotable"
applyAutoTable(jsPDF)

const LedgerReport = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

  // State for scroll to top button
  const [showScrollTop, setShowScrollTop] = useState(false)

  // Ref for table container
  const tableContainerRef = useRef(null)

  // Add CSS to ensure borders persist during scrolling and fix hover backgrounds
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      .table th,
      .table td {
        border: 1.5px solid black !important;
      }
      .table th[style*="border"] {
        border: 1.5px solid black !important;
      }
      .table td[style*="border"] {
        border: 1.5px solid black !important;
      }
      .table tbody tr td {
        border: 1.5px solid black !important;
      }
      .table thead tr th {
        border: 1.5px solid black !important;
      }
      
      /* Lighter grey for table-secondary rows (not started contracts) */
      .table-secondary {
        background-color: #e8e8e8 !important;
      }
      .table-secondary td {
        background-color: #e8e8e8 !important;
      }
      
      /* Lighter blue for table-info rows (fully lifted contracts) */
      .table-info {
        background-color: #d6ebff !important;
      }
      .table-info td {
        background-color: #d6ebff !important;
      }
      
      /* Lighter red for table-danger rows (partially lifted contracts) */
      .table-danger {
        background-color: #fde7e9 !important;
      }
      .table-danger td {
        background-color: #fde7e9 !important;
      }
      
      /* Force totals row background color */
      tfoot tr {
        background-color: #4B0082 !important;
        color: white !important;
      }
      tfoot tr td {
        background-color: #4B0082 !important;
        color: white !important;
      }
      
      /* Remove all gaps between input and table sections */
      .card.mb-0,
      .card.shadow-sm,
      .card-body {
        margin-bottom: 0 !important;
        margin-top: 0 !important;
      }
      
      /* Remove default Bootstrap card margin */
      .card {
        margin-bottom: 0 !important;
      }
      
      /* Ensure no spacing between main container divs */
      .col-12 {
        margin-bottom: 0 !important;
        padding-bottom: 0 !important;
      }
      
      /* Remove row spacing */
      .row {
        margin-bottom: 0 !important;
        margin-top: 0 !important;
      }
      
      /* Remove all bottom spacing */
      .card-body {
        padding: 0 !important;
      }
      
      /* Table container full height */
      .table-responsive {
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Remove ALL bottom gaps */
      * {
        box-sizing: border-box !important;
      }
      
      /* Ensure page fills entire viewport */
      html, body {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow-x: hidden !important;
      }
      
      /* Remove any wrapper padding */
      #root {
        height: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      
      /* Bottom filters bar - sab controls ki same height (32px) */
      .bottom-filters-bar input.form-control,
      .bottom-filters-bar .form-control-sm,
      .bottom-filters-bar input[type="text"] {
        height: 32px !important;
        min-height: 32px !important;
        box-sizing: border-box !important;
      }
      .bottom-filters-bar .react-select__control {
        height: 32px !important;
        min-height: 32px !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
      }
      .bottom-filters-bar .react-select__value-container {
        display: flex !important;
        align-items: center !important;
        padding: 0 8px !important;
      }
      .bottom-filters-bar .react-select__placeholder,
      .bottom-filters-bar .react-select__single-value {
        margin: 0 !important;
        line-height: 1 !important;
      }
      .bottom-filters-bar .react-select__input-container {
        margin: 0 !important;
        padding: 0 !important;
      }
      .bottom-filters-bar .btn {
        height: 32px !important;
        min-height: 32px !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        display: inline-flex !important;
        align-items: center !important;
        box-sizing: border-box !important;
      }
      .bottom-filters-bar .d-flex.align-items-center > div > div,
      .bottom-filters-bar .bottom-filter-control {
        height: 32px !important;
        min-height: 32px !important;
        box-sizing: border-box !important;
        display: flex !important;
        align-items: center !important;
      }
      
      /* Fix dropdown in table footer to render outside table */
      tfoot td {
        overflow: visible !important;
      }
      
      tfoot .position-relative > div.position-absolute {
        position: fixed !important;
        z-index: 99999 !important;
      }
      
      /* Make period dropdown open upward */
      .period-dropdown-upward > div > div.position-absolute {
        bottom: 100% !important;
        top: auto !important;
        margin-bottom: 2px !important;
        margin-top: 0 !important;
      }
      
      .period-dropdown-upward div[class*="position-absolute"] {
        bottom: 100% !important;
        top: auto !important;
        margin-bottom: 2px !important;
        margin-top: 0 !important;
      }
      
      /* Fix dropdown text visibility */
      .period-dropdown-upward button {
        color: #333 !important;
        background-color: #E8D5E8 !important;
        border-radius: 6px !important;
        height: 28px !important;
        min-height: 28px !important;
        padding: 2px 8px !important;
        font-size: 0.65rem !important;
      }
      
      .period-dropdown-upward button span {
        color: #333 !important;
        font-size: 0.65rem !important;
      }

      .period-dropdown-upward .position-absolute {
        color: #000000 !important;
        background-color: #fff !important;
        min-width: 250px !important;
        white-space: nowrap !important;
      }

      .period-dropdown-upward .position-absolute > div {
        color: #000000 !important;
      }

      .period-dropdown-upward .position-absolute .dropdown-item {
        color: #000000 !important;
        white-space: nowrap !important;
      }

      .period-dropdown-upward .position-absolute * {
        color: #000000 !important;
      }
      
      .period-dropdown-upward button:hover {
        background-color: #D1B3D1 !important;
      }
      
      /* Party dropdown styling - MultiSelectDropdown */
      .party-dropdown-upward button {
        color: #333 !important;
        background-color: #E8D5E8 !important;
        border: none !important;
        border-radius: 6px !important;
        height: 28px !important;
        min-height: 28px !important;
        padding: 2px 8px !important;
        font-size: 0.65rem !important;
      }
      
      .party-dropdown-upward button span {
        color: #333 !important;
        font-size: 0.65rem !important;
      }
      
      .party-dropdown-upward button:hover {
        background-color: #D1B3D1 !important;
      }
      
      .party-dropdown-upward .position-absolute {
        background-color: white !important;
        border: 1px solid #dee2e6 !important;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
      }
      
      .party-dropdown-upward .form-control {
        color: #212529 !important;
        background-color: white !important;
      }
      
      .party-dropdown-upward .position-absolute > div > div {
        color: #212529 !important;
      }
      
      .party-dropdown-upward .position-absolute span {
        color: #212529 !important;
      }
      
      .party-dropdown-upward .position-absolute div {
        color: #212529 !important;
      }
      
      .party-dropdown-upward .bg-primary {
        background-color: #0d6efd !important;
        color: white !important;
      }
      
      .party-dropdown-upward .bg-primary span {
        color: white !important;
      }
      
      .party-dropdown-upward .text-muted {
        color: #6c757d !important;
      }
      
      /* Date picker input width */
      .date-picker-custom {
        width: 100% !important;
      }
      
      .date-picker-custom input {
        width: 100% !important;
        padding: 0.25rem 0.5rem !important;
      }
      
      .react-datepicker-wrapper {
        width: 100% !important;
      }
      
      .react-datepicker__input-container {
        width: 100% !important;
      }
      
      .react-datepicker__input-container input {
        width: 100% !important;
      }
      
      /* Hide calendar icon in native date inputs */
      input[type="date"]::-webkit-calendar-picker-indicator {
        display: none;
        -webkit-appearance: none;
      }
      
      /* Ensure datepicker dropdown appears above sticky headers */
      .react-datepicker-popper {
        z-index: 12000 !important;
      }
      
      /* Remove pagination controls spacing */
      .pagination-controls {
        margin: 0 !important;
        padding: 0 !important;
        min-height: 0 !important;
      }
      
      /* Mobile: lock body scroll so only table scrolls */
      @media (max-width: 768px) {
        body.ledger-report-mobile {
          overflow: hidden !important;
          height: 100% !important;
        }
      }
      
      /* Mobile: fix layout - only table data scrolls; container height excludes fixed nav footer so no overlap */
      @media (max-width: 768px) {
        /* Nav footer space - container shorter; table height thodi aur kam */
        .ledger-report-container {
          height: calc(100vh - 115px - env(safe-area-inset-bottom, 0px)) !important;
          height: calc(100dvh - 115px - env(safe-area-inset-bottom, 0px)) !important;
          max-height: calc(100vh - 115px - env(safe-area-inset-bottom, 0px)) !important;
          max-height: calc(100dvh - 115px - env(safe-area-inset-bottom, 0px)) !important;
          overflow: hidden !important;
          padding-top: 0 !important;
          padding-bottom: 0 !important;
          box-sizing: border-box !important;
          display: flex !important;
          flex-direction: column !important;
          touch-action: none !important;
        }
        
        .ledger-report-container .col-12:first-child {
          flex: 0 0 auto !important;
          min-height: auto !important;
        }
        
        /* Table section: takes remaining space, only inner table scrolls */
        .ledger-report-container .row.ledger-table-section {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          overflow: hidden !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        .ledger-report-container .ledger-table-section .col-12 {
          min-height: 0 !important;
          display: flex !important;
          flex-direction: column !important;
        }
        
        .ledger-report-container .ledger-table-section .card {
          min-height: 0 !important;
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
        }
        
        /* Table section card-body: bottom padding reduces table height so filters stay above nav footer */
        .ledger-report-container .ledger-table-section .card-body {
          min-height: 0 !important;
          flex: 1 !important;
          display: flex !important;
          flex-direction: column !important;
          overflow: hidden !important;
          padding-bottom: 32px !important;
        }
        
        /* Only this div scrolls - table height thodi kam so no overlap with nav footer */
        .ledger-report-container .table-responsive.ledger-table-scroll {
          flex: 1 1 auto !important;
          min-height: 0 !important;
          max-height: 100% !important;
          overflow-y: auto !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch !important;
          margin-bottom: 0 !important;
          padding-bottom: 0 !important;
          border-bottom: none !important;
        }
        
        /* Sticky header - fixed at top when scrolling */
        .ledger-report-container .table-responsive thead th {
          position: sticky !important;
          top: 0 !important;
          z-index: 12 !important;
          background-color: #0000FF !important;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15) !important;
        }
        
        /* Sticky footer - both total rows fixed at bottom when scrolling */
        .ledger-report-container .table-responsive tfoot {
          position: sticky !important;
          bottom: 0 !important;
          z-index: 11 !important;
        }
        
        .ledger-report-container .table-responsive tfoot tr {
          box-shadow: 0 -2px 4px rgba(0,0,0,0.15) !important;
        }
        
        /* Bottom filters bar - attached to table top, sits above app footer (no overlap) */
        .ledger-report-container .bottom-filters-bar {
          flex-shrink: 0 !important;
          margin-top: 0 !important;
          margin-bottom: 0 !important;
          padding-top: 6px !important;
          padding-bottom: 6px !important;
          border-top: 2px solid #5a2d5a !important;
          border-bottom: none !important;
          min-height: 40px !important;
          /* stays in container above padding-bottom = above app footer */
        }
        
        .ledger-report-container .card-body {
          gap: 0 !important;
        }
        
        .ledger-report-container .text-center.py-2 {
          padding-top: 0.5rem !important;
          padding-bottom: 0.5rem !important;
        }
        
        /* Note column - single line on mobile, wider column, scroll horizontally if long */
        .ledger-report-container .table-responsive .ledger-note-cell {
          min-width: 200px !important;
          max-width: 320px !important;
          width: auto !important;
          padding: 6px 8px !important;
          font-size: 0.7rem !important;
          line-height: 1.35 !important;
          white-space: nowrap !important;
          overflow-x: auto !important;
          overflow-y: hidden !important;
          -webkit-overflow-scrolling: touch !important;
        }
        
        .bottom-filters-bar::-webkit-scrollbar {
          height: 6px;
        }
        .bottom-filters-bar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .bottom-filters-bar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.3);
          border-radius: 3px;
        }
      }
      
      @media (max-width: 480px) {
        .party-dropdown-upward button,
        .period-dropdown-upward button {
          font-size: 0.6rem !important;
          padding: 1px 6px !important;
          height: 26px !important;
          min-height: 26px !important;
        }
        .party-dropdown-upward button span,
        .period-dropdown-upward button span {
          font-size: 0.6rem !important;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // On mobile: lock body scroll so only table content scrolls
  useEffect(() => {
    const isMobile = () => window.innerWidth <= 768
    if (isMobile()) {
      document.body.classList.add("ledger-report-mobile")
    }
    const handleResize = () => {
      if (!isMobile()) {
        document.body.classList.remove("ledger-report-mobile")
      } else {
        document.body.classList.add("ledger-report-mobile")
      }
    }
    window.addEventListener("resize", handleResize)
    return () => {
      document.body.classList.remove("ledger-report-mobile")
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Scroll event handler for table container
  const handleTableScroll = () => {
    const tableContainer = tableContainerRef.current
    if (tableContainer) {
      const scrollPosition = tableContainer.scrollTop
      console.log("Table scroll position:", scrollPosition)
      if (scrollPosition > 200) {
        setShowScrollTop(true)
      } else {
        setShowScrollTop(false)
      }
    }
  }

  // Scroll to top button visibility handler for table container
  useEffect(() => {
    // Use a small delay to ensure table is rendered
    const timer = setTimeout(() => {
      const tableContainer = tableContainerRef.current
      if (tableContainer) {
        // Initial check
        handleTableScroll()

        // Add scroll event listener to table container
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

  // Scroll to top function for table container
  const scrollToTop = () => {
    console.log("Scroll to top button clicked!")

    const tableContainer = tableContainerRef.current
    if (tableContainer) {
      try {
        // Smooth scroll the table container to top
        tableContainer.scrollTo({
          top: 0,
          behavior: "smooth"
        })
        console.log("Table scrolled to top")
      } catch (error) {
        // Fallback for browsers that don't support smooth scroll
        tableContainer.scrollTop = 0
        console.log("Table scrolled to top (fallback)")
      }
    } else {
      console.error("Table container not found")
    }
  }

  const breadCrumbTitle = "Ledger Report"
  const breadcrumbItem = "Reports"

  const [selectedLedger, setSelectedLedger] = useState("")
  const [fromDate, setFromDate] = useState(new Date("2025-01-01T00:00:00")) // Default from date: 1st January 2025
  const [selectedTax, setSelectedTax] = useState("")
  const [selectedParty, setSelectedParty] = useState("")
  const [selectedParties, setSelectedParties] = useState([])
  const [selectedItem, setSelectedItem] = useState("")
  const [selectedItems, setSelectedItems] = useState([])
  const [itemOptions, setItemOptions] = useState([{ value: "", label: "All" }])
  const [shouldRefreshItemOptions, setShouldRefreshItemOptions] = useState(true)
  const [ledgerDropdown, setLedgerDropdown] = useState([]) // Multi-select ledger dropdown
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [tempLedgerSelection, setTempLedgerSelection] = useState([]) // Temporary selection in modal
  const [selectedLedgerNames, setSelectedLedgerNames] = useState([]) // Store selected ledger names for grouping
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("") // Search term for ledger modal
  const [selectedRowIds, setSelectedRowIds] = useState(new Set())
  const selectAllRef = useRef(null)

  const [selectedPeriod, setSelectedPeriod] = useState([])

  // Filters Modal State - for individual dropdown modals
  const [showPartyModal, setShowPartyModal] = useState(false)
  const [showItemModal, setShowItemModal] = useState(false)

  // PDF Remarks Modal state
  const [showRemarksModal, setShowRemarksModal] = useState(false)
  const [remarks, setRemarks] = useState('')
  const [pendingShareFile, setPendingShareFile] = useState(null)
  const [showSharePDFModal, setShowSharePDFModal] = useState(false)
  const [showPeriodModal, setShowPeriodModal] = useState(false)
  const [tempSelectedParties, setTempSelectedParties] = useState([])
  const [tempSelectedItems, setTempSelectedItems] = useState([])
  const [tempSelectedPeriod, setTempSelectedPeriod] = useState([])

  const [toDate, setToDate] = useState(new Date()) // Default to date: Today's date
  const [loading, setLoading] = useState(false)
  const [ledgerLoading, setLedgerLoading] = useState(true)
  const [showReport, setShowReport] = useState(false)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(50) // Default 50 rows per page

  // Sorting state
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

  // Hover totals state
  const [hoveredRowIndex, setHoveredRowIndex] = useState(null)
  const [hoverTotalsPosition, setHoverTotalsPosition] = useState({
    top: 0,
    visible: false,
  })

  // Grouping state - always grouped, determine field based on navigation ledger
  const getGroupByField = () => {
    if (location.state?.ledgerNames) {
      const ledgerNames = location.state.ledgerNames
        .split(",")
        .map(name => name.trim())
      // Check if the ledger name matches more with Seller or Buyer fields
      // For now, we'll group by Seller by default, but this could be enhanced
      // to actually analyze the data and determine the best grouping field
      return "Seller"
    }
    return "Seller" // Default to Seller
  }

  // Modal state for EditContract
  const [showEditContractModal, setShowEditContractModal] = useState(false)
  const [selectedContractData, setSelectedContractData] = useState(null)
  const [modalLoading, setModalLoading] = useState(false)

  // Modal state for Voucher
  const [showVoucherModal, setShowVoucherModal] = useState(false)

  const [voucherMode, setVoucherMode] = useState("save") // "save" or "edit"
  const [voucherLoading, setVoucherLoading] = useState(false)
  const [voucherSearchTerm, setVoucherSearchTerm] = useState("")
  const [voucherErrors, setVoucherErrors] = useState({})
  const [voucherData, setVoucherData] = useState({
    id: 0,
    VoucherNo: "",
    VoucherDate: "",
    F_LedgerMasterDr: "",
    F_LedgerMasterCr: "",
    Amount: "",
    Narration: "",
  })

  const [state, setState] = useState({
    Vessel: "",
    ContractNoSearch: "",
    DeliveryPort: "",
    AdvPayment: "",
    AdvDate: "",
    Seller: "",
    Buyer: "",
    LiftFromDate: "",
    LiftToDate: "",
    ShipFromDate: "",
    ShipToDate: "",
    Completed: false,
    NotStarted: true,
    Pending: true,
    applyGST: false,
    LAP: false,
    LIP: false,
    LedgerArray: [],
    TaxAccountArray: [],
    UnitArray: [],
    ItemArray: [],
    MonthArray: [],
    FillArray: [],
    GlobalArray: [],
    VoucherNoArray: [],
    VoucherHArray: [],
    PeriodDataArray: [],
  })

  // State for managing visible notes
  const [visibleNotes, setVisibleNotes] = useState({
    Note1: true, // Default to Note1
    Note2: false,
    Note3: false,
    Note4: false,
    Note5: false,
    Note6: false,
  })

  const API_URL = API_WEB_URLS.MASTER + "/0/token/PartyAccount"
  const API_URL_Get = `${API_WEB_URLS.GetLedgerReportApp}/0/token`
  const API_URL_PeriodData = `${API_WEB_URLS.PeriodData}/0/token`
  const API_URL_SAVE = `${API_WEB_URLS.VoucherH}/0/token`
  const API_URL1 = API_WEB_URLS.MASTER + "/0/token/TaxAccount"
  const API_URL2 = API_WEB_URLS.MASTER + "/0/token/UnitMaster"
  const API_URL3 = API_WEB_URLS.MASTER + "/0/token/ItemMaster"
  const API_URL4 = API_WEB_URLS.MASTER + "/0/token/MonthMaster"
  const API_URL5 = API_WEB_URLS.MASTER + "/0/token/VoucherNoNew"
  const API_URL6 = API_WEB_URLS.MASTER + "/0/token/VoucherMaster"
  const API_URL_Delete = API_WEB_URLS.MASTER + "/0/token/VoucherH"
  const API_URL7 = API_WEB_URLS.MASTER + "/0/token/UpdateGlobalOptions"

  // Helper function to format date as YYYY-MM-DD without timezone conversion
  const formatDateForInput = (date) => {
    if (!date) return ''
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
  }

  // Helper function to handle LAP/LIP date logic
  const handleLapLipDateChange = (lapValue, lipValue) => {
    if (lapValue || lipValue) {
      // If either LAP or LIP is selected, set dates to previous financial year (last completed FY)
      // Previous Financial Year: April 1st of year before last to March 31st of last year
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()

      // Set to previous financial year (one year back from current FY)
      const financialYearStart = new Date(currentYear - 2, 3, 1, 0, 0, 0) // April 1 of year before last
      const financialYearEnd = new Date(currentYear - 1, 2, 31, 0, 0, 0) // March 31 of last year

      setFromDate(financialYearStart)
      setToDate(financialYearEnd)
    } else {
      // If both are unselected, revert to normal dates (1st January 2025 to today)
      setFromDate(new Date("2025-01-01T00:00:00"))
      setToDate(new Date())
    }
  }

  // Helper function to combine notes based on selection
  const getCombinedNotes = row => {
    const notes = []
    if (visibleNotes.Note1 && row.Note1) notes.push(`Note1: ${row.Note1}`)
    if (visibleNotes.Note2 && row.Note2) notes.push(`Note2: ${row.Note2}`)
    if (visibleNotes.Note3 && row.Note3) notes.push(`Note3: ${row.Note3}`)
    if (visibleNotes.Note4 && row.Note4) notes.push(`Note4: ${row.Note4}`)
    if (visibleNotes.Note5 && row.Note5) notes.push(`Note5: ${row.Note5}`)
    if (visibleNotes.Note6 && row.Note6) notes.push(`Note6: ${row.Note6}`)
    return notes.length > 0 ? notes.join("\n") : "-"
  }

  // Toggle all notes on/off
  const toggleAllNotes = checked => {
    setVisibleNotes({
      Note1: checked,
      Note2: checked,
      Note3: checked,
      Note4: checked,
      Note5: checked,
      Note6: checked,
    })
  }

  useEffect(() => {
    // Inject custom styles to prevent hover effects
    const styleElement = document.createElement("style")
    styleElement.textContent = `
      /* Disable all hover effects on table rows */
      .table tbody tr:hover,
      .table-hover tbody tr:hover {
        background-color: inherit !important;
      }
      
      .table tbody tr:hover td,
      .table tbody tr:hover th,
      .table-hover tbody tr:hover td,
      .table-hover tbody tr:hover th {
        background-color: inherit !important;
        color: inherit !important;
      }
      
      /* Custom styles for react-select */
      .react-select__control {
        background-color: #f8f9fa !important;
        border: none !important;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
        min-height: 38px !important;
        font-size: 0.875rem !important;
        border-radius: 0.375rem !important;
      }
      
      .react-select__control--is-focused {
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25) !important;
        border-color: #86b7fe !important;
      }
      
      .react-select__control:hover {
        border-color: #86b7fe !important;
      }
      
      .react-select__menu {
        background-color: white !important;
        border: 1px solid #dee2e6 !important;
        box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
        z-index: 9999 !important;
        border-radius: 0.375rem !important;
        margin-top: 2px !important;
      }
      
      .react-select__option {
        background-color: white !important;
        color: #212529 !important;
        font-size: 0.875rem !important;
        padding: 0.5rem 0.75rem !important;
        cursor: pointer !important;
      }
      
      .react-select__option--is-focused {
        background-color: #e9ecef !important;
        color: #212529 !important;
      }
      
      .react-select__option--is-selected {
        background-color: #0d6efd !important;
        color: white !important;
      }
      
      .react-select__option__placeholder {
        color: #6c757d !important;
        font-size: 0.875rem !important;
      }
      
      .react-select__single-value {
        color: #212529 !important;
        font-size: 0.875rem !important;
        font-weight: 500 !important;
      }
      
      .react-select__input-container {
        color: #212529 !important;
        font-size: 0.875rem !important;
      }
      
      .react-select__indicator-separator {
        display: none !important;
      }
      
      .react-select__clear-indicator {
        color: #6c757d !important;
        cursor: pointer !important;
      }
      
      .react-select__clear-indicator:hover {
        color: #dc3545 !important;
      }
      
      .react-select__dropdown-indicator {
        color: #6c757d !important;
      }
      
      .react-select__dropdown-indicator:hover {
        color: #495057 !important;
      }
      
      /* Custom styles for EditContract modal */
      .edit-contract-modal .modal-xl {
        max-width: 95vw;
      }
      
      .edit-contract-modal .modal-body {
        padding: 0;
        max-height: 80vh;
        overflow-y: auto;
      }
      
      .edit-contract-modal .contract-page {
        padding: 0;
        margin: 0;
      }
      
      .edit-contract-modal .contract-page > div:first-child {
        height: 0;
      }
      
      .edit-contract-modal .contract-form {
        padding: 1rem;
      }
      
      .edit-contract-modal .form-section {
        margin-bottom: 1rem;
      }
      
      .edit-contract-modal .section-title {
        font-size: 0.9rem !important;
        margin-bottom: 0.5rem;
      }
      
      .edit-contract-modal .form-label-sm {
        font-size: 0.7rem !important;
      }
      
      .edit-contract-modal .form-control-sm {
        font-size: 0.75rem !important;
        padding: 0.25rem 0.5rem !important;
      }
      
      .edit-contract-modal .btn-sm {
        font-size: 0.75rem !important;
        padding: 0.25rem 0.5rem !important;
      }
      
      .edit-contract-modal .table-sm th,
      .edit-contract-modal .table-sm td {
        font-size: 0.7rem !important;
        padding: 0.25rem !important;
      }
      
      /* Additional styles for modal mode */
      .contract-modal {
        padding: 0 !important;
        margin: 0 !important;
      }
      
      .contract-form-modal {
        padding: 0.5rem !important;
      }
      
      .form-section-modal {
        margin-bottom: 0.5rem !important;
      }
      
      .section-title-modal {
        font-size: 0.8rem !important;
        margin-bottom: 0.25rem !important;
      }
      
      .contract-modal .form-group {
        margin-bottom: 0.5rem !important;
      }
      
      .contract-modal .form-label-sm {
        font-size: 0.65rem !important;
        margin-bottom: 0.25rem !important;
      }
      
      .contract-modal .form-control-sm {
        font-size: 0.7rem !important;
        padding: 0.2rem 0.4rem !important;
        height: auto !important;
      }
      
      .contract-modal .btn-sm {
        font-size: 0.7rem !important;
        padding: 0.2rem 0.4rem !important;
      }
      
      .contract-modal .table-sm th,
      .contract-modal .table-sm td {
        font-size: 0.65rem !important;
        padding: 0.2rem !important;
      }
      
      .contract-modal .col-md-1,
      .contract-modal .col-md-2,
      .contract-modal .col-md-3,
      .contract-modal .col-md-4,
      .contract-modal .col-md-5,
      .contract-modal .col-md-6,
      .contract-modal .col-md-7 {
        padding: 0 0.25rem !important;
      }
      
      .contract-modal .row.g-0 > .col {
        padding: 0 0.25rem !important;
      }
      
      /* Ensure modal content is visible */
      .edit-contract-modal .modal-content {
        height: 90vh;
        max-height: 90vh;
      }
      
      .edit-contract-modal .modal-body {
        height: calc(90vh - 120px);
        overflow-y: auto;
        padding: 0;
      }
      
      .edit-contract-modal .contract-page {
        height: 100%;
        overflow-y: auto;
        background: white !important;
      }
      
      .edit-contract-modal .contract-form {
        height: 100%;
        padding: 0.5rem;
        background: white !important;
      }
      
      /* Remove purple background and make form container full height */
      .edit-contract-modal .contract-page {
        background: white !important;
        background-image: none !important;
        background: linear-gradient(to bottom, white, white) !important;
        min-height: 100%;
        height: auto;
      }
      
      .edit-contract-modal .contract-form {
        background: white !important;
        background-image: none !important;
        min-height: 100%;
        height: auto;
      }
      
      /* Make form elements more compact in modal */
      .edit-contract-modal .form-control-sm {
        height: 28px !important;
        font-size: 0.7rem !important;
      }
      
      .edit-contract-modal .btn-sm {
        height: 28px !important;
        font-size: 0.7rem !important;
        padding: 0.2rem 0.4rem !important;
      }
      
      .edit-contract-modal .form-label-sm {
        font-size: 0.65rem !important;
        margin-bottom: 0.2rem !important;
      }
      
      .edit-contract-modal .form-group {
        margin-bottom: 0.4rem !important;
      }
      
      /* Override any existing background styles */
      .edit-contract-modal * {
        background-image: none !important;
      }
      
      .edit-contract-modal .contract-page,
      .edit-contract-modal .contract-form,
      .edit-contract-modal .form-section {
        background: white !important;
        background-image: none !important;
      }
      
      /* Override the specific purple background from Contract.scss */
      .edit-contract-modal .contract-page {
        background: white !important;
        background-image: none !important;
        background: linear-gradient(to bottom, white, white) !important;
        background-color: white !important;
        min-height: 100%;
        height: auto;
        position: relative !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        overflow: visible !important;
      }
      
      /* Force white background on all form elements */
      .edit-contract-modal .form-section {
        background: white !important;
        background-color: white !important;
        background-image: none !important;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .edit-contract-modal .form-control,
      .edit-contract-modal .form-select,
      .edit-contract-modal input,
      .edit-contract-modal select {
        background: white !important;
        background-color: white !important;
        border: 1px solid #ced4da;
      }
      
      .edit-contract-modal .table {
        background: white !important;
        background-color: white !important;
      }
      
      .edit-contract-modal .table th,
      .edit-contract-modal .table td {
        background: white !important;
        background-color: white !important;
      }
      
      /* Ensure proper spacing and visibility */
      .edit-contract-modal .contract-form {
        background: white !important;
        background-color: white !important;
        padding: 1rem;
        min-height: calc(90vh - 140px);
      }
      
      .edit-contract-modal .contract-page {
        background: white !important;
        background-color: white !important;
        min-height: 100%;
        padding: 0;
      }
      
      /* Additional overrides for Contract.scss */
      .edit-contract-modal .contract-page {
        background: white !important;
        background-image: none !important;
        background: linear-gradient(to bottom, white, white) !important;
        background-color: white !important;
        min-height: 100vh;
        padding: 0;
        margin: 0;
        font-family: inherit;
        position: relative !important;
        top: auto !important;
        left: auto !important;
        right: auto !important;
        bottom: auto !important;
        overflow: visible !important;
      }
      
      /* Table scrollbar styles */
      .table-responsive::-webkit-scrollbar {
        width: 8px;
      }
      
      .table-responsive::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 4px;
      }
      
      .table-responsive::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 4px;
      }
      
      .table-responsive::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      /* Ensure table header and footer are visible during scroll */
      .table-responsive thead th {
        position: sticky;
        top: 0;
        z-index: 10;
        background-color: #0000FF !important;
        color: white !important;
      }
      
      .table-responsive tfoot tr {
        position: sticky;
        bottom: 0;
        z-index: 10;
      }
      
      /* Custom styles for Voucher modal */
      .voucher-modal .modal-header {
        background: linear-gradient(135deg, #17a2b8, #138496) !important;
        border-bottom: 2px solid #117a8b;
      }
      
      .voucher-modal .modal-title {
        color: white !important;
        font-weight: 600;
      }
      
      .voucher-modal .form-label {
        color: #495057;
        font-weight: 600;
        font-size: 0.875rem;
        margin-bottom: 0.5rem;
      }
      
      .voucher-modal .form-control,
      .voucher-modal .react-select__control {
        border: 1px solid #ced4da;
        border-radius: 0.375rem;
        transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
      }
      
      .voucher-modal .form-control:focus,
      .voucher-modal .react-select__control--is-focused {
        border-color: #86b7fe;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      }
      
      .voucher-modal .btn {
        font-weight: 500;
        border-radius: 0.375rem;
        transition: all 0.15s ease-in-out;
      }
      
      .voucher-modal .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
      }
      
      .voucher-modal .btn-success {
        background: linear-gradient(135deg, #28a745, #20c997);
        border: none;
      }
      
      .voucher-modal .btn-danger {
        background: linear-gradient(135deg, #dc3545, #e74c3c);
        border: none;
      }
      
      .voucher-modal .btn-primary {
        background: linear-gradient(135deg, #007bff, #0056b3);
        border: none;
      }
      
      .voucher-modal .btn-secondary {
        background: linear-gradient(135deg, #6c757d, #495057);
        border: none;
      }
      
      .edit-contract-modal .contract-form {
        background: #fafbfc !important;
        background-color: #fafbfc !important;
        background-image: none !important;
        padding: 0.25rem;
        margin: 0;
        width: 100%;
        height: 100%;
        overflow: auto;
      }
      
      /* Ensure form sections are properly sized and visible */
      .edit-contract-modal .form-section {
        background: white !important;
        background-color: white !important;
        background-image: none !important;
        border: 1px solid #dee2e6;
        border-radius: 8px;
        padding: 1rem;
        margin-bottom: 1rem;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        min-height: auto;
        height: auto;
        position: relative;
        overflow: visible;
      }
      
      /* Make sure the modal content takes full height */
      .edit-contract-modal .modal-content {
        height: 90vh;
        max-height: 90vh;
        background: white;
      }
      
      .edit-contract-modal .modal-body {
        height: calc(90vh - 120px);
        overflow-y: auto;
        padding: 0;
        background: white;
      }
      
      /* Ensure the contract page takes full modal height */
      .edit-contract-modal .contract-page {
        height: 100%;
        min-height: 100%;
        background: white !important;
        background-color: white !important;
        background-image: none !important;
        position: relative !important;
        overflow: visible !important;
      }
      
      /* Ensure the contract form takes full height */
      .edit-contract-modal .contract-form {
        height: 100%;
        min-height: 100%;
        background: white !important;
        background-color: white !important;
        background-image: none !important;
        overflow: visible !important;
      }
      
      /* Pagination Styles */
      .pagination-controls .btn-outline-primary {
        border-color: #dee2e6;
        color: #6c757d;
        background-color: white;
        transition: all 0.15s ease-in-out;
      }
      
      .pagination-controls .btn-outline-primary:hover:not(:disabled) {
        background-color: #e9ecef;
        border-color: #adb5bd;
        color: #495057;
      }
      
      .pagination-controls .btn-outline-primary:disabled {
        background-color: #f8f9fa;
        border-color: #e9ecef;
        color: #adb5bd;
        cursor: not-allowed;
      }
      
      .pagination-controls .btn-primary {
        background-color: #0d6efd;
        border-color: #0d6efd;
        color: white;
        font-weight: 600;
      }
      
      .pagination-controls .form-select-sm {
        border-color: #dee2e6;
        background-color: #f8f9fa;
        transition: all 0.15s ease-in-out;
      }
      
      .pagination-controls .form-select-sm:focus {
        border-color: #86b7fe;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      }
      
      /* Table row transition for smooth interactions */
      .table tbody tr {
        transition: all 0.2s ease-in-out;
      }
      
      /* Improved scrollbar styling */
      .table-responsive::-webkit-scrollbar {
        width: 12px;
        height: 12px;
      }
      
      .table-responsive::-webkit-scrollbar-track {
        background: #f1f1f1;
        border-radius: 6px;
      }
      
      .table-responsive::-webkit-scrollbar-thumb {
        background: #c1c1c1;
        border-radius: 6px;
        border: 2px solid #f1f1f1;
      }
      
      .table-responsive::-webkit-scrollbar-thumb:hover {
        background: #a8a8a8;
      }
      
      .table-responsive::-webkit-scrollbar-corner {
        background: #f1f1f1;
      }
      
      /* Better table borders */
      .table-bordered {
        border: 2px solid #dee2e6;
      }
      
      .table-bordered th,
      .table-bordered td {
        border: 1px solid #dee2e6;
      }
      
      /* Enhanced sticky header */
      .table thead th {
        position: sticky;
        top: 0;
        z-index: 10;
        background-color: #0000FF !important;
        color: white !important;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      /* Enhanced sticky footer */
      .table tfoot tr {
        position: sticky;
        bottom: 0;
        z-index: 10;
        box-shadow: 0 -2px 4px rgba(0,0,0,0.1);
      }
    `
    document.head.appendChild(styleElement)

    const loadLedgers = async () => {
      try {
        setLedgerLoading(true)
        await Fn_FillListData(
          dispatch,
          setState,
          "LedgerArray",
          API_URL + "/Id/0"
        )
        Fn_FillListData(
          dispatch,
          setState,
          "TaxAccountArray",
          API_URL1 + "/Id/0"
        )
        Fn_FillListData(dispatch, setState, "UnitArray", API_URL2 + "/Id/0")
        Fn_FillListData(dispatch, setState, "ItemArray", API_URL3 + "/Id/0")
        Fn_FillListData(dispatch, setState, "MonthArray", API_URL4 + "/Id/0")
        Fn_FillListData(dispatch, setState, "GlobalArray", API_URL7 + "/Id/0")
        Fn_FillListData(
          dispatch,
          setState,
          "VoucherNoArray",
          API_URL5 + "/Id/0"
        )
        Fn_FillListData(dispatch, setState, "VoucherHArray", API_URL6 + "/Id/0")

        setLedgerLoading(false)
      } catch (error) {
        console.error("Error loading ledgers:", error)
        toast.error("Failed to load ledgers")
        setLedgerLoading(false)
      }
    }

    loadLedgers()

    // Cleanup function to remove the style element
    return () => {
      if (styleElement.parentNode) {
        styleElement.parentNode.removeChild(styleElement)
      }
    }
  }, [dispatch, API_URL])

  // Set first ledger as selected when LedgerArray is loaded and fetch initial data
  useEffect(() => {
    if (state.LedgerArray && state.LedgerArray.length > 0 && !selectedLedger) {
      const firstLedgerId = state.LedgerArray[0].Id.toString()
      setSelectedLedger(firstLedgerId)
    }
  }, [state.LedgerArray])

  // Auto-fetch data whenever selectedLedger changes (including initial load)
  useEffect(() => {
    if (selectedLedger && state.LedgerArray && state.LedgerArray.length > 0) {
      fetchReportData()
    }
  }, [selectedLedger])

  // Auto-fetch data when any filter changes (excluding multi-select items)
  useEffect(() => {
    if (selectedLedger && state.LedgerArray && state.LedgerArray.length > 0) {
      fetchReportData(null, true)
    }
  }, [
    selectedParty,
    selectedTax,
    selectedItem,
    selectedPeriod,
    fromDate,
    toDate,
    state.Pending,
    state.NotStarted,
    state.Completed,
    state.LAP,
    state.LIP,
  ])

  useEffect(() => {
    if (selectedLedger && state.LedgerArray && state.LedgerArray.length > 0) {
      fetchReportData(null, false)
    }
  }, [selectedItems])

  // Note: selectedParties is intentionally NOT in the dependency arrays
  // because party filtering happens on frontend only, not via API call

  // Debounced auto-fetch for text inputs (Vessel and DeliveryPort)
  useEffect(() => {
    if (selectedLedger && state.LedgerArray && state.LedgerArray.length > 0) {
      const timeoutId = setTimeout(() => {
        fetchReportData()
      }, 500) // 500ms delay for text inputs

      return () => clearTimeout(timeoutId)
    }
  }, [state.Vessel, state.DeliveryPort])

  // Handle navigation state from NewLedgerReport (or contractIds for "sirf payload wale contracts")
  useEffect(() => {
    if (location.state) {
      const { ledgerIds: navLedgerIds, ledgerNames, fromDate, toDate, itemIds, contractIds, completed, notStarted, pending } = location.state

      // Apply filter overrides from nav (Completed: false, NotStarted: true, Pending: true when coming from NewLedgerReport)
      const filterOverrides = (completed !== undefined || notStarted !== undefined || pending !== undefined)
        ? {
          completed: completed !== undefined ? Boolean(completed) : false,
          notStarted: notStarted !== undefined ? Boolean(notStarted) : true,
          pending: pending !== undefined ? Boolean(pending) : true,
        }
        : null
      if (filterOverrides) {
        setState(prev => ({
          ...prev,
          Completed: filterOverrides.completed,
          NotStarted: filterOverrides.notStarted,
          Pending: filterOverrides.pending,
        }))
      }

      // Prefer comma-separated ledgerIds from NewLedgerReport (no dependency on LedgerArray)
      if (navLedgerIds && typeof navLedgerIds === 'string' && navLedgerIds.trim()) {
        const ledgerIdsStr = navLedgerIds.trim()
        const ledgerIdList = ledgerIdsStr.split(",").map(id => id.trim()).filter(id => id)
        if (ledgerIdList.length > 0) {
          setSelectedLedger(ledgerIdList.join(","))
          setLedgerDropdown(ledgerIdList)
          if (ledgerNames && typeof ledgerNames === 'string') {
            setSelectedLedgerNames(ledgerNames.split(",").map(name => name.trim()).filter(Boolean))
          }
          const contractIdsStr = Array.isArray(contractIds)
            ? contractIds.join(",")
            : (typeof contractIds === 'string' ? contractIds : '')
          autoFetchLedgerData(ledgerIdsStr, fromDate, toDate, itemIds, contractIdsStr, filterOverrides)
        }
      } else if (ledgerNames && state.LedgerArray.length > 0) {
        // Fallback: convert ledger names to IDs when LedgerArray is loaded
        const ledgerNameList = ledgerNames.split(",").map(name => name.trim())
        const ledgerIds = ledgerNameList
          .map(name => {
            const ledger = state.LedgerArray.find(l => l.Name === name)
            return ledger ? ledger.Id : null
          })
          .filter(id => id !== null)

        if (ledgerIds.length > 0) {
          setSelectedLedger(ledgerIds.join(","))
          setLedgerDropdown(ledgerIds)
          setSelectedLedgerNames(ledgerNameList)
          const contractIdsStr = Array.isArray(contractIds)
            ? contractIds.join(",")
            : (typeof contractIds === 'string' ? contractIds : '')
          autoFetchLedgerData(ledgerIds.join(","), fromDate, toDate, itemIds, contractIdsStr, filterOverrides)
        }
      }

      // Set the dates - ensure they are parsed as local dates, not UTC
      if (fromDate) {
        const parsedFromDate = fromDate instanceof Date
          ? fromDate
          : new Date(fromDate.split('T')[0] + 'T00:00:00')
        setFromDate(parsedFromDate)
      }
      if (toDate) {
        const parsedToDate = toDate instanceof Date
          ? toDate
          : new Date(toDate.split('T')[0] + 'T00:00:00')
        setToDate(parsedToDate)
      }
    }
  }, [location.state, state.LedgerArray])

  // Auto-fetch ledger data function (contractIds = comma-separated IDs; filterOverrides = { completed, notStarted, pending } from nav)
  const autoFetchLedgerData = async (ledgerIds, fromDate, toDate, itemIds, contractIds = '', filterOverrides = null) => {
    try {
      setShouldRefreshItemOptions(true)
      setLoading(true)
      setShowReport(false)

      // Format dates properly - if string, use as is; if Date object, format it
      const formatDate = (date) => {
        if (!date) return ""
        if (typeof date === 'string') return date.split('T')[0]
        return formatDateForInput(date)
      }

      const completed = filterOverrides ? filterOverrides.completed : state.Completed
      const notStarted = filterOverrides ? filterOverrides.notStarted : state.NotStarted
      const pending = filterOverrides ? filterOverrides.pending : state.Pending

      let vformData = new FormData()
      vformData.append("LedgerIds", ledgerIds)
      vformData.append("FromDate", formatDate(fromDate))
      vformData.append("ToDate", formatDate(toDate))
      vformData.append("Completed", completed ? true : false)
      vformData.append("NotStarted", notStarted ? true : false)
      vformData.append("Pending", pending ? true : false)

      const itemIdsCsv = Array.isArray(itemIds)
        ? itemIds.map(id => id?.toString().trim()).filter(id => id).join(",")
        : itemIds
          ? itemIds
            .toString()
            .split(",")
            .map(id => id.trim())
            .filter(id => id)
            .join(",")
          : ""
      vformData.append("ItemIds", itemIdsCsv)

      const contractIdsStr = typeof contractIds === 'string' ? contractIds.trim() : (Array.isArray(contractIds) ? contractIds.join(",") : '')
      if (contractIdsStr) vformData.append("ContractIds", contractIdsStr)

      const result = await Fn_GetReport(
        dispatch,
        setState,
        "FillArray",
        API_URL_Get,
        { arguList: { id: 0, formData: vformData } },
        true
      )

      // Fetch period data for dropdown (pass filter overrides so NotLifted/PartialLift/FullLift match)
      await fetchPeriodData(
        ledgerIds,
        formatDate(fromDate),
        formatDate(toDate),
        itemIdsCsv,
        filterOverrides ? { completed, notStarted, pending } : null
      )

      setShowReport(true)
    } catch (error) {
      console.error("Error auto-fetching ledger data:", error)
      toast.error("Error loading ledger data")
    } finally {
      setLoading(false)
    }
  }

  // Fetch period data for dropdown (filterOverrides = { completed, notStarted, pending } when from nav)
  const fetchPeriodData = async (ledgerIds, fromDate, toDate, itemIds, filterOverrides = null) => {
    try {
      const notStarted = filterOverrides ? filterOverrides.notStarted : state.NotStarted
      const pending = filterOverrides ? filterOverrides.pending : state.Pending
      const completed = filterOverrides ? filterOverrides.completed : state.Completed

      let vformData = new FormData()
      vformData.append("LedgerIds", ledgerIds)
      // fromDate and toDate are already formatted strings here
      vformData.append("FromDate", fromDate || "")
      vformData.append("ToDate", toDate || "")
      vformData.append("ItemIds", itemIds || "")
      vformData.append("NotLifted", notStarted ? true : false)
      vformData.append("PartialLift", pending ? true : false)
      vformData.append("FullLift", completed ? true : false)

      await Fn_GetReport(
        dispatch,
        setState,
        "PeriodDataArray",
        API_URL_PeriodData,
        { arguList: { id: 0, formData: vformData } },
        true
      )
    } catch (error) {
      console.error("Error fetching period data:", error)
    }
  }

  // Modal functions
  const openEditContractModal = contractData => {
    setSelectedContractData(contractData)
    setShowEditContractModal(true)
    setModalLoading(true)

    // Set loading to false after a short delay to simulate loading
    setTimeout(() => {
      setModalLoading(false)
    }, 1000)
  }

  const closeEditContractModal = () => {
    setShowEditContractModal(false)
    setSelectedContractData(null)
    setModalLoading(false)
  }

  // Voucher Modal functions
  const openVoucherModal = (mode = "save", voucherId = null) => {
    setVoucherMode(mode)
    setVoucherErrors({})
    setVoucherSearchTerm("")

    if (mode === "save") {
      // Save mode: Get next voucher number from VoucherNoArray
      const nextVoucherNo =
        state.VoucherNoArray && state.VoucherNoArray.length > 0
          ? state.VoucherNoArray[0]?.VoucherNoNew || ""
          : ""

      setVoucherData({
        id: 0,
        VoucherNo: nextVoucherNo,
        VoucherDate: new Date(),
        F_LedgerMasterDr: "",
        F_LedgerMasterCr: "",
        Amount: "",
        Narration: "",
      })
    } else if (mode === "edit" && voucherId) {
      // Edit mode: Find voucher data from VoucherHArray
      const voucherToEdit = state.VoucherHArray.find(v => v.Id === voucherId)
      if (voucherToEdit) {
        setVoucherData({
          id: voucherToEdit.Id,
          VoucherNo: voucherToEdit.VoucherNo || "",
          VoucherDate: voucherToEdit.VoucherDate
            ? new Date(voucherToEdit.VoucherDate)
            : new Date(),
          F_LedgerMasterDr: voucherToEdit.F_LedgerMasterDr || "",
          F_LedgerMasterCr: voucherToEdit.F_LedgerMasterCr || "",
          Amount: voucherToEdit.Amount || "",
          Narration: voucherToEdit.Narration || "",
        })
      }
    }

    setShowVoucherModal(true)
  }

  const closeVoucherModal = () => {
    setShowVoucherModal(false)
    setVoucherMode("save")
    setVoucherData({
      id: 0,
      VoucherNo: "",
      VoucherDate: "",
      F_LedgerMasterDr: "",
      F_LedgerMasterCr: "",
      Amount: "",
      Narration: "",
    })
    setVoucherErrors({})
    setVoucherSearchTerm("")
  }

  const handleSaveVoucher = async e => {
    e.preventDefault()

    // Validate form before submission
    if (!validateVoucherForm()) {
      toast.error("Please fix the errors in the form")
      return
    }

    setVoucherLoading(true)

    try {
      if (voucherMode === "save") {
        // Save new voucher
        let vformData = new FormData()
        vformData.append("F_LedgerMasterDr", voucherData.F_LedgerMasterDr || 0)
        vformData.append("F_LedgerMasterCr", voucherData.F_LedgerMasterCr || 0)
        vformData.append("Amount", voucherData.Amount || 0)
        vformData.append("Narration", voucherData.Narration || "")
        vformData.append(
          "VoucherDate",
          voucherData.VoucherDate
            ? voucherData.VoucherDate.toISOString().split("T")[0]
            : ""
        )
        vformData.append("VoucherNo", voucherData.VoucherNo || "")

        const res = await Fn_AddEditData(
          dispatch,
          setState,
          { arguList: { id: 0, formData: vformData } },
          API_URL_SAVE,
          true,
          "LedgerReport",
          navigate,
          "#"
        )

        if (res) {
          toast.success("Voucher saved successfully!")
          // Refresh voucher data
          await Promise.all([
            Fn_FillListData(
              dispatch,
              setState,
              "VoucherHArray",
              API_URL6 + "/Id/0"
            ),
            Fn_FillListData(
              dispatch,
              setState,
              "VoucherNoArray",
              API_URL5 + "/Id/0"
            ),
          ])
          // Reset form for new voucher
          setVoucherData({
            id: 0,
            VoucherNo:
              state.VoucherNoArray && state.VoucherNoArray.length > 0
                ? state.VoucherNoArray[0]?.VoucherNoNew || ""
                : "",
            VoucherDate: new Date(),
            F_LedgerMasterDr: "",
            F_LedgerMasterCr: "",
            Amount: "",
            Narration: "",
          })
          setVoucherMode("save")
          setVoucherErrors({})
        }
      } else if (voucherMode === "edit") {
        // Update existing voucher
        let vformData = new FormData()
        vformData.append("F_LedgerMasterDr", voucherData.F_LedgerMasterDr || 0)
        vformData.append(
          "VoucherDate",
          voucherData.VoucherDate
            ? voucherData.VoucherDate.toISOString().split("T")[0]
            : ""
        )
        vformData.append("F_LedgerMasterCr", voucherData.F_LedgerMasterCr || 0)
        vformData.append("Amount", voucherData.Amount || 0)
        vformData.append("Narration", voucherData.Narration || "")
        vformData.append("VoucherNo", voucherData.VoucherNo || "")

        const res = await Fn_AddEditData(
          dispatch,
          setState,
          { arguList: { id: voucherData.id, formData: vformData } },
          API_URL_SAVE,
          true,
          "LedgerReport",
          navigate,
          "#"
        )

        if (res) {
          toast.success("Voucher updated successfully!")
          // Refresh voucher data
          await Promise.all([
            Fn_FillListData(
              dispatch,
              setState,
              "VoucherHArray",
              API_URL6 + "/Id/0"
            ),
            Fn_FillListData(
              dispatch,
              setState,
              "VoucherNoArray",
              API_URL5 + "/Id/0"
            ),
          ])
          closeVoucherModal()
        }
      }
    } catch (error) {
      console.error("Error saving voucher:", error)
      toast.error("Failed to save voucher")
    } finally {
      setVoucherLoading(false)
    }
  }

  const validateVoucherForm = () => {
    const errors = {}

    if (!voucherData.F_LedgerMasterDr) {
      errors.F_LedgerMasterDr = "Cash/Bank is required"
    }

    if (!voucherData.F_LedgerMasterCr) {
      errors.F_LedgerMasterCr = "Party Name is required"
    }

    if (!voucherData.Amount || parseFloat(voucherData.Amount) <= 0) {
      errors.Amount = "Valid amount is required"
    }

    if (!voucherData.VoucherDate) {
      errors.VoucherDate = "Voucher date is required"
    }

    setVoucherErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleDeleteVoucher = async Id => {
    if (
      window.confirm(
        "Are you sure you want to delete this voucher? This action cannot be undone."
      )
    ) {
      setVoucherLoading(true)
      Fn_DeleteData(dispatch, setState, Id, `${API_URL_Delete}`, true)
      closeVoucherModal()
    }
  }

  function formatDate(date) {
    if (!date) return ""
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")
    return `${year}-${month}-${day}`
  }

  // Get unique items from FillArray
  const buildItemOptions = data => {
    if (!data || data.length === 0) {
      return [{ value: "", label: "All" }]
    }

    const uniqueItemsMap = new Map()
    data.forEach(row => {
      if (row.Item && row.Item.trim() && row.F_ItemType !== null && row.F_ItemType !== undefined) {
        const key = String(row.F_ItemType)
        if (!uniqueItemsMap.has(key)) {
          uniqueItemsMap.set(key, row.Item.trim())
        }
      }
    })

    const items = Array.from(uniqueItemsMap.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }))

    return [{ value: "", label: "All" }, ...items]
  }

  // Calculate totals for a specific ledger group
  const calculateLedgerGroupTotals = groupItems => {
    if (!groupItems || groupItems.length === 0) {
      return {
        totalPurQty: 0,
        totalSelQty: 0,
        purchaseAvgRate: 0,
        sellAvgRate: 0,
      }
    }

    let totalPurQty = 0
    let totalSelQty = 0
    let totalPurchaseWeightedValue = 0
    let totalSellWeightedValue = 0
    let purchaseCount = 0
    let sellCount = 0

    // First pass: Calculate total quantities
    groupItems.forEach(item => {
      const purQty = parseFloat(item.PurQty) || 0
      const selQty = parseFloat(item.SelQty) || 0

      if (item.Status === "P") {
        // Purchase/Buy
        totalPurQty += purQty
        purchaseCount++
      } else if (item.Status === "S") {
        // Sell
        totalSelQty += selQty
        sellCount++
      }
    })

    // Second pass: Calculate weighted average rates
    groupItems.forEach(item => {
      const purQty = parseFloat(item.PurQty) || 0
      const selQty = parseFloat(item.SelQty) || 0
      const rate = parseFloat(item.Rate) || 0

      if (item.Status === "P" && totalPurQty > 0) {
        // Purchase/Buy
        totalPurchaseWeightedValue +=
          (parseFloat(purQty) * parseFloat(rate)) / totalPurQty
      } else if (item.Status === "S" && totalSelQty > 0) {
        // Sell
        totalSellWeightedValue +=
          (parseFloat(selQty) * parseFloat(rate)) / totalSelQty
      }
    })

    return {
      totalPurQty,
      totalSelQty,
      purchaseAvgRate:
        purchaseCount > 0
          ? parseFloat(totalPurchaseWeightedValue.toFixed(2))
          : 0,
      sellAvgRate:
        sellCount > 0 ? parseFloat(totalSellWeightedValue.toFixed(2)) : 0,
    }
  }

  // Calculate cumulative totals from start to hovered row index
  const calculateHoverTotals = (data, hoveredIndex) => {
    if (hoveredIndex === null || !data || data.length === 0) return null

    let allRows = []

    // Flatten all grouped data into individual rows
    data.forEach(group => {
      if (group.items && group.items.length > 0) {
        allRows = allRows.concat(group.items)
      }
    })

    if (hoveredIndex >= allRows.length) return null

    // Calculate cumulative totals up to and including hovered row
    let cumulativeTotals = {
      totalPurQty: 0,
      totalSelQty: 0,
      totalAdvPayment: 0,
      totalLifted: 0,
      avgPurchaseRate: 0,
      avgSellRate: 0,
      avgOverallRate: 0,
      purchaseTransactions: 0,
      sellTransactions: 0,
      totalTransactions: hoveredIndex + 1,
    }

    let purchaseSum = 0
    let sellSum = 0

    for (let i = 0; i <= hoveredIndex; i++) {
      const row = allRows[i]
      if (!row) continue

      const purQty = parseFloat(row.PurQty) || 0
      const selQty = parseFloat(row.SelQty) || 0
      const advPayment = parseFloat(row.AdvPayment) || 0
      const lifted = parseFloat(row.Lifted) || 0
      const rate = parseFloat(row.Rate) || 0

      cumulativeTotals.totalPurQty += purQty
      cumulativeTotals.totalSelQty += selQty
      cumulativeTotals.totalAdvPayment += advPayment
      cumulativeTotals.totalLifted += lifted

      if (purQty > 0) {
        cumulativeTotals.purchaseTransactions++
        purchaseSum += rate
      }
      if (selQty > 0) {
        cumulativeTotals.sellTransactions++
        sellSum += rate
      }
    }

    // Calculate averages
    if (cumulativeTotals.purchaseTransactions > 0) {
      cumulativeTotals.avgPurchaseRate = parseFloat(
        (purchaseSum / cumulativeTotals.purchaseTransactions).toFixed(2)
      )
    }
    if (cumulativeTotals.sellTransactions > 0) {
      cumulativeTotals.avgSellRate = parseFloat(
        (sellSum / cumulativeTotals.sellTransactions).toFixed(2)
      )
    }

    // Calculate overall average rate
    const allRatesSum = allRows
      .slice(0, hoveredIndex + 1)
      .reduce((sum, row) => sum + (parseFloat(row.Rate) || 0), 0)
    cumulativeTotals.avgOverallRate = parseFloat(
      (allRatesSum / cumulativeTotals.totalTransactions).toFixed(2)
    )

    return cumulativeTotals
  }

  // Extract unique parties from Buyer and Seller columns
  const getUniquePartiesFromData = () => {
    if (!state.FillArray || state.FillArray.length === 0) return []

    const partiesSet = new Set()

    state.FillArray.forEach(row => {
      if (row.Buyer && row.Buyer.trim()) {
        partiesSet.add(row.Buyer.trim())
      }
      if (row.Seller && row.Seller.trim()) {
        partiesSet.add(row.Seller.trim())
      }
    })

    // Convert to array of objects with label and value properties
    return Array.from(partiesSet).sort().map(party => ({
      value: party,
      label: party
    }))
  }

  const getRowIdentifier = row => {
    if (!row) return ""
    if (row.Id !== undefined && row.Id !== null) {
      return String(row.Id)
    }
    if (row.AutoId !== undefined && row.AutoId !== null) {
      return String(row.AutoId)
    }
    return [
      row.ContractNo || "NA",
      row.ContractDate || "NA",
      row.Seller || "NA",
      row.Buyer || "NA",
      row.Item || "NA",
      row.Rate || "NA",
    ].join("_")
  }

  const toggleRowSelection = row => {
    const rowId = getRowIdentifier(row)
    if (!rowId) return
    setSelectedRowIds(prev => {
      const updated = new Set(prev)
      if (updated.has(rowId)) {
        updated.delete(rowId)
      } else {
        updated.add(rowId)
      }
      return updated
    })
  }

  // Select all rows by default when FillArray is populated
  useEffect(() => {
    if (state.FillArray && state.FillArray.length > 0) {
      const allRowIds = state.FillArray
        .map(row => getRowIdentifier(row))
        .filter(id => Boolean(id))
      setSelectedRowIds(new Set(allRowIds))
    }
  }, [state.FillArray])

  // Group data by ledger names function - create separate groups for each ledger
  const getGroupedData = data => {
    if (!data || data.length === 0) return data

    // Filter data by selected items if any specific items are selected
    let filteredData = data
    const hasSpecificItemsSelected =
      selectedItems &&
      selectedItems.length > 0 &&
      !(selectedItems.length === 1 && selectedItems[0] === "")

    if (hasSpecificItemsSelected) {
      filteredData = data.filter(row =>
        row.F_ItemType !== null &&
        row.F_ItemType !== undefined &&
        selectedItems.some(selectedItem => String(row.F_ItemType) === String(selectedItem))
      )
    }

    // Filter data by selected parties if any parties are selected
    if (selectedParties && selectedParties.length > 0) {
      filteredData = filteredData.filter(row =>
        selectedParties.some(
          selectedParty =>
            (row.Buyer && row.Buyer.trim().toLowerCase() === selectedParty.toLowerCase()) ||
            (row.Seller && row.Seller.trim().toLowerCase() === selectedParty.toLowerCase())
        )
      )
    }

    // Get all ledger names - prioritize modal selection over navigation
    let ledgerNamesFromNav = []

    // First, check if we have selected ledger names from modal
    if (selectedLedgerNames.length > 0) {
      ledgerNamesFromNav = selectedLedgerNames
    }
    // Otherwise, use navigation state ledger names
    else if (location.state?.ledgerNames) {
      ledgerNamesFromNav = location.state.ledgerNames
        .split(",")
        .map(name => name.trim())
        .filter(Boolean)
    }

    if (ledgerNamesFromNav.length === 0) {
      // Fallback: show all data in one group if no ledger names
      return [
        {
          isGroup: true,
          groupName: "All Records",
          ledgerName: "All Records",
          count: filteredData.length,
          items: filteredData,
          groupByField: "none",
        },
      ]
    }

    let allGroups = []
    let usedContractNos = new Set() // To track which ContractNos have been used

    // Create separate groups for each ledger name
    ledgerNamesFromNav.forEach((ledgerName, index) => {
      // Find items that match this ledger name in either Seller or Buyer
      const matchingItems = filteredData
        .filter(item => {
          const sellerMatch =
            item.Seller &&
            item.Seller.toLowerCase().includes(ledgerName.toLowerCase())
          const buyerMatch =
            item.Buyer &&
            item.Buyer.toLowerCase().includes(ledgerName.toLowerCase())
          return sellerMatch || buyerMatch
        })
        .filter(item => {
          // Only include ContractNos not already used by previous ledgers
          const contractNo = item.ContractNo ? String(item.ContractNo).trim() : null
          return contractNo && !usedContractNos.has(contractNo)
        })
        // Deduplicate: if same ContractNo appears multiple times, keep only the first one
        .filter((item, index, self) => {
          const contractNo = item.ContractNo ? String(item.ContractNo).trim() : null
          if (!contractNo) return false
          return index === self.findIndex(i => String(i.ContractNo).trim() === contractNo)
        })

      // Mark these ContractNos as used
      matchingItems.forEach(item => {
        const contractNo = item.ContractNo ? String(item.ContractNo).trim() : null
        if (contractNo) {
          usedContractNos.add(contractNo)
        }
      })

      if (matchingItems.length > 0) {
        allGroups.push({
          isGroup: true,
          groupName: ledgerName,
          ledgerName: ledgerName,
          ledgerIndex: index + 1,
          count: matchingItems.length,
          items: matchingItems,
          groupByField: "ledger",
        })
      }
    })

    // Add remaining items that don't match any ledger
    const remainingItems = filteredData
      .filter(item => {
        const contractNo = item.ContractNo ? String(item.ContractNo).trim() : null
        return contractNo && !usedContractNos.has(contractNo)
      })
      // Deduplicate: if same ContractNo appears multiple times, keep only the first one
      .filter((item, index, self) => {
        const contractNo = item.ContractNo ? String(item.ContractNo).trim() : null
        if (!contractNo) return false
        return index === self.findIndex(i => String(i.ContractNo).trim() === contractNo)
      })

    if (remainingItems.length > 0) {
      allGroups.push({
        isGroup: true,
        groupName: "Other Records",
        ledgerName: "Other Records",
        count: remainingItems.length,
        items: remainingItems,
        groupByField: "none",
      })
    }

    return allGroups
  }

  // Sort data function
  const getSortedData = data => {
    if (!sortConfig.key) return data

    return [...data].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]

      // Handle numeric values
      if (typeof aVal === "number" || !isNaN(parseFloat(aVal))) {
        aVal = parseFloat(aVal) || 0
        bVal = parseFloat(bVal) || 0
      }

      // Handle date values
      if (sortConfig.key.includes("Date") || sortConfig.key.includes("date")) {
        aVal = new Date(aVal)
        bVal = new Date(bVal)
      }

      if (aVal < bVal) {
        return sortConfig.direction === "asc" ? -1 : 1
      }
      if (aVal > bVal) {
        return sortConfig.direction === "asc" ? 1 : -1
      }
      return 0
    })
  }

  // Process data with grouping and sorting - always grouped
  const processedData = () => {
    if (!state.FillArray || state.FillArray.length === 0) return []

    let data = state.FillArray

    // Always create grouped data structure
    const groupedData = getGroupedData(data)

    // Sort items within each group
    groupedData.forEach(group => {
      group.items = getSortedData(group.items)
    })

    return groupedData
  }

  // Flatten processed data for pagination calculation - always grouped
  const flattenedData = () => {
    const data = processedData()
    // For grouped data, flatten to get total count
    return data.reduce((acc, group) => [...acc, ...group.items], [])
  }

  // Current page data for display - always grouped
  const currentPageData = () => {
    const data = processedData()
    // For grouped data, we'll handle pagination in rendering
    return data
  }

  // Pagination calculations - always grouped
  const totalRecords = flattenedData().length
  const totalPages = Math.ceil(totalRecords / rowsPerPage)

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [state.FillArray])

  useEffect(() => {
    if (!state.FillArray) return

    if (shouldRefreshItemOptions) {
      setItemOptions(buildItemOptions(state.FillArray))
    }
  }, [state.FillArray, shouldRefreshItemOptions])

  // Pagination handlers
  const handlePageChange = page => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleRowsPerPageChange = newRowsPerPage => {
    setRowsPerPage(newRowsPerPage)
    setCurrentPage(1) // Reset to first page when changing page size
  }

  // Sorting function
  const handleSort = key => {
    let direction = "asc"
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc"
    }
    setSortConfig({ key, direction })
  }

  const tableData = currentPageData()
  const flattenedVisibleRows = tableData.reduce((acc, group) => {
    if (group && Array.isArray(group.items)) {
      return acc.concat(group.items)
    }
    return acc
  }, [])
  const visibleRowIds = flattenedVisibleRows
    .map(getRowIdentifier)
    .filter(id => Boolean(id))
  const allVisibleRowsSelected =
    visibleRowIds.length > 0 &&
    visibleRowIds.every(id => selectedRowIds.has(id))
  const someVisibleRowsSelected = visibleRowIds.some(id =>
    selectedRowIds.has(id)
  )

  const handleSelectAllVisibleRows = () => {
    if (visibleRowIds.length === 0) return
    setSelectedRowIds(prev => {
      const updated = new Set(prev)
      if (allVisibleRowsSelected) {
        visibleRowIds.forEach(id => updated.delete(id))
      } else {
        visibleRowIds.forEach(id => updated.add(id))
      }
      return updated
    })
  }

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        someVisibleRowsSelected && !allVisibleRowsSelected
    }
  }, [someVisibleRowsSelected, allVisibleRowsSelected])

  // Handle ledger modal OK button
  const handleLedgerModalOk = async () => {
    if (tempLedgerSelection.length === 0) {
      toast.warning("Please select at least one ledger")
      return
    }

    // Convert selected IDs to comma-separated string
    const ledgerIdsString = tempLedgerSelection.join(",")
    setSelectedLedger(ledgerIdsString)
    setLedgerDropdown(tempLedgerSelection)

    // Get ledger names for grouping
    const names = tempLedgerSelection
      .map(id => {
        const ledger = state.LedgerArray.find(l => l.Id === id)
        return ledger ? ledger.Name : null
      })
      .filter(Boolean)

    setSelectedLedgerNames(names)

    // Close modal
    setShowLedgerModal(false)

    toast.success(`${tempLedgerSelection.length} ledger(s) selected`)

    // Auto-fetch report data with the selected ledger IDs
    await fetchReportData(ledgerIdsString)
  }

  // Handle opening ledger modal
  const handleOpenLedgerModal = () => {
    setTempLedgerSelection(ledgerDropdown)
    setLedgerSearchTerm("")
    setShowLedgerModal(true)
  }

  // Handle ledger toggle in modal
  const handleLedgerToggle = (ledgerId) => {
    setTempLedgerSelection(prev =>
      prev.includes(ledgerId)
        ? prev.filter(id => id !== ledgerId)
        : [...prev, ledgerId]
    )
  }

  // Handle select all ledgers
  const handleSelectAllLedgers = () => {
    const filteredLedgers = getFilteredLedgers()
    const allIds = filteredLedgers.map(ledger => ledger.Id)
    setTempLedgerSelection(allIds)
  }

  // Handle deselect all ledgers
  const handleDeselectAllLedgers = () => {
    setTempLedgerSelection([])
  }

  // Handle multi-select item changes with support for the "All" option
  const handleSelectedItemsChange = newSelectedItems => {
    if (!newSelectedItems || newSelectedItems.length === 0) {
      setSelectedItems([])
      return
    }

    let normalized = newSelectedItems.map(item => (item === "" ? "" : String(item)))

    if (normalized.includes("") && normalized.length > 1) {
      normalized = normalized.filter(item => item !== "")
    }

    setSelectedItems(normalized)
  }

  // Filters Modal Handlers - Individual dropdown modals
  const openPartyModal = () => {
    setTempSelectedParties(selectedParties)
    setShowPartyModal(true)
  }

  const closePartyModal = () => {
    setShowPartyModal(false)
  }

  const handlePartyModalDone = () => {
    setSelectedParties(tempSelectedParties)
    setShowPartyModal(false)
  }

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

  const openPeriodModal = () => {
    setTempSelectedPeriod(selectedPeriod)
    setShowPeriodModal(true)
  }

  const closePeriodModal = () => {
    setShowPeriodModal(false)
  }

  const handlePeriodModalDone = () => {
    setSelectedPeriod(tempSelectedPeriod)
    setShowPeriodModal(false)
  }

  const handleTempSelectedItemsChange = newSelectedItems => {
    if (!newSelectedItems || newSelectedItems.length === 0) {
      setTempSelectedItems([])
      return
    }

    let normalized = newSelectedItems.map(item => (item === "" ? "" : String(item)))

    if (normalized.includes("") && normalized.length > 1) {
      normalized = normalized.filter(item => item !== "")
    }

    setTempSelectedItems(normalized)
  }

  // Get filtered ledgers based on search term
  const getFilteredLedgers = () => {
    if (!state.LedgerArray) return []

    if (!ledgerSearchTerm) return state.LedgerArray

    return state.LedgerArray.filter(ledger =>
      ledger.Name && ledger.Name.toLowerCase().includes(ledgerSearchTerm.toLowerCase())
    )
  }

  // Auto-fetch data function
  const fetchReportData = async (overrideLedgerIds = null, refreshItemOptions = true, contractIdsOverride = '') => {
    setShouldRefreshItemOptions(refreshItemOptions)
    // Use override if provided, otherwise use state
    const ledgerIds = overrideLedgerIds || selectedLedger

    // Validate that a ledger is selected
    if (!ledgerIds) {
      return
    }

    setLoading(true)
    setShowReport(false)

    try {
      let vformData = new FormData()
      vformData.append("LedgerIds", ledgerIds)
      vformData.append("F_PartyLedger", selectedParty || 0)
      vformData.append("F_ContractLedger", selectedTax || 0)
      vformData.append("LiftingAfterPeriod", state.LAP ? true : false)
      vformData.append("LiftingInPeriod", state.LIP ? true : false)

      vformData.append("F_ItemMaster", selectedItem || 0)
      const selectedItemIds =
        selectedItems && selectedItems.length > 0
          ? selectedItems.filter(item => item !== "")
          : []
      const itemIdsCsv =
        selectedItemIds.length > 0
          ? selectedItemIds.map(id => id.toString().trim()).filter(id => id !== "").join(",")
          : ""
      vformData.append("ItemIds", itemIdsCsv)

      // Send only the selected period's label (name) to API
      // Send selected periods' labels (names) as comma-separated string in SearchValue, or "All" if nothing selected
      let searchValue = "All"
      if (
        selectedPeriod &&
        selectedPeriod.length > 0 &&
        state.PeriodDataArray &&
        state.PeriodDataArray.length > 0
      ) {
        const selectedPeriodLabels = selectedPeriod
          .map(periodId => {
            const period = state.PeriodDataArray.find(
              p => p.Id === parseInt(periodId)
            )
            return period ? period.Name : null
          })
          .filter(Boolean)

        if (selectedPeriodLabels.length > 0) {
          searchValue = selectedPeriodLabels.join(",")
        }
      }
      vformData.append("SearchValue", searchValue)

      vformData.append("Vessel", state.Vessel || "")

      vformData.append("DeliveryPort", state.DeliveryPort || "")
      vformData.append("Completed", state.Completed ? true : false)
      vformData.append("NotStarted", state.NotStarted ? true : false)
      vformData.append("Pending", state.Pending ? true : false)

      vformData.append("FromDate", formatDateForInput(fromDate) || "")
      vformData.append("ToDate", formatDateForInput(toDate) || "")

      // When contractIds provided, API returns only those contracts (sirf payload wale)
      const contractIdsParam = typeof contractIdsOverride === 'string' && contractIdsOverride.trim()
        ? contractIdsOverride.trim()
        : ''
      if (contractIdsParam) vformData.append("ContractIds", contractIdsParam)

      // Fetch period data for dropdown
      await fetchPeriodData(
        ledgerIds,
        formatDateForInput(fromDate),
        formatDateForInput(toDate),
        itemIdsCsv
      )

      await Fn_GetReport(
        dispatch,
        setState,
        "FillArray",
        API_URL_Get,
        { arguList: { id: 0, formData: vformData } },
        true
      )

      setShowReport(true)
      // Show success toast only if not initial load
      if (state.FillArray && state.FillArray.length > 0) {
        toast.success(`Report updated with ${state.FillArray.length} contracts`)
      }
    } catch (error) {
      console.error("Error generating report:", error)
      toast.error("Failed to generate report")
    } finally {
      setLoading(false)
    }
  }

  const handleSharePDFClick = async () => {
    if (!pendingShareFile || !navigator.share) return
    try {
      await navigator.share({
        title: 'Ledger Report',
        text: 'Please find attached the Ledger Report',
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
  const exportToPDF = () => {
    if (!state.FillArray || state.FillArray.length === 0) {
      toast.error("No data to export")
      return
    }

    if (selectedRowIds.size === 0) {
      toast.warning("Please select at least one contract to export")
      return
    }

    // Open remarks modal
    setRemarks('')
    setShowRemarksModal(true)
  }

  // Generate PDF with jsPDF + jspdf-autotable, then share
  const handleGeneratePDF = async () => {
    if (!state.FillArray || state.FillArray.length === 0) {
      toast.error("No data to export")
      return
    }

    if (selectedRowIds.size === 0) {
      toast.warning("Please select at least one contract to export")
      return
    }

    const rowsForExport = state.FillArray.filter(row =>
      selectedRowIds.has(getRowIdentifier(row))
    )

    if (!rowsForExport || rowsForExport.length === 0) {
      toast.error("Selected contracts are unavailable for export")
      return
    }

    const groupedData = getGroupedData(rowsForExport)
    const selectedLedgerNames =
      ledgerDropdown.length > 0
        ? ledgerDropdown.map(id => state.LedgerArray.find(l => l.Id === id)?.Name || "").join(", ")
        : "All Ledgers"

    const calculateGroupTotals = items => {
      const totals = { purQty: 0, selQty: 0, advPayment: 0, count: items.length }
      items.forEach(item => {
        totals.purQty += parseFloat(item.PurQty || 0)
        totals.selQty += parseFloat(item.SelQty || 0)
        totals.advPayment += parseFloat(item.AdvPayment || 0)
      })
      return totals
    }

    const overallTotals = calculateGroupTotals(rowsForExport)

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const filename = `Ledger_Report_${new Date().toISOString().split('T')[0]}.pdf`

      doc.setFontSize(20)
      doc.text('Ledger Report', 14, 12)
      doc.setFontSize(13)
      doc.text(`Ledger: ${selectedLedgerNames}`, 14, 18)
      doc.text(`Period: ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`, 14, 23)
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28)

      const head = [['Group', 'Contract No', 'Date', 'Seller', 'Buyer', 'Status', 'Item', 'Pur Qty', 'Sel Qty', 'Rate', 'Period', 'Adv Pay', 'Adv Date', 'Note']]
      const body = []
      groupedData.forEach(group => {
        group.items.forEach((row, idx) => {
          body.push([
            idx === 0 ? group.groupName : '',
            row.ContractNo || '',
            row.ContractDate || '',
            (row.Seller || '').substring(0, 12),
            (row.Buyer || '').substring(0, 12),
            row.Status || '',
            (row.Item || '').substring(0, 10),
            row.PurQty != null ? parseFloat(row.PurQty).toFixed(2) : '0.00',
            row.SelQty != null ? parseFloat(row.SelQty).toFixed(2) : '0.00',
            row.Rate != null ? parseFloat(row.Rate).toFixed(2) : '0.00',
            (row.ShipmentOrLifted || '-').substring(0, 8),
            row.AdvPayment != null ? parseFloat(row.AdvPayment).toFixed(2) : '0.00',
            row.AdvDate || '',
            (getCombinedNotes(row) || '').substring(0, 15)
          ])
        })
      })

      body.push(
        ['OVERALL TOTALS', '', '', '', '', '', '', overallTotals.purQty.toFixed(2), overallTotals.selQty.toFixed(2), '', '', overallTotals.advPayment.toFixed(2), '', ''],
        ['Total Records: ' + rowsForExport.length + ' | Groups: ' + groupedData.length, '', '', '', '', '', '', '', '', '', '', '', '', '']
      )

      doc.autoTable({
        head,
        body,
        startY: 34,
        margin: { left: 14 },
        styles: { fontSize: 10 },
        headStyles: { fillColor: [0, 0, 255] },
        alternateRowStyles: { fillColor: [245, 245, 245] }
      })

      let finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 10 : 40
      if (remarks && remarks.trim()) {
        doc.setFontSize(14)
        doc.text('Remarks', 14, finalY)
        finalY += 6
        doc.setFontSize(13)
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

  const exportToExcel = async () => {
    if (!state.FillArray || state.FillArray.length === 0) {
      toast.error("No data to export")
      return
    }

    if (selectedRowIds.size === 0) {
      toast.warning("Please select at least one contract to export")
      return
    }

    const rowsForExport = state.FillArray.filter(row =>
      selectedRowIds.has(getRowIdentifier(row))
    )

    if (!rowsForExport || rowsForExport.length === 0) {
      toast.error("Selected contracts are unavailable for export")
      return
    }

    // Get grouped data
    const groupedData = getGroupedData(rowsForExport)

    const selectedLedgerName =
      state.LedgerArray.find(l => l.Id === parseInt(selectedLedger))?.Name ||
      "Unknown"

    // Calculate totals for each group
    const calculateGroupTotals = items => {
      const totals = {
        purQty: 0,
        selQty: 0,
        advPayment: 0,
        avgPurRate: 0,
        avgSelRate: 0,
        count: items.length,
      }

      items.forEach(item => {
        totals.purQty += parseFloat(item.PurQty || 0)
        totals.selQty += parseFloat(item.SelQty || 0)
        totals.advPayment += parseFloat(item.AdvPayment || 0)
        totals.avgPurRate += parseFloat(item.Rate || 0)
        totals.avgSelRate += parseFloat(item.Rate || 0)
      })

      // Calculate averages
      if (totals.count > 0) {
        totals.avgPurRate = totals.avgPurRate / totals.count
        totals.avgSelRate = totals.avgSelRate / totals.count
      }

      return totals
    }

    // Helper function to get row font color based on lifted status
    const getRowFontColor = row => {
      if (row.Lifted == 0 || row.Lifted == null || row.Lifted == undefined) {
        return "FF6c757d" // Grey - Not started
      } else if (row.Lifted == row.PurQty || row.Lifted == row.SelQty) {
        return "FF0d6efd" // Blue - Fully lifted
      } else if (row.PurQty > row.Lifted || row.SelQty > row.Lifted) {
        return "FFdc3545" // Red - Partially lifted
      }
      return "FF000000" // Black - default
    }

    // Calculate overall totals
    const overallTotals = calculateGroupTotals(rowsForExport)

    // Create a new workbook
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet("Ledger Report")

    // Add title and header info
    let currentRow = 1
    worksheet.mergeCells(`A${currentRow}:S${currentRow}`)
    const titleRow = worksheet.getCell(`A${currentRow}`)
    titleRow.value = "Ledger Report"
    titleRow.font = { bold: true, size: 16 }
    titleRow.alignment = { horizontal: "center" }
    currentRow++

    worksheet.mergeCells(`A${currentRow}:S${currentRow}`)
    const ledgerRow = worksheet.getCell(`A${currentRow}`)
    ledgerRow.value = `Ledger: ${selectedLedgerName}`
    ledgerRow.font = { bold: true }
    currentRow++

    worksheet.mergeCells(`A${currentRow}:S${currentRow}`)
    const periodRow = worksheet.getCell(`A${currentRow}`)
    periodRow.value = `Period: ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}`
    currentRow++

    worksheet.mergeCells(`A${currentRow}:S${currentRow}`)
    const dateRow = worksheet.getCell(`A${currentRow}`)
    dateRow.value = `Generated on: ${new Date().toLocaleString()}`
    currentRow++

    currentRow++ // Empty row

    // Column headers - exactly matching table columns
    const headers = [
      "Contract No",
      "Contract Date",
      "Seller",
      "Buyer",
      "S/P",
      "Tax",
      "Unit",
      "Item",
      "Pur Qty",
      "Sel Qty",
      "Vessel",
      "Rate",
      "Cont Period",
      "Delivery Port",
      "Adv Payment",
      "Adv Date",
      "Lifted",
      "Contract",
      "Note",
    ]

    // Add each group with its data
    groupedData.forEach(group => {
      const groupTotals = calculateGroupTotals(group.items)
      const avgPurQty =
        groupTotals.count > 0
          ? (groupTotals.purQty / groupTotals.count).toFixed(2)
          : "0.00"
      const avgSelQty =
        groupTotals.count > 0
          ? (groupTotals.selQty / groupTotals.count).toFixed(2)
          : "0.00"
      const avgAdvPayment =
        groupTotals.count > 0
          ? (groupTotals.advPayment / groupTotals.count).toFixed(2)
          : "0.00"
      const differenceAmount = (
        groupTotals.selQty * groupTotals.avgSelRate -
        groupTotals.purQty * groupTotals.avgPurRate
      ).toFixed(2)

      // Add group header
      worksheet.mergeCells(`A${currentRow}:S${currentRow}`)
      const groupHeaderCell = worksheet.getCell(`A${currentRow}`)
      groupHeaderCell.value = `${group.groupName} (${group.count} records)`
      groupHeaderCell.font = { bold: true, size: 12, color: { argb: "FF000000" } }
      groupHeaderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }, // White background
      }
      currentRow++

      currentRow++ // Empty row

      // Add column headers for this group
      const headerRow = worksheet.getRow(currentRow)
      headers.forEach((header, index) => {
        const cell = headerRow.getCell(index + 1)
        cell.value = header
        cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF0000FF" }, // Blue background for headers
        }
        cell.alignment = { horizontal: "center", vertical: "middle" }
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        }
      })
      currentRow++

      // Add data rows for this group with white background and colored text
      group.items.forEach(row => {
        const dataRow = worksheet.getRow(currentRow)
        const fontColor = getRowFontColor(row)

        const rowData = [
          row.ContractNo || "",
          row.ContractDate || "",
          row.Seller || "",
          row.Buyer || "",
          row.Status || "",
          row.Tax || "",
          row.Unit || "",
          row.Item || "",
          row.PurQty ? parseFloat(row.PurQty).toFixed(2) : "0.00",
          row.SelQty ? parseFloat(row.SelQty).toFixed(2) : "0.00",
          row.Vessel || "",
          row.Rate ? parseFloat(row.Rate).toFixed(2) : "0.00",
          row.ShipmentOrLifted || "-",
          row.DeliveryPort || "",
          row.AdvPayment ? parseFloat(row.AdvPayment).toFixed(2) : "0.00",
          row.AdvDate || "",
          row.Lifted ? parseFloat(row.Lifted).toFixed(2) : "0.00",
          row.Contract || "",
          getCombinedNotes(row),
        ]

        rowData.forEach((value, index) => {
          const cell = dataRow.getCell(index + 1)
          cell.value = value
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFFFFFFF" }, // White background
          }
          cell.font = {
            color: { argb: fontColor }, // Colored text based on status
          }
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          }
        })
        currentRow++
      })

      currentRow++ // Empty row

      // Add group totals
      const totalsRow = worksheet.getRow(currentRow)
      const totalsData = [
        "Group Totals",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        groupTotals.purQty.toFixed(2),
        groupTotals.selQty.toFixed(2),
        "",
        "",
        "",
        "",
        groupTotals.advPayment.toFixed(2),
        "",
        "",
        "",
        "",
      ]
      totalsData.forEach((value, index) => {
        const cell = totalsRow.getCell(index + 1)
        cell.value = value
        cell.font = { bold: true, color: { argb: "FF000000" } }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" }, // White background
        }
      })
      currentRow++

      // Add group averages
      const averagesRow = worksheet.getRow(currentRow)
      const averagesData = [
        "Group Averages",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        avgPurQty,
        avgSelQty,
        "",
        "",
        "",
        "",
        avgAdvPayment,
        "",
        "",
        "",
        "",
      ]
      averagesData.forEach((value, index) => {
        const cell = averagesRow.getCell(index + 1)
        cell.value = value
        cell.font = { bold: true, color: { argb: "FF000000" } }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" }, // White background
        }
      })
      currentRow++

      // Add difference amount
      const diffRow = worksheet.getRow(currentRow)
      const diffData = [
        "Difference Amount (Sel*AvgSel - Pur*AvgPur)",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        differenceAmount,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
      ]
      diffData.forEach((value, index) => {
        const cell = diffRow.getCell(index + 1)
        cell.value = value
        cell.font = { bold: true, color: { argb: "FF000000" } }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFFFFFFF" }, // White background
        }
      })
      currentRow++

      currentRow += 2 // Two empty rows between groups
    })

    // Add overall totals
    const overallTotalsRow = worksheet.getRow(currentRow)
    const overallTotalsData = [
      "OVERALL TOTALS",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      overallTotals.purQty.toFixed(2),
      overallTotals.selQty.toFixed(2),
      "",
      "",
      "",
      "",
      overallTotals.advPayment.toFixed(2),
      "",
      "",
      "",
      "",
    ]
    overallTotalsData.forEach((value, index) => {
      const cell = overallTotalsRow.getCell(index + 1)
      cell.value = value
      cell.font = { bold: true, color: { argb: "FF000000" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }, // White background
      }
    })
    currentRow++

    // Add overall averages
    const overallAvgRow = worksheet.getRow(currentRow)
    const overallAvgData = [
      "OVERALL AVERAGES",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      (overallTotals.purQty / overallTotals.count).toFixed(2),
      (overallTotals.selQty / overallTotals.count).toFixed(2),
      "",
      "",
      "",
      "",
      (overallTotals.advPayment / overallTotals.count).toFixed(2),
      "",
      "",
      "",
      "",
    ]
    overallAvgData.forEach((value, index) => {
      const cell = overallAvgRow.getCell(index + 1)
      cell.value = value
      cell.font = { bold: true, color: { argb: "FF000000" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }, // White background
      }
    })
    currentRow++

    // Add overall difference amount
    const overallDifferenceAmount = (
      overallTotals.selQty * overallTotals.avgSelRate -
      overallTotals.purQty * overallTotals.avgPurRate
    ).toFixed(2)
    const overallDiffRow = worksheet.getRow(currentRow)
    const overallDiffData = [
      "OVERALL DIFFERENCE AMOUNT",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      overallDifferenceAmount,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]
    overallDiffData.forEach((value, index) => {
      const cell = overallDiffRow.getCell(index + 1)
      cell.value = value
      cell.font = { bold: true, color: { argb: "FF000000" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFFFFF" }, // White background
      }
    })
    currentRow++

    currentRow++ // Empty row
    worksheet.getCell(`A${currentRow}`).value = `Total Records: ${rowsForExport.length}`
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    currentRow++
    worksheet.getCell(`A${currentRow}`).value = `Total Groups: ${groupedData.length}`
    worksheet.getCell(`A${currentRow}`).font = { bold: true }

    // Auto-fit columns based on actual data content - precise calculation
    worksheet.columns.forEach((column, columnIndex) => {
      let maxDataLength = 0
      let sampleCount = 0
      const maxSamples = 100 // Check first 100 rows for performance

      // Check header length first
      const headerLength = headers[columnIndex] ? headers[columnIndex].length : 0
      maxDataLength = headerLength

      // Check actual data in cells
      column.eachCell({ includeEmpty: false }, (cell, rowNumber) => {
        // Skip header rows and title rows (first 5 rows typically)
        if (rowNumber <= 5) return

        if (cell.value !== null && cell.value !== undefined && cell.value !== "") {
          sampleCount++
          if (sampleCount > maxSamples) return // Stop after checking enough samples

          let cellValue = ""

          // Handle different data types
          if (typeof cell.value === 'number') {
            // For numbers, use the formatted string length
            cellValue = cell.value.toString()
          } else if (typeof cell.value === 'object' && cell.value instanceof Date) {
            cellValue = cell.value.toLocaleDateString()
          } else {
            cellValue = String(cell.value)
          }

          // Use actual character length (Excel uses character count, not pixels)
          const valueLength = cellValue.length
          maxDataLength = Math.max(maxDataLength, valueLength)
        }
      })

      // Calculate width: Excel width = character count + small padding
      // Excel column width is measured in characters (approximately)
      // Add minimal padding (1-2 characters) for readability
      const padding = 1.5 // Minimal padding
      let calculatedWidth = maxDataLength + padding

      // Set reasonable minimums based on column type
      const columnName = headers[columnIndex] || ""
      let minWidth = 8 // Default minimum

      if (columnName.includes("Qty") || columnName.includes("Rate") || columnName.includes("Payment") || columnName.includes("Lifted")) {
        minWidth = 12 // Numeric columns need a bit more
      } else if (columnName.includes("Date")) {
        minWidth = 12 // Date columns
      } else if (columnName.includes("Contract") || columnName.includes("Seller") || columnName.includes("Buyer")) {
        minWidth = 15 // Name columns
      } else if (columnName.includes("Note")) {
        minWidth = 20 // Note column can be wider
      } else {
        minWidth = Math.max(headerLength + 1, 8) // At least header length + 1
      }

      // Set maximum width to prevent extremely wide columns
      const maxWidth = columnName.includes("Note") ? 50 : 25 // Note can be wider, others limited

      // Final width: ensure it's between min and max
      column.width = Math.max(minWidth, Math.min(calculatedWidth, maxWidth))
    })

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const fileName = `ledger_report_${selectedLedgerName.replace(/[^a-zA-Z0-9]/g, "_")}_${fromDate.toISOString().split("T")[0]
      }_${toDate.toISOString().split("T")[0]}.xlsx`

    // Share or download
    const file = new File([blob], fileName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })

    if (navigator.share) {
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: 'Ledger Report',
            text: 'Please find attached the Ledger Report',
            files: [file]
          })
          toast.success("Excel file shared successfully!")
          return
        }
      } catch (shareError) {
        if (shareError.name !== 'AbortError') {
          console.error('Share error:', shareError)
        }
      }
    }

    // Fallback: download
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", fileName)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Excel exported successfully with colored rows!")
  }

  return (
    <div
      className="ledger-report-container"
      style={{
        height: "100vh",
        marginTop: "0",
        paddingTop: "40px",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        paddingBottom: "0",
      }}
    >
      {/* <Breadcrumbs title={breadCrumbTitle} breadcrumbItem={breadcrumbItem} /> */}

      <div className="col-12" style={{ flex: "0 0 auto", marginBottom: "0" }}>
        <div className="card border-0 shadow-sm" style={{ marginBottom: "0" }}>
          <div className="card-body" style={{ padding: "0.25rem" }}>
            <div style={{ overflowX: "auto", overflowY: "hidden" }}>
              <Row className="g-0 align-items-center" style={{ backgroundColor: "#E3F2FD", padding: "4px", borderRadius: "4px", flexWrap: "nowrap", minWidth: "fit-content", border: "1px solid #2196F3" }}>
                {/* Red, Blue, Black checkboxes - first */}
                <Col xs="auto" lg={2} md={2} style={{ flex: "0 0 auto" }}>
                  <div
                    style={{
                      border: "1px solid #2196F3",
                      borderRadius: "4px",
                      padding: "2px 1px",
                      backgroundColor: "#E3F2FD",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "nowrap",
                      gap: "0",
                      height: "28px",
                      minWidth: "fit-content",
                    }}
                  >
                    <div className="form-check" style={{ display: "flex", alignItems: "center", gap: "1px", marginRight: "0" }}>
                      <input
                        id="Pending"
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: "12px", height: "12px", margin: "0" }}
                        checked={state.Pending}
                        onClick={e => {
                          setState(prev => ({
                            ...prev,
                            Pending: !prev.Pending,
                          }))
                        }}
                      />
                      <label
                        className="form-check-label small mb-0"
                        htmlFor="Pending"
                        style={{ fontSize: "0.55rem", color: "#dc3545", fontWeight: "bold", whiteSpace: "nowrap" }}
                      >
                        <i className="fas fa-hourglass-half" style={{ fontSize: "0.5rem" }}></i>R:{state.Pending ? "Y" : "N"}
                      </label>
                    </div>

                    <div className="form-check" style={{ display: "flex", alignItems: "center", gap: "1px", marginRight: "0" }}>
                      <input
                        id="NotStarted"
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: "12px", height: "12px", margin: "0" }}
                        checked={state.NotStarted}
                        onClick={e => {
                          setState(prev => ({
                            ...prev,
                            NotStarted: !prev.NotStarted,
                          }))
                        }}
                      />
                      <label
                        className="form-check-label small mb-0"
                        htmlFor="NotStarted"
                        style={{ fontSize: "0.55rem", color: "#000000", fontWeight: "bold", whiteSpace: "nowrap" }}
                      >
                        <i className="fas fa-clock" style={{ fontSize: "0.5rem" }}></i>Bk:{state.NotStarted ? "Y" : "N"}
                      </label>
                    </div>

                    <div className="form-check" style={{ display: "flex", alignItems: "center", gap: "1px" }}>
                      <input
                        id="Completed"
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: "12px", height: "12px", margin: "0" }}
                        onChange={e => {
                          setState(prev => ({
                            ...prev,
                            Completed: e.target.checked,
                          }))
                        }}
                      />
                      <label
                        className="form-check-label small mb-0"
                        htmlFor="Completed"
                        style={{ fontSize: "0.55rem", color: "#007bff", fontWeight: "bold", whiteSpace: "nowrap" }}
                      >
                        <i className="fas fa-check-circle" style={{ fontSize: "0.5rem" }}></i>Bl:{state.Completed ? "Y" : "N"}
                      </label>
                    </div>
                  </div>
                </Col>

                <Col xs="auto" lg={2} md={2} style={{ flex: "0 0 auto", marginLeft: "4px" }}>
                  <FormGroup className="mb-0">
                    <div style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                      <input
                        type="date"
                        value={formatDateForInput(fromDate)}
                        onChange={e => {
                          if (e.target.value) {
                            setFromDate(new Date(e.target.value + 'T00:00:00'))
                          }
                        }}
                        className="form-control form-control-sm"
                        style={{
                          backgroundColor: "#E3F2FD",
                          fontSize: "0.6rem",
                          fontWeight: "bold",
                          border: "1px solid #2196F3",
                          height: "28px",
                          padding: "2px 2px",
                          width: "4.5rem",
                          minWidth: "4.5rem",
                          color: "#333",
                        }}
                      />
                      <span style={{ fontSize: "0.6rem", fontWeight: "500", color: "#1976D2", margin: "0 2px" }}>To</span>
                      <input
                        type="date"
                        value={formatDateForInput(toDate)}
                        onChange={e => {
                          if (e.target.value) {
                            setToDate(new Date(e.target.value + 'T00:00:00'))
                          }
                        }}
                        className="form-control form-control-sm"
                        style={{
                          backgroundColor: "#E3F2FD",
                          fontSize: "0.6rem",
                          fontWeight: "bold",
                          border: "1px solid #2196F3",
                          height: "28px",
                          padding: "2px 2px",
                          width: "4.5rem",
                          minWidth: "4.5rem",
                          color: "#333",
                        }}
                      />
                    </div>
                  </FormGroup>
                </Col>

                <Col xs="auto" lg={1} md={1} style={{ flex: "0 0 auto", marginLeft: "4px" }}>
                  <FormGroup className="mb-0">
                    <Button
                      variant="outline-primary"
                      onClick={handleOpenLedgerModal}
                      style={{
                        fontSize: "0.55rem",
                        height: "28px",
                        padding: "2px 4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "#E3F2FD",
                        border: "1px solid #2196F3",
                        color: "#1976D2",
                        whiteSpace: "nowrap",
                        minWidth: "fit-content",
                      }}
                    >
                      Ledger
                      <i className="fas fa-chevron-down" style={{ fontSize: "0.5rem", marginLeft: "2px" }}></i>
                    </Button>
                  </FormGroup>
                </Col>

                <Col xs="auto" style={{ flex: "0 0 auto", marginLeft: "4px" }}>
                  <Button
                    color="info"
                    style={{
                      fontSize: "0.55rem",
                      height: "28px",
                      padding: "2px 6px",
                      minWidth: "50px",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => window.open('/VoucherList', '_blank')}
                  >
                    <i className="fas fa-receipt"></i>Vch
                  </Button>
                </Col>

                <Col xs="auto" style={{ flex: "0 0 auto", marginLeft: "4px" }}>
                  <Button
                    variant="success"
                    style={{
                      fontSize: "0.6rem",
                      height: "28px",
                      padding: "2px 6px",
                      minWidth: "32px",
                    }}
                    onClick={() => window.open('/Contract', '_blank')}
                  >
                    <i className="fas fa-plus"></i>
                  </Button>
                </Col>

                <Col xs="auto" style={{ flex: "0 0 auto", marginLeft: "4px" }}>
                  <div
                    style={{
                      border: "1px solid #2196F3",
                      borderRadius: "4px",
                      padding: "2px 3px",
                      backgroundColor: "#E3F2FD",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "nowrap",
                      height: "28px",
                      minWidth: "fit-content",
                    }}
                  >
                    <div className="form-check" style={{ display: "flex", alignItems: "center", gap: "1px", marginRight: "2px" }}>
                      <input
                        id="LAP"
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: "12px", height: "12px", margin: "0" }}
                        onClick={e => {
                          const newLapValue = !state.LAP
                          setState(prev => ({
                            ...prev,
                            LAP: newLapValue,
                          }))
                          handleLapLipDateChange(newLapValue, state.LIP)
                        }}
                        checked={state.LAP}
                      />
                      <label
                        className="form-check-label small mb-0"
                        htmlFor="LAP"
                        style={{ fontSize: "0.55rem", color: "#28a745", fontWeight: "bold", whiteSpace: "nowrap" }}
                      >
                        <i className="fas fa-check-circle" style={{ fontSize: "0.5rem" }}></i>LAP:{state.LAP ? "Y" : "N"}
                      </label>
                    </div>

                    <div className="form-check" style={{ display: "flex", alignItems: "center", gap: "1px" }}>
                      <input
                        id="LIP"
                        type="checkbox"
                        className="form-check-input"
                        style={{ width: "12px", height: "12px", margin: "0" }}
                        onClick={e => {
                          const newLipValue = !state.LIP
                          setState(prev => ({
                            ...prev,
                            LIP: newLipValue,
                          }))
                          handleLapLipDateChange(state.LAP, newLipValue)
                        }}
                        checked={state.LIP}
                      />
                      <label
                        className="form-check-label small mb-0"
                        htmlFor="LIP"
                        style={{ fontSize: "0.55rem", color: "#dc3545", fontWeight: "bold", whiteSpace: "nowrap" }}
                      >
                        <i className="fas fa-check-circle" style={{ fontSize: "0.5rem" }}></i>LIP:{state.LIP ? "Y" : "N"}
                      </label>
                    </div>
                  </div>
                </Col>

                <Col xs="auto" lg={3} md={3} style={{ flex: "0 0 auto", marginLeft: "4px" }}>
                  <div
                    style={{
                      border: "1px solid #2196F3",
                      borderRadius: "4px",
                      padding: "2px 4px",
                      backgroundColor: "#E3F2FD",
                      height: "28px",
                      display: "flex",
                      alignItems: "center",
                      minWidth: "fit-content",
                    }}
                  >
                    <label
                      className="fw-bold small mb-0"
                      style={{ fontSize: "0.55rem", whiteSpace: "nowrap", marginRight: "2px", color: "#1976D2" }}
                    >
                      <i className="fas fa-sticky-note" style={{ fontSize: "0.5rem" }}></i>Note:
                    </label>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <div className="form-check" style={{ display: "flex", alignItems: "center", margin: "0" }}>
                        <input
                          id="note1"
                          type="checkbox"
                          className="form-check-input"
                          style={{ width: "10px", height: "10px", margin: "0 1px" }}
                          onClick={e => {
                            setVisibleNotes(prev => ({
                              ...prev,
                              Note1: !prev.Note1,
                            }))
                          }}
                          checked={visibleNotes.Note1}
                        />
                        <label className="form-check-label mb-0" htmlFor="note1" style={{ fontSize: "0.5rem" }}>1</label>
                      </div>
                      <div className="form-check" style={{ display: "flex", alignItems: "center", margin: "0" }}>
                        <input
                          id="note2"
                          type="checkbox"
                          className="form-check-input"
                          style={{ width: "10px", height: "10px", margin: "0 1px" }}
                          onClick={e => {
                            setVisibleNotes(prev => ({
                              ...prev,
                              Note2: !prev.Note2,
                            }))
                          }}
                          checked={visibleNotes.Note2}
                        />
                        <label className="form-check-label mb-0" htmlFor="note2" style={{ fontSize: "0.5rem" }}>2</label>
                      </div>
                      <div className="form-check" style={{ display: "flex", alignItems: "center", margin: "0" }}>
                        <input
                          id="note3"
                          type="checkbox"
                          className="form-check-input"
                          style={{ width: "10px", height: "10px", margin: "0 1px" }}
                          onClick={e => {
                            setVisibleNotes(prev => ({
                              ...prev,
                              Note3: !prev.Note3,
                            }))
                          }}
                          checked={visibleNotes.Note3}
                        />
                        <label className="form-check-label mb-0" htmlFor="note3" style={{ fontSize: "0.5rem" }}>3</label>
                      </div>
                      <div className="form-check" style={{ display: "flex", alignItems: "center", margin: "0" }}>
                        <input
                          id="note4"
                          type="checkbox"
                          className="form-check-input"
                          style={{ width: "10px", height: "10px", margin: "0 1px" }}
                          onClick={e => {
                            setVisibleNotes(prev => ({
                              ...prev,
                              Note4: !prev.Note4,
                            }))
                          }}
                          checked={visibleNotes.Note4}
                        />
                        <label className="form-check-label mb-0" htmlFor="note4" style={{ fontSize: "0.5rem" }}>4</label>
                      </div>
                      <div className="form-check" style={{ display: "flex", alignItems: "center", margin: "0" }}>
                        <input
                          id="note5"
                          type="checkbox"
                          className="form-check-input"
                          style={{ width: "10px", height: "10px", margin: "0 1px" }}
                          onClick={e => {
                            setVisibleNotes(prev => ({
                              ...prev,
                              Note5: !prev.Note5,
                            }))
                          }}
                          checked={visibleNotes.Note5}
                        />
                        <label className="form-check-label mb-0" htmlFor="note5" style={{ fontSize: "0.5rem" }}>5</label>
                      </div>
                      <div className="form-check" style={{ display: "flex", alignItems: "center", margin: "0" }}>
                        <input
                          id="note6"
                          type="checkbox"
                          className="form-check-input"
                          style={{ width: "10px", height: "10px", margin: "0 1px" }}
                          onClick={e => {
                            setVisibleNotes(prev => ({
                              ...prev,
                              Note6: !prev.Note6,
                            }))
                          }}
                          checked={visibleNotes.Note6}
                        />
                        <label className="form-check-label mb-0" htmlFor="note6" style={{ fontSize: "0.5rem" }}>6</label>
                      </div>
                      <Button
                        size="sm"
                        variant="outline-secondary"
                        style={{
                          fontSize: "0.45rem",
                          padding: "1px 3px",
                          height: "16px",
                          lineHeight: "1",
                          marginLeft: "2px",
                        }}
                        onClick={() => {
                          const allChecked = Object.values(visibleNotes).every(v => v)
                          toggleAllNotes(!allChecked)
                        }}
                      >
                        All
                      </Button>
                    </div>
                  </div>
                </Col>

                <Col xs="auto" style={{ flex: "0 0 auto", marginLeft: "4px" }}>
                  <Button
                    variant="danger"
                    style={{
                      fontSize: "0.6rem",
                      height: "28px",
                      padding: "2px 8px",
                      minWidth: "55px",
                      whiteSpace: "nowrap",
                    }}
                    onClick={() => window.close()}
                  >
                    <i className="fas fa-times"></i> Exit
                  </Button>
                </Col>
              </Row>
            </div>
          </div>
        </div>
      </div>
      {/* Table Data Section - Full Height Layout */}
      {(showReport || (state.FillArray && state.FillArray.length > 0)) && (
        <div
          className="row ledger-table-section"
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
                {state.FillArray && state.FillArray.length > 0 ? (
                  <>
                    <div
                      ref={tableContainerRef}
                      className="table-responsive position-relative ledger-table-scroll"
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
                        className="table mb-0"
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                              onClick={() => handleSort("ContractNo")}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <div className="d-flex align-items-center gap-1">
                                  <input
                                    type="checkbox"
                                    ref={selectAllRef}
                                    checked={allVisibleRowsSelected}
                                    onClick={e => {
                                      e.stopPropagation()
                                      handleSelectAllVisibleRows()
                                    }}
                                    disabled={visibleRowIds.length === 0}
                                    style={{
                                      width: "12px",
                                      height: "12px",
                                      margin: "0",
                                      cursor: "pointer",
                                    }}
                                    title="Select all visible contracts"
                                  />
                                  <span>Contract No</span>
                                </div>
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                              onClick={() => handleSort("ContractDate")}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>Contract Date</span>
                                <div className="d-flex flex-column">
                                  <i
                                    className={`fas fa-sort-up ${sortConfig.key === "ContractDate" &&
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
                                    className={`fas fa-sort-down ${sortConfig.key === "ContractDate" &&
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
                                border: "1.5px solid black",
                                boxShadow: "none",
                              }}
                              onClick={() => handleSort("Seller")}
                            >
                              <div
                                className="d-flex justify-content-center align-items-center gap-1"
                                style={{ width: "100%" }}
                              >
                                <span>Seller</span>
                                <div className="d-flex flex-column" style={{ lineHeight: "0.5rem" }}>
                                  <i
                                    className={`fas fa-sort-up ${sortConfig.key === "Seller" && sortConfig.direction === "asc"
                                      ? "text-warning"
                                      : "text-light"
                                      }`}
                                    style={{ fontSize: "0.5rem" }}
                                  ></i>
                                  <i
                                    className={`fas fa-sort-down ${sortConfig.key === "Seller" && sortConfig.direction === "desc"
                                      ? "text-warning"
                                      : "text-light"
                                      }`}
                                    style={{ fontSize: "0.5rem" }}
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
                                border: "1.5px solid black",
                                boxShadow: "none",
                              }}
                              onClick={() => handleSort("Buyer")}
                            >
                              <div
                                className="d-flex justify-content-center align-items-center gap-1"
                                style={{ width: "100%" }}
                              >
                                <span>Buyer</span>
                                <div className="d-flex flex-column" style={{ lineHeight: "0.5rem" }}>
                                  <i
                                    className={`fas fa-sort-up ${sortConfig.key === "Buyer" && sortConfig.direction === "asc"
                                      ? "text-warning"
                                      : "text-light"
                                      }`}
                                    style={{ fontSize: "0.5rem" }}
                                  ></i>
                                  <i
                                    className={`fas fa-sort-down ${sortConfig.key === "Buyer" && sortConfig.direction === "desc"
                                      ? "text-warning"
                                      : "text-light"
                                      }`}
                                    style={{ fontSize: "0.5rem" }}
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                              onClick={() => handleSort("Status")}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>S/P</span>
                                <div className="d-flex flex-column">
                                  <i
                                    className={`fas fa-sort-up ${sortConfig.key === "Status" &&
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
                                    className={`fas fa-sort-down ${sortConfig.key === "Status" &&
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                              onClick={() => handleSort("Unit")}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>Unit</span>
                                <div className="d-flex flex-column">
                                  <i
                                    className={`fas fa-sort-up ${sortConfig.key === "Unit" &&
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
                                    className={`fas fa-sort-down ${sortConfig.key === "Unit" &&
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
                                textAlign: "center",
                                border: "1.5px solid black !important",
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                              onClick={() => handleSort("Item")}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span >Item</span>
                                <div className="d-flex flex-column">
                                  <i
                                    className={`fas fa-sort-up ${sortConfig.key === "Item" &&
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
                                    className={`fas fa-sort-down ${sortConfig.key === "Item" &&
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                              onClick={() => handleSort("PurQty")}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>Pur Qty</span>
                                <div className="d-flex flex-column">
                                  <i
                                    className={`fas fa-sort-up ${sortConfig.key === "PurQty" &&
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
                                    className={`fas fa-sort-down ${sortConfig.key === "PurQty" &&
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                              onClick={() => handleSort("SelQty")}
                            >
                              <div className="d-flex justify-content-between align-items-center">
                                <span>Sel Qty</span>
                                <div className="d-flex flex-column">
                                  <i
                                    className={`fas fa-sort-up ${sortConfig.key === "SelQty" &&
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
                                    className={`fas fa-sort-down ${sortConfig.key === "SelQty" &&
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                            >
                              Vessel
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                            >
                              Cont Period
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                            >
                              Delivery Port
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                            >
                              Lifted
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                            >
                              Contract
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
                                borderTop: "1.5px solid black !important",
                                borderRight: "1.5px solid black !important",
                                borderBottom: "1.5px solid black !important",
                                borderLeft: "1.5px solid black !important",
                                boxShadow: "none",
                              }}
                            >
                              Note
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {(() => {
                            const data = tableData
                            // Always render grouped data
                            return data.map((group, groupIndex) => (
                              <React.Fragment key={groupIndex}>
                                {/* Group Header Row with Totals */}
                                {(() => {
                                  const ledgerTotals =
                                    calculateLedgerGroupTotals(group.items)
                                  return (
                                    <tr
                                      style={{
                                        backgroundColor: "#D2B48C",
                                        height: "28px",
                                        border: "1px solid #d2b48c",
                                      }}
                                    >
                                      {/* Group Name - Spans columns 1-6 (ContractNo to Status) */}
                                      <td
                                        colSpan="6"
                                        className="fw-bold border-bottom"
                                        style={{
                                          backgroundColor: "#D2B48C",
                                          color: "#2c3e50",
                                          padding: "2px 8px",
                                          verticalAlign: "middle",
                                          border: "1.5px solid black !important",
                                          boxShadow: "none",
                                        }}
                                      >
                                        <div className="d-flex align-items-center">
                                          <i className="fas fa-users me-2 text-primary"></i>
                                          <span
                                            className="fw-bold"
                                            style={{
                                              color: "red",
                                              fontWeight: "bold",
                                              fontSize: "0.75rem",
                                            }}
                                          >
                                            {group.groupName}
                                          </span>
                                          <small className="text-muted ms-2" style={{ fontSize: "0.65rem" }}>
                                            ({group.count}{" "}
                                            {group.count === 1 ? "record" : "records"})
                                            {(() => {
                                              const groupSelectedCount = group.items.filter(item => {
                                                const rowId = getRowIdentifier(item);
                                                return rowId && selectedRowIds.has(rowId);
                                              }).length;

                                              if (groupSelectedCount > 0) {
                                                return <span className="ms-2" style={{ color: "#0056b3", fontWeight: "bold" }}> | Sel : {groupSelectedCount}</span>;
                                              }
                                              return null;
                                            })()}
                                          </small>
                                        </div>
                                      </td>
                                      {/* Empty - Column 7 (Unit) */}
                                      <td
                                        className="text-center border-bottom"
                                        style={{
                                          backgroundColor: "#D2B48C",
                                          // border: "1.5px solid black !important",
                                          boxShadow: "none",
                                        }}
                                      >
                                      </td>
                                      {/* Empty - Column 8 (Item) */}

                                      {/* Buy Qty - Column 9 (Pur Qty) */}
                                      <td
                                        className="text-center border-bottom"
                                        style={{
                                          backgroundColor: "#D2B48C",
                                          color: "#2c3e50",
                                          padding: "2px 4px",
                                          verticalAlign: "middle",
                                          border: "1.5px solid black !important",
                                          boxShadow: "none",
                                          fontSize: "0.6rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontSize: "0.55rem", color: "#0066cc" }}>Buy Qty</div>
                                          <div style={{ fontSize: "0.65rem", fontWeight: "bold" }}>
                                            {ledgerTotals.totalPurQty.toLocaleString()}
                                          </div>
                                        </div>
                                      </td>
                                      {/* Sell Qty - Column 10 (Sel Qty) */}
                                      <td
                                        className="text-center border-bottom"
                                        style={{
                                          backgroundColor: "#D2B48C",
                                          color: "#2c3e50",
                                          padding: "2px 4px",
                                          verticalAlign: "middle",
                                          border: "1.5px solid black !important",
                                          boxShadow: "none",
                                          fontSize: "0.6rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontSize: "0.55rem", color: "#dc3545" }}>Sell Qty</div>
                                          <div style={{ fontSize: "0.65rem", fontWeight: "bold" }}>
                                            {ledgerTotals.totalSelQty.toLocaleString()}
                                          </div>
                                        </div>
                                      </td>
                                      {/* Buy Avg - Column 11 (Vessel) */}
                                      <td
                                        className="text-center border-bottom"
                                        style={{
                                          backgroundColor: "#D2B48C",
                                          color: "#2c3e50",
                                          padding: "2px 4px",
                                          verticalAlign: "middle",
                                          border: "1.5px solid black !important",
                                          boxShadow: "none",
                                          fontSize: "0.6rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontSize: "0.55rem", color: "#0066cc" }}>Buy Avg</div>
                                          <div style={{ fontSize: "0.65rem", fontWeight: "bold" }}>
                                            ₹{ledgerTotals.purchaseAvgRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                          </div>
                                        </div>
                                      </td>
                                      {/* Sell Avg - Column 12 (Rate) */}
                                      <td
                                        className="text-center border-bottom"
                                        style={{
                                          backgroundColor: "#D2B48C",
                                          color: "#2c3e50",
                                          padding: "2px 4px",
                                          verticalAlign: "middle",
                                          border: "1.5px solid black !important",
                                          boxShadow: "none",
                                          fontSize: "0.6rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontSize: "0.55rem", color: "#dc3545" }}>Sell Avg</div>
                                          <div style={{ fontSize: "0.65rem", fontWeight: "bold" }}>
                                            ₹{ledgerTotals.sellAvgRate.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                                          </div>
                                        </div>
                                      </td>
                                      <td
                                        className="text-center border-bottom"
                                        style={{
                                          backgroundColor: "#D2B48C",
                                          // border: "1.5px solid black !important",
                                          boxShadow: "none",
                                        }}
                                      >
                                      </td>
                                      {/* Diff Amt - Column 13 (Cont Period) */}
                                      <td
                                        className="text-center border-bottom"
                                        style={{
                                          backgroundColor: "#D2B48C",
                                          color: "#2c3e50",
                                          padding: "2px 4px",
                                          verticalAlign: "middle",
                                          border: "1.5px solid black !important",
                                          boxShadow: "none",
                                          fontSize: "0.6rem",
                                          fontWeight: "bold",
                                        }}
                                      >
                                        <div>
                                          <div style={{ fontSize: "0.55rem", color: "#198754" }}>Diff Amt</div>
                                          <div
                                            style={{
                                              fontSize: "0.65rem",
                                              fontWeight: "bold",
                                              color: (() => {
                                                const difference = ledgerTotals.totalSelQty * ledgerTotals.sellAvgRate - ledgerTotals.totalPurQty * ledgerTotals.purchaseAvgRate
                                                return difference >= 0 ? "#198754" : "#dc3545"
                                              })()
                                            }}
                                          >
                                            ₹{parseFloat(
                                              ledgerTotals.totalSelQty * ledgerTotals.sellAvgRate -
                                              ledgerTotals.totalPurQty * ledgerTotals.purchaseAvgRate
                                            ).toFixed(2)}
                                          </div>
                                        </div>
                                      </td>
                                      {/* Copy Button - Columns 14-18 (Delivery Port to Note) */}
                                      <td
                                        colSpan="5"
                                        className="text-end border-bottom"
                                        style={{
                                          backgroundColor: "#D2B48C",
                                          color: "#2c3e50",
                                          padding: "2px 8px",
                                          verticalAlign: "middle",
                                          border: "1.5px solid black !important",
                                          boxShadow: "none",
                                        }}
                                      >
                                        <Button
                                          size="sm"
                                          variant="outline-primary"
                                          style={{
                                            fontSize: "0.6rem",
                                            padding: "3px 8px",
                                          }}
                                          onClick={() => {
                                            // Copy group data to clipboard
                                            const csv = group.items
                                              .map(
                                                row =>
                                                  `"${row.ContractNo}","${row.ContractDate}","${row.Seller}","${row.Buyer}","${row.Status}","${row.Tax}","${row.Unit}","${row.Item}","${row.PurQty}","${row.SelQty}","${row.Vessel}","${row.Rate}","${row.ShipmentDate}","${row.LiftedDate}","${row.DeliveryPort}","${row.AdvPayment}","${row.AdvDate}","${row.Lifted}","${row.Contract}","${getCombinedNotes(row)}"`
                                              )
                                              .join("\n")
                                            navigator.clipboard.writeText(csv)
                                            toast.success(
                                              `Copied ${group.count} records for ${group.groupName} to clipboard`
                                            )
                                          }}
                                          title="Copy group data to clipboard"
                                        >
                                          <i className="fas fa-copy"></i>
                                        </Button>
                                      </td>
                                    </tr>
                                  )
                                })()}
                                {/* Group Items */}
                                {group.items.map((row, rowIndex) => {
                                  // Calculate global row index across all groups
                                  let globalRowIndex = 0
                                  for (let i = 0; i < groupIndex; i++) {
                                    globalRowIndex += data[i].items.length
                                  }
                                  globalRowIndex += rowIndex
                                  const rowId = getRowIdentifier(row)
                                  const isRowSelected = rowId
                                    ? selectedRowIds.has(rowId)
                                    : false

                                  return (
                                    <tr
                                      key={`${groupIndex}-${rowIndex}`}
                                      className={
                                        row.Lifted == 0 ||
                                          row.Lifted == null ||
                                          row.Lifted == undefined
                                          ? "table-secondary fw-semibold" // light grey
                                          : row.Lifted == row.PurQty ||
                                            row.Lifted == row.SelQty
                                            ? "table-info fw-semibold" // light blue
                                            : row.PurQty > row.Lifted ||
                                              row.SelQty > row.Lifted
                                              ? "table-danger fw-semibold" // light red
                                              : ""
                                      }
                                      style={{
                                        height: "25px",
                                        borderBottom: "1px solid #dee2e6",
                                        color: row.Status === "S" ? "red" : "inherit",
                                        fontWeight: row.Status === "S" ? "bold" : "inherit",
                                      }}
                                      onMouseEnter={e => {
                                        setHoveredRowIndex(globalRowIndex)
                                        const rect =
                                          e.currentTarget.getBoundingClientRect()
                                        const tableContainer =
                                          e.currentTarget.closest(
                                            ".table-responsive"
                                          )
                                        const tableRect =
                                          tableContainer.getBoundingClientRect()
                                        const viewportHeight =
                                          window.innerHeight
                                        const totalsHeight = 70 // Height of totals row

                                        // Calculate relative position within table container
                                        const relativeTop =
                                          rect.top - tableRect.top
                                        const relativeBottom =
                                          rect.bottom - tableRect.top

                                        // Check if totals would go outside viewport when shown below
                                        const spaceBelow =
                                          viewportHeight - rect.bottom
                                        const spaceAbove = rect.top

                                        let position
                                        if (
                                          spaceBelow < totalsHeight &&
                                          spaceAbove > totalsHeight
                                        ) {
                                          // Show above the row
                                          position = relativeTop - totalsHeight
                                        } else {
                                          // Show below the row
                                          position = relativeBottom
                                        }

                                        setHoverTotalsPosition({
                                          top: position,
                                          visible: true,
                                        })
                                      }}
                                      onMouseLeave={() => {
                                        setHoveredRowIndex(null)
                                        setHoverTotalsPosition({
                                          top: 0,
                                          visible: false,
                                        })
                                      }}
                                    >
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : "fw-semibold"}
                                        style={{
                                          verticalAlign: "middle",
                                          textAlign: "center",
                                          width: "50px",
                                          padding: "6px 12px",
                                          minWidth: "50px",
                                          border:
                                            "1.5px solid black !important",
                                          borderTop:
                                            "1.5px solid black !important",
                                          borderRight:
                                            "1.5px solid black !important",
                                          borderBottom:
                                            "1.5px solid black !important",
                                          borderLeft:
                                            "1.5px solid black !important",
                                          boxShadow: "none",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.ContractNo ? (
                                          <div className="d-flex align-items-center gap-2">
                                            <input
                                              type="checkbox"
                                              checked={isRowSelected}
                                              onClick={e => {
                                                e.stopPropagation()
                                                toggleRowSelection(row)
                                              }}
                                              style={{
                                                width: "12px",
                                                height: "12px",
                                                margin: "0",
                                                cursor: "pointer",
                                              }}
                                              title="Select contract"
                                            />
                                            <Button
                                              variant="link"
                                              className={`p-0 text-decoration-none ${row.Status === "S" ? "fw-bold" : "fw-bold"} ${row.Status === "S" ? "text-danger" : "text-primary"}`}
                                              style={{
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                border: "none",
                                                background: "none",
                                                padding: "6px 10px",
                                                borderRadius: "4px",
                                                display: "inline-flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                fontSize: "0.8rem",
                                                whiteSpace: "nowrap",
                                                width: "100%",
                                                justifyContent: "flex-start",
                                                color: row.Status === "S" ? "red" : "#0d6efd",
                                                fontWeight: row.Status === "S" ? "bold" : "bold",
                                              }}
                                              onMouseEnter={e => {
                                                if (row.Status === "S") {
                                                  e.target.style.color = "#cc0000"
                                                } else {
                                                  e.target.style.color = "#0056b3"
                                                }
                                                e.target.style.textDecoration =
                                                  "underline"
                                                e.target.style.backgroundColor =
                                                  "#f8f9fa"
                                              }}
                                              onMouseLeave={e => {
                                                if (row.Status === "S") {
                                                  e.target.style.color = "red"
                                                } else {
                                                  e.target.style.color = "#0d6efd"
                                                }
                                                e.target.style.textDecoration =
                                                  "none"
                                                e.target.style.backgroundColor =
                                                  "transparent"
                                              }}
                                              onKeyDown={event => {
                                                if (
                                                  event.key === "Enter" ||
                                                  event.key === " "
                                                ) {
                                                  event.preventDefault()
                                                  event.target.click()
                                                }
                                              }}
                                              onClick={event => {
                                                console.log("Row data:", row)
                                                console.log(
                                                  "Available fields:",
                                                  Object.keys(row)
                                                )

                                                const button =
                                                  event.target.closest("button")
                                                const originalText =
                                                  button.innerHTML
                                                button.innerHTML =
                                                  '<i class="fas fa-spinner fa-spin me-1"></i>Loading...'
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
                                            >
                                              <i className={`fas fa-edit ${row.Status === "S" ? "text-danger" : "text-primary"}`} style={{ color: row.Status === "S" ? "red" : "#0d6efd" }}></i>
                                              <span>{row.ContractNo}</span>
                                            </Button>
                                          </div>
                                        ) : (
                                          "-"
                                        )}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          textAlign: "center",
                                          width: "100px",
                                          minWidth: "100px",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.ContractDate || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.Seller || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.Buyer || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          textAlign: "center",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.Status || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.Unit || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          textAlign: "center",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.Item || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border:
                                            "1.5px solid black !important",
                                          borderTop:
                                            "1.5px solid black !important",
                                          borderRight:
                                            "1.5px solid black !important",
                                          borderBottom:
                                            "1.5px solid black !important",
                                          borderLeft:
                                            "1.5px solid black !important",
                                          boxShadow: "none",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.PurQty
                                          ? parseFloat(row.PurQty).toFixed(2)
                                          : "0.00"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border:
                                            "1.5px solid black !important",
                                          borderTop:
                                            "1.5px solid black !important",
                                          borderRight:
                                            "1.5px solid black !important",
                                          borderBottom:
                                            "1.5px solid black !important",
                                          borderLeft:
                                            "1.5px solid black !important",
                                          boxShadow: "none",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.SelQty
                                          ? parseFloat(row.SelQty).toFixed(2)
                                          : "0.00"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.Vessel || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border:
                                            "1.5px solid black !important",
                                          borderTop:
                                            "1.5px solid black !important",
                                          borderRight:
                                            "1.5px solid black !important",
                                          borderBottom:
                                            "1.5px solid black !important",
                                          borderLeft:
                                            "1.5px solid black !important",
                                          boxShadow: "none",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.Rate
                                          ? parseFloat(row.Rate).toFixed(2)
                                          : "0.00"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "text-center fw-bold" : "text-center"}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.ShipmentOrLifted || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.DeliveryPort || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border:
                                            "1.5px solid black !important",
                                          borderTop:
                                            "1.5px solid black !important",
                                          borderRight:
                                            "1.5px solid black !important",
                                          borderBottom:
                                            "1.5px solid black !important",
                                          borderLeft:
                                            "1.5px solid black !important",
                                          boxShadow: "none",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.AdvPayment
                                          ? parseFloat(row.AdvPayment).toFixed(
                                            2
                                          )
                                          : "0.00"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.AdvDate || "-"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border:
                                            "1.5px solid black !important",
                                          borderTop:
                                            "1.5px solid black !important",
                                          borderRight:
                                            "1.5px solid black !important",
                                          borderBottom:
                                            "1.5px solid black !important",
                                          borderLeft:
                                            "1.5px solid black !important",
                                          boxShadow: "none",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.Lifted
                                          ? parseFloat(row.Lifted).toFixed(2)
                                          : "0.00"}
                                      </td>
                                      <td
                                        className={row.Status === "S" ? "fw-bold" : ""}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {row.Contract || "-"}
                                      </td>
                                      <td
                                        className={`ledger-note-cell ${row.Status === "S" ? "fw-bold" : ""}`}
                                        style={{
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          whiteSpace: "pre-wrap",
                                          wordBreak: "break-word",
                                          maxWidth: "300px",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }}
                                      >
                                        {getCombinedNotes(row)}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </React.Fragment>
                            ))
                          })()}
                        </tbody>
                        <tfoot
                          style={{
                            position: "sticky",
                            bottom: 0,
                            zIndex: 10,
                            overflow: "visible",
                          }}
                        >
                          {/* Totals Row */}
                          <tr
                            style={{
                              backgroundColor: "#4B0082 !important",
                              color: "white !important",
                              borderColor: "#000 !important",
                              height: "25px",
                            }}
                          >
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              B: {state.FillArray.reduce(
                                (sum, row) =>
                                  sum + (parseFloat(row.PurQty) || 0),
                                0
                              ).toFixed(2)}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              S: {state.FillArray.reduce(
                                (sum, row) =>
                                  sum + (parseFloat(row.SelQty) || 0),
                                0
                              ).toFixed(2)}
                            </td>
                            <td
                              className="text-start fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0 4px",
                                border: "1.5px solid black",
                              }}
                            >
                              {(() => {
                                let totalPurQty = 0
                                let totalSelQty = 0
                                let totalPurchaseAmount = 0
                                let totalSellAmount = 0
                                state.FillArray.forEach(row => {
                                  const purQty = parseFloat(row.PurQty) || 0
                                  const selQty = parseFloat(row.SelQty) || 0
                                  const rate = parseFloat(row.Rate) || 0
                                  if (row.Status === "P") {
                                    totalPurQty += purQty
                                    totalPurchaseAmount += purQty * rate
                                  } else if (row.Status === "S") {
                                    totalSelQty += selQty
                                    totalSellAmount += selQty * rate
                                  }
                                })
                                const purchaseAvgRate = totalPurQty > 0 ? totalPurchaseAmount / totalPurQty : 0
                                const sellAvgRate = totalSelQty > 0 ? totalSellAmount / totalSelQty : 0
                                const totalDiff = (totalSelQty * sellAvgRate) - (totalPurQty * purchaseAvgRate)
                                return `Diff: ${totalDiff.toFixed(2)}`
                              })()}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-end fw-bold"
                              style={{ verticalAlign: "middle", padding: "0", border: "1.5px solid black" }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-end fw-bold"
                              style={{ verticalAlign: "middle", padding: "0", border: "1.5px solid black" }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-end fw-bold"
                              style={{ verticalAlign: "middle", padding: "0", border: "1.5px solid black" }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-end fw-bold"
                              style={{ verticalAlign: "middle", padding: "0" }}
                            >
                              {state.FillArray.reduce(
                                (sum, row) =>
                                  sum + (parseFloat(row.AdvPayment) || 0),
                                0
                              ).toFixed(2)}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-end fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {state.FillArray.reduce(
                                (sum, row) =>
                                  sum + (parseFloat(row.Lifted) || 0),
                                0
                              ).toFixed(2)}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "0",
                                border: "1.5px solid black",
                              }}
                            >
                              {" "}
                            </td>
                            <td
                              className="text-center fw-bold"
                              style={{
                                verticalAlign: "middle",
                                padding: "4px",
                                border: "1.5px solid black",
                                whiteSpace: "pre-wrap",
                              }}
                            >
                              {" "}
                            </td>
                          </tr>

                          {/* Selected Rows Totals */}
                          {selectedRowIds.size > 0 && (() => {
                            const selectedRows = state.FillArray.filter(row =>
                              selectedRowIds.has(getRowIdentifier(row))
                            );
                            return (
                              <tr
                                style={{
                                  backgroundColor: "#FF8C00 !important",
                                  color: "white !important",
                                  borderColor: "#000 !important",
                                  height: "25px",
                                }}
                              >
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  B: {selectedRows.reduce(
                                    (sum, row) =>
                                      sum + (parseFloat(row.PurQty) || 0),
                                    0
                                  ).toFixed(2)}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  S: {selectedRows.reduce(
                                    (sum, row) =>
                                      sum + (parseFloat(row.SelQty) || 0),
                                    0
                                  ).toFixed(2)}
                                </td>
                                <td
                                  className="text-start fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0 4px",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {(() => {
                                    let totalPurQty = 0
                                    let totalSelQty = 0
                                    let totalPurchaseAmount = 0
                                    let totalSellAmount = 0
                                    selectedRows.forEach(row => {
                                      const purQty = parseFloat(row.PurQty) || 0
                                      const selQty = parseFloat(row.SelQty) || 0
                                      const rate = parseFloat(row.Rate) || 0
                                      if (row.Status === "P") {
                                        totalPurQty += purQty
                                        totalPurchaseAmount += purQty * rate
                                      } else if (row.Status === "S") {
                                        totalSelQty += selQty
                                        totalSellAmount += selQty * rate
                                      }
                                    })
                                    const purchaseAvgRate = totalPurQty > 0 ? totalPurchaseAmount / totalPurQty : 0
                                    const sellAvgRate = totalSelQty > 0 ? totalSellAmount / totalSelQty : 0
                                    const totalDiff = (totalSelQty * sellAvgRate) - (totalPurQty * purchaseAvgRate)
                                    return `Diff: ${totalDiff.toFixed(2)}`
                                  })()}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-end fw-bold"
                                  style={{ verticalAlign: "middle", padding: "0", border: "1.5px solid black" }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-end fw-bold"
                                  style={{ verticalAlign: "middle", padding: "0", border: "1.5px solid black" }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-end fw-bold"
                                  style={{ verticalAlign: "middle", padding: "0", border: "1.5px solid black" }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-end fw-bold"
                                  style={{ verticalAlign: "middle", padding: "0" }}
                                >
                                  {selectedRows.reduce(
                                    (sum, row) =>
                                      sum + (parseFloat(row.AdvPayment) || 0),
                                    0
                                  ).toFixed(2)}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-end fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {selectedRows.reduce(
                                    (sum, row) =>
                                      sum + (parseFloat(row.Lifted) || 0),
                                    0
                                  ).toFixed(2)}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "0",
                                    border: "1.5px solid black",
                                  }}
                                >
                                  {" "}
                                </td>
                                <td
                                  className="text-center fw-bold"
                                  style={{
                                    verticalAlign: "middle",
                                    padding: "4px",
                                    border: "1.5px solid black",
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {" "}
                                </td>
                              </tr>
                            );
                          })()}
                        </tfoot>
                      </Table>
                    </div>

                    {/* Filters Bar - Party, Item, Period Dropdowns - Below Table (attached to table, no gap) */}
                    <div
                      className="bottom-filters-bar"
                      style={{
                        backgroundColor: "#6C244C",
                        color: "white",
                        borderRadius: "0",
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        marginTop: "0",
                        marginBottom: "0",
                        paddingTop: "6px",
                        paddingBottom: "6px",
                        flexShrink: "0",
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
                          minWidth: "fit-content"
                        }}
                      >
                        {/* Left side - Icon */}
                        <div
                          className="d-flex align-items-center"
                          style={{ flex: "0 0 auto" }}
                        >
                          <i className="fas fa-chart-line me-2"></i>
                        </div>

                        {/* Period Dropdown - Opens Modal */}
                        <div style={{ flex: "0 0 auto", minWidth: "100px", maxWidth: "160px" }}>
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
                              {selectedPeriod && selectedPeriod.length > 0
                                ? `${selectedPeriod.length} selected`
                                : "Period"}
                            </span>
                            <i className="fas fa-chevron-down ms-2"></i>
                          </div>
                        </div>

                        {/* Item Dropdown - Opens Modal */}
                        <div style={{ flex: "0 0 auto", minWidth: "120px", maxWidth: "140px" }}>
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
                                : "Items"}
                            </span>
                            <i className="fas fa-chevron-down ms-2"></i>
                          </div>
                        </div>

                        {/* Export Buttons - before Party */}
                        <div
                          className="d-flex align-items-center"
                          style={{ gap: "8px", flex: "0 0 auto" }}
                        >
                          <Button
                            color="success"
                            onClick={exportToExcel}
                            className="shadow-sm"
                            size="sm"
                            style={{ fontSize: "0.6rem", whiteSpace: "nowrap", height: "32px", minHeight: "32px", padding: "0 10px" }}
                          >
                            <i className="fas fa-file-excel me-1"></i>
                            Excel
                          </Button>
                          <Button
                            color="danger"
                            onClick={exportToPDF}
                            className="shadow-sm"
                            size="sm"
                            style={{ fontSize: "0.6rem", whiteSpace: "nowrap", height: "32px", minHeight: "32px", padding: "0 10px" }}
                          >
                            <i className="fas fa-file-pdf me-1"></i>
                            PDF
                          </Button>
                        </div>

                        {/* Party Dropdown - Opens Modal */}
                        <div style={{ flex: "0 0 auto", minWidth: "200px", maxWidth: "280px" }}>
                          <div
                            onClick={openPartyModal}
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
                              {selectedParties && selectedParties.length > 0
                                ? `${selectedParties.length} selected`
                                : "Party"}
                            </span>
                            <i className="fas fa-chevron-down ms-2"></i>
                          </div>
                        </div>

                        {/* Contract Type Dropdown */}
                        <div style={{ flex: "0 0 auto", minWidth: "140px", maxWidth: "160px" }} className="bottom-filter-select-wrap">
                          <Select
                            options={state.TaxAccountArray.map(tax => ({
                              value: tax.Id,
                              label: tax.Name,
                            }))}
                            value={
                              state.TaxAccountArray.find(
                                t => t.Id === parseInt(selectedTax)
                              )
                                ? {
                                  value: selectedTax,
                                  label: state.TaxAccountArray.find(
                                    t => t.Id === parseInt(selectedTax)
                                  )?.Name,
                                }
                                : null
                            }
                            onChange={option => {
                              setSelectedTax(option?.value || "")
                            }}
                            placeholder="Contract"
                            className="party-dropdown"
                            style={{
                              backgroundColor: "#E3F2FD",
                              fontSize: "0.65rem",
                              minHeight: "32px",
                              border: "1px solid #2196F3",
                            }}
                            isSearchable
                            classNamePrefix="react-select"
                            noOptionsMessage={() => "No contract types found"}
                            isClearable
                            menuPosition="fixed"
                            menuPortalTarget={document.body}
                            styles={{
                              control: provided => ({
                                ...provided,
                                fontSize: "0.65rem",
                                minHeight: "32px",
                                height: "32px",
                                border: "1px solid #2196F3",
                                backgroundColor: "#E3F2FD",
                                boxShadow: "none",
                                display: "flex",
                                alignItems: "center",
                              }),
                              valueContainer: provided => ({
                                ...provided,
                                display: "flex",
                                alignItems: "center",
                                padding: "0 8px",
                              }),
                              option: provided => ({
                                ...provided,
                                fontSize: "0.65rem",
                              }),
                              singleValue: provided => ({
                                ...provided,
                                fontSize: "0.65rem",
                                lineHeight: "1",
                              }),
                              placeholder: provided => ({
                                ...provided,
                                fontSize: "0.65rem",
                                lineHeight: "1",
                                margin: 0,
                              }),
                              input: provided => ({
                                ...provided,
                                margin: 0,
                                padding: 0,
                              }),
                              menu: provided => ({
                                ...provided,
                                zIndex: 10000,
                              }),
                              menuPortal: provided => ({
                                ...provided,
                                fontSize: "0.65rem",
                                zIndex: 10000,
                              }),
                            }}
                          />
                        </div>

                        {/* Vessel Input */}
                        <div style={{ flex: "0 0 auto", minWidth: "100px", maxWidth: "120px" }}>
                          <Input
                            id="vessel"
                            type="text"
                            value={state.Vessel}
                            onChange={e => {
                              setState({ ...state, Vessel: e.target.value })
                            }}
                            className="form-control-sm shadow-sm"
                            style={{
                              backgroundColor: "#E3F2FD",
                              color: "#333",
                              fontSize: "0.65rem",
                              padding: "0 8px",
                              height: "32px",
                              minHeight: "32px",
                              borderRadius: "6px",
                              border: "1px solid #2196F3",
                            }}
                            placeholder="Vessel"
                          />
                        </div>

                        {/* Delivery Port Input */}
                        <div style={{ flex: "0 0 auto", minWidth: "100px", maxWidth: "120px" }}>
                          <Input
                            id="deliveryPort"
                            type="text"
                            value={state.DeliveryPort}
                            onChange={e => {
                              setState({ ...state, DeliveryPort: e.target.value })
                            }}
                            className="form-control-sm shadow-sm"
                            style={{
                              backgroundColor: "#E3F2FD",
                              color: "#333",
                              fontSize: "0.65rem",
                              padding: "0 8px",
                              height: "32px",
                              minHeight: "32px",
                              borderRadius: "6px",
                              border: "1px solid #2196F3",
                            }}
                            placeholder="Port"
                          />
                        </div>

                      </div>
                    </div>

                    {/* Hover Totals Row */}
                    {hoverTotalsPosition.visible &&
                      hoveredRowIndex !== null &&
                      (() => {
                        const hoverTotals = calculateHoverTotals(
                          tableData,
                          hoveredRowIndex
                        )
                        return hoverTotals ? (
                          <div
                            className="position-absolute"
                            style={{
                              backgroundColor: "#ff6b35",
                              color: "black",
                              padding: "4px 6px",
                              borderRadius: "4px",
                              fontSize: "0.8rem",
                              fontWeight: "bold",
                              zIndex: "1000",
                              boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                              border: "2px solid #000",
                              minWidth: "auto",
                              maxWidth: "95vw",
                              left: "2px",
                              top: `${hoverTotalsPosition.top}px`,
                              marginTop: "0px",
                              marginBottom: "0px",
                              overflowX: "auto",
                              overflowY: "hidden",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexWrap: "nowrap",
                                gap: "8px",
                                margin: "0",
                                minWidth: "fit-content"
                              }}
                            >
                              <div
                                style={{
                                  padding: "0 4px",
                                  minWidth: "70px",
                                  flex: "0 0 auto"
                                }}
                              >
                                <div className="text-center">
                                  <div style={{ fontSize: "0.55rem", whiteSpace: "nowrap" }}>
                                    Pur Qty
                                  </div>
                                  <div
                                    className="fw-bold"
                                    style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                                  >
                                    {hoverTotals.totalPurQty.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div
                                style={{
                                  padding: "0 4px",
                                  minWidth: "70px",
                                  flex: "0 0 auto"
                                }}
                              >
                                <div className="text-center">
                                  <div style={{ fontSize: "0.55rem", whiteSpace: "nowrap" }}>
                                    Sel Qty
                                  </div>
                                  <div
                                    className="fw-bold"
                                    style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                                  >
                                    {hoverTotals.totalSelQty.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div
                                style={{
                                  padding: "0 4px",
                                  minWidth: "85px",
                                  flex: "0 0 auto"
                                }}
                              >
                                <div className="text-center">
                                  <div style={{ fontSize: "0.55rem", whiteSpace: "nowrap" }}>
                                    Adv Payment
                                  </div>
                                  <div
                                    className="fw-bold"
                                    style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                                  >
                                    ₹{hoverTotals.totalAdvPayment.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div
                                style={{
                                  padding: "0 4px",
                                  minWidth: "70px",
                                  flex: "0 0 auto"
                                }}
                              >
                                <div className="text-center">
                                  <div style={{ fontSize: "0.55rem", whiteSpace: "nowrap" }}>
                                    Lifted
                                  </div>
                                  <div
                                    className="fw-bold"
                                    style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                                  >
                                    {hoverTotals.totalLifted.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div
                                style={{
                                  padding: "0 4px",
                                  minWidth: "90px",
                                  flex: "0 0 auto"
                                }}
                              >
                                <div className="text-center">
                                  <div style={{ fontSize: "0.55rem", whiteSpace: "nowrap" }}>
                                    Avg Pur Rate
                                  </div>
                                  <div
                                    className="fw-bold"
                                    style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                                  >
                                    ₹{hoverTotals.avgPurchaseRate.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                              <div
                                style={{
                                  padding: "0 4px",
                                  minWidth: "90px",
                                  flex: "0 0 auto"
                                }}
                              >
                                <div className="text-center">
                                  <div style={{ fontSize: "0.55rem", whiteSpace: "nowrap" }}>
                                    Avg Sel Rate
                                  </div>
                                  <div
                                    className="fw-bold"
                                    style={{ fontSize: "0.7rem", whiteSpace: "nowrap" }}
                                  >
                                    ₹{hoverTotals.avgSellRate.toFixed(2)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : null
                      })()}

                    {/* Pagination Controls */}
                    {false && (
                      <div
                        className="d-flex justify-content-between align-items-center pagination-controls"
                        style={{
                          marginTop: "0",
                          paddingLeft: "0",
                          paddingRight: "0",
                          flexShrink: "0",
                          minHeight: "40px",
                          position: "sticky",
                          bottom: "0",
                          backgroundColor: "white",
                          zIndex: "10",
                        }}
                      >
                        {totalPages > 1 && (
                          <div
                            className="d-flex align-items-center"
                            style={{ gap: "0" }}
                          >
                            <Button
                              size="sm"
                              color="outline-primary"
                              onClick={() => handlePageChange(1)}
                              disabled={currentPage === 1}
                              title="First Page"
                            >
                              <i className="fas fa-angle-double-left"></i>
                            </Button>
                            <Button
                              size="sm"
                              color="outline-primary"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                              title="Previous Page"
                            >
                              <i className="fas fa-angle-left"></i>
                            </Button>

                            {/* Page Numbers */}
                            <div
                              className="d-flex align-items-center"
                              style={{ gap: "0" }}
                            >
                              {(() => {
                                const pageNumbers = []
                                const maxVisiblePages = 5
                                let startPage = Math.max(
                                  1,
                                  currentPage - Math.floor(maxVisiblePages / 2)
                                )
                                let endPage = Math.min(
                                  totalPages,
                                  startPage + maxVisiblePages - 1
                                )

                                // Adjust start page if we're near the end
                                if (endPage - startPage < maxVisiblePages - 1) {
                                  startPage = Math.max(
                                    1,
                                    endPage - maxVisiblePages + 1
                                  )
                                }

                                // Add first page and ellipsis if needed
                                if (startPage > 1) {
                                  pageNumbers.push(
                                    <Button
                                      key={1}
                                      size="sm"
                                      color={
                                        1 === currentPage
                                          ? "primary"
                                          : "outline-primary"
                                      }
                                      onClick={() => handlePageChange(1)}
                                      style={{
                                        minWidth: "35px",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      1
                                    </Button>
                                  )
                                  if (startPage > 2) {
                                    pageNumbers.push(
                                      <span
                                        key="ellipsis1"
                                        className="text-muted px-2"
                                      >
                                        ...
                                      </span>
                                    )
                                  }
                                }

                                // Add visible page numbers
                                for (let i = startPage; i <= endPage; i++) {
                                  pageNumbers.push(
                                    <Button
                                      key={i}
                                      size="sm"
                                      color={
                                        i === currentPage
                                          ? "primary"
                                          : "outline-primary"
                                      }
                                      onClick={() => handlePageChange(i)}
                                      style={{
                                        minWidth: "35px",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {i}
                                    </Button>
                                  )
                                }

                                // Add ellipsis and last page if needed
                                if (endPage < totalPages) {
                                  if (endPage < totalPages - 1) {
                                    pageNumbers.push(
                                      <span
                                        key="ellipsis2"
                                        className="text-muted px-2"
                                      >
                                        ...
                                      </span>
                                    )
                                  }
                                  pageNumbers.push(
                                    <Button
                                      key={totalPages}
                                      size="sm"
                                      color={
                                        totalPages === currentPage
                                          ? "primary"
                                          : "outline-primary"
                                      }
                                      onClick={() =>
                                        handlePageChange(totalPages)
                                      }
                                      style={{
                                        minWidth: "35px",
                                        fontSize: "0.75rem",
                                      }}
                                    >
                                      {totalPages}
                                    </Button>
                                  )
                                }

                                return pageNumbers
                              })()}
                            </div>

                            <Button
                              size="sm"
                              color="outline-primary"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === totalPages}
                              title="Next Page"
                            >
                              <i className="fas fa-angle-right"></i>
                            </Button>
                            <Button
                              size="sm"
                              color="outline-primary"
                              onClick={() => handlePageChange(totalPages)}
                              disabled={currentPage === totalPages}
                              title="Last Page"
                            >
                              <i className="fas fa-angle-double-right"></i>
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-2">
                    <i className="fas fa-search fa-lg text-muted mb-1"></i>
                    <h6 className="text-muted mb-1" style={{ fontSize: "0.9rem" }}>
                      No data found for the selected criteria.
                    </h6>
                    <p className="text-muted small mb-0">
                      Try adjusting your search parameters.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

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

      {/* Voucher Modal */}
      <Modal
        show={showVoucherModal}
        onHide={closeVoucherModal}
        size="xl"
        centered
        className="voucher-modal"
        style={{ zIndex: 9999 }}
      >
        <ModalHeader className="bg-info text-white">
          <div className="d-flex justify-content-between align-items-center w-100">
            <div>
              <h5 className="mb-0">
                <i className="fas fa-file-invoice me-2"></i>
                Voucher Management
              </h5>
            </div>
            <Button
              variant="light"
              onClick={closeVoucherModal}
              className="btn-sm"
              title="Close"
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </ModalHeader>
        <ModalBody className="p-3">
          {/* Voucher List Section */}
          <Row className="mb-3">
            <Col md={12}>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h6 className="mb-0 text-primary">
                  <i className="fas fa-list me-2"></i>
                  Existing Vouchers
                </h6>
                <Button
                  size="sm"
                  color="success"
                  onClick={() => {
                    setVoucherMode("save")
                    setVoucherData({
                      id: 0,
                      VoucherNo:
                        state.VoucherNoArray && state.VoucherNoArray.length > 0
                          ? state.VoucherNoArray[0]?.VoucherNoNew || ""
                          : "",
                      VoucherDate: new Date(),
                      F_LedgerMasterDr: "",
                      F_LedgerMasterCr: "",
                      Amount: "",
                      Narration: "",
                    })
                  }}
                >
                  <i className="fas fa-plus me-1"></i>
                  New Voucher
                </Button>
              </div>

              {/* Search Bar */}
              <div className="mb-2">
                <Input
                  type="text"
                  placeholder="Search vouchers by number, narration, or party..."
                  value={voucherSearchTerm}
                  onChange={e => setVoucherSearchTerm(e.target.value)}
                  className="form-control-sm"
                  style={{ maxWidth: "400px" }}
                />
              </div>

              {/* Voucher Table */}
              <div
                className="table-responsive"
                style={{ maxHeight: "300px", overflowY: "auto" }}
              >
                <Table striped size="sm" className="mb-0">
                  <thead className="table-light sticky-top">
                    <tr>
                      <th>Voucher No</th>
                      <th>Date</th>
                      <th>Cash/Bank</th>
                      <th>Party</th>
                      <th>Amount</th>
                      <th>Narration</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.VoucherHArray && state.VoucherHArray.length > 0 ? (
                      state.VoucherHArray.filter(voucher => {
                        if (!voucherSearchTerm) return true
                        const searchLower = voucherSearchTerm.toLowerCase()
                        return (
                          voucher.VoucherNo?.toLowerCase().includes(
                            searchLower
                          ) ||
                          voucher.Narration?.toLowerCase().includes(
                            searchLower
                          ) ||
                          state.LedgerArray.find(
                            l => l.Id === parseInt(voucher.F_LedgerMasterCr)
                          )
                            ?.Name?.toLowerCase()
                            .includes(searchLower) ||
                          state.LedgerArray.find(
                            l => l.Id === parseInt(voucher.F_LedgerMasterDr)
                          )
                            ?.Name?.toLowerCase()
                            .includes(searchLower)
                        )
                      }).map((voucher, index) => (
                        <tr
                          key={voucher.Id || index}
                          className={
                            voucherData.id === voucher.Id ? "table-primary" : ""
                          }
                        >
                          <td className="fw-semibold">{voucher.VoucherNo}</td>
                          <td>
                            {voucher.VoucherDate
                              ? new Date(
                                voucher.VoucherDate
                              ).toLocaleDateString("en-GB")
                              : "-"}
                          </td>
                          <td>
                            {state.LedgerArray.find(
                              l => l.Id === parseInt(voucher.F_LedgerMasterDr)
                            )?.Name || "-"}
                          </td>
                          <td>
                            {state.LedgerArray.find(
                              l => l.Id === parseInt(voucher.F_LedgerMasterCr)
                            )?.Name || "-"}
                          </td>
                          <td className="fw-bold text-success">
                            ₹{parseFloat(voucher.Amount || 0).toFixed(2)}
                          </td>
                          <td
                            className="text-truncate"
                            style={{ maxWidth: "150px" }}
                            title={voucher.Narration}
                          >
                            {voucher.Narration || "-"}
                          </td>
                          <td>
                            <div className="btn-group btn-group-sm">
                              <Button
                                size="sm"
                                color="primary"
                                onClick={() => {
                                  setVoucherMode("edit")
                                  setVoucherData({
                                    id: voucher.Id,
                                    VoucherNo: voucher.VoucherNo || "",
                                    VoucherDate: voucher.VoucherDate
                                      ? new Date(voucher.VoucherDate)
                                      : new Date(),
                                    F_LedgerMasterDr:
                                      voucher.F_LedgerMasterDr || "",
                                    F_LedgerMasterCr:
                                      voucher.F_LedgerMasterCr || "",
                                    Amount: voucher.Amount || "",
                                    Narration: voucher.Narration || "",
                                  })
                                  setVoucherErrors({})
                                }}
                                title="Edit Voucher"
                              >
                                <i className="fas fa-edit"></i>
                              </Button>
                              <Button
                                size="sm"
                                color="danger"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Are you sure you want to delete this voucher?"
                                    )
                                  ) {
                                    handleDeleteVoucher(voucher.Id)
                                  }
                                }}
                                title="Delete Voucher"
                              >
                                <i className="fas fa-trash"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-3">
                          <i className="fas fa-inbox fa-2x mb-2"></i>
                          <br />
                          No vouchers found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Col>
          </Row>

          {/* Divider */}
          <hr className="my-3" />

          {/* Voucher Form Section */}
          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center">
              <h6 className="mb-0 text-primary">
                <i className="fas fa-edit me-2"></i>
                {voucherMode === "save" ? "Add New Voucher" : "Edit Voucher"}
              </h6>
              {voucherMode === "edit" && voucherData.id && (
                <div className="text-muted small">
                  <span className="badge bg-info me-2">
                    <i className="fas fa-info-circle me-1"></i>
                    Editing Voucher #{voucherData.VoucherNo}
                  </span>
                  <span className="badge bg-secondary">
                    <i className="fas fa-calendar me-1"></i>
                    {voucherData.VoucherDate
                      ? new Date(voucherData.VoucherDate).toLocaleDateString(
                        "en-GB"
                      )
                      : "No Date"}
                  </span>
                </div>
              )}
            </div>
          </div>

          <Form onSubmit={handleSaveVoucher}>
            <Row className="g-2">
              <Col md={6}>
                <FormGroup className="mb-2">
                  <FormLabel htmlFor="voucherNo" className="fw-semibold">
                    Voucher No:
                  </FormLabel>
                  <Input
                    type="text"
                    id="voucherNo"
                    value={voucherData.VoucherNo}
                    onChange={e =>
                      setVoucherData({
                        ...voucherData,
                        VoucherNo: e.target.value,
                      })
                    }
                    className="form-control form-control-sm"
                    placeholder={
                      voucherMode === "save"
                        ? "Auto-generated voucher number"
                        : "Enter voucher number"
                    }
                    readOnly={voucherMode === "save"}
                    style={
                      voucherMode === "save"
                        ? { backgroundColor: "#e9ecef", cursor: "not-allowed" }
                        : {}
                    }
                  />
                  {voucherMode === "save" && (
                    <small className="text-muted">
                      Next voucher number:{" "}
                      {state.VoucherNoArray && state.VoucherNoArray.length > 0
                        ? state.VoucherNoArray[0]?.VoucherNoNew ||
                        "Not available"
                        : "Not available"}
                    </small>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="mb-2">
                  <FormLabel htmlFor="voucherDate" className="fw-semibold">
                    Voucher Date: <span className="text-danger">*</span>
                  </FormLabel>
                  <DatePicker
                    selected={voucherData.VoucherDate}
                    onChange={date => {
                      setVoucherData({ ...voucherData, VoucherDate: date })
                      // Clear error when user selects date
                      if (voucherErrors.VoucherDate) {
                        setVoucherErrors({ ...voucherErrors, VoucherDate: "" })
                      }
                    }}
                    className={`form-control form-control-sm ${voucherErrors.VoucherDate ? "is-invalid" : ""
                      }`}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="Select voucher date"
                    openToDate={new Date()}
                  />
                  {voucherErrors.VoucherDate && (
                    <div className="invalid-feedback d-block">
                      {voucherErrors.VoucherDate}
                    </div>
                  )}
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup className="mb-2">
                  <FormLabel htmlFor="dropdown1" className="fw-semibold">
                    Cash/Bank <span className="text-danger">*</span>
                  </FormLabel>
                  <Select
                    options={state.LedgerArray.map(ledger => ({
                      value: ledger.Id,
                      label: ledger.Name,
                    }))}
                    value={
                      state.LedgerArray
                        ? {
                          value: voucherData.F_LedgerMasterDr,
                          label: state.LedgerArray.find(
                            l =>
                              l.Id === parseInt(voucherData.F_LedgerMasterDr)
                          )?.Name,
                        }
                        : null
                    }
                    onChange={option => {
                      setVoucherData({
                        ...voucherData,
                        F_LedgerMasterDr: option?.value || "",
                      })
                      // Clear error when user makes selection
                      if (voucherErrors.F_LedgerMasterDr) {
                        setVoucherErrors({
                          ...voucherErrors,
                          F_LedgerMasterDr: "",
                        })
                      }
                    }}
                    placeholder="Select Cash/Bank"
                    className={`form-select-sm ${voucherErrors.F_LedgerMasterDr ? "is-invalid" : ""
                      }`}
                    style={{ backgroundColor: "#f8f9fa" }}
                    isSearchable
                    classNamePrefix="react-select"
                    noOptionsMessage={() => "No options found"}
                    isClearable
                  />
                  {voucherErrors.F_LedgerMasterDr && (
                    <div className="invalid-feedback d-block">
                      {voucherErrors.F_LedgerMasterDr}
                    </div>
                  )}
                </FormGroup>
              </Col>
              <Col md={12}>
                <FormGroup className="mb-2">
                  <FormLabel htmlFor="dropdown2" className="fw-semibold">
                    Party Name <span className="text-danger">*</span>
                  </FormLabel>
                  <Select
                    options={state.LedgerArray.map(ledger => ({
                      value: ledger.Id,
                      label: ledger.Name,
                    }))}
                    value={
                      state.LedgerArray.find(
                        l => l.Id === parseInt(voucherData.F_LedgerMasterCr)
                      )
                        ? {
                          value: voucherData.F_LedgerMasterCr,
                          label: state.LedgerArray.find(
                            l =>
                              l.Id === parseInt(voucherData.F_LedgerMasterCr)
                          )?.Name,
                        }
                        : null
                    }
                    onChange={option => {
                      setVoucherData({
                        ...voucherData,
                        F_LedgerMasterCr: option?.value || "",
                      })
                      // Clear error when user makes selection
                      if (voucherErrors.F_LedgerMasterCr) {
                        setVoucherErrors({
                          ...voucherErrors,
                          F_LedgerMasterCr: "",
                        })
                      }
                    }}
                    placeholder="Select Party Name"
                    className={`form-select-sm ${voucherErrors.F_LedgerMasterCr ? "is-invalid" : ""
                      }`}
                    style={{ backgroundColor: "#f8f9fa" }}
                    isSearchable
                    classNamePrefix="react-select"
                    noOptionsMessage={() => "No ledgers found"}
                    isClearable
                  />
                  {voucherErrors.F_LedgerMasterCr && (
                    <div className="invalid-feedback d-block">
                      {voucherErrors.F_LedgerMasterCr}
                    </div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="mb-2">
                  <FormLabel htmlFor="amount" className="fw-semibold">
                    Amount: <span className="text-danger">*</span>
                  </FormLabel>
                  <Input
                    type="number"
                    id="amount"
                    value={voucherData.Amount}
                    onChange={e => {
                      setVoucherData({ ...voucherData, Amount: e.target.value })
                      // Clear error when user types
                      if (voucherErrors.Amount) {
                        setVoucherErrors({ ...voucherErrors, Amount: "" })
                      }
                    }}
                    className={`form-control form-control-sm ${voucherErrors.Amount ? "is-invalid" : ""
                      }`}
                    placeholder="Enter amount"
                    step="0.01"
                    min="0"
                  />
                  {voucherErrors.Amount && (
                    <div className="invalid-feedback d-block">
                      {voucherErrors.Amount}
                    </div>
                  )}
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup className="mb-2">
                  <FormLabel htmlFor="narration" className="fw-semibold">
                    Narration:
                  </FormLabel>
                  <Input
                    type="text"
                    id="narration"
                    value={voucherData.Narration}
                    onChange={e =>
                      setVoucherData({
                        ...voucherData,
                        Narration: e.target.value,
                      })
                    }
                    className="form-control form-control-sm"
                    placeholder="Enter narration"
                  />
                </FormGroup>
              </Col>
              <Col md={3}>
                <Button
                  type="submit"
                  color="success"
                  className="px-4 py-2 w-100"
                  disabled={voucherLoading}
                >
                  {voucherLoading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      {voucherMode === "save" ? "Saving..." : "Updating..."}
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save me-2"></i>
                      {voucherMode === "save"
                        ? "Save Voucher"
                        : "Update Voucher"}
                    </>
                  )}
                </Button>
              </Col>
              <Col md={3}>
                <Button
                  type="button"
                  color="danger"
                  className="px-4 py-2 w-100"
                  onClick={handleDeleteVoucher}
                  disabled={voucherMode === "save" || voucherLoading}
                >
                  <i className="fas fa-trash me-2"></i>
                  Delete Voucher
                </Button>
              </Col>
              <Col md={3}>
                <Button
                  type="button"
                  color="warning"
                  className="px-4 py-2 w-100"
                  onClick={() => {
                    setVoucherData({
                      id: 0,
                      VoucherNo:
                        state.VoucherNoArray && state.VoucherNoArray.length > 0
                          ? state.VoucherNoArray[0]?.VoucherNoNew || ""
                          : "",
                      VoucherDate: new Date(),
                      F_LedgerMasterDr: "",
                      F_LedgerMasterCr: "",
                      Amount: "",
                      Narration: "",
                    })
                    setVoucherMode("save")
                    setVoucherErrors({})
                  }}
                  disabled={voucherLoading}
                >
                  <i className="fas fa-undo me-2"></i>
                  Clear Form
                </Button>
              </Col>
              <Col md={3}>
                <Button
                  type="button"
                  color="secondary"
                  className="px-4 py-2 w-100"
                  onClick={closeVoucherModal}
                >
                  <i className="fas fa-times me-2"></i>
                  Close
                </Button>
              </Col>
            </Row>
          </Form>
        </ModalBody>
      </Modal>

      {/* Party Filter Modal */}
      <Modal
        show={showPartyModal}
        onHide={closePartyModal}
        size="lg"
        centered
        style={{ zIndex: 10000 }}
      >
        <ModalHeader className="bg-primary text-white">
          <div className="d-flex justify-content-between align-items-center w-100">
            <h5 className="mb-0">
              <i className="fas fa-users me-2"></i>
              Select Party
            </h5>
            <Button
              variant="light"
              onClick={closePartyModal}
              className="btn-close btn-close-white"
              style={{ border: "none", background: "transparent" }}
            >
              <i className="fas fa-times"></i>
            </Button>
          </div>
        </ModalHeader>
        <ModalBody style={{ padding: "1.5rem", maxHeight: "60vh", overflowY: "auto" }}>
          <Form>
            <FormGroup>
              <div className="mb-3">
                <FormLabel className="fw-semibold mb-0">
                  Party
                </FormLabel>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>
                {getUniquePartiesFromData().map((party) => (
                  <div
                    key={party.value}
                    style={{
                      padding: "8px",
                      cursor: "pointer",
                      borderRadius: "4px",
                      backgroundColor: tempSelectedParties.some(p => p === party.value) ? "#e7f3ff" : "transparent",
                      marginBottom: "4px",
                    }}
                    onClick={() => {
                      const isSelected = tempSelectedParties.some(p => p === party.value)
                      if (isSelected) {
                        setTempSelectedParties(tempSelectedParties.filter(p => p !== party.value))
                      } else {
                        setTempSelectedParties([...tempSelectedParties, party.value])
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!tempSelectedParties.some(p => p === party.value)) {
                        e.currentTarget.style.backgroundColor = "#f8f9fa"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!tempSelectedParties.some(p => p === party.value)) {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <input
                        type="checkbox"
                        checked={tempSelectedParties.some(p => p === party.value)}
                        onChange={() => { }}
                        style={{ marginRight: "10px", cursor: "pointer" }}
                      />
                      <span>{party.label}</span>
                    </div>
                  </div>
                ))}
                {getUniquePartiesFromData().length === 0 && (
                  <div className="text-center text-muted py-3">
                    No parties available
                  </div>
                )}
              </div>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" size="sm" onClick={() => setTempSelectedParties([])}>
            Clear All
          </Button>
          <Button variant="outline-primary" size="sm" onClick={() => {
            const allParties = getUniquePartiesFromData().map(p => p.value)
            setTempSelectedParties(allParties)
          }}>
            Select All
          </Button>
          <Button variant="primary" onClick={handlePartyModalDone}>
            <i className="fas fa-check me-2"></i>
            Done
          </Button>
        </ModalFooter>
      </Modal>

      {/* Item Filter Modal */}
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
              Select Items
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
            <FormGroup>
              <div className="mb-3">
                <FormLabel className="fw-semibold mb-0">
                  Items
                </FormLabel>
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
            </FormGroup>
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
            <FormGroup>
              <div className="mb-3">
                <FormLabel className="fw-semibold mb-0">
                  Period
                </FormLabel>
              </div>
              <div style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px", padding: "10px" }}>
                {state.PeriodDataArray.map((period) => (
                  <div
                    key={period.Id}
                    style={{
                      padding: "8px",
                      cursor: "pointer",
                      borderRadius: "4px",
                      backgroundColor: tempSelectedPeriod.some(p => p === period.Id) ? "#e7f3ff" : "transparent",
                      marginBottom: "4px",
                    }}
                    onClick={() => {
                      const isSelected = tempSelectedPeriod.some(p => p === period.Id)
                      if (isSelected) {
                        setTempSelectedPeriod(tempSelectedPeriod.filter(p => p !== period.Id))
                      } else {
                        setTempSelectedPeriod([...tempSelectedPeriod, period.Id])
                      }
                    }}
                    onMouseEnter={(e) => {
                      if (!tempSelectedPeriod.some(p => p === period.Id)) {
                        e.currentTarget.style.backgroundColor = "#f8f9fa"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!tempSelectedPeriod.some(p => p === period.Id)) {
                        e.currentTarget.style.backgroundColor = "transparent"
                      }
                    }}
                  >
                    <div className="d-flex align-items-center">
                      <input
                        type="checkbox"
                        checked={tempSelectedPeriod.some(p => p === period.Id)}
                        onChange={() => { }}
                        style={{ marginRight: "10px", cursor: "pointer" }}
                      />
                      <span>{period.Name}</span>
                    </div>
                  </div>
                ))}
                {state.PeriodDataArray.length === 0 && (
                  <div className="text-center text-muted py-3">
                    No periods available
                  </div>
                )}
              </div>
            </FormGroup>
          </Form>
        </ModalBody>
        <ModalFooter className="d-flex justify-content-end gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setTempSelectedPeriod([])}
          >
            Clear All
          </Button>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={() => {
              const allPeriods = state.PeriodDataArray.map(p => p.Id)
              setTempSelectedPeriod(allPeriods)
            }}
          >
            Select All
          </Button>
          <Button variant="primary" onClick={handlePeriodModalDone}>
            <i className="fas fa-check me-2"></i>
            Done
          </Button>
        </ModalFooter>
      </Modal>

      {/* Ledger Selection Modal */}
      <Modal

        show={showLedgerModal}
        onHide={() => setShowLedgerModal(false)}
        size="lg"
        centered
        style={{ maxHeight: "90vh" }}
      >
        <ModalHeader closeButton>
          <h5 className="modal-title">Select Ledgers</h5>
        </ModalHeader>
        <ModalBody style={{ maxHeight: "calc(90vh - 180px)", overflowY: "auto" }}>
          {/* Search Box */}
          <div className="mb-3">
            <Input
              type="text"
              placeholder="Search ledgers..."
              value={ledgerSearchTerm}
              onChange={(e) => setLedgerSearchTerm(e.target.value)}
              className="form-control"
              style={{ fontSize: "0.9rem" }}
            />
          </div>

          {/* Ledger List */}
          <div
            style={{
              maxHeight: "350px",
              minHeight: "250px",
              overflowY: "auto",
              border: "1px solid #dee2e6",
              borderRadius: "4px",
            }}
          >
            {getFilteredLedgers().length === 0 ? (
              <div className="text-center py-4 text-muted">
                {ledgerSearchTerm ? "No ledgers found" : "No ledgers available"}
              </div>
            ) : (
              <div className="list-group list-group-flush">
                {getFilteredLedgers().map((ledger) => {
                  const isSelected = tempLedgerSelection.includes(ledger.Id)
                  return (
                    <div
                      key={ledger.Id}
                      className={`list-group-item list-group-item-action d-flex align-items-center ${isSelected ? "active" : ""
                        }`}
                      style={{
                        cursor: "pointer",
                        padding: "0.75rem 1rem",
                        backgroundColor: isSelected ? "#0d6efd" : "transparent",
                        color: isSelected ? "#fff" : "#000",
                        border: "none",
                        borderBottom: "1px solid #dee2e6",
                        transition: "background-color 0.2s ease",
                      }}
                      onClick={() => handleLedgerToggle(ledger.Id)}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "#f8f9fa"
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.backgroundColor = "transparent"
                        }
                      }}
                    >
                      <span style={{ fontSize: "0.9rem" }}>{ledger.Name}</span>
                      {isSelected && (
                        <i className="fas fa-check ms-auto" style={{ fontSize: "0.85rem" }}></i>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </ModalBody>
        <ModalFooter className="d-flex justify-content-end gap-2">
          <Button variant="outline-secondary" size="sm" onClick={handleDeselectAllLedgers}>
            Clear All
          </Button>
          <Button variant="outline-primary" size="sm" onClick={handleSelectAllLedgers}>
            Select All
          </Button>
          <Button
            variant="primary"
            onClick={handleLedgerModalOk}
            disabled={tempLedgerSelection.length === 0}
          >
            <i className="fas fa-check me-2"></i>
            Done
          </Button>
        </ModalFooter>
      </Modal>

      {/* Scroll to Top Button for Table */}
      {showScrollTop && state.FillArray && state.FillArray.length > 0 && (
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

      <Modal
        show={showSharePDFModal}
        onHide={() => { setShowSharePDFModal(false); setPendingShareFile(null) }}
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
          <Button variant="secondary" onClick={() => { setShowSharePDFModal(false); setPendingShareFile(null) }}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSharePDFClick}>
            Share PDF
          </Button>
        </ModalFooter>
      </Modal>

      {/* Mobile responsive styles for scroll button */}
      <style>{`
        @media (max-width: 768px) {
          .scroll-to-top-btn {
            width: 45px !important;
            height: 45px !important;
            bottom: 55px !important;
            right: 15px !important;
            font-size: 18px !important;
          }
        }
        @media (max-width: 576px) {
          .scroll-to-top-btn {
            width: 42px !important;
            height: 42px !important;
            bottom: 52px !important;
            right: 12px !important;
            font-size: 17px !important;
          }
        }
        @media (max-width: 480px) {
          .scroll-to-top-btn {
            width: 38px !important;
            height: 38px !important;
            bottom: 50px !important;
            right: 10px !important;
            font-size: 15px !important;
            box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3) !important;
          }
        }
        @media (max-width: 375px) {
          .scroll-to-top-btn {
            width: 35px !important;
            height: 35px !important;
            bottom: 48px !important;
            right: 8px !important;
            font-size: 14px !important;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important;
          }
        }
        @media (max-width: 320px) {
          .scroll-to-top-btn {
            width: 32px !important;
            height: 32px !important;
            bottom: 46px !important;
            right: 6px !important;
            font-size: 13px !important;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important;
          }
        }
      `}</style>
    </div>
  )
}

export default LedgerReport
