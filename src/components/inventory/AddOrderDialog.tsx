
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { OrderItem } from "./useInventoryItems";

type AddOrderDialogProps = {
  open: boolean;
  onClose: () => void;
  onAdd: (item: Omit<OrderItem, "id">) => void;
};

export function AddOrderDialog({ open, onClose, onAdd }: AddOrderDialogProps) {
  const form = useForm({
    defaultValues: {
      name: "",
      status: "Ordered",
      orderDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      storageLocation: ""
    }
  });

  const handleSubmit = (values) => {
    // Format the order status based on the selected status
    let formattedStatus;
    const today = new Date();
    const orderDate = new Date(values.orderDate);
    const month = orderDate.toLocaleString('default', { month: 'short' });
    const day = orderDate.getDate();
    
    switch(values.status) {
      case "Ordered":
        formattedStatus = `Ordered ${month} ${day}`;
        break;
      case "Arriving":
        formattedStatus = `Arriving ${month} ${day}`;
        break;
      case "Delivered":
        formattedStatus = `Delivered ${month} ${day}`;
        break;
      default:
        formattedStatus = values.status;
    }
    
    onAdd({
      name: values.name,
      status: formattedStatus,
      orderDate: values.orderDate,
      quantity: values.quantity,
      storageLocation: values.storageLocation
    });
    
    form.reset({
      name: "",
      status: "Ordered",
      orderDate: new Date().toISOString().split('T')[0],
      quantity: 1,
      storageLocation: ""
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Order</DialogTitle>
          <DialogDescription>Create a new order for inventory items</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Item Name</FormLabel>
                  <FormControl>
                    <Input placeholder="DNA Extraction Kit" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="storageLocation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                      <Input placeholder="Main Storage" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Status</FormLabel>
                  <FormControl>
                    <select
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      {...field}
                    >
                      <option value="Ordered">Ordered</option>
                      <option value="Arriving">Arriving</option>
                      <option value="Delivered">Delivered</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="orderDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Add Order</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
