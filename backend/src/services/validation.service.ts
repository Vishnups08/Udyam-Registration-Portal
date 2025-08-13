import { z } from "zod";

// Enhanced validation patterns
export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const aadhaarRegex = /^[2-9][0-9]{11}$/;
export const mobileRegex = /^[6-9][0-9]{9}$/;
export const otpRegex = /^[0-9]{6}$/;
export const pincodeRegex = /^[0-9]{6}$/;

// Validation schemas
export const aadhaarSchema = z.object({
  aadhaarNumber: z.string().regex(aadhaarRegex, "Invalid Aadhaar format. Must be 12 digits starting with 2-9")
});

export const panSchema = z.object({
  panNumber: z.string().regex(panRegex, "Invalid PAN format. Expected: ABCDE1234F")
});

export const otpSchema = z.object({
  otp: z.string().regex(otpRegex, "Invalid OTP format. Must be 6 digits")
});

export const pincodeSchema = z.object({
  pincode: z.string().regex(pincodeRegex, "Invalid PIN code format. Must be 6 digits")
});

export const submissionSchema = z.object({
  aadhaarNumber: z.string().regex(aadhaarRegex, "Invalid Aadhaar format"),
  entrepreneurName: z.string().min(1, "Entrepreneur name is required").max(100, "Name too long"),
  consent: z.boolean().refine(val => val === true, "Consent is required"),
  otp: z.string().regex(otpRegex, "Invalid OTP format"),
  otpVerified: z.boolean().refine(val => val === true, "OTP must be verified"),
  organisationType: z.string().min(1, "Organisation type is required"),
  panNumber: z.string().regex(panRegex, "Invalid PAN format"),
  panHolderName: z.string().min(1, "PAN holder name is required").max(100, "Name too long"),
  dob: z.string().min(1, "Date of birth is required"),
  panConsent: z.boolean().refine(val => val === true, "PAN consent is required"),
  pincode: z.string().regex(pincodeRegex, "Invalid PIN code format"),
  state: z.string().min(1, "State is required"),
  city: z.string().min(1, "City is required")
});

// Validation service class
export class ValidationService {
  
  /**
   * Validate Aadhaar number
   * @param aadhaarNumber - The Aadhaar number to validate
   * @returns Validation result
   */
  static validateAadhaar(aadhaarNumber: string) {
    try {
      const result = aadhaarSchema.parse({ aadhaarNumber });
      return { valid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: error.errors[0].message };
      }
      return { valid: false, error: "Validation failed" };
    }
  }

  /**
   * Validate PAN number
   * @param panNumber - The PAN number to validate
   * @returns Validation result
   */
  static validatePAN(panNumber: string) {
    try {
      const result = panSchema.parse({ panNumber });
      return { valid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: error.errors[0].message };
      }
      return { valid: false, error: "Validation failed" };
    }
  }

  /**
   * Validate OTP
   * @param otp - The OTP to validate
   * @returns Validation result
   */
  static validateOTP(otp: string) {
    try {
      const result = otpSchema.parse({ otp });
      return { valid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: error.errors[0].message };
      }
      return { valid: false, error: "Validation failed" };
    }
  }

  /**
   * Validate PIN code
   * @param pincode - The PIN code to validate
   * @returns Validation result
   */
  static validatePincode(pincode: string) {
    try {
      const result = pincodeSchema.parse({ pincode });
      return { valid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { valid: false, error: error.errors[0].message };
      }
      return { valid: false, error: "Validation failed" };
    }
  }

  /**
   * Validate complete submission data
   * @param data - The submission data to validate
   * @returns Validation result
   */
  static validateSubmission(data: any) {
    try {
      const result = submissionSchema.parse(data);
      return { valid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { 
          valid: false, 
          error: "Validation failed", 
          details: error.errors 
        };
      }
      return { valid: false, error: "Validation failed" };
    }
  }

  /**
   * Sanitize input data to prevent injection attacks
   * @param data - The data to sanitize
   * @returns Sanitized data
   */
  static sanitizeInput(data: any) {
    const sanitized: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string') {
        // Remove potential script tags and dangerous characters
        sanitized[key] = value
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+\s*=/gi, '')
          .trim();
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  }
} 