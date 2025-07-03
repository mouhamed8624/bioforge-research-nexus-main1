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
import { Plus, Beaker, User, Calendar, MapPin, Thermometer, Package, Database } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import QRCode from 'react-qr-code';
import Barcode from 'react-barcode';

export const AddBioSampleDialog = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    sample_id: "",
    patient_id: "",
    sample_type: "",
    sample_category: "",
    collection_date: "",
    collection_year: "",
    collection_locality: "",
    temperature: "",
    quantity: "",
    storage_container: "",
    storage_room: "",
    refrigerator: "",
    drawer: "",
    storage_label: "",
    storage_date: "",
    expiration_date: "",
    collected_by: "",
    status: "stored",
    cold_sample: false,
    is_reagent: false,
    reagent_for: "",
    notes: ""
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Generate sample ID based on sample type and collection date
  const generateSampleId = (sampleType: string, collectionDate: string) => {
    if (!sampleType || !collectionDate) return "";
    
    const date = new Date(collectionDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Create abbreviated sample type (first 3 letters, uppercase)
    const typeAbbr = sampleType.substring(0, 3).toUpperCase();
    
    // Generate random 3-digit number for uniqueness
    const randomNum = Math.floor(Math.random() * 900) + 100;
    
    return `${typeAbbr}-${year}${month}${day}-${randomNum}`;
  };

  // Update form data and auto-calculate dependent fields
  const updateFormData = (field: string, value: string | boolean) => {
    const newFormData = { ...formData, [field]: value };
    
    // Auto-generate sample ID when sample type or collection date changes
    if (field === 'sample_type' || field === 'collection_date') {
      const newSampleId = generateSampleId(
        field === 'sample_type' ? value as string : formData.sample_type,
        field === 'collection_date' ? value as string : formData.collection_date
      );
      newFormData.sample_id = newSampleId;
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

  const addSampleMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("bio_banks")
        .insert([{
          sample_id: data.sample_id,
          patient_id: data.patient_id || null,
          sample_type: data.sample_type,
          sample_category: data.sample_category || null,
          collection_date: data.collection_date,
          collection_year: data.collection_year ? parseInt(data.collection_year) : null,
          collection_locality: data.collection_locality || null,
          temperature: data.temperature ? parseFloat(data.temperature) : null,
          quantity: data.quantity ? parseFloat(data.quantity) : null,
          storage_container: data.storage_container || null,
          storage_room: data.storage_room || null,
          refrigerator: data.refrigerator || null,
          drawer: data.drawer || null,
          storage_label: data.storage_label || null,
          storage_date: data.storage_date || null,
          expiration_date: data.expiration_date || null,
          collected_by: data.collected_by || null,
          status: data.status,
          cold_sample: data.cold_sample,
          is_reagent: data.is_reagent,
          reagent_for: data.reagent_for || null,
          notes: data.notes || null
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bioBanks"] });
      toast({ title: "Success", description: "Bio sample added successfully" });
      setOpen(false);
      resetForm();
    },
    onError: (error) => {
      toast({ 
        title: "Error", 
        description: "Failed to add bio sample. Please try again.",
        variant: "destructive" 
      });
      console.error("Error adding bio sample:", error);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sample_id || !formData.sample_type || !formData.collection_date) {
      toast({
        title: "Missing Required Fields",
        description: "Please fill in Sample Type and Collection Date",
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
      sample_type: "",
      sample_category: "",
      collection_date: "",
      collection_year: "",
      collection_locality: "",
      temperature: "",
      quantity: "",
      storage_container: "",
      storage_room: "",
      refrigerator: "",
      drawer: "",
      storage_label: "",
      storage_date: "",
      expiration_date: "",
      collected_by: "",
      status: "stored",
      cold_sample: false,
      is_reagent: false,
      reagent_for: "",
      notes: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (!newOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button className="bg-purple-600 hover:bg-purple-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Bio Sample
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
            <Beaker className="h-6 w-6 text-purple-600" />
          </div>
          <DialogTitle className="text-xl font-semibold">Add New Bio Sample</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Enter comprehensive details for the biological sample collection
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Sample Information */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Beaker className="h-4 w-4" />
                Sample Information
              </CardTitle>
              <CardDescription className="text-sm">
                Basic details about the sample
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sample_type" className="text-sm font-medium">
                    Sample Type <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="sample_type"
                    value={formData.sample_type}
                    onChange={(e) => updateFormData('sample_type', e.target.value)}
                    placeholder="e.g., serum, plasma, blood"
                    className="h-10"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sample_category" className="text-sm font-medium">
                    Sample Category
                  </Label>
                  <Select 
                    value={formData.sample_category} 
                    onValueChange={(value) => updateFormData('sample_category', value)}
                  >
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PLASMA">PLASMA</SelectItem>
                      <SelectItem value="SERUM">SERUM</SelectItem>
                      <SelectItem value="BLOOD">BLOOD</SelectItem>
                      <SelectItem value="TISSUE">TISSUE</SelectItem>
                      <SelectItem value="DNA">DNA</SelectItem>
                      <SelectItem value="RNA">RNA</SelectItem>
                      <SelectItem value="OTHER">OTHER</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="collection_locality" className="text-sm font-medium">
                    Collection Locality
                  </Label>
                  <Input
                    id="collection_locality"
                    value={formData.collection_locality}
                    onChange={(e) => updateFormData('collection_locality', e.target.value)}
                    placeholder="e.g., Dakar, Laboratory A"
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
                    placeholder="Name of person who collected sample"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sample_id" className="text-sm font-medium">
                  Sample ID (Auto-generated)
                </Label>
                <div className="flex items-center gap-4">
                  <Input
                    id="sample_id"
                    value={formData.sample_id}
                    placeholder="Will be generated automatically"
                    className="h-10 bg-gray-50"
                    readOnly
                  />
                  <QRCode value={formData.sample_id || ' '} size={80} id="bio-qr-code" data-testid="qr-code-svg" />
                  <Barcode value={formData.sample_id || ' '} width={1.2} height={40} fontSize={12} displayValue={false} id="bio-barcode" data-testid="barcode-canvas" />
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (!printWindow) return;
                  // Get QR SVG as string
                  const qrElem = document.getElementById('bio-qr-code');
                  const qrSVG = qrElem ? new XMLSerializer().serializeToString(qrElem) : '';
                  // Get barcode as data URL
                  let barcodeImg = '';
                  const barcodeElem = document.querySelector('#bio-barcode canvas') as HTMLCanvasElement | null;
                  if (barcodeElem) {
                    barcodeImg = barcodeElem.toDataURL();
                  }
                  printWindow.document.write(`
                    <html><head><title>Print Sample Label</title></head><body style='font-family:sans-serif;text-align:center;padding:24px;'>
                      <h2>BioBank Sample Label</h2>
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
                <p className="text-xs text-gray-500">
                  Sample ID is automatically generated based on sample type and collection date
                </p>
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

          {/* Storage Details */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Database className="h-4 w-4" />
                Storage Details
              </CardTitle>
              <CardDescription className="text-sm">
                Detailed storage information and location
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
                    placeholder="e.g., TUBE EPPENDORF"
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
                    placeholder="e.g., Salle Froide"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="refrigerator" className="text-sm font-medium">
                    Refrigerator
                  </Label>
                  <Input
                    id="refrigerator"
                    value={formData.refrigerator}
                    onChange={(e) => updateFormData('refrigerator', e.target.value)}
                    placeholder="e.g., V8 -20°C SF"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="drawer" className="text-sm font-medium">
                    Drawer
                  </Label>
                  <Input
                    id="drawer"
                    value={formData.drawer}
                    onChange={(e) => updateFormData('drawer', e.target.value)}
                    placeholder="e.g., 9"
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="storage_label" className="text-sm font-medium">
                    Storage Label
                  </Label>
                  <Input
                    id="storage_label"
                    value={formData.storage_label}
                    onChange={(e) => updateFormData('storage_label', e.target.value)}
                    placeholder="e.g., tesrt"
                    className="h-10"
                  />
                </div>

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
                    placeholder="e.g., -59"
                    className="h-10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {/* Sample Properties */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-4 w-4" />
                Sample Properties
              </CardTitle>
              <CardDescription className="text-sm">
                Physical and chemical properties of the sample
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-sm font-medium">
                    Quantity
                  </Label>
                  <Input
                    id="quantity"
                    type="number"
                    step="0.1"
                    value={formData.quantity}
                    onChange={(e) => updateFormData('quantity', e.target.value)}
                    placeholder="e.g., 78"
                    className="h-10"
                  />
                </div>

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
                      <SelectItem value="stored">Stored</SelectItem>
                      <SelectItem value="used">Used</SelectItem>
                      <SelectItem value="disposed">Disposed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="cold_sample"
                    checked={formData.cold_sample}
                    onCheckedChange={(checked) => updateFormData('cold_sample', checked as boolean)}
                  />
                  <Label htmlFor="cold_sample" className="text-sm font-medium">
                    Cold Sample
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="is_reagent"
                    checked={formData.is_reagent}
                    onCheckedChange={(checked) => updateFormData('is_reagent', checked as boolean)}
                  />
                  <Label htmlFor="is_reagent" className="text-sm font-medium">
                    Is Reagent
                  </Label>
                </div>
              </div>

              {formData.is_reagent && (
                <div className="space-y-2">
                  <Label htmlFor="reagent_for" className="text-sm font-medium">
                    Reagent For
                  </Label>
                  <Input
                    id="reagent_for"
                    value={formData.reagent_for}
                    onChange={(e) => updateFormData('reagent_for', e.target.value)}
                    placeholder="e.g., Sequencing"
                    className="h-10"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Additional Notes */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Additional Notes</CardTitle>
              <CardDescription className="text-sm">
                Any additional information about the sample
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Enter any additional notes, observations, or special handling instructions..."
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
              className="bg-purple-600 hover:bg-purple-700 min-w-[120px]"
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
