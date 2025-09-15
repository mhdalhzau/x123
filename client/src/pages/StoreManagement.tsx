import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { insertStoreSchema, type Store, type InsertStore } from "@shared/schema";
import { z } from "zod";

// Form schema that ensures all fields are strings for proper form handling
const storeFormSchema = z.object({
  name: z.string().min(1, "Store name is required"),
  address: z.string().optional().default(""),
  phone: z.string().optional().default(""),
  email: z.string().email().optional().or(z.literal("")).default(""),
  description: z.string().optional().default(""),
  isActive: z.boolean().default(true),
});

type StoreFormData = z.infer<typeof storeFormSchema>;
import { apiRequest } from "@/lib/queryClient";
import { Store as StoreIcon, Plus, Edit, MapPin, Phone, Mail, Building } from "lucide-react";

export function StoreManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ['/api/stores'],
  });

  const form = useForm<StoreFormData>({
    resolver: zodResolver(storeFormSchema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      isActive: true,
    },
  });

  const createStoreMutation = useMutation({
    mutationFn: (data: StoreFormData) => {
      // Convert form data to InsertStore format
      const storeData: InsertStore = {
        ...data,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        description: data.description || null,
      };
      return apiRequest('/api/stores', 'POST', storeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      setIsDialogOpen(false);
      setEditingStore(null);
      form.reset();
      toast({
        title: "Success",
        description: editingStore ? "Store updated successfully" : "Store created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to save store",
        variant: "destructive",
      });
    },
  });

  const updateStoreMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: StoreFormData }) => {
      // Convert form data to InsertStore format
      const storeData: Partial<InsertStore> = {
        ...data,
        address: data.address || null,
        phone: data.phone || null,
        email: data.email || null,
        description: data.description || null,
      };
      return apiRequest(`/api/stores/${id}`, 'PATCH', storeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/stores'] });
      setIsDialogOpen(false);
      setEditingStore(null);
      form.reset();
      toast({
        title: "Success",
        description: "Store updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update store",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: StoreFormData) => {
    if (editingStore) {
      updateStoreMutation.mutate({ id: editingStore.id, data });
    } else {
      createStoreMutation.mutate(data);
    }
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    form.reset({
      name: store.name,
      address: store.address ?? "",
      phone: store.phone ?? "",
      email: store.email ?? "",
      description: store.description ?? "",
      isActive: store.isActive,
    });
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setEditingStore(null);
    form.reset({
      name: "",
      address: "",
      phone: "",
      email: "",
      description: "",
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading stores...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Store Management</h1>
          <p className="text-muted-foreground">
            Manage your store locations and settings
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddNew} data-testid="add-store-button">
              <Plus className="mr-2 h-4 w-4" />
              Add Store
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingStore ? "Edit Store" : "Add New Store"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Store Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Main Store" {...field} data-testid="store-name-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Store address" {...field} data-testid="store-address-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="+62-123-456-7890" {...field} data-testid="store-phone-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="store@example.com" {...field} data-testid="store-email-input" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Store description" {...field} data-testid="store-description-input" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createStoreMutation.isPending || updateStoreMutation.isPending}
                    data-testid="save-store-button"
                  >
                    {editingStore ? "Update Store" : "Create Store"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stores.map((store) => (
          <Card key={store.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <StoreIcon className="h-5 w-5" />
                  {store.name}
                </CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleEdit(store)}
                  data-testid={`edit-store-${store.id}`}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
              {!store.isActive && (
                <div className="absolute top-2 right-2">
                  <div className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded">
                    Inactive
                  </div>
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {store.address && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{store.address}</span>
                </div>
              )}
              
              {store.phone && (
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{store.phone}</span>
                </div>
              )}
              
              {store.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{store.email}</span>
                </div>
              )}
              
              {store.description && (
                <div className="flex items-start gap-2 text-sm">
                  <Building className="h-4 w-4 mt-0.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{store.description}</span>
                </div>
              )}
              
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Created: {new Date(store.createdAt).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stores.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <StoreIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <CardTitle className="mb-2">No stores found</CardTitle>
            <CardDescription className="text-center mb-4">
              Get started by creating your first store location
            </CardDescription>
            <Button onClick={handleAddNew}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Store
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}