import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Edit, Eye, Trash } from 'lucide-react';
import { Modal, Button, message } from 'antd';
import toast from 'react-hot-toast';

interface Role {
  id: number;
  name: string;
  readable_name: string;
}

interface User {
  id: number;
  name: string | null;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  role: Role;
}

interface Action {
  key: string;
  icon: JSX.Element;
  onClick: (id: number) => void;
  color: string;
}

const ViewUsers: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(10);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchData = async () => {
    try {
      const response = await axiosInstance.get('/users', {
        params: {
          page: currentPage,
          per_page: itemsPerPage
        }
      });
      setUsers(response.data.data);
      
      // Set total pages from response metadata
      if (response.data.meta && response.data.meta.total) {
        const total = Math.ceil(response.data.meta.total / itemsPerPage);
        setTotalPages(total);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ أثناء جلب بيانات المستخدمين');
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
    navigate('/users/create');
  };

  const handleView = (user: number) => {
    navigate(`/users/${user}`);
  };

  const handleEdit = (user: number) => {
    navigate(`/users/edit/${user}`);
  };

  const handleDelete = async () => {
    if (userToDelete !== null) {
      setDeleting(true);
      try {
        await axiosInstance.delete(`/users/${userToDelete}`);
        setUsers(users.filter(u => u.id !== userToDelete));
        message.success('تم حذف المستخدم بنجاح');
      } catch (error) {
        console.error('Error deleting user:', error);
        toast.error('حدث خطأ أثناء حذف المستخدم');
      } finally {
        setShowDeleteModal(false);
        setUserToDelete(null);
        setDeleting(false);
      }
    }
  };

  const confirmDelete = (user: number) => {
    setUserToDelete(user);
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
          <h1 className="text-2xl font-bold text-gray-900">المستخدمين</h1>
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
          <h3 className="text-xl font-semibold text-gray-900 mb-4">قائمة المستخدمين</h3>
            <GenericTable
              columns={[
                { header: 'رقم المستخدم', key: 'id' },
                { header: 'الاسم', key: 'name' },
                { header: 'البريد الإلكتروني', key: 'email' },
                { header: 'رقم الهاتف', key: 'phone' },
                { 
                  header: 'الدور', 
                  key: 'role',
                  render: (value: unknown) => {
                    const role = value as Role | null;
                    return role?.readable_name || '-';
                  }
                },
                { 
                  header: 'تاريخ الإنشاء', 
                  key: 'created_at',
                  render: (value: unknown) => {
                    const date = new Date(value as string);
                    return date.toLocaleDateString('en-GB', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    });
                  }
                },
              ]}
              data={users as unknown as Record<string, unknown>[]}
              actions={actions}
              onCreate={handleCreate}
              createButtonText="إضافة مستخدم جديد"
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
          <p>هل أنت متأكد أنك تريد حذف هذا المستخدم؟</p>
        </Modal>
      )}
    </div>
  );
};

export default ViewUsers;
