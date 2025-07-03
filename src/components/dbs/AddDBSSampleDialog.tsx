import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Droplets, User, Calendar, MapPin, FileText, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

const SENEGAL_REGIONS = [
  "Dakar",
  "Thiès", 
  "Diourbel",
  "Fatick",
  "Kaolack",
  "Kaffrine",
  "Saint-Louis",
  "Louga",
  "Matam",
  "Tambacounda",
  "Kédougou",
  "Kolda",
  "Sédhiou",
  "Ziguinchor"
];

const INTERNATIONAL_NORMS = [
  "WHO-2023",
  "ISO-15189",
  "CLSI-GP33",
  "FDA-510K",
  "CE-IVD",
  "CDC-Guidelines",
  "NCCLS-H4-A6",
  "Other"
];

export const AddDBSSampleDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    sample_id: "",
    patient_id: "",
    collection_date: "",
    collection_time: "",
    collection_location: "",
    spots_count: "5",
    card_type: "",
    international_norms: "",
    storage_location: "",
    status: "collected",
    collected_by: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate sample ID based on collection date
  const generateSampleId = (collectionDate: string) => {
    if (!collectionDate) return "";
    
    const date = new Date(collectionDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Generate random 3-digit number for uniqueness
    const randomNum = Math.floor(Math.random() * 900) + 100;
    
    return `DBS-${year}${month}${day}-${randomNum}`;
  };

  // Update sample ID when collection date changes
  const updateFormData = (field: string, value: string) => {
    const newFormData = { ...formData, [field]: value };
    
    if (field === 'collection_date') {
      const newSampleId = generateSampleId(value);
      newFormData.sample_id = newSampleId;
    }
    
    setFormData(newFormData);
  };

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("patients")
        .select("id, name")
        .order("name");
      
      if (error) throw error;
      return data || [];
    }
  });

  const addSampleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("dbs_samples")
        .insert([{
          sample_id: data.sample_id,
          patient_id: data.patient_id || null,
          collection_date: data.collection_date,
          collection_time: data.collection_time || null,
          collection_location: data.collection_location || null,
          spots_count: parseInt(data.spots_count),
          card_type: data.card_type || null,
          international_norms: data.international_norms || null,
          storage_location: data.storage_location || null,
          status: data.status,
          analyzed_by: data.collected_by || null,
          notes: data.notes || null
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dbsSamples"] });
      toast({ title: "Success", description: "DBS sample added successfully" });
      setOpen(false);
      setFormData({
        sample_id: "",
        patient_id: "",
        collection_date: "",
        collection_time: "",
        collection_location: "",
        spots_count: "5",
        card_type: "",
        international_norms: "",
        storage_location: "",
        status: "collected",
        collected_by: "",
        notes: ""
      });
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to add DBS sample. Please try again.",
        variant: "destructive" 
      });
      console.error("Error adding DBS sample:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sample_id || !formData.collection_date) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Collection Date",
        variant: "destructive"
      });
      return;
    }
    
    addSampleMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      sample_id: "",
      patient_id: "",
      collection_date: "",
      collection_time: "",
      collection_location: "",
      spots_count: "5",
      card_type: "",
      international_norms: "",
      storage_location: "",
      status: "collected",
      collected_by: "",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-red-600 hover:bg-red-700">
          <Plus className="h-4 w-4 mr-2" />
          Add DBS Sample
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
            <Droplets className="h-6 w-6 text-red-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">Add New DBS Sample</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Enter details for the Dry Blood Spot sample collection
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Droplets className="h-4 w-4" />
                Sample Information
              </CardTitle>
              <CardDescription className="text-sm">
                Basic details about the DBS sample
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collection_date" className="text-sm font-medium">
                    Collection Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="collection_date"
                    type="date"
                    value={formData.collection_date}
                    onChange={(e) => updateFormData('collection_date', e.target.value)}
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="patient" className="text-sm font-medium flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Patient
                  </Label>
                  <Select 
                    value={formData.patient_id} 
                    onValueChange={(value) => setFormData({ ...formData, patient_id: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a patient (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {patients?.map((patient) => (
                        <SelectItem key={patient.id} value={patient.id}>
                          {patient.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample_id" className="text-sm font-medium">
                  Sample ID (Auto-generated)
                </Label>
                <Input
                  id="sample_id"
                  value={formData.sample_id}
                  placeholder="Will be generated automatically"
                  className="h-10 bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500">
                  Sample ID is automatically generated based on collection date
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Sample QR Code</Label>
                <div className="flex items-center gap-4">
                  <QRCode value={formData.sample_id || ' '} size={80} id="dbs-qr-code" data-testid="qr-code-svg" />
                  <Barcode value={formData.sample_id || ' '} width={1.2} height={40} fontSize={12} displayValue={false} id="dbs-barcode" data-testid="barcode-canvas" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  // Get QR SVG as string
                  const qrElem = document.getElementById('dbs-qr-code');
                  const qrSVG = qrElem ? new XMLSerializer().serializeToString(qrElem) : '';
                  // Get barcode as data URL
                  let barcodeImg = '';
                  const barcodeElem = document.querySelector('#dbs-barcode canvas') as HTMLCanvasElement | null;
                  if (barcodeElem) {
                    barcodeImg = barcodeElem.toDataURL();
                  }
                  printWindow.document.write(`
                    <html><head><title>Print Sample Label</title></head><body style='font-family:sans-serif;text-align:center;padding:24px;'>
                      <h2>DBS Sample Label</h2>
                      <div style='margin:16px 0;'>${qrSVG ? `<img src='data:image/svg+xml;utf8,${encodeURIComponent(qrSVG)}' width='80' />` : ''}</div>
                      <div style='margin:16px 0;'>${barcodeImg ? `<img src='${barcodeImg}' height='40' />` : ''}</div>
                      <div style='font-size:18px;font-weight:bold;'>${formData.sample_id}</div>
                      <div style='font-size:14px;'>Patient: ${patients?.find(p => p.id === formData.patient_id)?.name || ''}</div>
                      <div style='font-size:12px;margin-top:8px;'>Collection Date: ${formData.collection_date}</div>
                      <script>window.print();window.close();</script>
                    </body></html>
                  `);
                }}>
                  Print Label
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Collection Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Collection Details
              </CardTitle>
              <CardDescription className="text-sm">
                Additional collection information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collection_time" className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Collection Time
                  </Label>
                  <Input
                    id="collection_time"
                    type="time"
                    value={formData.collection_time}
                    onChange={(e) => setFormData({ ...formData, collection_time: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collection_location" className="text-sm font-medium flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Collection Location
                  </Label>
                  <Select 
                    value={formData.collection_location} 
                    onValueChange={(value) => setFormData({ ...formData, collection_location: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select a region in Senegal" />
                    </SelectTrigger>
                    <SelectContent>
                      {SENEGAL_REGIONS.map((region) => (
                        <SelectItem key={region} value={region}>
                          {region}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spots_count" className="text-sm font-medium">
                    Spots Count
                  </Label>
                  <Input
                    id="spots_count"
                    type="number"
                    min="1"
                    max="10"
                    value={formData.spots_count}
                    onChange={(e) => setFormData({ ...formData, spots_count: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="card_type" className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Card Type
                  </Label>
                  <Input
                    id="card_type"
                    value={formData.card_type}
                    onChange={(e) => setFormData({ ...formData, card_type: e.target.value })}
                    placeholder="e.g., Whatman 903"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="international_norms" className="text-sm font-medium">
                    International Norms
                  </Label>
                  <Select 
                    value={formData.international_norms} 
                    onValueChange={(value) => setFormData({ ...formData, international_norms: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select international standard" />
                    </SelectTrigger>
                    <SelectContent>
                      {INTERNATIONAL_NORMS.map((norm) => (
                        <SelectItem key={norm} value={norm}>
                          {norm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collected">Collected</SelectItem>
                      <SelectItem value="analyzed">Analyzed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Storage & Collection */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Storage & Collection
              </CardTitle>
              <CardDescription className="text-sm">
                Storage location and collection information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storage_location" className="text-sm font-medium">
                    Storage Location
                  </Label>
                  <Input
                    id="storage_location"
                    value={formData.storage_location}
                    onChange={(e) => setFormData({ ...formData, storage_location: e.target.value })}
                    placeholder="e.g., Room A, Cabinet 1"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="collected_by" className="text-sm font-medium">
                    Collected By
                  </Label>
                  <Input
                    id="collected_by"
                    value={formData.collected_by}
                    onChange={(e) => setFormData({ ...formData, collected_by: e.target.value })}
                    placeholder="Collector name"
                    className="h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Additional Notes</CardTitle>
              <CardDescription className="text-sm">
                Any additional information about the DBS sample
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Enter any additional notes, quality observations, or special handling instructions..."
                className="min-h-[80px] resize-none"
              />
            </CardContent>
          </Card>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={addSampleMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addSampleMutation.isPending}
              className="bg-red-600 hover:bg-red-700 min-w-[120px]"
            >
              {addSampleMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Sample
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
