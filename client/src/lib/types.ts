export interface DashboardStats {
  supplier: {
    totalProducts: number;
    activeInquiries: number;
    profileViews: number;
    rating: number;
  };
  buyer: {
    savedProducts: number;
    activeInquiries: number;
    followingSuppliers: number;
    successfulOrders: number;
  };
}

export interface ProductWithSupplier {
  id: number;
  name: string;
  description: string;
  price: string;
  minPrice: string;
  maxPrice: string;
  minOrder: number;
  unit: string;
  images: string[];
  rating: string;
  views: number;
  inquiries: number;
  supplier: {
    id: number;
    companyName: string;
    location: string;
    verified: boolean;
    rating: string;
  };
  category: {
    id: number;
    name: string;
  };
}

export interface SupplierWithStats {
  id: number;
  companyName: string;
  description: string;
  location: string;
  verified: boolean;
  rating: string;
  profileImage: string;
  productCount: number;
  experience: string;
}

export interface SearchFilters {
  search?: string;
  categoryId?: number;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
}
