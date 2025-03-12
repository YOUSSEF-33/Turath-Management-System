import { UploadFile } from 'antd/es/upload/interface';

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
  building_id: number;
  unit_number: string;
  unit_type: string;
  price?: number;
  area?: string;
  floor?: number;
  bedrooms?: number;
  bathrooms?: number;
  description?: string;
  plan_images: UploadFile[];
  gallery?: UploadFile[];
} 