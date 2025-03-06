import { useParams } from 'react-router-dom';

const UnitDetails = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch unit details using the id
  // For now, we'll use mock data
  const unit = {
    id,
    number: '101',
    type: 'villa',
    area: 200,
    client: 'علي محمد',
    status: 'suspended', // Changed to 'suspended' for demonstration
  };

  const handleAcceptUnit = () => {
    // Logic to accept the unit
    console.log(`Unit ${id} accepted`);
  };

  const handleRejectUnit = () => {
    // Logic to reject the unit
    console.log(`Unit ${id} rejected`);
  };

  return (
    <div className="p-6 bg-gray-50 md:m-4 md:rounded my-2">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">تفاصيل الوحدة</h2>
      <div className="mb-4">
        <strong>رقم الوحدة:</strong> {unit.number}
      </div>
      <div className="mb-4">
        <strong>النوع:</strong> {unit.type}
      </div>
      <div className="mb-4">
        <strong>المساحة:</strong> {unit.area} متر مربع
      </div>
      <div className="mb-4">
        <strong>العميل:</strong> {unit.client}
      </div>
      <div className="mb-4">
        <strong>الحالة:</strong> {unit.status}
      </div>
      {unit.status === 'suspended' && (
        <div className="flex space-x-4">
          <button
            onClick={handleAcceptUnit}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            قبول
          </button>
          <button
            onClick={handleRejectUnit}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            رفض
          </button>
        </div>
      )}
    </div>
  );
};

export default UnitDetails;
