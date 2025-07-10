import { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Critical data preloader to prevent page reloading
export class DataPreloader {
  private queryClient: QueryClient;
  private preloadedKeys = new Set<string>();

  constructor(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  // Preload patients data
  async preloadPatients() {
    const key = 'patients';
    if (this.preloadedKeys.has(key)) return;

    try {
      await this.queryClient.prefetchQuery({
        queryKey: ['patients'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('patients')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(100); // Limit for performance
          if (error) throw error;
          return data;
        },
        staleTime: 10 * 60 * 1000, // 10 minutes
      });
      this.preloadedKeys.add(key);
    } catch (error) {
      console.error('Failed to preload patients:', error);
    }
  }

  // Preload projects data
  async preloadProjects() {
    const key = 'projects';
    if (this.preloadedKeys.has(key)) return;

    try {
      await this.queryClient.prefetchQuery({
        queryKey: ['projects'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });
          if (error) throw error;
          return data;
        },
        staleTime: 10 * 60 * 1000,
      });
      this.preloadedKeys.add(key);
    } catch (error) {
      console.error('Failed to preload projects:', error);
    }
  }

  // Preload inventory data
  async preloadInventory() {
    const key = 'inventory';
    if (this.preloadedKeys.has(key)) return;

    try {
      await this.queryClient.prefetchQuery({
        queryKey: ['inventory'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('inventory_items')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(200);
          if (error) throw error;
          return data;
        },
        staleTime: 15 * 60 * 1000, // 15 minutes for inventory
      });
      this.preloadedKeys.add(key);
    } catch (error) {
      console.error('Failed to preload inventory:', error);
    }
  }

  // Preload laboratory data (Bio Banks, DBS, Plaquettes)
  async preloadLaboratoryData() {
    const promises = [];

    // Bio Banks
    if (!this.preloadedKeys.has('bio_banks')) {
      promises.push(
        this.queryClient.prefetchQuery({
          queryKey: ['bio_banks'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('bio_banks')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(100);
            if (error) throw error;
            return data;
          },
          staleTime: 10 * 60 * 1000,
        })
      );
      this.preloadedKeys.add('bio_banks');
    }

    // DBS Samples
    if (!this.preloadedKeys.has('dbs_samples')) {
      promises.push(
        this.queryClient.prefetchQuery({
          queryKey: ['dbs_samples'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('dbs_samples')
              .select('*')
              .order('created_at', { ascending: false })
              .limit(100);
            if (error) throw error;
            return data;
          },
          staleTime: 10 * 60 * 1000,
        })
      );
      this.preloadedKeys.add('dbs_samples');
    }

    // Plaquettes
    if (!this.preloadedKeys.has('plaquettes')) {
      promises.push(
        this.queryClient.prefetchQuery({
          queryKey: ['plaquettes'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('plaquettes' as any)
              .select('*')
              .order('created_at', { ascending: false })
              .limit(100);
            if (error) throw error;
            return data;
          },
          staleTime: 10 * 60 * 1000,
        })
      );
      this.preloadedKeys.add('plaquettes');
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to preload laboratory data:', error);
    }
  }

  // Preload team and calendar data
  async preloadTeamData() {
    const promises = [];

    // Team members
    if (!this.preloadedKeys.has('team_members')) {
      promises.push(
        this.queryClient.prefetchQuery({
          queryKey: ['team_members'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('team_members')
              .select('*')
              .order('name', { ascending: true });
            if (error) throw error;
            return data;
          },
          staleTime: 30 * 60 * 1000, // 30 minutes for team data
        })
      );
      this.preloadedKeys.add('team_members');
    }

    // Calendar events
    if (!this.preloadedKeys.has('calendar_events')) {
      promises.push(
        this.queryClient.prefetchQuery({
          queryKey: ['calendar_events'],
          queryFn: async () => {
            const { data, error } = await supabase
              .from('calendar_events')
              .select('*')
              .gte('event_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
              .order('event_date', { ascending: true });
            if (error) throw error;
            return data;
          },
          staleTime: 5 * 60 * 1000, // 5 minutes for calendar
        })
      );
      this.preloadedKeys.add('calendar_events');
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error('Failed to preload team data:', error);
    }
  }

  // Preload research papers
  async preloadResearchPapers() {
    const key = 'research_papers';
    if (this.preloadedKeys.has(key)) return;

    try {
      await this.queryClient.prefetchQuery({
        queryKey: ['research_papers'],
        queryFn: async () => {
          const { data, error } = await supabase
            .from('research_papers')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);
          if (error) throw error;
          return data;
        },
        staleTime: 15 * 60 * 1000,
      });
      this.preloadedKeys.add(key);
    } catch (error) {
      console.error('Failed to preload research papers:', error);
    }
  }

  // Preload all critical data based on user role
  async preloadCriticalData(userRole?: string) {
    const promises = [];

    // Always preload basic dashboard data
    promises.push(this.preloadProjects());

    // Role-based preloading
    switch (userRole) {
      case 'president':
      case 'admin':
        // Admins and presidents need access to everything
        promises.push(
          this.preloadPatients(),
          this.preloadInventory(),
          this.preloadLaboratoryData(),
          this.preloadTeamData(),
          this.preloadResearchPapers()
        );
        break;

      case 'lab':
        // Lab users need patient and lab data
        promises.push(
          this.preloadPatients(),
          this.preloadLaboratoryData()
        );
        break;

      case 'financial':
      case 'manager':
      case 'general_director':
        // Management roles need inventory and team data
        promises.push(
          this.preloadInventory(),
          this.preloadTeamData()
        );
        break;

      case 'field':
        // Field workers mainly need patient data
        promises.push(this.preloadPatients());
        break;

      default:
        // For unknown roles, load basic data
        promises.push(this.preloadPatients());
    }

    try {
      // Run all preloading in parallel for maximum speed
      await Promise.all(promises);
      console.log(`✅ Preloaded critical data for role: ${userRole || 'unknown'}`);
    } catch (error) {
      console.error('Failed to preload critical data:', error);
    }
  }

  // Clear preloaded keys (useful for testing or forcing refresh)
  clearPreloadedKeys() {
    this.preloadedKeys.clear();
  }

  // Check if data is already cached
  isDataCached(key: string): boolean {
    return this.queryClient.getQueryData([key]) !== undefined;
  }

  // Get cache statistics
  getCacheStats() {
    return {
      preloadedKeys: Array.from(this.preloadedKeys),
      totalQueries: this.queryClient.getQueryCache().getAll().length,
    };
  }
}

// Create singleton instance
let dataPreloader: DataPreloader | null = null;

export const createDataPreloader = (queryClient: QueryClient): DataPreloader => {
  if (!dataPreloader) {
    dataPreloader = new DataPreloader(queryClient);
  }
  return dataPreloader;
};

export const getDataPreloader = (): DataPreloader | null => {
  return dataPreloader;
}; 