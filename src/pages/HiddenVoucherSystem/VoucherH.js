import React, { useEffect, useState, useRef } from 'react';
import { Row, Col, Input, Button, FormGroup, Label, Spinner, Modal, ModalHeader, ModalBody } from 'reactstrap';
import { useDispatch } from 'react-redux';
import { Fn_AddEditData, Fn_FillListData } from 'store/Functions';
import { API_WEB_URLS } from '../../constants/constAPI';
import AddEdit_LedgerMaster from '../Masters/AddEdit_LedgerMaster';

const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const VoucherH = ({ voucherId, onSaveSuccess }) => {
    const dispatch = useDispatch();
    const searchTimeoutRef = useRef(null);
    const [state, setState] = useState({
        ledgers: [],
        formData: {},
        NewVoucherNo: []
    });
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);

    const [formData, setFormData] = useState({
        VoucherNo: '',
        crLedger: '',
        drLedger: '',
        contNo1: '',
        contNo2: '',
        rate1: '',
        rate2: '',
        qty: '',
        amount: '',
        remark: '',
        voucherDate: getToday(),
        cont1Data: null,
        cont2Data: null
    });

    const refreshLedgers = async () => {
        try {
            const API_URL_LEDGERS = API_WEB_URLS.MASTER + "/0/token/OtherLedgers";
            const ledgersRes = await Fn_FillListData(dispatch, () => { }, "ledgers", API_URL_LEDGERS + "/Id/0");
            setState(prev => ({ ...prev, ledgers: ledgersRes || [] }));
        } catch (error) {
            console.error('Error refreshing ledgers', error);
        }
    };

    const handleModalSuccess = () => {
        setModalOpen(false);
        refreshLedgers();
    };

    const handleRemarkChange = (index, value) => {
        setFormData(prev => {
            const parts = prev.remark ? prev.remark.split('|') : ['', ''];
            // Fill parts if they don't exist
            while (parts.length <= index) parts.push('');
            parts[index] = value;
            return { ...prev, remark: parts.join(' | ') };
        });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                // Fetch Ledgers List
                const API_URL_LEDGERS = API_WEB_URLS.MASTER + "/0/token/OtherLedgers";
                const ledgersRes = await Fn_FillListData(dispatch, () => { }, "ledgers", API_URL_LEDGERS + "/Id/0");
                const ledgersData = ledgersRes || [];

                setState(prev => ({ ...prev, ledgers: ledgersData }));

                if (voucherId) {
                    try {
                        const API_URL_VOUCHER = API_WEB_URLS.MASTER + "/0/token/VoucherNewData";
                        const res = await Fn_FillListData(dispatch, setState, "voucherData", API_URL_VOUCHER + "/Id/" + voucherId);
                        const vData = res?.[0];
                        if (vData) {
                            setFormData({
                                VoucherNo: vData.VoucherNo ?? '',
                                crLedger: vData.F_LedgerMasterCr ?? '',
                                drLedger: vData.F_LedgerMasterDr ?? '',
                                contNo1: vData.ContNo1 ?? vData.contNo1 ?? '',
                                contNo2: vData.ContNo2 ?? vData.contNo2 ?? '',
                                rate1: vData.Rate1 ?? '',
                                rate2: vData.Rate2 ?? '',
                                qty: vData.Qty ?? '',
                                amount: vData.Amount ?? '',
                                remark: vData.Remark ?? '',
                                voucherDate: vData.VoucherDate ? vData.VoucherDate.split('T')[0] : getToday(),
                            });

                            // Prefetch contracts if they exist
                            if (vData.ContNo1 || vData.contNo1) handleContractFetch(vData.ContNo1 || vData.contNo1, true);
                            if (vData.ContNo2 || vData.contNo2) handleContractFetch(vData.ContNo2 || vData.contNo2, false);
                        }
                    } catch (e) {
                        console.error('Error fetching existing voucher', e);
                    }
                } else {
                    try {
                        const API_URL_NEW_NO = API_WEB_URLS.MASTER + "/0/token/VoucherNoNewKK/Id/0";
                        const res = await Fn_FillListData(dispatch, setState, "NewVoucherNo", API_URL_NEW_NO);
                        const NewVoucherNo = res?.[0]?.VoucherNoNew || '';
                        setFormData(prev => ({ ...prev, VoucherNo: NewVoucherNo }));
                    } catch (e) {
                        console.error('Error fetching new voucher no', e);
                    }
                }
            } catch (error) {
                console.error("Error initializing form", error);
            } finally {
                setLoading(false);
            }
        };
        fetchInitialData();
    }, [voucherId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => {
            const nextData = { ...prev, [name]: value };

            // Auto-calculate amount if rate1, rate2, or qty changes.
            if (['rate1', 'rate2', 'qty'].includes(name)) {
                const r1 = parseFloat(nextData.rate1) || 0;
                const r2 = parseFloat(nextData.rate2) || 0;
                const q = parseFloat(nextData.qty) || 0;

                if (nextData.rate1 || nextData.rate2 || nextData.qty) {
                    const calcAmount = (r1 - r2) * q;
                    nextData.amount = calcAmount !== 0 ? calcAmount.toFixed(2) : '';
                }
            }
            return nextData;
        });

        if (name === 'contNo1' || name === 'contNo2') {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            if (value && value.trim().length > 0) {
                searchTimeoutRef.current = setTimeout(() => {
                    handleContractFetch(value, name === 'contNo1');
                }, 600);
            } else {
                setFormData(prev => ({ ...prev, [name === 'contNo1' ? 'cont1Data' : 'cont2Data']: null }));
            }
        }
    };

    const handleContractFetch = async (contNo, isCont1) => {
        if (!contNo) return;
        try {
            const API_URL_CONTRACT = API_WEB_URLS.MASTER + `/0/token/SearchByContNo/${contNo}/0`;
            const res = await Fn_FillListData(dispatch, setState, "contractData", API_URL_CONTRACT);
            const data = res?.[0];
            if (data) {
                const buyer = data.Buyer || 'Buyer';
                const seller = data.Seller || 'Seller';
                const item = data.Item || '';
                const prefix = isCont1 ? 'Cont1' : 'Cont2';
                const newRemarkText = `${prefix}[ Cont No: ${contNo}, ${item}, Buyer: ${buyer}, Seller: ${seller}, Qty: ${data.Qty} Ton, Rate: ${data.Rate} ]`;

                setFormData(prev => {
                    let currentRemark = prev.remark || '';
                    if (currentRemark) {
                        const regex = new RegExp(`${prefix}\\[.*?\\]`, 'g');
                        if (regex.test(currentRemark)) {
                            currentRemark = currentRemark.replace(regex, newRemarkText);
                        } else {
                            currentRemark += ` | ${newRemarkText}`;
                        }
                    } else {
                        currentRemark = newRemarkText;
                    }

                    return {
                        ...prev,
                        [isCont1 ? 'rate1' : 'rate2']: data.Rate || prev[isCont1 ? 'rate1' : 'rate2'],
                        qty: (prev.contNo1 && prev.contNo2 && data.Qty) ? (parseFloat(prev.qty) === parseFloat(data.Qty) ? data.Qty : prev.qty) : (data.Qty || prev.qty),
                        remark: currentRemark,
                        [isCont1 ? 'cont1Data' : 'cont2Data']: {
                            buyer, seller, item, qty: data.Qty, rate: data.Rate
                        }
                    };
                });

                // Auto-calculate amount
                setFormData(prev => {
                    const r1 = parseFloat(prev.rate1) || 0;
                    const r2 = parseFloat(prev.rate2) || 0;
                    const q = parseFloat(prev.qty) || 0;
                    if (prev.rate1 || prev.rate2 || prev.qty) {
                        const calcAmount = (r1 - r2) * q;
                        return { ...prev, amount: calcAmount !== 0 ? calcAmount.toFixed(2) : '' };
                    }
                    return prev;
                });
            } else {
                setFormData(prev => ({ ...prev, [isCont1 ? 'cont1Data' : 'cont2Data']: null }));
            }
        } catch (error) {
            console.error('Error fetching contract', error);
        }
    };

    const handleSubmit = async () => {
        if (!formData.crLedger || !formData.drLedger) {
            alert("Please select both Credit and Debit Ledgers.");
            return;
        }

        try {
            setSubmitting(true);
            const obj = JSON.parse(localStorage.getItem("authUser"));
            const API_URL_SAVE = API_WEB_URLS.MASTER + "/0/token/VoucherNew";

            const submitFormData = new FormData();
            submitFormData.append("VoucherDate", formData.voucherDate || "");
            submitFormData.append("F_LedgerMasterCr", formData.crLedger || "");
            submitFormData.append("F_LedgerMasterDr", formData.drLedger || "");
            submitFormData.append("ContNo1", formData.contNo1 || "");
            submitFormData.append("ContNo2", formData.contNo2 || "");
            submitFormData.append("Rate1", formData.rate1 || "");
            submitFormData.append("Rate2", formData.rate2 || "");
            submitFormData.append("Qty", formData.qty || "");
            submitFormData.append("Amount", formData.amount || "");
            submitFormData.append("Remark", formData.remark || "");
            submitFormData.append("VoucherNo", formData.VoucherNo || "");
            submitFormData.append("F_VoucherTypeMaster", 1);
            submitFormData.append("UserId", obj?.uid || 0);

            await Fn_AddEditData(
                dispatch,
                setState,
                { arguList: { id: voucherId ? parseInt(voucherId) : 0, formData: submitFormData } },
                API_URL_SAVE,
                true,
                "",
                null,
                null
            );

            if (onSaveSuccess) onSaveSuccess();
        } catch (error) {
            console.error('Submit error:', error);
            alert("Error saving voucher");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center p-5"><Spinner color="primary" /></div>;

    const remarkParts = formData.remark ? formData.remark.split('|') : ['', ''];

    return (
        <div className="p-3">
            <Row>
                <Col md={3}>
                    <FormGroup>
                        <Label>Voucher No</Label>
                        <Input type="text" value={formData.VoucherNo} disabled bsSize="sm" />
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <Label>Voucher Date</Label>
                        <Input type="date" name="voucherDate" value={formData.voucherDate} onChange={handleChange} bsSize="sm" />
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <Label>Debit Ledger <span className="text-danger">*</span></Label>
                        <div className="d-flex align-items-center gap-1">
                            <Input type="select" name="drLedger" value={formData.drLedger} onChange={handleChange} bsSize="sm">
                                <option value="">Select Dr Ledger</option>
                                {state.ledgers?.map(l => <option key={l.Id} value={l.Id}>{l.Name}</option>)}
                            </Input>
                            <Button color="success" size="sm" onClick={() => setModalOpen(true)} className="px-2" title="Add New Ledger">
                                <i className="bx bx-plus"></i>
                            </Button>
                        </div>
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <Label>Credit Ledger <span className="text-danger">*</span></Label>
                        <div className="d-flex align-items-center gap-1">
                            <Input type="select" name="crLedger" value={formData.crLedger} onChange={handleChange} bsSize="sm">
                                <option value="">Select Cr Ledger</option>
                                {state.ledgers?.map(l => <option key={l.Id} value={l.Id}>{l.Name}</option>)}
                            </Input>
                            <Button color="success" size="sm" onClick={() => setModalOpen(true)} className="px-2" title="Add New Ledger">
                                <i className="bx bx-plus"></i>
                            </Button>
                        </div>
                    </FormGroup>
                </Col>
            </Row>

            <Row className="mt-2 bg-light p-2 rounded">
                <Col md={3}>
                    <FormGroup>
                        <Label>Contract No 1</Label>
                        <Input type="text" name="contNo1" value={formData.contNo1} onChange={handleChange} bsSize="sm" />
                        {formData.contNo1 && formData.cont1Data && (
                            <div className="mt-1" style={{ fontSize: '11.5px', lineHeight: '1.4', fontWeight: '500' }}>
                                <span className="text-primary">{formData.cont1Data.buyer}</span>
                                <span className="text-dark mx-1">&rarr;</span>
                                <span className="text-danger">{formData.cont1Data.seller}</span>
                                {formData.cont1Data.item && <> <span className="text-dark mx-1">|</span> <span className="text-primary">Item: {formData.cont1Data.item}</span> </>}
                                <span className="text-dark mx-1">|</span> <span className="text-danger">Qty: {formData.cont1Data.qty}</span>
                                <span className="text-dark mx-1">|</span> <span className="text-primary">Rate: {formData.cont1Data.rate}</span>
                            </div>
                        )}
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <Label>Rate 1</Label>
                        <Input type="number" name="rate1" value={formData.rate1} onChange={handleChange} bsSize="sm" />
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <Label>Contract No 2</Label>
                        <Input type="text" name="contNo2" value={formData.contNo2} onChange={handleChange} bsSize="sm" />
                        {formData.contNo2 && formData.cont2Data && (
                            <div className="mt-1" style={{ fontSize: '11.5px', lineHeight: '1.4', fontWeight: '500' }}>
                                <span className="text-danger">{formData.cont2Data.buyer}</span>
                                <span className="text-dark mx-1">&rarr;</span>
                                <span className="text-primary">{formData.cont2Data.seller}</span>
                                {formData.cont2Data.item && <> <span className="text-dark mx-1">|</span> <span className="text-danger">Item: {formData.cont2Data.item}</span> </>}
                                <span className="text-dark mx-1">|</span> <span className="text-primary">Qty: {formData.cont2Data.qty}</span>
                                <span className="text-dark mx-1">|</span> <span className="text-danger">Rate: {formData.cont2Data.rate}</span>
                            </div>
                        )}
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <Label>Rate 2</Label>
                        <Input type="number" name="rate2" value={formData.rate2} onChange={handleChange} bsSize="sm" />
                    </FormGroup>
                </Col>
            </Row>

            <Row className="mt-3">
                <Col md={3}>
                    <FormGroup>
                        <Label>Quantity</Label>
                        <Input type="number" name="qty" value={formData.qty} onChange={handleChange} bsSize="sm" />
                    </FormGroup>
                </Col>
                <Col md={3}>
                    <FormGroup>
                        <Label>Amount <span className="text-danger">*</span></Label>
                        <Input type="number" name="amount" value={formData.amount} onChange={handleChange} bsSize="sm" />
                    </FormGroup>
                </Col>
                <Col md={6}>
                    <FormGroup>
                        <Label>Remarks (Cont 1 & Cont 2)</Label>
                        <Input
                            type="textarea"
                            value={remarkParts[0]?.trim() || ''}
                            onChange={(e) => handleRemarkChange(0, e.target.value)}
                            style={{ backgroundColor: '#e3f2fd', color: '#0d47a1', fontSize: '11px', marginBottom: '5px' }}
                            rows="2"
                            placeholder="Cont 1 Remark"
                        />
                        <Input
                            type="textarea"
                            value={remarkParts[1]?.trim() || ''}
                            onChange={(e) => handleRemarkChange(1, e.target.value)}
                            style={{ backgroundColor: '#ffebee', color: '#b71c1c', fontSize: '11px' }}
                            rows="2"
                            placeholder="Cont 2 Remark"
                        />
                    </FormGroup>
                </Col>
            </Row>

            <Row className="mt-4">
                <Col className="text-right">
                    <Button color="success" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? <Spinner size="sm" className="mr-2" /> : <i className="bx bx-save mr-1"></i>}
                        {voucherId ? 'Update' : 'Save'} Voucher (H)
                    </Button>
                </Col>
            </Row>

            <Modal isOpen={modalOpen} toggle={() => setModalOpen(!modalOpen)} size="xl" scrollable>
                <ModalHeader toggle={() => setModalOpen(!modalOpen)}>Add New Ledger</ModalHeader>
                <ModalBody>
                    {modalOpen && (
                        <AddEdit_LedgerMaster
                            isModal={true}
                            modalId={0}
                            defaultGroup={36}
                            onSuccess={handleModalSuccess}
                            onCancel={() => setModalOpen(false)}
                        />
                    )}
                </ModalBody>
            </Modal>
        </div>
    );
};

export default VoucherH;
