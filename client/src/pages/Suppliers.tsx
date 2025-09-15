import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import SupplierModal from "@/components/suppliers/SupplierModal";
import { type Supplier } from "@shared/schema";

export default function Suppliers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const response = await fetch("/api/suppliers", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch suppliers");
      return response.json();
    },
  });

  const deleteSupplierMutation = useMutation({
    mutationFn: async (supplierId: string) => {
      const response = await fetch(`/api/suppliers/${supplierId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete supplier");
    },
    onSuccess: () => {
      toast({
        title: "Supplier deleted",
        description: "Supplier has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete supplier",
        variant: "destructive",
      });
    },
  });

  const filteredSuppliers = suppliers.filter((supplier: Supplier) => {
    const searchLower = searchTerm.toLowerCase();
    return supplier.name.toLowerCase().includes(searchLower) || 
           supplier.email?.toLowerCase().includes(searchLower) ||
           supplier.phone?.toLowerCase().includes(searchLower) ||
           supplier.contactPerson?.toLowerCase().includes(searchLower);
  });

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleDelete = (supplierId: string) => {
    if (confirm("Are you sure you want to delete this supplier?")) {
      deleteSupplierMutation.mutate(supplierId);
    }
  };

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    setIsModalOpen(true);
  };

  const toggleSupplierSelection = (supplierId: string) => {
    setSelectedSuppliers(prev =>
      prev.includes(supplierId)
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedSuppliers(prev =>
      prev.length === filteredSuppliers.length ? [] : filteredSuppliers.map(s => s.id)
    );
  };

  if (isLoading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Supplier Management</h1>
          <Button disabled>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
            Loading...
          </Button>
        </div>
        
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="animate-pulse">
              <div className="h-10 bg-muted rounded mb-4"></div>
            </div>
          </CardContent>
        </Card>
        
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
        <h1 className="text-2xl font-bold text-foreground">Supplier Management</h1>
        <Button onClick={handleAddSupplier} data-testid="button-add-supplier">
          <i className="fas fa-plus mr-2"></i>
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder="Search suppliers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-suppliers"
            />
            <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"></i>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Total Suppliers</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-suppliers">
                  {suppliers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-truck text-orange-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">With Email</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-suppliers-with-email">
                  {suppliers.filter((s: Supplier) => s.email).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-envelope text-green-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">With Contact Person</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-suppliers-with-contact">
                  {suppliers.filter((s: Supplier) => s.contactPerson).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-tie text-blue-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedSuppliers.length === filteredSuppliers.length && filteredSuppliers.length > 0}
                      onCheckedChange={toggleSelectAll}
                      data-testid="select-all-suppliers"
                    />
                  </TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier: Supplier) => (
                  <TableRow key={supplier.id} data-testid={`supplier-row-${supplier.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedSuppliers.includes(supplier.id)}
                        onCheckedChange={() => toggleSupplierSelection(supplier.id)}
                        data-testid={`select-supplier-${supplier.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-truck text-orange-600"></i>
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`supplier-name-${supplier.id}`}>
                            {supplier.name}
                          </p>
                          {supplier.address && (
                            <p className="text-sm text-muted-foreground">{supplier.address}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`supplier-contact-${supplier.id}`}>
                      {supplier.contactPerson || "Not specified"}
                    </TableCell>
                    <TableCell data-testid={`supplier-email-${supplier.id}`}>
                      {supplier.email || "No email"}
                    </TableCell>
                    <TableCell data-testid={`supplier-phone-${supplier.id}`}>
                      {supplier.phone || "No phone"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(supplier)}
                          data-testid={`edit-supplier-${supplier.id}`}
                        >
                          <i className="fas fa-edit text-blue-600"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`view-supplier-${supplier.id}`}
                        >
                          <i className="fas fa-eye text-green-600"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(supplier.id)}
                          data-testid={`delete-supplier-${supplier.id}`}
                        >
                          <i className="fas fa-trash text-red-600"></i>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {filteredSuppliers.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-truck text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium text-foreground mb-2">No suppliers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first supplier"}
              </p>
              <Button onClick={handleAddSupplier}>
                <i className="fas fa-plus mr-2"></i>
                Add Supplier
              </Button>
            </div>
          )}
          
          {/* Pagination */}
          {filteredSuppliers.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {filteredSuppliers.length} of {suppliers.length} suppliers
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
                <Button variant="default" size="sm">
                  1
                </Button>
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingSupplier(null);
        }}
        supplier={editingSupplier}
      />
    </main>
  );
}
