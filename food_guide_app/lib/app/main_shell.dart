import 'package:flutter/material.dart';

import 'network_banner.dart';
import '../features/cook/cook_page.dart';
import '../features/home/home_page.dart';
import '../features/pantry/pantry_page.dart';
import '../features/plan/plan_page.dart';
import '../features/profile/profile_page.dart';

/// Bottom navigation — GS-FOOD3 primary tabs (§17.3).
/// Only the active tab is built (avoids camera permission on every tab at once).
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
      body: NetworkBanner(child: _pages[_index]()),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        selectedItemColor: Theme.of(context).colorScheme.primary,
        unselectedItemColor: Theme.of(context).colorScheme.onSurfaceVariant,
        items: [
          for (var i = 0; i < _items.length; i++)
            BottomNavigationBarItem(
              icon: Icon(_items[i].icon),
              activeIcon: Icon(_items[i].activeIcon),
              label: _items[i].label,
            ),
        ],
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
