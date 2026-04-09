import 'dart:ui';
import 'package:flutter/material.dart';

class ShopPage extends StatelessWidget {
  const ShopPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // OLED Master
      appBar: AppBar(
        title: const Text('Shopping Lists', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(bottom: 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
               Padding(
                 padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                 child: Row(
                   mainAxisAlignment: MainAxisAlignment.spaceBetween,
                   children: [
                     const Text('Scheduled Waves', style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
                     TextButton.icon(
                       onPressed: () {}, 
                       icon: const Icon(Icons.add, color: Colors.blueAccent),
                       label: const Text('Add Item', style: TextStyle(color: Colors.blueAccent)),
                     )
                   ],
                 ),
               ),
               
               _buildShoppingTripCard('Wave 1: Buy Now', ['Chicken Breast (3 lbs)', 'Fresh Spinach (1 bag)', 'Milk (1 gal)'], Colors.redAccent.shade400, 'Required for upcoming 3 days of meals.'),
               _buildShoppingTripCard('Wave 2: Mid-Month', ['Eggs (2 dozen)', 'Cheddar Cheese'], Colors.orangeAccent.shade400, 'Highly perishable; delay purchase to ensure freshness.'),
               _buildShoppingTripCard('Wave 3: Bulk Restock', ['Rice (10 lbs)', 'Pasta', 'Canned Tuna'], Colors.blueAccent.shade400, 'Stable goods. Wait for weekend sales.'),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildShoppingTripCard(String title, List<String> items, Color accentColor, String whyLabel) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
          child: Container(
            padding: const EdgeInsets.all(24.0),
            decoration: BoxDecoration(
              color: Colors.white.withOpacity(0.04),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: accentColor.withOpacity(0.3), width: 1.5),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.shopping_cart_checkout, color: accentColor, size: 24),
                    const SizedBox(width: 12),
                    Text(title, style: TextStyle(color: accentColor, fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: -0.5)),
                  ],
                ),
                const SizedBox(height: 8),
                Text('Why this? $whyLabel', style: const TextStyle(color: Colors.white54, fontSize: 12, fontStyle: FontStyle.italic)),
                const SizedBox(height: 20),
                ...items.map((item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12.0),
                  child: Row(
                    children: [
                      Icon(Icons.radio_button_unchecked, color: Colors.white38, size: 22),
                      const SizedBox(width: 12),
                      Text(item, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.w600)),
                    ],
                  ),
                )).toList()
              ],
            ),
          ),
        ),
      ),
    );
  }
}
