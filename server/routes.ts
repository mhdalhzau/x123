import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  loginSchema,
  insertUserSchema,
  insertStoreSchema,
  insertCategorySchema,
  insertSupplierSchema,
  insertCustomerSchema,
  insertProductSchema,
  insertSaleSchema,
  insertSaleItemSchema,
  insertInventoryMovementSchema,
  insertCashFlowCategorySchema,
  insertCashFlowEntrySchema
} from "@shared/schema";

declare global {
  namespace Express {
    interface Request {
      user?: { userId: string; username: string; role: string };
      storeId?: string;
    }
  }
}

// Simple session storage
const sessions: Map<string, { userId: string; username: string; role: string }> = new Map();

// Middleware to check authentication
function requireAuth(req: any, res: any, next: any) {
  const sessionId = req.headers.authorization?.replace('Bearer ', '');
  const session = sessionId ? sessions.get(sessionId) : null;
  
  if (!session) {
    return res.status(401).json({ message: "Authentication required" });
  }
  
  req.user = session;
  next();
}

// Middleware to extract and validate store ID
function requireStore(req: any, res: any, next: any) {
  const storeId = req.headers['x-store-id'];
  
  if (!storeId) {
    return res.status(400).json({ message: "Store ID is required" });
  }
  
  req.storeId = storeId;
  next();
}

// Middleware to validate store ownership (users can only access their assigned store)
async function validateStoreAccess(req: any, res: any, next: any) {
  try {
    if (!req.user || !req.storeId) {
      return res.status(401).json({ message: "Authentication and store context required" });
    }

    // Administrator role can access any store
    if (req.user.role === 'administrator') {
      return next();
    }

    // Get user details to check their assigned store
    const user = await storage.getUser(req.user.userId);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    // Check if user's assigned store matches the requested store
    if (user.storeId !== req.storeId) {
      return res.status(403).json({ message: "Access denied: You don't have permission to access this store" });
    }

    next();
  } catch (error) {
    res.status(500).json({ message: "Store validation failed" });
  }
}

