import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:permission_handler/permission_handler.dart';

import '../../app/answer_sheet.dart';
import '../../app/services.dart';
import '../../data/pack/bundled_pack_reader.dart';
import '../../engine/answer_card.dart';
import '../../engine/capture_context.dart';
import '../../perception/label_document_scanner_service.dart';
import '../../perception/label_ocr_service.dart';

/// Barcode scan + label OCR — GS-FOOD3 §5.3, §11 perception T1.
class ScanPage extends StatefulWidget {
  const ScanPage({super.key});

  @override
  State<ScanPage> createState() => _ScanPageState();
}

class _ScanPageState extends State<ScanPage> {
  MobileScannerController? _controller;
  LabelOcrService? _ocr;
  bool _scanning = false;
  bool _denied = false;
  bool _busy = false;

  @override
  void dispose() {
    _controller?.dispose();
    _ocr?.dispose();
    super.dispose();
  }

  Future<void> _startScan() async {
    setState(() => _busy = true);
    final status = await Permission.camera.request();
    if (!mounted) return;
    if (!status.isGranted) {
      setState(() {
        _busy = false;
        _denied = true;
      });
      return;
    }
    _controller = MobileScannerController(
      detectionSpeed: DetectionSpeed.normal,
      facing: CameraFacing.back,
    );
    setState(() {
      _busy = false;
      _denied = false;
      _scanning = true;
    });
  }

  void _stopScan() {
    _controller?.dispose();
    _controller = null;
    setState(() => _scanning = false);
  }

