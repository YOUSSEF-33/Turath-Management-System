export interface Employee {
  id: number;
  name: string;
  position: string;
  phone: string;
  email: string;
  assignedUnits: number[];
}

export interface Unit {
  id: number;
  type: 'villa' | 'duplex' | 'apartment';
  number: string;
  area: number;
  status: 'available' | 'occupied' | 'maintenance';
  assignedEmployees: number[];
}