
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { AdvancedDataVisualization } from "@/components/visualization/AdvancedDataVisualization";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Calculate age from date of birth string
 * @param dateOfBirth - Date string in any valid format
 * @returns Calculated age as a number or null if invalid date
 */
export const calculateAge = (dateOfBirth: string | null): number | null => {
  if (!dateOfBirth) return null;
  
  // Try parsing the date (could be in various formats)
  const dob = new Date(dateOfBirth);
  
  // Check if date is valid
  if (isNaN(dob.getTime())) return null;
  
  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  
  // Adjust age if birthday hasn't occurred yet this year
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  
  return age;
};

const DataVisualization = () => {
  useEffect(() => {
    // Update any patients with null age but valid date_of_birth
    const updatePatientAges = async () => {
      try {
        const { data: patients, error } = await supabase
          .from('patients')
          .select('id, date_of_birth, age')
          .is('age', null)
          .not('date_of_birth', 'is', null);
        
        if (error) throw error;
        
        // For each patient with null age but valid DOB, calculate and update age
        for (const patient of patients || []) {
          const calculatedAge = calculateAge(patient.date_of_birth);
          
          if (calculatedAge !== null) {
            const { error: updateError } = await supabase
              .from('patients')
              .update({ age: calculatedAge })
              .eq('id', patient.id);
            
            if (updateError) {
              console.error('Failed to update patient age:', updateError);
            }
          }
        }
      } catch (error) {
        console.error('Error updating patient ages:', error);
      }
    };
    
    updatePatientAges();
  }, []);
  
  return (
    <MainLayout>
      <PageContainer
        title="Patient Data Visualization"
        subtitle="Interactive patient charts and research collaboration tools"
      >
        <AdvancedDataVisualization />
      </PageContainer>
    </MainLayout>
  );
};

export default DataVisualization;
