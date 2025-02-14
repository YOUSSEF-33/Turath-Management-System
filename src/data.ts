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
    type: 'villa',
    number: 'V-101',
    area: 450,
    status: 'available',
    assignedEmployees: [1]
  },
  {
    id: 2,
    type: 'duplex',
    number: 'D-201',
    area: 320,
    status: 'occupied',
    assignedEmployees: [1]
  },
  {
    id: 3,
    type: 'apartment',
    number: 'A-301',
    area: 180,
    status: 'maintenance',
    assignedEmployees: [2]
  }
];