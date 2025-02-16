import { users, tenants, type User, type InsertUser, type Tenant, type InsertTenant } from "@shared/schema";
import session from "express-session";
import { db } from "./db";
import { eq } from "drizzle-orm";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { isSuperAdmin?: boolean }): Promise<User>;
  getTenant(id: number): Promise<Tenant | undefined>;
  getTenantBySubdomain(subdomain: string): Promise<Tenant | undefined>;
  createTenant(tenant: InsertTenant): Promise<Tenant>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tenants: Map<number, Tenant>;
  currentUserId: number;
  currentTenantId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.tenants = new Map();
    this.currentUserId = 1;
    this.currentTenantId = 1;
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

  async createUser(insertUser: InsertUser & { isSuperAdmin?: boolean }): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      isSuperAdmin: insertUser.isSuperAdmin || false,
      tenantId: null 
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

  async createTenant(insertTenant: InsertTenant): Promise<Tenant> {
    const id = this.currentTenantId++;
    const tenant: Tenant = { ...insertTenant, id, active: true };
    this.tenants.set(id, tenant);
    return tenant;
  }
}

export const storage = new MemStorage();