import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Search, User, LogOut } from "lucide-react";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/pos": "Point of Sale",
  "/products": "Product Management",
  "/inventory": "Inventory Management",
  "/customers": "Customer Management",
  "/suppliers": "Supplier Management",
  "/reports": "Reports & Analytics",
  "/users": "User Management",
};

export default function Header() {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  const currentTitle = pageTitles[location] || "Dashboard";

  return (
    <header className="bg-card border-b border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground" data-testid="page-title">
            {currentTitle}
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="bg-input border border-border rounded-lg px-4 py-2 pl-10 focus:ring-2 focus:ring-ring focus:border-transparent"
              data-testid="search-input"
            />
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm font-medium" data-testid="user-name">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-muted-foreground capitalize" data-testid="user-role">
                {user?.role}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={logout}
              data-testid="logout-button"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
