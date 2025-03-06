import React, { useEffect, useState } from "react";
import axiosInstance from "../../axiosInstance";
import { useParams, useNavigate } from "react-router-dom"; // Import useNavigate

const ViewUnitDetails = () => {
    const [unitDetails, setUnitDetails] = useState<any>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const { unitId, projectId, buildingId } = useParams(); // Add projectId to useParams
    const navigate = useNavigate(); // Initialize useNavigate

    useEffect(() => {
        axiosInstance.get(`/units/${unitId}`)
            .then(response => {
                setUnitDetails(response.data.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching unit details:", error);
                setLoading(false);
            });
    }, [unitId]);

    if (loading) {
        return <div className="loader"></div>;
    }

    if (!unitDetails) {
        return <div>No unit details available.</div>;
    }

    return (
        <div className="min-h-screen bg-gray-100 p-6 flex flex-col items-center">
            {/* Page Header */}
            <div className="bg-gray-100 sticky top-0 z-10 w-full">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-gray-800 mb-8">تفاصيل الوحدة</h1>
                    <button
                        onClick={() => navigate(`/projects/${projectId}/buildings/${buildingId}`)} // Update navigate path
                        className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        عودة
                    </button>
                </div>
            </div>
            {/* Main Content */}
            <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">بيانات الوحدة</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">رقم الوحدة</label>
                        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">{unitDetails.unit_number}</div>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">نوع الوحدة</label>
                        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">{unitDetails.unit_type}</div>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">السعر</label>
                        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">{unitDetails.price}</div>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
                        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">{unitDetails.status}</div>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">المساحة</label>
                        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">{unitDetails.area}</div>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">الطابق</label>
                        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">{unitDetails.floor}</div>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">عدد الغرف</label>
                        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">{unitDetails.bedrooms}</div>
                    </div>
                    <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">عدد الحمامات</label>
                        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">{unitDetails.bathrooms}</div>
                    </div>
                    <div className="md:col-span-2 flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
                        <div className="w-full px-4 py-2 border border-gray-300 rounded-lg">{unitDetails.description}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ViewUnitDetails;
