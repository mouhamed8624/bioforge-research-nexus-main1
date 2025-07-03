import { toast } from "@/hooks/use-toast";
import { InventoryItem, EquipmentItem, OrderItem } from "@/components/inventory/useInventoryItems";
import { API_URL } from "@/config/apiConfig";

let isConnected = false;

/**
 * Generic error handler for API requests
 */
const handleApiError = (error: unknown, message: string) => {
  console.error(message, error);
  toast({
    title: "Error",
    description: message,
    variant: "destructive",
  });
  return null;
};

/**
 * Tests the MySQL connection
 */
export const testMysqlConnection = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/ping`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    isConnected = data.connected;
    
    if (isConnected) {
      console.log("MySQL connection successful");
      toast({
        title: "Connected",
        description: "Successfully connected to MySQL database",
      });
    } else {
      console.error("MySQL connection failed");
      toast({
        title: "Connection Failed",
        description: "Could not connect to MySQL database",
        variant: "destructive",
      });
    }
    
    return isConnected;
  } catch (error) {
    console.error("MySQL connection error:", error);
    toast({
      title: "Connection Error",
      description: "Failed to connect to MySQL database server",
      variant: "destructive",
    });
    isConnected = false;
    return false;
  }
};

/**
 * Returns current connection status
 */
export const getMysqlConnectionStatus = (): boolean => {
  return isConnected;
};

/**
 * Fetches all inventory items from the MySQL database
 */
export const fetchInventoryItems = async (): Promise<InventoryItem[] | null> => {
  try {
    const response = await fetch(`${API_URL}/inventory`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return handleApiError(error, "Failed to fetch inventory items");
  }
};

/**
 * Adds a new inventory item to the MySQL database
 */
export const addInventoryItem = async (item: Omit<InventoryItem, "id" | "status">): Promise<InventoryItem | null> => {
  try {
    const response = await fetch(`${API_URL}/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error, "Failed to add inventory item");
    return null;
  }
};

/**
 * Updates an inventory item's order status in the MySQL database
 */
export const updateInventoryOrderStatus = async (itemId: string, orderStatus: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/inventory/${itemId}/order-status`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderStatus }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return true;
  } catch (error) {
    handleApiError(error, "Failed to update order status");
    return false;
  }
};

/**
 * Fetches all equipment items from the MySQL database
 */
export const fetchEquipmentItems = async (): Promise<EquipmentItem[] | null> => {
  try {
    const response = await fetch(`${API_URL}/equipment`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return handleApiError(error, "Failed to fetch equipment items");
  }
};

/**
 * Adds a new equipment item to the MySQL database
 */
export const addEquipmentItem = async (item: Omit<EquipmentItem, "id">): Promise<EquipmentItem | null> => {
  try {
    const response = await fetch(`${API_URL}/equipment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error, "Failed to add equipment item");
    return null;
  }
};

/**
 * Fetches all order items from the MySQL database
 */
export const fetchOrderItems = async (): Promise<OrderItem[] | null> => {
  try {
    const response = await fetch(`${API_URL}/orders`);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    return handleApiError(error, "Failed to fetch order items");
  }
};

/**
 * Adds a new order item to the MySQL database
 */
export const addOrderItem = async (item: Omit<OrderItem, "id">): Promise<OrderItem | null> => {
  try {
    const response = await fetch(`${API_URL}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(item),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    handleApiError(error, "Failed to add order item");
    return null;
  }
};
