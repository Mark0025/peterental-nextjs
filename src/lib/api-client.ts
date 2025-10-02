// API Client for PeteRental Python Backend

import type {
  SystemStatus,
  RentalData,
  HealthStatus,
  ServiceInfo,
} from "@/types";

class APIClient {
  private baseURL: string;

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") {
    this.baseURL = baseURL;
  }

  private async fetch<T>(endpoint: string): Promise<T> {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store", // Always get fresh data
    });

    if (!response.ok) {
      throw new Error(
        `API Error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getServiceInfo(): Promise<ServiceInfo> {
    return this.fetch("/");
  }

  async getHealth(): Promise<HealthStatus> {
    return this.fetch("/health");
  }

  async getSystemStatus(): Promise<SystemStatus> {
    return this.fetch("/database/status");
  }

  async getRentals(website?: string): Promise<RentalData> {
    const endpoint = website
      ? `/database/rentals/${encodeURIComponent(website)}`
      : "/database/available";
    return this.fetch(endpoint);
  }

  async getAllRentals(): Promise<RentalData> {
    return this.getRentals();
  }
}

// Export singleton instance
export const apiClient = new APIClient();
