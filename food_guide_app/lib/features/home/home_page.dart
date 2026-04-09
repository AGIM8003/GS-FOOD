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
        return Scaffold(
          backgroundColor: Colors.black, // Pure OLED Black
          appBar: AppBar(
            title: Text(I18n.get('home.greeting'), style: const TextStyle(color: Colors.white)),
            elevation: 0,
            backgroundColor: Colors.transparent,
          ),
          body: SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Spatial Unified Search/Chat (Glassmorphism)
                  InkWell(
                    onTap: () {
                      HapticFeedback.lightImpact(); // 2026 Compound Gesture Haptic Layer
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
                              Icon(Icons.search, color: Colors.orange.shade500),
                              const SizedBox(width: 12),
                              Text(I18n.get('home.searchPlaceholder'), style: const TextStyle(color: Colors.white70)),
                              const Spacer(),
                              Icon(Icons.camera_alt, color: Colors.orange.shade500),
                              const SizedBox(width: 8),
                              Icon(Icons.mic, color: Colors.orange.shade500),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 24),
                  
                  // Quick Actions
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _QuickActionChip(icon: Icons.kitchen, label: I18n.get('home.action.cook'), color: Colors.orange.shade900),
                        _QuickActionChip(icon: Icons.timer, label: I18n.get('home.action.plan'), color: Colors.blue.shade900),
                        _QuickActionChip(icon: Icons.favorite, label: I18n.get('home.action.rescue'), color: Colors.red.shade900),
                      ],
                    ),
                  ),
                  const SizedBox(height: 32),
                  
                  // Urgent Rescue (OLED High Contrast)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(I18n.get('home.expiringSoon'), style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: BackdropFilter(
                      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                      child: Container(
                        padding: const EdgeInsets.all(16.0),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.red.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.warning_amber_rounded, color: Colors.redAccent, size: 32),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Spinach', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                                  Text(I18n.get('home.expiringSub'), style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                                ],
                              ),
                            ),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.redAccent, 
                                foregroundColor: Colors.white,
                                elevation: 0,
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20))
                              ),
                              onPressed: () {
                                HapticFeedback.mediumImpact();
                              },
                              child: Text(I18n.get('home.action.rescue')),
                            )
                          ],
                        ),
                      ),
                    ),
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
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.3),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: color.withOpacity(0.6)),
        ),
        child: Row(
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
