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
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "react-bootstrap"
import { Container } from "reactstrap"
import { getCompanyName } from "constants/constAPI"
import { toast } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

const DalaliPrint = ({ show, onHide, selectedLedgerId, dalaliData, onPrint, ledgerName, fromDate, applyGST, gstAmount, grandTotal }) => {
  const [formData, setFormData] = useState({
    partyName: "",
    fromDate: "",
    toDate: "",
    contactPerson: "",
    billNo: "",
    pan: "",
    gstin: "",
    items: []
  })

  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (show && dalaliData && dalaliData.length > 0) {
      // Get today's date in DD/MM/YYYY format
      const today = new Date()
      const todayFormatted = today.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })

      // Initialize form data from dalali data
      const items = dalaliData.map(item => ({
        itemName: item.ItemName || item.Item || "",
        purQty: item.PurQty || 0,
        selQty: item.SelQty || 0,
        rate: item.DalaliRate || 0,
        dalali: item.TotalDalaliAmt || 0,
       
        taxRate: item.TaxRate || "",
        hasGST: item.TaxRate && parseFloat(item.TaxRate) > 0
      }))

      // Generate a unique bill number based on current timestamp
      const billNumber = `DB${Date.now().toString().slice(-6)}`
      
      setFormData({
        partyName: ledgerName || "Unknown Ledger", // Use passed ledger name
        fromDate: fromDate || "01/04/2024", // Use passed from date
        toDate: todayFormatted, // Use today's date
        contactPerson: "KAILASH CHANDAK",
        billNo: billNumber,
        pan: "ACSPC 3779 L",
        gstin: "ACSPC 3779 L ST 001",
        items: items
      })
    }
  }, [show, dalaliData, ledgerName, fromDate])

  const calculateTotals = () => {
    const totals = formData.items.reduce((acc, item) => {
      acc.totalPurQty += parseFloat(item.purQty) || 0
      acc.totalSelQty += parseFloat(item.selQty) || 0
      acc.totalDalali += parseFloat(item.dalali) || 0
      return acc
    }, { totalPurQty: 0, totalSelQty: 0, totalDalali: 0 })
    return totals
  }

  const numberToWords = (num) => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine']
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']

    if (num === 0) return 'Zero'
    if (num < 10) return ones[num]
    if (num < 20) return teens[num - 10]
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '')
    if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' and ' + numberToWords(num % 100) : '')
    if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '')
    if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '')
    return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '')
  }

  const handlePrint = () => {
    // Create a new window with the print content
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes')
    
    if (printWindow) {
      // Get the print content
      const printContent = document.querySelector('.dalali-bill-container').innerHTML
      
      // Create the complete HTML document for the new window
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Dalali Bill - ${formData.partyName}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            body { font-family: Arial, sans-serif; }
            .table th, .table td { padding: 4px 8px; font-size: 11px; }
            .dalali-bill-container { font-size: 12px; line-height: 1.4; }
            @media print {
              .no-print { display: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="container-fluid p-3">
            <div class="no-print mb-3">
              <button onclick="window.print()" class="btn btn-primary">Print</button>
              <button onclick="window.close()" class="btn btn-secondary ms-2">Close</button>
            </div>
            ${printContent}
          </div>
        </body>
        </html>
      `
      
      // Write the content to the new window
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      
      // Focus on the new window
      printWindow.focus()
    } else {
      // Fallback to regular print if popup is blocked
      if (onPrint) {
        onPrint(formData)
      } else {
        window.print()
      }
    }
  }

  const totals = calculateTotals()

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="lg"
      className="dalali-print-modal"
    >
      <ModalHeader closeButton>
        <h4>Dalali Bill Print Preview</h4>
      </ModalHeader>
      <ModalBody>
        <div className="dalali-bill-container" style={{ fontFamily: 'Arial, sans-serif' }}>
          <style>
            {`
              @media print {
                .dalali-print-modal .modal-header,
                .dalali-print-modal .modal-footer {
                  display: none !important;
                }
                .dalali-print-modal .modal-body {
                  padding: 0 !important;
                }
                .dalali-bill-container {
                  font-size: 12px !important;
                  line-height: 1.4 !important;
                }
                .table th, .table td {
                  padding: 4px 8px !important;
                  font-size: 11px !important;
                }
              }
            `}
          </style>
          {/* Header */}
          <div className="text-center mb-4">
            <h3 className="mb-1"><strong>{getCompanyName().toUpperCase()}</strong></h3>
            <p className="mb-1">V-4, MANDORE MANDI, JODHPUR</p>
             
          </div>

          {/* Bill Details */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="mb-2">
                <strong>Party Name:</strong> {formData.partyName}
              </div>
              <div className="mb-2">
                <strong>Dalali Bill from Date:</strong> {formData.fromDate}
              </div>
              <div className="mb-2">
                <strong>To Date:</strong> {formData.toDate}
              </div>
              <div className="mb-2">
                {formData.contactPerson}
              </div>
            </Col>
            <Col md={6} className="text-end">
               
              <div className="mb-2">
                <strong>PAN:</strong> {formData.pan}
              </div>
              <div className="mb-2">
                <strong>GSTIN:</strong> {formData.gstin}
              </div>
              {applyGST && (
                <div className="mb-2">
                  <span className="badge bg-success fs-6">
                    <i className="fas fa-percentage me-1"></i>
                    18% GST Applied
                  </span>
                </div>
              )}
            </Col>
          </Row>

          {/* Items Table */}
          <Table bordered className="mb-4">
            <thead>
              <tr className="text-center">
                <th><strong>Item Name</strong></th>
                <th><strong>Pur.Qty</strong></th>
                <th><strong>Sel.Qty</strong></th>
               
                <th><strong>Dalali Rate</strong></th>
                <th><strong>Dalali Amount</strong></th>
                <th><strong>GST</strong></th>
              </tr>
            </thead>
            <tbody>
              {formData.items.map((item, index) => (
                <tr key={index}>
                  <td>
                    {item.itemName}
                    {item.hasGST && (
                      <span className="badge bg-warning ms-2" title={`GST: ${item.taxRate}%`}>
                        GST {item.taxRate}%
                      </span>
                    )}
                  </td>
                  <td className="text-end">{item.purQty > 0 ? item.purQty.toLocaleString() : ""}</td>
                  <td className="text-end">{item.selQty > 0 ? item.selQty.toLocaleString() : ""}</td>
                  
                  <td className="text-end">{item.rate}</td>
                  <td className="text-end">
                    {item.dalali.toLocaleString()}
                    {item.hasGST && (
                      <div className="small text-muted">
                        + GST: ₹{((item.dalali * parseFloat(item.taxRate)) / 100).toLocaleString()}
                      </div>
                    )}
                  </td>
                  <td className="text-center">
                    {item.hasGST ? (
                      <span className="badge bg-info">
                        ₹{((item.dalali * parseFloat(item.taxRate)) / 100).toLocaleString()}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="table-active">
                <td><strong>Total</strong></td>
                <td className="text-end"><strong>{totals.totalPurQty.toLocaleString()}</strong></td>
                <td className="text-end"><strong>{totals.totalSelQty.toLocaleString()}</strong></td>
                <td></td>
               
                <td className="text-end"><strong>{totals.totalDalali.toLocaleString()}</strong></td>
                <td className="text-center">
                  <strong>
                    ₹{(() => {
                      const totalIndividualGST = formData.items.reduce((sum, item) => {
                        if (item.hasGST) {
                          return sum + ((item.dalali * parseFloat(item.taxRate)) / 100)
                        }
                        return sum
                      }, 0)
                      return totalIndividualGST.toLocaleString()
                    })()}
                  </strong>
                </td>
              </tr>
              {/* Individual GST Total Row */}
              {formData.items.some(item => item.hasGST) && (
                <tr className="table-info">
                  <td colSpan="6" className="text-end"><strong>Individual GST Total:</strong></td>
                  <td className="text-end"><strong>
                    ₹{(() => {
                      const totalIndividualGST = formData.items.reduce((sum, item) => {
                        if (item.hasGST) {
                          return sum + ((item.dalali * parseFloat(item.taxRate)) / 100)
                        }
                        return sum
                      }, 0)
                      return totalIndividualGST.toLocaleString()
                    })()}
                  </strong></td>
                </tr>
              )}
              {applyGST && (
                <>
                  <tr className="table-warning">
                    <td colSpan="6" className="text-end"><strong>GST (18%):</strong></td>
                    <td className="text-end"><strong>₹{parseFloat(gstAmount).toLocaleString()}</strong></td>
                  </tr>
                  <tr className="table-success">
                    <td colSpan="6" className="text-end"><strong>Grand Total:</strong></td>
                    <td className="text-end"><strong>₹{parseFloat(grandTotal).toLocaleString()}</strong></td>
                  </tr>
                </>
              )}
            </tfoot>
          </Table>

          {/* Summary */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="mb-2">
                <strong>Total Pur.Qty:</strong> {totals.totalPurQty.toLocaleString()}
              </div>
              <div className="mb-2">
                <strong>Total Sel.Qty:</strong> {totals.totalSelQty.toLocaleString()}
              </div>
            </Col>
            <Col md={6}>
              <div className="mb-2">
                <strong>Total Dalali:</strong> ₹{totals.totalDalali.toLocaleString()}
              </div>
              {formData.items.some(item => item.hasGST) && (
                <div className="mb-2">
                  <strong>Individual GST Total:</strong> ₹{(() => {
                    const totalIndividualGST = formData.items.reduce((sum, item) => {
                      if (item.hasGST) {
                        return sum + ((item.dalali * parseFloat(item.taxRate)) / 100)
                      }
                      return sum
                    }, 0)
                    return totalIndividualGST.toLocaleString()
                  })()}
                </div>
              )}
              {applyGST && (
                <>
                  <div className="mb-2">
                    <strong>GST (18%):</strong> ₹{parseFloat(gstAmount).toLocaleString()}
                  </div>
                  <div className="mb-2">
                    <strong>Grand Total:</strong> ₹{parseFloat(grandTotal).toLocaleString()}
                  </div>
                  <div className="mb-2">
                    <strong>Rupees (In Words):</strong> {numberToWords(Math.floor(parseFloat(grandTotal)))} Only
                  </div>
                </>
              )}
              {!applyGST && (
                <div className="mb-2">
                  <strong>Rupees (In Words):</strong> {numberToWords(Math.floor(totals.totalDalali))} Only
                </div>
              )}
            </Col>
          </Row>

          {/* Footer */}
          <div className="text-center mt-5">
            <p>For : {getCompanyName().toUpperCase()}</p>
            <div className="mt-4">
              <p>_________________________</p>
              <p>Authorized Signatory</p>
            </div>
          </div>
        </div>
      </ModalBody>
      <ModalFooter>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          Print
        </Button>
      </ModalFooter>
    </Modal>
  )
}

export default DalaliPrint
