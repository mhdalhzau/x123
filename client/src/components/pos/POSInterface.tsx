import { useState } from "react";
import ProductGrid from "./ProductGrid";
import ShoppingCart from "./ShoppingCart";
import { type Product } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, RotateCcw } from "lucide-react";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface HeldOrder {
  id: string;
  type: string;
  customerName: string;
  items: CartItem[];
  total: number;
  timestamp: Date;
}

export default function POSInterface() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [heldOrders, setHeldOrders] = useState<HeldOrder[]>([]);

  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existingItem = prev.find(item => item.productId === product.id);
      
      if (existingItem) {
        return prev.map(item =>
          item.productId === product.id
            ? { 
                ...item, 
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.price
              }
            : item
        );
      } else {
        const newItem: CartItem = {
          id: Math.random().toString(36).substr(2, 9),
          productId: product.id,
          name: product.name,
          price: parseFloat(product.sellingPrice),
          quantity: 1,
          total: parseFloat(product.sellingPrice),
        };
        return [...prev, newItem];
      }
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }

    setCartItems(prev =>
      prev.map(item =>
        item.id === itemId
          ? { ...item, quantity, total: quantity * item.price }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const holdOrder = (type: string, customerName: string) => {
    if (cartItems.length === 0) return;
    
    const total = cartItems.reduce((sum, item) => sum + item.total, 0);
    const newHeldOrder: HeldOrder = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      customerName,
      items: [...cartItems],
      total,
      timestamp: new Date(),
    };
    
    setHeldOrders(prev => [...prev, newHeldOrder]);
    setCartItems([]);
  };

  const recallOrder = (orderId: string) => {
    const order = heldOrders.find(o => o.id === orderId);
    if (order) {
      setCartItems([...order.items]);
      setHeldOrders(prev => prev.filter(o => o.id !== orderId));
    }
  };

  const removeHeldOrder = (orderId: string) => {
    setHeldOrders(prev => prev.filter(o => o.id !== orderId));
  };

  // Inline HoldOrdersCard component
  const HoldOrdersCard = () => {
    if (heldOrders.length === 0) {
      return null;
    }

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            Held Orders ({heldOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {heldOrders.map((order) => (
            <div key={order.id} className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {order.type}
                  </Badge>
                  <span className="text-sm font-medium">{order.customerName}</span>
                </div>
                <span className="text-sm font-semibold">${order.total.toFixed(2)}</span>
              </div>
              
              <div className="text-xs text-muted-foreground mb-2">
                {order.items.length} items • {order.timestamp.toLocaleTimeString()}
              </div>
              
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs"
                  onClick={() => recallOrder(order.id)}
                  data-testid={`recall-order-${order.id}`}
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Recall
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive hover:text-destructive text-xs"
                  onClick={() => removeHeldOrder(order.id)}
                  data-testid={`remove-order-${order.id}`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  };

  return (
    <main className="p-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1">
          <ProductGrid
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            onAddToCart={addToCart}
          />
        </div>
        
        <div className="w-full lg:w-96">
          <HoldOrdersCard />
          <ShoppingCart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
            onHoldOrder={holdOrder}
          />
        </div>
      </div>
    </main>
  );
}
