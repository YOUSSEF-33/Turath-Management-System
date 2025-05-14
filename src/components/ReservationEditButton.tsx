import React from 'react';
import { Edit } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ReservationEditButtonProps {
    reservationId: number;
}

const ReservationEditButton: React.FC<ReservationEditButtonProps> = ({ reservationId }) => {
    const navigate = useNavigate();

    const handleEdit = () => {
        navigate(`/reservations/${reservationId}/edit`);
    };

    return (
        <button
            onClick={handleEdit}
            className="text-blue-600 hover:text-blue-800"
            title="تعديل الحجز"
        >
            <Edit className="h-5 w-5" />
        </button>
    );
};

export default ReservationEditButton; 