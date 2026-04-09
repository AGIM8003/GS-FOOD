import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'dart:ui';
import 'dart:async';

import 'network_banner.dart';
import '../../core/i18n.dart';
import '../features/home/home_page.dart';  // Now acting as Storage/Environment
import '../features/cook/cook_page.dart';
import '../features/profile/profile_page.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;
  bool _gpsPopTriggered = false;

  static final _pages = <Widget Function()>[
    () => const HomePage(), // Dedicated to Storage & Camera Fridge
    () => const CookPage(), // Dedicated to AI Recipes
    () => const ProfilePage(), // Settings & Cuisines
  ];

  @override
  void initState() {
    super.initState();
    // Phase 4: GPS Automated Popping Up
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!_gpsPopTriggered) {
        _triggerAutomatedGPS();
        _gpsPopTriggered = true;
      }
    });
  }

  void _triggerAutomatedGPS() {
    // Mock Automated GPS for Web/Replit Fallback
    Timer(const Duration(seconds: 2), () {
      HapticFeedback.heavyImpact();
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          backgroundColor: Colors.black.withOpacity(0.9),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: BorderSide(color: Colors.white.withOpacity(0.1))
          ),
          title: Row(
            children: [
              const Icon(Icons.my_location, color: Colors.orange),
              const SizedBox(width: 8),
              Expanded(child: Text(I18n.get('cook.gps.locating'), style: const TextStyle(color: Colors.white, fontSize: 16))),
            ],
          ),
          content: const Text(
            'Regional GPS locked: Mediterranean Influence detected. Kitchen preferences have been temporarily adapted to local constraints.',
            style: TextStyle(color: Colors.white70)
          ),
          actions: [
            TextButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                Navigator.of(context).pop();
              },
              child: Text(I18n.get('common.ok'), style: const TextStyle(color: Colors.orange)),
            )
          ],
        ),
      );
    });
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: I18n.currentLanguage,
      builder: (context, lang, child) {
        final _items = <_NavItem>[
          _NavItem(I18n.get('storage.title'), Icons.kitchen_outlined, Icons.kitchen),
          _NavItem(I18n.get('cook.title'), Icons.restaurant_menu_outlined, Icons.restaurant_menu),
          _NavItem(I18n.get('profile.title'), Icons.person_outline, Icons.person),
        ];

        return Scaffold(
          extendBody: true, 
          body: NetworkBanner(child: _pages[_index]()),
          bottomNavigationBar: SafeArea(
            child: Container(
              margin: const EdgeInsets.only(left: 24, right: 24, bottom: 16),
              height: 72,
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.5), 
                borderRadius: BorderRadius.circular(36), 
                border: Border.all(color: Colors.white.withOpacity(0.05), width: 1.5),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(36),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 20.0, sigmaY: 20.0), 
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      for (var i = 0; i < _items.length; i++)
                        _buildNavItem(i, _items[i], _items),
                    ],
                  ),
                ),
              ),
            ),
          ),
        );
      }
    );
  }

  Widget _buildNavItem(int i, _NavItem item, List<_NavItem> allItems) {
    final isSelected = _index == i;
    final color = isSelected ? Colors.orange.shade400 : Colors.white54;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () {
        HapticFeedback.lightImpact();
        setState(() => _index = i);
      },
      child: Center(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: isSelected
              ? BoxDecoration(
                  color: Colors.orange.shade400.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(24),
                )
              : null,
          child: Row(
            children: [
              Icon(isSelected ? item.activeIcon : item.icon, color: color, size: isSelected ? 28 : 24),
              if (isSelected) ...[
                const SizedBox(width: 8),
                Text(item.label, style: TextStyle(color: color, fontWeight: FontWeight.bold, fontSize: 12))
              ]
            ],
          ),
        ),
      ),
    );
  }
}

class _NavItem {
  const _NavItem(this.label, this.icon, this.activeIcon);
  final String label;
  final IconData icon;
  final IconData activeIcon;
}
