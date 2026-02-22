import React, { useState, useEffect } from "react"
import { Formik, Form, Field, ErrorMessage } from "formik"
import * as Yup from "yup"
import { Col, Row } from "reactstrap"
import {
  Fn_AddEditData,
  Fn_DisplayData,
  Fn_FillListData,
  Fn_GetReport,
} from "../../store/Functions"
import { useDispatch } from "react-redux"
import { API_WEB_URLS } from "../../constants/constAPI"
import { useLocation, useNavigate } from "react-router-dom"

function AddVoucher() {
  const API_URL_SAVE = "InsertVoucher/0/token"
  const API_URL_BALANCE = "GetBalanceUsers/0/token"
  const API_URL = API_WEB_URLS.MASTER + "/0/token/MembersLedger"
  const API_URL2 = API_WEB_URLS.MASTER + "/0/token/LatestRate"
  const API_URL3 = API_WEB_URLS.MASTER + "/0/token/GoldDeals"
  const API_URL_EDIT = API_WEB_URLS.MASTER + "/0/token/Rates/Id"
  const API_URL_SAVE_KREDIT = "InsertVoucher/0/token"
  const API_URL_SAVE_METAL = "DigitalGoldBuy/0/token"
  const API_URL_SAVE_DEAL = "GoldDealL/0/token"

  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    FillArray2: [],
    FillArray3: [],
    FillArray4: [],
    FillArray5: [],
    currentRate: null,
    formData: {
      Amount: "",
      F_LedgerMaster: "",
      VoucherType: "",
      TransactionType: "",
      MetalWeight: "",
    },
    voucherTypes: [
      { Id: 1, Name: "Kredi Coin Transfer" },
      { Id: 2, Name: "Digital Gold" },
      { Id: 3, Name: "Digital Silver" },
      { Id: 4, Name: "Gold Deal Invest" },
    ],
    transactionTypes: [
      { Id: 1, Name: "Buy" },
      { Id: 2, Name: "Sale" },
    ],
  })

  const dispatch = useDispatch()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const Id = (location.state && location.state.Id) || 0
    Fn_FillListData(dispatch, setState, "FillArray", API_URL + "/Id/0")
    if (Id > 0) {
      setState(prevState => ({ ...prevState, id: Id }))
      Fn_DisplayData(dispatch, setState, Id, API_URL_EDIT)
    }
  }, [dispatch, location.state])

  // Validation Schema
  const validationSchema = Yup.object({
    Amount: Yup.number()
      .required("Amount is required")
      .positive("Amount must be positive")
      .test("sufficient-balance", "Insufficient balance", function(value) {
        const { VoucherType, TransactionType } = this.parent;
        if ((VoucherType === "2" || VoucherType === "3") && TransactionType === "1") {
          const coinBalance = state.FillArray5?.[0]?.Balance || 0;
          return value <= coinBalance;
        }
        return true;
      }),
    F_LedgerMaster: Yup.string().required("Selection is required"),
    VoucherType: Yup.string().required("Voucher Type is required"),
    TransactionType: Yup.string().when("VoucherType", {
      is: val => val == "2" || val == "3",
      then: () => Yup.string().required("Transaction Type is required"),
      otherwise: () => Yup.string(),
    }),
    MetalWeight: Yup.number().when(["VoucherType", "TransactionType"], {
      is: (vType, tType) => (vType === "2" || vType === "3") && tType === "2",
      then: () => Yup.number()
        .required("Metal Weight is required")
        .positive("Metal Weight must be positive")
        .test("sufficient-metal", "Insufficient metal balance", function(value) {
          const metalBalance = state.FillArray4?.[0]?.Balance || 0;
          return value <= metalBalance;
        }),
      otherwise: () => Yup.number()
    }),
  })

  const handleSubmit = async values => {
    const obj = JSON.parse(localStorage.getItem("authUser"))
    let formData = new FormData()
    let API_URL_SAVE
    let Member = state.FillArray.find(
      item => item.Id.toString() == values.F_LedgerMaster
    )
    // Common fields for all types
    formData.append("F_LedgerMaster", values.F_LedgerMaster)
    formData.append("F_MemberMaster", Member.F_MemberMaster)
    formData.append("IsAdmin", true)
    formData.append("UserId", obj.uid)

    switch (values.VoucherType) {
      case "1": // Kredi Coin Transfer
        API_URL_SAVE = API_URL_SAVE_KREDIT
        formData.append("Amount", values.Amount)
        formData.append("VoucherType", values.VoucherType)
        break

      case "2": // Digital Gold
      case "3": // Digital Silver
        API_URL_SAVE = API_URL_SAVE_METAL
        formData.append("F_RateL", state.FillArray2[0].Id)
        formData.append("Amount", values.Amount)

        formData.append("GoldAmount", values.MetalWeight)
        formData.append("OrderType", values.TransactionType)
        formData.append("MetalType", values.VoucherType === "2" ? "1" : "2") // 1 for Gold, 2 for Silver
        formData.append("Rate", state.currentRate?.Rate || 0)
        break

      case "4": // Gold Deal Invest
        API_URL_SAVE = API_URL_SAVE_DEAL
        const selectedDeal = state.FillArray3.find(
          deal => deal.Id.toString() === values.F_GoldDeal
        )
        formData.append("F_GoldDeal", values.F_GoldDeal)
        formData.append("F_UserMaster", Member.F_UserMaster)
        formData.append("InvestedAmount", selectedDeal?.DealAmount || 0)
        break

      default:
        console.error("Invalid Voucher Type")
        return
    }

    return Fn_AddEditData(
      dispatch,
      setState,
      { arguList: { id: state.id, formData } },
      API_URL_SAVE,
      true,
      "memberid",
      navigate,
      "#"
    );
  }

  return (
    <div className="page-content">
      <Formik
        initialValues={{
          Amount: state.formData.Amount || "",
          F_LedgerMaster: state.formData.F_LedgerMaster || "",
          VoucherType: state.formData.VoucherType || "",
          TransactionType: state.formData.TransactionType || "",
          MetalWeight: state.formData.MetalWeight || "",
        }}
        enableReinitialize={true}
        validationSchema={validationSchema}
        onSubmit={handleSubmit}
      >
        {({ values, setFieldValue }) => {
          const handleChange = async e => {
            const { name, value } = e.target

            if (name === "MetalWeight" || name === "Amount") {
              // Get current balances
              const coinBalance = state.FillArray5?.[0]?.Balance || 0;
              const metalBalance = state.FillArray4?.[0]?.Balance || 0;
              
              if (values.VoucherType === "2" || values.VoucherType === "3") {
                if (values.TransactionType === "1") { // Buy
                  const amount = name === "Amount" ? parseFloat(value) : parseFloat(value) * state.currentRate?.Rate;
                  if (amount > coinBalance) {
                    alert("Insufficient Kredi Coin balance for this purchase");
                    return;
                  }
                } else if (values.TransactionType === "2") { // Sale
                  const weight = name === "MetalWeight" ? parseFloat(value) : parseFloat(value) / state.currentRate?.Rate;
                  if (weight > metalBalance) {
                    alert(`Insufficient ${values.VoucherType === "2" ? "Gold" : "Silver"} balance for this sale`);
                    return;
                  }
                }
              }
            }

            setFieldValue(name, value)

            if (name === "VoucherType") {
              setFieldValue("TransactionType", "")
              setFieldValue("F_LedgerMaster", "")
              setFieldValue("Amount", "")
              setFieldValue("MetalWeight", "")

              if (value === "2" || value === "3") {
                const metalType = value === "2" ? "1" : "2"
             
                const res = await Fn_FillListData(
                  dispatch,
                  setState,
                  "FillArray2",
                  API_URL2 + "/Id/" + metalType
                )
                if (res && res.length > 0) {
                  setState(prev => ({
                    ...prev,
                    currentRate: res[0],
                  }))
                }
              }
              if (value === "4") {
                const res = await Fn_FillListData(
                  dispatch,
                  setState,
                  "FillArray3",
                  API_URL3 + "/Id/0"
                )
                setFieldValue("Amount", "") // Reset amount when changing to Gold Deal
              }
            }

            if (name === "Amount" && state.currentRate) {
              const amount = parseFloat(value) || 0
              const metalWeight = amount / state.currentRate.Rate
              setFieldValue("MetalWeight", metalWeight.toFixed(3))
            }

            if (name === "MetalWeight" && state.currentRate) {
              const weight = parseFloat(value) || 0
              const amount = weight * state.currentRate.Rate
              setFieldValue("Amount", amount.toFixed(2))
            }

            if (name === "TransactionType") {
              setFieldValue("Amount", "")
              setFieldValue("MetalWeight", "")
            }
            if(name=="F_LedgerMaster"){
              const vformData = new FormData()
              vformData.append("Id", value)

              // Determine the IsGold parameter based on the current VoucherType
              let isGoldParam = "0" // Default for Kredi Coin or Gold Deal (adjust if needed)
              if (values.VoucherType === "2") { // Digital Gold
                isGoldParam = "1"
              } else if (values.VoucherType === "3") { // Digital Silver
                isGoldParam = "2"
              }
              // If VoucherType is 1 or 4, isGoldParam remains "0"

              vformData.append("IsGold", isGoldParam)

              Fn_GetReport(
                dispatch,
                setState,
                "FillArray4",
                API_URL_BALANCE,
                { arguList: { id: 0, formData: vformData } },
                true
              )

              const vformData1 = new FormData()
              vformData1.append("Id", value)


              Fn_GetReport(
                dispatch,
                setState,
                "FillArray5",
                API_URL_BALANCE,
                { arguList: { id: 0, formData: vformData1 } },
                true
              )
            }
          }

          return (
            <Form className="form-horizontal">
              <Row>
                <Col lg="2">
                  <label htmlFor="VoucherType" className="form-label">
                    Voucher Type
                  </label>
                </Col>
                <Col lg="6" className="mb-3">
                  <Field
                    as="select"
                    className="form-control"
                    name="VoucherType"
                    onChange={handleChange}
                  >
                    <option value="">Select Voucher Type</option>
                    {state.voucherTypes.map(type => (
                      <option key={type.Id} value={type.Id}>
                        {type.Name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="VoucherType"
                    component="div"
                    className="text-danger"
                  />
                </Col>
              </Row>

              {/* Show Transaction Type only for Digital Gold and Silver */}
              {(values.VoucherType === "2" || values.VoucherType === "3") && (
                <Row>
                  <Col lg="2">
                    <label htmlFor="TransactionType" className="form-label">
                      Transaction Type
                    </label>
                  </Col>
                  <Col lg="6" className="mb-3">
                    <Field
                      as="select"
                      className="form-control"
                      name="TransactionType"
                      onChange={handleChange}
                    >
                      <option value="">Select Transaction Type</option>
                      {state.transactionTypes.map(type => (
                        <option key={type.Id} value={type.Id}>
                          {type.Name}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage
                      name="TransactionType"
                      component="div"
                      className="text-danger"
                    />
                  </Col>
                </Row>
              )}

              {/* Show Current Rate if available */}
              {(values.VoucherType === "2" || values.VoucherType === "3") &&
                state.currentRate && (
                  <Row className="mb-3">
                    <Col lg="2">
                      <label className="form-label">Current Rate</label>
                    </Col>
                    <Col lg="6">
                      <div className="form-control bg-light">
                        {state.currentRate.MetalName}: ₹
                        {state.currentRate.Rate.toFixed(2)} per{" "}
                        {state.currentRate.UnitName}
                        <small className="d-block text-muted">
                          Last Updated:{" "}
                          {new Date(
                            state.currentRate.DateOfCreation
                          ).toLocaleString()}
                        </small>
                      </div>
                    </Col>
                  </Row>
                )}
              <Row>
                <Col lg="2">
                  <label htmlFor="F_LedgerMaster" className="form-label">
                    Select Member
                  </label>
                </Col>
                <Col lg="6" className="mb-3">
                  <Field
                    as="select"
                    className="form-control"
                    name="F_LedgerMaster"
                    onChange={handleChange}
                  >
                    <option value="">Select an option</option>
                    {state.FillArray.map(item => (
                      <option key={item.Id} value={item.Id}>
                        {item.Name}
                      </option>
                    ))}
                  </Field>
                  <ErrorMessage
                    name="F_LedgerMaster"
                    component="div"
                    className="text-danger"
                  />
                </Col>
              </Row>
              {/* Show Metal Weight field for Digital Gold and Silver */}
              {(values.VoucherType === "2" || values.VoucherType === "3") && (
                <Row>
                  <Col lg="2">
                    <label htmlFor="MetalWeight" className="form-label">
                      Metal Weight ({state.currentRate?.UnitName})
                    </label>
                  </Col>
                  <Col lg="6" className="mb-3">
                    <Field
                      className="form-control"
                      type="number"
                      name="MetalWeight"
                      placeholder={`Enter Weight in ${state.currentRate?.UnitName}`}
                      onChange={handleChange}
                      step="0.001"
                   
                    />
                    <ErrorMessage
                      name="MetalWeight"
                      component="div"
                      className="text-danger"
                    />
                  </Col>
                </Row>
              )}

              {/* Show Gold Deals dropdown for Gold Deal Invest */}
              {values.VoucherType === "4" && (
                <>
                  <Row>
                    <Col lg="2">
                      <label htmlFor="F_GoldDeal" className="form-label">
                        Select Gold Deal
                      </label>
                    </Col>
                    <Col lg="6" className="mb-3">
                      <Field
                        as="select"
                        className="form-control"
                        name="F_GoldDeal"
                        onChange={e => {
                          handleChange(e)
                          // Auto-fill amount when gold deal is selected
                          const selectedDeal = state.FillArray3.find(
                            deal => deal.Id.toString() === e.target.value
                          )
                          if (selectedDeal) {
                            setFieldValue("Amount", selectedDeal.DealAmount)
                          }
                        }}
                      >
                        <option value="">Select Gold Deal</option>
                        {state.FillArray3.map(deal => (
                          <option key={deal.Id} value={deal.Id}>
                            {deal.GoldTitle}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage
                        name="F_GoldDeal"
                        component="div"
                        className="text-danger"
                      />
                    </Col>
                  </Row>

                  {/* Show selected deal details */}
                  {values.F_GoldDeal && (
                    <Row className="mb-3">
                      <Col lg="2">
                        <label className="form-label">Deal Details</label>
                      </Col>
                      <Col lg="6">
                        {(() => {
                          const selectedDeal = state.FillArray3.find(
                            deal => deal.Id.toString() === values.F_GoldDeal
                          )
                          return selectedDeal ? (
                            <div className="form-control bg-light">
                              <div className="mb-1">
                                <strong>{selectedDeal.GoldTitle}</strong>
                              </div>
                              <div className="text-muted">
                                <div>
                                  Return: {selectedDeal.ReturnPercentage}%
                                </div>
                                <div>
                                  Deal Amount: ₹
                                  {selectedDeal.DealAmount.toFixed(2)}
                                </div>
                                {selectedDeal.Description && (
                                  <div>
                                    Description: {selectedDeal.Description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ) : null
                        })()}
                      </Col>
                    </Row>
                  )}
                </>
              )}

              {/* Amount field - disabled for Gold Deal Invest */}
              <Row>
                <Col lg="2">
                  <label htmlFor="Amount" className="form-label">
                    Amount
                  </label>
                </Col>
                <Col lg="6" className="mb-3">
                  <Field
                    className="form-control"
                    type="number"
                    name="Amount"
                    placeholder="Enter Amount"
                    onChange={handleChange}
                    disabled={
                      values.VoucherType === "4" 
                    }
                  />
                  <ErrorMessage
                    name="Amount"
                    component="div"
                    className="text-danger"
                  />
                </Col>
              </Row>

              {/* First, add balance display after member selection */}
              {values.F_LedgerMaster && (
                <Row className="mb-3">
                  <Col lg="2">
                    <label className="form-label">Available Balance</label>
                  </Col>
                  <Col lg="6">
                    <div className="form-control bg-light">
                      <div>
                        Kredi Coins: ₹{state.FillArray5?.[0]?.Balance?.toFixed(2) || "0.00"}
                      </div>
                      {(values.VoucherType === "2" || values.VoucherType === "3") && (
                        <div>
                          {values.VoucherType === "2" ? "Gold" : "Silver"} Balance: {state.FillArray4?.[0]?.Balance?.toFixed(3) || "0.000"} {state.currentRate?.UnitName}
                        </div>
                      )}
                    </div>
                  </Col>
                </Row>
              )}

              {/* Submit Button */}
              <button type="submit" className="btn btn-primary btn-block">
                Submit
              </button>
            </Form>
          )
        }}
      </Formik>
    </div>
  )
}

export default AddVoucher
