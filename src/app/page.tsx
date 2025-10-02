import { apiClient } from "@/lib/api-client";
import { StatusCards } from "@/components/dashboard/status-cards";
import { RentalTable } from "@/components/dashboard/rental-table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let status;
  let rentals;
  let error;

  try {
    [status, rentals] = await Promise.all([
      apiClient.getSystemStatus(),
      apiClient.getAllRentals(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Failed to fetch data";
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100">
      <div className="container mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Pete VAPI Integration
          </h1>
          <p className="text-muted-foreground mt-2">
            Real-time rental property tracking and VAPI integration
          </p>
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTitle>Connection Error</AlertTitle>
            <AlertDescription>
              {error}
              <br />
              <span className="text-xs mt-2 block">
                Make sure the Python backend is running on http://localhost:8000
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Status Cards */}
        {status && (
          <div className="mb-8">
            <StatusCards status={status} />
          </div>
        )}

        {/* Rentals Table */}
        {rentals && (
          <div className="mb-8">
            <RentalTable rentals={rentals.rentals} />
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>Backend: FastAPI + LangChain + Playwright</p>
          <p>Frontend: Next.js 15 + shadcn/ui + TypeScript</p>
        </div>
      </div>
    </div>
  );
}
