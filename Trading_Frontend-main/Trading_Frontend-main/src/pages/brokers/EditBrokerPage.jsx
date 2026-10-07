import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AddBrokerForm from '../../components/AddBrokerForm';

const EditBrokerPage = ({ onSave, onBack }) => {
    const { id } = useParams();

    return (
        <AddBrokerForm 
            brokerId={id} 
            mode="edit" 
            onBack={onBack} 
            onSave={onSave} 
        />
    );
};

export default EditBrokerPage;
