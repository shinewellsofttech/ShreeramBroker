import PropTypes from "prop-types";
import React, { useState, useEffect, useRef } from "react";
import {
  Container, Row, Col, Card, CardBody, Button, Spinner, Badge
} from "reactstrap";
import { Eye, EyeOff, Copy, FileText, Calendar } from 'react-feather';
import { useNavigate } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

//i18n
import { withTranslation } from "react-i18next";
import { Fn_FillListData, Fn_GetReport } from "store/Functions";
import { useDispatch, useSelector } from "react-redux";
import { setGlobalDates } from "store/common-actions";
import ReminderData from "pages/Reports/ReminderData";

 
const Dashboard = props => {
  document.title = "Dashboard | Welcome";
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Get global dates from Redux store
  const globalDates = useSelector(state => state.GlobalDates);
  
  // Local state for date inputs
  const [fromDate, setFromDate] = useState(globalDates.fromDate);
  const [toDate, setToDate] = useState(() => {
    // Initialize toDate to today's date on component mount
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  
  // Ref to track if component has mounted
  const isInitialMount = useRef(true);
  // Ref to store initial fromDate to avoid dependency issues
  const initialFromDate = useRef(globalDates.fromDate);

  // State for total quantity from ReminderData (doesn't depend on selection)
  const [totalQuantity, setTotalQuantity] = useState(0);

  // Update global dates when local dates change
  const handleDateChange = (newFromDate, newToDate) => {
    dispatch(setGlobalDates(newFromDate, newToDate));
  };

  // Handle total quantity change from ReminderData
  const handleTotalQuantityChange = (qty) => {
    setTotalQuantity(qty);
  };

  // Update Redux with today's date on component mount
  useEffect(() => {
    if (isInitialMount.current) {
      // Create today's date and update Redux
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      dispatch(setGlobalDates(initialFromDate.current, today));
      isInitialMount.current = false;
    }
  }, [dispatch]);

  // Sync local state with global dates when global dates change (but not on initial mount)
  useEffect(() => {
    // Skip sync on initial mount - let the mount effect set today's date
    if (!isInitialMount.current) {
      setFromDate(new Date(globalDates.fromDate));
      setToDate(new Date(globalDates.toDate));
    }
  }, [globalDates.fromDate, globalDates.toDate]);

  // Add keyboard event listener for Ctrl+C and Ctrl+G
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.key === 'c') {
        event.preventDefault();
        navigate('/Contract');
      }
      if (event.ctrlKey && event.key === 'g') {
        event.preventDefault();
        navigate('/UpdateGlobalOptions');
      }
      if (event.ctrlKey && event.key === 'l') {
        event.preventDefault();
        navigate('/PartyAccountMaster');
      }
      if (event.ctrlKey && event.key === 'm') {
        event.preventDefault();
        navigate('/TransportMaster');
      }
      if (event.ctrlKey && event.key === 'i') {
        event.preventDefault();
        navigate('/ItemMaster');
      }
      if (event.ctrlKey && event.key === 'u') {
        event.preventDefault();
        navigate('/UnitMaster');
      }
    
      if (event.ctrlKey && event.key === 'r') {
        event.preventDefault();
        navigate('/ContractRegister');
      }
      if (event.ctrlKey && event.key === 'a') {
        event.preventDefault();
        navigate('/NewLedgerReport');
      }
      if (event.ctrlKey && event.key === 'p') {
        event.preventDefault();
        navigate('/MultiPrint');
      }
      
    };

    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup event listener
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [navigate]);

   
  return (
    <React.Fragment>
      <style>{`
        @media (max-width: 768px) {
          .dashboard-datepicker {
            width: 155px !important;
          }
          
          /* Remove all spacing around ReminderData on mobile */
          .pt-md-5 {
            padding-top: 0 !important;
          }
          
          .container-fluid {
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          .reminder-data-container {
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
          }
          
          .reminder-data-container > * {
            margin: 0 !important;
            padding: 0 !important;
          }
          
          /* Remove spacing from Row and Col on mobile */
          .row {
            margin-left: 0 !important;
            margin-right: 0 !important;
          }
          
          #reminder-row {
            margin-bottom: 0 !important;
          }
          
          #date-row {
            margin-bottom: 0 !important;
            margin-top: 0 !important;
          }
          
          #date-row .card {
            margin-top: 0 !important;
            border-radius: 0 !important;
          }
          
          #date-row .card-body {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
            padding-left: 0.5rem !important;
            padding-right: 0.5rem !important;
            overflow: visible !important;
          }
          
          #date-row .card-body .row {
            overflow: visible !important;
          }
          
          #date-row .card-body .col {
            overflow: visible !important;
          }
          
          /* Ensure date pickers don't get cut */
          .dashboard-datepicker {
            overflow: visible !important;
          }
          
          .react-datepicker-wrapper {
            overflow: visible !important;
            display: inline-block !important;
          }
          
          .react-datepicker__input-container {
            overflow: visible !important;
          }
          
          .react-datepicker__input-container input {
            border: 1px solid #ced4da !important;
            border-radius: 0.25rem !important;
            box-sizing: border-box !important;
          }
          
          .row > [class*="col-"] {
            padding-left: 0 !important;
            padding-right: 0 !important;
          }
        }
      `}</style>
      <div className="pt-md-5">
        <Container fluid>
          {/* Global Date Range Section */}
          <Row className="mb-0" id="date-row" style={{ marginBottom: 0 }}>
            <Col lg={12} style={{ marginBottom: 0, paddingBottom: 0 }}>
              <Card className="border-0 shadow-sm" style={{backgroundColor: '#e3f2fd', marginBottom: 0, overflow: 'visible'}}>
                <CardBody className="p-2 p-md-3" style={{ marginBottom: 0, paddingBottom: '0.5rem', paddingTop: '0.5rem', overflow: 'visible' }}>
                  <Row className="align-items-center" style={{ overflow: 'visible' }}>
                   
                    <Col xs="auto" style={{ overflow: 'visible', paddingTop: '2px', paddingBottom: '2px' }}>
                      {/* Desktop: Show with labels */}
                      <div className="d-none d-md-flex align-items-center gap-3">
                        <div className="d-flex align-items-center gap-2">
                          <label className="mb-0 fw-semibold small text-muted">From:</label>
                          <DatePicker
                            selected={fromDate}
                            onChange={(date) => {
                              if (date) {
                                setFromDate(date)
                                handleDateChange(date, toDate)
                              }
                            }}
                            className="form-control form-control-sm dashboard-datepicker"
                            dateFormat="dd/MM/yyyy"
                            placeholderText="From Date"
                            style={{
                              width: '140px',
                              fontSize: '0.85rem'
                            }}
                            openToDate={new Date()}
                          />
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <label className="mb-0 fw-semibold small text-muted">To:</label>
                          <DatePicker
                            selected={toDate}
                            onChange={(date) => {
                              if (date) {
                                setToDate(date)
                                handleDateChange(fromDate, date)
                              }
                            }}
                            className="form-control form-control-sm dashboard-datepicker"
                            dateFormat="dd/MM/yyyy"
                            placeholderText="To Date"
                            style={{
                              width: '140px',
                              fontSize: '0.85rem'
                            }}
                            openToDate={new Date()}
                          />
                        </div>
                      </div>
                      
                      {/* Mobile: Show with labels in format "From: FromDate - To: ToDate | TQ: TotalQuantity" */}
                      <div className="d-md-none d-flex align-items-center gap-2" style={{ whiteSpace: 'nowrap', flexWrap: 'nowrap', overflow: 'visible' }}>
                        <label className="mb-0 fw-semibold small text-muted" style={{ whiteSpace: 'nowrap' }}>From:</label>
                        <DatePicker
                          selected={fromDate}
                          onChange={(date) => {
                            if (date) {
                              setFromDate(date)
                              handleDateChange(date, toDate)
                            }
                          }}
                          className="form-control form-control-sm dashboard-datepicker"
                          dateFormat="dd/MM/yyyy"
                          placeholderText="From Date"
                          style={{
                            width: '90px',
                            fontSize: '0.85rem'
                          }}
                          openToDate={new Date()}
                        />
                        <span className="mb-0 fw-semibold small text-muted" style={{ whiteSpace: 'nowrap' }}>-</span>
                        <label className="mb-0 fw-semibold small text-muted" style={{ whiteSpace: 'nowrap' }}>To:</label>
                        <DatePicker
                          selected={toDate}
                          onChange={(date) => {
                            if (date) {
                              setToDate(date)
                              handleDateChange(fromDate, date)
                            }
                          }}
                          className="form-control form-control-sm dashboard-datepicker"
                          dateFormat="dd/MM/yyyy"
                          placeholderText="To Date"
                          style={{
                            width: '90px',
                            fontSize: '0.85rem'
                          }}
                          openToDate={new Date()}
                        />
                        <span className="mb-0 fw-semibold small text-muted" style={{ whiteSpace: 'nowrap' }}>|</span>
                        <label className="mb-0 fw-semibold small text-muted" style={{ whiteSpace: 'nowrap' }}>TQ:</label>
                        <span className="mb-0 fw-bold text-primary" style={{ whiteSpace: 'nowrap', fontWeight: '900', fontSize: '0.95rem' }}>{totalQuantity}</span>
                      </div>
                    </Col>
                   
                  </Row>
                </CardBody>
              </Card>
            </Col>
          </Row>

          <Row className="mb-4" style={{ marginLeft: 0, marginRight: 0, marginTop: 0 }} id="reminder-row">
            {/* Left Container - Keyboard Shortcuts */}
            <Col lg={2} md={6} className="mb-4 d-none d-md-block" style={{ paddingLeft: 0, paddingRight: 0 }}>
              <Card className="border-0 shadow-sm h-100" style= {{backgroundColor: '#fff9c4'}}>
                <CardBody className="p-2">
                  <div className="d-flex align-items-center mb-2">
                    <Copy className="text-primary me-2" size={16} />
                    <h6 className="mb-0 fw-bold small">Quick Navigation</h6>
                  </div>
                  
                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/Contract')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Contract Page</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + C
                        </kbd>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/UpdateGlobalOptions')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Global Options</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + G
                        </kbd>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/PartyAccountMaster')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Party Account Master</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + L
                        </kbd>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/TransportMaster')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Transport Master</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + M
                        </kbd>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/ItemMaster')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Item Master</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + I
                        </kbd>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/UnitMaster')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Unit Master</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + U
                        </kbd>
                      </div>
                    </div>
                  </div>

{/* 
                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/DalaliReport')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Dalali Report</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + D
                        </kbd>
                      </div>
                    </div>
                  </div> */}

                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/ContractRegister')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Contract Register</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + R
                        </kbd>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/NewLedgerReport')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Ledger List</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + A
                        </kbd>
                      </div>
                    </div>
                  </div>

                  
                  <div 
                    className="shortcut-item p-1 bg-light rounded mb-1" 
                    style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
                    onClick={() => navigate('/MultiPrint')}
                    onMouseEnter={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#e9ecef';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.closest('.shortcut-item').style.backgroundColor = '#f8f9fa';
                      e.target.closest('.shortcut-item').style.transform = 'translateY(0)';
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <span className="fw-semibold text-dark small">Multi Print</span>
                      </div>
                      <div className="text-end">
                        <kbd className="bg-dark text-white px-1 py-0 rounded small">
                          Ctrl + P
                        </kbd>
                      </div>
                    </div>
                  </div>
                  
                </CardBody>
              </Card>
            </Col>

            {/* Right Container - Welcome Section with ShreeRam Image (Desktop) / ReminderData (Mobile) */}
            <Col lg={8} md={6} style={{ paddingLeft: 0, paddingRight: 0, paddingTop: 0, marginTop: 0 }}>
              {/* Desktop: Show Welcome Section */}
              <div className="d-none d-md-block">
                <Card className="border-0 shadow-sm" style= {{backgroundColor: '#fff9c4'}}>
                  <CardBody className="text-center p-5" style= {{backgroundColor: '#fff9c4'}}>
                    <div className="mb-4">
                      <img 
                        src={require("../../assets/images/contract/ShreeRam.jpeg")} 
                        alt="Shri Ram" 
                        className="img-fluid rounded-circle shadow"
                        style={{ 
                          width: '200px', 
                          height: '200px', 
                          objectFit: 'cover',
                          border: '4px solid #f8f9fa'
                        }}
                      />
                    </div>
                    <h2 className="text-primary mb-3 fw-bold">
                      Welcome
                    </h2>
                    <p className="text-muted fs-5 mb-0">
                      Your trusted partner in agricultural brokerage services
                    </p>
                  </CardBody>
                </Card>
              </div>
              
              {/* Mobile: Show ReminderData */}
              <div className="d-md-none reminder-data-container" style={{ margin: 0, padding: 0, marginTop: 0, paddingTop: 0, width: '100%' }}>
                <ReminderData hideDateFilters={true} onTotalChange={handleTotalQuantityChange} />
              </div>
            </Col>
          </Row>
           
        </Container>
      </div>
    </React.Fragment>
  );
};

Dashboard.propTypes = {
  t: PropTypes.any,
};

export default withTranslation()(Dashboard);
