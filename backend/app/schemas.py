from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

# --- Token & Auth Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    user_id: int
    name: str

class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None

class OTPRequest(BaseModel):
    phone: str = Field(..., pattern=r"^\d{10}$")
    role: str = Field(..., description="Role requesting OTP: farmer, officer, admin")

class OTPVerify(BaseModel):
    phone: str = Field(..., pattern=r"^\d{10}$")
    otp: str = Field(..., min_length=4, max_length=6)
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- User Profile Schemas ---
class UserBase(BaseModel):
    name: str
    email: Optional[EmailStr] = None
    phone: str

class UserCreate(UserBase):
    password: str
    role: str

class UserResponse(UserBase):
    id: int
    role: str
    created_at: datetime

    class Config:
        from_attributes = True

class FarmerCreate(BaseModel):
    name: str
    phone: str
    land_area: float
    state: str
    district: str
    mandal: str
    village: str
    language_preference: str = "en"

class FarmerResponse(BaseModel):
    id: int
    user_id: int
    land_area: float
    state: str
    district: str
    mandal: str
    village: str
    language_preference: str
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

class OfficerCreate(BaseModel):
    name: str
    phone: str
    email: EmailStr
    password: str
    centre_id: Optional[int] = None
    department: str
    badge_number: str

class OfficerResponse(BaseModel):
    id: int
    user_id: int
    centre_id: Optional[int] = None
    department: str
    badge_number: str
    created_at: datetime
    user: UserResponse

    class Config:
        from_attributes = True

# --- Crop Registration Schemas ---
class CropRegistrationCreate(BaseModel):
    crop_name: str
    crop_stage: str
    expected_harvest_month: str
    expected_quantity: float
    land_area: float
    state: str
    district: str
    mandal: str
    village: str
    phone_number: str

class CropRegistrationResponse(BaseModel):
    id: int
    registration_number: str
    farmer_id: int
    crop_name: str
    crop_stage: str
    expected_harvest_month: str
    expected_quantity: float
    land_area: float
    state: str
    district: str
    mandal: str
    village: str
    phone_number: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Image Upload Schemas ---
class ProduceImageCreate(BaseModel):
    image_url: str
    image_type: str  # "full_produce", "close_up", "storage_view"
    gps_latitude: float
    gps_longitude: float
    gps_location_name: str
    device_info: str

class ProduceImageResponse(BaseModel):
    id: int
    registration_id: int
    image_url: str
    image_type: str
    gps_latitude: float
    gps_longitude: float
    gps_location_name: str
    device_info: str
    timestamp: datetime

    class Config:
        from_attributes = True

# --- AI Assessment Schemas ---
class AIAssessmentResponse(BaseModel):
    id: int
    registration_id: int
    crop_name: str
    confidence: float
    visual_quality: str
    grain_uniformity: float
    foreign_material: float
    estimated_moisture: float
    score: float
    recommendation: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Sample Verification Schemas ---
class SampleVerificationCreate(BaseModel):
    moisture: float
    foreign_matter: float
    grain_quality: str
    remarks: Optional[str] = None
    status: str  # "Approved", "Rejected", "Need Reinspection"

class SampleVerificationResponse(BaseModel):
    id: int
    registration_id: int
    officer_id: Optional[int] = None
    moisture: float
    foreign_matter: float
    grain_quality: str
    remarks: Optional[str] = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- Slot Booking Schemas ---
class SlotBookingRequest(BaseModel):
    slot_date: str
    slot_time: str

# --- Procurement Schemas ---
class ProcurementCreate(BaseModel):
    declared_quantity: float
    actual_quantity: float
    accepted_quantity: float
    msp_rate: float
    slot_date: str
    slot_time: str

class ProcurementResponse(BaseModel):
    id: int
    procurement_number: str
    registration_id: int
    officer_id: Optional[int] = None
    centre_id: Optional[int] = None
    declared_quantity: float
    actual_quantity: float
    accepted_quantity: float
    msp_rate: float
    total_amount: float
    slot_date: str
    slot_time: str
    status: str
    digital_receipt_url: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Payment Schemas ---
class PaymentStatusUpdate(BaseModel):
    status: str
    transaction_reference: Optional[str] = None

class PaymentResponse(BaseModel):
    id: int
    procurement_id: int
    farmer_id: int
    amount: float
    status: str
    transaction_reference: Optional[str] = None
    payment_date: Optional[datetime] = None
    expected_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Notification Schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    is_read: bool
    type: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- MSP Schemas ---
class MSPRateResponse(BaseModel):
    id: int
    crop_name: str
    msp_rate: float
    expected_market_price: float
    government_notification_url: Optional[str] = None
    year: str

    class Config:
        from_attributes = True

# --- Centre Schemas ---
class ProcurementCentreResponse(BaseModel):
    id: int
    name: str
    district: str
    mandal: str
    latitude: float
    longitude: float
    contact_number: str

    class Config:
        from_attributes = True

# --- Audit Log Schemas ---
class AuditLogResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    action: str
    ip_address: Optional[str] = None
    details: Optional[str] = None
    timestamp: datetime

    class Config:
        from_attributes = True
