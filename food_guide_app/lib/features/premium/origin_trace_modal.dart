import 'package:flutter/material.dart';

/// Glassmorphic Blockchain Provenance Modal
class OriginTraceModal extends StatelessWidget {
  const OriginTraceModal({super.key, required this.itemName});
  
  final String itemName;

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: Color(0xFF151515),
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                   const Icon(Icons.hub, color: Color(0xFF00FF66), size: 32),
                   const SizedBox(width: 12),
                   const Text('ORIGIN TRACE', style: TextStyle(color: Color(0xFF00FF66), fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: 2)),
                   const Spacer(),
                   IconButton(icon: const Icon(Icons.close, color: Colors.white54), onPressed: () => Navigator.pop(context))
                ],
              ),
              const SizedBox(height: 24),
              Text(itemName, style: const TextStyle(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold)),
              const Text('Verified on Ledger: 0x8a92...f3f9', style: TextStyle(color: Colors.white38, fontFamily: 'monospace', fontSize: 12)),
              const SizedBox(height: 32),
              
              _buildTraceStep('FARM: Golden Valley Organics', 'Harvested 3 days ago. Soil Health: Optimal.', Icons.eco),
              _buildConnector(),
              _buildTraceStep('TRANSIT: Cold Chain Logistics', 'Temperature maintained at 4°C.', Icons.local_shipping),
              _buildConnector(),
              _buildTraceStep('ARRIVAL: Distribution Center', 'Quality inspection passed. Zero bio-contaminants.', Icons.domain_verification),
              
              const SizedBox(height: 32),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFF00FF66).withOpacity(0.05),
                  border: Border.all(color: const Color(0xFF00FF66).withOpacity(0.2)),
                  borderRadius: BorderRadius.circular(12)
                ),
                child: const Row(
                  children: [
                    Icon(Icons.energy_savings_leaf, color: Color(0xFF00FF66)),
                    SizedBox(width: 12),
                    Expanded(child: Text('Carbon Impact: 0.4 kg CO2e (Offset via Local Supply Chain)', style: TextStyle(color: Colors.white70, fontSize: 12))),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTraceStep(String title, String subtitle, IconData icon) {
    return Row(
      children: [
        Container(
           padding: const EdgeInsets.all(10),
           decoration: BoxDecoration(
             color: Colors.black,
             shape: BoxShape.circle,
             border: Border.all(color: const Color(0xFF00FF66), width: 1.5)
           ),
           child: Icon(icon, color: const Color(0xFF00FF66), size: 20),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
               Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
               Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
            ],
          ),
        )
      ],
    );
  }

  Widget _buildConnector() {
    return Padding(
      padding: const EdgeInsets.only(left: 19.0, top: 4, bottom: 4),
      child: Container(
        width: 2,
        height: 24,
        color: const Color(0xFF00FF66).withOpacity(0.5),
      ),
    );
  }
}