  Future<void> _showBarcodeSheet(String raw) async {
    if (!mounted) return;
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
            child: _BarcodeSheetContent(
              raw: raw,
              parentContext: context,
            ),
          ),
        );
      },
    );
  }

  Future<void> _onDetect(BarcodeCapture capture) async {
    final barcodes = capture.barcodes;
    if (barcodes.isEmpty) return;
    final raw = barcodes.first.rawValue;
    if (raw == null || raw.isEmpty || !mounted) return;
    await _showBarcodeSheet(raw);
  }

  Future<void> _pickLabelAndOcr() async {
    setState(() => _busy = true);
    final cam = await Permission.camera.request();
    if (!cam.isGranted) {
      if (mounted) {
        setState(() => _busy = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Camera permission needed for label capture.')),
        );
      }
      return;
    }
    final picker = ImagePicker();
    final file = await picker.pickImage(source: ImageSource.camera, imageQuality: 85);
    if (!mounted) return;
    setState(() => _busy = false);
    if (file == null) return;

    setState(() => _busy = true);
    try {
      await _runOcrOnFilePath(file.path);
    } on Exception catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('OCR failed (simulator/desktop?): $e')),
        );
      }
    }
  }

  Future<void> _scanLabelDocumentScanner() async {
    setState(() => _busy = true);
    final cam = await Permission.camera.request();
    if (!cam.isGranted) {
      if (mounted) {
        setState(() => _busy = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Camera permission needed for document scan.')),
        );
      }
      return;
    }
    final doc = LabelDocumentScannerService();
    try {
      final scanned = await doc.scanToFilePath();
      if (!mounted) return;
      if (scanned == null) {
        setState(() => _busy = false);
        return;
      }
      await _runOcrOnFilePath(scanned);
    } on Exception catch (e) {
      if (mounted) {
        setState(() => _busy = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Document scan failed: $e')),
        );
      }
    } finally {
      await doc.close();
    }
  }

  Future<void> _runOcrOnFilePath(String rawPath) async {
    _ocr ??= LabelOcrService();
    final path = await AppServices.roiDetector.refineForOcr(rawPath);
    final text = await _ocr!.recognizeFilePath(path);
    if (!mounted) return;
    setState(() => _busy = false);
    await _showLabelOcrDialog(text);
  }

  Future<void> _showLabelOcrDialog(String text) async {
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Label text (OCR)'),
        content: SingleChildScrollView(
          child: SelectableText(text.isEmpty ? '(no text detected)' : text),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
          TextButton(
            onPressed: text.isEmpty
                ? null
                : () async {
                    final cap = CaptureContext(kind: CaptureKind.labelOcr, ocrText: text);
                    final entity = await AppServices.normalizer.normalize(cap);
                    final answer = AppServices.ruleEngine.decide(cap, entity);
                    await AppServices.decisionLog.append(
                      traceId: answer.traceId ?? 'unknown',
                      captureKind: 'labelOcr',
                      inputSummary: text.length > 160 ? '${text.substring(0, 160)}…' : text,
                      answer: answer,
                    );
                    if (ctx.mounted) Navigator.pop(ctx);
                    if (mounted) await showAnswerSheet(context, answer);
                  },
            child: const Text('Food Guide answer'),
          ),
          FilledButton(
            onPressed: () async {
              await AppServices.saved.addNote(title: 'Label OCR', detail: text);
              if (ctx.mounted) Navigator.pop(ctx);
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Saved OCR text to Saved tab')),
                );
              }
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  Future<void> _showBundledPackSnippet() async {
    final pack = await BundledPackReader.instance.loadDefaultPack();
    if (!mounted) return;
    final pretty = pack == null ? 'Could not load bundled pack.' : const JsonEncoder.withIndent('  ').convert(pack);
    await showDialog<void>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Bundled pack (v0)'),
        content: SingleChildScrollView(child: SelectableText(pretty)),
        actions: [TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close'))],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Scan'),
        actions: [
          if (_scanning)
            IconButton(
              tooltip: 'Stop',
              onPressed: _stopScan,
              icon: const Icon(Icons.close),
            ),
        ],
      ),
      body: _busy
          ? const Center(child: CircularProgressIndicator())
          : _denied && !_scanning
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          'Camera permission is required for barcode scanning.',
                          style: Theme.of(context).textTheme.titleMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: 16),
                        FilledButton(
                          onPressed: () async {
                            setState(() => _denied = false);
                            await _startScan();
                          },
                          child: const Text('Try again'),
                        ),
                        TextButton(
                          onPressed: openAppSettings,
                          child: const Text('Open system settings'),
                        ),
                      ],
                    ),
                  ),
                )
              : _scanning && _controller != null
                  ? Stack(
                      fit: StackFit.expand,
                      children: [
                        MobileScanner(
                          controller: _controller!,
                          onDetect: _onDetect,
                        ),
                        Positioned(
                          left: 16,
                          right: 16,
                          bottom: 24,
                          child: Card(
                            elevation: 2,
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Text(
                                'Align barcode in frame. Open Food Facts + local cache when online (Phase 2).',
                                style: Theme.of(context).textTheme.bodySmall,
                              ),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Center(
                      child: Padding(
                        padding: const EdgeInsets.all(24),
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.qr_code_scanner_rounded,
                              size: 72,
                              color: Theme.of(context).colorScheme.primary,
                            ),
                            const SizedBox(height: 20),
                            Text(
                              'Barcode & camera',
                              style: Theme.of(context).textTheme.headlineSmall,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Start the scanner only when you need it — offline-friendly (§17.1).',
                              style: Theme.of(context).textTheme.bodyMedium,
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 28),
                            FilledButton.icon(
                              onPressed: _startScan,
                              icon: const Icon(Icons.photo_camera_outlined),
                              label: const Text('Start barcode scanner'),
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton.icon(
                              onPressed: _pickLabelAndOcr,
                              icon: const Icon(Icons.document_scanner_outlined),
                              label: const Text('Scan label (OCR)'),
                            ),
                            const SizedBox(height: 12),
                            OutlinedButton.icon(
                              onPressed: _scanLabelDocumentScanner,
                              icon: const Icon(Icons.scanner_outlined),
                              label: const Text('Document scanner (ML Kit)'),
                            ),
                            const SizedBox(height: 12),
                            TextButton.icon(
                              onPressed: _showBundledPackSnippet,
                              icon: const Icon(Icons.inventory_2_outlined),
                              label: const Text('Preview bundled pack JSON'),
                            ),
                            if (AppServices.foodClassifier.isLoaded) ...[
                              const SizedBox(height: 8),
                              Text(
                                'Coarse TFLite model loaded (Phase 4).',
                                style: Theme.of(context).textTheme.labelSmall,
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
    );
  }
}

class _BarcodeSheetContent extends StatefulWidget {
  const _BarcodeSheetContent({required this.raw, required this.parentContext});

  final String raw;
  final BuildContext parentContext;

  @override
  State<_BarcodeSheetContent> createState() => _BarcodeSheetContentState();
}

class _BarcodeSheetContentState extends State<_BarcodeSheetContent> {
  bool _loading = true;
  String? _productSummary;
  AnswerCard? _answer;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    final cached = await AppServices.products.getByBarcode(widget.raw);
    final cap = CaptureContext(kind: CaptureKind.barcode, barcode: widget.raw);
    final entity = await AppServices.normalizer.normalize(cap, cachedProduct: cached);
    final answer = AppServices.ruleEngine.decide(cap, entity);
    await AppServices.decisionLog.append(
      traceId: answer.traceId ?? 'unknown',
      captureKind: 'barcode',
      inputSummary: widget.raw,
      answer: answer,
    );
    if (!mounted) return;
    setState(() {
      _loading = false;
      _answer = answer;
      if (cached != null) {
        try {
          final m = json.decode(cached.payloadJson) as Map<String, dynamic>;
          final name = m['productName']?.toString() ?? 'Product';
          final ing = m['ingredientsText']?.toString();
          _productSummary = ing != null && ing.isNotEmpty ? '$name\n\nIngredients: $ing' : name;
        } on Exception {
          _productSummary = cached.payloadJson;
        }
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Barcode', style: Theme.of(context).textTheme.titleMedium),
        const SizedBox(height: 8),
        SelectableText(widget.raw, style: Theme.of(context).textTheme.bodyLarge),
        if (_loading) const Padding(padding: EdgeInsets.all(16), child: LinearProgressIndicator()),
        if (!_loading && _answer != null) ...[
          const SizedBox(height: 12),
          Text('Guide answer', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 4),
          Text(_answer!.headline, style: Theme.of(context).textTheme.bodyMedium),
          Text(_answer!.body, style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 8),
          OutlinedButton(
            onPressed: () async {
              if (_answer != null) {
                await showAnswerSheet(context, _answer!);
              }
            },
            child: const Text('Full answer & disclaimer'),
          ),
        ],
        if (!_loading && _productSummary != null) ...[
          const SizedBox(height: 12),
          Text('Open Food Facts', style: Theme.of(context).textTheme.titleSmall),
          const SizedBox(height: 4),
          SelectableText(_productSummary!, style: Theme.of(context).textTheme.bodySmall),
        ],
        if (!_loading && _productSummary == null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              'No product in cache or OFF — try online or add later.',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ),
        const SizedBox(height: 16),
        FilledButton(
          onPressed: () async {
            await AppServices.saved.addBarcodeScan(widget.raw);
            if (context.mounted) Navigator.pop(context);
            if (widget.parentContext.mounted) {
              ScaffoldMessenger.of(widget.parentContext).showSnackBar(
                const SnackBar(content: Text('Saved — see Saved tab')),
              );
            }
          },
          child: const Text('Save to Saved'),
        ),
      ],
    );
  }
}
