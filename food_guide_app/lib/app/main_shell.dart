import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'dart:ui';

import 'network_banner.dart';
import '../features/cook/cook_page.dart';
import '../features/home/home_page.dart';
import '../features/pantry/pantry_page.dart';
import '../features/plan/plan_page.dart';
import '../features/profile/profile_page.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static final _pages = <Widget Function()>[
    () => const HomePage(),
    () => const CookPage(),
    () => const PantryPage(),
    () => const PlanPage(),
    () => const ProfilePage(),
  ];

  static const _items = <_NavItem>[
    _NavItem('Home', Icons.home_outlined, Icons.home),
    _NavItem('Cook', Icons.restaurant_menu_outlined, Icons.restaurant_menu),
    _NavItem('Pantry', Icons.kitchen_outlined, Icons.kitchen),
    _NavItem('Plan', Icons.calendar_today_outlined, Icons.calendar_today),
    _NavItem('Profile', Icons.person_outline, Icons.person),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      extendBody: true, // Necessary to push content under the floating bar
      body: NetworkBanner(child: _pages[_index]()),
      bottomNavigationBar: SafeArea(
        child: Container(
          margin: const EdgeInsets.only(left: 24, right: 24, bottom: 16),
          height: 72,
          decoration: BoxDecoration(
            color: Colors.black.withOpacity(0.5), // NOOR Glassmorphism Base
            borderRadius: BorderRadius.circular(36), // Fully rounded Pill
            border: Border.all(color: Colors.white.withOpacity(0.05), width: 1.5),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.3),
                blurRadius: 20,
                offset: const Offset(0, 10),
              )
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(36),
            child: BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 20.0, sigmaY: 20.0), // Deep Frost
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  for (var i = 0; i < _items.length; i++)
                    _buildNavItem(i, _items[i]),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildNavItem(int i, _NavItem item) {
    final isSelected = _index == i;
    final color = isSelected ? Theme.of(context).colorScheme.primary : Colors.white54;
    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: () => setState(() => _index = i),
      child: Center(
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOutCubic,
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          decoration: isSelected
              ? BoxDecoration(
                  color: Theme.of(context).colorScheme.primary.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(24),
                )
              : null,
          child: Icon(
            isSelected ? item.activeIcon : item.icon,
            color: color,
            size: isSelected ? 28 : 24, // NOOR fluid sizing
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
