export const untisValidation = (key, value)=>{
    switch (key) {
        case 'price':
          return 'حقل السعر يجب أن يكون رقمًا.';
          break;
        case 'floor':
            return  'حقل الطابق يجب أن يكون عددًا صحيحًا.';
          break;
        case 'bedrooms':
            return 'حقل غرف النوم يجب أن يكون عددًا صحيحًا.';
          break;
        case 'bathrooms':
            return 'حقل الحمامات يجب أن يكون عددًا صحيحًا.';
          break;
        case 'unit_number':
            return 'حقل رقم الوحدة مطلوب.';
          break;
        case 'unit_type':
            return 'حقل النوع مطلوب.';
          break;
        case 'area':
          return 'حقل المساحة مطلوب.';
          break;
        case 'description':
         return'حقل الوصف مطلوب.';
          break;
        default:
            return value;
      }
}