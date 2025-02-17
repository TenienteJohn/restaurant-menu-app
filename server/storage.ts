import { users, tenants, categories, products, productVariants, type User, type InsertUser, type Tenant, type InsertTenant, type TenantConfig, type Category, type InsertCategory, type Product, type InsertProduct, type ProductVariant, type InsertProductVariant } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";

const PostgresSessionStore = connectPg(session);

interface UpdateProduct {
  name?: string;
  description?: string | null;
  image?: string | null;
  active?: boolean;
  order?: number;
  categoryId?: number;
  basePrice?: string;
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
    this.sessionStore = new PostgresSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser & { isSuperAdmin?: boolean, tenantId?: number | null }): Promise<User> {
    const [newUser] = await db.insert(users).values({
      username: user.username,
      password: user.password,
      isSuperAdmin: user.isSuperAdmin || false,
      tenantId: user.tenantId || null,
      role: "user",
    }).returning();
    return newUser;
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

  async createTenant(tenant: InsertTenant): Promise<Tenant> {
    const [newTenant] = await db.insert(tenants).values({
      name: tenant.name,
      subdomain: tenant.subdomain,
      active: tenant.active ?? true,
      config: tenant.config || {
        theme: "light",
        logo: null,
        contactEmail: null,
        address: null,
        phone: null,
      },
    }).returning();
    return newTenant;
  }

  async updateTenantConfig(id: number, config: TenantConfig): Promise<Tenant> {
    const [updatedTenant] = await db
      .update(tenants)
      .set({ config })
      .where(eq(tenants.id, id))
      .returning();

    if (!updatedTenant) {
      throw new Error("Tenant not found");
    }

    return updatedTenant;
  }

  async getCategoriesByTenantId(tenantId: number): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.tenantId, tenantId));
  }

  async createCategory(category: InsertCategory & { tenantId: number }): Promise<Category> {
    const [newCategory] = await db.insert(categories).values({
      name: category.name,
      description: category.description ?? null,
      image: category.image ?? null,
      order: category.order ?? 0,
      active: category.active ?? true,
      tenantId: category.tenantId,
    }).returning();
    return newCategory;
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

  async createProduct(product: InsertProduct & { categoryId: number, tenantId: number }): Promise<Product> {
    const [newProduct] = await db.insert(products).values({
      name: product.name,
      description: product.description ?? null,
      image: product.image ?? null,
      basePrice: product.basePrice.toString(),
      categoryId: product.categoryId,
      active: product.active ?? true,
      order: product.order ?? 0,
      tenantId: product.tenantId,
    }).returning();
    return newProduct;
  }

  async getProductVariants(productId: number): Promise<ProductVariant[]> {
    return await db
      .select()
      .from(productVariants)
      .where(eq(productVariants.productId, productId));
  }

  async createProductVariant(variant: InsertProductVariant & { productId: number, tenantId: number }): Promise<ProductVariant> {
    const [newVariant] = await db.insert(productVariants).values({
      name: variant.name,
      price: variant.price.toString(),
      productId: variant.productId,
      order: variant.order ?? 0,
      active: variant.active ?? true,
      tenantId: variant.tenantId,
    }).returning();
    return newVariant;
  }

  async getAllProductsByTenantId(tenantId: number): Promise<Product[]> {
    return await db
      .select()
      .from(products)
      .where(eq(products.tenantId, tenantId));
  }

  async updateProduct(productId: number, tenantId: number, updateData: UpdateProduct): Promise<Product> {
    // Si basePrice está presente, asegurarse de que sea un string
    if (updateData.basePrice !== undefined) {
      updateData.basePrice = updateData.basePrice.toString();
    }

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(and(
        eq(products.id, productId),
        eq(products.tenantId, tenantId)
      ))
      .returning();

    if (!updatedProduct) {
      throw new Error("Product not found");
    }

    return updatedProduct;
  }
}

export const storage = new DatabaseStorage();