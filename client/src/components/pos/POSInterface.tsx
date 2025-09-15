import { useState } from "react";
import ProductGrid from "./ProductGrid";
import ShoppingCart from "./ShoppingCart";
import { type Product } from "@shared/schema";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export default function POSInterface() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
          <ShoppingCart
            items={cartItems}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeItem}
            onClearCart={clearCart}
          />
        </div>
      </div>
    </main>
  );
}
