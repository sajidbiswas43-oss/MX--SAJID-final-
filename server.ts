import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";

dotenv.config();

// Safely load and parse firebase-applet-config.json if it exists
let appletConfig: any = {};
try {
  const configPath = path.resolve(process.cwd(), "firebase-applet-config.json");
  if (fs.existsSync(configPath)) {
    appletConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
  }
} catch (error) {
  console.error("Error reading firebase-applet-config.json:", error);
}

// Robust env parser that extracts safe values even if process.env values are concatenated/corrupted
function getSafeEnv(key: string, fallback: string): string {
  // 1. Check if we have a clean static config value first
  if (key === "VITE_FIREBASE_PROJECT_ID" && appletConfig.projectId) {
    return appletConfig.projectId;
  }
  if (key === "VITE_FIREBASE_FIRESTORE_DATABASE_ID" && appletConfig.firestoreDatabaseId) {
    return appletConfig.firestoreDatabaseId;
  }
  if (key === "VITE_FIREBASE_APP_ID" && appletConfig.appId) {
    return appletConfig.appId;
  }
  if (key === "VITE_FIREBASE_API_KEY" && appletConfig.apiKey) {
    return appletConfig.apiKey;
  }
  if (key === "VITE_FIREBASE_AUTH_DOMAIN" && appletConfig.authDomain) {
    return appletConfig.authDomain;
  }
  if (key === "VITE_FIREBASE_STORAGE_BUCKET" && appletConfig.storageBucket) {
    return appletConfig.storageBucket;
  }
  if (key === "VITE_FIREBASE_MESSAGING_SENDER_ID" && appletConfig.messagingSenderId) {
    return appletConfig.messagingSenderId;
  }

  // 2. Check process.env directly if not corrupted
  const directVal = process.env[key];
  if (directVal && !directVal.includes("VITE_FIREBASE_API_KEY=")) {
    return directVal;
  }

  // 3. Scan all process.env values for a corrupted bundled environment string
  for (const k of Object.keys(process.env)) {
    const val = process.env[k];
    if (val && val.includes("VITE_FIREBASE_API_KEY=")) {
      const match = val.match(new RegExp(`${key}=([^\\s]+)`));
      if (match) return match[1];
    }
  }

  return fallback;
}

const cleanProjectId = getSafeEnv("VITE_FIREBASE_PROJECT_ID", "gen-lang-client-0704847765");
const cleanDatabaseId = getSafeEnv("VITE_FIREBASE_FIRESTORE_DATABASE_ID", "ai-studio-ae394b26-653b-40e6-8779-5ecc426a61a4");

// Initialize Firebase Admin
if (!admin.apps.length) {
  let initialized = false;
  
  // Try to initialize with service account if it looks like JSON
  const serviceAccountStr = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (serviceAccountStr && serviceAccountStr.trim().startsWith('{')) {
    try {
      const serviceAccount = JSON.parse(serviceAccountStr);
      if (serviceAccount.project_id) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
        initialized = true;
      }
    } catch (error) {
      console.error("Firebase Admin service account parsing error:", error);
    }
  }

  // Fallback to project ID initialization if not already initialized
  if (!initialized) {
    try {
      admin.initializeApp({
        projectId: cleanProjectId,
      });
    } catch (error) {
      console.error("Firebase Admin project ID initialization error:", error);
    }
  }
}

const db = getFirestore(cleanDatabaseId);
const auth = getAuth();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use('*all', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        
        // Inject environment variables
        const envVars = {
          VITE_FIREBASE_API_KEY: getSafeEnv("VITE_FIREBASE_API_KEY", ""),
          VITE_FIREBASE_AUTH_DOMAIN: getSafeEnv("VITE_FIREBASE_AUTH_DOMAIN", ""),
          VITE_FIREBASE_PROJECT_ID: getSafeEnv("VITE_FIREBASE_PROJECT_ID", ""),
          VITE_FIREBASE_STORAGE_BUCKET: getSafeEnv("VITE_FIREBASE_STORAGE_BUCKET", ""),
          VITE_FIREBASE_MESSAGING_SENDER_ID: getSafeEnv("VITE_FIREBASE_MESSAGING_SENDER_ID", ""),
          VITE_FIREBASE_APP_ID: getSafeEnv("VITE_FIREBASE_APP_ID", ""),
          VITE_FIREBASE_FIRESTORE_DATABASE_ID: getSafeEnv("VITE_FIREBASE_FIRESTORE_DATABASE_ID", ""),
          VITE_EMAILJS_PUBLIC_KEY: process.env.VITE_EMAILJS_PUBLIC_KEY || "",
          VITE_EMAILJS_SERVICE_ID: process.env.VITE_EMAILJS_SERVICE_ID || "",
          VITE_EMAILJS_TEMPLATE_ID: process.env.VITE_EMAILJS_TEMPLATE_ID || "",
        };
        
        template = template.replace(
          'window.env = {',
          `window.env = ${JSON.stringify(envVars)};\n        window.env_placeholder = {`
        );

        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e: any) {
        vite.ssrFixStacktrace(e);
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
