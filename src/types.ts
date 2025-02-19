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
  price: number; // Added price field
  status: 'available' | 'occupied' | 'maintenance';
  code: string; // Added code field
  description: string; // Added description field
  images: string[]; // Added images field (array of image URLs)
  engineeringPlan: string[]; // Added engineeringPlan field (URL of the plan image)
  assignedEmployees: number[];
}