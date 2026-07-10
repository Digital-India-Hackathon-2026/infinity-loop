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

# --- Image Upload Schemas ---
class ProduceImageCreate(BaseModel):
    image_url: str
    image_type: str  # "full_produce", "close_up", "storage_view"
    gps_latitude: float
    gps_longitude: float
    gps_location_name: str
    device_info: str
    image_source: Optional[str] = "Live Camera"
    upload_time: Optional[str] = None

class ProduceImageResponse(BaseModel):
    id: int
    registration_id: int
    image_url: str
    image_type: str
    gps_latitude: float
    gps_longitude: float
    gps_location_name: str
    device_info: str
    image_source: Optional[str] = "Live Camera"
    upload_time: Optional[str] = None
    timestamp: datetime

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

class ProduceRegistrationCreate(BaseModel):
    farmer_name: str
    phone_number: str
    produce_name: str
    produce_category: str
    expected_quantity: float
    quantity_unit: str
    state: str
    district: str
    mandal: str
    village: str
    pin_code: str
    harvest_date: str
    produce_ready_status: str

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
    rejection_reason: Optional[str] = None
    created_at: datetime
    images: List[ProduceImageResponse] = []
    
    # Harvested produce fields
    produce_category: Optional[str] = None
    quantity_unit: Optional[str] = None
    pin_code: Optional[str] = None
    harvest_date: Optional[str] = None
    produce_ready_status: Optional[str] = None

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
    verification_centre: Optional[str] = None
    verification_date: Optional[str] = None
    verification_time: Optional[str] = None
    sample_instructions: Optional[str] = None

class SampleVerificationResponse(BaseModel):
    id: int
    registration_id: int
    officer_id: Optional[int] = None
    moisture: float
    foreign_matter: float
    grain_quality: str
    remarks: Optional[str] = None
    status: str
    verification_centre: Optional[str] = None
    verification_date: Optional[str] = None
    verification_time: Optional[str] = None
    sample_instructions: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Slot Booking Schemas ---
class SlotBookingRequest(BaseModel):
    slot_date: str
    slot_time: str

class ProcurementSlotResponse(BaseModel):
    id: int
    centre_id: int
    slot_date: str
    slot_time: str
    capacity: int

    class Config:
        from_attributes = True

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

class ProcurementTimelineStep(BaseModel):
    step: str
    completed: bool
    current: bool

class FarmerProcurementDetailResponse(BaseModel):
    id: int
    procurement_number: str
    registration_number: str
    crop_name: str
    product: str
    quantity: float
    centre_name: str
    status: str
    officer_remarks: Optional[str] = None
    payment_status: str
    slot_date: str
    slot_time: str
    total_amount: float
    transaction_reference: Optional[str] = None
    expected_payment_date: Optional[datetime] = None
    payment_date: Optional[datetime] = None
    timeline: List[ProcurementTimelineStep] = []
    created_at: datetime

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
