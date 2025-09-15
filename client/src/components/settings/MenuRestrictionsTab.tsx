import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Home, ShoppingCart, Package, Users, UserCheck, 
  Truck, BarChart3, DollarSign, CreditCard, 
  Settings, Shield, UserCog, Crown
} from "lucide-react";

// Define menu items and their permissions
const menuItems = [
  { id: "dashboard", name: "Dashboard", icon: Home, path: "/dashboard" },
  { id: "pos", name: "Point of Sale", icon: ShoppingCart, path: "/pos" },
  { id: "products", name: "Products", icon: Package, path: "/products" },
  { id: "customers", name: "Customers", icon: Users, path: "/customers" },
  { id: "suppliers", name: "Suppliers", icon: Truck, path: "/suppliers" },
  { id: "inventory", name: "Inventory", icon: UserCheck, path: "/inventory" },
  { id: "reports", name: "Reports", icon: BarChart3, path: "/reports" },
  { id: "cashflow", name: "Cash Flow", icon: DollarSign, path: "/cashflow" },
  { id: "accounts-receivable", name: "Accounts Receivable", icon: CreditCard, path: "/accounts-receivable" },
  { id: "settings", name: "Settings", icon: Settings, path: "/settings" },
];

// Define role hierarchy and default permissions
const roles = [
  { 
    id: "kasir", 
    name: "Kasir", 
    icon: UserCheck, 
    color: "bg-blue-100 text-blue-800",
    defaultMenus: ["dashboard", "pos", "customers"]
  },
  { 
    id: "administrasi", 
    name: "Administrasi", 
    icon: UserCog, 
    color: "bg-green-100 text-green-800",
    defaultMenus: ["dashboard", "pos", "products", "customers", "suppliers", "inventory", "cashflow", "accounts-receivable"]
  },
  { 
    id: "owner", 
    name: "Owner", 
    icon: Crown, 
    color: "bg-purple-100 text-purple-800",
    defaultMenus: ["dashboard", "pos", "products", "customers", "suppliers", "inventory", "reports", "cashflow", "accounts-receivable"]
  },
  { 
    id: "administrator", 
    name: "Administrator", 
    icon: Shield, 
    color: "bg-red-100 text-red-800",
    defaultMenus: ["dashboard", "pos", "products", "customers", "suppliers", "inventory", "reports", "cashflow", "accounts-receivable", "settings"]
  }
];

export default function MenuRestrictionsTab() {
  const [permissions, setPermissions] = useState<Record<string, string[]>>(() => {
    // Initialize with default permissions for each role
    const defaultPermissions: Record<string, string[]> = {};
    roles.forEach(role => {
      defaultPermissions[role.id] = [...role.defaultMenus];
    });
    return defaultPermissions;
  });

  const { toast } = useToast();

  const handlePermissionChange = (roleId: string, menuId: string, checked: boolean) => {
    setPermissions(prev => ({
      ...prev,
      [roleId]: checked 
        ? [...(prev[roleId] || []), menuId]
        : (prev[roleId] || []).filter(id => id !== menuId)
    }));
  };

  const resetToDefaults = () => {
    const defaultPermissions: Record<string, string[]> = {};
    roles.forEach(role => {
      defaultPermissions[role.id] = [...role.defaultMenus];
    });
    setPermissions(defaultPermissions);
    toast({
      title: "Permissions Reset",
      description: "All role permissions have been reset to default values",
    });
  };

  const savePermissions = () => {
    // In a real application, this would save to the backend
    toast({
      title: "Permissions Saved",
      description: "Menu access permissions have been updated successfully",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Menu Access Restrictions</h3>
          <p className="text-sm text-muted-foreground">
            Configure which menu items each role can access in the system
          </p>
        </div>
        <div className="space-x-2">
          <Button variant="outline" onClick={resetToDefaults} data-testid="reset-defaults">
            Reset to Defaults
          </Button>
          <Button onClick={savePermissions} data-testid="save-permissions">
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {roles.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {role.name}
                  <Badge className={role.color}>
                    {permissions[role.id]?.length || 0} menus accessible
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {menuItems.map((menu) => {
                    const MenuIcon = menu.icon;
                    const isChecked = permissions[role.id]?.includes(menu.id) || false;
                    
                    return (
                      <div key={menu.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`${role.id}-${menu.id}`}
                          checked={isChecked}
                          onCheckedChange={(checked) => 
                            handlePermissionChange(role.id, menu.id, checked as boolean)
                          }
                          data-testid={`permission-${role.id}-${menu.id}`}
                        />
                        <label 
                          htmlFor={`${role.id}-${menu.id}`}
                          className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          <MenuIcon className="w-4 h-4" />
                          {menu.name}
                        </label>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h4 className="font-semibold mb-2">Role Hierarchy & Descriptions:</h4>
          <div className="space-y-2 text-sm text-muted-foreground">
            <div><strong>Kasir:</strong> Basic cashier with POS access and customer management</div>
            <div><strong>Administrasi:</strong> Administrative staff with product and cash flow management</div>
            <div><strong>Owner:</strong> Business owner with full operational access except system settings</div>
            <div><strong>Administrator:</strong> Super admin with complete system access including settings</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}