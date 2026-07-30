import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../core/design/app_theme.dart';
import '../../core/design/openfree_route_map.dart';
import '../../core/design/premium_components.dart';
import '../../domain/models.dart';
import '../../state/app_state.dart';

class AdminEventsTab extends ConsumerStatefulWidget {
  const AdminEventsTab({super.key});

  @override
  ConsumerState<AdminEventsTab> createState() => _AdminEventsTabState();
}

class _AdminEventsTabState extends ConsumerState<AdminEventsTab> {
  bool _isLoading = true;
  String? _error;
  List<LocalEvent> _events = [];

  @override
  void initState() {
    super.initState();
    _loadEvents();
  }

  Future<void> _loadEvents() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final response = await Supabase.instance.client
          .from('events')
          .select()
          .order('starts_at', ascending: true);

      final events = (response as List)
          .map((item) => LocalEvent.fromJson(item as Map<String, dynamic>))
          .toList();

      if (mounted) {
        setState(() {
          _events = events;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Error al cargar eventos: $e';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _deleteEvent(String id) async {
    try {
      await Supabase.instance.client.from('events').delete().eq('id', id);
      ref.invalidate(localEventsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Evento eliminado correctamente.')),
        );
      }
      _loadEvents();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al eliminar evento: $e')),
        );
      }
    }
  }

  void _showAddEventDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddEventBottomSheet(
        onEventCreated: () {
          ref.invalidate(localEventsProvider);
          _loadEvents();
        },
      ),
    );
  }

  String _formatEventDates(LocalEvent event) {
    final startStr = DateFormat('dd/MM/yyyy HH:mm').format(event.startsAt);
    if (event.endsAt == null) return startStr;
    final endStr = DateFormat('dd/MM/yyyy HH:mm').format(event.endsAt!);
    return 'Del $startStr al $endStr';
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _showAddEventDialog,
        backgroundColor: AppTheme.primary,
        icon: const Icon(Icons.add_rounded, color: Colors.white),
        label: const Text('Nuevo Evento', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadEvents,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 100),
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Gestión de Eventos',
                      style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Agrega o elimina los eventos culturales de la zona',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(color: Colors.grey),
                    ),
                  ],
                ),
                IconButton.filledTonal(
                  onPressed: _loadEvents,
                  icon: const Icon(Icons.refresh_rounded),
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (_isLoading)
              const Center(
                child: Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: CircularProgressIndicator(),
                ),
              )
            else if (_error != null)
              EmptyState(
                icon: Icons.error_outline_rounded,
                title: 'No se pudieron cargar los eventos',
                body: _error!,
              )
            else if (_events.isEmpty)
              EmptyState(
                icon: Icons.event_available_outlined,
                title: 'Sin eventos programados',
                body: 'No hay eventos en la base de datos. Toca "Nuevo Evento" para agregar uno.',
              )
            else
              ..._events.map(
                (event) => Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 2,
                  child: ListTile(
                    contentPadding: const EdgeInsets.all(12),
                    leading: Container(
                      width: 54,
                      height: 54,
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        image: event.imageUrl.isNotEmpty
                            ? DecorationImage(
                                image: event.imageUrl.startsWith('data:image')
                                    ? MemoryImage(base64Decode(event.imageUrl.split(',').last)) as ImageProvider
                                    : NetworkImage(event.imageUrl),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: event.imageUrl.isEmpty
                          ? const Icon(Icons.event, color: AppTheme.primary)
                          : null,
                    ),
                    title: Text(
                      event.title,
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                    subtitle: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 4),
                        Text('${event.category} • ${event.city}'),
                        const SizedBox(height: 2),
                        Text(
                          _formatEventDates(event),
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 12, fontWeight: FontWeight.w600),
                        ),
                      ],
                    ),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline_rounded, color: Colors.redAccent),
                      onPressed: () {
                        showDialog(
                          context: context,
                          builder: (ctx) => AlertDialog(
                            title: const Text('Eliminar Evento'),
                            content: Text('¿Deseas eliminar el evento "${event.title}"?'),
                            actions: [
                              TextButton(
                                onPressed: () => Navigator.pop(ctx),
                                child: const Text('Cancelar'),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
                                onPressed: () {
                                  Navigator.pop(ctx);
                                  _deleteEvent(event.id);
                                },
                                child: const Text('Eliminar', style: TextStyle(color: Colors.white)),
                              ),
                            ],
                          ),
                        );
                      },
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _AddEventBottomSheet extends ConsumerStatefulWidget {
  final VoidCallback onEventCreated;
  const _AddEventBottomSheet({required this.onEventCreated});

  @override
  ConsumerState<_AddEventBottomSheet> createState() => _AddEventBottomSheetState();
}

