import 'package:flutter/material.dart';

class ActiveCookingPage extends StatefulWidget {
  final String recipeTitle;
  const ActiveCookingPage({super.key, required this.recipeTitle});

  @override
  State<ActiveCookingPage> createState() => _ActiveCookingPageState();
}

class _ActiveCookingPageState extends State<ActiveCookingPage> {
  int _currentStep = 1;
  final int _totalSteps = 5;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF000000), // OLED Black
      appBar: AppBar(
        title: Text(widget.recipeTitle, style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.w900)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Colors.white54, size: 32),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // High contrast progress
              Row(
                children: [
                  Text('STEP $_currentStep', style: const TextStyle(color: Color(0xFFFF8C00), fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 2)),
                  const Text(' / ', style: TextStyle(color: Colors.white38, fontSize: 24, fontWeight: FontWeight.w900)),
                  Text('$_totalSteps', style: const TextStyle(color: Colors.white38, fontSize: 24, fontWeight: FontWeight.w900)),
                ],
              ),
              const SizedBox(height: 32),
              
              // Step Instruction - BIG TYPE
              const Expanded(
                child: Text(
                  'Heat olive oil in a large skillet over medium heat. Add the diced onions and sauté until translucent (about 5 mins).',
                  style: TextStyle(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold, height: 1.3),
                ),
              ),

              // Timer UI Mock
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF111111),
                  borderRadius: BorderRadius.circular(24),
                  border: Border.all(color: const Color(0xFFFF8C00).withOpacity(0.3), width: 2),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('05:00', style: TextStyle(color: Color(0xFFFF8C00), fontSize: 48, fontWeight: FontWeight.w900, height: 1)),
                        const SizedBox(height: 4),
                        Text('Sauté Onions', style: TextStyle(color: Colors.white54, fontSize: 16, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    FloatingActionButton(
                      backgroundColor: const Color(0xFFFF8C00),
                      onPressed: () {},
                      child: const Icon(Icons.play_arrow, color: Colors.black, size: 32),
                    )
                  ],
                ),
              ),
              const SizedBox(height: 24),
              
              // Next Step button
              SizedBox(
                width: double.infinity,
                height: 80,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF00FF66),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  ),
                  onPressed: () {
                    if (_currentStep < _totalSteps) {
                      setState(() => _currentStep++);
                    } else {
                      Navigator.pop(context);
                    }
                  },
                  child: Text(_currentStep == _totalSteps ? 'FINISH' : 'NEXT STEP', 
                    style: const TextStyle(color: Colors.black, fontSize: 24, fontWeight: FontWeight.w900, letterSpacing: 1)),
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}
