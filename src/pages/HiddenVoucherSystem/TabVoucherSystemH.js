import React, { useState } from 'react';
import { Container, Nav, NavItem, NavLink, TabContent, TabPane, Modal, ModalHeader, ModalBody } from 'reactstrap';
import classnames from 'classnames';
import VoucherRegisterH from './VoucherRegisterH';
import LedgerRegisterH from './LedgerRegisterH';
import LedgerListH from './LedgerListH';
import VoucherH from './VoucherH';

const TabVoucherSystemH = () => {
    const [activeTab, setActiveTab] = useState('voucher');
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [refreshKey, setRefreshKey] = useState(0);

    const toggleTab = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handleVoucherSaved = () => {
        setShowVoucherModal(false);
        setRefreshKey(prev => prev + 1);
    };

    return (
        <div className="tab-voucher-system-h">
            <style>{`
                @media (min-width: 769px) {
                    .tab-voucher-system-h {
                        padding-top: 46px;
                    }
                }
                .mobile-tabs {
                    flex-wrap: nowrap;
                    overflow-x: auto;
                    -webkit-overflow-scrolling: touch;
                    scrollbar-width: none;
                }
                .mobile-tabs::-webkit-scrollbar {
                    display: none;
                }
                .mobile-tabs .nav-link {
                    white-space: nowrap;
                    padding: 0.5rem 0.5rem;
                    font-size: 14px;
                }
                @media (min-width: 769px) {
                    .mobile-tabs .nav-link {
                        padding: 0.5rem 1rem;
                        font-size: 16px;
                    }
                }
            `}</style>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-3 text-nowrap">
                    <Nav tabs className="flex-grow-1 border-bottom-0 mobile-tabs">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === 'voucher' }, "fw-bold")}
                                onClick={() => toggleTab('voucher')}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="d-none d-md-inline">Voucher Register (H)</span>
                                <span className="d-inline d-md-none">Voucher (H)</span>
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === 'ledger' }, "fw-bold")}
                                onClick={() => toggleTab('ledger')}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="d-none d-md-inline">Ledger Register (H)</span>
                                <span className="d-inline d-md-none">L. Reg (H)</span>
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === 'ledgerList' }, "fw-bold")}
                                onClick={() => toggleTab('ledgerList')}
                                style={{ cursor: 'pointer' }}
                            >
                                <span className="d-none d-md-inline">Ledgers (H)</span>
                                <span className="d-inline d-md-none">Ledgers (H)</span>
                            </NavLink>
                        </NavItem>
                    </Nav>
                    <button
                        className="btn btn-danger d-flex align-items-center rounded-circle px-2 shadow-lg flex-shrink-0"
                        onClick={() => setShowVoucherModal(true)}
                        title="Create New Voucher (H)"
                        style={{ width: '40px', height: '40px', justifyContent: 'center', marginLeft: '5px' }}
                    >
                        <i className="bx bx-plus font-size-22"></i>
                    </button>
                </div>

                <TabContent activeTab={activeTab}>
                    <TabPane tabId="voucher">
                        <VoucherRegisterH key={`voucher-${refreshKey}`} onVoucherUpdate={() => setRefreshKey(prev => prev + 1)} />
                    </TabPane>
                    <TabPane tabId="ledger">
                        <LedgerRegisterH key={`ledger-${refreshKey}`} />
                    </TabPane>
                    <TabPane tabId="ledgerList">
                        <LedgerListH key={`ledgerList-${refreshKey}`} />
                    </TabPane>
                </TabContent>

                <Modal
                    isOpen={showVoucherModal}
                    toggle={() => setShowVoucherModal(!showVoucherModal)}
                    size="xl"
                    scrollable={true}
                >
                    <ModalHeader toggle={() => setShowVoucherModal(!showVoucherModal)} className="bg-danger text-white">
                        <span className="text-white">Create New Hidden Voucher</span>
                    </ModalHeader>
                    <ModalBody>
                        <VoucherH onSaveSuccess={handleVoucherSaved} />
                    </ModalBody>
                </Modal>
            </Container>
        </div>
    );
};

export default TabVoucherSystemH;
