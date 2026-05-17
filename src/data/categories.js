import { Car, Home, Smartphone, Shirt, Briefcase, Wrench, Sofa, Bike, Laptop, MoreHorizontal } from 'lucide-react';

export const categories = [
  { id: 'vehicles', name: 'Véhicules', icon: Car, color: 'text-blue-500', bg: 'bg-blue-100' },
  { id: 'real-estate', name: 'Immobilier', icon: Home, color: 'text-green-500', bg: 'bg-green-100' },
  { id: 'electronics', name: 'Électronique', icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-100' },
  { id: 'fashion', name: 'Mode', icon: Shirt, color: 'text-pink-500', bg: 'bg-pink-100' },
  { id: 'jobs', name: 'Emploi', icon: Briefcase, color: 'text-orange-500', bg: 'bg-orange-100' },
  { id: 'services', name: 'Services', icon: Wrench, color: 'text-gray-500', bg: 'bg-gray-100' },
  { id: 'home', name: 'Maison & Déco', icon: Sofa, color: 'text-teal-500', bg: 'bg-teal-100' },
  { id: 'leisure', name: 'Loisirs', icon: Bike, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { id: 'it', name: 'Informatique', icon: Laptop, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  { id: 'other', name: 'Autres', icon: MoreHorizontal, color: 'text-red-500', bg: 'bg-red-100' },
];