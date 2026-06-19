import requests
import math
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status as http_status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate
from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from .models import User, Driver, Ride, RideCategory, DriverLocation
from .serializers import UserSerializer, DriverSerializer, RideSerializer, RideCategorySerializer, DriverLocationSerializer

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"

# Helper for Haversine Distance
def haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0 # Earth radius in km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def geocode_place(place):
    """Return (lat, lon, display_name) for a place name, or None."""
    params = {"q": place, "format": "json", "limit": 1}
    headers = {"User-Agent": "ride-app-django"}
    try:
        resp = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10)
        data = resp.json()
        if data:
            return float(data[0]["lat"]), float(data[0]["lon"]), data[0].get("display_name", place)
    except Exception:
        pass
    return None

def get_route(lat1, lon1, lat2, lon2):
    """Call OSRM and return distance_km, duration_min, geometry as [[lat,lon],...]."""
    url = f"{OSRM_URL}/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson"
    try:
        resp = requests.get(url, timeout=15)
        data = resp.json()
        if "routes" in data and data["routes"]:
            route = data["routes"][0]
            distance_km = route["distance"] / 1000
            duration_min = route["duration"] / 60
            geometry = [[c[1], c[0]] for c in route["geometry"]["coordinates"]]
            return {
                "distance_km": distance_km,
                "duration_min": duration_min,
                "geometry": geometry,
            }
    except Exception:
        pass
    # Fallback to straight line (Haversine)
    dist = haversine_distance(lat1, lon1, lat2, lon2)
    return {
        "distance_km": dist,
        "duration_min": dist * 2, # Assume 30 km/h average
        "geometry": [[lat1, lon1], [lat2, lon2]],
    }

# ==========================================
# AUTHENTICATION APIs
# ==========================================

@api_view(["POST"])
@permission_classes([AllowAny])
def register_view(request):
    data = request.data
    role = data.get("role", "customer")
    phone = data.get("phone")
    password = data.get("password")
    
    if not phone or not password:
        return Response({"error": "Phone and Password are required"}, status=http_status.HTTP_400_BAD_REQUEST)
        
    if User.objects.filter(phone=phone).exists():
        return Response({"error": "User with this phone number already exists"}, status=http_status.HTTP_400_BAD_REQUEST)
        
    username = phone # default username
    user_data = {
        "username": username,
        "phone": phone,
        "name": data.get("name", ""),
        "email": data.get("email", ""),
        "password": password,
        "role": role,
    }
    
    serializer = UserSerializer(data=user_data)
    if serializer.is_valid():
        user = serializer.save()
        
        # If Driver, create Driver Profile
        if role == "driver":
            Driver.objects.create(
                user=user,
                license_number=data.get("license_number", ""),
                vehicle_name=data.get("vehicle_name", ""),
                vehicle_number=data.get("vehicle_number", ""),
                vehicle_type=data.get("vehicle_type", "Mini"),
                vehicle_color=data.get("vehicle_color", "")
            )
            
        token, _ = Token.objects.get_or_create(user=user)
        return Response({
            "token": token.key,
            "role": user.role,
            "name": user.name or user.username
        }, status=http_status.HTTP_201_CREATED)
        
    return Response(serializer.errors, status=http_status.HTTP_400_BAD_REQUEST)

