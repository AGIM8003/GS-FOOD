class SimulatedAppliance {
  SimulatedAppliance({
    required this.id,
    required this.name,
    required this.type,
    required this.status,
    this.temperature,
    this.targetTemperature,
  });

  final String id;
  final String name; 
  final String type; // e.g., 'oven', 'fridge_cam', 'meat_probe'
  final String status;
  final double? temperature;
  final double? targetTemperature;
}

class HardwareRepository {
  Future<List<SimulatedAppliance>> getConnectedAppliances() async {
    // Simulated fetch of local network Kitchen appliances / IoT devices
    await Future.delayed(const Duration(milliseconds: 300));
    return [
      SimulatedAppliance(
        id: 'ov_1',
        name: 'GS Convection Oven',
        type: 'oven',
        status: 'Heating',
        temperature: 310,
        targetTemperature: 450,
      ),
      SimulatedAppliance(
        id: 'fr_1',
        name: 'Pantry Vision Node 1',
        type: 'fridge_cam',
        status: 'Scanning',
      ),
      SimulatedAppliance(
        id: 'mp_1',
        name: 'Meater Block',
        type: 'meat_probe',
        status: 'Idle',
        temperature: 72,
      ),
    ];
  }
}
