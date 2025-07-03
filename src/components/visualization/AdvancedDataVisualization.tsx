import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  AreaChart,
  Area
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import * as XLSX from "xlsx";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import {
  BarChart2,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Download,
  RefreshCw,
  FileText,
  ChartColumnBig,
  ChartPie,
  ChartLine,
  Users
} from "lucide-react";

export function AdvancedDataVisualization() {
  const [activeTab, setActiveTab] = useState("bar");
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState({
    barData: [],
    lineData: [],
    pieData: [],
    malariaData: [],
    ethnicityData: []
  });
  const chartRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // Fetch data on component mount and set up real-time subscriptions
  useEffect(() => {
    fetchData();

    // Subscribe to data changes that would affect visualizations
    const channel = supabase
      .channel('visualization-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patients'
        },
        (payload) => {
          console.log('Patient data changed:', payload);
          toast({
            title: "Data Updated",
            description: "Patient visualization data has been updated in real-time"
          });
          fetchData();
        }
      )
      .subscribe();

    // Clean up subscription
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Function to fetch data from different tables
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch patients demographic data for bar chart (age distribution)
      const { data: patientsAgeData, error: patientsAgeError } = await supabase
        .from('patients')
        .select('age, gender')
        .not('age', 'is', null)
        .order('age', { ascending: true });
      
      if (patientsAgeError) throw patientsAgeError;

      // Fetch diagnosis/condition data for pie chart
      const { data: patientsDiagnosisData, error: diagnosisError } = await supabase
        .from('patients')
        .select('diagnosis')
        .not('diagnosis', 'is', null);
      
      if (diagnosisError) throw diagnosisError;

      // Fetch ethnicity data for new ethnicity chart
      const { data: patientsEthnicityData, error: ethnicityError } = await supabase
        .from('patients')
        .select('ethnicity')
        .not('ethnicity', 'is', null);
      
      if (ethnicityError) throw ethnicityError;

      // Fetch temperature and parasitaemia data for line chart (monthly trends)
      const { data: vitalsData, error: vitalsError } = await supabase
        .from('patients')
        .select('last_visit, temperature, parasitaemia')
        .not('temperature', 'is', null)
        .not('parasitaemia', 'is', null)
        .order('last_visit', { ascending: true })
        .limit(20);
      
      if (vitalsError) throw vitalsError;

      // Prepare malaria type data
      const { data: malariaTypeData, error: malariaTypeError } = await supabase
        .from('patients')
        .select('malaria_type')
        .not('malaria_type', 'is', null);
        
      if (malariaTypeError) throw malariaTypeError;

      // Transform data for bar chart (age distribution by gender)
      const ageGroups = ['0-10', '11-20', '21-30', '31-40', '41-50', '51-60', '61+'];
      const ageDistribution = ageGroups.map(group => {
        const range = group.split('-');
        const min = parseInt(range[0]);
        const max = range.length > 1 ? parseInt(range[1]) : Number.MAX_SAFE_INTEGER;
        
        const maleCount = patientsAgeData.filter(p => 
          p.age >= min && p.age <= max && p.gender?.toLowerCase() === 'male'
        ).length;
        
        const femaleCount = patientsAgeData.filter(p => 
          p.age >= min && p.age <= max && p.gender?.toLowerCase() === 'female'
        ).length;
        
        const otherCount = patientsAgeData.filter(p => 
          p.age >= min && p.age <= max && 
          p.gender !== null && 
          p.gender?.toLowerCase() !== 'male' && 
          p.gender?.toLowerCase() !== 'female'
        ).length;

        return {
          name: group,
          male: maleCount,
          female: femaleCount,
          other: otherCount
        };
      });

      // Count occurrences of each diagnosis for pie chart
      const diagnosisCounts: Record<string, number> = patientsDiagnosisData.reduce((acc: Record<string, number>, patient) => {
        if (patient.diagnosis) {
          const diagnosis = patient.diagnosis.trim();
          acc[diagnosis] = (acc[diagnosis] || 0) + 1;
        }
        return acc;
      }, {});

      const transformedPieData = Object.entries(diagnosisCounts)
        .map(([diagnosis, count]) => ({
          name: diagnosis,
          value: count as number,
          color: getRandomColor()
        }))
        .filter(item => item.name !== "") // Filter out empty diagnoses
        .sort((a, b) => b.value - a.value) // Sort by frequency
        .slice(0, 7); // Take top 7 diagnoses

      // Transform ethnicity data for new ethnicity pie chart
      const ethnicityCounts: Record<string, number> = patientsEthnicityData.reduce((acc: Record<string, number>, patient) => {
        if (patient.ethnicity) {
          const ethnicity = patient.ethnicity.trim();
          acc[ethnicity] = (acc[ethnicity] || 0) + 1;
        }
        return acc;
      }, {});

      const transformedEthnicityData = Object.entries(ethnicityCounts)
        .map(([ethnicity, count]) => ({
          name: ethnicity,
          value: count as number,
          color: getRandomColor()
        }))
        .filter(item => item.name !== "") // Filter out empty ethnicities
        .sort((a, b) => b.value - a.value) // Sort by frequency
        .slice(0, 10); // Take top 10 ethnicities

      // Create temporal trends data for line chart
      const patientsByDate: Record<string, { temp: number[], para: number[] }> = {};
      
      vitalsData.forEach(patient => {
        if (patient.last_visit) {
          try {
            // Try to format the date consistently
            const date = new Date(patient.last_visit);
            const month = date.toLocaleString('default', { month: 'short' });
            const year = date.getFullYear();
            const dateKey = `${month} ${year}`;
            
            if (!patientsByDate[dateKey]) {
              patientsByDate[dateKey] = {
                temp: [],
                para: []
              };
            }
            
            if (patient.temperature) {
              patientsByDate[dateKey].temp.push(Number(patient.temperature));
            }
            
            if (patient.parasitaemia) {
              patientsByDate[dateKey].para.push(Number(patient.parasitaemia));
            }
          } catch (e) {
            console.error("Date parsing error:", e);
          }
        }
      });
      
      // Calculate averages for each month
      const transformedLineData = Object.entries(patientsByDate).map(([date, values]) => {
        const avgTemp = values.temp.length > 0 
          ? values.temp.reduce((sum, val) => sum + val, 0) / values.temp.length 
          : 0;
          
        const avgPara = values.para.length > 0 
          ? values.para.reduce((sum, val) => sum + val, 0) / values.para.length 
          : 0;
          
        return {
          name: date,
          "Avg Temperature": parseFloat(avgTemp.toFixed(1)),
          "Avg Parasitaemia": parseFloat(avgPara.toFixed(2))
        };
      }).sort((a, b) => {
        // Sort by date
        const dateA = new Date(a.name);
        const dateB = new Date(b.name);
        return dateA.getTime() - dateB.getTime();
      });

      // Transform malaria type data for pie chart
      const malariaTypeCounts: Record<string, number> = malariaTypeData.reduce((acc: Record<string, number>, patient) => {
        if (patient.malaria_type) {
          const malariaType = patient.malaria_type.trim();
          acc[malariaType] = (acc[malariaType] || 0) + 1;
        }
        return acc;
      }, {});

      const transformedMalariaData = Object.entries(malariaTypeCounts)
        .map(([malariaType, count]) => ({
          name: malariaType,
          value: count as number,
          color: getRandomColor()
        }))
        .filter(item => item.name !== "") // Filter out empty malaria types
        .sort((a, b) => b.value - a.value); // Sort by frequency

      setChartData({
        barData: ageDistribution,
        lineData: transformedLineData,
        pieData: transformedPieData,
        malariaData: transformedMalariaData,
        ethnicityData: transformedEthnicityData
      });

      setIsLoading(false);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch patient visualization data",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  };

  // Helper to generate random colors for missing color values
  const getRandomColor = () => {
    const colors = ['#8884d8', '#83a6ed', '#8dd1e1', '#82ca9d', '#ffc658', '#ff8042', '#a4de6c', '#d0ed57'];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const refreshData = () => {
    fetchData();
    toast({
      title: "Data Refreshed",
      description: "Patient visualization data has been updated with the latest information"
    });
  };

  // Export functions
  const exportToExcel = () => {
    let dataToExport;
    switch (activeTab) {
      case 'bar':
        dataToExport = chartData.barData;
        break;
      case 'line':
        dataToExport = chartData.lineData;
        break;
      case 'pie':
        dataToExport = chartData.pieData;
        break;
      case 'scatter':
        dataToExport = chartData.malariaData;
        break;
      case 'ethnicity':
        dataToExport = chartData.ethnicityData;
        break;
      default:
        dataToExport = chartData.barData;
    }

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PatientData");
    XLSX.writeFile(workbook, `patient-${activeTab}-chart-data.xlsx`);
    
    toast({
      title: "Export Successful",
      description: "Patient data has been exported to Excel format"
    });
  };

  const exportToPDF = async () => {
    if (!chartRef.current) return;

    try {
      toast({
        title: "Preparing PDF",
        description: "Creating PDF export of current visualization..."
      });
      
      const canvas = await html2canvas(chartRef.current);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('landscape');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${activeTab}-chart.pdf`);
      
      toast({
        title: "Export Complete",
        description: "Chart has been exported to PDF format"
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred while creating the PDF",
        variant: "destructive"
      });
    }
  };

  const exportToCSV = () => {
    let dataToExport;
    switch (activeTab) {
      case 'bar':
        dataToExport = chartData.barData;
        break;
      case 'line':
        dataToExport = chartData.lineData;
        break;
      case 'pie':
        dataToExport = chartData.pieData;
        break;
      case 'scatter':
        dataToExport = chartData.malariaData;
        break;
      case 'ethnicity':
        dataToExport = chartData.ethnicityData;
        break;
      default:
        dataToExport = chartData.barData;
    }

    // Convert to CSV
    const headers = Object.keys(dataToExport[0] || {}).join(',');
    const rows = dataToExport.map(obj => Object.values(obj).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${activeTab}-chart-data.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Export Successful",
      description: "Data has been exported to CSV format"
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl">Patient Data Visualization</CardTitle>
          <CardDescription>
            Explore patient demographics, clinical data, and health trends
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={refreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh Data
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={exportToExcel}
          >
            <Download className="h-3.5 w-3.5" />
            Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={exportToCSV}
          >
            <Download className="h-3.5 w-3.5" />
            CSV
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={exportToPDF}
          >
            <FileText className="h-3.5 w-3.5" />
            PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid grid-cols-5">
            <TabsTrigger value="bar" className="flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5" />
              Age Distribution
            </TabsTrigger>
            <TabsTrigger value="line" className="flex items-center gap-1">
              <ChartLine className="h-3.5 w-3.5" />
              Clinical Trends
            </TabsTrigger>
            <TabsTrigger value="pie" className="flex items-center gap-1">
              <ChartPie className="h-3.5 w-3.5" />
              Diagnoses
            </TabsTrigger>
            <TabsTrigger value="scatter" className="flex items-center gap-1">
              <ChartPie className="h-3.5 w-3.5" />
              Malaria Type
            </TabsTrigger>
            <TabsTrigger value="ethnicity" className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              Ethnicity
            </TabsTrigger>
          </TabsList>

          <div ref={chartRef} className="bg-white dark:bg-black p-4 rounded-md">
            <TabsContent value="bar">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.barData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="male" fill="#8884d8" name="Male Patients" />
                    <Bar dataKey="female" fill="#82ca9d" name="Female Patients" />
                    <Bar dataKey="other" fill="#ffc658" name="Other/Unspecified" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="line">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData.lineData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
                    <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                    <Tooltip />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="Avg Temperature" 
                      stroke="#8884d8"
                      activeDot={{ r: 8 }} 
                      name="Average Temperature (°C)" 
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="Avg Parasitaemia" 
                      stroke="#82ca9d" 
                      activeDot={{ r: 8 }}
                      name="Average Parasitaemia (%)" 
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="pie">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
            
            <TabsContent value="scatter">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.malariaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.malariaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="ethnicity">
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.ethnicityData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={140}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.ethnicityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} patients`, 'Count']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </CardContent>
    </Card>
  );
}
