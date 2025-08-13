# Udyam Registration API Documentation

## Overview
The Udyam Registration API provides comprehensive validation and submission endpoints for MSME registration forms. This API handles Aadhaar verification, OTP validation, PAN verification, and form submission with robust validation and security measures.

## Base URL
```
http://localhost:4000
```

## Authentication
Currently, no authentication is required. All endpoints are publicly accessible.

## Rate Limiting
- **Limit**: 100 requests per 15 minutes per IP address
- **Headers**: Rate limit information is included in response headers
- **Exceeded**: Returns 429 status with retry information

## Endpoints

### 1. Health Check
**GET** `/health`

Check if the API is running.

**Response:**
```json
{
  "ok": true
}
```

**Status Codes:**
- `200` - API is healthy

---

### 2. Aadhaar Validation
**POST** `/validate/aadhaar`

Validate Aadhaar number format and business rules.

**Request Body:**
```json
{
  "aadhaarNumber": "234567890123"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "message": "Aadhaar format is valid"
}
```

**Response (Error):**
```json
{
  "valid": false,
  "error": "Invalid Aadhaar format. Must be 12 digits starting with 2-9"
}
```

**Validation Rules:**
- Must be exactly 12 digits
- Must start with digits 2-9 (not 0 or 1)
- Must contain only numeric characters

**Status Codes:**
- `200` - Validation successful
- `400` - Invalid input format

---

### 3. PAN Validation
**POST** `/validate/pan`

Validate PAN (Permanent Account Number) format.

**Request Body:**
```json
{
  "panNumber": "ABCDE1234F"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "message": "PAN format is valid"
}
```

**Response (Error):**
```json
{
  "valid": false,
  "error": "Invalid PAN format. Expected: ABCDE1234F"
}
```

**Validation Rules:**
- Must be exactly 10 characters
- Format: `[A-Z]{5}[0-9]{4}[A-Z]{1}`
- Example: `ABCDE1234F`

**Status Codes:**
- `200` - Validation successful
- `400` - Invalid input format

---

### 4. OTP Validation
**POST** `/validate/otp`

Validate OTP (One Time Password) format.

**Request Body:**
```json
{
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "message": "OTP format is valid"
}
```

**Response (Error):**
```json
{
  "valid": false,
  "error": "Invalid OTP format. Must be 6 digits"
}
```

**Validation Rules:**
- Must be exactly 6 digits
- Must contain only numeric characters

**Status Codes:**
- `200` - Validation successful
- `400` - Invalid input format

---

### 5. PIN Code Validation
**POST** `/validate/pincode`

Validate Indian postal PIN code format.

**Request Body:**
```json
{
  "pincode": "560011"
}
```

**Response (Success):**
```json
{
  "valid": true,
  "message": "PIN code format is valid"
}
```

**Response (Error):**
```json
{
  "valid": false,
  "error": "Invalid PIN code format. Must be 6 digits"
}
```

**Validation Rules:**
- Must be exactly 6 digits
- Must contain only numeric characters

**Status Codes:**
- `200` - Validation successful
- `400` - Invalid input format

---

### 6. Form Submission
**POST** `/submit`

Submit complete Udyam registration form.

**Request Body:**
```json
{
  "aadhaarNumber": "234567890123",
  "entrepreneurName": "John Doe",
  "consent": true,
  "otp": "123456",
  "otpVerified": true,
  "organisationType": "proprietary",
  "panNumber": "ABCDE1234F",
  "panHolderName": "John Doe",
  "dob": "1990-01-01",
  "panConsent": true,
  "pincode": "560011",
  "state": "Karnataka",
  "city": "Bangalore"
}
```

**Response (Success):**
```json
{
  "stored": true,
  "id": "clx1234567890",
  "message": "Udyam registration submitted successfully"
}
```

