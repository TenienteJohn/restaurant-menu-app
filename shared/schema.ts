import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTenant = z.infer<typeof insertTenantSchema>;
export type Tenant = typeof tenants.$inferSelect;
export type TenantConfig = Tenant["config"];