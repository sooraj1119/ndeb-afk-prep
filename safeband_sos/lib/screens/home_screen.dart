import 'package:flutter/material.dart';
import '../services/sos_service.dart';
import '../services/bluetooth_service.dart';
import '../utils/constants.dart';
import 'contacts_screen.dart';
import 'device_screen.dart';

class HomeScreen extends StatefulWidget {
  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final SosService _sosService = SosService();
  BLEService? _bleService;
  bool _isBluetoothConnected = false;
  bool _isSosActive = false;

  @override
  void initState() {
    super.initState();
    _bleService = BLEService(
      onSosTriggered: _handleSosPress,
      onConnectionChanged: (isConnected) {
        setState(() {
          _isBluetoothConnected = isConnected;
        });
      },
    );
  }

  Future<void> _handleSosPress() async {
    if (_isSosActive) return;
    setState(() => _isSosActive = true);
    
    // Execute SOS action
    await _sosService.triggerSos();
    
    // reset visual state
    Future.delayed(const Duration(seconds: 3), () {
      if (mounted) {
        setState(() => _isSosActive = false);
      }
    });
  }

  @override
  void dispose() {
    _bleService?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('SafeBand SOS', style: TextStyle(fontWeight: FontWeight.bold)),
        actions: [
          IconButton(
            icon: const Icon(Icons.contacts, size: 32),
            onPressed: () => Navigator.push(
              context, MaterialPageRoute(builder: (_) => ContactsScreen()),
            ),
          ),
          IconButton(
            icon: Icon(
              _isBluetoothConnected ? Icons.bluetooth_connected : Icons.bluetooth_disabled,
              size: 32,
              color: _isBluetoothConnected ? Colors.green : Colors.grey,
            ),
            onPressed: () => Navigator.push(
              context, 
              MaterialPageRoute(
                builder: (_) => DeviceScreen(bleService: _bleService!),
              ),
            ),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              "Press in emergency",
              style: AppTextStyles.header,
            ),
            const SizedBox(height: 60),
            GestureDetector(
              onTap: _handleSosPress,
              child: Container(
                width: 250,
                height: 250,
                decoration: BoxDecoration(
                  color: _isSosActive ? Colors.redAccent : AppColors.sosRed,
                  shape: BoxShape.circle,
                  boxShadow: [
                    BoxShadow(
                      color: AppColors.sosRed.withOpacity(0.5),
                      blurRadius: _isSosActive ? 30 : 15,
                      spreadRadius: _isSosActive ? 10 : 5,
                    ),
                  ],
                ),
                child: const Center(
                  child: Text(
                    "SOS",
                    style: AppTextStyles.sosButtonText,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 70),
            Text(
              _isBluetoothConnected ? "Wearable Connected" : "Wearable Disconnected",
              style: TextStyle(
                fontSize: 22,
                color: _isBluetoothConnected ? Colors.green : Colors.grey,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
