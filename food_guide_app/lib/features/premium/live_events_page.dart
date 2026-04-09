import 'dart:ui';
import 'package:flutter/material.dart';

class LiveEventsPage extends StatelessWidget {
  const LiveEventsPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: AppBar(
        title: const Text('Live Kitchen', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.white),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: const Color(0xFF0D0D0D),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFF00FF66).withOpacity(0.5), width: 2),
                image: const DecorationImage(
                  image: NetworkImage('https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=600&auto=format&fit=crop'), // Placeholder kitchen image
                  fit: BoxFit.cover,
                  opacity: 0.3,
                )
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Container(
                     padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                     decoration: BoxDecoration(color: const Color(0xFF00FF66).withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                     child: const Row(
                       mainAxisSize: MainAxisSize.min,
                       children: [
                         Icon(Icons.circle, color: Color(0xFF00FF66), size: 10),
                         SizedBox(width: 6),
                         Text('LIVE NOW', style: TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1)),
                       ],
                     ),
                   ),
                   const SizedBox(height: 16),
                   const Text('Mastering Omelets with Chef Antonio', style: TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, height: 1.1)),
                   const SizedBox(height: 8),
                   const Text('Learn the secret to the perfect fold using rescued herbs from your pantry.', style: TextStyle(color: Colors.white70)),
                   const SizedBox(height: 24),
                   SizedBox(
                     width: double.infinity,
                     child: ElevatedButton(
                       style: ElevatedButton.styleFrom(
                         backgroundColor: const Color(0xFF00FF66),
                         foregroundColor: Colors.black,
                         padding: const EdgeInsets.symmetric(vertical: 16),
                         shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                       ),
                       onPressed: () {},
                       child: const Text('JOIN SESSION', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1)),
                     ),
                   )
                ],
              ),
            ),
            const SizedBox(height: 24),
            const Text('Upcoming Masterclasses', style: TextStyle(color: Colors.white70, fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            _buildUpcomingCard('Knife Skills 101', 'Tomorrow • 6:00 PM'),
            _buildUpcomingCard('Wine Pairing Basics', 'Friday • 7:00 PM'),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingCard(String title, String time) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF111111),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withOpacity(0.05)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
              const SizedBox(height: 4),
              Text(time, style: const TextStyle(color: Colors.white54, fontSize: 14)),
            ],
          ),
          const Icon(Icons.notifications_none, color: Colors.white54),
        ],
      ),
    );
  }
}
