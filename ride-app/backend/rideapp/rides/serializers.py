from rest_framework import serializers
from .models import User, Driver, Ride, RideCategory, DriverLocation

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "name", "phone", "email", "role", "created_at", "password"]
        extra_kwargs = {
            "password": {"write_only": True},
            "username": {"required": False},
        }

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Ensure username is set to phone if not provided
        if "username" not in validated_data or not validated_data["username"]:
            validated_data["username"] = validated_data.get("phone", "")
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user

class DriverSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    class Meta:
        model = Driver
        fields = [
            "id", "user", "license_number", "vehicle_name",
            "vehicle_number", "vehicle_type", "vehicle_color",
            "rating", "is_online", "current_lat", "current_lng"
        ]

class RideCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = RideCategory
        fields = [
            "id", "name", "icon", "base_fare",
            "per_km_rate", "capacity", "bags", "eta_offset_min",
        ]

class RideSerializer(serializers.ModelSerializer):
    customer = UserSerializer(read_only=True)
    driver = DriverSerializer(read_only=True)
    class Meta:
        model = Ride
        fields = "__all__"

class DriverLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = DriverLocation
        fields = "__all__"
