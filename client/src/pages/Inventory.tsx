import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { type Product } from "@shared/schema";

export default function Inventory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: "",
    reason: "",
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: async () => {
      const response = await fetch("/api/categories", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  const { data: lowStockProducts = [] } = useQuery({
    queryKey: ["/api/products/low-stock"],
    queryFn: async () => {
      const response = await fetch("/api/products/low-stock", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch low stock products");
      return response.json();
    },
  });

  const adjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/inventory/adjustment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to process adjustment");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Inventory adjusted",
        description: "Stock levels have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/products/low-stock"] });
      setIsAdjustmentModalOpen(false);
      setSelectedProduct(null);
      setAdjustmentData({ quantity: "", reason: "" });
    },
    onError: (error) => {
      toast({
        title: "Adjustment failed",
        description: error instanceof Error ? error.message : "Failed to adjust inventory",
        variant: "destructive",
      });
    },
  });

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.categoryId === selectedCategory;
    
    return matchesSearch && matchesCategory && product.isActive;
  });

  const totalValue = products.reduce((sum: number, product: Product) => 
    sum + (product.stock * parseFloat(product.purchasePrice)), 0
  );

  const handleAdjustStock = (product: Product) => {
    setSelectedProduct(product);
    setIsAdjustmentModalOpen(true);
  };

  const handleAdjustmentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedProduct) return;

    const quantity = parseInt(adjustmentData.quantity);
    if (isNaN(quantity) || quantity === 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    adjustmentMutation.mutate({
      productId: selectedProduct.id,
      quantity,
      reason: adjustmentData.reason || "Manual adjustment",
    });
  };

  const getStockStatusColor = (product: Product) => {
    if (product.stock === 0) return "bg-red-100 text-red-800";
    if (product.stock <= product.minStockLevel) return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStockStatusText = (product: Product) => {
    if (product.stock === 0) return "Out of Stock";
    if (product.stock <= product.minStockLevel) return "Low Stock";
    return "In Stock";
  };

  if (isLoading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card>
          <CardContent className="p-0">
            <div className="animate-pulse space-y-4 p-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-muted rounded"></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-products">
                  {products.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-box text-blue-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Low Stock Items</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-low-stock">
                  {lowStockProducts.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-yellow-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Out of Stock</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-out-of-stock">
                  {products.filter((p: Product) => p.stock === 0).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-times-circle text-red-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Value</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-value">
                  ${totalValue.toFixed(2)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="search-inventory"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger data-testid="filter-category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category: any) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="secondary" data-testid="button-export">
              <i className="fas fa-download mr-2"></i>
              Export Report
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Current Stock</TableHead>
                  <TableHead>Min Level</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product: Product) => {
                  const category = categories.find((c: any) => c.id === product.categoryId);
                  const value = product.stock * parseFloat(product.purchasePrice);
                  
                  return (
                    <TableRow key={product.id} data-testid={`inventory-row-${product.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center">
                            <i className="fas fa-box text-blue-600"></i>
                          </div>
                          <div>
                            <p className="font-medium" data-testid={`product-name-${product.id}`}>
                              {product.name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {product.brand || "No brand"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm" data-testid={`product-sku-${product.id}`}>
                        {product.sku}
                      </TableCell>
                      <TableCell data-testid={`product-category-${product.id}`}>
                        {category?.name || "Uncategorized"}
                      </TableCell>
                      <TableCell>
                        <span className={product.stock <= product.minStockLevel ? "text-yellow-600 font-semibold" : ""}>
                          {product.stock}
                        </span>
                      </TableCell>
                      <TableCell>{product.minStockLevel}</TableCell>
                      <TableCell className="font-semibold" data-testid={`product-value-${product.id}`}>
                        ${value.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <Badge className={getStockStatusColor(product)}>
                          {getStockStatusText(product)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAdjustStock(product)}
                            data-testid={`adjust-stock-${product.id}`}
                          >
                            <i className="fas fa-edit text-blue-600"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`view-movements-${product.id}`}
                          >
                            <i className="fas fa-history text-green-600"></i>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-warehouse text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedCategory !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "No products available in inventory"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Adjustment Modal */}
      <Dialog open={isAdjustmentModalOpen} onOpenChange={setIsAdjustmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock - {selectedProduct?.name}</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
            <div>
              <Label>Current Stock: {selectedProduct?.stock} units</Label>
            </div>
            
            <div>
              <Label htmlFor="quantity">Adjustment Quantity*</Label>
              <Input
                id="quantity"
                type="number"
                value={adjustmentData.quantity}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, quantity: e.target.value }))}
                placeholder="Enter + for increase, - for decrease"
                required
                data-testid="input-adjustment-quantity"
              />
              <p className="text-sm text-muted-foreground mt-1">
                Use positive numbers to increase stock, negative to decrease
              </p>
            </div>
            
            <div>
              <Label htmlFor="reason">Reason*</Label>
              <Input
                id="reason"
                value={adjustmentData.reason}
                onChange={(e) => setAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for adjustment"
                required
                data-testid="input-adjustment-reason"
              />
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1" 
                disabled={adjustmentMutation.isPending}
                data-testid="button-save-adjustment"
              >
                {adjustmentMutation.isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Save Adjustment"
                )}
              </Button>
              <Button 
                type="button" 
                variant="secondary" 
                onClick={() => setIsAdjustmentModalOpen(false)}
                data-testid="button-cancel-adjustment"
              >
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </main>
  );
}
