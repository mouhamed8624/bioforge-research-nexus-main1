
import React, { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";

interface PatientFiltersProps {
  onApplyFilters: (filters: PatientFilters) => void;
  onResetFilters: () => void;
}

export interface PatientFilters {
  status: string[];
  ageRange: [number | null, number | null];
  consentObtained: boolean | null;
  diagnosisCodes: string[];
  dateRange: [Date | null, Date | null];
  gender: string | null;
  sampleTypes: string[];
  projects: string[];
  dataSensitivity: string | null;
}

export function PatientFilters({ onApplyFilters, onResetFilters }: PatientFiltersProps) {
  const [filters, setFilters] = useState<PatientFilters>({
    status: [],
    ageRange: [null, null],
    consentObtained: null,
    diagnosisCodes: [],
    dateRange: [null, null],
    gender: null,
    sampleTypes: [],
    projects: [],
    dataSensitivity: null,
  });

  const handleStatusChange = (status: string) => {
    setFilters(prev => {
      if (prev.status.includes(status)) {
        return { ...prev, status: prev.status.filter(s => s !== status) };
      } else {
        return { ...prev, status: [...prev.status, status] };
      }
    });
  };

  const handleSampleTypeChange = (sampleType: string) => {
    setFilters(prev => {
      if (prev.sampleTypes.includes(sampleType)) {
        return { ...prev, sampleTypes: prev.sampleTypes.filter(s => s !== sampleType) };
      } else {
        return { ...prev, sampleTypes: [...prev.sampleTypes, sampleType] };
      }
    });
  };

  const handleGenderChange = (value: string) => {
    setFilters(prev => ({
      ...prev,
      gender: value,
    }));
  };

  const handleDateRangeChange = (date: Date | undefined, index: 0 | 1) => {
    setFilters(prev => {
      const newRange = [...prev.dateRange] as [Date | null, Date | null];
      if (date) {
        newRange[index] = date;
      } else {
        newRange[index] = null;
      }
      return { ...prev, dateRange: newRange };
    });
  };

  const handleApplyFilters = () => {
    onApplyFilters(filters);
  };

  return (
    <div className="p-4 bg-background border-b">
      <h3 className="font-medium mb-3">Patient Filters</h3>
      
      <Accordion type="multiple" className="w-full">
        <AccordionItem value="status">
          <AccordionTrigger className="py-2">Status</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-2 gap-2">
              {["Active", "Inactive", "Completed", "Pending"].map(status => (
                <div key={status} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`status-${status}`} 
                    checked={filters.status.includes(status)}
                    onCheckedChange={() => handleStatusChange(status)}
                  />
                  <Label htmlFor={`status-${status}`}>{status}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="demographics">
          <AccordionTrigger className="py-2">Demographics</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label>Age Range</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Input 
                    type="number" 
                    placeholder="Min"
                    className="w-24" 
                    value={filters.ageRange[0] || ''} 
                    onChange={(e) => setFilters(prev => ({
                      ...prev, 
                      ageRange: [e.target.value ? Number(e.target.value) : null, prev.ageRange[1]]
                    }))} 
                  />
                  <span>to</span>
                  <Input 
                    type="number" 
                    placeholder="Max" 
                    className="w-24"
                    value={filters.ageRange[1] || ''} 
                    onChange={(e) => setFilters(prev => ({
                      ...prev, 
                      ageRange: [prev.ageRange[0], e.target.value ? Number(e.target.value) : null]
                    }))} 
                  />
                </div>
              </div>
              
              <div>
                <Label>Gender</Label>
                <RadioGroup 
                  className="flex space-x-4 mt-2"
                  value={filters.gender || ''}
                  onValueChange={handleGenderChange}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Male" id="gender-male" />
                    <Label htmlFor="gender-male">Male</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Female" id="gender-female" />
                    <Label htmlFor="gender-female">Female</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Other" id="gender-other" />
                    <Label htmlFor="gender-other">Other</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        <AccordionItem value="samples">
          <AccordionTrigger className="py-2">Sample Information</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <Label>Sample Types</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {["Blood", "Serum", "Tissue", "DNA", "RNA", "Protein"].map(sampleType => (
                    <div key={sampleType} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`sample-${sampleType}`}
                        checked={filters.sampleTypes.includes(sampleType)}
                        onCheckedChange={() => handleSampleTypeChange(sampleType)}
                      />
                      <Label htmlFor={`sample-${sampleType}`}>{sampleType}</Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Collection Date Range</Label>
                <div className="flex items-center space-x-2 mt-2">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[150px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange[0] ? (
                          format(filters.dateRange[0], "PPP")
                        ) : (
                          <span>Start date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange[0] || undefined}
                        onSelect={(date) => handleDateRangeChange(date, 0)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <span>to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-[150px] justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateRange[1] ? (
                          format(filters.dateRange[1], "PPP")
                        ) : (
                          <span>End date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateRange[1] || undefined}
                        onSelect={(date) => handleDateRangeChange(date, 1)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="flex justify-end space-x-2 mt-4">
        <Button variant="outline" onClick={onResetFilters}>
          Reset
        </Button>
        <Button onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
}
