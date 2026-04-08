import 'package:google_mlkit_document_scanner/google_mlkit_document_scanner.dart';

/// ML Kit Document Scanner for flatter label captures (uplift U3). May throw on unsupported platforms.
class LabelDocumentScannerService {
  LabelDocumentScannerService() {
    _scanner = DocumentScanner(
      options: DocumentScannerOptions(
        documentFormat: DocumentFormat.jpeg,
        mode: ScannerMode.filter,
        pageLimit: 1,
        isGalleryImport: false,
      ),
    );
  }

  late final DocumentScanner _scanner;

  /// Returns path to first scanned page image, or null if cancelled / failed.
  Future<String?> scanToFilePath() async {
    try {
      final result = await _scanner.scanDocument();
      final imgs = result.images;
      if (imgs == null || imgs.isEmpty) return null;
      return imgs.first;
    } on Exception {
      return null;
    }
  }

  Future<void> close() async {
    await _scanner.close();
  }
}
