import 'package:flutter/material.dart';
import '../../app/services.dart';

class SustainabilityPage extends StatefulWidget {
  const SustainabilityPage({super.key});

  @override
  State<SustainabilityPage> createState() => _SustainabilityPageState();
}

class _SustainabilityPageState extends State<SustainabilityPage> {
  Map<String, double> _stats = {'waste': 0.0, 'carbon': 0.0, 'money': 0.0};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadStats();
  }

  Future<void> _loadStats() async {
    final stats = await AppServices.sustainability.getAggregates();
    if (mounted) {
      setState(() {
        _stats = stats;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: AppBar(
        title: const Text('Impact Dashboard', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: _isLoading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFF00FF66)))
            : SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Your Lifecycle Savings', style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 16),
                    _buildStatCard(
                      'Food Waste Saved', 
                      '${_stats['waste']?.toStringAsFixed(1) ?? '0.0'} kg',
                      Icons.recycling,
                      const Color(0xFF00FF66),
                    ),
                    _buildStatCard(
                      'Carbon Neutralized', 
                      '${_stats['carbon']?.toStringAsFixed(1) ?? '0.0'} kg',
                      Icons.eco,
                      const Color(0xFF00BFFF),
                    ),
                    _buildStatCard(
                      'Money Saved', 
                      '\$${_stats['money']?.toStringAsFixed(2) ?? '0.00'}',
                      Icons.attach_money,
                      const Color(0xFFFF8C00),
                    ),
                    const SizedBox(height: 32),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: const Color(0xFF111111),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: Colors.white.withOpacity(0.08)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Global Community Impact', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 16),
                          Container(height: 100, color: Colors.white.withOpacity(0.05), alignment: Alignment.center, child: const Text('Impact Graph Visualization', style: TextStyle(color: Colors.white38))),
                        ],
                      ),
                    )
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildStatCard(String label, String value, IconData icon, Color color) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3), width: 1.5),
        boxShadow: [
          BoxShadow(color: color.withOpacity(0.05), blurRadius: 10, spreadRadius: 1)
        ]
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(color: color.withOpacity(0.15), shape: BoxShape.circle),
            child: Icon(icon, color: color, size: 32),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(value, style: TextStyle(color: color, fontSize: 28, fontWeight: FontWeight.w900)),
                Text(label, style: const TextStyle(color: Colors.white54, fontSize: 14, fontWeight: FontWeight.w600)),
              ],
            ),
          )
        ],
      ),
    );
  }
}
