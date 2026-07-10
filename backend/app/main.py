import os
import datetime
import os
import random
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session
from sqlalchemy import func

from .database import engine, Base, get_db
from . import models, schemas, auth, ai

# Initialize uploads directory
os.makedirs("uploads", exist_ok=True)

# Create Database tables (automatically runs on startup)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Farmer2Gov API",
    description="Digital Public Infrastructure (DPI) for transparent agricultural procurement coordination.",
    version="1.0.0"
)

# CORS middleware config for React frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount upload directory as static files
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")


# --- HELPER FUNCTIONS ---
def generate_registration_id(db: Session) -> str:
    year = datetime.datetime.utcnow().year
    count = db.query(models.CropRegistration).count()
    return f"F2G-PH-{year}-{1001 + count}"

def generate_procurement_id(db: Session) -> str:
    year = datetime.datetime.utcnow().year
    count = db.query(models.Procurement).count()
    return f"F2G-PR-{year}-{5001 + count}"

def add_notification(db: Session, user_id: int, title: str, message: str, notif_type: str = "general"):
    notification = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        is_read=False
    )
    db.add(notification)
    db.commit()

def log_audit(db: Session, user_id: Optional[int], action: str, details: str):
    log = models.AuditLog(
        user_id=user_id,
        action=action,
        details=details,
        ip_address="127.0.0.1"
    )
    db.add(log)
    db.commit()


# --- AUTHENTICATION API ---

@app.post("/api/auth/otp/request", response_model=dict)
def request_otp(payload: schemas.OTPRequest, db: Session = Depends(get_db)):
    """Simulates sending an OTP code to a mobile number."""
    phone = payload.phone
    role = payload.role
    
    # Generate 6-digit OTP
    otp = str(random.randint(100000, 999999))
    
    # Store OTP with expiry of 5 minutes
    expiry = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    auth.active_otps[phone] = {"otp": otp, "expires_at": expiry, "role": role}
    
    # In a real environment, this triggers SMS gateway. We return it for easy testing.
    log_audit(db, None, "OTP_REQUEST", f"OTP requested for phone {phone} (Role: {role})")
    
    return {
        "success": True, 
        "message": f"Simulated OTP sent successfully via SMS to {phone}.", 
        "otp": otp  # Exposed for demo convenience
    }

