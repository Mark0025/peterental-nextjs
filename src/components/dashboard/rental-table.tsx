"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Rental } from "@/types";

interface RentalTableProps {
  rentals: Rental[];
}

export function RentalTable({ rentals }: RentalTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Rentals ({rentals.length})</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Address</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Beds/Baths</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Available</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rentals.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground">
                  No rentals available
                </TableCell>
              </TableRow>
            ) : (
              rentals.map((rental, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium max-w-xs">{rental.property_address}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">{rental.property_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant="secondary">{rental.bedrooms}BR</Badge>
                      <Badge variant="secondary">{rental.bathrooms}BA</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{rental.square_feet}</TableCell>
                  <TableCell className="font-semibold text-green-600">
                    {rental.price}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rental.days_until_available === 0 ? "default" : "secondary"}>
                      {rental.availability_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {rental.available_date}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
