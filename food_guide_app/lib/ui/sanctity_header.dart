import 'package:flutter/material.dart';
import '../app/services.dart';

class SanctityHeader extends StatefulWidget implements PreferredSizeWidget {
  const SanctityHeader({
    super.key, 
    required this.title,
    this.actions,
  });

  final String title;
  final List<Widget>? actions;

  @override
  State<SanctityHeader> createState() => _SanctityHeaderState();

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight);
}

class _SanctityHeaderState extends State<SanctityHeader> {
  String _activeProtocol = 'none';

  @override
  void initState() {
    super.initState();
    _loadProtocol();
  }

  Future<void> _loadProtocol() async {
    final prefs = await AppServices.preferences.load();
    if (mounted) {
      setState(() => _activeProtocol = prefs.activeRitualProtocol);
    }
  }

  @override
  Widget build(BuildContext context) {
    bool hasProtocol = _activeProtocol != 'none';

    return AppBar(
      title: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (hasProtocol)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              margin: const EdgeInsets.only(bottom: 2),
              decoration: BoxDecoration(
                color: const Color(0xFFFFD700).withOpacity(0.2), // Gold
                borderRadius: BorderRadius.circular(4),
                border: Border.all(color: const Color(0xFFFFD700)),
              ),
              child: Text(
                '${_activeProtocol.toUpperCase()} ACTIVE', 
                style: const TextStyle(color: Color(0xFFFFD700), fontSize: 9, fontWeight: FontWeight.bold, letterSpacing: 1)
              ),
            ),
          Text(widget.title, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: -0.5)),
        ],
      ),
      elevation: 0,
      backgroundColor: Colors.transparent,
      actions: widget.actions,
    );
  }
}
