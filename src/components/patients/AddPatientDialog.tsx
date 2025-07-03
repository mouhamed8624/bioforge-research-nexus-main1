import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { format, differenceInYears } from "date-fns";
import { CalendarIcon, User, FileText, X, Building, ClipboardCheck, Beaker } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePickerPopover } from "@/components/ui/date-picker-popover";

interface AddPatientDialogProps {
  open: boolean;
  onClose: () => void;
  onPatientAdded?: () => void;
  patientToEdit?: any;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
}

const AddPatientDialog: React.FC<AddPatientDialogProps> = ({ 
  open, 
  onClose, 
  onPatientAdded,
  patientToEdit,
  onOpenChange,
  onSuccess
}) => {
  const getInitialFormData = () => ({
    name: '',
    medical_record_number: '',
    date_of_birth: new Date(),
    gender: '',
    email: '',
    phone: '',
    diagnosis: '',
    ethnicity: '',
    site: '',
    project: '',
    quarter_address: '',
    treatment_type: '',
    malaria_type: '',
    consent_obtained: false,
    patient_form_completed: false,
    consent_date: undefined as Date | undefined,
    last_visit: new Date() as Date | undefined,
    samples_slides: '',
    samples_serums: '',
    samples_dna: '',
    samples_filter_paper: '',
    weight: '',
    height: '',
    temperature: '',
    glycemia: '',
    hemoglobin: '',
    father_name: '',
    mother_name: '',
    place_of_birth: '',
  });

  const [formData, setFormData] = useState(getInitialFormData());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [age, setAge] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string; }[]>([]);

  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase.from('projects').select('id, name');
      if (error) {
        console.error('Error fetching projects:', error);
        toast({
          variant: "destructive",
          title: "Error fetching projects",
          description: "Could not load project list.",
        });
      } else if (data) {
        setProjects(data);
      }
    };
    if (open) {
      fetchProjects();
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      if (patientToEdit) {
        setFormData({
          name: patientToEdit.name || '',
          medical_record_number: patientToEdit.medical_record_number || '',
          date_of_birth: patientToEdit.date_of_birth ? new Date(patientToEdit.date_of_birth) : new Date(),
          gender: patientToEdit.gender || '',
          email: patientToEdit.email || '',
          phone: patientToEdit.phone || '',
          diagnosis: patientToEdit.diagnosis || '',
          ethnicity: patientToEdit.ethnicity || '',
          site: patientToEdit.site || '',
          project: patientToEdit.project || '',
          quarter_address: patientToEdit.quarter_address || '',
          treatment_type: patientToEdit.treatment_type || '',
          malaria_type: patientToEdit.malaria_type || '',
          consent_obtained: patientToEdit.consent_obtained || false,
          patient_form_completed: patientToEdit.patient_form_completed || false,
          consent_date: patientToEdit.consent_date ? new Date(patientToEdit.consent_date) : undefined,
          last_visit: patientToEdit.last_visit ? new Date(patientToEdit.last_visit) : new Date(),
          samples_slides: patientToEdit.samples_slides?.toString() || '',
          samples_serums: patientToEdit.samples_serums?.toString() || '',
          samples_dna: patientToEdit.samples_dna?.toString() || '',
          samples_filter_paper: patientToEdit.samples_filter_paper?.toString() || '',
          weight: patientToEdit.weight?.toString() || '',
          height: patientToEdit.height?.toString() || '',
          temperature: patientToEdit.temperature?.toString() || '',
          glycemia: patientToEdit.glycemia?.toString() || '',
          hemoglobin: patientToEdit.hemoglobin?.toString() || '',
          father_name: patientToEdit.father_name || '',
          mother_name: patientToEdit.mother_name || '',
          place_of_birth: patientToEdit.place_of_birth || '',
        });
      } else {
        setFormData(getInitialFormData());
      }
    }
  }, [open, patientToEdit]);

  useEffect(() => {
    if (formData.date_of_birth) {
      const calculatedAge = differenceInYears(new Date(), formData.date_of_birth);
      setAge(calculatedAge >= 0 ? calculatedAge.toString() : '');
    }
  }, [formData.date_of_birth]);

  useEffect(() => {
    const { name, gender, ethnicity, site } = formData;
    if (name && age && gender && ethnicity && site) {
      const namePart = name.substring(0, 2).toUpperCase();
      const genderPart = gender.substring(0, 1).toUpperCase();
      const ethnicityPart = ethnicity.substring(0, 2).toUpperCase();
      const sitePart = site.substring(0, 2).toUpperCase();
      
      const generatedId = `${namePart}${age}${genderPart}${ethnicityPart}${sitePart}`;
      
      setFormData(prevData => ({
        ...prevData,
        medical_record_number: generatedId
      }));
    } else {
      setFormData(prevData => ({
        ...prevData,
        medical_record_number: ''
      }));
    }
  }, [formData.name, age, formData.gender, formData.ethnicity, formData.site]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [id]: value
    }));
  };

  const handleDateChange = (id: string, date: Date | undefined) => {
    if (date) {
      setFormData(prevData => ({
        ...prevData,
        [id]: date
      }));
    }
  };

  const handleCheckboxChange = (id: string, checked: boolean) => {
    setFormData(prevData => ({
      ...prevData,
      [id]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Required Field",
        description: "Please enter the patient's name.",
      });
      return;
    }

    if (!formData.gender) {
      toast({
        variant: "destructive",
        title: "Required Field",
        description: "Please select a gender.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const submitData: any = {
        name: formData.name.trim(),
        medical_record_number: formData.medical_record_number || null,
        date_of_birth: format(formData.date_of_birth, 'yyyy-MM-dd'),
        gender: formData.gender,
        email: formData.email?.trim() || null,
        phone: formData.phone?.trim() || null,
        diagnosis: formData.diagnosis?.trim() || null,
        ethnicity: formData.ethnicity?.trim() || null,
        site: formData.site?.trim() || null,
        project: formData.project?.trim() || null,
        quarter: formData.quarter_address?.trim() || null,
        treatment_type: formData.treatment_type?.trim() || null,
        malaria_type: formData.malaria_type?.trim() || null,
        consent_obtained: formData.consent_obtained,
        patient_form_completed: formData.patient_form_completed,
        consent_date: formData.consent_date ? format(formData.consent_date, 'yyyy-MM-dd') : null,
        last_visit: formData.last_visit ? format(formData.last_visit, 'yyyy-MM-dd') : null,
        slides: formData.samples_slides ? parseInt(formData.samples_slides, 10) : null,
        serums: formData.samples_serums ? parseInt(formData.samples_serums, 10) : null,
        dna: formData.samples_dna?.trim() || null,
        filter_paper: formData.samples_filter_paper ? parseInt(formData.samples_filter_paper, 10) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        temperature: formData.temperature ? parseFloat(formData.temperature) : null,
        glycemia: formData.glycemia ? parseFloat(formData.glycemia) : null,
        hemoglobin: formData.hemoglobin ? parseFloat(formData.hemoglobin) : null,
        father_name: formData.father_name?.trim() || null,
        mother_name: formData.mother_name?.trim() || null,
        place_of_birth: formData.place_of_birth?.trim() || null,
      };

      console.log('Submitting patient data:', submitData);

      let error;

      if (patientToEdit) {
        const { error: updateError } = await supabase
          .from('patients')
          .update(submitData)
          .eq('id', patientToEdit.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('patients')
          .insert(submitData);
        error = insertError;
      }

      if (error) {
        console.error('Database error:', error);
        throw error;
      }
    
      toast({
        title: "Success!",
        description: `Patient ${patientToEdit ? 'updated' : 'added'} successfully.`,
      });
    
      // Reset form if adding new patient
      if (!patientToEdit) {
        setFormData(getInitialFormData());
      }
      
      onClose();
      if (onPatientAdded) onPatientAdded();
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error(`Error ${patientToEdit ? 'updating' : 'adding'} patient:`, error);
      toast({
        variant: "destructive",
        title: "Error!",
        description: error.message || `Failed to ${patientToEdit ? 'update' : 'add'} patient. Please try again.`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else if (!open) {
      onClose();
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <AlertDialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              <AlertDialogTitle className="text-2xl font-bold">
                {patientToEdit ? 'Edit Patient' : 'Add New Patient'}
              </AlertDialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 hover:bg-muted rounded-full"
              title="Close form"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <AlertDialogDescription>
            {patientToEdit ? "Update the patient's information below." : "Complete the patient information form below. Fields marked with * are required."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Full Name *</Label>
                  <Input 
                    type="text" 
                    id="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter patient's full name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medical_record_number" className="text-sm font-medium">Patient ID</Label>
                  <Input
                    type="text"
                    id="medical_record_number"
                    value={formData.medical_record_number}
                    readOnly
                    placeholder="Auto-generated"
                    className="h-10 bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth" className="text-sm font-medium">Date of Birth *</Label>
                  <DatePickerPopover
                    value={formData.date_of_birth}
                    onChange={(date) => handleDateChange('date_of_birth', date)}
                    placeholder="Select date of birth"
                    disabled={(date) => date > new Date()}
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-sm font-medium">Age</Label>
                  <Input
                    id="age"
                    value={age}
                    readOnly
                    placeholder="Auto-calculated"
                    className="h-10 bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-sm font-medium">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value) => setFormData(prevData => ({ ...prevData, gender: value }))} required>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_visit" className="text-sm font-medium">Last Visit</Label>
                  <DatePickerPopover
                    value={formData.last_visit}
                    onChange={(date) => handleDateChange('last_visit', date)}
                    placeholder="Select last visit date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="father_name" className="text-sm font-medium">Father's Name</Label>
                  <Input
                    type="text"
                    id="father_name"
                    value={formData.father_name}
                    onChange={handleChange}
                    placeholder="Enter father's name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mother_name" className="text-sm font-medium">Mother's Name</Label>
                  <Input
                    type="text"
                    id="mother_name"
                    value={formData.mother_name}
                    onChange={handleChange}
                    placeholder="Enter mother's name"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="place_of_birth" className="text-sm font-medium">Place of Birth</Label>
                  <Input
                    type="text"
                    id="place_of_birth"
                    value={formData.place_of_birth}
                    onChange={handleChange}
                    placeholder="Enter place of birth"
                    className="h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-green-500" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                  <Input 
                    type="email" 
                    id="email" 
                    value={formData.email} 
                    onChange={handleChange} 
                    placeholder="patient@example.com"
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">Phone Number</Label>
                  <Input 
                    type="tel" 
                    id="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    placeholder="+1 (555) 123-4567"
                    className="h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Project & Site Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Building className="h-5 w-5 text-purple-500" />
                Project & Site Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ethnicity" className="text-sm font-medium">Ethnicity *</Label>
                  <Input id="ethnicity" value={formData.ethnicity} onChange={handleChange} placeholder="Enter ethnicity" className="h-10" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site" className="text-sm font-medium">Site *</Label>
                  <Input id="site" value={formData.site} onChange={handleChange} placeholder="Enter site" className="h-10" required />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                  <Label htmlFor="project" className="text-sm font-medium">Project</Label>
                  <Select value={formData.project} onValueChange={(value) => setFormData(prevData => ({ ...prevData, project: value }))}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map(p => (
                          <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="quarter_address" className="text-sm font-medium">Quarter (Address)</Label>
                  <Input id="quarter_address" value={formData.quarter_address} onChange={handleChange} placeholder="Enter quarter/address" className="h-10" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Medical & Consent Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <ClipboardCheck className="h-5 w-5 text-yellow-500" />
                Medical & Consent Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                <Label htmlFor="diagnosis" className="text-sm font-medium">Diagnosis</Label>
                <Input 
                  type="text" 
                  id="diagnosis" 
                  value={formData.diagnosis} 
                  onChange={handleChange} 
                  placeholder="Primary diagnosis"
                  className="h-10"
                />
              </div>

              {/* Medical Metrics */}
              <div className="pt-2">
                <h4 className="text-md font-semibold mb-2 text-gray-700">Medical Metrics</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight" className="text-sm font-medium">Weight (Kg)</Label>
                    <Input type="number" id="weight" value={formData.weight} onChange={handleChange} placeholder="e.g., 70.5" className="h-10" step="0.1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="height" className="text-sm font-medium">Height (cm)</Label>
                    <Input type="number" id="height" value={formData.height} onChange={handleChange} placeholder="e.g., 175" className="h-10" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="temperature" className="text-sm font-medium">Temperature (°C)</Label>
                    <Input type="number" id="temperature" value={formData.temperature} onChange={handleChange} placeholder="e.g., 37.5" className="h-10" step="0.1" />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="glycemia" className="text-sm font-medium">Glycemia</Label>
                    <Input type="number" id="glycemia" value={formData.glycemia} onChange={handleChange} placeholder="e.g., 5.5" className="h-10" step="0.1" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hemoglobin" className="text-sm font-medium">Hemoglobin</Label>
                    <Input type="number" id="hemoglobin" value={formData.hemoglobin} onChange={handleChange} placeholder="e.g., 14" className="h-10" step="0.1" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="treatment_type" className="text-sm font-medium">Treatment Type</Label>
                  <Input id="treatment_type" value={formData.treatment_type} onChange={handleChange} placeholder="Enter treatment type" className="h-10" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="malaria_type" className="text-sm font-medium">Malaria Type</Label>
                  <Input id="malaria_type" value={formData.malaria_type} onChange={handleChange} placeholder="Enter malaria type" className="h-10" />
                </div>
              </div>
               <div className="space-y-2">
                  <Label htmlFor="consent_date" className="text-sm font-medium">Consent Date</Label>
                  <DatePickerPopover
                    value={formData.consent_date}
                    onChange={(date) => handleDateChange('consent_date', date)}
                    placeholder="Select consent date"
                  />
                </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="consent_obtained" checked={formData.consent_obtained} onCheckedChange={(checked) => handleCheckboxChange('consent_obtained', !!checked)} />
                <label htmlFor="consent_obtained" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Consent Obtained
                </label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="patient_form_completed" checked={formData.patient_form_completed} onCheckedChange={(checked) => handleCheckboxChange('patient_form_completed', !!checked)} />
                <label htmlFor="patient_form_completed" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Patient Form Completed
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Sample Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Beaker className="h-5 w-5 text-cyan-500" />
                Sample Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="samples_slides" className="text-sm font-medium">Slides</Label>
                <Input type="number" id="samples_slides" value={formData.samples_slides} onChange={handleChange} placeholder="0" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="samples_serums" className="text-sm font-medium">Serums</Label>
                <Input type="number" id="samples_serums" value={formData.samples_serums} onChange={handleChange} placeholder="0" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="samples_dna" className="text-sm font-medium">DNA</Label>
                <Input type="number" id="samples_dna" value={formData.samples_dna} onChange={handleChange} placeholder="0" className="h-10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="samples_filter_paper" className="text-sm font-medium">Filter Paper</Label>
                <Input type="number" id="samples_filter_paper" value={formData.samples_filter_paper} onChange={handleChange} placeholder="0" className="h-10" />
              </div>
            </CardContent>
          </Card>

          <AlertDialogFooter className="gap-2 pt-6 border-t">
            <AlertDialogCancel onClick={onClose} className="px-6">
              Cancel
            </AlertDialogCancel>
            <Button type="submit" disabled={isSubmitting} className="px-6">
              {isSubmitting 
                ? (patientToEdit ? 'Updating Patient...' : 'Adding Patient...')
                : (patientToEdit ? 'Update Patient' : 'Add Patient')}
            </Button>
          </AlertDialogFooter>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default AddPatientDialog;
export { AddPatientDialog };
