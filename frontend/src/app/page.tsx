"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import Image from "next/image";
import { Step1Data, Step2Data, step1Schema, step2Schema, SubmissionData, type FormSchema } from "schema";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:4000";

type AnyObject = Record<string, any>;

async function fetchSchema(step: number): Promise<FormSchema> {
  // Try scraped first
  try {
    const r = await fetch(`${BACKEND_URL}/scraped-schema/${step}`, { cache: "no-store" });
    if (r.ok) return await r.json();
  } catch {}
  // Fallback to static
  return step === 1 ? step1Schema : step2Schema;
}

export default function Home() {
  const [schema, setSchema] = useState<FormSchema | null>(null);
  const [values, setValues] = useState<AnyObject>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  
  // Debug: Log current values and error state
  console.log('Current values:', values);
  console.log('Current error:', error);

  useEffect(() => {
    fetchSchema(1).then(setSchema);
  }, []);

  function onChange(name: string, value: any) {
    setValues((v) => ({ ...v, [name]: value }));
    
    // Clear field-specific errors when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
    
    // Clear general error when user starts typing in required fields
    if (error && (name === 'aadhaarNumber' || name === 'entrepreneurName' || name === 'consent')) {
      if (name === 'consent' ? value : value && value.length > 0) {
        setError(null);
      }
    }

    // Real-time validation with specific error messages
    if (name === 'aadhaarNumber' && value) {
      if (value.length > 0 && value.length !== 12) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Aadhaar number must be exactly 12 digits' }));
      } else if (value.length === 12 && !/^[2-9]/.test(value)) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Aadhaar number must start with 2-9' }));
      } else if (value.length === 12 && /^[2-9][0-9]{11}$/.test(value)) {
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
      }
    }

    // Real-time PAN validation
    if (name === 'panNumber' && value) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (value.length > 0 && value.length !== 10) {
        setFieldErrors(prev => ({ ...prev, [name]: 'PAN must be exactly 10 characters' }));
      } else if (value.length === 10 && !panRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, [name]: 'Invalid PAN format. Expected: ABCDE1234F' }));
      } else if (value.length === 10 && panRegex.test(value)) {
        setFieldErrors(prev => ({ ...prev, [name]: '' }));
      }
    }

    // PIN code auto-fill for city/state
    if (name === 'pincode' && value && value.length === 6) {
      fetch(`https://api.postalpincode.in/pincode/${value}`)
        .then((r) => r.json())
        .then((data) => {
          const post = data?.[0];
          const office = post?.PostOffice?.[0];
          if (office) {
            setValues((v) => ({ 
              ...v, 
              state: office.State || v.state, 
              city: office.District || v.city 
            }));
          }
        })
        .catch(() => {});
    }
  }

  async function validateAndNext() {
    console.log('Validating with values:', values);
    setError(null);
    setLoading(true);
    
    try {
      // Check if required fields are filled
      if (!values.aadhaarNumber || !values.entrepreneurName || !values.consent) {
        console.log('Missing required fields:', { aadhaar: !!values.aadhaarNumber, name: !!values.entrepreneurName, consent: !!values.consent });
        setError("Please fill in all required fields and check the consent checkbox");
        return;
      }
      
      // Validate Aadhaar format with backend
      const aadhaarResponse = await fetch('/api/validate/aadhaar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aadhaarNumber: values.aadhaarNumber })
      });
      
      if (!aadhaarResponse.ok) {
        const errorData = await aadhaarResponse.json();
        setError(errorData.error || "Invalid Aadhaar format");
        return;
      }
      
      // If OTP is entered, validate it
      if (values.otp) {
        if (values.otp.length !== 6) {
          setError("OTP must be exactly 6 digits");
          return;
        }
        
        // Validate OTP format with backend
        const otpResponse = await fetch('/api/validate/otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ otp: values.otp })
        });
        
        if (!otpResponse.ok) {
          const errorData = await otpResponse.json();
          setError(errorData.error || "Invalid OTP format");
          return;
        }
        
        // OTP validation passed, show success message and enable PAN section
        console.log('OTP validation passed');
        setValues((v) => ({ ...v, otpVerified: true }));
        setMessage("Your Aadhaar has been successfully verified. You can continue Pan Verification process.");
        return;
      }
      
      // Initial validation passed, show OTP field
      console.log('Initial validation passed, OTP field should be visible');
      setValues((v) => ({ ...v, showOtpField: true }));
      setMessage("OTP has been sent to your registered mobile number. Please enter the 6-digit OTP.");
      
    } catch (error) {
      console.error('Validation error:', error);
      setError("Network error during validation. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function submitForm() {
    setLoading(true);
    setError(null);
    
    try {
      // Validate all required fields
      if (!values.organisationType || !values.panNumber || !values.panHolderName || 
          !values.dob || !values.panConsent || !values.pincode || !values.state || !values.city) {
        setError("Please fill in all required fields in PAN verification section");
        return;
      }
      
      // Validate PAN format
      const panResponse = await fetch('/api/validate/pan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ panNumber: values.panNumber })
      });
      
      if (!panResponse.ok) {
        const errorData = await panResponse.json();
        setError(errorData.error || "Invalid PAN format");
      return;
    }
      
      // Submit to backend
      const response = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        setError(result.error || "Submission failed");
        return;
      }
      
      setMessage(result.message || "Udyam registration submitted successfully!");
      
    } catch (error) {
      console.error('Submission error:', error);
      setError("Network error during submission. Please try again.");
    } finally {
    setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Government Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full py-3 px-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 flex items-center justify-center">
                  <Image src="/embleml.png" alt="Government Emblem" width={32} height={32} className="object-contain" />
                </div>
              </div>
              <div className="text-sm text-gray-700">
                <div>सूक्ष्म, लघु और मध्यम उद्यम मंत्रालय</div>
                <div className="text-xs">Ministry of Micro, Small & Medium Enterprises</div>
              </div>
            </div>
            <nav className="flex flex-wrap gap-4 lg:gap-6 text-sm">
              <a href="#" className="text-blue-600 border-b-2 border-blue-600 pb-1">Home</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">NIC Code</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Useful Documents ▾</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Print / Verify ▾</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Update Details ▾</a>
              <a href="#" className="text-gray-600 hover:text-blue-600">Login ▾</a>
            </nav>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full py-8">
        <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-gray-900 text-center mb-5 px-4">UDYAM REGISTRATION FORM - For New Enterprise who are not Registered yet as MSME</h1>
        
        {/* Form Container */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden w-full max-w-6xl mx-auto">
          {/* Form Section Header */}
          <div className="bg-blue-600 text-white px-6 py-4">
            <h2 className="text-lg font-semibold">Aadhaar Verification With OTP</h2>
          </div>
          
          {/* Form Content */}
          <div className="p-6">
            <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      1. Aadhaar Number/ आधार संख्या
                    </label>
                                         <input
                       type="tel"
                       className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                         (error && !values.aadhaarNumber) || fieldErrors.aadhaarNumber ? 'border-red-500' : 'border-gray-300'
                       }`}
                       placeholder="Your Aadhaar No"
                       value={values.aadhaarNumber || ""}
                       onChange={(e) => onChange("aadhaarNumber", e.target.value)}
                       maxLength={12}
                     />
                     {fieldErrors.aadhaarNumber && (
                       <p className="text-red-600 text-sm mt-1">{fieldErrors.aadhaarNumber}</p>
                     )}
                     {error && !values.aadhaarNumber && !fieldErrors.aadhaarNumber && (
                       <p className="text-red-600 text-sm mt-1">Required</p>
                     )}
                     <p className="text-gray-500 text-xs mt-1">Enter your 12-digit Aadhaar number as printed on your Aadhaar card</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      2. Name of Entrepreneur / उद्यमी का नाम
                    </label>
                    <input
                      type="text"
                      className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        (error && !values.entrepreneurName) || fieldErrors.entrepreneurName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Name as per Aadhaar"
                      value={values.entrepreneurName || ""}
                      onChange={(e) => onChange("entrepreneurName", e.target.value)}
                    />
                    {fieldErrors.entrepreneurName && (
                      <p className="text-red-600 text-sm mt-1">{fieldErrors.entrepreneurName}</p>
                    )}
                    {error && !values.entrepreneurName && !fieldErrors.entrepreneurName && (
                      <p className="text-red-600 text-sm mt-1">Required</p>
                    )}
                    <p className="text-gray-500 text-xs mt-1">Enter your name exactly as it appears on your Aadhaar card</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="font-medium text-gray-900 mb-3">Requirements for Udyam Registration:</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Aadhaar Number of the Entrepreneur
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      Name of Entrepreneur as per Aadhaar
                    </li>
                    <li className="flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
                      GSTIN/PAN for Companies/Societies/Trusts
                    </li>
                  </ul>
                </div>
                
                <div className="flex items-start space-x-3">
                  <input
                    type="checkbox"
                    id="consent"
                    className={`mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${
                      error && !values.consent ? 'ring-2 ring-red-500' : ''
                    }`}
                    checked={values.consent || false}
                    onChange={(e) => onChange("consent", e.target.checked)}
                  />
                  <label htmlFor="consent" className="text-sm text-gray-700 leading-relaxed">
                    I hereby give my consent to the Ministry of MSME for using my Aadhaar number for Udyam Registration. 
                    Aadhaar data will not be stored/shared. / मैं यहां MSME मंत्रालय को अपना आधार नंबर Udyam पंजीकरण के लिए 
                    उपयोग करने की सहमति देता हूं। आधार डेटा संग्रहित/साझा नहीं किया जाएगा।
                  </label>
                </div>
                {error && !values.consent && (
                  <p className="text-red-600 text-sm -mt-2">Please check the consent checkbox</p>
                )}
                
                <button
                  onClick={validateAndNext}
                  disabled={loading}
                  className="bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                >
                  {loading ? "Validating..." : "Validate & Generate OTP"}
                </button>
                
                                {/* OTP Field - Show after button click */}
                {values.showOtpField && (
                  <div className="mt-6 transition-all duration-500 ease-in-out transform opacity-100 scale-100">
                    <h3 className="font-medium text-gray-900 mb-3">*Enter One Time Password(OTP) Code</h3>
                    <div className="max-w-xs">
                      <p className="text-sm text-green-600 mb-3">
                        OTP has been sent to your registered mobile number. Please enter the 6-digit OTP.
                      </p>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        OTP code
                      </label>
                      <input
                        type="tel"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter OTP"
                        value={values.otp || ""}
                        onChange={(e) => onChange("otp", e.target.value)}
                        maxLength={6}
                      />
                      <button
                        onClick={validateAndNext}
                        disabled={loading || !values.otp || values.otp.length !== 6}
                        className="mt-3 bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                      >
                        {loading ? "Validating..." : "Validate"}
          </button>
                    </div>
                  </div>
                )}
                
                                                 {/* PAN Verification Section - Show only after OTP verification */}
                 {values.otpVerified && (
                   <div className="mt-8 border-t pt-8 transition-all duration-700 ease-in-out transform opacity-100 scale-100">
                    <div className="bg-green-600 text-white px-6 py-4 -mx-6 -mt-6 mb-6">
                      <h2 className="text-lg font-semibold">PAN Verification</h2>
                    </div>
                    
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            3. Type of Organisation / संगठन के प्रकार
                          </label>
                          <select
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={values.organisationType || ""}
                            onChange={(e) => onChange("organisationType", e.target.value)}
                          >
                            <option value="">Type of Organisation / संगठन के प्रकार</option>
                            <option value="proprietary">1. Proprietary / एकल स्वामित्व</option>
                            <option value="huf">2. Hindu Undivided Family / हिंदू अविभाजित परिवार (एचयूएफ)</option>
                            <option value="partnership">3. Partnership / पार्टनरशिप</option>
                            <option value="cooperative">4. Co-Operative / सहकारी</option>
                            <option value="private_limited">5. Private Limited Company / प्राइवेट लिमिटेड कंपनी</option>
                            <option value="public_limited">6. Public Limited Company / पब्लिक लिमिटेड कंपनी</option>
                            <option value="self_help_group">7. Self Help Group / स्वयं सहायता समूह</option>
                            <option value="llp">8. Limited Liability Partnership / सीमित दायित्व भागीदारी</option>
                            <option value="society">9. Society / सोसाईटी</option>
                            <option value="trust">10. Trust / ट्रस्ट</option>
                            <option value="others">11. Others / अन्य</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            4.1 PAN/ पैन
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="ENTER PAN NUMBER"
                            value={values.panNumber || ""}
                            onChange={(e) => onChange("panNumber", e.target.value)}
                            maxLength={10}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            4.1.1 Name of PAN Holder / पैन धारक का नाम
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Name as per PAN"
                            value={values.panHolderName || ""}
                            onChange={(e) => onChange("panHolderName", e.target.value)}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            4.1.2 DOB or DOI as per PAN / पैन के अनुसार जन्म तिथि या निगमन तिथि
                          </label>
                          <input
                            type="date"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={values.dob || ""}
                            onChange={(e) => onChange("dob", e.target.value)}
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            PIN Code
                          </label>
                          <input
                            type="tel"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter 6-digit PIN"
                            value={values.pincode || ""}
                            onChange={(e) => onChange("pincode", e.target.value)}
                            maxLength={6}
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            State
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="State"
                            value={values.state || ""}
                            onChange={(e) => onChange("state", e.target.value)}
                            readOnly
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            City
                          </label>
                          <input
                            type="text"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="City"
                            value={values.city || ""}
                            onChange={(e) => onChange("city", e.target.value)}
                            readOnly
                          />
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          id="panConsent"
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={values.panConsent || false}
                          onChange={(e) => onChange("panConsent", e.target.checked)}
                        />
                        <label htmlFor="panConsent" className="text-sm text-gray-700 leading-relaxed">
                          I hereby give my consent to the Ministry of MSME to use data from Income Tax Returns, GST Returns, and other Government organizations for MSME classification and official purposes, as per the MSMED Act, 2006.
                        </label>
                      </div>
                      
                                             <button
                         onClick={submitForm}
                         disabled={loading}
                         className="bg-blue-600 text-white py-2 px-4 rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-sm"
                       >
                         {loading ? "Submitting..." : "Submit Registration"}
        </button>
                    </div>
                  </div>
                )}
                
      </div>

            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}
            
            {message && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-green-600 text-sm">{message}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Government Footer */}
      <footer className="bg-blue-900 text-white mt-16">
        <div className="w-full py-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* UDYAM REGISTRATION Section */}
            <div>
              <h3 className="text-xl font-bold mb-4">UDYAM REGISTRATION</h3>
              <div className="space-y-2 text-sm">
                <p>Ministry of MSME</p>
                <p>Udyog bhawan - New Delhi</p>
                <p>Email: champions@gov.in</p>
                <p>Contact Us</p>
                <p className="font-semibold">For Grievances / Problems</p>
              </div>
            </div>
            
            {/* Our Services Section */}
            <div>
              <h3 className="text-xl font-bold mb-4">Our Services</h3>
              <div className="space-y-2 text-sm">
                <p className="flex items-center">
                  <span className="mr-2 text-gray-300">&gt;</span>
                  CHAMPIONS
                </p>
                <p className="flex items-center">
                  <span className="mr-2 text-gray-300">&gt;</span>
                  MSME Samadhaan
                </p>
                <p className="flex items-center">
                  <span className="mr-2 text-gray-300">&gt;</span>
                  MSME Sambandh
                </p>
                <p className="flex items-center">
                  <span className="mr-2 text-gray-300">&gt;</span>
                  MSME Dashboard
                </p>
                <p className="flex items-center">
                  <span className="mr-2 text-gray-300">&gt;</span>
                  Entrepreneurship Skill Development Programme (ESDP)
                </p>
              </div>
            </div>
            
            {/* Video Section */}
            <div>
              <h3 className="text-xl font-bold mb-4">Video</h3>
              <div className="bg-blue-800 border border-white rounded-lg p-4 text-center relative overflow-hidden">
                <div className="w-full h-32 bg-blue-700 rounded flex flex-col items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-90"></div>
                  <div className="relative z-10">
                    <p className="text-yellow-400 text-sm font-medium">Udyam Registration</p>
                    <p className="text-white text-xs">www.udyamregistration.gov.in</p>
                  </div>
                </div>
                {/* Video Controls */}
                <div className="flex items-center justify-between mt-2 text-xs">
                  <button className="text-white hover:text-gray-300">▶</button>
                  <span className="text-white">0:00 / 0:47</span>
                  <div className="flex space-x-2">
                    <button className="text-white hover:text-gray-300">🔊</button>
                    <button className="text-white hover:text-gray-300">⛶</button>
                    <button className="text-white hover:text-gray-300">⋯</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Bottom Section - Copyright and Social Media */}
          <div className="border-t border-blue-800 mt-8 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-xs text-gray-300 text-center md:text-left space-y-1">
                <p>© Copyright Udyam Registration. All Rights Reserved, Website Content Managed by Ministry of Micro Small and Medium Enterprises, GoI</p>
                <p>Website hosted & managed by National Informatics Centre, Ministry of Communications and IT, Government of India</p>
              </div>
              <div className="flex space-x-3 mt-4 md:mt-0">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-900 text-xs font-bold">𝕏</span>
                </div>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-900 text-xs font-bold">f</span>
                </div>
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                  <span className="text-blue-900 text-xs font-bold">📷</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

 