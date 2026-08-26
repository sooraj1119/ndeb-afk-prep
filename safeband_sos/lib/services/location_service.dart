import 'package:geolocator/geolocator.dart';

class LocationService {
  /// Fetches the current location and returns a Google Maps URL.
  Future<String> getCurrentLocationUrl() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Test if location services are enabled.
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return 'Location services disable. Cannot send map link.';
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return 'Location permissions denied. Cannot send map link.';
      }
    }
    
    if (permission == LocationPermission.deniedForever) {
      return 'Location permissions permanently denied. Cannot send map link.';
    } 

    try {
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.bestForNavigation,
        timeLimit: const Duration(seconds: 2), // Require quick location to meet the 3s SLA
      );
      return 'https://maps.google.com/?q=${position.latitude},${position.longitude}';
    } catch (e) {
      // If getting the actual best location within 2 seconds fails, try getting the last known location.
      Position? lastPosition = await Geolocator.getLastKnownPosition();
      if (lastPosition != null) {
        return 'https://maps.google.com/?q=${lastPosition.latitude},${lastPosition.longitude}';
      }
      return 'Could not retrieve location in time.';
    }
  }
}
