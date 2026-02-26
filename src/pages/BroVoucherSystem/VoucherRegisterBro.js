import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, CardBody, Input, Button, Table, Spinner, FormGroup, Label, Modal, ModalHeader, ModalBody } from 'reactstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';

import VoucherBro from './VoucherBro';
import { useDispatch } from 'react-redux';
import { Fn_GetReport } from 'store/Functions';
import { API_WEB_URLS } from 'constants/constAPI';
import { useSelector } from 'react-redux';
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

const VoucherRegisterBro = ({ globalFromDate, globalToDate, onVoucherUpdate }) => {
    const globalDates = useSelector(state => state.GlobalDates);
    const [voucherData, setVoucherData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(globalDates?.fromDate || '');
    const [toDate, setToDate] = useState(globalDates?.toDate || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState(new Set());
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [selectedVoucherId, setSelectedVoucherId] = useState(null);
    const dispatch = useDispatch();
    const API_URL = `${API_WEB_URLS.VoucherListBro}/0/token`
    const fetchData = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('FromDate', formatDateLocal(fromDate));
            formData.append('ToDate', formatDateLocal(toDate));

            const response = await Fn_GetReport(dispatch, setVoucherData,
                "tenderData", API_URL, { arguList: { id: 0, formData: formData } }, true);

        } catch (error) {
            console.error('Error fetching voucher register data:', error);
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

    const handleSearch = (e) => {
        setSearchQuery(e.target.value);
    };

    const filteredData = useMemo(() => {
        let data = voucherData || [];
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(item =>
                (item.DrLedgerName && item.DrLedgerName.toLowerCase().includes(lowerQuery)) ||
                (item.CrLedgerName && item.CrLedgerName.toLowerCase().includes(lowerQuery))
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

    const handleDoubleClick = (id) => {
        setSelectedVoucherId(id);
        setShowVoucherModal(true);
    };

    const handleVoucherSaved = () => {
        setShowVoucherModal(false);
        setSelectedVoucherId(null);
        fetchData();
        if (onVoucherUpdate) {
            onVoucherUpdate();
        }
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
        link.setAttribute("download", `VoucherRegister_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    let totalSelectedAmount = 0;
    selectedItems.forEach(idx => {
        const item = filteredData[idx];
        if (item) {
            totalSelectedAmount += (item.TotalAmount || 0);
        }
    });

    const handleSharePDF = async () => {
        if (selectedItems.size === 0) return;

        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Voucher Register', 14, 15);
        doc.setFontSize(10);

        const periodText = `Period: ${fromDate ? new Date(fromDate).toLocaleDateString('en-GB') : ''} to ${toDate ? new Date(toDate).toLocaleDateString('en-GB') : ''}`;
        doc.text(periodText, 14, 22);

        const tableColumn = ["Date", "No", "Dr Ledger", "Cr Ledger", "Qty", "Rate", "Amount"];
        const tableRows = [];

        let rowTotal = 0;

        const selectedElements = filteredData.filter((_, idx) => selectedItems.has(idx));
        selectedElements.forEach(item => {
            const date = item.VoucherDate ? new Date(item.VoucherDate).toLocaleDateString('en-GB') : '';
            const rateStr = item.Rate1 && item.Rate2 ? `${item.Rate1}-${item.Rate2}` : (item.Rate1 || item.Rate2 || '');
            const rowData = [
                date,
                item.VoucherNo || '',
                item.DrLedgerName || '',
                item.CrLedgerName || '',
                item.Qty || '',
                rateStr,
                (item.TotalAmount || 0).toFixed(2)
            ];
            rowTotal += (item.TotalAmount || 0);
            tableRows.push(rowData);
        });

        tableRows.push([{ content: 'Total', colSpan: 6, styles: { halign: 'right', fontStyle: 'bold' } }, { content: rowTotal.toFixed(2), styles: { fontStyle: 'bold' } }]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                6: { halign: 'right' }
            }
        });

        const pdfBlob = doc.output('blob');

        if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], "VoucherRegister.pdf", { type: "application/pdf" })] })) {
            const file = new File([pdfBlob], `VoucherRegister_${new Date().getTime()}.pdf`, { type: 'application/pdf' });
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
                        <Input
                            type="text"
                            placeholder="Search Dr/Cr Ledger Name..."
                            value={searchQuery}
                            onChange={handleSearch}
                            bsSize="sm"
                            style={{ width: "230px" }}
                        />
                        {filteredData.length > 0 && (
                            <div className="d-flex gap-2">
                                <Button color="danger" size="sm" onClick={handleSharePDF} disabled={selectedItems.size === 0} style={{ whiteSpace: "nowrap" }}>
                                    <i className="bx bx-share-alt mr-1"></i> Share PDF
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="table-responsive" style={{ maxHeight: '60vh', border: '1px solid #EFF2F7', borderRadius: '4px' }}>
                    <Table hover className="align-middle table-nowrap mb-0 table-sm text-nowrap">
                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ width: '40px', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
                                    <div className="custom-control custom-checkbox">
                                        <input
                                            type="checkbox"
                                            className="custom-control-input"
                                            id="selectAllCheckVoucherHead"
                                            checked={selectedItems.size === filteredData.length && filteredData.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                        <label className="custom-control-label" htmlFor="selectAllCheckVoucherHead"></label>
                                    </div>
                                </th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>Voucher No</th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>Date</th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>Dr Ledger</th>
                                <th style={{ backgroundColor: '#f8f9fa' }}>Cr Ledger</th>
                                <th className="text-right" style={{ backgroundColor: '#f8f9fa' }}>Amount (₹)</th>
                                <th className="text-center" style={{ width: '80px', backgroundColor: '#f8f9fa' }}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="text-center py-4"><Spinner color="primary" /></td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <tr
                                        key={item.Id || index}
                                        onDoubleClick={() => handleDoubleClick(item.Id)}
                                        style={{ cursor: 'pointer', backgroundColor: selectedItems.has(index) ? 'rgba(0, 123, 255, 0.05)' : '' }}
                                    >
                                        <td className="text-center" onClick={(e) => toggleSelectItem(index, e)}>
                                            <div className="custom-control custom-checkbox position-relative" style={{ zIndex: 0 }}>
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id={`checkVoucher-${index}`}
                                                    checked={selectedItems.has(index)}
                                                    readOnly
                                                />
                                                <label className="custom-control-label" htmlFor={`checkVoucher-${index}`}></label>
                                            </div>
                                        </td>
                                        <td className="font-weight-bold text-primary">#{item.VoucherNo}</td>
                                        <td>{item.VoucherDate ? new Date(item.VoucherDate).toLocaleDateString() : ''}</td>
                                        <td className="text-danger" style={{ whiteSpace: 'normal', minWidth: '150px' }}>{item.DrLedgerName}</td>
                                        <td className="text-success" style={{ whiteSpace: 'normal', minWidth: '150px' }}>{item.CrLedgerName}</td>
                                        <td className="text-right font-weight-bold text-success">
                                            {item.TotalAmount?.toFixed(2) || '0.00'}
                                        </td>
                                        <td className="text-center">
                                            <Button
                                                color="soft-info"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDoubleClick(item.Id);
                                                }}
                                                title="Edit Voucher"
                                            >
                                                <i className="bx bx-edit font-size-14"></i>
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="7" className="text-center text-muted py-4">No voucher data available</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>

                {selectedItems.size > 0 && (
                    <div className="mt-3 p-3 bg-white border border-primary rounded shadow-sm d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-primary">Selected Totals ({selectedItems.size})</h6>
                        <div className="d-flex text-right">
                            <div>
                                <span className="text-muted d-block font-size-11">Total Amount</span>
                                <span className="font-weight-bold text-success">
                                    ₹{totalSelectedAmount.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                <Modal
                    isOpen={showVoucherModal}
                    toggle={() => setShowVoucherModal(!showVoucherModal)}
                    size="xl"
                    scrollable={true}
                >
                    <ModalHeader toggle={() => setShowVoucherModal(!showVoucherModal)}>
                        Edit Voucher
                    </ModalHeader>
                    <ModalBody>
                        {showVoucherModal && (
                            <VoucherBro voucherId={selectedVoucherId} onSaveSuccess={handleVoucherSaved} />
                        )}
                    </ModalBody>
                </Modal>
            </CardBody>
        </Card>
    );
};

export default VoucherRegisterBro;
