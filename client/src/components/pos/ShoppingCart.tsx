import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearCart: () => void;
}

export default function ShoppingCart({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}: ShoppingCartProps) {
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "digital">("cash");
  const [selectedCustomer, setSelectedCustomer] = useState<string>("walk-in");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [] } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const processSaleMutation = useMutation({
    mutationFn: async (saleData: any) => {
      const response = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(saleData),
      });
      if (!response.ok) throw new Error("Failed to process sale");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Sale processed successfully",
        description: "Receipt has been generated",
      });
      onClearCart();
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
    },
    onError: (error) => {
      toast({
        title: "Sale failed",
        description: error instanceof Error ? error.message : "Failed to process sale",
        variant: "destructive",
      });
    },
  });

  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const taxRate = 0.085; // 8.5%
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  const handleProcessPayment = () => {
    if (items.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to cart before processing payment",
        variant: "destructive",
      });
      return;
    }

    const saleData = {
      customerId: selectedCustomer === "walk-in" ? null : selectedCustomer,
      total: total.toFixed(2),
      tax: tax.toFixed(2),
      discount: "0.00",
      paymentMethod,
      items: items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.price.toFixed(2),
        total: item.total.toFixed(2),
      })),
    };

    processSaleMutation.mutate(saleData);
  };

  return (
    <Card className="sticky top-6">
      <CardContent className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Current Sale</h3>
        
        {/* Cart Items */}
        <div className="space-y-3 mb-6 max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <i className="fas fa-shopping-cart text-4xl mb-4"></i>
              <p>Cart is empty</p>
              <p className="text-sm">Add products to start a sale</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex-1">
                  <h5 className="font-medium text-sm" data-testid={`cart-item-${item.id}`}>
                    {item.name}
                  </h5>
                  <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} each</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    data-testid={`decrease-${item.id}`}
                  >
                    -
                  </Button>
                  <span className="w-8 text-center text-sm" data-testid={`quantity-${item.id}`}>
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-6 h-6 p-0"
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    data-testid={`increase-${item.id}`}
                  >
                    +
                  </Button>
                </div>
                <div className="text-right ml-3">
                  <p className="font-semibold text-sm" data-testid={`total-${item.id}`}>
                    ${item.total.toFixed(2)}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive text-xs h-auto p-0"
                    onClick={() => onRemoveItem(item.id)}
                    data-testid={`remove-${item.id}`}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Summary */}
        {items.length > 0 && (
          <>
            <div className="border-t border-border pt-4 mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Subtotal:</span>
                <span data-testid="cart-subtotal">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Tax (8.5%):</span>
                <span data-testid="cart-tax">${tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Total:</span>
                <span data-testid="cart-total">${total.toFixed(2)}</span>
              </div>
            </div>

            {/* Customer Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-foreground mb-2">Customer</label>
              <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                <SelectTrigger data-testid="customer-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="walk-in">Walk-in Customer</SelectItem>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.firstName} {customer.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Payment Method</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={paymentMethod === "cash" ? "default" : "outline"}
                  className="p-3 h-auto flex-col"
                  onClick={() => setPaymentMethod("cash")}
                  data-testid="payment-cash"
                >
                  <i className="fas fa-money-bill-wave mb-1"></i>
                  <span className="text-xs">Cash</span>
                </Button>
                <Button
                  variant={paymentMethod === "card" ? "default" : "outline"}
                  className="p-3 h-auto flex-col"
                  onClick={() => setPaymentMethod("card")}
                  data-testid="payment-card"
                >
                  <i className="fas fa-credit-card mb-1"></i>
                  <span className="text-xs">Card</span>
                </Button>
                <Button
                  variant={paymentMethod === "digital" ? "default" : "outline"}
                  className="p-3 h-auto flex-col"
                  onClick={() => setPaymentMethod("digital")}
                  data-testid="payment-digital"
                >
                  <i className="fas fa-mobile-alt mb-1"></i>
                  <span className="text-xs">Digital</span>
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleProcessPayment}
            disabled={items.length === 0 || processSaleMutation.isPending}
            data-testid="button-process-payment"
          >
            {processSaleMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <i className="fas fa-credit-card mr-2"></i>
                Process Payment
              </>
            )}
          </Button>
          
          {items.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" size="sm" data-testid="button-hold">
                <i className="fas fa-pause mr-1"></i>
                Hold
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={onClearCart}
                data-testid="button-clear"
              >
                <i className="fas fa-trash mr-1"></i>
                Clear
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