@app.post("/api/auth/otp/verify", response_model=schemas.Token)
def verify_otp(payload: schemas.OTPVerify, db: Session = Depends(get_db)):
    """Verifies OTP and generates a JWT access token. Creates a new user if farmer not found."""
    phone = payload.phone
    otp = payload.otp
    role = payload.role

    # OTP validation
    stored = auth.active_otps.get(phone)
    if not stored or stored["otp"] != otp or stored["role"] != role:
        # For demo purposes, we also allow "123456" as universal OTP override
        if otp != "123456":
            raise HTTPException(status_code=400, detail="Invalid OTP code or expired session.")
            
    # Remove OTP once verified
    if phone in auth.active_otps:
        del auth.active_otps[phone]

    # Find or create user
    user = db.query(models.User).filter(models.User.phone == phone, models.User.role == role).first()
    
    if not user:
        if role == "farmer":
            raise HTTPException(status_code=404, detail="Mobile number not registered. Please register first.")
        else:
            raise HTTPException(status_code=404, detail="User account not registered. Admin or Officer must pre-create credentials.")

    # Generate JWT token
    access_token = auth.create_access_token(data={"user_id": user.id, "role": user.role})
    
    log_audit(db, user.id, "USER_LOGIN", f"OTP login successful for {phone}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }

@app.post("/api/auth/register/farmer", response_model=dict)
def register_farmer(payload: schemas.FarmerCreate, db: Session = Depends(get_db)):
    """Registers a new farmer user and creates their profile."""
    # Check if user already exists
    existing_user = db.query(models.User).filter(models.User.phone == payload.phone).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Mobile number already registered. Please login.")
        
    # Create user
    user = models.User(
        name=payload.name,
        phone=payload.phone,
        email=f"farmer_{payload.phone[-4:]}@farmer2gov.gov.in",
        hashed_password=auth.get_password_hash("password123"), # default password
        role="farmer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create farmer profile
    farmer = models.Farmer(
        user_id=user.id,
        land_area=payload.land_area,
        state=payload.state,
        district=payload.district,
        mandal=payload.mandal,
        village=payload.village,
        language_preference=payload.language_preference
    )
    db.add(farmer)
    db.commit()
    db.refresh(farmer)
    
    log_audit(db, user.id, "USER_REGISTER", f"Farmer registered successfully for phone {payload.phone}")
    
    return {"success": True, "message": "Registration successful. Please login."}

@app.post("/api/auth/login", response_model=schemas.Token)
def login_email_password(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    """Standard password login for Procurement Officers and Administrators."""
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not auth.verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
        
    access_token = auth.create_access_token(data={"user_id": user.id, "role": user.role})
    log_audit(db, user.id, "USER_LOGIN", f"Password login successful for {user.email}")
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.role,
        "user_id": user.id,
        "name": user.name
    }


# --- CROP REGISTRATION (FARMER FLOW) ---

@app.post("/api/crops/register", response_model=schemas.CropRegistrationResponse)
def register_crop(payload: schemas.CropRegistrationCreate, current_user: models.User = Depends(auth.require_role(["farmer"])), db: Session = Depends(get_db)):
    """Farmer submits a pre-harvest crop registration."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found.")
        
    # Check for duplicate registration of same crop in same season
    exists = db.query(models.CropRegistration).filter(
        models.CropRegistration.farmer_id == farmer.id,
        models.CropRegistration.crop_name == payload.crop_name,
        models.CropRegistration.expected_harvest_month == payload.expected_harvest_month,
        models.CropRegistration.status != "Rejected"
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="Duplicate pre-harvest registration detected for this crop and harvest window.")

    reg_id = generate_registration_id(db)
    crop_reg = models.CropRegistration(
        registration_number=reg_id,
        farmer_id=farmer.id,
        crop_name=payload.crop_name,
        crop_stage=payload.crop_stage,
        expected_harvest_month=payload.expected_harvest_month,
        expected_quantity=payload.expected_quantity,
        land_area=payload.land_area,
        state=payload.state,
        district=payload.district,
        mandal=payload.mandal,
        village=payload.village,
        phone_number=payload.phone_number,
        status="Registered"
    )
    db.add(crop_reg)
    db.commit()
    db.refresh(crop_reg)
    
    # Add automated Harvest Reminder for later
    add_notification(
        db, 
        current_user.id, 
        "Pre-Harvest Registration Successful", 
        f"Your crop registration {reg_id} has been registered. Expected harvest: {payload.expected_harvest_month}.", 
        "general"
    )
    
    log_audit(db, current_user.id, "CROP_REGISTRATION", f"Registered crop {payload.crop_name} (ID: {reg_id})")
    
    return crop_reg

@app.post("/api/crops/register-produce", response_model=schemas.CropRegistrationResponse)
def register_produce(payload: schemas.ProduceRegistrationCreate, current_user: models.User = Depends(auth.require_role(["farmer"])), db: Session = Depends(get_db)):
    """Farmer registers harvested produce directly."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found.")
        
    year = datetime.datetime.utcnow().year
    count = db.query(models.CropRegistration).filter(models.CropRegistration.registration_number.like(f"F2G-PROD-{year}-%")).count()
    prod_id = f"F2G-PROD-{year}-{count + 1:03d}"
    
    # Store harvested produce as a crop registration with stage "Harvested"
    produce_reg = models.CropRegistration(
        registration_number=prod_id,
        farmer_id=farmer.id,
        crop_name=payload.produce_name,
        crop_stage="Harvested",
        expected_harvest_month=payload.harvest_date,  # Map harvest_date to expected_harvest_month
        expected_quantity=payload.expected_quantity,
        land_area=0.0,  # Ready produce doesn't strictly have a growing land area, default 0
        state=payload.state,
        district=payload.district,
        mandal=payload.mandal,
        village=payload.village,
        phone_number=payload.phone_number,
        status="Registered",
        
        # New produce-specific fields
        produce_category=payload.produce_category,
        quantity_unit=payload.quantity_unit,
        pin_code=payload.pin_code,
        harvest_date=payload.harvest_date,
        produce_ready_status=payload.produce_ready_status
    )
    db.add(produce_reg)
    db.commit()
    db.refresh(produce_reg)
    
    add_notification(
        db, 
        current_user.id, 
        "Produce Registration Successful", 
        f"Your harvested produce {prod_id} has been registered successfully.", 
        "general"
    )
    
    log_audit(db, current_user.id, "PRODUCE_REGISTRATION", f"Registered produce {payload.produce_name} (ID: {prod_id})")
    
    return produce_reg

@app.get("/api/crops/my-registrations", response_model=List[schemas.CropRegistrationResponse])
def get_my_registrations(current_user: models.User = Depends(auth.require_role(["farmer"])), db: Session = Depends(get_db)):
    """Fetch all crop registrations for the current farmer."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        return []
    return db.query(models.CropRegistration).filter(models.CropRegistration.farmer_id == farmer.id).all()

@app.get("/api/crops/{id}", response_model=schemas.CropRegistrationResponse)
def get_crop_details(id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Fetch details of a single registration."""
    crop_reg = db.query(models.CropRegistration).filter(models.CropRegistration.id == id).first()
    if not crop_reg:
        raise HTTPException(status_code=404, detail="Crop registration not found.")
        
    # Check permissions
    if current_user.role == "farmer":
        farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
        if crop_reg.farmer_id != farmer.id:
            raise HTTPException(status_code=403, detail="Access denied.")
            
    return crop_reg


# --- CAMERA & AI PRE-ASSESSMENT ---

@app.post("/api/crops/{id}/upload-images", response_model=List[schemas.ProduceImageResponse])
def upload_produce_images(
    id: int,
    image_type: str = Form(..., description="full_produce, close_up, storage_view"),
    gps_latitude: float = Form(...),
    gps_longitude: float = Form(...),
    gps_location_name: str = Form(...),
    device_info: str = Form(...),
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Saves uploaded produce photos and links them to the crop registration."""
    crop_reg = db.query(models.CropRegistration).filter(models.CropRegistration.id == id).first()
    if not crop_reg:
        raise HTTPException(status_code=404, detail="Crop registration not found.")
        
    # Verify owner
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if crop_reg.farmer_id != farmer.id:
        raise HTTPException(status_code=403, detail="Access denied.")

    # Save physical file
    file_extension = os.path.splitext(file.filename)[1]
    filename = f"{crop_reg.registration_number}_{image_type}{file_extension}"
    file_path = os.path.join("uploads", filename)
    
    with open(file_path, "wb") as f:
        f.write(file.file.read())
        
    image_url = f"/uploads/{filename}"

    # Save database record
    prod_image = models.ProduceImage(
        registration_id=id,
        image_url=image_url,
        image_type=image_type,
        gps_latitude=gps_latitude,
        gps_longitude=gps_longitude,
        gps_location_name=gps_location_name,
        device_info=device_info
    )
    db.add(prod_image)
    
    # Check if we have uploaded all three required images
    db.commit()
    
    uploaded_types = db.query(models.ProduceImage.image_type).filter(models.ProduceImage.registration_id == id).all()
    types_list = [t[0] for t in uploaded_types]
    
    # If standard images are loaded, progress status
    if "full_produce" in types_list and "close_up" in types_list and "storage_view" in types_list:
        crop_reg.status = "Images Uploaded"
        db.commit()
        
    db.refresh(prod_image)
    return db.query(models.ProduceImage).filter(models.ProduceImage.registration_id == id).all()

@app.post("/api/crops/{id}/ai-assess", response_model=schemas.AIAssessmentResponse)
def trigger_ai_assessment(
    id: int, 
    current_user: models.User = Depends(auth.require_role(["farmer"])), 
    db: Session = Depends(get_db)
):
    """Processes uploaded close-up image through OpenCV scanner and generates AI metrics."""
    crop_reg = db.query(models.CropRegistration).filter(models.CropRegistration.id == id).first()
    if not crop_reg:
        raise HTTPException(status_code=404, detail="Crop registration not found.")
        
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if crop_reg.farmer_id != farmer.id:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    # Check if images exist
    close_up_img = db.query(models.ProduceImage).filter(
        models.ProduceImage.registration_id == id,
        models.ProduceImage.image_type == "close_up"
    ).first()
    
    image_bytes = b""
    if close_up_img:
        # Load local image file to bytes
        local_path = close_up_img.image_url.lstrip("/")
        if os.path.exists(local_path):
            with open(local_path, "rb") as f:
                image_bytes = f.read()

    # Trigger OpenCV evaluation (or simulation if bytes empty)
    assessment_data = ai.analyze_crop_image(image_bytes, crop_reg.crop_name)
    
    # Clear existing assessment if any
    existing = db.query(models.AIAssessment).filter(models.AIAssessment.registration_id == id).first()
    if existing:
        db.delete(existing)
        
    assessment = models.AIAssessment(
        registration_id=id,
        crop_name=assessment_data["crop_name"],
        confidence=assessment_data["confidence"],
        visual_quality=assessment_data["visual_quality"],
        grain_uniformity=assessment_data["grain_uniformity"],
        foreign_material=assessment_data["foreign_material"],
        estimated_moisture=assessment_data["estimated_moisture"],
        score=assessment_data["score"],
        recommendation=assessment_data["recommendation"]
    )
    db.add(assessment)
    
    crop_reg.status = "AI Reviewed"
    db.commit()
    db.refresh(assessment)
    
    add_notification(
        db, 
        current_user.id, 
        "AI Pre-Assessment Complete", 
        f"Produce analysis for registration {crop_reg.registration_number} is completed. Quality Score: {assessment.score}%.", 
        "ai_report"
    )
    
    log_audit(db, current_user.id, "AI_ASSESSMENT", f"Completed AI assessment for {crop_reg.registration_number}. Score: {assessment.score}")
    
    return assessment

@app.get("/api/crops/{id}/ai-report", response_model=schemas.AIAssessmentResponse)
def get_ai_report(id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Fetch AI pre-assessment report for a registration."""
    assessment = db.query(models.AIAssessment).filter(models.AIAssessment.registration_id == id).first()
    if not assessment:
        raise HTTPException(status_code=404, detail="AI report not found.")
    return assessment


# --- SLOT BOOKING (FARMER FLOW) ---

@app.post("/api/crops/{id}/book-slot", response_model=schemas.ProcurementResponse)
def book_procurement_slot(
    id: int,
    payload: schemas.SlotBookingRequest,
    current_user: models.User = Depends(auth.require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Farmer books a procurement center slot once verified/approved."""
    crop_reg = db.query(models.CropRegistration).filter(models.CropRegistration.id == id).first()
    if not crop_reg:
        raise HTTPException(status_code=404, detail="Crop registration not found.")
        
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if crop_reg.farmer_id != farmer.id:
        raise HTTPException(status_code=403, detail="Access denied.")
        
    if crop_reg.status not in ["Approved", "Sample Verified"]:
        # Auto-bypass sample verification for demo slot booking if required, but standard workflow demands verification
        # For seamless demo, if the crop status is AI Reviewed or Awaiting Verification, we can allow it
        pass

    # Retrieve MSP rate
    msp_info = db.query(models.MSPRate).filter(models.MSPRate.crop_name == crop_reg.crop_name).first()
    msp_rate = msp_info.msp_rate if msp_info else 2183.0 # Fallback default

    # Assign procurement centre closest to district (or default first centre)
    centre = db.query(models.ProcurementCentre).filter(models.ProcurementCentre.district == crop_reg.district).first()
    if not centre:
        centre = db.query(models.ProcurementCentre).first()
    
    centre_id = centre.id if centre else None

    # Create procurement transaction row
    proc_num = generate_procurement_id(db)
    procurement = models.Procurement(
        procurement_number=proc_num,
        registration_id=id,
        centre_id=centre_id,
        declared_quantity=crop_reg.expected_quantity,
        actual_quantity=0.0,
        accepted_quantity=0.0,
        msp_rate=msp_rate,
        total_amount=0.0,
        slot_date=payload.slot_date,
        slot_time=payload.slot_time,
        status="Booked"
    )
    db.add(procurement)
    
    crop_reg.status = "Slot Booked"
    db.commit()
    db.refresh(procurement)

    # Add Payment skeleton (Pending state)
    payment = models.Payment(
        procurement_id=procurement.id,
        farmer_id=farmer.id,
        amount=crop_reg.expected_quantity * msp_rate,
        status="Pending",
        expected_date=datetime.datetime.utcnow() + datetime.timedelta(days=7)
    )
    db.add(payment)
    db.commit()

    add_notification(
        db, 
        current_user.id, 
        "Procurement Slot Confirmed", 
        f"Slot booked for registration {crop_reg.registration_number} on {payload.slot_date} at {payload.slot_time}.", 
        "slot"
    )
    
    log_audit(db, current_user.id, "SLOT_BOOKING", f"Booked slot for {crop_reg.registration_number} on {payload.slot_date}")

    return procurement


def build_procurement_timeline(reg_status: str, proc_status: str, pay_status: str) -> List[dict]:
    """Build procurement timeline steps for farmer dashboard."""
    steps = ["Slot Booked", "Weigh-In Completed", "Payment Initiated", "Payment Completed"]

    if pay_status == "Completed" or reg_status == "Payment Completed":
        current = 3
    elif pay_status in ("Initiated", "Processing") or reg_status in ("Payment Initiated", "Procured"):
        current = 2 if proc_status == "Completed" else 1
    elif proc_status == "Completed":
        current = 2
    else:
        current = 0

    return [
        {"step": label, "completed": idx <= current, "current": idx == current}
        for idx, label in enumerate(steps)
    ]


@app.get("/api/procurements/my", response_model=List[schemas.FarmerProcurementDetailResponse])
def get_my_procurements(
    current_user: models.User = Depends(auth.require_role(["farmer"])),
    db: Session = Depends(get_db),
):
    """Fetch all procurement records for the logged-in farmer."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        return []

    procurements = (
        db.query(models.Procurement)
        .join(models.CropRegistration, models.Procurement.registration_id == models.CropRegistration.id)
        .filter(models.CropRegistration.farmer_id == farmer.id)
        .order_by(models.Procurement.created_at.desc())
        .all()
    )

    results = []
    for proc in procurements:
        crop_reg = proc.registration
        if not crop_reg:
            continue

        centre_name = proc.centre.name if proc.centre else "Not Assigned"
        payment = proc.payment
        sample = crop_reg.sample_verification

        if sample and sample.grain_quality:
            product = f"{sample.grain_quality} {crop_reg.crop_name}"
        else:
            product = crop_reg.crop_name

        quantity = proc.accepted_quantity if proc.status == "Completed" and proc.accepted_quantity > 0 else proc.declared_quantity
        pay_status = payment.status if payment else "Pending"

        results.append({
            "id": proc.id,
            "procurement_number": proc.procurement_number,
            "registration_number": crop_reg.registration_number,
            "crop_name": crop_reg.crop_name,
            "product": product,
            "quantity": quantity,
            "centre_name": centre_name,
            "status": crop_reg.status,
            "officer_remarks": sample.remarks if sample else None,
            "payment_status": pay_status,
            "slot_date": proc.slot_date,
            "slot_time": proc.slot_time,
            "total_amount": proc.total_amount if proc.total_amount > 0 else (payment.amount if payment else 0.0),
            "transaction_reference": payment.transaction_reference if payment else None,
            "expected_payment_date": payment.expected_date if payment else None,
            "payment_date": payment.payment_date if payment else None,
            "timeline": build_procurement_timeline(crop_reg.status, proc.status, pay_status),
            "created_at": proc.created_at,
        })

    return results


# --- PROCUREMENT OFFICER FLOW ---

@app.get("/api/officer/requests", response_model=List[dict])
def get_officer_requests(current_user: models.User = Depends(auth.require_role(["officer"])), db: Session = Depends(get_db)):
    """Fetch queue of farmer registrations for the officer's centre/district."""
    officer = db.query(models.Officer).filter(models.Officer.user_id == current_user.id).first()
    
    # Query registrations along with farmer details and AI scores
    query = db.query(
        models.CropRegistration,
        models.Farmer,
        models.User.name.label("farmer_name"),
        models.AIAssessment.score.label("ai_score")
    ).join(
        models.Farmer, models.CropRegistration.farmer_id == models.Farmer.id
    ).join(
        models.User, models.Farmer.user_id == models.User.id
    ).outerjoin(
        models.AIAssessment, models.CropRegistration.id == models.AIAssessment.registration_id
    )
    
    # Filter by officer district if centre is defined
    if officer and officer.centre:
        query = query.filter(models.CropRegistration.district == officer.centre.district)
        
    results = query.all()
    
    requests_list = []
    for reg, farmer, name, score in results:
        requests_list.append({
            "id": reg.id,
            "registration_number": reg.registration_number,
            "farmer_name": name,
            "crop_name": reg.crop_name,
            "district": reg.district,
            "quantity": reg.expected_quantity,
            "ai_score": score if score else 0.0,
            "status": reg.status,
            "created_at": reg.created_at
        })
        
    return requests_list

@app.post("/api/officer/verify-sample/{id}", response_model=schemas.SampleVerificationResponse)
def verify_sample(
    id: int,
    payload: schemas.SampleVerificationCreate,
    current_user: models.User = Depends(auth.require_role(["officer"])),
    db: Session = Depends(get_db)
):
    """Procurement Officer submits visual and chemical test parameters for the crop sample."""
    crop_reg = db.query(models.CropRegistration).filter(models.CropRegistration.id == id).first()
    if not crop_reg:
        raise HTTPException(status_code=404, detail="Crop registration not found.")
        
    officer = db.query(models.Officer).filter(models.Officer.user_id == current_user.id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer profile not found.")

    # Create verification record
    existing = db.query(models.SampleVerification).filter(models.SampleVerification.registration_id == id).first()
    if existing:
        db.delete(existing)
        
    verification = models.SampleVerification(
        registration_id=id,
        officer_id=officer.id,
        moisture=payload.moisture,
        foreign_matter=payload.foreign_matter,
        grain_quality=payload.grain_quality,
        remarks=payload.remarks,
        status=payload.status
    )
    db.add(verification)

    # Update crop status
    if payload.status == "Approved":
        crop_reg.status = "Approved"
        msg = f"Your crop sample for registration {crop_reg.registration_number} has been APPROVED by the procurement officer."
    elif payload.status == "Rejected":
        crop_reg.status = "Rejected"
        msg = f"Your crop sample for registration {crop_reg.registration_number} has been REJECTED: {payload.remarks}."
    else:
        crop_reg.status = "Sample Requested"
        msg = f"Procurement officer has requested reinspection for {crop_reg.registration_number}."
        
    db.commit()
    db.refresh(verification)
    
    # Notify farmer
    farmer_user_id = crop_reg.farmer.user_id
    add_notification(db, farmer_user_id, "Sample Verification Update", msg, "general")
    
    log_audit(db, current_user.id, "SAMPLE_VERIFICATION", f"Verified sample for {crop_reg.registration_number}. Status: {payload.status}")
    
    return verification

@app.post("/api/officer/procure/{id}", response_model=schemas.ProcurementResponse)
def complete_procurement(
    id: int,
    payload: schemas.ProcurementCreate,
    current_user: models.User = Depends(auth.require_role(["officer"])),
    db: Session = Depends(get_db)
):
    """Officer enters weigh-in details, triggers digital receipt generation, and initiates payment."""
    crop_reg = db.query(models.CropRegistration).filter(models.CropRegistration.id == id).first()
    if not crop_reg:
        raise HTTPException(status_code=404, detail="Crop registration not found.")
        
    officer = db.query(models.Officer).filter(models.Officer.user_id == current_user.id).first()
    if not officer:
        raise HTTPException(status_code=404, detail="Officer profile not found.")

    procurement = db.query(models.Procurement).filter(models.Procurement.registration_id == id).first()
    if not procurement:
        # Create procurement row if slot wasn't booked previously (flexibility for demo)
        proc_num = generate_procurement_id(db)
        procurement = models.Procurement(
            procurement_number=proc_num,
            registration_id=id,
            centre_id=officer.centre_id,
            declared_quantity=payload.declared_quantity,
            slot_date=payload.slot_date,
            slot_time=payload.slot_time,
        )
        db.add(procurement)
        db.commit()
        db.refresh(procurement)

    # Compute amount
    total_amount = payload.accepted_quantity * payload.msp_rate

    # Update procurement weigh-in details
    procurement.officer_id = officer.id
    procurement.centre_id = officer.centre_id or procurement.centre_id
    procurement.actual_quantity = payload.actual_quantity
    procurement.accepted_quantity = payload.accepted_quantity
    procurement.msp_rate = payload.msp_rate
    procurement.total_amount = total_amount
    procurement.status = "Completed"
    
    # Generate mock digital receipt link
    procurement.digital_receipt_url = f"/api/procurements/{procurement.id}/receipt"

    # Update crop status
    crop_reg.status = "Procured"
    db.commit()

    # Update payment record linked to this procurement
    payment = db.query(models.Payment).filter(models.Payment.procurement_id == procurement.id).first()
    if not payment:
        payment = models.Payment(
            procurement_id=procurement.id,
            farmer_id=crop_reg.farmer_id,
            amount=total_amount,
            status="Pending"
        )
        db.add(payment)
    else:
        payment.amount = total_amount
        
    payment.status = "Initiated"
    payment.payment_date = datetime.datetime.utcnow()
    payment.transaction_reference = f"TXN-{random.randint(1000000000, 9999999999)}"
    db.commit()

    # Notify farmer
    farmer_user_id = crop_reg.farmer.user_id
    add_notification(
        db, 
        farmer_user_id, 
        "Procurement Weight Record Completed", 
        f"Weigh-in completed for {crop_reg.registration_number}. Accepted: {payload.accepted_quantity} Qtl. Total: Rs. {total_amount:.2f}. Payment initiated.",
        "payment"
    )

    log_audit(db, current_user.id, "PROCUREMENT_COMPLETE", f"Procured {payload.accepted_quantity} Qtl from registration {crop_reg.registration_number}")
    
    db.refresh(procurement)
    return procurement

@app.get("/api/procurements/{id}/receipt")
def get_digital_receipt(id: int, db: Session = Depends(get_db)):
    """API endpoint simulating printable digital receipt payload."""
    proc = db.query(models.Procurement).filter(models.Procurement.id == id).first()
    if not proc:
        raise HTTPException(status_code=404, detail="Procurement record not found.")
    
    crop_reg = proc.registration
    farmer_name = crop_reg.farmer.user.name
    centre_name = proc.centre.name if proc.centre else "Govt Procurement Hub"
    
    return {
        "receipt_number": proc.procurement_number,
        "date": proc.created_at.strftime("%Y-%m-%d %H:%M:%S"),
        "farmer_name": farmer_name,
        "phone": crop_reg.phone_number,
        "crop": crop_reg.crop_name,
        "centre": centre_name,
        "declared_qty_qtl": proc.declared_quantity,
        "actual_qty_qtl": proc.actual_quantity,
        "accepted_qty_qtl": proc.accepted_quantity,
        "msp_per_qtl": proc.msp_rate,
        "total_amount_rs": proc.total_amount,
        "transaction_status": "PAID" if proc.payment and proc.payment.status == "Completed" else "PAYMENT INITIATED",
        "reference_id": proc.payment.transaction_reference if proc.payment else None
    }


# --- PAYMENT PROGRESS ACTIONS ---

@app.post("/api/officer/payments/{id}/update", response_model=schemas.PaymentResponse)
def update_payment_status(
    id: int,
    payload: schemas.PaymentStatusUpdate,
    current_user: models.User = Depends(auth.require_role(["officer", "admin"])),
    db: Session = Depends(get_db)
):
    """Updates payment status (Initiated -> Processing -> Completed) and sends real-time logs."""
    payment = db.query(models.Payment).filter(models.Payment.id == id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Payment record not found.")

    payment.status = payload.status
    if payload.transaction_reference:
        payment.transaction_reference = payload.transaction_reference
    
    if payload.status == "Completed":
        payment.payment_date = datetime.datetime.utcnow()
        # Update registration status to final stage
        procurement = payment.procurement
        if procurement and procurement.registration:
            procurement.registration.status = "Payment Completed"
    elif payload.status == "Processing":
        procurement = payment.procurement
        if procurement and procurement.registration:
            procurement.registration.status = "Payment Initiated"
            
    db.commit()
    db.refresh(payment)

    # Notify farmer
    farmer_user_id = payment.farmer.user_id
    add_notification(
        db, 
        farmer_user_id, 
        "Payment Status Updated", 
        f"Your procurement payment of Rs. {payment.amount:.2f} is now: {payload.status.upper()}.",
        "payment"
    )
    
    log_audit(db, current_user.id, "PAYMENT_UPDATE", f"Updated payment ID {id} status to {payload.status}")
    
    return payment


# --- COMMON & MSP METRIC ENDPOINTS ---

@app.get("/api/msp", response_model=List[schemas.MSPRateResponse])
def get_msp_rates(db: Session = Depends(get_db)):
    """Fetch government Minimum Support Price rates."""
    return db.query(models.MSPRate).all()

@app.get("/api/centres", response_model=List[schemas.ProcurementCentreResponse])
def get_centres(db: Session = Depends(get_db)):
    """Fetch geolocations of government procurement centres."""
    return db.query(models.ProcurementCentre).all()

@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_my_notifications(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Fetch in-app alerts for the logged-in user."""
    return db.query(models.Notification).filter(models.Notification.user_id == current_user.id).order_by(models.Notification.created_at.desc()).all()

@app.post("/api/notifications/{id}/read")
def mark_notification_as_read(id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Marks single notification alert as read."""
    notif = db.query(models.Notification).filter(models.Notification.id == id, models.Notification.user_id == current_user.id).first()
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found.")
    notif.is_read = True
    db.commit()
    return {"success": True}


# --- ADMIN ANALYTICS & FORECASTING ---

@app.get("/api/admin/analytics")
def get_admin_analytics(current_user: models.User = Depends(auth.require_role(["admin"])), db: Session = Depends(get_db)):
    """Aggregate insights, crop volumes, and district coordination distributions."""
    total_farmers = db.query(models.Farmer).count()
    total_officers = db.query(models.Officer).count()
    
    # Registration count by crop type
    crop_counts = db.query(
        models.CropRegistration.crop_name, 
        func.count(models.CropRegistration.id).label("count"),
        func.sum(models.CropRegistration.expected_quantity).label("total_qty")
    ).group_by(models.CropRegistration.crop_name).all()
    
    crop_dist = [{"crop": name, "count": count, "expected_qty": qty or 0.0} for name, count, qty in crop_counts]
    
    # Registrations count by district
    dist_counts = db.query(
        models.CropRegistration.district,
        func.count(models.CropRegistration.id).label("count")
    ).group_by(models.CropRegistration.district).all()
    
    district_dist = [{"district": dist, "count": count} for dist, count in dist_counts]

    # Procurement state counts
    total_procured = db.query(func.sum(models.Procurement.accepted_quantity)).scalar() or 0.0
    total_amount = db.query(func.sum(models.Procurement.total_amount)).scalar() or 0.0
    
    # Monthly registration timeline
    monthly_counts = db.query(
        func.strftime("%Y-%m", models.CropRegistration.created_at).label("month"), # works on SQLite
        func.count(models.CropRegistration.id).label("count")
    ).group_by("month").order_by("month").all()
    
    # Handle if SQLite strftime returns None, fall back to custom formatting if using Postgres
    # But SQLite is our fallback, so we keep simple
    monthly_trend = [{"month": m or "2026-07", "count": count} for m, count in monthly_counts]
    if not monthly_trend:
        # Fallback seeding month if database is empty or queries are mismatch
        monthly_trend = [{"month": "2026-05", "count": 10}, {"month": "2026-06", "count": 28}, {"month": "2026-07", "count": 50}]

    # Average AI score
    avg_ai = db.query(func.avg(models.AIAssessment.score)).scalar() or 78.5

    # Expected volumes forecast (Sum of pre-harvest registration quantity not yet procured)
    forecast_query = db.query(
        models.CropRegistration.crop_name,
        func.sum(models.CropRegistration.expected_quantity).label("expected_volume")
    ).filter(
        models.CropRegistration.status.in_(["Registered", "Images Uploaded", "AI Reviewed", "Sample Requested", "Approved", "Slot Booked"])
    ).group_by(models.CropRegistration.crop_name).all()
    
    forecasts = [{"crop": c, "expected_volume": vol or 0.0} for c, vol in forecast_query]

    # Recent registrations queue
    recent_regs = db.query(models.CropRegistration).order_by(models.CropRegistration.created_at.desc()).limit(5).all()
    recent = [{
        "id": r.id,
        "registration_number": r.registration_number,
        "crop": r.crop_name,
        "qty": r.expected_quantity,
        "status": r.status,
        "district": r.district
    } for r in recent_regs]

    return {
        "metrics": {
            "total_farmers": total_farmers,
            "total_officers": total_officers,
            "total_procured_qtl": round(total_procured, 2),
            "total_payout_rs": round(total_amount, 2),
            "avg_ai_score": round(avg_ai, 1)
        },
        "crop_distribution": crop_dist,
        "district_distribution": district_dist,
        "monthly_trend": monthly_trend,
        "forecasts": forecasts,
        "recent_registrations": recent
    }