**Response (Validation Error):**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "code": "invalid_string",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "Entrepreneur name is required",
      "path": ["entrepreneurName"]
    }
  ]
}
```

**Response (Database Error):**
```json
{
  "stored": false,
  "message": "Database not configured. Data accepted for validation only.",
  "data": { ... }
}
```

**Required Fields:**
- `aadhaarNumber`: Valid 12-digit Aadhaar number
- `entrepreneurName`: Entrepreneur's full name
- `consent`: Boolean consent for Aadhaar usage
- `otp`: 6-digit OTP code
- `otpVerified`: Boolean indicating OTP verification
- `organisationType`: Type of business organization
- `panNumber`: Valid 10-character PAN
- `panHolderName`: PAN holder's full name
- `dob`: Date of birth (YYYY-MM-DD format)
- `panConsent`: Boolean consent for PAN usage
- `pincode`: 6-digit postal PIN code
- `state`: State name
- `city`: City name

**Status Codes:**
- `200` - Submission successful
- `202` - Validated but not stored (database unavailable)
- `400` - Validation failed
- `500` - Internal server error

---

## Error Handling

### Standard Error Response Format
```json
{
  "error": "Error message",
  "details": "Additional error details (if available)"
}
```

### Common Error Codes
- `400` - Bad Request (validation errors)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Rate Limit Exceeded Response
```json
{
  "error": "Too many requests from this IP, please try again later.",
  "retryAfter": "15 minutes"
}
```

---

## Data Validation Rules

### Aadhaar Number
- **Pattern**: `^[2-9][0-9]{11}$`
- **Length**: Exactly 12 digits
- **First Digit**: Must be 2-9 (not 0 or 1)
- **Characters**: Numeric only

### PAN Number
- **Pattern**: `^[A-Z]{5}[0-9]{4}[A-Z]{1}$`
- **Length**: Exactly 10 characters
- **Format**: 5 letters + 4 digits + 1 letter
- **Case**: Uppercase letters only

### OTP
- **Pattern**: `^[0-9]{6}$`
- **Length**: Exactly 6 digits
- **Characters**: Numeric only

### PIN Code
- **Pattern**: `^[0-9]{6}$`
- **Length**: Exactly 6 digits
- **Characters**: Numeric only

### Names
- **Length**: 1-100 characters
- **Required**: Yes
- **Sanitization**: Script tags and dangerous characters are removed

---

## Security Features

### Input Sanitization
- All string inputs are sanitized to prevent XSS attacks
- Script tags and dangerous characters are removed
- Input length limits are enforced

### Rate Limiting
- Prevents abuse and DoS attacks
- Configurable limits per IP address
- Clear retry information provided

### Validation
- Comprehensive input validation using Zod schemas
- Business rule enforcement
- Type safety and data integrity

---

## Usage Examples

### Frontend Integration
```javascript
// Validate Aadhaar
const validateAadhaar = async (aadhaarNumber) => {
  const response = await fetch('/api/validate/aadhaar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ aadhaarNumber })
  });
  
  const result = await response.json();
  return result.valid;
};

// Submit form
const submitForm = async (formData) => {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(formData)
  });
  
  const result = await response.json();
  if (response.ok) {
    console.log('Success:', result.message);
  } else {
    console.error('Error:', result.error);
  }
};
```

### cURL Examples
```bash
# Health check
curl http://localhost:4000/health

# Validate Aadhaar
curl -X POST http://localhost:4000/validate/aadhaar \
  -H "Content-Type: application/json" \
  -d '{"aadhaarNumber": "234567890123"}'

# Submit form
curl -X POST http://localhost:4000/submit \
  -H "Content-Type: application/json" \
  -d '{"aadhaarNumber": "234567890123", ...}'
```

---

## Monitoring and Logging

### Request Logging
All API requests are logged with:
- Timestamp
- HTTP method
- Request path
- Client IP address

### Error Logging
Validation and submission errors are logged with:
- Error details
- Request data
- Stack traces (in development)

---

## Support and Contact

For technical support or questions about the API:
- **Repository**: [Project Repository]
- **Issues**: [GitHub Issues]
- **Documentation**: This file

---

## Version History

- **v1.0.0** - Initial release with basic validation
- **v1.1.0** - Added rate limiting and enhanced security
- **v1.2.0** - Added comprehensive testing and documentation 