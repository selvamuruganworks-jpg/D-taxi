from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ("customer", "Customer"),
        ("driver", "Driver"),
        ("admin", "Admin"),
    ]
    name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=20, unique=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default="customer")
    created_at = models.DateTimeField(auto_now_add=True)

    # Log in using phone number instead of username
    USERNAME_FIELD = "phone"
    REQUIRED_FIELDS = ["username", "email"]

    def __str__(self):
        return f"{self.name or self.username} ({self.role})"

class RideCategory(models.Model):
    """
    Vehicle category (Mini, Sedan, SUV, Premium) with pricing rules.
    """
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=50, default="car")
    base_fare = models.FloatField(default=50)
    per_km_rate = models.FloatField(default=12)
    capacity = models.IntegerField(default=4)
    bags = models.IntegerField(default=2)
    eta_offset_min = models.IntegerField(default=2)

    def __str__(self):
        return self.name

class Driver(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="driver_profile")
    license_number = models.CharField(max_length=50)
    vehicle_name = models.CharField(max_length=100)
    vehicle_number = models.CharField(max_length=20)
    vehicle_type = models.CharField(max_length=50)  # Bike, Auto, Mini, Sedan, SUV
    vehicle_color = models.CharField(max_length=30)
    rating = models.FloatField(default=5.0)
    is_online = models.BooleanField(default=False)
    current_lat = models.FloatField(null=True, blank=True)
    current_lng = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"Driver: {self.user.name or self.user.phone} ({self.vehicle_number})"

class Ride(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("SEARCHING", "Searching"),
        ("ACCEPTED", "Accepted"),
        ("ARRIVED", "Arrived"),
        ("STARTED", "Started"),
        ("COMPLETED", "Completed"),
        ("CANCELLED", "Cancelled"),
    ]

    customer = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rides_as_customer")
    driver = models.ForeignKey(Driver, on_delete=models.SET_NULL, null=True, blank=True, related_name="rides_as_driver")
    pickup_address = models.CharField(max_length=255)
    destination_address = models.CharField(max_length=255)
    pickup_lat = models.FloatField()
    pickup_lng = models.FloatField()
    destination_lat = models.FloatField()
    destination_lng = models.FloatField()
    distance = models.FloatField(default=0.0)
    fare = models.FloatField(default=0.0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="PENDING")
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Ride {self.id}: {self.customer.phone} -> {self.status}"

class DriverLocation(models.Model):
    driver = models.ForeignKey(Driver, on_delete=models.CASCADE, related_name="locations")
    latitude = models.FloatField()
    longitude = models.FloatField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Loc {self.driver.id}: ({self.latitude}, {self.longitude})"
