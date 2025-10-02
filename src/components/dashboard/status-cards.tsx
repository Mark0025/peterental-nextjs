"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SystemStatus } from "@/types";

interface StatusCardsProps {
  status: SystemStatus;
}

export function StatusCards({ status }: StatusCardsProps) {
  const { database_stats } = status;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Rentals</CardTitle>
          <Badge variant="secondary">Live</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{database_stats.total_rentals}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Available properties
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Websites Tracked</CardTitle>
          <Badge variant="secondary">Active</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{database_stats.websites_tracked}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Property management sites
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Last Update</CardTitle>
          <Badge variant="outline">Synced</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {new Date(database_stats.last_updated).toLocaleTimeString()}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {new Date(database_stats.last_updated).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Database Status</CardTitle>
          <Badge variant="default" className="capitalize">{status.status}</Badge>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Object.keys(database_stats.websites).length}</div>
          <p className="text-xs text-muted-foreground mt-1">
            Tracked websites
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
