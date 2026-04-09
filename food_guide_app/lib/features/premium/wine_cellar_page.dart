import 'package:flutter/material.dart';
import '../../app/services.dart';
import '../../engine/models/premium_models.dart';

class WineCellarPage extends StatefulWidget {
  const WineCellarPage({super.key});

  @override
  State<WineCellarPage> createState() => _WineCellarPageState();
}

class _WineCellarPageState extends State<WineCellarPage> {
  List<WineCellarItem> _wines = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final wines = await AppServices.wine.getAll();
    if (mounted) {
      setState(() {
        _wines = wines;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: AppBar(
        title: const Text('Wine & Beverage Cellar', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
        actions: [
          IconButton(icon: const Icon(Icons.add, color: Color(0xFF00FF66)), onPressed: () {}),
        ],
      ),
      body: SafeArea(
        child: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
            : _wines.isEmpty
                ? const Center(child: Text('Your cellar is empty.', style: TextStyle(color: Colors.white54)))
                : ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _wines.length,
                    itemBuilder: (context, index) {
                      final w = _wines[index];
                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: const Color(0xFF111111),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.white.withOpacity(0.1)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              height: 60, width: 40,
                              decoration: BoxDecoration(color: const Color(0xFF581845), borderRadius: BorderRadius.circular(8)),
                              child: const Icon(Icons.wine_bar, color: Colors.white70),
                            ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(w.name, style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                                  Text('${w.vintage} • ${w.region}', style: const TextStyle(color: Colors.white54, fontSize: 12)),
                                  const SizedBox(height: 8),
                                  Text('Pairs with: ${w.pairingNotes}', style: const TextStyle(color: Color(0xFF00FF66), fontSize: 12, fontStyle: FontStyle.italic)),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}
