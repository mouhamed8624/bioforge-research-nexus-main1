import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { supabase } from "@/integrations/supabase/client";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";
import { 
  Database, 
  BarChart2, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  ArrowDownWideNarrow, 
  Lightbulb, 
  RefreshCw,
  FileText,
  MessageSquare,
  Search,
  PieChart as PieIcon,
  Download,
  Share2
} from "lucide-react";

// Empty state data
const emptyChartData = [
  { month: 'Jan', value: 0 },
  { month: 'Feb', value: 0 },
  { month: 'Mar', value: 0 },
  { month: 'Apr', value: 0 },
  { month: 'May', value: 0 }
];

const emptyPieData = [
  { name: 'No Data', value: 1, color: '#e2e8f0' }
];

export function DataAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState("visualization");
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalysisRunning, setIsAnalysisRunning] = useState<Record<string, boolean>>({
    sentiment: false,
    topic: false,
    report: false
  });
  const [insights, setInsights] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState<Array<{id: string, text: string, author: string, timestamp: Date}>>([]);
  const [chartData, setChartData] = useState(emptyChartData);
  const [pieData, setPieData] = useState(emptyPieData);
  const { toast } = useToast();

  // Effect for real-time updates from Supabase
  useEffect(() => {
    // Subscribe to research_data table changes
    const channel = supabase
      .channel('research-data-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public', 
          table: 'projects'
        },
        (payload) => {
          console.log('New project added:', payload);
          toast({
            title: "New Data Available",
            description: "A new project has been added to the database."
          });
          handleRefresh();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'projects'
        },
        (payload) => {
          console.log('Project updated:', payload);
          toast({
            title: "Data Updated",
            description: "Project data has been updated."
          });
          handleRefresh();
        }
      )
      .subscribe();

    // Fetch initial comments
    fetchComments();

    // Cleanup function
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Fetch comments from Supabase
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('research_comments')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching comments:", error);
        return;
      }

      if (data) {
        setComments(data.map(comment => ({
          id: comment.id,
          text: comment.content,
          author: comment.author_name,
          timestamp: new Date(comment.created_at)
        })));
      }
    } catch (error) {
      console.error("Error in fetchComments:", error);
    }
  };

  // Add a new comment
  const addComment = async () => {
    if (!comment.trim()) return;

    try {
      const { data, error } = await supabase
        .from('research_comments')
        .insert([
          {
            content: comment,
            author_name: 'Current User', // Replace with actual username when auth is implemented
            dataset_id: null // Can link to specific dataset later
          }
        ]);

      if (error) {
        console.error("Error adding comment:", error);
        toast({
          title: "Comment Error",
          description: "Failed to add your comment.",
          variant: "destructive"
        });
        return;
      }

      setComment("");
      fetchComments(); // Refresh comments
      
      toast({
        title: "Comment Added",
        description: "Your comment has been added to the discussion."
      });
    } catch (error) {
      console.error("Error in addComment:", error);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    
    // Simulating data fetching with sample data for now
    setTimeout(() => {
      const newChartData = [
        { month: 'Jan', value: Math.floor(Math.random() * 100) },
        { month: 'Feb', value: Math.floor(Math.random() * 100) },
        { month: 'Mar', value: Math.floor(Math.random() * 100) },
        { month: 'Apr', value: Math.floor(Math.random() * 100) },
        { month: 'May', value: Math.floor(Math.random() * 100) }
      ];
      
      const newPieData = [
        { name: 'Category A', value: 30, color: '#8a61ee' },
        { name: 'Category B', value: 45, color: '#12db93' },
        { name: 'Category C', value: 25, color: '#0c8de5' }
      ];
      
      setChartData(newChartData);
      setPieData(newPieData);
      setIsLoading(false);
      
      toast({
        title: "Analytics Refreshed",
        description: "Data analysis has been updated with the latest information"
      });
    }, 1500);
  };

  const runSentimentAnalysis = () => {
    setIsAnalysisRunning(prev => ({ ...prev, sentiment: true }));
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      toast({
        title: "Sentiment Analysis Complete",
        description: "Text content has been analyzed for sentiment patterns across research data."
      });
      
      // Update insights with a new sentiment insight
      const newInsight = "Sentiment analysis detected positive correlations between patient outcomes and experimental drug treatments in datasets from Q1 2025";
      setInsights(prev => [newInsight, ...prev]);
      
      setIsAnalysisRunning(prev => ({ ...prev, sentiment: false }));
    }, 2000);
  };

  const runTopicModeling = () => {
    setIsAnalysisRunning(prev => ({ ...prev, topic: true }));
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      toast({
        title: "Topic Modeling Complete",
        description: "Key topics have been identified across research data documents."
      });
      
      // Update insights with a new topic modeling insight
      const newInsight = "Topic modeling identified three main research clusters: gene therapy applications, biomarker discovery, and clinical outcome predictions";
      setInsights(prev => [newInsight, ...prev]);
      
      setIsAnalysisRunning(prev => ({ ...prev, topic: false }));
    }, 2500);
  };

  const generateReport = () => {
    setIsAnalysisRunning(prev => ({ ...prev, report: true }));
    
    // Simulate API call with setTimeout
    setTimeout(() => {
      toast({
        title: "Report Generated",
        description: "Comprehensive analysis report has been created and is ready for download."
      });
      
      // In a real app, you'd trigger a download or open a preview here
      
      setIsAnalysisRunning(prev => ({ ...prev, report: false }));
    }, 3000);
  };

  // Export functions for different formats
  const exportToCSV = () => {
    const worksheet = XLSX.utils.json_to_sheet(chartData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "ChartData");
    XLSX.writeFile(workbook, "chart-data.xlsx");
    
    toast({
      title: "Export Complete",
      description: "Data has been exported to Excel format."
    });
  };

  const exportToPDF = async () => {
    try {
      toast({
        title: "Preparing PDF",
        description: "Creating PDF export of current visualization..."
      });
      
      const chartElement = document.getElementById('visualization-charts');
      if (!chartElement) {
        toast({
          title: "Export Failed",
          description: "Could not find chart element to export.",
          variant: "destructive"
        });
        return;
      }
      
      const canvas = await html2canvas(chartElement);
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('landscape');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('chart-data.pdf');
      
      toast({
        title: "Export Complete",
        description: "Data visualization has been exported to PDF format."
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast({
        title: "Export Failed",
        description: "An error occurred while creating the PDF.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl flex items-center gap-2">
            <Database className="h-5 w-5 text-cigass-400" />
            Data Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Advanced visualization and analysis of research data
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            disabled={isLoading}
            onClick={handleRefresh}
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={exportToCSV}
          >
            <Download className="h-3.5 w-3.5" />
            Export Excel
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1"
            onClick={exportToPDF}
          >
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid grid-cols-3">
            <TabsTrigger value="visualization" className="flex items-center gap-1">
              <BarChart2 className="h-3.5 w-3.5" /> 
              Visualization
            </TabsTrigger>
            <TabsTrigger value="statistics" className="flex items-center gap-1">
              <ArrowDownWideNarrow className="h-3.5 w-3.5" /> 
              Statistics
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-1">
              <Lightbulb className="h-3.5 w-3.5" /> 
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="visualization" className="space-y-4">
            <div id="visualization-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chart 1 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex justify-between items-center">
                    <span>Genomic Data Processed</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {chartData === emptyChartData ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <BarChart2 className="h-16 w-16 mx-auto mb-2 opacity-20" />
                        <p>No data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="value" fill="#8a61ee" name="Samples Processed" />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Chart 2 */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex justify-between items-center">
                    <span>Data Type Distribution</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {pieData === emptyPieData ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <PieIcon className="h-16 w-16 mx-auto mb-2 opacity-20" />
                        <p>No data types available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            fill="#8884d8"
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Chart 3 */}
              <Card className="lg:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex justify-between items-center">
                    <span>Repository Growth Trend</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px]">
                    {chartData === emptyChartData ? (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        <LineChartIcon className="h-16 w-16 mx-auto mb-2 opacity-20" />
                        <p>No growth data available</p>
                      </div>
                    ) : (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                          <defs>
                            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8a61ee" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8a61ee" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Area type="monotone" dataKey="value" stroke="#8a61ee" fillOpacity={1} fill="url(#colorValue)" name="Growth" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => runAnalysis("Correlation")}>
                Run Correlation
              </Button>
              <Button variant="outline" onClick={() => runAnalysis("Time Series")}>
                Run Time Series
              </Button>
              <Button className="bg-gradient-to-r from-cigass-500 to-cigass-600 hover:from-cigass-600 hover:to-cigass-700">
                Export Charts
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Statistical Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Total Records</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <div className="text-xs text-muted-foreground">No records yet</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Data Quality Score</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <div className="text-xs text-muted-foreground">No data to evaluate</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Most Common Format</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <div className="text-xs text-muted-foreground">No formats yet</div>
                      </CardContent>
                    </Card>
                    
                    <Card className="bg-muted/50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-xs font-medium">Avg. Dataset Size</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">-</div>
                        <div className="text-xs text-muted-foreground">No datasets yet</div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-md border border-border">
                      <h3 className="text-sm font-medium mb-2">Descriptive Statistics</h3>
                      <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                        <p className="text-center">No data available for statistical analysis</p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-md border border-border">
                      <h3 className="text-sm font-medium mb-2">Inferential Statistics</h3>
                      <div className="flex items-center justify-center h-[150px] text-muted-foreground">
                        <p className="text-center">No data available for statistical testing</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => runAnalysis("Regression")}>
                    Run Regression
                  </Button>
                  <Button variant="outline" onClick={() => runAnalysis("Cluster")}>
                    Run Clustering
                  </Button>
                  <Button className="bg-gradient-to-r from-cigass-500 to-cigass-600 hover:from-cigass-600 hover:to-cigass-700">
                    Export Statistics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI-Powered Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-md border border-border">
                    <h3 className="text-sm font-medium mb-2 flex items-center">
                      <Lightbulb className="h-4 w-4 text-amber-400 mr-2" /> 
                      Key Insights
                    </h3>
                    {insights.length > 0 ? (
                      <ul className="space-y-2">
                        {insights.map((insight, index) => (
                          <li key={index} className="p-2 rounded-md bg-background border border-border flex">
                            <div className="mr-2 mt-0.5">
                              {index % 2 === 0 ? 
                                <Database className="h-4 w-4 text-cigass-400" /> : 
                                <LineChartIcon className="h-4 w-4 text-cigass-400" />
                              }
                            </div>
                            <div className="text-sm">{insight}</div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div className="p-6 text-center text-muted-foreground">
                        <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-20" />
                        <p>No insights available yet</p>
                        <p className="text-sm">Run analysis on your data to generate AI insights</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-md border border-border">
                      <h3 className="text-sm font-medium mb-2">Predictive Analysis</h3>
                      <div className="text-center text-muted-foreground p-6">
                        <p>No data available for predictions</p>
                        <p className="text-sm">Add datasets to enable predictive analytics</p>
                      </div>
                    </div>
                    
                    <div className="p-4 rounded-md border border-border">
                      <h3 className="text-sm font-medium mb-2">Semantic Analysis</h3>
                      <div className="text-center text-muted-foreground p-6">
                        <p>No content available for semantic analysis</p>
                        <p className="text-sm">Upload text data to discover research themes</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-md border border-border/50">
                    <h3 className="text-sm font-medium mb-2">Research Recommendations</h3>
                    <div className="text-center text-muted-foreground p-6">
                      <p>No recommendations available yet</p>
                      <p className="text-sm">Upload research data to receive personalized recommendations</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    onClick={runSentimentAnalysis}
                    disabled={isAnalysisRunning.sentiment}
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    {isAnalysisRunning.sentiment ? (
                      <>
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-1"></span>
                        Processing...
                      </>
                    ) : "Run Sentiment Analysis"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={runTopicModeling}
                    disabled={isAnalysisRunning.topic}
                    className="flex items-center gap-1"
                  >
                    <Search className="h-3.5 w-3.5" />
                    {isAnalysisRunning.topic ? (
                      <>
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-1"></span>
                        Processing...
                      </>
                    ) : "Run Topic Modeling"}
                  </Button>
                  <Button 
                    className="bg-gradient-to-r from-cigass-500 to-cigass-600 hover:from-cigass-600 hover:to-cigass-700 flex items-center gap-1"
                    onClick={generateReport}
                    disabled={isAnalysisRunning.report}
                  >
                    <FileText className="h-3.5 w-3.5" />
                    {isAnalysisRunning.report ? (
                      <>
                        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent text-white mr-1"></span>
                        Generating...
                      </>
                    ) : "Generate Report"}
                  </Button>
                </div>

                {/* Add new real-time comments section */}
                <div className="mt-8 space-y-4">
                  <h3 className="text-sm font-medium">Research Discussion</h3>
                  <div className="bg-muted/30 p-4 rounded-md border border-border/50">
                    <div className="mb-4 space-y-4 max-h-[300px] overflow-y-auto">
                      {comments.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground">
                          <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
                          <p>No comments yet</p>
                          <p className="text-sm">Start the discussion by adding a comment below</p>
                        </div>
                      ) : (
                        comments.map((item) => (
                          <div key={item.id} className="p-3 rounded-md bg-background border border-border/50">
                            <div className="flex justify-between items-start gap-2">
                              <div className="font-medium text-sm">{item.author}</div>
                              <div className="text-xs text-muted-foreground">
                                {item.timestamp.toLocaleString()}
                              </div>
                            </div>
                            <p className="mt-1 text-sm">{item.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                    
                    <div className="mt-4 flex gap-2">
                      <textarea
                        className="flex-1 rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Add your thoughts on this research data..."
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      />
                    </div>
                    <div className="mt-2 flex justify-end">
                      <Button
                        onClick={addComment}
                        disabled={!comment.trim()}
                        className="bg-gradient-to-r from-purple-500 to-cigass-500 hover:from-purple-600 hover:to-cigass-600"
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Post Comment
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  function runAnalysis(type: string) {
    toast({
      title: `${type} Analysis Initiated`,
      description: "Processing data. Results will be available soon."
    });
  }
}
