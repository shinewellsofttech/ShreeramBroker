
import React, { useState, useEffect } from "react"
import ShreeRamImage from '../../components/Common/ShreeRamImage'
import { useLocation, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { Fn_FillListData } from "store/Functions"
import { API_WEB_URLS, getCompanyName, getCompanyAddress, getCompanyPanNo, getCompanyGstNo } from "constants/constAPI"
import "./ContractPrint2.scss"

const ContractPrint2 = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [contractData, setContractData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Get contract ID from URL params or location state
  const getContractId = () => {
    const urlParams = new URLSearchParams(location.search)
    return urlParams.get('id') || location.state?.contractId
  }

  useEffect(() => {
    const loadContractData = async () => {
      try {
        const contractId = getContractId()
        if (!contractId) {
          setError("No contract ID provided")
          setLoading(false)
          return
        }

        // Load contract data first
        await Fn_FillListData(
          dispatch,
          setContractData,
          "ContractArray",
          `${API_WEB_URLS.MASTER}/0/token/ContractReportt/Id/${contractId}`
        )

        setLoading(false)
      } catch (err) {
        console.error("Error loading contract data:", err)
        setError("Failed to load contract data")
        setLoading(false)
      }
    }

    loadContractData()
  }, [dispatch])

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    window.close()
  }

  if (loading) {
    return (
      <div className="contract-print-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-2">Loading contract data...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="contract-print-error">
        <div className="alert alert-danger">
          <i className="bx bx-error-circle me-2"></i>
          {error}
        </div>
        <button className="btn btn-primary" onClick={handleBack}>
          <i className="bx bx-arrow-back me-2"></i>
          Go Back
        </button>
      </div>
    )
  }

  // Get contract data
  const contract = contractData?.ContractArray?.[0] || {}

  // Debug logging
  console.log("Contract Data:", contractData)
  console.log("Contract:", contract)

  // Format date for display
  const formatDisplayDate = (dateString) => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString('en-GB') // DD/MM/YYYY format
  }

  return (
    <div>
      {/* Print Header - Fixed position */}
      <div className="print-header" style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 1000 }}>
        <div className="btn-group">
          <button className="btn btn-primary" onClick={handlePrint}>
            <i className="bx bx-printer me-2"></i>
            Print
          </button>
          <button className="btn btn-secondary" onClick={handleBack}>
            <i className="bx bx-times me-2"></i>
            Close
          </button>
        </div>
      </div>

      {/* Contract Document - Main content for printing */}


      <div >


        <div className="contract-print-container">
          <div className="contract-document" >
            <div className="contract-header">
              {/* Top Section - Shree and Jurisdiction */}
              <div className="header-top-section">
                <div className="shree-text">
                  !! Shree !!
                </div>
                <div className="jurisdiction-text">
                  Subject to Jodhpur Jurisdiction
                </div>
              </div>

              {/* Middle Section - Logo, Company Name and Details */}
              <div className="header-middle-section">
                <div className="logo-section">
                  <ShreeRamImage
                    alt="ShreeRam Logo"
                    portraitStyle={{ width: '70px', height: '70px', objectFit: 'cover' }}
                    landscapeStyle={{ width: '210px', height: '70px', objectFit: 'contain' }}
                  />
                </div>

                <div className="company-details">
                  <h1 className="company-name">
                    {getCompanyName().toUpperCase()}
                  </h1>
                  <div className="company-role">
                    Convencing Agent: DOC, Edible Oil, Imported Oil & Oil Cake
                  </div>
                  <div className="company-address">
                    {getCompanyAddress()}
                  </div>
                </div>

                <div className="empty-space"></div>
              </div>

              {/* Bottom Section - PAN and GSTIN in opposite corners */}
              <div className="header-bottom-section">
                <div className="pan-section">
                  <div className="pan-text">
                    PAN: {getCompanyPanNo()}
                  </div>
                </div>
                <div className="gstin-section">
                  <div className="gstin-text">
                    GSTIN: {getCompanyGstNo()}
                  </div>
                </div>
              </div>

              {/* Blue separator line */}
              <div className="blue-separator" style={{ height: "2px", backgroundColor: "#0000ff", marginBottom: "0px", width: "100%" }}></div>
            </div>

            {/* Main Content */}
            <div className="contract-main-content">
              <div className="parties-section">
                <div className="left-column">
                  <div className="contract-number" style={{ fontSize: "16px", fontWeight: "bold", color: "#000", marginBottom: "2px" }}>
                    P.O No : {contract.ContractNo}
                  </div>

                  <div className="seller-info">
                    <div className="party-name">
                      Seller: {contract.Seller}
                    </div>
                    <div className="party-address">
                      {contract.SellerAddress}
                    </div>
                  </div>
                  <div className="buyer-info">
                    <div className="party-name">
                      Buyer: {contract.Buyer}
                    </div>
                    <div className="party-address">
                      {contract.BuyerAddress}
                    </div>
                  </div>
                </div>
                <div className="right-column">
                  <div className="contact-person-info">
                    <div className="contract-date">
                      Date: {formatDisplayDate(contract.Date)}
                    </div>
                    <div className="person-name">
                      {contract.SellerPerson}
                    </div>
                    <div className="person-gstin">
                      GSTIN: {contract.SellerGST}
                    </div>
                    <div className="person-name">
                      {contract.BuyerPerson}
                    </div>
                    <div className="person-gstin">
                      GSTIN: {contract.BuyerGST}
                    </div>
                  </div>
                </div>
              </div>

              {/* Central Table */}
              <div className="central-table">
                {/* <div className="table-header">
                <div className="left-header">
                  AS PER DISCUSSION
                </div>
                <div className="right-header">
                {contract.Contract}
                </div>
              </div> */}
                <div className="table-content">
                  <div className="left-subtable">
                    <div className="table-row">
                      <div className="label">
                        Contract Type
                      </div>
                      <div className="value">{contract.Contract}</div>
                    </div>
                    <div className="table-row">
                      <div className="label">
                        COMMODITY
                      </div>
                      <div className="value">{contract.Item}</div>
                    </div>
                    <div className="table-row">
                      <div className="label">
                        RATE PER TONS
                      </div>
                      <div className="value">{contract.Rate}</div>
                    </div>
                    <div className="table-row">
                      <div className="label">
                        QUANTITY (2% +/-)
                      </div>
                      <div className="value">{contract.Qty} Ton</div>
                    </div>
                    <div className="table-row">
                      <div className="label">
                        LIFTING PERIOD
                      </div>
                      <div className="value">
                        {contract.LiftedFromDate && contract.LiftedToDate
                          ? `${formatDisplayDate(contract.LiftedFromDate)} - ${formatDisplayDate(contract.LiftedToDate)}`
                          : ""}
                      </div>
                    </div>
                    {(contract.importDuty > 0 || contract.exchangeRate > 0 || contract.tariff > 0 || contract.calPerTonDuty > 0) && (
                      <div className="table-row" style={{ padding: '2px 6px', fontSize: '0.75em', lineHeight: '1.5', fontWeight: 'bold' }}>
                        {contract.importDuty > 0 && <span style={{ marginRight: '16px' }}>Imp.Duty: {contract.importDuty}%</span>}
                        {contract.exchangeRate > 0 && <span style={{ marginRight: '16px' }}>Ex.Rate: {contract.exchangeRate}</span>}
                        {contract.tariff > 0 && <span style={{ marginRight: '16px' }}>Tariff: {contract.tariff}</span>}
                        {contract.calPerTonDuty > 0 && <span>Duty/Ton: {contract.calPerTonDuty}</span>}
                      </div>
                    )}
                  </div>
                  <div className="right-subtable">
                    <div className="table-row">
                      <div className="label">
                        Delivery Port/Place
                      </div>
                      <div className="value">{contract.DeliveryPort}</div>
                    </div>
                    <div className="table-row">
                      <div className="label">
                        {contract.ShipMentFromDate && contract.ShipMentToDate ? "SHIPMENT PERIOD" : "SHIPMENT MONTH"}
                      </div>
                      <div className="value">
                        {contract.Month ? (
                          <>
                            {contract.Month} {contract.Year ? ` (${contract.Year})` : ""}
                            {contract.ShipMentFromDate && contract.ShipMentToDate && (
                              <>
                                <br />
                                {`${formatDisplayDate(contract.ShipMentFromDate)} - ${formatDisplayDate(contract.ShipMentToDate)}`}
                              </>
                            )}
                          </>
                        ) : contract.ShipMentFromDate && contract.ShipMentToDate ? (
                          `${formatDisplayDate(contract.ShipMentFromDate)} - ${formatDisplayDate(contract.ShipMentToDate)}`
                        ) : (
                          ""
                        )}
                      </div>
                    </div>
                    <div className="table-row">
                      <div className="label">
                        VESSEL NAME
                      </div>
                      <div className="value">{contract.Vessel}</div>
                    </div>
                    <div className="table-row">
                      <div className="label">
                        PAYMENT TERMS
                      </div>
                      <div className="value">{contract.Remarks}</div>
                    </div>
                    <div className="table-row">
                      <div className="bottom-table">
                        <div className="bottom-table-header">
                          <div className="bottom-header-cell">ADV DEPO</div>
                          <div className="bottom-header-cell">DEPO.DATE</div>
                          <div className="bottom-header-cell">NOMI DATE</div>
                          <div className="bottom-header-cell">RATE</div>
                        </div>
                        <div className="bottom-table-row">
                          <div className="bottom-data-cell">{contract.AdvPayment || ""}</div>
                          <div className="bottom-data-cell">{formatDisplayDate(contract.AdvDate) || ""}</div>
                          <div className="bottom-data-cell"></div>
                          <div className="bottom-data-cell">{contract.InvRate || contract.Rate}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Table */}

              </div>

              {/* Other Terms */}
              {(() => {
                const hasNotes = contract.Note1 || contract.Note2 || contract.Note3 || contract.Note4 || contract.Note5 || contract.Note6;

                if (!hasNotes) return null;

                return (
                  <div className="other-terms" style={{ marginBottom: "8px", display: "flex", alignItems: "flex-start" }}>
                    <span style={{ fontSize: "15px", fontWeight: "bold", color: "#000", textDecoration: "underline", marginRight: "5px", whiteSpace: "nowrap" }}>
                      Note:
                    </span>
                    <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #000" }}>
                      <tbody>
                        {contract.Note6 && (
                          <tr style={{ border: "1px solid #000" }}>
                            <td style={{ fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000" }}>
                              {contract.Note6}
                            </td>
                          </tr>
                        )}
                        {contract.Note1 && (
                          <tr style={{ border: "1px solid #000" }}>
                            <td style={{ fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000" }}>
                              {contract.Note1}
                            </td>
                          </tr>
                        )}
                        {contract.Note2 && (
                          <tr style={{ border: "1px solid #000" }}>
                            <td style={{ fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000" }}>
                              {contract.Note2}
                            </td>
                          </tr>
                        )}
                        {contract.Note3 && (
                          <tr style={{ border: "1px solid #000" }}>
                            <td style={{ fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000" }}>
                              {contract.Note3}
                            </td>
                          </tr>
                        )}
                        {contract.Note4 && (
                          <tr style={{ border: "1px solid #000" }}>
                            <td style={{ fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000" }}>
                              {contract.Note4}
                            </td>
                          </tr>
                        )}
                        {contract.Note5 && (
                          <tr style={{ border: "1px solid #000" }}>
                            <td style={{ fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000" }}>
                              {contract.Note5}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                );
              })()}

              {/* Blue separator between sections */}
              <div style={{ height: "2px", backgroundColor: "#0000ff", marginBottom: "8px", width: "100%" }}></div>

              {/* Terms & Conditions */}
              <div className="terms-conditions" style={{ marginBottom: "8px" }}>
                <div className="terms-header-section" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <h4 className="terms-title" style={{ fontSize: "15px", fontWeight: "bold", color: "#000", margin: "0", textDecoration: "underline" }}>
                    TERMS & CONDITIONS
                  </h4>
                  <div className="regards-text" style={{ fontSize: "12px", color: "#000", fontWeight: "bold", fontStyle: "italic" }}>
                    Thanking with Regards
                  </div>
                </div>
                <div className="terms-list">
                  <div className="term-item" style={{ marginBottom: "6px", lineHeight: "1.3" }}>
                    <span className="term-number" style={{ fontSize: "12px", fontWeight: "bold", color: "#000", display: "block", marginBottom: "2px" }}>
                      1. SAMPLING AND QUALITY:
                    </span>
                    <span className="term-description" style={{ fontSize: "12px", color: "#000", lineHeight: "1.3", fontWeight: "bold" }}>
                      Buyer may appoint their surveyor to draw samples from the tank/s alloted by the seller to lift the material and buyer should start lifting only after satisfaction with quality specifications. The seller will not be responsible for any quality rebate after the tanker leaves from the installation.'/During the loading of tankar, sample draw & seal should be in front of drivers.
                    </span>
                  </div>
                  <div className="term-item" style={{ marginBottom: "6px", lineHeight: "1.3" }}>
                    <span className="term-number" style={{ fontSize: "12px", fontWeight: "bold", color: "#000", display: "block", marginBottom: "2px" }}>
                      2. INFORMATION FLOW:
                    </span>
                    <span className="term-description" style={{ fontSize: "12px", color: "#000", lineHeight: "1.3", fontWeight: "bold" }}>
                      The Seller shall give all information to us from time to time regarding readiness, deliveries and dispatches of goods under this contract. The Buyer shall also intimate to us from time to time regarding their lifting/deliveries and payments.
                    </span>
                  </div>
                  <div className="term-item" style={{ marginBottom: "6px", lineHeight: "1.3" }}>
                    <span className="term-number" style={{ fontSize: "12px", fontWeight: "bold", color: "#000", display: "block", marginBottom: "2px" }}>
                      3. ARBITRATIONS:
                    </span>
                    <span className="term-description" style={{ fontSize: "12px", color: "#000", lineHeight: "1.3", fontWeight: "bold" }}>
                      In case any dispute, arbitration will be the last resort if both parties are not able to settle the same mutually.
                    </span>
                  </div>
                  <div className="term-item" style={{ marginBottom: "6px", lineHeight: "1.3" }}>
                    <span className="term-number" style={{ fontSize: "12px", fontWeight: "bold", color: "#000", display: "block", marginBottom: "2px" }}>
                      4. BROKERAGE:
                    </span>
                    <span className="term-description" style={{ fontSize: "12px", color: "#000", lineHeight: "1.3", fontWeight: "bold" }}>
                      Brokerage : Rs 75 /- MT (PLUS APPLICABLE GST)
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="contract-footer">
              <div className="footer-right">
                <div className="for-company">
                  For:{" "}
                  <strong className="company-name-bold">
                    {getCompanyName().toUpperCase()}
                  </strong>
                </div>
                <div className="authorised-signatory">
                  Authorised Signatory
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>

    </div>
  )
}

export default ContractPrint2
