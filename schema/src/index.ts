import { z } from "zod";

export const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const aadhaarRegex = /^[2-9][0-9]{11}$/; // 12 digits, first 2-9
export const otpRegex = /^[0-9]{6}$/;
export const mobileRegex = /^[6-9][0-9]{9}$/;

export type FieldType =
  | "text"
  | "number"
  | "select"
  | "radio"
  | "checkbox"
  | "date"
  | "tel"
  | "email"
  | "password"
  | "otp";

export type FormOption = { label: string; value: string };

export type FieldValidation = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string; // regex string
  helpText?: string;
};

export type FormField = {
  id: string;
  name: string;
  label: string;
  placeholder?: string;
  type: FieldType;
  options?: FormOption[];
  validation?: FieldValidation;
};

export type FormSchema = {
  title: string;
  step: number;
  fields: FormField[];
};

export const step1Schema: FormSchema = {
  title: "Udyam Registration - Step 1 (Aadhaar & OTP)",
  step: 1,
  fields: [
    {
      id: "aadhaarNumber",
      name: "aadhaarNumber",
      label: "Aadhaar Number",
      placeholder: "Enter 12-digit Aadhaar",
      type: "tel",
      validation: {
        required: true,
        minLength: 12,
        maxLength: 12,
        pattern: aadhaarRegex.source,
        helpText: "12 digits; must start with 2-9",
      },
    },
    {
      id: "mobileNumber",
      name: "mobileNumber",
      label: "Mobile Number (linked to Aadhaar)",
      placeholder: "Enter 10-digit mobile",
      type: "tel",
      validation: {
        required: true,
        minLength: 10,
        maxLength: 10,
        pattern: mobileRegex.source,
      },
    },
    {
      id: "otp",
      name: "otp",
      label: "OTP",
      placeholder: "Enter 6-digit OTP",
      type: "otp",
      validation: {
        required: true,
        minLength: 6,
        maxLength: 6,
        pattern: otpRegex.source,
      },
    },
  ],
};

export const step2Schema: FormSchema = {
  title: "Udyam Registration - Step 2 (PAN Validation)",
  step: 2,
  fields: [
    {
      id: "panNumber",
      name: "panNumber",
      label: "PAN Number",
      placeholder: "ABCDE1234F",
      type: "text",
      validation: {
        required: true,
        minLength: 10,
        maxLength: 10,
        pattern: panRegex.source,
        helpText: "Format: [A-Z]{5}[0-9]{4}[A-Z]",
      },
    },
    {
      id: "pincode",
      name: "pincode",
      label: "PIN Code",
      placeholder: "6-digit PIN",
      type: "tel",
      validation: {
        required: false,
        minLength: 6,
        maxLength: 6,
        pattern: "^[0-9]{6}$",
      },
    },
    {
      id: "state",
      name: "state",
      label: "State",
      type: "text",
      validation: { required: false },
    },
    {
      id: "city",
      name: "city",
      label: "City",
      type: "text",
      validation: { required: false },
    },
  ],
};

export const Step1Data = z.object({
  aadhaarNumber: z.string().regex(aadhaarRegex, "Invalid Aadhaar"),
  mobileNumber: z.string().regex(mobileRegex, "Invalid mobile number"),
  otp: z.string().regex(otpRegex, "Invalid OTP"),
});

export const Step2Data = z.object({
  panNumber: z.string().regex(panRegex, "Invalid PAN format"),
  pincode: z.string().optional(),
  state: z.string().optional(),
  city: z.string().optional(),
});

export const SubmissionData = Step1Data.merge(Step2Data);

export type Step1DataType = z.infer<typeof Step1Data>;
export type Step2DataType = z.infer<typeof Step2Data>;
export type SubmissionDataType = z.infer<typeof SubmissionData>; 