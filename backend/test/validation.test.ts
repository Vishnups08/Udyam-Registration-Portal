import { ValidationService } from '../src/services/validation.service';

// Mock Prisma client for testing
jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    udyamSubmission: {
      create: jest.fn().mockResolvedValue({ id: 'test-id-123' })
    }
  }))
}));

describe('Validation Service Tests', () => {
  
  describe('Aadhaar Validation', () => {
    test('should validate correct Aadhaar number', () => {
      const result = ValidationService.validateAadhaar('234567890123');
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject Aadhaar starting with 0 or 1', () => {
      const result = ValidationService.validateAadhaar('123456789012');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid Aadhaar format');
    });

    test('should reject Aadhaar with wrong length', () => {
      const result = ValidationService.validateAadhaar('23456789012'); // 11 digits
      expect(result.valid).toBe(false);
    });

    test('should reject Aadhaar with non-numeric characters', () => {
      const result = ValidationService.validateAadhaar('23456789012a');
      expect(result.valid).toBe(false);
    });

    test('should reject empty Aadhaar', () => {
      const result = ValidationService.validateAadhaar('');
      expect(result.valid).toBe(false);
    });
  });

  describe('PAN Validation', () => {
    test('should validate correct PAN format', () => {
      const result = ValidationService.validatePAN('ABCDE1234F');
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject PAN with wrong format', () => {
      const result = ValidationService.validatePAN('ABCD1234EF'); // Wrong format
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid PAN format');
    });

    test('should reject PAN with wrong length', () => {
      const result = ValidationService.validatePAN('ABCDE1234'); // 9 characters
      expect(result.valid).toBe(false);
    });

    test('should reject PAN with lowercase letters', () => {
      const result = ValidationService.validatePAN('abcde1234f');
      expect(result.valid).toBe(false);
    });
  });

  describe('OTP Validation', () => {
    test('should validate correct OTP', () => {
      const result = ValidationService.validateOTP('123456');
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject OTP with wrong length', () => {
      const result = ValidationService.validateOTP('12345'); // 5 digits
      expect(result.valid).toBe(false);
    });

    test('should reject OTP with non-numeric characters', () => {
      const result = ValidationService.validateOTP('12345a');
      expect(result.valid).toBe(false);
    });
  });

  describe('PIN Code Validation', () => {
    test('should validate correct PIN code', () => {
      const result = ValidationService.validatePincode('560011');
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject PIN code with wrong length', () => {
      const result = ValidationService.validatePincode('56001'); // 5 digits
      expect(result.valid).toBe(false);
    });

    test('should reject PIN code with non-numeric characters', () => {
      const result = ValidationService.validatePincode('56001a');
      expect(result.valid).toBe(false);
    });
  });

  describe('Submission Validation', () => {
    test('should validate complete submission data', () => {
      const validData = {
        aadhaarNumber: '234567890123',
        entrepreneurName: 'Test User',
        consent: true,
        otp: '123456',
        otpVerified: true,
        organisationType: 'proprietary',
        panNumber: 'ABCDE1234F',
        panHolderName: 'Test User',
        dob: '1990-01-01',
        panConsent: true,
        pincode: '560011',
        state: 'Karnataka',
        city: 'Bangalore'
      };

      const result = ValidationService.validateSubmission(validData);
      expect(result.valid).toBe(true);
      expect(result.data).toBeDefined();
    });

    test('should reject submission with missing required fields', () => {
      const invalidData = {
        aadhaarNumber: '234567890123',
        entrepreneurName: 'Test User',
        // Missing consent, otp, etc.
      };

      const result = ValidationService.validateSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Validation failed');
    });

    test('should reject submission with invalid Aadhaar', () => {
      const invalidData = {
        aadhaarNumber: '123456789012', // Invalid (starts with 1)
        entrepreneurName: 'Test User',
        consent: true,
        otp: '123456',
        otpVerified: true,
        organisationType: 'proprietary',
        panNumber: 'ABCDE1234F',
        panHolderName: 'Test User',
        dob: '1990-01-01',
        panConsent: true,
        pincode: '560011',
        state: 'Karnataka',
        city: 'Bangalore'
      };

      const result = ValidationService.validateSubmission(invalidData);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Validation failed');
    });
  });

  describe('Input Sanitization', () => {
    test('should sanitize script tags', () => {
      const input = {
        name: '<script>alert("xss")</script>John Doe',
        email: 'test@example.com'
      };

      const sanitized = ValidationService.sanitizeInput(input);
      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.email).toBe('test@example.com');
    });

    test('should sanitize dangerous attributes', () => {
      const input = {
        name: 'John Doe<img src="x" onerror="alert(1)">',
        description: 'javascript:alert("xss")'
      };

      const sanitized = ValidationService.sanitizeInput(input);
      expect(sanitized.name).toBe('John Doe<img src="x" "alert(1)">');
      expect(sanitized.description).toBe('alert("xss")');
    });

    test('should preserve safe content', () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+91-98765-43210'
      };

      const sanitized = ValidationService.sanitizeInput(input);
      expect(sanitized.name).toBe('John Doe');
      expect(sanitized.email).toBe('john@example.com');
      expect(sanitized.phone).toBe('+91-98765-43210');
    });
  });
}); 