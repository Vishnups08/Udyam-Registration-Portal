import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { z } from "zod";
import fs from "node:fs";
import path from "node:path";

// Rate limiting middleware
import rateLimit from 'express-rate-limit';

// Import validation service for individual field validation
import { ValidationService } from './services/validation.service.js';

dotenv.config();

const app = express();

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
app.use(limiter);

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

app.use(cors());
app.use(express.json());

// Enhanced validation patterns
export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const aadhaarRegex = /^[2-9][0-9]{11}$/;
export const mobileRegex = /^[6-9][0-9]{9}$/;
export const otpRegex = /^[0-9]{6}$/;
export const pincodeRegex = /^[0-9]{6}$/;

async function loadShared() {
  try {
    // Dynamic import to support Jest + ESM
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    const mod = await import("../../schema/dist/index.js");
    return mod as any;
  } catch {
    return null;
  }
}

function fallbackSchemas() {
  const aadhaarRegex = /^[2-9][0-9]{11}$/;
  const mobileRegex = /^[6-9][0-9]{9}$/;
  const otpRegex = /^[0-9]{6}$/;
  const Step1Data = z.object({
    aadhaarNumber: z.string().regex(aadhaarRegex),
    mobileNumber: z.string().regex(mobileRegex),
    otp: z.string().regex(otpRegex),
  });
  const Step2Data = z.object({
    panNumber: z.string().regex(panRegex),
    pincode: z.string().optional(),
    state: z.string().optional(),
    city: z.string().optional(),
  });
  const SubmissionData = Step1Data.merge(Step2Data);
  const step1Schema = {
    title: "Step 1",
    step: 1,
    fields: [
      { id: "aadhaarNumber", name: "aadhaarNumber", label: "Aadhaar Number", type: "tel", validation: { minLength: 12, maxLength: 12 } },
      { id: "mobileNumber", name: "mobileNumber", label: "Mobile Number", type: "tel", validation: { minLength: 10, maxLength: 10 } },
      { id: "otp", name: "otp", label: "OTP", type: "tel", validation: { minLength: 6, maxLength: 6 } },
    ],
  };
  const step2Schema = {
    title: "Step 2",
    step: 2,
    fields: [
      { id: "panNumber", name: "panNumber", label: "PAN Number", type: "text", validation: { minLength: 10, maxLength: 10 } },
    ],
  };
  return { Step1Data, Step2Data, SubmissionData, step1Schema, step2Schema };
}

app.get("/health", (_, res) => res.json({ ok: true }));

app.get("/form-schema/:step", async (req, res) => {
  const step = Number(req.params.step);
  const shared = await loadShared();
  const { step1Schema, step2Schema } = shared ?? fallbackSchemas();
  if (step === 1) return res.json(step1Schema);
  if (step === 2) return res.json(step2Schema);
  return res.status(404).json({ error: "Unknown step" });
});

app.get("/scraped-schema/:step", (req, res) => {
  const step = Number(req.params.step);
  const file = path.resolve(process.cwd(), `schema/generated/step${step}.json`);
  if (!fs.existsSync(file)) return res.status(404).json({ error: "Scraped schema not found" });
  try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    return res.json(data);
  } catch (e: any) {
    return res.status(500).json({ error: e?.message || "Failed to read scraped schema" });
  }
});

// Enhanced validation endpoints using validation service
app.post("/validate/pan", (req, res) => {
  const { panNumber } = req.body;
  if (!panNumber) return res.status(400).json({ error: "PAN number is required" });
  
  const result = ValidationService.validatePAN(panNumber);
  if (result.valid) {
    return res.json({ valid: true, message: "PAN format is valid" });
  } else {
    return res.status(400).json({ valid: false, error: result.error });
  }
});

app.post("/validate/aadhaar", (req, res) => {
  const { aadhaarNumber } = req.body;
  if (!aadhaarNumber) return res.status(400).json({ error: "Aadhaar number is required" });
  
  const result = ValidationService.validateAadhaar(aadhaarNumber);
  if (result.valid) {
    return res.json({ valid: true, message: "Aadhaar format is valid" });
  } else {
    return res.status(400).json({ valid: false, error: result.error });
  }
});

app.post("/validate/otp", (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: "OTP is required" });
  
  const result = ValidationService.validateOTP(otp);
  if (result.valid) {
    return res.json({ valid: true, message: "OTP format is valid" });
  } else {
    return res.status(400).json({ valid: false, error: result.error });
  }
});

app.post("/validate/pincode", (req, res) => {
  const { pincode } = req.body;
  if (!pincode) return res.status(400).json({ error: "PIN code is required" });
  
  const result = ValidationService.validatePincode(pincode);
  if (result.valid) {
    return res.json({ valid: true, message: "PIN code format is valid" });
  } else {
    return res.status(400).json({ valid: false, error: result.error });
  }
});

// Prisma is optional during local dev; load lazily
let prisma: any = null;
async function getPrisma() {
  if (prisma) return prisma;
  try {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    return prisma;
  } catch (e) {
    return null;
  }
}

// Enhanced form submission with comprehensive validation
app.post("/submit", async (req, res) => {
  try {
    // Enhanced validation schema
    const submissionSchema = z.object({
      aadhaarNumber: z.string().regex(aadhaarRegex, "Invalid Aadhaar format"),
      entrepreneurName: z.string().min(1, "Entrepreneur name is required"),
      consent: z.boolean().refine(val => val === true, "Consent is required"),
      otp: z.string().regex(otpRegex, "Invalid OTP format"),
      otpVerified: z.boolean().refine(val => val === true, "OTP must be verified"),
      organisationType: z.string().min(1, "Organisation type is required"),
      panNumber: z.string().regex(panRegex, "Invalid PAN format"),
      panHolderName: z.string().min(1, "PAN holder name is required"),
      dob: z.string().min(1, "Date of birth is required"),
      panConsent: z.boolean().refine(val => val === true, "PAN consent is required"),
      pincode: z.string().regex(pincodeRegex, "Invalid PIN code format"),
      state: z.string().min(1, "State is required"),
      city: z.string().min(1, "City is required")
    });

    const parsed = submissionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ 
        error: "Validation failed", 
        details: parsed.error.errors 
      });
    }

    const client = await getPrisma();
    if (!client) {
      return res.status(202).json({ 
        stored: false, 
        message: "Database not configured. Data accepted for validation only.", 
        data: parsed.data 
      });
    }

    // Store in database
    const saved = await client.udyamSubmission.create({ 
      data: {
        aadhaarNumber: parsed.data.aadhaarNumber,
        entrepreneurName: parsed.data.entrepreneurName,
        consent: parsed.data.consent,
        otp: parsed.data.otp,
        otpVerified: parsed.data.otpVerified,
        organisationType: parsed.data.organisationType,
        panNumber: parsed.data.panNumber,
        panHolderName: parsed.data.panHolderName,
        dob: parsed.data.dob,
        panConsent: parsed.data.panConsent,
        pincode: parsed.data.pincode,
        state: parsed.data.state,
        city: parsed.data.city,
        status: "pending"
      }
    });

    return res.json({ 
      stored: true, 
      id: saved.id,
      message: "Udyam registration submitted successfully"
    });

  } catch (e: any) {
    console.error("Submission error:", e);
    return res.status(500).json({ 
      error: "Internal server error", 
      message: e?.message || "Failed to store submission" 
    });
  }
});

export function start(port = Number(process.env.PORT) || 4000) {
  return app.listen(port, () => console.log(`Backend listening on http://localhost:${port}`));
}

export { app };

if (process.env.NODE_ENV !== "test") {
  start();
} 