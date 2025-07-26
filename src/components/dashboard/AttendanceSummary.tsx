
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, UserX, Clock, Calendar } from "lucide-react";
import { getTeamAttendanceStats, getAttendanceRecords, AttendanceStats, AttendanceRecord } from "@/services/teams/attendanceService";
import { useAuth } from "@/contexts/AuthContext";

export const AttendanceSummary = () => {
  const { userProfile } = useAuth();
  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats | null>(null);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  if (userProfile?.role === 'lab') {
    return null;
  }

  useEffect(() => {
    const fetchAttendanceData = async () => {
      try {
        setIsLoading(true);
        
        // Mock team member IDs for demo
        const mockTeamMemberIds = ["1", "2", "3", "4"];
        
        // Get team attendance stats
        const stats = await getTeamAttendanceStats(mockTeamMemberIds);
        setAttendanceStats(stats);
        
        // Get recent attendance records (last 5)
        const allRecords = await getAttendanceRecords();
        setRecentAttendance(allRecords.slice(0, 5));
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAttendanceData();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500';
      case 'absent': return 'bg-red-500';
      case 'late': return 'bg-yellow-500';
      case 'excused': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present': return <UserCheck className="h-3 w-3" />;
      case 'absent': return <UserX className="h-3 w-3" />;
      case 'late': return <Clock className="h-3 w-3" />;
      case 'excused': return <Calendar className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="neo-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Attendance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cigass-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="neo-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Attendance
        </CardTitle>
        <CardDescription>
          Auto-marked absent daily at 12 AM until marked present
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {attendanceStats ? (
          <>
            {/* Overall Attendance Rate */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Overall Attendance Rate</span>
                <span className="text-lg font-bold text-green-600">
                  {Number(attendanceStats.attendanceRate).toFixed(1)}%
                </span>
              </div>
              <Progress value={Number(attendanceStats.attendanceRate)} className="h-2" />
            </div>

            {/* Attendance Breakdown */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-green-500" />
                <span>Present: {Number(attendanceStats.presentDays)}</span>
              </div>
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-red-500" />
                <span>Absent: {Number(attendanceStats.absentDays)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-500" />
                <span>Late: {Number(attendanceStats.lateDays)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-500" />
                <span>Excused: {Number(attendanceStats.excusedDays)}</span>
              </div>
            </div>

            {/* System Info */}
            <div className="mt-4 p-2 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                <Calendar className="h-3 w-3 inline mr-1" />
                Team members are automatically marked absent at 12:00 AM daily
              </p>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p className="text-sm text-muted-foreground">No attendance data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
