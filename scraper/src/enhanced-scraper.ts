import puppeteer from "puppeteer";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function run() {
  const url = "https://udyamregistration.gov.in/UdyamRegistration.aspx";
  const browser = await puppeteer.launch({
    headless: false, // Set to false to see what's happening
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
    ],
  });
  
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  );
  await page.setExtraHTTPHeaders({ "accept-language": "en-US,en;q=0.9" });
  page.setDefaultNavigationTimeout(180000);

  try {
    await page.goto(url, { waitUntil: "networkidle2", timeout: 180000 });
    console.log("Page loaded successfully");
    
    // Wait for the form to load
    await delay(5000);
    
    // Take a screenshot to see what we're working with
    await page.screenshot({ path: 'udyam-form.png', fullPage: true });
    console.log("Screenshot saved as udyam-form.png");

    // Extract comprehensive form data with validation patterns
    const formData = await page.evaluate(() => {
      const fields: any[] = [];
      const validationRules: any = {};
      
      // Function to get label text
      function getLabelText(element: HTMLElement): string {
        // Try to find associated label
        if (element.id) {
          const label = document.querySelector(`label[for="${element.id}"]`);
          if (label) return label.textContent?.trim() || "";
        }
        
        // Look for nearby text
        let sibling = element.previousElementSibling;
        while (sibling) {
          if (sibling.textContent?.trim()) {
            return sibling.textContent.trim();
          }
          sibling = sibling.previousElementSibling;
        }
        
        // Look for parent text
        let parent = element.parentElement;
        while (parent && parent !== document.body) {
          if (parent.textContent?.trim() && parent.children.length === 1) {
            return parent.textContent.trim();
          }
          parent = parent.parentElement;
        }
        
        return element.getAttribute("placeholder") || element.getAttribute("name") || element.id || "";
      }

      // Function to extract validation patterns
      function extractValidationPatterns(element: HTMLInputElement | HTMLSelectElement): any {
        const validation: any = {};
        
        // Required field
        if (element.hasAttribute("required")) {
          validation.required = true;
        }
        
        // Length constraints
        if (element.maxLength > 0) {
          validation.maxLength = element.maxLength;
        }
        if (element.minLength > 0) {
          validation.minLength = element.minLength;
        }
        
        // Pattern validation
        if (element.pattern) {
          validation.pattern = element.pattern;
        }
        
        // Type-specific validation
        if (element.type === "email") {
          validation.type = "email";
          validation.pattern = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        }
        
        if (element.type === "tel") {
          validation.type = "tel";
          // Common Indian phone patterns
          if (element.placeholder?.includes("Aadhaar")) {
            validation.pattern = "^[2-9][0-9]{11}$";
            validation.helpText = "Aadhaar number must be 12 digits starting with 2-9";
          } else if (element.placeholder?.includes("Mobile")) {
            validation.pattern = "^[6-9][0-9]{9}$";
            validation.helpText = "Mobile number must be 10 digits starting with 6-9";
          }
        }
        
        // PAN validation
        if (element.placeholder?.includes("PAN") || element.name?.toLowerCase().includes("pan")) {
          validation.pattern = "^[A-Z]{5}[0-9]{4}[A-Z]{1}$";
          validation.helpText = "PAN must be in format: ABCDE1234F";
        }
        
        // PIN code validation
        if (element.placeholder?.includes("PIN") || element.name?.toLowerCase().includes("pincode")) {
          validation.pattern = "^[0-9]{6}$";
          validation.helpText = "PIN code must be 6 digits";
        }
        
        return validation;
      }

      // Find all form elements
      const inputs = document.querySelectorAll("input, select, textarea");
      
      inputs.forEach((input, index) => {
        const element = input as HTMLInputElement | HTMLSelectElement;
        
        // Skip hidden fields and buttons
        if (element.type === "hidden" || element.type === "button" || element.type === "submit") {
          return;
        }
        
        const label = getLabelText(element);
        
        // Only include fields with meaningful labels
        if (label && label.length > 2 && !label.includes("__VIEWSTATE")) {
          const validation = extractValidationPatterns(element);
          
          const field = {
            id: element.id || `field_${index}`,
            name: element.name || element.id || `field_${index}`,
            label: label,
            type: element.type || (element.tagName === "SELECT" ? "select" : "text"),
            placeholder: element.getAttribute("placeholder") || undefined,
            validation: validation,
            options: element.tagName === "SELECT" ? 
              Array.from((element as HTMLSelectElement).options).map(opt => ({
                label: opt.text,
                value: opt.value
              })) : undefined,
            // Additional metadata
            ariaLabel: element.getAttribute("aria-label"),
            ariaRequired: element.getAttribute("aria-required"),
            dataAttributes: {
              required: element.hasAttribute("required"),
              disabled: element.hasAttribute("disabled"),
              readonly: element.hasAttribute("readonly")
            }
          };
          
          fields.push(field);
        }
      });
      
      // Extract form-level validation rules
      const forms = document.querySelectorAll("form");
      forms.forEach((form, index) => {
        const formValidation = {
          formId: form.id || `form_${index}`,
          action: form.action,
          method: form.method,
          novalidate: form.hasAttribute("novalidate"),
          fields: fields.filter(f => form.contains(document.getElementById(f.id)))
        };
        
        validationRules[`form_${index}`] = formValidation;
      });
      
      return { fields, validationRules };
    });

    console.log("Extracted fields:", formData.fields.length);
    console.log("Validation rules:", Object.keys(formData.validationRules).length);

    // Create enhanced schema with comprehensive validation
    const enhancedSchema = {
      title: "Udyam Registration - Enhanced (scraped)",
      step: 1,
      fields: formData.fields,
      validationRules: formData.validationRules,
      // Enhanced validation patterns
      enhancedValidation: {
        aadhaar: {
          pattern: "^[2-9][0-9]{11}$",
          message: "Aadhaar number must be 12 digits starting with 2-9",
          helpText: "Enter your 12-digit Aadhaar number as printed on your Aadhaar card"
        },
        pan: {
          pattern: "^[A-Z]{5}[0-9]{4}[A-Z]{1}$",
          message: "PAN must be in format: ABCDE1234F",
          helpText: "Enter your 10-character PAN number in the correct format"
        },
        mobile: {
          pattern: "^[6-9][0-9]{9}$",
          message: "Mobile number must be 10 digits starting with 6-9",
          helpText: "Enter your 10-digit mobile number registered with Aadhaar"
        },
        otp: {
          pattern: "^[0-9]{6}$",
          message: "OTP must be 6 digits",
          helpText: "Enter the 6-digit OTP sent to your registered mobile number"
        },
        pincode: {
          pattern: "^[0-9]{6}$",
          message: "PIN code must be 6 digits",
          helpText: "Enter your 6-digit postal PIN code"
        },
        // Business logic validation
        businessRules: {
          consentRequired: "Consent is mandatory for Aadhaar verification",
          otpVerificationRequired: "OTP verification is required before proceeding",
          panVerificationRequired: "PAN verification is required for business entities",
          organisationTypeRequired: "Please select your organisation type"
        }
      },
      // Form flow and dependencies
      formFlow: {
        step1: {
          title: "Aadhaar Verification",
          fields: ["aadhaarNumber", "entrepreneurName", "consent"],
          nextStep: "otpVerification",
          validation: "All fields must be completed and consent given"
        },
        step2: {
          title: "OTP Verification",
          fields: ["otp"],
          dependsOn: "step1",
          nextStep: "panVerification",
          validation: "Valid 6-digit OTP required"
        },
        step3: {
          title: "PAN Verification",
          fields: ["organisationType", "panNumber", "panHolderName", "dob", "panConsent", "pincode", "state", "city"],
          dependsOn: "step2",
          nextStep: "submission",
          validation: "All PAN verification fields must be completed"
        }
      }
    };

    // Save enhanced schema
    const outDir = path.resolve(__dirname, "../../schema/generated");
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, "enhanced-step1.json"), JSON.stringify(enhancedSchema, null, 2));
    
    console.log(`Enhanced schema saved to ${path.join(outDir, "enhanced-step1.json")}`);

  } catch (error) {
    console.error("Error during scraping:", error);
  } finally {
    await browser.close();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
}); 