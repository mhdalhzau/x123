import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  role: text("role", { enum: ["admin", "cashier", "manager"] }).notNull().default("cashier"),
  isActive: boolean("is_active").notNull().default(true),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
});

export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  contactPerson: text("contact_person"),
});

export const customers = pgTable("customers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email"),
  phone: text("phone"),
  address: text("address"),
  loyaltyPoints: integer("loyalty_points").notNull().default(0),
});

export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull().unique(),
  barcode: text("barcode"),
  description: text("description"),
  categoryId: varchar("category_id").references(() => categories.id),
  supplierId: varchar("supplier_id").references(() => suppliers.id),
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 2 }).notNull(),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }).notNull(),
  stock: integer("stock").notNull().default(0),
  minStockLevel: integer("min_stock_level").notNull().default(5),
  brand: text("brand"),
  isActive: boolean("is_active").notNull().default(true),
});

export const sales = pgTable("sales", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  customerId: varchar("customer_id").references(() => customers.id),
  userId: varchar("user_id").references(() => users.id).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).notNull().default("0"),
  discount: decimal("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  paymentMethod: text("payment_method", { enum: ["cash", "card", "digital"] }).notNull(),
  status: text("status", { enum: ["completed", "pending", "cancelled"] }).notNull().default("completed"),
  saleDate: timestamp("sale_date").notNull().default(sql`now()`),
});

export const saleItems = pgTable("sale_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  saleId: varchar("sale_id").references(() => sales.id).notNull(),
  productId: varchar("product_id").references(() => products.id).notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
});

export const inventoryMovements = pgTable("inventory_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").references(() => products.id).notNull(),
  type: text("type", { enum: ["in", "out", "adjustment"] }).notNull(),
  quantity: integer("quantity").notNull(),
  reason: text("reason").notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  movementDate: timestamp("movement_date").notNull().default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true });
export const insertCustomerSchema = createInsertSchema(customers).omit({ id: true });
export const insertProductSchema = createInsertSchema(products).omit({ id: true });
export const insertSaleSchema = createInsertSchema(sales).omit({ id: true, saleDate: true });
export const insertSaleItemSchema = createInsertSchema(saleItems).omit({ id: true });
export const insertInventoryMovementSchema = createInsertSchema(inventoryMovements).omit({ id: true, movementDate: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Supplier = typeof suppliers.$inferSelect;
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Sale = typeof sales.$inferSelect;
export type InsertSale = z.infer<typeof insertSaleSchema>;
export type SaleItem = typeof saleItems.$inferSelect;
export type InsertSaleItem = z.infer<typeof insertSaleItemSchema>;
export type InventoryMovement = typeof inventoryMovements.$inferSelect;
export type InsertInventoryMovement = z.infer<typeof insertInventoryMovementSchema>;

// Auth schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export type LoginData = z.infer<typeof loginSchema>;
