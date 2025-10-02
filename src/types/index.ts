// API Types for PeteRental Backend

export interface Rental {
  address: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  square_feet: string;
  available_date: string;
  property_type: string;
  availability_status: string;
  days_until_available: number;
}

export interface SystemStatus {
  status: string;
  database_stats: {
    total_rentals: number;
    websites_tracked: number;
    last_updated: string;
    websites: Record<string, {
      rental_count: number;
      last_scraped: string;
    }>;
  };
}

export interface RentalData {
  status: string;
  total_available: number;
  current_date: string;
  rentals: Rental[];
}

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime_seconds?: number;
}

export interface ServiceInfo {
  name: string;
  version: string;
  description: string;
  endpoints: {
    health: string;
    webhook: string;
    database_status: string;
    rentals: string;
  };
}
