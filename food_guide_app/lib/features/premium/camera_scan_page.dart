import 'package:flutter/material.dart';
import '../../app/services.dart';
import '../../engine/models/user_preferences.dart';
import '../../engine/models/inventory_item.dart';

class CameraScanPage extends StatefulWidget {
  const CameraScanPage({super.key});

  @override
  State<CameraScanPage> createState() => _CameraScanPageState();
}

class _CameraScanPageState extends State<CameraScanPage> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  
  bool _isScanning = false;
  bool _showResult = false;
  bool _isCompliant = true;
  String _scanMessage = '';
  
  UserPreferences? _prefs;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this, 
      duration: const Duration(seconds: 2)
    )..repeat(reverse: true);
    
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    _prefs = await AppServices.preferences.load();
    setState(() {});
  }

  void _simulateScan(String itemName, List<String> tags) {
    if (_prefs == null) return;
    
    setState(() {
       _isScanning = true;
       _showResult = false;
    });

    Future.delayed(const Duration(seconds: 1), () {
       setState(() {
         _isScanning = false;
         _showResult = true;
       });
       _showCorrectionSheet(itemName == 'Null' ? 'Fresh Milk' : itemName);
    });
  }

  void _showCorrectionSheet(String predictedName) {
    String name = predictedName;
    double qty = 1.0;
    StorageLocation loc = StorageLocation.fridge;
    bool isOpened = false;

    // Smart default location grouping
    if (name.toLowerCase().contains('pasta') || name.toLowerCase().contains('rice')) loc = StorageLocation.pantry;
    if (name.toLowerCase().contains('ice') || name.toLowerCase().contains('frozen')) loc = StorageLocation.freezer;
    if (name.toLowerCase().contains('spice') || name.toLowerCase().contains('salt')) loc = StorageLocation.spiceRack;

    showModalBottomSheet(
      context: context,
      backgroundColor: const Color(0xFF151515),
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (ctx) {
        return StatefulBuilder(builder: (stCtx, setModalState) {
          return Padding(
            padding: EdgeInsets.only(bottom: MediaQuery.of(ctx).viewInsets.bottom, left: 16, right: 16, top: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('Verify Scanned Item', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                
                // Name
                TextField(
                  controller: TextEditingController(text: name)..selection = TextSelection.collapsed(offset: name.length),
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: 'Item Name',
                    labelStyle: const TextStyle(color: Colors.white54),
                    filled: true,
                    fillColor: const Color(0xFF080808),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                  ),
                  onChanged: (v) => name = v,
                ),
                const SizedBox(height: 16),

                // Quantity & Opened State
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        keyboardType: TextInputType.number,
                        controller: TextEditingController(text: qty.toString()),
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          labelText: 'Quantity',
                          labelStyle: const TextStyle(color: Colors.white54),
                          filled: true,
                          fillColor: const Color(0xFF080808),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide.none),
                        ),
                        onChanged: (v) => qty = double.tryParse(v) ?? 1.0,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Row(
                        children: [
                          const Text('Opened?', style: TextStyle(color: Colors.white54)),
                          Switch(
                            value: isOpened,
                            activeColor: const Color(0xFF00FF66),
                            onChanged: (v) => setModalState(() => isOpened = v),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Smart Location
                const Text('Storage Location', style: TextStyle(color: Colors.white54, fontSize: 12)),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 8, runSpacing: 8,
                  children: StorageLocation.values.map((l) {
                    final isSelected = loc == l;
                    return ChoiceChip(
                      label: Text(l.displayName),
                      selected: isSelected,
                      selectedColor: const Color(0xFF00FF66),
                      backgroundColor: Colors.white12,
                      onSelected: (v) { if (v) setModalState(() => loc = l); },
                    );
                  }).toList(),
                ),
                const SizedBox(height: 24),

                // Save
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00FF66), padding: const EdgeInsets.symmetric(vertical: 16)),
                    onPressed: () async {
                      final item = InventoryItem(
                        id: DateTime.now().millisecondsSinceEpoch.toString(),
                        name: name,
                        quantity: qty,
                        opened: isOpened,
                        storageLocation: loc,
                        addedAt: DateTime.now(),
                        expiryDate: DateTime.now().add(const Duration(days: 7)), // Dummy generic expiry
                      );
                      await AppServices.inventory.addItem(item);
                      if (mounted) {
                        Navigator.pop(ctx);
                        setState(() { _showResult = false; });
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                          content: Text('$name added to ${loc.displayName}.'),
                          backgroundColor: const Color(0xFF00FF66),
                        ));
                      }
                    },
                    child: const Text('Confirm & Save to Pantry', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                  ),
                ),
                const SizedBox(height: 16),
              ],
            ),
          );
        });
      }
    );
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Mock Camera View
          Container(
            decoration: const BoxDecoration(
              image: DecorationImage(
                image: NetworkImage('https://images.unsplash.com/photo-1588693721996-03c0048af908?q=80&w=600&auto=format&fit=crop'), // Placeholder fridge/pantry
                fit: BoxFit.cover,
                opacity: 0.6,
              )
            ),
          ),
          
          // Scanning UI overlay
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white, size: 32),
                        onPressed: () => Navigator.pop(context),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                        child: const Text('AUTO-SCAN ACTIVE', style: TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold, letterSpacing: 1)),
                      ),
                      const SizedBox(width: 48), // balance
                    ],
                  ),
                ),
                Expanded(
                  child: Center(
                    child: _showResult 
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.check_circle,
                              color: const Color(0xFF00FF66),
                              size: 120,
                              shadows: const [
                                BoxShadow(color: Color(0xFF00FF66), blurRadius: 40)
                              ],
                            ),
                            const SizedBox(height: 24),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                              decoration: BoxDecoration(
                                color: const Color(0xFF00FF66).withOpacity(0.1),
                                border: Border.all(color: const Color(0xFF00FF66)),
                                borderRadius: BorderRadius.circular(16)
                              ),
                              child: const Text(
                                'SCANNED',
                                style: TextStyle(color: Color(0xFF00FF66), fontSize: 28, fontWeight: FontWeight.bold, letterSpacing: 2),
                              ),
                            ),
                            const SizedBox(height: 16),
                            const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 32),
                              child: Text('Item successfully verified.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white, fontSize: 16)),
                            ),
                            const SizedBox(height: 32),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.white12),
                              onPressed: () => setState(() => _showResult = false),
                              child: const Text('Scan Another', style: TextStyle(color: Colors.white)),
                            )
                          ],
                        )
                      : AnimatedBuilder(
                      animation: _animController,
                      builder: (context, child) {
                        return Container(
                          width: 250,
                          height: 250,
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: _isScanning 
                                  ? const Color(0xFFFF8C00) 
                                  : const Color(0xFF00FF66).withOpacity(0.5 + (_animController.value * 0.5)),
                              width: _isScanning ? 4 : 2,
                            ),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Stack(
                            children: [
                              Positioned(
                                top: _animController.value * 250,
                                left: 0,
                                right: 0,
                                child: Container(
                                  height: _isScanning ? 8 : 2,
                                  color: _isScanning ? const Color(0xFFFF8C00) : const Color(0xFF00FF66),
                                  boxShadow: [
                                    BoxShadow(
                                      color: _isScanning ? const Color(0xFFFF8C00) : const Color(0xFF00FF66), 
                                      blurRadius: 10, spreadRadius: 2)
                                  ]
                                ),
                              )
                            ],
                          ),
                        );
                      }
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(32),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Colors.black, Colors.black.withOpacity(0.0)],
                    )
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.document_scanner, color: Colors.white, size: 48),
                      const SizedBox(height: 16),
                      const Text('Point at ingredients or receipts', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      const Text('Computer vision will automatically identify and log items to your pantry. Compliance interceptors are ACTIVE.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.white12, foregroundColor: Colors.white38),
                            icon: const Icon(Icons.edit),
                            label: const Text('Manual Entry (Correction)'),
                            onPressed: _showResult || _isScanning ? null : () => _simulateScan('Null', []),
                          ),
                        ],
                      )
                    ],
                  ),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
