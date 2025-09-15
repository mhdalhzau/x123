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

interface HoldOrdersCardProps {
  heldOrders: HeldOrder[];
  onRecallOrder: (orderId: string) => void;
  onRemoveOrder: (orderId: string) => void;
}

export default function HoldOrdersCard({ 
  heldOrders, 
  onRecallOrder, 
  onRemoveOrder 
}: HoldOrdersCardProps) {
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
                onClick={() => onRecallOrder(order.id)}
                data-testid={`recall-order-${order.id}`}
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Recall
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="text-destructive hover:text-destructive text-xs"
                onClick={() => onRemoveOrder(order.id)}
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
}