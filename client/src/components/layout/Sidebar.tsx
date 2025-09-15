import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: "fas fa-tachometer-alt" },
  { name: "Point of Sale", href: "/pos", icon: "fas fa-cash-register" },
  { name: "Products", href: "/products", icon: "fas fa-box" },
  { name: "Inventory", href: "/inventory", icon: "fas fa-warehouse" },
  { name: "Customers", href: "/customers", icon: "fas fa-users" },
  { name: "Suppliers", href: "/suppliers", icon: "fas fa-truck" },
  { name: "Reports", href: "/reports", icon: "fas fa-chart-bar" },
  { name: "Users", href: "/users", icon: "fas fa-user-cog" },
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
    if (item.href === "/users") {
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
              <i className="fas fa-star text-primary-foreground text-lg"></i>
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
                <i className={`${item.icon} w-5 text-center`}></i>
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
        <i className="fas fa-bars text-xl"></i>
      </button>
    </>
  );
}
