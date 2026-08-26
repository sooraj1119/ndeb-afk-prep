# SafeBand SOS

An elderly emergency alert MVP utilizing a Flutter app and an ESP32 Bluetooth Low Energy (BLE) wearable to quickly dispatch emergency SMS and phone calls.

## Overview
- **Instant SOS**: Pressing the large red button or receiving a specific BLE broadcast initiates a distress signal.
- **Location Dispatch**: Generates a Google Maps link of current GPS coordinates.
- **SMS & Calls**: Automatically sends the location to up to 5 emergency contacts, and places a phone call to the primary contact.

## Setup
1. Open the `safeband_sos` folder in your preferred IDE (VSCode, Android Studio).
2. Ensure you have Flutter installed. If not, follow [Flutter Docs](https://docs.flutter.dev/get-started/install).
3. Run `flutter pub get` to fetch dependencies.
4. Essential Permissions in `android/app/src/main/AndroidManifest.xml` (needed before deploying via `flutter run`):
   - `<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />`
   - `<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />`
   - `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />`
   - `<uses-permission android:name="android.permission.SEND_SMS" />`
   - `<uses-permission android:name="android.permission.CALL_PHONE" />`
5. Connect an Android test device via USB/Wi-Fi and run `flutter run`.

## Structure
- `/lib/models`: Data configurations like the `Contact` model.
- `/lib/screens`: Very simplistic UI suitable for elderly users (`home_screen`, `contacts_screen`, `device_screen`).
- `/lib/services`:
  - `bluetooth_service.dart`: Integrates `flutter_blue_plus`.
  - `contact_service.dart`: Reads/writes local SharedPreferences for emergency contact lists.
  - `location_service.dart`: Fetches live GPS coords utilizing `geolocator`.
  - `sos_service.dart`: The brain of the emergency sequence.
