import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Eye, Edit, Trash } from 'lucide-react';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get<{ data: Project }>(`/projects/${id}`);
        setProject(response.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [id]);

  const handleView = (building: number) => {
    navigate(`buildings/${building}`);
    console.log('View building', building);
  };

  const handleEdit = (building: number) => {
    navigate(`/buildings/edit/${building}`);
    console.log('Edit building', building);
  };

  const handleDelete = async (building: number) => {
    try {
      await axiosInstance.delete(`/buildings/${building}`);
      if (project) {
        setProject({
          ...project,
          buildings: project.buildings.filter(b => b.id !== building),
        });
      }
      console.log('Deleted building', building);
    } catch (error) {
      console.error('Error deleting building:', error);
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
          {project && (
            <GenericTable
              columns={[
                { header: 'رقم المبنى', key: 'id' },
                { header: 'اسم المبنى', key: 'name' },
                { header: 'الوصف', key: 'description' },
              ]}
              data={project.buildings}
              actions={actions}
              onCreate={() => navigate(`/projects/${id}/create`)}
              createButtonText="إضافة مبنى جديد"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewBuildings;
