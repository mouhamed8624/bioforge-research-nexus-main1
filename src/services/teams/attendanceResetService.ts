import { supabase } from "@/integrations/supabase/client";
import { markAttendance } from "./attendanceService";

export interface AttendanceResetService {
  initializeDailyAttendance: () => Promise<void>;
  resetDailyAttendance: () => Promise<void>;
  scheduleDailyReset: () => void;
}

// Get all team members who should have attendance tracked
const getAllTeamMembers = async (): Promise<string[]> => {
  try {
    // Get all team members from the team_members table
    const { data: teamMembers, error: teamError } = await supabase
      .from('team_members')
      .select('id');
    
    if (teamError) {
      console.error('Error fetching team members:', teamError);
      return [];
    }

    // Also get all profiles as fallback
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id');
    
    if (profileError) {
      console.error('Error fetching profiles:', profileError);
    }

    // Combine both lists and remove duplicates, filter out invalid IDs
    const allIds = new Set<string>();
    
    if (teamMembers) {
      teamMembers.forEach(member => {
        if (member.id && member.id.length > 0 && member.id !== '1') {
          allIds.add(member.id);
        }
      });
    }
    
    if (profiles) {
      profiles.forEach(profile => {
        if (profile.id && profile.id.length > 0 && profile.id !== '1') {
          allIds.add(profile.id);
        }
      });
    }

    return Array.from(allIds);
  } catch (error) {
    console.error('Error getting team members:', error);
    return [];
  }
};

// Initialize daily attendance for all team members (mark as absent by default)
export const initializeDailyAttendance = async (): Promise<void> => {
  try {
    const memberIds = await getAllTeamMembers();
    const today = new Date().toISOString().split('T')[0];
    
    console.log(`Initializing daily attendance for ${memberIds.length} members on ${today}`);
    
    if (memberIds.length === 0) {
      console.log('No valid team members found to initialize attendance for');
      return;
    }
    
    // Check which members already have attendance records for today
    const { data: existingRecords, error: checkError } = await supabase
      .from('team_attendance')
      .select('team_member_id')
      .eq('date', today);
    
    if (checkError) {
      console.error('Error checking existing attendance:', checkError);
      return;
    }
    
    const existingMemberIds = new Set(existingRecords?.map(r => r.team_member_id) || []);
    
    // Only initialize attendance for members who don't have records yet
    const membersToInitialize = memberIds.filter(memberId => !existingMemberIds.has(memberId));
    
    if (membersToInitialize.length === 0) {
      console.log('All members already have attendance records for today');
      return;
    }
    
    // Mark absent for members who don't have attendance yet
    const promises = membersToInitialize.map(memberId => 
      markAttendance(
        memberId,
        today,
        'absent',
        'Auto-marked absent at start of day',
        'system'
      ).catch(error => {
        console.error(`Error marking attendance for member ${memberId}:`, error);
      })
    );
    
    await Promise.all(promises);
    console.log(`Daily attendance initialized for ${membersToInitialize.length} new members`);
  } catch (error) {
    console.error('Error initializing daily attendance:', error);
  }
};

// Reset attendance at midnight (this would typically be called by a cron job)
export const resetDailyAttendance = async (): Promise<void> => {
  console.log('Resetting daily attendance at midnight...');
  await initializeDailyAttendance();
};

// Schedule daily reset using browser API (for demo purposes)
// In production, this should be handled by the Supabase cron job
export const scheduleDailyReset = (): void => {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0); // Set to midnight
  
  const msUntilMidnight = tomorrow.getTime() - now.getTime();
  
  console.log(`Scheduling daily attendance reset in ${Math.round(msUntilMidnight / 1000 / 60)} minutes`);
  
  setTimeout(() => {
    resetDailyAttendance();
    // Schedule the next reset (24 hours later)
    setInterval(resetDailyAttendance, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
};

// Initialize attendance when the service starts - but don't auto-start
export const startAttendanceService = (): void => {
  console.log('Starting attendance service...');
  
  // Initialize today's attendance
  initializeDailyAttendance();
  
  // Schedule daily resets
  scheduleDailyReset();
};
