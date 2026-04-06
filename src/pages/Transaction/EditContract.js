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
import { toast } from "react-toastify"
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

const EditContract = ({
  isModal = false,
  contractData = null,
  onClose = null,
}) => {
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
    LiftingLedger: 0,
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
    // New state variable to control field disable state
    isFieldsDisabled: false,
  })
  const [liftingRows, setLiftingRows] = useState(createDefaultLiftingRows(7))

  const [showSharePDFModal, setShowSharePDFModal] = useState(false)
  const [pendingShareFile, setPendingShareFile] = useState(null)
  const [sellerModal, setSellerModal] = useState(false)
  const [newPartyData, setNewPartyData] = useState({ Name: "", Person: "", Address: "", GSTNo: "" })
  const [commodityModal, setCommodityModal] = useState(false)
  const [newCommodityData, setNewCommodityData] = useState({ Name: "" })
  const [contractModal, setContractModal] = useState(false)
  const [newContractData, setNewContractData] = useState({ Name: "", IsVessel: false, IsShipmentMonth: false, IsShipmentPeriod: false, IsLiftingPeriod: false })

  const API_URL_SAVE = `${API_WEB_URLS.ContractH}/0/token`
  const API_URL_Lifting = `${API_WEB_URLS.AddLifting}/0/token`
  const API_URL = API_WEB_URLS.MASTER + "/0/token/PartyAccount"
  const API_URL1 = API_WEB_URLS.MASTER + "/0/token/ContractType"
  const API_URL2 = API_WEB_URLS.MASTER + "/0/token/UnitMaster"
  const API_URL3 = API_WEB_URLS.MASTER + "/0/token/ItemMaster"
  const API_URL4 = API_WEB_URLS.MASTER + "/0/token/MonthMaster"
  const API_URL4_Year = API_WEB_URLS.MASTER + "/0/token/YearMaster"
  const API_URL5 = API_WEB_URLS.MASTER + "/0/token/UpdateGlobalOptions"
  const API_URL6 = API_WEB_URLS.MASTER + "/0/token/PartyAccount1"
  const API_URL7 = API_WEB_URLS.MASTER + "/0/token/ContractHNoWeb"
  const API_URL8 = API_WEB_URLS.MASTER + "/0/token/ContractHMaster"
  const API_URL9 = API_WEB_URLS.MASTER + "/0/token/ContractNoNew"
  const API_URL10 = API_WEB_URLS.MASTER + "/0/token/LiftingMaster"
  const API_Delete = API_WEB_URLS.MASTER + "/0/token/DeleteContract"
  const API_SaveLedger = `${API_WEB_URLS.LedgerMaster}/0/token`
  const API_SaveCommodity = `${API_WEB_URLS.ItemMaster}/0/token`
  const API_SaveContractType = `${API_WEB_URLS.ContractType}/0/token`



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
    Fn_FillListData(dispatch, setState, "NewArray", API_URL9 + "/Id/0")

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
      isFieldsDisabled: false,
    }))
  }, [])

  // Set ContractNo to ContractNoNew when NewArray is loaded (for new contracts)
  useEffect(() => {
    if (
      state.NewArray &&
      state.NewArray.length > 0 &&
      state.NewArray[0]?.ContractNoNew
    ) {
      setState(prev => ({
        ...prev,
        ContractNo: state.NewArray[0].ContractNoNew,
      }))
    }
  }, [state.NewArray])

  // Focus on ContractNo field when page loads
  useEffect(() => {
    // Focus on ContractNo field when page loads
    if (contractNoRef.current) {
      contractNoRef.current.focus()
    }
  }, [])

  // Check for contract data passed from navigation state (e.g., from LedgerReport)
  useEffect(() => {
    if (location.state?.Id) {
      const contractId = location.state.Id
      console.log("Loading contract from navigation state:", contractId)

      // Set the contract number and trigger loading
      setState(prev => ({
        ...prev,
        ContractNo: contractId,
      }))

      // Load the contract data
      loadContractByContractNo(contractId)
    }
  }, [location.state])

  // Check for contract data passed as modal prop
  useEffect(() => {
    if (isModal && contractData) {
      console.log("Loading contract from modal props:", contractData)

      // Try to load by ID first, then by ContractNo as fallback
      let contractIdentifier =
        contractData.Id || contractData.ContractId || contractData.Contract_Id

      if (!contractIdentifier && contractData.ContractNo) {
        // If no ID found, try to load by ContractNo
        contractIdentifier = contractData.ContractNo
      }

      if (contractIdentifier) {
        // Set the contract number and trigger loading
        setState(prev => ({
          ...prev,
          ContractNo: contractIdentifier,
        }))

        // Load the contract data
        loadContractByContractNo(contractIdentifier)
      } else {
        console.error(
          "No contract identifier found in contract data:",
          contractData
        )
        toast.error("No contract identifier found")
      }
    }
  }, [isModal, contractData])

  // Function to load contract by contract number
  const loadContractByContractNo = async contractId => {
    try {
      await Fn_FillListData(
        dispatch,
        setState,
        "ContractArray",
        `${API_URL8}/Id/${contractId}`
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

            // Fetch lifting data using ContractH ID
            Fn_FillListData(
              dispatch,
              setState,
              "LiftingArray",
              `${API_URL10}/Id/${contract.Id}`
            )

            // Show success message
            toast.success(`Contract ${contractId} loaded successfully!`)

            return {
              ...prev,
              id: contract.Id || 0,
              Date:
                formatDateForInput(contract.Date) ||
                new Date().toISOString().split("T")[0],
              ContractNo: contract.ContractNo || contractId,
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
              isFieldsDisabled: true,
              contractQty: contract.Qty || 0,
              BackSellerCNo: contract.BackSellerCNo || "",
              LiftingLedger: contract.LiftingLedger || 0,
            }
          } else {
            // No existing contract found
            console.log("No contract found with contract ID:", contractId)
            toast.error(`No contract found with contract ID: ${contractId}`)
            return {
              ...prev,
              id: 0,
              ContractArray: [],
              LiftingArray: [],
              isEditMode: false,
              isFieldsDisabled: false,
              ContractNo: contractId,
            }
          }
        })
      }, 200)
    } catch (error) {
      console.error("Error loading contract:", error)
      toast.error(`Error loading contract: ${error.message}`)
      setState(prev => ({
        ...prev,
        id: 0,
        ContractArray: [],
        LiftingArray: [],
        isEditMode: false,
        isFieldsDisabled: false,
        ContractNo: contractId,
      }))
    }
  }

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
            ? `Lifting quantity (${totalLiftingQty}) exceeds contract quantity (${prev.contractQty || prev.Qty || 0
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

    setState(prev => ({ ...prev, [name]: newValue }))

    // Auto-update InvRate when Rate is changed (InvRate = Rate + calPerTonDuty)
    if (name === "Rate") {
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

      setState(prev => {
        const newInvRate = parseFloat(value || 0) + parseFloat(prev.calPerTonDuty || 0)
        return {
          ...prev,
          InvRate: newInvRate,
          DiffAmt: diffAmt.toFixed(2),
        }
      })
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

    // Auto-calculate Duty per Ton = (Import Duty * Tariff * Exchange Rate) / 100
    // Also update InvRate = Rate + new calPerTonDuty
    if (name === "importDuty" || name === "tariff" || name === "exchangeRate") {
      setState(prev => {
        const duty = parseFloat(name === "importDuty" ? value : prev.importDuty) || 0
        const tariffVal = parseFloat(name === "tariff" ? value : prev.tariff) || 0
        const exchange = parseFloat(name === "exchangeRate" ? value : prev.exchangeRate) || 0
        const result = (duty * tariffVal * exchange) / 100
        const calPerTonDuty = (Math.trunc(result * 100) / 100).toFixed(2)
        const newInvRate = parseFloat(prev.Rate || 0) + parseFloat(calPerTonDuty)
        return { ...prev, calPerTonDuty, InvRate: newInvRate }
      })
    }

    // When calPerTonDuty is edited directly, update InvRate = Rate + calPerTonDuty
    if (name === "calPerTonDuty") {
      setState(prev => ({
        ...prev,
        InvRate: parseFloat(prev.Rate || 0) + parseFloat(value || 0),
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

    if (name === "ContractNo" && value) {
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
                Date:
                  formatDateForInput(contract.Date) ||
                  new Date().toISOString().split("T")[0],
                ContractNo: contract.ContractNo || value,
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
                Note1: contract.Note1 || "",
                Note2: contract.Note2 || "",
                Note3: contract.Note3 || "",
                Note4: contract.Note4 || "",
                Note6: contract.Note6 || "",
                importDuty: contract.importDuty || 0,
                tariff: contract.tariff || 0,
                exchangeRate: contract.exchangeRate || 0,
                calPerTonDuty: contract.calPerTonDuty || 0,
                isEditMode: true,
                isFieldsDisabled: true,
                contractQty: contract.Qty || 0,
                BackSellerCNo: contract.BackSellerCNo || "",
                SellerPerson: contract.SellerPerson || "",
                BuyerPerson: contract.BuyerPerson || "",
                LiftingLedger: contract.LiftingLedger || 0,
              }
            } else {
              // No existing contract found, this is a new contract number
              return {
                ...prev,
                id: 0,
                ContractArray: [],
                LiftingArray: [],
                isEditMode: false,
                isFieldsDisabled: false,
                // Keep the manually entered contract number
                ContractNo: value,
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
          isFieldsDisabled: false,
          ContractNo: value,
        }))
      }
    } else if (name === "ContractNo" && !value) {
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
        isFieldsDisabled: true,
        // Reset ContractNo to ContractNoNew for new contracts
        ContractNo: state.NewArray?.[0]?.ContractNoNew || "",
      }))
    }

    // Handle F_YearMaster change
    if (name === "F_YearMaster") {
      const selectedYear = state.YearArray.find(year => year.Id == newValue)
      if (selectedYear) {
        console.log("Selected year:", selectedYear)
      }
    }
  }



  // Handle modal form input changes
  const handleModalInputChange = (field, value) => {
    setNewPartyData(prev => ({
      ...prev,
      [field]: value,
    }))
  }

  const toggleSellerModal = () => {
    setSellerModal(!sellerModal)
    if (!sellerModal) {
      setNewPartyData({ Name: "", Person: "", Address: "", GSTNo: "" })
    }
  }

  const toggleContractModal = () => {
    setContractModal(!contractModal)
    if (!contractModal) {
      setNewContractData({ Name: "", IsVessel: false, IsShipmentMonth: false, IsShipmentPeriod: false, IsLiftingPeriod: false })
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

  const handleSaveNewParty = async () => {
    const formData = new FormData()
    formData.append("Name", newPartyData.Name || "")
    formData.append("Person", newPartyData.Person || "")
    formData.append("Address", newPartyData.Address || "")
    formData.append("GSTNo", newPartyData.GSTNo || "")
    formData.append("F_LedgerGroupMaster", 40)

    await Fn_AddEditData(
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

  const handleSaveNewContract = async () => {
    const obj = JSON.parse(localStorage.getItem("authUser"))
    const formData = new FormData()
    formData.append("Name", newContractData.Name || "")
    formData.append("IsVessel", newContractData.IsVessel ? "true" : "false")
    formData.append("IsShipmentMonth", newContractData.IsShipmentMonth ? "true" : "false")
    formData.append("IsShipmentPeriod", newContractData.IsShipmentPeriod ? "true" : "false")
    formData.append("IsLiftingPeriod", newContractData.IsLiftingPeriod ? "true" : "false")
    formData.append("UserId", obj.uid)

    await Fn_AddEditData(
      dispatch,
      setNewContractData,
      { arguList: { id: 0, formData } },
      API_SaveContractType,
      true,
      "NewTender",
      navigate,
      "#"
    )

    setContractModal(false)
    Fn_FillListData(dispatch, setState, "TaxAccountArray", API_URL1 + "/Id/0")
  }

  const handleSaveNewCommodity = async () => {
    const formData = new FormData()
    formData.append("Name", newCommodityData.Name || "")

    await Fn_AddEditData(
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

  const handleSave = async () => {
    try {
      setState(prev => ({
        ...prev,
        isProgress: true,
        showSuccessMessage: false,
        showErrorMessage: false,
      }))

      const formData = new FormData()

      // Use current state values instead of ContractArray values for editing
      formData.append("Date", state.Date || "")
      formData.append(
        "ContractNo",
        state.ContractNo ||
        state.NewArray?.[0]?.ContractNoNew ||
        state.ContractArray?.[0]?.ContractNo ||
        ""
      )
      formData.append(
        "F_UnitMaster",
        state.GlobalArray?.[0]?.F_UnitMaster || ""
      )
      formData.append("F_SellerLedger", state.F_SellerLedger || 0)
      formData.append("F_BuyerLedger", state.F_BuyerLedger || 0)
      formData.append("F_ItemType", state.F_ItemType || 0)
      formData.append("Qty", state.Qty || 0)
      formData.append("Rate", state.Rate || 0)
      formData.append("InvRate", state.InvRate || state.Rate || 0)
      formData.append("F_MonthMaster", state.F_MonthMaster || 0)
      formData.append("F_YearMaster", state.F_YearMaster || 0)
      formData.append("Vessel", state.Vessel || "")
      formData.append("DeliveryPort", state.DeliveryPort || "")
      formData.append("ShipMentFromDate", state.ShipMentFromDate || "")
      formData.append("ShipMentToDate", state.ShipMentToDate || "")
      formData.append("LiftedFromDate", state.LiftedFromDate || "")
      formData.append("LiftedToDate", state.LiftedToDate || "")
      formData.append("F_ContractLedger", state.F_ContractLedger || 0)
      formData.append("Remarks", state.Remarks || "")
      formData.append("AdvPayment", state.AdvPayment || "")
      formData.append("AdvDate", state.AdvDate || "")
      formData.append("BackSellerCNo", state.BackSellerCNo || "")
      formData.append("importDuty", state.importDuty || 0)
      formData.append("tariff", state.tariff || 0)
      formData.append("exchangeRate", state.exchangeRate || 0)
      formData.append("calPerTonDuty", state.calPerTonDuty || 0)
      formData.append("SellerPerson", state.PartyAccountArray1?.[0]?.Person || "")
      formData.append("BuyerPerson", state.PartyAccountArray2?.[0]?.Person || "")
      formData.append("Note5", state.Note5 || "")
      formData.append("Note6", state.Note6 || "")
      formData.append("Note1", state.Note1 || "")
      formData.append("Note2", state.Note2 || "")
      formData.append("Note3", state.Note3 || "")
      formData.append("Note4", state.Note4 || "")
      formData.append("LiftingLedger", state.LiftingLedger || 0)

      // Validate lifting quantity BEFORE saving
      const contractQtyCheck = parseFloat(state.Qty || state.ContractArray?.[0]?.Qty || 0)
      const validLiftingRowsCheck = liftingRows.filter(
        row => row.Date1 || row.LorryNo || row.BNo || row.Lifted || row.Rate1
      )
      const totalLiftingQtyCheck = validLiftingRowsCheck.reduce((sum, row) => {
        return sum + parseFloat(row.Lifted || 0)
      }, 0)
      if (contractQtyCheck > 0 && totalLiftingQtyCheck > contractQtyCheck) {
        setState(prev => ({
          ...prev,
          isProgress: false,
          showLiftingAlert: true,
          liftingAlertMessage: `Lifting quantity (${totalLiftingQtyCheck}) cannot exceed contract quantity (${contractQtyCheck}). Please adjust the lifting quantities.`,
        }))
        return
      }

      const res = await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: state.id || 0, formData } },
        API_URL_SAVE,
        true,
        "NewTender",
        navigate,
        "#"
      )

      console.log("res", res)

      // (Lifting qty already validated above before save)
      const validLiftingRows = liftingRows.filter(
        row => row.Date1 || row.LorryNo || row.BNo || row.Lifted || row.Rate1
      )

      // Save lifting data with the response ID from ContractH in JSON format
      if (validLiftingRows.length > 0) {
        const liftingDataArray = validLiftingRows.map(row => {
          const invoiceRate = parseFloat(state.InvRate || state.Rate || 0)
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

      // Auto-hide success message after 3 seconds and reload page
      setTimeout(() => {
        setState(prev => ({ ...prev, showSuccessMessage: false }))
        onClose();
        // Reload the page after successful save/update
        // window.location.reload()
      }, 1000)
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
            toast.success("Delete success")
            setState(prev => ({ ...prev, id: 0, ContractArray: [] }))
            if (isModal && onClose) onClose()
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

  // Called from Share button click – runs in user gesture so navigator.share() is allowed
  const handleSharePDFClick = async () => {
    if (!pendingShareFile || !navigator.share) return
    try {
      await navigator.share({
        title: 'Contract Report',
        text: 'Please find attached the Contract Report',
        files: [pendingShareFile]
      })
      toastr.success('PDF shared successfully!')
      setShowSharePDFModal(false)
      setPendingShareFile(null)
    } catch (shareError) {
      if (shareError.name === 'AbortError') {
        toastr.info('Share cancelled.')
      } else {
        console.error('Share error:', shareError)
        toastr.error('Share failed. Try again.')
      }
      setShowSharePDFModal(false)
      setPendingShareFile(null)
    }
  }

  // Generate PDF and open Share Modal (or download directly if share unsupported)
  const handlePDFExport = async () => {
    if (state.id || state.ContractArray?.[0]?.Id) {
      const contractId = state.id || state.ContractArray[0].Id
      const contractNo = state.ContractNo || 'Contract'

      try {
        // Show loading message
        toastr.info('Generating PDF... Please wait.')

        // Generate PDF blob
        const pdfBlob = await generateContractPDF(contractId, contractNo)

        const filename = `Contract_${contractNo}_${contractId}.pdf`
        const file = new File([pdfBlob], filename, { type: 'application/pdf' })

        if (navigator.share) {
          setPendingShareFile(file)
          setShowSharePDFModal(true)
        } else {
          // Fallback if no share
          const url = window.URL.createObjectURL(pdfBlob)
          const link = document.createElement('a')
          link.href = url
          link.download = filename
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
          toastr.warning('Share not available on this device. File downloaded instead.')
        }
      } catch (error) {
        console.error('Error generating PDF:', error)
        toastr.error('Error generating PDF. Please try again or use Print button.')
      }
    } else {
      toastr.warning("Please select a contract first")
    }
  }






  const handleExit = () => {
    console.log("Exiting contract form")
    if (isModal && onClose) {
      onClose()
    } else {
      navigate("/dashboard")
    }
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

  // Handle Enter key navigation with conditional logic
  const handleKeyDown = (e, nextRef) => {
    if (e.key === "Enter") {
      e.preventDefault()

      const fieldName = e.target.name

      // Check if shipment month/year is selected
      const isShipmentMonthSelected =
        (state.F_MonthMaster && state.F_MonthMaster !== 0) ||
        (state.F_YearMaster && state.F_YearMaster !== 0)
      // Check if shipment dates are selected - check for both truthy values and non-empty strings
      const areShipmentDatesSelected =
        state.ShipMentFromDate &&
        state.ShipMentToDate &&
        state.ShipMentFromDate !== "" &&
        state.ShipMentToDate !== "" &&
        state.ShipMentFromDate !== null &&
        state.ShipMentToDate !== null
      // Check if lifting dates are selected - check for both truthy values and non-empty strings
      const areLiftingDatesSelected =
        state.LiftedFromDate &&
        state.LiftedToDate &&
        state.LiftedFromDate !== "" &&
        state.LiftedToDate !== "" &&
        state.LiftedFromDate !== null &&
        state.LiftedToDate !== null

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
        console.log(
          "areShipmentDatesSelected:",
          areShipmentDatesSelected,
          "values:",
          state.ShipMentFromDate,
          state.ShipMentToDate
        )
        console.log(
          "areLiftingDatesSelected:",
          areLiftingDatesSelected,
          "values:",
          state.LiftedFromDate,
          state.LiftedToDate
        )

        // Also check the actual DOM values to be sure
        const shipmentFromInput = document.querySelector(
          'input[name="ShipMentFromDate"]'
        )
        const shipmentToInput = document.querySelector(
          'input[name="ShipMentToDate"]'
        )
        const liftingFromInput = document.querySelector(
          'input[name="LiftedFromDate"]'
        )
        const liftingToInput = document.querySelector(
          'input[name="LiftedToDate"]'
        )

        const domShipmentDatesSelected =
          shipmentFromInput &&
          shipmentToInput &&
          shipmentFromInput.value &&
          shipmentToInput.value
        const domLiftingDatesSelected =
          liftingFromInput &&
          liftingToInput &&
          liftingFromInput.value &&
          liftingToInput.value

        console.log(
          "DOM values - shipment:",
          domShipmentDatesSelected,
          "lifting:",
          domLiftingDatesSelected
        )

        // If any of the conditions are met, skip to payment terms
        if (
          isShipmentMonthSelected ||
          areShipmentDatesSelected ||
          areLiftingDatesSelected ||
          domShipmentDatesSelected ||
          domLiftingDatesSelected
        ) {
          console.log("Condition met - skipping to payment terms")
          const paymentTermsInput = document.querySelector(
            'input[name="Remarks"]'
          )
          if (paymentTermsInput) {
            paymentTermsInput.focus()
            return
          }
        } else {
          console.log(
            "No condition met - normal navigation to shipment from date"
          )
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

  // Helper function to get display value for form fields
  const getFieldValue = fieldName => {
    if (fieldName === "ContractNo") {
      // When adding new contract (ContractArray is empty), show ContractNoNew
      // When editing existing contract, show ContractNo
      if (state.ContractArray && state.ContractArray.length > 0) {
        return state.ContractArray[0]?.ContractNo || ""
      } else {
        return state.ContractNo || state.NewArray?.[0]?.ContractNoNew || ""
      }
    }
    return state[fieldName] || ""
  }

  const _selectedContractType = state.TaxAccountArray.find(t => String(t.Id) === String(state.F_ContractLedger)) || null
  const ctIsVessel = _selectedContractType ? !!_selectedContractType.IsVessel : true
  const ctIsShipmentMonth = _selectedContractType ? !!_selectedContractType.IsShipmentMonth : true
  const ctIsShipmentPeriod = _selectedContractType ? !!_selectedContractType.IsShipmentPeriod : true
  const ctIsLiftingPeriod = _selectedContractType ? !!_selectedContractType.IsLiftingPeriod : true

  return (
    <div className={`contract-page ${isModal ? "contract-modal" : ""}`} style={{ backgroundColor: '#fffacd' }}>
      {!isModal && (
        <div
          style={{
            height: "0.1rem",
          }}
        ></div>
      )}
      <div style={{ backgroundColor: '#fffacd', height: "auto", overflow: "visible" }}>
        {/* Success/Error Messages */}
        {state.showSuccessMessage && (
          <Alert color="success" className="mb-2">
            {state.message}
          </Alert>
        )}
        {state.showErrorMessage && (
          <Alert color="danger" className="mb-2">
            {state.message}
          </Alert>
        )}
        {state.showLiftingAlert && (
          <Alert color="warning" className="mb-2">
            <i className="bx bx-error-circle me-2"></i>
            {state.liftingAlertMessage}
          </Alert>
        )}

        <div
          className={`contract-form ${isModal ? "contract-form-modal" : ""}`}
          style={{ backgroundColor: '#fffacd', height: "auto", minHeight: "auto", overflow: "visible" }}
        >
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
            <Row className={`g-1 ${isModal ? "g-0" : ""}`}>
              {/* Merged Contract Details and Conditions Section */}
              <Col xs={12} md={12} lg={isModal ? 8 : 8}>
                <div
                  className={`form-section ${isModal ? "form-section-modal" : ""
                    }`}
                  style={{ backgroundColor: '#fffacd' }}
                >
                  <h6
                    className={`section-title ${isModal ? "section-title-modal" : ""
                      }`}
                    style={{
                      fontSize: isModal ? "0.9rem" : "1rem",
                      fontWeight: "bold",
                    }}
                  >
                    <i className="bx bx-file-doc me-2"></i>
                    Contract Details & Conditions{" "}
                    <span
                      style={{
                        color: state.isEditMode ? "#28a745" : "#007bff",
                        fontSize: isModal ? "0.9rem" : "1rem",
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

                  <Row>
                    {/* Left Side - Contract Details */}
                    <Col xs={12} md={6} className="contract-left-column" style={{ borderRight: "2px solid #dee2e6", paddingRight: "20px" }}>
                      <style>{`
                        @media (max-width: 768px) {
                          .contract-left-column {
                            border-right: none !important;
                            padding-right: 0 !important;
                            margin-bottom: 1rem;
                            padding-bottom: 1rem;
                            border-bottom: 2px solid #dee2e6;
                          }
                        }
                      `}</style>


                      <Row className="g-1">
                        <Col xs={3} sm={6} md={4}>
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
                              onKeyDown={e => handleKeyDown(e, contractNoSelectRef)}
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>



                        <Col xs={3} sm={6} md={4}>
                          <FormGroup className="mb-1">
                            <Label
                              for="ContractNoNew"
                              className="form-label-sm mb-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              Contract No
                            </Label>
                            <input
                              type="text"
                              name="ContractNo"
                              id="ContractNo"
                              value={getFieldValue("ContractNo")}
                              onChange={handleInputChange}
                              className="form-control form-control-sm py-1"
                              placeholder="Enter contract number"
                              ref={contractNoRef}
                              onKeyDown={e => handleKeyDown(e, sellerRef)}
                              readOnly
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={6} sm={6} md={4} className="pe-5 pe-md-0">
                          <FormGroup className="mb-1">
                            <Label
                              for="F_ContractLedger"
                              className="form-label-sm mb-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              Contract Type
                            </Label>
                            <div className="input-group input-group-sm" style={{ flexWrap: "nowrap" }}>
                              <select
                                name="F_ContractLedger"
                                id="F_ContractLedger"
                                value={getFieldValue("F_ContractLedger") || 0}
                                onChange={handleInputChange}
                                className="form-control form-control-sm py-1"
                                ref={contractTypeRef}
                                onKeyDown={e => handleKeyDown(e, shipMonthRef)}
                                disabled={state.isFieldsDisabled}
                              >
                                <option value="">Select Contract Type</option>
                                {state.TaxAccountArray.map(type => (
                                  <option key={type.Id} value={type.Id}>
                                    {type.Name}
                                  </option>
                                ))}
                              </select>
                              <span className="input-group-append">
                                <Button
                                  color="primary"
                                  size="sm"
                                  onClick={toggleContractModal}
                                  disabled={state.isFieldsDisabled}
                                  style={{
                                    height: "18px",
                                    padding: "0 8px",
                                    fontSize: "0.8rem",
                                    borderRadius: "0 4px 4px 0",
                                  }}
                                >
                                  +
                                </Button>
                              </span>
                            </div>
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row className="g-1">
                        <Col xs={6} sm={10} md={7}>
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
                              value={getFieldValue("F_SellerLedger")}
                              onChange={handleInputChange}
                              className="form-control form-control-sm py-1"
                              ref={sellerRef}
                              onKeyDown={e => handleKeyDown(e, buyerRef)}
                              disabled={state.isFieldsDisabled}
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
                              onClick={toggleSellerModal}
                              disabled={state.isFieldsDisabled}
                              style={{
                                width: "74%",
                                height: "18px",
                                padding: "0",
                                fontSize: "0.8rem",
                                lineHeight: "18px",
                              }}
                            >
                              +
                            </Button>
                          </FormGroup>
                        </Col>

                        <Col xs={4} sm={12} md={4}>
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
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row className="g-2">
                        <Col xs={6} sm={10} md={7}>
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
                              onKeyDown={e => handleKeyDown(e, commodityRef)}
                              disabled={state.isFieldsDisabled}
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
                              onClick={toggleSellerModal}
                              disabled={state.isFieldsDisabled}
                              style={{
                                width: "74%",
                                height: "18px",
                                padding: "0",
                                fontSize: "0.8rem",
                                lineHeight: "18px",
                              }}
                            >
                              +
                            </Button>
                          </FormGroup>
                        </Col>

                        <Col xs={4} sm={12} md={4}>
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
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row className="g-2">
                        <Col xs={4} sm={10} md={5}>
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
                              onKeyDown={e => handleKeyDown(e, qtyRef)}
                              disabled={state.isFieldsDisabled}
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
                              onClick={toggleCommodityModal}
                              disabled={state.isFieldsDisabled}
                              style={{
                                width: "74%",
                                height: "18px",
                                padding: "0",
                                fontSize: "0.8rem",
                                lineHeight: "18px",
                              }}
                            >
                              +
                            </Button>
                          </FormGroup>
                        </Col>

                        <Col xs={3} sm={4} md={2}>
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
                              disabled={state.isFieldsDisabled}
                              className="form-control form-control-sm py-1"
                              placeholder="0"
                              ref={qtyRef}
                              onKeyDown={e => handleKeyDown(e, unitRef)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={3} sm={4} md={2}>
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
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>

                        <Col md={3}>
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
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row className="g-2">
                        <Col xs={3} sm={6} md={3}>
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
                              onFocus={e => e.target.select()}
                              onKeyDown={e => handleKeyDown(e, tariffRef)}
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={3} sm={6} md={2}>
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
                              onFocus={e => e.target.select()}
                              onKeyDown={e => handleKeyDown(e, exchangeRateRef)}
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={3} sm={6} md={4}>
                          <FormGroup className="mb-1">
                            <Label
                              for="exchangeRate"
                              className="form-label-sm mb-1"
                              style={{ fontSize: "0.75rem" }}
                            >
                              Ex $ Rate
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
                              onFocus={e => e.target.select()}
                              onKeyDown={e => handleKeyDown(e, calPerTonDutyRef)}
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={3} sm={6} md={3}>
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
                              disabled={state.isFieldsDisabled}
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
                            {(parseFloat(state.Rate || 0) + parseFloat(state.calPerTonDuty || 0)).toFixed(2)}
                          </span>
                        </Label>
                      </FormGroup>
                    </Col>

                    {/* Right Side - Conditions */}
                    <Col xs={12} md={6} className="contract-right-column" style={{ paddingLeft: "20px" }}>
                      <style>{`
                        @media (max-width: 768px) {
                          .contract-right-column {
                            padding-left: 0 !important;
                            margin-top: 1rem;
                          }
                        }
                      `}</style>


                      <Row className="g-1">
                        <Col xs={6} md={2}>
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
                              disabled={!ctIsShipmentMonth || state.isFieldsDisabled}
                              ref={shipMonthRef}
                              onKeyDown={e => handleKeyDown(e, shipYearRef)}
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
                        <Col xs={6} md={3}>
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
                              disabled={!ctIsShipmentMonth || state.isFieldsDisabled}
                              ref={shipYearRef}
                              onKeyDown={e => handleKeyDown(e, vesselRef)}
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
                        <Col xs={6} md={6}>
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
                              disabled={!ctIsVessel || state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={6} md={6}>
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
                              value={getFieldValue("DeliveryPort")}
                              onChange={handleInputChange}
                              className="form-control form-control-sm py-1"
                              placeholder="Enter delivery port"
                              ref={deliveryPortRef}
                              onKeyDown={e => handleKeyDown(e, null)}
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row className="g-2">
                        <Col xs={6} md={6}>
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
                                !ctIsShipmentPeriod ||
                                state.isFieldsDisabled
                              }
                              ref={shipmentFromRef}
                              onKeyDown={e => handleKeyDown(e, null)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={6} md={6}>
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
                                !ctIsShipmentPeriod ||
                                state.isFieldsDisabled
                              }
                              ref={shipmentToRef}
                              onKeyDown={e => handleKeyDown(e, null)}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row className="g-2">
                        <Col xs={6} md={6}>
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
                                !ctIsLiftingPeriod ||
                                state.isFieldsDisabled
                              }
                              ref={liftedFromRef}
                              onKeyDown={e => handleKeyDown(e, null)}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={6} md={6}>
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
                                !ctIsLiftingPeriod ||
                                state.isFieldsDisabled
                              }
                              ref={liftedToRef}
                              onKeyDown={e => handleKeyDown(e, null)}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row className="g-2">
                        <Col xs={4} md={5}>
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
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>
                        <Col xs={4} md={3}>
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
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>

                        <Col xs={4} md={4}>
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
                              disabled={state.isFieldsDisabled}
                            />
                          </FormGroup>
                        </Col>
                      </Row>

                      <Row className="d-none d-md-flex">
                        <Col lg={4}>
                          <Input
                            type="text"
                            value={state.DiffAmt || "0.00"}
                            readOnly
                            className={`form-control-sm ${parseFloat(state.DiffAmt || 0) > 0
                              ? "text-danger fw-bold"
                              : parseFloat(state.DiffAmt || 0) < 0
                                ? "text-success fw-bold"
                                : ""
                              }`}
                          />
                        </Col>
                      </Row>
                    </Col>
                  </Row>

                  {/* Common Notes Section */}
                  <div className="notes-section mt-4" >
                    <h6
                      className="section-subtitle mb-3"
                      style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#495057" }}
                    >
                      <i className="bx bx-note me-2"></i>
                      Notes
                    </h6>
                    <Row>
                      <Col md={12}>
                        <FormGroup>
                          <input
                            type="text"
                            name="Note6"
                            id="notes6"
                            value={state.Note6 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-1"
                            placeholder="Write a Note"
                            disabled={state.isFieldsDisabled}
                            ref={note6Ref}
                            onKeyDown={e => handleKeyDown(e, note1Ref)}
                          />
                          <input
                            type="text"
                            name="notes1"
                            id="notes1"
                            value={state.Note1 || " "}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-1"
                            placeholder="Write a Note"
                            ref={note1Ref}
                            onKeyDown={e => handleKeyDown(e, note2Ref)}
                          />
                          <input
                            type="text"
                            name="notes2"
                            id="notes2"
                            value={state.Note2 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-1"
                            placeholder="Note 2"
                            ref={note2Ref}
                            onKeyDown={e => handleKeyDown(e, note3Ref)}
                          />
                        </FormGroup>

                        <FormGroup>
                          <input
                            type="text"
                            id="notes3"
                            name="notes3"
                            value={state.Note3 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-1"
                            placeholder="Note 3"
                            ref={note3Ref}
                            onKeyDown={e => handleKeyDown(e, note4Ref)}
                          />
                          <input
                            type="text"
                            name="notes4"
                            id="notes4"
                            value={state.Note4 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm mb-1"
                            placeholder="Note 4"
                            ref={note4Ref}
                            onKeyDown={e => handleKeyDown(e, note5Ref)}
                          />
                          <input
                            type="text"
                            name="Note5"
                            id="notes5"
                            value={state.Note5 || ""}
                            onChange={handleInputChange}
                            className="form-control form-control-sm"
                            placeholder="Write a Note"
                            ref={note5Ref}
                            onKeyDown={e => {
                              if (e.key === "Enter") {
                                e.preventDefault()
                                // Transfer focus to Save button
                                if (saveButtonRef.current) {
                                  saveButtonRef.current.focus()
                                }
                              }
                            }}
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>
                </div>
              </Col>

              {/* Right Panel - Lifting Details */}
              <Col xs={12} md={12} lg={isModal ? 4 : 4}>
                <div
                  className={`form-section ${isModal ? "form-section-modal" : ""
                    }`}
                  style={{ backgroundColor: '#fffacd' }}
                >
                  <h6
                    className={`section-title ${isModal ? "section-title-modal" : ""
                      }`}
                    style={{
                      fontSize: isModal ? "0.9rem" : "1rem",
                      fontWeight: "bold",
                    }}
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

                      className="form-control form-control-sm py-1"
                      style={{ width: "200px", maxWidth: "200px", height: "30px", fontWeight: "bold" }}
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
                                      liftingRows && liftingRows.length <= 1
                                    }
                                    title="Remove row"
                                  >
                                    <i className="bx bx-minus"></i>
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-outline-success btn-sm py-1 px-2"
                                    onClick={handleAddLiftingRow}
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

                  {/* Lifting Summary */}
                  <Row className="g-1 mb-2">
                    <Col xs={6} md={6}>
                      <FormGroup>
                        <Label
                          className="form-label-sm text-muted"
                          style={{ fontSize: "0.65rem", fontWeight: "bold" }}
                        >
                          Contract Qty
                        </Label>
                        <div
                          className={`form-control-sm py-1 ${state.totalLiftingQty > state.contractQty
                            ? "bg-warning"
                            : "bg-light"
                            }`}
                        >
                          {state.contractQty || state.Qty || "0.00"}
                        </div>
                      </FormGroup>
                    </Col>
                    <Col xs={6} md={6}>
                      <FormGroup>
                        <Label
                          className="form-label-sm text-muted"
                          style={{ fontSize: "0.65rem", fontWeight: "bold" }}
                        >
                          Total Lifting
                        </Label>
                        <div
                          className={`form-control-sm py-1 ${state.totalLiftingQty > state.contractQty
                            ? "bg-warning"
                            : "bg-light"
                            }`}
                        >
                          {state.totalLiftingQty || "0.00"}
                        </div>
                      </FormGroup>
                    </Col>
                  </Row>

                  <Row className="g-1 mb-2">
                    <Col xs={6} md={6}>
                      <FormGroup>
                        <Label
                          className="form-label-sm text-muted"
                          style={{ fontSize: "0.65rem", fontWeight: "bold" }}
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
                    <Col xs={6} md={6}>
                      <FormGroup>
                        <Label
                          className="form-label-sm text-muted"
                          style={{ fontSize: "0.65rem", fontWeight: "bold" }}
                        >
                          Diff. Amt
                        </Label>
                        <input
                          type="text"
                          name="DiffAmt"
                          value={state.DiffAmt || "0.00"}
                          onChange={handleInputChange}
                          className={`form-control-sm py-1 ${parseFloat(state.DiffAmt || 0) < 0
                            ? "text-success"
                            : parseFloat(state.DiffAmt || 0) > 0
                              ? "text-danger"
                              : ""
                            }`}
                          placeholder="0.00"
                          readOnly
                          disabled={state.isFieldsDisabled}
                        />
                      </FormGroup>
                    </Col>
                  </Row>

                  {/* Back Seller Contract No */}
                  <Row className="g-1 mb-2">
                    <Col md={12}>
                      <FormGroup>
                        <Label
                          for="BackSellerCNo"
                          className="form-label-sm"
                          style={{ fontSize: "0.65rem", fontWeight: "bold" }}
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
                          disabled={state.isFieldsDisabled}
                        />
                      </FormGroup>
                    </Col>
                  </Row>
                </div>
              </Col>

              {/* Right Panel - Lifting Details and Notes */}
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
                      className="btn btn-success btn-sm action-btn"
                      onClick={() => {
                        setState(prev => ({
                          ...prev,
                          isFieldsDisabled: !prev.isFieldsDisabled
                        }))
                      }}
                    >
                      <i className="bx bx-plus"></i>
                      <span className="ms-1">{state.isFieldsDisabled ? "Edit" : "Edit"}</span>
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary btn-sm action-btn"
                      onClick={handleSave}
                      disabled={state.isProgress || state.isFieldsDisabled}
                      ref={saveButtonRef}
                      onKeyDown={e => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          if (window.confirm("Are you sure you want to save?")) {
                            handleSave()
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
                      className="btn btn-danger btn-sm action-btn"
                      onClick={handlePDFExport}
                    >
                      <i className="bx bxs-file-pdf"></i>
                      <span className="d-none d-md-inline ms-1">PDF</span>
                      <span className="d-inline d-md-none ms-1">PDF</span>
                    </button>
                  </div>
                </div>
              </Col>
            </Row>
          </Form>
        </div>
      </div>

      {/* Mobile Floating Action Buttons - Right Side Fixed */}
      <style>{`
        @media (max-width: 767px) {
          .mobile-fab-panel {
            display: flex !important;
            flex-direction: column !important;
            gap: 14px !important;
          }
        }
        @media (min-width: 768px) {
          .mobile-fab-panel { display: none !important; }
        }
      `}</style>
      <div
        className="mobile-fab-panel"
        style={{
          position: 'fixed',
          right: '8px',
          top: '30%',
          transform: 'translateY(-50%)',
          zIndex: 1050,
        }}
      >
        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={() => setState(prev => ({ ...prev, isFieldsDisabled: !prev.isFieldsDisabled }))}
          title="Edit"
          style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
        >
          <i className="bx bx-edit" style={{ fontSize: '1.1rem' }}></i>
        </button>

        <button
          type="button"
          className="btn btn-success btn-sm"
          onClick={handleSave}
          disabled={state.isProgress || state.isFieldsDisabled}
          title="Save / Update"
          style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
        >
          <i className={`bx ${state.isProgress ? 'bx-loader-alt bx-spin' : 'bx-save'}`} style={{ fontSize: '1.1rem' }}></i>
        </button>

        <button
          type="button"
          className="btn btn-info btn-sm"
          onClick={handlePrint}
          title="Print"
          style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
        >
          <i className="bx bx-printer" style={{ fontSize: '1.1rem' }}></i>
        </button>

        <button
          type="button"
          className="btn btn-dark btn-sm"
          onClick={handleExit}
          title="Exit"
          style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
        >
          <i className="bx bx-exit" style={{ fontSize: '1.1rem' }}></i>
        </button>

        <button
          type="button"
          className="btn btn-danger btn-sm"
          onClick={handlePDFExport}
          title="PDF"
          style={{ width: '38px', height: '38px', padding: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}
        >
          <i className="bx bxs-file-pdf" style={{ fontSize: '1.1rem' }}></i>
        </button>
      </div>

      {/* Seller Modal */}
      <Modal isOpen={sellerModal} toggle={toggleSellerModal} size="md" centered>
        <ModalHeader toggle={toggleSellerModal}>
          <h5 className="modal-title">Add New Seller / Buyer</h5>
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
          <Button color="primary" onClick={handleSaveNewParty}>
            Save
          </Button>
        </ModalFooter>
      </Modal>

      {/* Contract Type Modal */}
      <Modal
        isOpen={contractModal}
        toggle={toggleContractModal}
        size="md"
        centered
      >
        <ModalHeader toggle={toggleContractModal}>
          <h5 className="modal-title">Add Contract Type</h5>
        </ModalHeader>
        <ModalBody>
          <FormGroup className="mb-3">
            <Label for="newContractName" className="form-label-sm fw-semibold">
              Contract Type Name <span className="text-danger">*</span>
            </Label>
            <Input
              type="text"
              id="newContractName"
              value={newContractData.Name}
              onChange={e => handleContractModalInputChange("Name", e.target.value)}
              placeholder="Enter contract type name"
              className="form-control-sm"
            />
          </FormGroup>
          <FormGroup className="mb-2">
            <Label className="form-label-sm fw-semibold d-block mb-2">Options</Label>
            <div className="d-flex flex-wrap gap-3">
              {[
                { name: "IsVessel", label: "Vessel" },
                { name: "IsShipmentMonth", label: "Shipment Month" },
                { name: "IsShipmentPeriod", label: "Shipment Period" },
                { name: "IsLiftingPeriod", label: "Lifting Period" },
              ].map(({ name, label }) => (
                <div key={name} className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id={`modal_${name}`}
                    checked={!!newContractData[name]}
                    onChange={() => handleContractModalInputChange(name, !newContractData[name])}
                    style={{ cursor: "pointer", width: "2.5em", height: "1.25em" }}
                  />
                  <label className="form-check-label fw-semibold ms-2" htmlFor={`modal_${name}`}>
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleContractModal}>
            Cancel
          </Button>
          <Button color="primary" onClick={handleSaveNewContract}>
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
          <Button color="primary" onClick={handleSaveNewCommodity}>
            Save
          </Button>
        </ModalFooter>
      </Modal>

      {/* Share PDF Modal */}
      <Modal isOpen={showSharePDFModal} toggle={() => setShowSharePDFModal(false)} className="modal-sm" centered>
        <ModalHeader toggle={() => setShowSharePDFModal(false)} className="bg-primary text-white pb-2 pt-2 border-bottom-0">
          <h5 className="modal-title text-white">Share PDF</h5>
        </ModalHeader>
        <ModalBody className="text-center pt-4 pb-4">
          <div className="mb-3">
            <i className="bx bxs-file-pdf text-danger" style={{ fontSize: "3rem" }}></i>
          </div>
          <h6>Contract PDF Ready</h6>
          <p className="text-muted small mb-0">PDF has been generated successfully.</p>
        </ModalBody>
        <ModalFooter className="border-top-0 d-flex justify-content-center pb-3">
          <Button color="secondary" className="btn-sm px-4" onClick={() => setShowSharePDFModal(false)}>
            Close
          </Button>
          <Button color="primary" className="btn-sm px-4 action-btn" onClick={handleSharePDFClick}>
            <i className="bx bx-share-alt me-1"></i>
            Share File
          </Button>
        </ModalFooter>
      </Modal>

    </div>
  )
}

export default EditContract
