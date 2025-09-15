import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { getAuthHeaders } from "@/lib/auth";

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: async () => {
      const response = await fetch("/api/dashboard/stats", {
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    );
  }

  return (
    <main className="p-6 animate-fade-in">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Today's Sales</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-today-sales">
                  ${stats?.todaySales?.toFixed(2) || "0.00"}
                </p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <i className="fas fa-arrow-up"></i>
                  <span>+12.5%</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-dollar-sign text-green-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Orders Today</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-orders-today">
                  {stats?.ordersToday || 0}
                </p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <i className="fas fa-arrow-up"></i>
                  <span>+8.2%</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-shopping-cart text-blue-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Products</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-products">
                  {stats?.totalProducts || 0}
                </p>
                <p className="text-sm text-yellow-600 flex items-center gap-1 mt-1">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{stats?.lowStockCount || 0} Low Stock</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-box text-purple-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">Customers</p>
                <p className="text-2xl font-bold text-foreground" data-testid="stat-total-customers">
                  {stats?.totalCustomers || 0}
                </p>
                <p className="text-sm text-green-600 flex items-center gap-1 mt-1">
                  <i className="fas fa-user-plus"></i>
                  <span>+15 This Week</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-indigo-600 text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Recent Sales</h3>
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-chart-line text-4xl mb-4"></i>
                <p>No recent sales data available</p>
                <p className="text-sm">Sales will appear here as they are processed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Low Stock Alert</h3>
            <div className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-warehouse text-4xl mb-4"></i>
                <p>No low stock items</p>
                <p className="text-sm">Products running low will appear here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
