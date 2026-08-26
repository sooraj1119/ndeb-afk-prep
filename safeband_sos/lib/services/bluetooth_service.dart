import 'dart:async';
import 'package:flutter_blue_plus/flutter_blue_plus.dart';

class BLEService {
  static const String esp32DeviceName = "SafeBand_SOS";
  
  BluetoothDevice? _connectedDevice;
  StreamSubscription<BluetoothConnectionState>? _connectionSubscription;
  StreamSubscription<List<int>>? _sosSubscription;

  final Function onSosTriggered;
  final Function(bool isConnected) onConnectionChanged;

  BLEService({
    required this.onSosTriggered,
    required this.onConnectionChanged,
  });

  Future<void> scanAndConnect() async {
    try {
      await FlutterBluePlus.startScan(timeout: const Duration(seconds: 5));

      FlutterBluePlus.scanResults.listen((results) async {
        for (ScanResult r in results) {
          if (r.device.platformName == esp32DeviceName || r.device.advName == esp32DeviceName) {
            await FlutterBluePlus.stopScan();
            await _connectToDevice(r.device);
            break;
          }
        }
      });
    } catch (e) {
      print("Error during BLE scan: $e");
    }
  }

  Future<void> _connectToDevice(BluetoothDevice device) async {
    _connectedDevice = device;
    
    _connectionSubscription = device.connectionState.listen((state) {
      if (state == BluetoothConnectionState.connected) {
        onConnectionChanged(true);
        _discoverServices();
      } else if (state == BluetoothConnectionState.disconnected) {
        onConnectionChanged(false);
        _reconnect();
      }
    });

    try {
        await device.connect(autoConnect: true);
    } catch (e) {
        print("Error connecting to device: $e");
        _reconnect();
    }
  }

  Future<void> _discoverServices() async {
    if (_connectedDevice == null) return;
    
    // We need an actual ESP32 service and characteristic UUID here. 
    // This is a generic discovery that attaches to any notify characteristic.
    try {
      List<BluetoothService> services = await _connectedDevice!.discoverServices();
      for (var service in services) {
        for (var characteristic in service.characteristics) {
          if (characteristic.properties.notify) {
            await characteristic.setNotifyValue(true);
            _sosSubscription = characteristic.lastValueStream.listen((value) {
              // Assuming ESP32 sends [1] when SOS button is pressed
              if (value.isNotEmpty && value[0] == 1) {
                onSosTriggered();
              }
            });
          }
        }
      }
    } catch (e) {
      print("Service discovery error: $e");
    }
  }

  void _reconnect() {
    Future.delayed(const Duration(seconds: 5), () {
      if (_connectedDevice != null) {
        _connectedDevice!.connect(autoConnect: true).catchError((e) {
            print("Auto reconnect failed: $e");
        });
      }
    });
  }

  void dispose() {
    _connectionSubscription?.cancel();
    _sosSubscription?.cancel();
    _connectedDevice?.disconnect();
  }
}
