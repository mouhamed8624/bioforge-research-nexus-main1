import { supabase } from "@/integrations/supabase/client";

// Helper function to determine status based on remaining quantity and alert threshold
const determineStatus = (quantite_restante: number, seuil_alerte: number): "ok" | "low" | "critical" | "overstock" => {
  if (!seuil_alerte || seuil_alerte <= 0) return "ok";
  
  const ratio = quantite_restante / seuil_alerte;
  if (ratio <= 0.1) return "critical";
  if (ratio <= 0.3) return "low";
  if (ratio >= 2) return "overstock";
  return "ok";
};

// Helper function to clean data for database insertion/update
const cleanDataForDatabase = (item: any) => {
  const cleanedItem = { ...item };
  
  // Convert empty strings to null for date fields
  if (cleanedItem.date_preemption === "") {
    cleanedItem.date_preemption = null;
  }
  
  // Ensure numeric fields are properly converted
  if (cleanedItem.quantite_restante !== undefined) {
    cleanedItem.quantite_restante = Number(cleanedItem.quantite_restante);
  }
  
  if (cleanedItem.seuil_alerte !== undefined) {
    cleanedItem.seuil_alerte = Number(cleanedItem.seuil_alerte);
  }
  
  return cleanedItem;
};

// Fetch all inventory items
export const fetchInventoryItems = async () => {
  console.log("Fetching inventory items...");
  const { data, error } = await supabase
    .from("inventory_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching inventory items:", error);
    throw error;
  }

  console.log("Fetched inventory items:", data);
  
  // Transform the data to include calculated status
  return data.map(item => ({
    ...item,
    status: determineStatus(item.quantite_restante || 0, item.seuil_alerte || 0),
  }));
};

// Add a new inventory item
export const addInventoryItem = async (item: any) => {
  console.log("Adding inventory item:", item);
  
  // Validate required fields
  if (!item.produit || item.produit.trim() === '') {
    throw new Error("Product name is required");
  }
  
  if (typeof item.quantite_restante !== 'number' || item.quantite_restante < 0) {
    throw new Error("Remaining quantity must be a valid positive number");
  }

  // Prepare the item for database insertion - ensure proper field mapping
  const dbItem = {
    numero: item.numero || '',
    produit: item.produit.trim(),
    nom_vernaculaire: item.nom_vernaculaire || '',
    type: item.type || 'cons',
    numero_lot_catalogue: item.numero_lot_catalogue || '',
    reference: item.reference || '',
    fabriquant: item.fabriquant || '',
    pays: item.pays || '',
    rayon: item.rayon || '',
    conditionnement: item.conditionnement || 'units',
    quantite_restante: Number(item.quantite_restante),
    date_preemption: item.date_preemption || null,
    temperature_conservation: item.temperature_conservation || '',
    projet_chimique: item.projet_chimique || '',
    projet_source: item.projet_source || '',
    seuil_alerte: Number(item.seuil_alerte) || 0,
    observation_commentaire: item.observation_commentaire || ''
  };

  // Clean the data before insertion
  const cleanedDbItem = cleanDataForDatabase(dbItem);

  console.log("Prepared item for database:", cleanedDbItem);

  const { data, error } = await supabase
    .from("inventory_items")
    .insert([cleanedDbItem])
    .select()
    .single();

  if (error) {
    console.error("Error adding inventory item:", error);
    console.error("Error details:", error.message, error.details, error.hint);
    throw error;
  }

  console.log("Successfully added inventory item:", data);

  // Return with calculated status
  return {
    ...data,
    status: determineStatus(data.quantite_restante || 0, data.seuil_alerte || 0),
  };
};

// Update inventory item order status (simulated since the field doesn't exist)
export const updateInventoryOrderStatus = async (itemId: string, orderStatus: string) => {
  // Since order_status doesn't exist in the database, we'll just return success
  // In a real implementation, you'd need to add this field to the database
  console.log(`Simulating order status update for item ${itemId} to ${orderStatus}`);
  return { success: true };
};

// Update inventory item
export const updateInventoryItem = async (id: string, item: any) => {
  console.log("Updating inventory item:", id, item);
  
  // Clean the data before update
  const cleanedItem = cleanDataForDatabase(item);
  
  console.log("Cleaned item for update:", cleanedItem);

  const { data, error } = await supabase
    .from("inventory_items")
    .update(cleanedItem)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating inventory item:", error);
    throw error;
  }

  console.log("Successfully updated inventory item:", data);

  return {
    ...data,
    status: determineStatus(data.quantite_restante || 0, data.seuil_alerte || 0),
  };
};

// Fetch all equipment items
export const fetchEquipmentItems = async () => {
  const { data, error } = await supabase
    .from("equipment_items")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching equipment items:", error);
    throw error;
  }

  // Transform the data to include default values for missing fields
  return data.map(item => ({
    ...item,
    description: "No description available",
    category: "General Equipment",
    status: "available",
    location: "Lab Storage",
    type: "General Equipment",
    serialNumber: item.serial_number,
    lastMaintenance: undefined,
  }));
};

// Generate automatic serial number
const generateSerialNumber = () => {
  const prefix = "LAB";
  const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${prefix}-${timestamp}-${random}`;
};

// Add a new equipment item with auto-generated serial number
export const addEquipmentItem = async (item: any) => {
  const serialNumber = generateSerialNumber();
  
  // Only include fields that exist in the database
  const dbItem = {
    name: item.name,
    serial_number: serialNumber,
  };

  const { data, error } = await supabase
    .from("equipment_items")
    .insert([dbItem])
    .select()
    .single();

  if (error) {
    console.error("Error adding equipment item:", error);
    throw error;
  }

  return {
    ...data,
    description: "No description available",
    category: "General Equipment",
    status: "available",
    location: "Lab Storage",
    type: "General Equipment",
    serialNumber: data.serial_number,
    lastMaintenance: undefined,
  };
};

// Update equipment item
export const updateEquipmentItem = async (id: string, item: any) => {
  // Only include fields that exist in the database
  const dbItem: any = {};
  if (item.name !== undefined) dbItem.name = item.name;
  if (item.serialNumber !== undefined) dbItem.serial_number = item.serialNumber;

  const { data, error } = await supabase
    .from("equipment_items")
    .update(dbItem)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating equipment item:", error);
    throw error;
  }

  return {
    ...data,
    description: "No description available",
    category: "General Equipment", 
    status: "available",
    location: "Lab Storage",
    type: "General Equipment",
    serialNumber: data.serial_number,
    lastMaintenance: undefined,
  };
};

// Order items - return empty array since the table doesn't exist
export const fetchOrderItems = async () => {
  console.log("Order items not available - order_items table does not exist");
  return [];
};

// Add order item - not available
export const addOrderItem = async (item: any) => {
  console.log("Cannot add order item - order_items table does not exist");
  throw new Error("Order items table is not available");
};

// Update order item status - not available
export const updateOrderItemStatus = async (itemId: string, orderStatus: string) => {
  console.log("Cannot update order item status - order_items table does not exist");
  return { success: false };
};
