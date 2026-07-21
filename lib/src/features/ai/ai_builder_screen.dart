import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../core/design/app_theme.dart';
import '../../core/design/openfree_route_map.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../state/app_state.dart';
import 'ai_builder_controller.dart';

class AiBuilderScreen extends ConsumerStatefulWidget {
  const AiBuilderScreen({super.key});

  @override
  ConsumerState<AiBuilderScreen> createState() => _AiBuilderScreenState();
}

class _AiBuilderScreenState extends ConsumerState<AiBuilderScreen> {
  final PageController _pageController = PageController(viewportFraction: 0.85);
  int _activeIndex = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(aiBuilderProvider);
    final mapStyle = ref.watch(mapStyleProvider);


    if (state.builtTour != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ref.read(selectedTourProvider.notifier).state = state.builtTour;
        context.pushReplacement('/tours/${state.builtTour!.id}');
      });
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final points = state.recommendations
        .map((r) => GeoPoint(latitude: r.latitude, longitude: r.longitude))
        .toList();
    final labels = state.recommendations.map((r) => r.name).toList();

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: const BackButton(),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 16),
            child: LiquidButton(
              label: 'Finalizar',
              icon: Icons.check_circle_outline,
              onPressed: () {
                ref.read(aiBuilderProvider.notifier).buildTour();
              },
            ),
          ),
        ],
      ),
      body: Stack(
        children: [
          // Mapa de fondo
          Positioned.fill(
            child: OpenFreeRouteMap(
              points: points,
              labels: labels,
              styleUrl: mapStyle,
              activeIndex: _activeIndex,
              height: double.infinity,
              borderRadius: 0,
              showNumbers: true,
              useRoadRouting: true,
            ),
          ),
          // Degradado en la parte inferior para que las tarjetas resalten
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: 300,
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.8),
                    Theme.of(context).scaffoldBackgroundColor,
                  ],
                ),
              ),
            ),
          ),
          // Tarjetas deslizables
          if (!state.isBuilding)
            Positioned(
            left: 0,
            right: 0,
            bottom: 90, // Increased to avoid overlap with BottomNavigationBar
            height: 240,
            child: PageView.builder(
              controller: _pageController,
              itemCount: state.recommendations.length,
              onPageChanged: (index) {
                setState(() => _activeIndex = index);
              },
              itemBuilder: (context, index) {
                final rec = state.recommendations[index];
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: GlassPanel(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            if (rec.imageUrl.isNotEmpty)
                              ClipRRect(
                                borderRadius: BorderRadius.circular(12),
                                child: Image.network(
                                  rec.imageUrl,
                                  width: 64,
                                  height: 64,
                                  fit: BoxFit.cover,
                                ),
                              )
                            else
                              Container(
                                width: 64,
                                height: 64,
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withValues(alpha: 0.2),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: const Icon(Icons.place_rounded),
                              ),
                            const SizedBox(width: 16),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    rec.name,
                                    style: const TextStyle(
                                      fontSize: 18,
                                      fontWeight: FontWeight.bold,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    rec.category.toUpperCase(),
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: AppTheme.primary,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Expanded(
                          child: Text(
                            rec.reason,
                            style: Theme.of(context).textTheme.bodySmall,
                            maxLines: 3,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            TextButton.icon(
                              onPressed: () {
                                _showChangeStopSheet(context, index);
                              },
                              icon: const Icon(Icons.swap_horiz_rounded, size: 18),
                              label: const Text('Cambiar'),
                            ),
                            if (state.recommendations.length > 2)
                              TextButton.icon(
                                onPressed: () {
                                  ref.read(aiBuilderProvider.notifier).removeStop(index);
                                },
                                icon: const Icon(Icons.delete_outline_rounded, size: 18, color: Colors.red),
                                label: const Text('Quitar', style: TextStyle(color: Colors.red)),
                              ),
                            TextButton.icon(
                              onPressed: () {
                                ref.read(aiBuilderProvider.notifier).addStop();
                              },
                              icon: const Icon(Icons.add_rounded, size: 18),
                              label: const Text('Añadir'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
          
          if (state.isBuilding)
            Positioned.fill(
              child: Container(
                color: Theme.of(context).scaffoldBackgroundColor.withValues(alpha: 0.8),
                child: Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const CircularProgressIndicator(),
                      const SizedBox(height: 24),
                      Text(
                        'Diseñando tu viaje...',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const _AnimatedLoaderText(),
                    ],
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showChangeStopSheet(BuildContext context, int index) {
    final controller = ref.read(aiBuilderProvider.notifier);
    final currentStop = ref.read(aiBuilderProvider).recommendations[index];

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.65,
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(20),
        child: FutureBuilder<List<AiRecommendation>>(
          future: controller.getAlternatives(),
          builder: (context, snapshot) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        'Cambiar: ${currentStop.name}',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close_rounded),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Opción para eliminar la parada sin reemplazarla
                InkWell(
                  onTap: () {
                    controller.removeStop(index);
                    Navigator.pop(context);
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.red.withValues(alpha: 0.2)),
                    ),
                    child: const Row(
                      children: [
                        CircleAvatar(
                          backgroundColor: Colors.redAccent,
                          radius: 16,
                          child: Icon(Icons.delete_outline_rounded, color: Colors.white, size: 18),
                        ),
                        SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Quitar parada sin reemplazar',
                                style: TextStyle(fontWeight: FontWeight.bold, color: Colors.redAccent),
                              ),
                              SizedBox(height: 2),
                              Text(
                                'Conservar el tour sin añadir otra parada de reemplazo.',
                                style: TextStyle(fontSize: 12, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'Sugerencias de reemplazo por IA',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Expanded(
                  child: snapshot.connectionState == ConnectionState.waiting
                      ? const Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              CircularProgressIndicator(),
                              SizedBox(height: 14),
                              Text(
                                'Buscando alternativas por IA para esta zona...',
                                style: TextStyle(color: Colors.grey, fontSize: 13),
                              ),
                            ],
                          ),
                        )
                      : (snapshot.data == null || snapshot.data!.isEmpty)
                          ? const Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.location_off_rounded, size: 36, color: Colors.grey),
                                  SizedBox(height: 8),
                                  Text(
                                    'No se encontraron otras alternativas cercanas.',
                                    style: TextStyle(color: Colors.grey, fontSize: 13),
                                  ),
                                ],
                              ),
                            )
                          : ListView.builder(
                              itemCount: snapshot.data!.length,
                              itemBuilder: (context, altIndex) {
                                final alt = snapshot.data![altIndex];
                                return Card(
                                  margin: const EdgeInsets.only(bottom: 10),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                  child: ListTile(
                                    contentPadding: const EdgeInsets.all(8),
                                    leading: ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: alt.imageUrl.isNotEmpty
                                          ? Image.network(alt.imageUrl, width: 54, height: 54, fit: BoxFit.cover)
                                          : Container(width: 54, height: 54, color: Colors.grey.shade200, child: const Icon(Icons.place)),
                                    ),
                                    title: Text(alt.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                    subtitle: Text(
                                      alt.reason.isNotEmpty ? alt.reason : alt.category,
                                      maxLines: 2,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(fontSize: 12),
                                    ),
                                    trailing: FilledButton.tonal(
                                      onPressed: () {
                                        controller.replaceStopWithRecommendation(index, alt);
                                        Navigator.pop(context);
                                      },
                                      child: const Text('Elegir'),
                                    ),
                                  ),
                                );
                              },
                            ),
                ),
              ],
            );
          },
        ),
      ),
    );
  }
}

class _AnimatedLoaderText extends StatefulWidget {
  const _AnimatedLoaderText();

  @override
  State<_AnimatedLoaderText> createState() => _AnimatedLoaderTextState();
}

class _AnimatedLoaderTextState extends State<_AnimatedLoaderText> {
  final List<String> _messages = [
    'Analizando puntos de interés...',
    'Optimizando rutas de desplazamiento...',
    'Buscando datos curiosos históricos...',
    'Redactando una narrativa vibrante...',
    'Añadiendo consejos locales...',
    'Preparando tu itinerario final...'
  ];
  
  int _currentIndex = 0;

  @override
  void initState() {
    super.initState();
    _cycleMessages();
  }

  void _cycleMessages() async {
    while (mounted) {
      await Future.delayed(const Duration(seconds: 3));
      if (mounted) {
        setState(() {
          _currentIndex = (_currentIndex + 1) % _messages.length;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(milliseconds: 500),
      child: Text(
        _messages[_currentIndex],
        key: ValueKey<int>(_currentIndex),
        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
          color: Colors.grey.shade600,
        ),
      ),
    );
  }
}
