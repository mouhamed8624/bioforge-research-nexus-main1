
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AttendanceStats } from "@/services/teams/attendanceService";
import { Calendar, CheckCircle, XCircle, Clock, Shield } from "lucide-react";

interface AttendanceStatsCardProps {
  stats: AttendanceStats;
  memberName?: string;
}

export const AttendanceStatsCard = ({ stats, memberName }: AttendanceStatsCardProps) => {
  const getAttendanceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getProgressColor = (rate: number) => {
    if (rate >= 90) return "bg-green-500";
    if (rate >= 80) return "bg-yellow-500";
    return "bg-red-500";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {memberName ? `${memberName} - Attendance` : 'Attendance Statistics'}
        </CardTitle>
        <CardDescription>
          {stats.totalDays} total days tracked
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Attendance Rate</span>
            <span className={`text-2xl font-bold ${getAttendanceColor(stats.attendanceRate)}`}>
              {stats.attendanceRate.toFixed(1)}%
            </span>
          </div>
          
          <Progress 
            value={stats.attendanceRate} 
            className="h-2"
          />

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span>Present: {stats.presentDays}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Absent: {stats.absentDays}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              <span>Late: {stats.lateDays}</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-blue-500" />
              <span>Excused: {stats.excusedDays}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
