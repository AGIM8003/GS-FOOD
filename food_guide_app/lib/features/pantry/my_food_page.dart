import 'dart:ui';
import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../engine/models/inventory_item.dart';

/// Production Pantry / My Food Page.
///
/// Replaces all mock inventory items with real data from InventoryRepository.
/// Implements Obsidian Gourmet glassmorphism design.
class MyFoodPage extends StatefulWidget {
  const MyFoodPage({super.key});

  @override
  State<MyFoodPage> createState() => _MyFoodPageState();
}

class _MyFoodPageState extends State<MyFoodPage> {
  List<InventoryItem> _items = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    // Real data fetch, ordered by urgency score
    final items = await AppServices.inventory.getAllByUrgency();
    if (mounted) {
      setState(() {
        _items = items;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000), // OLED Black
      appBar: AppBar(
        title: const Text('My Food & Storage', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        elevation: 0,
        backgroundColor: Colors.transparent,
      ),
      body: SafeArea(
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
            : _items.isEmpty
                ? _buildEmptyState()
                : ListView.builder(
                    padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
                    itemCount: _items.length,
                    itemBuilder: (context, index) {
                      final item = _items[index];
                      return _buildInventoryCard(item);
                    },
                  ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 64, color: Colors.white.withOpacity(0.2)),
          const SizedBox(height: 16),
          const Text('Your pantry is empty', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          const Text('Scan barcodes or take photos\nto add your groceries.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
        ],
      ),
    );
  }

  Widget _buildInventoryCard(InventoryItem item) {
    Color getStatusColor() {
      switch (item.freshness) {
        case FreshnessState.expired:
        case FreshnessState.critical:
          return const Color(0xFFFF3333); // Urgent Red
        case FreshnessState.warning:
          return const Color(0xFFFF8C00); // Warning Orange
        case FreshnessState.fresh:
          return const Color(0xFF00FF66); // Fresh Green
        case FreshnessState.unknown:
          return Colors.white54;
      }
    }

    final color = getStatusColor();
    final isUrgent = item.isUrgent;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16.0),
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF111111), // Glassmorphism base
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isUrgent ? color.withOpacity(0.5) : Colors.white.withOpacity(0.08), 
            width: isUrgent ? 2.0 : 1.0
          ),
          boxShadow: isUrgent ? [
            BoxShadow(color: color.withOpacity(0.1), blurRadius: 20, spreadRadius: 1)
          ] : [],
        ),
        padding: const EdgeInsets.all(20.0),
        child: Row(
          children: [
            Container(
              height: 56, width: 56,
              decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
              child: Icon(
                item.iconCodePoint != null ? IconData(item.iconCodePoint!, fontFamily: 'MaterialIcons') : Icons.kitchen, 
                color: color, 
                size: 28
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(item.name, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: -0.5)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.place_outlined, size: 14, color: Colors.blueGrey.shade300),
                      const SizedBox(width: 4),
                      Text(item.storageLocation.displayName, style: TextStyle(color: Colors.blueGrey.shade300, fontSize: 14, fontWeight: FontWeight.w500)),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(item.quantityDisplay, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                ],
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                if (item.daysRemaining != null) ...[
                  Text(item.daysRemaining! < 0 ? 'Expired' : '${item.daysRemaining}', 
                       style: TextStyle(color: color, fontSize: 24, fontWeight: FontWeight.w900, height: 1.0)),
                  Text(item.daysRemaining! < 0 ? 'Discard' : 'Days', 
                       style: const TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.w600)),
                ] else ...[
                  const Text('--', style: TextStyle(color: Colors.white54, fontSize: 24, fontWeight: FontWeight.w900, height: 1.0)),
                  const Text('No Date', style: TextStyle(color: Colors.white54, fontSize: 12, fontWeight: FontWeight.w600)),
                ]
              ],
            )
          ],
        ),
      ),
    );
  }
}
