import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import {
  fetchInventoryItems,
  addInventoryItem as addInventoryItemApi,
  updateInventoryOrderStatus as updateInventoryOrderStatusApi,
  updateInventoryItem as updateInventoryItemApi,
  updateEquipmentItem as updateEquipmentItemApi,
  fetchEquipmentItems,
  addEquipmentItem as addEquipmentItemApi,
  fetchOrderItems,
  addOrderItem as addOrderItemApi,
  updateOrderItemStatus
} from "@/services/inventory/supabaseService";

// Updated types for our inventory items based on new French structure
export type InventoryItem = {
  id: string;
  numero?: string; // Number/ID
  produit: string; // Product (required)
  nom_vernaculaire?: string; // Vernacular name
  type?: "cons" | "reactif"; // Type (cons|reactif)
  numero_lot_catalogue?: string; // Lot/catalog number
  reference?: string; // Reference
  fabriquant?: string; // Manufacturer
  pays?: string; // Country
  rayon?: string; // Section/Aisle
  conditionnement?: string; // Packaging/Conditioning
  quantite_restante: number; // Remaining quantity
  date_preemption?: string; // Expiration date
  temperature_conservation?: string; // Conservation temperature
  projet_chimique?: string; // Chemical project
  projet_source?: string; // Source project
  seuil_alerte?: number; // Alert threshold
  observation_commentaire?: string; // Observation/Comments
  status: "ok" | "low" | "critical" | "overstock";
  created_at?: string;
  updated_at?: string;
};

export type EquipmentItem = {
  id: string;
  name: string;
  status: "Available" | "In Use" | "Maintenance" | "Out of Order";
  location: string;
  type?: string;
  serialNumber?: string;
  lastMaintenance?: string;
};

export type OrderItem = {
  id: string;
  name: string;
  status: string;
  orderDate: string;
  quantity?: number;
  storageLocation?: string;
  orderStatus?: string;
};

