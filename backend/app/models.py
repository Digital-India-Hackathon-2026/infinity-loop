import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    phone = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # "farmer", "officer", "admin"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    farmer_profile = relationship("Farmer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    officer_profile = relationship("Officer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    admin_profile = relationship("Administrator", back_populates="user", uselist=False, cascade="all, delete-orphan")
    customer_profile = relationship("Customer", back_populates="user", uselist=False, cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user", cascade="all, delete-orphan")


class Farmer(Base):
    __tablename__ = "farmers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    land_area = Column(Float, nullable=False)  # in acres
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    mandal = Column(String, nullable=False)
    village = Column(String, nullable=False)
    language_preference = Column(String, default="en")  # "en", "te", "hi"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="farmer_profile")
    registrations = relationship("CropRegistration", back_populates="farmer", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="farmer", cascade="all, delete-orphan")
    marketplace_products = relationship("MarketplaceProduct", back_populates="farmer", cascade="all, delete-orphan")


class Officer(Base):
    __tablename__ = "officers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id", ondelete="SET NULL"), nullable=True)
    department = Column(String, nullable=False)
    badge_number = Column(String, unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="officer_profile")
    centre = relationship("ProcurementCentre", back_populates="officers")
    verifications = relationship("SampleVerification", back_populates="officer")
    procurements = relationship("Procurement", back_populates="officer")


class Administrator(Base):
    __tablename__ = "administrators"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    department = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="admin_profile")


class ProcurementCentre(Base):
    __tablename__ = "procurement_centres"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    district = Column(String, nullable=False)
    mandal = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    contact_number = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    officers = relationship("Officer", back_populates="centre")
    procurements = relationship("Procurement", back_populates="centre")


