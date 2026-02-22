import React, { useState, useEffect } from "react"
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
  FormCheck,
} from "react-bootstrap"
import { API_WEB_URLS } from "constants/constAPI"
import { Fn_GetReport, Fn_DisplayData, Fn_FillListData } from "store/Functions"
import { useDispatch } from "react-redux"
import { toast } from "react-toastify"
import { Search, Printer, X, LogOut, Calendar, Filter, Download } from "react-feather"
import "./ContractRegister.scss"

function MultiPrint() {
  const dispatch = useDispatch()

   
  const [ledgerId, setLedgerId] = useState(0)
  const [showTable, setShowTable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showReport, setShowReport] = useState(false)   
  const [error, setError] = useState("")
  const [selectedRows, setSelectedRows] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [state, setState] = useState({
    FillArray: [],
    LedgerArray: [],   
  })

  const API_URL_Get = `${API_WEB_URLS.ContractEditData}/0/token`
  const API_URL = API_WEB_URLS.MASTER + "/0/token/LedgerReportMaster"
  

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
      // Reset selections when new data is loaded
      setSelectedRows([])
      setSelectAll(false)
    }
  }, [state.FillArray])

  // Handle select all checkbox
  const handleSelectAll = (e) => {
    const checked = e.target.checked
    setSelectAll(checked)
    if (checked) {
      setSelectedRows(state.FillArray.map(row => row.Id))
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
        if (newSelection.length === state.FillArray.length) {
          setSelectAll(true)
        }
        return newSelection
      }
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError("")
    
    try {
      let vformData = new FormData()

       
      vformData.append("LedgerId", ledgerId)
       

      const result = await Fn_GetReport(
        dispatch,
        setState,
        "FillArray",
        API_URL_Get,
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

  const handleClear = () => {
    
    setLedgerId(0)
    setShowTable(false)
    setShowReport(false)
    setState({
      ...state,
      FillArray: []
    })
    setError("")
    setSelectedRows([])
    setSelectAll(false)
  }

  const handleExit = () => {
    window.close() // Or navigate to another page
  }

  const handlePrint = async () => {
    if (selectedRows.length === 0) {
      toast.warning("Please select at least one row to print")
      return
    }

    setLoading(true)
    
    try {
      // Convert selected IDs to comma-separated string
      const selectedIds = selectedRows.join(',')
      
      // Call Fn_GetReport to get contract data for selected IDs
      let vformData = new FormData()
      vformData.append("Id", selectedIds)  // Pass multiple ids in CSV format
      
      const result = await Fn_GetReport(
        dispatch,
        setState,
        "ContractArray",   // This will store the contract data for printing
        `${API_WEB_URLS.ContractMultiPrint}/0/token`,
        { arguList: { id: 0, formData: vformData } },
        true
      )

      // Open ContractPrint.js in a new window/tab with the contract data
      const printUrl = `/contract-print?id=${selectedIds}`
      window.open(printUrl, '_blank')
      
      // Show success message
      toast.success(`Print data prepared for ${selectedRows.length} contract${selectedRows.length > 1 ? 's' : ''}`)
      
    } catch (error) {
      setError("Error preparing print data. Please try again.")
      console.error("Print preparation error:", error)
      toast.error("Error preparing print data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="contract-register-container">
    
         <div style={{height: '2rem'}}></div> 

      {/* Filter Form */}
      <Card className="shadow-sm border-0 mb-4">
        <Card.Header className="bg-primary text-white">
          <h5 className="mb-0">
            <Filter className="me-2" size={18} />
            Contract List
          </h5>
        </Card.Header>
        <Card.Body>
          <Form>
            <Row className="mb-3 align-items-end">
              <Col lg={3} md={3} sm={3} className="mb-3">
                <Form.Label className="fw-semibold">Ledger</Form.Label>
                <Form.Select
                  value={ledgerId}
                  onChange={e => setLedgerId(e.target.value)}
                  className="form-select-sm"
                >
                  <option value={0}>Select Ledger</option>
                  {state.LedgerArray.map(ledger => (
                    <option key={ledger.Id} value={ledger.Id}>
                      {ledger.Name}
                    </option>
                  ))}
                </Form.Select>
              </Col>
              
              <Col lg={1} className="mb-3">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="d-flex align-items-center"
                >
                  <Search className="me-1" size={16} />
                  {loading ? "Generating..." : "Show"}
                </Button>
              </Col>
              <Col lg={1} className="mb-3">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleClear}
                  className="d-flex align-items-center"
                >
                  <X className="me-1" size={16} />
                  Clear
                </Button>
              </Col>

              <Col lg={1} className="mb-3">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={handlePrint}
                  disabled={loading}
                >
                  <Printer className="me-1" size={16} />
                  {loading ? "Preparing..." : "Print"}
                </Button>
              </Col>
              <Col lg={1} className="mb-3">
                <Button variant="outline-danger" size="sm" onClick={handleExit}>
                  <LogOut className="me-1" size={16} />
                  Exit
                </Button>
              </Col>
            </Row>
          </Form>
        </Card.Body>
      </Card>

      
      {/* Results Table */}
      {(showTable || (state.FillArray && state.FillArray.length > 0)) && (
        <div>
          {state.FillArray.length > 0 ? (
            <div>
              {/* Selection Counter */}
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div className="text-muted">
                  <small>
                    {selectedRows.length > 0 
                      ? `${selectedRows.length} of ${state.FillArray.length} rows selected`
                      : `${state.FillArray.length} rows available`
                    }
                  </small>
                </div>
                {selectedRows.length > 0 && (
                  <div className="text-primary fw-semibold">
                    <Printer className="me-1" size={16} />
                    Ready to print {selectedRows.length} contract{selectedRows.length > 1 ? 's' : ''}
                  </div>
                )}
              </div>
              
              <div className="table-container">
                <Table
                  striped
                  bordered
                  hover
                  size="sm"
                  className="mb-0 fixed-table"
                >
                  <thead className="table-success text-center">
                    <tr>
                      <th>
                        <FormCheck
                          type="checkbox"
                          checked={selectAll}
                          onChange={handleSelectAll}
                          title="Select All"
                        />
                      </th>
                      <th>CNo</th>
                      <th>Date</th>
                      <th>Month</th>
                      <th>Ship From Date</th>
                      <th>Ship To Date</th>
                      <th>Lifted From Date</th>
                      <th>Lifted To Date</th>
                      <th>Qty</th>
                      <th>Rate</th>
                      <th>Adv Payment</th>
                      <th>Adv Date</th>
                      <th>Seller</th>
                      <th>Buyer</th>
                      <th>Item</th>
                      <th>Vessel</th>
                      <th>Lifted Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {state.FillArray.map((row, i) => (
                      <tr key={i}>
                        <td>
                          <FormCheck
                            type="checkbox"
                            checked={selectedRows.includes(row.Id)}
                            onChange={() => handleRowSelect(row.Id)}
                            onClick={e => e.stopPropagation()} // Prevent row selection on checkbox click
                          />
                        </td>
                        <td className="text-nowrap fw-semibold text-truncate" title={row.ContractNo}>
                          {row.ContractNo}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.Date ? new Date(row.Date).toLocaleDateString('en-GB') : '-'}>
                          {row.Date ? new Date(row.Date).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.MonthName || '-'}>
                          {row.MonthName || '-'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.ShipmentFromDate ? new Date(row.ShipmentFromDate).toLocaleDateString('en-GB') : '-'}>
                          {row.ShipmentFromDate ? new Date(row.ShipmentFromDate).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.ShipmentToDate ? new Date(row.ShipmentToDate).toLocaleDateString('en-GB') : '-'}>
                          {row.ShipmentToDate ? new Date(row.ShipmentToDate).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.LiftedFromDate ? new Date(row.LiftedFromDate).toLocaleDateString('en-GB') : '-'}>
                          {row.LiftedFromDate ? new Date(row.LiftedFromDate).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.LiftedToDate ? new Date(row.LiftedToDate).toLocaleDateString('en-GB') : '-'}>
                          {row.LiftedToDate ? new Date(row.LiftedToDate).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <td className="text-end fw-semibold text-truncate" title={row.Qty ? row.Qty.toLocaleString() : '0'}>
                          {row.Qty ? row.Qty.toLocaleString() : '0'}
                        </td>
                        <td className="text-end fw-semibold text-truncate" title={row.Rate ? row.Rate.toLocaleString() : '0'}>
                          {row.Rate ? row.Rate.toLocaleString() : '0'}
                        </td>
                        <td className="text-end fw-semibold text-truncate" title={row.AdvPayment ? row.AdvPayment.toLocaleString() : '0'}>
                          {row.AdvPayment ? row.AdvPayment.toLocaleString() : '0'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.AdvDate ? new Date(row.AdvDate).toLocaleDateString('en-GB') : '-'}>
                          {row.AdvDate ? new Date(row.AdvDate).toLocaleDateString('en-GB') : '-'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.SellerLedger || '-'}>
                          {row.SellerLedger || '-'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.BuyerLedger || '-'}>
                          {row.BuyerLedger || '-'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.ItemTypeName || '-'}>
                          {row.ItemTypeName || '-'}
                        </td>
                        <td className="text-nowrap text-truncate" title={row.Vessel || '-'}>
                          {row.Vessel || '-'}
                        </td>
                        <td className="text-end fw-semibold text-truncate" title={row.LiftedQuantity ? row.LiftedQuantity.toLocaleString() : '0'}>
                          {row.LiftedQuantity ? row.LiftedQuantity.toLocaleString() : '0'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="text-center p-5">
              <div className="text-muted">
                <Search size={48} className="mb-3" />
                <h5>No Data Found</h5>
                <p>
                  No records match the selected criteria. Please try adjusting
                  your filters.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="text-center p-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2 text-muted">Generating report, please wait...</p>
        </div>
      )}
    </div>
  )
}

export default MultiPrint
