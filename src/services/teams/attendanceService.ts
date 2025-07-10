
import { supabase } from "@/integrations/supabase/client";

export interface AttendanceRecord {
  id: string;
  team_member_id: string;
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string | null;
  recorded_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendanceRate: number;
}

// Get all attendance records
export const getAttendanceRecords = async (): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from('team_attendance')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance records:', error);
    throw error;
  }

  return (data || []).map(record => ({
    ...record,
    status: record.status as 'present' | 'absent' | 'late' | 'excused'
  }));
};

// Get attendance records for a specific date range
export const getAttendanceByDateRange = async (startDate: string, endDate: string): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from('team_attendance')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance records for date range:', error);
    throw error;
  }

  return (data || []).map(record => ({
    ...record,
    status: record.status as 'present' | 'absent' | 'late' | 'excused'
  }));
};

// Get attendance records for a specific team member
export const getAttendanceByMember = async (memberId: string): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from('team_attendance')
    .select('*')
    .eq('team_member_id', memberId)
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching attendance records for member:', error);
    throw error;
  }

  return (data || []).map(record => ({
    ...record,
    status: record.status as 'present' | 'absent' | 'late' | 'excused'
  }));
};

// Get attendance records for a specific date
export const getAttendanceByDate = async (date: string): Promise<AttendanceRecord[]> => {
  const { data, error } = await supabase
    .from('team_attendance')
    .select('*')
    .eq('date', date);

  if (error) {
    console.error('Error fetching attendance records for date:', error);
    throw error;
  }

  return (data || []).map(record => ({
    ...record,
    status: record.status as 'present' | 'absent' | 'late' | 'excused'
  }));
};

// Mark attendance for a team member - Fixed to properly handle upserts
export const markAttendance = async (
  memberId: string,
  date: string,
  status: 'present' | 'absent' | 'late' | 'excused',
  notes?: string,
  recordedBy?: string
): Promise<AttendanceRecord> => {
  console.log('Marking attendance:', { memberId, date, status, notes, recordedBy });
  
  // First check if a record already exists
  const { data: existingRecord, error: checkError } = await supabase
    .from('team_attendance')
    .select('*')
    .eq('team_member_id', memberId)
    .eq('date', date)
    .maybeSingle();

  if (checkError) {
    console.error('Error checking existing attendance:', checkError);
    throw checkError;
  }

  let result;
  
  if (existingRecord) {
    // Update existing record
    const { data, error } = await supabase
      .from('team_attendance')
      .update({
        status,
        notes,
        recorded_by: recordedBy,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingRecord.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating attendance:', error);
      throw error;
    }
    result = data;
  } else {
    // Insert new record
    const { data, error } = await supabase
      .from('team_attendance')
      .insert({
        team_member_id: memberId,
        date,
        status,
        notes,
        recorded_by: recordedBy,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error inserting attendance:', error);
      throw error;
    }
    result = data;
  }

  return {
    ...result,
    status: result.status as 'present' | 'absent' | 'late' | 'excused'
  };
};

// Initialize daily attendance for a new team member
export const initializeMemberAttendance = async (memberId: string): Promise<void> => {
  console.log(`Initializing attendance for member ${memberId}`);
  return Promise.resolve();
};

// Update attendance record
export const updateAttendance = async (
  id: string,
  updates: Partial<Pick<AttendanceRecord, 'status' | 'notes'>>
): Promise<AttendanceRecord> => {
  const { data, error } = await supabase
    .from('team_attendance')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating attendance:', error);
    throw error;
  }

  return {
    ...data,
    status: data.status as 'present' | 'absent' | 'late' | 'excused'
  };
};

// Delete attendance record
export const deleteAttendance = async (id: string): Promise<boolean> => {
  const { error } = await supabase
    .from('team_attendance')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting attendance:', error);
    return false;
  }

  return true;
};

