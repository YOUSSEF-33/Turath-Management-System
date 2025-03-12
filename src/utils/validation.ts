import * as yup from 'yup';

// Project validation schemas
export const projectValidationSchema = yup.object().shape({
  name: yup.string().required('اسم المشروع مطلوب'),
  description: yup.string().transform((value) => value || undefined).optional(),
});

// Building validation schemas
export const buildingValidationSchema = yup.object().shape({
  project_id: yup.number().required('المشروع مطلوب'),
  name: yup.string().required('اسم المبنى مطلوب'),
  description: yup.string().transform((value) => value || undefined).optional(),
});

// Unit validation schemas
export const unitValidationSchema = yup.object().shape({
  building_id: yup.number().required('المبنى مطلوب'),
  unit_number: yup.string().required('رقم الوحدة مطلوب'),
  unit_type: yup.string().required('نوع الوحدة مطلوب'),
  price: yup.number().transform((value) => value || undefined).optional(),
  area: yup.string().transform((value) => value || undefined).optional(),
  floor: yup.number().transform((value) => value || undefined).optional(),
  bedrooms: yup.number().transform((value) => value || undefined).optional(),
  bathrooms: yup.number().transform((value) => value || undefined).optional(),
  description: yup.string().transform((value) => value || undefined).optional(),
  plan_images: yup.array().required('صور المخطط مطلوبة'),
  gallery: yup.array().optional(),
}); 