from django.db import models
try:
    from django.db.models import JSONField  # Django 3.1+
except ImportError:
    from django.contrib.postgres.fields import JSONField  # Django <3.1


class RideCategory(models.Model):
    """
    Vehicle category (Mini, Sedan, SUV, Premium) with pricing rules.
    """
    name = models.CharField(max_length=50)
    icon = models.CharField(max_length=50, default="car")  # icon key for frontend
    base_fare = models.FloatField(default=50)
    per_km_rate = models.FloatField(default=12)
    capacity = models.IntegerField(default=4)
    bags = models.IntegerField(default=2)
    eta_offset_min = models.IntegerField(default=2)  # extra minutes shown as "arriving in"

    def __str__(self):
        return self.name


class RideRequest(models.Model):
    """
    Stores a ride booking request along with computed route info.
    """
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("confirmed", "Confirmed"),
        ("on_trip", "On Trip"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    ]

    pickup_address = models.CharField(max_length=255)
    drop_address = models.CharField(max_length=255)

    pickup_lat = models.FloatField()
    pickup_lon = models.FloatField()
    drop_lat = models.FloatField()
    drop_lon = models.FloatField()

    category = models.ForeignKey(
        RideCategory, on_delete=models.SET_NULL, null=True, blank=True
    )

    distance_km = models.FloatField(null=True, blank=True)
    duration_min = models.FloatField(null=True, blank=True)
    estimated_fare = models.FloatField(null=True, blank=True)

    route_geometry = models.JSONField(null=True, blank=True)  # list of [lat, lon]

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default="pending")
    created_at = models.DateTimeField(auto_now_add=True)

    driver_name = models.CharField(max_length=100, default="John")
    driver_rating = models.FloatField(default=4.8)
    driver_vehicle_no = models.CharField(max_length=20, default="KA 01 AB 1234")
    driver_vehicle_model = models.CharField(max_length=50, default="White Sedan")

    def __str__(self):
        return f"{self.pickup_address} -> {self.drop_address} ({self.status})"
