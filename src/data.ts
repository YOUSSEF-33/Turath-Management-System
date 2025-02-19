import { Employee, Unit } from './types';

export const employees: Employee[] = [
  {
    id: 1,
    name: 'أحمد محمد',
    position: 'مدير المبيعات',
    phone: '0501234567',
    email: 'ahmed@example.com',
    assignedUnits: [1, 2]
  },
  {
    id: 2,
    name: 'سارة خالد',
    position: 'مستشار عقاري',
    phone: '0507654321',
    email: 'sara@example.com',
    assignedUnits: [3]
  }
];

export const units: Unit[] = [
  {
    id: 1,
    number: '101',
    type: 'apartment',
    area: 120,
    price: 500000,
    status: 'maintenance',
    code: 'APT101',
    description: 'شقة فاخرة بمساحة 120 م²',
    images: ['house1.jpg', 'house2.jpg', 'house3.jpg'],
    engineeringPlan: ['arch-design2.jpg', 'arch-design.jpg'],
    assignedEmployees: [1, 2]
  },
  {
    id: 2,
    number: '101',
    type: 'apartment',
    area: 120,
    price: 500000,
    status: 'available',
    code: 'APT101',
    description: 'شقة فاخرة بمساحة 120 م²',
    images: ['house1.jpg', 'house2.jpg', 'house3.jpg'],
    engineeringPlan: ['arch-design2.jpg', 'arch-design.jpg'],
    assignedEmployees: [1, 2]
  },
  {
    id: 3,
    number: '101',
    type: 'apartment',
    area: 120,
    price: 500000,
    status: 'available',
    code: 'APT101',
    description: 'شقة فاخرة بمساحة 120 م²',
    images: ['house1.jpg', 'house2.jpg', 'house3.jpg'],
    engineeringPlan: ['arch-design2.jpg', 'arch-design.jpg'],
    assignedEmployees: [1, 2]
  },
];