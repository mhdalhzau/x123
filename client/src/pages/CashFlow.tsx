import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { TrendingUp, TrendingDown, DollarSign, Plus, Calendar, Receipt } from "lucide-react";

interface CashFlowEntry {
  id: string;
  type: "income" | "expense";
  amount: string;
  description: string;
  category: string;
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
  const [entryType, setEntryType] = useState<"income" | "expense">("income");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
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
    mutationFn: async (data: { type: string; amount: string; description: string; category: string }) => {
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
      setAmount("");
      setDescription("");
      setCategory("");
    },
    onError: (error) => {
      toast({
        title: "Failed to add entry",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description || !category) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    addEntryMutation.mutate({
      type: entryType,
      amount,
      description,
      category,
    });
  };

  const incomeCategories = ["Sales", "Interest", "Investment", "Other Income"];
  const expenseCategories = ["Office Supplies", "Utilities", "Rent", "Marketing", "Equipment", "Other Expenses"];

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
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger data-testid="category-select">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(entryType === "income" ? incomeCategories : expenseCategories).map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

        {/* Recent Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {entries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No cash flow entries yet</p>
                  <p className="text-sm">Add your first entry to track cash flow</p>
                </div>
              ) : (
                entries.map((entry) => (
                  <div 
                    key={entry.id} 
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    data-testid={`entry-${entry.id}`}
                  >
                    <div className="flex items-center gap-3">
                      {entry.type === "income" ? (
                        <TrendingUp className="w-4 h-4 text-green-600" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{entry.description}</p>
                        <p className="text-xs text-muted-foreground">{entry.category}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${entry.type === "income" ? "text-green-600" : "text-red-600"}`}>
                        {entry.type === "income" ? "+" : "-"}${parseFloat(entry.amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(entry.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}