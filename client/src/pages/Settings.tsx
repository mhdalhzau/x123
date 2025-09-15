import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Printer, Settings as SettingsIcon, ShieldAlert, Shield } from "lucide-react";
import { useAuth } from "@/lib/auth";
import UsersTab from "@/components/settings/UsersTab";
import PrinterTab from "@/components/settings/PrinterTab";
import MenuRestrictionsTab from "@/components/settings/MenuRestrictionsTab";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("users");
  const { user } = useAuth();

  // Administrator-only access
  if (user?.role !== "administrator") {
    return (
      <main className="p-6 animate-fade-in">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <ShieldAlert className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Access Denied</h1>
          <p className="text-muted-foreground text-center max-w-md">
            You don't have permission to access this page. Only administrators can manage system settings.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="printer" className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Printer Settings
              </TabsTrigger>
              <TabsTrigger value="menu-restrictions" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Menu Restrictions
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="mt-6">
              <UsersTab />
            </TabsContent>
            
            <TabsContent value="printer" className="mt-6">
              <PrinterTab />
            </TabsContent>
            
            <TabsContent value="menu-restrictions" className="mt-6">
              <MenuRestrictionsTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}