import { API_WEB_URLS, getGlobalOptions } from 'constants/constAPI';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { Fn_AddEditData, Fn_DisplayData, Fn_FillListData } from 'store/Functions';

const getToday = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
};

const formatDateForInput = (value) => {
    if (!value) return getToday();
    if (typeof value === 'string' && value.includes('T')) {
        return value.split('T')[0];
    }
    return value;
};

const API_URL = `${API_WEB_URLS.MASTER}/0/token/PartyAccount`;
const API_URL1 = `${API_WEB_URLS.MASTER}/0/token/VoucherNoLatest`;
const API_URL2 = `${API_WEB_URLS.MASTER}/0/token/VoucherTypes`;
const API_URL3 = `${API_WEB_URLS.MASTER}/0/token/LedgerMasterBanks`;
const API_URL_EDIT = `${API_WEB_URLS.MASTER}/0/token/VoucherEdit/Id`;
const API_URL_GLOBAL_OPTIONS = `${API_WEB_URLS.MASTER}/0/token/GlobalOptions`;
const API_URL_DeleteVoucher = `${API_WEB_URLS.MASTER}/0/token/DeleteVoucher`;
const API_URL_SAVE = 'Voucher/0/token';

const VOUCHER_TYPE_IDS = {
    BANK_PAYMENT: 10,
    BANK_RECEIPT: 9,
    CASH_PAYMENT: 13,
    CASH_RECEIPT: 12,
};

