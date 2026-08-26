import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/contact.dart';

class ContactService {
  static const String _contactsKey = 'emergency_contacts';

  Future<List<Contact>> getContacts() async {
    final prefs = await SharedPreferences.getInstance();
    final contactsJson = prefs.getStringList(_contactsKey) ?? [];
    return contactsJson
        .map((jsonStr) => Contact.fromJson(jsonDecode(jsonStr)))
        .toList();
  }

  Future<void> saveContact(Contact contact) async {
    final contacts = await getContacts();
    if (contacts.length >= 5) {
      throw Exception('Maximum of 5 contacts allowed.');
    }
    contacts.add(contact);
    await _saveAll(contacts);
  }

  Future<void> deleteContact(String id) async {
    final contacts = await getContacts();
    contacts.removeWhere((c) => c.id == id);
    await _saveAll(contacts);
  }

  Future<void> _saveAll(List<Contact> contacts) async {
    final prefs = await SharedPreferences.getInstance();
    final contactsJson =
        contacts.map((c) => jsonEncode(c.toJson())).toList();
    await prefs.setStringList(_contactsKey, contactsJson);
  }
}
