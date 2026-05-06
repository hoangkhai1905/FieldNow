-- AddOTP fields to User table
ALTER TABLE "User" ADD COLUMN "otp_code" TEXT,
ADD COLUMN "otp_expires_at" TIMESTAMP(3),
ADD COLUMN "is_email_verified" BOOLEAN NOT NULL DEFAULT false;

-- Create index for OTP lookup
CREATE INDEX "User_otp_code_idx" ON "User"("otp_code");