class CropRegistration(Base):
    __tablename__ = "crop_registrations"

    id = Column(Integer, primary_key=True, index=True)
    registration_number = Column(String, unique=True, index=True, nullable=False)  # F2G-PH-2026-XXXX
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String, nullable=False)
    crop_stage = Column(String, nullable=False)  # "Pre-Harvest", "Harvest Ready", "Harvested"
    expected_harvest_month = Column(String, nullable=False)
    expected_quantity = Column(Float, nullable=False)  # in quintals
    land_area = Column(Float, nullable=False)  # in acres
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    mandal = Column(String, nullable=False)
    village = Column(String, nullable=False)
    phone_number = Column(String, nullable=False)
    status = Column(String, default="Registered")  # "Registered", "Images Uploaded", "AI Reviewed", "Sample Requested", "Sample Verified", "Approved", "Slot Booked", "Procured", "Payment Initiated", "Payment Completed"
    rejection_reason = Column(String, nullable=True)
    
    # Harvested produce fields (nullable for pre-harvest compatibility)
    produce_category = Column(String, nullable=True)
    quantity_unit = Column(String, nullable=True)
    pin_code = Column(String, nullable=True)
    harvest_date = Column(String, nullable=True)
    produce_ready_status = Column(String, nullable=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farmer = relationship("Farmer", back_populates="registrations")
    images = relationship("ProduceImage", back_populates="registration", cascade="all, delete-orphan")
    ai_assessment = relationship("AIAssessment", back_populates="registration", uselist=False, cascade="all, delete-orphan")
    sample_verification = relationship("SampleVerification", back_populates="registration", uselist=False, cascade="all, delete-orphan")
    procurement = relationship("Procurement", back_populates="registration", uselist=False, cascade="all, delete-orphan")


class ProduceImage(Base):
    __tablename__ = "produce_images"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("crop_registrations.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(String, nullable=False)  # local file path or base64 data
    image_type = Column(String, nullable=False)  # "full_produce", "close_up", "storage_view"
    gps_latitude = Column(Float, nullable=False)
    gps_longitude = Column(Float, nullable=False)
    gps_location_name = Column(String, nullable=False)
    device_info = Column(String, nullable=False)
    image_source = Column(String, default="Live Camera")  # "Live Camera", "Local Upload"
    upload_time = Column(String, nullable=True)           # Separate upload timestamp
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    registration = relationship("CropRegistration", back_populates="images")


class AIAssessment(Base):
    __tablename__ = "ai_assessments"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("crop_registrations.id", ondelete="CASCADE"), nullable=False)
    crop_name = Column(String, nullable=False)
    confidence = Column(Float, nullable=False)
    visual_quality = Column(String, nullable=False)  # "Excellent", "Good", "Average", "Poor"
    grain_uniformity = Column(Float, nullable=False)  # percentage
    foreign_material = Column(Float, nullable=False)  # percentage
    estimated_moisture = Column(Float, nullable=False)  # percentage
    score = Column(Float, nullable=False)  # overall score out of 100
    recommendation = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    registration = relationship("CropRegistration", back_populates="ai_assessment")


class SampleVerification(Base):
    __tablename__ = "sample_verifications"

    id = Column(Integer, primary_key=True, index=True)
    registration_id = Column(Integer, ForeignKey("crop_registrations.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(Integer, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)
    moisture = Column(Float, nullable=False)  # percentage
    foreign_matter = Column(Float, nullable=False)  # percentage
    grain_quality = Column(String, nullable=False)  # "A Grade", "B Grade", "Common", "Rejected"
    remarks = Column(Text, nullable=True)
    status = Column(String, nullable=False)  # "Approved", "Rejected", "Need Reinspection"
    
    # New slot requesting fields
    verification_centre = Column(String, nullable=True)
    verification_date = Column(String, nullable=True)
    verification_time = Column(String, nullable=True)
    sample_instructions = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    registration = relationship("CropRegistration", back_populates="sample_verification")
    officer = relationship("Officer", back_populates="verifications")


class ProcurementSlot(Base):
    __tablename__ = "procurement_slots"

    id = Column(Integer, primary_key=True, index=True)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id", ondelete="CASCADE"), nullable=False)
    slot_date = Column(String, nullable=False)  # YYYY-MM-DD
    slot_time = Column(String, nullable=False)  # e.g., "10:00 AM", "12:00 PM", "02:00 PM"
    capacity = Column(Integer, default=5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    centre = relationship("ProcurementCentre")


class Procurement(Base):
    __tablename__ = "procurements"

    id = Column(Integer, primary_key=True, index=True)
    procurement_number = Column(String, unique=True, index=True, nullable=False)  # F2G-PR-2026-XXXX
    registration_id = Column(Integer, ForeignKey("crop_registrations.id", ondelete="CASCADE"), nullable=False)
    officer_id = Column(Integer, ForeignKey("officers.id", ondelete="SET NULL"), nullable=True)
    centre_id = Column(Integer, ForeignKey("procurement_centres.id", ondelete="SET NULL"), nullable=True)
    declared_quantity = Column(Float, nullable=False)  # in quintals
    actual_quantity = Column(Float, nullable=False)  # in quintals
    accepted_quantity = Column(Float, nullable=False)  # in quintals
    msp_rate = Column(Float, nullable=False)  # in Rs. per quintal
    total_amount = Column(Float, nullable=False)  # in Rs.
    slot_date = Column(String, nullable=False)  # YYYY-MM-DD
    slot_time = Column(String, nullable=False)  # "10:00 AM", "12:00 PM", "2:00 PM", "4:00 PM"
    status = Column(String, default="Booked")  # "Booked", "Completed"
    digital_receipt_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    registration = relationship("CropRegistration", back_populates="procurement")
    officer = relationship("Officer", back_populates="procurements")
    centre = relationship("ProcurementCentre", back_populates="procurements")
    payment = relationship("Payment", back_populates="procurement", uselist=False, cascade="all, delete-orphan")


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    procurement_id = Column(Integer, ForeignKey("procurements.id", ondelete="CASCADE"), nullable=False)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    status = Column(String, default="Pending")  # "Pending", "Initiated", "Processing", "Completed"
    transaction_reference = Column(String, unique=True, index=True, nullable=True)
    payment_date = Column(DateTime, nullable=True)
    expected_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    procurement = relationship("Procurement", back_populates="payment")
    farmer = relationship("Farmer", back_populates="payments")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    type = Column(String, default="general")  # "general", "ai_report", "harvest_reminder", "payment", "slot"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class MSPRate(Base):
    __tablename__ = "msp_rates"

    id = Column(Integer, primary_key=True, index=True)
    crop_name = Column(String, unique=True, index=True, nullable=False)
    msp_rate = Column(Float, nullable=False)  # in Rs. per quintal
    expected_market_price = Column(Float, nullable=False)
    government_notification_url = Column(String, nullable=True)
    year = Column(String, default="2026-27")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    action = Column(String, nullable=False)
    ip_address = Column(String, nullable=True)
    details = Column(Text, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="audit_logs")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(String, unique=True, index=True, nullable=False)
    address = Column(String, nullable=False)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    pincode = Column(String, nullable=False)
    profile_photo = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="customer_profile")
    cart = relationship("Cart", back_populates="customer", uselist=False, cascade="all, delete-orphan")
    wishlists = relationship("Wishlist", back_populates="customer", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer", cascade="all, delete-orphan")
    reviews = relationship("ProductReview", back_populates="customer", cascade="all, delete-orphan")


class MarketplaceProduct(Base):
    __tablename__ = "marketplace_products"

    id = Column(Integer, primary_key=True, index=True)
    farmer_id = Column(Integer, ForeignKey("farmers.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    original_price = Column(Float, nullable=False)
    discount = Column(Float, default=0.0)
    stock = Column(Float, nullable=False)
    unit = Column(String, default="kg")
    rating = Column(Float, default=5.0)
    image_url = Column(String, nullable=True)
    harvest_date = Column(String, nullable=True)
    freshness_badge = Column(String, default="Fresh")
    organic_badge = Column(Boolean, default=False)
    government_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    farmer = relationship("Farmer", back_populates="marketplace_products")
    cart_items = relationship("CartItem", back_populates="product", cascade="all, delete-orphan")
    wishlist_items = relationship("Wishlist", back_populates="product", cascade="all, delete-orphan")
    order_items = relationship("OrderItem", back_populates="product")
    reviews = relationship("ProductReview", back_populates="product", cascade="all, delete-orphan")


class Cart(Base):
    __tablename__ = "carts"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="cart")
    items = relationship("CartItem", back_populates="cart", cascade="all, delete-orphan")


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    cart_id = Column(Integer, ForeignKey("carts.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("marketplace_products.id", ondelete="CASCADE"), nullable=False)
    quantity = Column(Float, default=1.0)

    cart = relationship("Cart", back_populates="items")
    product = relationship("MarketplaceProduct", back_populates="cart_items")


class Wishlist(Base):
    __tablename__ = "wishlists"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("marketplace_products.id", ondelete="CASCADE"), nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="wishlists")
    product = relationship("MarketplaceProduct", back_populates="wishlist_items")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String, unique=True, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    total_price = Column(Float, nullable=False)
    delivery_charges = Column(Float, default=0.0)
    tax = Column(Float, default=0.0)
    grand_total = Column(Float, nullable=False)
    shipping_address = Column(Text, nullable=False)
    coupon_code = Column(String, nullable=True)
    status = Column(String, default="Order Placed")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    customer = relationship("Customer", back_populates="orders")
    items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")
    payment = relationship("MarketplacePayment", back_populates="order", uselist=False, cascade="all, delete-orphan")
    delivery = relationship("Delivery", back_populates="order", uselist=False, cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("marketplace_products.id", ondelete="SET NULL"), nullable=True)
    product_name = Column(String, nullable=False)
    price = Column(Float, nullable=False)
    quantity = Column(Float, nullable=False)

    order = relationship("Order", back_populates="items")
    product = relationship("MarketplaceProduct", back_populates="order_items")


class MarketplacePayment(Base):
    __tablename__ = "marketplace_payments"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String, nullable=False) # "UPI", "Credit Card", "Debit Card", "Net Banking", "Cash on Delivery"
    status = Column(String, default="Completed")
    transaction_reference = Column(String, unique=True, index=True, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="payment")


class Delivery(Base):
    __tablename__ = "deliveries"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id", ondelete="CASCADE"), nullable=False)
    delivery_agent = Column(String, default="Rajesh Kumar")
    delivery_phone = Column(String, default="9876543210")
    estimated_time = Column(String, default="35 mins")
    status = Column(String, default="Order Placed")
    latitude = Column(Float, default=17.9784)
    longitude = Column(Float, default=79.5941)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    order = relationship("Order", back_populates="delivery")


class ProductReview(Base):
    __tablename__ = "product_reviews"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("marketplace_products.id", ondelete="CASCADE"), nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    product = relationship("MarketplaceProduct", back_populates="reviews")
    customer = relationship("Customer", back_populates="reviews")


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    discount_amount = Column(Float, nullable=False)
    min_purchase = Column(Float, default=0.0)
    active = Column(Boolean, default=True)
