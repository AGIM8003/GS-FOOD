import 'dart:ui';
import 'package:flutter/material.dart';

import '../../app/services.dart';
import '../../engine/ai/ai_orchestrator.dart';
import '../../engine/export/recipe_export_service.dart';
import '../../engine/models/shopping_item.dart';

class ChatMessage {
  ChatMessage({required this.text, required this.isUser, this.source, this.isThinking = false, this.structuredCards = const []});
  final String text;
  final bool isUser;
  final ResponseSource? source;
  final bool isThinking;
  final List<dynamic> structuredCards;
}

/// Production AI Chat Interface.
///
/// Connects to AIOrchestrator to provide real persona-driven responses
/// based on the user's kitchen inventory and preferences.
class GlobalFoodChat extends StatefulWidget {
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
  State<GlobalFoodChat> createState() => _GlobalFoodChatState();
}

class _GlobalFoodChatState extends State<GlobalFoodChat> {
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    _loadGreeting();
  }

  Future<void> _loadGreeting() async {
    final prefs = await AppServices.preferences.load();
    final persona = AppServices.personaEngine.getPersona(prefs.chefPersonaId);
    setState(() {
      _messages.add(ChatMessage(
        text: persona.greeting, 
        isUser: false,
        source: ResponseSource.deterministic,
      ));
    });
  }

  Future<void> _sendMessage(String text) async {
    if (text.trim().isEmpty) return;
    
    setState(() {
      _messages.add(ChatMessage(text: text, isUser: true));
      _isProcessing = true;
      _textController.clear();
      // Add thinking bubble
      _messages.add(ChatMessage(text: '...', isUser: false, isThinking: true));
    });
    
    _scrollToBottom();

    try {
      final inventory = await AppServices.inventory.getAll();
      final prefs = await AppServices.preferences.load();
      
      final response = await AppServices.aiOrchestrator.processMessage(
        userMessage: text,
        inventory: inventory,
        preferences: prefs,
      );

      if (mounted) {
        setState(() {
          // Remove thinking bubble
          _messages.removeLast();
          _messages.add(ChatMessage(
            text: response.text, 
            isUser: false,
            source: response.source,
            structuredCards: response.structuredCards,
          ));
          _isProcessing = false;
        });
        _scrollToBottom();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.removeLast();
          _messages.add(ChatMessage(
            text: 'I ran into a kitchen issue. Let\'s try that again.', 
            isUser: false,
            source: ResponseSource.deterministicFallback,
          ));
          _isProcessing = false;
        });
        _scrollToBottom();
      }
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
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
          color: const Color(0xFF000000).withOpacity(0.85), // Very dark frosted glass
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
              ),
              const Text('Chef Assistant', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const Divider(color: Colors.white12),

              // Chat history
              Expanded(
                child: ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: _messages.length,
                  itemBuilder: (context, index) {
                    final msg = _messages[index];
                    return _buildMessageBubble(msg);
                  },
                ),
              ),

              // Input Area
              Container(
                padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom + 16, left: 16, right: 16, top: 16),
                decoration: const BoxDecoration(
                  color: Color(0xFF000000),
                  border: Border(top: BorderSide(color: Colors.white12)),
                ),
                child: Row(
                  children: [
                    IconButton(icon: const Icon(Icons.camera_alt, color: Color(0xFF00FF66)), onPressed: () {}),
                    Expanded(
                      child: TextField(
                        controller: _textController,
                        style: const TextStyle(color: Colors.white),
                        decoration: InputDecoration(
                          hintText: 'Ask your chef...',
                          hintStyle: const TextStyle(color: Colors.white38),
                          filled: true,
                          fillColor: const Color(0xFF111111),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24), 
                            borderSide: BorderSide(color: Colors.white.withOpacity(0.1))
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24), 
                            borderSide: BorderSide(color: Colors.white.withOpacity(0.1))
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24), 
                            borderSide: const BorderSide(color: Color(0xFF00FF66))
                          ),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                        ),
                        onSubmitted: (text) => _sendMessage(text),
                        textInputAction: TextInputAction.send,
                      ),
                    ),
                    IconButton(
                      icon: _isProcessing 
                          ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Color(0xFF00FF66), strokeWidth: 2))
                          : const Icon(Icons.send, color: Color(0xFFFF8C00)), 
                      onPressed: _isProcessing ? null : () => _sendMessage(_textController.text),
                    ),
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMessageBubble(ChatMessage msg) {
    if (msg.isThinking) {
      return Align(
        alignment: Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF111111),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.white12),
          ),
          child: const Text('...', style: TextStyle(color: Color(0xFF00FF66), fontSize: 18, fontWeight: FontWeight.bold, letterSpacing: 2)),
        ),
      );
    }

    final accent = msg.isUser ? const Color(0xFF00FF66) : const Color(0xFFFF8C00);
    final bgColor = msg.isUser ? accent.withOpacity(0.15) : const Color(0xFF111111);
    final borderColor = msg.isUser ? accent : Colors.white12;

    return Align(
      alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        width: MediaQuery.of(context).size.width * 0.85,
        child: Column(
          crossAxisAlignment: msg.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: bgColor,
                borderRadius: BorderRadius.circular(20).copyWith(
                  bottomRight: msg.isUser ? const Radius.circular(0) : const Radius.circular(20),
                  bottomLeft: msg.isUser ? const Radius.circular(20) : const Radius.circular(0),
                ),
                border: Border.all(color: borderColor),
              ),
              child: Column(
                crossAxisAlignment: msg.isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  Text(msg.text, style: const TextStyle(color: Colors.white, fontSize: 14, height: 1.4)),
                  if (!msg.isUser && msg.source != null) ...[
                    const SizedBox(height: 6),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          msg.source == ResponseSource.aiGenerated ? Icons.auto_awesome : Icons.rule, 
                          color: Colors.white38, 
                          size: 10
                        ),
                        const SizedBox(width: 4),
                        Text(
                          msg.source == ResponseSource.aiGenerated ? 'AI Generated' : 'Kitchen Rules', 
                          style: const TextStyle(color: Colors.white38, fontSize: 9)
                        ),
                      ],
                    )
                  ]
                ],
              ),
            ),
            
            if (msg.structuredCards.isNotEmpty) ...[
              const SizedBox(height: 12),
              SizedBox(
                height: 290,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  itemCount: msg.structuredCards.length,
                  itemBuilder: (context, index) {
                    final card = msg.structuredCards[index] as Map<String, dynamic>;
                    final compliance = card['compliance'] as Map<String, dynamic>? ?? {};
                    final traces = List<String>.from(card['ai_explanation_trace'] ?? []);
                    final deficits = List<dynamic>.from(card['missing_shopping_deficits'] ?? []);
                    
                    final isSafe = compliance['is_compliant'] == true;
                    final complianceTitle = compliance['warning_level']?.toString().toUpperCase() ?? 'UNKNOWN';

                    return Container(
                      width: 260,
                      margin: const EdgeInsets.only(right: 12, bottom: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF151515),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: isSafe ? const Color(0xFF00FF66).withOpacity(0.3) : const Color(0xFFFF3333).withOpacity(0.5)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isSafe ? const Color(0xFF00FF66).withOpacity(0.05) : const Color(0xFFFF3333).withOpacity(0.1),
                              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                              border: Border(bottom: BorderSide(color: Colors.white.withOpacity(0.05)))
                            ),
                            child: Row(
                              children: [
                                Icon(isSafe ? Icons.gpp_good : Icons.warning_amber, size: 16, color: isSafe ? const Color(0xFF00FF66) : const Color(0xFFFF3333)),
                                const SizedBox(width: 6),
                                Expanded(child: Text(isSafe ? 'BIO-COMPLIANT' : complianceTitle, style: TextStyle(color: isSafe ? const Color(0xFF00FF66) : const Color(0xFFFF3333), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1))),
                                // LEVEL A: Native Copy & Share Interfaces
                                InkWell(
                                  onTap: () async {
                                    final success = await RecipeExportService.copyToClipboard(card);
                                    if (mounted && success) {
                                      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                                        content: Text('Recipe copied to clipboard!', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                                        backgroundColor: Color(0xFF00FF66),
                                      ));
                                    }
                                  },
                                  child: const Icon(Icons.copy, size: 16, color: Colors.white54),
                                ),
                                const SizedBox(width: 12),
                                InkWell(
                                  onTap: () async {
                                    await RecipeExportService.shareToSocial(card);
                                  },
                                  child: const Icon(Icons.share, size: 16, color: Colors.white54),
                                ),
                              ],
                            ),
                          ),
                          Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(card['title'] ?? 'Recipe', style: const TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold), maxLines: 2, overflow: TextOverflow.ellipsis),
                                const SizedBox(height: 12),
                                if (traces.isNotEmpty) ...[
                                  const Text('WHY THIS?', style: TextStyle(color: Colors.white54, fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 1)),
                                  const SizedBox(height: 4),
                                  Text(traces.first, style: const TextStyle(color: Colors.white, fontSize: 12, height: 1.3), maxLines: 3, overflow: TextOverflow.ellipsis),
                                ],
                                const SizedBox(height: 12),
                                if (deficits.isNotEmpty) ...[
                                  InkWell(
                                    onTap: () async {
                                      // Real Fulfillment Bridge
                                      for (final d in deficits) {
                                        final ingredient = d as Map<String, dynamic>;
                                        await AppServices.shopping.addItem(ShoppingItem(
                                          id: '',
                                          name: ingredient['name'] ?? 'Unknown Item',
                                          quantity: (ingredient['quantity'] ?? 1.0).toDouble(),
                                          unit: ingredient['unit'] ?? 'item',
                                          category: ingredient['category'] ?? 'staple',
                                          wave: ShoppingWave.buyNow,
                                          reason: 'AI Meal Deficit (${card['title']})',
                                          linkedMealTitle: card['title']?.toString(),
                                        ));
                                      }
                                      if (mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                                          content: Text('Deficits automatically synced to Shopping Wave.', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
                                          backgroundColor: Color(0xFF00FF66),
                                        ));
                                      }
                                    },
                                    child: Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFFF8C00).withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(8),
                                        border: Border.all(color: const Color(0xFFFF8C00).withOpacity(0.3)),
                                      ),
                                      child: Row(
                                        children: [
                                          const Icon(Icons.add_shopping_cart, color: Color(0xFFFF8C00), size: 14),
                                          const SizedBox(width: 6),
                                          Expanded(child: Text('${deficits.length} Missing (1-Click Buy Now)', style: const TextStyle(color: Color(0xFFFF8C00), fontSize: 11, fontWeight: FontWeight.bold))),
                                        ],
                                      ),
                                    ),
                                  )
                                ],
                                const SizedBox(height: 12),
                                // LEVEL A + B: Behavioral Learning Interactions
                                Row(
                                  children: [
                                    Expanded(
                                      child: InkWell(
                                        onTap: () async {
                                          final cuisine = card['cuisine'] ?? '';
                                          if (cuisine.toString().isNotEmpty) {
                                            await AppServices.preferences.recordAffinity(cuisine.toString(), true);
                                          }
                                          if (mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                              content: Text('Memory Updated: The Chef will prioritize $cuisine profiles.', style: const TextStyle(fontWeight: FontWeight.bold)),
                                              backgroundColor: const Color(0xFF00FF66),
                                            ));
                                          }
                                        },
                                        child: Container(
                                          alignment: Alignment.center,
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF00FF66).withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: const Text('Cook & Learn', style: TextStyle(color: Color(0xFF00FF66), fontSize: 11, fontWeight: FontWeight.bold)),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: InkWell(
                                        onTap: () async {
                                          final cuisine = card['cuisine'] ?? '';
                                          if (cuisine.toString().isNotEmpty) {
                                            await AppServices.preferences.recordAffinity(cuisine.toString(), false);
                                          }
                                          if (mounted) {
                                            ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                                              content: Text('Memory Updated: The Chef will avoid $cuisine profiles.', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                                              backgroundColor: const Color(0xFFFF3333),
                                            ));
                                          }
                                        },
                                        child: Container(
                                          alignment: Alignment.center,
                                          padding: const EdgeInsets.symmetric(vertical: 8),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFFF3333).withOpacity(0.15),
                                            borderRadius: BorderRadius.circular(8),
                                          ),
                                          child: const Text('Skip / Unlikely', style: TextStyle(color: Color(0xFFFF3333), fontSize: 11, fontWeight: FontWeight.bold)),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                                if (!isSafe && compliance['explanation'] != null) ...[
                                  const SizedBox(height: 8),
                                  Text(compliance['explanation'].toString(), style: const TextStyle(color: Color(0xFFFF3333), fontSize: 10, fontStyle: FontStyle.italic), maxLines: 2, overflow: TextOverflow.ellipsis),
                                ]
                              ],
                            ),
                          )
                        ],
                      ),
                    );
                  },
                ),
              )
            ]
          ],
        ),
      ),
    );
  }
}
