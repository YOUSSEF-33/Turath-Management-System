import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Edit, Eye, Trash } from 'lucide-react';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get<{ data: Project[] }>('/projects');
        setProjects(response.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
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

  const handleDelete = async (project: number) => {
    //console.log(project)
    try {
      await axiosInstance.delete(`/projects/${project}`);
      setProjects(projects.filter(p => p.id !== project));
      console.log('Deleted project', project);
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  const actions: Action[] = [
    { key: 'view', icon: <Eye className="h-5 w-5" />, onClick: handleView, color: 'text-blue-600' },
    { key: 'edit', icon: <Edit className="h-5 w-5" />, onClick: handleEdit, color: 'text-yellow-600' },
    { key: 'delete', icon: <Trash className="h-5 w-5" />, onClick: handleDelete, color: 'text-red-600' },
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
      <div className="container mx-auto px-6 py-8">
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
          />
        </div>
      </div>
    </div>
  );
};

export default ViewProjects;
