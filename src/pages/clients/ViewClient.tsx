import { useNavigate, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import { Button, message, Descriptions, Image, Table, Typography } from 'antd';
import { Eye, Edit, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const { Title, Text } = Typography;

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

  const handleEdit = () => {
    navigate(`/clients/edit/${id}`);
  };

  const handleBack = () => {
    navigate('/clients');
  };

  const handleViewReservation = (reservationId: number) => {
    navigate(`/units-reserve/details/${reservationId}`);
  };

  if (loading) {
    return <div>جاري التحميل...</div>;
  }

  if (!client) {
    return <div>لم يتم العثور على العميل</div>;
  }

  // Table columns for reservations
  const reservationColumns = [
    {
      title: 'رقم الحجز',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'حالة الحجز',
      dataIndex: 'status',
      key: 'status',
    },
    {
      title: 'تاريخ العقد',
      dataIndex: 'contract_date',
      key: 'contract_date',
      render: (text: string) => formatDate(text),
    },
    {
      title: 'السعر النهائي',
      dataIndex: 'final_price',
      key: 'final_price',
    },
    {
      title: 'عربون الحجز',
      dataIndex: 'reservation_deposit',
      key: 'reservation_deposit',
    },
    {
      title: 'الدفعة المقدمة',
      dataIndex: 'down_payment',
      key: 'down_payment',
    },
    {
      title: 'القسط الشهري',
      dataIndex: 'monthly_installment',
      key: 'monthly_installment',
    },
    {
      title: 'عدد الأشهر',
      dataIndex: 'months_count',
      key: 'months_count',
    },
    {
      title: 'الإجراءات',
      key: 'actions',
      render: (_: any, record: Reservation) => (
        <Button
          type="link"
          icon={<Eye className="h-4 w-4" />}
          onClick={() => handleViewReservation(record.id)}
        />
      ),
    },
  ];

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
          <Descriptions.Item label="تاريخ الإنشاء">
            {formatDate(client.created_at)}
          </Descriptions.Item>
          <Descriptions.Item label="عدد الحجوزات">
            {client.reservations_count}
          </Descriptions.Item>
        </Descriptions>

        {/* <Button
          type="primary"
          icon={<Edit className="h-4 w-4" />}
          onClick={handleEdit}
          className="mt-4"
        >
          تعديل العميل
        </Button> */}
      </div>

      {/* Reservations Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <Title level={4} className="mb-4">
          الحجوزات
        </Title>
        <Table
          dataSource={client.reservations}
          columns={reservationColumns}
          rowKey="id"
          pagination={false}
        />
      </div>
    </div>
  );
};

export default ViewClient;