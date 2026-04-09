import 'dart:ui';
import 'package:flutter/material.dart';
import '../../core/i18n.dart';

class MyFoodPage extends StatelessWidget {
  const MyFoodPage({super.key});

  @override
  Widget build(BuildContext context) {
    final _mockInventory = [
      {'name': 'Organic Milk (Half Gal)', 'location': 'Fridge Door', 'daysLeft': 1, 'critical': true, 'icon': Icons.water_drop},
      {'name': 'Fresh Spinach', 'location': 'Crisper', 'daysLeft': 2, 'critical': true, 'icon': Icons.grass},
      {'name': 'Charred Heirloom Tomatoes', 'location': 'Counter', 'daysLeft': 3, 'critical': false, 'icon': Icons.lunch_dining},
      {'name': 'Saffron', 'location': 'Pantry Spice Rack', 'daysLeft': 180, 'critical': false, 'icon': Icons.eco},
    ];

    return Scaffold(
      backgroundColor: Colors.black, // OLED Mode
      appBar: AppBar(
        title: Text(I18n.get('pantry.title', fallback: 'My Food & Storage'), style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: ListView.builder(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 24, bottom: 100),
          itemCount: _mockInventory.length,
          itemBuilder: (context, index) {
            final item = _mockInventory[index];
            final isCritical = item['critical'] as bool;
            final expirationColor = isCritical ? Colors.redAccent.shade400 : Colors.greenAccent.shade400;

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
                      border: Border.all(color: expirationColor.withOpacity(0.5), width: isCritical ? 2.0 : 1.0),
                      boxShadow: [
                         if (isCritical) BoxShadow(color: expirationColor.withOpacity(0.1), blurRadius: 20)
                      ]
                    ),
                    child: Row(
                      children: [
                        Container(
                          height: 56, width: 56,
                          decoration: BoxDecoration(color: expirationColor.withOpacity(0.15), shape: BoxShape.circle),
                          child: Icon(item['icon'] as IconData, color: expirationColor, size: 28),
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
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Text('${item['daysLeft']} Days', style: TextStyle(color: expirationColor, fontSize: 20, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                            const SizedBox(height: 2),
                            const Text('Remaining', style: TextStyle(color: Colors.white54, fontSize: 11, fontWeight: FontWeight.w600)),
                          ],
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
