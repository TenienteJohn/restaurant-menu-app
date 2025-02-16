import { pgTable, text, serial, integer, boolean, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

export const tenants = pgTable("tenants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subdomain: text("subdomain").notNull().unique(),
  active: boolean("active").notNull().default(true),
  config: jsonb("config").notNull().default({
    theme: "light",
    logo: null,
    contactEmail: null,
    address: null,
    phone: null,
  }),
});

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  isSuperAdmin: boolean("is_super_admin").notNull().default(false),
  tenantId: integer("tenant_id").references(() => tenants.id),
  role: text("role").notNull().default("user"),
});

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, {
    fields: [users.tenantId],
    references: [tenants.id],
  }),
}));

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTenantSchema = createInsertSchema(tenants).extend({
  config: z.object({
    theme: z.enum(["light", "dark"]).optional(),
    logo: z.string().nullable(),
    contactEmail: z.string().email().nullable(),
    address: z.string().nullable(),
    phone: z.string().nullable(),
  }).optional(),
});

export const updateTenantConfigSchema = insertTenantSchema.pick({
  config: true,
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image_url"),
  order: integer("display_order").notNull().default(0),
  active: boolean("active").notNull().default(true),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  image: text("image_url"),
  basePrice: decimal("base_price", { precision: 10, scale: 2 }).notNull(),
  categoryId: integer("category_id").notNull().references(() => categories.id),
  active: boolean("active").notNull().default(true),
  order: integer("display_order").notNull().default(0),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

export const variants = pgTable("variants", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  priceModifier: decimal("price_modifier", { precision: 10, scale: 2 }).notNull().default("0"),
  productId: integer("product_id").notNull().references(() => products.id),
  active: boolean("active").notNull().default(true),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

export const ingredients = pgTable("ingredients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  optional: boolean("optional").notNull().default(false),
  removable: boolean("removable").notNull().default(true),
  productId: integer("product_id").notNull().references(() => products.id),
  tenantId: integer("tenant_id").notNull().references(() => tenants.id),
});

export const categoriesRelations = relations(categories, ({ many, one }) => ({
  products: many(products),
  tenant: one(tenants, {
    fields: [categories.tenantId],
    references: [tenants.id],
  }),
}));

export const productsRelations = relations(products, ({ many, one }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  variants: many(variants),
  ingredients: many(ingredients),
  tenant: one(tenants, {
    fields: [products.tenantId],
    references: [tenants.id],
  }),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  tenantId: true,
}).extend({
  name: z.string().min(1, "El nombre es requerido"),
  description: z.string().nullable(),
  image: z.string().nullable(),
  order: z.number().default(0),
  active: z.boolean().default(true),
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
});

export const insertVariantSchema = createInsertSchema(variants).omit({
  id: true,
});

export const insertIngredientSchema = createInsertSchema(ingredients).omit({
  id: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type TenantConfig = Tenant["config"];
export type Category = typeof categories.$inferSelect;
export type Product = typeof products.$inferSelect;
export type Variant = typeof variants.$inferSelect;
export type Ingredient = typeof ingredients.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type InsertVariant = z.infer<typeof insertVariantSchema>;
export type InsertIngredient = z.infer<typeof insertIngredientSchema>;