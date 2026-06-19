# Project Tasks

- [ ] Update **HomeScreen.js** UI:
  - Add `selectMode` state (`'pickup' | 'drop'`).
  - Add `pickupCoord` and `dropCoord` state objects.
  - Replace mini‑map preview with an interactive `MapView` that sets coordinates on tap.
  - Show green and red markers for pickup & drop.
  - Add a toggle button to switch between setting pickup and drop.
  - Change the main button text to **"Select Taxi"** and modify its handler to send a DTO containing `pickup_lat`, `pickup_lon`, `drop_lat`, `drop_lon` (plus optional address strings) to the API.

- [ ] Update **api client** (e.g., `api/client.js` or equivalent):
  - Extend the `estimate` method to accept latitude/longitude fields and send them in the request body.

- [ ] Backend changes (`rides/views.py`):
  - In `estimate_view`, detect `pickup_lat`, `pickup_lon`, `drop_lat`, `drop_lon` in `request.data`.
  - If present, skip `geocode_place` calls and use those coordinates directly for routing.
  - Keep existing fallback to place‑name lookup.

- [ ] Add unit test for `estimate_view` with a payload containing only lat/lon to ensure correct response.

- [ ] Verify UI flow:
  - Run the app, tap the map to set both points, press **Select Taxi**, and confirm that `ChooseRideScreen` shows correct distance, duration, and ride options.
  - Ensure the fallback (typing addresses) still works.

- [ ] Optional enhancements:
  - Use device geolocation to center the map initially.
  - Display reverse‑geocoded address after a map tap.
