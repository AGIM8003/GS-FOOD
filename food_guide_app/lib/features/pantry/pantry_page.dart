import 'dart:ui';
import 'package:flutter/material.dart';
import '../../app/services.dart';
import '../../engine/models/inventory_item.dart';
import '../../ui/golden_gourmet_scaffold.dart';
import '../../ui/sanctity_header.dart';

class PantryPage extends StatefulWidget {
  const PantryPage({super.key});

  @override
  State<PantryPage> createState() => _PantryPageState();
}

class _PantryPageState extends State<PantryPage> {
  List<InventoryItem> _items = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final items = await AppServices.inventory.getAll();
    
    // V4 Vitality Sort: Urgency first, then raw remaining days
    items.sort((a, b) {
      if (a.isUrgent && !b.isUrgent) return -1;
      if (!a.isUrgent && b.isUrgent) return 1;
      final remainingA = a.expectedShelfLifeDays - DateTime.now().difference(a.purchaseDate).inDays;
      final remainingB = b.expectedShelfLifeDays - DateTime.now().difference(b.purchaseDate).inDays;
      return remainingA.compareTo(remainingB);
    });

    if (mounted) {
      setState(() {
        _items = items;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const GoldenGourmetScaffold(
        backgroundColor: Colors.black,
        body: Center(child: CircularProgressIndicator(color: Color(0xFF00FF66))),
      );
    }

    return GoldenGourmetScaffold(
      backgroundColor: Colors.black,
      appBar: SanctityHeader(
        title: 'Real-Time Vitality',
        actions: [
          IconButton(icon: const Icon(Icons.tune, color: Colors.white54), onPressed: () {}),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 100),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'PANTRY MONITORING SYSTEM',
                style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2.0),
              ),
              const SizedBox(height: 24),
              
              GridView.builder(
                physics: const NeverScrollableScrollPhysics(),
                shrinkWrap: true,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.75,
                ),
                itemCount: _items.length,
                itemBuilder: (context, index) {
                  final item = _items[index];
                  return _buildVitalityCard(item);
                },
              ),
              
              if (_items.isEmpty)
                Center(
                  child: Padding(
                    padding: const EdgeInsets.all(32.0),
                    child: Text('Pantry is empty. Start scanning.', style: TextStyle(color: Colors.white.withOpacity(0.5))),
                  ),
                )
            ],
          ),
        ),
      ),
      // Navigation Shell handles the global FAB now.
    );
  }

  Widget _buildVitalityCard(InventoryItem item) {
    // Determine Freshness
    final now = DateTime.now();
    final totalDays = item.expectedShelfLifeDays.toDouble();
    final elapsed = now.difference(item.purchaseDate).inDays.toDouble();
    final remainingRatio = (1.0 - (elapsed / totalDays)).clamp(0.0, 1.0);
    
    // OLED Colors representing vitality
    final Color vitalityColor;
    final String statusText;
    
    if (item.isUrgent || remainingRatio < 0.2) {
      vitalityColor = const Color(0xFFFF3333); // Red
      statusText = 'RESCUE NOW';
    } else if (remainingRatio < 0.5) {
      vitalityColor = const Color(0xFFFF8C00); // Orange
      statusText = 'EXPIRING SOON';
    } else {
      vitalityColor = const Color(0xFF00FF66); // Green
      statusText = 'PEAK VITALITY';
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(20),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
        child: Container(
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.05),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: vitalityColor.withOpacity(0.3), width: item.isUrgent ? 2.0 : 1.0),
            boxShadow: [
               if (item.isUrgent) BoxShadow(color: vitalityColor.withOpacity(0.15), blurRadius: 20)
            ]
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Ring
              SizedBox(
                width: 80,
                height: 80,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Glow behind the ring
                    Container(
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        boxShadow: [
                          BoxShadow(color: vitalityColor.withOpacity(0.2), blurRadius: 15, spreadRadius: 2)
                        ]
                      ),
                    ),
                    CircularProgressIndicator(
                      value: remainingRatio,
                      strokeWidth: 6,
                      backgroundColor: Colors.white12,
                      valueColor: AlwaysStoppedAnimation<Color>(vitalityColor),
                      strokeCap: StrokeCap.round,
                    ),
                    Text(
                      '${(remainingRatio * 100).toInt()}%',
                      style: TextStyle(color: vitalityColor, fontSize: 18, fontWeight: FontWeight.bold),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 16),
              
              // Text Content
              Text(item.name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold, letterSpacing: -0.3), textAlign: TextAlign.center, maxLines: 1, overflow: TextOverflow.ellipsis),
              const SizedBox(height: 4),
              Text('${item.category.name.toUpperCase()} • ${item.quantity.toInt()}${item.unit}', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.0)),
              const Spacer(),
              
              // Status Pill
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: item.isUrgent ? vitalityColor : vitalityColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(statusText, style: TextStyle(color: item.isUrgent ? Colors.black : vitalityColor, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1.0)),
              )
            ],
          ),
        ),
      ),
    );
  }
}
