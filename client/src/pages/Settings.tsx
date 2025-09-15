import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Printer, Settings as SettingsIcon } from "lucide-react";
import UsersTab from "@/components/settings/UsersTab";
import PrinterTab from "@/components/settings/PrinterTab";

export default function Settings() {
  const [activeTab, setActiveTab] = useState("users");

  return (
    <main className="p-6 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon className="w-6 h-6" />
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                User Management
              </TabsTrigger>
              <TabsTrigger value="printer" className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Printer Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="mt-6">
              <UsersTab />
            </TabsContent>
            
            <TabsContent value="printer" className="mt-6">
              <PrinterTab />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </main>
  );
}