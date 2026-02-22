import React, { useEffect, useRef } from "react"
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Alert,
  Table,
  Row,
  Col,
  FormGroup,
  Label,
} from "reactstrap"


// No use of this page


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

const LiftingModal = ({
  isOpen,
  toggle,
  liftingRows,
  onLiftingChange,
  onAddRow,
  onRemoveRow,
  state,
  onInputChange,
  formatDateForInput: formatDate
}) => {
  const inputRefs = useRef({})

  // Auto-focus on first date input when modal opens
  useEffect(() => {
    if (isOpen && liftingRows.length > 0) {
      // Use a slightly longer timeout to ensure modal is fully rendered
      setTimeout(() => {
        const firstDateInput = inputRefs.current[`Date1-0`]
        if (firstDateInput) {
          firstDateInput.focus()
        }
      }, 150)
    }
  }, [isOpen]) // Only run when modal opens, not when rows change

  // Handle keyboard navigation
  const handleKeyDown = (e, rowIndex, fieldName) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (fieldName === 'Rate1') {
        // On Rate field Enter, add new row and focus on its date
        const currentRowCount = liftingRows.length
        onAddRow()
        setTimeout(() => {
          // Focus on the new row's Date field (which will be at the current count index)
          const newRowDateInput = inputRefs.current[`Date1-${currentRowCount}`]
          if (newRowDateInput) {
            newRowDateInput.focus()
          }
        }, 150) // Increased timeout to ensure state update is complete
      } else {
        // Navigate to next field in same row or next row
        const nextField = getNextField(fieldName)
        if (nextField) {
          const nextInput = inputRefs.current[`${nextField}-${rowIndex}`]
          if (nextInput) {
            nextInput.focus()
          }
        }
      }
    }
  }

  // Get next field for navigation
  const getNextField = (currentField) => {
    const fieldOrder = ['Date1', 'LorryNo', 'BNo', 'Lifted', 'Rate1']
    const currentIndex = fieldOrder.indexOf(currentField)
    return currentIndex < fieldOrder.length - 1 ? fieldOrder[currentIndex + 1] : null
  }

  // Set input reference
  const setInputRef = (ref, rowIndex, fieldName) => {
    inputRefs.current[`${fieldName}-${rowIndex}`] = ref
  }

  return (
    <Modal
      isOpen={isOpen}
      toggle={toggle}
      size="xl"
      className="lifting-modal"
    >
      <ModalHeader
        toggle={toggle}
        className="modal-header-elegant"
      >
        <div className="d-flex align-items-center">
          <div className="header-icon">
            <i className="bx bx-truck"></i>
          </div>
          <div className="header-content">
            <h5 className="mb-0">Lifting Details</h5>
            <small className="text-muted">
              Manage contract lifting records
            </small>
          </div>
        </div>
      </ModalHeader>
      <ModalBody className="modal-body-elegant">
        <div className="lifting-modal-content">
          {/* Validation Alert */}
          {state.showLiftingAlert && (
            <Alert color="warning" className="mb-3">
              <i className="bx bx-error-circle me-2"></i>
              {state.liftingAlertMessage}
            </Alert>
          )}

          {/* Search and Actions Bar */}
          <div className="search-actions-bar">
            <div className="search-section">
              <div className="search-input-wrapper">
                <i className="bx bx-search search-icon"></i>
                <input
                  type="text"
                  placeholder="Search lifting records..."
                  className="search-input"
                  style={{
                    width: '100%',
                    padding: '12px 16px 12px 45px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '25px',
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#007bff'
                    e.target.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.1)'
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e1e5e9'
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.05)'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Lifting Table */}
          <div className="table-container">
            <div className="table-responsive lifting-table">
              <Table size="sm" className="table-elegant">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Lorry No.</th>
                    <th>B.No.</th>
                    <th>Lifted</th>
                    <th>Rate</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {liftingRows.map((row, index) => (
                    <tr key={index} className="table-row-elegant">
                      <td>
                        <input
                          ref={(ref) => setInputRef(ref, index, 'Date1')}
                          type="date"
                          className="table-input"
                          value={formatDate(row.Date1 || "")}
                          onChange={e =>
                            onLiftingChange(
                              index,
                              "Date1",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, index, 'Date1')}
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '8px',
                            fontSize: '13px',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#ffffff',
                            color: '#495057'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#007bff'
                            e.target.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e1e5e9'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          ref={(ref) => setInputRef(ref, index, 'LorryNo')}
                          type="text"
                          className="table-input"
                          value={row.LorryNo || ""}
                          onChange={e =>
                            onLiftingChange(
                              index,
                              "LorryNo",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, index, 'LorryNo')}
                          placeholder="Lorry #"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '8px',
                            fontSize: '13px',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#ffffff',
                            color: '#495057'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#007bff'
                            e.target.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e1e5e9'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          ref={(ref) => setInputRef(ref, index, 'BNo')}
                          type="text"
                          className="table-input"
                          value={row.BNo || ""}
                          onChange={e =>
                            onLiftingChange(index, "BNo", e.target.value)
                          }
                          onKeyDown={(e) => handleKeyDown(e, index, 'BNo')}
                          placeholder="B.No"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '8px',
                            fontSize: '13px',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#ffffff',
                            color: '#495057'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#007bff'
                            e.target.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e1e5e9'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          ref={(ref) => setInputRef(ref, index, 'Lifted')}
                          type="text"
                          className="table-input"
                          value={row.Lifted || ""}
                          onChange={e =>
                            onLiftingChange(
                              index,
                              "Lifted",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, index, 'Lifted')}
                          placeholder="Qty"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '8px',
                            fontSize: '13px',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#ffffff',
                            color: '#495057'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#007bff'
                            e.target.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e1e5e9'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </td>
                      <td>
                        <input
                          ref={(ref) => setInputRef(ref, index, 'Rate1')}
                          type="text"
                          className="table-input"
                          value={row.Rate1 || ""}
                          onChange={e =>
                            onLiftingChange(
                              index,
                              "Rate1",
                              e.target.value
                            )
                          }
                          onKeyDown={(e) => handleKeyDown(e, index, 'Rate1')}
                          placeholder="Rate"
                          style={{
                            width: '100%',
                            padding: '8px 12px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '8px',
                            fontSize: '13px',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#ffffff',
                            color: '#495057'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#007bff'
                            e.target.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.1)'
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e1e5e9'
                            e.target.style.boxShadow = 'none'
                          }}
                        />
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger action-btn-small"
                            onClick={() => onRemoveRow(index)}
                            disabled={liftingRows.length === 1}
                            title="Remove row"
                          >
                            <i className="bx bx-minus"></i>
                          </button>
                          {index === liftingRows.length - 1 && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success action-btn-small"
                              onClick={onAddRow}
                              title="Add new row"
                            >
                              <i className="bx bx-plus"></i>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <h6 className="summary-title">
              <i className="bx bx-calculator me-2"></i>
              Summary
            </h6>

            <Row>
              <Col md={2}>
                <FormGroup>
                  <Label for="contractQty" className="summary-label">
                    Contract Qty
                  </Label>
                  <div className={`summary-input ${state.totalLiftingQty > state.contractQty ? 'bg-warning' : 'bg-light'}`}>
                    {state.contractQty || state.Qty || "0.00"}
                  </div>
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="totalLiftingQty" className="summary-label">
                    Total Lifting
                  </Label>
                  <div className={`summary-input ${state.totalLiftingQty > state.contractQty ? 'bg-warning' : 'bg-light'}`}>
                    {state.totalLiftingQty || "0.00"}
                  </div>
                </FormGroup>
              </Col>
              <Col md={2}>
                <FormGroup>
                  <Label for="pendingQty" className="summary-label">
                    Pending Qty
                  </Label>
                  <div className="summary-input bg-light">
                    {Math.max(0, (state.contractQty || state.Qty || 0) - (state.totalLiftingQty || 0)).toFixed(2)}
                  </div>
                </FormGroup>
              </Col>

              <Col md={3}>
                <FormGroup>
                  <Label for="DiffAmt" className="summary-label">
                    Diff. Amount
                  </Label>
                  <input
                    type="text"
                    name="DiffAmt"
                    id="DiffAmt"
                    value={state.DiffAmt || "0.00"}
                    onChange={onInputChange}
                    className={`summary-input ${parseFloat(state.DiffAmt || 0) < 0 ? 'text-success' : parseFloat(state.DiffAmt || 0) > 0 ? 'text-danger' : ''}`}
                    placeholder="0.00"
                    readOnly
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '14px',
                      backgroundColor: '#f8f9fa',
                      color: '#495057',
                      fontWeight: '500',
                      textAlign: 'center'
                    }}
                  />
                </FormGroup>
              </Col>

              <Col md={3}>
                <FormGroup>
                  <Label for="BackSellerCNo" className="summary-label">
                    Back Seller CNo
                  </Label>
                  <input
                    type="text"
                    name="BackSellerCNo"
                    id="BackSellerCNo"
                    value={state.BackSellerCNo || ""}
                    onChange={onInputChange}
                    className="summary-input"
                    placeholder="Back seller contract no"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #e1e5e9',
                      borderRadius: '10px',
                      fontSize: '14px',
                      transition: 'all 0.3s ease',
                      backgroundColor: '#ffffff',
                      color: '#495057'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#007bff'
                      e.target.style.boxShadow = '0 0 0 3px rgba(0,123,255,0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#e1e5e9'
                      e.target.style.boxShadow = 'none'
                    }}
                  />
                </FormGroup>
              </Col>
            </Row>
          </div>
        </div>
      </ModalBody>
      <ModalFooter className="modal-footer-elegant">
        <div className="footer-actions">
          <button
            type="button"
            onClick={toggle}
            className="btn btn-light footer-btn"
          >
            <i className="bx bx-x me-2"></i>
            Cancel
          </button>
          <button
            type="button"
            onClick={toggle}
            className="btn btn-primary footer-btn"
          >
            <i className="bx bx-check me-2"></i>
            Save Changes
          </button>
        </div>
      </ModalFooter>
    </Modal>
  )
}

export default LiftingModal
