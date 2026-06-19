import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status as http_status

from .models import RideRequest, RideCategory
from .serializers import RideRequestSerializer, RideCategorySerializer

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OSRM_URL = "https://router.project-osrm.org/route/v1/driving"


def geocode_place(place):
    """Return (lat, lon, display_name) for a place name, or None."""
    params = {"q": place, "format": "json", "limit": 1}
    headers = {"User-Agent": "ride-app-django"}

    resp = requests.get(NOMINATIM_URL, params=params, headers=headers, timeout=10)
    data = resp.json()

    if not data:
        return None

    return float(data[0]["lat"]), float(data[0]["lon"]), data[0].get("display_name", place)


def get_route(lat1, lon1, lat2, lon2):
    """Call OSRM and return distance_km, duration_min, geometry as [[lat,lon],...]."""
    url = f"{OSRM_URL}/{lon1},{lat1};{lon2},{lat2}?overview=full&geometries=geojson"
    resp = requests.get(url, timeout=15)
    data = resp.json()

    if "routes" not in data or not data["routes"]:
        return None

    route = data["routes"][0]
    distance_km = route["distance"] / 1000
    duration_min = route["duration"] / 60

    geometry = [[c[1], c[0]] for c in route["geometry"]["coordinates"]]

    return {
        "distance_km": distance_km,
        "duration_min": duration_min,
        "geometry": geometry,
    }


@api_view(["GET"])
def geocode_view(request):
    """
    GET /api/geocode/?place=<text>
    Used for "From / To" autocomplete-like lookups.
    """
    place = request.query_params.get("place")
    if not place:
        return Response({"error": "place query param required"}, status=http_status.HTTP_400_BAD_REQUEST)

    result = geocode_place(place)
    if result is None:
        return Response({"error": "Location not found"}, status=http_status.HTTP_404_NOT_FOUND)

    lat, lon, display_name = result
    return Response({"lat": lat, "lon": lon, "display_name": display_name})


@api_view(["GET"])
def categories_view(request):
    """
    GET /api/categories/
    Returns vehicle categories (Mini, Sedan, SUV, Premium) with base pricing.
    Auto-creates defaults if none exist.
    """
    if not RideCategory.objects.exists():
        defaults = [
            {"name": "Mini", "icon": "mini", "base_fare": 50, "per_km_rate": 8, "capacity": 4, "bags": 2, "eta_offset_min": 2},
            {"name": "Sedan", "icon": "sedan", "base_fare": 70, "per_km_rate": 12, "capacity": 4, "bags": 3, "eta_offset_min": 3},
            {"name": "SUV", "icon": "suv", "base_fare": 100, "per_km_rate": 16, "capacity": 6, "bags": 4, "eta_offset_min": 4},
            {"name": "Premium", "icon": "premium", "base_fare": 150, "per_km_rate": 22, "capacity": 4, "bags": 3, "eta_offset_min": 5},
        ]
        for d in defaults:
            RideCategory.objects.create(**d)

    qs = RideCategory.objects.all()
    return Response(RideCategorySerializer(qs, many=True).data)


@api_view(["POST"])
def static_map_view(request):
    """
    GET /api/static_map/?start=lat,lon&end=lat,lon
    Returns a static map image URL with markers for pickup and drop locations.
    Uses OpenStreetMap static map service.
    """
    start = request.query_params.get('start')
    end = request.query_params.get('end')
    if not start or not end:
        return Response({"error": "start and end query params required"}, status=http_status.HTTP_400_BAD_REQUEST)
    try:
        start_lat, start_lon = map(float, start.split(','))
        end_lat, end_lon = map(float, end.split(','))
    except Exception:
        return Response({"error": "invalid coordinate format"}, status=http_status.HTTP_400_BAD_REQUEST)
    # Build static map URL
    base_url = 'https://staticmap.openstreetmap.de/staticmap.php'
    # Center between points
    center_lat = (start_lat + end_lat) / 2
    center_lon = (start_lon + end_lon) / 2
    # Determine zoom based on distance (simple heuristic)
    # For now use fixed zoom
    zoom = 13
    size = '400x300'
    markers = f"{start_lat},{start_lon},red-pushpin|{end_lat},{end_lon},blue-pushpin"
    path = f"{start_lat},{start_lon}|{end_lat},{end_lon}"
    url = f"{base_url}?center={center_lat},{center_lon}&zoom={zoom}&size={size}&markers={markers}&path={path}"
    return Response({"map_url": url})


