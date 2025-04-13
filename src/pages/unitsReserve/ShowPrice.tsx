import React, { useState, useEffect } from "react";
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { toast } from "react-hot-toast";
import axiosInstance from "../../axiosInstance";

interface Project {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  installment_options: string[];
  additional_expenses: AdditionalExpense[];
  buildings: Building[];
  deposit_percentage?: number;
  cash_factor?: number;
  reduction_factor?: number;
}

interface AdditionalExpense {
  id: number;
  name: string;
  type: 'PERCENTAGE' | 'FIXED_VALUE';
  value: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface InstallmentDetails {
  type: 'MONTHLY' | 'ANNUAL' | 'QUARTERLY';
  count: string;
  amount: string;
}

interface Building {
  id: number;
  name: string;
  units: Unit[];
}

interface Unit {
  id: number;
  unit_number: string;
  unit_type: string;
  price: number;
  price_per_meter: number;
  status: string;
  area: number;
  floor: number;
  bedrooms: number | null;
  bathrooms: number | null;
  description: string | null;
}

interface UnitDetails {
  unit_number: string;
  unit_type: string;
  price: string;
  status: string;
  area: string;
  price_per_meter: string;
  floor: string;
  bedrooms: string;
  bathrooms: string;
  downPayment: string;
  installments: InstallmentDetails[];
  additional_expenses: {
    [key: string]: string;
  };
  finalPrice: string;
}

interface UnitErrors {
  [key: string]: string;
}

interface PriceBreakdown {
  unit_price: number;
  cash_price: number;
  deposit_amount: number;
  financed_amount: number;
  monthly_installment: number;
  total_paid: number;
  additional_expenses: {
    name: string;
    type: 'PERCENTAGE' | 'FIXED_VALUE';
    value: number;
    amount: number;
  }[];
  final_price: number;
}

const ShowPrice = () => {
  // State for projects, buildings, and units
  const [projects, setProjects] = useState<Project[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // State for selected project, building, and unit
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState({
    projects: false,
    buildings: false,
    units: false,
    generatingPDF: false
  });
  
  const [errors, setErrors] = useState<UnitErrors>({});

  // Add new state for installment types
  const [availableInstallmentTypes, setAvailableInstallmentTypes] = useState<string[]>([]);
  const [selectedInstallmentType, setSelectedInstallmentType] = useState<string | null>(null);

  // Unit Details State
  const [unitDetails, setUnitDetails] = useState<UnitDetails>({
    unit_number: "",
    unit_type: "",
    price: "",
    status: "",
    area: "",
    price_per_meter: "",
    floor: "",
    bedrooms: "",
    bathrooms: "",
    downPayment: "",
    installments: [],
    additional_expenses: {},
    finalPrice: "0",
  });

  // Add new state for price breakdown
  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null);

  // Add translation map for installment types
  const installmentTypeTranslations: { [key: string]: string } = {
    'MONTHLY': 'شهري',
    'ANNUAL': 'سنوي',
    'QUARTERLY': 'ربع سنوي'
  };

  // Filter functions with proper Ant Design types
  const filterProjects: SelectProps['filterOption'] = (input, option) => {
    if (!option) return false;
    return option.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false;
  };

  const filterBuildings: SelectProps['filterOption'] = (input, option) => {
    if (!option) return false;
    return option.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false;
  };

  const filterUnits: SelectProps['filterOption'] = (input, option) => {
    if (!option) return false;
    return option.label?.toString().toLowerCase().includes(input.toLowerCase()) ?? false;
  };

  // Fetch projects
  useEffect(() => {
    const fetchData = async () => {
      setLoading(prev => ({ ...prev, projects: true }));
      try {
        const projectsResponse = await axiosInstance.get('/projects');
        setProjects(projectsResponse.data.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast.error('فشل في تحميل المشاريع');
      } finally {
        setLoading(prev => ({ ...prev, projects: false }));
      }
    };

    fetchData();
  }, []);

  // Fetch buildings when project is selected
  useEffect(() => {
    const fetchBuildings = async () => {
      if (selectedProject) {
        setLoading(prev => ({ ...prev, buildings: true }));
        setSelectedBuilding(null);
        setSelectedUnit(null);
        try {
          const buildingsResponse = await axiosInstance.get('/buildings', {
            params: { project_id: selectedProject }
          });
          setBuildings(buildingsResponse.data.data);
          
          // Get project details to load installment options
          const projectDetails = projects.find(p => p.id === selectedProject);
          if (projectDetails) {
            setAvailableInstallmentTypes(projectDetails.installment_options);
          }
        } catch (error) {
          console.error('Error fetching buildings:', error);
          toast.error('فشل في تحميل المباني');
        } finally {
          setLoading(prev => ({ ...prev, buildings: false }));
        }
      } else {
        setBuildings([]);
      }
    };

    fetchBuildings();
  }, [selectedProject, projects]);

  // Fetch units when building is selected
  useEffect(() => {
    const fetchUnits = async () => {
      if (selectedBuilding) {
        setLoading(prev => ({ ...prev, units: true }));
        setSelectedUnit(null);
        try {
          const unitsResponse = await axiosInstance.get('/units', {
            params: { building_id: selectedBuilding }
          });
          setUnits(unitsResponse.data.data);
        } catch (error) {
          console.error('Error fetching units:', error);
          toast.error('فشل في تحميل الوحدات');
        } finally {
          setLoading(prev => ({ ...prev, units: false }));
        }
      } else {
        setUnits([]);
      }
    };

    fetchUnits();
  }, [selectedBuilding]);

  // Update unit details when a unit is selected
  useEffect(() => {
    if (selectedUnit && units.length > 0) {
      const unit = units.find(u => u.id === selectedUnit);
      if (unit) {
        // Get the project to access installment options and deposit percentage
        const project = projects.find(p => p.id === selectedProject);
        
        // Calculate default down payment based on deposit percentage
        const defaultDownPayment = project?.deposit_percentage 
          ? Math.ceil(unit.price * project.deposit_percentage / 100).toString()
          : '';

        setUnitDetails({
          unit_number: unit.unit_number || '',
          unit_type: unit.unit_type || '',
          price: (unit.price || 0).toString(),
          status: unit.status || '',
          area: (unit.area || 0).toString(),
          price_per_meter: (unit.price_per_meter || 0).toString(),
          floor: getArabicFloor(unit.floor || 0),
          bedrooms: unit.bedrooms?.toString() || '',
          bathrooms: unit.bathrooms?.toString() || '',
          downPayment: defaultDownPayment,
          installments: project?.installment_options?.[0] ? [{
            type: project.installment_options[0] as 'MONTHLY' | 'ANNUAL' | 'QUARTERLY',
            count: '',
            amount: ''
          }] : [],
          additional_expenses: {},
          finalPrice: defaultDownPayment || unit.price.toString()
        });
      }
    }
  }, [selectedUnit, units, selectedProject, projects]);

  // Handle input changes
  const handleUnitDetailChange = (key: keyof UnitDetails, value: string) => {
    setUnitDetails(prev => ({
      ...prev,
      [key]: value
    }));

    if (key === 'downPayment') {
      const downPayment = parseFloat(value || '0');
      const originalPrice = parseFloat(unitDetails.price || '0');
      
      if (!isNaN(downPayment) && !isNaN(originalPrice) && downPayment > originalPrice) {
        setErrors(prev => ({
          ...prev,
          downPayment: "يجب أن تكون الدفعة المقدمة أقل من سعر الوحدة"
        }));
      } else {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.downPayment;
          return newErrors;
        });
      }
      
      // Calculate final price when down payment changes
      calculateFinalPrice();
    }
  };

