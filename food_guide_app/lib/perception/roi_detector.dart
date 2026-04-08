/// Optional ROI before OCR (MediaPipe Image Segmenter uplift — native bridge TBD).
abstract class RoiDetector {
  /// Returns a tighter image path for OCR, or [inputPath] if no ROI applied.
  Future<String> refineForOcr(String inputPath);
}

/// Default no-op until a MediaPipe Tasks plugin is wired (Android-first).
class PassthroughRoiDetector implements RoiDetector {
  @override
  Future<String> refineForOcr(String inputPath) async => inputPath;
}
