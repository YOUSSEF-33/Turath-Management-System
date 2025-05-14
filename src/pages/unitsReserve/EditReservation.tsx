import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import EditReservationModal from '../../components/EditReservationModal';

const EditReservation = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const handleClose = () => {
        navigate('/reservations');
    };

    const handleSuccess = () => {
        navigate('/reservations');
    };

    return (
        <EditReservationModal
            isOpen={true}
            onClose={handleClose}
            reservationId={parseInt(id || '0')}
            onSuccess={handleSuccess}
        />
    );
};

export default EditReservation;
