import type { Express } from "express";
import type { Server } from "http";
import { createHash } from "crypto";
import { storage } from "./storage";
import { api, errorSchemas } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

function hashPassword(pw: string) {
  return createHash("sha256").update(pw + "sure_retail_2024").digest("hex");
}

function isRetailerAuthed(req: any, res: any, next: any) {
  if (req.session?.retailerId) return next();
  return res.status(401).json({ message: "Retailer not authenticated" });
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Set up authentication FIRST
  await setupAuth(app);
  registerAuthRoutes(app);

  // Products API
  app.get(api.products.list.path, async (req, res) => {
    try {
      const searchParams = req.query;
      const parsedParams = {
        search: searchParams.search as string | undefined,
        category: searchParams.category as string | undefined,
        isFeatured: searchParams.isFeatured === 'true' ? true : searchParams.isFeatured === 'false' ? false : undefined,
      };
      
      const products = await storage.getProducts(parsedParams);
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get(api.products.get.path, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid product ID" });
      }
      
      const product = await storage.getProduct(id);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.get(api.orders.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const isAdmin = userId === 'admin-id' || true; // In demo mode, everyone is admin for dashboard access
      
      const { phone } = req.query;
      const orders = await storage.getOrders({ 
        userId: isAdmin ? undefined : userId,
        phone: phone as string 
      });
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch(api.orders.updateStatus.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = api.orders.updateStatus.input.parse(req.body);
      const order = await storage.updateOrderStatus(id, status);
      
      // Simulated Notification
      console.log(`[NOTIFICATION] Order #ORD-${id.toString().padStart(6, '0')} status updated to: ${status}. Notification sent to customer.`);
      
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Admin API
  app.get(api.admin.stats.path, isAuthenticated, async (req: any, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  app.post(api.products.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.products.create.input.parse(req.body);
      const product = await storage.createProduct(input);
      res.status(201).json(product);
    } catch (err) {
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.patch(api.products.update.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const input = api.products.update.input.parse(req.body);
      const product = await storage.updateProduct(id, input);
      res.json(product);
    } catch (err) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete(api.products.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteProduct(id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  app.patch("/api/orders/:id/payment", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { paymentStatus } = req.body;
      const order = await storage.updateOrderPaymentStatus(id, paymentStatus);
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: "Failed to update payment status" });
    }
  });

  // Seller Submissions API
  app.post("/api/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { name, description, price, imageUrl, category, stock, submitterName } = req.body;
      if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "Name, description, price and category are required" });
      }
      const submission = await storage.createSubmission({
        userId,
        submitterName: submitterName || null,
        name,
        description,
        price: String(price),
        imageUrl: imageUrl || null,
        category,
        stock: Number(stock) || 1,
      });
      res.status(201).json(submission);
    } catch (err) {
      res.status(500).json({ message: "Failed to create submission" });
    }
  });

  app.get("/api/submissions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { all, status } = req.query;
      // In demo mode, anyone can access admin view. In production, check admin role.
      const submissions = await storage.getSubmissions({
        userId: all === 'true' ? undefined : userId,
        status: status as string | undefined,
      });
      res.json(submissions);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.patch("/api/submissions/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status, adminNotes } = req.body;
      if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      const submission = await storage.updateSubmissionStatus(id, status, adminNotes);
      if (status === 'approved') {
        console.log(`[ADMIN] Submission #${id} approved — product added to catalog.`);
      }
      res.json(submission);
    } catch (err) {
      res.status(500).json({ message: "Failed to update submission" });
    }
  });

  app.get(api.orders.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid order ID" });
      }
      
      const order = await storage.getOrder(id, userId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      res.json(order);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post(api.orders.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const input = api.orders.create.input.parse(req.body);
      
      if (input.items.length === 0) {
        return res.status(400).json({ message: "Order must have at least one item", field: "items" });
      }

      // Calculate total and prepare items
      let totalAmount = 0;
      const orderItemsToInsert = [];
      
      for (const item of input.items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found`, field: "items" });
        }
        
        const price = Number(product.price);
        totalAmount += price * item.quantity;
        
        orderItemsToInsert.push({
          productId: product.id,
          quantity: item.quantity,
          price: price.toString(),
        });
      }
      
      // Generate simple 6-digit OTP for tracker
      const otp = Math.floor(100000 + Math.random() * 900000).toString();

      const order = await storage.createOrder(
        {
          userId,
          totalAmount: totalAmount.toString(),
          status: 'Order Placed',
          paymentMethod: input.paymentMethod,
          paymentStatus: input.paymentMethod === 'COD' ? 'pending' : 'paid',
          otp,
          address: input.address,
          phone: input.phone,
        },
        orderItemsToInsert as any
      );
      
      res.status(201).json(order);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // ── Admin: Retailer Management ───────────────────────────────
  app.get("/api/admin/retailers", isAuthenticated, async (req: any, res) => {
    try {
      const all = await storage.getAllRetailers();
      const safe = all.map(({ passwordHash: _, ...r }) => r);
      res.json(safe);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch retailers" });
    }
  });

  app.patch("/api/admin/retailers/:id/password", isAuthenticated, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const { newPassword } = req.body;
      if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const retailer = await storage.updateRetailer(id, { passwordHash: hashPassword(newPassword) } as any);
      const { passwordHash: _, ...safe } = retailer;
      res.json(safe);
    } catch (err) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ── Retailer Auth Routes ─────────────────────────────────────
  app.post("/api/retailer/register", async (req: any, res) => {
    try {
      const { storeName, email, password, phone, upiId } = req.body;
      if (!storeName || !email || !password) {
        return res.status(400).json({ message: "Store name, email and password are required" });
      }
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      const existing = await storage.getRetailerByEmail(email);
      if (existing) {
        return res.status(409).json({ message: "An account with this email already exists" });
      }
      const retailer = await storage.createRetailer({
        storeName,
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
        phone: phone || undefined,
        upiId: upiId || undefined,
      });
      req.session.retailerId = retailer.id;
      const { passwordHash: _, ...safe } = retailer;
      res.status(201).json(safe);
    } catch (err) {
      res.status(500).json({ message: "Registration failed" });
    }
  });

  app.post("/api/retailer/login", async (req: any, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      const retailer = await storage.getRetailerByEmail(email);
      if (!retailer || retailer.passwordHash !== hashPassword(password)) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      req.session.retailerId = retailer.id;
      const { passwordHash: _, ...safe } = retailer;
      res.json(safe);
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/retailer/logout", (req: any, res) => {
    req.session.retailerId = undefined;
    res.json({ message: "Logged out" });
  });

  app.get("/api/retailer/me", isRetailerAuthed, async (req: any, res) => {
    try {
      const retailer = await storage.getRetailerById(req.session.retailerId);
      if (!retailer) return res.status(404).json({ message: "Retailer not found" });
      const { passwordHash: _, ...safe } = retailer;
      res.json(safe);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch retailer" });
    }
  });

  app.patch("/api/retailer/me", isRetailerAuthed, async (req: any, res) => {
    try {
      const { storeName, phone, upiId } = req.body;
      const retailer = await storage.updateRetailer(req.session.retailerId, { storeName, phone, upiId });
      const { passwordHash: _, ...safe } = retailer;
      res.json(safe);
    } catch (err) {
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // ── Retailer Product Management ──────────────────────────────
  app.get("/api/retailer/products", isRetailerAuthed, async (req: any, res) => {
    try {
      const products = await storage.getRetailerProducts(req.session.retailerId);
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.patch("/api/retailer/products/:id", isRetailerAuthed, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const products = await storage.getRetailerProducts(req.session.retailerId);
      if (!products.find(p => p.id === id)) {
        return res.status(403).json({ message: "You do not own this product" });
      }
      const { name, description, price, imageUrl, category, stock, isFeatured } = req.body;
      const updated = await storage.updateProduct(id, { name, description, price: String(price), imageUrl, category, stock: Number(stock), isFeatured });
      res.json(updated);
    } catch (err) {
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete("/api/retailer/products/:id", isRetailerAuthed, async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      const products = await storage.getRetailerProducts(req.session.retailerId);
      if (!products.find(p => p.id === id)) {
        return res.status(403).json({ message: "You do not own this product" });
      }
      await storage.deleteProduct(id);
      res.status(204).end();
    } catch (err) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // ── Retailer Password Reset (self-service) ───────────────────
  app.post("/api/retailer/reset-password", async (req: any, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ message: "Email and a password of at least 6 characters are required" });
      }
      const retailer = await storage.getRetailerByEmail(email);
      if (!retailer) {
        return res.status(404).json({ message: "No account found with this email" });
      }
      await storage.updateRetailer(retailer.id, { passwordHash: hashPassword(newPassword) } as any);
      res.json({ message: "Password reset successfully" });
    } catch (err) {
      res.status(500).json({ message: "Failed to reset password" });
    }
  });

  // ── Retailer Submissions ─────────────────────────────────────
  app.get("/api/retailer/submissions", isRetailerAuthed, async (req: any, res) => {
    try {
      const submissions = await storage.getRetailerSubmissions(req.session.retailerId);
      res.json(submissions);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch submissions" });
    }
  });

  app.post("/api/retailer/submissions", isRetailerAuthed, async (req: any, res) => {
    try {
      const { name, description, price, imageUrl, category, stock, upiId } = req.body;
      if (!name || !description || !price || !category) {
        return res.status(400).json({ message: "Name, description, price and category are required" });
      }
      const retailer = await storage.getRetailerById(req.session.retailerId);
      const submission = await storage.createSubmission({
        userId: `retailer_${req.session.retailerId}`,
        retailerId: req.session.retailerId,
        submitterName: retailer?.storeName,
        name,
        description,
        price: String(price),
        imageUrl: imageUrl || null,
        category,
        stock: Number(stock) || 1,
        upiId: upiId || retailer?.upiId || null,
      });
      res.status(201).json(submission);
    } catch (err) {
      res.status(500).json({ message: "Failed to submit product" });
    }
  });

  // ── Retailer Orders ──────────────────────────────────────────
  app.get("/api/retailer/orders", isRetailerAuthed, async (req: any, res) => {
    try {
      const orders = await storage.getRetailerOrders(req.session.retailerId);
      res.json(orders);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  return httpServer;
}

export async function seedDatabase() {
  const products = await storage.getProducts();
  if (products.length === 0) {
    const defaultProducts = [
      {
        name: "Wireless Noise-Cancelling Headphones",
        description: "Premium over-ear headphones with active noise cancellation and 30-hour battery life.",
        price: "249.99",
        category: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80",
        stock: 50,
        isFeatured: true,
      },
      {
        name: "Smart Fitness Watch",
        description: "Track your health metrics, workouts, and receive notifications on your wrist.",
        price: "129.50",
        category: "Electronics",
        imageUrl: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80",
        stock: 100,
        isFeatured: true,
      },
      {
        name: "Men's Slim Fit Kurta",
        description: "Elegant cotton blend kurta for formal and casual occasions.",
        price: "45.99",
        category: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1597983073493-88cd35cf93b0?w=800&q=80",
        stock: 40,
        isFeatured: true,
      },
      {
        name: "Designer Embroidered Kurta",
        description: "Beautifully detailed silk kurta with traditional embroidery patterns.",
        price: "89.99",
        category: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=800&q=80",
        stock: 25,
        isFeatured: true,
      },
      {
        name: "Casual Printed Kurta",
        description: "Lightweight and breathable linen kurta with modern geometric prints.",
        price: "34.99",
        category: "Fashion",
        imageUrl: "https://images.unsplash.com/photo-1598533167405-062bd327705c?w=800&q=80",
        stock: 60,
        isFeatured: false,
      },
      {
        name: "Fresh Organic Apples",
        description: "Crisp and sweet organic gala apples, farm-fresh.",
        price: "4.99",
        category: "Grocery",
        imageUrl: "https://images.unsplash.com/photo-1567306226416-28f0efdc88ce?w=800&q=80",
        stock: 500,
        isFeatured: false,
      },
      {
        name: "Natural Moisturizing Cream",
        description: "Hydrating face cream with aloe vera and vitamin E.",
        price: "19.99",
        category: "Beauty & Personal Care",
        imageUrl: "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&q=80",
        stock: 80,
        isFeatured: true,
      },
      {
        name: "Ergonomic Office Chair",
        description: "Fully adjustable office chair designed for all-day comfort and back support.",
        price: "199.00",
        category: "Furniture",
        imageUrl: "https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=800&q=80",
        stock: 25,
        isFeatured: false,
      },
      {
        name: "Minimalist Desk Lamp",
        description: "Modern LED desk lamp with adjustable brightness and color temperature.",
        price: "45.00",
        category: "Home & Kitchen",
        imageUrl: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&q=80",
        stock: 200,
        isFeatured: false,
      },
      {
        name: "Premium Coffee Maker",
        description: "Brews barista-quality coffee at home. Features programmable timer and thermal carafe.",
        price: "89.99",
        category: "Home & Kitchen",
        imageUrl: "https://images.unsplash.com/photo-1495474472207-464a8d4ee7a4?w=800&q=80",
        stock: 30,
        isFeatured: true,
      },
      {
        name: "Yoga Resistance Band Set",
        description: "Set of 5 premium resistance bands for home workouts and physical therapy.",
        price: "24.99",
        category: "Sports & Fitness",
        imageUrl: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
        stock: 150,
        isFeatured: false,
      }
    ];

    for (const product of defaultProducts) {
      await storage.createProduct(product);
    }
    console.log("Database seeded with default products");
  }
}
