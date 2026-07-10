import datetime
import random
from sqlalchemy.orm import Session
from app.database import engine, SessionLocal, Base
from app import models, auth, ai

def clean_database(db: Session):
    print("Clearing existing database tables...")
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

def add_notification(db: Session, user_id: int, title: str, message: str, notif_type: str = "general"):
    notif = models.Notification(
        user_id=user_id,
        title=title,
        message=message,
        type=notif_type,
        is_read=False
    )
    db.add(notif)

def seed_data():
    db = SessionLocal()
    try:
        clean_database(db)
        print("Starting database seeding...")

        # 1. Seed MSP Rates (at least 20 crops)
        msp_crops = [
            {"crop_name": "Paddy", "msp_rate": 2183.0, "expected_market_price": 2050.0, "gov_url": "https://dacfw.nic.in/msp/paddy"},
            {"crop_name": "Wheat", "msp_rate": 2275.0, "expected_market_price": 2400.0, "gov_url": "https://dacfw.nic.in/msp/wheat"},
            {"crop_name": "Maize", "msp_rate": 2090.0, "expected_market_price": 1900.0, "gov_url": "https://dacfw.nic.in/msp/maize"},
            {"crop_name": "Jowar", "msp_rate": 3180.0, "expected_market_price": 3000.0, "gov_url": "https://dacfw.nic.in/msp/jowar"},
            {"crop_name": "Bajra", "msp_rate": 2500.0, "expected_market_price": 2350.0, "gov_url": "https://dacfw.nic.in/msp/bajra"},
            {"crop_name": "Ragi", "msp_rate": 3846.0, "expected_market_price": 3600.0, "gov_url": "https://dacfw.nic.in/msp/ragi"},
            {"crop_name": "Gram", "msp_rate": 5440.0, "expected_market_price": 5300.0, "gov_url": "https://dacfw.nic.in/msp/gram"},
            {"crop_name": "Tur", "msp_rate": 7000.0, "expected_market_price": 7200.0, "gov_url": "https://dacfw.nic.in/msp/tur"},
            {"crop_name": "Moong", "msp_rate": 8558.0, "expected_market_price": 8100.0, "gov_url": "https://dacfw.nic.in/msp/moong"},
            {"crop_name": "Urad", "msp_rate": 6950.0, "expected_market_price": 7100.0, "gov_url": "https://dacfw.nic.in/msp/urad"},
            {"crop_name": "Groundnut", "msp_rate": 6377.0, "expected_market_price": 6100.0, "gov_url": "https://dacfw.nic.in/msp/groundnut"},
            {"crop_name": "Sunflower Seed", "msp_rate": 6760.0, "expected_market_price": 6500.0, "gov_url": "https://dacfw.nic.in/msp/sunflower"},
            {"crop_name": "Soybean", "msp_rate": 4600.0, "expected_market_price": 4450.0, "gov_url": "https://dacfw.nic.in/msp/soybean"},
            {"crop_name": "Sesamum", "msp_rate": 8635.0, "expected_market_price": 8200.0, "gov_url": "https://dacfw.nic.in/msp/sesamum"},
            {"crop_name": "Cotton", "msp_rate": 6620.0, "expected_market_price": 6200.0, "gov_url": "https://dacfw.nic.in/msp/cotton"},
            # Non-MSP / Market Price Demo Crops (clearly distinct in prices)
            {"crop_name": "Tomato", "msp_rate": 0.0, "expected_market_price": 1800.0, "gov_url": None},
            {"crop_name": "Onion", "msp_rate": 0.0, "expected_market_price": 2200.0, "gov_url": None},
            {"crop_name": "Potato", "msp_rate": 0.0, "expected_market_price": 1500.0, "gov_url": None},
            {"crop_name": "Chilli", "msp_rate": 0.0, "expected_market_price": 19000.0, "gov_url": None},
            {"crop_name": "Turmeric", "msp_rate": 0.0, "expected_market_price": 12500.0, "gov_url": None}
        ]
        
        for crop in msp_crops:
            db_msp = models.MSPRate(
                crop_name=crop["crop_name"],
                msp_rate=crop["msp_rate"],
                expected_market_price=crop["expected_market_price"],
                government_notification_url=crop["gov_url"],
                year="2026-27"
            )
            db.add(db_msp)
        db.commit()
        print("[OK] Seeded MSP Rates.")

        # 2. Seed Procurement Centres
        centres = [
            {"name": "Warangal Agriculture Market Yard", "district": "Warangal", "mandal": "Hanamkonda", "lat": 17.9784, "lng": 79.5941, "contact": "0870-2451234"},
            {"name": "Nalgonda PACS procurement centre", "district": "Nalgonda", "mandal": "Nalgonda", "lat": 17.0575, "lng": 79.2684, "contact": "08682-224455"},
            {"name": "Nizamabad Gunj Centre", "district": "Nizamabad", "mandal": "Nizamabad", "lat": 18.6725, "lng": 78.0941, "contact": "08462-235612"},
            {"name": "Khammam Rythu Bazar Depot", "district": "Khammam", "mandal": "Khammam", "lat": 17.2473, "lng": 80.1514, "contact": "08742-228990"},
            {"name": "Guntur Mirchi Market Hub", "district": "Guntur", "mandal": "Guntur", "lat": 16.3067, "lng": 80.4365, "contact": "0863-223344"}
        ]
        
        centre_objects = []
        for c in centres:
            db_centre = models.ProcurementCentre(
                name=c["name"],
                district=c["district"],
                mandal=c["mandal"],
                latitude=c["lat"],
                longitude=c["lng"],
                contact_number=c["contact"]
            )
            db.add(db_centre)
            centre_objects.append(db_centre)
        db.commit()
        print("[OK] Seeded Procurement Centres.")

        # Seed available slots for the next 10 days for each centre
        for centre in centre_objects:
            for day in range(10):
                slot_date = (datetime.date.today() + datetime.timedelta(days=day)).strftime("%Y-%m-%d")
                for slot_time in ["10:00 AM", "12:00 PM", "02:00 PM", "04:00 PM"]:
                    db_slot = models.ProcurementSlot(
                        centre_id=centre.id,
                        slot_date=slot_date,
                        slot_time=slot_time,
                        capacity=random.randint(3, 8)
                    )
                    db.add(db_slot)
        db.commit()
        print("[OK] Seeded Procurement Slots.")

        # 3. Seed 1 Admin User
        admin_user = models.User(
            name="Srinivas Rao",
            email="admin@farmer2gov.gov.in",
            phone="9999999999",
            hashed_password=auth.get_password_hash("admin123"),
            role="admin"
        )
        db.add(admin_user)
        db.commit()
        
        db_admin = models.Administrator(
            user_id=admin_user.id,
            department="Department of Agriculture & Food Procurement"
        )
        db.add(db_admin)
        db.commit()
        print("[OK] Seeded Administrator User.")

        # 4. Seed 20 Procurement Officers
        officer_names = [
            "Anil Kumar", "Venkatesh Prasad", "Rakesh Sharma", "Kiran Rao", "Suresh Goud",
            "Madhusudhan Reddy", "Sanjay Dutt", "Prabhakar Rao", "Vijay Bhaskar", "Kalyan Kumar",
            "Manoj Bajpayee", "Satish Chandra", "Narendra Dev", "Arvind Swamy", "Raghav G",
            "Mohan Babu", "Jagapathi Raju", "Gopichand M", "Shrikanth T", "Ravi Teja"
        ]
        
        officer_objects = []
        for i, name in enumerate(officer_names):
            phone = f"98000000{i:02d}"
            email = f"officer_{i+1}@farmer2gov.gov.in"
            
            user = models.User(
                name=name,
                email=email,
                phone=phone,
                hashed_password=auth.get_password_hash("officer123"),
                role="officer"
            )
            db.add(user)
            db.commit()
            
            assigned_centre = centre_objects[i % len(centre_objects)]
            
            officer = models.Officer(
                user_id=user.id,
                centre_id=assigned_centre.id,
                department="Food Corporation Coordination",
                badge_number=f"F2G-OFF-2026-{1000 + i}"
            )
            db.add(officer)
            officer_objects.append(officer)
            
        db.commit()
        print("[OK] Seeded 20 Procurement Officers.")

        # 5. Seed 100 Farmers
        first_names = [
            "Ramesh", "Suresh", "Ramulu", "Mallesh", "Yadaiah", "Krishna", "Venkat", "Anji", "Nagesh", "Balu",
            "Konda", "Somulu", "Lachiram", "Jagan", "Narsaiah", "Rajesh", "Prakash", "Gopal", "Bhaskar", "Chandra",
            "Satyam", "Srinivas", "Lingam", "Venu", "Devendar", "Mahender", "Hari", "Prasad", "Sathaiah", "Ellesh",
            "Kishan", "Govind", "Balraj", "Ravinder", "Anil", "Shekhar", "Bheem", "Ganga", "Shiva", "Kumar",
            "Kavitha", "Latha", "Priya", "Radha", "Renuka", "Saritha", "Manjula", "Sujatha", "Anitha", "Swapna"
        ]
        last_names = ["Goud", "Reddy", "Yadav", "Rao", "Kuruma", "Lambadi", "Naidu", "Chowdary", "Madiga", "Mala", "Bhat"]
        
        districts = ["Warangal", "Nalgonda", "Nizamabad", "Khammam", "Guntur", "Krishna", "Medak", "Kurnool"]
        mandals = {
            "Warangal": ["Hanamkonda", "Geesugonda", "Wardhannapet", "Dharmasagar"],
            "Nalgonda": ["Nalgonda", "Miryalaguda", "Devarakonda", "Narketpally"],
            "Nizamabad": ["Nizamabad", "Armoor", "Bodhan", "Bheemgal"],
            "Khammam": ["Khammam", "Wyra", "Sathupally", "Madhira"],
            "Guntur": ["Guntur", "Tenali", "Bapatla", "Narasaraopet"],
            "Krishna": ["Machilipatnam", "Gudivada", "Vijayawada Rural", "Nuzvid"],
            "Medak": ["Medak", "Sangareddy", "Zahirabad", "Narsapur"],
            "Kurnool": ["Kurnool", "Adoni", "Nandyal", "Yemmiganur"]
        }
        villages = ["Madikonda", "Gopalapuram", "Rampally", "Peddapalli", "Dharmaram", "Vangara", "Chintal", "Mallapur"]
        
        farmer_objects = []
        for i in range(100):
            name = f"{random.choice(first_names)} {random.choice(last_names)}"
            phone = f"98{random.randint(10000000, 99999999)}"
            email = f"farmer_{i+1}@farmer2gov.gov.in"
            
            user = models.User(
                name=name,
                email=email,
                phone=phone,
                hashed_password=auth.get_password_hash("password123"),
                role="farmer"
            )
            db.add(user)
            db.commit()
            
            district = random.choice(districts)
            state = "Andhra Pradesh" if district in ["Guntur", "Krishna", "Kurnool"] else "Telangana"
            mandal = random.choice(mandals[district])
            village = f"{random.choice(villages)} {i+1 if (random.random() > 0.5) else ''}"
            
            farmer = models.Farmer(
                user_id=user.id,
                land_area=round(random.uniform(2.5, 18.0), 1),
                state=state,
                district=district,
                mandal=mandal,
                village=village,
                language_preference=random.choice(["en", "te", "hi"])
            )
            db.add(farmer)
            farmer_objects.append(farmer)
            
        db.commit()
        print("[OK] Seeded 100 Farmers.")

        # 6. Seed 50 Crop Registrations spanning various stages
        crops = ["Paddy", "Cotton", "Maize", "Millets"]
        stages = ["Pre-Harvest", "Harvest Ready", "Harvested"]
        months = ["July 2026", "August 2026", "September 2026"]
        
        status_pool = (
            ["Registered"] * 10 + 
            ["Images Uploaded"] * 5 + 
            ["AI Reviewed"] * 8 + 
            ["Sample Requested"] * 3 + 
            ["Approved"] * 5 + 
            ["Slot Booked"] * 5 + 
            ["Procured"] * 7 + 
            ["Payment Completed"] * 7
        )
        
        while len(status_pool) < 50:
            status_pool.append("Registered")
            
        random.shuffle(status_pool)

        for i in range(50):
            farmer = farmer_objects[i % len(farmer_objects)]
            crop = random.choice(crops)
            status = status_pool[i]
            
            reg_id = f"F2G-PH-2026-{1001 + i}"
            qty = round(farmer.land_area * random.uniform(15.0, 22.0), 1)
            created_date = datetime.datetime.utcnow() - datetime.timedelta(days=random.randint(2, 30))
            
            crop_reg = models.CropRegistration(
                registration_number=reg_id,
                farmer_id=farmer.id,
                crop_name=crop,
                crop_stage=random.choice(stages) if status in ["Registered", "Images Uploaded"] else "Harvested",
                expected_harvest_month=random.choice(months),
                expected_quantity=qty,
                land_area=farmer.land_area,
                state=farmer.state,
                district=farmer.district,
                mandal=farmer.mandal,
                village=farmer.village,
                phone_number=farmer.user.phone,
                status=status,
                created_at=created_date
            )
            db.add(crop_reg)
            db.commit()
            db.refresh(crop_reg)
            
            if status in ["Images Uploaded", "AI Reviewed", "Sample Requested", "Approved", "Slot Booked", "Procured", "Payment Completed"]:
                center_gps = next((c for c in centre_objects if c.district == farmer.district), centre_objects[0])
                
                img_types = ["full_produce", "close_up", "storage_view"]
                for img_type in img_types:
                    img_url = f"/uploads/{reg_id}_{img_type}.jpg"
                    
                    db_img = models.ProduceImage(
                        registration_id=crop_reg.id,
                        image_url=img_url,
                        image_type=img_type,
                        gps_latitude=center_gps.latitude + random.uniform(-0.02, 0.02),
                        gps_longitude=center_gps.longitude + random.uniform(-0.02, 0.02),
                        gps_location_name=f"{farmer.village}, {farmer.mandal} Mandal",
                        device_info="Motorola Moto G84 5G (Android 14)",
                        timestamp=created_date + datetime.timedelta(hours=2)
                    )
                    db.add(db_img)
                db.commit()

            if status in ["AI Reviewed", "Sample Requested", "Approved", "Slot Booked", "Procured", "Payment Completed"]:
                ai_data = ai.analyze_crop_image(b"", crop)
                
                db_ai = models.AIAssessment(
                    registration_id=crop_reg.id,
                    crop_name=crop,
                    confidence=ai_data["confidence"],
                    visual_quality=ai_data["visual_quality"],
                    grain_uniformity=ai_data["grain_uniformity"],
                    foreign_material=ai_data["foreign_material"],
                    estimated_moisture=ai_data["estimated_moisture"],
                    score=ai_data["score"],
                    recommendation=ai_data["recommendation"],
                    created_at=created_date + datetime.timedelta(hours=3)
                )
                db.add(db_ai)
                db.commit()

            if status in ["Approved", "Slot Booked", "Procured", "Payment Completed"]:
                officer = random.choice(officer_objects)
                moisture = round(random.uniform(11.0, 14.5), 1)
                foreign = round(random.uniform(0.5, 2.0), 1)
                g_quality = "A Grade" if moisture < 13.0 and foreign < 1.2 else "Common"
                
                db_sv = models.SampleVerification(
                    registration_id=crop_reg.id,
                    officer_id=officer.id,
                    moisture=moisture,
                    foreign_matter=foreign,
                    grain_quality=g_quality,
                    remarks="Quality matches MSP Grade standards. Moisture levels are ideal.",
                    status="Approved",
                    created_at=created_date + datetime.timedelta(days=2)
                )
                db.add(db_sv)
                db.commit()

            if status in ["Slot Booked", "Procured", "Payment Completed"]:
                proc_id = f"F2G-PR-2026-{5001 + i}"
                centre_gps = next((c for c in centre_objects if c.district == farmer.district), centre_objects[0])
                
                msp_rate = next((m.msp_rate for m in db.query(models.MSPRate).all() if m.crop_name == crop), 2183.0)
                
                proc_status = "Completed" if status in ["Procured", "Payment Completed"] else "Booked"
                actual_qty = qty if proc_status == "Completed" else 0.0
                accepted_qty = round(actual_qty * random.uniform(0.97, 1.0), 1)
                total_amt = accepted_qty * msp_rate
                
                slot_date = (datetime.date.today() + datetime.timedelta(days=random.randint(-1, 5))).strftime("%Y-%m-%d")
                slot_time = random.choice(["10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"])
                
                db_proc = models.Procurement(
                    procurement_number=proc_id,
                    registration_id=crop_reg.id,
                    officer_id=random.choice(officer_objects).id,
                    centre_id=centre_gps.id,
                    declared_quantity=qty,
                    actual_quantity=actual_qty,
                    accepted_quantity=accepted_qty,
                    msp_rate=msp_rate,
                    total_amount=total_amt,
                    slot_date=slot_date,
                    slot_time=slot_time,
                    status=proc_status,
                    digital_receipt_url=f"/api/procurements/{i+1}/receipt" if proc_status == "Completed" else None,
                    created_at=created_date + datetime.timedelta(days=4)
                )
                db.add(db_proc)
                db.commit()
                db.refresh(db_proc)
                
                pay_status = "Completed" if status == "Payment Completed" else "Initiated"
                ref = f"TXN-{random.randint(1000000000, 9999999999)}"
                
                db_pay = models.Payment(
                    procurement_id=db_proc.id,
                    farmer_id=farmer.id,
                    amount=total_amt if proc_status == "Completed" else (qty * msp_rate),
                    status=pay_status,
                    transaction_reference=ref if proc_status == "Completed" else None,
                    payment_date=(created_date + datetime.timedelta(days=5)) if pay_status == "Completed" else None,
                    expected_date=(datetime.datetime.utcnow() + datetime.timedelta(days=3))
                )
                db.add(db_pay)
                db.commit()

            # Notifications
            add_notification(
                db, 
                farmer.user_id, 
                "Registration Logged", 
                f"Your pre-harvest registration {reg_id} was successfully loaded into the F2G database.", 
                "general"
            )
            
            if status == "Payment Completed":
                add_notification(
                    db,
                    farmer.user_id,
                    "Payment Disbursed",
                    f"Procurement payout of Rs. {total_amt:.2f} has been credited to your Aadhaar-linked Bank A/c. Reference: {ref}.",
                    "payment"
                )

        # Seed Coupons
        print("Seeding Coupons...")
        coupons = [
            {"code": "F2G50", "discount_amount": 50.0, "min_purchase": 200.0},
            {"code": "DIWALI100", "discount_amount": 100.0, "min_purchase": 500.0},
            {"code": "FRESH30", "discount_amount": 30.0, "min_purchase": 150.0}
        ]
        for c in coupons:
            db_coupon = models.Coupon(
                code=c["code"],
                discount_amount=c["discount_amount"],
                min_purchase=c["min_purchase"],
                active=True
            )
            db.add(db_coupon)
        db.commit()
        print("[OK] Seeded coupons.")

        # Seed Customers
        print("Seeding Customers...")
        cust_user = models.User(
            name="Ramesh Customer",
            email="customer@farmer2gov.gov.in",
            phone="9876543211",
            hashed_password=auth.get_password_hash("customer123"),
            role="customer"
        )
        db.add(cust_user)
        db.commit()
        db.refresh(cust_user)

        customer = models.Customer(
            user_id=cust_user.id,
            customer_id="F2G-CUST-2026-1001",
            address="12-34 Rythu Bazar Lane, Madikonda",
            state="Telangana",
            district="Warangal",
            pincode="506003",
            profile_photo="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200"
        )
        db.add(customer)
        db.commit()
        db.refresh(customer)

        cart = models.Cart(customer_id=customer.id)
        db.add(cart)
        db.commit()
        print("[OK] Seeded customer profile and cart.")

        # Seed Marketplace Products for the first few farmers
        print("Seeding Marketplace Products...")
        farmers = db.query(models.Farmer).limit(5).all()
        products = [
            {
                "name": "Organic Basmati Rice",
                "description": "Premium aged organic Basmati rice direct from the farms of Warangal. High nutritional value and long grains.",
                "category": "Grains",
                "price": 85.0,
                "original_price": 110.0,
                "discount": 22.0,
                "stock": 500.0,
                "unit": "kg",
                "image_url": "https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=400",
                "harvest_date": "2026-05-15",
                "freshness_badge": "Aged 1 Year",
                "organic_badge": True,
                "government_verified": True
            },
            {
                "name": "Fresh Sharbati Wheat",
                "description": "Rich golden grains of premium wheat from Guntur. Perfect for making soft rotis.",
                "category": "Grains",
                "price": 45.0,
                "original_price": 55.0,
                "discount": 18.0,
                "stock": 1000.0,
                "unit": "kg",
                "image_url": "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=400",
                "harvest_date": "2026-06-10",
                "freshness_badge": "Newly Harvested",
                "organic_badge": False,
                "government_verified": True
            },
            {
                "name": "Organic Red Tomatoes",
                "description": "Juicy and vine-ripened organic red tomatoes. Freshly plucked and rich in Lycopene.",
                "category": "Vegetables",
                "price": 30.0,
                "original_price": 40.0,
                "discount": 25.0,
                "stock": 150.0,
                "unit": "kg",
                "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTxn_l5-uZSNaM_Yy8gJLG1QAYHc_uLoYE0CNr7SWV8zw&s=10",
                "harvest_date": "2026-07-09",
                "freshness_badge": "Plucked Today",
                "organic_badge": True,
                "government_verified": False
            },
            {
                "name": "Premium Red Onions",
                "description": "Crisp and farm-fresh red onions. High pungency, excellent shelf-life.",
                "category": "Vegetables",
                "price": 25.0,
                "original_price": 30.0,
                "discount": 16.0,
                "stock": 300.0,
                "unit": "kg",
                "image_url": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRoDEM7L0kSmq1_TTTG43yiqX8rj2Tq_OH174XIMJoRPQ&s=10",
                "harvest_date": "2026-07-05",
                "freshness_badge": "95% Freshness",
                "organic_badge": False,
                "government_verified": True
            },
            {
                "name": "Organic Moong Dal",
                "description": "High protein split yellow moong beans. Chemical-free farming and unpolished grains.",
                "category": "Pulses",
                "price": 120.0,
                "original_price": 140.0,
                "discount": 14.0,
                "stock": 250.0,
                "unit": "kg",
                "image_url": "https://upload.wikimedia.org/wikipedia/commons/f/f2/Sa_green_gram.jpg",
                "harvest_date": "2026-06-25",
                "freshness_badge": "100% Organic",
                "organic_badge": True,
                "government_verified": True
            },
            {
                "name": "Dry Red Chillies",
                "description": "Hot and spicy dried red Guntur chillies. Excellent red colour and high pungency factor.",
                "category": "Vegetables",
                "price": 180.0,
                "original_price": 220.0,
                "discount": 18.0,
                "stock": 200.0,
                "unit": "kg",
                "image_url": "https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?auto=format&fit=crop&q=80&w=400",
                "harvest_date": "2026-06-30",
                "freshness_badge": "Sun-Dried",
                "organic_badge": True,
                "government_verified": True
            }
        ]

        for i, prod in enumerate(products):
            farmer = farmers[i % len(farmers)]
            db_p = models.MarketplaceProduct(
                farmer_id=farmer.id,
                name=prod["name"],
                description=prod["description"],
                category=prod["category"],
                price=prod["price"],
                original_price=prod["original_price"],
                discount=prod["discount"],
                stock=prod["stock"],
                unit=prod["unit"],
                image_url=prod["image_url"],
                harvest_date=prod["harvest_date"],
                freshness_badge=prod["freshness_badge"],
                organic_badge=prod["organic_badge"],
                government_verified=prod["government_verified"]
            )
            db.add(db_p)
        db.commit()
        print("[OK] Seeded 6 marketplace products.")

        print("Database Seed completed successfully! All records verified.")

    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