function requireRole(roles: string[]) {
  return (req: any, res: any, next: any) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }
    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      if (!user.isActive) {
        return res.status(401).json({ message: "Account is disabled" });
      }

      const sessionId = Math.random().toString(36).substring(2);
      sessions.set(sessionId, { userId: user.id, username: user.username, role: user.role });

      res.json({ 
        token: sessionId, 
        user: { 
          id: user.id, 
          username: user.username, 
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role 
        } 
      });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/logout", requireAuth, (req, res) => {
    const sessionId = req.headers.authorization?.replace('Bearer ', '');
    if (sessionId) {
      sessions.delete(sessionId);
    }
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.user!.userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  });

  // Store routes  
  app.get("/api/stores", requireAuth, async (req, res) => {
    try {
      // Only administrators can see all stores, others see their assigned store
      if (req.user!.role === 'administrator') {
        const stores = await storage.getAllStores();
        res.json(stores);
      } else {
        const user = await storage.getUser(req.user!.userId);
        if (!user || !user.storeId) {
          return res.status(403).json({ message: "No store access assigned" });
        }
        const store = await storage.getStore(user.storeId);
        res.json(store ? [store] : []);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stores" });
    }
  });

  app.post("/api/stores", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const storeData = insertStoreSchema.parse(req.body);
      const store = await storage.createStore(storeData);
      res.status(201).json(store);
    } catch (error) {
      res.status(400).json({ message: "Invalid store data" });
    }
  });

  app.put("/api/stores/:id", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const storeData = insertStoreSchema.partial().parse(req.body);
      const store = await storage.updateStore(id, storeData);
      
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      res.json(store);
    } catch (error) {
      res.status(400).json({ message: "Invalid store data" });
    }
  });

  app.delete("/api/stores/:id", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteStore(id);
      
      if (!success) {
        return res.status(404).json({ message: "Store not found" });
      }
      
      res.json({ message: "Store deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete store" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const stats = await storage.getDashboardStats(req.storeId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // User routes
  app.get("/api/users", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.put("/api/users/:id", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const userData = insertUserSchema.partial().parse(req.body);
      const user = await storage.updateUser(id, userData);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(400).json({ message: "Invalid user data" });
    }
  });

  app.delete("/api/users/:id", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteUser(id);
      
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Product routes
  app.get("/api/products", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const products = await storage.getAllProducts(req.storeId!);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get("/api/products/low-stock", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const products = await storage.getLowStockProducts(req.storeId!);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch low stock products" });
    }
  });

  app.get("/api/products/:id", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      // Verify product belongs to the current store
      if (product.storeId !== req.storeId) {
        return res.status(403).json({ message: "Access denied: Product does not belong to this store" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post("/api/products", requireAuth, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.put("/api/products/:id", requireAuth, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const { id } = req.params;
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(id, productData);
      
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      res.status(400).json({ message: "Invalid product data" });
    }
  });

  app.delete("/api/products/:id", requireAuth, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteProduct(id);
      
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Customer routes
  app.get("/api/customers", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const customers = await storage.getAllCustomers(req.storeId!);
      res.json(customers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.post("/api/customers", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse({
        ...req.body,
        storeId: req.storeId!
      });
      const customer = await storage.createCustomer(customerData);
      res.status(201).json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.put("/api/customers/:id", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const { id } = req.params;
      
      // First verify the customer belongs to the current store
      const existingCustomer = await storage.getCustomer(id);
      if (!existingCustomer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      if (existingCustomer.storeId !== req.storeId) {
        return res.status(403).json({ message: "Access denied: Customer does not belong to this store" });
      }
      
      const customerData = insertCustomerSchema.partial().parse(req.body);
      const customer = await storage.updateCustomer(id, customerData);
      
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json(customer);
    } catch (error) {
      res.status(400).json({ message: "Invalid customer data" });
    }
  });

  app.delete("/api/customers/:id", requireAuth, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteCustomer(id);
      
      if (!success) {
        return res.status(404).json({ message: "Customer not found" });
      }
      
      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Supplier routes
  app.get("/api/suppliers", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const suppliers = await storage.getAllSuppliers(req.storeId!);
      res.json(suppliers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suppliers" });
    }
  });

  app.post("/api/suppliers", requireAuth, requireStore, validateStoreAccess, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const supplierData = insertSupplierSchema.parse({
        ...req.body,
        storeId: req.storeId!
      });
      const supplier = await storage.createSupplier(supplierData);
      res.status(201).json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });

  app.put("/api/suppliers/:id", requireAuth, requireStore, validateStoreAccess, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const { id } = req.params;
      
      // First verify the supplier belongs to the current store
      const existingSupplier = await storage.getSupplier(id);
      if (!existingSupplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      if (existingSupplier.storeId !== req.storeId) {
        return res.status(403).json({ message: "Access denied: Supplier does not belong to this store" });
      }
      
      const supplierData = insertSupplierSchema.partial().parse(req.body);
      const supplier = await storage.updateSupplier(id, supplierData);
      
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json(supplier);
    } catch (error) {
      res.status(400).json({ message: "Invalid supplier data" });
    }
  });

  app.delete("/api/suppliers/:id", requireAuth, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteSupplier(id);
      
      if (!success) {
        return res.status(404).json({ message: "Supplier not found" });
      }
      
      res.json({ message: "Supplier deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete supplier" });
    }
  });

  // Category routes
  app.get("/api/categories", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const categories = await storage.getAllCategories(req.storeId!);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, requireStore, validateStoreAccess, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse({
        ...req.body,
        storeId: req.storeId!
      });
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  // Sales routes
  app.get("/api/sales", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const sales = await storage.getAllSales(req.storeId!);
      res.json(sales);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sales" });
    }
  });

  app.post("/api/sales", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const { items, paymentMethod, customerId } = req.body;
      
      // Validate required fields
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ message: "Items are required" });
      }
      
      if (!paymentMethod || !["cash", "card", "digital"].includes(paymentMethod)) {
        return res.status(400).json({ message: "Valid payment method is required" });
      }
      
      // Calculate totals server-side for security
      let subtotal = 0;
      const validatedItems = [];
      
      for (const item of items) {
        if (!item.productId || !item.quantity || item.quantity <= 0) {
          return res.status(400).json({ message: "Invalid item data" });
        }
        
        // Get current product price from database (security: don't trust client prices)
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }
        
        // Verify product belongs to the current store
        if (product.storeId !== req.storeId) {
          return res.status(403).json({ message: `Product ${product.name} does not belong to this store` });
        }
        
        if (!product.isActive) {
          return res.status(400).json({ message: `Product ${product.name} is not active` });
        }
        
        const currentStock = parseFloat(product.stock);
        if (currentStock < item.quantity) {
          return res.status(400).json({ 
            message: `Insufficient stock for ${product.name}. Available: ${currentStock.toFixed(3)}, Requested: ${item.quantity}` 
          });
        }
        
        const unitPrice = parseFloat(product.sellingPrice);
        const lineTotal = unitPrice * item.quantity;
        subtotal += lineTotal;
        
        validatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: unitPrice.toFixed(2),
          total: lineTotal.toFixed(2)
        });
      }
      
      // Calculate tax and total server-side
      const taxRate = 0.085; // 8.5%
      const tax = subtotal * taxRate;
      const total = subtotal + tax;
      
      // Prepare sale data with server-calculated values
      const saleData = {
        customerId: customerId === "walk-in" || !customerId ? null : customerId,
        userId: req.user!.userId,
        storeId: req.storeId!,
        total: total.toFixed(2),
        tax: tax.toFixed(2),
        discount: "0.00",
        paymentMethod,
        status: "completed" as const
      };
      
      // Validate sale data
      const validatedSaleData = insertSaleSchema.parse(saleData);
      
      // Process sale atomically - all operations succeed or none do
      const result = await storage.processSaleAtomic(validatedSaleData, validatedItems);
      
      if (result.error) {
        return res.status(400).json({ message: result.error });
      }
      
      res.status(201).json({
        ...result.sale,
        calculatedSubtotal: subtotal.toFixed(2),
        calculatedTax: tax.toFixed(2),
        calculatedTotal: total.toFixed(2),
        receiptData: {
          items: result.items,
          timestamp: new Date().toISOString(),
          receiptNumber: result.sale.id
        }
      });
    } catch (error) {
      console.error("Sale processing error:", error);
      res.status(400).json({ 
        message: "Failed to process sale",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.get("/api/sales/:id/items", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const items = await storage.getSaleItems(id);
      res.json(items);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch sale items" });
    }
  });

  // Cash Flow routes
  app.get("/api/cashflow/today", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const stats = await storage.getTodayCashFlowStats(req.storeId!);
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch today's cash flow stats" });
    }
  });

  app.get("/api/cashflow/entries", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const entries = await storage.getCashFlowEntries(req.storeId!);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cash flow entries" });
    }
  });

  app.post("/api/cashflow/entries", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const entryData = insertCashFlowEntrySchema.parse({
        ...req.body,
        userId: req.user!.userId,
        storeId: req.storeId!
      });
      const entry = await storage.createCashFlowEntry(entryData);
      res.status(201).json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid cash flow entry data" });
    }
  });

  app.put("/api/cashflow/entries/:id", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const { id } = req.params;
      const entryData = insertCashFlowEntrySchema.partial().parse(req.body);
      
      const entry = await storage.updateCashFlowEntry(id, entryData, req.storeId!);
      
      if (!entry) {
        return res.status(404).json({ message: "Cash flow entry not found or access denied" });
      }
      
      res.json(entry);
    } catch (error) {
      res.status(400).json({ message: "Invalid cash flow entry data" });
    }
  });

  app.delete("/api/cashflow/entries/:id", requireAuth, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const success = await storage.deleteCashFlowEntry(id, user.storeId);
      
      if (!success) {
        return res.status(404).json({ message: "Cash flow entry not found or access denied" });
      }
      
      res.json({ message: "Cash flow entry deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete cash flow entry" });
    }
  });

  app.get("/api/cashflow/entries/date-range", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }
      
      const entries = await storage.getCashFlowEntriesByDateRange(
        new Date(startDate as string), 
        new Date(endDate as string),
        req.storeId!
      );
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cash flow entries" });
    }
  });

  app.get("/api/cashflow/entries/unpaid", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const entries = await storage.getUnpaidCashFlowEntries(req.storeId!);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch unpaid entries" });
    }
  });

  app.get("/api/cashflow/entries/customer/:customerId", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const { customerId } = req.params;
      const entries = await storage.getCashFlowEntriesByCustomer(customerId, req.storeId!);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch customer entries" });
    }
  });

  // Cash Flow Categories routes
  app.get("/api/cashflow/categories", requireAuth, requireStore, validateStoreAccess, async (req, res) => {
    try {
      const { type } = req.query;
      
      const categories = type 
        ? await storage.getCashFlowCategoriesByType(type as 'income' | 'expense', req.storeId!)
        : await storage.getAllCashFlowCategories(req.storeId!);
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cash flow categories" });
    }
  });

  app.post("/api/cashflow/categories", requireAuth, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const categoryData = insertCashFlowCategorySchema.parse(req.body);
      const category = await storage.createCashFlowCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.put("/api/cashflow/categories/:id", requireAuth, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const { id } = req.params;
      const categoryData = insertCashFlowCategorySchema.partial().parse(req.body);
      
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const category = await storage.updateCashFlowCategory(id, categoryData, user.storeId);
      
      if (!category) {
        return res.status(404).json({ message: "Category not found or access denied" });
      }
      
      res.json(category);
    } catch (error) {
      res.status(400).json({ message: "Invalid category data" });
    }
  });

  app.delete("/api/cashflow/categories/:id", requireAuth, requireRole(["administrator"]), async (req, res) => {
    try {
      const { id } = req.params;
      
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const success = await storage.deleteCashFlowCategory(id, user.storeId);
      
      if (!success) {
        return res.status(404).json({ message: "Category not found or access denied" });
      }
      
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Accounts Receivable routes
  app.get("/api/accounts-receivable", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const receivables = await storage.getAccountsReceivable(user.storeId);
      res.json(receivables);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch accounts receivable" });
    }
  });

  // Inventory routes
  app.get("/api/inventory/movements/:productId", requireAuth, async (req, res) => {
    try {
      const { productId } = req.params;
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      const movements = await storage.getInventoryMovements(productId, user.storeId);
      res.json(movements);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inventory movements" });
    }
  });

  app.post("/api/inventory/adjustment", requireAuth, requireRole(["administrator", "owner", "administrasi"]), async (req, res) => {
    try {
      const { productId, quantity, reason } = req.body;
      
      const user = await storage.getUser(req.user!.userId);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }
      
      // Update stock
      await storage.updateProductStock(productId, quantity);
      
      // Create movement record
      const movement = await storage.createInventoryMovement({
        productId,
        type: "adjustment",
        quantity,
        reason,
        userId: req.user!.userId,
        storeId: user.storeId
      });
      
      res.status(201).json(movement);
    } catch (error) {
      res.status(400).json({ message: "Invalid adjustment data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
