import 'dart:ui';
import 'package:flutter/material.dart';

import '../plan/plan_page.dart';
import 'shop_page.dart';

/// The V4 Blueprint Fulfillment Loop.
/// Merges Meal Planning and Shopping into an automated predictive cycle.
class FulfillmentShell extends StatefulWidget {
  const FulfillmentShell({super.key});

  @override
  State<FulfillmentShell> createState() => _FulfillmentShellState();
}

class _FulfillmentShellState extends State<FulfillmentShell> {
  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: const Color(0xFF000000),
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          toolbarHeight: 0, // Hide the standard app bar space
          bottom: const TabBar(
            indicatorColor: Color(0xFF00FF66),
            labelColor: Color(0xFF00FF66),
            unselectedLabelColor: Colors.white54,
            dividerColor: Colors.white12,
            tabs: [
              Tab(icon: Icon(Icons.shopping_basket), text: 'SHOPPING ROUNDS'),
              Tab(icon: Icon(Icons.calendar_month), text: 'MEAL PLANS'),
            ],
          ),
        ),
        body: const TabBarView(
          children: [
            ShopPage(),
            PlanPage(),
          ],
        ),
      ),
    );
  }
}