  // Arabic translations
  const getArabicFloor = (floor: number): string => {
    const floorMap: { [key: number]: string } = {
      '-1': 'البدروم',
      '0': 'الأرضي',
      '1': 'الأول',
      '2': 'الثاني',
      '3': 'الثالث',
      '4': 'الرابع',
      '5': 'الخامس',
      '6': 'السادس',
      '7': 'السابع',
      '8': 'الثامن',
      '9': 'التاسع',
      '10': 'العاشر'
    };
    return floorMap[floor] || floor.toString();
  };

  const getArabicUnitType = (type: string): string => {
    const typeMap: { [key: string]: string } = {
      'shop': 'محل',
      'apartment': 'شقة',
      'office': 'مكتب',
      'studio': 'استوديو'
    };
    return typeMap[type] || type;
  };

  // Handle installment type selection
  const handleInstallmentTypeSelect = (type: string) => {
    const existingInstallment = unitDetails.installments.find(inst => inst.type === type);
    
    if (existingInstallment) {
      setUnitDetails(prev => ({
        ...prev,
        installments: prev.installments.filter(inst => inst.type !== type)
      }));
      if (selectedInstallmentType === type) {
        setSelectedInstallmentType(null);
      }
    } else {
      setUnitDetails(prev => ({
        ...prev,
        installments: [...prev.installments, {
          type: type as 'MONTHLY' | 'ANNUAL' | 'QUARTERLY',
          count: '',
          amount: ''
        }]
      }));
      setSelectedInstallmentType(type);
    }
    
    // Calculate final price when installment types change
    calculateFinalPrice();
  };

