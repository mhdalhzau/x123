import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth";
import { type Product } from "@shared/schema";
import { Search, Scan, Headphones, Smartphone, Laptop, Mouse, Keyboard, Package } from "lucide-react";

interface ProductGridProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
  onAddToCart: (product: Product) => void;
}

const categories = [
  { id: "all", name: "All" },
  { id: "electronics", name: "Electronics" },
  { id: "accessories", name: "Accessories" },
  { id: "clothing", name: "Clothing" },
  { id: "home", name: "Home" },
];

export default function ProductGrid({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  onAddToCart,
}: ProductGridProps) {
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

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch && product.isActive;
  });

  const getProductIcon = (name: string) => {
    const nameLower = name.toLowerCase();
    if (nameLower.includes("headphone")) return Headphones;
    if (nameLower.includes("phone") || nameLower.includes("case")) return Smartphone;
    if (nameLower.includes("laptop") || nameLower.includes("stand")) return Laptop;
    if (nameLower.includes("mouse")) return Mouse;
    if (nameLower.includes("keyboard")) return Keyboard;
    return Package;
  };

  const getProductGradient = (index: number) => {
    const gradients = [
      "from-blue-100 to-purple-100",
      "from-green-100 to-blue-100",
      "from-purple-100 to-pink-100",
      "from-orange-100 to-red-100",
      "from-yellow-100 to-orange-100",
    ];
    return gradients[index % gradients.length];
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-10 bg-muted rounded"></div>
              <div className="flex gap-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-8 w-20 bg-muted rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-4">
                <div className="h-32 bg-muted rounded mb-3"></div>
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-3 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Search products or scan barcode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12"
                data-testid="product-search"
              />
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            </div>
            <Button className="px-6" data-testid="button-scan">
              <Scan className="mr-2 w-4 h-4" />
              Scan
            </Button>
          </div>
          
          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className="whitespace-nowrap"
                data-testid={`category-${category.id}`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredProducts.map((product: Product, index: number) => (
          <Card
            key={product.id}
            className={`hover:shadow-md transition-shadow ${
              parseFloat(product.stock) <= 0 
                ? "opacity-50 cursor-not-allowed" 
                : "cursor-pointer"
            }`}
            onClick={() => parseFloat(product.stock) > 0 && onAddToCart(product)}
            data-testid={`product-${product.sku}`}
          >
            <CardContent className="p-4">
              <div className={`w-full h-32 bg-gradient-to-br ${getProductGradient(index)} rounded-lg mb-3 flex items-center justify-center`}>
                {(() => {
                  const IconComponent = getProductIcon(product.name);
                  return <IconComponent className="w-12 h-12 text-gray-700" />;
                })()}
              </div>
              <h4 className="font-medium text-foreground mb-1" data-testid={`product-name-${product.id}`}>
                {product.name}
              </h4>
              <p className="text-sm text-muted-foreground mb-2">SKU: {product.sku}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-foreground" data-testid={`product-price-${product.id}`}>
                  ${product.sellingPrice}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  parseFloat(product.stock) <= 0
                    ? "bg-red-100 text-red-800"
                    : parseFloat(product.stock) > parseFloat(product.minStockLevel) 
                    ? "bg-green-100 text-green-800" 
                    : "bg-yellow-100 text-yellow-800"
                }`}>
                  {parseFloat(product.stock) <= 0 
                    ? "Out of Stock" 
                    : parseFloat(product.stock) > parseFloat(product.minStockLevel) 
                    ? "In Stock" 
                    : "Low Stock"}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Search className="w-16 h-16 text-muted-foreground mb-4 mx-auto" />
            <h3 className="text-lg font-medium text-foreground mb-2">No products found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms or browse all products
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
