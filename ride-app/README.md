# Ride App — Django Backend + React Native (Expo) Frontend

Matches the 4-screen flow: Welcome → Home (From/To) → Choose Your Ride → On Trip.

## Folder structure

```
ride-app/
├── backend/
│   └── rideapp/
│       ├── manage.py
│       ├── requirements.txt
│       ├── rideapp/        (settings, urls, wsgi)
│       └── rides/           (models, views, serializers, urls)
└── mobile/
    ├── App.js
    ├── app.json
    ├── package.json
    ├── theme.js
    ├── api/client.js
    ├── navigation/RootNavigator.js
    ├── screens/
    │   ├── WelcomeScreen.js   (Screen 1)
    │   ├── HomeScreen.js      (Screen 2 - From/To + suggestions)
    │   ├── ChooseRideScreen.js (Screen 3 - categories + map + route)
    │   └── OnTripScreen.js    (Screen 4 - live tracking)
    └── assets/ (logo.png, car.png, driver.png)
```

## Backend setup

```bash
cd backend/rideapp
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8000
```

### API endpoints

- `GET  /api/geocode/?place=<name>` — geocode a place via Nominatim
- `GET  /api/categories/` — list ride categories (Mini, Sedan, SUV, Premium) — auto-seeds defaults
- `POST /api/estimate/` — body `{ "pickup": "...", "drop": "..." }` → route + per-category fare estimates
- `POST /api/book/` — body `{ pickup_address, drop_address, pickup_lat, pickup_lon, drop_lat, drop_lon, category_id }` → creates RideRequest, returns ride with driver info + route geometry
- `GET  /api/rides/<id>/` — ride details (used for On Trip screen)
- `POST /api/rides/<id>/cancel/` — cancel a ride

Uses OpenStreetMap **Nominatim** (geocoding) and **OSRM** (routing) — same free services as the original Streamlit app.

## Mobile (React Native / Expo) setup

```bash
cd mobile
npm install
```

Edit `theme.js` → `API_BASE_URL`:
- Android emulator: `http://10.0.2.2:8000/api`
- iOS simulator: `http://127.0.0.1:8000/api`
- Physical device: `http://<your-machine-LAN-IP>:8000/api`

Then run:

```bash
npx expo start
```

### Maps
Uses `react-native-maps`. Add a Google Maps API key in `app.json` (`ios.config.googleMapsApiKey` and `android.config.googleMaps.apiKey`) for Android/iOS native builds. Works on Expo Go for basic testing on iOS without a key; Android requires a key for production builds.

## Flow

1. **Welcome** — "Get Started" → Home
2. **Home** — enter From/To (or tap a suggestion) → "Find Ride" calls `/api/estimate/`
3. **Choose Your Ride** — shows map + route polyline + driver marker + category cards (Mini/Sedan/SUV/Premium) with live fares from backend → "Confirm" calls `/api/book/`
4. **On Trip** — shows driver info, live map with route, pickup/drop, Cancel Ride calls `/api/rides/<id>/cancel/`
