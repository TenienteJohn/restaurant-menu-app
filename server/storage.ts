import { users, tenants, categories, products, productVariants, type User, type InsertUser, type Tenant, type InsertTenant, type TenantConfig, type Category, type InsertCategory, type Product, type InsertProduct, type ProductVariant, type InsertProductVariant } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);
const MemoryStore = createMemoryStore(session);

interface UpdateProduct {
    name: string;
    description: string | null;
    image: string | null;
    basePrice: string;
    active: boolean;
    order: number;
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { isSuperAdmin?: boolean, tenantId?: number | null }): Promise<User>;
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  getAllTenants(): Promise<Tenant[]>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  updateTenantConfig(id: number, config: TenantConfig): Promise<Tenant>;
  getCategoriesByTenantId(tenantId: number): Promise<Category[]>;
  createCategory(category: InsertCategory & { tenantId: number }): Promise<Category>;
  getProductsByCategoryId(categoryId: number, tenantId: number): Promise<Product[]>;
  createProduct(product: InsertProduct & { categoryId: number, tenantId: number }): Promise<Product>;
  sessionStore: session.Store;
  getProductVariants(productId: number): Promise<ProductVariant[]>;
  createProductVariant(variant: InsertProductVariant & { productId: number, tenantId: number }): Promise<ProductVariant>;
  getAllProductsByTenantId(tenantId: number): Promise<Product[]>;
  updateProduct(productId: number, tenantId: number, product: UpdateProduct): Promise<Product>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    if (process.env.DATABASE_URL) {
      this.sessionStore = new PostgresSessionStore({
        conObject: {
          connectionString: process.env.DATABASE_URL,
        },
        createTableIfMissing: true,
      });
    } else {
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000,
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { isSuperAdmin?: boolean, tenantId?: number | null }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        isSuperAdmin: insertUser.isSuperAdmin || false,
        tenantId: insertUser.tenantId || null,
        role: "user"
      })
      .returning();
    return user;
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.id, id));
    return tenant;
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    const [tenant] = await db.select().from(tenants).where(eq(tenants.subdomain, subdomain));
    return tenant;
  }

  async getAllTenants(): Promise<Tenant[]> {
    return await db.select().from(tenants);
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const [tenant] = await db
      .insert(tenants)
      .values({
        ...insertTenant,
        active: insertTenant.active ?? true,
        config: {
          theme: "light",
          logo: null,
          contactEmail: null,
          address: null,
          phone: null,
          ...insertTenant.config,
        },
      })
      .returning();
    return tenant;
  }

  async updateTenantConfig(id: number, config: TenantConfig): Promise<Tenant> {
    const [tenant] = await db
      .update(tenants)
      .set({ config })
      .where(eq(tenants.id, id))
      .returning();
    return tenant;
  }

  async getCategoriesByTenantId(tenantId: number): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.tenantId, tenantId));
  }

  async createCategory(insertCategory: InsertCategory & { tenantId: number }): Promise<Category> {
    const [category] = await db
      .insert(categories)
      .values({
        ...insertCategory,
        active: insertCategory.active ?? true,
        order: insertCategory.order ?? 0,
        description: insertCategory.description ?? null,
        image: insertCategory.image ?? null,
      })
      .returning();
    return category;
  }

  async getProductsByCategoryId(categoryId: number, tenantId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(and(
        eq(products.categoryId, categoryId),
        eq(products.tenantId, tenantId)
      ));
  }

  async createProduct(insertProduct: InsertProduct & { categoryId: number, tenantId: number }): Promise<Product> {
    const [product] = await db
      .insert(products)
      .values({
        ...insertProduct,
        active: insertProduct.active ?? true,
        order: insertProduct.order ?? 0,
        description: insertProduct.description ?? null,
        image: insertProduct.image ?? null,
      })
      .returning();
    return product;
  }

  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
  }

  async createProductVariant(insertVariant: InsertProductVariant & { productId: number, tenantId: number }): Promise<ProductVariant> {
    const [variant] = await db
      .insert(productVariants)
      .values({
        ...insertVariant,
        active: insertVariant.active ?? true,
        order: insertVariant.order ?? 0,
      })
      .returning();
    return variant;
  }

  async getAllProductsByTenantId(tenantId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.tenantId, tenantId));
  }

  async updateProduct(productId: number, tenantId: number, updateProduct: UpdateProduct): Promise<Product> {
    try {
      const [product] = await db
        .update(products)
        .set(updateProduct)
        .where(and(
          eq(products.id, productId),
          eq(products.tenantId, tenantId)
        ))
        .returning();

      if (!product) {
        throw new Error("Product not found");
      }

      return product;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();