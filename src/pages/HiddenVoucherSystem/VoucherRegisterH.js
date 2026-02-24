import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, CardBody, Input, Button, Table, Spinner, Badge, Modal, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import { useDispatch, useSelector } from 'react-redux';
import { Fn_GetReport } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';
import VoucherH from './VoucherH';

const formatDateLocal = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const VoucherRegisterH = ({ onVoucherUpdate }) => {
    const dispatch = useDispatch();
    const globalDates = useSelector(state => state.GlobalDates);

    const [voucherData, setVoucherData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(globalDates?.fromDate || '');
    const [toDate, setToDate] = useState(globalDates?.toDate || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [selectedVoucherId, setSelectedVoucherId] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    const API_URL = `VoucherListNew/0/token`;

    const fetchData = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("FromDate", formatDateLocal(fromDate));
            formData.append("ToDate", formatDateLocal(toDate));

            await Fn_GetReport(dispatch, setVoucherData,
                "tenderData", API_URL, { arguList: { id: 0, formData: formData } }, true);
        } catch (error) {
            console.error('Error fetching hidden vouchers:', error);
            setVoucherData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (globalDates?.fromDate && globalDates?.toDate) {
            setFromDate(globalDates.fromDate);
            setToDate(globalDates.toDate);
        }
    }, [globalDates?.fromDate, globalDates?.toDate]);

    useEffect(() => {
        if (fromDate && toDate) {
            fetchData();
        }
    }, [fromDate, toDate]);

    const handleEdit = (id) => {
        setSelectedVoucherId(id);
        setShowEditModal(true);
    };

    const handleSaveSuccess = () => {
        setShowEditModal(false);
        fetchData();
        if (onVoucherUpdate) onVoucherUpdate();
    };

    const filteredData = useMemo(() => {
        let data = voucherData || [];
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.VoucherNo && String(item.VoucherNo).toLowerCase().includes(lowerQuery)) ||
                (item.DrLedgerName && item.DrLedgerName.toLowerCase().includes(lowerQuery)) ||
                (item.CrLedgerName && item.CrLedgerName.toLowerCase().includes(lowerQuery)) ||
                (item.Remark && item.Remark.toLowerCase().includes(lowerQuery))
            );
        }
        return data;
    }, [voucherData, searchQuery]);

    const toggleSelectAll = () => {
        if (selectedItems.size === filteredData.length && filteredData.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredData.map((_, i) => i)));
        }
    };

    const toggleSelectItem = (index, e) => {
        if (e) e.stopPropagation();
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    const handleExportExcel = () => {
        if (selectedItems.size === 0) return;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += 'Voucher No,Date,Dr Ledger,Cr Ledger,Rate1,Rate2,Qty,Remark,Amount\n';
        let totalAmount = 0;
        Array.from(selectedItems).forEach(idx => {
            const item = filteredData[idx];
            totalAmount += (item.TotalAmount || 0);
            const date = item.VoucherDate ? new Date(item.VoucherDate).toLocaleDateString() : '';
            const remark = item.Remark ? `"${item.Remark.replace(/"/g, '""')}"` : '';
            csvContent += `="${item.VoucherNo || ''}","${date}","${item.DrLedgerName || ''}","${item.CrLedgerName || ''}","${item.Rate1 || ''}","${item.Rate2 || ''}","${item.Qty || ''}",${remark},${item.TotalAmount || 0}\n`;
        });
        csvContent += `,,,,,,,,Total,${totalAmount.toFixed(2)}\n`;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `VoucherRegisterH_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    let totalSelectedAmount = 0;
    selectedItems.forEach(idx => {
        const item = filteredData[idx];
        if (item) totalSelectedAmount += (item.TotalAmount || 0);
    });

    return (
        <Card>
            <CardBody>
                <div style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: "10px", marginBottom: "15px" }}>
                    <div className="d-flex align-items-center gap-2" style={{ minWidth: "max-content" }}>
                        <div className="d-flex align-items-center">
                            <Input type="date" value={formatDateLocal(fromDate)} onChange={(e) => setFromDate(e.target.value)} bsSize="sm" style={{ width: "130px" }} />
                            <span className="mx-2 font-size-12 fw-medium text-muted">To</span>
                            <Input type="date" value={formatDateLocal(toDate)} onChange={(e) => setToDate(e.target.value)} bsSize="sm" style={{ width: "130px" }} />
                        </div>
                        <Input type="text" placeholder="Search by No, Ledger, Remark..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} bsSize="sm" style={{ width: "230px" }} />
                        <div className="d-flex gap-2">
                            <Button color="info" size="sm" onClick={handleExportExcel} disabled={selectedItems.size === 0} style={{ whiteSpace: "nowrap" }}>
                                Export {selectedItems.size > 0 && `(${selectedItems.size})`}
                            </Button>
                            <Button color="primary" size="sm" onClick={fetchData} title="Refresh Data">
                                <i className="bx bx-refresh"></i>
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Responsive Table Container */}
                <div className="table-responsive" style={{ maxHeight: '60vh', border: '1px solid #EFF2F7', borderRadius: '4px' }}>
                    <Table hover className="align-middle table-nowrap mb-0 table-sm text-nowrap">
                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                                    <input type="checkbox" checked={selectedItems.size === filteredData.length && filteredData.length > 0} onChange={toggleSelectAll} />
                                </th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>Date</th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>No</th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>Dr Ledger</th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>Cr Ledger</th>
                                <th className="text-end" style={{ backgroundColor: '#f8f9fa' }}>Amount</th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>Details</th>
                                <th className="text-center" style={{ backgroundColor: '#f8f9fa' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4"><Spinner color="primary" size="sm" /></td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4 text-muted">No vouchers found for this period.</td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={index} onDoubleClick={() => handleEdit(item.Id)} style={{ cursor: 'pointer', backgroundColor: selectedItems.has(index) ? 'rgba(0, 123, 255, 0.05)' : '' }}>
                                        <td className="text-center" onClick={(e) => toggleSelectItem(index, e)}>
                                            <input type="checkbox" checked={selectedItems.has(index)} onChange={(e) => toggleSelectItem(index, e)} />
                                        </td>
                                        <td>{item.VoucherDate ? new Date(item.VoucherDate).toLocaleDateString('en-GB') : '-'}</td>
                                        <td><Badge color="soft-primary" className="font-size-12">#{item.VoucherNo}</Badge></td>
                                        <td className="fw-bold text-danger" style={{ whiteSpace: 'normal', minWidth: '150px' }}>{item.DrLedgerName}</td>
                                        <td className="fw-bold text-success" style={{ whiteSpace: 'normal', minWidth: '150px' }}>{item.CrLedgerName}</td>
                                        <td className="text-end">
                                            <div className="fw-bold text-primary">₹{parseFloat(item.TotalAmount || 0).toLocaleString()}</div>
                                            <div className="text-muted font-size-10">
                                                {item.Qty} x ({item.Rate1} - {item.Rate2})
                                            </div>
                                        </td>
                                        <td style={{ minWidth: '250px', whiteSpace: 'normal' }}>
                                            {item.Remark && item.Remark.split('|').map((part, pIdx) => (
                                                <div
                                                    key={pIdx}
                                                    className="p-1 mb-1 rounded text-wrap"
                                                    style={{
                                                        backgroundColor: pIdx === 0 ? '#e3f2fd' : '#ffebee',
                                                        color: pIdx === 0 ? '#0d47a1' : '#b71c1c',
                                                        fontSize: '11px',
                                                        lineHeight: '1.2'
                                                    }}
                                                >
                                                    {part.trim()}
                                                </div>
                                            ))}
                                        </td>
                                        <td className="text-center">
                                            <Button color="soft-info" size="sm" onClick={(e) => { e.stopPropagation(); handleEdit(item.Id); }} title="Edit Voucher">
                                                <i className="bx bx-edit font-size-14"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>

                {selectedItems.size > 0 && (
                    <div className="mt-3 p-2 bg-light border rounded d-flex justify-content-between align-items-center">
                        <span className="fw-bold text-primary">Selected: {selectedItems.size}</span>
                        <span className="fw-bold text-success">Total: ₹{totalSelectedAmount.toLocaleString()}</span>
                    </div>
                )}
            </CardBody>

            <Modal isOpen={showEditModal} toggle={() => setShowEditModal(!showEditModal)} size="xl" scrollable>
                <ModalHeader toggle={() => setShowEditModal(!showEditModal)}>Edit Voucher (H)</ModalHeader>
                <ModalBody>
                    {showEditModal && <VoucherH voucherId={selectedVoucherId} onSaveSuccess={handleSaveSuccess} />}
                </ModalBody>
            </Modal>
        </Card>
    );
};

export default VoucherRegisterH;
