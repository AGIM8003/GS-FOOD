import 'package:flutter/material.dart';

class GoldenGourmetScaffold extends StatelessWidget {
  const GoldenGourmetScaffold({
    super.key,
    required this.child,
    this.appBar,
    this.backgroundColor = const Color(0xFF000000),
  });

  final Widget child;
  final PreferredSizeWidget? appBar;
  final Color backgroundColor;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: appBar,
      body: Container(
        decoration: BoxDecoration(
          color: backgroundColor,
          border: Border.all(
            color: const Color(0xFF00FF66).withOpacity(0.8),
            width: 3.0,
          ),
          boxShadow: const [
            BoxShadow(
              color: Color(0xFF00FF66),
              blurRadius: 15.0,
              spreadRadius: 2.0,
            )
          ],
        ),
        child: child,
      ),
    );
  }
}
