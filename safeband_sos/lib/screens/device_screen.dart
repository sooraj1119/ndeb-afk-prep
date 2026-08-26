import 'package:flutter/material.dart';
import '../services/bluetooth_service.dart';
import '../utils/constants.dart';

class DeviceScreen extends StatelessWidget {
  final BLEService bleService;

  const DeviceScreen({Key? key, required this.bleService}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("SOS Wearable")),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.watch, size: 120, color: Colors.blueAccent),
              const SizedBox(height: 30),
              const Text(
                "Ensure your SafeBand is turned on and nearby.",
                textAlign: TextAlign.center,
                style: AppTextStyles.body,
              ),
              const SizedBox(height: 50),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blueAccent,
                  padding: const EdgeInsets.symmetric(horizontal: 30, vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                icon: const Icon(Icons.bluetooth_searching, color: Colors.white, size: 28),
                label: const Text(
                  "Scan & Reconnect", 
                  style: TextStyle(fontSize: 22, color: Colors.white)
                ),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Scanning for SafeBand..."))
                  );
                  bleService.scanAndConnect();
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
