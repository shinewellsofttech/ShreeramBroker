import React, { useState } from 'react';
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, Modal, ModalHeader, ModalBody } from 'reactstrap';
import classnames from 'classnames';
import VoucherRegisterBro from './VoucherRegisterBro';
import LedgerRegisterBro from './LedgerRegisterBro';
import LedgerListBro from './LedgerListBro';
import VoucherBro from './VoucherBro';

const TabVoucherSystemBro = () => {
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
        <div className="tab-voucher-system">
            <style>{`
                @media (min-width: 769px) {
                    .tab-voucher-system {
                        padding-top: 46px;
                    }
                }
            `}</style>
            <Container fluid>
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <Nav tabs className="flex-grow-1">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === 'voucher' })}
                                onClick={() => toggleTab('voucher')}
                                style={{ cursor: 'pointer' }}
                            >
                                Voucher Register
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === 'ledger' })}
                                onClick={() => toggleTab('ledger')}
                                style={{ cursor: 'pointer' }}
                            >
                                Ledger Register
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === 'ledgerListNew' })}
                                onClick={() => toggleTab('ledgerListNew')}
                                style={{ cursor: 'pointer' }}
                            >
                                Ledger
                            </NavLink>
                        </NavItem>
                    </Nav>
                    <button
                        className="btn btn-primary d-flex align-items-center rounded-circle px-2 ml-2"
                        onClick={() => setShowVoucherModal(true)}
                        title="Create New Voucher"
                        style={{ width: '40px', height: '40px', justifyContent: 'center', marginLeft: '10px' }}
                    >
                        <i className="bx bx-plus font-size-20"></i>
                    </button>
                </div>

                <TabContent activeTab={activeTab}>
                    <TabPane tabId="voucher">
                        <VoucherRegisterBro key={`voucher-${refreshKey}`} onVoucherUpdate={() => setRefreshKey(prev => prev + 1)} />
                    </TabPane>
                    <TabPane tabId="ledger">
                        <LedgerRegisterBro key={`ledger-${refreshKey}`} onVoucherUpdate={() => setRefreshKey(prev => prev + 1)} />
                    </TabPane>
                    <TabPane tabId="ledgerListNew">
                        <LedgerListBro key={`ledgerListNew-${refreshKey}`} />
                    </TabPane>
                </TabContent>

                <Modal
                    isOpen={showVoucherModal}
                    toggle={() => setShowVoucherModal(!showVoucherModal)}
                    size="xl"
                    scrollable={true}
                >
                    <ModalHeader toggle={() => setShowVoucherModal(!showVoucherModal)}>
                        Create New Voucher
                    </ModalHeader>
                    <ModalBody>
                        <VoucherBro onSaveSuccess={handleVoucherSaved} />
                    </ModalBody>
                </Modal>
            </Container>
        </div>
    );
};

export default TabVoucherSystemBro;
