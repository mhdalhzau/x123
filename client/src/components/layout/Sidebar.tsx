import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Warehouse, 
  Users, 
  Truck, 
  BarChart3, 
  Settings, 
  Star, 
  Menu,
  DollarSign,
  CreditCard
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Point of Sale", href: "/pos", icon: ShoppingCart },
  { name: "Products", href: "/products", icon: Package },
  { name: "Inventory", href: "/inventory", icon: Warehouse },
  { name: "Customers", href: "/customers", icon: Users },
  { name: "Suppliers", href: "/suppliers", icon: Truck },
  { name: "Cash Flow", href: "/cashflow", icon: DollarSign },
  { name: "Accounts Receivable", href: "/accounts-receivable", icon: CreditCard },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === href;
  };

  const filteredNavigation = navigation.filter(item => {
    if (item.href === "/settings") {
      return user?.role === "admin";
    }
    return true;
  });

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`sidebar sidebar-gradient w-64 min-h-screen fixed left-0 top-0 z-50 md:relative md:translate-x-0 ${isOpen ? 'open' : ''}`}>
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Star className="text-primary-foreground w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-bold text-xl" data-testid="app-title">StarPOS</h2>
              <p className="text-gray-400 text-sm">Point of Sale</p>
            </div>
          </div>
          
          {/* Navigation Menu */}
          <nav className="space-y-2">
            {filteredNavigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
                data-testid={`nav-${item.href.replace('/', '')}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Mobile menu button */}
      <button
        className="md:hidden fixed top-4 left-4 z-60 text-foreground bg-card p-2 rounded-lg shadow-lg"
        onClick={() => setIsOpen(!isOpen)}
        data-testid="mobile-menu-button"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  );
}