  // Handle installment updates
  const handleInstallmentUpdate = (type: string, field: 'count' | 'amount', value: string) => {
    setUnitDetails(prev => ({
      ...prev,
      installments: prev.installments.map(inst =>
        inst.type === type ? { ...inst, [field]: value } : inst
      )
    }));

    calculateInstallmentValues(type, value, field);
  };

  // Calculate installment values
  const calculateInstallmentValues = (type: string, value: string, field: 'count' | 'amount') => {
    const originalPrice = parseFloat(unitDetails.price || '0');
    const downPayment = parseFloat(unitDetails.downPayment || '0');
    const remainingAmount = originalPrice - downPayment;

    if (isNaN(remainingAmount) || remainingAmount <= 0) return;

    if (field === 'count') {
      const count = parseInt(value || '0', 10);
      if (!isNaN(count) && count > 0) {
        const amount = Math.ceil(remainingAmount / count).toFixed(2);
        setUnitDetails(prev => ({
          ...prev,
          installments: prev.installments.map(inst =>
            inst.type === type ? { ...inst, amount } : inst
          )
        }));
      }
    } else {
      const amount = parseFloat(value || '0');
      if (!isNaN(amount) && amount > 0) {
        const count = Math.ceil(remainingAmount / amount).toString();
        setUnitDetails(prev => ({
          ...prev,
          installments: prev.installments.map(inst =>
            inst.type === type ? { ...inst, count } : inst
          )
        }));
      }
    }
    
    // Calculate final price after updating installments
    calculateFinalPrice();
  };

  // Calculate final price based on down payment and installments
  const calculateFinalPrice = () => {
    const downPayment = parseFloat(unitDetails.downPayment || '0');
    
    // Calculate total installments amount
    const totalInstallmentsAmount = unitDetails.installments.reduce((total, installment) => {
      const count = parseInt(installment.count || '0', 10);
      const amount = parseFloat(installment.amount || '0');
      return total + (count * amount);
    }, 0);
    
    // Final price = down payment + total installments amount
    const finalPrice = downPayment + totalInstallmentsAmount;
    
    setUnitDetails(prev => ({
      ...prev,
      finalPrice: finalPrice.toString()
    }));
  };

  // Update final price when down payment changes
  useEffect(() => {
    calculateFinalPrice();
  }, [unitDetails.downPayment, unitDetails.installments]);

