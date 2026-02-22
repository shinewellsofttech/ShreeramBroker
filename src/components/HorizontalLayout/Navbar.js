import PropTypes from "prop-types";
import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Collapse } from "reactstrap";
import withRouter from "components/Common/withRouter";
import classname from "classnames";
import ShreeRamLogo from "../../assets/images/contract/ShreeRam.jpeg";
import MobileSidebar from "./MobileSidebar";

//i18n
import { withTranslation } from "react-i18next";

import { connect } from "react-redux";
import { toggleLeftmenu } from "store/actions";
import { getCompanyName } from "constants/constAPI";

const Navbar = props => {

  const [dashboard, setdashboard] = useState(false);
  const [masters, setmasters] = useState(false);
  const [transaction, settransaction] = useState(false);
  const [reports, setreports] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogout, setShowLogout] = useState(window.innerWidth >= 992);
  
  const navRef = useRef(null);

  useEffect(() => {
    var matchingMenuItem = null;
    var ul = document.getElementById("navigation");
    var items = ul.getElementsByTagName("a");
    removeActivation(items);
    for (var i = 0; i < items.length; ++i) {
      if (window.location.pathname === items[i].pathname) {
        matchingMenuItem = items[i];
        break;
      }
    }
    if (matchingMenuItem) {
      activateParentDropdown(matchingMenuItem);
    }
  });

  const removeActivation = items => {
    for (var i = 0; i < items.length; ++i) {
      var item = items[i];
      const parent = items[i].parentElement;
      if (item && item.classList.contains("active")) {
        item.classList.remove("active");
      }
      if (parent) {
        if (parent.classList.contains("active")) {
          parent.classList.remove("active");
        }
      }
    }
  };

  function activateParentDropdown(item) {
    item.classList.add("active");
    const parent = item.parentElement;
    if (parent) {
      parent.classList.add("active"); // li
      const parent2 = parent.parentElement;
      parent2.classList.add("active"); // li
      const parent3 = parent2.parentElement;
      if (parent3) {
        parent3.classList.add("active"); // li
        const parent4 = parent3.parentElement;
        if (parent4) {
          parent4.classList.add("active"); // li
          const parent5 = parent4.parentElement;
          if (parent5) {
            parent5.classList.add("active"); // li
            const parent6 = parent5.parentElement;
            if (parent6) {
              parent6.classList.add("active"); // li
            }
          }
        }
      }
    }
    return false;
  }

  // Function to close all dropdowns
  const closeAllDropdowns = () => {
    setmasters(false);
    settransaction(false);
    setreports(false);
  };

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle window resize to toggle logout button visibility
  // Toggle button visible hai to logout hide, toggle hidden hai to logout show
  useEffect(() => {
    const handleResize = () => {
      const isDesktop = window.innerWidth >= 992;
      setShowLogout(isDesktop);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);


  return (
    <React.Fragment>
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)}
        t={props.t}
      />

      <div className="topnav" style={{ padding: '2px 0', height: '36px' }}>
        <div className="container-fluid" style={{ padding: '0' }}>
          <nav
            ref={navRef}
            className="navbar navbar-light navbar-expand-lg topnav-menu"
            id="navigation"
            style={{ padding: '0', minHeight: '32px', height: '32px' }}
          >
            {/* Mobile: Toggle Button + Logo + Title on same line */}
            <div className="d-flex align-items-center w-100 w-lg-auto" style={{ padding: '0', height: '28px', marginRight: '24px' }}>
            {/* Mobile Toggle Button */}
            <button
              className="navbar-toggler d-lg-none"
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Toggle navigation"
              style={{
                border: '1px solid #dee2e6',
                background: '#fff',
                color: '#495057',
                padding: '0.25rem 0.5rem',
                borderRadius: '4px',
                marginRight: '0.5rem',
                position: 'relative',
                zIndex: 100
              }}
            >
              <i className="fa fa-fw fa-bars" style={{ fontSize: '14px' }} />
            </button>
         
              {/* Logo - increased size and spacing on both sides */}
              <img 
               src={ShreeRamLogo} 
                alt="Shinewell Softtech Logo" 
                style={{ 
                  height: '28px', 
                  width: 'auto', 
                  marginLeft: '20px',
                  marginRight: '28px',
                  borderRadius: '4px'
                }} 
              />
              
              {/* Company Title */}
              <span 
                className="company-title" 
                style={{ 
                  fontSize: '12px', 
                  fontWeight: 'bold',
                  color: '#495057',
                  marginRight: '200px',
                  marginLeft: '4px',
                  whiteSpace: 'nowrap',
                  lineHeight: '1.2'
                }}
              >
                 {getCompanyName()}
              </span>
            </div>

             
             
            
            <div className="collapse navbar-collapse d-none d-lg-flex" id="topnav-menu-content">
              <ul className="navbar-nav" style={{ padding: '0', height: '28px', alignItems: 'center' }}>
                <li className="nav-item dropdown">
                <a href="/dashboard" target="_blank" rel="noopener noreferrer" className="nav-link" style={{ padding: '2px 6px', fontSize: '11px', height: '24px', display: 'flex', alignItems: 'center' }}>
                      {props.t("Dashboard")}
                    </a>
                  
                </li>

                {/* Vertical Layout Sidebar Content - Masters Section */}
                <li className="nav-item dropdown" onMouseLeave={() => setmasters(false)}>
                  <a
                    className="nav-link dropdown-toggle arrow-none"
                    style={{ padding: '2px 6px', fontSize: '11px', height: '24px', display: 'flex', alignItems: 'center' }}
                    href="/#"
                    onClick={e => {
                      e.preventDefault();
                      setmasters(!masters);
                      settransaction(false);
                      setreports(false);
                    }}
                  >
                    <i className="bx bx-store me-1" style={{ fontSize: '10px' }}></i>
                    {props.t("Masters")} <div className="arrow-down" style={{ fontSize: '8px' }}></div>
                  </a>
                  <div className={classname("dropdown-menu", { show: masters })}>
                    <a href="/ItemMaster" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setmasters(false)}>
                      {props.t("Item Master")}
                    </a>
                    <a href="/PartyAccountMaster" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setmasters(false)}>
                      {props.t("Party Acc Master")}
                    </a>
                    <a href="/LedgerMaster" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setmasters(false)}>
                      {props.t("Bro Dr/Cr Master")}
                    </a>
                    <a href="/UnitMaster" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setmasters(false)}>
                      {props.t("Unit Master")}
                    </a>
                    <a href="/TransportMaster" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setmasters(false)}>
                      {props.t("Transport Master")}
                    </a>
                 
                    {/* <a href="/StateMaster" target="_blank" rel="noopener noreferrer" className="dropdown-item">
                      {props.t("State Master")}
                    </a> */}
                  </div>
                </li>

                {/* Vertical Layout Sidebar Content - Transaction Section */}
                <li className="nav-item dropdown" onMouseLeave={() => settransaction(false)}>
                  <a
                    className="nav-link dropdown-toggle arrow-none"
                    style={{ padding: '2px 6px', fontSize: '11px', height: '24px', display: 'flex', alignItems: 'center' }}
                    href="/#"
                    onClick={e => {
                      e.preventDefault();
                      settransaction(!transaction);
                      setmasters(false);
                      setreports(false);
                    }}
                  >
                    <i className="bx bx-file me-1" style={{ fontSize: '10px' }}></i>
                    {props.t("Transaction")} <div className="arrow-down" style={{ fontSize: '8px' }}></div>
                  </a>
                  <div className={classname("dropdown-menu", { show: transaction })}>
                    <a href="/Contract" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => settransaction(false)}>
                      {props.t("Contract")}
                    </a>
                    <a href="/UpdateGlobalOptions" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => settransaction(false)}>
                      {props.t("Firm Master")}
                    </a>

                   
                  </div>
                </li>

                {/* Vertical Layout Sidebar Content - Reports Section */}
                <li className="nav-item dropdown" onMouseLeave={() => setreports(false)}>
                  <a
                    className="nav-link dropdown-toggle arrow-none"
                    style={{ padding: '2px 6px', fontSize: '11px', height: '24px', display: 'flex', alignItems: 'center' }}
                    href="/#"
                    onClick={e => {
                      e.preventDefault();
                      setreports(!reports);
                      setmasters(false);
                      settransaction(false);
                    }}
                  >
                    <i className="bx bx-file-find me-1" style={{ fontSize: '10px' }}></i>
                    {props.t("Reports")} <div className="arrow-down" style={{ fontSize: '8px' }}></div>
                  </a>
                  <div className={classname("dropdown-menu", { show: reports })}>
                  <a href="/NewLedgerReport" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setreports(false)}>
                      {props.t("Ledger List")}
                    </a>

                    <a href="/MultiPrint" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setreports(false)}>
                      {props.t("Multi Print")}
                    </a>
                    
                   
                    <a href="/ContractRegister" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setreports(false)}>
                      {props.t("Contract Register")}
                    </a>
                    <a href="/BrokerageCalculation" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setreports(false)}>
                      {props.t("Bro Dr/Cr Register")}
                    </a>
                    <a href="/VoucherList" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setreports(false)}>
                      {props.t("Brokerage Voucher Register")}
                    </a>
                    <a href="/LinkCreateRegister" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setreports(false)}>
                      {props.t("Link Register")}
                    </a>
                    <a href="/LinkRegisterShow" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setreports(false)}>
                      {props.t("Link Register Show")}
                    </a>
                    <a href="/ReminderData" target="_blank" rel="noopener noreferrer" className="dropdown-item" onClick={() => setreports(false)}>
                      {props.t("Reminder Data")}
                    </a>

                    
                  </div>
                </li>
              </ul>
            </div>
            
            {/* Logout Button - Hide when toggle button is visible (mobile), show when toggle hidden (desktop) */}
            {showLogout && (
              <div className="navbar-nav ms-auto">
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => {
                    localStorage.removeItem("authUser");
                    window.location.href = "/logout";
                  }}
                  style={{ 
                    padding: '2px 6px', 
                    fontSize: '10px', 
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    minWidth: '50px'
                  }}
                >
                  <i className="bx bx-power-off me-1" style={{ fontSize: '10px' }} />
                  <span className="d-none d-xl-inline-block">Logout</span>
                </button>
              </div>
            )}
          </nav>
        </div>
      </div>
    </React.Fragment>
  );
};

Navbar.propTypes = {
  leftMenu: PropTypes.any,
  location: PropTypes.any,
  menuOpen: PropTypes.any,
  t: PropTypes.any,
  toggleLeftmenu: PropTypes.func,
};

const mapStatetoProps = state => {
  const { leftMenu } = state.Layout;
  return { leftMenu };
};

const mapDispatchToProps = dispatch => {
  return {
    toggleLeftmenu: (value) => dispatch(toggleLeftmenu(value))
  };
};

export default withRouter(
  connect(mapStatetoProps, mapDispatchToProps)(withTranslation()(Navbar))
);
