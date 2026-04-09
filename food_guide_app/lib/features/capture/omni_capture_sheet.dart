import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/services.dart';

/// GS FOOD V4 Omni-Capture Gateway
/// Unifies Barcode, Receipt, and Visual scanning into a single decision-less lens.
class OmniCaptureSheet extends StatefulWidget {
  const OmniCaptureSheet({super.key});

  static void show(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => const OmniCaptureSheet(),
    );
  }

  @override
  State<OmniCaptureSheet> createState() => _OmniCaptureSheetState();
}

class _OmniCaptureSheetState extends State<OmniCaptureSheet> {
  bool _isScanning = false;
  bool _scanComplete = false;
  String _scanResult = "";
  bool? _isSafe; // Null means unverified
  final TextEditingController _inputController = TextEditingController();

  void _triggerScan() async {
    final input = _inputController.text.trim();
    if (input.isEmpty) return;

    HapticFeedback.lightImpact();
    setState(() {
      _isScanning = true;
      _scanComplete = false;
    });

    // Vision is offline. We have no structural tag data to feed the Sanctity Engine.
    // We cannot simulate compliance. We must default to unverified.

    setState(() {
      _isScanning = false;
      _scanComplete = true;
      _scanResult = input;
      _isSafe = null; 
    });

    await AppServices.inventory.addInventoryItem(
      _scanResult, 
      DateTime.now().add(const Duration(days: 4))
    );
    HapticFeedback.heavyImpact();
  }

  @override
  Widget build(BuildContext context) {
    final height = MediaQuery.of(context).size.height * 0.85;

    return ClipRRect(
      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 20, sigmaY: 20),
        child: Container(
          height: height,
          color: const Color(0xFF000000).withOpacity(0.85),
          child: Column(
            children: [
              Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(2)),
              ),
              const Text('Omni-Capture Lens', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
              const Divider(color: Colors.white12),
              
              Expanded(
                child: Center(
                  child: _scanComplete 
                    ? _buildResult()
                    : _buildScannerView(),
                )
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildScannerView() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(
          width: 250,
          height: 250,
          decoration: BoxDecoration(
            border: Border.all(color: _isScanning ? const Color(0xFF00FF66) : Colors.white38, width: 2),
            borderRadius: BorderRadius.circular(24),
          ),
          alignment: Alignment.center,
          child: _isScanning 
              ? const CircularProgressIndicator(color: Color(0xFF00FF66))
              : const Icon(Icons.videocam_off, size: 64, color: Colors.white12),
        ),
        const SizedBox(height: 16),
        const Text("Vision Offline. Enter manually:", style: TextStyle(color: Colors.white54, fontSize: 12)),
        const SizedBox(height: 8),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32.0),
          child: TextField(
            controller: _inputController,
            style: const TextStyle(color: Colors.white),
            decoration: InputDecoration(
              hintText: 'e.g. Organic Spinach',
              hintStyle: const TextStyle(color: Colors.white38),
              filled: true,
              fillColor: const Color(0xFF111111),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF00FF66),
            foregroundColor: Colors.black,
            padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          ),
          onPressed: _isScanning ? null : _triggerScan,
          icon: const Icon(Icons.document_scanner),
          label: const Text('AUTO CAPTURE', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        ),
        const SizedBox(height: 16),
        const Text("Barcode | Receipt | Visual", style: TextStyle(color: Colors.white54, fontSize: 12)),
      ],
    );
  }

  Widget _buildResult() {
    final isCompliant = _isSafe;
    
    IconData statusIcon = Icons.help_outline;
    Color statusColor = Colors.white54;
    String statusText = 'Added to Storage • Sanctity Unverified (Text Mode)';

    if (isCompliant == true) {
      statusIcon = Icons.check_circle;
      statusColor = const Color(0xFF00FF66);
      statusText = 'Sanctity Verified • Added to Storage';
    } else if (isCompliant == false) {
      statusIcon = Icons.warning_rounded;
      statusColor = Colors.redAccent;
      statusText = 'Sanctity Violation Detected';
    }

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(statusIcon, color: statusColor, size: 80),
        const SizedBox(height: 16),
        Text(_scanResult, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(statusText, style: TextStyle(color: statusColor, fontSize: 14)),
        const SizedBox(height: 48),
        TextButton(
          onPressed: () {
            setState(() { 
              _scanComplete = false; 
              _scanResult = ""; 
              _inputController.clear();
            });
          },
          child: const Text('SCAN ANOTHER', style: TextStyle(color: Colors.white)),
        )
      ],
    );
  }
}
