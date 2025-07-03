import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PatientFilters, type PatientFilters as PatientFiltersType } from "@/components/patients/PatientFilters";
import { PatientBatchOperations } from "@/components/patients/PatientBatchOperations";
import { useToast } from "@/hooks/use-toast";
import AddPatientDialog from "@/components/patients/AddPatientDialog";
import { Trash2, FilterX, Filter, Info, Edit2, TestTube, Clock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { SubmitLabDialog } from "@/components/patients/SubmitLabDialog";
import { PatientTimeline } from "@/components/patients/PatientTimeline";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QrCode, Printer } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Patient {
  id: string;
  name: string;
  patient_id?: string;
  date_of_birth: string;
  gender?: string;
  last_visit?: string;
  consent_obtained?: boolean;
  sample_type?: string;
  sample_collection_date?: string;
  project?: string;
  // Additional fields from the form
  ethnicity?: string;
  site?: string;
  selection_date?: string;
  quarter?: string;
  age?: number;
  weight?: number;
  temperature?: number;
  glycemia?: number;
  hemoglobin?: number;
  height?: number;
  malaria_type?: string;
  parasitaemia?: number;
  treatment_type?: string;
  consent_date?: string;
  patient_form_completed?: boolean;
  slides?: number;
  serums?: number;
  dna?: string;
  filter_paper?: number;
  glycerolytes?: string;
  samples_stored?: boolean;
  observations?: string;
  // Required database fields
  medical_record_number?: string;
  email?: string;
  phone?: string;
  diagnosis?: string;
  created_at?: string;
  updated_at?: string;
  father_name?: string;
  mother_name?: string;
  place_of_birth?: string;
}

