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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, CreditCard, User, Calendar, MapPin, Thermometer, Package, Database, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

const SENEGAL_REGIONS = [
  "Dakar", "Thiès", "Diourbel", "Fatick", "Kaolack", "Kaffrine",
  "Saint-Louis", "Louga", "Matam", "Tambacounda", "Kédougou",
  "Kolda", "Sédhiou", "Ziguinchor"
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

const PLAQUETTE_TYPES = [
  "Standard",
  "Micro",
  "Mini",
  "Large",
  "96-well",
  "384-well",
  "Custom"
];

export const AddPlaquetteDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    plaquette_id: "",
    patient_id: "",
    collection_date: "",
    collection_time: "",
    collection_year: "",
    collection_location: "",
    collection_locality: "",
    plaquette_type: "",
    international_norms: "",
    spots_count: "5",
    temperature: "",
    storage_container: "",
    storage_room: "",
    storage_location: "",
    storage_date: "",
    expiration_date: "",
    quality_control: false,
    collected_by: "",
    processed_by: "",
    status: "collected",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate plaquette ID based on collection date
  const generatePlaquetteId = (collectionDate: string) => {
    if (!collectionDate) return "";
    
    const date = new Date(collectionDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Generate random 3-digit number for uniqueness
    const randomNum = Math.floor(Math.random() * 900) + 100;
    
    return `PLQ-${year}${month}${day}-${randomNum}`;
  };

  // Update form data and auto-calculate dependent fields
  const updateFormData = (field: string, value: string | boolean) => {
    const newFormData = { ...formData, [field]: value };
    
    // Auto-generate plaquette ID when collection date changes
    if (field === 'collection_date') {
      const newPlaquetteId = generatePlaquetteId(value as string);
      newFormData.plaquette_id = newPlaquetteId;
    }
    
    // Auto-calculate collection year from collection date
    if (field === 'collection_date' && value) {
      const year = new Date(value as string).getFullYear();
      newFormData.collection_year = year.toString();
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

  const addPlaquetteMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("plaquettes")
        .insert([{
          plaquette_id: data.plaquette_id,
          patient_id: data.patient_id || null,
          collection_date: data.collection_date,
          collection_time: data.collection_time || null,
          collection_year: data.collection_year ? parseInt(data.collection_year) : null,
          collection_location: data.collection_location || null,
          collection_locality: data.collection_locality || null,
          plaquette_type: data.plaquette_type || null,
          international_norms: data.international_norms || null,
          spots_count: parseInt(data.spots_count),
          temperature: data.temperature ? parseFloat(data.temperature) : null,
          storage_container: data.storage_container || null,
          storage_room: data.storage_room || null,
          storage_location: data.storage_location || null,
          storage_date: data.storage_date || null,
          expiration_date: data.expiration_date || null,
          quality_control: data.quality_control,
          collected_by: data.collected_by || null,
          processed_by: data.processed_by || null,
          status: data.status,
          notes: data.notes || null
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plaquettes"] });
      toast({ title: "Success", description: "Plaquette added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to add plaquette. Please try again.",
        variant: "destructive" 
      });
      console.error("Error adding plaquette:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.plaquette_id || !formData.collection_date) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Collection Date",
        variant: "destructive"
      });
      return;
    }
    
    addPlaquetteMutation.mutate(formData);
  };

  const resetForm = () => {
    setFormData({
      plaquette_id: "",
      patient_id: "",
      collection_date: "",
      collection_time: "",
      collection_year: "",
      collection_location: "",
      collection_locality: "",
      plaquette_type: "",
      international_norms: "",
      spots_count: "5",
      temperature: "",
      storage_container: "",
      storage_room: "",
      storage_location: "",
      storage_date: "",
      expiration_date: "",
      quality_control: false,
      collected_by: "",
      processed_by: "",
      status: "collected",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Plaquette
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
            <CreditCard className="h-6 w-6 text-blue-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">Add New Plaquette</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Enter comprehensive details for the plaquette collection
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Plaquette Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Plaquette Information
              </CardTitle>
              <CardDescription className="text-sm">
                Basic details about the plaquette
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
                  <Label htmlFor="collection_time" className="text-sm font-medium">
                    Collection Time
                  </Label>
                  <Input
                    id="collection_time"
                    type="time"
                    value={formData.collection_time}
                    onChange={(e) => updateFormData('collection_time', e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collection_year" className="text-sm font-medium">
                    Collection Year (Auto-calculated)
                  </Label>
                  <Input
                    id="collection_year"
                    value={formData.collection_year}
                    placeholder="Auto-filled from collection date"
                    className="h-10 bg-gray-50"
                    readOnly
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plaquette_type" className="text-sm font-medium">
                    Plaquette Type
                  </Label>
                  <Select 
                    value={formData.plaquette_type} 
                    onValueChange={(value) => updateFormData('plaquette_type', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select plaquette type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PLAQUETTE_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plaquette_id" className="text-sm font-medium">
                  Plaquette ID (Auto-generated)
                </Label>
                <Input
                  id="plaquette_id"
                  value={formData.plaquette_id}
                  placeholder="Will be generated automatically"
                  className="h-10 bg-gray-50"
                  readOnly
                />
                <p className="text-xs text-gray-500">
                  Plaquette ID is automatically generated based on collection date
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Plaquette QR Code</Label>
                <div className="flex items-center gap-4">
                  <QRCode value={formData.plaquette_id || ' '} size={80} id="plaq-qr-code" data-testid="qr-code-svg" />
                  <Barcode value={formData.plaquette_id || ' '} width={1.2} height={40} fontSize={12} displayValue={false} id="plaq-barcode" data-testid="barcode-canvas" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  // Get QR SVG as string
                  const qrElem = document.getElementById('plaq-qr-code');
                  const qrSVG = qrElem ? new XMLSerializer().serializeToString(qrElem) : '';
                  // Get barcode as data URL
                  let barcodeImg = '';
                  const barcodeElem = document.querySelector('#plaq-barcode canvas') as HTMLCanvasElement | null;
                  if (barcodeElem) {
                    barcodeImg = barcodeElem.toDataURL();
                  }
                  printWindow.document.write(`
                    <html><head><title>Print Plaquette Label</title></head><body style='font-family:sans-serif;text-align:center;padding:24px;'>
                      <h2>Plaquette Sample Label</h2>
                      <div style='margin:16px 0;'>${qrSVG ? `<img src='data:image/svg+xml;utf8,${encodeURIComponent(qrSVG)}' width='80' />` : ''}</div>
                      <div style='margin:16px 0;'>${barcodeImg ? `<img src='${barcodeImg}' height='40' />` : ''}</div>
                      <div style='font-size:18px;font-weight:bold;'>${formData.plaquette_id}</div>
                      <div style='font-size:14px;'>Patient: ${patients?.find(p => p.id === formData.patient_id)?.name || ''}</div>
                      <div style='font-size:12px;margin-top:8px;'>Collection Date: ${formData.collection_date}</div>
                      <script>window.print();window.close();</script>
                    </body></html>
                  `);
                }}>
                  Print Label
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="patient" className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Patient
                </Label>
                <Select 
                  value={formData.patient_id} 
                  onValueChange={(value) => updateFormData('patient_id', value)}
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
            </CardContent>
          </Card>

          {/* Collection Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Collection Details
              </CardTitle>
              <CardDescription className="text-sm">
                Location and collection specifics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collection_location" className="text-sm font-medium">
                    Collection Location (Region)
                  </Label>
                  <Select 
                    value={formData.collection_location} 
                    onValueChange={(value) => updateFormData('collection_location', value)}
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

                <div className="space-y-2">
                  <Label htmlFor="collection_locality" className="text-sm font-medium">
                    Collection Locality
                  </Label>
                  <Input
                    id="collection_locality"
                    value={formData.collection_locality}
                    onChange={(e) => updateFormData('collection_locality', e.target.value)}
                    placeholder="e.g., Hospital Central, Clinic ABC"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="spots_count" className="text-sm font-medium">
                    Spots Count
                  </Label>
                  <Input
                    id="spots_count"
                    type="number"
                    min="1"
                    max="20"
                    value={formData.spots_count}
                    onChange={(e) => updateFormData('spots_count', e.target.value)}
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
                    onChange={(e) => updateFormData('collected_by', e.target.value)}
                    placeholder="Collector name"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processed_by" className="text-sm font-medium">
                    Processed By
                  </Label>
                  <Input
                    id="processed_by"
                    value={formData.processed_by}
                    onChange={(e) => updateFormData('processed_by', e.target.value)}
                    placeholder="Processor name"
                    className="h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* International Norms & Standards */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Globe className="h-4 w-4" />
                International Norms & Standards
              </CardTitle>
              <CardDescription className="text-sm">
                Compliance and standardization information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="international_norms" className="text-sm font-medium">
                  International Norms <span className="text-red-500">*</span>
                </Label>
                <Select 
                  value={formData.international_norms} 
                  onValueChange={(value) => updateFormData('international_norms', value)}
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
            </CardContent>
          </Card>

          {/* Storage Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Storage Details
              </CardTitle>
              <CardDescription className="text-sm">
                Storage conditions and location
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="storage_container" className="text-sm font-medium">
                    Storage Container
                  </Label>
                  <Input
                    id="storage_container"
                    value={formData.storage_container}
                    onChange={(e) => updateFormData('storage_container', e.target.value)}
                    placeholder="e.g., Sealed bag, Box"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_room" className="text-sm font-medium">
                    Storage Room
                  </Label>
                  <Input
                    id="storage_room"
                    value={formData.storage_room}
                    onChange={(e) => updateFormData('storage_room', e.target.value)}
                    placeholder="e.g., Cold Storage Room"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_location" className="text-sm font-medium">
                    Storage Location
                  </Label>
                  <Input
                    id="storage_location"
                    value={formData.storage_location}
                    onChange={(e) => updateFormData('storage_location', e.target.value)}
                    placeholder="e.g., Shelf A, Cabinet 1"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="temperature" className="text-sm font-medium flex items-center gap-2">
                    <Thermometer className="h-4 w-4" />
                    Temperature (°C)
                  </Label>
                  <Input
                    id="temperature"
                    type="number"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => updateFormData('temperature', e.target.value)}
                    placeholder="e.g., -20"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_date" className="text-sm font-medium">
                    Storage Date
                  </Label>
                  <Input
                    id="storage_date"
                    type="date"
                    value={formData.storage_date}
                    onChange={(e) => updateFormData('storage_date', e.target.value)}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="expiration_date" className="text-sm font-medium">
                    Expiration Date
                  </Label>
                  <Input
                    id="expiration_date"
                    type="date"
                    value={formData.expiration_date}
                    onChange={(e) => updateFormData('expiration_date', e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status & Quality Control */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Status & Quality Control
              </CardTitle>
              <CardDescription className="text-sm">
                Processing status and quality information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="status" className="text-sm font-medium">
                    Status
                  </Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => updateFormData('status', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="collected">Collected</SelectItem>
                      <SelectItem value="processed">Processed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="quality_control"
                    checked={formData.quality_control}
                    onCheckedChange={(checked) => updateFormData('quality_control', checked as boolean)}
                  />
                  <Label htmlFor="quality_control" className="text-sm font-medium">
                    Quality Control Passed
                  </Label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Additional Notes</CardTitle>
              <CardDescription className="text-sm">
                Any additional information about the plaquette
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
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
              disabled={addPlaquetteMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={addPlaquetteMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
            >
              {addPlaquetteMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Plaquette
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}; 