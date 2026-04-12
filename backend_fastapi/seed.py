from datetime import timedelta

from core.security import get_password_hash
from db.models import (
    Base,
    Booking,
    BookingStatus,
    CaregiverProfile,
    ClientProfile,
    Message,
    QualityUpdate,
    Review,
    ServiceType,
    User,
    UserRole,
    VerificationStatus,
    get_now,
)
from db.session import SessionLocal, engine

DEFAULT_PASSWORD = "Password123!"


def get_or_create_user(db, *, email: str, full_name: str, phone: str, role: UserRole) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    user = User(
        email=email,
        passwordHash=get_password_hash(DEFAULT_PASSWORD),
        fullName=full_name,
        phone=phone,
        role=role,
    )
    db.add(user)
    db.flush()
    return user


def ensure_client_profile(db, user: User, *, address: str, about: str) -> ClientProfile:
    profile = db.query(ClientProfile).filter(ClientProfile.userId == user.id).first()
    if profile:
        return profile

    profile = ClientProfile(userId=user.id, address=address, about=about)
    db.add(profile)
    db.flush()
    return profile


def ensure_caregiver_profile(
    db,
    user: User,
    *,
    bio: str,
    experience_years: int,
    hourly_rate: int,
    categories: str,
    verification_status: VerificationStatus,
    id_card_url: str,
    diploma_url: str,
) -> CaregiverProfile:
    profile = db.query(CaregiverProfile).filter(CaregiverProfile.userId == user.id).first()
    if profile:
        return profile

    profile = CaregiverProfile(
        userId=user.id,
        bio=bio,
        experienceYears=experience_years,
        hourlyRate=hourly_rate,
        categories=categories,
        verificationStatus=verification_status,
        idCardUrl=id_card_url,
        diplomaUrl=diploma_url,
        verifiedAt=get_now() if verification_status == VerificationStatus.VERIFIED else None,
    )
    db.add(profile)
    db.flush()
    return profile


