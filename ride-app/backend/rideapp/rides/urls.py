from django.urls import path
from . import views

urlpatterns = [
    path("geocode/", views.geocode_view),
    path("categories/", views.categories_view),
    path("estimate/", views.estimate_view),
    path("book/", views.book_ride_view),
    path("rides/<int:ride_id>/", views.ride_detail_view),
    path("rides/<int:ride_id>/cancel/", views.cancel_ride_view),
]
