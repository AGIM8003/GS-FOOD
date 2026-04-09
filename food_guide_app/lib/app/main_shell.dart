import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import 'network_banner.dart';
import '../../core/i18n.dart';
import '../features/home/home_dashboard.dart';
import '../features/pantry/pantry_page.dart';
import '../features/cook/cook_page.dart';
import '../features/chat/global_food_chat.dart';
import '../features/shop/fulfillment_shell.dart';

class MainShell extends StatefulWidget {
  const MainShell({super.key});

  @override
  State<MainShell> createState() => _MainShellState();
}

class _MainShellState extends State<MainShell> {
  int _index = 0;

  static final _pages = <Widget Function()>[
    () => const HomeDashboard(),
    () => const PantryPage(),
    () => const CookPage(),
    () => const FulfillmentShell(),
  ];

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<String>(
      valueListenable: I18n.currentLanguage,
      builder: (context, lang, child) {
        final _items = <_NavItem>[
          _NavItem('Command', Icons.space_dashboard_outlined, Icons.space_dashboard),
          _NavItem('Pantry', Icons.kitchen_outlined, Icons.kitchen),
          _NavItem('Cook', Icons.restaurant_menu_outlined, Icons.restaurant_menu),
          _NavItem('Fulfill', Icons.receipt_long_outlined, Icons.receipt_long),
        ];

        return Scaffold(
          extendBody: true, 
          body: NetworkBanner(child: _pages[_index]()),
          
          floatingActionButton: SizedBox(
            height: 64, width: 64,
            child: FloatingActionButton(
               backgroundColor: const Color(0xFF00FF66),
               elevation: 8,
               shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
               child: const Icon(Icons.center_focus_weak, color: Colors.black, size: 32),
               onPressed: () {
                 HapticFeedback.heavyImpact();
                 GlobalFoodChat.show(context);
               },
            ),
          ),
          floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
          
          bottomNavigationBar: BottomAppBar(
            color: Colors.black.withOpacity(0.9),
            shape: const CircularNotchedRectangle(),
            notchMargin: 8.0,
            child: SizedBox(
              height: 60,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildNavItem(0, _items[0]),
                  _buildNavItem(1, _items[1]),
                  const SizedBox(width: 64), // Omni-Capture FAB gap
                  _buildNavItem(2, _items[2]),
                  _buildNavItem(3, _items[3]),
                ],
              ),
            ),
          ),
        );
      }
    );
  }

  Widget _buildNavItem(int i, _NavItem item) {
    // If it's the 3rd or 4th item, we shift them to account for the center gap
    // Actually using MainAxisAlignment.spaceAround with a SizedBox spacer is easier since there are 5 items + 1 spacer.
    // Let's refine the spacing:
    // Items: 0, 1, Center Gap, 2, 3, 4 -> 6 slots total. Wait, Row with SpaceAround is fine for now but SpaceBetween or custom widths is better.
    // For now, exact mapping:
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          HapticFeedback.lightImpact();
          setState(() => _index = i);
        },
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(_index == i ? item.activeIcon : item.icon, color: _index == i ? Colors.white : Colors.white54, size: 24),
            const SizedBox(height: 4),
            Text(item.label, style: TextStyle(color: _index == i ? Colors.white : Colors.white54, fontSize: 10, fontWeight: _index == i ? FontWeight.bold : FontWeight.normal)),
          ],
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
