import 'package:flutter/material.dart';

import 'network_banner.dart';
import '../features/ask/ask_page.dart';
import '../features/audits/audits_page.dart';
import '../features/cook/cook_page.dart';
import '../features/saved/saved_page.dart';
import '../features/scan/scan_page.dart';
import '../features/settings/settings_page.dart';
import '../features/use_first/use_first_page.dart';

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
    () => const ScanPage(),
    () => const AskPage(),
    () => const CookPage(),
    () => const UseFirstPage(),
    () => const AuditsPage(),
    () => const SavedPage(),
    () => const SettingsPage(),
  ];

  static const _items = <_NavItem>[
    _NavItem('Scan', Icons.photo_camera_outlined, Icons.photo_camera),
    _NavItem('Ask', Icons.chat_bubble_outline, Icons.chat_bubble),
    _NavItem('Cook', Icons.restaurant_menu_outlined, Icons.restaurant_menu),
    _NavItem('Use first', Icons.priority_high_outlined, Icons.priority_high),
    _NavItem('Audits', Icons.fact_check_outlined, Icons.fact_check),
    _NavItem('Saved', Icons.bookmark_outline, Icons.bookmark),
    _NavItem('Settings', Icons.settings_outlined, Icons.settings),
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
