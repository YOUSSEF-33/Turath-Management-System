import { UploadFile } from 'antd/lib/upload/interface';

export interface ProjectFormData {
  name: string;
  description?: string;
}

export interface BuildingFormData {
  project_id: number;
  name: string;
  description?: string;
}

export interface UnitFormData {
  unit_number: string;
  unit_type: string;
  price?: number;
  area?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  building_id: number;
  reservations?: Array<{
    id: number;
    client_id: number;
    status: string;
    contract_date: string;
    final_price: number;
    down_payment: number;
    monthly_installment: number;
    months_count: number;
  }>;
  images?: string[];
  files?: string[];
}

export interface ExtendedUnitFormData extends UnitFormData {
  status?: string;
  plan_images: UploadFile[];
  gallery: UploadFile[];
  location_in_brochure?: UploadFile[];
}

export interface UnitFormValidationSchema extends UnitFormData {
  plan_images: UploadFile[];
  gallery?: UploadFile[];
} 