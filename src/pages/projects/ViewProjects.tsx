import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Edit, Eye, Trash } from 'lucide-react';
import { Modal, Button, message } from 'antd'; // Import the Modal, Button, and message components from antd

interface Project {
  id: number;
  name: string;
  description: string;
}

interface Action {
  key: string;
  icon: JSX.Element;
  onClick: (project: Project) => void;
  color: string;
}

const ViewProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get<{ data: Project[] }>('/projects');
        setProjects(response.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCreate = () => {
    // Handle the creation of a new project
    navigate('/projects/create');
  };

  const handleView = (project: Project) => {
    navigate(`/projects/${project}`);
    console.log('View project', project);
  };

  const handleEdit = (project: number) => {
    navigate(`/projects/edit/${project}`);
    console.log('Edit project', project);
  };

  const handleDelete = async () => {
    if (projectToDelete !== null) {
      setDeleting(true);
      try {
        await axiosInstance.delete(`/projects/${projectToDelete}`);
        setProjects(projects.filter(p => p.id !== projectToDelete));
        message.success('تم حذف المشروع بنجاح');
        console.log('Deleted project', projectToDelete);
      } catch (error) {
        console.error('Error deleting project:', error);
      } finally {
        setShowDeleteModal(false);
        setProjectToDelete(null);
        setDeleting(false);
      }
    }
  };

  const confirmDelete = (project: number) => {
    setProjectToDelete(project);
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
          <h1 className="text-2xl font-bold text-gray-900">المشاريع</h1>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            عودة
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8  min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">قائمة المشاريع</h3>
            <GenericTable
              columns={[
                { header: 'رقم المشروع', key: 'id' },
                { header: 'اسم المشروع', key: 'name' },
                { header: 'الوصف', key: 'description' },
              ]}
              data={projects}
              actions={actions}
              onCreate={handleCreate}
              createButtonText="إضافة مشروع جديد"
              loading={loading}
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
          <p>هل أنت متأكد أنك تريد حذف هذا المشروع؟</p>
        </Modal>
      )}
    </div>
  );
};

export default ViewProjects;
