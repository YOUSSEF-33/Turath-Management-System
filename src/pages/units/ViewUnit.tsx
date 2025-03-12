import React from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Eye, Edit, Trash } from 'lucide-react';
import { Modal, Button } from 'antd'; // Import the Modal and Button components from antd
import toast from 'react-hot-toast';
import ToggleSwitch from '../../components/ToggleSwitch';


interface Unit {
  id: number;
  building_id: number;
  unit_number: string;
  unit_type: string;
  price: number;
  status: string;
  area: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface Building {
  id: number;
  name: string;
  description: string;
  units: Unit[];
}

const ViewUnit: React.FC = () => {
  const { projectId, buildingId } = useParams<{ projectId: string; buildingId: string }>();
  const navigate = useNavigate();
  const [building, setBuilding] = useState<Building | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [unitToDelete, setUnitToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(12);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchData = async () => {
    try {
      setLoading(true);
      // First fetch building details
      const buildingResponse = await axiosInstance.get<{ data: Building }>(`/buildings/${buildingId}`);
      setBuilding(buildingResponse.data.data);
      
      // Then fetch units for this building with pagination
      const unitsResponse = await axiosInstance.get(`/units`, {
        params: {
          building_id: buildingId,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      
      setUnits(unitsResponse.data.data);
      
      // Set total pages from response metadata
      if (unitsResponse.data.meta && unitsResponse.data.meta.total) {
        const total = Math.ceil(unitsResponse.data.meta.total / itemsPerPage);
        setTotalPages(total);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [buildingId, currentPage, itemsPerPage]);

  // Add focus effect to refetch data
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleView = (unitId: number) => {
    navigate(`/projects/${projectId}/buildings/${buildingId}/units/${unitId}`);
  };

  const handleEdit = (unitId: number) => {
    navigate(`/projects/${projectId}/buildings/${buildingId}/units/${unitId}/edit`);
  };

  const handleDelete = async () => {
    if (unitToDelete !== null) {
      setDeleting(true);
      try {
        await axiosInstance.delete(`/units/${unitToDelete}`);
        setUnits(units.filter(unit => unit.id !== unitToDelete));
        toast.success('تم حذف الوحدة بنجاح');
        fetchData(); // Refresh the data after deletion
      } catch (error) {
        console.error('Error deleting unit:', error);
        toast.error('حدث خطأ أثناء حذف الوحدة');
      } finally {
        setShowDeleteModal(false);
        setUnitToDelete(null);
        setDeleting(false);
      }
    }
  };

  const handleToggleActive = async (unitId: number, isActive: boolean) => {
    setTogglingStatus(unitId);
    try {
      await axiosInstance.patch(`/units/${unitId}/activate`, {
        is_active: isActive
      });
      
      // Update the units state with the new active status
      setUnits(units.map(unit => 
        unit.id === unitId ? { ...unit, is_active: isActive } : unit
      ));
      
      toast.success(`تم ${isActive ? 'تفعيل' : 'تعطيل'} الوحدة بنجاح`);
    } catch (error) {
      console.error('Error toggling unit status:', error);
      toast.error('حدث خطأ أثناء تغيير حالة الوحدة');
    } finally {
      setTogglingStatus(null);
    }
  };

  const confirmDelete = (unitId: number) => {
    setUnitToDelete(unitId);
    setShowDeleteModal(true);
  };

  const actions = [
    { key: 'view', icon: <Eye className="h-5 w-5" />, onClick: handleView, color: 'text-blue-600' },
    // { key: 'edit', icon: <Edit className="h-5 w-5" />, onClick: handleEdit, color: 'text-yellow-600' },
    { key: 'delete', icon: <Trash className="h-5 w-5" />, onClick: confirmDelete, color: 'text-red-600' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{building?.name}</h1>
          <Button
            onClick={() => navigate(`/projects/${projectId}`)}
            type="default"
            size="middle"
            className="flex items-center"
          >
            عودة
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">قائمة الوحدات</h3>

          <GenericTable
            columns={[
              { header: 'رقم الوحدة', key: 'unit_number' },
              { header: 'نوع الوحدة', key: 'unit_type' },
              { header: 'السعر', key: 'price' },
              { header: 'الحالة', key: 'status' },
              { header: 'المساحة', key: 'area' },
              { 
                header: 'نشط', 
                key: 'is_active',
                render: (value, row) => (
                  <ToggleSwitch 
                    isActive={Boolean(value)} 
                    onChange={(isActive) => handleToggleActive(Number(row.id), isActive)}
                    loading={togglingStatus === Number(row.id)}
                  />
                )
              },
            ]}
            data={units as unknown as Record<string, unknown>[]}
            actions={actions}
            loading={loading}
            onCreate={() => navigate(`/projects/${projectId}/buildings/${buildingId}/units/create`)}
            createButtonText="إضافة وحدة جديدة"
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        title="تأكيد الحذف"
        open={showDeleteModal}
        onCancel={() => setShowDeleteModal(false)}
        footer={[
          <Button key="cancel" onClick={() => setShowDeleteModal(false)}>
            إلغاء
          </Button>,
          <Button key="confirm" type="primary" onClick={handleDelete} loading={deleting}>
            تأكيد
          </Button>,
        ]}
      >
        <p>هل أنت متأكد أنك تريد حذف هذه الوحدة؟</p>
      </Modal>
    </div>
  );
};

export default ViewUnit;