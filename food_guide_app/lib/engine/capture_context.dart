/// Intake layer: what the user did before normalization (GS-FOOD3 §5.2).
enum CaptureKind { askText, barcode, labelOcr, unknown }

class CaptureContext {
  CaptureContext({
    required this.kind,
    this.rawText,
    this.barcode,
    this.ocrText,
    this.locale,
    this.regionCode,
  });

  final CaptureKind kind;
  final String? rawText;
  final String? barcode;
  final String? ocrText;
  final String? locale;
  final String? regionCode;
}
