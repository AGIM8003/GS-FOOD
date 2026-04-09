import 'package:flutter/material.dart';
import '../../ui/golden_gourmet_scaffold.dart';
import '../../ui/sanctity_header.dart';

class MolecularFlavorLabPage extends StatefulWidget {
  const MolecularFlavorLabPage({super.key});

  @override
  State<MolecularFlavorLabPage> createState() => _MolecularFlavorLabPageState();
}

class _MolecularFlavorLabPageState extends State<MolecularFlavorLabPage> with SingleTickerProviderStateMixin {
  late AnimationController _radarController;

  @override
  void initState() {
    super.initState();
    _radarController = AnimationController(
        vsync: this, duration: const Duration(seconds: 4))
      ..repeat();
  }

  @override
  void dispose() {
    _radarController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GoldenGourmetScaffold(
      backgroundColor: const Color(0xFF000000),
      appBar: const SanctityHeader(title: 'Molecular Flavor Lab'),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Compound Radar',
                style: TextStyle(color: Color(0xFF00FF66), fontSize: 22, fontWeight: FontWeight.bold, letterSpacing: -0.5),
              ),
              const SizedBox(height: 8),
              const Text(
                'AI chemical analysis mapping shared flavor esters in your pantry. We found an unexpected harmonization.',
                style: TextStyle(color: Colors.white54, fontSize: 14),
              ),
              const SizedBox(height: 32),
              Center(
                child: RotationTransition(
                  turns: _radarController,
                  child: Container(
                    width: 280,
                    height: 280,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: const Color(0xFF00FF66).withOpacity(0.3), width: 2),
                      boxShadow: [
                        BoxShadow(color: const Color(0xFF00FF66).withOpacity(0.1), blurRadius: 40)
                      ]
                    ),
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        // Simulating a radar sweep and compound nodes
                        Container(
                          width: 250, height: 250,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF00FF66).withOpacity(0.1)),
                          ),
                        ),
                        Container(
                          width: 150, height: 150,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: const Color(0xFF00FF66).withOpacity(0.1)),
                          ),
                        ),
                        // Nodes
                        const Positioned(top: 40, left: 60, child: _CompoundNode('Strawberries', 'Furanone')),
                        const Positioned(bottom: 60, right: 40, child: _CompoundNode('Balsamic', 'Acetic Acid')),
                        const Positioned(top: 100, right: 30, child: _CompoundNode('Black Pepper', 'Piperine')),
                        
                        // Connector Lines (Simulated via rotation lines usually, but keeping it simple)
                        Container(
                          width: 280, height: 2,
                          color: const Color(0xFF00FF66).withOpacity(0.4),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 48),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: const Color(0xFF111111),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: const Color(0xFFFF8C00).withOpacity(0.5)),
                  boxShadow: [
                    BoxShadow(color: const Color(0xFFFF8C00).withOpacity(0.1), blurRadius: 20)
                  ]
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.science, color: Color(0xFFFF8C00)),
                        SizedBox(width: 12),
                        Text('Synergy Detected: 92%', style: TextStyle(color: Color(0xFFFF8C00), fontSize: 18, fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 12),
                    const Text('Your Chef Persona recommends bridging Strawberries and Black Pepper with a 10-year aged Balsamic reduction from your inventory.',
                      style: TextStyle(color: Colors.white, height: 1.5)),
                    const SizedBox(height: 16),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFFF8C00).withOpacity(0.1),
                          side: const BorderSide(color: Color(0xFFFF8C00)),
                        ),
                        onPressed: () {},
                        child: const Text('Synthesize Molecular Dessert', style: TextStyle(color: Color(0xFFFF8C00), fontWeight: FontWeight.bold)),
                      ),
                    )
                  ],
                ),
              )
            ],
          ),
        ),
      ),
    );
  }
}

class _CompoundNode extends StatelessWidget {
  final String ingredient;
  final String compound;
  
  const _CompoundNode(this.ingredient, this.compound);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Container(
          width: 12, height: 12,
          decoration: const BoxDecoration(
            color: Color(0xFF00FF66),
            shape: BoxShape.circle,
            boxShadow: [BoxShadow(color: Color(0xFF00FF66), blurRadius: 10)]
          ),
        ),
        const SizedBox(height: 4),
        Text(ingredient, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
        Text(compound, style: const TextStyle(color: Colors.white54, fontSize: 8)),
      ],
    );
  }
}
