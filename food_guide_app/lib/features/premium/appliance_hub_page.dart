import 'package:flutter/material.dart';
import '../../app/services.dart';
import '../../data/repositories/hardware_repository.dart';

class ApplianceHubPage extends StatefulWidget {
  const ApplianceHubPage({super.key});

  @override
  State<ApplianceHubPage> createState() => _ApplianceHubPageState();
}

class _ApplianceHubPageState extends State<ApplianceHubPage> with SingleTickerProviderStateMixin {
  List<SimulatedAppliance> _appliances = [];
  bool _isLoading = true;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(vsync: this, duration: const Duration(seconds: 2))..repeat(reverse: true);
    _loadHardware();
  }
  
  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  Future<void> _loadHardware() async {
    final apps = await AppServices.hardware.getConnectedAppliances();
    if (mounted) {
      setState(() {
        _appliances = apps;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: AppBar(
        title: const Text('Kitchen Sync Hub', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
            : Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFF0D0D0D),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: const Color(0xFF00FF66).withOpacity(0.3)),
                      ),
                      child: Row(
                        children: [
                          AnimatedBuilder(
                            animation: _pulseController,
                            builder: (context, child) {
                              return Icon(Icons.wifi_tethering, color: const Color(0xFF00FF66).withOpacity(0.5 + (_pulseController.value * 0.5)));
                            }
                          ),
                          const SizedBox(width: 12),
                          const Text('Home Network Scanning', style: TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold, letterSpacing: 1)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),
                    const Text('Connected Hardware', style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    Expanded(
                      child: ListView.builder(
                        itemCount: _appliances.length,
                        itemBuilder: (context, index) {
                          final app = _appliances[index];
                          return _buildApplianceCard(app);
                        },
                      ),
                    )
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildApplianceCard(SimulatedAppliance appliance) {
    IconData icon;
    if (appliance.type == 'oven') icon = Icons.microwave;
    else if (appliance.type == 'fridge_cam') icon = Icons.camera_alt;
    else if (appliance.type == 'meat_probe') icon = Icons.thermostat;
    else icon = Icons.kitchen;

    final isHeating = appliance.status == 'Heating';

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isHeating ? const Color(0xFFFF8C00).withOpacity(0.5) : Colors.white.withOpacity(0.05), width: 1.5),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: isHeating ? const Color(0xFFFF8C00) : Colors.white70),
              const SizedBox(width: 12),
              Expanded(child: Text(appliance.name, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16))),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(color: Colors.white12, borderRadius: BorderRadius.circular(8)),
                child: Text(appliance.status, style: const TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold)),
              )
            ],
          ),
          if (appliance.temperature != null) ...[
            const SizedBox(height: 16),
            Row(
              children: [
                Text(
                  '${appliance.temperature!.toInt()}°F', 
                  style: TextStyle(color: isHeating ? const Color(0xFFFF8C00) : Colors.white, fontSize: 32, fontWeight: FontWeight.w900)
                ),
                if (appliance.targetTemperature != null) ...[
                  const SizedBox(width: 12),
                  const Icon(Icons.arrow_forward_ios, color: Colors.white24, size: 16),
                  const SizedBox(width: 12),
                  Text('${appliance.targetTemperature!.toInt()}°F Target', style: const TextStyle(color: Colors.white54, fontSize: 16, fontWeight: FontWeight.bold)),
                ]
              ],
            )
          ]
        ],
      ),
    );
  }
}