def get_or_create_booking(
    db,
    *,
    client: User,
    caregiver: User | None,
    service_type: ServiceType,
    status: BookingStatus,
    duration: int,
    price: int,
    tasks: list[str],
    notes: str,
    scheduled_at,
) -> Booking:
    existing = (
        db.query(Booking)
        .filter(
            Booking.clientId == client.id,
            Booking.serviceType == service_type,
            Booking.scheduledAt == scheduled_at,
        )
        .first()
    )
    if existing:
        return existing

    booking = Booking(
        clientId=client.id,
        caregiverId=caregiver.id if caregiver else None,
        serviceType=service_type,
        status=status,
        duration=duration,
        price=price,
        tasks=tasks,
        notes=notes,
        checklist=[],
        scheduledAt=scheduled_at,
    )
    db.add(booking)
    db.flush()
    return booking


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = get_or_create_user(
            db,
            email="admin@qamqorshy.kz",
            full_name="System Admin",
            phone="+77000000001",
            role=UserRole.ADMIN,
        )
        client_one = get_or_create_user(
            db,
            email="aida.client@qamqorshy.kz",
            full_name="Aida Sarsembayeva",
            phone="+77000000002",
            role=UserRole.CLIENT,
        )
        client_two = get_or_create_user(
            db,
            email="marat.client@qamqorshy.kz",
            full_name="Marat Kenzhebay",
            phone="+77000000003",
            role=UserRole.CLIENT,
        )
        caregiver_one = get_or_create_user(
            db,
            email="saltanat.caregiver@qamqorshy.kz",
            full_name="Saltanat Abdrakhmanova",
            phone="+77000000004",
            role=UserRole.CAREGIVER,
        )
        caregiver_two = get_or_create_user(
            db,
            email="dias.caregiver@qamqorshy.kz",
            full_name="Dias Akhmetov",
            phone="+77000000005",
            role=UserRole.CAREGIVER,
        )

        ensure_client_profile(
            db,
            client_one,
            address="Almaty, Dostyk Avenue 12",
            about="Need regular elderly care for my mother three evenings per week.",
        )
        ensure_client_profile(
            db,
            client_two,
            address="Astana, Mangilik El 45",
            about="Need help with after-school child care and evening routine.",
        )
        ensure_caregiver_profile(
            db,
            caregiver_one,
            bio="Certified elderly care specialist with nursing assistant background.",
            experience_years=6,
            hourly_rate=9000,
            categories="ELDER,CHILD",
            verification_status=VerificationStatus.VERIFIED,
            id_card_url="https://example.com/id/saltanat",
            diploma_url="https://example.com/diploma/saltanat",
        )
        ensure_caregiver_profile(
            db,
            caregiver_two,
            bio="Reliable pet and child caregiver with flexible schedule.",
            experience_years=4,
            hourly_rate=7500,
            categories="PET,CHILD",
            verification_status=VerificationStatus.PENDING,
            id_card_url="https://example.com/id/dias",
            diploma_url="https://example.com/diploma/dias",
        )

        now = get_now()
        completed_booking = get_or_create_booking(
            db,
            client=client_one,
            caregiver=caregiver_one,
            service_type=ServiceType.ELDER,
            status=BookingStatus.COMPLETED,
            duration=3,
            price=27000,
            tasks=["mealPrep", "medication", "companionship"],
            notes="Evening support and medication reminder.",
            scheduled_at=now - timedelta(days=4),
        )
        active_booking = get_or_create_booking(
            db,
            client=client_two,
            caregiver=caregiver_two,
            service_type=ServiceType.CHILD,
            status=BookingStatus.ACCEPTED,
            duration=4,
            price=30000,
            tasks=["walking", "mealPrep"],
            notes="Pick up from school and stay until 8 PM.",
            scheduled_at=now + timedelta(hours=6),
        )
        get_or_create_booking(
            db,
            client=client_one,
            caregiver=None,
            service_type=ServiceType.PET,
            status=BookingStatus.PENDING,
            duration=2,
            price=10000,
            tasks=["walking", "feeding"],
            notes="Walk and feed the dog in the afternoon.",
            scheduled_at=now + timedelta(days=1),
        )
        get_or_create_booking(
            db,
            client=client_two,
            caregiver=None,
            service_type=ServiceType.CHILD,
            status=BookingStatus.PENDING,
            duration=5,
            price=35000,
            tasks=["mealPrep", "companionship"],
            notes="Weekend babysitting request.",
            scheduled_at=now + timedelta(days=2),
        )

        if not db.query(Message).filter(Message.bookingId == active_booking.id).first():
            db.add_all(
                [
                    Message(
                        senderId=client_two.id,
                        receiverId=caregiver_two.id,
                        bookingId=active_booking.id,
                        body="Please call me when you are near the school.",
                    ),
                    Message(
                        senderId=caregiver_two.id,
                        receiverId=client_two.id,
                        bookingId=active_booking.id,
                        body="Understood. I will send an update 15 minutes before arrival.",
                    ),
                ]
            )

        if not db.query(QualityUpdate).filter(QualityUpdate.bookingId == active_booking.id).first():
            db.add(
                QualityUpdate(
                    bookingId=active_booking.id,
                    caregiverId=caregiver_two.id,
                    text="Child picked up from school and arrived home safely.",
                    checklist=["pickup_complete", "home_arrival"],
                )
            )

        if not db.query(Review).filter(Review.bookingId == completed_booking.id).first():
            db.add(
                Review(
                    bookingId=completed_booking.id,
                    authorId=client_one.id,
                    caregiverId=caregiver_one.id,
                    rating=5,
                    text="Very attentive and calm specialist. Everything was done on time.",
                )
            )

        db.commit()
        print('Seed completed successfully.')
        print('Demo credentials:')
        print('  admin@qamqorshy.kz / Password123!')
        print('  aida.client@qamqorshy.kz / Password123!')
        print('  saltanat.caregiver@qamqorshy.kz / Password123!')
    finally:
        db.close()


if __name__ == '__main__':
    seed()
