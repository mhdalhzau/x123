import { 
  type User, type InsertUser,
  type Category, type InsertCategory,
  type Supplier, type InsertSupplier,
  type Customer, type InsertCustomer,
  type Product, type InsertProduct,
  type Sale, type InsertSale,
  type SaleItem, type InsertSaleItem,
  type InventoryMovement, type InsertInventoryMovement
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: Partial<InsertUser>): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  getAllUsers(): Promise<User[]>;

  // Categories
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  getAllCategories(): Promise<Category[]>;

  // Suppliers
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;
  getAllSuppliers(): Promise<Supplier[]>;

  // Customers
  getCustomer(id: string): Promise<Customer | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: string, customer: Partial<InsertCustomer>): Promise<Customer | undefined>;
  deleteCustomer(id: string): Promise<boolean>;
  getAllCustomers(): Promise<Customer[]>;

  // Products
  getProduct(id: string): Promise<Product | undefined>;
  getProductBySku(sku: string): Promise<Product | undefined>;
  getProductByBarcode(barcode: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;
  getAllProducts(): Promise<Product[]>;
  getLowStockProducts(): Promise<Product[]>;

  // Sales
  getSale(id: string): Promise<Sale | undefined>;
  createSale(sale: InsertSale): Promise<Sale>;
  getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]>;
  getSalesByUser(userId: string): Promise<Sale[]>;
  getAllSales(): Promise<Sale[]>;

  // Sale Items
  getSaleItems(saleId: string): Promise<SaleItem[]>;
  createSaleItem(saleItem: InsertSaleItem): Promise<SaleItem>;

  // Inventory
  createInventoryMovement(movement: InsertInventoryMovement): Promise<InventoryMovement>;
  getInventoryMovements(productId: string): Promise<InventoryMovement[]>;
  updateProductStock(productId: string, quantity: number): Promise<boolean>;

  // Dashboard stats
  getDashboardStats(): Promise<{
    todaySales: number;
    ordersToday: number;
    totalProducts: number;
    lowStockCount: number;
    totalCustomers: number;
  }>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private categories: Map<string, Category> = new Map();
  private suppliers: Map<string, Supplier> = new Map();
  private customers: Map<string, Customer> = new Map();
  private products: Map<string, Product> = new Map();
  private sales: Map<string, Sale> = new Map();
  private saleItems: Map<string, SaleItem[]> = new Map();
  private inventoryMovements: Map<string, InventoryMovement[]> = new Map();

  constructor() {
    this.initializeData();
  }

  private initializeData() {
    // Create default admin user
    const adminId = randomUUID();
    this.users.set(adminId, {
      id: adminId,
      username: "admin",
      password: "admin123", // In production, this should be hashed
      firstName: "Admin",
      lastName: "User",
      email: "admin@starpos.com",
      role: "admin",
      isActive: true,
    });

    // Create sample categories
    const electronicsId = randomUUID();
    this.categories.set(electronicsId, {
      id: electronicsId,
      name: "Electronics",
      description: "Electronic devices and accessories",
    });

    const accessoriesId = randomUUID();
    this.categories.set(accessoriesId, {
      id: accessoriesId,
      name: "Accessories",
      description: "Various accessories and add-ons",
    });

    // Create sample products
    const product1Id = randomUUID();
    this.products.set(product1Id, {
      id: product1Id,
      name: "Wireless Headphones",
      sku: "WH-001",
      barcode: "1234567890123",
      description: "High-quality wireless headphones with noise cancellation",
      categoryId: electronicsId,
      supplierId: null,
      purchasePrice: "60.00",
      sellingPrice: "89.99",
      stock: 45,
      minStockLevel: 5,
      brand: "AudioTech",
      isActive: true,
    });

    const product2Id = randomUUID();
    this.products.set(product2Id, {
      id: product2Id,
      name: "Smartphone Case",
      sku: "PC-002",
      barcode: "2345678901234",
      description: "Protective case for smartphones",
      categoryId: accessoriesId,
      supplierId: null,
      purchasePrice: "8.00",
      sellingPrice: "19.99",
      stock: 128,
      minStockLevel: 10,
      brand: "ProtectiveGear",
      isActive: true,
    });
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role ?? "cashier",
      isActive: insertUser.isActive ?? true
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, userData: Partial<InsertUser>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Categories
  async getCategory(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { 
      ...insertCategory, 
      id,
      description: insertCategory.description ?? null
    };
    this.categories.set(id, category);
    return category;
  }

  async updateCategory(id: string, categoryData: Partial<InsertCategory>): Promise<Category | undefined> {
    const category = this.categories.get(id);
    if (!category) return undefined;
    const updatedCategory = { ...category, ...categoryData };
    this.categories.set(id, updatedCategory);
    return updatedCategory;
  }

  async deleteCategory(id: string): Promise<boolean> {
    return this.categories.delete(id);
  }

  async getAllCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  // Suppliers
  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliers.get(id);
  }

  async createSupplier(insertSupplier: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const supplier: Supplier = { ...insertSupplier, id };
    this.suppliers.set(id, supplier);
    return supplier;
  }

  async updateSupplier(id: string, supplierData: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const supplier = this.suppliers.get(id);
    if (!supplier) return undefined;
    const updatedSupplier = { ...supplier, ...supplierData };
    this.suppliers.set(id, updatedSupplier);
    return updatedSupplier;
  }

  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliers.delete(id);
  }

  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliers.values());
  }

  // Customers
  async getCustomer(id: string): Promise<Customer | undefined> {
    return this.customers.get(id);
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    const id = randomUUID();
    const customer: Customer = { ...insertCustomer, id };
    this.customers.set(id, customer);
    return customer;
  }

  async updateCustomer(id: string, customerData: Partial<InsertCustomer>): Promise<Customer | undefined> {
    const customer = this.customers.get(id);
    if (!customer) return undefined;
    const updatedCustomer = { ...customer, ...customerData };
    this.customers.set(id, updatedCustomer);
    return updatedCustomer;
  }

  async deleteCustomer(id: string): Promise<boolean> {
    return this.customers.delete(id);
  }

  async getAllCustomers(): Promise<Customer[]> {
    return Array.from(this.customers.values());
  }

  // Products
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }

  async getProductBySku(sku: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(product => product.sku === sku);
  }

  async getProductByBarcode(barcode: string): Promise<Product | undefined> {
    return Array.from(this.products.values()).find(product => product.barcode === barcode);
  }

  async createProduct(insertProduct: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product: Product = { ...insertProduct, id };
    this.products.set(id, product);
    return product;
  }

  async updateProduct(id: string, productData: Partial<InsertProduct>): Promise<Product | undefined> {
    const product = this.products.get(id);
    if (!product) return undefined;
    const updatedProduct = { ...product, ...productData };
    this.products.set(id, updatedProduct);
    return updatedProduct;
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }

  async getLowStockProducts(): Promise<Product[]> {
    return Array.from(this.products.values()).filter(product => product.stock <= product.minStockLevel);
  }

  // Sales
  async getSale(id: string): Promise<Sale | undefined> {
    return this.sales.get(id);
  }

  async createSale(insertSale: InsertSale): Promise<Sale> {
    const id = randomUUID();
    const sale: Sale = { 
      ...insertSale, 
      id,
      saleDate: new Date(),
      status: insertSale.status ?? "completed",
      customerId: insertSale.customerId ?? null,
      tax: insertSale.tax ?? "0",
      discount: insertSale.discount ?? "0"
    };
    this.sales.set(id, sale);
    return sale;
  }

  async getSalesByDateRange(startDate: Date, endDate: Date): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(sale => 
      sale.saleDate >= startDate && sale.saleDate <= endDate
    );
  }

  async getSalesByUser(userId: string): Promise<Sale[]> {
    return Array.from(this.sales.values()).filter(sale => sale.userId === userId);
  }

  async getAllSales(): Promise<Sale[]> {
    return Array.from(this.sales.values());
  }

  // Sale Items
  async getSaleItems(saleId: string): Promise<SaleItem[]> {
    return this.saleItems.get(saleId) || [];
  }

  async createSaleItem(insertSaleItem: InsertSaleItem): Promise<SaleItem> {
    const id = randomUUID();
    const saleItem: SaleItem = { ...insertSaleItem, id };
    
    const existingItems = this.saleItems.get(insertSaleItem.saleId) || [];
    existingItems.push(saleItem);
    this.saleItems.set(insertSaleItem.saleId, existingItems);
    
    return saleItem;
  }

  // Inventory
  async createInventoryMovement(insertMovement: InsertInventoryMovement): Promise<InventoryMovement> {
    const id = randomUUID();
    const movement: InventoryMovement = { 
      ...insertMovement, 
      id,
      movementDate: new Date()
    };
    
    const existingMovements = this.inventoryMovements.get(insertMovement.productId) || [];
    existingMovements.push(movement);
    this.inventoryMovements.set(insertMovement.productId, existingMovements);
    
    return movement;
  }

  async getInventoryMovements(productId: string): Promise<InventoryMovement[]> {
    return this.inventoryMovements.get(productId) || [];
  }

  async updateProductStock(productId: string, quantity: number): Promise<boolean> {
    const product = this.products.get(productId);
    if (!product) return false;
    
    const updatedProduct = { ...product, stock: product.stock + quantity };
    this.products.set(productId, updatedProduct);
    return true;
  }

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todaySales = Array.from(this.sales.values())
      .filter(sale => sale.saleDate >= today && sale.saleDate < tomorrow)
      .reduce((sum, sale) => sum + parseFloat(sale.total), 0);

    const ordersToday = Array.from(this.sales.values())
      .filter(sale => sale.saleDate >= today && sale.saleDate < tomorrow).length;

    const totalProducts = this.products.size;
    const lowStockCount = (await this.getLowStockProducts()).length;
    const totalCustomers = this.customers.size;

    return {
      todaySales,
      ordersToday,
      totalProducts,
      lowStockCount,
      totalCustomers,
    };
  }
}

export const storage = new MemStorage();
