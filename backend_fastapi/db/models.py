import uuid
import enum
from datetime import datetime, timezone
from sqlalchemy import Column, String, Integer, DateTime, Enum, ForeignKey, Boolean, JSON, text
from sqlalchemy.orm import relationship
from db.session import Base

class UserRole(str, enum.Enum):
    CLIENT = "CLIENT"
    CAREGIVER = "CAREGIVER"
    ADMIN = "ADMIN"

class ServiceType(str, enum.Enum):
    CHILD = "CHILD"
    PET = "PET"
    ELDER = "ELDER"

class BookingStatus(str, enum.Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    COMPLETED = "COMPLETED"
    CANCELED = "CANCELED"

class VerificationStatus(str, enum.Enum):
    UNVERIFIED = "UNVERIFIED"
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"

def generate_uuid():
    return str(uuid.uuid4())

def get_now():
    return datetime.now(timezone.utc)

class User(Base):
    __tablename__ = "users"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    passwordHash = Column(String, nullable=False)
    fullName = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    createdAt = Column(DateTime(timezone=True), default=get_now)
    updatedAt = Column(DateTime(timezone=True), default=get_now, onupdate=get_now)

    clientProfile = relationship("ClientProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    caregiver = relationship("CaregiverProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    sentMessages = relationship("Message", back_populates="sender", foreign_keys="Message.senderId", cascade="all, delete-orphan")
    recvMessages = relationship("Message", back_populates="receiver", foreign_keys="Message.receiverId", cascade="all, delete-orphan")
    clientBookings = relationship("Booking", back_populates="client", foreign_keys="Booking.clientId", cascade="all, delete-orphan")
    caregiverJobs = relationship("Booking", back_populates="caregiver", foreign_keys="Booking.caregiverId")
    writtenReviews = relationship("Review", back_populates="author", foreign_keys="Review.authorId", cascade="all, delete-orphan")
    receivedReviews = relationship("Review", back_populates="caregiver", foreign_keys="Review.caregiverId", cascade="all, delete-orphan")
    ignoredBookings = relationship("IgnoredBooking", back_populates="caregiver", cascade="all, delete-orphan")


class ClientProfile(Base):
    __tablename__ = "client_profiles"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    address = Column(String, nullable=True)
    about = Column(String, nullable=True)

    user = relationship("User", back_populates="clientProfile")
    recipients = relationship("CareRecipient", back_populates="clientProfile", cascade="all, delete-orphan")


class CaregiverProfile(Base):
    __tablename__ = "caregiver_profiles"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    userId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    bio = Column(String, nullable=True)
    experienceYears = Column(Integer, default=0)
    hourlyRate = Column(Integer, default=0)
    verificationStatus = Column(Enum(VerificationStatus), default=VerificationStatus.UNVERIFIED)
    categories = Column(String, default="")
    idCardUrl = Column(String, nullable=True)
    diplomaUrl = Column(String, nullable=True)
    verifiedAt = Column(DateTime(timezone=True), nullable=True)

    user = relationship("User", back_populates="caregiver")


class CareRecipient(Base):
    __tablename__ = "care_recipients"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    clientProfileId = Column(String(36), ForeignKey("client_profiles.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    serviceType = Column(Enum(ServiceType), nullable=False)
    age = Column(Integer, nullable=True)
    allergies = Column(String, nullable=True)
    medications = Column(String, nullable=True)
    emergencyContact = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), default=get_now)

    clientProfile = relationship("ClientProfile", back_populates="recipients")


class Booking(Base):
    __tablename__ = "bookings"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    clientId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    caregiverId = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    serviceType = Column(Enum(ServiceType), nullable=False)
    scheduledAt = Column(DateTime(timezone=True), nullable=False)
    duration = Column(Integer, default=1)
    tasks = Column(JSON, nullable=True)
    address = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    checklist = Column(JSON, nullable=True)
    price = Column(Integer, nullable=True)
    status = Column(Enum(BookingStatus), default=BookingStatus.PENDING)
    lastPriceProposedBy = Column(Enum(UserRole), nullable=True)
    priceProposedAt = Column(DateTime(timezone=True), nullable=True)
    createdAt = Column(DateTime(timezone=True), default=get_now)
    updatedAt = Column(DateTime(timezone=True), default=get_now, onupdate=get_now)

    client = relationship("User", back_populates="clientBookings", foreign_keys=[clientId])
    caregiver = relationship("User", back_populates="caregiverJobs", foreign_keys=[caregiverId])
    messages = relationship("Message", back_populates="booking")
    reviews = relationship("Review", back_populates="booking", cascade="all, delete-orphan")
    qualityUpdates = relationship("QualityUpdate", back_populates="booking", cascade="all, delete-orphan")
    ignoredBy = relationship("IgnoredBooking", back_populates="booking", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    senderId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    receiverId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    bookingId = Column(String(36), ForeignKey("bookings.id", ondelete="SET NULL"), nullable=True)
    body = Column(String, nullable=False)
    attachmentUrl = Column(String, nullable=True)
    attachmentMimeType = Column(String, nullable=True)
    createdAt = Column(DateTime(timezone=True), default=get_now)

    sender = relationship("User", back_populates="sentMessages", foreign_keys=[senderId])
    receiver = relationship("User", back_populates="recvMessages", foreign_keys=[receiverId])
    booking = relationship("Booking", back_populates="messages")


class Review(Base):
    __tablename__ = "reviews"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bookingId = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    authorId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    caregiverId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rating = Column(Integer, nullable=False)
    text = Column(String, nullable=False)
    createdAt = Column(DateTime(timezone=True), default=get_now)

    booking = relationship("Booking", back_populates="reviews")
    author = relationship("User", back_populates="writtenReviews", foreign_keys=[authorId])
    caregiver = relationship("User", back_populates="receivedReviews", foreign_keys=[caregiverId])


class QualityUpdate(Base):
    __tablename__ = "quality_updates"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bookingId = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    caregiverId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    text = Column(String, nullable=False)
    checklist = Column(JSON, nullable=True)
    createdAt = Column(DateTime(timezone=True), default=get_now)

    booking = relationship("Booking", back_populates="qualityUpdates")


class IgnoredBooking(Base):
    __tablename__ = "ignored_bookings"
    id = Column(String(36), primary_key=True, default=generate_uuid)
    bookingId = Column(String(36), ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    caregiverId = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    createdAt = Column(DateTime(timezone=True), default=get_now)

    booking = relationship("Booking", back_populates="ignoredBy")
    caregiver = relationship("User", back_populates="ignoredBookings")


