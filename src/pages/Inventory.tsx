
import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { Package, Plus, Edit, Check, X } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddInventoryItemDialog } from "@/components/inventory/AddInventoryItemDialog";
import { useInventoryItems } from "@/components/inventory/useInventoryItems";
import { AddOrderDialog } from "@/components/inventory/AddOrderDialog";
import { AddEquipmentDialog } from "@/components/inventory/AddEquipmentDialog";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EquipmentTracking } from "@/components/inventory/EquipmentTracking";
import { EditInventoryItemDialog } from "@/components/inventory/EditInventoryItemDialog";
import { EditEquipmentItemDialog } from "@/components/inventory/EditEquipmentItemDialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";

// Updated EquipmentItem type to match database schema
interface EquipmentItemWithStatus {
  id: string;
  name: string;
  status: "Available" | "In Use" | "Maintenance" | "Out of Order";
  location: string;
  type?: string;
  serialNumber?: string;
  lastMaintenance?: string;
}

const Inventory = () => {
  const { userProfile } = useAuth();
  const userRole = userProfile?.role;
  const isManagerOrDirector = userRole === 'manager' || userRole === 'general_director';
  const isFinancialUser = userRole === 'financial';
  const canAddItems = !isManagerOrDirector && !isFinancialUser;

  const [addInventoryOpen, setAddInventoryOpen] = useState(false);
  const [addOrderOpen, setAddOrderOpen] = useState(false);
  const [addEquipmentOpen, setAddEquipmentOpen] = useState(false);
  const [editInventoryOpen, setEditInventoryOpen] = useState(false);
  const [editEquipmentOpen, setEditEquipmentOpen] = useState(false);
  const [selectedInventoryItem, setSelectedInventoryItem] = useState(null);
  const [selectedEquipmentItem, setSelectedEquipmentItem] = useState(null);
  const [activeTab, setActiveTab] = useState("consumables");
  const [confirmArrivalOpen, setConfirmArrivalOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState(null);
  const {
    inventoryItems,
    equipmentItems: rawEquipmentItems,
    orderItems,
    addInventoryItem,
    addEquipment,
    addOrder,
    updateInventoryItem,
    updateEquipmentItem
  } = useInventoryItems();
  const {
    toast
  } = useToast();

  // Transform equipment items to include status
  const equipmentItems: EquipmentItemWithStatus[] = rawEquipmentItems.map(item => ({
    ...item,
    status: "Available" as const, // Default status since it's not in database
    location: item.location || "Unknown",
    type: item.type || "Equipment",
    serialNumber: item.serialNumber || "N/A",
    lastMaintenance: item.lastMaintenance || "Not recorded"
  }));

  // Handler functions for adding items
  const handleAddInventoryItem = item => {
    addInventoryItem(item);
    setAddInventoryOpen(false);
    toast({
      title: "Item Added",
      description: `${item.produit} has been added to inventory`
    });
  };
  const handleAddEquipment = item => {
    addEquipment(item);
    setAddEquipmentOpen(false);
    toast({
      title: "Equipment Added",
      description: `${item.name} has been added to equipment list`
    });
  };
  const handleAddOrder = item => {
    addOrder(item);
    setAddOrderOpen(false);
    toast({
      title: "Order Added",
      description: `${item.name} has been added to orders`
    });
  };

  // Handler functions for editing items
  const handleEditInventory = item => {
    setSelectedInventoryItem(item);
    setEditInventoryOpen(true);
  };
  const handleEditEquipment = item => {
    setSelectedEquipmentItem(item);
    setEditEquipmentOpen(true);
  };
  const handleUpdateInventoryItem = updatedItem => {
    updateInventoryItem(selectedInventoryItem.id, updatedItem);
    setEditInventoryOpen(false);
    toast({
      title: "Item Updated",
      description: `${updatedItem.produit || selectedInventoryItem.produit} has been updated`
    });
  };
  const handleUpdateEquipmentItem = updatedItem => {
    updateEquipmentItem(selectedEquipmentItem.id, updatedItem);
    setEditEquipmentOpen(false);
    toast({
      title: "Equipment Updated",
      description: `${updatedItem.name || selectedEquipmentItem.name} has been updated`
    });
  };

  // Handler for opening the arrival confirmation dialog
  const handleOpenArrivalConfirm = item => {
    setSelectedOrderItem(item);
    setConfirmArrivalOpen(true);
  };

  // Handler for marking an order as "Arrived"
  const handleOrderArrived = () => {
    const item = selectedOrderItem;
    if (!item) return;

    // Create a new inventory item based on the order
    const quantity = item.quantity || 1; // Default to 1 if quantity is not defined

    addInventoryItem({
      produit: item.name,
      type: "cons",
      quantite_restante: quantity,
      seuil_alerte: quantity * 2, // Set alert threshold to double the quantity as default
      rayon: item.storageLocation || "Main Storage",
      conditionnement: "units",
      nom_vernaculaire: "",
      numero_lot_catalogue: "",
      reference: "",
      fabriquant: "",
      pays: "",
      date_preemption: undefined,
      temperature_conservation: "",
      projet_chimique: "",
      projet_source: "",
      observation_commentaire: `Added from order on ${new Date().toLocaleDateString()}`
    });

    toast({
      title: "Order Updated",
      description: `${item.name} has been marked as delivered and added to inventory`
    });

    // Switch to consumables tab to show the updated inventory
    setActiveTab("consumables");
    setConfirmArrivalOpen(false);
  };

  return <MainLayout>
      <PageContainer title="Inventory Management" subtitle="Track reagents, equipment, and consumable supplies">
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6 mb-6">
          {/* Low Stock Items Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-400" />
                  <span>Low Stock Items</span>
                </div>
              </CardTitle>
              <CardDescription>Items that require reordering soon</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {inventoryItems.filter(item => item.status === "low" || item.status === "critical").slice(0, 3).map(item => <li key={item.id} className="flex justify-between">
                    <span>{item.produit}</span>
                    <span className={`font-medium ${item.status === "critical" ? "text-red-500" : "text-orange-500"}`}>
                      {item.quantite_restante} {item.conditionnement}
                    </span>
                  </li>)}
                {inventoryItems.filter(item => item.status === "low" || item.status === "critical").length === 0 && <li className="text-center text-muted-foreground py-2">No low stock items</li>}
              </ul>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="consumables" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="consumables">Consumables & Reagents</TabsTrigger>
            <TabsTrigger value="equipment">Laboratory Equipment</TabsTrigger>
          </TabsList>
          
          <TabsContent value="consumables">
            <Card>
              <CardHeader>
                <CardTitle>Inventory Overview</CardTitle>
                <CardDescription>All inventory items</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Vernacular Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Lot/Catalog Number</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Section/Aisle</TableHead>
                      <TableHead>Packaging</TableHead>
                      <TableHead>Remaining Quantity</TableHead>
                      <TableHead>Expiration Date</TableHead>
                      <TableHead>Conservation Temperature</TableHead>
                      <TableHead>Chemical Project</TableHead>
                      <TableHead>Source Project</TableHead>
                      <TableHead>Alert Threshold</TableHead>
                      <TableHead>Observation/Comments</TableHead>
                      <TableHead>Status</TableHead>
                      {!isManagerOrDirector && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inventoryItems.length === 0 ? <TableRow>
                        <TableCell colSpan={isManagerOrDirector ? 18 : 19} className="text-center py-4">
                          No inventory items found. Add your first item to get started.
                        </TableCell>
                      </TableRow> : inventoryItems.map(item => <TableRow key={item.id}>
                          <TableCell>{item.numero || "—"}</TableCell>
                          <TableCell className="font-medium">{item.produit}</TableCell>
                          <TableCell>{item.nom_vernaculaire || "—"}</TableCell>
                          <TableCell>{item.type || "—"}</TableCell>
                          <TableCell>{item.numero_lot_catalogue || "—"}</TableCell>
                          <TableCell>{item.reference || "—"}</TableCell>
                          <TableCell>{item.fabriquant || "—"}</TableCell>
                          <TableCell>{item.pays || "—"}</TableCell>
                          <TableCell>{item.rayon || "—"}</TableCell>
                          <TableCell>{item.conditionnement || "—"}</TableCell>
                          <TableCell>{item.quantite_restante}</TableCell>
                          <TableCell>{item.date_preemption || "—"}</TableCell>
                          <TableCell>{item.temperature_conservation || "—"}</TableCell>
                          <TableCell>{item.projet_chimique || "—"}</TableCell>
                          <TableCell>{item.projet_source || "—"}</TableCell>
                          <TableCell>{item.seuil_alerte || "—"}</TableCell>
                          <TableCell>{item.observation_commentaire || "—"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${item.status === "ok" ? "bg-green-100 text-green-800" : item.status === "low" ? "bg-yellow-100 text-yellow-800" : item.status === "critical" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800"}`}>
                              {item.status}
                            </span>
                          </TableCell>
                          {canAddItems && (
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleEditInventory(item)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit {item.produit}</span>
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {inventoryItems.length} items
                </div>
                {canAddItems && (
                  <Button size="sm" onClick={() => setAddInventoryOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Item
                  </Button>
                )}
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="equipment">
            {/* Equipment Overview Card */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Equipment Overview</CardTitle>
                <CardDescription>Laboratory machines and equipment</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Serial Number</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Last Maintenance</TableHead>
                      {canAddItems && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipmentItems.length === 0 ? <TableRow>
                        <TableCell colSpan={canAddItems ? 7 : 6} className="text-center py-4">
                          No equipment items found. Add your first equipment to get started.
                        </TableCell>
                      </TableRow> : equipmentItems.map(item => <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell>{item.type || "N/A"}</TableCell>
                          <TableCell>{item.serialNumber || "N/A"}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${item.status === "Available" ? "bg-green-100 text-green-800" : item.status === "In Use" ? "bg-blue-100 text-blue-800" : item.status === "Maintenance" ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}`}>
                              {item.status}
                            </span>
                          </TableCell>
                          <TableCell>{item.location}</TableCell>
                          <TableCell>{item.lastMaintenance || "Not recorded"}</TableCell>
                          {canAddItems && (
                            <TableCell>
                              <Button variant="ghost" size="icon" onClick={() => handleEditEquipment(item)}>
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Edit {item.name}</span>
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>)}
                  </TableBody>
                </Table>
              </CardContent>
              <CardFooter className="flex justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {equipmentItems.length} equipment items
                </div>
                {canAddItems && (
                  <Button size="sm" onClick={() => setAddEquipmentOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Equipment
                  </Button>
                )}
              </CardFooter>
            </Card>
            
            {/* Equipment Tracking Section */}
            <EquipmentTracking />
          </TabsContent>
        </Tabs>

        {/* Confirmation Dialog for Order Arrival */}
        <AlertDialog open={confirmArrivalOpen} onOpenChange={setConfirmArrivalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirm Order Arrival</AlertDialogTitle>
              <AlertDialogDescription>
                Has {selectedOrderItem?.name || 'this item'} arrived? This will mark the order as delivered and add it to your inventory.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>No</AlertDialogCancel>
              <AlertDialogAction onClick={handleOrderArrived}>Yes</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        
        <AddInventoryItemDialog open={addInventoryOpen} onClose={() => setAddInventoryOpen(false)} onAdd={handleAddInventoryItem} />
        <AddEquipmentDialog open={addEquipmentOpen} onClose={() => setAddEquipmentOpen(false)} onAdd={handleAddEquipment} />
        <AddOrderDialog open={addOrderOpen} onClose={() => setAddOrderOpen(false)} onAdd={handleAddOrder} />
        
        {selectedInventoryItem && <EditInventoryItemDialog open={editInventoryOpen} onClose={() => setEditInventoryOpen(false)} onUpdate={handleUpdateInventoryItem} item={selectedInventoryItem} />}
        
        {selectedEquipmentItem && <EditEquipmentItemDialog open={editEquipmentOpen} onClose={() => setEditEquipmentOpen(false)} onUpdate={handleUpdateEquipmentItem} item={selectedEquipmentItem} />}
      </PageContainer>
    </MainLayout>;
};

export default Inventory;
