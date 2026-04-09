import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/i18n.dart';
import '../../ui/golden_gourmet_scaffold.dart';
import '../../ui/sanctity_header.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    final _mockInventory = [
      {'name': 'Fresh Spinach', 'location': 'Crisper', 'daysLeft': 2, 'critical': true, 'icon': Icons.grass},
      {'name': 'Raw Chicken Breast', 'location': 'Deep Freeze', 'daysLeft': 3, 'critical': true, 'icon': Icons.set_meal},
      {'name': 'Feta Cheese', 'location': 'Top Shelf', 'daysLeft': 7, 'critical': false, 'icon': Icons.cake},
      {'name': 'Eggs', 'location': 'Door Bins', 'daysLeft': 14, 'critical': false, 'icon': Icons.egg},
    ];

    return GoldenGourmetScaffold(
      backgroundColor: Colors.black, // OLED Mode
      appBar: SanctityHeader(
        title: I18n.get('storage.title', fallback: 'My Pantry Inventory'),
      ),
      body: SafeArea(
        child: ListView.builder(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 24, bottom: 100),
          itemCount: _mockInventory.length,
          itemBuilder: (context, index) {
            final item = _mockInventory[index];
            final isCritical = item['critical'] as bool;
            final daysLeft = item['daysLeft'] as int;
            
            // Calculate simulated Freshness Decay (14 days = 100% quality)
            final double freshnessRatio = (daysLeft / 14).clamp(0.0, 1.0);
            
            final decayColor = isCritical 
                ? const Color(0xFFFF3333) // Deep Red 
                : freshnessRatio > 0.5 ? const Color(0xFF00FF66) : const Color(0xFFFF8C00);

            return Padding(
              padding: const EdgeInsets.only(bottom: 16.0),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                  child: Container(
                    padding: const EdgeInsets.all(20.0),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.04),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: decayColor.withOpacity(0.5), width: isCritical ? 2.0 : 1.0),
                      boxShadow: [
                         if (isCritical) BoxShadow(color: decayColor.withOpacity(0.1), blurRadius: 20)
                      ]
                    ),
                    child: Row(
                      children: [
                        Container(
                          height: 56, width: 56,
                          decoration: BoxDecoration(color: decayColor.withOpacity(0.15), shape: BoxShape.circle),
                          child: Icon(item['icon'] as IconData, color: decayColor, size: 28),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item['name'] as String, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.3)),
                              const SizedBox(height: 6),
                              Text(item['location'] as String, style: TextStyle(color: Colors.blueGrey.shade300, fontSize: 14, fontWeight: FontWeight.w500)),
                            ],
                          ),
                        ),
                        Expanded(
                          flex: 3,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.end,
                            children: [
                              Text('${(freshnessRatio * 100).toInt()}%', style: TextStyle(color: decayColor, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: freshnessRatio,
                                backgroundColor: Colors.white12,
                                valueColor: AlwaysStoppedAnimation<Color>(decayColor),
                                borderRadius: BorderRadius.circular(10),
                                minHeight: 6,
                              ),
                              const SizedBox(height: 4),
                              Text('Quality Index', style: TextStyle(color: Colors.white.withOpacity(0.4), fontSize: 9, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        )
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
