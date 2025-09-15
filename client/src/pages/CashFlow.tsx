import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { 
  TrendingUp, TrendingDown, DollarSign, Plus, Calendar, Receipt, 
  Package, User, CreditCard, Camera, StickyNote, Calculator,
  UserPlus, FileText, Clock
} from "lucide-react";

interface CashFlowCategory {
  id: string;
  name: string;
  type: "income" | "expense";
  description?: string;
  isActive: boolean;
}

interface Product {
  id: string;
  name: string;
  sellingPrice: string;
  purchasePrice: string;
  stock: string;
}

interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

interface CashFlowEntry {
  id: string;
  type: "income" | "expense";
  amount: string;
  description: string;
  category: string;
  categoryId?: string;
  productId?: string;
  quantity?: string;
  costPrice?: string;
  paymentStatus: "paid" | "unpaid";
  customerId?: string;
  photoEvidence?: string;
  notes?: string;
  isManualEntry: boolean;
  saleId?: string;
  date: string;
  userId: string;
}

interface TodayStats {
  totalSales: number;
  salesCount: number;
  totalIncome: number;
  totalExpenses: number;
  netFlow: number;
}

export default function CashFlow() {
  // Form state
  const [entryType, setEntryType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [customerId, setCustomerId] = useState("");
  const [notes, setNotes] = useState("");
  const [entryDate, setEntryDate] = useState(new Date().toISOString().split('T')[0]);
  const [calculationMode, setCalculationMode] = useState<"manual" | "product">("manual");
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  
  // New customer form
  const [newCustomerFirstName, setNewCustomerFirstName] = useState("");
  const [newCustomerLastName, setNewCustomerLastName] = useState("");
  const [newCustomerEmail, setNewCustomerEmail] = useState("");
  const [newCustomerPhone, setNewCustomerPhone] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch today's stats including sales
  const { data: todayStats } = useQuery<TodayStats>({
    queryKey: ["/api/cashflow/today"],
    queryFn: async () => {
      const response = await fetch("/api/cashflow/today", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch today's stats");
      return response.json();
    },
  });

  // Fetch cash flow entries
  const { data: entries = [] } = useQuery<CashFlowEntry[]>({
    queryKey: ["/api/cashflow/entries"],
    queryFn: async () => {
      const response = await fetch("/api/cashflow/entries", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch cash flow entries");
      return response.json();
    },
  });

  // Add cash flow entry mutation
  const addEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/cashflow/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add cash flow entry");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Entry added successfully",
        description: "Cash flow entry has been recorded",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow/today"] });
      resetForm();
    },
    onError: (error) => {
      toast({
        title: "Failed to add entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  // Add customer mutation
  const addCustomerMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/customers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to add customer");
      return response.json();
    },
    onSuccess: (newCustomer) => {
      toast({
        title: "Customer added successfully",
        description: "Customer has been created and selected",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/customers"] });
      setCustomerId(newCustomer.id);
      setShowCustomerForm(false);
      setNewCustomerFirstName("");
      setNewCustomerLastName("");
      setNewCustomerEmail("");
      setNewCustomerPhone("");
    },
    onError: (error) => {
      toast({
        title: "Failed to add customer",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCategoryId("");
    setProductId("");
    setQuantity("");
    setCostPrice("");
    setPaymentStatus("paid");
    setCustomerId("");
    setNotes("");
    setEntryDate(new Date().toISOString().split('T')[0]);
    setCalculationMode("manual");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !categoryId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (paymentStatus === "unpaid" && !customerId) {
      toast({
        title: "Customer required",
        description: "Please select a customer for unpaid transactions",
        variant: "destructive",
      });
      return;
    }

    const selectedCategory = categories.find(c => c.id === categoryId);
    const entryData = {
      type: entryType,
      amount,
      description,
      category: selectedCategory?.name || "",
      categoryId,
      productId: productId || null,
      quantity: quantity || null,
      costPrice: costPrice || null,
      paymentStatus,
      customerId: customerId || null,
      notes: notes || null,
      date: new Date(entryDate).toISOString(),
      isManualEntry: true,
    };

    addEntryMutation.mutate(entryData);
  };

  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerFirstName || !newCustomerLastName) {
      toast({
        title: "Missing fields",
        description: "Please fill in first name and last name",
        variant: "destructive",
      });
      return;
    }

    addCustomerMutation.mutate({
      firstName: newCustomerFirstName,
      lastName: newCustomerLastName,
      email: newCustomerEmail || null,
      phone: newCustomerPhone || null,
    });
  };

  const getSelectedProduct = () => {
    return products.find(p => p.id === productId);
  };

  const getSelectedCustomer = () => {
    return customers.find(c => c.id === customerId);
  };

  // Fetch cash flow categories
  const { data: categories = [] } = useQuery<CashFlowCategory[]>({
    queryKey: ["/api/cashflow/categories"],
    queryFn: async () => {
      const response = await fetch("/api/cashflow/categories", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch categories");
      return response.json();
    },
  });

  // Fetch products for integration
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const response = await fetch("/api/products", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch products");
      return response.json();
    },
  });

  // Fetch customers
  const { data: customers = [] } = useQuery<Customer[]>({
    queryKey: ["/api/customers"],
    queryFn: async () => {
      const response = await fetch("/api/customers", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch customers");
      return response.json();
    },
  });

  // Filter categories by type
  const filteredCategories = categories.filter(cat => cat.type === entryType && cat.isActive);

  // Auto-calculate amount when product and quantity change
  useEffect(() => {
    if (calculationMode === "product" && productId && quantity) {
      const selectedProduct = products.find(p => p.id === productId);
      if (selectedProduct) {
        const price = entryType === "income" ? 
          parseFloat(selectedProduct.sellingPrice) : 
          parseFloat(selectedProduct.purchasePrice);
        const calculatedAmount = (price * parseFloat(quantity)).toFixed(2);
        setAmount(calculatedAmount);
        
        if (entryType === "income") {
          setCostPrice(selectedProduct.purchasePrice);
        }
      }
    }
  }, [calculationMode, productId, quantity, entryType, products]);

  return (
    <main className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Cash Flow Management</h1>
        <p className="text-muted-foreground">Track daily income, expenses, and sales performance</p>
      </div>

      {/* Today's Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Today's Sales</p>
                <p className="text-xl font-bold text-foreground" data-testid="today-sales">
                  ${todayStats?.totalSales?.toFixed(2) || '0.00'}
                </p>
                <p className="text-xs text-muted-foreground">{todayStats?.salesCount || 0} transactions</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-xl font-bold text-green-600" data-testid="total-income">
                  ${todayStats?.totalIncome?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold text-red-600" data-testid="total-expenses">
                  ${todayStats?.totalExpenses?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className={`w-5 h-5 ${(todayStats?.netFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              <div>
                <p className="text-sm text-muted-foreground">Net Cash Flow</p>
                <p className={`text-xl font-bold ${(todayStats?.netFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} data-testid="net-flow">
                  ${todayStats?.netFlow?.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="text-lg font-semibold text-foreground">
                  {new Date().toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add Cash Flow Entry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="entry-type">Entry Type</Label>
                <Select value={entryType} onValueChange={(value: "income" | "expense") => setEntryType(value)}>
                  <SelectTrigger data-testid="entry-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  data-testid="input-amount"
                />
              </div>

              <div>
                <Label htmlFor="calculation-mode">Calculation Method</Label>
                <Select value={calculationMode} onValueChange={(value: "manual" | "product") => {
                  setCalculationMode(value);
                  if (value === "manual") {
                    setProductId("");
                    setQuantity("");
                    setCostPrice("");
                  }
                }}>
                  <SelectTrigger data-testid="calculation-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4" />
                        Manual Input
                      </div>
                    </SelectItem>
                    <SelectItem value="product">
                      <div className="flex items-center gap-2">
                        <Package className="w-4 h-4" />
                        Product Based
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {calculationMode === "product" && (
                <>
                  <div>
                    <Label htmlFor="product">Product</Label>
                    <Select value={productId} onValueChange={setProductId}>
                      <SelectTrigger data-testid="product-select">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            <div className="flex flex-col">
                              <span>{product.name}</span>
                              <span className="text-xs text-muted-foreground">
                                Stock: {product.stock} | Price: ${entryType === "income" ? product.sellingPrice : product.purchasePrice}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      step="0.001"
                      min="0"
                      placeholder="0"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      data-testid="input-quantity"
                    />
                    {getSelectedProduct() && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Available stock: {getSelectedProduct()?.stock}
                      </p>
                    )}
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="amount">Amount {calculationMode === "product" && "(Auto-calculated)"}</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={calculationMode === "product"}
                  data-testid="input-amount"
                />
              </div>

              {entryType === "income" && calculationMode === "product" && (
                <div>
                  <Label htmlFor="cost-price">Cost Price (Auto-filled)</Label>
                  <Input
                    id="cost-price"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={costPrice}
                    onChange={(e) => setCostPrice(e.target.value)}
                    data-testid="input-cost-price"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger data-testid="category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex flex-col">
                          <span>{cat.name}</span>
                          {cat.description && (
                            <span className="text-xs text-muted-foreground">{cat.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="payment-status">Payment Status</Label>
                <Select value={paymentStatus} onValueChange={(value: "paid" | "unpaid") => {
                  setPaymentStatus(value);
                  if (value === "paid") {
                    setCustomerId("");
                  }
                }}>
                  <SelectTrigger data-testid="payment-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="paid">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-green-600" />
                        Paid
                      </div>
                    </SelectItem>
                    <SelectItem value="unpaid">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-orange-600" />
                        Unpaid
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentStatus === "unpaid" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="customer">Customer</Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomerForm(true)}
                      data-testid="button-add-customer"
                    >
                      <UserPlus className="w-4 h-4 mr-1" />
                      Add New
                    </Button>
                  </div>
                  <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger data-testid="customer-select">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          <div className="flex flex-col">
                            <span>{customer.firstName} {customer.lastName}</span>
                            {customer.phone && (
                              <span className="text-xs text-muted-foreground">{customer.phone}</span>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {getSelectedCustomer() && (
                    <div className="mt-2 p-2 bg-muted rounded text-sm">
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4" />
                        <span className="font-medium">
                          {getSelectedCustomer()?.firstName} {getSelectedCustomer()?.lastName}
                        </span>
                      </div>
                      {getSelectedCustomer()?.email && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {getSelectedCustomer()?.email}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div>
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={entryDate}
                  onChange={(e) => setEntryDate(e.target.value)}
                  data-testid="input-date"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-description"
                />
              </div>

              <div>
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes or comments..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  data-testid="input-notes"
                  rows={2}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full"
                disabled={addEntryMutation.isPending}
                data-testid="button-add-entry"
              >
                {addEntryMutation.isPending ? "Adding..." : "Add Entry"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Add Customer Modal */}
        {showCustomerForm && (
          <Card className="absolute inset-0 z-50 m-4 max-w-md mx-auto mt-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Add New Customer
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCustomer} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={newCustomerFirstName}
                      onChange={(e) => setNewCustomerFirstName(e.target.value)}
                      data-testid="input-customer-firstname"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      value={newCustomerLastName}
                      onChange={(e) => setNewCustomerLastName(e.target.value)}
                      data-testid="input-customer-lastname"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="email">Email (Optional)</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    value={newCustomerEmail}
                    onChange={(e) => setNewCustomerEmail(e.target.value)}
                    data-testid="input-customer-email"
                  />
                </div>

                <div>
                  <Label htmlFor="phone">Phone (Optional)</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(555) 123-4567"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    data-testid="input-customer-phone"
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    type="submit" 
                    disabled={addCustomerMutation.isPending}
                    data-testid="button-save-customer"
                  >
                    {addCustomerMutation.isPending ? "Adding..." : "Add Customer"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => setShowCustomerForm(false)}
                    data-testid="button-cancel-customer"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No cash flow entries yet</p>
                  <p className="text-sm">Add your first entry to track cash flow</p>
                </div>
              ) : (
                entries.map((entry) => {
                  const selectedProduct = entry.productId ? products.find(p => p.id === entry.productId) : null;
                  const selectedCustomer = entry.customerId ? customers.find(c => c.id === entry.customerId) : null;
                  
                  return (
                    <div 
                      key={entry.id} 
                      className="p-4 bg-muted rounded-lg border-l-4 border-l-blue-500"
                      data-testid={`entry-${entry.id}`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          {entry.type === "income" ? (
                            <TrendingUp className="w-5 h-5 text-green-600 mt-0.5" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600 mt-0.5" />
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-semibold text-sm">{entry.description}</p>
                              <Badge variant={entry.paymentStatus === "paid" ? "default" : "destructive"} className="text-xs">
                                {entry.paymentStatus}
                              </Badge>
                              {entry.isManualEntry && (
                                <Badge variant="secondary" className="text-xs">Manual</Badge>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mb-2">{entry.category}</p>
                            
                            {selectedProduct && (
                              <div className="flex items-center gap-1 mb-2">
                                <Package className="w-3 h-3 text-blue-600" />
                                <span className="text-xs text-blue-600">
                                  {selectedProduct.name} {entry.quantity && `(${entry.quantity}x)`}
                                </span>
                              </div>
                            )}
                            
                            {selectedCustomer && (
                              <div className="flex items-center gap-1 mb-2">
                                <User className="w-3 h-3 text-purple-600" />
                                <span className="text-xs text-purple-600">
                                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                                </span>
                              </div>
                            )}
                            
                            {entry.notes && (
                              <div className="flex items-start gap-1 mb-2">
                                <StickyNote className="w-3 h-3 text-orange-600 mt-0.5" />
                                <span className="text-xs text-muted-foreground">{entry.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-bold text-lg ${entry.type === "income" ? "text-green-600" : "text-red-600"}`}>
                            {entry.type === "income" ? "+" : "-"}${parseFloat(entry.amount).toFixed(2)}
                          </p>
                          {entry.costPrice && entry.type === "income" && (
                            <p className="text-xs text-muted-foreground">
                              Cost: ${parseFloat(entry.costPrice).toFixed(2)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(entry.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}