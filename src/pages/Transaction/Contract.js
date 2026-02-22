import React, { useState, useRef, useEffect } from "react"
import {
  Card,
  CardBody,
  Row,
  Col,
  Form,
  FormGroup,
  Label,
  Table,
  Checkbox,
  Badge,
  Alert,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
} from "reactstrap"
import "./Contract.scss"
import { useLocation, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { Fn_FillListData, Fn_AddEditData, Fn_DeleteData } from "store/Functions"
import { API_WEB_URLS } from "constants/constAPI"
import toastr from "toastr"
import "toastr/build/toastr.css"
import html2pdf from "html2pdf.js"

// Helper function to format date from ISO to yyyy-MM-dd
const formatDateForInput = dateString => {
  if (!dateString) return ""
  if (typeof dateString === "string" && dateString.includes("T")) {
    return dateString.split("T")[0]
  }
  if (dateString instanceof Date) {
    return dateString.toISOString().split("T")[0]
  }
  return dateString
}

// Helper function to create default lifting rows
const createDefaultLiftingRows = (count = 7) => {
  return Array(count)
    .fill()
    .map(() => ({ Date1: "", LorryNo: "", BNo: "", Lifted: "", Rate1: "" }))
}

const Contract = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()

  // Refs for focus management
  const contractNoRef = useRef(null)
  const contractNoSelectRef = useRef(null)
  const dateRef = useRef(null)
  const sellerRef = useRef(null)
  const buyerRef = useRef(null)
  const commodityRef = useRef(null)
  const qtyRef = useRef(null)
  const unitRef = useRef(null)
  const rateRef = useRef(null)
  const importDutyRef = useRef(null)
  const tariffRef = useRef(null)
  const exchangeRateRef = useRef(null)
  const calPerTonDutyRef = useRef(null)
  const contractTypeRef = useRef(null)
  const shipMonthRef = useRef(null)
  const shipYearRef = useRef(null)
  const vesselRef = useRef(null)
  const deliveryPortRef = useRef(null)
  const shipmentFromRef = useRef(null)
  const shipmentToRef = useRef(null)
  const liftedFromRef = useRef(null)
  const liftedToRef = useRef(null)
  const remarksRef = useRef(null)
  const advPaymentRef = useRef(null)
  const pmtRef = useRef(null)
  const advDateRef = useRef(null)
  const note6Ref = useRef(null)
  const note1Ref = useRef(null)
  const note2Ref = useRef(null)
  const note3Ref = useRef(null)
  const note4Ref = useRef(null)
  const note5Ref = useRef(null)
  const saveButtonRef = useRef(null)

  const [state, setState] = useState({
    id: 0,
    Date: new Date().toISOString().split("T")[0],
    Date1: new Date().toISOString().split("T")[0],
    ContractNo: "",
    ContractId: "", // New field for dropdown selection
    originalContractNo: "", // Track original contract number for change detection
    AdvDate: "",
    DiffAmt: 0,
    AdvPayment: "",
    F_SellerLedger: 0,
    F_BuyerLedger: 0,
    F_ItemType: 0,
    Note5: "",
    Note6: "",
    Note1: "",
    Note2: "",
    Note3: "",
    Note4: "",
    Qty: 0,
    Rate: 0,
    Rate1: 0,
    F_UnitMaster: 0,
    F_MonthMaster: 0,
    F_YearMaster: 0,
    LiftingLedger: 0,
    Vessel: "",
    DeliveryPort: "",
    F_ContractH: "",
    ShipMentFromDate: null,
    ShipMentToDate: null,
    LiftedFromDate: null,
    LiftedToDate: null,
    F_ContractLedger: 0,
    Remarks: "",
    LorryNo: "",
    BNo: "",
    Lifted: "",
    AvgRate: 0,
    InvRate: 0,
    askForPrint: false,
    pdfPrint: false,
    pending: "",
    pmt: "",
    lifting: "",
    avgRate: "",
    BackSellerCNo: "",
    importDuty: 0,
    tariff: 0,
    exchangeRate: 0,
    calPerTonDuty: 0,
    liftingData: [],
    ContractHNo: [],
    PartyAccountArray: [],
    TaxAccountArray: [],
    PartyAccountArray1: [],
    PartyAccountArray2: [],
    TaxAccountArray1: [],
    UnitArray: [],
    ItemArray: [],
    MonthArray: [],
    YearArray: [],
    GlobalArray: [],
    ContractArray: [],
    NewArray: [],
    LiftingArray: [],
    NotesArray: [],
    formData: {},
    isProgress: false,
    showSuccessMessage: false,
    showErrorMessage: false,
    message: "",
    isEditMode: false,
    // New state variables for lifting validation and calculations
    totalLiftingQty: 0,
    contractQty: 0,
    showLiftingAlert: false,
    liftingAlertMessage: "",
    DiffAmt: "0.00",
    lastContractNo: "", // Store first contract number for reference
    contractNumberChanged: false, // Track if contract number has been changed by user
  })

  const [liftingRows, setLiftingRows] = useState(createDefaultLiftingRows(7))

  // Modal state variables
  const [sellerModal, setSellerModal] = useState(false)

  const [newPartyData, setNewPartyData] = useState({ Name: "", Person: "", Address: "", GSTNo: "" })

  const [commodityModal, setCommodityModal] = useState(false)

  const [newCommodityData, setNewCommodityData] = useState({ Name: "" })

  const [contractModal, setContractModal] = useState(false)


  const [newContractData, setNewContractData] = useState({ Name: "" })



  const API_URL_SAVE = `${API_WEB_URLS.ContractH}/0/token`
  const API_URL_Lifting = `${API_WEB_URLS.AddLifting}/0/token`
  const API_URL = API_WEB_URLS.MASTER + "/0/token/PartyAccount"
  const API_URL1 = API_WEB_URLS.MASTER + "/0/token/TaxAccount"
  const API_URL2 = API_WEB_URLS.MASTER + "/0/token/UnitMaster"
  const API_URL3 = API_WEB_URLS.MASTER + "/0/token/ItemMaster"
  const API_URL4 = API_WEB_URLS.MASTER + "/0/token/MonthMaster"
  const API_URL4_Year = API_WEB_URLS.MASTER + "/0/token/YearMaster"
  const API_URL5 = API_WEB_URLS.MASTER + "/0/token/UpdateGlobalOptions"
  const API_URL6 = API_WEB_URLS.MASTER + "/0/token/PartyAccount1"
  const API_URL7 = API_WEB_URLS.MASTER + "/0/token/ContractHNoWeb"
  const API_URL8 = API_WEB_URLS.MASTER + "/0/token/ContractHMaster"
  // const API_URL9 = API_WEB_URLS.MASTER + "/0/token/ContractNoNew"
  const API_URL10 = API_WEB_URLS.MASTER + "/0/token/LiftingMaster"
  const API_URL11 = API_WEB_URLS.MASTER + "/0/token/Notes"
  const API_Delete = API_WEB_URLS.MASTER + "/0/token/DeleteContract"

  const API_SaveLedger = `${API_WEB_URLS.LedgerMaster}/0/token`
  const API_SaveCommodity = `${API_WEB_URLS.ItemMaster}/0/token`

  useEffect(() => {
    // Load master data
    Fn_FillListData(dispatch, setState, "PartyAccountArray", API_URL + "/Id/0")
    Fn_FillListData(dispatch, setState, "TaxAccountArray", API_URL1 + "/Id/0")
    Fn_FillListData(dispatch, setState, "UnitArray", API_URL2 + "/Id/0")
    Fn_FillListData(dispatch, setState, "ItemArray", API_URL3 + "/Id/0")
    Fn_FillListData(dispatch, setState, "MonthArray", API_URL4 + "/Id/0")
    Fn_FillListData(dispatch, setState, "YearArray", API_URL4_Year + "/Id/0")
    Fn_FillListData(dispatch, setState, "GlobalArray", API_URL5 + "/Id/0")
    Fn_FillListData(dispatch, setState, "ContractHNo", API_URL7 + "/Id/0")
    Fn_FillListData(dispatch, setState, "NotesArray", API_URL11 + "/Id/0")
    // Fn_FillListData(dispatch, setState, "NewArray", API_URL9 + "/Id/0")

    // Reset lifting data and calculations on initial load
    setLiftingRows(createDefaultLiftingRows(7))
    setState(prev => ({
      ...prev,
      LiftingArray: [],
      totalLiftingQty: 0,
      DiffAmt: "0.00",
      showLiftingAlert: false,
      liftingAlertMessage: "",
      isEditMode: false,
      originalContractNo: "", // Initialize original contract number
      contractNumberChanged: false, // Initialize contract number changed flag
    }))
  }, [])

  // Load first contract data when ContractHNo is loaded
  useEffect(() => {
    if (state.ContractHNo && state.ContractHNo.length > 0) {
      loadFirstContractData()
    }
  }, [state.ContractHNo])

  // Function to load first contract data for edit mode
  const loadFirstContractData = async () => {
    try {
      // Get the first contract from ContractHNo array
      if (state.ContractHNo && state.ContractHNo.length > 0) {
        const firstContract = state.ContractHNo[0]
        
        // Load the first contract's full data
        await Fn_FillListData(
          dispatch,
          setState,
          "ContractArray",
          `${API_URL8}/Id/${firstContract.Id}`
        )

        // After ContractArray is updated, populate the form with first contract data
        setTimeout(async () => {
          setState(prev => {
            const firstContractData = prev.ContractArray[0] || {}

            if (firstContractData.Id) {
              // Load contact person data for seller and buyer
              if (firstContractData.F_SellerLedger) {
                Fn_FillListData(
                  dispatch,
                  setState,
                  "PartyAccountArray1",
                  `${API_URL6}/Id/${firstContractData.F_SellerLedger}`
                )
              }

              if (firstContractData.F_BuyerLedger) {
                Fn_FillListData(
                  dispatch,
                  setState,
                  "PartyAccountArray2",
                  `${API_URL6}/Id/${firstContractData.F_BuyerLedger}`
                )
              }

              // Fetch lifting data using ContractH ID
              Fn_FillListData(
                dispatch,
                setState,
                "LiftingArray",
                `${API_URL10}/Id/${firstContractData.Id}`
              )
              console.log("firstContractData--------->", firstContractData)
              return {
                ...prev,
                id: firstContractData.Id || 0,
                Date: formatDateForInput(firstContractData.Date) || new Date().toISOString().split("T")[0],
                Date1: new Date().toISOString().split("T")[0],
                ContractNo: firstContractData.ContractNo || "",
                ContractId: firstContract.Id,
                originalContractNo: firstContractData.ContractNo || "",
                contractNumberChanged: false,
                F_SellerLedger: firstContractData.F_SellerLedger || 0,
                F_BuyerLedger: firstContractData.F_BuyerLedger || 0,
                F_ItemType: firstContractData.F_ItemType || 0,
                Qty: firstContractData.Qty || 0,
                Rate: firstContractData.Rate || 0,
                InvRate: firstContractData.InvRate || firstContractData.Rate || 0,
                F_UnitMaster: firstContractData.F_UnitMaster || 0,
                F_MonthMaster: firstContractData.F_MonthMaster || 0,
                F_YearMaster: firstContractData.F_YearMaster || 0,
                Vessel: firstContractData.Vessel || "",
                DeliveryPort: firstContractData.DeliveryPort || "",
                F_ContractH: "",
                ShipMentFromDate: firstContractData.ShipMentFromDate || "",
                ShipMentToDate: firstContractData.ShipMentToDate || "",
                LiftedFromDate: firstContractData.LiftedFromDate || "",
                LiftedToDate: firstContractData.LiftedToDate || "",
                F_ContractLedger: firstContractData.F_ContractLedger || 0,
                Remarks: firstContractData.Remarks || "",
                AdvPayment: firstContractData.AdvPayment || "",
                AdvDate: firstContractData.AdvDate || "",
                Note5: firstContractData.Note5 || "",
                Note6: firstContractData.Note6 || "",
                Note1: firstContractData.Note1 || "",
                Note2: firstContractData.Note2 || "",
                Note3: firstContractData.Note3 || "",
                Note4: firstContractData.Note4 || "",
                importDuty: firstContractData.importDuty || 0,
                tariff: firstContractData.tariff || 0,
                exchangeRate: firstContractData.exchangeRate || 0,
                calPerTonDuty: firstContractData.calPerTonDuty || 0,
                isEditMode: true, // Edit mode
                isEditingEnabled: false,
                contractQty: firstContractData.Qty || 0,
                BackSellerCNo: firstContractData.BackSellerCNo || "",
                SellerPerson: firstContractData.SellerPerson || "",
                BuyerPerson: firstContractData.BuyerPerson || "",
                LiftingLedger: firstContractData.LiftingLedger || "",
                // Store first contract number for reference
                lastContractNo: firstContractData.ContractNo || "",
              }
            }
            return prev
          })
        }, 200)
      }
    } catch (error) {
      console.log("Error loading last contract data:", error)
    }
  }

  // Set ContractNo to ContractNoNew when NewArray is loaded (for new contracts)
  useEffect(() => {
     {
      setState(prev => ({
        ...prev,
        ContractNo:  state.ContractNo,
        ContractId: "", // Clear ContractId for new contracts
      }))
    }
  }, [state.ContractNo])

  // Focus on ContractNo field when page loads
  useEffect(() => {
    // Focus on ContractNo field when page loads
    if (contractNoRef.current) {
      contractNoRef.current.focus()
    }
  }, [])

  // Add keyboard shortcut for Ctrl+S to save/update form
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if Ctrl+S is pressed (works for both add and edit modes)
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault() // Prevent default browser save behavior
        
        // Check if required data is loaded
        if (!state.F_SellerLedger || !state.F_BuyerLedger || !state.F_ItemType || !state.Qty || !state.Rate) {
          alert('Please wait for the form data to load completely before saving, or fill in the required fields manually.')
          return
        }
        
        // Check if ContractNo is filled
        if (!state.ContractNo || state.ContractNo.trim() === "") {
          alert('Please enter a contract number before saving.')
          // Focus on the contract number field
          if (contractNoRef.current) {
            contractNoRef.current.focus()
          }
          return
        }
        
        // Show confirmation alert with appropriate message based on mode
        const actionText = state.isEditMode ? 'update' : 'save'
        if (window.confirm(`Are you sure you want to ${actionText} this contract?`)) {
          handleSave()
        }
      }
    }

    // Add event listener
    document.addEventListener('keydown', handleKeyDown)

    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [state.isEditMode, state.F_SellerLedger, state.F_BuyerLedger, state.F_ItemType, state.Qty, state.Rate, state.ContractNo]) // Re-run when edit mode or required fields change

  // Process LiftingArray data when it changes
  useEffect(() => {
    // Only process if we're in edit mode (contract is selected) or if LiftingArray has actual data
    if (
      !state.isEditMode &&
      (!state.LiftingArray || state.LiftingArray.length === 0)
    ) {
      // Reset to empty state on initial load
      setLiftingRows([
        { Date1: "", LorryNo: "", BNo: "", Lifted: "", Rate1: "" },
        { Date1: "", LorryNo: "", BNo: "", Lifted: "", Rate1: "" },
        { Date1: "", LorryNo: "", BNo: "", Lifted: "", Rate1: "" },
        { Date1: "", LorryNo: "", BNo: "", Lifted: "", Rate1: "" },
        { Date1: "", LorryNo: "", BNo: "", Lifted: "", Rate1: "" },
        { Date1: "", LorryNo: "", BNo: "", Lifted: "", Rate1: "" },
        { Date1: "", LorryNo: "", BNo: "", Lifted: "", Rate1: "" },
      ])
      setState(prev => ({
        ...prev,
        totalLiftingQty: 0,
        DiffAmt: "0.00",
        showLiftingAlert: false,
        liftingAlertMessage: "",
      }))
      return
    }

    console.log("LiftingArray changed:", state.LiftingArray)

    let totalLiftingQty = 0
    let liftingRowsData = []

    if (state.LiftingArray && state.LiftingArray.length > 0) {
      // Process all lifting records from LiftingArray
      state.LiftingArray.forEach((record, index) => {
        console.log(`Processing lifting record ${index}:`, record)
        if (
          record.Date1 ||
          record.LorryNo ||
          record.BNo ||
          record.Lifted ||
          record.Rate1 ||
          record.DiffAmt ||
          record.AvgRate
        ) {
          const liftingRowData = {
            Date1: formatDateForInput(record.Date1 || ""),
            LorryNo: record.LorryNo || "",
            BNo: record.BNo || "",
            Lifted: record.Lifted || "",
            Rate1: record.Rate1 || "",
            DiffAmt: record.DiffAmt || "",
            AvgRate: record.AvgRate || "",
          }

          liftingRowsData.push(liftingRowData)
          totalLiftingQty += parseFloat(record.Lifted || 0)
          console.log(`Added lifting row:`, liftingRowData)
        }
      })

      console.log("Total lifting rows found:", liftingRowsData.length)
      console.log("Total lifting quantity:", totalLiftingQty)
    }

    // Set lifting rows based on the processed data
    if (liftingRowsData.length > 0) {
      setLiftingRows(liftingRowsData)
    } else {
      setLiftingRows(createDefaultLiftingRows(7))
    }

    // Only calculate DiffAmt and show alerts if we have a contract selected
    if (state.isEditMode && (state.Qty > 0 || state.contractQty > 0)) {
      // Calculate DiffAmt
      const invoiceRate = parseFloat(state.InvRate || state.Rate || 0)
      let totalDiffAmt = 0

      liftingRowsData.forEach(row => {
        const liftedQty = parseFloat(row.Lifted || 0)
        const liftingRate = parseFloat(row.Rate1 || 0)
        if (liftedQty > 0 && liftingRate > 0) {
          // Calculate difference for this row: (lifting rate - invoice rate) * quantity
          const rowDiffAmt = (liftingRate - invoiceRate) * liftedQty
          totalDiffAmt += rowDiffAmt
        }
      })

      const diffAmt = totalDiffAmt
      console.log("diffAmt", diffAmt)

      // Update lifting validation state
      setState(prev => ({
        ...prev,
        totalLiftingQty,
        DiffAmt: diffAmt.toFixed(2),
        showLiftingAlert: totalLiftingQty > (prev.contractQty || prev.Qty || 0),
        liftingAlertMessage:
          totalLiftingQty > (prev.contractQty || prev.Qty || 0)
            ? `Lifting quantity (${totalLiftingQty}) exceeds contract quantity (${
                prev.contractQty || prev.Qty || 0
              }). Please adjust.`
            : "",
      }))
    } else {
      // Reset calculations when no contract is selected
      setState(prev => ({
        ...prev,
        totalLiftingQty,
        DiffAmt: "0.00",
        showLiftingAlert: false,
        liftingAlertMessage: "",
      }))
    }
  }, [state.LiftingArray, state.isEditMode, state.Qty, state.contractQty])

  const handleInputChange = async e => {
    const { name, value, type, checked } = e.target

    // For checkboxes
    const newValue = type === "checkbox" ? checked : value

    // Update state directly for all fields including notes
    setState(prev => ({ ...prev, [name]: newValue }))

    // Auto-update InvRate when Rate is changed
    if (name === "Rate") {
      setState(prev => ({ ...prev, InvRate: value || 0 }))

      // Recalculate DiffAmt when contract rate changes
      const invoiceRate = parseFloat(value || 0)
      let totalDiffAmt = 0

      liftingRows.forEach(row => {
        const liftedQty = parseFloat(row.Lifted || 0)
        const liftingRate = parseFloat(row.Rate1 || 0)
        if (liftedQty > 0 && liftingRate > 0) {
          // Calculate difference for this row: (lifting rate - invoice rate) * quantity
          const rowDiffAmt = (liftingRate - invoiceRate) * liftedQty
          totalDiffAmt += rowDiffAmt
        }
      })

      const diffAmt = totalDiffAmt

      setState(prev => ({
        ...prev,
        InvRate: value || 0,
        DiffAmt: diffAmt.toFixed(2),
      }))
    }

    // Recalculate lifting quantities when contract quantity changes
    if (name === "Qty") {
      const contractQty = parseFloat(value || 0)
      const totalLiftingQty = liftingRows.reduce((sum, row) => {
        return sum + parseFloat(row.Lifted || 0)
      }, 0)

      setState(prev => ({
        ...prev,
        contractQty,
        totalLiftingQty,
        showLiftingAlert: totalLiftingQty > contractQty,
        liftingAlertMessage:
          totalLiftingQty > contractQty
            ? `Lifting quantity (${totalLiftingQty}) exceeds contract quantity (${contractQty}). Please adjust.`
            : "",
      }))
    }

    // Handle ContractNo changes - allow editing for new contracts
    if (name === "ContractNo") {
      setState(prev => ({
        ...prev,
        ContractId: "", // Clear dropdown selection when manually typing
        ContractArray: [], // Clear any loaded contract data
        LiftingArray: [], // Clear lifting data
        isEditMode: false, // Reset to add mode
        // Keep the form data but allow contract number to be changed
      }))
    }

    if (name === "F_SellerLedger" && value) {
      // Call API with selected ID for PartyAccountArray1
      await Fn_FillListData(
        dispatch,
        setState,
        "PartyAccountArray1",
        `${API_URL6}/Id/${value}`
      )
    }

    if (name === "F_BuyerLedger" && value) {
      // Call API with selected ID for TaxAccountArray1
      await Fn_FillListData(
        dispatch,
        setState,
        "PartyAccountArray2",
        `${API_URL6}/Id/${value}`
      )
    }

    if (name === "ContractId" && value) {
      // Check if this is an existing contract by trying to load it
      try {
        await Fn_FillListData(
          dispatch,
          setState,
          "ContractArray",
          `${API_URL8}/Id/${value}`
        )

        // After ContractArray is updated, check if we found a contract
        setTimeout(async () => {
          setState(prev => {
            const contract = prev.ContractArray[0] || {}

            // If we found a contract, load its data for editing
            if (contract.Id) {
              // Load contact person data for seller and buyer
              if (contract.F_SellerLedger) {
                Fn_FillListData(
                  dispatch,
                  setState,
                  "PartyAccountArray1",
                  `${API_URL6}/Id/${contract.F_SellerLedger}`
                )
              }

              if (contract.F_BuyerLedger) {
                Fn_FillListData(
                  dispatch,
                  setState,
                  "PartyAccountArray2",
                  `${API_URL6}/Id/${contract.F_BuyerLedger}`
                )
              }
              if (contract.LiftingLedger) {
                Fn_FillListData(
                  dispatch,
                  setState,
                  "PartyAccountArray",
                  `${API_URL6}/Id/${contract.LiftingLedger}`
                )
              }

              // Fetch lifting data using ContractH ID
              Fn_FillListData(
                dispatch,
                setState,
                "LiftingArray",
                `${API_URL10}/Id/${contract.Id}`
              )
              console.log("contract--------->", contract)
              return {
                ...prev,
                id: contract.Id || 0,
                Date:
                  formatDateForInput(contract.Date) ||
                  new Date().toISOString().split("T")[0],
                ContractNo: contract.ContractNo || "",
                ContractId: value, // Keep the selected ID
                F_SellerLedger: contract.F_SellerLedger || 0,
                F_BuyerLedger: contract.F_BuyerLedger || 0,
                F_ItemType: contract.F_ItemType || 0,
                Qty: contract.Qty || 0,
                Rate: contract.Rate || 0,
                InvRate: contract.InvRate || contract.Rate || 0,
                F_UnitMaster: contract.F_UnitMaster || 0,
                F_MonthMaster: contract.F_MonthMaster || 0,
                F_YearMaster: contract.F_YearMaster || 0,
                F_YearMaster: contract.F_YearMaster || 0,
                Vessel: contract.Vessel || "",
                DeliveryPort: contract.DeliveryPort || "",
                ShipMentFromDate: contract.ShipMentFromDate || "",
                ShipMentToDate: contract.ShipMentToDate || "",
                LiftedFromDate: contract.LiftedFromDate || "",
                LiftedToDate: contract.LiftedToDate || "",
                F_ContractLedger: contract.F_ContractLedger || 0,
                Remarks: contract.Remarks || "",
                AdvPayment: contract.AdvPayment || "",
                AdvDate: contract.AdvDate || "",
                Note5: contract.Note5 || "",
                Note6: contract.Note6 || "",
                importDuty: contract.importDuty || 0,
                tariff: contract.tariff || 0,
                exchangeRate: contract.exchangeRate || 0,
                calPerTonDuty: contract.calPerTonDuty || 0,
                isEditMode: true,
                isEditingEnabled: false, // Reset editing enabled when loading contract
                contractQty: contract.Qty || 0,
                BackSellerCNo: contract.BackSellerCNo || "",
                SellerPerson: contract.SellerPerson || "",
                BuyerPerson: contract.BuyerPerson || "",
                LiftingLedger: contract.LiftingLedger || "",

                
              }
            } else {
              // No existing contract found, this is a new contract number
              return {
                ...prev,
                id: 0,
                ContractArray: [],
                LiftingArray: [],
                isEditMode: false,
                // Keep the manually entered contract number
                ContractNo: "",
                originalContractNo: "", // Reset original contract number
                LiftingLedger: "",
              }
            }
          })
        }, 200)
      } catch (error) {
        // If API call fails, treat as new contract
        console.log("No existing contract found, treating as new contract")
        setState(prev => ({
          ...prev,
          id: 0,
          ContractArray: [],
          LiftingArray: [],
          isEditMode: false,
          ContractNo: "",
          originalContractNo: "", // Reset original contract number
          LiftingLedger: "",
        }))
      }
    } else if (name === "ContractId" && !value) {
      // Clear all data when no contract is selected
      setLiftingRows(createDefaultLiftingRows(7))
      setState(prev => ({
        ...prev,
        ContractArray: [],
        LiftingArray: [],
        totalLiftingQty: 0,
        showLiftingAlert: false,
        liftingAlertMessage: "",
        isEditMode: false,
        isEditingEnabled: false, // Reset editing enabled when clearing form
        // Reset ContractNo to ContractNoNew for new contracts
        ContractNo: "",
        originalContractNo: "", // Reset original contract number
          LiftingLedger: "",
      }))
    }
  }

  // Modal toggle functions
  const toggleSellerModal = () => {
    setSellerModal(!sellerModal)
    if (!sellerModal) {
      setNewPartyData({ Name: "", Person: "", Address: "", GSTNo: "" })
    }
  }

  const toggleContractModal = () => {
    setContractModal(!contractModal)
    if (!contractModal) {
      setNewContractData({ Name: "" })
    }
  }

  const handleContractModalInputChange = (field, value) => {
    setNewContractData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleCommodityModalInputChange = (field, value) => {
    setNewCommodityData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const toggleCommodityModal = () => {
    setCommodityModal(!commodityModal)
    if (!commodityModal) {
      setNewCommodityData({ Name: "" })
    }
  }

  // Handle modal form input changes
  const handleModalInputChange = (field, value) => {
    setNewPartyData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  // Save new party data
  const handleSaveNewParty = async () => {
    const formData = new FormData()
    formData.append("Name", newPartyData.Name || "")
    formData.append("Person", newPartyData.Person || "")
    formData.append("Address", newPartyData.Address || "")
    formData.append("GSTNo", newPartyData.GSTNo || "")
    formData.append("F_LedgerGroupMaster", 40)

    const res = await Fn_AddEditData(
      dispatch,
      setNewPartyData,
      { arguList: { id: 0, formData } },
      API_SaveLedger,
      true,
      "NewTender",
      navigate,
      "#"
    )

    setSellerModal(false)
    Fn_FillListData(dispatch, setState, "PartyAccountArray", API_URL + "/Id/0")
  }

  // Save new contract data
  const handleSaveNewContract = async () => {
    const formData = new FormData()
    formData.append("Name", newContractData.Name || "")
    formData.append("F_LedgerGroupMaster", 12)

    const res = await Fn_AddEditData(
      dispatch,
      setNewContractData,
      { arguList: { id: 0, formData } },
      API_SaveLedger,
      true,
      "NewTender",
      navigate,
      "#"
    )

    setContractModal(false)
    Fn_FillListData(dispatch, setState, "TaxAccountArray", API_URL1 + "/Id/0")
  }


   // Save new contract data
   const handleSaveNewCommodity = async () => {
    const formData = new FormData()
    formData.append("Name", newCommodityData.Name || "")
     

    const res = await Fn_AddEditData(
      dispatch,
      setNewCommodityData,
      { arguList: { id: 0, formData } },
      API_SaveCommodity,
      true,
      "NewTender",
      navigate,
      "#"
    )

    setCommodityModal(false)
    Fn_FillListData(dispatch, setState, "ItemArray", API_URL3 + "/Id/0")
  }

  // Function to handle updating existing contract with new contract number
  const handleUpdateExistingContract = () => {
    // Check if user is trying to update an existing contract with a new contract number
    
    
    // Normal save/update
    handleSave()
  }


  // New function to enable editing
  const handleEnableEditing = () => {
    setState(prev => ({
      ...prev,
      isEditingEnabled: true,
    }))
  }

  const handleSave = async () => {
    try {
      setState(prev => ({
        ...prev,
        isProgress: true,
        showSuccessMessage: false,
        showErrorMessage: false,
      }))

      const formData = new FormData()

      // Get current form values from DOM to ensure we have the latest data
      const getCurrentFormValue = (fieldName) => {
        const element = document.querySelector(`[name="${fieldName}"]`)
        return element ? element.value : ""
      }

      // Use current state values and DOM values for editing
      formData.append("Date", getCurrentFormValue("Date") || state.Date || "")
      
      // Handle ContractNo based on whether ContractId is selected or not
      let contractNoToSave = getCurrentFormValue("ContractCombined") || state.ContractNo || ""
      
      // Determine if this is a new contract or update
      const isNewContract = !state.ContractId || state.ContractId === ""
      const isContractNumberChanged = state.contractNumberChanged && state.ContractNo !== state.originalContractNo
      
      // If contract number changed and we're in edit mode, treat as new contract
      if (state.isEditMode && isContractNumberChanged) {
        // Reset ID to 0 to create new contract
        formData.append("Id", 0)
      } else if (state.isEditMode && state.id) {
        // Use existing ID for update when in edit mode
        formData.append("Id", state.id)
      } else {
        // Use existing ID for update or 0 for new contract
        formData.append("Id", state.id || 0)
      }
      
      formData.append("ContractNo", contractNoToSave)
      formData.append(
        "F_UnitMaster",
        state.GlobalArray?.[0]?.F_UnitMaster  || ""
      )
      formData.append("F_SellerLedger", getCurrentFormValue("F_SellerLedger") || state.F_SellerLedger || 0)
      formData.append("F_BuyerLedger", getCurrentFormValue("F_BuyerLedger") || state.F_BuyerLedger || 0)
      formData.append("F_ItemType", getCurrentFormValue("F_ItemType") || state.F_ItemType || 0)
      formData.append("Qty", getCurrentFormValue("Qty") || state.Qty || 0)
      formData.append("Rate", getCurrentFormValue("Rate") || state.Rate || 0)
      formData.append("InvRate", state.InvRate || getCurrentFormValue("Rate") || state.Rate || 0)
      formData.append("F_MonthMaster", getCurrentFormValue("F_MonthMaster") || state.F_MonthMaster || 0)
      formData.append("F_YearMaster", getCurrentFormValue("F_YearMaster") || state.F_YearMaster || 0)
      formData.append("Vessel", getCurrentFormValue("Vessel") || state.Vessel || "")
      formData.append("DeliveryPort", getCurrentFormValue("DeliveryPort") || state.DeliveryPort || "")
      formData.append("ShipMentFromDate", getCurrentFormValue("ShipMentFromDate") || state.ShipMentFromDate || "")
      formData.append("ShipMentToDate", getCurrentFormValue("ShipMentToDate") || state.ShipMentToDate || "")
      formData.append("LiftedFromDate", getCurrentFormValue("LiftedFromDate") || state.LiftedFromDate || "")
      formData.append("LiftedToDate", getCurrentFormValue("LiftedToDate") || state.LiftedToDate || "")
      formData.append("F_ContractLedger", getCurrentFormValue("F_ContractLedger") || state.F_ContractLedger || 0)
      formData.append("Remarks", getCurrentFormValue("Remarks") || state.Remarks || "")
      formData.append("AdvPayment", getCurrentFormValue("AdvPayment") || state.AdvPayment || "")
      formData.append("AdvDate", getCurrentFormValue("AdvDate") || state.AdvDate || "")
      formData.append("BackSellerCNo", getCurrentFormValue("BackSellerCNo") || state.BackSellerCNo || "")
      formData.append("importDuty", getCurrentFormValue("importDuty") || state.importDuty || 0)
      formData.append("tariff", getCurrentFormValue("tariff") || state.tariff || 0)
      formData.append("exchangeRate", getCurrentFormValue("exchangeRate") || state.exchangeRate || 0)
      formData.append("calPerTonDuty", getCurrentFormValue("calPerTonDuty") || state.calPerTonDuty || 0)
      formData.append("SellerPerson", state.PartyAccountArray1?.[0]?.Person || "")
      formData.append("BuyerPerson", state.PartyAccountArray2?.[0]?.Person || "")
      formData.append("Note5", getCurrentFormValue("Note5") || state.Note5 || "")
      formData.append("Note6", getCurrentFormValue("Note6") || state.Note6 || "")
      formData.append("Note1", getCurrentFormValue("Note1") || state.Note1 || "")
      formData.append("Note2", getCurrentFormValue("Note2") || state.Note2 || "")
      formData.append("Note3", getCurrentFormValue("Note3") || state.Note3 || "")
      formData.append("Note4", getCurrentFormValue("Note4") || state.Note4 || "")
      formData.append("LiftingLedger", getCurrentFormValue("LiftingLedger") || state.LiftingLedger || 0)
      // Determine the correct ID for the API call
      let apiId = 0
      if (state.isEditMode && !isContractNumberChanged && state.id) {
        // Update existing contract - use the actual contract ID
        apiId = state.id
      } else if (isNewContract || (state.isEditMode && isContractNumberChanged)) {
        // Create new contract - use 0
        apiId = 0
      } else {
        // Fallback - use 0 for new contracts
        apiId = 0
      }

      // Create dynamic API URL with the correct ID
      const dynamicApiUrl = `${API_WEB_URLS.ContractH}/${apiId}/token`

      const res = await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: apiId, formData } },
        dynamicApiUrl,
        true,
        "NewTender",
        navigate,
        "#"
      )

      console.log("res", res)

      // Show success message based on operation type
      if (res && res.success) {
        if (isNewContract || (state.isEditMode && isContractNumberChanged)) {
          const message = isContractNumberChanged 
            ? `New contract ${contractNoToSave} created successfully from contract ${state.originalContractNo}!`
            : `New contract ${contractNoToSave} created successfully!`
          
          setState(prev => ({
            ...prev,
            showSuccessMessage: true,
            message: message,
            isProgress: false,
          }))
        } else {
          setState(prev => ({
            ...prev,
            showSuccessMessage: true,
            message: `Contract ${contractNoToSave} updated successfully!`,
            isProgress: false,
          }))
        }
        
        // Reset the contract number changed flag after successful save
        setState(prev => ({
          ...prev,
          contractNumberChanged: false,
          originalContractNo: contractNoToSave, // Update to the new contract number
        }))
      }

      // Get contract quantity for validation
      const contractQty = parseFloat(
        getCurrentFormValue("Qty") || state.Qty || state.ContractArray?.[0]?.Qty || 0
      )

      // Calculate total lifting quantity
      const validLiftingRows = liftingRows.filter(
        row => row.Date1 || row.LorryNo || row.BNo || row.Lifted || row.Rate1
      )

      const totalLiftingQty = validLiftingRows.reduce((sum, row) => {
        return sum + parseFloat(row.Lifted || 0)
      }, 0)

      // Validate lifting quantity
      if (totalLiftingQty > contractQty) {
        setState(prev => ({
          ...prev,
          isProgress: false,
          showLiftingAlert: true,
          liftingAlertMessage: `Lifting quantity (${totalLiftingQty}) cannot exceed contract quantity (${contractQty}). Please adjust the lifting quantities.`,
        }))
        return
      }

      // Save lifting data with the response ID from ContractH in JSON format
      if (validLiftingRows.length > 0) {
        const liftingDataArray = validLiftingRows.map(row => {
          const invoiceRate = parseFloat(state.InvRate || getCurrentFormValue("Rate") || state.Rate || 0)
          const liftingRate = parseFloat(row.Rate1 || 0)
          const liftingQty = parseFloat(row.Lifted || 0)
          // Calculate difference: (lifting rate - invoice rate) * quantity
          const diffAmt = (liftingRate - invoiceRate) * liftingQty

          return {
            // F_ContractH: res.id || res.Id || state.id,
            Date: row.Date1 || "",
            LorryNo: row.LorryNo || "",
            BNo: row.BNo || "",
            Lifted: parseFloat(row.Lifted || 0),
            Rate: parseFloat(row.Rate1 || 0),
            DiffAmt: parseFloat(diffAmt.toFixed(2)),
            LiftingLedger: getCurrentFormValue("LiftingLedger") || state.LiftingLedger || 0,
          }
        })

        // Send lifting data as JSON array
        const liftingFormData = new FormData()
        liftingFormData.append("Data", JSON.stringify(liftingDataArray))
        liftingFormData.append("F_ContractH", res.id || res.Id || state.id)

        await Fn_AddEditData(
          dispatch,
          setState,
          { arguList: { id: 0, formData: liftingFormData } },
          API_URL_Lifting,
          true,
          "NewTender",
          navigate,
          "#"
        )
      }

      setState(prev => ({
        ...prev,
        isProgress: false,
        showSuccessMessage: true,
        showLiftingAlert: false,
        liftingAlertMessage: "",
        message: state.isEditMode
          ? "Contract updated successfully!"
          : "Contract saved successfully!",
      }))
      debugger
      // Auto-hide success message after 3 seconds and reload page
      setTimeout(() => {
        setState(prev => ({ ...prev, showSuccessMessage: false }))
        // Reload the page after successful save/update
        window.location.reload()
      }, 3000)
    } catch (error) {
      console.error("Error saving contract:", error)
      setState(prev => ({
        ...prev,
        isProgress: false,
        showErrorMessage: true,
        message: "Error saving contract. Please try again.",
      }))

      // Auto-hide error message after 5 seconds
      setTimeout(() => {
        setState(prev => ({ ...prev, showErrorMessage: false }))
      }, 5000)
    }
  }

  const handleDelete = () => {
    console.log("Deleting contract")

    // Get the contract ID from the selected contract
    const contractId = state.ContractArray?.[0]?.Id

    if (!contractId) {
      alert("Please select a contract first to delete")
      return
    }

    // Confirm deletion
    if (window.confirm("Are you sure you want to delete this contract?")) {
      Fn_DeleteData(dispatch, setState, contractId, API_Delete, true)
        .then(response => {
          const msg = response?.data?.message || response?.message || ""
          if (response && response.status === 200 && (msg.toLowerCase().includes("record deleted") || msg.toLowerCase().includes("deleted"))) {
            toastr.success("Delete success")
            setState(prev => ({ ...prev, id: 0, ContractArray: [] }))
            Fn_FillListData(dispatch, setState, "ContractHNo", API_URL7 + "/Id/0")
          }
        })
        .catch(error => {
          console.error("Error deleting contract:", error)
          alert("Error deleting contract. Please try again.")
        })
    }
  }

  const handlePrint = () => {
    console.log("Printing contract")
    // Navigate to print component with contract ID
    if (state.id || state.ContractArray?.[0]?.Id) {
      const contractId = state.id || state.ContractArray[0].Id
      window.open(`/contract-print2?id=${contractId}`, '_blank')
    } else {
      // Show alert if no contract is selected
      alert("Please select a contract first to print")
    }
  }

  // Generate PDF from contract print page and return blob
  const generateContractPDF = async (contractId, contractNo) => {
    return new Promise((resolve, reject) => {
      try {
        // Open contract print page in hidden iframe
        const iframe = document.createElement('iframe')
        iframe.style.position = 'fixed'
        iframe.style.right = '-9999px'
        iframe.style.width = '210mm' // A4 width
        iframe.style.height = '297mm' // A4 height
        iframe.src = `${window.location.origin}/contract-print2?id=${contractId}`
        document.body.appendChild(iframe)

        iframe.onload = () => {
          setTimeout(() => {
            try {
              const printContent = iframe.contentDocument || iframe.contentWindow.document
              const element = printContent.querySelector('.contract-print-container') || printContent.body

              const opt = {
                margin: [10, 10, 10, 10],
                filename: `Contract_${contractNo}_${contractId}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
              }

              html2pdf()
                .set(opt)
                .from(element)
                .outputPdf('blob')
                .then(pdfBlob => {
                  document.body.removeChild(iframe)
                  resolve(pdfBlob)
                })
                .catch(err => {
                  console.error('PDF generation error:', err)
                  document.body.removeChild(iframe)
                  reject(err)
                })
            } catch (err) {
              console.error('Error accessing iframe content:', err)
              document.body.removeChild(iframe)
              reject(err)
            }
          }, 2000) // Wait 2 seconds for page to fully load
        }

        iframe.onerror = () => {
          document.body.removeChild(iframe)
          reject(new Error('Failed to load contract print page'))
        }
      } catch (err) {
        reject(err)
      }
    })
  }

  // Mail Seller - Share contract PDF via email with file attachment
  const handleMailSeller = async () => {
    if (state.id || state.ContractArray?.[0]?.Id) {
      const contractId = state.id || state.ContractArray[0].Id
      const sellerName = state.PartyAccountArray.find(p => p.Id === state.F_SellerLedger)?.Name || 'Seller'
      const contractNo = state.ContractNo || 'Contract'
      
      try {
        // Show loading message
        const loadingMsg = alert('Generating PDF... Please wait.')
        
        // Generate PDF blob
        const pdfBlob = await generateContractPDF(contractId, contractNo)
        
        // Create download link and trigger download
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Contract_${contractNo}_${contractId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        // Open email with PDF file
        const subject = encodeURIComponent(`Contract ${contractNo} - PDF Attached`)
        const body = encodeURIComponent(
          `Dear ${sellerName},\n\nPlease find the contract PDF attached.\n\nContract No: ${contractNo}\n\nBest Regards`
        )
        
        // Note: mailto doesn't support file attachments directly
        // PDF is downloaded, user can manually attach it
        setTimeout(() => {
          window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
        }, 500)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error generating PDF. Please try again or use Print button.')
      }
    } else {
      alert("Please select a contract first")
    }
  }

  // Mail Buyer - Share contract PDF via email with file attachment
  const handleMailBuyer = async () => {
    if (state.id || state.ContractArray?.[0]?.Id) {
      const contractId = state.id || state.ContractArray[0].Id
      const buyerName = state.PartyAccountArray.find(p => p.Id === state.F_BuyerLedger)?.Name || 'Buyer'
      const contractNo = state.ContractNo || 'Contract'
      
      try {
        // Show loading message
        alert('Generating PDF... Please wait.')
        
        // Generate PDF blob
        const pdfBlob = await generateContractPDF(contractId, contractNo)
        
        // Create download link and trigger download
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Contract_${contractNo}_${contractId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
        
        // Open email with PDF file
        const subject = encodeURIComponent(`Contract ${contractNo} - PDF Attached`)
        const body = encodeURIComponent(
          `Dear ${buyerName},\n\nPlease find the contract PDF attached.\n\nContract No: ${contractNo}\n\nBest Regards`
        )
        
        // Note: mailto doesn't support file attachments directly
        // PDF is downloaded, user can manually attach it
        setTimeout(() => {
          window.open(`mailto:?subject=${subject}&body=${body}`, '_blank')
        }, 500)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error generating PDF. Please try again or use Print button.')
      }
    } else {
      alert("Please select a contract first")
    }
  }

  // WhatsApp Seller - Share contract PDF via WhatsApp with file
  const handleWhatsAppSeller = async () => {
    if (state.id || state.ContractArray?.[0]?.Id) {
      const contractId = state.id || state.ContractArray[0].Id
      const sellerName = state.PartyAccountArray.find(p => p.Id === state.F_SellerLedger)?.Name || 'Seller'
      const contractNo = state.ContractNo || 'Contract'
      
      try {
        // Show loading message
        alert('Generating PDF... Please wait.')
        
        // Generate PDF blob
        const pdfBlob = await generateContractPDF(contractId, contractNo)
        
        // Create download link and trigger download
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Contract_${contractNo}_${contractId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Open WhatsApp with concise message
        const message = encodeURIComponent(
          `Dear ${sellerName},\n\nContract No: ${contractNo}\n\nPlease find the contract PDF attached.\n\nBest Regards`
        )
        
        setTimeout(() => {
          window.open(`https://wa.me/?text=${message}`, '_blank')
          // Clean up blob URL after a delay
          setTimeout(() => window.URL.revokeObjectURL(url), 1000)
        }, 500)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error generating PDF. Please try again or use Print button.')
      }
    } else {
      alert("Please select a contract first")
    }
  }

  // WhatsApp Buyer - Share contract PDF via WhatsApp with file
  const handleWhatsAppBuyer = async () => {
    if (state.id || state.ContractArray?.[0]?.Id) {
      const contractId = state.id || state.ContractArray[0].Id
      const buyerName = state.PartyAccountArray.find(p => p.Id === state.F_BuyerLedger)?.Name || 'Buyer'
      const contractNo = state.ContractNo || 'Contract'
      
      try {
        // Show loading message
        alert('Generating PDF... Please wait.')
        
        // Generate PDF blob
        const pdfBlob = await generateContractPDF(contractId, contractNo)
        
        // Create download link and trigger download
        const url = window.URL.createObjectURL(pdfBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `Contract_${contractNo}_${contractId}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // Open WhatsApp with concise message
        const message = encodeURIComponent(
          `Dear ${buyerName},\n\nContract No: ${contractNo}\n\nPlease find the contract PDF attached.\n\nBest Regards`
        )
        
        setTimeout(() => {
          window.open(`https://wa.me/?text=${message}`, '_blank')
          // Clean up blob URL after a delay
          setTimeout(() => window.URL.revokeObjectURL(url), 1000)
        }, 500)
      } catch (error) {
        console.error('Error generating PDF:', error)
        alert('Error generating PDF. Please try again or use Print button.')
      }
    } else {
      alert("Please select a contract first")
    }
  }

  const handleExit = () => {
    console.log("Exiting contract form")
    navigate("/dashboard")
  }

  const handleLiftingChange = (index, field, value) => {
    const updatedRows = [...liftingRows]
    updatedRows[index][field] = value
    setLiftingRows(updatedRows)

    // Calculate total lifting quantity and validate
    const contractQty = parseFloat(
      state.Qty || state.ContractArray?.[0]?.Qty || 0
    )
    const totalLiftingQty = updatedRows.reduce((sum, row) => {
      return sum + parseFloat(row.Lifted || 0)
    }, 0)

    // Calculate DiffAmt: (Rate of each row in lifting - invoice rate) * qty of that row and then sum all differences
    const invoiceRate = parseFloat(state.InvRate || state.Rate || 0)
    let totalDiffAmt = 0

    updatedRows.forEach(row => {
      const liftedQty = parseFloat(row.Lifted || 0)
      const liftingRate = parseFloat(row.Rate1 || 0)
      if (liftedQty > 0 && liftingRate > 0) {
        // Calculate difference for this row: (lifting rate - invoice rate) * quantity
        const rowDiffAmt = (liftingRate - invoiceRate) * liftedQty
        totalDiffAmt += rowDiffAmt
      }
    })

    const diffAmt = totalDiffAmt

    setState(prev => ({
      ...prev,
      totalLiftingQty,
      contractQty,
      DiffAmt: diffAmt.toFixed(2),
      showLiftingAlert: totalLiftingQty > contractQty,
      liftingAlertMessage:
        totalLiftingQty > contractQty
          ? `Lifting quantity (${totalLiftingQty}) exceeds contract quantity (${contractQty}). Please adjust.`
          : "",
    }))
  }

  const addLiftingRow = () => {
    const newRows = [
      ...liftingRows,
      { Date1: "", LorryNo: "", BNo: "", Lifted: "", Rate1: "" },
    ]
    setLiftingRows(newRows)

    // Recalculate totals and DiffAmt
    const contractQty = parseFloat(
      state.Qty || state.ContractArray?.[0]?.Qty || 0
    )
    const totalLiftingQty = newRows.reduce((sum, row) => {
      return sum + parseFloat(row.Lifted || 0)
    }, 0)

    // Calculate DiffAmt
    const invoiceRate = parseFloat(state.InvRate || state.Rate || 0)
    let totalDiffAmt = 0

    newRows.forEach(row => {
      const liftedQty = parseFloat(row.Lifted || 0)
      const liftingRate = parseFloat(row.Rate1 || 0)
      if (liftedQty > 0 && liftingRate > 0) {
        // Calculate difference for this row: (lifting rate - invoice rate) * quantity
        const rowDiffAmt = (liftingRate - invoiceRate) * liftedQty
        totalDiffAmt += rowDiffAmt
      }
    })

    const diffAmt = totalDiffAmt

    setState(prev => ({
      ...prev,
      totalLiftingQty,
      DiffAmt: diffAmt.toFixed(2),
      showLiftingAlert: totalLiftingQty > contractQty,
      liftingAlertMessage:
        totalLiftingQty > contractQty
          ? `Lifting quantity (${totalLiftingQty}) exceeds contract quantity (${contractQty}). Please adjust.`
          : "",
    }))
  }

  const removeLiftingRow = index => {
    const updatedRows = [...liftingRows]
    updatedRows.splice(index, 1)
    setLiftingRows(updatedRows)

    // Recalculate totals and DiffAmt
    const contractQty = parseFloat(
      state.Qty || state.ContractArray?.[0]?.Qty || 0
    )
    const totalLiftingQty = updatedRows.reduce((sum, row) => {
      return sum + parseFloat(row.Lifted || 0)
    }, 0)

    // Calculate DiffAmt
    const invoiceRate = parseFloat(state.InvRate || state.Rate || 0)
    let totalDiffAmt = 0

    updatedRows.forEach(row => {
      const liftedQty = parseFloat(row.Lifted || 0)
      const liftingRate = parseFloat(row.Rate1 || 0)
      if (liftedQty > 0 && liftingRate > 0) {
        // Calculate difference for this row: (lifting rate - invoice rate) * quantity
        const rowDiffAmt = (liftingRate - invoiceRate) * liftedQty
        totalDiffAmt += rowDiffAmt
      }
    })

    const diffAmt = totalDiffAmt

    setState(prev => ({
      ...prev,
      totalLiftingQty,
      DiffAmt: diffAmt.toFixed(2),
      showLiftingAlert: totalLiftingQty > contractQty,
      liftingAlertMessage:
        totalLiftingQty > contractQty
          ? `Lifting quantity (${totalLiftingQty}) exceeds contract quantity (${contractQty}). Please adjust.`
          : "",
    }))
  }

  // Handle lifting keyboard navigation
  const handleLiftingKeyDown = (e, rowIndex, fieldName) => {
    if (e.key === "Enter") {
      e.preventDefault()

      if (fieldName === "Rate1") {
        // On Rate field Enter, add new row and focus on its date
        const currentRowCount = liftingRows.length
        addLiftingRow()
        setTimeout(() => {
          // Focus on the new row's Date field (which will be at the current count index)
          const newRowDateInput = document.querySelector(
            `input[name="Date1-${currentRowCount}"]`
          )
          if (newRowDateInput) {
            newRowDateInput.focus()
          }
        }, 150)
      } else {
        // Navigate to next field in same row or next row
        const nextField = getNextLiftingField(fieldName)
        if (nextField) {
          const nextInput = document.querySelector(
            `input[name="${nextField}-${rowIndex}"]`
          )
          if (nextInput) {
            nextInput.focus()
          }
        }
      }
    }
  }

  // Get next field for lifting navigation
  const getNextLiftingField = currentField => {
    const fieldOrder = ["Date1", "LorryNo", "BNo", "Lifted", "Rate1"]
    const currentIndex = fieldOrder.indexOf(currentField)
    return currentIndex < fieldOrder.length - 1
      ? fieldOrder[currentIndex + 1]
      : null
  }

  // Wrapper functions for lifting operations
  const handleAddLiftingRow = () => {
    addLiftingRow()
  }

  const handleRemoveLiftingRow = index => {
    removeLiftingRow(index)
  }

  // Handle tab key to clear note fields
  const handleNoteKeyDown = (e, fieldName) => {
    if (e.key === "Tab") {
      e.preventDefault()
      setState(prev => ({ ...prev, [fieldName]: "" }))
      return
    }
  }

  // Handle Enter key navigation with conditional logic
  const handleKeyDown = (e, nextRef) => {
    console.log("handleKeyDown", e.key)
    if (e.key === "Enter") {
      e.preventDefault()
      
      const fieldName = e.target.name
      
      // Special handling for ContractCombined field
      if (fieldName === "ContractCombined") {
        // Check if contract number is empty
        if (!e.target.value || e.target.value.trim() === "") {
          alert("Please enter a contract number before proceeding.")
          return
        }
        
        // Only navigate to F_SellerLedger if contract number has been changed by user
        if (state.contractNumberChanged) {
          // Contract number changed, navigate to F_SellerLedger
          if (sellerRef.current) {
            sellerRef.current.focus()
            return
          }
        } else {
          // Contract number unchanged or page just loaded, stay on same field
          return
        }
      }
      
      // Check if shipment month/year is selected
      const isShipmentMonthSelected =
        (state.F_MonthMaster && state.F_MonthMaster !== 0) ||
        (state.F_YearMaster && state.F_YearMaster !== 0)
      // Check if shipment dates are selected - check for both truthy values and non-empty strings
      const areShipmentDatesSelected = state.ShipMentFromDate && state.ShipMentToDate && 
        state.ShipMentFromDate !== "" && state.ShipMentToDate !== "" &&
        state.ShipMentFromDate !== null && state.ShipMentToDate !== null
      // Check if lifting dates are selected - check for both truthy values and non-empty strings
      const areLiftingDatesSelected = state.LiftedFromDate && state.LiftedToDate && 
        state.LiftedFromDate !== "" && state.LiftedToDate !== "" &&
        state.LiftedFromDate !== null && state.LiftedToDate !== null
      
      // Handle delivery port navigation based on conditions
      if (fieldName === "DeliveryPort") {
        console.log("DeliveryPort navigation - Debug info:")
        console.log(
          "isShipmentMonthSelected:",
          isShipmentMonthSelected,
          "month:",
          state.F_MonthMaster,
          "year:",
          state.F_YearMaster
        )
        console.log("areShipmentDatesSelected:", areShipmentDatesSelected, "values:", state.ShipMentFromDate, state.ShipMentToDate)
        console.log("areLiftingDatesSelected:", areLiftingDatesSelected, "values:", state.LiftedFromDate, state.LiftedToDate)
        
        // Also check the actual DOM values to be sure
        const shipmentFromInput = document.querySelector('input[name="ShipMentFromDate"]')
        const shipmentToInput = document.querySelector('input[name="ShipMentToDate"]')
        const liftingFromInput = document.querySelector('input[name="LiftedFromDate"]')
        const liftingToInput = document.querySelector('input[name="LiftedToDate"]')
        
        const domShipmentDatesSelected = shipmentFromInput && shipmentToInput && 
          shipmentFromInput.value && shipmentToInput.value
        const domLiftingDatesSelected = liftingFromInput && liftingToInput && 
          liftingFromInput.value && liftingToInput.value
        
        console.log("DOM values - shipment:", domShipmentDatesSelected, "lifting:", domLiftingDatesSelected)
        
        // If any of the conditions are met, skip to payment terms
        if (isShipmentMonthSelected || areShipmentDatesSelected || areLiftingDatesSelected || 
            domShipmentDatesSelected || domLiftingDatesSelected) {
          console.log("Condition met - skipping to payment terms")
          const paymentTermsInput = document.querySelector('input[name="Remarks"]')
          if (paymentTermsInput) {
            paymentTermsInput.focus()
            return
          }
        } else {
          console.log("No condition met - normal navigation to shipment from date")
          // Normal navigation to shipment from date
          if (shipmentFromRef.current) {
            shipmentFromRef.current.focus()
            return
          }
        }
      }
      
      // Handle shipment from date navigation
      if (fieldName === "ShipMentFromDate") {
        if (shipmentToRef.current) {
          shipmentToRef.current.focus()
          return
        }
      }
      
      // Handle shipment to date navigation
      if (fieldName === "ShipMentToDate") {
        if (remarksRef.current) {
          remarksRef.current.focus()
          return
        }
      }
      
      // Handle lifting from date navigation
      if (fieldName === "LiftedFromDate") {
        if (liftedToRef.current) {
          liftedToRef.current.focus()
          return
        }
      }
      
      // Handle lifting to date navigation
      if (fieldName === "LiftedToDate") {
        if (remarksRef.current) {
          remarksRef.current.focus()
          return
        }
      }
      
      // Normal navigation for other fields
      if (nextRef && nextRef.current) {
        nextRef.current.focus()
      }
    }
  }

  // Handle Page Up and Page Down navigation in dropdowns
  const handleDropdownKeyDown = (e, fieldName) => {
    console.log("handleDropdownKeyDown", e.key, fieldName)
    if (e.key == "PageUp" || e.key == "PageDown") {
      e.preventDefault()
      
      let options, currentIndex, newIndex, newValue
      
      if (fieldName === "ContractCombined") {
        // For contract field - use ContractHNo array
        console.log("ContractHNo:", state.ContractHNo)
        const contractOptions = state.ContractHNo.filter(contract => contract.ContractNo && contract.ContractNo.trim() !== "")
        console.log("Contract options available:", contractOptions.length, contractOptions)
        
        if (contractOptions.length === 0) {
          console.log("No contract options available")
          return // No options to navigate
        }
        
        // Get current value and find its index
        const currentValue = e.target.value
        currentIndex = -1
        
        if (currentValue) {
          currentIndex = contractOptions.findIndex(contract => contract.ContractNo === currentValue)
        }
        
        console.log("Current value:", currentValue, "Current index:", currentIndex)
        
        if (e.key === "PageUp") {
          // Navigate up (previous option)
          newIndex = currentIndex <= 0 ? contractOptions.length - 1 : currentIndex - 1
        } else {
          // Navigate down (next option)
          newIndex = currentIndex >= contractOptions.length - 1 ? 0 : currentIndex + 1
        }
        
        newValue = contractOptions[newIndex].ContractNo
        console.log("New value:", newValue, "New index:", newIndex)
        
        // Update the input value
        e.target.value = newValue
        
        // Update the form state directly
        setState(prev => ({
          ...prev,
          ContractNo: newValue,
          ContractId: contractOptions[newIndex].Id,
          originalContractNo: newValue,
          contractNumberChanged: true,
          isEditMode: true,
          isEditingEnabled: true,
        }))
        
        // Load the selected contract data
        const changeEvent = { target: { value: newValue } }
        handleCombinedContractChange(changeEvent)
        
        // Trigger change event to update the form state
        const changeEvent2 = new Event('change', { bubbles: true })
        e.target.dispatchEvent(changeEvent2)
      } else if (fieldName.startsWith("Note")) {
        // For note fields - improved navigation
        console.log("NotesArray:", state.NotesArray)
        const noteOptions = state.NotesArray.filter(note => note.Name && note.Name.trim() !== "")
        console.log("Note options available:", noteOptions.length, noteOptions)
        
        if (noteOptions.length === 0) {
          console.log("No note options available")
          return // No options to navigate
        }
        
        // Get current value and find its index
        const currentValue = e.target.value
        currentIndex = -1
        
        if (currentValue) {
          currentIndex = noteOptions.findIndex(note => note.Name === currentValue)
        }
        
        console.log("Current value:", currentValue, "Current index:", currentIndex)
        
        if (e.key === "PageUp") {
          // Navigate up (previous option)
          newIndex = currentIndex <= 0 ? noteOptions.length - 1 : currentIndex - 1
        } else {
          // Navigate down (next option)
          newIndex = currentIndex >= noteOptions.length - 1 ? 0 : currentIndex + 1
        }
        
        newValue = noteOptions[newIndex].Name
        console.log("New value:", newValue, "New index:", newIndex)
        
        // Update the input value
        e.target.value = newValue
        
        // Update the form state directly
        setState(prev => ({
          ...prev,
          [fieldName]: newValue
        }))
        
        // Trigger change event to update the form state
        const changeEvent = new Event('change', { bubbles: true })
        e.target.dispatchEvent(changeEvent)
      } else {
        // For regular select dropdowns
        const selectElement = e.target
        options = Array.from(selectElement.options)
        currentIndex = selectElement.selectedIndex
        
        if (options.length <= 1) return // No options to navigate
        
        if (e.key === "PageUp") {
          // Navigate up (previous option)
          newIndex = currentIndex <= 0 ? options.length - 1 : currentIndex - 1
        } else {
          // Navigate down (next option)
          newIndex = currentIndex >= options.length - 1 ? 0 : currentIndex + 1
        }
        
        // Update the selected value
        newValue = options[newIndex].value
        selectElement.value = newValue
        
        // Trigger change event to update the form state
        const changeEvent = new Event('change', { bubbles: true })
        e.target.dispatchEvent(changeEvent)
        
        // Update the form state manually if needed based on field type
        switch (fieldName) {
          case "ContractId":
            const selectedContractById = state.ContractHNo.find(contract => contract.Id == newValue)
            if (selectedContractById) {
              console.log("Selected contract:", selectedContractById)
            }
            break
          case "F_SellerLedger":
            const selectedSeller = state.PartyAccountArray.find(party => party.Id == newValue)
            if (selectedSeller) {
              console.log("Selected seller:", selectedSeller)
            }
            break
          case "F_BuyerLedger":
            const selectedBuyer = state.PartyAccountArray.find(party => party.Id == newValue)
            if (selectedBuyer) {
              console.log("Selected buyer:", selectedBuyer)
            }
            break
          case "F_ItemType":
            const selectedCommodity = state.ItemArray.find(item => item.Id == newValue)
            if (selectedCommodity) {
              console.log("Selected commodity:", selectedCommodity)
            }
            break
          case "F_ContractLedger":
            const selectedContractType = state.TaxAccountArray.find(type => type.Id == newValue)
            if (selectedContractType) {
              console.log("Selected contract type:", selectedContractType)
            }
            break
          case "F_MonthMaster":
            const selectedMonth = state.MonthArray.find(month => month.Id == newValue)
            if (selectedMonth) {
              console.log("Selected month:", selectedMonth)
            }
            break
        case "F_YearMaster":
          const selectedYear = state.YearArray.find(year => year.Id == newValue)
          if (selectedYear) {
            console.log("Selected year:", selectedYear)
          }
          break
          case "LiftingLedger":
            const selectedLiftingLedger = state.PartyAccountArray.find(party => party.Id == newValue)
            if (selectedLiftingLedger) {
              console.log("Selected lifting ledger:", selectedLiftingLedger)
            }
            break
          default:
            console.log(`Field ${fieldName} changed to:`, newValue)
        }
      }
    }
  }

  // Helper function to get display value for form fields
  const getFieldValue = fieldName => {
    if (fieldName === "ContractId") {
      // Return the selected contract ID for dropdown
      return state.ContractId || ""
    }
    if (fieldName === "ContractNo") {
      // When adding new contract (ContractArray is empty), show empty field
      // When editing existing contract, show ContractNo
      if (state.ContractArray && state.ContractArray.length > 0) {
        return state.ContractArray[0]?.ContractNo || ""
      } else {
        return state.ContractNo || ""
      }
    }
    if (fieldName === "ContractCombined") {
      // For combined field, show ContractNo or selected contract
      if (state.ContractArray && state.ContractArray.length > 0) {
        return state.ContractArray[0]?.ContractNo || ""
      } else {
        return state.ContractNo || ""
      }
    }
    return state[fieldName] || ""
  }

  const handleCombinedContractChange = async (e) => {
    const value = e.target.value
    
    // Store the original contract number before making changes
    const originalContractNo = state.ContractNo || ""
    
    // Check if this matches an existing contract
    const existingContract = state.ContractHNo.find(contract => contract.ContractNo === value)
    
    if (existingContract) {
      // Existing contract selected - load it for editing
      setState(prev => ({ 
        ...prev, 
        ContractNo: value,
        ContractId: existingContract.Id,
        originalContractNo: originalContractNo, // Store the original value
        contractNumberChanged: true, // Mark that contract number has been changed
      }))
      
      // Load the existing contract data
      try {
        await Fn_FillListData(
          dispatch,
          setState,
          "ContractArray",
          `${API_URL8}/Id/${existingContract.Id}`
        )

        // After ContractArray is updated, populate the form
        setTimeout(async () => {
          setState(prev => {
            const contract = prev.ContractArray[0] || {}

            if (contract.Id) {
              // Load contact person data for seller and buyer
              if (contract.F_SellerLedger) {
                Fn_FillListData(
                  dispatch,
                  setState,
                  "PartyAccountArray1",
                  `${API_URL6}/Id/${contract.F_SellerLedger}`
                )
              }

              if (contract.F_BuyerLedger) {
                Fn_FillListData(
                  dispatch,
                  setState,
                  "PartyAccountArray2",
                  `${API_URL6}/Id/${contract.F_BuyerLedger}`
                )
              }

              // Fetch lifting data using ContractH ID
              Fn_FillListData(
                dispatch,
                setState,
                "LiftingArray",
                `${API_URL10}/Id/${contract.Id}`
              )

              return {
                ...prev,
                id: contract.Id || 0,
                Date: formatDateForInput(contract.Date) || new Date().toISOString().split("T")[0],
                ContractNo: contract.ContractNo || "",
                ContractId: existingContract.Id,
                originalContractNo: contract.ContractNo || "", // Reset to current contract number when fully loaded
                contractNumberChanged: true, // Keep this true since user selected an existing contract
                F_SellerLedger: contract.F_SellerLedger || 0,
                F_BuyerLedger: contract.F_BuyerLedger || 0,
                F_ItemType: contract.F_ItemType || 0,
                Qty: contract.Qty || 0,
                Rate: contract.Rate || 0,
                InvRate: contract.InvRate || contract.Rate || 0,
                F_UnitMaster: contract.F_UnitMaster || 0,
                F_MonthMaster: contract.F_MonthMaster || 0,
                F_YearMaster: contract.F_YearMaster || 0,
                Vessel: contract.Vessel || "",
                DeliveryPort: contract.DeliveryPort || "",
                ShipMentFromDate: contract.ShipMentFromDate || "",
                ShipMentToDate: contract.ShipMentToDate || "",
                LiftedFromDate: contract.LiftedFromDate || "",
                LiftedToDate: contract.LiftedToDate || "",
                F_ContractLedger: contract.F_ContractLedger || 0,
                Remarks: contract.Remarks || "",
                AdvPayment: contract.AdvPayment || "",
                AdvDate: contract.AdvDate || "",
                Note5: contract.Note5 || "",
                Note6: contract.Note6 || "",
                Note1: contract.Note1 || "",
                Note2: contract.Note2 || "",
                Note3: contract.Note3 || "",
                Note4: contract.Note4 || "",
                importDuty: contract.importDuty || 0,
                tariff: contract.tariff || 0,
                exchangeRate: contract.exchangeRate || 0,
                calPerTonDuty: contract.calPerTonDuty || 0,
                isEditMode: true,
                isEditingEnabled: false,
                contractQty: contract.Qty || 0,
                BackSellerCNo: contract.BackSellerCNo || "",
                SellerPerson: contract.SellerPerson || "",
                BuyerPerson: contract.BuyerPerson || "",
                LiftingLedger: contract.LiftingLedger || 0,
              }
            }
            return prev
          })
        }, 200)
      } catch (error) {
        console.log("Error loading existing contract:", error)
      }
    } else {
      // New contract number - clear existing data and set to add mode
      setState(prev => ({
        ...prev,
        ContractNo: value,
        ContractId: "",
        ContractArray: [],
        LiftingArray: [],
        isEditMode: false,
        originalContractNo: originalContractNo, // Store the original value
        contractNumberChanged: true, // Mark that contract number has been changed
        LiftingLedger: 0,
        }))
    }
  }

  // Function to clear contract number and reset state
  const handleClearContract = () => {
    setState(prev => ({
      ...prev,
      ContractNo: "",
      ContractId: "",
      originalContractNo: "",
      contractNumberChanged: false,
      ContractArray: [],
      LiftingArray: [],
      isEditMode: false,
      isEditingEnabled: false,
      LiftingLedger: 0,
    }))
    
    // Reset lifting rows
    setLiftingRows(createDefaultLiftingRows(7))
    
    // Focus on contract number field
    if (contractNoRef.current) {
      contractNoRef.current.focus()
    }
    if (liftingLedgerRef.current) {
      liftingLedgerRef.current.focus()
    }
  }

  // Function to revert contract number change in edit mode
  const handleRevertContractNumber = () => {
    if (state.isEditMode && state.originalContractNo) {
      setState(prev => ({
        ...prev,
        ContractNo: prev.originalContractNo,
        contractNumberChanged: false,
      }))
      
      // Update the input field value
      if (contractNoRef.current) {
        contractNoRef.current.value = state.originalContractNo
      }
    }
  }

  // Simplified function to handle contract number changes
  const handleContractNumberChangeInEditMode = (e) => {
    const value = e.target.value
    
    // Check if this matches an existing contract
    const existingContract = state.ContractHNo.find(contract => contract.ContractNo === value)
    
    if (existingContract) {
      // Existing contract found - load it
      setState(prev => ({
        ...prev,
        ContractNo: value,
        ContractId: existingContract.Id,
        originalContractNo: value,
        contractNumberChanged: true,
        isEditMode: true,
        isEditingEnabled: true,
      }))
      
      // Load the existing contract data
      handleCombinedContractChange(e)
    } else {
      // New contract number - set to add mode
      setState(prev => ({
        ...prev,
        ContractNo: value,
        ContractId: "",
        ContractArray: [],
        LiftingArray: [],
        isEditMode: false,
        contractNumberChanged: true,
        isEditingEnabled: true,
        id: 0,
      }))
      
      // Reset lifting rows for new contract
      setLiftingRows(createDefaultLiftingRows(7))
    }
  }

  const selectExistingContract = (id, contractNo) => {
    const originalContractNo = state.ContractNo || ""
    
    setState(prev => ({ 
      ...prev, 
      ContractNo: contractNo, 
      ContractId: id,
      originalContractNo: originalContractNo,
      contractNumberChanged: true // Mark that contract number has been changed
    }))
    
    // Trigger the change handler to load contract data
    const event = { target: { value: contractNo } }
    handleCombinedContractChange(event)
  }

  return (
    <div className="contract-page">
      <div
        style={{
          height: "3.3rem",
        }}
      ></div>
      <div style={{ height: "auto", overflow: "visible" }}>
         

        <div className="contract-form" style={{ backgroundColor: "#fffacd", padding: "20px", borderRadius: "8px", height: "auto", minHeight: "auto", overflow: "visible" }}>
          <style>{`
            @media (max-width: 768px) {
              .contract-form {
                padding: 0.5rem !important;
                border-radius: 0.5rem !important;
                height: auto !important;
                min-height: auto !important;
                overflow: visible !important;
              }
            }
            @media (max-width: 576px) {
              .contract-form {
                padding: 0.25rem !important;
                height: auto !important;
                overflow: visible !important;
              }
            }
          `}</style>
          <Form>
            <Row className="g-1">
              {/* Combined Left Panel - Contract Details and Conditions */}
              <Col xs={12} md={12} lg={8}>
                <div className="form-section" style={{ position: "relative" }}>
                  <h6
                    className="section-title"
                    style={{ fontSize: "1rem" , fontWeight: "bold", }}
                  >
                    <i className="bx bx-file-doc me-2"></i>
                    Contract Details & Conditions{" "}
                    <span
                      style={{
                        color: state.isEditMode ? "#28a745" : "#007bff",
                        fontSize: "1rem",
                        fontWeight: "bold",
                      }}
                    >
                      ({state.isEditMode ? "Edit Mode" : "Add Mode"})
                    </span>
                    <span
                      style={{
                        color: "#dc3545",
                        fontSize: "0.9rem",
                        fontWeight: "bold",
                        marginLeft: "10px",
                      }}
                    >
                       ( {state.ContractHNo ? state.ContractHNo.length : 0})
                    </span>
                  </h6>

                  {/* Left Column - Contract Details */}
                  <div className="contract-left-column" style={{ width: "50%", float: "left", paddingRight: "15px" }}>
                    <style>{`
                      @media (max-width: 768px) {
                        .contract-left-column {
                          width: 100% !important;
                          float: none !important;
                          padding-right: 0 !important;
                          margin-bottom: 1rem;
                        }
                      }
                    `}</style>
                    <Row className="g-1">
                      <Col xs={12} sm={6} md={4}>
                        <FormGroup className="mb-1">
                          <Label
                            for="date"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Date
                          </Label>
                          <input
                            type="date"
                            name="Date"
                            id="Date"
                            value={getFieldValue("Date")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            ref={dateRef}
                            onKeyDown={e => handleKeyDown(e, contractNoRef)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>



                      <Col xs={12} sm={6} md={4}>
                        <FormGroup className="mb-1">
                          <Label
                            for="ContractCombined"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Contract No
                            {state.lastContractNo && (
                              <span className="text-muted ms-1" style={{ fontSize: "0.65rem" }}>
                                ({state.lastContractNo})
                              </span>
                            )}
                          </Label>
                            <input
                              name="ContractCombined"
                              id="ContractCombined"
                              onKeyDown={e => {
                                handleDropdownKeyDown(e, "ContractCombined")
                                handleKeyDown(e, sellerRef)
                              }}
                              value={getFieldValue("ContractCombined")}
                              onChange={handleContractNumberChangeInEditMode}
                              type="text"
                              className="form-control form-control-sm py-1"
                              placeholder="Type contract number (PageUp/PageDown to navigate)"
                              ref={contractNoRef}
                              autoComplete="off"
                            />
                        </FormGroup>
                      </Col>
                    </Row>

                     

                    <Row className="g-1">
                      <Col xs={10} sm={10} md={7}>
                        <FormGroup className="mb-1">
                          <Label
                            for="F_SellerLedger"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Seller
                          </Label>
                          <select
                            name="F_SellerLedger"
                            id="F_SellerLedger"
                            onKeyDown={e => {
                              handleDropdownKeyDown(e, "F_SellerLedger")
                              handleKeyDown(e, buyerRef)
                            }}
                            value={getFieldValue("F_SellerLedger")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            ref={sellerRef}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          >
                            <option value="">Select Seller</option>
                            {state.PartyAccountArray.map(type => (
                              <option key={type.Id} value={type.Id}>
                                {type.Name}
                              </option>
                            ))}
                          </select>
                        </FormGroup>
                      </Col>
                      <Col xs={2} sm={2} md={1}>
                        <FormGroup className="mb-1">
                          <Label
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.65rem" }}
                          >
                            &nbsp;
                          </Label>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={toggleSellerModal}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                            style={{
                              width: "100%",
                              height: "28px",
                              padding: "0",
                              fontSize: "0.8rem",
                            }}
                          >
                            +
                          </Button>
                        </FormGroup>
                      </Col>

                      <Col xs={12} sm={12} md={4}>
                        <FormGroup className="mb-1">
                          <Label
                            for="sellerName"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Name
                          </Label>
                          <input
                            type="text"
                            name="sellerName"
                            id="Person"
                            value={state.PartyAccountArray1?.[0]?.Person || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="Name"
                            readOnly
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col xs={10} sm={10} md={7}>
                        <FormGroup className="mb-1">
                          <Label
                            for="F_BuyerLedger"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Buyer
                          </Label>
                          <select
                            name="F_BuyerLedger"
                            id="F_BuyerLedger"
                            value={getFieldValue("F_BuyerLedger")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            ref={buyerRef}
                            onKeyDown={e => {
                              handleDropdownKeyDown(e, "F_BuyerLedger")
                              handleKeyDown(e, commodityRef)
                            }}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          >
                            <option value="">Select Buyer</option>
                            {state.PartyAccountArray.map(type => (
                              <option key={type.Id} value={type.Id}>
                                {type.Name}
                              </option>
                            ))}
                          </select>
                        </FormGroup>
                      </Col>

                      <Col xs={2} sm={2} md={1}>
                        <FormGroup className="mb-1">
                          <Label
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.65rem" }}
                          >
                            &nbsp;
                          </Label>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={toggleSellerModal}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                            style={{
                              width: "100%",
                              height: "28px",
                              padding: "0",
                              fontSize: "0.8rem",
                            }}
                          >
                            +
                          </Button>
                        </FormGroup>
                      </Col>

                      <Col xs={12} sm={12} md={4}>
                        <FormGroup className="mb-1">
                          <Label
                            for="Person"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Name
                          </Label>
                          <input
                            type="text"
                            name="Person"
                            id="Person"
                            value={state.PartyAccountArray2?.[0]?.Person || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="Name"
                            readOnly
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col xs={10} sm={10} md={4}>
                        <FormGroup className="mb-1">
                          <Label
                            for="Item"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Commodity
                          </Label>
                          <select
                            name="F_ItemType"
                            id="F_ItemType"
                            value={getFieldValue("F_ItemType")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            ref={commodityRef}
                            onKeyDown={e => {
                              handleDropdownKeyDown(e, "F_ItemType")
                              handleKeyDown(e, qtyRef)
                            }}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          >
                            <option value="">Select Commodity</option>
                            {state.ItemArray.map(type => (
                              <option key={type.Id} value={type.Id}>
                                {type.Name}
                              </option>
                            ))}
                          </select>
                        </FormGroup>
                      </Col>

                      <Col xs={2} sm={2} md={1}>
                        <FormGroup className="mb-1">
                          <Label
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.65rem" }}
                          >
                            &nbsp;
                          </Label>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={toggleCommodityModal}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                            style={{
                              width: "100%",
                              height: "28px",
                              padding: "0",
                              fontSize: "0.8rem",
                            }}
                          >
                            +
                          </Button>
                        </FormGroup>
                      </Col>
                      <Col xs={6} sm={4} md={2}>
                        <FormGroup className="mb-1">
                          <Label
                            for="Qty"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Qty
                          </Label>
                          <input
                            type="number"
                            name="Qty"
                            id="Qty"
                            value={getFieldValue("Qty")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="0"
                            ref={qtyRef}
                            onKeyDown={e => handleKeyDown(e, unitRef)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={6} sm={4} md={2}>
                        <FormGroup className="mb-1">
                          <Label
                            for="unit"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Unit
                          </Label>
                          <input
                            type="text"
                            name="Unit"
                            id="Unit"
                            value={state.GlobalArray?.[0]?.Unit || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            readOnly
                            ref={unitRef}
                            onKeyDown={e => handleKeyDown(e, rateRef)}
                          />
                        </FormGroup>
                      </Col>

                      <Col xs={12} sm={4} md={3}>
                        <FormGroup className="mb-1">
                          <Label
                            for="Rate"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Rate
                          </Label>
                          <input
                            type="number"
                            name="Rate"
                            id="Rate"
                            value={getFieldValue("Rate")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="0.00"
                            ref={rateRef}
                            onKeyDown={e => handleKeyDown(e, importDutyRef)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col xs={12} sm={6} md={3}>
                        <FormGroup className="mb-1">
                          <Label
                            for="importDuty"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Import Duty
                          </Label>
                          <input
                            type="number"
                            name="importDuty"
                            id="importDuty"
                            value={state.importDuty}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="0.00"
                            ref={importDutyRef}
                            onKeyDown={e => handleKeyDown(e, tariffRef)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={2}>
                        <FormGroup className="mb-1">
                          <Label
                            for="tariff"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Tariff
                          </Label>
                          <input
                            type="number"
                            name="tariff"
                            id="tariff"
                            value={state.tariff}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="0.00"
                            ref={tariffRef}
                            onKeyDown={e => handleKeyDown(e, exchangeRateRef)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>

                      <Col xs={12} sm={6} md={4}>
                        <FormGroup className="mb-1">
                          <Label
                            for="exchangeRate"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Exchange $ Rate
                          </Label>
                          <input
                            type="number"
                            name="exchangeRate"
                            id="exchangeRate"
                            value={state.exchangeRate}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="0.00"
                            ref={exchangeRateRef}
                            onKeyDown={e => handleKeyDown(e, calPerTonDutyRef)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>
                      <Col xs={12} sm={6} md={3}>
                        <FormGroup className="mb-1">
                          <Label
                            for="calPerTonDuty"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Duty per Ton
                          </Label>
                                                      <input
                              type="number"
                              name="calPerTonDuty"
                              id="calPerTonDuty"
                              value={state.calPerTonDuty}
                              onChange={handleInputChange}
                              className="form-control form-control-sm py-1"
                              placeholder="0.00"
                              ref={calPerTonDutyRef}
                              onKeyDown={e => handleKeyDown(e, contractTypeRef)}
                              disabled={state.isEditMode && !state.isEditingEnabled}
                            />
                        </FormGroup>
                      </Col>
                    </Row>

                    <FormGroup className="mb-1">
                      <Label
                        className="d-flex align-items-center form-label-sm mb-1"
                        style={{ fontSize: "0.75rem" }}
                      >
                        <i className="bx bx-calculator me-2"></i>
                        Invoice Rate:{" "}
                        <span className="text-primary fw-bold ms-2">
                          {state.InvRate || state.Rate || "0.00"}
                        </span>
                      </Label>
                    </FormGroup>
                  </div>

                  {/* Vertical Separator Line */}
                  <div 
                    className="vertical-separator"
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: "0",
                      bottom: "calc(100% - 200px)",
                      width: "2px",
                      backgroundColor: "#dee2e6",
                      zIndex: 1
                    }}
                  ></div>
                    <style>{`
                      @media (max-width: 768px) {
                        .vertical-separator {
                          display: none !important;
                        }
                      }
                    `}</style>

                  {/* Right Column - Conditions */}
                  <div className="contract-right-column" style={{ width: "50%", float: "right", paddingLeft: "15px" }}>
                    <style>{`
                      @media (max-width: 768px) {
                        .contract-right-column {
                          width: 100% !important;
                          float: none !important;
                          padding-left: 0 !important;
                          margin-bottom: 1rem;
                        }
                      }
                    `}</style>
                    <Row className="g-2">
                      <Col md={7}>
                        <FormGroup className="mb-1">
                          <Label
                            for="F_ContractLedger"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Contract Type
                          </Label>
                          <select
                            name="F_ContractLedger"
                            id="F_ContractLedger"
                            value={getFieldValue("F_ContractLedger") || 0}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            ref={contractTypeRef}
                            onKeyDown={e => {
                              handleDropdownKeyDown(e, "F_ContractLedger")
                              handleKeyDown(e, shipMonthRef)
                            }}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          >
                            <option value="">Select Contract Type</option>
                            {state.TaxAccountArray.map(type => (
                              <option key={type.Id} value={type.Id}>
                                {type.Name}
                              </option>
                            ))}
                          </select>
                        </FormGroup>
                      </Col>
                      <Col md={1}>
                        <FormGroup className="mb-1">
                          <Label
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.65rem" }}
                          >
                            &nbsp;
                          </Label>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={toggleContractModal}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                            style={{
                              width: "100%",
                              height: "28px",
                              padding: "0",
                              fontSize: "0.8rem",
                            }}
                          >
                            +
                          </Button>
                        </FormGroup>
                      </Col>

                      <Col md={2}>
                        <FormGroup className="mb-1">
                          <Label
                            for="shipMonth"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Shipment Month
                          </Label>
                          <select
                            name="F_MonthMaster"
                            id="F_MonthMaster"
                            value={getFieldValue("F_MonthMaster")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            disabled={
                              (getFieldValue("ShipMentFromDate") &&
                                getFieldValue("ShipMentToDate")) ||
                              (getFieldValue("LiftedFromDate") &&
                                getFieldValue("LiftedToDate")) ||
                              (state.isEditMode && !state.isEditingEnabled)
                            }
                            ref={shipMonthRef}
                            onKeyDown={e => {
                              handleDropdownKeyDown(e, "F_MonthMaster")
                              handleKeyDown(e, shipYearRef)
                            }}
                          >
                            <option value="">Select Month</option>
                            {state.MonthArray.map(type => (
                              <option key={type.Id} value={type.Id}>
                                {type.Name}
                              </option>
                            ))}
                          </select>
                        </FormGroup>
                      </Col>
                      <Col md={2}>
                        <FormGroup className="mb-1">
                          <Label
                            for="shipYear"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Shipment Year
                          </Label>
                          <select
                            name="F_YearMaster"
                            id="F_YearMaster"
                            value={getFieldValue("F_YearMaster")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            disabled={
                              (getFieldValue("ShipMentFromDate") &&
                                getFieldValue("ShipMentToDate")) ||
                              (getFieldValue("LiftedFromDate") &&
                                getFieldValue("LiftedToDate")) ||
                              (state.isEditMode && !state.isEditingEnabled)
                            }
                            ref={shipYearRef}
                            onKeyDown={e => {
                              handleDropdownKeyDown(e, "F_YearMaster")
                              handleKeyDown(e, vesselRef)
                            }}
                          >
                            <option value="">Select Year</option>
                            {state.YearArray.map(type => (
                              <option key={type.Id} value={type.Id}>
                                {type.Name}
                              </option>
                            ))}
                          </select>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col md={6}>
                        <FormGroup className="mb-1">
                          <Label
                            for="Vessel"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Vessel Name
                          </Label>
                          <input
                            type="text"
                            name="Vessel"
                            id="Vessel"
                            value={getFieldValue("Vessel")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="Enter vessel name"
                            ref={vesselRef}
                            onKeyDown={e => handleKeyDown(e, deliveryPortRef)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup className="mb-1">
                          <Label
                            htmlFor="DeliveryPort"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Delivery Port
                          </Label>
                          <input
                            type="text"
                            name="DeliveryPort"
                            id="DeliveryPort"
                            value={getFieldValue("DeliveryPort") }
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="Enter delivery port"
                            ref={deliveryPortRef}
                            onKeyDown={e => handleKeyDown(e, null)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col md={6}>
                        <FormGroup className="mb-1">
                          <Label
                            for="ShipMentFromDate"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Shipment From
                          </Label>
                          <input
                            type="date"
                            name="ShipMentFromDate"
                            id="ShipMentFromDate"
                            value={formatDateForInput(
                              getFieldValue("ShipMentFromDate")
                            )}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            disabled={
                              (getFieldValue("F_MonthMaster") || getFieldValue("F_YearMaster")) ||
                              (getFieldValue("LiftedFromDate") &&
                                getFieldValue("LiftedToDate")) ||
                              (state.isEditMode && !state.isEditingEnabled)
                            }
                            ref={shipmentFromRef}
                            onKeyDown={e => handleKeyDown(e, null)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup className="mb-1">
                          <Label
                            for="ShipMentToDate"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            To
                          </Label>
                          <input
                            type="date"
                            name="ShipMentToDate"
                            id="ShipMentToDate"
                            value={formatDateForInput(
                              getFieldValue("ShipMentToDate")
                            )}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            disabled={
                              (getFieldValue("F_MonthMaster") || getFieldValue("F_YearMaster")) ||
                              (getFieldValue("LiftedFromDate") &&
                                getFieldValue("LiftedToDate")) ||
                              (state.isEditMode && !state.isEditingEnabled)
                            }
                            ref={shipmentToRef}
                            onKeyDown={e => handleKeyDown(e, null)}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col md={6}>
                        <FormGroup className="mb-1">
                          <Label
                            for="LiftedFromDate"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Lifting From
                          </Label>
                          <input
                            type="date"
                            name="LiftedFromDate"
                            id="LiftedFromDate"
                            value={formatDateForInput(
                              getFieldValue("LiftedFromDate")
                            )}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            disabled={
                              (getFieldValue("F_MonthMaster") || getFieldValue("F_YearMaster")) ||
                              (getFieldValue("ShipMentFromDate") &&
                                getFieldValue("ShipMentToDate")) ||
                              (state.isEditMode && !state.isEditingEnabled)
                            }
                            ref={liftedFromRef}
                            onKeyDown={e => handleKeyDown(e, null)}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup className="mb-1">
                          <Label
                            for="LiftedToDate"
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            To
                          </Label>
                          <input
                            type="date"
                            name="LiftedToDate"
                            id="LiftedToDate"
                            value={formatDateForInput(
                              getFieldValue("LiftedToDate")
                            )}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            disabled={
                              (getFieldValue("F_MonthMaster") || getFieldValue("F_YearMaster")) ||
                              (getFieldValue("ShipMentFromDate") &&
                                getFieldValue("ShipMentToDate")) ||
                              (state.isEditMode && !state.isEditingEnabled)
                            }
                            ref={liftedToRef}
                            onKeyDown={e => handleKeyDown(e, null)}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row className="g-2">
                      <Col md={5}>
                        <FormGroup className="mb-1">
                          <Label
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Payment Terms
                          </Label>
                          <input
                            type="text"
                            name="Remarks"
                            id="Remarks"
                            value={getFieldValue("Remarks")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="Enter payment terms"
                            ref={remarksRef}
                            onKeyDown={e => handleKeyDown(e, advPaymentRef)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>
                      <Col md={3}>
                        <FormGroup className="mb-1">
                          <Label
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Advance
                          </Label>
                          <input
                            type="text"
                            name="AdvPayment"
                            id="AdvPayment"
                            value={getFieldValue("AdvPayment")}
                            onChange={handleInputChange}
                            className="form-control form-control-sm py-1"
                            placeholder="Amount in pmt"
                            ref={advPaymentRef}
                            onKeyDown={e => handleKeyDown(e, advDateRef)}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>

                      <Col md={4}>
                        <FormGroup className="mb-1">
                          <Label
                            className="form-label-sm mb-1"
                            style={{ fontSize: "0.75rem" }}
                          >
                            Deposit Date
                          </Label>
                                                      <input
                              type="date"
                              name="AdvDate"
                              id="AdvDate"
                              value={formatDateForInput(getFieldValue("AdvDate"))}
                              onChange={handleInputChange}
                              className="form-control form-control-sm py-1"
                              ref={advDateRef}
                              onKeyDown={e => handleKeyDown(e, note6Ref)}
                              disabled={state.isEditMode && !state.isEditingEnabled}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row>
                      <Col lg={4}>
                  <Input
                    type="text"
                    value={state.DiffAmt || "0.00"}
                    readOnly
                    className={`form-control-sm ${parseFloat(state.DiffAmt || 0) > 0 ? 'text-danger fw-bold' : parseFloat(state.DiffAmt || 0) < 0 ? 'text-success fw-bold' : ''}`}
                  />
                </Col>
                      </Row>
                  </div>

                  {/* Clear float and add Notes section below both columns */}
                  <div style={{ clear: "both" }} className="clearfix-mobile">
                    <style>{`
                      @media (max-width: 768px) {
                        .clearfix-mobile {
                          clear: both;
                          margin-top: 1rem;
                        }
                      }
                    `}</style>
                  </div>

                  {/* Notes Section - Full Width */}
                  <div className="notes-section mt-3">
                    <h6
                      className="section-title"
                      style={{ fontSize: "0.675rem", marginBottom: "0.1rem" }}
                    >
                      <i className="bx bx-note me-2"></i>
                      Notes
                    </h6>
                    <Row className="g-0">
                      <Col md={12}>
                        <FormGroup>
                          <input
                            type="text"
                            name="Note6"
                            id="notes6"
                            value={state.Note6 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-0"
                            placeholder="Write a Note  "
                            ref={note6Ref}
                            onKeyDown={e => {
                              handleNoteKeyDown(e, "Note6")
                              handleDropdownKeyDown(e, "Note6")
                              handleKeyDown(e, note1Ref)
                            }}
                            style={{ marginBottom: "1px" }}
                            autoComplete="off"
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                          <input
                            type="text"
                            name="Note1"
                            id="notes1"
                            value={state.Note1 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-0"
                            placeholder="Write a Note "
                            ref={note1Ref}
                            onKeyDown={e => {
                              handleNoteKeyDown(e, "Note1")
                              handleDropdownKeyDown(e, "Note1")
                              handleKeyDown(e, note2Ref)
                            }}
                            style={{ marginBottom: "1px" }}
                            autoComplete="off"
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                          <input
                            type="text"
                            name="Note2"
                            id="notes2"
                            value={state.Note2 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-0"
                            placeholder="Write a Note  "
                            ref={note2Ref}
                            onKeyDown={e => {
                              handleNoteKeyDown(e, "Note2")
                              handleDropdownKeyDown(e, "Note2")
                              handleKeyDown(e, note3Ref)
                            }}
                            style={{ marginBottom: "1px" }}
                            autoComplete="off"
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                          <input
                            type="text"
                            id="notes3"
                            name="Note3"
                            value={state.Note3 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-0"
                            placeholder="Write a Note  "
                            ref={note3Ref}
                            onKeyDown={e => {
                              handleNoteKeyDown(e, "Note3")
                              handleDropdownKeyDown(e, "Note3")
                              handleKeyDown(e, note4Ref)
                            }}
                            style={{ marginBottom: "1px" }}
                            autoComplete="off"
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                          <input
                            type="text"
                            name="Note4"
                            id="notes4"
                            value={state.Note4 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-0"
                            placeholder="Write a Note "
                            ref={note4Ref}
                            onKeyDown={e => {
                              handleNoteKeyDown(e, "Note4")
                              handleDropdownKeyDown(e, "Note4")
                              handleKeyDown(e, note5Ref)
                            }}
                            style={{ marginBottom: "1px" }}
                            autoComplete="off"
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                          <input
                            type="text"
                            name="Note5"
                            id="notes5"
                            value={state.Note5 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm"
                            placeholder="Write a Note  "
                            ref={note5Ref}
                            onKeyDown={e => {
                              console.log("Enter key pressed",e.key)
                              if (e.key == "Enter") {
                                console.log("Enter key pressed")
                                e.preventDefault()
                                // Transfer focus to Save button
                                if (saveButtonRef.current) {
                                  saveButtonRef.current.focus()
                                }
                              } else {
                              handleNoteKeyDown(e, "Note5")
                              handleDropdownKeyDown(e, "Note5")
                              }
                            }}
                            autoComplete="off"
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Col>

              {/* Right Panel - Lifting Details and Notes */}
              <Col xs={12} md={12} lg={4}>
                <div className="form-section">
                  <h6
                    className="section-title"
                    style={{ fontSize: "1rem", fontWeight: "bold" }}
                  >
                    <i className="bx bx-truck me-2"></i>
                    Lifting Details

                  
                  </h6>

                  <span>
                     <select
                            name="LiftingLedger"
                            id="LiftingLedger"
                            value={getFieldValue("LiftingLedger")}
                            onChange={handleInputChange}
                            onKeyDown={e => handleDropdownKeyDown(e, "LiftingLedger")}
                            className="form-control form-control-sm py-1"
                            style={{ width: "200px", maxWidth: "200px" , height: "30px", fontWeight: "bold"}}
                            disabled={state.isEditMode && !state.isEditingEnabled}
                          >
                            <option value="">Select Lifting</option>
                            {state.PartyAccountArray.map(type => (
                              <option key={type.Id} value={type.Id}>
                                {type.Name}
                              </option>
                            ))}
                          </select> 
                          </span>
                  

                  {/* Compact Lifting Table */}
                  <div className="table-container mb-2">
                    <div
                      className="table-responsive lifting-table-responsive"
                      style={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        border: "1px solid #dee2e6",
                        borderRadius: "0.375rem",
                        boxShadow: "inset 0 0 5px rgba(0,0,0,0.1)",
                      }}
                    >
                      <style>{`
                        /* Date input styles for all screen sizes */
                        .lifting-table-responsive input[type="date"],
                        .lifting-date-input {
                          color: #000000 !important;
                          background-color: #ffffff !important;
                        }
                        .lifting-table-responsive input[type="date"]::-webkit-calendar-picker-indicator,
                        .lifting-date-input::-webkit-calendar-picker-indicator {
                          filter: invert(0) !important;
                          opacity: 1 !important;
                          cursor: pointer !important;
                        }
                        .lifting-table-responsive input[type="date"]::-webkit-input-placeholder,
                        .lifting-date-input::-webkit-input-placeholder {
                          color: #6c757d !important;
                          opacity: 1 !important;
                        }
                        .lifting-table-responsive input[type="date"]::placeholder,
                        .lifting-date-input::placeholder {
                          color: #6c757d !important;
                          opacity: 1 !important;
                        }
                        .lifting-table-responsive input[type="date"]::-webkit-datetime-edit-text,
                        .lifting-table-responsive input[type="date"]::-webkit-datetime-edit-month-field,
                        .lifting-table-responsive input[type="date"]::-webkit-datetime-edit-day-field,
                        .lifting-table-responsive input[type="date"]::-webkit-datetime-edit-year-field,
                        .lifting-date-input::-webkit-datetime-edit-text,
                        .lifting-date-input::-webkit-datetime-edit-month-field,
                        .lifting-date-input::-webkit-datetime-edit-day-field,
                        .lifting-date-input::-webkit-datetime-edit-year-field {
                          color: #000000 !important;
                          padding: 0 2px !important;
                        }
                        .lifting-table-responsive input[type="date"]::-webkit-datetime-edit,
                        .lifting-date-input::-webkit-datetime-edit {
                          color: #000000 !important;
                        }
                        .lifting-table-responsive input[type="date"]:focus,
                        .lifting-date-input:focus {
                          color: #000000 !important;
                          background-color: #ffffff !important;
                        }
                        
                        /* Mobile-specific date format hint */
                        .lifting-date-wrapper {
                          position: relative;
                        }
                        .lifting-date-hint {
                          display: none;
                        }
                        @media (max-width: 768px) {
                          .lifting-table-responsive {
                            overflow-x: auto !important;
                            overflow-y: auto !important;
                            -webkit-overflow-scrolling: touch !important;
                            display: block !important;
                            width: 100% !important;
                          }
                          .lifting-table-responsive .table {
                            min-width: 600px !important;
                            width: 100% !important;
                          }
                          /* Show date format hint on mobile */
                          .lifting-date-hint {
                            display: block !important;
                          }
                          /* Make date input text visible when empty on mobile */
                          .lifting-date-input:invalid:not(:focus) {
                            color: transparent !important;
                          }
                        }
                      `}</style>
                      <Table
                        size="sm"
                        className="table table-bordered table-sm mb-0"
                      >
                        <thead
                          className="table-light sticky-top"
                          style={{ backgroundColor: "#ffffff" }}
                        >
                          <tr>
                            <th
                              className="py-1 px-1"
                              style={{ fontSize: "1rem" }}
                            >
                              Date
                            </th>
                            <th
                              className="py-1 px-1"
                              style={{ fontSize: "1rem" }}
                            >
                              Lorry
                            </th>
                            <th
                              className="py-1 px-1"
                              style={{ fontSize: "1rem" }}
                            >
                              B.No
                            </th>
                            <th
                              className="py-1 px-1"
                              style={{ fontSize: "1rem" }}
                            >
                              Qty
                            </th>
                            <th
                              className="py-1 px-1"
                              style={{ fontSize: "1rem" }}
                            >
                              Rate
                            </th>
                            <th
                              className="py-1 px-1"
                              style={{ fontSize: "1rem" }}
                            >
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {liftingRows.map((row, index) => (
                            <tr key={index}>
                              <td className="py-1 px-1">
                                <div className="lifting-date-wrapper" style={{ position: "relative" }}>
                                  <input
                                    type="date"
                                    name={`Date1-${index}`}
                                    className="form-control form-control-sm py-1 lifting-date-input"
                                    value={row.Date1 || ""}
                                    onChange={e =>
                                      handleLiftingChange(
                                        index,
                                        "Date1",
                                        e.target.value
                                      )
                                    }
                                    onKeyDown={e =>
                                      handleLiftingKeyDown(e, index, "Date1")
                                    }
                                    placeholder="DD-MM-YYYY"
                                    data-placeholder="DD-MM-YYYY"
                                    disabled={state.isEditMode && !state.isEditingEnabled}
                                    style={{ 
                                      color: "#000000", 
                                      backgroundColor: "#ffffff",
                                      position: "relative"
                                    }}
                                  />
                                  {!row.Date1 && (
                                    <span 
                                      className="lifting-date-hint d-md-none"
                                      style={{
                                        position: "absolute",
                                        left: "5px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: "#6c757d",
                                        fontSize: "0.7rem",
                                        pointerEvents: "none",
                                        zIndex: 1
                                      }}
                                    >
                                      DD-MM-YYYY
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  name={`LorryNo-${index}`}
                                  className="form-control form-control-sm py-1"
                                  value={row.LorryNo || ""}
                                  onChange={e =>
                                    handleLiftingChange(
                                      index,
                                      "LorryNo",
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={e =>
                                    handleLiftingKeyDown(e, index, "LorryNo")
                                  }
                                  placeholder="Lorry #"
                                  disabled={state.isEditMode && !state.isEditingEnabled}
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  name={`BNo-${index}`}
                                  className="form-control form-control-sm py-1"
                                  value={row.BNo || ""}
                                  onChange={e =>
                                    handleLiftingChange(
                                      index,
                                      "BNo",
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={e =>
                                    handleLiftingKeyDown(e, index, "BNo")
                                  }
                                  placeholder="B.No"
                                  disabled={state.isEditMode && !state.isEditingEnabled}
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  name={`Lifted-${index}`}
                                  className="form-control form-control-sm py-1"
                                  value={row.Lifted || ""}
                                  onChange={e =>
                                    handleLiftingChange(
                                      index,
                                      "Lifted",
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={e =>
                                    handleLiftingKeyDown(e, index, "Lifted")
                                  }
                                  placeholder="Qty"
                                  disabled={state.isEditMode && !state.isEditingEnabled}
                                />
                              </td>
                              <td className="py-1 px-1">
                                <input
                                  type="text"
                                  name={`Rate1-${index}`}
                                  className="form-control form-control-sm py-1"
                                  value={row.Rate1 || ""}
                                  onChange={e =>
                                    handleLiftingChange(
                                      index,
                                      "Rate1",
                                      e.target.value
                                    )
                                  }
                                  onKeyDown={e =>
                                    handleLiftingKeyDown(e, index, "Rate1")
                                  }
                                  placeholder="Rate"
                                  disabled={state.isEditMode && !state.isEditingEnabled}
                                />
                              </td>
                              <td className="py-1 px-1">
                                <div className="btn-group btn-group-sm">
                                  <button
                                    type="button"
                                    className="btn btn-outline-danger btn-sm py-1 px-2"
                                    onClick={() =>
                                      handleRemoveLiftingRow(index)
                                    }
                                    disabled={
                                      (liftingRows && liftingRows.length <= 7) ||
                                      (state.isEditMode && !state.isEditingEnabled)
                                    }
                                    title="Remove row"
                                  >
                                    <i className="bx bx-minus"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm py-1 px-2"
                                    onClick={handleAddLiftingRow}
                                    disabled={state.isEditMode && !state.isEditingEnabled}
                                    title="Add new row"
                                  >
                                    <i className="bx bx-plus"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>
                  </div>

                  {/* Row Count Info */}
                  <div
                    className="text-muted text-center mb-1"
                    style={{ fontSize: "0.6rem" }}
                  >
                    Total Rows: {liftingRows.length}
                    {liftingRows.length > 7 && (
                      <span
                        className="badge bg-info ms-1"
                        style={{ fontSize: "0.5rem" }}
                      >
                        Scrollable
                      </span>
                    )}
                  </div>

                  {/* Compact Lifting Summary */}
                  <Row className="g-1 mb-1">
                    <Col xs={6} md={3}>
                      <FormGroup>
                        <Label
                          className="form-label-sm text-muted"
                          style={{ fontSize: "0.65rem" , fontWeight: "bold" }}
                        >
                          Contract Qty
                        </Label>
                        <div
                          className={`form-control-sm py-1 ${
                            state.totalLiftingQty > state.contractQty
                              ? "bg-warning"
                              : "bg-light"
                          }`}
                        >
                          {state.contractQty || state.Qty || "0.00"}
                        </div>
                      </FormGroup>
                    </Col>
                    <Col xs={6} md={3}>
                      <FormGroup>
                        <Label
                          className="form-label-sm text-muted"
                          style={{ fontSize: "0.65rem" , fontWeight: "bold" }}
                        >
                          Total Lifting
                        </Label>
                        <div
                          className={`form-control-sm py-1 ${
                            state.totalLiftingQty > state.contractQty
                              ? "bg-warning"
                              : "bg-light"
                          }`}
                        >
                          {state.totalLiftingQty || "0.00"}
                        </div>
                      </FormGroup>
                    </Col>
                    <Col xs={6} md={3}>
                      <FormGroup>
                        <Label
                          className="form-label-sm text-muted"
                          style={{ fontSize: "0.65rem" , fontWeight: "bold" }}
                        >
                          Pending
                        </Label>
                        <div className="form-control-sm py-1 bg-light">
                          {Math.max(
                            0,
                            (state.contractQty || state.Qty || 0) -
                              (state.totalLiftingQty || 0)
                          ).toFixed(2)}
                        </div>
                      </FormGroup>
                    </Col>
                    <Col xs={6} md={3}>
                      <FormGroup>
                        <Label
                          className="form-label-sm text-muted"
                          style={{ fontSize: "0.65rem" , fontWeight: "bold"   }}
                        >
                          Diff. Amt
                        </Label>
                        <input
                          type="text"
                          name="DiffAmt"
                          value={state.DiffAmt || "0.00"}
                          onChange={handleInputChange}
                          className={`form-control-sm py-1 ${
                            parseFloat(state.DiffAmt || 0) < 0
                              ? "text-success"
                              : parseFloat(state.DiffAmt || 0) > 0
                              ? "text-danger"
                              : ""
                          }`}
                          placeholder="0.00"
                          readOnly
                          disabled={state.isEditMode && !state.isEditingEnabled}
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  {/* Back Seller Contract No */}
                  <Row className="g-1 mb-1">
                    <Col xs={12}>
                      <FormGroup>
                        <Label
                          for="BackSellerCNo"
                          className="form-label-sm"
                          style={{ fontSize: "0.65rem" , fontWeight: "bold" }}
                        >
                          Back Seller CNo
                        </Label>
                        <input
                          type="text"
                          name="BackSellerCNo"
                          id="BackSellerCNo"
                          value={state.BackSellerCNo || ""}
                          onChange={handleInputChange}
                          className="form-control form-control-sm"
                          placeholder="Back seller contract no"
                          disabled={state.isEditMode && !state.isEditingEnabled}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                </div>
              </Col>
            </Row>

            {/* Action Buttons - Single Row */}
            <Row className="mt-2">
              <Col xs={12}>
                <div className="action-buttons">
                  <style>{`
                    @media (max-width: 768px) {
                      .action-buttons .d-flex {
                        display: grid !important;
                        grid-template-columns: repeat(5, 1fr) !important;
                        gap: 0.4rem !important;
                        width: 100% !important;
                      }
                      .action-buttons .action-btn {
                        width: 100% !important;
                        margin-right: 0 !important;
                        margin-bottom: 0 !important;
                        font-size: 0.7rem !important;
                        padding: 0.35rem 0.25rem !important;
                        min-height: 38px !important;
                        display: flex !important;
                        align-items: center !important;
                        justify-content: center !important;
                      }
                      .action-buttons .action-btn i {
                        font-size: 0.9rem !important;
                      }
                      .action-buttons .action-btn span {
                        font-size: 0.65rem !important;
                        white-space: nowrap;
                      }
                    }
                  `}</style>
                  <div className="d-flex flex-wrap justify-content-start align-items-start">
                    {/* First Row - Primary Actions (5 buttons) */}
                    <button
                      type="button"
                      className="btn btn-warning btn-sm action-btn"
                      onClick={handleEnableEditing}
                    >
                      <i className="bx bx-edit"></i>
                      <span className="d-none d-sm-inline ms-1">Edit</span>
                      <span className="d-inline d-sm-none ms-1">Edit</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm action-btn"
                      onClick={handleUpdateExistingContract}
                      disabled={state.isProgress || (state.isEditMode && !state.isEditingEnabled)}
                      ref={saveButtonRef}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (window.confirm("Are you sure you want to save?")) {
                            handleUpdateExistingContract()
                          }
                        }
                      }}
                      style={{
                        transition: "all 0.3s ease",
                        boxShadow: "none"
                      }}
                      onFocus={e => {
                        e.target.style.boxShadow = "0 0 0 0.2rem rgba(0, 123, 255, 0.5), 0 0 15px rgba(0, 123, 255, 0.6)"
                        e.target.style.transform = "scale(1.05)"
                      }}
                      onBlur={e => {
                        e.target.style.boxShadow = "none"
                        e.target.style.transform = "scale(1)"
                      }}
                    >
                      {state.isProgress ? (
                        <>
                          <i className="bx bx-loader-alt bx-spin"></i>
                          <span className="ms-1">{state.isEditMode ? "Update" : "Save"}</span>
                        </>
                      ) : (
                        <>
                          <i className="bx bx-save"></i>
                          <span className="ms-1">{state.isEditMode ? "Update" : "Save"}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      className="btn btn-danger btn-sm action-btn"
                      onClick={handleDelete}
                      disabled={state.isEditMode && !state.isEditingEnabled}
                    >
                      <i className="bx bx-trash"></i>
                      <span className="ms-1">Delete</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-info btn-sm action-btn"
                      onClick={handlePrint}
                    >
                      <i className="bx bx-printer"></i>
                      <span className="ms-1">Print</span>
                    </button>

                    {/* Second Row - Communication Actions (4 buttons) */}
                    <button
                      type="button"
                      className="btn btn-dark btn-sm action-btn"
                      onClick={handleExit}
                    >
                      <i className="bx bx-exit"></i>
                      <span className="ms-1">Exit</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm action-btn"
                      onClick={handleMailSeller}
                    >
                      <i className="bx bx-envelope"></i>
                      <span className="d-none d-md-inline ms-1">Mail Seller</span>
                      <span className="d-inline d-md-none ms-1">M.Sel</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-primary btn-sm action-btn"
                      onClick={handleMailBuyer}
                    >
                      <i className="bx bx-envelope"></i>
                      <span className="d-none d-md-inline ms-1">Mail Buyer</span>
                      <span className="d-inline d-md-none ms-1">M.Buy</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm action-btn"
                      onClick={handleWhatsAppSeller}
                    >
                      <i className="bx bxl-whatsapp"></i>
                      <span className="d-none d-md-inline ms-1">WA Seller</span>
                      <span className="d-inline d-md-none ms-1">W.Sel</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-outline-success btn-sm action-btn"
                      onClick={handleWhatsAppBuyer}
                    >
                      <i className="bx bxl-whatsapp"></i>
                      <span className="d-none d-md-inline ms-1">WA Buyer</span>
                      <span className="d-inline d-md-none ms-1">W.Buy</span>
                    </button>
                  </div>
                </div>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      {/* Seller Modal */}
      <Modal isOpen={sellerModal} toggle={toggleSellerModal} size="md" centered>
        <ModalHeader toggle={toggleSellerModal}>
          <h5 className="modal-title">Add New Seller</h5>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="newPartyName" className="form-label-sm">
              Ledger Name *
            </Label>
            <Input
              type="text"
              id="newPartyName"
              value={newPartyData.Name}
              onChange={e => handleModalInputChange("Name", e.target.value)}
              placeholder="Enter ledger name"
              className="form-control-sm"
            />
          </FormGroup>
          <FormGroup>
            <Label for="newPartyPerson" className="form-label-sm">
              Contact Person *
            </Label>
            <Input
              type="text"
              id="newPartyPerson"
              value={newPartyData.Person}
              onChange={e => handleModalInputChange("Person", e.target.value)}
              placeholder="Enter contact person name"
              className="form-control-sm"
            />
          </FormGroup>

          <FormGroup>
            <Label for="newPartyAddress" className="form-label-sm">
              Address *
            </Label>
            <Input
              type="text"
              id="newPartyAddress"
              value={newPartyData.Address}
              onChange={e => handleModalInputChange("Address", e.target.value)}
              placeholder="Enter address"
              className="form-control-sm"
            />
          </FormGroup>
          <FormGroup>
            <Label for="newPartyGSTNo" className="form-label-sm">
              GST No *
            </Label>
            <Input
              type="text"
              id="newPartyGSTNo"
              value={newPartyData.GSTNo}
              onChange={e => handleModalInputChange("GSTNo", e.target.value)}
              placeholder="Enter GST No"
              className="form-control-sm"
            />
          </FormGroup>
          
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleSellerModal}>
            Cancel
          </Button>
          <Button color="primary" onClick={() => handleSaveNewParty("seller")}>
            Save
          </Button>
        </ModalFooter>
      </Modal>

      {/* Seller Modal */}
      <Modal
        isOpen={contractModal}
        toggle={toggleContractModal}
        size="md"
        centered
      >
        <ModalHeader toggle={toggleContractModal}>
          <h5 className="modal-title">Add New Contract</h5>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="newContractName" className="form-label-sm">
              Contract Type *
            </Label>
            <Input
              type="text"
              id="newContractName"
              value={newContractData.Name}
              onChange={e =>
                handleContractModalInputChange("Name", e.target.value)
              }
              placeholder="Enter contract type"
              className="form-control-sm"
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleContractModal}>
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={() => handleSaveNewContract("contract")}
          >
            Save
          </Button>
        </ModalFooter>
      </Modal>


      {/* Commodity Modal */}
      <Modal
        isOpen={commodityModal}
        toggle={toggleCommodityModal}
        size="md"
        centered
      >
        <ModalHeader toggle={toggleCommodityModal}>
          <h5 className="modal-title">Add New Commodity</h5>
        </ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="newCommodityName" className="form-label-sm">
              Commodity Type *
            </Label>
            <Input
              type="text"
              id="newCommodityName"
              value={newCommodityData.Name}
              onChange={e =>
                handleCommodityModalInputChange("Name", e.target.value)
              }
              placeholder="Enter commodity type"
              className="form-control-sm"
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleCommodityModal}>
            Cancel
          </Button>
          <Button
            color="primary"
            onClick={() => handleSaveNewCommodity("commodity")}
          >
            Save
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  )
}

export default Contract
