
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { InventoryItem } from "./useInventoryItems";

type EditInventoryItemDialogProps = {
  open: boolean;
  onClose: () => void;
  onUpdate: (item: Partial<Omit<InventoryItem, "id" | "status">>) => void;
  item: InventoryItem;
};

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Armenia", "Australia", "Austria", "Azerbaijan",
  "Bahrain", "Bangladesh", "Belarus", "Belgium", "Bolivia", "Brazil", "Bulgaria", "Cambodia",
  "Cameroon", "Canada", "Chile", "China", "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus",
  "Czech Republic", "Denmark", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia",
  "Ethiopia", "Finland", "France", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Honduras",
  "Hungary", "Iceland", "India", "Indonesia", "Iran", "Iraq", "Ireland", "Israel", "Italy", "Jamaica",
  "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Latvia", "Lebanon", "Libya", "Lithuania",
  "Luxembourg", "Malaysia", "Mali", "Malta", "Mexico", "Morocco", "Netherlands", "New Zealand",
  "Nicaragua", "Nigeria", "Norway", "Pakistan", "Panama", "Paraguay", "Peru", "Philippines", "Poland",
  "Portugal", "Qatar", "Romania", "Russia", "Saudi Arabia", "Senegal", "Serbia", "Singapore",
  "Slovakia", "Slovenia", "South Africa", "South Korea", "Spain", "Sri Lanka", "Sweden", "Switzerland",
  "Syria", "Taiwan", "Thailand", "Tunisia", "Turkey", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Venezuela", "Vietnam", "Yemen"
];

export function EditInventoryItemDialog({ open, onClose, onUpdate, item }: EditInventoryItemDialogProps) {
  const form = useForm({
    defaultValues: {
      numero: item.numero || "",
      produit: item.produit,
      nom_vernaculaire: item.nom_vernaculaire || "",
      type: item.type || "cons",
      numero_lot_catalogue: item.numero_lot_catalogue || "",
      reference: item.reference || "",
      fabriquant: item.fabriquant || "",
      pays: item.pays || "",
      rayon: item.rayon || "",
      conditionnement: item.conditionnement || "units",
      quantite_restante: item.quantite_restante,
      date_preemption: item.date_preemption || "",
      temperature_conservation: item.temperature_conservation || "",
      projet_chimique: item.projet_chimique || "",
      projet_source: item.projet_source || "",
      seuil_alerte: item.seuil_alerte || 0,
      observation_commentaire: item.observation_commentaire || "",
    }
  });

  // Update form values when selected item changes
  useEffect(() => {
    if (item) {
      form.reset({
        numero: item.numero || "",
        produit: item.produit,
        nom_vernaculaire: item.nom_vernaculaire || "",
        type: item.type || "cons",
        numero_lot_catalogue: item.numero_lot_catalogue || "",
        reference: item.reference || "",
        fabriquant: item.fabriquant || "",
        pays: item.pays || "",
        rayon: item.rayon || "",
        conditionnement: item.conditionnement || "units",
        quantite_restante: item.quantite_restante,
        date_preemption: item.date_preemption || "",
        temperature_conservation: item.temperature_conservation || "",
        projet_chimique: item.projet_chimique || "",
        projet_source: item.projet_source || "",
        seuil_alerte: item.seuil_alerte || 0,
        observation_commentaire: item.observation_commentaire || "",
      });
    }
  }, [item, form]);

  const handleSubmit = (values) => {
    onUpdate({
      ...values,
      quantite_restante: Number(values.quantite_restante),
      seuil_alerte: Number(values.seuil_alerte),
    });
    
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Inventory Item</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Number/ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Auto-generated" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="produit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl>
                      <Input placeholder="PCR Reagent Kit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom_vernaculaire"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vernacular Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Common name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="cons">Consumable</option>
                        <option value="reactif">Reagent</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="numero_lot_catalogue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Lot/Catalog Number</FormLabel>
                    <FormControl>
                      <Input placeholder="LOT123456" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reference</FormLabel>
                    <FormControl>
                      <Input placeholder="REF-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fabriquant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Manufacturer</FormLabel>
                    <FormControl>
                      <Input placeholder="Company name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Country</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a country" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {countries.map((country) => (
                          <SelectItem key={country} value={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rayon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Section/Aisle</FormLabel>
                    <FormControl>
                      <Input placeholder="Lab A, Cabinet 3" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="conditionnement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Packaging</FormLabel>
                    <FormControl>
                      <select
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        {...field}
                      >
                        <option value="units">Units</option>
                        <option value="vials">Vials</option>
                        <option value="boxes">Boxes</option>
                        <option value="ml">Milliliters (ml)</option>
                        <option value="l">Liters (L)</option>
                        <option value="g">Grams (g)</option>
                        <option value="kg">Kilograms (kg)</option>
                        <option value="pieces">Pieces</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantite_restante"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Remaining Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="seuil_alerte"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alert Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date_preemption"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="temperature_conservation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Conservation Temperature</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., -20°C, 4°C, Room temp" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="projet_chimique"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chemical Project</FormLabel>
                    <FormControl>
                      <Input placeholder="Project name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="projet_source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source Project</FormLabel>
                    <FormControl>
                      <Input placeholder="Source project" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="observation_commentaire"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observations/Comments</FormLabel>
                  <FormControl>
                    <Input placeholder="Additional notes..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Update Item</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
