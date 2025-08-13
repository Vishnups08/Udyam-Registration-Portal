-- CreateTable
CREATE TABLE "UdyamSubmission" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "aadhaarNumber" TEXT NOT NULL,
    "mobileNumber" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "panNumber" TEXT NOT NULL,
    "pincode" TEXT,
    "state" TEXT,
    "city" TEXT,

    CONSTRAINT "UdyamSubmission_pkey" PRIMARY KEY ("id")
);
