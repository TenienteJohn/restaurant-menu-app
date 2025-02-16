import { users, tenants, categories, products, variants, ingredients, type User, type InsertUser, type Tenant, type InsertTenant, type TenantConfig, type Category, type InsertCategory, type Product, type InsertProduct } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tenants: Map<number, Tenant>;
  private categories: Map<number, Category>;
  private products: Map<number, Product>;
  currentUserId: number;
  currentTenantId: number;
  currentCategoryId: number;
  currentProductId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.tenants = new Map();
    this.categories = new Map();
    this.products = new Map();
    this.currentUserId = 1;
    this.currentTenantId = 1;
    this.currentCategoryId = 1;
    this.currentProductId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser & { isSuperAdmin?: boolean, tenantId?: number | null }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isSuperAdmin: insertUser.isSuperAdmin || false,
      tenantId: insertUser.tenantId || null,
      role: "user"
    };
    this.users.set(id, user);
    return user;
  }

  async getTenant(id: number): Promise<Tenant | undefined> {
    return this.tenants.get(id);
  }

  async getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined> {
    return Array.from(this.tenants.values()).find(
      (tenant) => tenant.subdomain === subdomain,
    );
  }

  async getAllTenants(): Promise<Tenant[]> {
    return Array.from(this.tenants.values());
  }

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const id = this.currentTenantId++;
    const tenant: Tenant = {
      ...insertTenant,
      id,
      active: true,
      config: {
        theme: "light",
        logo: null,
        contactEmail: null,
        address: null,
        phone: null,
        ...insertTenant.config,
      },
    };
    this.tenants.set(id, tenant);
    return tenant;
  }

  async updateTenantConfig(id: number, config: TenantConfig): Promise<Tenant> {
    const tenant = await this.getTenant(id);
    if (!tenant) {
      throw new Error("Tenant not found");
    }

    const updatedTenant = {
      ...tenant,
      config,
    };
    this.tenants.set(id, updatedTenant);
    return updatedTenant;
  }

  async getCategoriesByTenantId(tenantId: number): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(
      (category) => category.tenantId === tenantId
    );
  }

  async createCategory(insertCategory: InsertCategory & { tenantId: number }): Promise<Category> {
    const id = this.currentCategoryId++;
    const category: Category = {
      ...insertCategory,
      id,
    };
    this.categories.set(id, category);
    return category;
  }

  async getProductsByCategoryId(categoryId: number, tenantId: number): Promise<Product[]> {
    return Array.from(this.products.values()).filter(
      (product) => product.categoryId === categoryId && product.tenantId === tenantId
    );
  }

  async createProduct(insertProduct: InsertProduct & { categoryId: number, tenantId: number }): Promise<Product> {
    const id = this.currentProductId++;
    const product: Product = {
      ...insertProduct,
      id,
    };
    this.products.set(id, product);
    return product;
  }
}

export const storage = new MemStorage();