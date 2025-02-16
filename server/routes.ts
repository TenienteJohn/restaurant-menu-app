import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTenantSchema, updateTenantConfigSchema, insertUserSchema, insertCategorySchema, insertProductSchema } from "@shared/schema";
import { hashPassword } from "./auth";

function isSuperAdmin(req: Request) {
  return req.user?.isSuperAdmin === true;
}

function isTenantMember(req: Request, tenantId: number) {
  return req.user?.tenantId === tenantId;
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  // Tenant management (super admin only)
  app.post("/api/tenants", async (req, res) => {
    if (!isSuperAdmin(req)) {
      return res.status(403).send("Superadmin required");
    }

    const parsed = insertTenantSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const tenant = await storage.createTenant(parsed.data);
    res.status(201).json(tenant);
  });

  app.get("/api/tenants", async (req, res) => {
    if (!isSuperAdmin(req)) {
      return res.status(403).send("Superadmin required");
    }

    const tenants = await storage.getAllTenants();
    res.json(tenants);
  });

  // User management (super admin only)
  app.post("/api/tenants/:id/users", async (req, res) => {
    if (!isSuperAdmin(req)) {
      return res.status(403).send("Superadmin required");
    }

    const tenantId = parseInt(req.params.id);
    const parsed = insertUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const hashedPassword = await hashPassword(parsed.data.password);
    const user = await storage.createUser({
      ...parsed.data,
      password: hashedPassword,
      tenantId,
      isSuperAdmin: false,
    });

    res.status(201).json(user);
  });

  // Tenant settings (tenant members only)
  app.get("/api/tenants/:id/settings", async (req, res) => {
    const tenantId = parseInt(req.params.id);
    if (!isTenantMember(req, tenantId)) {
      return res.status(403).send("Tenant access required");
    }

    const tenant = await storage.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).send("Tenant not found");
    }

    res.json(tenant);
  });

  app.patch("/api/tenants/:id/settings", async (req, res) => {
    const tenantId = parseInt(req.params.id);
    if (!isTenantMember(req, tenantId)) {
      return res.status(403).send("Tenant access required");
    }

    const parsed = updateTenantConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const tenant = await storage.updateTenantConfig(tenantId, parsed.data.config);
    res.json(tenant);
  });

  // Categories management (tenant members only)
  app.post("/api/tenants/:id/categories", async (req, res) => {
    const tenantId = parseInt(req.params.id);
    if (!isTenantMember(req, tenantId)) {
      return res.status(403).send("Tenant access required");
    }

    const parsed = insertCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const category = await storage.createCategory({
      ...parsed.data,
      tenantId,
    });
    res.status(201).json(category);
  });

  app.get("/api/tenants/:id/categories", async (req, res) => {
    const tenantId = parseInt(req.params.id);
    if (!isTenantMember(req, tenantId)) {
      return res.status(403).send("Tenant access required");
    }

    const categories = await storage.getCategoriesByTenantId(tenantId);
    res.json(categories);
  });

  // Products management (tenant members only)
  app.post("/api/tenants/:tenantId/categories/:categoryId/products", async (req, res) => {
    const tenantId = parseInt(req.params.tenantId);
    if (!isTenantMember(req, tenantId)) {
      return res.status(403).send("Tenant access required");
    }

    const categoryId = parseInt(req.params.categoryId);
    const parsed = insertProductSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const product = await storage.createProduct({
      ...parsed.data,
      categoryId,
      tenantId,
    });
    res.status(201).json(product);
  });

  app.get("/api/tenants/:tenantId/categories/:categoryId/products", async (req, res) => {
    const tenantId = parseInt(req.params.tenantId);
    if (!isTenantMember(req, tenantId)) {
      return res.status(403).send("Tenant access required");
    }

    const categoryId = parseInt(req.params.categoryId);
    const products = await storage.getProductsByCategoryId(categoryId, tenantId);
    res.json(products);
  });

  const httpServer = createServer(app);
  return httpServer;
}