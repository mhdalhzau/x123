import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { type User } from "@shared/schema";

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

export default function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    firstName: "",
    lastName: "",
    email: "",
    role: "cashier",
    isActive: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        password: "", // Don't show existing password
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
      });
    } else {
      setFormData({
        username: "",
        password: "",
        firstName: "",
        lastName: "",
        email: "",
        role: "cashier",
        isActive: true,
      });
    }
  }, [user, isOpen]);

  const saveUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      const url = user ? `/api/users/${user.id}` : "/api/users";
      const method = user ? "PUT" : "POST";
      
      // Don't include password in update if it's empty
      const dataToSend = { ...userData };
      if (user && !dataToSend.password) {
        delete dataToSend.password;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(dataToSend),
      });
      
      if (!response.ok) throw new Error("Failed to save user");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: user ? "User updated" : "User created",
        description: `User has been successfully ${user ? "updated" : "created"}`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Save failed",
        description: error instanceof Error ? error.message : "Failed to save user",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user && !formData.password) {
      toast({
        title: "Password required",
        description: "Password is required for new users",
        variant: "destructive",
      });
      return;
    }

    saveUserMutation.mutate(formData);
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {user ? "Edit User" : "Add New User"}
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
              <Label htmlFor="username">Username*</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => handleInputChange("username", e.target.value)}
                placeholder="Enter username"
                required
                data-testid="input-username"
              />
            </div>
            <div>
              <Label htmlFor="email">Email*</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="Enter email address"
                required
                data-testid="input-email"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="password">
                Password{!user && "*"}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder={user ? "Leave blank to keep current" : "Enter password"}
                required={!user}
                data-testid="input-password"
              />
            </div>
            <div>
              <Label htmlFor="role">Role*</Label>
              <Select value={formData.role} onValueChange={(value) => handleInputChange("role", value)}>
                <SelectTrigger data-testid="select-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked)}
              data-testid="switch-active"
            />
            <Label htmlFor="isActive">User is active</Label>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={saveUserMutation.isPending}
              data-testid="button-save-user"
            >
              {saveUserMutation.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </>
              ) : (
                user ? "Update User" : "Save User"
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
