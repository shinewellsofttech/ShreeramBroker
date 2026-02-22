import React, { useState, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useDispatch } from "react-redux"
import { Fn_FillListData, Fn_GetReport } from "store/Functions"
import { API_WEB_URLS, getCompanyName, getCompanyAddress, getCompanyPanNo, getCompanyGstNo } from "constants/constAPI"
import { toast } from "react-toastify"
import { Download, FileText } from "react-feather"
import ExcelJS from 'exceljs'
import "./ContractPrint.scss"

const ContractPrint = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [contractData, setContractData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const API_URL_Get = `${API_WEB_URLS.ContractMultiPrint}/0/token`

  // Get contract ID from URL params or location state
  const getContractId = () => {
    const urlParams = new URLSearchParams(location.search)
    return urlParams.get("id") || location.state?.contractId
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

        let vformData = new FormData()
        vformData.append("Id", contractId) // Pass multiple ids in CSV format
        const result = await Fn_GetReport(
          dispatch,
          setContractData,
          "tenderData", // make sure backend response fills ContractArray
          API_URL_Get,
          { arguList: { id: 0, formData: vformData } },
          true
        )
        console.log("result--------->", result)
        
        // Fn_GetReport with "tenderData" sets state directly to responseData
        // But we need to ensure it's in the right format
        // If result is available and different from what was set, update it
        if (result) {
          // If result is an array, wrap it in ContractArray
          if (Array.isArray(result)) {
            setContractData({ ContractArray: result })
          } 
          // If result already has ContractArray, it's already set correctly
          // Otherwise, result might be the contract data directly
        }
        
        setLoading(false)
      } catch (err) {
        console.error("Error loading contract data:", err)
        setError("Failed to load contract data")
        setLoading(false)
      }
    }

    loadContractData()
  }, [dispatch])

  // Debug: Log contractData whenever it changes
  useEffect(() => {
    console.log("contractData state changed:", contractData)
    if (contractData) {
      console.log("contractData type:", typeof contractData)
      console.log("Is Array:", Array.isArray(contractData))
      console.log("Has ContractArray:", contractData.ContractArray)
      console.log("Keys:", Object.keys(contractData))
    }
  }, [contractData])

  const handlePrint = () => {
    window.print()
  }

  const handleBack = () => {
    window.close()
  }

  // Helper function to share file
  const shareFile = async (blob, filename, fileType) => {
    const file = new File([blob], filename, { type: fileType })
    
    if (navigator.share) {
      try {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: filename,
            text: `Please find attached ${filename}`,
            files: [file]
          })
          toast.success('File shared successfully!')
          return true
        }
      } catch (shareError) {
        if (shareError.name !== 'AbortError') {
          console.error('Share error:', shareError)
        }
      }
    }
    return false
  }

  // Helper function to download file
  const downloadFile = (blob, filename) => {
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  // PDF Export with Share
  const handlePDFExport = async () => {
    if (!contractArray || contractArray.length === 0) {
      toast.warning("No contract data to export")
      return
    }

    try {
      const html2pdf = (await import('html2pdf.js')).default
      const element = document.querySelector('.contract-print-container')
      
      if (!element) {
        toast.error("Contract content not found")
        return
      }

      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Contract_${contractArray[0]?.ContractNo || 'Print'}_${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      }

      const pdfBlob = await html2pdf().set(opt).from(element).outputPdf('blob')
      
      const shared = await shareFile(pdfBlob, opt.filename, 'application/pdf')
      if (!shared) {
        downloadFile(pdfBlob, opt.filename)
        toast.success('PDF generated and downloaded successfully!')
      }
    } catch (error) {
      console.error('PDF generation error:', error)
      toast.error('Error generating PDF. Please try again.')
    }
  }

  // Excel Export with Share
  const handleExcelExport = async () => {
    if (!contractArray || contractArray.length === 0) {
      toast.warning("No contract data to export")
      return
    }

    try {
      const workbook = new ExcelJS.Workbook()
      const worksheet = workbook.addWorksheet('Contract Print')

      worksheet.columns = [
        { header: 'Contract No', key: 'contractNo', width: 15 },
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Seller', key: 'seller', width: 30 },
        { header: 'Buyer', key: 'buyer', width: 30 },
        { header: 'Item', key: 'item', width: 20 },
        { header: 'Qty', key: 'qty', width: 12 },
        { header: 'Rate', key: 'rate', width: 12 },
        { header: 'Vessel', key: 'vessel', width: 15 }
      ]

      const headerRow = worksheet.getRow(1)
      headerRow.font = { bold: true, color: { argb: 'FFFFFF' } }
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: '28a745' }
      }
      headerRow.alignment = { horizontal: 'center', vertical: 'middle' }
      headerRow.height = 25

      contractArray.forEach((contract) => {
        const dataRow = worksheet.addRow({
          contractNo: contract.ContractNo || '-',
          date: contract.Date ? new Date(contract.Date).toLocaleDateString('en-GB') : '-',
          seller: contract.Seller || '-',
          buyer: contract.Buyer || '-',
          item: contract.Item || '-',
          qty: contract.Qty || '0',
          rate: contract.Rate || '0',
          vessel: contract.Vessel || '-'
        })
      })

      const buffer = await workbook.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const filename = `Contract_${contractArray[0]?.ContractNo || 'Print'}_${new Date().toISOString().split('T')[0]}.xlsx`

      const shared = await shareFile(blob, filename, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      if (!shared) {
        downloadFile(blob, filename)
        toast.success(`Excel file downloaded: ${filename}`)
      }
    } catch (error) {
      console.error('Excel export error:', error)
      toast.error('Error exporting to Excel. Please try again.')
    }
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

  // Get contract data - handle both single and multiple contracts
  // Handle different response structures
  let contracts = []
  
  if (contractData) {
    if (Array.isArray(contractData)) {
      // If contractData is directly an array
      contracts = contractData
    } else if (contractData.ContractArray && Array.isArray(contractData.ContractArray)) {
      // If contractData has ContractArray property
      contracts = contractData.ContractArray
    } else if (contractData.tenderData && Array.isArray(contractData.tenderData)) {
      // If contractData has tenderData property
      contracts = contractData.tenderData
    } else if (contractData && typeof contractData === 'object' && !Array.isArray(contractData)) {
      // If it's a single contract object, check if it has required fields
      if (contractData.ContractNo || contractData.Id) {
        contracts = [contractData]
      }
    }
  }

  // Ensure contracts is an array and filter out any null/undefined entries
  const contractArray = Array.isArray(contracts) 
    ? contracts.filter(c => c !== null && c !== undefined) 
    : []

  // Debug logging
  console.log("Contract Data:", contractData)
  console.log("Contracts Array:", contractArray)
  console.log("Contract Array Length:", contractArray.length)

  // Format date for display
  const formatDisplayDate = dateString => {
    if (!dateString) return ""
    const date = new Date(dateString)
    return date.toLocaleDateString("en-GB") // DD/MM/YYYY format
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
          <button className="btn btn-success" onClick={handlePDFExport} style={{ marginLeft: '5px' }}>
            <FileText size={16} className="me-2" />
            PDF
          </button>
          <button className="btn btn-info" onClick={handleExcelExport} style={{ marginLeft: '5px' }}>
            <Download size={16} className="me-2" />
            Excel
          </button>
          <button className="btn btn-secondary" onClick={handleBack} style={{ marginLeft: '5px' }}>
            <i className="bx bx-times me-2"></i>
            Close
          </button>
        </div>
      </div>

      {/* Contract Document */}
      <div className="contract-print-container">
        {contractArray.length > 0 ? (
          contractArray.map((contract, index) => (
            <div 
              key={index} 
              className="contract-document"
              style={{
                pageBreakAfter: index < contractArray.length - 1 ? "always" : "auto",
                pageBreakInside: "avoid",
                breakAfter: index < contractArray.length - 1 ? "page" : "auto",
                breakInside: "avoid",
                marginBottom: index < contractArray.length - 1 ? "20px" : "0",
                minHeight: "100vh",
                display: "flex",
                flexDirection: "column",
                paddingTop: "10px",
                paddingBottom: "20px"
              }}
            >
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
                    <img
                      src={require("../../assets/images/contract/ShreeRam.jpeg")}
                      alt="ShreeRam Logo"
                      className="company-logo"
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
                <div className="blue-separator" style={{height: "2px", backgroundColor: "#0000ff", marginBottom: "8px", width: "100%"}}></div>
              </div>

              {/* Main Content */}
              <div className="contract-main-content">
                <div className="parties-section">
                  <div className="left-column">
                    <div className="contract-number" style={{fontSize: "16px", fontWeight: "bold", color: "#000", marginBottom: "15px"}}>
                      PC.No.: {contract.ContractNo}
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
                      <div className="bottom-header-cell">ADV DEPO PMT</div>
                      <div className="bottom-header-cell">DEPO.DATE</div>
                      <div className="bottom-header-cell">NOMI DATE</div>
                      <div className="bottom-header-cell">INV.RATE</div>
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
                  
              </div>

                {/* Other Terms */}
                {(() => {
              const hasNotes = contract.Note1 || contract.Note2 || contract.Note3 || contract.Note4 || contract.Note5 || contract.Note6;
              
              if (!hasNotes) return null;
              
              return (
                <div className="other-terms" style={{marginBottom: "15px", display: "flex", alignItems: "flex-start"}}>
                  <span style={{fontSize: "15px", fontWeight: "bold", color: "#000", textDecoration: "underline", marginRight: "5px", whiteSpace: "nowrap"}}>
                    Note:
                  </span>
                  <table style={{width: "100%", borderCollapse: "collapse", border: "1px solid #000"}}>
                    <tbody>
                      {contract.Note6 && (
                        <tr style={{border: "1px solid #000"}}>
                          <td style={{fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000"}}>
                            {contract.Note6}
                          </td>
                        </tr>
                      )}
                      {contract.Note1 && (
                        <tr style={{border: "1px solid #000"}}>
                          <td style={{fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000"}}>
                            {contract.Note1}
                          </td>
                        </tr>
                      )}
                      {contract.Note2 && (
                        <tr style={{border: "1px solid #000"}}>
                          <td style={{fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000"}}>
                            {contract.Note2}
                          </td>
                        </tr>
                      )}
                      {contract.Note3 && (
                        <tr style={{border: "1px solid #000"}}>
                          <td style={{fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000"}}>
                            {contract.Note3}
                          </td>
                        </tr>
                      )}
                      {contract.Note4 && (
                        <tr style={{border: "1px solid #000"}}>
                          <td style={{fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000"}}>
                            {contract.Note4}
                          </td>
                        </tr>
                      )}
                      {contract.Note5 && (
                        <tr style={{border: "1px solid #000"}}>
                          <td style={{fontSize: "14px", fontWeight: "bold", color: "#000", padding: "4px 8px", border: "1px solid #000"}}>
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
                <div style={{height: "2px", backgroundColor: "#0000ff", marginBottom: "15px", width: "100%"}}></div>

                {/* Terms & Conditions */}
                <div className="terms-conditions" style={{marginBottom: "20px"}}>
                  <div className="terms-header-section" style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px"}}>
                    <h4 className="terms-title" style={{fontSize: "15px", fontWeight: "bold", color: "#000", margin: "0", textDecoration: "underline"}}>
                      TERMS & CONDITIONS
                    </h4>
                    <div className="regards-text" style={{fontSize: "12px", color: "#000", fontWeight: "bold", fontStyle: "italic"}}>
                      Thanking with Regards
                    </div>
                  </div>
                  <div className="terms-list">
                    <div className="term-item" style={{marginBottom: "10px", lineHeight: "1.3"}}>
                      <span className="term-number" style={{fontSize: "12px", fontWeight: "bold", color: "#000", display: "block", marginBottom: "3px"}}>
                        1. SAMPLING AND QUALITY:
                      </span>
                      <span className="term-description" style={{fontSize: "12px", color: "#000", lineHeight: "1.3", fontWeight: "bold"}}>
                        Buyer may appoint their surveyor to draw samples from the tank/s alloted by the seller to lift the material and buyer should start lifting only after satisfaction with quality specifications. The seller will not be responsible for any quality rebate after the tanker leaves from the installation.'/During the loading of tankar, sample draw & seal should be in front of drivers.
                      </span>
                    </div>
                    <div className="term-item" style={{marginBottom: "10px", lineHeight: "1.3"}}>
                      <span className="term-number" style={{fontSize: "12px", fontWeight: "bold", color: "#000", display: "block", marginBottom: "3px"}}>
                        2. INFORMATION FLOW:
                      </span>
                      <span className="term-description" style={{fontSize: "12px", color: "#000", lineHeight: "1.3", fontWeight: "bold"}}>
                        The Seller shall give all information to us from time to time regarding readiness, deliveries and dispatches of goods under this contract. The Buyer shall also intimate to us from time to time regarding their lifting/deliveries and payments.
                      </span>
                    </div>
                    <div className="term-item" style={{marginBottom: "10px", lineHeight: "1.3"}}>
                      <span className="term-number" style={{fontSize: "12px", fontWeight: "bold", color: "#000", display: "block", marginBottom: "3px"}}>
                        3. ARBITRATIONS:
                      </span>
                      <span className="term-description" style={{fontSize: "12px", color: "#000", lineHeight: "1.3", fontWeight: "bold"}}>
                        In case any dispute, arbitration will be the last resort if both parties are not able to settle the same mutually.
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
          ))
        ) : (
          <div className="text-center p-5">
            <div className="alert alert-warning">
              <i className="bx bx-error-circle me-2"></i>
              No contract data available for printing.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContractPrint