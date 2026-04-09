import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../chat/food_chat_sheet.dart';
import '../../core/i18n.dart';

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: I18n.currentLanguage,
      builder: (context, lang, child) {
        // Phase 3: Responsive Mobile Fortification
        final screenWidth = MediaQuery.of(context).size.width;

        return Scaffold(
          backgroundColor: Colors.black, // Pure OLED Black
          appBar: AppBar(
            title: Text(I18n.get('storage.title'), style: const TextStyle(color: Colors.white, fontSize: 20)),
            elevation: 0,
            backgroundColor: Colors.transparent,
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Spatial Unified Storage Search
                  InkWell(
                    onTap: () {
                      HapticFeedback.lightImpact(); 
                      FoodChatSheet.show(context);
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(16),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.05),
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: Colors.white.withOpacity(0.1)),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.kitchen, color: Colors.blue.shade300),
                              const SizedBox(width: 12),
                              Expanded(child: Text(I18n.get('storage.search'), style: const TextStyle(color: Colors.white70), maxLines: 1, overflow: TextOverflow.ellipsis)),
                              Icon(Icons.camera_alt, color: Colors.blue.shade300),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Wrap instead of Row for Mobile Layout Fortification
                  Wrap(
                    spacing: 8.0,
                    runSpacing: 12.0,
                    children: [
                      _QuickActionChip(icon: Icons.camera, label: I18n.get('storage.camera'), color: Colors.blue.shade900),
                      _QuickActionChip(icon: Icons.qr_code_scanner, label: 'Scan Barcode', color: Colors.indigo.shade900),
                      _QuickActionChip(icon: Icons.inventory_2, label: 'Manual Entry', color: Colors.cyan.shade900),
                    ],
                  ),
                  
                  const SizedBox(height: 32),
                  const Text('Fridge Environments', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                  const SizedBox(height: 12),
                  
                  // Responsive Grid instead of fixed Horizontal List
                  GridView.count(
                    crossAxisCount: screenWidth > 600 ? 4 : 2, // PC vs Mobile adaptivity
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 1.1,
                    children: [
                      _EnvironmentCard(title: 'Crisper Drawer', count: 12, icon: Icons.grass, color: Colors.green),
                      _EnvironmentCard(title: 'Top Shelf', count: 5, icon: Icons.ac_unit, color: Colors.lightBlue),
                      _EnvironmentCard(title: 'Door Bins', count: 8, icon: Icons.egg, color: Colors.yellow),
                      _EnvironmentCard(title: 'Deep Freeze', count: 3, icon: Icons.severe_cold, color: Colors.teal),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      }
    );
  }
}

class _EnvironmentCard extends StatelessWidget {
  final String title;
  final int count;
  final IconData icon;
  final MaterialColor color;

  const _EnvironmentCard({required this.title, required this.count, required this.icon, required this.color});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: () => HapticFeedback.selectionClick(),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(16),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
          child: Container(
            padding: const EdgeInsets.all(12.0),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: color.withOpacity(0.4)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, color: color.shade300, size: 32),
                const Spacer(),
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13)),
                Text('$count items', style: TextStyle(color: color.shade200, fontSize: 11)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class _QuickActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;

  const _QuickActionChip({required this.icon, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => HapticFeedback.selectionClick(),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.3),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.6)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min, // Vital for Wrap
          children: [
            Icon(icon, size: 18, color: Colors.white),
            const SizedBox(width: 8),
            Text(label, style: const TextStyle(fontWeight: FontWeight.w600, color: Colors.white)),
          ],
        ),
      ),
    );
  }
}
