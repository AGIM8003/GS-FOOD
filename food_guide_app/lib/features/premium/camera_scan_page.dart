import '../../app/services.dart';
import '../../engine/models/user_preferences.dart';

class CameraScanPage extends StatefulWidget {
  const CameraScanPage({super.key});

  @override
  State<CameraScanPage> createState() => _CameraScanPageState();
}

class _CameraScanPageState extends State<CameraScanPage> with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  
  bool _isScanning = false;
  bool _showResult = false;
  bool _isCompliant = true;
  String _scanMessage = '';
  
  UserPreferences? _prefs;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this, 
      duration: const Duration(seconds: 2)
    )..repeat(reverse: true);
    
    _loadPrefs();
  }

  Future<void> _loadPrefs() async {
    _prefs = await AppServices.preferences.load();
    setState(() {});
  }

  void _simulateScan(String itemName, List<String> tags) {
    if (_prefs == null) return;
    
    setState(() {
       _isScanning = true;
       _showResult = false;
    });

    Future.delayed(const Duration(seconds: 2), () {
       setState(() {
         _isScanning = false;
         _showResult = true;
         _isCompliant = false; // Always fail closed if we can't truly scan
         _scanMessage = 'Computer Vision Model Not Loaded. Auto-Scan Unavailable.';
       });
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // Mock Camera View
          Container(
            decoration: const BoxDecoration(
              image: DecorationImage(
                image: NetworkImage('https://images.unsplash.com/photo-1588693721996-03c0048af908?q=80&w=600&auto=format&fit=crop'), // Placeholder fridge/pantry
                fit: BoxFit.cover,
                opacity: 0.6,
              )
            ),
          ),
          
          // Scanning UI overlay
          SafeArea(
            child: Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.close, color: Colors.white, size: 32),
                        onPressed: () => Navigator.pop(context),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        decoration: BoxDecoration(color: Colors.black54, borderRadius: BorderRadius.circular(20)),
                        child: const Text('AUTO-SCAN ACTIVE', style: TextStyle(color: Color(0xFF00FF66), fontWeight: FontWeight.bold, letterSpacing: 1)),
                      ),
                      const SizedBox(width: 48), // balance
                    ],
                  ),
                ),
                Expanded(
                  child: Center(
                    child: _showResult 
                      ? Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              _isCompliant ? Icons.check_circle : Icons.warning_rounded,
                              color: _isCompliant ? const Color(0xFF00FF66) : const Color(0xFFFF3333),
                              size: 120,
                              shadows: [
                                BoxShadow(color: _isCompliant ? const Color(0xFF00FF66) : const Color(0xFFFF3333), blurRadius: 40)
                              ],
                            ),
                            const SizedBox(height: 24),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                              decoration: BoxDecoration(
                                color: _isCompliant ? const Color(0xFF00FF66).withOpacity(0.1) : const Color(0xFFFF3333).withOpacity(0.1),
                                border: Border.all(color: _isCompliant ? const Color(0xFF00FF66) : const Color(0xFFFF3333)),
                                borderRadius: BorderRadius.circular(16)
                              ),
                              child: Text(
                                _isCompliant ? 'COMPLIANT' : 'REFUSED',
                                style: TextStyle(color: _isCompliant ? const Color(0xFF00FF66) : const Color(0xFFFF3333), fontSize: 28, fontWeight: FontWeight.bold, letterSpacing: 2),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 32),
                              child: Text(_scanMessage, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 16)),
                            ),
                            const SizedBox(height: 32),
                            ElevatedButton(
                              style: ElevatedButton.styleFrom(backgroundColor: Colors.white12),
                              onPressed: () => setState(() => _showResult = false),
                              child: const Text('Reset Scanner', style: TextStyle(color: Colors.white)),
                            )
                          ],
                        )
                      : AnimatedBuilder(
                      animation: _animController,
                      builder: (context, child) {
                        return Container(
                          width: 250,
                          height: 250,
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: _isScanning 
                                  ? const Color(0xFFFF8C00) 
                                  : const Color(0xFF00FF66).withOpacity(0.5 + (_animController.value * 0.5)),
                              width: _isScanning ? 4 : 2,
                            ),
                            borderRadius: BorderRadius.circular(24),
                          ),
                          child: Stack(
                            children: [
                              Positioned(
                                top: _animController.value * 250,
                                left: 0,
                                right: 0,
                                child: Container(
                                  height: _isScanning ? 8 : 2,
                                  color: _isScanning ? const Color(0xFFFF8C00) : const Color(0xFF00FF66),
                                  boxShadow: [
                                    BoxShadow(
                                      color: _isScanning ? const Color(0xFFFF8C00) : const Color(0xFF00FF66), 
                                      blurRadius: 10, spreadRadius: 2)
                                  ]
                                ),
                              )
                            ],
                          ),
                        );
                      }
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(32),
                  width: double.infinity,
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.bottomCenter,
                      end: Alignment.topCenter,
                      colors: [Colors.black, Colors.black.withOpacity(0.0)],
                    )
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.document_scanner, color: Colors.white, size: 48),
                      const SizedBox(height: 16),
                      const Text('Point at ingredients or receipts', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      const Text('Computer vision will automatically identify and log items to your pantry. Compliance interceptors are ACTIVE.', textAlign: TextAlign.center, style: TextStyle(color: Colors.white54)),
                      const SizedBox(height: 24),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        children: [
                          ElevatedButton.icon(
                            style: ElevatedButton.styleFrom(backgroundColor: Colors.white12, foregroundColor: Colors.white38),
                            icon: const Icon(Icons.videocam_off),
                            label: const Text('Vision Offline'),
                            onPressed: _showResult || _isScanning ? null : () => _simulateScan('Null', []),
                          ),
                        ],
                      )
                    ],
                  ),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