  // Calculate price breakdown
  const calculatePriceBreakdown = (
    unit_price: number,
    deposit_percentage: number,
    cash_factor: number,
    reduction_factor: number,
    installment_type: string,
    installment_count: number,
    additional_expenses: AdditionalExpense[]
  ): PriceBreakdown => {
    // Calculate cash price
    const cash_price = unit_price * cash_factor;

    // Calculate deposit amount
    const deposit_amount = deposit_percentage * unit_price;

    // Calculate financed amount
    const financed_amount = deposit_amount - (cash_price * reduction_factor);

    // Calculate monthly installment using annuity formula
    const r = reduction_factor; // monthly discount rate
    const n = installment_count;
    const monthly_installment = ( Math.pow(financed_amount * r *(1 + r), n)) / (Math.pow(1 + r, n -1 ));
    console.log(r, cash_factor, n, monthly_installment);

    // Calculate total paid
    const total_paid = deposit_amount + (monthly_installment * n);

    // Calculate additional expenses
    const calculated_expenses = additional_expenses.map(expense => {
      let amount = 0;
      if (expense.type === 'PERCENTAGE') {
        amount = (unit_price * parseFloat(expense.value)) / 100;
      } else if (expense.type === 'FIXED_VALUE') {
        amount = parseFloat(expense.value);
      }
      return {
        name: expense.name,
        type: expense.type,
        value: parseFloat(expense.value),
        amount
      };
    });

    // Calculate final price
    const final_price = total_paid + calculated_expenses.reduce((sum, expense) => sum + expense.amount, 0);

    return {
      unit_price,
      cash_price,
      deposit_amount,
      financed_amount,
      monthly_installment,
      total_paid,
      additional_expenses: calculated_expenses,
      final_price
    };
  };

  // Update price breakdown when unit details change
  useEffect(() => {
    if (selectedUnit && selectedProject) {
      const unit = units.find(u => u.id === selectedUnit);
      const project = projects.find(p => p.id === selectedProject);
      
      if (unit && project) {
        const breakdown = calculatePriceBreakdown(
          unit.price,
          project.deposit_percentage || 0,
          project.cash_factor || 1,
          project.reduction_factor || 1, 
          unitDetails.installments[0]?.type || 'MONTHLY',
          parseInt(unitDetails.installments[0]?.count || '0'),
          project.additional_expenses || []
        );
        
        setPriceBreakdown(breakdown);
      }
    }
  }, [selectedUnit, selectedProject, unitDetails.installments, units, projects]);

  // Generate PDF function
  const generatePDF = async () => {
    if (!selectedUnit) {
      toast.error("الرجاء اختيار وحدة أولاً");
      return;
    }

    setLoading(prev => ({ ...prev, generatingPDF: true }));
    try {
      // Get the project to access additional expenses
      const project = projects.find(p => p.id === selectedProject);
      
      // Prepare additional expenses data
      const additionalExpensesData = project?.additional_expenses
        ?.filter(expense => expense.is_active)
        .map(expense => {
          const unitPrice = parseFloat(unitDetails.price || '0');
          let value = 0;
          
          if (expense.type === 'FIXED_VALUE') {
            value = parseFloat(expense.value || '0');
          } else if (expense.type === 'PERCENTAGE') {
            value = (unitPrice * parseFloat(expense.value || '0')) / 100;
          }
          
          return {
            name: expense.name,
            value: value.toFixed(2)
          };
        }) || [];

      const requestData = {
        deposit_amount: parseFloat(unitDetails.downPayment || '0'),
        installments: unitDetails.installments.map(installment => ({
          type: installment.type,
          count: parseInt(installment.count || '0'),
          amount: parseFloat(installment.amount || '0')
        })),
        additional_expenses: additionalExpensesData,
        final_price: parseFloat(unitDetails.finalPrice || '0')
      };

      const response = await axiosInstance.post(
        `/units/${selectedUnit}/price-breakdown`,
        requestData,
        {
          responseType: 'blob'
        }
      );

      // Create a URL for the blob
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      
      // Create a link and trigger download
      const link = document.createElement('a');
      link.href = url;
      link.download = 'price-breakdown.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('تم إنشاء ملف PDF بنجاح');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('فشل في إنشاء ملف PDF');
    } finally {
      setLoading(prev => ({ ...prev, generatingPDF: false }));
    }
  };

