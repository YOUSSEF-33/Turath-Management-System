import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Edit, Eye, Trash } from 'lucide-react';
import { Modal, Button, message } from 'antd'; // Import the Modal, Button, and message components from antd
import ToggleSwitch from '../../components/ToggleSwitch';
import toast from 'react-hot-toast';

interface Project {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface Action {
  key: string;
  icon: JSX.Element;
  onClick: (id: number) => void;
  color: string;
}

const ViewProjects: React.FC = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [projectToDelete, setProjectToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/projects', {
        params: {
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      setProjects(response.data.data);
      
      // Set total pages from response metadata
      if (response.data.meta && response.data.meta.total) {
        const total = Math.ceil(response.data.meta.total / itemsPerPage);
        setTotalPages(total);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, itemsPerPage]);

  // Add focus effect to refetch data
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [currentPage, itemsPerPage]);

  const handleCreate = () => {
    navigate('/projects/create');
  };

  const handleView = (project: number) => {
    navigate(`/projects/${project}`);
  };

  const handleEdit = (project: number) => {
    navigate(`/projects/edit/${project}`);
  };

  const handleDelete = async () => {
    if (projectToDelete !== null) {
      setDeleting(true);
      try {
        await axiosInstance.delete(`/projects/${projectToDelete}`);
        setProjects(projects.filter(p => p.id !== projectToDelete));
        message.success('تم حذف المشروع بنجاح');
      } catch (error) {
        console.error('Error deleting project:', error);
      } finally {
        setShowDeleteModal(false);
        setProjectToDelete(null);
        setDeleting(false);
      }
    }
  };

  const handleToggleActive = async (projectId: number, isActive: boolean) => {
    setTogglingStatus(projectId);
    try {
      await axiosInstance.patch(`/projects/${projectId}/activate`, {
        is_active: isActive
      });
      
      // Update the projects state with the new active status
      setProjects(projects.map(project => 
        project.id === projectId ? { ...project, is_active: isActive } : project
      ));
      
      toast.success(`تم ${isActive ? 'تفعيل' : 'تعطيل'} المشروع بنجاح`);
    } catch (error) {
      console.error('Error toggling project status:', error);
      toast.error('حدث خطأ أثناء تغيير حالة المشروع');
    } finally {
      setTogglingStatus(null);
    }
  };

  const confirmDelete = (project: number) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
      <div className="container mx-auto px-6 py-8 min-h-screen">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">قائمة المشاريع</h3>
            <GenericTable
              columns={[
                { header: 'رقم المشروع', key: 'id' },
                { header: 'اسم المشروع', key: 'name' },
                { header: 'الوصف', key: 'description' },
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
              data={projects as unknown as Record<string, unknown>[]}
              actions={actions}
              onCreate={handleCreate}
              createButtonText="إضافة مشروع جديد"
              loading={loading}
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
            <Button key="confirm" type="primary" danger onClick={handleDelete} loading={deleting}>
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