class _AddEventBottomSheetState extends ConsumerState<_AddEventBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _cityController = TextEditingController(text: 'Barranquilla');

  String _category = 'Cultural';
  DateTime _startsAt = DateTime.now().add(const Duration(days: 1));
  DateTime? _endsAt;
  bool _isMultiDay = false;
  TimeOfDay _startTime = const TimeOfDay(hour: 18, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 23, minute: 0);

  GeoPoint _selectedLocation = const GeoPoint(latitude: 10.96854, longitude: -74.78132);
  String? _localImageBase64;
  final String _imageUrlUrl = '';
  bool _isSubmitting = false;

  final List<String> _categories = const [
    'Cultural',
    'Concierto',
    'Festival',
    'Feria',
    'Deportivo',
    'Gastronómico',
    'Parque de Atracciones / Circo',
  ];

  @override
  void dispose() {
    _titleController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 800,
        maxHeight: 800,
        imageQuality: 80,
      );

      if (pickedFile != null) {
        final bytes = await File(pickedFile.path).readAsBytes();
        final base64Str = 'data:image/jpeg;base64,${base64Encode(bytes)}';
        setState(() {
          _localImageBase64 = base64Str;
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al seleccionar imagen: $e')),
        );
      }
    }
  }

  Future<void> _openMapPicker() async {
    final styleUrl = ref.watch(mapStyleProvider);
    final result = await showDialog<GeoPoint>(
      context: context,
      builder: (context) => _MapLocationPickerModal(
        initialLocation: _selectedLocation,
        styleUrl: styleUrl,
      ),
    );

    if (result != null) {
      setState(() {
        _selectedLocation = result;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSubmitting = true);

    try {
      final startDateTime = DateTime(
        _startsAt.year,
        _startsAt.month,
        _startsAt.day,
        _startTime.hour,
        _startTime.minute,
      );

      final endDateTime = _isMultiDay && _endsAt != null
          ? DateTime(
              _endsAt!.year,
              _endsAt!.month,
              _endsAt!.day,
              _endTime.hour,
              _endTime.minute,
            )
          : DateTime(
              _startsAt.year,
              _startsAt.month,
              _startsAt.day,
              _endTime.hour,
              _endTime.minute,
            );

      final finalImageUrl = _localImageBase64 != null && _localImageBase64!.isNotEmpty
          ? _localImageBase64!
          : (_imageUrlUrl.isNotEmpty
              ? _imageUrlUrl
              : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600');

      final payload = {
        'title': _titleController.text.trim(),
        'city': _cityController.text.trim(),
        'category': _category,
        'starts_at': startDateTime.toIso8601String(),
        'ends_at': endDateTime.toIso8601String(),
        'latitude': _selectedLocation.latitude,
        'longitude': _selectedLocation.longitude,
        'image_url': finalImageUrl,
        'source': 'admin',
      };

      await Supabase.instance.client.from('events').insert(payload);

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('¡Evento guardado exitosamente!')),
        );
        widget.onEventCreated();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error al guardar evento: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;
    return Container(
      margin: EdgeInsets.only(top: 60, bottom: bottomInset),
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                'Nuevo Evento',
                style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 20),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Título del Evento',
                  prefixIcon: Icon(Icons.event_note),
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Ingresa un título' : null,
              ),
              const SizedBox(height: 14),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _cityController,
                      decoration: const InputDecoration(
                        labelText: 'Ciudad / Zona',
                        prefixIcon: Icon(Icons.location_city),
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Ingresa la ciudad' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: DropdownButtonFormField<String>(
                      initialValue: _category,
                      decoration: const InputDecoration(
                        labelText: 'Categoría',
                        border: OutlineInputBorder(),
                      ),
                      items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis))).toList(),
                      onChanged: (val) {
                        if (val != null) setState(() => _category = val);
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Multi-day toggle
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('¿Evento de varios días?', style: TextStyle(fontWeight: FontWeight.bold)),
                subtitle: const Text('Ej: parques, circos, ferias o exposiciones'),
                value: _isMultiDay,
                onChanged: (val) {
                  setState(() {
                    _isMultiDay = val;
                    if (val && _endsAt == null) {
                      _endsAt = _startsAt.add(const Duration(days: 3));
                    }
                  });
                },
              ),
              const SizedBox(height: 8),
              // Dates row
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.calendar_month),
                      label: Text('Inicio: ${DateFormat('dd/MM/yyyy').format(_startsAt)}'),
                      onPressed: () async {
                        final date = await showDatePicker(
                          context: context,
                          initialDate: _startsAt,
                          firstDate: DateTime.now().subtract(const Duration(days: 30)),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (date != null) setState(() => _startsAt = date);
                      },
                    ),
                  ),
                  if (_isMultiDay) ...[
                    const SizedBox(width: 12),
                    Expanded(
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.event_repeat),
                        label: Text('Fin: ${DateFormat('dd/MM/yyyy').format(_endsAt ?? _startsAt)}'),
                        onPressed: () async {
                          final date = await showDatePicker(
                            context: context,
                            initialDate: _endsAt ?? _startsAt,
                            firstDate: _startsAt,
                            lastDate: DateTime.now().add(const Duration(days: 365)),
                          );
                          if (date != null) setState(() => _endsAt = date);
                        },
                      ),
                    ),
                  ],
                ],
              ),
              const SizedBox(height: 12),
              // Operating hours row
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.access_time),
                      label: Text('Apertura: ${_startTime.format(context)}'),
                      onPressed: () async {
                        final time = await showTimePicker(
                          context: context,
                          initialTime: _startTime,
                        );
                        if (time != null) setState(() => _startTime = time);
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: OutlinedButton.icon(
                      icon: const Icon(Icons.more_time_rounded),
                      label: Text('Cierre: ${_endTime.format(context)}'),
                      onPressed: () async {
                        final time = await showTimePicker(
                          context: context,
                          initialTime: _endTime,
                        );
                        if (time != null) setState(() => _endTime = time);
                      },
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              // Interactive Map Location Picker
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppTheme.primary.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.map_rounded, color: AppTheme.primary),
                        const SizedBox(width: 8),
                        const Text('Ubicación en el mapa', style: TextStyle(fontWeight: FontWeight.bold)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'Lat: ${_selectedLocation.latitude.toStringAsFixed(5)}, Lng: ${_selectedLocation.longitude.toStringAsFixed(5)}',
                      style: const TextStyle(fontSize: 12, color: Colors.grey),
                    ),
                    const SizedBox(height: 10),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.pin_drop_rounded, color: AppTheme.primary),
                        label: const Text('Seleccionar en el mapa interactivo'),
                        onPressed: _openMapPicker,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Image Picker Section
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Colors.grey.withValues(alpha: 0.3)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.image_outlined, color: AppTheme.primary),
                            SizedBox(width: 8),
                            Text('Imagen del Evento', style: TextStyle(fontWeight: FontWeight.bold)),
                          ],
                        ),
                        ElevatedButton.icon(
                          onPressed: _pickImage,
                          icon: const Icon(Icons.photo_library, size: 16),
                          label: const Text('Subir Foto'),
                        ),
                      ],
                    ),
                    if (_localImageBase64 != null) ...[
                      const SizedBox(height: 12),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.memory(
                          base64Decode(_localImageBase64!.split(',').last),
                          height: 120,
                          width: double.infinity,
                          fit: BoxFit.cover,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: LiquidButton(
                  label: _isSubmitting ? 'Guardando...' : 'Guardar Evento',
                  icon: Icons.check_circle_rounded,
                  onPressed: _isSubmitting ? () {} : _submit,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MapLocationPickerModal extends StatefulWidget {
  final GeoPoint initialLocation;
  final String styleUrl;

  const _MapLocationPickerModal({
    required this.initialLocation,
    required this.styleUrl,
  });

  @override
  State<_MapLocationPickerModal> createState() => _MapLocationPickerModalState();
}

class _MapLocationPickerModalState extends State<_MapLocationPickerModal> {
  late GeoPoint _pickedLocation;
  MapLibreMapController? _mapController;

  @override
  void initState() {
    super.initState();
    _pickedLocation = widget.initialLocation;
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      insetPadding: const EdgeInsets.all(16),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: SizedBox(
          height: 480,
          child: Stack(
            children: [
              OpenFreeRouteMap(
                styleUrl: widget.styleUrl,
                points: [_pickedLocation],
                height: 480,
                borderRadius: 0,
                onMapCreated: (controller) {
                  _mapController = controller;
                },
                onPointSelected: (point) {
                  setState(() {
                    _pickedLocation = point;
                  });
                },
              ),
              const Center(
                child: Icon(Icons.location_pin, color: Colors.redAccent, size: 44),
              ),
              Positioned(
                top: 16,
                right: 16,
                child: CircleAvatar(
                  backgroundColor: Colors.black54,
                  child: IconButton(
                    icon: const Icon(Icons.close, color: Colors.white),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ),
              Positioned(
                left: 16,
                right: 16,
                bottom: 16,
                child: Card(
                  elevation: 6,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Mueve el mapa o toca una ubicación',
                          style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Lat: ${_pickedLocation.latitude.toStringAsFixed(5)}, Lng: ${_pickedLocation.longitude.toStringAsFixed(5)}',
                          style: const TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        const SizedBox(height: 10),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: AppTheme.primary,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            ),
                            onPressed: () async {
                              final nav = Navigator.of(context);
                              if (_mapController != null) {
                                final pos = await _mapController!.queryCameraPosition();
                                if (pos != null) {
                                  nav.pop(
                                    GeoPoint(
                                      latitude: pos.target.latitude,
                                      longitude: pos.target.longitude,
                                    ),
                                  );
                                  return;
                                }
                              }
                              nav.pop(_pickedLocation);
                            },
                            child: const Text('Confirmar Ubicación', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
