import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Eye, Edit, Trash } from 'lucide-react';
import { Modal, Button } from 'antd';
import toast from 'react-hot-toast';
import ToggleSwitch from '../../components/ToggleSwitch';
import { usePermissionsContext } from '../../context/PermissionsContext';

interface Building {
  id: number;
  project_id: number;
  name: string;
  description: string;
  is_active: boolean;
}

interface Action {
  key: string;
  icon: JSX.Element;
  onClick: (building: number) => void;
  color: string;
  permission?: string;
}

const ViewBuildings: React.FC = () => {
  const { buildingId: projectId } = useParams<{ buildingId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissionsContext();
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [buildingToDelete, setBuildingToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Fetch project name
  useEffect(() => {
    const fetchProjectName = async () => {
      try {
        const response = await axiosInstance.get(`/projects/${projectId}`);
        setProjectName(response.data.data.name);
      } catch (error) {
        console.error('Error fetching project name:', error);
      }
    };
    
    fetchProjectName();
  }, [projectId]);

  const fetchBuildings = async () => {
    try {
      const response = await axiosInstance.get('/buildings', {
        params: {
          project_id: projectId,
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      setBuildings(response.data.data);
      
      // Set total pages from response metadata
      if (response.data.meta && response.data.meta.total) {
        const total = Math.ceil(response.data.meta.total / itemsPerPage);
        setTotalPages(total);
      }
    } catch (error) {
      console.error('Error fetching buildings:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  // Fetch buildings with pagination
  useEffect(() => {
    fetchBuildings();
  }, [projectId, currentPage, itemsPerPage]);

  // Add focus effect to refetch data
  useEffect(() => {
    const handleFocus = () => {
      fetchBuildings();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [projectId, currentPage, itemsPerPage]);

  const handleView = (building: number) => {
    navigate(`buildings/${building}`);
  };

  const handleEdit = (building: number) => {
    navigate(`edit/${building}`);
  };

  const handleToggleActive = async (buildingId: number, isActive: boolean) => {
    setTogglingStatus(buildingId);
    try {
      await axiosInstance.patch(`/buildings/${buildingId}/activate`, {
        is_active: isActive
      });
      
      // Update the buildings state with the new active status
      setBuildings(buildings.map(building => 
        building.id === buildingId ? { ...building, is_active: isActive } : building
      ));
      
      toast.success(`تم ${isActive ? 'تفعيل' : 'تعطيل'} المبنى بنجاح`);
    } catch (error) {
      console.error('Error toggling building status:', error);
      toast.error('حدث خطأ أثناء تغيير حالة المبنى');
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleDelete = async () => {
    if (buildingToDelete !== null) {
      setDeleting(true);
      try {
        await axiosInstance.delete(`/buildings/${buildingToDelete}`);
        // Remove the deleted building from the state
        setBuildings(buildings.filter(b => b.id !== buildingToDelete));
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
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const actions: Action[] = [
    { 
      key: 'view', 
      icon: <Eye className="h-5 w-5" />, 
      onClick: handleView, 
      color: 'text-blue-600',
      permission: 'view_buildings'
    },
    { 
      key: 'edit', 
      icon: <Edit className="h-5 w-5" />, 
      onClick: handleEdit, 
      color: 'text-yellow-600',
      permission: 'edit_buildings'
    },
    { 
      key: 'delete', 
      icon: <Trash className="h-5 w-5" />, 
      onClick: confirmDelete, 
      color: 'text-red-600',
      permission: 'delete_buildings'
    },
  ];

  // Filter actions based on permissions
  const filteredActions = actions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{projectName}</h1>
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
                { 
                  header: 'نشط', 
                  key: 'is_active',
                  render: (value, row) => (
                    <ToggleSwitch 
                      isActive={Boolean(value)} 
                      onChange={(isActive) => handleToggleActive(Number(row.id), isActive)}
                      loading={togglingStatus === Number(row.id)}
                      disabled={!hasPermission('edit_buildings')}
                    />
                  )
                },
              ]}
              data={buildings as unknown as Record<string, unknown>[]}
              actions={filteredActions}
              loading={loading}
              onCreate={hasPermission('create_buildings') ? () => navigate(`/projects/${projectId}/create`) : undefined}
              createButtonText="إضافة مبنى جديد"
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
            <Button 
              key="confirm" 
              type="primary" 
              danger 
              onClick={handleDelete} 
              loading={deleting}
              disabled={!hasPermission('delete_buildings')}
            >
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
