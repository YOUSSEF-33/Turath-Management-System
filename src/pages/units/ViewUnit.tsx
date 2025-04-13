import React from "react";
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axiosInstance from '../../axiosInstance';
import GenericTable from '../../components/GenericTable';
import { Eye, Trash, Search, Filter } from 'lucide-react';
import { Modal, Button, Input, Select, Slider, InputNumber, Row, Col, Badge, Card, Divider, Tooltip } from 'antd';
import toast from 'react-hot-toast';
import ToggleSwitch from '../../components/ToggleSwitch';
import { usePermissionsContext } from '../../context/PermissionsContext';

interface Unit {
  id: number;
  building_id: number;
  unit_number: string;
  unit_type: string;
  price: number;
  price_per_meter: number;
  status: string;
  area: string;
  floor: number;
  bedrooms: number;
  bathrooms: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface Building {
  id: number;
  name: string;
  description: string;
  units: Unit[];
}

// Define filter interface
interface UnitFilters {
  unit_number?: string;
  min_price_per_meter?: number;
  max_price_per_meter?: number;
  status?: string[];
  min_area?: number;
  max_area?: number;
  bedrooms?: number[];
  bathrooms?: number[];
  floor?: number[];
  is_active?: boolean;
}

interface BackendFilters {
  building_id?: number;
  unit_number?: string;
  price_per_meter_min?: number;
  price_per_meter_max?: number;
  area_min?: number;
  area_max?: number;
  rooms_count?: number;
  bathrooms_count?: number;
  floor?: number;
  status?: string[];
  is_active?: boolean;
}

interface Action {
  key: string;
  icon: JSX.Element;
  onClick: (unitId: number) => void;
  color: string;
  permission?: string;
}

const ViewUnit: React.FC = () => {
  const { projectId, buildingId } = useParams<{ projectId: string; buildingId: string }>();
  const navigate = useNavigate();
  const { hasPermission } = usePermissionsContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const [building, setBuilding] = useState<Building | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [unitToDelete, setUnitToDelete] = useState<number | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [togglingStatus, setTogglingStatus] = useState<number | null>(null);

  // Filter state
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [filters, setFilters] = useState<UnitFilters>({});
  const [appliedFilters, setAppliedFilters] = useState<BackendFilters>({});
  const [maxPriceDefault, setMaxPriceDefault] = useState<number>(10000000);
  const [maxAreaDefault, setMaxAreaDefault] = useState<number>(1000);
  const [applyingFilters, setApplyingFilters] = useState<boolean>(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(12);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Initialize filters from URL params
  useEffect(() => {
    const params = Object.fromEntries(searchParams.entries());
    const initialFilters: UnitFilters = {};
    
    if (params.unit_number) initialFilters.unit_number = params.unit_number;
    if (params.status) initialFilters.status = params.status.split(',');
    if (params.bedrooms) initialFilters.bedrooms = [parseInt(params.bedrooms)];
    if (params.bathrooms) initialFilters.bathrooms = [parseInt(params.bathrooms)];
    if (params.floor) initialFilters.floor = [parseInt(params.floor)];
    if (params.min_price_per_meter) initialFilters.min_price_per_meter = parseInt(params.min_price_per_meter);
    if (params.max_price_per_meter) initialFilters.max_price_per_meter = parseInt(params.max_price_per_meter);
    if (params.min_area) initialFilters.min_area = parseInt(params.min_area);
    if (params.max_area) initialFilters.max_area = parseInt(params.max_area);
    if (params.is_active !== undefined) initialFilters.is_active = params.is_active === 'true';
    
    setFilters(initialFilters);
    
    // Apply the filters immediately
    if (Object.keys(initialFilters).length > 0) {
      applyFilters(initialFilters);
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // First fetch building details
      const buildingResponse = await axiosInstance.get<{ data: Building }>(`/buildings/${buildingId}`);
      setBuilding(buildingResponse.data.data);
      
      // Set defaults based on data
      const allUnits = buildingResponse.data.data.units || [];
      if (allUnits.length > 0) {
        const highestPrice = Math.max(...allUnits.map(unit => Number(unit.price) || 0));
        const highestArea = Math.max(...allUnits.map(unit => Number(unit.area) || 0));
        setMaxPriceDefault(Math.ceil(highestPrice * 1.2));
        setMaxAreaDefault(Math.ceil(highestArea * 1.2));
      }
      
      // Then fetch units for this building with pagination and filters
      const params: Record<string, unknown> = {
        building_id: buildingId,
        page: currentPage,
        per_page: itemsPerPage
      };
      
      // Add filter parameters to API request
      Object.entries(appliedFilters).forEach(([key, value]) => {
        // Skip empty arrays and undefined values
        if (Array.isArray(value) && value.length === 0) return;
        if (value === undefined) return;
        
        // Add the filter to params
        params[key] = value;
      });
      
      console.log('Fetching units with params:', params);
      
      const unitsResponse = await axiosInstance.get(`/units`, { params });
      
      setUnits(unitsResponse.data.data);
      console.log('Units fetched:', unitsResponse.data.data.length);
      
      // Set total pages from response metadata
      if (unitsResponse.data.meta && unitsResponse.data.meta.total) {
        const total = Math.ceil(unitsResponse.data.meta.total / itemsPerPage);
        setTotalPages(total);
        console.log(`Total pages: ${total}, Total units: ${unitsResponse.data.meta.total}`);
      }
      
      // Show a success message when filters are applied and data is fetched
      if (getFilterCount() > 0) {
        toast.success(`تم العثور على ${unitsResponse.data.data.length} وحدة`);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
      setApplyingFilters(false); // Ensure the applying filters state is reset
    }
  };

  useEffect(() => {
    console.log('Filter dependencies changed, fetching data...');
    fetchData();
  }, [buildingId, currentPage, itemsPerPage, JSON.stringify(appliedFilters)]);

  // Add focus effect to refetch data
  useEffect(() => {
    const handleFocus = () => {
      fetchData();
    };

    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleView = (unitId: number) => {
    navigate(`/projects/${projectId}/buildings/${buildingId}/units/${unitId}`);
  };

  const handleDelete = async () => {
    if (unitToDelete !== null) {
      setDeleting(true);
      try {
        await axiosInstance.delete(`/units/${unitToDelete}`);
        setUnits(units.filter(unit => unit.id !== unitToDelete));
        toast.success('تم حذف الوحدة بنجاح');
        fetchData(); // Refresh the data after deletion
      } catch (error) {
        console.error('Error deleting unit:', error);
        toast.error('حدث خطأ أثناء حذف الوحدة');
      } finally {
        setShowDeleteModal(false);
        setUnitToDelete(null);
        setDeleting(false);
      }
    }
  };

  const handleToggleActive = async (unitId: number, isActive: boolean) => {
    setTogglingStatus(unitId);
    try {
      await axiosInstance.patch(`/units/${unitId}/activate`, {
        is_active: isActive
      });
      
      // Update the units state with the new active status
      setUnits(units.map(unit => 
        unit.id === unitId ? { ...unit, is_active: isActive } : unit
      ));
      
      toast.success(`تم ${isActive ? 'تفعيل' : 'تعطيل'} الوحدة بنجاح`);
    } catch (error) {
      console.error('Error toggling unit status:', error);
      toast.error('حدث خطأ أثناء تغيير حالة الوحدة');
    } finally {
      setTogglingStatus(null);
    }
  };

  const confirmDelete = (unitId: number) => {
    setUnitToDelete(unitId);
    setShowDeleteModal(true);
  };
  
  const applyFilters = (filterValues: UnitFilters = filters) => {
    console.log('Applying filters:', filterValues);
    setApplyingFilters(true);
    
    // Transform filters to match backend keys
    const transformedFilters: BackendFilters = {
      building_id: buildingId ? parseInt(buildingId) : undefined,
      unit_number: filterValues.unit_number,
      price_per_meter_min: filterValues.min_price_per_meter,
      price_per_meter_max: filterValues.max_price_per_meter,
      area_min: filterValues.min_area,
      area_max: filterValues.max_area,
      rooms_count: filterValues.bedrooms ? parseInt(filterValues.bedrooms[0].toString()) : undefined,
      bathrooms_count: filterValues.bathrooms ? parseInt(filterValues.bathrooms[0].toString()) : undefined,
      floor: filterValues.floor ? parseInt(filterValues.floor[0].toString()) : undefined,
      status: filterValues.status,
      is_active: filterValues.is_active
    };

    // Remove undefined values
    Object.keys(transformedFilters).forEach(key => 
      transformedFilters[key as keyof BackendFilters] === undefined && delete transformedFilters[key as keyof BackendFilters]
    );

    // Update URL params
    const newParams = new URLSearchParams();
    if (filterValues.unit_number) newParams.set('unit_number', filterValues.unit_number);
    if (filterValues.status?.length) newParams.set('status', filterValues.status.join(','));
    if (filterValues.bedrooms?.length) newParams.set('bedrooms', filterValues.bedrooms[0].toString());
    if (filterValues.bathrooms?.length) newParams.set('bathrooms', filterValues.bathrooms[0].toString());
    if (filterValues.floor?.length) newParams.set('floor', filterValues.floor[0].toString());
    if (filterValues.min_price_per_meter) newParams.set('min_price_per_meter', filterValues.min_price_per_meter.toString());
    if (filterValues.max_price_per_meter) newParams.set('max_price_per_meter', filterValues.max_price_per_meter.toString());
    if (filterValues.min_area) newParams.set('min_area', filterValues.min_area.toString());
    if (filterValues.max_area) newParams.set('max_area', filterValues.max_area.toString());
    if (filterValues.is_active !== undefined) newParams.set('is_active', filterValues.is_active.toString());
    
    setSearchParams(newParams);
    setAppliedFilters(transformedFilters);
    setCurrentPage(1); // Reset to first page when filters change
    
    // We add a slight delay to show the loading state
    setTimeout(() => {
      setApplyingFilters(false);
      toast.success('تم تطبيق الفلاتر');
    }, 300);
  };

  const clearFilters = () => {
    setApplyingFilters(true);
    setFilters({});
    setAppliedFilters({});
    setCurrentPage(1);
    setSearchParams(new URLSearchParams()); // Clear URL params
    
    // We add a slight delay to show the loading state
    setTimeout(() => {
      setApplyingFilters(false);
      toast.success('تم إعادة تعيين الفلاتر');
    }, 300);
  };

  const statusOptions = [
    { value: 'AVAILABLE', label: 'متاح' },
    { value: 'RESERVED', label: 'محجوز' },
    { value: 'SOLD', label: 'مباع' },
  ];

  const actions: Action[] = [
    { 
      key: 'view', 
      icon: <Eye className="h-5 w-5" />, 
      onClick: handleView, 
      color: 'text-blue-600',
      permission: 'view_units'
    },
    { 
      key: 'delete', 
      icon: <Trash className="h-5 w-5" />, 
      onClick: confirmDelete, 
      color: 'text-red-600',
      permission: 'delete_units'
    },
  ];

  // Filter actions based on permissions
  const filteredActions = actions.filter(action => 
    !action.permission || hasPermission(action.permission)
  );

  // Get count of applied filters
  const getFilterCount = () => {
    let count = 0;
    if (appliedFilters.unit_number) count++;
    if (appliedFilters.price_per_meter_min || appliedFilters.price_per_meter_max) count++;
    if (appliedFilters.area_min || appliedFilters.area_max) count++;
    if (appliedFilters.rooms_count) count++;
    if (appliedFilters.bathrooms_count) count++;
    if (appliedFilters.floor) count++;
    if (appliedFilters.status && appliedFilters.status.length > 0) count++;
    if (appliedFilters.is_active !== undefined) count++;
    return count;
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Page Header */}
      <div className="bg-gray-100 shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">{building?.name}</h1>
          <Button
            onClick={() => navigate(`/projects/${projectId}`)}
            type="default"
            size="middle"
            className="flex items-center"
          >
            عودة
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900">قائمة الوحدات</h3>
            <Tooltip title={getFilterCount() > 0 ? "تم تطبيق الفلاتر" : "لم يتم تطبيق أي فلاتر"}>
              <Button 
                type="primary"
                icon={<Filter size={16} />}
                onClick={() => setShowFilters(!showFilters)}
                style={{ backgroundColor: getFilterCount() > 0 ? '#52c41a' : undefined }}
              >
                {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
                {getFilterCount() > 0 && (
                  <Badge 
                    count={getFilterCount()} 
                    style={{ 
                      backgroundColor: '#fff',
                      color: '#52c41a',
                      marginRight: '8px'
                    }} 
                  />
                )}
              </Button>
            </Tooltip>
          </div>
          
          {/* Filter UI */}
          {showFilters && (
            <Card className="mb-6 border-blue-500 border-t-4">
              <div className="mb-4">
                <h4 className="text-lg font-medium text-gray-800">تصفية الوحدات</h4>
                <Divider className="my-3" />
              </div>
              
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      رقم الوحدة
                    </label>
                    <Input
                      placeholder="رقم الوحدة"
                      value={filters.unit_number || ''}
                      onChange={(e) => setFilters({...filters, unit_number: e.target.value})}
                      prefix={<Search size={16} />}
                      allowClear
                    />
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الحالة
                    </label>
                    <Select
                      mode="multiple"
                      placeholder="اختر الحالة"
                      value={filters.status || []}
                      onChange={(value) => setFilters({...filters, status: value})}
                      options={statusOptions}
                      style={{ width: '100%' }}
                      allowClear
                    />
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      عدد غرف النوم
                    </label>
                    <InputNumber
                      min={0}
                      value={filters.bedrooms?.[0]}
                      onChange={(value) => setFilters({...filters, bedrooms: value === null ? undefined : [value]})}
                      placeholder="عدد غرف النوم"
                      style={{ width: '100%' }}
                    />
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      عدد الحمامات
                    </label>
                    <InputNumber
                      min={1}
                      value={filters.bathrooms?.[0]}
                      onChange={(value) => setFilters({...filters, bathrooms: value === null ? undefined : [value]})}
                      placeholder="عدد الحمامات"
                      style={{ width: '100%' }}
                    />
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      الطابق
                    </label>
                    <InputNumber
                      min={0}
                      value={filters.floor?.[0]}
                      onChange={(value) => setFilters({...filters, floor: value === null ? undefined : [value]})}
                      placeholder="رقم الطابق"
                      style={{ width: '100%' }}
                    />
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نطاق سعر المتر
                    </label>
                    <div className="flex items-center space-x-2">
                      <InputNumber
                        min={0}
                        value={filters.min_price_per_meter}
                        onChange={(value) => setFilters({...filters, min_price_per_meter: value === null ? undefined : value})}
                        placeholder="الحد الأدنى"
                        style={{ width: '100%' }}
                      />
                      <span>-</span>
                      <InputNumber
                        min={0}
                        value={filters.max_price_per_meter}
                        onChange={(value) => setFilters({...filters, max_price_per_meter: value === null ? undefined : value})}
                        placeholder="الحد الأقصى"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <Slider
                      range
                      min={0}
                      max={maxPriceDefault}
                      value={[filters.min_price_per_meter || 0, filters.max_price_per_meter || maxPriceDefault]}
                      onChange={(values) => setFilters({
                        ...filters,
                        min_price_per_meter: values[0],
                        max_price_per_meter: values[1]
                      })}
                    />
                  </div>
                </Col>
                
                <Col xs={24} sm={12} md={8} lg={6}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      نطاق المساحة (م²)
                    </label>
                    <div className="flex items-center space-x-2">
                      <InputNumber
                        min={0}
                        value={filters.min_area}
                        onChange={(value) => setFilters({...filters, min_area: value === null ? undefined : value})}
                        placeholder="الحد الأدنى"
                        style={{ width: '100%' }}
                      />
                      <span>-</span>
                      <InputNumber
                        min={0}
                        value={filters.max_area}
                        onChange={(value) => setFilters({...filters, max_area: value === null ? undefined : value})}
                        placeholder="الحد الأقصى"
                        style={{ width: '100%' }}
                      />
                    </div>
                    <Slider
                      range
                      min={0}
                      max={maxAreaDefault}
                      value={[filters.min_area || 0, filters.max_area || maxAreaDefault]}
                      onChange={(values) => setFilters({
                        ...filters,
                        min_area: values[0],
                        max_area: values[1]
                      })}
                    />
                  </div>
                </Col>
                
                <Col xs={24}>
                  <div className="flex justify-end space-x-3 mt-4">
                    <Button danger onClick={clearFilters} disabled={applyingFilters}>
                      مسح الفلاتر
                    </Button>
                    <Button type="primary" onClick={() => applyFilters(filters)} loading={applyingFilters}>
                      تطبيق الفلاتر
                    </Button>
                  </div>
                </Col>
              </Row>
            </Card>
          )}

          <GenericTable
            columns={[
              { header: 'رقم الوحدة', key: 'unit_number' },
              { header: 'سعر المتر', key: 'price_per_meter' },
              { header: 'السعر الإجمالي', key: 'price' },
              { header: 'الحالة', key: 'status' },
              { header: 'المساحة', key: 'area' },
              { 
                header: 'نشط', 
                key: 'is_active',
                render: (value, row) => (
                  <ToggleSwitch 
                    isActive={Boolean(value)} 
                    onChange={(isActive) => handleToggleActive(Number(row.id), isActive)}
                    loading={togglingStatus === Number(row.id)}
                    disabled={!hasPermission('edit_units')}
                  />
                )
              },
            ]}
            data={units as unknown as Record<string, unknown>[]}
            actions={filteredActions}
            loading={loading}
            onCreate={hasPermission('create_units') ? () => navigate(`/projects/${projectId}/buildings/${buildingId}/units/create`) : undefined}
            createButtonText="إضافة وحدة جديدة"
            itemsPerPage={itemsPerPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
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
            onClick={handleDelete} 
            loading={deleting}
            disabled={!hasPermission('delete_units')}
          >
            تأكيد
          </Button>,
        ]}
      >
        <p>هل أنت متأكد أنك تريد حذف هذه الوحدة؟</p>
      </Modal>
    </div>
  );
};

export default ViewUnit;