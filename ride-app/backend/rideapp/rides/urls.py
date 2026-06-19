from django.urls import path
from . import views

urlpatterns = [
    # Auth
    path("register/", views.register_view),
    path("login/", views.login_view),
    path("logout/", views.logout_view),
    path("profile/", views.profile_view),

    # Utilities
    path("geocode/", views.geocode_view),
    path("categories/", views.categories_view),
    path("estimate/", views.estimate_view),

    # Customer
    path("book-ride/", views.book_ride_view),
    path("cancel-ride/", views.cancel_ride_view),
    path("my-rides/", views.my_rides_view),
    path("ride/<int:ride_id>/", views.ride_detail_view),
    path("nearby-drivers/", views.nearby_drivers_view),

    # Driver
    path("driver-online/", views.driver_online_view),
    path("driver-offline/", views.driver_offline_view),
    path("accept-ride/", views.accept_ride_view),
    path("reject-ride/", views.reject_ride_view),
    path("arrived/", views.arrived_view),
    path("start-ride/", views.start_ride_view),
    path("complete-ride/", views.complete_ride_view),
    path("update-location/", views.update_location_view),
    path("driver-rides/", views.driver_rides_view),

    # Admin
    path("admin/users/", views.admin_users_view),
    path("admin/drivers/", views.admin_drivers_view),
    path("admin/rides/", views.admin_rides_view),
    path("admin/dashboard/", views.admin_dashboard_view),
]
