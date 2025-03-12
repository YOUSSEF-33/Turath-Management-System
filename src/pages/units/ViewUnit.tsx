import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Eye, Edit, Trash } from 'lucide-react';
import { Modal, Button } from 'antd'; // Import the Modal and Button components from antd
import toast from 'react-hot-toast';

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
}

interface Building {
  id: number;
  name: string;
  description: string;
  units: Unit[];
}

interface Action {
  key: string;
  icon: JSX.Element;
  onClick: (unit: number) => void;
  color: string;
}

const ViewUnit: React.FC = () => {
  const { buildingId } = useParams<{ buildingId: string }>();
  const navigate = useNavigate();
  const [building, setBuilding] = useState<Building | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [unitToDelete, setUnitToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  useEffect(() => {
    const fetchData = async () => {
      try {
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
        
        toast.success('تم تحميل البيانات بنجاح');
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [buildingId, currentPage, itemsPerPage]);

  const handleView = (unit: number) => {
    navigate(`units/${unit}`);
    console.log('View unit', unit);
  };

  const handleEdit = (unit: number) => {
    navigate(`units/${unit}/edit`);
    console.log('Edit unit', unit);
  };

  const handleDelete = async () => {
    if (unitToDelete !== null) {
      setDeleting(true);
      try {
        await axiosInstance.delete(`/units/${unitToDelete}`);
        if (building) {
          setBuilding({
            ...building,
            units: building.units.filter(u => u.id !== unitToDelete),
          });
        }
        toast.success('تم حذف الوحدة بنجاح');
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

  const confirmDelete = (unit: number) => {
    setUnitToDelete(unit);
    setShowDeleteModal(true);
  };

  const actions: Action[] = [
    { key: 'view', icon: <Eye className="h-5 w-5" />, onClick: handleView, color: 'text-blue-600' },
    { key: 'edit', icon: <Edit className="h-5 w-5" />, onClick: handleEdit, color: 'text-yellow-600' },
    { key: 'delete', icon: <Trash className="h-5 w-5" />, onClick: confirmDelete, color: 'text-red-600' },
  ];

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{building?.name}</h1>
          <button
            onClick={() => navigate(`/projects`)}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
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
              { header: 'الطابق', key: 'floor' },
              { header: 'غرف النوم', key: 'bedrooms' },
              { header: 'الحمامات', key: 'bathrooms' },
            ]}
            data={units as unknown as Record<string, unknown>[]}
            actions={actions}
            loading={loading}
            onCreate={() => navigate("units/create")}
            createButtonText="إضافة وحدة جديدة"
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
      )}
    </div>
  );
};

export default ViewUnit;