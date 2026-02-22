import { API_WEB_URLS } from 'constants/constAPI';
import React, { useEffect, useMemo, useState, useRef } from 'react'
import { useDispatch, useSelector } from 'react-redux';
import { Fn_GetReport } from 'store/Functions';
import { VoucherForm } from 'pages/Transaction/Voucher';
import { Button, Card, CardBody, Col, Container, Row, Table, Input, Modal, ModalBody, ModalFooter, ModalHeader, Form } from 'reactstrap';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function VoucherList() {
    const dispatch = useDispatch();
    const globalDates = useSelector(state => state.GlobalDates);

    // State and ref for scroll to top button
    const [showScrollTop, setShowScrollTop] = useState(false);
    const tableContainerRef = useRef(null);

    const [state, setState] = useState({
        FillArray: [],
        LedgerArray: [],
        FromDate: globalDates.fromDate,
        ToDate: globalDates.toDate,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [editModal, setEditModal] = useState({ isOpen: false, voucher: null });
    const [addModalOpen, setAddModalOpen] = useState(false);

    // Checkbox selection state
    const [selectedRows, setSelectedRows] = useState([]);
    const [selectAll, setSelectAll] = useState(false);

    // Refresh trigger – increment to reload data
    const [refreshKey, setRefreshKey] = useState(0);

    // PDF share state (two-step: generate → show Share button)
    const [pendingShareFile, setPendingShareFile] = useState(null);
    const [showSharePDFModal, setShowSharePDFModal] = useState(false);

    const compactCellStyle = { padding: '0.35rem 0.5rem', fontSize: '0.85rem' };
    const checkboxCellStyle = { padding: '0.35rem 0.4rem', fontSize: '0.85rem', width: '36px', textAlign: 'center' };

    const API_URL_Get = `${API_WEB_URLS.VoucherList}/0/token`

    // Format date in local time (YYYY-MM-DD) – avoids UTC offset shifting date back 1 day
    const formatDateLocal = (value) => {
        if (!value) return '';
        const d = new Date(value);
        if (isNaN(d.getTime())) return '';
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const GetVoucherData = async () => {
        try {
            const formData = new FormData();
            formData.append("FromDate", formatDateLocal(state.FromDate));
            formData.append("ToDate", formatDateLocal(state.ToDate));
            await Fn_GetReport(dispatch, setState, "FillArray", API_URL_Get, { arguList: { id: 0, formData: formData } }, true);
        } catch (error) {
            console.log("error", error);
        }
    }

    // Scroll event handler for table container
    const handleTableScroll = () => {
        const tableContainer = tableContainerRef.current;
        if (tableContainer) {
            setShowScrollTop(tableContainer.scrollTop > 200);
        }
    }

    const scrollToTop = () => {
        const tableContainer = tableContainerRef.current;
        if (tableContainer) {
            try { tableContainer.scrollTo({ top: 0, behavior: "smooth" }); }
            catch (error) { tableContainer.scrollTop = 0; }
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            const tableContainer = tableContainerRef.current;
            if (tableContainer) {
                handleTableScroll();
                tableContainer.addEventListener("scroll", handleTableScroll);
            }
        }, 100);
        return () => {
            clearTimeout(timer);
            const tableContainer = tableContainerRef.current;
            if (tableContainer) {
                tableContainer.removeEventListener("scroll", handleTableScroll);
            }
        }
    }, []);

    // Sync with global dates whenever they change (e.g. from the global date picker)
    useEffect(() => {
        setState(prev => ({
            ...prev,
            FromDate: globalDates.fromDate,
            ToDate: globalDates.toDate,
        }));
    }, [globalDates.fromDate, globalDates.toDate]);

    const handleDateChange = (field, value) => {
        setState(prev => ({ ...prev, [field]: value }));
    }

    const getCrLedgerName = (item) => item?.LedgerMasterCrName ?? item?.CrLedgerName ?? item?.LedgerName ?? '';
    const getDrLedgerName = (item) => item?.LedgerMasterDrName ?? item?.DrLedgerName ?? '';
    const getNarration = (item) => item?.Narration ?? '';
    const getCombinedLedgerNames = (item) => `${getCrLedgerName(item)} ${getDrLedgerName(item)} ${getNarration(item)}`.trim();
    const getAmount = (item) => Number(item?.TotalAmount ?? item?.Amount ?? item?.LineAmount ?? 0);

    const filteredData = (state.FillArray ?? []).filter(item => {
        const ledgerNames = getCombinedLedgerNames(item).toLowerCase();
        return ledgerNames.includes(searchTerm.toLowerCase());
    });

    const totals = useMemo(() => {
        return filteredData.reduce((sum, item) => ({
            amount: sum.amount + getAmount(item)
        }), { amount: 0 });
    }, [filteredData]);

    const formatDate = (value) => {
        if (!value) return '';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-GB');
    };

    // ── Checkbox handlers (onClick, not onChange) ──────────────────────────
    const handleSelectAll = (e) => {
        const checked = e.target.checked;
        setSelectAll(checked);
        setSelectedRows(checked ? filteredData.map(item => item.Id) : []);
    };

    const handleRowSelect = (rowId) => {
        setSelectedRows(prev => {
            if (prev.includes(rowId)) {
                const next = prev.filter(id => id !== rowId);
                setSelectAll(false);
                return next;
            } else {
                const next = [...prev, rowId];
                if (next.length === filteredData.length) setSelectAll(true);
                return next;
            }
        });
    };

    // Keep selectAll in sync when filtered data changes
    useEffect(() => {
        if (filteredData.length > 0 && selectedRows.length === filteredData.length) {
            setSelectAll(true);
        } else {
            setSelectAll(false);
        }
    }, [filteredData.length, selectedRows.length]);

    // ── Edit / Add modal ──────────────────────────────────────────────────
    const handleEditClick = (voucher) => {
        if (!voucher?.Id) return;
        setEditModal({ isOpen: true, voucher });
    };

    const closeEditModal = () => setEditModal({ isOpen: false, voucher: null });

    const handleModalSuccess = () => {
        closeEditModal();
        setAddModalOpen(false);
        setRefreshKey(prev => prev + 1); // triggers useEffect → GetVoucherData
    };

    const openAddModal = () => setAddModalOpen(true);
    const closeAddModal = () => setAddModalOpen(false);

    useEffect(() => {
        GetVoucherData();
    }, [dispatch, state.FromDate, state.ToDate, refreshKey]);

    // ── PDF Generation (generates file, stores as pendingShareFile) ────────
    const handlePDFExport = () => {
        if (selectedRows.length === 0) {
            alert('Please select at least one row to generate PDF');
            return;
        }

        const selectedData = filteredData.filter(item => selectedRows.includes(item.Id));

        try {
            const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            const filename = `Voucher_Register_${new Date().toISOString().split('T')[0]}.pdf`;

            doc.setFontSize(18);
            doc.text('Voucher Register', 14, 15);
            doc.setFontSize(11);
            doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString('en-GB')}`, 14, 22);
            doc.text(`Total Records: ${selectedData.length}`, 14, 28);

            const head = [['Sr.', 'Date', 'Cr Ledger', 'Dr Ledger', 'Narration', 'Amount']];
            const body = selectedData.map((item, idx) => [
                String(idx + 1),
                formatDate(item?.VoucherDate),
                getCrLedgerName(item),
                getDrLedgerName(item),
                getNarration(item),
                getAmount(item).toFixed(2),
            ]);

            // Total row
            const totalAmount = selectedData.reduce((sum, item) => sum + getAmount(item), 0);
            body.push(['', '', '', '', 'Total', totalAmount.toFixed(2)]);

            doc.autoTable({
                head,
                body,
                startY: 33,
                margin: { left: 14, right: 14 },
                styles: { fontSize: 9, cellPadding: 2 },
                headStyles: { fillColor: [13, 110, 253], textColor: 255, fontStyle: 'bold' },
                alternateRowStyles: { fillColor: [245, 248, 255] },
                foot: [],
                didDrawCell: (data) => {
                    // Bold last row (totals)
                    if (data.row.index === body.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        data.cell.styles.fillColor = [220, 234, 255];
                    }
                }
            });

            const pdfBlob = doc.output('blob');
            const file = new File([pdfBlob], filename, { type: 'application/pdf' });

            if (navigator.share) {
                setPendingShareFile(file);
                setShowSharePDFModal(true);
            } else {
                // Fallback: direct download
                const url = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Error generating PDF. Please try again.');
        }
    };

    // ── Share PDF button click (runs on user gesture so navigator.share works) ──
    const handleSharePDFClick = async () => {
        if (!pendingShareFile || !navigator.share) return;
        try {
            await navigator.share({
                title: 'Voucher Register',
                text: 'Please find attached the Voucher Register',
                files: [pendingShareFile],
            });
            setShowSharePDFModal(false);
            setPendingShareFile(null);
        } catch (shareError) {
            if (shareError.name === 'AbortError') {
                // user cancelled – do nothing
            } else {
                console.error('Share error:', shareError);
            }
            setShowSharePDFModal(false);
            setPendingShareFile(null);
        }
    };

    return (
        <div className="voucher-list-page" style={{ paddingTop: '36px', minHeight: '100vh', width: '100%', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
            <Container fluid style={{ padding: 0, margin: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, maxWidth: '100%' }}>
                <Row style={{ margin: 0, flex: 1, minHeight: 0 }}>
                    <Col lg={12} style={{ padding: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                        <Card className="shadow-sm border-0" style={{ marginBottom: 0, flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                            <CardBody className="px-3" style={{ paddingTop: '0.25rem', paddingBottom: '0.25rem', flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
                                <Form>
                                    <div style={{ overflowX: 'auto', overflowY: 'hidden' }}>
                                        <Row className="align-items-center" style={{ flexWrap: 'nowrap', minWidth: 'fit-content', gap: '0.1rem' }}>
                                            {/* From Date */}
                                            <Col xs="auto" style={{ flex: '0 0 auto' }}>
                                                <Input
                                                    type="date"
                                                    value={formatDateLocal(state.FromDate)}
                                                    onChange={(e) => handleDateChange('FromDate', e.target.value)}
                                                    className="form-control form-control-sm date-compact"
                                                    style={{ width: '76px', height: '28px', fontSize: '0.7rem', padding: '0 4px', backgroundColor: '#E3F2FD', border: '1px solid #2196F3', borderRadius: '0.25rem', color: '#333' }}
                                                />
                                            </Col>
                                            <Col xs="auto" style={{ flex: '0 0 auto', display: 'flex', alignItems: 'center', padding: '0 2px' }}>
                                                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>To</span>
                                            </Col>
                                            {/* To Date */}
                                            <Col xs="auto" style={{ flex: '0 0 auto' }}>
                                                <Input
                                                    type="date"
                                                    value={formatDateLocal(state.ToDate)}
                                                    onChange={(e) => handleDateChange('ToDate', e.target.value)}
                                                    className="form-control form-control-sm date-compact"
                                                    style={{ width: '76px', height: '28px', fontSize: '0.7rem', padding: '0 4px', backgroundColor: '#E3F2FD', border: '1px solid #2196F3', borderRadius: '0.25rem', color: '#333' }}
                                                />
                                            </Col>
                                            {/* Add button */}
                                            <Col xs="auto" style={{ flex: '0 0 auto' }}>
                                                <Button color="primary" size="sm" onClick={openAddModal} title="Add Voucher" style={{ height: '28px', fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}>
                                                    <i className="mdi mdi-plus" style={{ fontSize: '0.9rem' }} /> Add
                                                </Button>
                                            </Col>
                                            {/* Search Ledger */}
                                            <Col xs="auto" style={{ flex: '0 0 auto' }}>
                                                <Input
                                                    type="text"
                                                    placeholder="Search Ledger..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="form-control form-control-sm"
                                                    style={{ width: '160px', minWidth: '120px', height: '28px', fontSize: '0.7rem', padding: '0 8px', backgroundColor: '#E3F2FD', border: '1px solid #2196F3', borderRadius: '0.25rem' }}
                                                />
                                            </Col>
                                            {/* PDF Share button – visible only when rows are selected */}
                                            {selectedRows.length > 0 && (
                                                <Col xs="auto" style={{ flex: '0 0 auto' }}>
                                                    <Button
                                                        color="success"
                                                        size="sm"
                                                        onClick={handlePDFExport}
                                                        title={`Generate PDF for ${selectedRows.length} selected row(s)`}
                                                        style={{ height: '28px', fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}
                                                    >
                                                        <i className="mdi mdi-file-pdf-box" style={{ fontSize: '0.9rem' }} /> PDF ({selectedRows.length})
                                                    </Button>
                                                </Col>
                                            )}
                                        </Row>
                                    </div>
                                </Form>
                                <div
                                    ref={tableContainerRef}
                                    className="table-responsive"
                                    style={{ flex: 1, minHeight: 0, overflow: 'auto', paddingBottom: '0.5rem' }}
                                >
                                    <Table size="sm" className="table table-bordered table-striped mb-0">
                                        <thead className="table-light">
                                            <tr>
                                                {/* Select-all checkbox */}
                                                <th style={checkboxCellStyle}>
                                                    <input
                                                        type="checkbox"
                                                        checked={selectAll}
                                                        onClick={handleSelectAll}
                                                        onChange={() => { }}
                                                        style={{ cursor: 'pointer' }}
                                                        title="Select all"
                                                    />
                                                </th>
                                                <th style={compactCellStyle}>Sr. No.</th>
                                                <th style={compactCellStyle}>Voucher Date</th>
                                                <th style={compactCellStyle}>Cr Ledger Name</th>
                                                <th style={compactCellStyle}>Dr Ledger Name</th>
                                                <th style={compactCellStyle}>Narration</th>
                                                <th className="text-end" style={compactCellStyle}>Amount</th>
                                                <th style={compactCellStyle}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredData && filteredData.length > 0 ? (
                                                filteredData.map((item, index) => {
                                                    const amount = getAmount(item);
                                                    const isChecked = selectedRows.includes(item.Id);
                                                    return (
                                                        <tr
                                                            key={item.Id ?? `${item.VoucherNo}-${index}`}
                                                            style={{ backgroundColor: isChecked ? '#e8f4fd' : undefined }}
                                                        >
                                                            {/* Row checkbox – onClick */}
                                                            <td style={checkboxCellStyle}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isChecked}
                                                                    onClick={() => handleRowSelect(item.Id)}
                                                                    onChange={() => { }}
                                                                    style={{ cursor: 'pointer' }}
                                                                />
                                                            </td>
                                                            <td style={compactCellStyle}>{index + 1}</td>
                                                            <td style={compactCellStyle}>{formatDate(item?.VoucherDate)}</td>
                                                            <td style={compactCellStyle}>{getCrLedgerName(item)}</td>
                                                            <td style={compactCellStyle}>{getDrLedgerName(item)}</td>
                                                            <td style={compactCellStyle}>{getNarration(item)}</td>
                                                            <td className="text-end" style={compactCellStyle}>{amount.toFixed(2)}</td>
                                                            <td style={compactCellStyle}>
                                                                <Button
                                                                    color="link"
                                                                    size="sm"
                                                                    className="p-0"
                                                                    onClick={() => handleEditClick(item)}
                                                                    title="Edit voucher"
                                                                    style={{ width: '34px', height: '34px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                                >
                                                                    <i className="mdi mdi-pencil" style={{ fontSize: '1.25rem' }} />
                                                                </Button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan="8" className="text-center" style={compactCellStyle}>No data available</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                                {filteredData && filteredData.length > 0 && (
                                    <div
                                        className="d-flex align-items-center justify-content-between gap-2 flex-wrap mt-3"
                                        style={{ position: 'sticky', bottom: 0, backgroundColor: '#fff', padding: '0.75rem 0.5rem', boxShadow: '0 -2px 6px rgba(0,0,0,0.08)', zIndex: 2 }}
                                    >
                                        <div className="fw-semibold" style={{ minWidth: '120px' }}>
                                            Total &nbsp;
                                            {selectedRows.length > 0 && (
                                                <span style={{ fontSize: '0.78rem', color: '#0d6efd' }}>({selectedRows.length} selected)</span>
                                            )}
                                        </div>
                                        <div className="ms-auto text-end" style={{ minWidth: '150px' }}>
                                            Amount: <strong>{totals.amount.toFixed(2)}</strong>
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>

            {/* Edit Voucher Modal */}
            <Modal isOpen={editModal.isOpen} toggle={closeEditModal} size="lg" centered>
                <ModalHeader toggle={closeEditModal}>Edit Voucher</ModalHeader>
                <ModalBody>
                    {editModal.voucher && (
                        <>
                            <div className="mb-3">
                                <div style={{ fontSize: '0.9rem', color: '#555' }}>Cr Ledger: <strong>{getCrLedgerName(editModal.voucher)}</strong></div>
                                <div style={{ fontSize: '0.9rem', color: '#555' }}>Dr Ledger: <strong>{getDrLedgerName(editModal.voucher)}</strong></div>
                                <div style={{ fontSize: '0.9rem', color: '#555' }}>Narration: <strong>{getNarration(editModal.voucher) || '-'}</strong></div>
                                <div style={{ fontSize: '0.9rem', color: '#555' }}>Current Amount: <strong>{getAmount(editModal.voucher).toFixed(2)}</strong></div>
                            </div>
                            <VoucherForm initialId={editModal.voucher.Id} onCompleted={handleModalSuccess} compact />
                        </>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={closeEditModal}>Close</Button>
                </ModalFooter>
            </Modal>

            {/* Add Voucher Modal */}
            <Modal isOpen={addModalOpen} toggle={closeAddModal} size="lg" centered>
                <ModalHeader toggle={closeAddModal}>Add Voucher</ModalHeader>
                <ModalBody>
                    <VoucherForm initialId={0} onCompleted={handleModalSuccess} compact />
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={closeAddModal}>Close</Button>
                </ModalFooter>
            </Modal>

            {/* Share PDF Modal – Share button runs on user gesture so navigator.share() works */}
            <Modal isOpen={showSharePDFModal} toggle={() => { setShowSharePDFModal(false); setPendingShareFile(null); }} centered size="sm">
                <ModalHeader toggle={() => { setShowSharePDFModal(false); setPendingShareFile(null); }}>
                    Share PDF
                </ModalHeader>
                <ModalBody className="text-center py-4">
                    <i className="mdi mdi-file-pdf-box" style={{ fontSize: '3rem', color: '#dc3545' }} />
                    <p className="mt-2 mb-1" style={{ fontSize: '0.95rem' }}>
                        PDF is ready! Tap <strong>Share</strong> to send it.
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#888' }}>{selectedRows.length} voucher(s) included</p>
                </ModalBody>
                <ModalFooter className="justify-content-center">
                    <Button color="success" onClick={handleSharePDFClick}>
                        <i className="mdi mdi-share-variant" /> Share
                    </Button>
                    <Button color="secondary" onClick={() => { setShowSharePDFModal(false); setPendingShareFile(null); }}>
                        Cancel
                    </Button>
                </ModalFooter>
            </Modal>

            {/* Scroll to Top Button */}
            {showScrollTop && filteredData.length > 0 && (
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); scrollToTop(); }}
                    className="scroll-to-top-btn"
                    style={{ position: "fixed", bottom: "20px", right: "20px", width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "#0d6efd", color: "white", border: "none", cursor: "pointer", boxShadow: "0 4px 12px rgba(0, 0, 0, 0.3)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "20px", transition: "all 0.3s ease", outline: "none", WebkitTapHighlightColor: "transparent" }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#0b5ed7"; e.currentTarget.style.transform = "scale(1.1)"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#0d6efd"; e.currentTarget.style.transform = "scale(1)"; }}
                    title="Scroll to top of table"
                >
                    <i className="fas fa-arrow-up"></i>
                </button>
            )}

            <style>{`
                /* Hide native calendar icon so width fits only the date text */
                .date-compact::-webkit-calendar-picker-indicator { display: none; }
                .date-compact::-webkit-inner-spin-button { display: none; }
                .date-compact { cursor: text; }
                @media (max-width: 768px) {
                    .voucher-list-page { padding-top: 0 !important; }
                    .scroll-to-top-btn { width: 45px !important; height: 45px !important; bottom: 15px !important; right: 15px !important; font-size: 18px !important; }
                }
                @media (max-width: 576px) {
                    .scroll-to-top-btn { width: 42px !important; height: 42px !important; bottom: 12px !important; right: 12px !important; font-size: 17px !important; }
                }
                @media (max-width: 480px) {
                    .scroll-to-top-btn { width: 38px !important; height: 38px !important; bottom: 10px !important; right: 10px !important; font-size: 15px !important; box-shadow: 0 3px 8px rgba(0, 0, 0, 0.3) !important; }
                }
                @media (max-width: 375px) {
                    .scroll-to-top-btn { width: 35px !important; height: 35px !important; bottom: 8px !important; right: 8px !important; font-size: 14px !important; box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3) !important; }
                }
                @media (max-width: 320px) {
                    .scroll-to-top-btn { width: 32px !important; height: 32px !important; bottom: 6px !important; right: 6px !important; font-size: 13px !important; box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3) !important; }
                }
            `}</style>
        </div>
    )
}

export default VoucherList