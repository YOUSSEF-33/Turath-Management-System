import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Eye, Edit, Trash } from 'lucide-react';

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get<{ data: Building }>(`/buildings/${buildingId}`);
        setBuilding(response.data.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, [buildingId]);

  const handleView = (unit: number) => {
    
    console.log('View unit', unit);
  };

  const handleEdit = (unit: number) => {
    navigate(`units/${unit}/edit`);
    console.log('Edit unit', unit);
  };

  const handleDelete = async (unit: number) => {
    try {
      await axiosInstance.delete(`/units/${unit}`);
      if (building) {
        setBuilding({
          ...building,
          units: building.units.filter(u => u.id !== unit),
        });
      }
      console.log('Deleted unit', unit);
    } catch (error) {
      console.error('Error deleting unit:', error);
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
          <h1 className="text-2xl font-bold text-gray-900">{building?.name}</h1>
          <button
            onClick={() => navigate('/buildings')}
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
          {building && (
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
              data={building.units}
              actions={actions}
              onCreate={() => navigate("units/create")}
              createButtonText="إضافة وحدة جديدة"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewUnit;
