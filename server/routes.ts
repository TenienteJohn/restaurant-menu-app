import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertTenantSchema } from "@shared/schema";

function isSuperAdmin(req: Request) {
  return req.user?.isSuperAdmin === true;
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

  const httpServer = createServer(app);
  return httpServer;
}