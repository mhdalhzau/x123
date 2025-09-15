import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { type Supplier } from "@shared/schema";

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplier?: Supplier | null;
}

export default function SupplierModal({ isOpen, onClose, supplier }: SupplierModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    contactPerson: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        email: supplier.email || "",
        phone: supplier.phone || "",
        address: supplier.address || "",
        contactPerson: supplier.contactPerson || "",
      });
    } else {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: "",
        contactPerson: "",
      });
    }
  }, [supplier, isOpen]);

  const saveSupplierMutation = useMutation({
    mutationFn: async (supplierData: any) => {
      const url = supplier ? `/api/suppliers/${supplier.id}` : "/api/suppliers";
      const method = supplier ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(supplierData),
      });
      
      if (!response.ok) throw new Error("Failed to save supplier");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: supplier ? "Supplier updated" : "Supplier created",
        description: `Supplier has been successfully ${supplier ? "updated" : "created"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/suppliers"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save supplier",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const supplierData = {
      ...formData,
      email: formData.email || null,
      phone: formData.phone || null,
      address: formData.address || null,
      contactPerson: formData.contactPerson || null,
    };

    saveSupplierMutation.mutate(supplierData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Edit Supplier" : "Add New Supplier"}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Company Name*</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter company name"
              required
              data-testid="input-supplier-name"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contactPerson">Contact Person</Label>
              <Input
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange("contactPerson", e.target.value)}
                placeholder="Enter contact person name"
                data-testid="input-contact-person"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                data-testid="input-supplier-email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => handleInputChange("phone", e.target.value)}
              placeholder="Enter phone number"
              data-testid="input-supplier-phone"
            />
          </div>

          <div>
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange("address", e.target.value)}
              placeholder="Enter supplier address"
              rows={3}
              data-testid="input-supplier-address"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={saveSupplierMutation.isPending}
              data-testid="button-save-supplier"
            >
              {saveSupplierMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                supplier ? "Update Supplier" : "Save Supplier"
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
