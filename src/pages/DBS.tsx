import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Droplets, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { AddDBSSampleDialog } from "@/components/dbs/AddDBSSampleDialog";
import { useDebounce } from "@/hooks/use-debounce";
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import ReactDOM from 'react-dom';

const DBS = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: dbsSamples,
    isLoading,
    error
  } = useQuery({
    queryKey: ["dbsSamples"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("dbs_samples")
        .select(`
          id,
          sample_id,
          collection_date,
          collection_location,
          spots_count,
          card_type,
          storage_location,
          status,
          analyzed_by,
          patients!inner(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const filteredSamples = useMemo(() => {
    if (!dbsSamples) return [];
    if (!debouncedSearchTerm) return dbsSamples;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return dbsSamples.filter(sample => 
      sample.sample_id.toLowerCase().includes(searchLower) || 
      sample.patients?.name?.toLowerCase().includes(searchLower) || 
      sample.card_type?.toLowerCase().includes(searchLower) ||
      sample.collection_location?.toLowerCase().includes(searchLower)
    );
  }, [dbsSamples, debouncedSearchTerm]);

  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case "collected":
        return "bg-blue-100 text-blue-700";
      case "analyzed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }, []);

  const printLabel = (sample: any) => {
    // Create a hidden container for QR and barcode
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    document.body.appendChild(container);
    // Render QRCode and Barcode
    const qrDiv = document.createElement('div');
    qrDiv.id = 'qr-print';
    container.appendChild(qrDiv);
    const barcodeDiv = document.createElement('div');
    barcodeDiv.id = 'barcode-print';
    container.appendChild(barcodeDiv);
    // Use ReactDOM to render
    import('react-dom').then(ReactDOM => {
      ReactDOM.render(
        <QRCode value={sample.sample_id || ' '} size={80} id="dbs-qr-code-print" />, qrDiv
      );
      ReactDOM.render(
        <Barcode value={sample.sample_id || ' '} width={1.2} height={40} fontSize={12} displayValue={false} id="dbs-barcode-print" />, barcodeDiv
      );
      setTimeout(() => {
        const qrElem = qrDiv.querySelector('svg');
        const qrSVG = qrElem ? new XMLSerializer().serializeToString(qrElem) : '';
        const barcodeElem = barcodeDiv.querySelector('canvas');
        let barcodeImg = '';
        if (barcodeElem) {
          barcodeImg = barcodeElem.toDataURL();
        }
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        printWindow.document.write(`
          <html><head><title>Print Sample Label</title></head><body style='font-family:sans-serif;text-align:center;padding:24px;'>
            <h2>DBS Sample Label</h2>
            <div style='margin:16px 0;'>${qrSVG ? `<img src='data:image/svg+xml;utf8,${encodeURIComponent(qrSVG)}' width='80' />` : ''}</div>
            <div style='margin:16px 0;'>${barcodeImg ? `<img src='${barcodeImg}' height='40' />` : ''}</div>
            <div style='font-size:18px;font-weight:bold;'>${sample.sample_id}</div>
            <div style='font-size:14px;'>Patient: ${sample.patients?.name || ''}</div>
            <div style='font-size:12px;margin-top:8px;'>Collection Date: ${sample.collection_date}</div>
            <script>window.print();window.close();</script>
          </body></html>
        `);
        setTimeout(() => document.body.removeChild(container), 1000);
      }, 100);
    });
  };

  if (error) {
    return (
      <MainLayout>
        <PageContainer>
          <div className="text-center py-8">
            <p className="text-red-600">Error loading DBS samples. Please refresh the page.</p>
          </div>
        </PageContainer>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Droplets className="h-8 w-8 text-red-600" />
              <div>
                <h1 className="text-3xl font-bold">Dry Blood Spot (DBS)</h1>
                <p className="text-muted-foreground">Manage DBS sample collection and analysis</p>
              </div>
            </div>
            <AddDBSSampleDialog />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>DBS Sample Inventory</CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search DBS samples..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-64" 
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse flex space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Sample ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Collection Date</TableHead>
                        <TableHead>Collection Location</TableHead>
                        <TableHead>Spots Count</TableHead>
                        <TableHead>Card Type</TableHead>
                        <TableHead>International Norms</TableHead>
                        <TableHead>Storage Location</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Analyzed By</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSamples?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={10} className="text-center py-8">
                            {debouncedSearchTerm ? "No matching DBS samples found" : "No DBS samples found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSamples?.map(sample => (
                          <TableRow key={sample.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                              {sample.sample_id}
                              <button onClick={() => printLabel(sample)} title="Print Label">
                                <Printer className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                              </button>
                              <div style={{ display: 'none' }}>
                                <QRCode value={sample.sample_id || ' '} size={80} id={`dbs-qr-code-print-${sample.id}`} />
                                <Barcode value={sample.sample_id || ' '} width={1.2} height={40} fontSize={12} displayValue={false} id={`dbs-barcode-print-${sample.id}`} />
                              </div>
                            </TableCell>
                            <TableCell>{sample.patients?.name || "Unknown"}</TableCell>
                            <TableCell>{format(new Date(sample.collection_date), 'MMM d, yyyy')}</TableCell>
                            <TableCell>{sample.collection_location || "Not specified"}</TableCell>
                            <TableCell>{sample.spots_count || 5}</TableCell>
                            <TableCell>{sample.card_type || "Standard"}</TableCell>
                            <TableCell className="font-medium">Not specified</TableCell>
                            <TableCell>{sample.storage_location || "Not specified"}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(sample.status || "collected")}>
                                {sample.status || "collected"}
                              </Badge>
                            </TableCell>
                            <TableCell>{sample.analyzed_by || "N/A"}</TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </MainLayout>
  );
};

export default DBS;
