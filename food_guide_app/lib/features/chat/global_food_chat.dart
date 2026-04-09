import 'dart:ui';
import 'package:flutter/material.dart';

class GlobalFoodChat extends StatelessWidget {
  const GlobalFoodChat({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const GlobalFoodChat(),
    );
  }

  @override
  Widget build(BuildContext context) {
    // Fill almost 90% of screen to simulate a true chat engine overlay
    final height = MediaQuery.of(context).size.height * 0.85;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: height,
          color: Colors.black.withOpacity(0.85), // Very dark frosted glass
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
              ),
              const Text('Food Chat', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const Divider(color: Colors.white12),

              // Chat history mock
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    _buildMessageBubble(true, 'What can I cook tonight?'),
                    _buildMessageBubble(false, 'Based on your pantry, you have Spinach expiring in 2 days. I highly recommend making a **Spinach & Feta Omelet**. Would you like me to start the cooking instructions?'),
                    
                    // Quick Action Chips in Chat
                    const SizedBox(height: 12),
                    Wrap(
                      spacing: 8,
                      children: [
                        _buildActionChip('Start Cooking'),
                        _buildActionChip('Why this?'),
                        _buildActionChip('Substitute Feta'),
                      ],
                    )
                  ],
                ),
              ),

              // Input Area
              Container(
                padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 16, left: 16, right: 16, top: 16),
                decoration: const BoxDecoration(
                  color: Colors.black,
                  border: Border(top: BorderSide(color: Colors.white12)),
                ),
                child: Row(
                  children: [
                    IconButton(icon: const Icon(Icons.camera_alt, color: Colors.blueAccent), onPressed: () {}),
                    Expanded(
                      child: TextField(
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Type or speak...',
                          hintStyle: const TextStyle(color: Colors.white38),
                          filled: true,
                          fillColor: Colors.white.withOpacity(0.05),
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                      ),
                    ),
                    IconButton(icon: const Icon(Icons.mic, color: Colors.orange), onPressed: () {}),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(bool isUser, String text) {
    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isUser ? Colors.blueAccent.withOpacity(0.2) : Colors.white.withOpacity(0.05),
          borderRadius: BorderRadius.circular(20).copyWith(
            bottomRight: isUser ? const Radius.circular(0) : const Radius.circular(20),
            bottomLeft: isUser ? const Radius.circular(20) : const Radius.circular(0),
          ),
          border: Border.all(color: isUser ? Colors.blueAccent : Colors.white12),
        ),
        child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 14)),
      ),
    );
  }

  Widget _buildActionChip(String text) {
    return ActionChip(
      backgroundColor: Colors.white.withOpacity(0.1),
      label: Text(text, style: const TextStyle(color: Colors.white, fontSize: 12)),
      onPressed: () {},
    );
  }
}
