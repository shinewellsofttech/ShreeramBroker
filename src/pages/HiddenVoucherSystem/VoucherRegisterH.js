import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, CardBody, Input, Button, Table, Spinner, Badge, Modal, ModalHeader, ModalBody, FormGroup, Label } from 'reactstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useDispatch, useSelector } from 'react-redux';
import { Fn_GetReport } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';
import VoucherH from './VoucherH';
import jsPDF from 'jspdf';
import { applyPlugin as applyAutoTable } from 'jspdf-autotable';
applyAutoTable(jsPDF);

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
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    const requestSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

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

    const sortedData = useMemo(() => {
        let sortableItems = [...filteredData];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];

                if (sortConfig.key === 'VoucherNo' || sortConfig.key === 'TotalAmount') {
                    aValue = parseFloat(aValue || 0);
                    bValue = parseFloat(bValue || 0);
                } else if (sortConfig.key === 'VoucherDate') {
                    aValue = new Date(aValue || 0).getTime();
                    bValue = new Date(bValue || 0).getTime();
                } else {
                    aValue = (aValue || '').toString().toLowerCase();
                    bValue = (bValue || '').toString().toLowerCase();
                }

                if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sortableItems;
    }, [filteredData, sortConfig]);

    const toggleSelectAll = () => {
        if (selectedItems.size === sortedData.length && sortedData.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(sortedData.map(item => item.Id)));
        }
    };

    const toggleSelectItem = (id, e) => {
        if (e) e.stopPropagation();
        const newSelected = new Set(selectedItems);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedItems(newSelected);
    };

    const handleExportExcel = () => {
        if (selectedItems.size === 0) return;
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += 'Voucher No,Date,Dr Ledger,Cr Ledger,Rate1,Rate2,Qty,Remark,Amount\n';
        let totalAmount = 0;

        const selectedElements = sortedData.filter(item => selectedItems.has(item.Id));
        selectedElements.forEach(item => {
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
    sortedData.forEach(item => {
        if (selectedItems.has(item.Id)) totalSelectedAmount += (item.TotalAmount || 0);
    });

    const getSortIcon = (key) => {
        if (sortConfig.key !== key) return <i className="bx bx-sort text-muted ms-1" style={{ opacity: 0.5 }}></i>;
        return sortConfig.direction === 'asc' ? <i className="bx bx-sort-up text-primary ms-1"></i> : <i className="bx bx-sort-down text-primary ms-1"></i>;
    };

    const handleSharePDF = async () => {
        if (selectedItems.size === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Voucher Register', 14, 15);
        doc.setFontSize(10);

        const periodText = `Period: ${fromDate ? new Date(fromDate).toLocaleDateString('en-GB') : ''} to ${toDate ? new Date(toDate).toLocaleDateString('en-GB') : ''}`;
        doc.text(periodText, 14, 22);

        const tableColumn = ["Date", "No", "Dr Ledger", "Cr Ledger", "Qty", "Amount"];
        const tableRows = [];

        let rowTotal = 0;

        const selectedElements = sortedData.filter(item => selectedItems.has(item.Id));
        selectedElements.forEach(item => {
            const date = item.VoucherDate ? new Date(item.VoucherDate).toLocaleDateString('en-GB') : '';
            const rowData = [
                date,
                item.VoucherNo || '',
                item.DrLedgerName || '',
                item.CrLedgerName || '',
                item.Qty || '',
                (item.TotalAmount || 0).toFixed(2)
            ];
            rowTotal += (item.TotalAmount || 0);
            tableRows.push(rowData);
        });

        tableRows.push([{ content: 'Total', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } }, { content: rowTotal.toFixed(2), styles: { fontStyle: 'bold' } }]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                5: { halign: 'right' }
            }
        });

        const pdfBlob = doc.output('blob');

        if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], "VoucherRegisterH.pdf", { type: "application/pdf" })] })) {
            const file = new File([pdfBlob], `VoucherRegisterH_${new Date().getTime()}.pdf`, { type: 'application/pdf' });
            try {
                await navigator.share({
                    title: 'Voucher Register',
                    files: [file]
                });
            } catch (error) {
                console.error("Error sharing PDF:", error);
                const pdfUrl = URL.createObjectURL(pdfBlob);
                window.open(pdfUrl, '_blank');
            }
        } else {
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
        }
    };

    return (
        <Card>
            <CardBody>
                <div style={{ overflowX: "auto", overflowY: "hidden", paddingBottom: "10px", marginBottom: "15px" }}>
                    <div className="d-flex align-items-center gap-2" style={{ minWidth: "max-content" }}>
                        <div className="d-flex align-items-center">
                            <DatePicker
                                selected={fromDate ? new Date(fromDate) : null}
                                onChange={(date) => setFromDate(date)}
                                className="form-control form-control-sm"
                                dateFormat="dd/MM/yyyy"
                                placeholderText="From Date"
                                openToDate={new Date()}
                                portalId="root-portal"
                                popperPlacement="bottom-start"
                            />
                            <span className="mx-2 font-size-12 fw-medium text-muted">To</span>
                            <DatePicker
                                selected={toDate ? new Date(toDate) : null}
                                onChange={(date) => setToDate(date)}
                                className="form-control form-control-sm"
                                dateFormat="dd/MM/yyyy"
                                placeholderText="To Date"
                                openToDate={new Date()}
                                portalId="root-portal"
                                popperPlacement="bottom-start"
                            />
                        </div>
                        <Input type="text" placeholder="Search by No, Ledger, Remark..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} bsSize="sm" style={{ width: "230px" }} />
                        {sortedData.length > 0 && (
                            <div className="d-flex gap-2">
                                <Button color="danger" size="sm" onClick={handleSharePDF} disabled={selectedItems.size === 0} style={{ whiteSpace: "nowrap" }}>
                                    <i className="bx bx-share-alt mr-1"></i> Share PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Responsive Table Container */}
                <div className="table-responsive" style={{ maxHeight: '60vh', border: '1px solid #EFF2F7', borderRadius: '4px' }}>
                    <Table hover className="align-middle table-nowrap mb-0 table-sm text-nowrap">
                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                                    <input type="checkbox" checked={selectedItems.size === sortedData.length && sortedData.length > 0} onChange={toggleSelectAll} />
                                </th>
                                <th style={{ backgroundColor: '#f8f9fa', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => requestSort('VoucherDate')}>
                                    Date {getSortIcon('VoucherDate')}
                                </th>
                                <th style={{ backgroundColor: '#f8f9fa', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => requestSort('VoucherNo')}>
                                    No {getSortIcon('VoucherNo')}
                                </th>
                                <th style={{ backgroundColor: '#f8f9fa', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => requestSort('DrLedgerName')}>
                                    Dr Ledger {getSortIcon('DrLedgerName')}
                                </th>
                                <th style={{ backgroundColor: '#f8f9fa', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => requestSort('CrLedgerName')}>
                                    Cr Ledger {getSortIcon('CrLedgerName')}
                                </th>
                                <th className="text-end" style={{ backgroundColor: '#f8f9fa', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => requestSort('TotalAmount')}>
                                    Amount {getSortIcon('TotalAmount')}
                                </th>
                                <th style={{ backgroundColor: '#f8f9fa', cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => requestSort('Remark')}>
                                    Details {getSortIcon('Remark')}
                                </th>
                                <th className="text-center" style={{ backgroundColor: '#f8f9fa', whiteSpace: 'nowrap' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4"><Spinner color="primary" size="sm" /></td>
                                </tr>
                            ) : sortedData.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="text-center py-4 text-muted">No vouchers found for this period.</td>
                                </tr>
                            ) : (
                                sortedData.map((item) => (
                                    <tr key={item.Id} onDoubleClick={() => handleEdit(item.Id)} style={{ cursor: 'pointer', backgroundColor: selectedItems.has(item.Id) ? 'rgba(0, 123, 255, 0.05)' : '' }}>
                                        <td className="text-center" onClick={(e) => toggleSelectItem(item.Id, e)}>
                                            <input type="checkbox" checked={selectedItems.has(item.Id)} readOnly />
                                        </td>
                                        <td>{item.VoucherDate ? new Date(item.VoucherDate).toLocaleDateString('en-GB') : '-'}</td>
                                        <td><Badge color="soft-primary" className="font-size-12 text-dark">#{item.VoucherNo}</Badge></td>
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
