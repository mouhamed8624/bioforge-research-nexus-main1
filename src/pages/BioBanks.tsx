import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Beaker, Printer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { AddBioSampleDialog } from "@/components/bio-banks/AddBioSampleDialog";
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

const BioBanks = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: bioBanks, isLoading } = useQuery({
    queryKey: ["bioBanks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bio_banks")
        .select(`
          *,
          patients(name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  const filteredBioBanks = bioBanks?.filter(bank =>
    bank.sample_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.sample_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.sample_category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.collection_locality?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.collected_by?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bank.patients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case "stored": return "bg-green-100 text-green-700";
      case "used": return "bg-gray-100 text-gray-700";
      case "disposed": return "bg-red-100 text-red-700";
      default: return "bg-blue-100 text-blue-700";
    }
  };

  const formatTemperature = (temp: number) => {
    return temp ? `${temp}°C` : "N/A";
  };

  const printLabel = (bank: any) => {
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
        <QRCode value={bank.sample_id || ' '} size={80} id="bio-qr-code-print" />, qrDiv
      );
      ReactDOM.render(
        <Barcode value={bank.sample_id || ' '} width={1.2} height={40} fontSize={12} displayValue={false} id="bio-barcode-print" />, barcodeDiv
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
            <h2>BioBank Sample Label</h2>
            <div style='margin:16px 0;'>${qrSVG ? `<img src='data:image/svg+xml;utf8,${encodeURIComponent(qrSVG)}' width='80' />` : ''}</div>
            <div style='margin:16px 0;'>${barcodeImg ? `<img src='${barcodeImg}' height='40' />` : ''}</div>
            <div style='font-size:18px;font-weight:bold;'>${bank.sample_id}</div>
            <div style='font-size:14px;'>Patient: ${bank.patients?.name || ''}</div>
            <div style='font-size:12px;margin-top:8px;'>Collection Date: ${bank.collection_date}</div>
            <script>window.print();window.close();</script>
          </body></html>
        `);
        setTimeout(() => document.body.removeChild(container), 1000);
      }, 100);
    });
  };

  return (
    <MainLayout>
      <PageContainer>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Beaker className="h-8 w-8 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold">Bio Banks</h1>
                <p className="text-muted-foreground">Manage biological sample storage</p>
              </div>
            </div>
            <AddBioSampleDialog />
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Sample Inventory</CardTitle>
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search samples..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sample ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Sample Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Collection Date</TableHead>
                      <TableHead>Collection Year</TableHead>
                      <TableHead>Collection Locality</TableHead>
                      <TableHead>Temperature</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Storage Container</TableHead>
                      <TableHead>Storage Room</TableHead>
                      <TableHead>Refrigerator</TableHead>
                      <TableHead>Drawer</TableHead>
                      <TableHead>Storage Label</TableHead>
                      <TableHead>Cold Sample</TableHead>
                      <TableHead>Is Reagent</TableHead>
                      <TableHead>Reagent For</TableHead>
                      <TableHead>Storage Date</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Collected By</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Notes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={22} className="text-center py-8">
                          Loading samples...
                        </TableCell>
                      </TableRow>
                    ) : filteredBioBanks?.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={22} className="text-center py-8">
                          No samples found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBioBanks?.map((bank) => (
                        <TableRow key={bank.id}>
                          <TableCell className="font-medium flex items-center gap-2">
                            {bank.sample_id}
                            <button onClick={() => printLabel(bank)} title="Print Label">
                              <Printer className="h-4 w-4 text-gray-500 hover:text-blue-600" />
                            </button>
                          </TableCell>
                          <TableCell>{bank.patients?.name || "Unknown"}</TableCell>
                          <TableCell>{bank.sample_type}</TableCell>
                          <TableCell>{bank.sample_category || "N/A"}</TableCell>
                          <TableCell>
                            {bank.collection_date ? format(new Date(bank.collection_date), 'MMM d, yyyy') : "N/A"}
                          </TableCell>
                          <TableCell>{bank.collection_year || "N/A"}</TableCell>
                          <TableCell>{bank.collection_locality || "N/A"}</TableCell>
                          <TableCell>{formatTemperature(bank.temperature)}</TableCell>
                          <TableCell>{bank.quantity || "N/A"}</TableCell>
                          <TableCell>{bank.storage_container || "N/A"}</TableCell>
                          <TableCell>{bank.storage_room || "N/A"}</TableCell>
                          <TableCell>{bank.refrigerator || "N/A"}</TableCell>
                          <TableCell>{bank.drawer || "N/A"}</TableCell>
                          <TableCell>{bank.storage_label || "N/A"}</TableCell>
                          <TableCell>
                            <Badge variant={bank.cold_sample ? "default" : "secondary"}>
                              {bank.cold_sample ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={bank.is_reagent ? "default" : "secondary"}>
                              {bank.is_reagent ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell>{bank.reagent_for || "N/A"}</TableCell>
                          <TableCell>
                            {bank.storage_date ? format(new Date(bank.storage_date), 'MMM d, yyyy') : "N/A"}
                          </TableCell>
                          <TableCell>
                            {bank.expiration_date ? format(new Date(bank.expiration_date), 'MMM d, yyyy') : "N/A"}
                          </TableCell>
                          <TableCell>{bank.collected_by || "N/A"}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(bank.status || "stored")}>
                              {bank.status || "stored"}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate" title={bank.notes}>
                            {bank.notes || "N/A"}
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
      </PageContainer>
    </MainLayout>
  );
};

export default BioBanks;
