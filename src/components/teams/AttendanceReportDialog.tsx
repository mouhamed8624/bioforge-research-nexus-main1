import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Download, Users, CheckCircle, XCircle, Clock, Shield, User } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, parseISO } from "date-fns";
import { getAttendanceByDateRange, AttendanceRecord, updateAttendance } from "@/services/teams/attendanceService";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface AttendanceReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  teamMembers: Array<{ id: string; name: string; email: string; role: string }>;
}

type ReportType = 'daily' | 'weekly' | 'monthly' | 'yearly';

interface MemberStats {
  memberId: string;
  memberName: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  justifiedAbsentDays: number;
  attendanceRate: number;
}

export const AttendanceReportDialog = ({ isOpen, onOpenChange, teamMembers }: AttendanceReportDialogProps) => {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { userProfile } = useAuth();

  // Check if user can justify absences
  const canJustifyAbsences = userProfile?.role === 'president' || 
                            userProfile?.role === 'admin' || 
                            userProfile?.role === 'manager';

  useEffect(() => {
    if (isOpen) {
      fetchAttendanceData();
    }
  }, [isOpen, reportType]);

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const today = new Date();
      let startDate: string;
      let endDate: string;
      
      switch (reportType) {
        case 'daily':
          startDate = endDate = format(today, 'yyyy-MM-dd');
          break;
        case 'weekly':
          const weekStart = startOfWeek(today, { weekStartsOn: 1 });
          const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
          startDate = format(weekStart, 'yyyy-MM-dd');
          endDate = format(weekEnd, 'yyyy-MM-dd');
          break;
        case 'monthly':
          const monthStart = startOfMonth(today);
          const monthEnd = endOfMonth(today);
          startDate = format(monthStart, 'yyyy-MM-dd');
          endDate = format(monthEnd, 'yyyy-MM-dd');
          break;
        case 'yearly':
          const yearStart = startOfYear(today);
          const yearEnd = endOfYear(today);
          startDate = format(yearStart, 'yyyy-MM-dd');
          endDate = format(yearEnd, 'yyyy-MM-dd');
          break;
      }
      
      console.log('Fetching attendance data for period:', { startDate, endDate, reportType });
      const records = await getAttendanceByDateRange(startDate, endDate);
      console.log('Fetched attendance records:', records.length);
      
      setAttendanceData(records);
      calculateMemberStats(records);
    } catch (error) {
      console.error('Error fetching attendance data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch attendance data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateMemberStats = (records: AttendanceRecord[]) => {
    if (reportType === 'daily') {
      setMemberStats([]);
      return;
    }

    const stats: MemberStats[] = teamMembers.map(member => {
      const memberRecords = records.filter(r => r.team_member_id === member.id);
      const totalDays = memberRecords.length;
      const presentDays = memberRecords.filter(r => r.status === 'present').length;
      const absentDays = memberRecords.filter(r => r.status === 'absent').length;
      const justifiedAbsentDays = memberRecords.filter(r => r.status === 'justified_absent').length;
      const attendanceRate = totalDays > 0 ? (presentDays / totalDays * 100) : 0;

      return {
        memberId: member.id,
        memberName: member.name,
        totalDays,
        presentDays,
        absentDays,
        justifiedAbsentDays,
        attendanceRate: parseFloat(attendanceRate.toFixed(1))
      };
    });

    setMemberStats(stats);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'justified_absent': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <CheckCircle className="h-4 w-4" />;
      case 'absent': return <XCircle className="h-4 w-4" />;
      case 'justified_absent': return <Shield className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getMemberName = (memberId: string) => {
    const member = teamMembers.find(m => m.id === memberId);
    return member?.name || 'Unknown Member';
  };

  const generateSummaryStats = () => {
    const totalRecords = attendanceData.length;
    const presentCount = attendanceData.filter(r => r.status === 'present').length;
    const absentCount = attendanceData.filter(r => r.status === 'absent').length;
    const justifiedAbsentCount = attendanceData.filter(r => r.status === 'justified_absent').length;
    
    return {
      total: totalRecords,
      present: presentCount,
      absent: absentCount,
      justifiedAbsent: justifiedAbsentCount,
      attendanceRate: totalRecords > 0 ? (presentCount / totalRecords * 100).toFixed(1) : '0'
    };
  };

  const handleExport = () => {
    const stats = generateSummaryStats();
    const reportData = {
      reportType,
      generatedAt: new Date().toISOString(),
      period: format(new Date(), 'yyyy-MM-dd'),
      summary: stats,
      memberStatistics: memberStats,
      records: attendanceData.map(record => ({
        member: getMemberName(record.team_member_id),
        date: record.date,
        status: record.status,
        notes: record.notes || ''
      }))
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-report-${reportType}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Attendance report exported successfully",
    });
  };

  const handleJustifyAbsence = async (recordId: string, currentStatus: string) => {
    console.log('handleJustifyAbsence called with:', { recordId, currentStatus });
    
    if (currentStatus !== 'absent') {
      toast({
        title: "Invalid Action",
        description: "Only absent records can be justified",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('Calling updateAttendance with:', { recordId, status: 'justified_absent' });
      await updateAttendance(recordId, { status: 'justified_absent' });
      
      console.log('Successfully updated attendance, refreshing data...');
      // Refresh the attendance data
      await fetchAttendanceData();
      
      toast({
        title: "Success",
        description: "Absence has been justified successfully",
      });
    } catch (error) {
      console.error('Error justifying absence:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast({
        title: "Error",
        description: `Failed to justify absence: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const StatsSkeleton = () => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const TableSkeleton = () => (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex space-x-4">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );

  const stats = generateSummaryStats();

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance Report
          </DialogTitle>
          <DialogDescription>
            View attendance reports by day, week, month, or year with detailed member statistics
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Report Type Selector */}
          <div className="flex items-center gap-4">
            <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily Report</SelectItem>
                <SelectItem value="weekly">Weekly Report</SelectItem>
                <SelectItem value="monthly">Monthly Report</SelectItem>
                <SelectItem value="yearly">Yearly Report</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleExport} variant="outline" className="flex items-center gap-2" disabled={loading}>
              <Download className="h-4 w-4" />
              Export Report
            </Button>
          </div>

          {/* Summary Stats */}
          {loading ? (
            <StatsSkeleton />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Total Records</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-green-600">Present</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">{stats.present}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-red-600">Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-orange-600">Justified Absent</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">{stats.justifiedAbsent}</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Member Statistics */}
          {(reportType === 'weekly' || reportType === 'monthly' || reportType === 'yearly') && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Individual Member Statistics
                </CardTitle>
                <CardDescription>
                  Detailed attendance breakdown for each team member
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <TableSkeleton />
                ) : memberStats.length === 0 ? (
                  <div className="text-center py-8">
                    <User className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm text-muted-foreground">No member statistics available</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Member Name</TableHead>
                        <TableHead className="text-center">Total Days</TableHead>
                        <TableHead className="text-center text-green-600">Present</TableHead>
                        <TableHead className="text-center text-red-600">Absent</TableHead>
                        <TableHead className="text-center text-orange-600">Justified Absent</TableHead>
                        <TableHead className="text-center">Attendance Rate</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {memberStats.map((member) => (
                        <TableRow key={member.memberId}>
                          <TableCell className="font-medium">{member.memberName}</TableCell>
                          <TableCell className="text-center">{member.totalDays}</TableCell>
                          <TableCell className="text-center text-green-600 font-semibold">{member.presentDays}</TableCell>
                          <TableCell className="text-center text-red-600 font-semibold">{member.absentDays}</TableCell>
                          <TableCell className="text-center text-orange-600 font-semibold">{member.justifiedAbsentDays}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={member.attendanceRate >= 80 ? "default" : "destructive"}>
                              {member.attendanceRate}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attendance Records Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Attendance Records
              </CardTitle>
              <CardDescription>
                {reportType === 'daily' && `Today's attendance (${format(new Date(), 'yyyy-MM-dd')})`}
                {reportType === 'weekly' && `This week's attendance (${format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM dd')} - ${format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM dd, yyyy')})`}
                {reportType === 'monthly' && `This month's attendance (${format(new Date(), 'MMMM yyyy')})`}
                {reportType === 'yearly' && `This year's attendance (${format(new Date(), 'yyyy')})`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <TableSkeleton />
              ) : attendanceData.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm text-muted-foreground">No attendance records found for this period</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Member</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Recorded By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {attendanceData.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium">
                          {getMemberName(record.team_member_id)}
                        </TableCell>
                        <TableCell>{format(parseISO(record.date), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <Badge className={`${getStatusColor(record.status)} text-white`}>
                            <span className="flex items-center gap-1">
                              {getStatusIcon(record.status)}
                              {record.status}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {record.notes || '-'}
                        </TableCell>
                        <TableCell>{record.recorded_by || 'System'}</TableCell>
                        <TableCell>
                          {record.status === 'absent' && canJustifyAbsences && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleJustifyAbsence(record.id, record.status)}
                              className="text-orange-600 border-orange-200 hover:bg-orange-50"
                            >
                              <Shield className="h-3 w-3 mr-1" />
                              Justify
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};