export const VoucherForm = ({
    initialId = 0,
    navigateOnSuccess,
    redirectPath = 'VoucherList',
    onCompleted,
    compact = false,
}) => {
    const dispatch = useDispatch();
    const [state, setState] = useState({
        FillArrayForCr: [],
        FillArrayForDr: [],
        FillArray2: [],
        FillArrayVoucherTypes: [],
        formData: {
            VoucherDate: getToday(),
            VoucherNo: '',
            F_VoucherTypeMaster: '',
            F_LedgerMasterCr: '',
            F_LedgerMasterDr: '',
            Amount: '',
            Narration: '',
        },
        id: initialId,
    });
    const [fieldsLocked, setFieldsLocked] = useState(initialId > 0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const voucherDateRef = useRef(null);
    const voucherTypeRef = useRef(null);
    const ledgerCrRef = useRef(null);
    const ledgerDrRef = useRef(null);
    const amountRef = useRef(null);
    const narrationRef = useRef(null);
    const saveButtonRef = useRef(null);
    const lastLoadedVoucherTypeRef = useRef(null);
    const manualVoucherTypeChangeRef = useRef(false);

    const fetchData = useCallback(async () => {
        await Fn_FillListData(dispatch, setState, 'FillArrayVoucherTypes', `${API_URL2}/Id/0`);
        const cachedGlobal = getGlobalOptions();
        if (cachedGlobal && cachedGlobal.length > 0) {
            setState(prev => ({ ...prev, FillArray2: cachedGlobal }));
        } else {
            await Fn_FillListData(dispatch, setState, 'FillArray2', `${API_URL_GLOBAL_OPTIONS}/Id/0`);
        }
        if (initialId === 0) {
            const res = await Fn_FillListData(dispatch, setState, 'VoucherNoLatest', `${API_URL1}/Id/0`);
            setState(prev => ({
                ...prev,
                formData: {
                    ...prev.formData,
                    VoucherNo: res && res.length > 0 ? res[0].VoucherNo : '',
                },
            }));
        }
    }, [dispatch]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        if (initialId > 0) {
            setState(prev => ({ ...prev, id: initialId }));
            Fn_DisplayData(dispatch, setState, initialId, API_URL_EDIT);
            setFieldsLocked(true);
        } else {
            setState(prev => ({
                ...prev,
                id: 0,
                FillArrayForCr: [],
                FillArrayForDr: [],
                formData: {
                    VoucherDate: getToday(),
                    VoucherNo: '',
                    F_VoucherTypeMaster: '',
                    F_LedgerMasterCr: '',
                    F_LedgerMasterDr: '',
                    Amount: '',
                    Narration: '',
                },
            }));
            setFieldsLocked(false);
        }
    }, [dispatch, initialId]);

    const isEditMode = (state.id ?? 0) > 0;

    const DeleteVoucher = async (id) => {
        if (window.confirm('Are you sure you want to delete this voucher?')) {
            await Fn_FillListData(dispatch, setState, 'nothing', `${API_URL_DeleteVoucher}/Id/${id}`);
            // Reload data after deletion
            if (onCompleted) {
                onCompleted();
            }
        }
    }
    const loadLedgerLists = useCallback(
        async (voucherTypeId, resetSelections = false) => {
            if (!voucherTypeId) {
                return;
            }
            const normalizedType = Number(voucherTypeId);
            if (!resetSelections && lastLoadedVoucherTypeRef.current === normalizedType) {
                return;
            }
            lastLoadedVoucherTypeRef.current = normalizedType;
            const isPayment =
                normalizedType === VOUCHER_TYPE_IDS.BANK_PAYMENT ||
                normalizedType === VOUCHER_TYPE_IDS.CASH_PAYMENT;
            const isReceipt =
                normalizedType === VOUCHER_TYPE_IDS.BANK_RECEIPT ||
                normalizedType === VOUCHER_TYPE_IDS.CASH_RECEIPT;
            const bankFilterId = (() => {
                if (
                    normalizedType === VOUCHER_TYPE_IDS.CASH_PAYMENT ||
                    normalizedType === VOUCHER_TYPE_IDS.CASH_RECEIPT
                ) {
                    return 8;
                }
                if (
                    normalizedType === VOUCHER_TYPE_IDS.BANK_PAYMENT ||
                    normalizedType === VOUCHER_TYPE_IDS.BANK_RECEIPT
                ) {
                    return 4;
                }
                return 0;
            })();
            let creditSource = `${API_URL}/Id/0`;
            let debitSource = `${API_URL}/Id/0`;
            if (isPayment) {
                creditSource = `${API_URL3}/Id/${bankFilterId}`;
                debitSource = `${API_URL}/Id/0`;
            } else if (isReceipt) {
                creditSource = `${API_URL}/Id/0`;
                debitSource = `${API_URL3}/Id/${bankFilterId}`;
            }
            await Promise.all([
                Fn_FillListData(dispatch, setState, 'FillArrayForCr', creditSource),
                Fn_FillListData(dispatch, setState, 'FillArrayForDr', debitSource),
            ]);
            if (resetSelections) {
                setState(prev => ({
                    ...prev,
                    formData: {
                        ...prev.formData,
                        F_LedgerMasterCr: '',
                        F_LedgerMasterDr: '',
                    },
                }));
            }
        },
        [dispatch]
    );

    useEffect(() => {
        if (!isEditMode || !fieldsLocked) {
            if (voucherDateRef.current && !voucherDateRef.current.disabled) {
                voucherDateRef.current.focus();
                if (typeof voucherDateRef.current.select === 'function') {
                    voucherDateRef.current.select();
                }
            }
        }
    }, [isEditMode, fieldsLocked]);

    useEffect(() => {
        const voucherTypeId = state.formData?.F_VoucherTypeMaster;
        if (!voucherTypeId) {
            lastLoadedVoucherTypeRef.current = null;
            return;
        }
        const shouldReset = manualVoucherTypeChangeRef.current;
        manualVoucherTypeChangeRef.current = false;
        loadLedgerLists(voucherTypeId, shouldReset);
    }, [state.formData?.F_VoucherTypeMaster, loadLedgerLists]);

    useEffect(() => {
        const creditOptions = state.FillArrayForCr ?? [];
        if (
            creditOptions.length === 1 &&
            !fieldsLocked &&
            !state.formData?.F_LedgerMasterCr
        ) {
            setState(prev => ({
                ...prev,
                formData: {
                    ...prev.formData,
                    F_LedgerMasterCr: creditOptions[0].Id,
                },
            }));
        }
    }, [state.FillArrayForCr, state.formData?.F_LedgerMasterCr, fieldsLocked]);

    useEffect(() => {
        const debitOptions = state.FillArrayForDr ?? [];
        if (
            debitOptions.length === 1 &&
            !fieldsLocked &&
            !state.formData?.F_LedgerMasterDr
        ) {
            setState(prev => ({
                ...prev,
                formData: {
                    ...prev.formData,
                    F_LedgerMasterDr: debitOptions[0].Id,
                },
            }));
        }
    }, [state.FillArrayForDr, state.formData?.F_LedgerMasterDr, fieldsLocked]);

    useEffect(() => {
        if (narrationRef.current) {
            const textarea = narrationRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [state.formData?.Narration]);

    const handleFormChange = (field, value) => {
        setState(prev => ({
            ...prev,
            formData: {
                ...prev.formData,
                [field]: value,
            },
        }));
    };

    const handleVoucherTypeSelect = (value) => {
        manualVoucherTypeChangeRef.current = true;
        handleFormChange('F_VoucherTypeMaster', value);
    };

    const formFieldRefs = [
        { ref: voucherDateRef, lockSensitive: true },
        { ref: voucherTypeRef, lockSensitive: true },
        { ref: ledgerCrRef, lockSensitive: true },
        { ref: ledgerDrRef, lockSensitive: true },
        { ref: amountRef, lockSensitive: true },
        { ref: narrationRef, lockSensitive: true },
        { ref: saveButtonRef, lockSensitive: false },
    ];

    const findNextFocusable = (currentRef) => {
        const currentIndex = formFieldRefs.findIndex(item => item.ref === currentRef);
        if (currentIndex === -1) return null;
        for (let i = currentIndex + 1; i < formFieldRefs.length; i += 1) {
            const candidate = formFieldRefs[i];
            const element = candidate.ref.current;
            if (!element) continue;
            if (candidate.lockSensitive && isEditMode && fieldsLocked) {
                continue;
            }
            if (element.disabled || element.readOnly) {
                continue;
            }
            return candidate.ref;
        }
        return null;
    };

    const handleFocusTraversal = (event, currentRef, nextRefOverride = null, options = {}) => {
        if (event.key !== 'Enter') return;
        if (options.allowShiftEnter && event.shiftKey) return;
        event.preventDefault();
        const targetNextRef = nextRefOverride || findNextFocusable(currentRef);
        if (targetNextRef?.current) {
            targetNextRef.current.focus();
            if (typeof targetNextRef.current.select === 'function') {
                targetNextRef.current.select();
            }
        }
    };

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            const globalOptions = state.FillArray2 ?? [];
            const {
                VoucherDate,
                VoucherNo,
                F_VoucherTypeMaster,
                F_LedgerMasterCr,
                F_LedgerMasterDr,
                Amount,
                Narration,
            } = state.formData || {};
            const formData = new FormData();
            formData.append('VoucherDate', formatDateForInput(VoucherDate));
            formData.append('VoucherNo', VoucherNo || '');
            formData.append('F_VoucherTypeMaster', F_VoucherTypeMaster || 0);
            formData.append('F_LedgerMasterCr', F_LedgerMasterCr || 0);
            formData.append('F_LedgerMasterDr', F_LedgerMasterDr || 0);
            formData.append(
                'F_FinancialYearMaster',
                globalOptions.length > 0 ? globalOptions[0].F_FinancialYearMaster : 0
            );
            formData.append('Amount', Amount || '');
            formData.append('Narration', Narration || '');
            formData.append('Id', state.id || 0);

            await Fn_AddEditData(
                dispatch,
                setState,
                { arguList: { id: state.id || 0, formData } },
                API_URL_SAVE,
                true,
                redirectPath,
                navigateOnSuccess,
                '#'
            );
            if (onCompleted) {
                onCompleted();
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const wrapperStyle = useMemo(
        () => ({
            display: 'flex',
            gap: '12px',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            padding: compact ? '0' : '12px',
            border: compact ? 'none' : '1px solid #e0e0e0',
            borderRadius: compact ? '0' : '8px',
            background: compact ? 'transparent' : '#fafafa',
        }),
        [compact]
    );

    const getLedgerName = (list, id) => {
        if (!id || !Array.isArray(list)) return '';
        const ledger = list.find(item => String(item.Id) === String(id));
        return ledger ? ledger.Name : '';
    };

    const getCreditLedgerName = (id) => getLedgerName(state.FillArrayForCr, id);
    const getDebitLedgerName = (id) => getLedgerName(state.FillArrayForDr, id);

    const getVoucherTypeName = (id) => {
        if (!id) return '';
        const voucherTypes = state.FillArrayVoucherTypes ?? [];
        const voucherType = voucherTypes.find(item => String(item.Id) === String(id));
        return voucherType ? voucherType.Name : '';
    };

    return (
        <>
            <div style={wrapperStyle}>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Voucher Date</span>
                    <input
                        type="date"
                        value={formatDateForInput(state.formData?.VoucherDate)}
                        onChange={e => handleFormChange('VoucherDate', e.target.value)}
                        onKeyDown={e => handleFocusTraversal(e, voucherDateRef, voucherTypeRef)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', color: '#000' }}
                        disabled={isEditMode && fieldsLocked}
                        ref={voucherDateRef}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '200px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Voucher Type</span>
                    {isEditMode && fieldsLocked ? (
                        <input
                            type="text"
                            readOnly
                            value={getVoucherTypeName(state.formData?.F_VoucherTypeMaster)}
                            style={{
                                padding: '6px 8px',
                                borderRadius: '4px',
                                border: '1px solid #ccc',
                                background: '#f5f5f5',
                                color: '#000',
                            }}
                        />
                    ) : (
                        <select
                            value={state.formData?.F_VoucherTypeMaster || ''}
                            onChange={e => handleVoucherTypeSelect(e.target.value)}
                            onKeyDown={e => handleFocusTraversal(e, voucherTypeRef, ledgerCrRef)}
                            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', color: '#000' }}
                            ref={voucherTypeRef}
                        >
                            <option value="" disabled hidden>
                                Select voucher type
                            </option>
                            {(state.FillArrayVoucherTypes ?? []).map(item => (
                                <option key={item.Id} value={item.Id}>
                                    {item.Name}
                                </option>
                            ))}
                        </select>
                    )}
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '160px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Voucher No.</span>
                    <input
                        type="text"
                        value={state.formData?.VoucherNo || ''}
                        onChange={e => handleFormChange('VoucherNo', e.target.value)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', color: '#000' }}
                        disabled
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Ledger (Credit)</span>
                    {isEditMode && fieldsLocked ? (
                        <input
                            type="text"
                            readOnly
                            value={getCreditLedgerName(state.formData?.F_LedgerMasterCr)}
                            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', background: '#f5f5f5', color: '#000' }}
                        />
                    ) : (
                        <select
                            value={state.formData?.F_LedgerMasterCr || ''}
                            onChange={e => handleFormChange('F_LedgerMasterCr', e.target.value)}
                            onKeyDown={e => handleFocusTraversal(e, ledgerCrRef, ledgerDrRef)}
                            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', color: '#000' }}
                            ref={ledgerCrRef}
                        >
                            <option value="" disabled hidden>
                                Select credit ledger
                            </option>
                            {(state.FillArrayForCr ?? []).map(item => (
                                <option key={item.Id} value={item.Id}>
                                    {item.Name}
                                </option>
                            ))}
                        </select>
                    )}
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '220px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Ledger (Debit)</span>
                    {isEditMode && fieldsLocked ? (
                        <input
                            type="text"
                            readOnly
                            value={getDebitLedgerName(state.formData?.F_LedgerMasterDr)}
                            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', background: '#f5f5f5', color: '#000' }}
                        />
                    ) : (
                        <select
                            value={state.formData?.F_LedgerMasterDr || ''}
                            onChange={e => handleFormChange('F_LedgerMasterDr', e.target.value)}
                            onKeyDown={e => handleFocusTraversal(e, ledgerDrRef, amountRef)}
                            style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', color: '#000' }}
                            ref={ledgerDrRef}
                        >
                            <option value="" disabled hidden>
                                Select debit ledger
                            </option>
                            {(state.FillArrayForDr ?? []).map(item => (
                                <option key={item.Id} value={item.Id}>
                                    {item.Name}
                                </option>
                            ))}
                        </select>
                    )}
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Amount</span>
                    <input
                        type="number"
                        value={state.formData?.Amount || ''}
                        onChange={e => handleFormChange('Amount', e.target.value)}
                        onKeyDown={e => handleFocusTraversal(e, amountRef, narrationRef)}
                        style={{ padding: '6px 8px', borderRadius: '4px', border: '1px solid #ccc', color: '#000' }}
                        disabled={isEditMode && fieldsLocked}
                        ref={amountRef}
                    />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 320px', minWidth: '320px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#555' }}>Narration</span>
                    <textarea
                        value={state.formData?.Narration || ''}
                        onChange={e => handleFormChange('Narration', e.target.value)}
                        onKeyDown={e => handleFocusTraversal(e, narrationRef, saveButtonRef, { allowShiftEnter: true })}
                        rows={1}
                        style={{
                            padding: '6px 8px',
                            borderRadius: '4px',
                            border: '1px solid #ccc',
                            resize: 'none',
                            width: '100%',
                            minHeight: '38px',
                            color: '#000',
                        }}
                        disabled={isEditMode && fieldsLocked}
                        ref={narrationRef}
                    />
                </label>
            </div>
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    padding: compact ? '8px 0' : '12px 0',
                }}
            >
                {isEditMode && (
                    <>
                        <button
                            type="button"
                            onClick={() => DeleteVoucher(state.id)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '4px',
                                border: '1px solid #dc3545',
                                background: '#dc3545',
                                color: '#fff',
                                fontSize: '0.9rem',
                                cursor: 'pointer',
                            }}
                        >
                            Delete
                        </button>
                        <button
                            type="button"
                            onClick={() => setFieldsLocked(false)}
                            style={{
                                padding: '8px 14px',
                                borderRadius: '4px',
                                border: '1px solid #6c757d',
                                background: fieldsLocked ? '#6c757d' : '#adb5bd',
                                color: '#fff',
                                fontSize: '0.9rem',
                                cursor: fieldsLocked ? 'pointer' : 'default',
                            }}
                            disabled={!fieldsLocked}
                        >
                            Edit
                        </button>
                    </>
                )}
                <button
                    type="button"
                    onClick={handleSubmit}
                    ref={saveButtonRef}
                    disabled={isSubmitting}
                    style={{
                        padding: '8px 16px',
                        borderRadius: '4px',
                        border: 'none',
                        background: isSubmitting ? '#6c9fd8' : '#007bff',
                        color: '#fff',
                        fontWeight: 600,
                        cursor: isSubmitting ? 'not-allowed' : 'pointer',
                        opacity: isSubmitting ? 0.8 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                    }}
                >
                    {isSubmitting && (
                        <span
                            style={{
                                width: '14px',
                                height: '14px',
                                border: '2px solid rgba(255,255,255,0.4)',
                                borderTopColor: '#fff',
                                borderRadius: '50%',
                                display: 'inline-block',
                                animation: 'spin 0.7s linear infinite',
                            }}
                        />
                    )}
                    {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        </>
    );
};

function Voucher() {
    const navigate = useNavigate();
    const location = useLocation();
    const initialId = location?.state?.Id ?? 0;

    return (
        <div className="page-content">
            <VoucherForm initialId={initialId} navigateOnSuccess={navigate} redirectPath="VoucherList" />
        </div>
    );
}

export default Voucher;