@api_view(["POST"])
@permission_classes([AllowAny])
def login_view(request):
    phone = request.data.get("phone")
    password = request.data.get("password")
    
    if not phone or not password:
        return Response({"error": "Phone and password required"}, status=http_status.HTTP_400_BAD_REQUEST)
        
    user = authenticate(username=phone, password=password)
    if not user:
        return Response({"error": "Invalid credentials"}, status=http_status.HTTP_400_BAD_REQUEST)
        
    if not user.is_active:
        return Response({"error": "Your account has been blocked by Admin"}, status=http_status.HTTP_403_FORBIDDEN)
        
    token, _ = Token.objects.get_or_create(user=user)
    return Response({
        "token": token.key,
        "role": user.role,
        "name": user.name or user.username,
        "email": user.email
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout_view(request):
    request.user.auth_token.delete()
    return Response({"message": "Successfully logged out"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def profile_view(request):
    user = request.user
    user_data = UserSerializer(user).data
    if user.role == "driver":
        driver = getattr(user, "driver_profile", None)
        if driver:
            user_data["driver_details"] = DriverSerializer(driver).data
    return Response(user_data)

# ==========================================
# CUSTOMER APIs
# ==========================================

@api_view(["GET"])
@permission_classes([AllowAny])
def geocode_view(request):
    place = request.query_params.get("place")
    if not place:
        return Response({"error": "place query param required"}, status=http_status.HTTP_400_BAD_REQUEST)
    result = geocode_place(place)
    if result is None:
        return Response({"error": "Location not found"}, status=http_status.HTTP_404_NOT_FOUND)
    lat, lon, display_name = result
    return Response({"lat": lat, "lon": lon, "display_name": display_name})

@api_view(["GET"])
@permission_classes([AllowAny])
def categories_view(request):
    if not RideCategory.objects.exists():
        defaults = [
            {"name": "Bike", "icon": "bicycle", "base_fare": 20, "per_km_rate": 5, "capacity": 1, "bags": 0, "eta_offset_min": 2},
            {"name": "Auto", "icon": "car-sport", "base_fare": 30, "per_km_rate": 8, "capacity": 3, "bags": 1, "eta_offset_min": 3},
            {"name": "Mini", "icon": "car", "base_fare": 50, "per_km_rate": 10, "capacity": 4, "bags": 2, "eta_offset_min": 2},
            {"name": "Sedan", "icon": "car-sport", "base_fare": 70, "per_km_rate": 13, "capacity": 4, "bags": 3, "eta_offset_min": 3},
            {"name": "SUV", "icon": "bus", "base_fare": 100, "per_km_rate": 18, "capacity": 6, "bags": 4, "eta_offset_min": 4},
        ]
        for d in defaults:
            RideCategory.objects.create(**d)
    qs = RideCategory.objects.all()
    return Response(RideCategorySerializer(qs, many=True).data)

@api_view(["POST"])
@permission_classes([AllowAny])
def estimate_view(request):
    lat1 = float(request.data.get('pickup_lat', 0))
    lon1 = float(request.data.get('pickup_lon', 0))
    lat2 = float(request.data.get('drop_lat', 0))
    lon2 = float(request.data.get('drop_lon', 0))
    
    if not lat1 or not lon1 or not lat2 or not lon2:
        return Response({"error": "Valid pickup and drop coordinates required"}, status=http_status.HTTP_400_BAD_REQUEST)
        
    route = get_route(lat1, lon1, lat2, lon2)
    distance_km = route["distance_km"]
    duration_min = route["duration_min"]
    
    # Warm up categories
    categories_view(request._request)
    cats = RideCategory.objects.all()
    
    ride_options = []
    for cat in cats:
        fare = cat.base_fare + (distance_km * cat.per_km_rate)
        ride_options.append({
            "id": cat.id,
            "name": cat.name,
            "icon": cat.icon,
            "fare": round(fare, 2),
            "capacity": cat.capacity,
            "bags": cat.bags,
            "eta_min": cat.eta_offset_min,
        })
        
    return Response({
        "pickup": {"lat": lat1, "lon": lon1, "name": request.data.get('pickup', 'Current Location')},
        "drop": {"lat": lat2, "lon": lon2, "name": request.data.get('drop', 'Destination')},
        "distance_km": round(distance_km, 2),
        "duration_min": round(duration_min, 1),
        "route_geometry": route["geometry"],
        "ride_options": ride_options,
    })

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def book_ride_view(request):
    data = request.data
    customer = request.user
    
    pickup_lat = float(data.get("pickup_lat"))
    pickup_lng = float(data.get("pickup_lon") or data.get("pickup_lng"))
    dest_lat = float(data.get("drop_lat") or data.get("destination_lat"))
    dest_lng = float(data.get("drop_lon") or data.get("destination_lng"))
    vehicle_type = data.get("vehicle_type", "Mini")
    
    route = get_route(pickup_lat, pickup_lng, dest_lat, dest_lng)
    distance = route["distance_km"]
    
    # Get fare rule from category
    category = RideCategory.objects.filter(name=vehicle_type).first()
    base_fare = category.base_fare if category else 50
    km_rate = category.per_km_rate if category else 12
    fare = base_fare + (distance * km_rate)
    
    # Find nearest online driver of same vehicle type
    drivers = Driver.objects.filter(is_online=True, vehicle_type=vehicle_type)
    nearest_driver = None
    min_dist = float('inf')
    
    for d in drivers:
        if d.current_lat and d.current_lng:
            dist = haversine_distance(pickup_lat, pickup_lng, d.current_lat, d.current_lng)
            if dist < min_dist:
                min_dist = dist
                nearest_driver = d
                
    status_state = "ACCEPTED" if nearest_driver else "SEARCHING"
    
    ride = Ride.objects.create(
        customer=customer,
        driver=nearest_driver,
        pickup_address=data.get("pickup_address", "Pickup Location"),
        destination_address=data.get("drop_address" or "destination_address", "Destination Address"),
        pickup_lat=pickup_lat,
        pickup_lng=pickup_lng,
        destination_lat=dest_lat,
        destination_lng=dest_lng,
        distance=round(distance, 2),
        fare=round(fare, 2),
        status=status_state
    )
    
    return Response(RideSerializer(ride).data, status=http_status.HTTP_201_CREATED)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def cancel_ride_view(request, ride_id=None):
    # Support endpoint URL with id or body ride_id
    r_id = ride_id or request.data.get("ride_id")
    ride = get_object_or_404(Ride, id=r_id)
    ride.status = "CANCELLED"
    ride.save()
    return Response(RideSerializer(ride).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def my_rides_view(request):
    rides = Ride.objects.filter(customer=request.user).order_by("-id")
    return Response(RideSerializer(rides, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def ride_detail_view(request, ride_id):
    ride = get_object_or_404(Ride, id=ride_id)
    # Simulate Driver marker moving closer to pickup if ride is accepted
    if ride.status in ["ACCEPTED", "ARRIVED"] and ride.driver:
        # Move driver closer to pickup step-by-step
        driver = ride.driver
        driver.current_lat = driver.current_lat + (ride.pickup_lat - driver.current_lat) * 0.2
        driver.current_lng = driver.current_lng + (ride.pickup_lng - driver.current_lng) * 0.2
        driver.save()
    return Response(RideSerializer(ride).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def nearby_drivers_view(request):
    lat = float(request.query_params.get("lat", 0))
    lng = float(request.query_params.get("lng", 0))
    if not lat or not lng:
        return Response([])
        
    drivers = Driver.objects.filter(is_online=True)
    nearby = []
    for d in drivers:
        if d.current_lat and d.current_lng:
            dist = haversine_distance(lat, lng, d.current_lat, d.current_lng)
            if dist < 15.0: # within 15 km
                nearby.append(DriverSerializer(d).data)
    return Response(nearby)

# ==========================================
# DRIVER APIs
# ==========================================

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def driver_online_view(request):
    driver = get_object_or_404(Driver, user=request.user)
    driver.is_online = True
    # Default coordinates if empty (e.g. Center of Chennai/NY)
    if not driver.current_lat:
        driver.current_lat = float(request.data.get("lat", 13.0827))
        driver.current_lng = float(request.data.get("lng", 80.2707))
    driver.save()
    return Response(DriverSerializer(driver).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def driver_offline_view(request):
    driver = get_object_or_404(Driver, user=request.user)
    driver.is_online = False
    driver.save()
    return Response(DriverSerializer(driver).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def accept_ride_view(request):
    ride_id = request.data.get("ride_id")
    ride = get_object_or_404(Ride, id=ride_id)
    driver = get_object_or_404(Driver, user=request.user)
    
    ride.driver = driver
    ride.status = "ACCEPTED"
    ride.save()
    return Response(RideSerializer(ride).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def reject_ride_view(request):
    ride_id = request.data.get("ride_id")
    ride = get_object_or_404(Ride, id=ride_id)
    # Put it back to searching
    ride.driver = None
    ride.status = "SEARCHING"
    ride.save()
    return Response(RideSerializer(ride).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def arrived_view(request):
    ride_id = request.data.get("ride_id")
    ride = get_object_or_404(Ride, id=ride_id)
    ride.status = "ARRIVED"
    ride.save()
    return Response(RideSerializer(ride).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def start_ride_view(request):
    ride_id = request.data.get("ride_id")
    ride = get_object_or_404(Ride, id=ride_id)
    ride.status = "STARTED"
    ride.save()
    return Response(RideSerializer(ride).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_ride_view(request):
    ride_id = request.data.get("ride_id")
    ride = get_object_or_404(Ride, id=ride_id)
    ride.status = "COMPLETED"
    ride.completed_at = timezone.now()
    ride.save()
    return Response(RideSerializer(ride).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def update_location_view(request):
    driver = get_object_or_404(Driver, user=request.user)
    lat = float(request.data.get("lat"))
    lng = float(request.data.get("lng"))
    
    driver.current_lat = lat
    driver.current_lng = lng
    driver.save()
    
    DriverLocation.objects.create(driver=driver, latitude=lat, longitude=lng)
    return Response({"status": "Location updated successfully"})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def driver_rides_view(request):
    driver = get_object_or_404(Driver, user=request.user)
    rides = Ride.objects.filter(driver=driver).order_by("-id")
    return Response(RideSerializer(rides, many=True).data)

# ==========================================
# ADMIN APIs
# ==========================================

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def admin_users_view(request):
    if request.user.role != "admin":
        return Response({"error": "Admin permission required"}, status=http_status.HTTP_403_FORBIDDEN)
        
    if request.method == "POST":
        action = request.data.get("action")
        target_user_id = request.data.get("user_id")
        target_user = get_object_or_404(User, id=target_user_id)
        
        if action == "block":
            target_user.is_active = False
            target_user.save()
            return Response({"status": "User blocked successfully"})
        elif action == "unblock":
            target_user.is_active = True
            target_user.save()
            return Response({"status": "User unblocked successfully"})
            
    users = User.objects.filter(role="customer").order_by("-id")
    return Response(UserSerializer(users, many=True).data)

@api_view(["GET", "POST"])
@permission_classes([IsAuthenticated])
def admin_drivers_view(request):
    if request.user.role != "admin":
        return Response({"error": "Admin permission required"}, status=http_status.HTTP_403_FORBIDDEN)
        
    if request.method == "POST":
        action = request.data.get("action")
        driver_id = request.data.get("driver_id")
        driver = get_object_or_404(Driver, id=driver_id)
        
        if action == "block":
            driver.user.is_active = False
            driver.user.save()
            return Response({"status": "Driver blocked successfully"})
        elif action == "unblock":
            driver.user.is_active = True
            driver.user.save()
            return Response({"status": "Driver unblocked successfully"})
            
    drivers = Driver.objects.all().order_by("-id")
    return Response(DriverSerializer(drivers, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_rides_view(request):
    if request.user.role != "admin":
        return Response({"error": "Admin permission required"}, status=http_status.HTTP_403_FORBIDDEN)
    rides = Ride.objects.all().order_by("-id")
    return Response(RideSerializer(rides, many=True).data)

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def admin_dashboard_view(request):
    if request.user.role != "admin":
        return Response({"error": "Admin permission required"}, status=http_status.HTTP_403_FORBIDDEN)
        
    total_customers = User.objects.filter(role="customer").count()
    total_drivers = Driver.objects.count()
    online_drivers = Driver.objects.filter(is_online=True).count()
    total_rides = Ride.objects.count()
    completed_rides = Ride.objects.filter(status="COMPLETED").count()
    cancelled_rides = Ride.objects.filter(status="CANCELLED").count()
    
    return Response({
        "total_customers": total_customers,
        "total_drivers": total_drivers,
        "online_drivers": online_drivers,
        "total_rides": total_rides,
        "completed_rides": completed_rides,
        "cancelled_rides": cancelled_rides,
    })
