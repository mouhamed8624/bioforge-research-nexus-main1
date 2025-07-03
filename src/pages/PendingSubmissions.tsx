
import { useState, useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface LabSubmission {
  id: string;
  test_name: string;
  value: number | null;
  units: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
  patient_id: string | null;
  approved_by: string | null;
  patientName?: string;
  test_id?: string;
  reference_range?: string;
  laboratory_type?: string;
}

const PendingSubmissions = () => {
  const [submissions, setSubmissions] = useState<LabSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      const { data: labResults, error } = await supabase
        .from('patient_lab_results')
        .select(`
          id,
          test_name,
          value,
          units,
          status,
          created_at,
          updated_at,
          patient_id,
          approved_by,
          patients (
            name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching lab submissions:', error);
        toast({
          title: "Error",
          description: "Failed to fetch lab submissions",
          variant: "destructive"
        });
        return;
      }

      const submissionsWithPatientNames: LabSubmission[] = (labResults || []).map(result => ({
        id: result.id,
        test_name: result.test_name,
        value: result.value,
        units: result.units,
        status: result.status,
        created_at: result.created_at,
        updated_at: result.updated_at,
        patient_id: result.patient_id,
        approved_by: result.approved_by,
        patientName: result.patients ? (result.patients as any).name : 'Unknown Patient',
        test_id: result.id, // Using the same ID as test_id for compatibility
        reference_range: 'Normal', // Default value
        laboratory_type: 'General' // Default value
      }));

      setSubmissions(submissionsWithPatientNames);
    } catch (error) {
      console.error('Error in fetchSubmissions:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSubmissionStatus = async (submissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('patient_lab_results')
        .update({ 
          status: newStatus,
          approved_by: newStatus === 'approved' ? 'Current User' : null
        })
        .eq('id', submissionId);

      if (error) {
        console.error('Error updating submission:', error);
        toast({
          title: "Error",
          description: "Failed to update submission status",
          variant: "destructive"
        });
        return;
      }

      // Update the local state
      setSubmissions(prev => prev.map(submission => {
        if (submission.id === submissionId) {
          const updatedSubmission: LabSubmission = {
            ...submission,
            status: newStatus,
            approved_by: newStatus === 'approved' ? 'Current User' : null,
            test_id: submission.test_id || submission.id,
            reference_range: submission.reference_range || 'Normal',
            laboratory_type: submission.laboratory_type || 'General'
          };
          return updatedSubmission;
        }
        return submission;
      }));

      toast({
        title: "Success",
        description: `Submission ${newStatus} successfully`,
      });
    } catch (error) {
      console.error('Error in updateSubmissionStatus:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const getStatusBadge = (status: string | null) => {
    const statusValue = status || 'pending';
    switch (statusValue) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <PageContainer
          title="Pending Submissions"
          subtitle="Review and approve laboratory test submissions"
        >
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer
        title="Pending Submissions"
        subtitle="Review and approve laboratory test submissions"
      >
        <Card>
          <CardHeader>
            <CardTitle>Laboratory Test Submissions</CardTitle>
            <CardDescription>
              Review and manage laboratory test results waiting for approval
            </CardDescription>
          </CardHeader>
          <CardContent>
            {submissions.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No pending submissions found.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Patient</TableHead>
                    <TableHead>Test Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((submission) => (
                    <TableRow key={submission.id}>
                      <TableCell className="font-medium">
                        {submission.patientName}
                      </TableCell>
                      <TableCell>{submission.test_name}</TableCell>
                      <TableCell>{submission.value || 'N/A'}</TableCell>
                      <TableCell>{submission.units || 'N/A'}</TableCell>
                      <TableCell>{getStatusBadge(submission.status)}</TableCell>
                      <TableCell>
                        {new Date(submission.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="w-4 h-4 mr-1" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Submission Details</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="font-semibold">Patient:</label>
                                  <p>{submission.patientName}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Test:</label>
                                  <p>{submission.test_name}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Value:</label>
                                  <p>{submission.value || 'N/A'} {submission.units || ''}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Status:</label>
                                  <p>{getStatusBadge(submission.status)}</p>
                                </div>
                                <div>
                                  <label className="font-semibold">Submitted:</label>
                                  <p>{new Date(submission.created_at).toLocaleString()}</p>
                                </div>
                                {submission.approved_by && (
                                  <div>
                                    <label className="font-semibold">Approved by:</label>
                                    <p>{submission.approved_by}</p>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                          
                          {submission.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                onClick={() => updateSubmissionStatus(submission.id, 'approved')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive"
                                onClick={() => updateSubmissionStatus(submission.id, 'rejected')}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </MainLayout>
  );
};

export default PendingSubmissions;
