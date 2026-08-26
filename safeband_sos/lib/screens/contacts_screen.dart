import 'package:flutter/material.dart';
import '../models/contact.dart';
import '../services/contact_service.dart';
import '../utils/constants.dart';

class ContactsScreen extends StatefulWidget {
  @override
  _ContactsScreenState createState() => _ContactsScreenState();
}

class _ContactsScreenState extends State<ContactsScreen> {
  final ContactService _contactService = ContactService();
  List<Contact> _contacts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadContacts();
  }

  Future<void> _loadContacts() async {
    final contacts = await _contactService.getContacts();
    setState(() {
      _contacts = contacts;
      _isLoading = false;
    });
  }

  void _addContactDialog() {
    final nameCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text("Add Emergency Contact"),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: const InputDecoration(labelText: "Name (e.g. Son)"),
                keyboardType: TextInputType.name,
              ),
              TextField(
                controller: phoneCtrl,
                decoration: const InputDecoration(labelText: "Phone Number"),
                keyboardType: TextInputType.phone,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context), 
              child: const Text("Cancel", style: TextStyle(fontSize: 18))
            ),
            ElevatedButton(
              onPressed: () async {
                if (nameCtrl.text.isNotEmpty && phoneCtrl.text.isNotEmpty) {
                  final newContact = Contact(
                    id: DateTime.now().millisecondsSinceEpoch.toString(),
                    name: nameCtrl.text,
                    phoneNumber: phoneCtrl.text,
                  );
                  await _contactService.saveContact(newContact);
                  Navigator.pop(context);
                  _loadContacts();
                }
              },
              child: const Text("Save", style: TextStyle(fontSize: 18)),
            ),
          ],
        );
      }
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("Emergency Contacts")),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _contacts.isEmpty 
          ? Center(
              child: Text(
                "No contacts added yet.\nPlease add family/friends.",
                textAlign: TextAlign.center,
                style: AppTextStyles.bodySecondary,
              )
            )
          : ListView.builder(
            itemCount: _contacts.length,
            itemBuilder: (context, index) {
              final c = _contacts[index];
              return ListTile(
                leading: const CircleAvatar(
                  backgroundColor: AppColors.sosRed,
                  child: Icon(Icons.person, color: Colors.white, size: 30),
                ),
                title: Text(c.name, style: AppTextStyles.body),
                subtitle: Text(c.phoneNumber, style: AppTextStyles.bodySecondary),
                trailing: IconButton(
                  icon: const Icon(Icons.delete, color: Colors.grey, size: 32),
                  onPressed: () async {
                    await _contactService.deleteContact(c.id);
                    _loadContacts();
                  },
                ),
              );
            },
          ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppColors.sosRed,
        icon: const Icon(Icons.add, color: Colors.white, size: 30),
        label: const Text("Add Contact", style: TextStyle(color: Colors.white, fontSize: 18)),
        onPressed: () {
          if (_contacts.length >= 5) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text("Max 5 contacts allowed."))
            );
          } else {
            _addContactDialog();
          }
        },
      ),
    );
  }
}
