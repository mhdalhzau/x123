import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { type Customer } from "@shared/schema";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
}

export default function CustomerModal({ isOpen, onClose, customer }: CustomerModalProps) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    loyaltyPoints: "0",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (customer) {
      setFormData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        loyaltyPoints: customer.loyaltyPoints.toString(),
      });
    } else {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        address: "",
        loyaltyPoints: "0",
      });
    }
  }, [customer, isOpen]);

  const saveCustomerMutation = useMutation({
    mutationFn: async (customerData: any) => {
      const url = customer ? `/api/customers/${customer.id}` : "/api/customers";
      const method = customer ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(customerData),
      });
      
      if (!response.ok) throw new Error("Failed to save customer");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: customer ? "Customer updated" : "Customer created",
        description: `Customer has been successfully ${customer ? "updated" : "created"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save customer",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const customerData = {
      ...formData,
      loyaltyPoints: parseInt(formData.loyaltyPoints) || 0,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
    };

    saveCustomerMutation.mutate(customerData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name*</Label>
              <Input
                id="firstName"
                value={formData.firstName}
                onChange={(e) => handleInputChange("firstName", e.target.value)}
                placeholder="Enter first name"
                required
                data-testid="input-first-name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name*</Label>
              <Input
                id="lastName"
                value={formData.lastName}
                onChange={(e) => handleInputChange("lastName", e.target.value)}
                placeholder="Enter last name"
                required
                data-testid="input-last-name"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                data-testid="input-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="Enter phone number"
                data-testid="input-phone"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter customer address"
              rows={3}
              data-testid="input-address"
            />
          </div>

          <div>
            <Label htmlFor="loyaltyPoints">Loyalty Points</Label>
            <Input
              id="loyaltyPoints"
              type="number"
              value={formData.loyaltyPoints}
              onChange={(e) => handleInputChange("loyaltyPoints", e.target.value)}
              placeholder="0"
              data-testid="input-loyalty-points"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={saveCustomerMutation.isPending}
              data-testid="button-save-customer"
            >
              {saveCustomerMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                customer ? "Update Customer" : "Save Customer"
              )}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={onClose}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
