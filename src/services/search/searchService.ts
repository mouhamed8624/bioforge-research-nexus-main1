import { supabase } from "@/integrations/supabase/client";

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'patient' | 'project' | 'paper' | 'equipment' | 'inventory' | 'dbs' | 'bio_banks' | 'plaquettes';
  url: string;
  link: string;
  date?: string;
  metadata?: any;
}

// Alias for backwards compatibility
export interface SearchResultItem extends SearchResult {}

// Return type for search results categorized by type
export interface CategorizedSearchResults {
  inventory: SearchResultItem[];
  events: SearchResultItem[];
  projects: SearchResultItem[];
  team: SearchResultItem[];
  patients: SearchResultItem[];
  dbs: SearchResultItem[];
  bio_banks: SearchResultItem[];
  plaquettes: SearchResultItem[];
}

export const searchAll = async (query: string): Promise<CategorizedSearchResults> => {
  if (!query.trim()) {
    return {
      inventory: [],
      events: [],
      projects: [],
      team: [],
      patients: [],
      dbs: [],
      bio_banks: [],
      plaquettes: [],
    };
  }

  const searchTerm = `%${query.toLowerCase()}%`;
  const results: CategorizedSearchResults = {
    inventory: [],
    events: [],
    projects: [],
    team: [],
    patients: [],
    dbs: [],
    bio_banks: [],
    plaquettes: [],
  };

  try {
    // Search patients
    const { data: patients } = await supabase
      .from('patients')
      .select('*')
      .or(`name.ilike.${searchTerm},email.ilike.${searchTerm},medical_record_number.ilike.${searchTerm}`);

    if (patients) {
      patients.forEach(patient => {
        results.patients.push({
          id: patient.id,
          title: patient.name,
          description: `Patient - ${patient.email || 'No email'} - MRN: ${patient.medical_record_number || 'N/A'}`,
          type: 'patient',
          url: `/patients`,
          link: `/patients`,
          metadata: patient
        });
      });
    }

    // Search projects
    const { data: projects } = await supabase
      .from('projects')
      .select('*')
      .or(`name.ilike.${searchTerm},description.ilike.${searchTerm}`);

    if (projects) {
      projects.forEach(project => {
        results.projects.push({
          id: project.id,
          title: project.name,
          description: `Project - ${project.description || 'No description'}`,
          type: 'project',
          url: `/projects`,
          link: `/projects`,
          date: project.created_at,
          metadata: project
        });
      });
    }

    // Search equipment
    const { data: equipment } = await supabase
      .from('equipment_items')
      .select('*')
      .ilike('name', searchTerm);

    if (equipment) {
      equipment.forEach(item => {
        results.inventory.push({
          id: item.id,
          title: item.name,
          description: `Equipment - General Equipment`,
          type: 'equipment',
          url: `/inventory`,
          link: `/inventory`,
          metadata: item
        });
      });
    }

    // Search inventory items - updated to use new French properties
    const { data: inventory } = await supabase
      .from('inventory_items')
      .select('*')
      .or(`produit.ilike.${searchTerm},type.ilike.${searchTerm}`);

    if (inventory) {
      inventory.forEach(item => {
        results.inventory.push({
          id: item.id,
          title: item.produit,
          description: `Inventory - ${item.type || 'No type'} - Stock: ${item.quantite_restante}`,
          type: 'inventory',
          url: `/inventory`,
          link: `/inventory`,
          metadata: item
        });
      });
    }

    // Search DBS samples
    const { data: dbs } = await supabase
      .from('dbs_samples')
      .select('id, sample_id, collection_date, status, storage_location, patients(name)')
      .or(`sample_id.ilike.${searchTerm},status.ilike.${searchTerm},storage_location.ilike.${searchTerm}`);
    if (dbs) {
      dbs.forEach((item: any) => {
        results.dbs.push({
          id: item.id,
          title: item.sample_id,
          description: `DBS Sample - ${item.status || 'No status'} - Patient: ${item.patients?.name || 'Unknown'}`,
          type: 'dbs',
          url: `/dbs`,
          link: `/dbs`,
          metadata: item
        });
      });
    }

    // Search Bio Banks
    const { data: bioBanks } = await supabase
      .from('bio_banks')
      .select('id, sample_id, sample_type, status, storage_location, patients(name)')
      .or(`sample_id.ilike.${searchTerm},sample_type.ilike.${searchTerm},status.ilike.${searchTerm},storage_location.ilike.${searchTerm}`);
    if (bioBanks) {
      bioBanks.forEach((item: any) => {
        results.bio_banks.push({
          id: item.id,
          title: item.sample_id,
          description: `BioBank Sample - ${item.sample_type || 'No type'} - Patient: ${item.patients?.name || 'Unknown'}`,
          type: 'bio_banks',
          url: `/bio-banks`,
          link: `/bio-banks`,
          metadata: item
        });
      });
    }

    // Search Plaquettes
    const { data: plaquettes } = await supabase
      .from('plaquettes')
      .select('id, plaquette_id, plaquette_type, status, storage_location, patients(name)')
      .or(`plaquette_id.ilike.${searchTerm},plaquette_type.ilike.${searchTerm},status.ilike.${searchTerm},storage_location.ilike.${searchTerm}`);
    if (plaquettes) {
      plaquettes.forEach((item: any) => {
        results.plaquettes.push({
          id: item.id,
          title: item.plaquette_id,
          description: `Plaquette - ${item.plaquette_type || 'No type'} - Patient: ${item.patients?.name || 'Unknown'}`,
          type: 'plaquettes',
          url: `/plaquettes`,
          link: `/plaquettes`,
          metadata: item
        });
      });
    }

  } catch (error) {
    console.error('Search error:', error);
  }

  return results;
};

export const searchByType = async (query: string, type: 'patient' | 'project' | 'paper' | 'equipment' | 'inventory'): Promise<SearchResult[]> => {
  const allResults = await searchAll(query);
  const flatResults = [
    ...allResults.inventory,
    ...allResults.events,
    ...allResults.projects,
    ...allResults.team,
    ...allResults.patients,
    ...allResults.dbs,
    ...allResults.bio_banks,
    ...allResults.plaquettes
  ];
  return flatResults.filter(result => result.type === type);
};
