from django.contrib import admin
from .models import User, RideCategory, Driver, Ride, DriverLocation

admin.site.register(User)
admin.site.register(RideCategory)
admin.site.register(Driver)
admin.site.register(Ride)
admin.site.register(DriverLocation)
