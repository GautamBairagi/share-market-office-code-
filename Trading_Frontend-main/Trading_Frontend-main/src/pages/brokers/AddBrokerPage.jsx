import React from 'react';
import AddBrokerForm from '../../components/AddBrokerForm';

const AddBrokerPage = ({ onBack, onSave }) => {
    return (
        <AddBrokerForm onBack={onBack} onSave={onSave} />
    );
};

export default AddBrokerPage;
