import 'package:url_launcher/url_launcher.dart';
import 'contact_service.dart';
import 'location_service.dart';

class SosService {
  final ContactService _contactService = ContactService();
  final LocationService _locationService = LocationService();

  /// Triggers the emergency sequence: GPS -> SMS -> Call
  Future<void> triggerSos() async {
    // 1. Fetch location rapidly
    final locationUrl = await _locationService.getCurrentLocationUrl();
    final message = "EMERGENCY! I need help. My location: $locationUrl";

    // 2. Fetch contacts
    final contacts = await _contactService.getContacts();
    if (contacts.isEmpty) {
      return; // Cannot notify if there are no contacts
    }

    final recipients = contacts.map((c) => c.phoneNumber).join(',');

    // 3. Send SMS to all via url launcher
    try {
      final Uri smsUri = Uri(scheme: 'sms', path: recipients, queryParameters: {'body': message});
      if (await canLaunchUrl(smsUri)) {
        await launchUrl(smsUri);
      }
    } catch (e) {
      print("SMS launch error: $e");
    }

    // 4. Initiate Call to the first contact
    // For MVP, we wait briefly then call (in a real app, you might do this via MethodChannel simultaneously)
    Future.delayed(const Duration(seconds: 4), () async {
      final firstContactNumber = contacts.first.phoneNumber;
      final Uri callUri = Uri(scheme: 'tel', path: firstContactNumber);
      if (await canLaunchUrl(callUri)) {
        await launchUrl(callUri);
      }
    });
  }
}
