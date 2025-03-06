import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Eye, Edit, Trash } from 'lucide-react';
import { Modal, Button, message } from 'antd'; // Import the Modal, Button, and message components from antd
import toast from 'react-hot-toast';

interface Building {
  id: number;
  project_id: number;
  name: string;
  description: string;
}

interface Project {
  id: number;
  name: string;
  description: string;
  buildings: Building[];
}

interface Action {
  key: string;
  icon: JSX.Element;
  onClick: (building: number) => void;
  color: string;
}

const ViewBuildings: React.FC = () => {
  const { buildingId:id } = useParams<{ buildingId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [buildingToDelete, setBuildingToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get<{ data: Project }>(`/projects/${id}`);
        setProject(response.data.data);
        //toast.success('تم تحميل البيانات بنجاح');
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('حدث خطأ أثناء تحميل البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleView = (building: number) => {
    navigate(`buildings/${building}`);
    console.log('View building', building);
  };

  const handleEdit = (building: number) => {
    navigate(`edit/${building}`);
    console.log('Edit building', building);
  };

  const handleDelete = async () => {
    if (buildingToDelete !== null) {
      setDeleting(true);
      try {
        await axiosInstance.delete(`/buildings/${buildingToDelete}`);
        if (project) {
          setProject({
            ...project,
            buildings: project.buildings.filter(b => b.id !== buildingToDelete),
          });
        }
        toast.success('تم حذف المبنى بنجاح');
      } catch (error) {
        console.error('Error deleting building:', error);
        toast.error('حدث خطأ أثناء حذف المبنى');
      } finally {
        setShowDeleteModal(false);
        setBuildingToDelete(null);
        setDeleting(false);
      }
    }
  };

  const confirmDelete = (building: number) => {
    setBuildingToDelete(building);
    setShowDeleteModal(true);
  };

  const actions: Action[] = [
    { key: 'view', icon: <Eye className="h-5 w-5" />, onClick: handleView, color: 'text-blue-600' },
    { key: 'edit', icon: <Edit className="h-5 w-5" />, onClick: handleEdit, color: 'text-yellow-600' },
    { key: 'delete', icon: <Trash className="h-5 w-5" />, onClick: confirmDelete, color: 'text-red-600' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{project?.name}</h1>
          <button
            onClick={() => navigate('/projects')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">قائمة المباني</h3>
          
            <GenericTable
              columns={[
                { header: 'رقم المبنى', key: 'id' },
                { header: 'اسم المبنى', key: 'name' },
                { header: 'الوصف', key: 'description' },
              ]}
              data={project?.buildings}
              actions={actions}
              loading={loading}
              onCreate={() => navigate(`/projects/${id}/create`)}
              createButtonText="إضافة مبنى جديد"
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
          <p>هل أنت متأكد أنك تريد حذف هذا المبنى؟</p>
        </Modal>
      )}
    </div>
  );
};

export default ViewBuildings;
