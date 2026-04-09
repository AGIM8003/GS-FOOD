class SimulatedAppliance {
  SimulatedAppliance({
    required this.id,
    required this.name,
    required this.type,
    this.status = 'Idle',
    this.temperature,
    this.targetTemperature,
    this.remainingTimeSec,
  });

  final String id;
  final String name;
  final String type; // 'oven', 'fridge_cam', 'meat_probe', 'air_fryer'
  String status;
  double? temperature;
  double? targetTemperature;
  int? remainingTimeSec;
}

/// Simulated MQTT IoT connection abstraction. 
class HardwareRepository {
  final List<SimulatedAppliance> _appliances = [
    SimulatedAppliance(id: 'ov_1', name: 'Smart Convection', type: 'oven', temperature: 72),
    SimulatedAppliance(id: 'af_1', name: 'Countertop AirFryer', type: 'air_fryer'),
    SimulatedAppliance(id: 'mp_1', name: 'Bluetooth Steak Probe', type: 'meat_probe', temperature: 45),
    SimulatedAppliance(id: 'fc_1', name: 'Samsung Family Hub Lens', type: 'fridge_cam', status: 'Scanning'),
  ];

  Future<List<SimulatedAppliance>> getConnectedAppliances() async {
    await Future.delayed(const Duration(milliseconds: 400));
    return List.unmodifiable(_appliances);
  }

  Future<void> sendInstruction(String id, {double? targetTemp, String? command}) async {
    final app = _appliances.firstWhere((a) => a.id == id);
    if (targetTemp != null) {
      app.targetTemperature = targetTemp;
      app.status = 'Heating';
    }
    if (command != null) {
       app.status = command;
    }
  }
}