// Calculate attendance statistics for a team member
export const calculateAttendanceStats = async (memberId: string, startDate?: string, endDate?: string): Promise<AttendanceStats> => {
  let query = supabase
    .from('team_attendance')
    .select('status')
    .eq('team_member_id', memberId);

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error calculating attendance stats:', error);
    throw error;
  }

  const records = data || [];
  const totalDays = records.length;
  const presentDays = records.filter(r => r.status === 'present').length;
  const absentDays = records.filter(r => r.status === 'absent').length;
  const lateDays = records.filter(r => r.status === 'late').length;
  const excusedDays = records.filter(r => r.status === 'excused').length;
  const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

  return {
    totalDays,
    presentDays,
    absentDays,
    lateDays,
    excusedDays,
    attendanceRate
  };
};

// Alias for backwards compatibility
export const getAttendanceStats = calculateAttendanceStats;

// Get attendance statistics for all team members
export const getTeamAttendanceStats = async (memberIds: string[], startDate?: string, endDate?: string): Promise<AttendanceStats> => {
  try {
    // Filter out invalid member IDs
    const validMemberIds = memberIds.filter(id => id && id.length > 0 && id !== '1');
    
    if (validMemberIds.length === 0) {
      console.log('No valid member IDs provided, returning empty stats');
      return {
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        lateDays: 0,
        excusedDays: 0,
        attendanceRate: 0
      };
    }

    console.log('Fetching team attendance stats for members:', validMemberIds);

    let query = supabase
      .from('team_attendance')
      .select('status')
      .in('team_member_id', validMemberIds);

    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    // Add timeout for the query
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Attendance query timeout - check your internet connection')), 8000)
    );

    const queryPromise = query;
    const { data, error } = await Promise.race([queryPromise, timeoutPromise]);

    if (error) {
      console.error('Error calculating team attendance stats:', error);
      
      // Provide more specific error information
      if (error.message?.includes('fetch') || error.message?.includes('Load failed')) {
        throw new Error('Network error - check your internet connection');
      } else if (error.code === 'PGRST116') {
        // Table doesn't exist or no data
        console.log('No attendance data found, returning empty stats');
        return {
          totalDays: 0,
          presentDays: 0,
          absentDays: 0,
          lateDays: 0,
          excusedDays: 0,
          attendanceRate: 0
        };
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }

    const records = data || [];
    console.log(`Found ${records.length} attendance records for team stats`);
    
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'present').length;
    const absentDays = records.filter(r => r.status === 'absent').length;
    const lateDays = records.filter(r => r.status === 'late').length;
    const excusedDays = records.filter(r => r.status === 'excused').length;
    const attendanceRate = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

    return {
      totalDays,
      presentDays,
      absentDays,
      lateDays,
      excusedDays,
      attendanceRate
    };
  } catch (error: any) {
    console.error('Error calculating team attendance stats:', error);
    
    // Handle different types of errors more gracefully
    if (error?.message?.includes('timeout')) {
      throw new Error('Request timed out - check your internet connection');
    } else if (error?.message?.includes('Network error')) {
      throw error; // Re-throw network errors as-is
    } else if (error?.message?.includes('Database error')) {
      throw error; // Re-throw database errors as-is
    } else {
      throw new Error('Error fetching attendance data');
    }
  }
};

// Manually trigger the daily attendance marking function
export const triggerDailyAttendanceMarking = async (): Promise<boolean> => {
  console.log('Daily attendance marking triggered');
  return Promise.resolve(true);
};

// Enhanced function to get attendance records for specific periods
export const getAttendanceForPeriod = async (
  period: 'daily' | 'weekly' | 'monthly',
  date: Date = new Date()
): Promise<AttendanceRecord[]> => {
  let startDate: string;
  let endDate: string;

  switch (period) {
    case 'daily':
      startDate = endDate = date.toISOString().split('T')[0];
      break;
    case 'weekly':
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // Monday
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday
      startDate = weekStart.toISOString().split('T')[0];
      endDate = weekEnd.toISOString().split('T')[0];
      break;
    case 'monthly':
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      startDate = monthStart.toISOString().split('T')[0];
      endDate = monthEnd.toISOString().split('T')[0];
      break;
  }

  return getAttendanceByDateRange(startDate, endDate);
};
