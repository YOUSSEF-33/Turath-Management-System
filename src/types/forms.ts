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
}

export interface ExtendedUnitFormData extends UnitFormData {
  plan_images?: UploadFile[];
  gallery?: UploadFile[];
}

export interface UnitFormValidationSchema extends UnitFormData {
  plan_images: UploadFile[];
  gallery?: UploadFile[];
} 