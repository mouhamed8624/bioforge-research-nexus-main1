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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, UserCheck, Calendar, BarChart3, CheckCircle } from "lucide-react";
import { AttendanceDialog } from "@/components/teams/AttendanceDialog";
import { AttendanceStatsCard } from "@/components/teams/AttendanceStatsCard";
import { getAttendanceStats, getTeamAttendanceStats, AttendanceStats, markAttendance, initializeMemberAttendance } from "@/services/teams/attendanceService";
import { useAuth } from "@/contexts/AuthContext";
import { AttendanceReportDialog } from "@/components/teams/AttendanceReportDialog";
import { startAttendanceService } from "@/services/teams/attendanceResetService";

// Updated interface to match all users from profiles and team_members
interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

const Teams = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [totalUsersCount, setTotalUsersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [teamFilter, setTeamFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isAttendanceDialogOpen, setIsAttendanceDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [selectedMemberForAttendance, setSelectedMemberForAttendance] = useState<TeamMember | null>(null);
  const [attendanceStats, setAttendanceStats] = useState<Record<string, AttendanceStats>>({});
  const [teamAttendanceStats, setTeamAttendanceStats] = useState<AttendanceStats | null>(null);
  const [markingAttendance, setMarkingAttendance] = useState<Record<string, boolean>>({});
  const [newMember, setNewMember] = useState({
    name: "",
    email: "",
    role: ""
  });
  const [isAttendanceReportOpen, setIsAttendanceReportOpen] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const userRole = userProfile?.role;

  // Enhanced fetch function - prioritize team_members data and supplement with profiles
  const fetchTeamMembers = async () => {
    setLoading(true);
    try {
      console.log('Fetching team members...');
      
      // First, fetch team_members data (this should show all users)
      const { data: teamMembersData, error: teamMembersError } = await supabase
        .from('team_members')
        .select('*');

      console.log('Team members query result:', { teamMembersData, teamMembersError });

      if (teamMembersError) {
        console.error("Error fetching team members data:", teamMembersError);
        toast({
          title: "Error",
          description: `Could not fetch team members: ${teamMembersError.message}`,
          variant: "destructive"
        });
        return;
      }

      // Try to fetch profiles data to supplement role information
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*');

      console.log('Profiles query result:', { profilesData, profilesError });

      if (profilesError) {
        console.log("Note: Limited access to profiles data:", profilesError.message);
      }

      // Use team_members as the base and supplement with profiles data when available
      let allUsers: TeamMember[] = [];
      
      if (teamMembersData && teamMembersData.length > 0) {
        allUsers = teamMembersData.map(member => {
          const profileData = profilesData?.find(profile => profile.id === member.id);
          return {
            id: member.id,
            name: member.name || member.email || 'Unknown',
            email: member.email || '',
            role: member.role || profileData?.role || 'field',
            status: member.status || 'active',
            created_at: member.created_at || new Date().toISOString(),
            updated_at: member.updated_at || new Date().toISOString()
          };
        });
      }

      // If we have profiles data but missing team_members, add those users too
      if (profilesData) {
        const existingIds = new Set(allUsers.map(user => user.id));
        const missingUsers = profilesData
          .filter(profile => !existingIds.has(profile.id))
          .map(profile => ({
            id: profile.id,
            name: profile.email || 'Unknown',
            email: profile.email || '',
            role: profile.role || 'field',
            status: 'active',
            created_at: profile.created_at || new Date().toISOString(),
            updated_at: profile.updated_at || new Date().toISOString()
          }));
        
        allUsers = [...allUsers, ...missingUsers];
      }

      console.log('Final merged users:', allUsers);
      
      setTeamMembers(allUsers);
      setTotalUsersCount(allUsers.length);

      // Initialize attendance for all members if needed
      await initializeAndLoadAttendanceStats(allUsers);
    } catch (error) {
      console.error("Error fetching team members:", error);
      toast({
        title: "Error",
        description: "Could not fetch team members.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 2. Add or Update member - now updates both profiles and team_members
  const handleSaveMember = async () => {
    try {
      if (!newMember.name.trim() || !newMember.email.trim() || !newMember.role.trim()) {
        toast({
          title: "Error",
          description: "Name, email and role are required.",
          variant: "destructive"
        });
        return;
      }

      let updatedMembers = teamMembers;
      if (editingMember) {
        // Update team_members table
        const { error: teamMemberError } = await supabase
          .from('team_members')
          .upsert({
            id: editingMember.id,
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            updated_at: new Date().toISOString()
          });

        if (teamMemberError) {
          console.error("Error updating team member:", teamMemberError);
        }

        // Update the local state
        updatedMembers = teamMembers.map(member =>
          member.id === editingMember.id ? {
            ...member,
            name: newMember.name,
            email: newMember.email,
            role: newMember.role,
            updated_at: new Date().toISOString()
          } : member
        );
        setTeamMembers(updatedMembers);
      } else {
        // For new members, we can't create new user accounts here
        // This would typically be handled by user registration
        toast({
          title: "Info",
          description: "New users must sign up through the registration process.",
          variant: "default"
        });
        setIsDialogOpen(false);
        return;
      }

      toast({
        title: "Success",
        description: "Team member updated successfully",
      });

      setIsDialogOpen(false);
      setEditingMember(null);
      setNewMember({
        name: "",
        email: "",
        role: ""
      });

      // Reload attendance stats after updating member
      await loadAttendanceStats(updatedMembers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save member.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    try {
      // Only remove from team_members table, not from profiles (user keeps account)
      const { error } = await supabase.from('team_members').delete().eq('id', memberId);
      if (error) {
        console.error("Error removing from team_members:", error);
      }

      // Update local state to reflect the change
      const updatedMembers = teamMembers.map(member => 
        member.id === memberId ? {
          ...member,
          name: member.email || 'Unknown', // Reset to email as name
          role: 'field', // Reset to default role
          status: 'active'
        } : member
      );
      
      setTeamMembers(updatedMembers);
      toast({
        title: "Success",
        description: "Team member data removed successfully (user account preserved)"
      });
      // Refresh attendance stats
      await loadAttendanceStats(updatedMembers);
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not remove member data.",
        variant: "destructive"
      });
    }
  };

  const initializeAndLoadAttendanceStats = async (members: TeamMember[]) => {
    try {
      await Promise.all(members.map(member => initializeMemberAttendance(member.id)));
      const statsPromises = members.map(async (member) => {
        const stats = await getAttendanceStats(member.id);
        return { memberId: member.id, stats };
      });
      const results = await Promise.all(statsPromises);
      const statsMap = results.reduce((acc, { memberId, stats }) => {
        acc[memberId] = stats;
        return acc;
      }, {} as Record<string, AttendanceStats>);
      setAttendanceStats(statsMap);
      const memberIds = members.map(m => m.id);
      const teamStats = await getTeamAttendanceStats(memberIds);
      setTeamAttendanceStats(teamStats);
    } catch (error) {
      console.error('Error initializing and loading attendance stats:', error);
    }
  };
  
  const loadAttendanceStats = async (members: TeamMember[]) => {
    try {
      const statsPromises = members.map(async (member) => {
        const stats = await getAttendanceStats(member.id);
        return { memberId: member.id, stats };
      });
      const results = await Promise.all(statsPromises);
      const statsMap = results.reduce((acc, { memberId, stats }) => {
        acc[memberId] = stats;
        return acc;
      }, {} as Record<string, AttendanceStats>);
      setAttendanceStats(statsMap);
      const memberIds = members.map(m => m.id);
      const teamStats = await getTeamAttendanceStats(memberIds);
      setTeamAttendanceStats(teamStats);
    } catch (error) {
      console.error('Error loading attendance stats:', error);
    }
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setNewMember({
      name: member.name,
      email: member.email,
      role: member.role
    });
    setIsDialogOpen(true);
  };

  const openAttendanceDialog = (member: TeamMember) => {
    setSelectedMemberForAttendance(member);
    setIsAttendanceDialogOpen(true);
  };

  const handleQuickAttendance = async (member: TeamMember, status: 'present' | 'absent') => {
    // Prevent multiple simultaneous requests for the same member
    if (markingAttendance[member.id]) {
      return;
    }

    try {
      setMarkingAttendance(prev => ({ ...prev, [member.id]: true }));
      
      const today = new Date().toISOString().split('T')[0];
      console.log(`Marking ${member.name} (${member.id}) as ${status} for ${today}`);
      
      await markAttendance(
        member.id,
        today,
        status,
        `Marked ${status} via quick action`,
        'Current User'
      );
      
      toast({
        title: "Success",
        description: `Marked ${member.name} as ${status} for today`,
      });
      
      // Reload attendance stats after marking
      await loadAttendanceStats(teamMembers);
    } catch (error) {
      console.error('Error marking attendance:', error);
      toast({
        title: "Error",
        description: `Failed to mark ${member.name} as ${status}`,
        variant: "destructive"
      });
    } finally {
      setMarkingAttendance(prev => ({ ...prev, [member.id]: false }));
    }
  };

  const handleAttendanceMarked = () => {
    loadAttendanceStats(teamMembers);
  };

  const openAttendanceReportDialog = () => {
    setIsAttendanceReportOpen(true);
  };

  useEffect(() => {
    fetchTeamMembers();
    
    // Start the attendance service when the component mounts
    if (userRole !== 'financial') {
      startAttendanceService();
    }
  }, [userRole]);

  // Filtering logic - simplified since we don't have team field
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         member.role.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTeam = teamFilter === "all" || member.role === teamFilter; // Use role instead of team
    return matchesSearch && matchesTeam;
  });
  const uniqueRoles = Array.from(new Set(teamMembers.map(member => member.role).filter(Boolean))) as string[];

  if (loading) {
    return (
      <MainLayout>
        <PageContainer
          title="Teams"
          subtitle="Manage team members and collaborators"
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
        title="Teams"
        subtitle="Manage team members and collaborators"
      >
        <Tabs defaultValue="members" className="space-y-6">
          <TabsList>
            <TabsTrigger value="members">Team Members</TabsTrigger>
            {userRole !== 'financial' && <TabsTrigger value="attendance">Attendance</TabsTrigger>}
          </TabsList>

          <TabsContent value="members" className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Search team members..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={teamFilter} onValueChange={setTeamFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {uniqueRoles.map(role => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {userRole !== 'financial' && (
                <Button
                  variant="outline"
                  onClick={openAttendanceReportDialog}
                  className="flex items-center gap-2"
                >
                  <BarChart3 className="h-4 w-4" />
                  Attendance Report
                </Button>
              )}
              <Dialog open={isDialogOpen} onOpenChange={(isOpen) => {
                setIsDialogOpen(isOpen);
                if (!isOpen) {
                  setEditingMember(null);
                  setNewMember({ name: "", email: "", role: "" });
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Edit Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingMember ? 'Edit Team Member' : 'Add New Team Member'}
                    </DialogTitle>
                    <DialogDescription>
                      {editingMember ? 'Update team member details' : 'New users must register through the sign-up process'}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        value={newMember.name}
                        onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                        placeholder="Enter full name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newMember.email}
                        onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                        placeholder="Enter email address"
                        disabled={!editingMember}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={newMember.role}
                        onChange={(e) => setNewMember({ ...newMember, role: e.target.value })}
                        placeholder="Enter role/position"
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSaveMember}>
                        {editingMember ? 'Update' : 'Add'}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {/* Team Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Members</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{totalUsersCount}</div>
                  <p className="text-xs text-muted-foreground">
                    All registered users with accounts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Roles</CardTitle>
                  <UserCheck className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{uniqueRoles.length}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Research Team</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {teamMembers.filter(member => member.role === 'Research').length}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Team Members Table */}
            <Card>
              <CardHeader>
                <CardTitle>Team Members</CardTitle>
                <CardDescription>
                  All registered users and their roles
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredMembers.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">
                      {searchTerm || teamFilter !== "all" 
                        ? "No team members match your current filters." 
                        : "No team members found."}
                    </p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Email</TableHead>
                        {userRole !== 'financial' && <TableHead>Mark Present</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMembers.map((member) => (
                        <TableRow key={member.id}>
                          <TableCell className="font-medium">
                            {member.name}
                          </TableCell>
                          <TableCell>{member.role}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {member.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            {member.email}
                          </TableCell>
                          {userRole !== 'financial' && (
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickAttendance(member, 'present')}
                                disabled={markingAttendance[member.id]}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                {markingAttendance[member.id] ? (
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Present
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex space-x-2">
                              {userRole !== 'financial' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openEditDialog(member)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openAttendanceDialog(member)}
                                  >
                                    <Calendar className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteMember(member.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {userRole !== 'financial' && (
            <TabsContent value="attendance" className="space-y-6">
              {/* Team Attendance Overview */}
              {teamAttendanceStats && (
                <AttendanceStatsCard 
                  stats={teamAttendanceStats} 
                  memberName="Team Overview"
                />
              )}

              {/* Individual Member Attendance Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teamMembers.map((member) => {
                  const stats = attendanceStats[member.id];
                  if (!stats) return null;
                  
                  return (
                    <AttendanceStatsCard 
                      key={member.id}
                      stats={stats} 
                      memberName={member.name}
                    />
                  );
                })}
              </div>
            </TabsContent>
          )}
        </Tabs>

        {/* Attendance Dialog */}
        {selectedMemberForAttendance && userRole !== 'financial' && (
          <AttendanceDialog
            isOpen={isAttendanceDialogOpen}
            onOpenChange={setIsAttendanceDialogOpen}
            teamMemberId={selectedMemberForAttendance.id}
            teamMemberName={selectedMemberForAttendance.name}
            onAttendanceMarked={handleAttendanceMarked}
          />
        )}

        {/* Attendance Report Dialog */}
        {userRole !== 'financial' && (
          <AttendanceReportDialog
            isOpen={isAttendanceReportOpen}
            onOpenChange={setIsAttendanceReportOpen}
            teamMembers={teamMembers}
          />
        )}
      </PageContainer>
    </MainLayout>
  );
};

export default Teams;
