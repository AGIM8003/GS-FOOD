import 'dart:ui';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../app/services.dart';
import '../../perception/food_classifier_tflite.dart';
import '../../engine/models/user_preferences.dart';
import 'package:image_picker/image_picker.dart';

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
  final ImagePicker _picker = ImagePicker();
  
  ClassifierResult? _visionResult;

  @override
  void initState() {
    super.initState();
    // Warm up the ML model when the camera flow starts
    AppServices.foodClassifier.load();
  }

  void _triggerVision(ImageSource source) async {
    HapticFeedback.lightImpact();
    final XFile? image = await _picker.pickImage(source: source, maxWidth: 800, maxHeight: 800);
    
    if (image == null) return; // User canceled

    setState(() {
      _isScanning = true;
      _scanComplete = false;
      _visionResult = null;
    });

    final result = await AppServices.foodClassifier.classifyImagePath(image.path);
    final candidateName = result.success ? result.label : 'Failed to Identify';

    setState(() {
      _isScanning = false;
      _scanComplete = true;
      _visionResult = result;
      _scanResult = candidateName;
      _isSafe = null; // Cannot verify strict compliance off coarse label alone
    });

    if (result.success) {
      _resolveTaxonomyAndSanctity(candidateName);
    }
  }

  void _triggerTextUpload() async {
    final input = _inputController.text.trim();
    if (input.isEmpty) return;

    HapticFeedback.lightImpact();
    setState(() {
      _isScanning = false;
      _scanComplete = true;
      _scanResult = input;
      _visionResult = null;
      _isSafe = null; 
    });
    
    _resolveTaxonomyAndSanctity(input);
  }

  Future<void> _resolveTaxonomyAndSanctity(String candidate) async {
    // LEVEL A + B: Bridge coarse input to OFF Data Plane and run Rule Engine intersection
    final prefs = await AppServices.preferences.load();
    final taxonomy = await AppServices.products.resolveTaxonomyFromName(candidate);
    
    if (!mounted) return;
    if (taxonomy == null) return; // Leave Unverified
    
    try {
      final map = json.decode(taxonomy.payloadJson) as Map<String, dynamic>;
      final allergensList = map['allergens'] as List<dynamic>? ?? [];
      final ingredients = (map['ingredientsText'] as String?)?.toLowerCase() ?? '';
      final brands = (map['brands'] as String?) ?? '';
      
      bool compliant = true;
      
      // Strict Allergen Intersection
      for (final bad in prefs.allergens) {
        final block = bad.toLowerCase();
        if (allergensList.any((id) => id.toString().contains(block)) || ingredients.contains(block)) {
           compliant = false;
           break;
        }
      }
      
      // Apply exact brands if identified
      if (brands.isNotEmpty && _scanResult == candidate) {
         _scanResult = '$brands $candidate'.trim();
      }

      setState(() {
         _isSafe = compliant;
      });
      
      if (!compliant) {
         HapticFeedback.vibrate();
      }
    } catch (e) {
      // Data decode error -> Leave Unverified
    }
  }

  void _confirmAndStore() async {
    if (_scanResult.isEmpty || _scanResult == 'Failed to Identify') return;
    
    await AppServices.inventory.addInventoryItem(
      _scanResult, 
      DateTime.now().add(const Duration(days: 4))
    );
    HapticFeedback.heavyImpact();
    
    if (mounted) {
      Navigator.pop(context);
    }
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
        const Text("Or enter manually:", style: TextStyle(color: Colors.white54, fontSize: 12)),
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
              suffixIcon: IconButton(
                icon: const Icon(Icons.add_circle, color: Color(0xFF00FF66)),
                onPressed: _triggerTextUpload,
              )
            ),
            onSubmitted: (_) => _triggerTextUpload(),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00FF66),
                foregroundColor: Colors.black,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              ),
              onPressed: _isScanning ? null : () => _triggerVision(ImageSource.camera),
              icon: const Icon(Icons.camera_alt),
              label: const Text('CAMERA', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
            const SizedBox(width: 12),
            ElevatedButton.icon(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white12,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              ),
              onPressed: _isScanning ? null : () => _triggerVision(ImageSource.gallery),
              icon: const Icon(Icons.photo_library),
              label: const Text('GALLERY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
            ),
          ],
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
    String statusText = 'Resolving taxonomy... (Sanctity Unverified)';

    if (isCompliant == true) {
      statusIcon = Icons.check_circle;
      statusColor = const Color(0xFF00FF66);
      statusText = 'Sanctity Verified (Data Placed)';
    } else if (isCompliant == false) {
      statusIcon = Icons.warning_rounded;
      statusColor = Colors.redAccent;
      statusText = 'Medical/Dietary Intercept (Violation)';
    }

    bool hasConfidenceWarning = _visionResult != null && _visionResult!.success && _visionResult!.confidence < 0.6;

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (_visionResult != null && _visionResult!.success) ...[
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            decoration: BoxDecoration(
              color: hasConfidenceWarning ? const Color(0xFFFF8C00).withOpacity(0.1) : const Color(0xFF00FF66).withOpacity(0.1),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: hasConfidenceWarning ? const Color(0xFFFF8C00) : const Color(0xFF00FF66))
            ),
            child: Text(
              'Confidence: ${(_visionResult!.confidence * 100).toStringAsFixed(1)}%',
              style: TextStyle(color: hasConfidenceWarning ? const Color(0xFFFF8C00) : const Color(0xFF00FF66), fontWeight: FontWeight.bold)
            ),
          ),
          const SizedBox(height: 24),
        ],

        Icon(statusIcon, color: statusColor, size: 80),
        const SizedBox(height: 16),
        Text(_scanResult, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        Text(statusText, style: TextStyle(color: statusColor, fontSize: 14)),
        if (hasConfidenceWarning)
           const Padding(
             padding: EdgeInsets.only(top: 8.0),
             child: Text('Model confidence is low. Please confirm accuracy.', style: TextStyle(color: Color(0xFFFF8C00), fontSize: 12)),
           ),
        const SizedBox(height: 48),

        Row(
           mainAxisAlignment: MainAxisAlignment.center,
           children: [
              TextButton(
                onPressed: () {
                  setState(() { 
                    _scanComplete = false; 
                    _scanResult = ""; 
                    _visionResult = null;
                    _inputController.clear();
                  });
                },
                child: const Text('RETRY', style: TextStyle(color: Colors.white54, fontWeight: FontWeight.bold)),
              ),
              const SizedBox(width: 24),
              ElevatedButton.icon(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF00FF66), foregroundColor: Colors.black),
                onPressed: _confirmAndStore,
                icon: const Icon(Icons.check),
                label: const Text('CONFIRM', style: TextStyle(fontWeight: FontWeight.bold)),
              )
           ],
        )
      ],
    );
  }
}
