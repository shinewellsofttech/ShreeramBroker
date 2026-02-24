import React, { useState } from 'react';
import { Modal, ModalHeader, ModalBody, FormGroup, Label, Input, Button, Alert } from 'reactstrap';

const VoucherAccessModal = ({ isOpen, toggle, type }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        const expectedPwd = type === 'bro' ? '147359' : '9876';
        const targetUrl = type === 'bro' ? '/TabVoucherSystemBro' : '/TabVoucherSystemH';

        if (password === expectedPwd) {
            window.open(targetUrl, '_blank');
            setPassword('');
            setError(false);
            toggle();
        } else {
            setError(true);
        }
    };

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered size="sm">
            <ModalHeader toggle={toggle}>
                {type === 'bro' ? 'Bro Voucher Access' : 'Hidden Voucher Access'}
            </ModalHeader>
            <ModalBody>
                <form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label>Enter Password</Label>
                        <Input
                            type="password"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                setError(false);
                            }}
                            placeholder="******"
                            autoFocus
                        />
                    </FormGroup>
                    {error && <Alert color="danger" className="p-2 font-size-12">Invalid Password!</Alert>}
                    <div className="text-end">
                        <Button color="primary" type="submit" size="sm">Verify</Button>
                    </div>
                </form>
            </ModalBody>
        </Modal>
    );
};

export default VoucherAccessModal;