export function useInventoryItems() {
  const queryClient = useQueryClient();

  // Query hooks for fetching data
  const inventoryQuery = useQuery({
    queryKey: ["inventoryItems"],
    queryFn: fetchInventoryItems,
  });

  const equipmentQuery = useQuery({
    queryKey: ["equipmentItems"],
    queryFn: fetchEquipmentItems,
  });

  const orderQuery = useQuery({
    queryKey: ["orderItems"],
    queryFn: fetchOrderItems,
  });

  // Helper function to determine status based on remaining quantity and alert threshold
  const determineStatus = (quantite_restante: number, seuil_alerte: number): InventoryItem["status"] => {
    if (!seuil_alerte || seuil_alerte <= 0) return "ok";
    
    const ratio = quantite_restante / seuil_alerte;
    if (ratio <= 0.1) return "critical";
    if (ratio <= 0.3) return "low";
    if (ratio >= 2) return "overstock";
    return "ok";
  };
  
  // Mutation hooks for modifying data
  const addInventoryMutation = useMutation({
    mutationFn: (item: Omit<InventoryItem, "id" | "status">) => {
      console.log("Adding inventory item via mutation:", item);
      // Calculate status before sending to API
      const statusCalculated = determineStatus(item.quantite_restante, item.seuil_alerte || 0);
      return addInventoryItemApi({ ...item, status: statusCalculated });
    },
    onSuccess: (data) => {
      console.log("Successfully added inventory item:", data);
      // Invalidate and refetch inventory items
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInventoryItems"] });
      
      // Force a refetch to ensure UI updates
      queryClient.refetchQueries({ queryKey: ["inventoryItems"] });
      
      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to add inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to add inventory item",
        variant: "destructive",
      });
    },
  });
  
  const updateOrderStatusMutation = useMutation({
    mutationFn: ({ itemId, orderStatus }: { itemId: string, orderStatus: string }) =>
      updateInventoryOrderStatusApi(itemId, orderStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInventoryItems"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to update order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });
  
  const addEquipmentMutation = useMutation({
    mutationFn: addEquipmentItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipmentItems"] });
      toast({
        title: "Success",
        description: "Equipment added successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to add equipment:", error);
      toast({
        title: "Error",
        description: "Failed to add equipment",
        variant: "destructive",
      });
    },
  });
  
  const addOrderMutation = useMutation({
    mutationFn: addOrderItemApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orderItems"] });
      toast({
        title: "Success",
        description: "Order added successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to add order:", error);
      toast({
        title: "Error",
        description: "Failed to add order",
        variant: "destructive",
      });
    },
  });

  // New mutation for updating inventory items
  const updateInventoryMutation = useMutation({
    mutationFn: ({ id, item }: { id: string, item: Partial<Omit<InventoryItem, "id">> }) =>
      updateInventoryItemApi(id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryItems"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardInventoryItems"] });
      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to update inventory item:", error);
      toast({
        title: "Error",
        description: "Failed to update inventory item",
        variant: "destructive",
      });
    },
  });

  // New mutation for updating equipment items
  const updateEquipmentMutation = useMutation({
    mutationFn: ({ id, item }: { id: string, item: Partial<Omit<EquipmentItem, "id">> }) =>
      updateEquipmentItemApi(id, item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipmentItems"] });
      toast({
        title: "Success",
        description: "Equipment item updated successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to update equipment item:", error);
      toast({
        title: "Error",
        description: "Failed to update equipment item",
        variant: "destructive",
      });
    },
  });

  // New mutation for updating order item status
  const updateOrderStatusMutation2 = useMutation({
    mutationFn: ({ itemId, orderStatus }: { itemId: string, orderStatus: string }) =>
      updateOrderItemStatus(itemId, orderStatus),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orderItems"] });
      toast({
        title: "Success",
        description: "Order status updated successfully",
      });
    },
    onError: (error) => {
      console.error("Failed to update order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    },
  });

  // API functions that components will use
  const addInventoryItem = (item: Omit<InventoryItem, "id" | "status">) => {
    console.log("useInventoryItems: addInventoryItem called with:", item);
    addInventoryMutation.mutate(item);
  };
  
  const updateInventoryOrderStatus = (itemId: string, orderStatus: string) => {
    updateOrderStatusMutation.mutate({ itemId, orderStatus });
  };
  
  const addEquipment = (item: Omit<EquipmentItem, "id">) => {
    addEquipmentMutation.mutate(item);
  };
  
  const addOrder = (item: Omit<OrderItem, "id">) => {
    addOrderMutation.mutate(item);
  };
  
  // New functions to update inventory and equipment items
  const updateInventoryItem = (id: string, item: Partial<Omit<InventoryItem, "id">>) => {
    updateInventoryMutation.mutate({ id, item });
  };

  const updateEquipmentItem = (id: string, item: Partial<Omit<EquipmentItem, "id">>) => {
    updateEquipmentMutation.mutate({ id, item });
  };

    // New function to update order item status
    const updateOrderStatus = (id: string, orderStatus: string) => {
      updateOrderStatusMutation2.mutate({ itemId: id, orderStatus });
    };
  
  return {
    // Data
    inventoryItems: inventoryQuery.data || [],
    equipmentItems: equipmentQuery.data || [],
    orderItems: orderQuery.data || [],
    
    // Loading states
    isLoading: inventoryQuery.isLoading || equipmentQuery.isLoading || orderQuery.isLoading,
    isError: inventoryQuery.isError || equipmentQuery.isError || orderQuery.isError,
    
    // Mutation functions
    addInventoryItem,
    addEquipment,
    addOrder,
    updateInventoryOrderStatus,
    updateInventoryItem,
    updateEquipmentItem,
    updateOrderStatus,
    
    // For debugging
    inventoryQuery,
    equipmentQuery,
    orderQuery,
  };
}
