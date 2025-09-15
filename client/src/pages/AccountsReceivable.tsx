import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { getAuthHeaders } from "@/lib/auth";
import { 
  Users, CreditCard, DollarSign, Calendar, 
  Phone, Mail, FileText, CheckCircle,
  AlertTriangle, TrendingUp
} from "lucide-react";

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
  paymentStatus: "paid" | "unpaid";
  customerId?: string;
  notes?: string;
  date: string;
}

interface AccountsReceivable {
  customerId: string;
  customerName: string;
  totalUnpaid: number;
  entries: CashFlowEntry[];
}

export default function AccountsReceivable() {
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch accounts receivable data
  const { data: receivables = [], isLoading } = useQuery<AccountsReceivable[]>({
    queryKey: ["/api/accounts-receivable"],
    queryFn: async () => {
      const response = await fetch("/api/accounts-receivable", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch accounts receivable");
      return response.json();
    },
  });

  // Mark entry as paid mutation
  const markPaidMutation = useMutation({
    mutationFn: async (entryId: string) => {
      const response = await fetch(`/api/cashflow/entries/${entryId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ paymentStatus: "paid" }),
      });
      if (!response.ok) throw new Error("Failed to mark entry as paid");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment recorded",
        description: "Transaction has been marked as paid",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/accounts-receivable"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow/entries"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cashflow/today"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to mark as paid",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive",
      });
    },
  });

  const totalReceivables = receivables.reduce((sum, item) => sum + item.totalUnpaid, 0);
  const selectedReceivable = selectedCustomer ? 
    receivables.find(r => r.customerId === selectedCustomer) : null;

  if (isLoading) {
    return (
      <main className="p-6 animate-fade-in">
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading accounts receivable...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 animate-fade-in">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Accounts Receivable</h1>
        <p className="text-muted-foreground">Track and manage unpaid customer transactions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-red-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Receivables</p>
                <p className="text-2xl font-bold text-red-600" data-testid="total-receivables">
                  ${totalReceivables.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Customers with Debt</p>
                <p className="text-2xl font-bold text-blue-600" data-testid="customers-count">
                  {receivables.length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Total Transactions</p>
                <p className="text-2xl font-bold text-orange-600" data-testid="transactions-count">
                  {receivables.reduce((sum, item) => sum + item.entries.length, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {receivables.length === 0 ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">
              <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
              <h3 className="text-lg font-semibold mb-2">All Paid Up!</h3>
              <p>No outstanding receivables at the moment.</p>
              <p className="text-sm mt-1">All customers have settled their accounts.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer List */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {receivables
                  .sort((a, b) => b.totalUnpaid - a.totalUnpaid)
                  .map((receivable) => (
                    <div
                      key={receivable.customerId}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedCustomer === receivable.customerId
                          ? "bg-primary/10 border-primary"
                          : "bg-muted hover:bg-muted/70"
                      }`}
                      onClick={() => setSelectedCustomer(receivable.customerId)}
                      data-testid={`customer-${receivable.customerId}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm">{receivable.customerName}</p>
                          <p className="text-xs text-muted-foreground">
                            {receivable.entries.length} transaction{receivable.entries.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-red-600">
                            ${receivable.totalUnpaid.toFixed(2)}
                          </p>
                          {receivable.totalUnpaid > 1000 && (
                            <AlertTriangle className="w-4 h-4 text-orange-600 ml-auto" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </CardContent>
          </Card>

          {/* Transaction Details */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                {selectedReceivable ? `${selectedReceivable.customerName}'s Transactions` : "Select Customer"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedReceivable ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Select a customer to view their unpaid transactions</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Customer Info */}
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold">{selectedReceivable.customerName}</h3>
                      <Badge variant="destructive" className="text-sm">
                        ${selectedReceivable.totalUnpaid.toFixed(2)} Outstanding
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-muted-foreground" />
                        <span>{selectedReceivable.entries.length} unpaid transactions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span>Oldest: {new Date(Math.min(...selectedReceivable.entries.map(e => new Date(e.date).getTime()))).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Transactions */}
                  <div className="space-y-3">
                    {selectedReceivable.entries
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="p-4 border rounded-lg"
                          data-testid={`transaction-${entry.id}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <TrendingUp className="w-4 h-4 text-green-600" />
                                <h4 className="font-medium">{entry.description}</h4>
                                <Badge variant="outline" className="text-xs">
                                  {entry.category}
                                </Badge>
                              </div>
                              
                              {entry.notes && (
                                <p className="text-sm text-muted-foreground mb-2">
                                  📝 {entry.notes}
                                </p>
                              )}
                              
                              <p className="text-xs text-muted-foreground">
                                📅 {new Date(entry.date).toLocaleDateString()} • 
                                🕐 {new Date(entry.date).toLocaleTimeString()}
                              </p>
                            </div>
                            
                            <div className="text-right ml-4">
                              <p className="text-xl font-bold text-green-600 mb-2">
                                ${parseFloat(entry.amount).toFixed(2)}
                              </p>
                              <Button
                                size="sm"
                                onClick={() => markPaidMutation.mutate(entry.id)}
                                disabled={markPaidMutation.isPending}
                                data-testid={`button-mark-paid-${entry.id}`}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                {markPaidMutation.isPending ? "Marking..." : "Mark Paid"}
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </main>
  );
}