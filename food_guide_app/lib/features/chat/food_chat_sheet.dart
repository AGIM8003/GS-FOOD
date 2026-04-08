import 'package:flutter/material.dart';

class FoodChatSheet extends StatefulWidget {
  const FoodChatSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).colorScheme.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => const FoodChatSheet(),
    );
  }

  @override
  State<FoodChatSheet> createState() => _FoodChatSheetState();
}

class _FoodChatSheetState extends State<FoodChatSheet> {
  final TextEditingController _controller = TextEditingController();
  final List<String> _messages = [
    'GS FOOD: Hi! I see you have some spinach expiring soon. Want to find a quick recipe, or do you have something else in mind?'
  ];

  void _sendMessage(String text) {
    if (text.trim().isEmpty) return;
    setState(() {
      _messages.add('USER: $text');
      _controller.clear();
      // Mock response
      _messages.add('GS FOOD: Okay, I am checking your pantry for compatibility with "$text".');
    });
  }

  @override
  Widget build(BuildContext context) {
    final paddingBottom = MediaQuery.of(context).viewInsets.bottom;
    
    return Padding(
      padding: EdgeInsets.only(bottom: paddingBottom),
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.75,
        child: Column(
          children: [
            // Handle
            Center(
              child: Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade400,
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
            ),
            const Text('Ask GS FOOD', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const Divider(),
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: _messages.length,
                itemBuilder: (context, index) {
                  final msg = _messages[index];
                  final isUser = msg.startsWith('USER:');
                  return Align(
                    alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      margin: const EdgeInsets.symmetric(vertical: 4),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: isUser ? Theme.of(context).colorScheme.primaryContainer : Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(msg.replaceFirst(isUser ? 'USER: ' : 'GS FOOD: ', ''), 
                        style: TextStyle(color: isUser ? Theme.of(context).colorScheme.onPrimaryContainer : Colors.black87),
                      ),
                    ),
                  );
                },
              ),
            ),
            
            // Input Area
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: Theme.of(context).colorScheme.surface,
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    IconButton(icon: const Icon(Icons.camera_alt), onPressed: () {}),
                    IconButton(icon: const Icon(Icons.mic), onPressed: () {}),
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        decoration: InputDecoration(
                          hintText: 'What can I cook with...',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none,
                          ),
                          filled: true,
                          fillColor: Theme.of(context).colorScheme.surfaceContainerHighest,
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16),
                        ),
                        onSubmitted: _sendMessage,
                      ),
                    ),
                    IconButton(
                      icon: Icon(Icons.send, color: Theme.of(context).colorScheme.primary),
                      onPressed: () => _sendMessage(_controller.text),
                    ),
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}
