import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import CustomerModal from "@/components/customers/CustomerModal";
import { type Customer } from "@shared/schema";

export default function Customers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: customers = [], isLoading } = useQuery({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  const deleteCustomerMutation = useMutation({
    mutationFn: async (customerId: string) => {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to delete customer");
    },
    onSuccess: () => {
      toast({
        title: "Customer deleted",
        description: "Customer has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
    },
    onError: (error) => {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete customer",
        variant: "destructive",
      });
    },
  });

  const filteredCustomers = customers.filter((customer: Customer) => {
    const fullName = `${customer.firstName} ${customer.lastName}`.toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    return fullName.includes(searchLower) || 
           customer.email?.toLowerCase().includes(searchLower) ||
           customer.phone?.toLowerCase().includes(searchLower);
  });

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsModalOpen(true);
  };

  const handleDelete = (customerId: string) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      deleteCustomerMutation.mutate(customerId);
    }
  };

  const handleAddCustomer = () => {
    setEditingCustomer(null);
    setIsModalOpen(true);
  };

  const toggleCustomerSelection = (customerId: string) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedCustomers(prev =>
      prev.length === filteredCustomers.length ? [] : filteredCustomers.map(c => c.id)
    );
  };

  if (isLoading) {
    return (
      <main className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Customer Management</h1>
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
        <h1 className="text-2xl font-bold text-foreground">Customer Management</h1>
        <Button onClick={handleAddCustomer} data-testid="button-add-customer">
          <i className="fas fa-plus mr-2"></i>
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="relative max-w-md">
            <Input
              type="text"
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              data-testid="search-customers"
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
                <p className="text-muted-foreground text-sm font-medium">Total Customers</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-customers">
                  {customers.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-blue-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">With Email</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-customers-with-email">
                  {customers.filter((c: Customer) => c.email).length}
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
                <p className="text-muted-foreground text-sm font-medium">Total Loyalty Points</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-loyalty-points">
                  {customers.reduce((sum: number, c: Customer) => sum + c.loyaltyPoints, 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-star text-purple-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCustomers.length === filteredCustomers.length && filteredCustomers.length > 0}
                      onCheckedChange={toggleSelectAll}
                      data-testid="select-all-customers"
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Loyalty Points</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer: Customer) => (
                  <TableRow key={customer.id} data-testid={`customer-row-${customer.id}`}>
                    <TableCell>
                      <Checkbox
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={() => toggleCustomerSelection(customer.id)}
                        data-testid={`select-customer-${customer.id}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-xs text-primary-foreground font-medium">
                            {customer.firstName.charAt(0)}{customer.lastName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`customer-name-${customer.id}`}>
                            {customer.firstName} {customer.lastName}
                          </p>
                          {customer.address && (
                            <p className="text-sm text-muted-foreground">{customer.address}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell data-testid={`customer-email-${customer.id}`}>
                      {customer.email || "No email"}
                    </TableCell>
                    <TableCell data-testid={`customer-phone-${customer.id}`}>
                      {customer.phone || "No phone"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" data-testid={`customer-loyalty-${customer.id}`}>
                        {customer.loyaltyPoints} points
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(customer)}
                          data-testid={`edit-customer-${customer.id}`}
                        >
                          <i className="fas fa-edit text-blue-600"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`view-customer-${customer.id}`}
                        >
                          <i className="fas fa-eye text-green-600"></i>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(customer.id)}
                          data-testid={`delete-customer-${customer.id}`}
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
          
          {filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-users text-4xl text-muted-foreground mb-4"></i>
              <h3 className="text-lg font-medium text-foreground mb-2">No customers found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "Try adjusting your search terms"
                  : "Get started by adding your first customer"}
              </p>
              <Button onClick={handleAddCustomer}>
                <i className="fas fa-plus mr-2"></i>
                Add Customer
              </Button>
            </div>
          )}
          
          {/* Pagination */}
          {filteredCustomers.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Showing {filteredCustomers.length} of {customers.length} customers
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

      {/* Customer Modal */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCustomer(null);
        }}
        customer={editingCustomer}
      />
    </main>
  );
}
