from rest_framework import serializers
from .models import RideRequest, RideCategory


class RideCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RideCategory
        fields = [
            "id", "name", "icon", "base_fare",
            "per_km_rate", "capacity", "bags", "eta_offset_min",
        ]


class RideRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = RideRequest
        fields = "__all__"
        read_only_fields = [
            "distance_km", "duration_min", "estimated_fare",
            "route_geometry", "status", "created_at",
        ]
