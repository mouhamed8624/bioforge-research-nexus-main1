import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Calendar, Clock, Edit, Trash2, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Reservation {
  id: string;
  equipment: string;
  project: string;
  date: string;
  start_time: string;
  end_time: string;
  reserved_by: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface EquipmentItem {
  id: string;
  name: string;
}

interface Project {
  id: string;
  name: string;
  status: string;
}

const Reservations = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [equipmentItems, setEquipmentItems] = useState<EquipmentItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);
  const [newReservation, setNewReservation] = useState({
    equipment: "",
    project: "",
    date: "",
    start_time: "",
    end_time: "",
    reserved_by: ""
  });
  const { toast } = useToast();
  const { currentUser } = useAuth();

  const fetchReservations = async () => {
    try {
      setLoading(true);
      console.log("Fetching equipment reservations from database");
      
      const { data, error } = await supabase
        .from('equipment_reservations')
        .select('*')
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) {
        console.error('Error fetching reservations:', error);
        toast({
          title: "Error",
          description: "Failed to fetch reservations",
          variant: "destructive"
        });
        return;
      }

      console.log("Successfully fetched reservations:", data?.length || 0);
      
      // Transform the data to ensure reserved_by is always a string
      const transformedData = (data || []).map(reservation => ({
        ...reservation,
        reserved_by: reservation.reserved_by || ''
      }));
      
      setReservations(transformedData);
    } catch (error) {
      console.error('Error in fetchReservations:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentItems = async () => {
    try {
      const { data, error } = await supabase
        .from('equipment_items')
        .select('id, name')
        .order('name');

      if (error) {
        console.error('Error fetching equipment items:', error);
        return;
      }

      if (data) {
        setEquipmentItems(data);
      }
    } catch (error) {
      console.error('Error in fetchEquipmentItems:', error);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, status')
        .in('status', ['active', 'planning'])
        .order('name');

      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }

      if (data) {
        setProjects(data);
      }
    } catch (error) {
      console.error('Error in fetchProjects:', error);
    }
  };

  const handleSaveReservation = async () => {
    try {
      if (!newReservation.equipment || !newReservation.project || !newReservation.date || !newReservation.start_time || !newReservation.end_time || !newReservation.reserved_by) {
        toast({
          title: "Error",
          description: "All fields are required",
          variant: "destructive"
        });
        return;
      }

      if (!currentUser) {
        toast({
          title: "Error",
          description: "You must be logged in to make reservations",
          variant: "destructive"
        });
        return;
      }

      console.log("Saving reservation:", editingReservation ? 'update' : 'create');

      if (editingReservation) {
        // Update existing reservation
        const { error } = await supabase
          .from('equipment_reservations')
          .update({
            equipment: newReservation.equipment,
            project: newReservation.project,
            date: newReservation.date,
            start_time: newReservation.start_time,
            end_time: newReservation.end_time,
            reserved_by: newReservation.reserved_by,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingReservation.id);

        if (error) {
          console.error('Error updating reservation:', error);
          toast({
            title: "Error",
            description: "Failed to update reservation",
            variant: "destructive"
          });
          return;
        }
      } else {
        // Create new reservation
        const { error } = await supabase
          .from('equipment_reservations')
          .insert([{
            equipment: newReservation.equipment,
            project: newReservation.project,
            date: newReservation.date,
            start_time: newReservation.start_time,
            end_time: newReservation.end_time,
            reserved_by: newReservation.reserved_by,
            user_id: currentUser.id
          }]);

        if (error) {
          console.error('Error creating reservation:', error);
          toast({
            title: "Error",
            description: "Failed to create reservation",
            variant: "destructive"
          });
          return;
        }
      }

      toast({
        title: "Success",
        description: `Reservation ${editingReservation ? 'updated' : 'created'} successfully`,
      });

      setIsDialogOpen(false);
      setEditingReservation(null);
      setNewReservation({
        equipment: "",
        project: "",
        date: "",
        start_time: "",
        end_time: "",
        reserved_by: ""
      });
      
      // Refresh reservations
      fetchReservations();
      
    } catch (error) {
      console.error('Error in handleSaveReservation:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleDeleteReservation = async (reservationId: string) => {
    try {
      console.log("Deleting reservation:", reservationId);
      
      const { error } = await supabase
        .from('equipment_reservations')
        .delete()
        .eq('id', reservationId);

      if (error) {
        console.error('Error deleting reservation:', error);
        toast({
          title: "Error",
          description: "Failed to delete reservation",
          variant: "destructive"
        });
        return;
      }

      toast({
        title: "Success",
        description: "Reservation deleted successfully",
      });
      
      // Refresh reservations
      fetchReservations();
    } catch (error) {
      console.error('Error in handleDeleteReservation:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const openEditDialog = (reservation: Reservation) => {
    console.log("Opening edit dialog for reservation:", reservation.id);
    setEditingReservation(reservation);
    setNewReservation({
      equipment: reservation.equipment,
      project: reservation.project,
      date: reservation.date,
      start_time: reservation.start_time,
      end_time: reservation.end_time,
      reserved_by: reservation.reserved_by || ""
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    console.log("Opening new reservation dialog");
    setEditingReservation(null);
    setNewReservation({
      equipment: "",
      project: "",
      date: "",
      start_time: "",
      end_time: "",
      reserved_by: ""
    });
    setIsDialogOpen(true);
  };

  useEffect(() => {
    fetchReservations();
    fetchEquipmentItems();
    fetchProjects();
  }, []);

  if (loading) {
    return (
      <MainLayout>
        <PageContainer
          title="Equipment Reservations"
          subtitle="Manage laboratory equipment bookings and schedules"
        >
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer
        title="Equipment Reservations"
        subtitle="Manage laboratory equipment bookings and schedules"
      >
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div></div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={openNewDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Reservation
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingReservation ? 'Edit Reservation' : 'Create New Reservation'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingReservation ? 'Update reservation details' : 'Book equipment for your research project'}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="reserved_by">Reserved By</Label>
                    <Input
                      id="reserved_by"
                      type="text"
                      placeholder="Enter name of person making reservation"
                      value={newReservation.reserved_by}
                      onChange={(e) => setNewReservation({ ...newReservation, reserved_by: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="equipment">Equipment</Label>
                    <Select
                      value={newReservation.equipment}
                      onValueChange={(value) => setNewReservation({ ...newReservation, equipment: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentItems.map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="project">Project</Label>
                    <Select
                      value={newReservation.project}
                      onValueChange={(value) => setNewReservation({ ...newReservation, project: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.name}>
                            {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={newReservation.date}
                      onChange={(e) => setNewReservation({ ...newReservation, date: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={newReservation.start_time}
                        onChange={(e) => setNewReservation({ ...newReservation, start_time: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={newReservation.end_time}
                        onChange={(e) => setNewReservation({ ...newReservation, end_time: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveReservation}>
                      {editingReservation ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Reservations</CardTitle>
              <CardDescription>
                Current and upcoming equipment bookings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {reservations.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No reservations found. Create your first reservation to get started.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reserved By</TableHead>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reservations.map((reservation) => (
                      <TableRow key={reservation.id}>
                        <TableCell>
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-2 text-muted-foreground" />
                            {reservation.reserved_by || 'Not specified'}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {reservation.equipment}
                        </TableCell>
                        <TableCell>{reservation.project}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                            {new Date(reservation.date).toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                            {reservation.start_time} - {reservation.end_time}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEditDialog(reservation)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteReservation(reservation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  );
};

export default Reservations;