@api_view(["POST"])
def estimate_view(request):
    """
    POST /api/estimate/
    Body: { "pickup": "place name", "drop": "place name" }

    Returns route info + fare estimate for each category.
    Used by Screen 2 (From -> To) and Screen 3 (Choose Your Ride).
    """
    # Use provided coordinates if present, otherwise fallback to geocoding
    if request.data.get('pickup_lat') and request.data.get('pickup_lon') and request.data.get('drop_lat') and request.data.get('drop_lon'):
        lat1 = float(request.data['pickup_lat'])
        lon1 = float(request.data['pickup_lon'])
        lat2 = float(request.data['drop_lat'])
        lon2 = float(request.data['drop_lon'])
        pickup_name = request.data.get('pickup', '')
        drop_name = request.data.get('drop', '')
    else:
        p = geocode_place(request.data.get('pickup'))
        d = geocode_place(request.data.get('drop'))
        if p is None or d is None:
            return Response({"error": "Location not found"}, status=http_status.HTTP_404_NOT_FOUND)
        lat1, lon1, pickup_name = p
        lat2, lon2, drop_name = d

    route = get_route(lat1, lon1, lat2, lon2)
    if route is None:
        return Response({"error": "Unable to find route"}, status=http_status.HTTP_404_NOT_FOUND)

    # ensure categories exist
    categories_view(request._request)  # warm defaults
    cats = RideCategory.objects.all()

    distance_km = route["distance_km"]
    duration_min = route["duration_min"]

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
        "pickup": {"lat": lat1, "lon": lon1, "name": pickup_name},
        "drop": {"lat": lat2, "lon": lon2, "name": drop_name},
        "distance_km": round(distance_km, 2),
        "duration_min": round(duration_min, 1),
        "route_geometry": route["geometry"],
        "ride_options": ride_options,
    })

    # Use provided coordinates if present, otherwise fallback to geocoding
    if request.data.get('pickup_lat') and request.data.get('pickup_lon') and request.data.get('drop_lat') and request.data.get('drop_lon'):
        lat1 = float(request.data['pickup_lat'])
        lon1 = float(request.data['pickup_lon'])
        lat2 = float(request.data['drop_lat'])
        lon2 = float(request.data['drop_lon'])
        pickup_name = request.data.get('pickup', '')
        drop_name = request.data.get('drop', '')
    else:
        p = geocode_place(request.data.get('pickup'))
        d = geocode_place(request.data.get('drop'))
        if p is None or d is None:
            return Response({"error": "Location not found"}, status=http_status.HTTP_404_NOT_FOUND)
        lat1, lon1, pickup_name = p
        lat2, lon2, drop_name = d

    route = get_route(lat1, lon1, lat2, lon2)
    if route is None:
        return Response({"error": "Unable to find route"}, status=http_status.HTTP_404_NOT_FOUND)

    # ensure categories exist
    categories_view(request._request)  # warm defaults
    cats = RideCategory.objects.all()

    distance_km = route["distance_km"]
    duration_min = route["duration_min"]

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
        "pickup": {"lat": lat1, "lon": lon1, "name": pickup_name},
        "drop": {"lat": lat2, "lon": lon2, "name": drop_name},
        "distance_km": round(distance_km, 2),
        "duration_min": round(duration_min, 1),
        "route_geometry": route["geometry"],
        "ride_options": ride_options,
    })
    


@api_view(["POST"])
def book_ride_view(request):
    """
    POST /api/book/
    Body: {
       "pickup_address", "drop_address",
       "pickup_lat", "pickup_lon", "drop_lat", "drop_lon",
       "category_id"
    }

    Creates a RideRequest, recomputes route+fare, marks as confirmed.
    Used by "Confirm Mini" button on Screen 3 -> moves to Screen 4 (On Trip).
    """
    data = request.data
    required = ["pickup_address", "drop_address", "pickup_lat", "pickup_lon", "drop_lat", "drop_lon", "category_id"]
    for field in required:
        if field not in data:
            return Response({"error": f"{field} is required"}, status=http_status.HTTP_400_BAD_REQUEST)

    try:
        category = RideCategory.objects.get(id=data["category_id"])
    except RideCategory.DoesNotExist:
        return Response({"error": "Invalid category_id"}, status=http_status.HTTP_404_NOT_FOUND)

    lat1, lon1 = float(data["pickup_lat"]), float(data["pickup_lon"])
    lat2, lon2 = float(data["drop_lat"]), float(data["drop_lon"])

    route = get_route(lat1, lon1, lat2, lon2)
    if route is None:
        return Response({"error": "Unable to find route"}, status=http_status.HTTP_404_NOT_FOUND)

    distance_km = route["distance_km"]
    duration_min = route["duration_min"]
    fare = category.base_fare + (distance_km * category.per_km_rate)

    ride = RideRequest.objects.create(
        pickup_address=data["pickup_address"],
        drop_address=data["drop_address"],
        pickup_lat=lat1,
        pickup_lon=lon1,
        drop_lat=lat2,
        drop_lon=lon2,
        category=category,
        distance_km=round(distance_km, 2),
        duration_min=round(duration_min, 1),
        estimated_fare=round(fare, 2),
        route_geometry=route["geometry"],
        status="confirmed",
    )

    return Response(RideRequestSerializer(ride).data, status=http_status.HTTP_201_CREATED)


@api_view(["GET"])
def ride_detail_view(request, ride_id):
    """
    GET /api/rides/<id>/
    Used by Screen 4 (On Trip) to poll ride + driver + route info.
    """
    try:
        ride = RideRequest.objects.get(id=ride_id)
    except RideRequest.DoesNotExist:
        return Response({"error": "Ride not found"}, status=http_status.HTTP_404_NOT_FOUND)

    return Response(RideRequestSerializer(ride).data)


@api_view(["POST"])
def cancel_ride_view(request, ride_id):
    """
    POST /api/rides/<id>/cancel/
    Used by Screen 4 "Cancel Ride" button.
    """
    try:
        ride = RideRequest.objects.get(id=ride_id)
    except RideRequest.DoesNotExist:
        return Response({"error": "Ride not found"}, status=http_status.HTTP_404_NOT_FOUND)

    ride.status = "cancelled"
    ride.save()

    return Response(RideRequestSerializer(ride).data)
