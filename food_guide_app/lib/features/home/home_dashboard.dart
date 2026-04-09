import 'dart:ui';
import 'package:flutter/material.dart';

class HomeDashboard extends StatelessWidget {
  const HomeDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black, // Dark mode default
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.only(left: 16, right: 16, top: 24, bottom: 120),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // HEADER
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Good Morning, Chef', style: TextStyle(color: Colors.white54, fontSize: 14)),
                      Text('Your Kitchen Status', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
                    ],
                  ),
                  CircleAvatar(
                    backgroundColor: Colors.grey.shade800,
                    child: const Icon(Icons.person, color: Colors.white),
                  ),
                ],
              ),
              const SizedBox(height: 32),

              // PRIMARY ALERT CARD
              _buildAlertCard(
                title: 'Expiring Today: Spinach',
                message: 'You have fresh spinach that should be used immediately to prevent waste.',
                icon: Icons.warning_amber_rounded,
                color: Colors.redAccent.shade400,
              ),

              const SizedBox(height: 24),

              // COOK TODAY
              const Text('Cook Today', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
              const SizedBox(height: 16),
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _buildCookCard('Spinach Omelet', 'Breakfast • 10m', '1 item missing', Colors.orangeAccent),
                    _buildCookCard('Chicken Salad', 'Lunch • 15m', 'All available', Colors.greenAccent),
                    _buildCookCard('Beef Stir-fry', 'Dinner • 25m', '2 items missing', Colors.blueAccent),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // QUICK CAPTURE ROW
              const Text('Quick Add', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w800)),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildQuickAction(Icons.camera_alt, 'Photo'),
                  _buildQuickAction(Icons.qr_code_scanner, 'Barcode'),
                  _buildQuickAction(Icons.receipt_long, 'Receipt'),
                  _buildQuickAction(Icons.edit, 'Manual'),
                ],
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAlertCard({required String title, required String message, required IconData icon, required Color color}) {
    return Container(
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        border: Border.all(color: color.withOpacity(0.5), width: 1.5),
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.all(20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 36),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                const SizedBox(height: 6),
                Text(message, style: const TextStyle(color: Colors.white70, fontSize: 14)),
                const SizedBox(height: 12),
                ElevatedButton(
                  style: ElevatedButton.styleFrom(backgroundColor: color, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10))),
                  onPressed: () {},
                  child: const Text('Rescue Now', style: TextStyle(fontWeight: FontWeight.bold)),
                )
              ],
            ),
          )
        ],
      ),
    );
  }

  Widget _buildCookCard(String title, String subtitle, String status, Color accent) {
    return Container(
      margin: const EdgeInsets.only(right: 16),
      width: 160,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.05),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.1)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(Icons.restaurant, color: accent, size: 28),
          const SizedBox(height: 16),
          Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 4),
          Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 12)),
          const SizedBox(height: 8),
          Text(status, style: TextStyle(color: status.contains('missing') ? Colors.orange : Colors.green, fontSize: 11, fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }

  Widget _buildQuickAction(IconData icon, String label) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold)),
      ],
    );
  }
}