  return (
    <div className="page-container bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mobile-margin">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">عرض تفاصيل السعر</h1>
          <p className="mt-2 text-xs sm:text-sm text-gray-600">قم باختيار الوحدة لعرض تفاصيل السعر والتقسيط</p>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">اختيار الوحدة</h2>
          </div>
          
          <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">المشروع</label>
              <Select
                loading={loading.projects}
                value={selectedProject}
                onChange={(value) => setSelectedProject(value)}
                options={projects.map(p => ({ label: p.name, value: p.id }))}
                placeholder="اختر المشروع"
                className="w-full"
                showSearch
                filterOption={filterProjects}
              />
            </div>

            {/* Building Selection */}
            {selectedProject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">المبنى</label>
                <Select
                  loading={loading.buildings}
                  value={selectedBuilding}
                  onChange={(value) => setSelectedBuilding(value)}
                  options={buildings.map(b => ({ label: b.name, value: b.id }))}
                  placeholder="اختر المبنى"
                  className="w-full"
                  showSearch
                  filterOption={filterBuildings}
                />
              </div>
            )}

            {/* Unit Selection */}
            {selectedBuilding && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الوحدة</label>
                <Select
                  loading={loading.units}
                  value={selectedUnit}
                  onChange={(value) => setSelectedUnit(value)}
                  options={units.map(u => ({
                    label: `${u.unit_number} - ${getArabicUnitType(u.unit_type)}`,
                    value: u.id,
                    disabled: u.status !== "متاحة"
                  }))}
                  placeholder="اختر الوحدة"
                  className="w-full"
                  showSearch
                  filterOption={filterUnits}
                />
              </div>
            )}
          </div>
        </div>

        {selectedUnit && (
          <>
            {/* Unit Details */}
            <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">تفاصيل الوحدة</h2>
              </div>
              
              <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">رقم الوحدة</label>
                  <input
                    type="text"
                    value={unitDetails.unit_number}
                    disabled
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نوع الوحدة</label>
                  <input
                    type="text"
                    value={getArabicUnitType(unitDetails.unit_type)}
                    disabled
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">المساحة</label>
                  <input
                    type="text"
                    value={`${unitDetails.area} م²`}
                    disabled
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سعر المتر</label>
                  <input
                    type="text"
                    value={`${parseFloat(unitDetails.price_per_meter).toLocaleString()} جنيه`}
                    disabled
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
              <div className="px-6 py-5 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">تفاصيل الدفع</h2>
              </div>
              
              <div className="px-6 py-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">السعر الإجمالي</label>
                    <input
                      type="text"
                      value={`${parseFloat(unitDetails.price).toLocaleString()} جنيه`}
                      disabled
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الدفعة المقدمة</label>
                    <input
                      type="number"
                      value={unitDetails.downPayment}
                      onChange={(e) => handleUnitDetailChange('downPayment', e.target.value)}
                      className={`block w-full border ${errors.downPayment ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                      placeholder="أدخل قيمة الدفعة المقدمة"
                    />
                    {errors.downPayment && (
                      <p className="mt-1 text-sm text-red-600">{errors.downPayment}</p>
                    )}
                  </div>
                </div>

                {/* Installment Types */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">أنظمة التقسيط المتاحة</label>
                  <div className="flex flex-wrap gap-3">
                    {availableInstallmentTypes.map((type) => (
                      <button
                        key={type}
                        onClick={() => handleInstallmentTypeSelect(type)}
                        className={`px-4 py-2 rounded-md text-sm font-medium ${
                          unitDetails.installments.some(i => i.type === type)
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {installmentTypeTranslations[type]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Installment Details */}
                {unitDetails.installments.length > 0 && (
                  <div className="space-y-6">
                    {unitDetails.installments.map((installment) => (
                      <div key={installment.type} className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                          {installmentTypeTranslations[installment.type]}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              عدد الأقساط
                            </label>
                            <input
                              type="number"
                              value={installment.count}
                              onChange={(e) => handleInstallmentUpdate(installment.type, 'count', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="عدد الأقساط"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              قيمة القسط
                            </label>
                            <input
                              type="number"
                              value={installment.amount}
                              onChange={(e) => handleInstallmentUpdate(installment.type, 'amount', e.target.value)}
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              placeholder="قيمة القسط"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Expenses */}
                {selectedProject && (() => {
                  const project = projects.find(p => p.id === selectedProject);
                  if (!project || !project.additional_expenses || project.additional_expenses.length === 0) {
                    return null;
                  }
                  
                  return (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">المصروفات الإضافية</h3>
                      <div className="space-y-4">
                        {project.additional_expenses.map((expense) => {
                          if (!expense.is_active) return null;
                          
                          const unitPrice = parseFloat(unitDetails.price || '0');
                          let expenseValue = 0;
                          
                          if (expense.type === 'FIXED_VALUE') {
                            expenseValue = parseFloat(expense.value || '0');
                          } else if (expense.type === 'PERCENTAGE') {
                            expenseValue = (unitPrice * parseFloat(expense.value || '0')) / 100;
                          }
                          
                          return (
                            <div key={expense.id} className="bg-gray-50 p-4 rounded-lg">
                              <div className="grid grid-cols-1 gap-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {expense.name}
                                  </label>
                                  <input
                                    type="text"
                                    value={`${expenseValue.toLocaleString()} جنيه`}
                                    disabled
                                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-100 text-gray-700 sm:text-sm"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Final Price */}
                <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">السعر النهائي</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {parseFloat(unitDetails.finalPrice).toLocaleString()} جنيه
                    </span>
                  </div>
                </div>

                {/* Generate PDF Button */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={generatePDF}
                    disabled={loading.generatingPDF}
                    className={`px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      loading.generatingPDF ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading.generatingPDF ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري إنشاء PDF...
                      </span>
                    ) : (
                      'طباعة تفاصيل السعر'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {priceBreakdown && (
          <div className="bg-white shadow rounded-lg overflow-hidden mt-6">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">تفاصيل السعر</h2>
            </div>
            
            <div className="px-6 py-5 space-y-6">
              {/* Price Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">السعر الأساسي</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">سعر الوحدة</span>
                      <span className="font-medium">{priceBreakdown.unit_price.toLocaleString()} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">السعر النقدي</span>
                      <span className="font-medium">{priceBreakdown.cash_price.toLocaleString()} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">الدفعة المقدمة</span>
                      <span className="font-medium">{priceBreakdown.deposit_amount.toLocaleString()} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">المبلغ الممول</span>
                      <span className="font-medium">{priceBreakdown.financed_amount.toLocaleString()} جنيه</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">التقسيط</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">القسط الشهري</span>
                      <span className="font-medium">{priceBreakdown.monthly_installment.toLocaleString()} جنيه</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">عدد الأقساط</span>
                      <span className="font-medium">{unitDetails.installments[0]?.count || '0'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">المبلغ الإجمالي</span>
                      <span className="font-medium">{priceBreakdown.total_paid.toLocaleString()} جنيه</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Expenses */}
              {priceBreakdown.additional_expenses.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">المصروفات الإضافية</h3>
                  <div className="space-y-2">
                    {priceBreakdown.additional_expenses.map((expense, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{expense.name}</span>
                        <span className="font-medium">{expense.amount.toLocaleString()} جنيه</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Final Price */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">السعر النهائي</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {priceBreakdown.final_price.toLocaleString()} جنيه
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShowPrice;