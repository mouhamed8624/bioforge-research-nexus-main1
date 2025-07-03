
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Eye } from "lucide-react";
import { useInventoryItems } from "@/components/inventory/useInventoryItems";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface EquipmentAvailabilityItem {
  id: string;
  name: string;
  type?: string;
  status: 'available' | 'in use';
  nextAvailableTime?: string;
  checkedOutBy?: string;
}

interface Reservation {
  id: string;
  equipment: string;
  date: string;
  start_time: string;
  end_time: string;
  project: string;
}

const EquipmentTracking = () => {
  const [equipmentAvailability, setEquipmentAvailability] = useState<EquipmentAvailabilityItem[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const { equipmentItems } = useInventoryItems();
  const [selectedReservations, setSelectedReservations] = useState<Reservation[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEquipmentName, setSelectedEquipmentName] = useState("");
  const { toast } = useToast();

  // Fetch equipment reservations from database
  useEffect(() => {
    const fetchReservations = async () => {
      try {
        console.log("Fetching equipment reservations for tracking");
        
        const { data, error } = await supabase
          .from('equipment_reservations')
          .select('*')
          .order('date', { ascending: true })
          .order('start_time', { ascending: true });

        if (error) {
          console.error('Error fetching reservations:', error);
          return;
        }

        console.log("Successfully fetched reservations:", data?.length || 0);
        console.log("Reservation data:", data);
        setReservations(data || []);
      } catch (error) {
        console.error('Error in fetchReservations:', error);
      }
    };

    fetchReservations();
  }, []);

  // Update equipment availability based on reservations and equipment items
  useEffect(() => {
    console.log("Updating equipment availability with:", { equipmentItems, reservations });
    
    if (!equipmentItems || equipmentItems.length === 0) {
      console.log("No equipment items available");
      return;
    }

    // Update equipment availability based on reservations
    const now = new Date();
    const availabilityData: EquipmentAvailabilityItem[] = equipmentItems.map(item => {
      // Find reservations for this equipment
      const itemReservations = reservations.filter(res => 
        res.equipment === item.name
      );

      console.log(`Processing ${item.name} with ${itemReservations.length} reservations`);

      // Filter for current or upcoming reservations
      const activeReservations = itemReservations.filter(res => {
        const resDate = new Date(res.date);
        
        // Handle end_time of "00:00" as end of day (23:59)
        let endTime = res.end_time;
        if (endTime === "00:00") {
          endTime = "23:59";
        }
        
        const [resHours, resMinutes] = endTime.split(':').map(Number);
        
        const reservationEndTime = new Date(
          resDate.getFullYear(),
          resDate.getMonth(),
          resDate.getDate(),
          resHours,
          resMinutes
        );
        
        console.log(`Reservation end time for ${item.name}:`, reservationEndTime, "Current time:", now);
        
        return reservationEndTime > now;
      });

      console.log(`Active reservations for ${item.name}:`, activeReservations.length);

      // Sort reservations by date and start time
      activeReservations.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
        }
        
        const timeA = a.start_time;
        const timeB = b.start_time;
        return timeA.localeCompare(timeB);
      });

      // Find the next reservation (if any)
      const nextReservation = activeReservations[0];
      
      // Check if there's a current reservation happening now
      const currentReservation = activeReservations.find(res => {
        const resDate = new Date(res.date);
        const [startHours, startMinutes] = res.start_time.split(':').map(Number);
        
        // Handle end_time of "00:00" as end of day (23:59)
        let endTime = res.end_time;
        if (endTime === "00:00") {
          endTime = "23:59";
        }
        
        const [endHours, endMinutes] = endTime.split(':').map(Number);
        
        const resStartTime = new Date(
          resDate.getFullYear(),
          resDate.getMonth(),
          resDate.getDate(),
          startHours,
          startMinutes
        );
        
        const resEndTime = new Date(
          resDate.getFullYear(),
          resDate.getMonth(),
          resDate.getDate(),
          endHours,
          endMinutes
        );
        
        return now >= resStartTime && now <= resEndTime;
      });

      return {
        id: item.id,
        name: item.name,
        type: item.type,
        status: currentReservation ? 'in use' : 'available',
        nextAvailableTime: currentReservation ? 
          `${currentReservation.date} at ${currentReservation.end_time === "00:00" ? "23:59" : currentReservation.end_time}` : 
          undefined,
        checkedOutBy: currentReservation?.project || undefined,
      };
    });

    console.log("Updated equipment availability:", availabilityData);
    setEquipmentAvailability(availabilityData);
  }, [equipmentItems, reservations]);

  // Function to get upcoming reservations for an equipment
  const getUpcomingReservations = (itemName: string) => {
    const now = new Date();
    const itemReservations = reservations.filter(res => 
      res.equipment === itemName
    );
    
    console.log(`Getting upcoming reservations for ${itemName}:`, itemReservations);
    
    // Filter for upcoming reservations (including today's future reservations)
    const upcomingReservations = itemReservations.filter(res => {
      const resDate = new Date(res.date);
      const [startHours, startMinutes] = res.start_time.split(':').map(Number);
      
      const reservationStartTime = new Date(
        resDate.getFullYear(),
        resDate.getMonth(),
        resDate.getDate(),
        startHours,
        startMinutes
      );
      
      // Include reservations that haven't started yet
      const isUpcoming = reservationStartTime >= now;
      console.log(`Reservation ${res.id} starts at:`, reservationStartTime, "Is upcoming:", isUpcoming);
      
      return isUpcoming;
    });

    // Sort by date and start time
    upcomingReservations.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      
      const timeA = a.start_time;
      const timeB = b.start_time;
      return timeA.localeCompare(timeB);
    });
    
    console.log(`Final upcoming reservations for ${itemName}:`, upcomingReservations);
    return upcomingReservations;
  };

  // Function to handle view reservations click
  const handleViewReservations = (itemName: string) => {
    const equipmentReservations = getUpcomingReservations(itemName);
    setSelectedReservations(equipmentReservations);
    setSelectedEquipmentName(itemName);
    setIsDialogOpen(true);
  };

  // Function to format date for display
  const formatReservationDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  return (
    <>
      {/* Equipment Availability Section */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Equipment Availability</CardTitle>
        </CardHeader>
        <CardContent>
          {equipmentItems.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-lg text-muted-foreground">No equipment found</p>
              <p className="text-sm mt-2">Add equipment items in the Equipment Overview section</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Equipment</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next Available</TableHead>
                  <TableHead>Current User</TableHead>
                  <TableHead>Upcoming Reservations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipmentAvailability.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4">
                      <p className="text-muted-foreground">Loading equipment data...</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  equipmentAvailability.map((item) => {
                    const upcomingReservations = getUpcomingReservations(item.name);
                    const hasUpcoming = upcomingReservations.length > 0;
                    
                    return (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">{item.name}</TableCell>
                        <TableCell>{item.type || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              item.status === 'available' 
                                ? "bg-gradient-to-r from-teal-400 to-teal-500 hover:from-teal-500 hover:to-teal-600 text-white border-transparent" 
                                : "bg-gradient-to-r from-cigass-400 to-purple-400 hover:from-cigass-500 hover:to-purple-500 text-white border-transparent"
                            } transition-all duration-200`}
                          >
                            {item.status === 'available' ? 'Available Now' : 'In Use'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {item.status === 'available' ?
                            'Now' :
                            `Est. ${item.nextAvailableTime || 'Unknown'}`
                          }
                        </TableCell>
                        <TableCell>
                          {item.checkedOutBy || '—'}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-blue-500" />
                            {hasUpcoming ? (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="flex items-center gap-1 bg-gradient-to-r from-cigass-400 to-purple-400 text-white border-none hover:from-cigass-500 hover:to-purple-500 transition-all duration-300 shadow-sm hover:shadow-md"
                                onClick={() => handleViewReservations(item.name)}
                              >
                                <Eye className="h-3.5 w-3.5" />
                                View {upcomingReservations.length} {upcomingReservations.length === 1 ? 'reservation' : 'reservations'}
                              </Button>
                            ) : (
                              <span className="text-sm text-muted-foreground">No upcoming reservations</span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Reservations Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upcoming Reservations for {selectedEquipmentName}</DialogTitle>
            <DialogDescription>
              List of all scheduled reservations for this equipment
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 my-2">
            {selectedReservations.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No upcoming reservations</p>
            ) : (
              selectedReservations.map((res) => (
                <div key={res.id} className="bg-muted/40 rounded-md p-3">
                  <div className="flex justify-between items-center">
                    <div className="font-medium">{formatReservationDate(res.date)}</div>
                    <Badge variant="outline">{res.project}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {res.start_time.substring(0, 5)} - {res.end_time.substring(0, 5)}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { EquipmentTracking };
