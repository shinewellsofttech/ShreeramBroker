import React, { useState } from "react";
import PropTypes from "prop-types";
import { withTranslation } from "react-i18next";
import classname from "classnames";

const MobileSidebar = ({ isOpen, onClose, t }) => {
  const [masters, setmasters] = useState(false);
  const [transaction, settransaction] = useState(false);
  const [reports, setreports] = useState(false);

  const handleClose = () => {
    setmasters(false);
    settransaction(false);
    setreports(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="mobile-sidebar-overlay"
        onClick={handleClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 1040,
        }}
      />

      {/* Sidebar */}
      <div
        className="mobile-sidebar"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          bottom: 0,
          width: "280px",
          backgroundColor: "#fff",
          zIndex: 1050,
          overflowY: "auto",
          boxShadow: "2px 0 8px rgba(0,0,0,0.15)",
          transform: isOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.3s ease-in-out",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px",
            borderBottom: "1px solid #e9ecef",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            backgroundColor: "#f8f9fa",
          }}
        >
          <h5 style={{ margin: 0, fontSize: "16px", fontWeight: "600" }}>
            Menu
          </h5>
          <button
            onClick={handleClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              padding: "0",
              width: "30px",
              height: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#495057",
            }}
          >
            <i className="fa fa-times"></i>
          </button>
        </div>

        {/* Menu Items */}
        <div style={{ padding: "8px 0" }}>
          {/* Dashboard */}
          <div style={{ padding: "0 16px" }}>
            <a
              href="/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                padding: "12px 0",
                color: "#495057",
                textDecoration: "none",
                fontSize: "14px",
                fontWeight: "500",
                borderBottom: "1px solid #e9ecef",
              }}
              onClick={handleClose}
            >
              <i className="bx bx-home-circle me-2" style={{ fontSize: "18px" }}></i>
              {t("Dashboard")}
            </a>
          </div>

          {/* Masters */}
          <div style={{ padding: "0 16px" }}>
            <div
              onClick={() => setmasters(!masters)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                cursor: "pointer",
                borderBottom: "1px solid #e9ecef",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#495057" }}>
                <i className="bx bx-store me-2" style={{ fontSize: "18px" }}></i>
                {t("Masters")}
              </span>
              <i className={`fa fa-chevron-${masters ? "down" : "right"}`} style={{ fontSize: "12px", color: "#6c757d" }}></i>
            </div>
            <div
              className={classname("submenu", { show: masters })}
              style={{
                maxHeight: masters ? "500px" : "0",
                overflow: "hidden",
                transition: "max-height 0.3s ease-in-out",
                backgroundColor: "#f8f9fa",
                marginLeft: "-16px",
                marginRight: "-16px",
                paddingLeft: "32px",
              }}
            >
              <a
                href="/ItemMaster"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Item Master")}
              </a>
              <a
                href="/PartyAccountMaster"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Party Acc Master")}
              </a>
              <a
                href="/LedgerMaster"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Bro Dr/Cr Master")}
              </a>
              <a
                href="/UnitMaster"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Unit Master")}
              </a>
              <a
                href="/TransportMaster"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Transport Master")}
              </a>
            </div>
          </div>

          {/* Transaction */}
          <div style={{ padding: "0 16px" }}>
            <div
              onClick={() => settransaction(!transaction)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                cursor: "pointer",
                borderBottom: "1px solid #e9ecef",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#495057" }}>
                <i className="bx bx-file me-2" style={{ fontSize: "18px" }}></i>
                {t("Transaction")}
              </span>
              <i className={`fa fa-chevron-${transaction ? "down" : "right"}`} style={{ fontSize: "12px", color: "#6c757d" }}></i>
            </div>
            <div
              className={classname("submenu", { show: transaction })}
              style={{
                maxHeight: transaction ? "500px" : "0",
                overflow: "hidden",
                transition: "max-height 0.3s ease-in-out",
                backgroundColor: "#f8f9fa",
                marginLeft: "-16px",
                marginRight: "-16px",
                paddingLeft: "32px",
              }}
            >
              <a
                href="/Contract"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Contract")}
              </a>
              <a
                href="/UpdateGlobalOptions"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Firm Master")}
              </a>
            </div>
          </div>

          {/* Reports */}
          <div style={{ padding: "0 16px" }}>
            <div
              onClick={() => setreports(!reports)}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "12px 0",
                cursor: "pointer",
                borderBottom: "1px solid #e9ecef",
              }}
            >
              <span style={{ fontSize: "14px", fontWeight: "500", color: "#495057" }}>
                <i className="bx bx-file-find me-2" style={{ fontSize: "18px" }}></i>
                {t("Reports")}
              </span>
              <i className={`fa fa-chevron-${reports ? "down" : "right"}`} style={{ fontSize: "12px", color: "#6c757d" }}></i>
            </div>
            <div
              className={classname("submenu", { show: reports })}
              style={{
                maxHeight: reports ? "1000px" : "0",
                overflow: "hidden",
                transition: "max-height 0.3s ease-in-out",
                backgroundColor: "#f8f9fa",
                marginLeft: "-16px",
                marginRight: "-16px",
                paddingLeft: "32px",
              }}
            >
              <a
                href="/NewLedgerReport"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Ledger List")}
              </a>
              <a
                href="/MultiPrint"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Multi Print")}
              </a>
              <a
                href="/ContractRegister"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Contract Register")}
              </a>
              <a
                href="/BrokerageCalculation"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Bro Dr/Cr Register")}
              </a>
              <a
                href="/VoucherList"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Brokerage Voucher Register")}
              </a>
              <a
                href="/LinkCreateRegister"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Link Register")}
              </a>
              <a
                href="/LinkRegisterShow"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "block",
                  padding: "10px 16px",
                  color: "#6c757d",
                  textDecoration: "none",
                  fontSize: "13px",
                }}
                onClick={handleClose}
              >
                {t("Link Register Show")}
              </a>
            </div>
          </div>

          {/* Logout Button */}
          <div style={{ padding: "0 16px", marginTop: "16px" }}>
            <button
              type="button"
              onClick={() => {
                localStorage.removeItem("authUser");
                window.location.href = "/logout";
              }}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "12px",
                backgroundColor: "#dc3545",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
              }}
            >
              <i className="bx bx-power-off me-2" style={{ fontSize: "18px" }}></i>
              {t("Logout")}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

MobileSidebar.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  t: PropTypes.func.isRequired,
};

export default withTranslation()(MobileSidebar);

