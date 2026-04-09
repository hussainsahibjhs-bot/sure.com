import {
  pgTable,
  text,
  serial,
  integer,
  boolean,
  timestamp,
  decimal,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./models/auth";

// Export the auth schema so the tables are generated
export * from "./models/auth";

export const retailers = pgTable("retailers", {
  id: serial("id").primaryKey(),
  storeName: text("store_name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  phone: text("phone"),
  upiId: text("upi_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(0),
  isFeatured: boolean("is_featured").default(false),
  sellerUpiId: text("seller_upi_id"),
  retailerId: integer("retailer_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull(),
  productId: integer("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
});

export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("Order Placed"),
  paymentMethod: text("payment_method").notNull().default("COD"),
  paymentStatus: text("payment_status").notNull().default("pending"),
  otp: text("otp"),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productSubmissions = pgTable("product_submissions", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  retailerId: integer("retailer_id"),
  submitterName: text("submitter_name"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  category: text("category").notNull(),
  stock: integer("stock").notNull().default(1),
  upiId: text("upi_id"),
  status: text("status").notNull().default("pending"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const productSubmissionsRelations = relations(productSubmissions, ({ one }) => ({
  user: one(users, {
    fields: [productSubmissions.userId],
    references: [users.id],
  }),
}));

export const insertRetailerSchema = createInsertSchema(retailers).omit({
  id: true,
  createdAt: true,
});
export type Retailer = typeof retailers.$inferSelect;
export type InsertRetailer = z.infer<typeof insertRetailerSchema>;

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
});
export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
});
export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
});
export const insertProductSubmissionSchema = createInsertSchema(productSubmissions).omit({
  id: true,
  createdAt: true,
  status: true,
  adminNotes: true,
});

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;

export type ProductSubmission = typeof productSubmissions.$inferSelect;
export type InsertProductSubmission = z.infer<typeof insertProductSubmissionSchema>;

export type ProductResponse = Product;
export type ProductsListResponse = Product[];

export type OrderResponse = Order & {
  items?: (OrderItem & { product: Product })[];
};
export type OrdersListResponse = OrderResponse[];

export type CreateOrderRequest = {
  items: { productId: number; quantity: number }[];
};
