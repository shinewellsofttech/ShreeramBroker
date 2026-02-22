import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bell, DollarSign, Link2, Plus, Users, List, FileText } from 'react-feather';

const NavigationFooter = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <React.Fragment>
      <style>{`
        .mobile-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #0d6efd;
          border-top: 1px solid #e0e0e0;
          box-shadow: 0 -2px 10px rgba(0,0,0,0.1);
          z-index: 1000;
          padding: 8px 0;
        }
        .mobile-footer-nav {
          display: flex;
          justify-content: space-around;
          align-items: center;
          max-width: 100%;
          overflow-x: auto;
          padding: 0 4px;
        }
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 4px 8px;
          min-width: 50px;
          cursor: pointer;
          transition: all 0.2s ease;
          text-decoration: none;
          color: #ffffff;
          position: relative;
        }
        .mobile-nav-item:hover {
          opacity: 0.8;
        }
        .mobile-nav-item:active {
          transform: scale(0.95);
        }
        .mobile-nav-item svg {
          margin-bottom: 2px;
        }
        .icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 4px;
          transition: all 0.2s ease;
        }
        .mobile-nav-item:hover .icon-wrapper {
          transform: scale(1.1);
        }
        .icon-reminder {
          background-color: #FF6B6B;
        }
        .icon-brokerage {
          background-color: #4ECDC4;
        }
        .icon-link {
          background-color: #95E1D3;
        }
        .icon-party {
          background-color: #F38181;
        }
        .icon-ledger {
          background-color: #AA96DA;
        }
        .icon-contract {
          background-color: #FCBAD3;
        }
        .icon-wrapper svg {
          color: #ffffff;
          stroke-width: 2.5;
        }
        .mobile-nav-item.active .icon-wrapper {
          box-shadow: 0 0 0 3px #ffc107;
        }
        .mobile-nav-label {
          font-size: 9px;
          text-align: center;
          font-weight: 500;
          line-height: 1.2;
          color: #ffffff;
        }
        .mobile-nav-item.active .mobile-nav-label {
          color: #ffc107;
          font-weight: 600;
        }
        .center-button {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 56px;
          height: 56px;
          background: #ffffff;
          border-radius: 50%;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          border: 3px solid #ffffff;
          margin-top: -8px;
        }
        .center-button:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }
        .center-button:active {
          transform: scale(0.95);
        }
        .center-button svg {
          color: #000000;
          stroke-width: 3;
        }
        .main-content {
          padding-bottom: 80px;
        }
        @media (min-width: 769px) {
          .mobile-footer {
            display: none;
          }
          .main-content {
            padding-bottom: 0;
          }
        }
      `}</style>
      
      <div className="mobile-footer">
        <div className="mobile-footer-nav">
          {/* Reminder - Dashboard */}
          <div 
            className={`mobile-nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}
            onClick={() => navigate('/dashboard')}
          >
            <div className="icon-wrapper icon-reminder">
              <Bell size={20} />
            </div>
            <span className="mobile-nav-label">Reminder</span>
          </div>
          
          {/* Brokerage - BrokerageCalculation */}
          <div 
            className={`mobile-nav-item ${location.pathname === '/BrokerageCalculation' ? 'active' : ''}`}
            onClick={() => navigate('/BrokerageCalculation')}
          >
            <div className="icon-wrapper icon-brokerage">
              <DollarSign size={20} />
            </div>
            <span className="mobile-nav-label">Brokerage</span>
          </div>
          
          {/* Link - LinkCreateRegister */}
          <div 
            className={`mobile-nav-item ${location.pathname === '/LinkCreateRegister' ? 'active' : ''}`}
            onClick={() => navigate('/LinkCreateRegister')}
          >
            <div className="icon-wrapper icon-link">
              <Link2 size={20} />
            </div>
            <span className="mobile-nav-label">Link</span>
          </div>
          
          {/* Center + Button - Contract */}
          <div 
            className="center-button"
            onClick={() => navigate('/Contract')}
          >
            <Plus size={28} />
          </div>
          
          {/* Party - PartyAccountMaster */}
          <div 
            className={`mobile-nav-item ${location.pathname === '/PartyAccountMaster' ? 'active' : ''}`}
            onClick={() => navigate('/PartyAccountMaster')}
          >
            <div className="icon-wrapper icon-party">
              <Users size={20} />
            </div>
            <span className="mobile-nav-label">Party</span>
          </div>
          
          {/* Ledger - NewLedgerReport */}
          <div 
            className={`mobile-nav-item ${location.pathname === '/NewLedgerReport' ? 'active' : ''}`}
            onClick={() => navigate('/NewLedgerReport')}
          >
            <div className="icon-wrapper icon-ledger">
              <List size={20} />
            </div>
            <span className="mobile-nav-label">Ledger</span>
          </div>
          
          {/* Contract - ContractRegister */}
          <div 
            className={`mobile-nav-item ${location.pathname === '/ContractRegister' ? 'active' : ''}`}
            onClick={() => navigate('/ContractRegister')}
          >
            <div className="icon-wrapper icon-contract">
              <FileText size={20} />
            </div>
            <span className="mobile-nav-label">Contract</span>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

export default NavigationFooter;

