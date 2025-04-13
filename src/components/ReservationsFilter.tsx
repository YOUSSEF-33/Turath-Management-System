import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button } from 'antd';
import axiosInstance from '../axiosInstance';
import { toast } from 'react-hot-toast';
import { useUserContext } from '../context/UserContext';
import { usePermissionsContext } from '../context/PermissionsContext';
import dayjs from 'dayjs';

interface FilterValues {
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'SOLD';
  date_from?: string;
  date_to?: string;
  project_id?: number;
  building_id?: number;
  unit_id?: number;
  user_id?: number;
}

interface ReservationsFilterProps {
  onFilterChange: (filters: FilterValues) => void;
  onFilterSubmit: (filters: FilterValues) => void;
}

interface Option {
  id: number;
  name: string;
  unit_number?: string;
  unit_type?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
}

const ReservationsFilter: React.FC<ReservationsFilterProps> = ({
  onFilterChange,
  onFilterSubmit,
}) => {
  const [form] = Form.useForm();
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState({
    projects: false,
    buildings: false,
    units: false,
    users: false,
  });
  const [options, setOptions] = useState({
    projects: [] as Option[],
    buildings: [] as Option[],
    units: [] as Option[],
    users: [] as Option[],
  });
  const { userInfo } = useUserContext();
  const { hasPermission } = usePermissionsContext();
  const isSalesAgent = userInfo?.role?.name === 'sales_agent';
  const canViewUsers = hasPermission('view_users');

  // Fetch projects
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(prev => ({ ...prev, projects: true }));
      try {
        const response = await axiosInstance.get('/projects');
        setOptions(prev => ({ ...prev, projects: response.data.data }));
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('فشل في تحميل المشاريع');
      } finally {
        setLoading(prev => ({ ...prev, projects: false }));
      }
    };

    fetchProjects();
  }, []);

  // Fetch users if not sales agent and has view_users permission
  useEffect(() => {
    const fetchUsers = async () => {
      if (!isSalesAgent && canViewUsers) {
        setLoading(prev => ({ ...prev, users: true }));
        try {
          const response = await axiosInstance.get('/users');
          setOptions(prev => ({ ...prev, users: response.data.data }));
        } catch (error) {
          console.error('Error fetching users:', error);
          toast.error('فشل في تحميل البائعين');
        } finally {
          setLoading(prev => ({ ...prev, users: false }));
        }
      }
    };

    fetchUsers();
  }, [isSalesAgent, canViewUsers]);

  // Fetch buildings when project is selected
  useEffect(() => {
    const fetchBuildings = async () => {
      const projectId = form.getFieldValue('project_id');
      if (projectId) {
        setLoading(prev => ({ ...prev, buildings: true }));
        try {
          const response = await axiosInstance.get('/buildings', {
            params: { project_id: projectId }
          });
          setOptions(prev => ({ ...prev, buildings: response.data.data }));
        } catch (error) {
          console.error('Error fetching buildings:', error);
          toast.error('فشل في تحميل المباني');
        } finally {
          setLoading(prev => ({ ...prev, buildings: false }));
        }
      } else {
        setOptions(prev => ({ ...prev, buildings: [] }));
        form.setFieldsValue({ building_id: undefined, unit_id: undefined });
      }
    };

    fetchBuildings();
  }, [form.getFieldValue('project_id')]);

  // Fetch units when building is selected
  useEffect(() => {
    const fetchUnits = async () => {
      const buildingId = form.getFieldValue('building_id');
      if (buildingId) {
        setLoading(prev => ({ ...prev, units: true }));
        try {
          const response = await axiosInstance.get('/units', {
            params: { building_id: buildingId }
          });
          setOptions(prev => ({ ...prev, units: response.data.data }));
        } catch (error) {
          console.error('Error fetching units:', error);
          toast.error('فشل في تحميل الوحدات');
        } finally {
          setLoading(prev => ({ ...prev, units: false }));
        }
      } else {
        setOptions(prev => ({ ...prev, units: [] }));
        form.setFieldsValue({ unit_id: undefined });
      }
    };

    fetchUnits();
  }, [form.getFieldValue('building_id')]);

  // Handle filter changes
  const handleValuesChange = (_: unknown, allValues: FilterValues) => {
    onFilterChange(allValues);
  };

  // Handle filter submission
  const handleFilterSubmit = (values: FilterValues) => {
    const formattedValues = {
      ...values,
      date_from: values.date_from ? dayjs(values.date_from).format('YYYY-MM-DD') : undefined,
      date_to: values.date_to ? dayjs(values.date_to).format('YYYY-MM-DD') : undefined,
    };
    onFilterSubmit(formattedValues);
  };

  // Reset filters
  const resetFilters = () => {
    form.resetFields();
    onFilterSubmit({});
  };

  const filterOptions = (input: string, option: { label: string; value: string | number } | undefined): boolean => {
    if (!option) return false;
    const searchText = input.toLowerCase().trim();
    const optionText = option.label?.toString().toLowerCase().trim() || '';
    return optionText.includes(searchText);
  };

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => setIsVisible(!isVisible)}>
          {isVisible ? 'إخفاء الفلتر' : 'إظهار الفلتر'}
        </Button>
      </div>

      {isVisible && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleFilterSubmit}
          onValuesChange={handleValuesChange}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Form.Item name="status" label="الحالة">
              <Select
                placeholder="اختر الحالة"
                allowClear
                options={[
                  { value: 'PENDING', label: 'معلق' },
                  { value: 'CONFIRMED', label: 'مؤكد' },
                  { value: 'REJECTED', label: 'مرفوض' },
                  { value: 'SOLD', label: 'مباع' },
                ]}
              />
            </Form.Item>

            <Form.Item name="project_id" label="المشروع">
              <Select
                placeholder="اختر المشروع"
                allowClear
                loading={loading.projects}
                showSearch
                filterOption={filterOptions}
                options={options.projects.map(project => ({
                  value: project.id,
                  label: project.name
                }))}
              />
            </Form.Item>

            <Form.Item name="building_id" label="المبنى">
              <Select
                placeholder="اختر المبنى"
                allowClear
                loading={loading.buildings}
                showSearch
                filterOption={filterOptions}
                options={options.buildings.map(building => ({
                  value: building.id,
                  label: building.name
                }))}
              />
            </Form.Item>

            <Form.Item name="unit_id" label="الوحدة">
              <Select
                placeholder="اختر الوحدة"
                allowClear
                loading={loading.units}
                showSearch
                filterOption={filterOptions}
                options={options.units.map(unit => ({
                  value: unit.id,
                  label: `${unit.unit_number} - ${unit.unit_type}`
                }))}
              />
            </Form.Item>

            {!isSalesAgent && canViewUsers && (
              <Form.Item name="user_id" label="المستخدم">
                <Select
                  placeholder="اختر المستخدم"
                  allowClear
                  loading={loading.users}
                  showSearch
                  filterOption={filterOptions}
                  options={options.users.map(user => ({
                    value: user.id,
                    label: `${user.first_name} ${user.last_name} - ${user.phone}`
                  }))}
                />
              </Form.Item>
            )}

            <Form.Item name="date_from" label="من تاريخ">
              <DatePicker className="w-full" />
            </Form.Item>

            <Form.Item name="date_to" label="إلى تاريخ">
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={resetFilters}>
              إعادة تعيين
            </Button>
            <Button type="primary" htmlType="submit">
              تطبيق الفلتر
            </Button>
          </div>
        </Form>
      )}
    </div>
  );
};

export default ReservationsFilter; 