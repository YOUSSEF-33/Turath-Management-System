import React, { useState, useEffect } from "react";
import { Select } from 'antd';
import type { SelectProps } from 'antd';
import { toast } from "react-hot-toast";
import axiosInstance from "../../axiosInstance";
import InstallmentsBreakdown from "./InstallmentsBreakdown";

interface Project {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  installment_options: {
    MONTHLY?: number;
    ANNUAL?: number;
    QUARTERLY?: number;
  };
  additional_expenses: AdditionalExpense[];
  buildings: Building[];
  deposit_percentage?: number;
  cash_factor?: number;
  reduction_factor?: number;
  created_at: string;
  updated_at: string;
  documents_background: string | null;
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
  totalInstallmentsCount?: string;
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
  annual_installment: number;
  quarterly_installment: number;
  additional_expenses: {
    name: string;
    type: 'PERCENTAGE' | 'FIXED_VALUE';
    value: number;
    amount: number;
  }[];
  final_price: number;
}

// Add number formatter function
const formatNumber = (value: number | string): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(num)
    ? '0.00'
    : num.toLocaleString('en-EG', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
};

const ShowPrice = () => {
  // State for projects, buildings, and units
  const [projects, setProjects] = useState<Project[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // State for selected project, building, and unit
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<number | null>(null);

  // Global installment state
  const [installmentConfig, setInstallmentConfig] = useState({
    annual: {
      count: 0,
      amount: 0
    },
    quarterly: {
      count: 0,
      amount: 0
    },
    monthly: {
      count: 0,
      amount: 0
    }
  });

  // Loading and error states
  const [loading, setLoading] = useState({
    projects: false,
    buildings: false,
    units: false,
    generatingPDF: false
  });
  
  const [errors, setErrors] = useState<UnitErrors>({});

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
    totalInstallmentsCount: "1"
  });

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
          ? formatNumber((unit.price * project.deposit_percentage) / 100)
          : '';

        // Initialize all installment types as active
        const initialInstallments = project?.installment_options ? 
          Object.entries(project.installment_options).map(([type, percentage]) => ({
            type: type as 'MONTHLY' | 'ANNUAL' | 'QUARTERLY',
            count: '0',
            amount: '0'
          })) : [];
        
        // Reset global installment configuration
        setInstallmentConfig({
          annual: { count: 0, amount: 0 },
          quarterly: { count: 0, amount: 0 },
          monthly: { count: 0, amount: 0 }
        });

        // Set basic unit details first
        setUnitDetails({
          unit_number: unit.unit_number || '',
          unit_type: unit.unit_type || '',
          price: formatNumber(unit.price),
          status: unit.status || '',
          area: formatNumber(unit.area),
          price_per_meter: formatNumber(unit.price_per_meter),
          floor: getArabicFloor(unit.floor || 0),
          bedrooms: unit.bedrooms?.toString() || '',
          bathrooms: unit.bathrooms?.toString() || '',
          downPayment: defaultDownPayment,
          installments: initialInstallments,
          additional_expenses: {},
          finalPrice: defaultDownPayment || formatNumber(unit.price),
          totalInstallmentsCount: '0'
        });

        // Clear any existing down payment errors
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.downPayment;
          return newErrors;
        });
      }
    }
  }, [selectedUnit, units, selectedProject, projects]);

  // Handle input changes
  const handleUnitDetailChange = (key: keyof UnitDetails, value: string) => {
    if (key === 'downPayment') {
      // If empty, set to empty string
      if (!value) {
    setUnitDetails(prev => ({
      ...prev,
          downPayment: ''
        }));
        return;
      }

      // Remove any non-numeric characters except decimal point
      const numericValue = value.replace(/[^\d.]/g, '');
      
      // Format with the formatter function
      const formattedValue = numericValue ? formatNumber(numericValue) : '';

      setUnitDetails(prev => ({
        ...prev,
        downPayment: formattedValue
      }));

      // Convert back to number for validation (remove commas and convert to number)
      const downPayment = parseFloat(numericValue) || 0;
      const originalPrice = parseFloat(unitDetails.price.replace(/,/g, '')) || 0;
      
      if (downPayment > originalPrice) {
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

        // Recalculate installments with new down payment
        const project = projects.find(p => p.id === selectedProject);
        if (project && selectedUnit) {
          const unit = units.find(u => u.id === selectedUnit);
          if (unit) {
            const depositPercentage = (downPayment / unit.price) * 100;
            const total_months = parseInt(unitDetails.totalInstallmentsCount || '1', 10) || 1;

            // Get active installment types
            const activeInstallments = unitDetails.installments.filter(inst => 
              inst.type === 'ANNUAL' || inst.type === 'QUARTERLY' || inst.type === 'MONTHLY'
            );

            // Calculate annual installment if active
            const annualDetails = activeInstallments.some(inst => inst.type === 'ANNUAL')
              ? calculateAnnualInstallment(unit.price, total_months)
              : { count: 0, amount: 0 };

            // Calculate quarterly installment if active
            const quarterlyDetails = activeInstallments.some(inst => inst.type === 'QUARTERLY')
              ? calculateQuarterlyInstallment(unit.price, total_months)
              : { count: 0, amount: 0 };

            // Calculate monthly installment
            const monthlyDetails = calculateMonthlyInstallment(
              unit.price,
              depositPercentage,
              project.cash_factor || 1,
              project.reduction_factor || 1,
              total_months,
              annualDetails.count,
              annualDetails.amount,
              quarterlyDetails.count,
              quarterlyDetails.amount
            );

            // Calculate total amount including deposit
            const totalAmount = downPayment + 
              (annualDetails.count * annualDetails.amount) +
              (quarterlyDetails.count * quarterlyDetails.amount) +
              (monthlyDetails.count * monthlyDetails.amount);

            // Update global config
            setInstallmentConfig({
              annual: annualDetails,
              quarterly: quarterlyDetails,
              monthly: monthlyDetails
            });

            // Update unit details with new installments and final price
            setUnitDetails(prev => {
              const updatedInstallments = prev.installments.map(inst => {
                const type = inst.type.toLowerCase();
                const config = {
                  'annual': annualDetails,
                  'quarterly': quarterlyDetails,
                  'monthly': monthlyDetails
                }[type];
                
                return {
                  ...inst,
                  count: config ? config.count.toString() : '0',
                  amount: config ? formatNumber(config.amount) : '0'
                };
              });

              return {
                ...prev,
                installments: updatedInstallments,
                finalPrice: formatNumber(totalAmount)
              };
            });
          }
        }
      }
    } else {
      setUnitDetails(prev => ({
        ...prev,
        [key]: value
      }));
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
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;
    
    setUnitDetails(prev => {
      // If removing an installment type
      if (existingInstallment) {
        const filteredInstallments = prev.installments.filter(inst => inst.type !== type);
        
        // Get current values for recalculation
        const downPayment = parseFloat(prev.downPayment.replace(/,/g, '')) || 0;
        const originalPrice = parseFloat(prev.price.replace(/,/g, '')) || 0;
        const depositPercentage = (downPayment / originalPrice) * 100;
        const total_months = parseInt(prev.totalInstallmentsCount || '1', 10) || 1;

        // Reset the removed installment type in config
        const typeKey = type.toLowerCase() as 'annual' | 'quarterly' | 'monthly';
        setInstallmentConfig(prevConfig => ({
          ...prevConfig,
          [typeKey]: { count: 0, amount: 0 }
        }));

        // Calculate annual installment if active (and not being removed)
        const annualDetails = filteredInstallments.some(inst => inst.type === 'ANNUAL')
          ? calculateAnnualInstallment(originalPrice, total_months)
          : { count: 0, amount: 0 };

        // Calculate quarterly installment if active (and not being removed)
        const quarterlyDetails = filteredInstallments.some(inst => inst.type === 'QUARTERLY')
          ? calculateQuarterlyInstallment(originalPrice, total_months)
          : { count: 0, amount: 0 };

        // Calculate monthly installment
        const monthlyDetails = calculateMonthlyInstallment(
          originalPrice,
          depositPercentage,
          project.cash_factor || 1,
          project.reduction_factor || 1,
          total_months,
          annualDetails.count,
          annualDetails.amount,
          quarterlyDetails.count,
          quarterlyDetails.amount
        );

        // Calculate total amount including deposit
        const totalAmount = downPayment + 
          (annualDetails.count * annualDetails.amount) +
          (quarterlyDetails.count * quarterlyDetails.amount) +
          (monthlyDetails.count * monthlyDetails.amount);
          console.log("total:",(monthlyDetails.count * monthlyDetails.amount))

        // Update global config
        setInstallmentConfig({
          annual: annualDetails,
          quarterly: quarterlyDetails,
          monthly: monthlyDetails
        });

        return {
      ...prev,
          installments: filteredInstallments,
          finalPrice: formatNumber(totalAmount)
        };
      } 
      // If adding a new installment type
      else {
        // Get current values
        const downPayment = parseFloat(prev.downPayment.replace(/,/g, '')) || 0;
        const originalPrice = parseFloat(prev.price.replace(/,/g, '')) || 0;
        const depositPercentage = (downPayment / originalPrice) * 100;
        const total_months = parseInt(prev.totalInstallmentsCount || '1', 10) || 1;

        // Add the new installment type with default values
        const newInstallment = {
          type: type as 'MONTHLY' | 'ANNUAL' | 'QUARTERLY',
          count: '0',
          amount: '0'
        };

        // Calculate all installments including the new one
        const annualDetails = type === 'ANNUAL' || prev.installments.some(inst => inst.type === 'ANNUAL')
          ? calculateAnnualInstallment(originalPrice, total_months)
          : { count: 0, amount: 0 };

        const quarterlyDetails = type === 'QUARTERLY' || prev.installments.some(inst => inst.type === 'QUARTERLY')
          ? calculateQuarterlyInstallment(originalPrice, total_months)
          : { count: 0, amount: 0 };

        const monthlyDetails = calculateMonthlyInstallment(
          originalPrice,
          depositPercentage,
          project.cash_factor || 1,
          project.reduction_factor || 1,
          total_months,
          annualDetails.count,
          annualDetails.amount,
          quarterlyDetails.count,
          quarterlyDetails.amount
        );

        // Calculate total amount including deposit
        const totalAmount = downPayment + 
          (annualDetails.count * annualDetails.amount) +
          (quarterlyDetails.count * quarterlyDetails.amount) +
          (monthlyDetails.count * monthlyDetails.amount);

        // Update global config
        setInstallmentConfig({
          annual: annualDetails,
          quarterly: quarterlyDetails,
          monthly: monthlyDetails
        });

        // Update unit details with new installments and final price
        const updatedInstallments = [...prev.installments, newInstallment];

        return {
      ...prev,
          installments: updatedInstallments,
          finalPrice: formatNumber(totalAmount)
        };
      }
    });
  };

  // Calculate annual installment details
  const calculateAnnualInstallment = (
    unit_price: number,
    total_months: number
  ): { count: number; amount: number } => {
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return { count: 0, amount: 0 };

    const annualPercentage = project.installment_options?.ANNUAL ? 
      parseFloat(project.installment_options.ANNUAL.toString()) / 100 : 0;
    
    const annual_installment = unit_price * annualPercentage;
    const years = Math.floor(total_months / 12);
    const annual_count = years > 0 ? years - 1 : 0;
    
    return {
      count: annual_count,
      amount: annual_installment
    };
  };

  // Calculate quarterly installment details
  const calculateQuarterlyInstallment = (
    unit_price: number,
    total_months: number
  ): { count: number; amount: number } => {
    const project = projects.find(p => p.id === selectedProject);
    if (!project) return { count: 0, amount: 0 };

    const quarterlyPercentage = project.installment_options?.QUARTERLY ? 
      parseFloat(project.installment_options.QUARTERLY.toString()) / 100 : 0;
    
    const quarterly_installment = unit_price * quarterlyPercentage;
    const quarters = Math.floor(total_months / 3);
    const quarterly_count = quarters > 0 ? quarters - 1 : 0;
    
    return {
      count: quarterly_count,
      amount: quarterly_installment
    };
  };

  // Calculate monthly installment details
  const calculateMonthlyInstallment = (
    unit_price: number,
    deposit_percentage: number,
    cash_factor: number,
    reduction_factor: number,
    total_months: number,
    annual_count: number,
    annual_amount: number,
    quarterly_count: number,
    quarterly_amount: number
  ): { count: number; amount: number } => {
    // Calculate cash price
    const cash_price = unit_price * cash_factor;
    const deposit_amount = (deposit_percentage / 100) * unit_price;
    const financed_amount = cash_price - deposit_amount;

    // Calculate monthly installment using annuity formula
    const r = Number(Number(reduction_factor).toFixed(6));
    
    let basicInstallment = 0;
    let monthly_installment = 0;
    let monthly_count = 0;
    if (total_months > 0 && financed_amount > 0) {
      basicInstallment = (financed_amount * r * Math.pow((1 + r), total_months)) / (Math.pow(1 + r, total_months) - 1);
      const correctFinalPrice = basicInstallment * total_months;
      monthly_count = total_months - annual_count - quarterly_count;
      monthly_installment = (correctFinalPrice - annual_amount * annual_count - quarterly_amount * quarterly_count ) / monthly_count;
    }
    

    return {
      count: monthly_count,
      amount: monthly_installment
    };
  };

  // Update the handleTotalInstallmentsCountChange function
  const handleTotalInstallmentsCountChange = (value: string) => {
    // Allow empty value
    if (!value) {
      setUnitDetails(prev => ({
        ...prev,
        totalInstallmentsCount: '',
        installments: prev.installments.map(inst => ({
          ...inst,
          count: '0',
          amount: '0'
        })),
        finalPrice: '0'
      }));
      return;
    }

    // Remove any non-numeric characters
    const numericValue = value.replace(/[^\d]/g, '');
    const total_months = parseInt(numericValue, 10) || 0;
    
    // Get current down payment value
    const downPayment = parseFloat(unitDetails.downPayment.replace(/,/g, '')) || 0;
    const originalPrice = parseFloat(unitDetails.price.replace(/,/g, '')) || 0;
    
    // Calculate deposit percentage from current down payment
    const depositPercentage = (downPayment / originalPrice) * 100;

      const project = projects.find(p => p.id === selectedProject);
    if (project) {
      // Get active installment types
      const activeInstallments = unitDetails.installments.filter(inst => 
        inst.type === 'ANNUAL' || inst.type === 'QUARTERLY' || inst.type === 'MONTHLY'
      );

      // Calculate annual installment if active
      const annualDetails = activeInstallments.some(inst => inst.type === 'ANNUAL')
        ? calculateAnnualInstallment(originalPrice, total_months)
        : { count: 0, amount: 0 };

      // Calculate quarterly installment if active
      const quarterlyDetails = activeInstallments.some(inst => inst.type === 'QUARTERLY')
        ? calculateQuarterlyInstallment(originalPrice, total_months)
        : { count: 0, amount: 0 };

      // Calculate monthly installment
      const monthlyDetails = calculateMonthlyInstallment(
        originalPrice,
        depositPercentage,
          project.cash_factor || 1,
          project.reduction_factor || 1, 
        total_months,
        annualDetails.count,
        annualDetails.amount,
        quarterlyDetails.count,
        quarterlyDetails.amount
      );

      // Calculate total amount including deposit
      const totalAmount = downPayment + 
        (annualDetails.count * annualDetails.amount) +
        (quarterlyDetails.count * quarterlyDetails.amount) +
        (monthlyDetails.count * monthlyDetails.amount);

      // Update global config
      setInstallmentConfig({
        annual: annualDetails,
        quarterly: quarterlyDetails,
        monthly: monthlyDetails
      });

      // Update unit details with new installments and final price
      const updatedInstallments = unitDetails.installments.map(inst => {
        const type = inst.type.toLowerCase();
        const config = {
          'annual': annualDetails,
          'quarterly': quarterlyDetails,
          'monthly': monthlyDetails
        }[type];
        
        return {
          ...inst,
          count: config ? config.count.toString() : '0',
          amount: config ? formatNumber(config.amount) : '0'
        };
      });

      setUnitDetails(prev => ({
        ...prev,
        totalInstallmentsCount: numericValue,
        installments: updatedInstallments,
        finalPrice: formatNumber(totalAmount)
      }));
    }
  };

  // Handle quarterly installment amount change
  const handleQuarterlyInstallmentChange = (value: string) => {
    // If empty, set to zero
    if (!value) {
      const updatedConfig = {
        ...installmentConfig,
        quarterly: { ...installmentConfig.quarterly, amount: 0 }
      };
      setInstallmentConfig(updatedConfig);
      
      // Recalculate final price
      recalculateWithNewInstallmentAmount('quarterly', 0);
      return;
    }

    // Remove any non-numeric characters except decimal point
    const numericValue = value.replace(/[^\d.]/g, '');
    const amount = parseFloat(numericValue) || 0;
    
    // Update the config
    const updatedConfig = {
      ...installmentConfig,
      quarterly: { ...installmentConfig.quarterly, amount }
    };
    setInstallmentConfig(updatedConfig);

    // Recalculate everything with the new quarterly amount
    recalculateWithNewInstallmentAmount('quarterly', amount);
  };

  // Update annual installment handler to use the generic recalculation function
  const handleAnnualInstallmentChange = (value: string) => {
    if (!value) {
      const updatedConfig = {
        ...installmentConfig,
        annual: { ...installmentConfig.annual, amount: 0 }
      };
      setInstallmentConfig(updatedConfig);
      
      recalculateWithNewInstallmentAmount('annual', 0);
      return;
    }

    const numericValue = value.replace(/[^\d.]/g, '');
    const amount = parseFloat(numericValue) || 0;
    
    const updatedConfig = {
      ...installmentConfig,
      annual: { ...installmentConfig.annual, amount }
    };
    setInstallmentConfig(updatedConfig);

    recalculateWithNewInstallmentAmount('annual', amount);
  };

  // Generic recalculation function for both annual and quarterly changes
  const recalculateWithNewInstallmentAmount = (type: 'annual' | 'quarterly', newAmount: number) => {
    if (!selectedUnit || !selectedProject) return;

    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    const downPayment = parseFloat(unitDetails.downPayment.replace(/,/g, '')) || 0;
    const originalPrice = parseFloat(unitDetails.price.replace(/,/g, '')) || 0;
    const depositPercentage = (downPayment / originalPrice) * 100;
    const total_months = parseInt(unitDetails.totalInstallmentsCount || '1', 10) || 1;

    // Keep existing counts and amounts, update only the changed type
    const annualDetails = {
      count: installmentConfig.annual.count,
      amount: type === 'annual' ? newAmount : installmentConfig.annual.amount
    };

    const quarterlyDetails = {
      count: installmentConfig.quarterly.count,
      amount: type === 'quarterly' ? newAmount : installmentConfig.quarterly.amount
    };

    // Recalculate monthly with the updated values
    const monthlyDetails = calculateMonthlyInstallment(
      originalPrice,
      depositPercentage,
      project.cash_factor || 1,
      project.reduction_factor || 1,
      total_months,
      annualDetails.count,
      annualDetails.amount,
      quarterlyDetails.count,
      quarterlyDetails.amount
    );

    // Calculate total amount
    const totalAmount = downPayment +
      (annualDetails.count * annualDetails.amount) +
      (quarterlyDetails.count * quarterlyDetails.amount) +
      (monthlyDetails.count * monthlyDetails.amount);

    // Update unit details with new values
    setUnitDetails(prev => ({
      ...prev,
      installments: prev.installments.map(inst => {
        const instType = inst.type.toLowerCase();
        const config = {
          'annual': annualDetails,
          'quarterly': quarterlyDetails,
          'monthly': monthlyDetails
        }[instType];
        
        return {
          ...inst,
          count: config ? config.count.toString() : '0',
          amount: config ? formatNumber(config.amount) : '0'
        };
      }),
      finalPrice: formatNumber(totalAmount)
    }));

    setInstallmentConfig({
      annual: annualDetails,
      quarterly: quarterlyDetails,
      monthly: monthlyDetails
    });
  };

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
      const unit = units.find(u => u.id === selectedUnit);
      
      if (!project || !unit) {
        toast.error("حدث خطأ في تحميل بيانات المشروع");
        return;
      }

      // Calculate additional expenses
      const additionalExpensesData = project.additional_expenses
        ?.filter(expense => expense.is_active)
        .map(expense => {
          let value = 0;
          
          if (expense.type === 'FIXED_VALUE') {
            value = parseFloat(expense.value);
          } else if (expense.type === 'PERCENTAGE') {
            // Calculate the actual amount based on the percentage
            value = (unit.price * parseFloat(expense.value)) / 100;
          }
          
          return {
            name: expense.name,
            value: value.toFixed(2)
          };
        }) || [];

      // Get raw values without formatting
      const depositAmount = parseFloat(unitDetails.downPayment.replace(/,/g, '')) || 0;
      
      // Create installments data to send to API
      const installmentsData = unitDetails.installments.map(installment => {
        return {
          type: installment.type,
          count: parseInt(installment.count || '0', 10),
          amount: parseFloat(installment.amount.replace(/,/g, '') || '0')
        };
      }).filter(installment => installment.count > 0);

      // Calculate final price
      const finalPrice = parseFloat(unitDetails.finalPrice.replace(/,/g, '')) || 0;

      const requestData = {
        deposit_amount: depositAmount,
        installments: installmentsData,
        additional_expenses: additionalExpensesData,
        final_price: finalPrice
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
                    value={`${unitDetails.price_per_meter} جنيه`}
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
                      value={`${unitDetails.price} جنيه`}
                      disabled
                      className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">الدفعة المقدمة</label>
                    <input
                      type="text"
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

                {/* Total Installments Count */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    عدد الأقساط الإجمالي
                  </label>
                  <input
                    type="text"
                    value={unitDetails.totalInstallmentsCount}
                    onChange={(e) => handleTotalInstallmentsCountChange(e.target.value)}
                    className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="عدد الأقساط الإجمالي"
                  />
                </div>

                {/* Installment Types */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">أنظمة التقسيط المتاحة</label>
                  <div className="flex flex-wrap gap-3">
                    {(() => {
                      const currentProject = projects.find(p => p.id === selectedProject);
                      if (!currentProject) return null;
                      
                      return Object.entries(currentProject.installment_options).map(([type, percentage]) => {
                        const isActive = unitDetails.installments.some(inst => inst.type === type);
                        return (
                          <button
                            key={type}
                            onClick={() => handleInstallmentTypeSelect(type)}
                            className={`px-4 py-2 rounded-md text-sm font-medium ${
                              isActive
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {installmentTypeTranslations[type]}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Installment Details */}
                {unitDetails.installments.length > 0 && (
                  <div className="space-y-6">
                    {unitDetails.installments.filter(installment => {
                      // Only show installments that exist in the current installments array
                      return unitDetails.installments.some(inst => 
                        inst.type === installment.type && 
                        installmentConfig[inst.type.toLowerCase()].count > 0
                      );
                    }).map((installment) => (
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
                              type="text"
                              value={installmentConfig[installment.type.toLowerCase()].count}
                              disabled
                              className="block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 text-gray-700 sm:text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              قيمة القسط
                            </label>
                            <input
                              type="text"
                              value={formatNumber(installmentConfig[installment.type.toLowerCase()].amount)}
                              onChange={installment.type === 'ANNUAL' 
                                ? (e) => handleAnnualInstallmentChange(e.target.value)
                                : installment.type === 'QUARTERLY'
                                ? (e) => handleQuarterlyInstallmentChange(e.target.value)
                                : undefined}
                              disabled={installment.type !== 'ANNUAL' && installment.type !== 'QUARTERLY'}
                              className={`block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 ${
                                installment.type === 'ANNUAL' || installment.type === 'QUARTERLY' ? 'bg-white' : 'bg-gray-50'
                              } text-gray-700 sm:text-sm`}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Additional Expenses */}
                {selectedProject && (() => {
                  const currentProject = projects.find(p => p.id === selectedProject);
                  if (!currentProject || !currentProject.additional_expenses || currentProject.additional_expenses.length === 0) {
                    return null;
                  }
                  
                  return (
                    <div className="mt-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">المصروفات الإضافية</h3>
                      <div className="space-y-4">
                        {currentProject.additional_expenses.map((expense) => {
                          if (!expense.is_active) return null;
                          
                          const unitPrice = parseFloat(unitDetails.price.replace(/,/g, '')) || 0;
                          let expenseValue = 0;
                          
                          if (expense.type === 'FIXED_VALUE') {
                            expenseValue = parseFloat(expense.value || '0');
                          } else if (expense.type === 'PERCENTAGE') {
                            expenseValue = (unitPrice * parseFloat(expense.value)) / 100;
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
                      {unitDetails.finalPrice} جنيه
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
      </div>
    </div>
  );
};

export default ShowPrice;