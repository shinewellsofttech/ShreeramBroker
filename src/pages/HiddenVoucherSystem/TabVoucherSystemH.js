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
            `}</style>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <Nav tabs className="flex-grow-1 border-bottom-0">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === 'voucher' }, "fw-bold")}
                                onClick={() => toggleTab('voucher')}
                                style={{ cursor: 'pointer' }}
                            >
                                Voucher Register (H)
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === 'ledger' }, "fw-bold")}
                                onClick={() => toggleTab('ledger')}
                                style={{ cursor: 'pointer' }}
                            >
                                Ledger Register (H)
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === 'ledgerList' }, "fw-bold")}
                                onClick={() => toggleTab('ledgerList')}
                                style={{ cursor: 'pointer' }}
                            >
                                Ledgers (H)
                            </NavLink>
                        </NavItem>
                    </Nav>
                    <button
                        className="btn btn-danger d-flex align-items-center rounded-circle px-2 shadow-lg"
                        onClick={() => setShowVoucherModal(true)}
                        title="Create New Voucher (H)"
                        style={{ width: '45px', height: '45px', justifyContent: 'center', marginLeft: '10px' }}
                    >
                        <i className="bx bx-plus font-size-24"></i>
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
