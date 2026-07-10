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
    image_source: str = Form("Live Camera"),
    upload_time: Optional[str] = Form(None),
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
        device_info=device_info,
        image_source=image_source,
        upload_time=upload_time
    )
    db.add(prod_image)
    db.commit()
    
    # If standard primary image (close_up) is loaded, progress status immediately
    if image_type == "close_up":
        crop_reg.status = "Images Uploaded"
        db.commit()
        
    db.refresh(prod_image)
    return db.query(models.ProduceImage).filter(models.ProduceImage.registration_id == id).all()

@app.get("/api/crops/{id}/images", response_model=List[schemas.ProduceImageResponse])
def get_crop_images(id: int, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    """Retrieve all uploaded produce images for a crop registration."""
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
        raise HTTPException(
            status_code=400,
            detail="Slot booking is restricted. Crop registration status must be Approved or Sample Verified."
        )

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
        status=payload.status,
        verification_centre=payload.verification_centre,
        verification_date=payload.verification_date,
        verification_time=payload.verification_time,
        sample_instructions=payload.sample_instructions
    )
    db.add(verification)

    # Update crop status
    if payload.status == "Approved":
        crop_reg.status = "Approved"
        crop_reg.rejection_reason = None
        msg = f"Your crop sample for registration {crop_reg.registration_number} has been APPROVED by the procurement officer."
    elif payload.status == "Rejected":
        crop_reg.status = "Rejected"
        crop_reg.rejection_reason = payload.remarks
        msg = f"Your crop sample for registration {crop_reg.registration_number} has been REJECTED: {payload.remarks}."
    else:
        crop_reg.status = "Sample Requested"
        crop_reg.rejection_reason = None
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

    # Status distributions
    status_counts = db.query(
        models.CropRegistration.status,
        func.count(models.CropRegistration.id).label("count")
    ).group_by(models.CropRegistration.status).all()
    status_dist = [{"status": status, "count": count} for status, count in status_counts]

    # Payment status distributions
    payment_counts = db.query(
        models.Payment.status,
        func.count(models.Payment.id).label("count")
    ).group_by(models.Payment.status).all()
    payment_dist = [{"status": status, "count": count} for status, count in payment_counts]

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
        "recent_registrations": recent,
        "status_distribution": status_dist,
        "payment_distribution": payment_dist
    }


# --- CUSTOMER MARKETPLACE ENDPOINTS ---

