import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage";

// Extender el tipo Request para incluir tenantId y tenantConfig
declare global {
  namespace Express {
    interface Request {
      tenantId?: number;
      tenantConfig?: any;
    }
  }
}

const app = express();
// Aumentar el límite del body-parser para permitir imágenes más grandes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Middleware para logging
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Middleware para manejar subdominios
app.use(async (req, res, next) => {
  // Saltear el middleware para rutas de assets y vite en desarrollo
  if (req.path.startsWith('/__vite') || req.path.startsWith('/@')) {
    return next();
  }

  try {
    const hostParts = req.hostname.split('.');
    console.log('Host parts:', hostParts);
    console.log('Original hostname:', req.hostname);

    // En desarrollo (localhost o Replit), usar un valor por defecto o un header especial
    let subdomain = 'development';
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                         req.hostname.includes('replit.dev');

    if (!isDevelopment) {
      subdomain = hostParts[0];
    } else if (req.headers['x-tenant-subdomain']) {
      subdomain = req.headers['x-tenant-subdomain'] as string;
    }

    console.log('Subdomain being used:', subdomain);
    console.log('Headers:', req.headers);

    // Si es una ruta de API que no requiere tenant, continuar
    if (req.path === '/api/register' || req.path === '/api/login' || req.path === '/api/logout') {
      console.log('Skipping tenant check for auth route:', req.path);
      return next();
    }

    const tenant = await storage.getTenantBySubdomain(subdomain);
    console.log('Tenant lookup result:', tenant);

    if (!tenant) {
      console.log('No tenant found for subdomain:', subdomain);
      return res.status(404).json({ 
        error: 'Tenant not found',
        message: `No se encontró ningún comercio con el subdominio: ${subdomain}`,
        debug: {
          hostname: req.hostname,
          subdomain: subdomain,
          headers: req.headers['x-tenant-subdomain']
        }
      });
    }

    // Agregar información del tenant al request
    req.tenantId = tenant.id;
    req.tenantConfig = tenant.config;
    console.log('Tenant assigned:', { id: tenant.id, name: tenant.name });

    next();
  } catch (error) {
    console.error("Error en middleware de subdominios:", error);
    next(error);
  }
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    console.error('Error:', err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ 
      message,
      error: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = 5000;
  server.listen(PORT, "0.0.0.0", () => {
    log(`serving on port ${PORT}`);
  });
})();