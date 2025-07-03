import { useState, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, CreditCard, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { AddPlaquetteDialog } from "@/components/plaquettes/AddPlaquetteDialog";
import { useDebounce } from "@/hooks/use-debounce";
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';
import ReactDOM from 'react-dom';

const Plaquettes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const {
    data: plaquettes,
    isLoading,
    error
  } = useQuery({
    queryKey: ["plaquettes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("plaquettes")
        .select(`
          *,
          patients(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const filteredPlaquettes = useMemo(() => {
    if (!plaquettes) return [];
    if (!debouncedSearchTerm) return plaquettes;
    
    const searchLower = debouncedSearchTerm.toLowerCase();
    return plaquettes.filter(plaquette => 
      plaquette.plaquette_id?.toLowerCase().includes(searchLower) || 
      plaquette.patients?.name?.toLowerCase().includes(searchLower) || 
      plaquette.plaquette_type?.toLowerCase().includes(searchLower) ||
      plaquette.collection_location?.toLowerCase().includes(searchLower) ||
      plaquette.collection_locality?.toLowerCase().includes(searchLower) ||
      plaquette.collected_by?.toLowerCase().includes(searchLower) ||
      plaquette.international_norms?.toLowerCase().includes(searchLower)
    );
  }, [plaquettes, debouncedSearchTerm]);

  const getStatusColor = useMemo(() => (status: string) => {
    switch (status) {
      case "collected":
        return "bg-blue-100 text-blue-700";
      case "processed":
        return "bg-green-100 text-green-700";
      case "pending":
        return "bg-yellow-100 text-yellow-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  }, []);

  const formatTemperature = (temp: number) => {
    return temp ? `${temp}°C` : "N/A";
  };

  const printLabel = (plaquette: any) => {
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
        <QRCode value={plaquette.plaquette_id || ' '} size={80} id={`plaq-qr-code-print-${plaquette.id}`} />, qrDiv
      );
      ReactDOM.render(
        <Barcode value={plaquette.plaquette_id || ' '} width={1.2} height={40} fontSize={12} displayValue={false} id={`plaq-barcode-print-${plaquette.id}`} />, barcodeDiv
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
          <html><head><title>Print Plaquette Label</title></head><body style='font-family:sans-serif;text-align:center;padding:24px;'>
            <h2>Plaquette Sample Label</h2>
            <div style='margin:16px 0;'>${qrSVG ? `<img src='data:image/svg+xml;utf8,${encodeURIComponent(qrSVG)}' width='80' />` : ''}</div>
            <div style='margin:16px 0;'>${barcodeImg ? `<img src='${barcodeImg}' height='40' />` : ''}</div>
            <div style='font-size:18px;font-weight:bold;'>${plaquette.plaquette_id}</div>
            <div style='font-size:14px;'>Patient: ${plaquette.patients?.name || ''}</div>
            <div style='font-size:12px;margin-top:8px;'>Collection Date: ${plaquette.collection_date}</div>
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
            <p className="text-red-600">Error loading plaquettes. Please refresh the page.</p>
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
              <CreditCard className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-3xl font-bold">Plaquettes</h1>
                <p className="text-muted-foreground">Manage plaquette collection and processing</p>
              </div>
            </div>
            <AddPlaquetteDialog />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Plaquette Inventory</CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search plaquettes..." 
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
                        <TableHead>Plaquette ID</TableHead>
                        <TableHead>Patient</TableHead>
                        <TableHead>Collection Date</TableHead>
                        <TableHead>Collection Time</TableHead>
                        <TableHead>Collection Year</TableHead>
                        <TableHead>Collection Location</TableHead>
                        <TableHead>Collection Locality</TableHead>
                        <TableHead>Plaquette Type</TableHead>
                        <TableHead>International Norms</TableHead>
                        <TableHead>Spots Count</TableHead>
                        <TableHead>Temperature</TableHead>
                        <TableHead>Storage Container</TableHead>
                        <TableHead>Storage Room</TableHead>
                        <TableHead>Storage Location</TableHead>
                        <TableHead>Storage Date</TableHead>
                        <TableHead>Expiration Date</TableHead>
                        <TableHead>Quality Control</TableHead>
                        <TableHead>Collected By</TableHead>
                        <TableHead>Processed By</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlaquettes?.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={21} className="text-center py-8">
                            {debouncedSearchTerm ? "No matching plaquettes found" : "No plaquettes found"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlaquettes?.map(plaquette => (
                          <TableRow key={plaquette.id}>
                            <TableCell className="font-medium flex items-center gap-2">
                              {plaquette.plaquette_id}
                              <button onClick={() => printLabel(plaquette)} title="Print Label">
                                <Printer className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                              </button>
                              <div style={{ display: 'none' }}>
                                <QRCode value={plaquette.plaquette_id || ' '} size={80} id={`plaq-qr-code-print-${plaquette.id}`} />
                                <Barcode value={plaquette.plaquette_id || ' '} width={1.2} height={40} fontSize={12} displayValue={false} id={`plaq-barcode-print-${plaquette.id}`} />
                              </div>
                            </TableCell>
                            <TableCell>{plaquette.patients?.name || "Unknown"}</TableCell>
                            <TableCell>
                              {plaquette.collection_date ? format(new Date(plaquette.collection_date), 'MMM d, yyyy') : "N/A"}
                            </TableCell>
                            <TableCell>{plaquette.collection_time || "N/A"}</TableCell>
                            <TableCell>{plaquette.collection_year || "N/A"}</TableCell>
                            <TableCell>{plaquette.collection_location || "N/A"}</TableCell>
                            <TableCell>{plaquette.collection_locality || "N/A"}</TableCell>
                            <TableCell>{plaquette.plaquette_type || "N/A"}</TableCell>
                            <TableCell className="font-medium">{plaquette.international_norms || "N/A"}</TableCell>
                            <TableCell>{plaquette.spots_count || "N/A"}</TableCell>
                            <TableCell>{formatTemperature(plaquette.temperature)}</TableCell>
                            <TableCell>{plaquette.storage_container || "N/A"}</TableCell>
                            <TableCell>{plaquette.storage_room || "N/A"}</TableCell>
                            <TableCell>{plaquette.storage_location || "N/A"}</TableCell>
                            <TableCell>
                              {plaquette.storage_date ? format(new Date(plaquette.storage_date), 'MMM d, yyyy') : "N/A"}
                            </TableCell>
                            <TableCell>
                              {plaquette.expiration_date ? format(new Date(plaquette.expiration_date), 'MMM d, yyyy') : "N/A"}
                            </TableCell>
                            <TableCell>
                              <Badge variant={plaquette.quality_control ? "default" : "secondary"}>
                                {plaquette.quality_control ? "Passed" : "Pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>{plaquette.collected_by || "N/A"}</TableCell>
                            <TableCell>{plaquette.processed_by || "N/A"}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(plaquette.status || "collected")}>
                                {plaquette.status || "collected"}
                              </Badge>
                            </TableCell>
                            <TableCell className="max-w-xs truncate" title={plaquette.notes}>
                              {plaquette.notes || "N/A"}
                            </TableCell>
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

export default Plaquettes; 