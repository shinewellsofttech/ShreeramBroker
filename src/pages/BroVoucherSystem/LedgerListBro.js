import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, Input, Button, Table, Spinner, Badge, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { Fn_FillListData } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';
import AddEdit_LedgerMaster from '../Masters/AddEdit_LedgerMaster';

const LedgerListBro = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [state, setState] = useState({
        ledgerData: [],
        loading: true,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalId, setModalId] = useState(0);

    const fetchDataList = useCallback(async () => {
        try {
            await Fn_FillListData(
                dispatch,
                setState,
                'ledgerData',
                `${API_WEB_URLS?.MASTER || ''}/0/token/BroLedgers/Id/0`
            );
        } catch (error) {
            console.error('Error fetching ledger data:', error);
        } finally {
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [dispatch]);

    useEffect(() => {
        fetchDataList();
    }, [fetchDataList]);

    const handleEdit = (id) => {
        setModalId(id);
        setModalOpen(true);
    };

    const handleAddNew = () => {
        setModalId(0);
        setModalOpen(true);
    };

    const handleModalSuccess = () => {
        setModalOpen(false);
        setState(prev => ({ ...prev, loading: true }));
        fetchDataList();
    };

    const filteredData = useMemo(() => {
        let data = state.ledgerData || [];
        if (statusFilter === 'active') {
            data = data.filter(item => item.IsActive === true);
        } else if (statusFilter === 'inactive') {
            data = data.filter(item => item.IsActive !== true);
        }

        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.Name && item.Name.toLowerCase().includes(lowerQuery)) ||
                (item.Person && item.Person.toLowerCase().includes(lowerQuery)) ||
                (item.GSTNo && item.GSTNo.toLowerCase().includes(lowerQuery))
            );
        }
        return data;
    }, [state.ledgerData, searchQuery, statusFilter]);

    if (state.loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
                <Spinner color="primary" />
            </div>
        );
    }

    return (
        <Card>
            <CardBody>
                <div style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: "10px", marginBottom: "15px" }}>
                    <div className="d-flex align-items-center gap-2" style={{ minWidth: "max-content" }}>
                        <div className="d-flex align-items-center bg-white border rounded p-1">
                            <Button
                                color={statusFilter === 'all' ? 'primary' : 'light'}
                                size="sm"
                                className="px-3"
                                onClick={() => setStatusFilter('all')}
                            >
                                All
                            </Button>
                            <Button
                                color={statusFilter === 'active' ? 'primary' : 'light'}
                                size="sm"
                                className="px-3 mx-1"
                                onClick={() => setStatusFilter('active')}
                            >
                                Active
                            </Button>
                            <Button
                                color={statusFilter === 'inactive' ? 'primary' : 'light'}
                                size="sm"
                                className="px-3"
                                onClick={() => setStatusFilter('inactive')}
                            >
                                Inactive
                            </Button>
                        </div>
                        <Input
                            type="text"
                            placeholder="Search by name, person, or GST..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            bsSize="sm"
                            style={{ width: "250px" }}
                        />
                        <div className="d-flex gap-2">
                            <Button color="success" size="sm" onClick={handleAddNew} style={{ whiteSpace: "nowrap" }}>
                                <i className="bx bx-plus me-1"></i> Add Ledger
                            </Button>
                            <Button color="primary" size="sm" onClick={fetchDataList} title="Refresh Data">
                                <i className="bx bx-refresh"></i>
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: '60vh', border: '1px solid #EFF2F7', borderRadius: '4px' }}>
                    <Table hover className="align-middle table-nowrap mb-0 table-sm text-nowrap">
                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ backgroundColor: '#f8f9fa', width: '60px' }}>#</th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>Company Name</th>
                                <th className="text-center" style={{ backgroundColor: '#f8f9fa', width: '120px' }}>Status</th>
                                <th className="text-center" style={{ backgroundColor: '#f8f9fa', width: '80px' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <tr key={item.Id || index}>
                                        <th scope="row">{index + 1}</th>
                                        <td className="fw-bold" style={{ whiteSpace: 'normal', minWidth: '200px' }}>{item.Name || 'N/A'}</td>
                                        <td className="text-center">
                                            <Badge color={item.IsActive ? "success" : "danger"} pill>
                                                {item.IsActive ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                color="soft-info"
                                                size="sm"
                                                onClick={() => handleEdit(item.Id)}
                                                title="Edit Ledger"
                                            >
                                                <i className="bx bx-edit font-size-14"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="text-center text-muted">No ledger data found</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            </CardBody>

            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="xl" scrollable>
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>
                    {modalId > 0 ? "Edit Ledger" : "Add New Ledger"}
                </ModalHeader>
                <ModalBody>
                    {modalOpen && (
                        <AddEdit_LedgerMaster
                            isModal={true}
                            modalId={modalId}
                            defaultGroup={38}
                            onSuccess={handleModalSuccess}
                            onCancel={() => setModalOpen(false)}
                        />
                    )}
                </ModalBody>
            </Modal>
        </Card>
    );
};

export default LedgerListBro;
