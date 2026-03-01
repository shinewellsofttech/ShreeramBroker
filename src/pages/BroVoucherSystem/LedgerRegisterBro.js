import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, CardBody, Input, Button, Table, Spinner, Badge, FormGroup, Label } from 'reactstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import axios from 'axios';
import { API_WEB_URLS } from '../../constants/constAPI';
import { useDispatch } from 'react-redux';
import { Fn_GetReport } from 'store/Functions';
import { useSelector } from 'react-redux';
import jsPDF from 'jspdf';
import { applyPlugin as applyAutoTable } from 'jspdf-autotable';
applyAutoTable(jsPDF);
import { registerHindiFont, setHindiFont } from '../../helpers/pdfHindiFont';
import useColumnResize from '../../helpers/useColumnResize'
import '../../helpers/columnResize.css'

const formatDateLocal = (value) => {
    if (!value) return '';
    const d = new Date(value);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const LedgerRegisterBro = ({ globalFromDate, globalToDate }) => {
    const globalDates = useSelector(state => state.GlobalDates);
    const [ledgerData, setLedgerData] = useState([]);

    // Column resize feature
    const { columnWidths, handleResizeMouseDown } = useColumnResize('ledgerRegisterBro_columnWidths', {
        Checkbox: 40,
        LedgerName: 250,
        DrBalance: 120,
        CrBalance: 120,
        NetBalance: 150,
    })
    const [loading, setLoading] = useState(false);
    const [fromDate, setFromDate] = useState(globalDates?.fromDate || '');
    const [toDate, setToDate] = useState(globalDates?.toDate || '');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState(new Set());
    const dispatch = useDispatch();
    const API_URL = 'LedgerRegisterBro/0/token'
    const fetchData = async () => {
        try {
            setLoading(true);
            const token = JSON.parse(localStorage.getItem('authUser'))?.token;
            const formData = new FormData();
            formData.append('FromDate', formatDateLocal(fromDate));
            formData.append('ToDate', formatDateLocal(toDate));
            formData.append('F_LedgerGroupMaster', 38);

            // Using the base endpoint and appending LedgerRegisterBro/0/token
            const response = await Fn_GetReport(dispatch, setLedgerData,
                "tenderData", API_URL, { arguList: { id: 0, formData: formData } }, true);

        } catch (error) {
            console.error('Error fetching ledger register data:', error);
            setLedgerData([]);
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
        let data = ledgerData || [];
        if (searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase();
            data = data.filter(item =>
                item.LedgerName && item.LedgerName.toLowerCase().includes(lowerQuery)
            );
        }
        return data;
    }, [ledgerData, searchQuery]);

    const toggleSelectAll = () => {
        if (selectedItems.size === filteredData.length && filteredData.length > 0) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(filteredData.map((_, i) => i)));
        }
    };

    const toggleSelectItem = (index) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(index)) {
            newSelected.delete(index);
        } else {
            newSelected.add(index);
        }
        setSelectedItems(newSelected);
    };

    const handleExportExcel = async () => {
        if (selectedItems.size === 0) return;

        try {
            const token = JSON.parse(localStorage.getItem('authUser'))?.token;
            const formData = new FormData();
            formData.append('FromDate', fromDate);
            formData.append('ToDate', toDate);
            formData.append('F_LedgerGroupMaster', 38);

            const baseUrl = API_WEB_URLS?.MASTER?.split('/0/token')[0] || '';
            const apiUrl = `${baseUrl}/0/token/VoucherListBro`;

            const res = await axios.post(apiUrl, formData, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const voucherData = res.data?.data?.response || res.data?.response || [];

            let csvContent = "data:text/csv;charset=utf-8,";

            Array.from(selectedItems).forEach(idx => {
                const ledger = filteredData[idx];
                const ledgerName = ledger.LedgerName;

                const ledgerVouchers = voucherData.filter(v =>
                    v.DrLedgerName === ledgerName || v.CrLedgerName === ledgerName
                );

                if (ledgerVouchers.length > 0) {
                    csvContent += `\nLedger Card: ${ledgerName}\n`;
                    csvContent += 'Date,Voucher No,Particulars,Dr Amount,Cr Amount,Balance\n';

                    let runningBalance = 0;
                    let totalDr = 0;
                    let totalCr = 0;

                    ledgerVouchers.forEach(voucher => {
                        const date = new Date(voucher.VoucherDate).toLocaleDateString();
                        const voucherNo = voucher.VoucherNo;
                        let particulars = '';
                        let drAmount = 0;
                        let crAmount = 0;

                        if (voucher.DrLedgerName === ledgerName) {
                            particulars = voucher.CrLedgerName;
                            drAmount = voucher.LineAmount || voucher.TotalAmount || 0;
                            runningBalance += drAmount;
                            totalDr += drAmount;
                        } else if (voucher.CrLedgerName === ledgerName) {
                            particulars = voucher.DrLedgerName;
                            crAmount = voucher.LineAmount || voucher.TotalAmount || 0;
                            runningBalance -= crAmount;
                            totalCr += crAmount;
                        }

                        csvContent += `"${date}","${voucherNo}","${particulars}",${drAmount},${crAmount},${runningBalance.toFixed(2)}\n`;
                    });

                    csvContent += ',,,,,\n';
                    csvContent += `,,Total Dr,${totalDr.toFixed(2)},,\n`;
                    csvContent += `,,Total Cr,,${totalCr.toFixed(2)},\n`;
                    csvContent += `,,Closing Balance,,,${Math.abs(runningBalance).toFixed(2)} ${runningBalance >= 0 ? 'Dr' : 'Cr'}\n\n`;
                }
            });

            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `LedgerCard_${new Date().getTime()}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

        } catch (error) {
            console.error('Error fetching voucher data for export:', error);
            alert('Error generating Ledger Card export.');
        }
    };

    let totalDr = 0;
    let totalCr = 0;
    let totalNet = 0;
    selectedItems.forEach(idx => {
        const item = filteredData[idx];
        if (item) {
            totalDr += (item.DrBalance || 0);
            totalCr += (item.CrBalance || 0);
            totalNet += (item.Balance || 0);
        }
    });

    const handleSharePDF = async () => {
        if (selectedItems.size === 0) return;

        const doc = new jsPDF();
        await registerHindiFont(doc);
        setHindiFont(doc);
        doc.setFontSize(16);
        doc.text('Ledger Register', 14, 15);
        doc.setFontSize(10);

        const periodText = `Period: ${fromDate ? new Date(fromDate).toLocaleDateString('en-GB') : ''} to ${toDate ? new Date(toDate).toLocaleDateString('en-GB') : ''}`;
        doc.text(periodText, 14, 22);

        const tableColumn = ["Ledger Name", "Dr Balance", "Cr Balance", "Net Balance"];
        const tableRows = [];

        const selectedElements = filteredData.filter((_, idx) => selectedItems.has(idx));
        selectedElements.forEach(item => {
            const netBalStr = `${Math.abs(item.Balance || 0).toFixed(2)} ${item.Balance >= 0 ? 'Dr' : 'Cr'}`;
            const rowData = [
                item.LedgerName || '',
                (item.DrBalance || 0).toFixed(2),
                (item.CrBalance || 0).toFixed(2),
                netBalStr
            ];
            tableRows.push(rowData);
        });

        tableRows.push([
            { content: 'Total', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: totalDr.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: totalCr.toFixed(2), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: `${Math.abs(totalNet).toFixed(2)} ${totalNet >= 0 ? 'Dr' : 'Cr'}`, styles: { fontStyle: 'bold', halign: 'right' } }
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { font: 'NotoSansDevanagari', fontSize: 8, cellPadding: 2 },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            }
        });

        const pdfBlob = doc.output('blob');

        if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], "LedgerRegister.pdf", { type: "application/pdf" })] })) {
            const file = new File([pdfBlob], `LedgerRegister_${new Date().getTime()}.pdf`, { type: 'application/pdf' });
            try {
                await navigator.share({
                    title: 'Ledger Register',
                    files: [file]
                });
            } catch (error) {
                console.error("Error sharing PDF:", error);
                window.open(URL.createObjectURL(pdfBlob), '_blank');
            }
        } else {
            window.open(URL.createObjectURL(pdfBlob), '_blank');
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
                            placeholder="Search Ledger Name..."
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
                    <Table hover className="align-middle table-nowrap mb-0 table-sm text-nowrap resizable-table" style={{ tableLayout: 'fixed' }}>
                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ width: `${columnWidths.Checkbox}px`, textAlign: 'center', backgroundColor: '#f8f9fa', position: 'relative', overflow: 'hidden' }}>
                                    <div className="custom-control custom-checkbox">
                                        <input
                                            type="checkbox"
                                            className="custom-control-input"
                                            id="selectAllCheckLedgerHead"
                                            checked={selectedItems.size === filteredData.length && filteredData.length > 0}
                                            onChange={toggleSelectAll}
                                        />
                                        <label className="custom-control-label" htmlFor="selectAllCheckLedgerHead"></label>
                                    </div>
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Checkbox')} onTouchStart={e => handleResizeMouseDown(e, 'Checkbox')} />
                                </th>
                                <th style={{ backgroundColor: '#f8f9fa', width: `${columnWidths.LedgerName}px`, position: 'relative', overflow: 'hidden' }}>
                                    Ledger Name
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'LedgerName')} onTouchStart={e => handleResizeMouseDown(e, 'LedgerName')} />
                                </th>
                                <th className="text-right" style={{ backgroundColor: '#f8f9fa', width: `${columnWidths.DrBalance}px`, position: 'relative', overflow: 'hidden' }}>
                                    Dr Balance (₹)
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'DrBalance')} onTouchStart={e => handleResizeMouseDown(e, 'DrBalance')} />
                                </th>
                                <th className="text-right" style={{ backgroundColor: '#f8f9fa', width: `${columnWidths.CrBalance}px`, position: 'relative', overflow: 'hidden' }}>
                                    Cr Balance (₹)
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'CrBalance')} onTouchStart={e => handleResizeMouseDown(e, 'CrBalance')} />
                                </th>
                                <th className="text-right" style={{ backgroundColor: '#f8f9fa', width: `${columnWidths.NetBalance}px`, position: 'relative', overflow: 'hidden' }}>
                                    Net Balance (₹)
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'NetBalance')} onTouchStart={e => handleResizeMouseDown(e, 'NetBalance')} />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4"><Spinner color="primary" /></td>
                                </tr>
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <tr
                                        key={index}
                                        onClick={() => toggleSelectItem(index)}
                                        style={{ cursor: 'pointer', backgroundColor: selectedItems.has(index) ? 'rgba(0, 123, 255, 0.05)' : '' }}
                                    >
                                        <td className="text-center" onClick={(e) => toggleSelectItem(index, e)}>
                                            <div className="custom-control custom-checkbox position-relative" style={{ zIndex: 0 }}>
                                                <input
                                                    type="checkbox"
                                                    className="custom-control-input"
                                                    id={`checkLedger-${index}`}
                                                    checked={selectedItems.has(index)}
                                                    readOnly
                                                />
                                                <label className="custom-control-label" htmlFor={`checkLedger-${index}`}></label>
                                            </div>
                                        </td>
                                        <td className="font-weight-bold" style={{ whiteSpace: 'normal', minWidth: '200px' }}>{item.LedgerName}</td>
                                        <td className="text-right text-danger">{item.DrBalance?.toFixed(2) || '0.00'}</td>
                                        <td className="text-right text-success">{item.CrBalance?.toFixed(2) || '0.00'}</td>
                                        <td className="text-right font-weight-bold">
                                            {Math.abs(item.Balance || 0).toFixed(2)} {(item.Balance >= 0) ? 'Dr' : 'Cr'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="text-center text-muted">No ledge register data available</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>

                {selectedItems.size > 0 && (
                    <div className="mt-3 p-3 bg-white border border-primary rounded shadow-sm d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-primary">Selected Totals ({selectedItems.size})</h6>
                        <div className="d-flex text-right">
                            <div className="mr-4">
                                <span className="text-muted d-block font-size-11">Total Dr</span>
                                <span className="font-weight-bold text-danger">₹{totalDr.toFixed(2)}</span>
                            </div>
                            <div className="mr-4">
                                <span className="text-muted d-block font-size-11">Total Cr</span>
                                <span className="font-weight-bold text-success">₹{totalCr.toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-muted d-block font-size-11">Net Balance</span>
                                <span className={`font-weight-bold ${totalNet >= 0 ? 'text-danger' : 'text-success'}`}>
                                    ₹{Math.abs(totalNet).toFixed(2)} {totalNet >= 0 ? 'Dr' : 'Cr'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default LedgerRegisterBro;