function Patients() {
  const { toast } = useToast();
  const location = useLocation();
  const { userProfile } = useAuth();
  const userRole = userProfile.role;
  
  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatientIds, setSelectedPatientIds] = useState<string[]>([]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [patientToEdit, setPatientToEdit] = useState<Patient | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  const [patientInfoData, setPatientInfoData] = useState<Patient | null>(null);
  const [isLabDialogOpen, setIsLabDialogOpen] = useState(false);
  const [patientForLab, setPatientForLab] = useState<Patient | null>(null);
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const [patientForTimeline, setPatientForTimeline] = useState<Patient | null>(null);
  const [isAddPatientDialogOpen, setIsAddPatientDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Fetch patients function that can be called multiple times
  const fetchPatients = async () => {
    setLoading(true);
    try {
      console.log('Fetching patients from database...');
      const { data, error } = await supabase.from("patients").select("*").order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching patients:', error);
        throw error;
      }
      
      // Transform the data to ensure required fields have default values
      const transformedPatients = (data || []).map(patient => ({
        ...patient,
        patient_id: patient.medical_record_number || `P${patient.id.slice(-6)}`,
      }));
      
      console.log('Successfully fetched patients:', transformedPatients.length);
      setPatients(transformedPatients);
      setFilteredPatients(transformedPatients);
    } catch (error) {
      console.error("Error fetching patients:", error);
      toast({
        title: "Error fetching patients",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch patients
  useEffect(() => {
    fetchPatients();
  }, [toast]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredPatients(patients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = patients.filter(
      (patient) =>
        patient.name.toLowerCase().includes(query) ||
        (patient.patient_id && patient.patient_id.toLowerCase().includes(query)) ||
        (patient.project && patient.project.toLowerCase().includes(query))
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  // Handle patient selection
  const handlePatientSelect = (patientId: string) => {
    setSelectedPatientIds((prev) =>
      prev.includes(patientId)
        ? prev.filter((id) => id !== patientId)
        : [...prev, patientId]
    );
  };

  // Select all patients
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = filteredPatients.map((patient) => patient.id);
      setSelectedPatientIds(allIds);
    } else {
      setSelectedPatientIds([]);
    }
  };

  // Handle batch operations
  const handleBatchOperation = async (operation: string, patientIds: string[]) => {
    // This would be implemented to call your API
    console.log(`Applying operation ${operation} to patients:`, patientIds);
    
    // Simulate API call with timeout
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve();
      }, 1000);
    });
  };

  // Handle showing patient information
  const handlePatientInfoClick = (patient: Patient) => {
    setPatientInfoData(patient);
    setShowPatientInfo(true);
  };

  // Handle edit button click
  const handleEditClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation(); // Prevent row click event
    setPatientToEdit(patient);
    setIsEditDialogOpen(true);
  };

  // Handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation(); // Prevent row click event
    setPatientToDelete(patient);
    setIsDeleteDialogOpen(true);
  };

  // Delete patient - enhanced with better error handling and state management
  const deletePatient = async () => {
    if (!patientToDelete || isDeleting) return;
    
    // Validate that patientId is a valid UUID
    if (!patientToDelete.id || typeof patientToDelete.id !== 'string') {
      console.error('Invalid patient ID for deletion:', patientToDelete.id);
      toast({
        title: "Error",
        description: "Invalid patient ID",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
      setPatientToDelete(null);
      return;
    }
    
    setIsDeleting(true);
    
    try {
      console.log('Starting deletion for patient:', patientToDelete.name, 'ID:', patientToDelete.id);
      
      // First, check if patient has related records
      const { data: labResults } = await supabase
        .from("patient_lab_results")
        .select("id")
        .eq("patient_id", patientToDelete.id)
        .limit(1);
      
      const { data: bioSamples } = await supabase
        .from("bio_banks")
        .select("id")
        .eq("patient_id", patientToDelete.id)
        .limit(1);
      
      const { data: dbsSamples } = await supabase
        .from("dbs_samples")
        .select("id")
        .eq("patient_id", patientToDelete.id)
        .limit(1);
      
      if (labResults && labResults.length > 0) {
        throw new Error("Cannot delete patient: This patient has associated lab results. Please remove the lab results first.");
      }
      
      if (bioSamples && bioSamples.length > 0) {
        throw new Error("Cannot delete patient: This patient has associated bio bank samples. Please remove the bio bank samples first.");
      }
      
      if (dbsSamples && dbsSamples.length > 0) {
        throw new Error("Cannot delete patient: This patient has associated DBS samples. Please remove the DBS samples first.");
      }
      
      // Proceed with deletion
      const { error } = await supabase
        .from("patients")
        .delete()
        .eq("id", patientToDelete.id);
      
      if (error) {
        console.error('Supabase deletion error:', error);
        throw new Error(`Database error: ${error.message}`);
      }
      
      console.log('Patient successfully deleted from database');
      
      // Update local state immediately after successful deletion
      const updatedPatients = patients.filter(p => p.id !== patientToDelete.id);
      setPatients(updatedPatients);
      
      // Update filtered patients as well
      const updatedFilteredPatients = filteredPatients.filter(p => p.id !== patientToDelete.id);
      setFilteredPatients(updatedFilteredPatients);
      
      // Remove from selected IDs if present
      setSelectedPatientIds(prev => prev.filter(id => id !== patientToDelete.id));
      
      toast({
        title: "Patient deleted successfully",
        description: `${patientToDelete.name} has been permanently removed from the system.`,
      });
      
      console.log('Local state updated, patient removed from UI');
      
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast({
        title: "Failed to delete patient",
        description: error instanceof Error ? error.message : "An unknown error occurred while deleting the patient",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setPatientToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  };

  // Handle filter apply
  const handleApplyFilters = (filters: PatientFiltersType) => {
    let filtered = [...patients];
    
    // Filter by age range
    if (filters.ageRange[0] !== null || filters.ageRange[1] !== null) {
      filtered = filtered.filter(patient => {
        if (!patient.date_of_birth) return true;
        
        try {
          const birthDate = new Date(patient.date_of_birth);
          const today = new Date();
          const age = today.getFullYear() - birthDate.getFullYear();
          
          const minAge = filters.ageRange[0];
          const maxAge = filters.ageRange[1];
          
          if (minAge !== null && age < minAge) return false;
          if (maxAge !== null && age > maxAge) return false;
          
          return true;
        } catch {
          return true;
        }
      });
    }
    
    // Filter by gender
    if (filters.gender) {
      filtered = filtered.filter(patient => 
        patient.gender === filters.gender
      );
    }
    
    // Filter by consent
    if (filters.consentObtained !== null) {
      filtered = filtered.filter(patient => 
        patient.consent_obtained === filters.consentObtained
      );
    }
    
    // Filter by sample type
    if (filters.sampleTypes.length > 0) {
      filtered = filtered.filter(patient => 
        patient.sample_type && filters.sampleTypes.includes(patient.sample_type)
      );
    }
    
    // Apply filters
    setFilteredPatients(filtered);
    toast({
      title: "Filters applied",
      description: `Showing ${filtered.length} of ${patients.length} patients`,
    });
  };

  // Reset filters
  const handleResetFilters = () => {
    setFilteredPatients(patients);
    setSearchQuery("");
  };

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  };

  // Handle submit lab button click
  const handleSubmitLabClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation(); // Prevent row click event
    setPatientForLab(patient);
    setIsLabDialogOpen(true);
  };

  // Handle timeline button click
  const handleTimelineClick = (e: React.MouseEvent, patient: Patient) => {
    e.stopPropagation(); // Prevent row click event
    setPatientForTimeline(patient);
    setIsTimelineDialogOpen(true);
  };

  // Add a function to handle printing the sample identifier
  const handlePrintIdentifier = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    
    const htmlContent = `
      <html>
        <head>
          <title>Sample Identifier</title>
          <style>
            body {
              font-family: system-ui, -apple-system, sans-serif;
              padding: 20px;
            }
            .container {
              max-width: 400px;
              margin: 0 auto;
              border: 2px dashed #ccc;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .identifier {
              font-family: monospace;
              font-size: 32px;
              font-weight: bold;
              margin: 20px 0;
            }
            .patient-info {
              font-size: 14px;
              color: #666;
            }
            .qr-placeholder {
              width: 150px;
              height: 150px;
              margin: 0 auto 20px;
              border: 1px solid #ccc;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .scissors {
              margin: 10px 0;
              font-size: 24px;
            }
            .instructions {
              margin-top: 30px;
              font-size: 12px;
              color: #999;
            }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <div class="container">
            <div class="qr-placeholder">QR Code</div>
            <div class="identifier">${patientForTimeline ? generatePatientIdentifier(patientForTimeline.id) : ''}</div>
            <div class="patient-info">
              ${patientForTimeline ? patientForTimeline.name : ''} • ${patientForTimeline ? patientForTimeline.patient_id : ''}
            </div>
            <div class="scissors">✂ - - - - - - - - - - - - - - - - - - -</div>
            <div class="instructions">Cut along the dotted line and attach to sample tube</div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
  };
  
  // Function to generate alphanumeric identifier based on patient ID
  const generatePatientIdentifier = (patientId: string): string => {
    // Extract last 6 characters from the UUID and convert to uppercase
    const shortId = patientId.slice(-6).toUpperCase();
    // Add prefix AR (for Arcade) and format with hyphen
    return `AR-${shortId}`;
  };

  return (
    <MainLayout>
      <div className="container py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Patient Records</h1>
          {userRole !== 'lab' && (
            <Button 
              onClick={() => setIsAddPatientDialogOpen(true)}
              className="ml-auto"
            >
              Add Patient
            </Button>
          )}
          <AddPatientDialog 
            open={isAddPatientDialogOpen}
            onClose={() => setIsAddPatientDialogOpen(false)}
            onSuccess={fetchPatients}
          />
        </div>

        <div className="space-y-4">
          <PatientBatchOperations
            selectedPatientIds={selectedPatientIds}
            onClearSelection={() => setSelectedPatientIds([])}
            onBatchOperation={handleBatchOperation}
          />

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Patient Records</CardTitle>
              <CardDescription>
                Manage and view patient information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-2 flex-wrap">
                <div className="flex-1 min-w-[300px] flex gap-2">
                  <Input
                    placeholder="Search patients by name, ID or project..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                  />
                  
                  <Popover open={showFilters} onOpenChange={setShowFilters}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant={showFilters ? "default" : "outline"} 
                        className={showFilters ? "bg-primary" : ""}
                        onClick={() => setShowFilters(!showFilters)}
                      >
                        {showFilters ? <FilterX className="h-4 w-4 mr-2" /> : <Filter className="h-4 w-4 mr-2" />}
                        Filters
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="max-w-[500px] max-h-[600px] overflow-y-auto">
                        <PatientFilters 
                          onApplyFilters={(filters) => {
                            handleApplyFilters(filters);
                            setShowFilters(false);
                          }}
                          onResetFilters={() => {
                            handleResetFilters();
                            setShowFilters(false);
                          }}
                        />
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Popover open={showPatientInfo && !!patientInfoData} onOpenChange={setShowPatientInfo}>
                    <PopoverTrigger asChild>
                      <Button 
                        variant={showPatientInfo ? "default" : "outline"} 
                        className={showPatientInfo ? "bg-primary" : ""}
                        onClick={() => {
                          if (!patientInfoData && filteredPatients.length > 0) {
                            setPatientInfoData(filteredPatients[0]);
                          }
                          setShowPatientInfo(!showPatientInfo);
                        }}
                        disabled={filteredPatients.length === 0 && !patientInfoData}
                      >
                        <Info className="h-4 w-4 mr-2" />
                        Patient Information
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      {patientInfoData ? (
                        <div className="max-h-[500px] overflow-y-auto p-4">
                          <div className="flex justify-between items-center mb-4">
                            <h3 className="font-medium text-lg">Patient Information</h3>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setShowPatientInfo(false)}
                            >
                              Close
                            </Button>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Basic Information */}
                            <div>
                              <h4 className="font-medium border-b pb-1 mb-2">Basic Information</h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">Name</p>
                                  <p>{patientInfoData.name || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Patient ID</p>
                                  <p>{patientInfoData.patient_id || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Father's Name</p>
                                  <p>{patientInfoData.father_name || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Mother's Name</p>
                                  <p>{patientInfoData.mother_name || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Place of Birth</p>
                                  <p>{patientInfoData.place_of_birth || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Gender</p>
                                  <p>{patientInfoData.gender || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Date of Birth</p>
                                  <p>{formatDate(patientInfoData.date_of_birth)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Age</p>
                                  <p>{patientInfoData.age !== undefined ? `${patientInfoData.age} years` : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Ethnicity</p>
                                  <p>{patientInfoData.ethnicity || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Site</p>
                                  <p>{patientInfoData.site || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Project</p>
                                  <p>{patientInfoData.project || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Selection Date</p>
                                  <p>{formatDate(patientInfoData.selection_date)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Last Visit</p>
                                  <p>{formatDate(patientInfoData.last_visit)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Quarter (Address)</p>
                                  <p>{patientInfoData.quarter || '—'}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Medical Metrics */}
                            <div>
                              <h4 className="font-medium border-b pb-1 mb-2">Medical Metrics</h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">Weight (Kg)</p>
                                  <p>{patientInfoData.weight !== undefined ? patientInfoData.weight : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Height (cm)</p>
                                  <p>{patientInfoData.height !== undefined ? patientInfoData.height : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Temperature (°C)</p>
                                  <p>{patientInfoData.temperature !== undefined ? patientInfoData.temperature : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Glycemia</p>
                                  <p>{patientInfoData.glycemia !== undefined ? patientInfoData.glycemia : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Hemoglobin</p>
                                  <p>{patientInfoData.hemoglobin !== undefined ? patientInfoData.hemoglobin : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Malaria Type</p>
                                  <p>{patientInfoData.malaria_type || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Parasitaemia (%)</p>
                                  <p>{patientInfoData.parasitaemia !== undefined ? patientInfoData.parasitaemia : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Treatment Type</p>
                                  <p>{patientInfoData.treatment_type || '—'}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Consent & Forms */}
                            <div>
                              <h4 className="font-medium border-b pb-1 mb-2">Consent & Forms</h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">Consent Obtained</p>
                                  <p>{patientInfoData.consent_obtained ? 'Yes' : 'No'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Consent Date</p>
                                  <p>{formatDate(patientInfoData.consent_date)}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Patient Form Completed</p>
                                  <p>{patientInfoData.patient_form_completed ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Samples */}
                            <div>
                              <h4 className="font-medium border-b pb-1 mb-2">Samples</h4>
                              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <div>
                                  <p className="text-sm text-muted-foreground">Slides</p>
                                  <p>{patientInfoData.slides !== undefined ? patientInfoData.slides : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Serums</p>
                                  <p>{patientInfoData.serums !== undefined ? patientInfoData.serums : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">DNA</p>
                                  <p>{patientInfoData.dna || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Filter Paper</p>
                                  <p>{patientInfoData.filter_paper !== undefined ? patientInfoData.filter_paper : '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Glycerolytes</p>
                                  <p>{patientInfoData.glycerolytes || '—'}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Samples Stored</p>
                                  <p>{patientInfoData.samples_stored ? 'Yes' : 'No'}</p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Observations */}
                            {patientInfoData.observations && (
                              <div>
                                <h4 className="font-medium border-b pb-1 mb-2">Observations</h4>
                                <p className="text-sm whitespace-pre-wrap">{patientInfoData.observations}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4">
                          <p>No patient selected. Please select a patient from the table.</p>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            selectedPatientIds.length === filteredPatients.length &&
                            filteredPatients.length > 0
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>Patient Name</TableHead>
                      <TableHead>Last Visit</TableHead>
                      <TableHead>Project</TableHead>
                      <TableHead>Created At</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          Loading patients...
                        </TableCell>
                      </TableRow>
                    ) : filteredPatients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8">
                          No patients found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPatients.map((patient) => (
                        <TableRow 
                          key={patient.id}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="w-10">
                            <Checkbox
                              checked={selectedPatientIds.includes(patient.id)}
                              onCheckedChange={() => handlePatientSelect(patient.id)}
                            />
                          </TableCell>
                          <TableCell>{patient.patient_id}</TableCell>
                          <TableCell className="font-medium">{patient.name}</TableCell>
                          <TableCell>{formatDate(patient.last_visit)}</TableCell>
                          <TableCell>{patient.project || "—"}</TableCell>
                          <TableCell>{formatDate(patient.created_at)}</TableCell>
                          <TableCell className="text-right space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handlePatientInfoClick(patient)}
                              title="View Patient Info"
                            >
                              <Info className="h-4 w-4" />
                              <span className="sr-only">Info</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleTimelineClick(e, patient)}
                              title="View Patient Timeline"
                            >
                              <Clock className="h-4 w-4" />
                              <span className="sr-only">Timeline</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => handleSubmitLabClick(e, patient)}
                              title="Submit Lab Results"
                            >
                              <TestTube className="h-4 w-4" />
                              <span className="sr-only">Lab</span>
                            </Button>
                            {userRole !== 'lab' && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleEditClick(e, patient)}
                                title="Edit Patient"
                              >
                                <Edit2 className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Dialog - This would open AddPatientDialog in edit mode */}
      {patientToEdit && (
        <AddPatientDialog 
          open={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onOpenChange={setIsEditDialogOpen}
          onSuccess={fetchPatients}
          patientToEdit={patientToEdit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm deletion</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the patient record for{" "}
              <span className="font-semibold">{patientToDelete?.name}</span>? This action cannot be
              undone and will permanently remove all patient data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive" 
              onClick={deletePatient}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Patient"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Patient Timeline Dialog */}
      <Dialog open={isTimelineDialogOpen} onOpenChange={setIsTimelineDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Timeline</DialogTitle>
            <DialogDescription>
              Complete history for {patientForTimeline?.name}
            </DialogDescription>
          </DialogHeader>
          
          {patientForTimeline && (
            <div className="space-y-6 mt-4">
              <div className="flex flex-wrap gap-4">
                <div className="bg-muted/30 rounded-lg p-3 flex-1 min-w-[180px]">
                  <p className="text-sm text-muted-foreground">Patient ID</p>
                  <p className="font-medium">{patientForTimeline.patient_id}</p>
                </div>
                <div className="bg-muted/30 rounded-lg p-3 flex-1 min-w-[180px]">
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">{patientForTimeline.project || "—"}</p>
                </div>
              </div>
              
              <div className="bg-muted/30 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-sm text-muted-foreground">Sample Identifier</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handlePrintIdentifier} 
                    className="h-8"
                  >
                    <Printer className="h-4 w-4 mr-1" />
                    Print Label
                  </Button>
                </div>
                <div className="flex items-center">
                  <QrCode className="h-4 w-4 mr-2 text-primary" />
                  <p className="font-mono font-bold">
                    {generatePatientIdentifier(patientForTimeline.id)}
                  </p>
                </div>
              </div>
              
              <PatientTimeline patientId={patientForTimeline.id} />
              
              <div className="flex justify-end space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setIsTimelineDialogOpen(false)}
                >
                  Close
                </Button>
                <Button 
                  variant="timeline"
                  onClick={(e) => {
                    setIsTimelineDialogOpen(false);
                    handleSubmitLabClick(e, patientForTimeline);
                  }}
                >
                  <TestTube className="h-4 w-4 mr-1" />
                  Submit New Lab Result
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Submit Lab Dialog */}
      {patientForLab && (
        <SubmitLabDialog
          isOpen={isLabDialogOpen}
          onClose={() => setIsLabDialogOpen(false)}
          patientId={patientForLab.id}
          patientName={patientForLab.name}
        />
      )}
    </MainLayout>
  );
}

export default Patients;
