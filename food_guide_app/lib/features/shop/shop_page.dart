import 'dart:ui';
import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../engine/models/shopping_item.dart';

/// Production Shopping Page.
///
/// Replaces static waves with dynamic waves computed from ShoppingWaveEngine
/// and backed by ShoppingRepository.
class ShopPage extends StatefulWidget {
  const ShopPage({super.key});

  @override
  State<ShopPage> createState() => _ShopPageState();
}

class _ShopPageState extends State<ShopPage> {
  Map<ShoppingWave, List<ShoppingItem>> _groupedItems = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final grouped = await AppServices.shopping.getGroupedByWave();
    if (mounted) {
      setState(() {
        _groupedItems = grouped;
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleItem(ShoppingItem item) async {
    await AppServices.shopping.toggleChecked(item.id);
    _loadData();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000), // OLED Black
      appBar: AppBar(
        title: const Text('Shopping Waves', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
            : SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: 120),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 12.0),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text('Scheduled Waves', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          TextButton.icon(
                            onPressed: () {}, 
                            icon: const Icon(Icons.add, color: Color(0xFF00FF66)),
                            label: const Text('Add Item', style: TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold)),
                          )
                        ],
                      ),
                    ),
                    
                    if (_groupedItems[ShoppingWave.buyNow]?.isNotEmpty ?? false)
                      _buildShoppingTripCard(
                        'Buy Now', 
                        _groupedItems[ShoppingWave.buyNow]!, 
                        const Color(0xFFFF3333), // Urgent Red
                        ShoppingWave.buyNow.description
                      ),
                      
                    if (_groupedItems[ShoppingWave.midWeek]?.isNotEmpty ?? false)
                      _buildShoppingTripCard(
                        'Mid-Week', 
                        _groupedItems[ShoppingWave.midWeek]!, 
                        const Color(0xFFFF8C00), // Mid Orange
                        ShoppingWave.midWeek.description
                      ),
                      
                    if (_groupedItems[ShoppingWave.bulkRestock]?.isNotEmpty ?? false)
                      _buildShoppingTripCard(
                        'Bulk Restock', 
                        _groupedItems[ShoppingWave.bulkRestock]!, 
                        const Color(0xFF00BFFF), // Stable Blue
                        ShoppingWave.bulkRestock.description
                      ),
                      
                    if (_groupedItems.values.every((l) => l.isEmpty))
                      const Padding(
                        padding: EdgeInsets.all(32.0),
                        child: Center(
                          child: Text(
                            'No shopping items scheduled. Check your meal plan or add items manually.',
                            style: TextStyle(color: Colors.white54),
                            textAlign: TextAlign.center,
                          )
                        ),
                      )
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildShoppingTripCard(String title, List<ShoppingItem> items, Color accentColor, String whyLabel) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 10.0),
      child: Container(
        padding: const EdgeInsets.all(24.0),
        decoration: BoxDecoration(
          color: const Color(0xFF111111),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: accentColor.withOpacity(0.3), width: 1.5),
          boxShadow: [
            BoxShadow(color: accentColor.withOpacity(0.05), blurRadius: 10, spreadRadius: 1)
          ]
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
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF080808),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.white.withOpacity(0.05))
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: accentColor.withOpacity(0.7), size: 14),
                  const SizedBox(width: 6),
                  Expanded(child: Text(whyLabel, style: const TextStyle(color: Colors.white70, fontSize: 12))),
                ],
              ),
            ),
            const SizedBox(height: 20),
            
            ...items.map((item) => Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: InkWell(
                onTap: () => _toggleItem(item),
                child: Row(
                  children: [
                    Icon(item.checked ? Icons.check_circle : Icons.radio_button_unchecked, 
                         color: item.checked ? const Color(0xFF00FF66) : Colors.white38, size: 24),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        '${item.name} ${item.displayQuantity.isNotEmpty ? "(${item.displayQuantity})" : ""}', 
                        style: TextStyle(
                          color: item.checked ? Colors.white38 : Colors.white, 
                          fontSize: 16, 
                          fontWeight: FontWeight.w600,
                          decoration: item.checked ? TextDecoration.lineThrough : null
                        )
                      ),
                    ),
                  ],
                ),
              ),
            )).toList()
          ],
        ),
      ),
    );
  }
}
