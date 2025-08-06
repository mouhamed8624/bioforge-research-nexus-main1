import { supabase } from "@/integrations/supabase/client";

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: string;
  status: string;
}

export class TeamEmailService {
  private static instance: TeamEmailService;
  private verifiedEmails: Set<string> = new Set();
  private lastFetchTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): TeamEmailService {
    if (!TeamEmailService.instance) {
      TeamEmailService.instance = new TeamEmailService();
    }
    return TeamEmailService.instance;
  }

  /**
   * Fetch all team member emails from the database
   */
  async fetchTeamMemberEmails(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select('email, status')
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching team member emails:', error);
        return [];
      }

      const emails = data?.map(member => member.email).filter(Boolean) || [];
      console.log('Fetched team member emails:', emails);
      return emails;
    } catch (error) {
      console.error('Error fetching team member emails:', error);
      return [];
    }
  }

  /**
   * Get verified emails (team members + admin email)
   */
  async getVerifiedEmails(): Promise<Set<string>> {
    const now = Date.now();
    
    // Return cached data if it's still fresh
    if (now - this.lastFetchTime < this.CACHE_DURATION && this.verifiedEmails.size > 0) {
      return this.verifiedEmails;
    }

    // Fetch fresh data
    const teamEmails = await this.fetchTeamMemberEmails();
    
    // Add admin email (always verified)
    const adminEmail = 'mohamed8624.dev@gmail.com';
    
    // Create new set with all verified emails
    this.verifiedEmails = new Set([...teamEmails, adminEmail]);
    this.lastFetchTime = now;
    
    console.log('Updated verified emails:', Array.from(this.verifiedEmails));
    return this.verifiedEmails;
  }

  /**
   * Check if an email is verified (team member or admin)
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const verifiedEmails = await this.getVerifiedEmails();
    return verifiedEmails.has(email);
  }

  /**
   * Get all verified emails as an array
   */
  async getVerifiedEmailsArray(): Promise<string[]> {
    const verifiedEmails = await this.getVerifiedEmails();
    return Array.from(verifiedEmails);
  }

  /**
   * Force refresh the verified emails cache
   */
  async refreshVerifiedEmails(): Promise<void> {
    this.lastFetchTime = 0; // Reset cache
    await this.getVerifiedEmails(); // Fetch fresh data
  }
}

// Export singleton instance
export const teamEmailService = TeamEmailService.getInstance(); 