@app.post("/api/auth/register/customer", response_model=dict)
def register_customer(payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    """Registers a new Customer user and creates their profile and cart."""
    # Check if user already exists
    existing_user = db.query(models.User).filter(
        (models.User.phone == payload.phone) | (models.User.email == payload.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="User with this email or phone already registered.")
        
    # Create user
    user = models.User(
        name=payload.name,
        phone=payload.phone,
        email=payload.email,
        hashed_password=auth.get_password_hash(payload.password),
        role="customer"
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create Customer Profile
    year = datetime.datetime.utcnow().year
    count = db.query(models.Customer).count()
    cust_id = f"F2G-CUST-{year}-{1001 + count}"
    
    customer = models.Customer(
        user_id=user.id,
        customer_id=cust_id,
        address=payload.address,
        state=payload.state,
        district=payload.district,
        pincode=payload.pincode,
        profile_photo=payload.profile_photo
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    
    # Create an empty cart for the customer
    cart = models.Cart(customer_id=customer.id)
    db.add(cart)
    db.commit()
    
    log_audit(db, user.id, "CUSTOMER_REGISTER", f"Customer registered successfully with ID {cust_id}")
    
    return {"success": True, "message": "Customer registered successfully. Please login."}


# -- Marketplace Products --

@app.get("/api/marketplace/products", response_model=List[schemas.MarketplaceProductResponse])
def get_products(
    q: Optional[str] = None,
    category: Optional[str] = None,
    organic: Optional[bool] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    min_rating: Optional[float] = None,
    db: Session = Depends(get_db)
):
    """Fetches all marketplace products with optional search and filters."""
    query = db.query(models.MarketplaceProduct).join(models.Farmer).join(models.User)
    
    if category and category.lower() != "all":
        query = query.filter(models.MarketplaceProduct.category == category)
        
    if organic is not None:
        query = query.filter(models.MarketplaceProduct.organic_badge == organic)
        
    if min_price is not None:
        query = query.filter(models.MarketplaceProduct.price >= min_price)
        
    if max_price is not None:
        query = query.filter(models.MarketplaceProduct.price <= max_price)
        
    if min_rating is not None:
        query = query.filter(models.MarketplaceProduct.rating >= min_rating)
        
    products = query.all()
    
    # Format response with farmer information
    results = []
    for p in products:
        item = schemas.MarketplaceProductResponse.from_orm(p)
        item.farmer_name = p.farmer.user.name
        item.farmer_village = p.farmer.village
        item.farmer_district = p.farmer.district
        
        # Apply global search query filter
        if q:
            search_str = f"{p.name} {p.description or ''} {p.category} {p.farmer.user.name} {p.farmer.village} {p.farmer.district}".lower()
            if q.lower() in search_str:
                results.append(item)
        else:
            results.append(item)
            
    return results


@app.get("/api/marketplace/products/{id}", response_model=schemas.MarketplaceProductResponse)
def get_product(id: int, db: Session = Depends(get_db)):
    """Fetches a single marketplace product detail."""
    p = db.query(models.MarketplaceProduct).filter(models.MarketplaceProduct.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    item = schemas.MarketplaceProductResponse.from_orm(p)
    item.farmer_name = p.farmer.user.name
    item.farmer_village = p.farmer.village
    item.farmer_district = p.farmer.district
    return item


@app.post("/api/marketplace/products", response_model=schemas.MarketplaceProductResponse)
def create_product(
    payload: schemas.MarketplaceProductCreate,
    current_user: models.User = Depends(auth.require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Farmer publishes a new product to the marketplace."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    if not farmer:
        raise HTTPException(status_code=404, detail="Farmer profile not found.")
        
    p = models.MarketplaceProduct(
        farmer_id=farmer.id,
        name=payload.name,
        description=payload.description,
        category=payload.category,
        price=payload.price,
        original_price=payload.original_price,
        discount=payload.discount,
        stock=payload.stock,
        unit=payload.unit,
        image_url=payload.image_url,
        harvest_date=payload.harvest_date,
        freshness_badge=payload.freshness_badge,
        organic_badge=payload.organic_badge,
        government_verified=payload.government_verified
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    
    log_audit(db, current_user.id, "PRODUCT_CREATE", f"Product '{payload.name}' created by farmer {farmer.id}")
    
    item = schemas.MarketplaceProductResponse.from_orm(p)
    item.farmer_name = current_user.name
    item.farmer_village = farmer.village
    item.farmer_district = farmer.district
    return item


@app.put("/api/marketplace/products/{id}", response_model=schemas.MarketplaceProductResponse)
def update_product(
    id: int,
    payload: schemas.MarketplaceProductCreate,
    current_user: models.User = Depends(auth.require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Farmer updates their published product details."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    p = db.query(models.MarketplaceProduct).filter(
        models.MarketplaceProduct.id == id,
        models.MarketplaceProduct.farmer_id == farmer.id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found or not owned by you.")
        
    p.name = payload.name
    p.description = payload.description
    p.category = payload.category
    p.price = payload.price
    p.original_price = payload.original_price
    p.discount = payload.discount
    p.stock = payload.stock
    p.unit = payload.unit
    if payload.image_url:
        p.image_url = payload.image_url
    p.harvest_date = payload.harvest_date
    p.freshness_badge = payload.freshness_badge
    p.organic_badge = payload.organic_badge
    p.government_verified = payload.government_verified
    
    db.commit()
    db.refresh(p)
    
    item = schemas.MarketplaceProductResponse.from_orm(p)
    item.farmer_name = current_user.name
    item.farmer_village = farmer.village
    item.farmer_district = farmer.district
    return item


@app.delete("/api/marketplace/products/{id}", response_model=dict)
def delete_product(
    id: int,
    current_user: models.User = Depends(auth.require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Farmer deletes their published product."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    p = db.query(models.MarketplaceProduct).filter(
        models.MarketplaceProduct.id == id,
        models.MarketplaceProduct.farmer_id == farmer.id
    ).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found or not owned by you.")
        
    db.delete(p)
    db.commit()
    return {"success": True, "message": "Product deleted successfully."}


# -- Cart APIs --

@app.get("/api/cart", response_model=schemas.CartResponse)
def get_cart(current_user: models.User = Depends(auth.require_role(["customer"])), db: Session = Depends(get_db)):
    """Fetches customer's shopping cart items."""
    cust = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    cart = db.query(models.Cart).filter(models.Cart.customer_id == cust.id).first()
    if not cart:
        cart = models.Cart(customer_id=cust.id)
        db.add(cart)
        db.commit()
        db.refresh(cart)
        
    # Map products with farmer data
    for item in cart.items:
        p = item.product
        p.farmer_name = p.farmer.user.name
        p.farmer_village = p.farmer.village
        p.farmer_district = p.farmer.district
        
    return cart


@app.post("/api/cart/items", response_model=schemas.CartResponse)
def add_to_cart(
    payload: schemas.CartItemCreate,
    current_user: models.User = Depends(auth.require_role(["customer"])),
    db: Session = Depends(get_db)
):
    """Adds a product or updates its quantity in customer's cart."""
    cust = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    cart = db.query(models.Cart).filter(models.Cart.customer_id == cust.id).first()
    
    # Check if item already in cart
    item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.product_id == payload.product_id
    ).first()
    
    if item:
        if payload.quantity <= 0:
            db.delete(item)
        else:
            item.quantity = payload.quantity
    else:
        if payload.quantity > 0:
            item = models.CartItem(
                cart_id=cart.id,
                product_id=payload.product_id,
                quantity=payload.quantity
            )
            db.add(item)
            
    db.commit()
    db.refresh(cart)
    return get_cart(current_user, db)


@app.delete("/api/cart/items/{product_id}", response_model=schemas.CartResponse)
def remove_from_cart(
    product_id: int,
    current_user: models.User = Depends(auth.require_role(["customer"])),
    db: Session = Depends(get_db)
):
    """Removes a product entirely from customer's cart."""
    cust = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    cart = db.query(models.Cart).filter(models.Cart.customer_id == cust.id).first()
    
    item = db.query(models.CartItem).filter(
        models.CartItem.cart_id == cart.id,
        models.CartItem.product_id == product_id
    ).first()
    if item:
        db.delete(item)
        db.commit()
        
    db.refresh(cart)
    return get_cart(current_user, db)


@app.post("/api/cart/clear", response_model=dict)
def clear_cart(current_user: models.User = Depends(auth.require_role(["customer"])), db: Session = Depends(get_db)):
    """Clears customer's shopping cart."""
    cust = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    cart = db.query(models.Cart).filter(models.Cart.customer_id == cust.id).first()
    
    db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()
    db.commit()
    return {"success": True, "message": "Cart cleared successfully."}


# -- Wishlist APIs --

@app.get("/api/wishlist", response_model=List[schemas.MarketplaceProductResponse])
def get_wishlist(current_user: models.User = Depends(auth.require_role(["customer"])), db: Session = Depends(get_db)):
    """Fetches customer's wishlist items."""
    cust = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    wish = db.query(models.Wishlist).filter(models.Wishlist.customer_id == cust.id).all()
    
    results = []
    for w in wish:
        p = w.product
        item = schemas.MarketplaceProductResponse.from_orm(p)
        item.farmer_name = p.farmer.user.name
        item.farmer_village = p.farmer.village
        item.farmer_district = p.farmer.district
        results.append(item)
    return results


@app.post("/api/wishlist/{product_id}", response_model=dict)
def toggle_wishlist(
    product_id: int,
    current_user: models.User = Depends(auth.require_role(["customer"])),
    db: Session = Depends(get_db)
):
    """Toggles wishlist status of a product."""
    cust = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    exists = db.query(models.Wishlist).filter(
        models.Wishlist.customer_id == cust.id,
        models.Wishlist.product_id == product_id
    ).first()
    
    if exists:
        db.delete(exists)
        db.commit()
        return {"success": True, "wished": False, "message": "Removed from wishlist."}
    else:
        w = models.Wishlist(customer_id=cust.id, product_id=product_id)
        db.add(w)
        db.commit()
        return {"success": True, "wished": True, "message": "Added to wishlist."}


# -- Coupon Validation --

@app.get("/api/coupons/validate/{code}", response_model=schemas.CouponResponse)
def validate_coupon(code: str, db: Session = Depends(get_db)):
    """Validates coupon code."""
    c = db.query(models.Coupon).filter(
        models.Coupon.code == code.upper(),
        models.Coupon.active == True
    ).first()
    if not c:
        raise HTTPException(status_code=404, detail="Invalid or inactive coupon code.")
    return c


# -- Orders & Checkout APIs --

@app.post("/api/orders/checkout", response_model=schemas.OrderResponse)
def checkout_order(
    payload: schemas.OrderCreate,
    current_user: models.User = Depends(auth.require_role(["customer"])),
    db: Session = Depends(get_db)
):
    """Places an order, processes payment, sets delivery timeline, and empties cart."""
    cust = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    cart = db.query(models.Cart).filter(models.Cart.customer_id == cust.id).first()
    if not cart or not cart.items:
        raise HTTPException(status_code=400, detail="Shopping cart is empty.")
        
    # Calculate costs
    total = 0.0
    for item in cart.items:
        total += item.product.price * item.quantity
        
    discount = 0.0
    if payload.coupon_code:
        coupon = db.query(models.Coupon).filter(
            models.Coupon.code == payload.coupon_code.upper(),
            models.Coupon.active == True
        ).first()
        if coupon and total >= coupon.min_purchase:
            discount = coupon.discount_amount
            
    delivery_charge = 40.0 if total < 500 else 0.0
    tax = round(total * 0.05, 2) # 5% VAT/GST
    grand_total = round(total - discount + delivery_charge + tax, 2)
    
    # Create Order
    year = datetime.datetime.utcnow().year
    count = db.query(models.Order).count()
    order_number = f"F2G-ORD-{year}-{10001 + count}"
    
    order = models.Order(
        order_number=order_number,
        customer_id=cust.id,
        total_price=total,
        delivery_charges=delivery_charge,
        tax=tax,
        grand_total=grand_total,
        shipping_address=payload.shipping_address,
        coupon_code=payload.coupon_code.upper() if payload.coupon_code else None,
        status="Order Placed"
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    
    # Create OrderItems and reduce stock
    for item in cart.items:
        # Check stock availability
        if item.product.stock < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for product '{item.product.name}'. Available: {item.product.stock}")
            
        item.product.stock -= item.quantity
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=item.product.id,
            product_name=item.product.name,
            price=item.product.price,
            quantity=item.quantity
        )
        db.add(order_item)
        
    # Create Payment
    tx_ref = f"TXN-MKT-{random.randint(10000000, 99999999)}"
    pay_status = "Pending" if payload.payment_method == "Cash on Delivery" else "Completed"
    payment = models.MarketplacePayment(
        order_id=order.id,
        amount=grand_total,
        payment_method=payload.payment_method,
        status=pay_status,
        transaction_reference=tx_ref
    )
    db.add(payment)
    
    # Create Delivery agent details
    delivery = models.Delivery(
        order_id=order.id,
        delivery_agent="Rajesh Kumar",
        delivery_phone="9876543210",
        estimated_time="35 mins",
        status="Order Placed",
        latitude=17.9784 + (random.random() - 0.5) * 0.05,
        longitude=79.5941 + (random.random() - 0.5) * 0.05
    )
    db.add(delivery)
    
    # Create Notifications
    add_notification(
        db, 
        current_user.id, 
        "Order Placed successfully!", 
        f"Your order {order_number} has been created and payment processed via {payload.payment_method}.",
        "payment"
    )
    
    # Also notify farmers about new incoming orders
    farmer_notified_ids = set()
    for item in cart.items:
        farmer_uid = item.product.farmer.user.id
        if farmer_uid not in farmer_notified_ids:
            add_notification(
                db,
                farmer_uid,
                "New Marketplace Order",
                f"You have a new customer order for '{item.product.name}'. Please accept or process it.",
                "general"
            )
            farmer_notified_ids.add(farmer_uid)
            
    # Clear cart
    db.query(models.CartItem).filter(models.CartItem.cart_id == cart.id).delete()
    db.commit()
    db.refresh(order)
    
    log_audit(db, current_user.id, "ORDER_CHECKOUT", f"Order {order_number} created with total {grand_total}")
    return order


@app.get("/api/orders/my-orders", response_model=List[schemas.OrderResponse])
def get_my_orders(current_user: models.User = Depends(auth.require_role(["customer"])), db: Session = Depends(get_db)):
    """Fetches list of orders placed by the current Customer."""
    cust = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    orders = db.query(models.Order).filter(models.Order.customer_id == cust.id).order_by(models.Order.created_at.desc()).all()
    return orders


@app.get("/api/orders/{id}", response_model=schemas.OrderResponse)
def get_order_detail(id: int, current_user: models.User = Depends(auth.require_role(["customer", "farmer"])), db: Session = Depends(get_db)):
    """Fetches details of a single order."""
    order = db.query(models.Order).filter(models.Order.id == id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")
    return order


@app.get("/api/orders/{id}/tracking", response_model=schemas.DeliveryResponse)
def get_order_tracking(id: int, current_user: models.User = Depends(auth.require_role(["customer", "farmer"])), db: Session = Depends(get_db)):
    """Fetches tracking details of an order delivery."""
    delivery = db.query(models.Delivery).filter(models.Delivery.order_id == id).first()
    if not delivery:
        raise HTTPException(status_code=404, detail="Delivery tracking record not found.")
    return delivery


# -- Farmer Order Dashboard APIs --

@app.get("/api/farmer/orders", response_model=List[dict])
def get_farmer_orders(current_user: models.User = Depends(auth.require_role(["farmer"])), db: Session = Depends(get_db)):
    """Fetches marketplace orders for products published by the current Farmer."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    
    # Query order items belonging to farmer products
    items = db.query(models.OrderItem).join(models.Order).join(models.MarketplaceProduct).filter(
        models.MarketplaceProduct.farmer_id == farmer.id
    ).order_by(models.Order.created_at.desc()).all()
    
    results = []
    for item in items:
        order = item.order
        results.append({
            "order_item_id": item.id,
            "order_id": order.id,
            "order_number": order.order_number,
            "product_name": item.product_name,
            "quantity": item.quantity,
            "price": item.price,
            "total": item.price * item.quantity,
            "status": order.status,
            "customer_name": order.customer.user.name,
            "customer_phone": order.customer.user.phone,
            "shipping_address": order.shipping_address,
            "created_at": order.created_at
        })
    return results


@app.post("/api/farmer/orders/{order_item_id}/accept", response_model=dict)
def accept_order_item(
    order_item_id: int,
    current_user: models.User = Depends(auth.require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Farmer accepts the order."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    item = db.query(models.OrderItem).filter(models.OrderItem.id == order_item_id).first()
    if not item or item.product.farmer_id != farmer.id:
        raise HTTPException(status_code=404, detail="Order item not found or not owned by you.")
        
    order = item.order
    order.status = "Confirmed"
    
    # Update delivery tracking details
    delivery = db.query(models.Delivery).filter(models.Delivery.order_id == order.id).first()
    if delivery:
        delivery.status = "Confirmed"
        
    db.commit()
    
    # Notify customer
    add_notification(
        db,
        order.customer.user_id,
        "Order Confirmed",
        f"Your order {order.order_number} has been confirmed by the farmer.",
        "general"
    )
    return {"success": True, "message": "Order accepted successfully."}


@app.post("/api/farmer/orders/{order_item_id}/reject", response_model=dict)
def reject_order_item(
    order_item_id: int,
    current_user: models.User = Depends(auth.require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Farmer rejects the order."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    item = db.query(models.OrderItem).filter(models.OrderItem.id == order_item_id).first()
    if not item or item.product.farmer_id != farmer.id:
        raise HTTPException(status_code=404, detail="Order item not found or not owned by you.")
        
    order = item.order
    order.status = "Rejected"
    
    # Return stock
    if item.product:
        item.product.stock += item.quantity
        
    # Update delivery tracking details
    delivery = db.query(models.Delivery).filter(models.Delivery.order_id == order.id).first()
    if delivery:
        delivery.status = "Rejected"
        
    db.commit()
    
    # Notify customer
    add_notification(
        db,
        order.customer.user_id,
        "Order Rejected",
        f"Your order {order.order_number} was rejected by the farmer. A refund has been initiated.",
        "general"
    )
    return {"success": True, "message": "Order rejected successfully."}


@app.post("/api/farmer/orders/{order_item_id}/status", response_model=dict)
def update_delivery_status(
    order_item_id: int,
    status: str = Form(...), # "Packed", "Picked Up", "Out For Delivery", "Delivered"
    current_user: models.User = Depends(auth.require_role(["farmer"])),
    db: Session = Depends(get_db)
):
    """Farmer updates delivery status of an order."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    item = db.query(models.OrderItem).filter(models.OrderItem.id == order_item_id).first()
    if not item or item.product.farmer_id != farmer.id:
        raise HTTPException(status_code=404, detail="Order item not found.")
        
    order = item.order
    order.status = status
    
    # Update delivery tracking details
    delivery = db.query(models.Delivery).filter(models.Delivery.order_id == order.id).first()
    if delivery:
        delivery.status = status
        if status == "Out For Delivery":
            delivery.latitude = 17.9784 + (random.random() - 0.5) * 0.02
            delivery.longitude = 79.5941 + (random.random() - 0.5) * 0.02
            delivery.estimated_time = "12 mins"
        elif status == "Delivered":
            delivery.estimated_time = "Delivered"
            # Update payment status for Cash on Delivery
            if order.payment and order.payment.payment_method == "Cash on Delivery":
                order.payment.status = "Completed"
                
    db.commit()
    
    # Notify customer
    add_notification(
        db,
        order.customer.user_id,
        f"Order Status Update: {status}",
        f"Your order {order.order_number} status has been updated to '{status}'.",
        "general"
    )
    return {"success": True, "message": f"Status updated to {status}."}


@app.get("/api/farmer/analytics", response_model=dict)
def get_farmer_analytics(current_user: models.User = Depends(auth.require_role(["farmer"])), db: Session = Depends(get_db)):
    """Computes marketplace earnings analytics for the Farmer dashboard."""
    farmer = db.query(models.Farmer).filter(models.Farmer.user_id == current_user.id).first()
    
    # Total published products
    prod_count = db.query(models.MarketplaceProduct).filter(models.MarketplaceProduct.farmer_id == farmer.id).count()
    
    # Query order items
    items = db.query(models.OrderItem).join(models.Order).join(models.MarketplaceProduct).filter(
        models.MarketplaceProduct.farmer_id == farmer.id
    ).all()
    
    total_sales = 0.0
    completed_orders = 0
    pending_orders = 0
    total_items_sold = 0
    
    for item in items:
        total_items_sold += item.quantity
        if item.order.status == "Delivered":
            total_sales += item.price * item.quantity
            completed_orders += 1
        elif item.order.status in ["Order Placed", "Confirmed", "Packed", "Picked Up", "Out For Delivery"]:
            pending_orders += 1
            
    # Compute average rating
    avg_rating_row = db.query(func.avg(models.MarketplaceProduct.rating)).filter(
        models.MarketplaceProduct.farmer_id == farmer.id
    ).first()
    avg_rating = round(avg_rating_row[0], 1) if avg_rating_row and avg_rating_row[0] is not None else 5.0
    
    # Recent Sales trend data (Grouped by date)
    sales_data = []
    # Mocking sales charts trend logic for a beautiful dashboard
    today = datetime.datetime.utcnow().date()
    for d in range(6, -1, -1):
        day_date = today - datetime.timedelta(days=d)
        date_str = day_date.strftime("%b %d")
        
        # Calculate earnings for this day
        day_earnings = 0.0
        for item in items:
            if item.order.created_at.date() == day_date and item.order.status == "Delivered":
                day_earnings += item.price * item.quantity
                
        sales_data.append({"date": date_str, "earnings": day_earnings})
        
    return {
        "products_count": prod_count,
        "total_earnings": round(total_sales, 2),
        "items_sold": total_items_sold,
        "completed_orders": completed_orders,
        "pending_orders": pending_orders,
        "average_rating": avg_rating,
        "sales_trend": sales_data
    }


# -- Product Reviews APIs --

@app.post("/api/marketplace/products/{id}/reviews", response_model=schemas.ProductReviewResponse)
def add_product_review(
    id: int,
    payload: schemas.ProductReviewCreate,
    current_user: models.User = Depends(auth.require_role(["customer"])),
    db: Session = Depends(get_db)
):
    """Customer submits a review and rating for a marketplace product."""
    cust = db.query(models.Customer).filter(models.Customer.user_id == current_user.id).first()
    p = db.query(models.MarketplaceProduct).filter(models.MarketplaceProduct.id == id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found.")
        
    # Check if already reviewed
    exists = db.query(models.ProductReview).filter(
        models.ProductReview.product_id == id,
        models.ProductReview.customer_id == cust.id
    ).first()
    if exists:
        raise HTTPException(status_code=400, detail="You have already reviewed this product.")
        
    review = models.ProductReview(
        product_id=id,
        customer_id=cust.id,
        rating=payload.rating,
        comment=payload.comment
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    
    # Recalculate average rating of product
    avg_rating = db.query(func.avg(models.ProductReview.rating)).filter(
        models.ProductReview.product_id == id
    ).first()
    if avg_rating and avg_rating[0]:
        p.rating = round(avg_rating[0], 1)
        db.commit()
        
    res = schemas.ProductReviewResponse.from_orm(review)
    res.customer_name = current_user.name
    return res


@app.get("/api/marketplace/products/{id}/reviews", response_model=List[schemas.ProductReviewResponse])
def get_product_reviews(id: int, db: Session = Depends(get_db)):
    """Fetches all customer reviews of a product."""
    reviews = db.query(models.ProductReview).filter(models.ProductReview.product_id == id).order_by(models.ProductReview.created_at.desc()).all()
    
    results = []
    for r in reviews:
        item = schemas.ProductReviewResponse.from_orm(r)
        item.customer_name = r.customer.user.name
        results.append(item)
    return results
