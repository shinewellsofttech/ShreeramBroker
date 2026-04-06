import React, { useState, useEffect } from "react"
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

const LedgerReport = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()

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
      
      /* Fix hover background for all table rows and cells */
      .table-hover tbody tr:hover {
        background-color: black !important;
      }
      .table-hover tbody tr:hover td {
        background-color: black !important;
      }
      .table-hover tbody tr.table-secondary:hover,
      .table-hover tbody tr.table-secondary:hover td {
        background-color: black !important;
      }
      .table-hover tbody tr.table-info:hover,
      .table-hover tbody tr.table-info:hover td {
        background-color: black !important;
      }
      .table-hover tbody tr.table-danger:hover,
      .table-hover tbody tr.table-danger:hover td {
        background-color: black !important;
      }
      .table-hover tbody tr:hover td.fw-semibold,
      .table-hover tbody tr:hover td.text-end {
        background-color: black !important;
      }
      
      /* Darker grey for table-secondary rows (not started contracts) */
      .table-secondary {
        background-color: #b0b0b0 !important;
      }
      .table-secondary td {
        background-color: #b0b0b0 !important;
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
      
      /* Ensure datepicker dropdown appears above sticky headers */
      .react-datepicker-popper {
        z-index: 12000 !important;
      }
      
      /* Filters row — horizontal scroll, scrollbar styling */
      .ledger-report-filters-scroll {
        scrollbar-width: thin;
        scrollbar-color: #8B4513 #f4e4d4;
      }
      .ledger-report-filters-scroll::-webkit-scrollbar {
        height: 8px;
      }
      .ledger-report-filters-scroll::-webkit-scrollbar-track {
        background: #f4e4d4;
        border-radius: 4px;
      }
      .ledger-report-filters-scroll::-webkit-scrollbar-thumb {
        background: #8B4513;
        border-radius: 4px;
      }
      .ledger-report-filters-scroll::-webkit-scrollbar-thumb:hover {
        background: #6d3410;
      }
      
      /* Sab top spacing dynamic: body par --header-height set hota hai (_vertical.scss). */
      .ledger-report-root {
        padding-top: var(--header-height, 70px) !important;
        margin-top: 0 !important;
      }
      @media (max-width: 991.98px) {
        .ledger-report-root {
          padding-top: calc(var(--header-height, 70px) + env(safe-area-inset-top, 0px)) !important;
        }
      }
      /* Sticky thead bhi navbar height ke hisaab se (scroll par niche na chhupaye) */
      .ledger-report-root .table thead th,
      .ledger-report-root .table-responsive thead th {
        top: var(--header-height, 70px) !important;
      }
      @media (max-width: 991.98px) {
        .ledger-report-root .table thead th,
        .ledger-report-root .table-responsive thead th {
          top: calc(var(--header-height, 70px) + env(safe-area-inset-top, 0px)) !important;
        }
      }
    `
    document.head.appendChild(style)
    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const breadCrumbTitle = "Ledger Report"
  const breadcrumbItem = "Reports"

  const [selectedLedger, setSelectedLedger] = useState("")
  const [fromDate, setFromDate] = useState(new Date("2025-01-01T00:00:00")) // Default from date: 1st January 2025
  const [selectedTax, setSelectedTax] = useState("")
  const [selectedParty, setSelectedParty] = useState("")
  const [selectedParties, setSelectedParties] = useState([])
  const [selectedItem, setSelectedItem] = useState("")
  const [selectedItems, setSelectedItems] = useState([])
  const [ledgerDropdown, setLedgerDropdown] = useState([]) // Multi-select ledger dropdown
  const [showLedgerModal, setShowLedgerModal] = useState(false)
  const [tempLedgerSelection, setTempLedgerSelection] = useState([]) // Temporary selection in modal
  const [selectedLedgerNames, setSelectedLedgerNames] = useState([]) // Store selected ledger names for grouping
  const [ledgerSearchTerm, setLedgerSearchTerm] = useState("") // Search term for ledger modal

  const [selectedPeriod, setSelectedPeriod] = useState([])

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
    if (location.state && location.state.ledgerNames) {
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
    Note1: false,
    Note2: false,
    Note3: false,
    Note4: false,
    Note5: true, // Default to Note5 as it was already showing
    Note6: false,
  })

  const API_URL = API_WEB_URLS.MASTER + "/0/token/PartyAccount"
  const API_URL_Get = `${API_WEB_URLS.GetLedgerReportAppParty}/0/token`
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
      // If either LAP or LIP is selected, set dates to last financial year
      // Last Financial Year: April 1st of last year to March 31st of current year
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      
      // Always set to last financial year
      const financialYearStart = new Date(currentYear - 1, 3, 1, 0, 0, 0) // April 1 of last year
      const financialYearEnd = new Date(currentYear, 2, 31, 0, 0, 0) // March 31 of current year
      
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
      /* Prevent hover effects on totals and averages rows */
      .table tbody tr[style*="background-color: #cfe2ff"]:hover,
      .table tbody tr[style*="background-color: #fff3cd"]:hover {
        background-color: inherit !important;
        color: inherit !important;
        border-color: inherit !important;
      }
      
      .table tbody tr[style*="background-color: #cfe2ff"]:hover td,
      .table tbody tr[style*="background-color: #fff3cd"]:hover td {
        background-color: inherit !important;
        color: inherit !important;
      }
      
      /* More specific selectors to override Bootstrap */
      .table-hover tbody tr[style*="background-color: #cfe2ff"]:hover,
      .table-hover tbody tr[style*="background-color: #fff3cd"]:hover {
        background-color: inherit !important;
        color: inherit !important;
      }
      
      .table-hover tbody tr[style*="background-color: #cfe2ff"]:hover td,
      .table-hover tbody tr[style*="background-color: #fff3cd"]:hover td {
        background-color: inherit !important;
        color: inherit !important;
      }
      
      /* Override any Bootstrap table hover classes */
      .table tbody tr.table-primary:hover,
      .table tbody tr[style*="background-color: #cfe2ff"]:hover {
        background-color: #cfe2ff !important;
        color: #084298 !important;
        border-color: #9ec5fe !important;
      }
      
      .table tbody tr[style*="background-color: #fff3cd"]:hover {
        background-color: #fff3cd !important;
        color: #664d03 !important;
        border-color: #ffecb5 !important;
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
      
      /* Sticky table header — navbar ke niche (dynamic --header-height) */
      .table-responsive thead th {
        position: sticky;
        top: var(--header-height, 70px);
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
      
      /* Enhanced Table Styling */
      .table-hover tbody tr:hover {
        background-color: rgba(0, 123, 255, 0.1) !important;
        transform: scale(1.001);
        transition: all 0.2s ease-in-out;
      }
      
      .table tbody tr {
        transition: all 0.2s ease-in-out;
      }
      
      .table tbody tr.table-secondary:hover {
        background-color: #e9ecef !important;
        transform: scale(1.001);
      }
      
      .table tbody tr.table-info:hover {
        background-color: #b8daff !important;
        transform: scale(1.001);
      }
      
      .table tbody tr.table-danger:hover {
        background-color: #f5c6cb !important;
        transform: scale(1.001);
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
      
      /* Enhanced sticky header — navbar ke niche (dynamic) */
      .table thead th {
        position: sticky;
        top: var(--header-height, 70px);
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

  // Auto-fetch data when any filter changes
  useEffect(() => {
    if (selectedLedger && state.LedgerArray && state.LedgerArray.length > 0) {
      fetchReportData()
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
  
  // Note: selectedParties is intentionally NOT in the above dependency array
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

  // Handle navigation state from NewLedgerReport
  useEffect(() => {
    if (location.state) {
      const { LedgerId, LedgerName, ledgerNames, fromDate, toDate, itemIds } = location.state

      console.log("Navigation state:", { LedgerId, LedgerName, ledgerNames, fromDate, toDate, itemIds })
      
      // Use direct LedgerId and LedgerName if available (new system)
      if (LedgerId && LedgerName) {
        console.log("Using direct LedgerId and LedgerName")
        setSelectedLedger(LedgerId)
        setLedgerDropdown(LedgerId.split(",").map(id => parseInt(id.trim())))
        setSelectedLedgerNames(LedgerName.split(",").map(name => name.trim()))
      }
      // Fallback: Convert ledger names to IDs using LedgerArray (legacy system)
      else if (ledgerNames && state.LedgerArray.length > 0) {
        console.log("Using ledgerNames lookup for legacy system")
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
          // Also set the ledger names for grouping
          setSelectedLedgerNames(ledgerNameList)
        }
      }

      // Set the dates - ensure they are parsed as local dates, not UTC
      if (fromDate) {
        // If fromDate is already a Date object, use it directly
        // If it's a string, parse it as local time by appending time component
        const parsedFromDate = fromDate instanceof Date 
          ? fromDate 
          : new Date(fromDate.split('T')[0] + 'T00:00:00')
        setFromDate(parsedFromDate)
      }
      if (toDate) {
        // If toDate is already a Date object, use it directly
        // If it's a string, parse it as local time by appending time component
        const parsedToDate = toDate instanceof Date 
          ? toDate 
          : new Date(toDate.split('T')[0] + 'T00:00:00')
        setToDate(parsedToDate)
      }

      // Auto-fetch data if ledger data is provided
      if ((LedgerId && LedgerName) || (ledgerNames && state.LedgerArray.length > 0)) {
        let ledgerIdsToFetch = ""
        
        if (LedgerId && LedgerName) {
          // Use direct LedgerId
          ledgerIdsToFetch = LedgerId
        } else if (ledgerNames && state.LedgerArray.length > 0) {
          // Convert ledger names to IDs (legacy)
          const ledgerNameList = ledgerNames.split(",")
          const ledgerIds = ledgerNameList
            .map(name => {
              const ledger = state.LedgerArray.find(l => l.Name === name.trim())
              return ledger ? ledger.Id : null
            })
            .filter(id => id !== null)
          
          ledgerIdsToFetch = ledgerIds.join(",")
        }

        if (ledgerIdsToFetch) {
          autoFetchLedgerData(ledgerIdsToFetch, fromDate, toDate, itemIds)
        }
      }
    }
  }, [location.state, state.LedgerArray])

  // Auto-fetch ledger data function
  const autoFetchLedgerData = async (ledgerIds, fromDate, toDate, itemIds) => {
    try {
      setLoading(true)
      setShowReport(false)

      // Format dates properly - if string, use as is; if Date object, format it
      const formatDate = (date) => {
        if (!date) return ""
        if (typeof date === 'string') return date.split('T')[0]
        return formatDateForInput(date)
      }

      let vformData = new FormData()
      vformData.append("LedgerIds", ledgerIds)
      vformData.append("FromDate", formatDate(fromDate))
      vformData.append("ToDate", formatDate(toDate))

      const result = await Fn_GetReport(
        dispatch,
        setState,
        "FillArray",
        API_URL_Get,
        { arguList: { id: 0, formData: vformData } },
        true
      )

      // Fetch period data for dropdown
      await fetchPeriodData(
        ledgerIds,
        formatDate(fromDate),
        formatDate(toDate),
        itemIds
      )

      setShowReport(true)
    } catch (error) {
      console.error("Error auto-fetching ledger data:", error)
      toast.error("Error loading ledger data")
    } finally {
      setLoading(false)
    }
  }

  // Fetch period data for dropdown
  const fetchPeriodData = async (ledgerIds, fromDate, toDate, itemIds) => {
    try {
      let vformData = new FormData()
      vformData.append("LedgerIds", ledgerIds)
      // fromDate and toDate are already formatted strings here
      vformData.append("FromDate", fromDate || "")
      vformData.append("ToDate", toDate || "")

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
          ? state.VoucherNoArray[0].VoucherNoNew || ""
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
                ? state.VoucherNoArray[0].VoucherNoNew || ""
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
  const getUniqueItems = () => {
    if (!state.FillArray || state.FillArray.length === 0) return []

    const uniqueItems = new Set()
    state.FillArray.forEach(row => {
      if (row.Item && row.Item.trim()) {
        uniqueItems.add(row.Item.trim())
      }
    })

    return Array.from(uniqueItems)
      .sort()
      .map(item => ({
        value: item,
        label: item,
      }))
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

  // Group data by ledger names function - create separate groups for each ledger
  const getGroupedData = data => {
    if (!data || data.length === 0) return data

    // Filter data by selected items if any items are selected
    let filteredData = data
    if (selectedItems && selectedItems.length > 0) {
      filteredData = data.filter(row =>
        selectedItems.some(
          selectedItem =>
            row.Item &&
            row.Item.trim().toLowerCase() === selectedItem.toLowerCase()
        )
      )
    }
    
    // Filter data by selected parties if any parties are selected
    if (selectedParties && selectedParties.length > 0) {
      filteredData = filteredData.filter(row =>
        selectedParties.some(
          selectedParty =>
            (row.PartyLedger && row.PartyLedger.trim().toLowerCase() === selectedParty.toLowerCase())
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
    else if (location.state.ledgerNames) {
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
    let usedItems = new Set() // To track which items have been used

    // Create separate groups for each ledger name
    ledgerNamesFromNav.forEach((ledgerName, index) => {
      // Find items that match this ledger name in PartyLedger
      const matchingItems = filteredData
        .filter(item => {
          const partyMatch =
            item.PartyLedger &&
            item.PartyLedger.toLowerCase().includes(ledgerName.toLowerCase())
          return partyMatch
        })
        .filter(item => {
          // Only include items not already used by previous ledgers
          const itemId = `${item.ContractNo}_${item.ContractDate}`
          return !usedItems.has(itemId)
        })

      // Mark these items as used
      matchingItems.forEach(item => {
        const itemId = `${item.ContractNo}_${item.ContractDate}`
        usedItems.add(itemId)
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
    const remainingItems = filteredData.filter(item => {
      const itemId = `${item.ContractNo}_${item.ContractDate}`
      return !usedItems.has(itemId)
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

  // Get filtered ledgers based on search term
  const getFilteredLedgers = () => {
    if (!state.LedgerArray) return []
    
    if (!ledgerSearchTerm) return state.LedgerArray
    
    return state.LedgerArray.filter(ledger =>
      ledger.Name && ledger.Name.toLowerCase().includes(ledgerSearchTerm.toLowerCase())
    )
  }

  // Auto-fetch data function
  const fetchReportData = async (overrideLedgerIds = null) => {
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

      // Fetch period data for dropdown
      await fetchPeriodData(
        ledgerIds,
        formatDateForInput(fromDate),
        formatDateForInput(toDate),
        selectedItem
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

  const exportToPDF = () => {
    if (!state.FillArray || state.FillArray.length === 0) {
      toast.error("No data to export")
      return
    }

    // Get grouped data
    const groupedData = getGroupedData(state.FillArray)

    // Create PDF content
    const printWindow = window.open("", "_blank")
    const selectedLedgerNames =
      ledgerDropdown.length > 0
        ? ledgerDropdown.map(id => state.LedgerArray.find(l => l.Id === id).Name || "").join(", ")
        : "All Ledgers"

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
        totals.avgPurRate += parseFloat(item.Rate || 0) // Assuming Rate is purchase rate
        totals.avgSelRate += parseFloat(item.Rate || 0) // Assuming Rate is sell rate
      })

      // Calculate averages
      if (totals.count > 0) {
        totals.avgPurRate = totals.avgPurRate / totals.count
        totals.avgSelRate = totals.avgSelRate / totals.count
      }

      return totals
    }

    // Calculate overall totals
    const overallTotals = calculateGroupTotals(state.FillArray)

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ledger Report</title>
          <style>
            @page {
              size: portrait;
              margin: 0.5cm;
            }
            
            * {
              box-sizing: border-box;
            }
            
            body { 
              font-family: Arial, sans-serif; 
              margin: 0;
              padding: 10px;
              font-size: 8px; 
              background-color: white;
              color: black;
            }
            
            .print-header { 
              text-align: center; 
              margin-bottom: 10px;
              page-break-inside: avoid;
            }
            
            .print-header h1 { 
              margin: 0 0 5px 0;
              font-size: 16px;
              color: #333;
            }
            
            .print-header p { 
              margin: 2px 0;
              font-size: 9px;
              color: #666;
            }
            
            table { 
              width: 100%; 
              border-collapse: collapse;
              font-size: 7px;
              page-break-inside: auto;
            }
            
            thead {
              display: table-header-group;
            }
            
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            
            th, td { 
              border: 1px solid black;
              padding: 2px 3px;
              text-align: left;
              font-size: 7px;
            }
            
            th { 
              background-color: #0000FF;
              color: white;
              font-weight: bold;
              text-align: center;
              padding: 3px;
            }
            
            .group-header { 
              background-color: #D2B48C;
              font-weight: bold;
              color: #2c3e50;
              font-size: 8px;
              padding: 3px 5px;
            }
            
            .group-totals { 
              background-color: #f8f9fa;
              font-weight: bold;
              font-size: 7px;
            }
            
            .overall-totals { 
              background-color: #6C244C;
              color: white;
              font-weight: bold;
              font-size: 7px;
            }
            
            .text-end { 
              text-align: right;
            }
            
            .text-center { 
              text-align: center;
            }
            
            .status-red { background-color: #f8d7da; }
            .status-grey { background-color: #b0b0b0; }
            .status-blue { background-color: #d1ecf1; }
            
            /* Print-specific styles */
            @media print {
              body {
                margin: 0;
                padding: 5px;
              }
              
              table {
                page-break-inside: auto;
              }
              
              thead {
                display: table-header-group;
              }
              
              tr {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              
              th {
                background-color: #0000FF !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .group-header {
                background-color: #D2B48C !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .overall-totals {
                background-color: #6C244C !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .group-totals {
                background-color: #f8f9fa !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .status-red {
                background-color: #f8d7da !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .status-grey {
                background-color: #b0b0b0 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .status-blue {
                background-color: #d1ecf1 !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <h1>Ledger Report</h1>
            <p><strong>Ledger:</strong> ${selectedLedgerNames}</p>
            <p><strong>Period:</strong> ${fromDate.toLocaleDateString()} to ${toDate.toLocaleDateString()}</p>
            <p><strong>Generated on:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Contract No</th>
                <th>Contract Date</th>
                <th>Party</th>
                <th>Broker</th>
                <th>Status</th>
                <th>Tax</th>
                <th>Unit</th>
                <th>Item</th>
                <th>Pur Qty</th>
                <th>Sel Qty</th>
                <th>Vessel</th>
                <th>Rate</th>
                <th>Cont Period</th>
                <th>Delivery Port</th>
                <th>Adv Payment</th>
                <th>Adv Date</th>
                <th>Lifted</th>
                <th>Contract</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              ${groupedData
                .map(group => {
                  const groupTotals = calculateGroupTotals(group.items)
                  
                  return `
                    <tr class="group-header">
                      <td colspan="19">
                        ${group.groupName} (${group.count} ${group.count === 1 ? 'record' : 'records'}) - 
                        Buy Qty: ${groupTotals.purQty.toLocaleString()} | 
                        Sell Qty: ${groupTotals.selQty.toLocaleString()} | 
                        Adv Payment: ${groupTotals.advPayment.toLocaleString()}
                      </td>
                    </tr>
                    ${group.items
                      .map(row => {
                        // Match the exact coloring logic from the view
                        let rowClass = ''
                        
                        if (row.Lifted == 0 || row.Lifted == null || row.Lifted == undefined) {
                          rowClass = 'status-grey' // table-secondary - Not started (light grey)
                        } else if (row.Lifted == row.PurQty || row.Lifted == row.SelQty) {
                          rowClass = 'status-blue' // table-info - Fully lifted (light blue)
                        } else if (row.PurQty > row.Lifted || row.SelQty > row.Lifted) {
                          rowClass = 'status-red' // table-danger - Partially lifted (light red)
                        }
                        
                        return `
                          <tr class="${rowClass}">
                            <td>${row.ContractNo || ""}</td>
                            <td>${row.ContractDate || ""}</td>
                            <td>${row.PartyLedger || ""}</td>
                            <td>${row.BrokerLedger || ""}</td>
                            <td>${row.Status || ""}</td>
                            <td>${row.Tax || ""}</td>
                            <td>${row.Unit || ""}</td>
                            <td>${row.Item || ""}</td>
                            <td class="text-end">${row.PurQty ? parseFloat(row.PurQty).toFixed(2) : "0.00"}</td>
                            <td class="text-end">${row.SelQty ? parseFloat(row.SelQty).toFixed(2) : "0.00"}</td>
                            <td>${row.Vessel || ""}</td>
                            <td class="text-end">${row.Rate ? parseFloat(row.Rate).toFixed(2) : "0.00"}</td>
                            <td class="text-center">${row.ShipmentOrLifted || "-"}</td>
                            <td>${row.DeliveryPort || ""}</td>
                            <td class="text-end">${row.AdvPayment ? parseFloat(row.AdvPayment).toFixed(2) : "0.00"}</td>
                            <td>${row.AdvDate || ""}</td>
                            <td>${row.LiftedDate || ""}</td>
                            <td>${row.Contract || ""}</td>
                            <td>${getCombinedNotes(row)}</td>
                          </tr>
                        `
                      })
                      .join("")}
                  `
                })
                .join("")}
              
              <!-- Overall Totals at the end -->
              <tr class="overall-totals">
                <td colspan="8"><strong>OVERALL TOTALS:</strong></td>
                <td class="text-end"><strong>${overallTotals.purQty.toFixed(2)}</strong></td>
                <td class="text-end"><strong>${overallTotals.selQty.toFixed(2)}</strong></td>
                <td colspan="4"></td>
                <td class="text-end"><strong>${overallTotals.advPayment.toFixed(2)}</strong></td>
                <td colspan="4"></td>
              </tr>
              <tr class="overall-totals">
                <td colspan="8"><strong>OVERALL AVERAGES:</strong></td>
                <td class="text-end"><strong>${(overallTotals.purQty / overallTotals.count).toFixed(2)}</strong></td>
                <td class="text-end"><strong>${(overallTotals.selQty / overallTotals.count).toFixed(2)}</strong></td>
                <td colspan="4"></td>
                <td class="text-end"><strong>${(overallTotals.advPayment / overallTotals.count).toFixed(2)}</strong></td>
                <td colspan="4"></td>
              </tr>
              <tr class="overall-totals">
                <td colspan="19" class="text-center">
                  <strong>Total Records: ${state.FillArray.length} | Total Groups: ${groupedData.length}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </body>
      </html>
    `

    printWindow.document.write(htmlContent)
    printWindow.document.close()
    printWindow.print()
  }

  const exportToExcel = async () => {
    if (!state.FillArray || state.FillArray.length === 0) {
      toast.error("No data to export")
      return
    }

    // Get grouped data
    const groupedData = getGroupedData(state.FillArray)

    const selectedLedgerName =
      state.LedgerArray.find(l => l.Id === parseInt(selectedLedger)).Name ||
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

    // Helper function to get row color based on lifted status
    const getRowColor = row => {
      if (row.Lifted == 0 || row.Lifted == null || row.Lifted == undefined) {
        return "FFB0B0B0" // Grey - Not started
      } else if (row.Lifted == row.PurQty || row.Lifted == row.SelQty) {
        return "FFD1ECF1" // Blue - Fully lifted
      } else if (row.PurQty > row.Lifted || row.SelQty > row.Lifted) {
        return "FFF8D7DA" // Red - Partially lifted
      }
      return "FFFFFFFF" // White - default
    }

    // Calculate overall totals
    const overallTotals = calculateGroupTotals(state.FillArray)

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

    // Column headers
    const headers = [
      "Contract No",
      "Contract Date",
      "Party",
      "Broker",
      "Status",
      "Tax",
      "Unit",
      "Item",
      "PurQty",
      "SelQty",
      "Vessel",
      "Rate",
      "Shipment Date",
      "Lifted Date",
      "Delivery Port/ Place",
      "Adv Payment",
      "Adv Date",
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
      groupHeaderCell.font = { bold: true, size: 12 }
      groupHeaderCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD2B48C" }, // Tan color for group headers
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

      // Add data rows for this group with colors
      group.items.forEach(row => {
        const dataRow = worksheet.getRow(currentRow)
        const rowColor = getRowColor(row)

        const rowData = [
          row.ContractNo || "",
          row.ContractDate || "",
          row.PartyLedger || "",
          row.BrokerLedger || "",
          row.Status || "",
          row.Tax || "",
          row.Unit || "",
          row.Item || "",
          row.PurQty || "0.00",
          row.SelQty || "0.00",
          row.Vessel || "",
          row.Rate || "0.00",
          row.ShipmentDate || "",
          row.LiftedDate || "",
          row.DeliveryPort || "",
          row.AdvPayment || "0.00",
          row.AdvDate || "",
          row.Contract || "",
          getCombinedNotes(row),
        ]

        rowData.forEach((value, index) => {
          const cell = dataRow.getCell(index + 1)
          cell.value = value
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: rowColor },
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
        "",
        groupTotals.advPayment.toFixed(2),
        "",
        "",
        "",
      ]
      totalsData.forEach((value, index) => {
        const cell = totalsRow.getCell(index + 1)
        cell.value = value
        cell.font = { bold: true }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FA" }, // Light grey for totals
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
        "",
        avgAdvPayment,
        "",
        "",
        "",
      ]
      averagesData.forEach((value, index) => {
        const cell = averagesRow.getCell(index + 1)
        cell.value = value
        cell.font = { bold: true }
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFF8F9FA" },
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
        cell.font = { bold: true }
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
      "",
      overallTotals.advPayment.toFixed(2),
      "",
      "",
      "",
    ]
    overallTotalsData.forEach((value, index) => {
      const cell = overallTotalsRow.getCell(index + 1)
      cell.value = value
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF6C244C" }, // Dark purple for overall totals
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
      "",
      (overallTotals.advPayment / overallTotals.count).toFixed(2),
      "",
      "",
      "",
    ]
    overallAvgData.forEach((value, index) => {
      const cell = overallAvgRow.getCell(index + 1)
      cell.value = value
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF6C244C" },
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
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF6C244C" },
      }
    })
    currentRow++

    currentRow++ // Empty row
    worksheet.getCell(`A${currentRow}`).value = `Total Records: ${state.FillArray.length}`
    worksheet.getCell(`A${currentRow}`).font = { bold: true }
    currentRow++
    worksheet.getCell(`A${currentRow}`).value = `Total Groups: ${groupedData.length}`
    worksheet.getCell(`A${currentRow}`).font = { bold: true }

    // Auto-fit columns based on content
    worksheet.columns.forEach((column, columnIndex) => {
      let maxLength = 0
      column.eachCell({ includeEmpty: false }, cell => {
        if (cell.value) {
          const cellValue = cell.value.toString()
          // Account for bold text taking more space
          const lengthMultiplier = cell.font && cell.font.bold ? 1.1 : 1
          const valueLength = cellValue.length * lengthMultiplier
          maxLength = Math.max(maxLength, valueLength)
        }
      })
      
      // Set column width with appropriate min/max bounds
      // Add padding for better readability
      const calculatedWidth = maxLength + 3
      
      // Set minimum width of 8 and maximum of 60
      column.width = Math.max(8, Math.min(calculatedWidth, 60))
    })
    
    // Set specific widths for certain columns for better formatting
    const columnWidths = {
      0: 15,  // Contract No
      1: 15,  // Contract Date
      2: 20,  // Party
      3: 20,  // Broker
      4: 12,  // Status
      5: 10,  // Tax
      6: 10,  // Unit
      7: 20,  // Item
      8: 12,  // PurQty
      9: 12,  // SelQty
      10: 15, // Vessel
      11: 12, // Rate
      12: 15, // Shipment Date
      13: 15, // Lifted Date
      14: 25, // Delivery Port/Place
      15: 15, // Adv Payment
      16: 15, // Adv Date
      17: 15, // Contract
      18: 30, // Note
    }
    
    // Apply specific widths only if current width is smaller
    Object.keys(columnWidths).forEach(colIndex => {
      const col = worksheet.getColumn(parseInt(colIndex) + 1)
      if (col.width < columnWidths[colIndex]) {
        col.width = columnWidths[colIndex]
      }
    })

    // Generate Excel file
    const buffer = await workbook.xlsx.writeBuffer()
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute(
      "download",
      `ledger_report_${selectedLedgerName.replace(/[^a-zA-Z0-9]/g, "_")}_${
        fromDate.toISOString().split("T")[0]
      }_${toDate.toISOString().split("T")[0]}.xlsx`
    )
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    toast.success("Excel exported successfully with colored rows!")
  }

  return (
    <div
      className="ledger-report-root"
      style={{
        height: "100vh",
        marginTop: 0,
        paddingTop: "var(--header-height, 70px)",
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
            <div
              className="ledger-report-filters-scroll"
              style={{
                overflowX: "auto",
                overflowY: "hidden",
                WebkitOverflowScrolling: "touch",
                margin: "0 -2px",
                padding: "0 2px",
              }}
            >
              <Row
                className="g-0 align-items-center"
                style={{
                  backgroundColor: "#f4e4d4",
                  padding: "4px",
                  borderRadius: "4px",
                  flexWrap: "nowrap",
                  minWidth: "min-content",
                  width: "max-content",
                }}
              >
                <Col lg={2} md={2} sm={12}>
                  <FormGroup className="mb-0">
                    <div style={{ display: "flex", alignItems: "center" }}>
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
                          backgroundColor: "#f8f9fa",
                          fontSize: "0.65rem",
                          border: "1px solid #ced4da",
                          height: "28px",
                          padding: "2px 2px",
                          width: "5rem",
                        }}
                      />
                      <span style={{ fontSize: "0.65rem", fontWeight: "500", color: "#495057", margin: "0 2px" }}>To</span>
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
                          backgroundColor: "#f8f9fa",
                          fontSize: "0.65rem",
                          border: "1px solid #ced4da",
                          height: "28px",
                          padding: "2px 2px",
                          width: "5rem",
                        }}
                      />
                    </div>
                  </FormGroup>
                </Col>

                <Col lg={1} md={1} sm={12}>
                  <FormGroup className="mb-0">
                    <Button
                      variant="outline-primary"
                      className="w-100"
                      onClick={handleOpenLedgerModal}
                      style={{
                        fontSize: "0.6rem",
                        height: "28px",
                        padding: "2px 4px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        backgroundColor: "#f8f9fa",
                        border: "1px solid #ced4da",
                        color: "#495057",
                      }}
                    >
                    Ledger Selection
                    <i className="fas fa-chevron-down" style={{ fontSize: "0.55rem" }}></i>
                    </Button>
                  </FormGroup>
                </Col>

                <Col lg={2} md={2} sm={12}>
                  <div
                    style={{
                      border: "1px solid #8B4513",
                      borderRadius: "4px",
                      padding: "2px 4px",
                      backgroundColor: "#f8f9fa",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "nowrap",
                      height: "28px",
                    }}
                  >
                    <div className="form-check" style={{ display: "flex", alignItems: "center", gap: "2px", marginRight: "3px" }}>
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
                        style={{ fontSize: "0.6rem", color: "#dc3545", fontWeight: "bold" }}
                      >
                        <i className="fas fa-hourglass-half" style={{ fontSize: "0.55rem" }}></i>Partially: {state.Pending ? "Y" : "N"}
                      </label>
                    </div>

                    <div className="form-check" style={{ display: "flex", alignItems: "center", gap: "2px", marginRight: "3px" }}>
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
                        style={{ fontSize: "0.6rem", color: "#000000", fontWeight: "bold" }}
                      >
                        <i className="fas fa-clock" style={{ fontSize: "0.55rem" }}></i>UnLifted: {state.NotStarted ? "Y" : "N"}
                      </label>
                    </div>

                    <div className="form-check" style={{ display: "flex", alignItems: "center", gap: "2px" }}>
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
                        style={{ fontSize: "0.6rem", color: "#007bff", fontWeight: "bold" }}
                      >
                        <i className="fas fa-check-circle" style={{ fontSize: "0.55rem" }}></i>Fully: {state.Completed ? "Y" : "N"}
                      </label>
                    </div>
                  </div>
                </Col>

                <Col xs="auto">
                  <Button
                    color="info"
                    style={{
                      fontSize: "0.6rem",
                      height: "28px",
                      padding: "2px 6px",
                      minWidth: "60px",
                    }}
                    onClick={() => openVoucherModal()}
                  >
                    <i className="fas fa-receipt"></i>Vch
                  </Button>
                </Col>

                <Col xs="auto">
                  <Button
                    variant="success"
                    style={{
                      fontSize: "0.65rem",
                      height: "28px",
                      padding: "2px 6px",
                      minWidth: "32px",
                    }}
                    onClick={() => window.open('/Contract', '_blank')}
                  >
                    <i className="fas fa-plus"></i>
                  </Button>
                </Col>

                <Col xs="auto">
                  <div
                    style={{
                      border: "1px solid #8B4513",
                      borderRadius: "4px",
                      padding: "2px 3px",
                      backgroundColor: "#f8f9fa",
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "nowrap",
                      height: "28px",
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
                        style={{ fontSize: "0.6rem", color: "#28a745", fontWeight: "bold" }}
                      >
                        <i className="fas fa-check-circle" style={{ fontSize: "0.55rem" }}></i>LAP: {state.LAP ? "Y" : "N"}
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
              <div className="d-flex align-items-center filter-theme-light" style={{ backgroundColor: "#E3F2FD", padding: "4px", borderRadius: "4px", flexWrap: "nowrap", minWidth: "fit-content", border: "1px solid #2196F3", gap: `${topGap}px` }}>
                {renderFilterBar(topFilterOrder, topFilterWidths, topGap, setTopGap, topDragStart, topDragOver, topDrop, topDragEnd, topTouchDragStart, topTouchDragMove, topTouchDragEnd, topResizeDown, resetTopLayout, renderTopFilterContent)}
              </div>
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
                          <tr style={{ border: "1.5px solid black !important" }}>
                            {getVisibleColumns().map((col) => (
                              <th
                                key={col.key}
                                className={`text-center align-middle${colDragOverKey === col.key ? ' col-drag-over' : ''}`}
                                draggable
                                onDragStart={e => handleColDragStart(e, col.key)}
                                onDragOver={e => handleColDragOver(e, col.key)}
                                onDrop={e => handleColDrop(e, col.key)}
                                onDragEnd={handleColDragEnd}
                                style={{
                                  backgroundColor: "#0000FF",
                                  color: "white",
                                  height: "25px",
                                  fontSize: "0.7rem",
                                  fontWeight: "600",
                                  padding: col.key === 'ContractNo' ? "6px 12px" : "0",
                                  width: `${columnWidths[col.key] || COLUMN_DEFAULT_WIDTHS[col.key] || 80}px`,
                                  minWidth: "30px",
                                  cursor: "grab",
                                  border: "1.5px solid black !important",
                                  boxShadow: "none",
                                  position: "relative",
                                  overflow: "hidden",
                                  userSelect: "none",
                                }}
                                onClick={() => col.sortKey && handleSort(col.sortKey)}
                              >
                                <div className="d-flex justify-content-between align-items-center" style={{ width: "100%", pointerEvents: "none" }}>
                                  <div className="d-flex align-items-center gap-1">
                                    {col.key === 'ContractNo' && (
                                      <input
                                        type="checkbox"
                                        ref={selectAllRef}
                                        checked={allVisibleRowsSelected}
                                        onClick={e => { e.stopPropagation(); handleSelectAllVisibleRows() }}
                                        disabled={visibleRowIds.length === 0}
                                        style={{ width: "12px", height: "12px", margin: "0", cursor: "pointer", pointerEvents: "auto" }}
                                        title="Select all visible contracts"
                                      />
                                    )}
                                    <span>{col.label}</span>
                                    <i className="fas fa-grip-vertical" style={{ fontSize: "0.4rem", opacity: 0.5, marginLeft: "2px" }} title="Drag to reorder"></i>
                                  </div>
                                  {col.sortKey && (
                                    <div className="d-flex flex-column">
                                      <i className={`fas fa-sort-up ${sortConfig.key === col.sortKey && sortConfig.direction === "asc" ? "text-warning" : "text-light"}`} style={{ fontSize: "0.5rem", lineHeight: "0.5rem" }}></i>
                                      <i className={`fas fa-sort-down ${sortConfig.key === col.sortKey && sortConfig.direction === "desc" ? "text-warning" : "text-light"}`} style={{ fontSize: "0.5rem", lineHeight: "0.5rem" }}></i>
                                    </div>
                                  )}
                                </div>
                                <div className="col-resize-handle" onMouseDown={e => { e.stopPropagation(); handleResizeMouseDown(e, col.key) }} onTouchStart={e => { e.stopPropagation(); handleResizeMouseDown(e, col.key) }} style={{ cursor: "col-resize" }} />
                              </th>
                            ))}
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
                                      {getVisibleColumns().map((col) => {
                                        const tdStyle = {
                                          verticalAlign: "middle",
                                          padding: "0",
                                          border: "1.5px solid black",
                                          color: row.Status === "S" ? "red" : "inherit",
                                          fontWeight: row.Status === "S" ? "bold" : "inherit",
                                        }
                                        const tdNumStyle = {
                                          ...tdStyle,
                                          textAlign: "right",
                                          border: "1.5px solid black !important",
                                          borderTop: "1.5px solid black !important",
                                          borderRight: "1.5px solid black !important",
                                          borderBottom: "1.5px solid black !important",
                                          borderLeft: "1.5px solid black !important",
                                          boxShadow: "none",
                                        }
                                        switch (col.key) {
                                          case 'ContractNo': return (
                                            <td key={col.key} className={row.Status === "S" ? "fw-bold" : "fw-semibold"} style={{ ...tdStyle, padding: "6px 12px" }}>
                                              {row.ContractNo ? (
                                                <div className="d-flex align-items-center gap-2">
                                                  <input type="checkbox" checked={rowId ? selectedRowIds.has(rowId) : false} onClick={e => { e.stopPropagation(); toggleRowSelection(row) }} style={{ width: "12px", height: "12px", margin: "0", cursor: "pointer" }} title="Select contract" />
                                                  <Button variant="link" className={`p-0 text-decoration-none fw-bold ${row.Status === "S" ? "text-danger" : "text-primary"}`} style={{ cursor: "pointer", transition: "all 0.2s ease", border: "none", background: "none", padding: "6px 10px", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "0.8rem", whiteSpace: "nowrap", width: "100%", justifyContent: "flex-start", color: row.Status === "S" ? "red" : "#0d6efd", fontWeight: "bold" }} onMouseEnter={e => { e.target.style.color = row.Status === "S" ? "#cc0000" : "#0056b3"; e.target.style.textDecoration = "underline"; e.target.style.backgroundColor = "#f8f9fa" }} onMouseLeave={e => { e.target.style.color = row.Status === "S" ? "red" : "#0d6efd"; e.target.style.textDecoration = "none"; e.target.style.backgroundColor = "transparent" }} onClick={event => { const button = event.target.closest("button"); const orig = button.innerHTML; button.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Loading...'; button.disabled = true; setTimeout(() => { openEditContractModal(row); button.innerHTML = orig; button.disabled = false }, 300) }} title={`Click to edit contract: ${row.ContractNo}`} tabIndex={0} role="button">
                                                    <i className={`fas fa-edit ${row.Status === "S" ? "text-danger" : "text-primary"}`} style={{ color: row.Status === "S" ? "red" : "#0d6efd" }}></i>
                                                    <span>{row.ContractNo}</span>
                                                  </Button>
                                                </div>
                                              ) : "-"}
                                            </td>
                                          )
                                          case 'ContractDate': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={{ ...tdStyle, textAlign: "center", minWidth: "100px" }}>{row.ContractDate || "-"}</td>
                                          case 'Seller': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={tdStyle}>{row.Seller || "-"}</td>
                                          case 'Buyer': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={tdStyle}>{row.Buyer || "-"}</td>
                                          case 'Status': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={{ ...tdStyle, textAlign: "center" }}>{row.Status || "-"}</td>
                                          case 'Unit': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={tdStyle}>{row.Unit || "-"}</td>
                                          case 'Item': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={{ ...tdStyle, textAlign: "center" }}>{row.Item || "-"}</td>
                                          case 'PurQty': return <td key={col.key} className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"} style={tdNumStyle}>{row.PurQty ? parseFloat(row.PurQty).toFixed(2) : "0.00"}</td>
                                          case 'SelQty': return <td key={col.key} className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"} style={tdNumStyle}>{row.SelQty ? parseFloat(row.SelQty).toFixed(2) : "0.00"}</td>
                                          case 'Vessel': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={tdStyle}>{row.Vessel || "-"}</td>
                                          case 'Rate': return <td key={col.key} className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"} style={tdNumStyle}>{row.Rate ? parseFloat(row.Rate).toFixed(2) : "0.00"}</td>
                                          case 'ContPeriod': return <td key={col.key} className={row.Status === "S" ? "text-center fw-bold" : "text-center"} style={tdStyle}>{row.ShipmentOrLifted || "-"}</td>
                                          case 'DeliveryPort': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={tdStyle}>{row.DeliveryPort || "-"}</td>
                                          case 'AdvPayment': return <td key={col.key} className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"} style={tdNumStyle}>{row.AdvPayment ? parseFloat(row.AdvPayment).toFixed(2) : "0.00"}</td>
                                          case 'AdvDate': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={tdStyle}>{row.AdvDate || "-"}</td>
                                          case 'Lifted': return <td key={col.key} className={row.Status === "S" ? "text-end fw-bold" : "text-end fw-semibold"} style={tdNumStyle}>{row.Lifted ? parseFloat(row.Lifted).toFixed(2) : "0.00"}</td>
                                          case 'Contract': return <td key={col.key} className={row.Status === "S" ? "fw-bold" : ""} style={tdStyle}>{row.Contract || "-"}</td>
                                          case 'Lifting': return (
                                            <td key={col.key} className={`ledger-note-cell ${row.Status === "S" ? "fw-bold" : ""}`} style={{ verticalAlign: "top", padding: "0", border: "1.5px solid black", color: row.Status === "S" ? "red" : "inherit", fontWeight: row.Status === "S" ? "bold" : "inherit" }}>
                                              {(() => {
                                                if (!row.LiftingJson) return "-";
                                                try {
                                                  const liftingData = JSON.parse(row.LiftingJson);
                                                  if (!Array.isArray(liftingData) || liftingData.length === 0) return "-";
                                                  return (
                                                    <div style={{ maxHeight: "150px", overflowY: "auto", width: "100%", margin: 0, padding: 0 }}>
                                                      <table style={{ width: "100%", fontSize: "0.55rem", borderCollapse: "collapse", margin: 0, padding: 0, border: "none" }}>
                                                        <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa", zIndex: 1, borderBottom: "1px solid #ccc" }}>
                                                          <tr>
                                                            <th style={{ padding: "2px", textAlign: "left", width: "15%", fontWeight: 600 }}>Date</th>
                                                            <th style={{ padding: "2px", textAlign: "left", width: "25%", fontWeight: 600 }}>LorryNo</th>
                                                            <th style={{ padding: "2px", textAlign: "left", width: "25%", fontWeight: 600 }}>BNo/InvNo</th>
                                                            <th style={{ padding: "2px", textAlign: "left", width: "15%", fontWeight: 600 }}>Qty</th>
                                                            <th style={{ padding: "2px", textAlign: "left", width: "20%", fontWeight: 600 }}>Rate</th>
                                                          </tr>
                                                        </thead>
                                                        <tbody>
                                                          {liftingData.map((lift, idx) => (
                                                            <tr key={idx} style={{ borderBottom: "1px dashed #eee" }}>
                                                              <td style={{ padding: '2px', textAlign: 'left' }}>{lift.LiftDate.substring(0,5) || lift.LiftDate || '-'}</td>
                                                              <td style={{ padding: '2px', textAlign: 'left' }}>{lift.LorryNo || '-'}</td>
                                                              <td style={{ padding: '2px', textAlign: 'left' }}>{lift.BNo || lift.InvoiceNo || '-'}</td>
                                                              <td style={{ padding: '2px', textAlign: 'left' }}>{Number(lift.LiftedQty).toFixed(4).replace(/\.?0+$/, '')}</td>
                                                              <td style={{ padding: '2px', textAlign: 'left' }}>{lift.LastRate || '-'}</td>
                                                            </tr>
                                                          ))}
                                                        </tbody>
                                                      </table>
                                                    </div>
                                                  );
                                                } catch (e) { return "Invalid Data"; }
                                              })()}
                                            </td>
                                          )
                                          case 'Note': return (
                                            <td key={col.key} className={`ledger-note-cell ${row.Status === "S" ? "fw-bold" : ""}`} style={{ verticalAlign: "middle", padding: "0", border: "1.5px solid black", whiteSpace: "pre-wrap", wordBreak: "break-word", maxWidth: "300px", color: row.Status === "S" ? "red" : "inherit", fontWeight: row.Status === "S" ? "bold" : "inherit" }}>
                                              {getCombinedNotes(row)}
                                            </td>
                                          )
                                          default: return null
                                        }
                                      })}
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
                          gap: `${bottomGap}px`,
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

                        {renderFilterBar(bottomFilterOrder, bottomFilterWidths, bottomGap, setBottomGap, bottomDragStart, bottomDragOver, bottomDrop, bottomDragEnd, bottomTouchDragStart, bottomTouchDragMove, bottomTouchDragEnd, bottomResizeDown, resetBottomLayout, renderBottomFilterContent)}

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
                Edit Contract: {selectedContractData.ContractNo || "Unknown"}
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
                          ? state.VoucherNoArray[0].VoucherNoNew || ""
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
                          voucher.VoucherNo.toLowerCase().includes(
                            searchLower
                          ) ||
                          voucher.Narration.toLowerCase().includes(
                            searchLower
                          ) ||
                          state.LedgerArray.find(
                            l => l.Id === parseInt(voucher.F_LedgerMasterCr)
                          )
                            .Name.toLowerCase()
                            .includes(searchLower) ||
                          state.LedgerArray.find(
                            l => l.Id === parseInt(voucher.F_LedgerMasterDr)
                          )
                            .Name.toLowerCase()
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
                            ).Name || "-"}
                          </td>
                          <td>
                            {state.LedgerArray.find(
                              l => l.Id === parseInt(voucher.F_LedgerMasterCr)
                            ).Name || "-"}
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
                        ? state.VoucherNoArray[0].VoucherNoNew ||
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
                          ).Name,
                        }
                        : null
                    }
                    onChange={option => {
                      setVoucherData({
                        ...voucherData,
                        F_LedgerMasterDr: option.value || "",
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
                          ).Name,
                        }
                        : null
                    }
                    onChange={option => {
                      setVoucherData({
                        ...voucherData,
                        F_LedgerMasterCr: option.value || "",
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
                          ? state.VoucherNoArray[0].VoucherNoNew || ""
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
