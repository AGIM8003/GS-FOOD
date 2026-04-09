import 'dart:ui';
import 'package:flutter/material.dart';
import '../../app/services.dart';

class RecipeDetailSheet extends StatelessWidget {
  final Map<String, dynamic> result;
  final VoidCallback onSendToAppliance;

  const RecipeDetailSheet({
    super.key,
    required this.result,
    required this.onSendToAppliance,
  });

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(32),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 30, sigmaY: 30),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFF0D0D0D).withOpacity(0.85),
              borderRadius: BorderRadius.circular(32),
              border: Border.all(color: const Color(0xFFFF8C00).withOpacity(0.5), width: 1.5),
              boxShadow: const [
                BoxShadow(color: Color(0x33FF8C00), blurRadius: 40, spreadRadius: 5)
              ]
            ),
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  // Flavor DNA Header
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'FLAVOR DNA SYNTHESIZED',
                        style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2.0),
                      ),
                      const Icon(Icons.science, color: Color(0xFFFF8C00), size: 16),
                    ],
                  ),
                  const SizedBox(height: 12),
                  
                  // Title
                  Text(
                    result['title'] ?? 'Synthesized Recipe',
                    style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.w900, letterSpacing: -1.0, height: 1.1),
                  ),
                  const SizedBox(height: 24),

                  // Chemistry Metrics (Mock Flavor DNA Data)
                  Row(
                    children: [
                      Expanded(child: _buildMetricCard('SAVORY UMAMI', 'HIGH', const Color(0xFFFF8C00))),
                      const SizedBox(width: 8),
                      Expanded(child: _buildMetricCard('SALT BALANCE', 'OPTIMAL', const Color(0xFF00FF66))),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Ingredients Section
                  Text('REQUIRED COMPONENTS', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: ((result['ingredientList'] as List?) ?? []).map((i) => Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.05),
                        border: Border.all(color: Colors.white.withOpacity(0.1)),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(i.toString(), style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w600)),
                    )).toList()
                  ),
                  const SizedBox(height: 32),

                  // Execution Steps
                  Text('EXECUTION PROTOCOL', style: TextStyle(color: Colors.white.withOpacity(0.5), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1.5)),
                  const SizedBox(height: 16),
                  ...List.generate((result['instructions'] as List?)?.length ?? 0, (index) {
                    final inst = result['instructions'][index];
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 16.0),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('${inst['step']}', style: const TextStyle(color: Color(0xFFFF8C00), fontSize: 16, fontWeight: FontWeight.w900)),
                          const SizedBox(width: 16),
                          Expanded(child: Text('${inst['text']}', style: const TextStyle(color: Colors.white70, fontSize: 14, height: 1.5))),
                        ],
                      ),
                    );
                  }),
                  
                  const SizedBox(height: 32),
                  
                  // Action Button
                  SizedBox(
                    width: double.infinity,
                    height: 56,
                    child: ElevatedButton.icon(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFFF8C00),
                        foregroundColor: Colors.black,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      ),
                      icon: const Icon(Icons.check_circle_outline),
                      label: const Text('MARK AS ACTIVE SESSION', style: TextStyle(fontWeight: FontWeight.black, fontSize: 14, letterSpacing: 1.0)),
                      onPressed: onSendToAppliance,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard(String label, String value, Color accent) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: accent.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: accent.withOpacity(0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.bubble_chart, size: 10, color: accent),
              const SizedBox(width: 4),
              Text(label, style: TextStyle(color: accent, fontSize: 8, fontWeight: FontWeight.bold, letterSpacing: 0.5)),
            ],
          ),
          const SizedBox(height: 8),
          Text(value, style: TextStyle(color: accent, fontSize: 16, fontWeight: FontWeight.w900)),
        ],
      ),
    );
  }
}
