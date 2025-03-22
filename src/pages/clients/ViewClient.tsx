import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { Button, Descriptions, Typography } from 'antd';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import ReservationsTable from '../../components/ReservationsTable';

const { Title } = Typography;

interface Client {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  created_at: string;
  updated_at: string;
  reservations: Reservation[];
  reservations_count: number;
}

interface Reservation {
  id: number;
  client_id: number;
  user_id: number;
  unit_id: number;
  status: string;
  contract_date: string;
  contract_signed_at: string | null;
  final_price: string;
  reservation_deposit: string;
  down_payment: string;
  monthly_installment: string;
  months_count: number;
  created_at: string;
  updated_at: string;
  national_id_images: Image[];
  reservation_deposit_receipt: Image;
  attachments: Image[];
  [key: string]: unknown;
}

interface Image {
  id: number;
  name: string;
  small_url: string;
  medium_url: string;
  url: string;
  disk: string;
}

const ViewClient: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchClient = async () => {
    try {
      const response = await axiosInstance.get(`/clients/${id}`);
      setClient(response.data.data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('حدث خطأ أثناء جلب بيانات العميل');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClient();
  }, [id]);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1; // Months are zero-based
    const year = date.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const handleBack = () => {
    navigate('/clients');
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  if (!client) {
    return <div>لم يتم العثور على العميل</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen p-6">
      {/* Page Header */}
      <div className="bg-white shadow-sm p-4 mb-6 rounded-lg flex items-center justify-between">
        <Title level={3} className="mb-0">
          تفاصيل العميل
        </Title>
        <Button
          icon={<ArrowLeft className="h-4 w-4" />}
          onClick={handleBack}
        >
          عودة
        </Button>
      </div>

      {/* Client Details */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <Descriptions title="معلومات العميل" bordered column={1}>
          <Descriptions.Item label="الاسم">{client.name}</Descriptions.Item>
          <Descriptions.Item label="الهاتف">{client.phone}</Descriptions.Item>
          <Descriptions.Item label="البريد الإلكتروني">{client.email}</Descriptions.Item>
          <Descriptions.Item label="العنوان">{client.address}</Descriptions.Item>
          <Descriptions.Item label="أول اضافة في">
            {formatDate(client.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="عدد الحجوزات">
            {client.reservations_count}
          </Descriptions.Item>
        </Descriptions>
      </div>

      {/* Reservations Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Title level={4} className="mb-4">
          الحجوزات
        </Title>
        <ReservationsTable
          reservations={client.reservations}
          loading={loading}
          showClientColumn={false} // Hide client column since we're already viewing the client
          showUnitColumn={true}
          noDataMessage="لا توجد حجوزات لهذا العميل"
        />
      </div>
    </div>
  );
};

export default ViewClient;