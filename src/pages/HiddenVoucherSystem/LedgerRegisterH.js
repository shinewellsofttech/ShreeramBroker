import React, { useEffect, useState, useMemo } from 'react';
import { Row, Col, Card, CardBody, Input, Button, Table, Spinner, Badge, FormGroup, Label } from 'reactstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useDispatch, useSelector } from 'react-redux';
import { Fn_GetReport } from '../../store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';
import jsPDF from 'jspdf';
import { applyPlugin as applyAutoTable } from 'jspdf-autotable';
applyAutoTable(jsPDF);
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

const LedgerRegisterH = () => {
    const dispatch = useDispatch();
    const globalDates = useSelector(state => state.GlobalDates);

    const [ledgerData, setLedgerData] = useState([]);

    // Column resize feature
    const { columnWidths, handleResizeMouseDown } = useColumnResize('ledgerRegisterH_columnWidths', {
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

    const API_URL = 'LedgerRegister/0/token';

    const fetchData = async () => {
        try {
            setLoading(true);
            const formData = new FormData();
            formData.append('FromDate', formatDateLocal(fromDate));
            formData.append('ToDate', formatDateLocal(toDate));
            formData.append('F_LedgerGroupMaster', 36); // Hidden system group

            await Fn_GetReport(dispatch, setLedgerData,
                "tenderData", API_URL, { arguList: { id: 0, formData: formData } }, true);
        } catch (error) {
            console.error('Error fetching hidden ledger balances:', error);
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
        doc.setFontSize(16);
        doc.text('Ledger Register', 14, 15);
        doc.setFontSize(10);

        const periodText = `Period: ${fromDate ? new Date(fromDate).toLocaleDateString('en-GB') : ''} to ${toDate ? new Date(toDate).toLocaleDateString('en-GB') : ''}`;
        doc.text(periodText, 14, 22);

        const tableColumn = ["Ledger Name", "Dr Balance", "Cr Balance", "Net Balance"];
        const tableRows = [];

        const selectedElements = filteredData.filter((_, idx) => selectedItems.has(idx));
        selectedElements.forEach(item => {
            const netBalStr = `${Math.abs(item.Balance || 0).toLocaleString()} ${item.Balance >= 0 ? 'Dr' : 'Cr'}`;
            const rowData = [
                item.LedgerName || '',
                (item.DrBalance || 0).toLocaleString(),
                (item.CrBalance || 0).toLocaleString(),
                netBalStr
            ];
            tableRows.push(rowData);
        });

        tableRows.push([
            { content: 'Total', styles: { fontStyle: 'bold', halign: 'right' } },
            { content: totalDr.toLocaleString(), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: totalCr.toLocaleString(), styles: { fontStyle: 'bold', halign: 'right' } },
            { content: `${Math.abs(totalNet).toLocaleString()} ${totalNet >= 0 ? 'Dr' : 'Cr'}`, styles: { fontStyle: 'bold', halign: 'right' } }
        ]);

        doc.autoTable({
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            styles: { fontSize: 8, cellPadding: 2 },
            columnStyles: {
                1: { halign: 'right' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            }
        });

        const pdfBlob = doc.output('blob');

        if (navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], "LedgerRegisterH.pdf", { type: "application/pdf" })] })) {
            const file = new File([pdfBlob], `LedgerRegisterH_${new Date().getTime()}.pdf`, { type: 'application/pdf' });
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
                        <Input type="text" placeholder="Search Ledger Name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} bsSize="sm" style={{ width: "230px" }} />
                        <div className="d-flex gap-2">
                            {filteredData.length > 0 && (
                                <Button color="danger" size="sm" onClick={handleSharePDF} disabled={selectedItems.size === 0} style={{ whiteSpace: "nowrap" }}>
                                    <i className="bx bx-share-alt mr-1"></i> Share PDF
                                </Button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Responsive Table Container */}
                <div className="table-responsive" style={{ maxHeight: '60vh', border: '1px solid #EFF2F7', borderRadius: '4px' }}>
                    <Table hover className="align-middle table-nowrap mb-0 table-sm text-nowrap resizable-table" style={{ tableLayout: 'fixed' }}>
                        <thead className="table-light" style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                            <tr>
                                <th style={{ width: `${columnWidths.Checkbox}px`, textAlign: 'center', backgroundColor: '#f8f9fa', position: 'relative', overflow: 'hidden' }}>
                                    <input type="checkbox" checked={selectedItems.size === filteredData.length && filteredData.length > 0} onChange={toggleSelectAll} />
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'Checkbox')} onTouchStart={e => handleResizeMouseDown(e, 'Checkbox')} />
                                </th>
                                <th style={{ backgroundColor: '#f8f9fa', width: `${columnWidths.LedgerName}px`, position: 'relative', overflow: 'hidden' }}>
                                    Ledger Name
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'LedgerName')} onTouchStart={e => handleResizeMouseDown(e, 'LedgerName')} />
                                </th>
                                <th className="text-end" style={{ backgroundColor: '#f8f9fa', width: `${columnWidths.DrBalance}px`, position: 'relative', overflow: 'hidden' }}>
                                    Dr Balance
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'DrBalance')} onTouchStart={e => handleResizeMouseDown(e, 'DrBalance')} />
                                </th>
                                <th className="text-end" style={{ backgroundColor: '#f8f9fa', width: `${columnWidths.CrBalance}px`, position: 'relative', overflow: 'hidden' }}>
                                    Cr Balance
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'CrBalance')} onTouchStart={e => handleResizeMouseDown(e, 'CrBalance')} />
                                </th>
                                <th className="text-end" style={{ backgroundColor: '#f8f9fa', width: `${columnWidths.NetBalance}px`, position: 'relative', overflow: 'hidden' }}>
                                    Net Balance
                                    <div className="col-resize-handle" onMouseDown={e => handleResizeMouseDown(e, 'NetBalance')} onTouchStart={e => handleResizeMouseDown(e, 'NetBalance')} />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4"><Spinner color="primary" size="sm" /></td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="text-center py-4 text-muted">No records found for this period.</td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={index} onClick={() => toggleSelectItem(index)} style={{ cursor: 'pointer', backgroundColor: selectedItems.has(index) ? 'rgba(0, 123, 255, 0.05)' : '' }}>
                                        <td className="text-center" onClick={(e) => { e.stopPropagation(); toggleSelectItem(index); }}>
                                            <input type="checkbox" checked={selectedItems.has(index)} readOnly />
                                        </td>
                                        <td className="fw-bold" style={{ whiteSpace: 'normal', minWidth: '200px' }}>{item.LedgerName}</td>
                                        <td className="text-end text-danger fw-bold">₹{parseFloat(item.DrBalance || 0).toLocaleString()}</td>
                                        <td className="text-end text-success fw-bold">₹{parseFloat(item.CrBalance || 0).toLocaleString()}</td>
                                        <td className={`text-end fw-bold ${item.Balance >= 0 ? 'text-danger' : 'text-success'}`}>
                                            ₹{Math.abs(item.Balance || 0).toLocaleString()} {item.Balance >= 0 ? 'Dr' : 'Cr'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </Table>
                </div>

                {selectedItems.size > 0 && (
                    <div className="mt-3 p-3 bg-light border rounded">
                        <Row>
                            <Col md={3}><span className="fw-bold text-primary">Selected: {selectedItems.size}</span></Col>
                            <Col md={3} className="text-end"><span className="text-muted font-size-11 d-block">Total Dr</span><span className="fw-bold text-danger">₹{totalDr.toLocaleString()}</span></Col>
                            <Col md={3} className="text-end"><span className="text-muted font-size-11 d-block">Total Cr</span><span className="fw-bold text-success">₹{totalCr.toLocaleString()}</span></Col>
                            <Col md={3} className="text-end">
                                <span className="text-muted font-size-11 d-block">Net Balance</span>
                                <span className={`fw-bold ${totalNet >= 0 ? 'text-danger' : 'text-success'}`}>
                                    ₹{Math.abs(totalNet).toLocaleString()} {totalNet >= 0 ? 'Dr' : 'Cr'}
                                </span>
                            </Col>
                        </Row>
                    </div>
                )}
            </CardBody>
        </Card>
    );
};

export default LedgerRegisterH;
