import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';
import 'package:maplibre_gl/maplibre_gl.dart';
import 'package:shared_preferences/shared_preferences.dart';
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

    // Auto-sync any unsynced local events to Supabase cloud database
    try {
      final prefs = await SharedPreferences.getInstance();
      final localJson = prefs.getStringList('local_admin_events') ?? [];
      if (localJson.isNotEmpty) {
        final List<String> remainingLocal = [];
        for (final jsonStr in localJson) {
          try {
            final map = jsonDecode(jsonStr) as Map<String, dynamic>;
            final syncMap = Map<String, dynamic>.from(map);
            if (syncMap['id']?.toString().startsWith('local-') ?? false) {
              syncMap.remove('id');
            }
            await Supabase.instance.client.from('events').insert(syncMap);
            // Synced to cloud successfully!
          } catch (_) {
            remainingLocal.add(jsonStr);
          }
        }
        await prefs.setStringList('local_admin_events', remainingLocal);
      }
    } catch (_) {}

    final Map<String, LocalEvent> eventMap = {};

    try {
      final response = await Supabase.instance.client
          .from('events')
          .select()
          .order('starts_at', ascending: true);

      final events = (response as List)
          .map((item) => LocalEvent.fromJson(item as Map<String, dynamic>))
          .toList();

      for (final e in events) {
        if (e.id.isNotEmpty) eventMap[e.id] = e;
      }
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance();
      final localJson = prefs.getStringList('local_admin_events') ?? [];
      for (final jsonStr in localJson) {
        final map = jsonDecode(jsonStr) as Map<String, dynamic>;
        final e = LocalEvent.fromJson(map);
        if (e.id.isNotEmpty) eventMap[e.id] = e;
      }
    } catch (_) {}

    final list = eventMap.values.toList();
    list.sort((a, b) => a.startsAt.compareTo(b.startsAt));

    if (mounted) {
      setState(() {
        _events = list;
        _isLoading = false;
      });
    }
  }

  Future<void> _deleteEvent(String id) async {
    try {
      await Supabase.instance.client.from('events').delete().eq('id', id);
    } catch (_) {}

    try {
      final prefs = await SharedPreferences.getInstance();
      final localJson = prefs.getStringList('local_admin_events') ?? [];
      final updatedJson = localJson.where((jsonStr) {
        final map = jsonDecode(jsonStr) as Map<String, dynamic>;
        return map['id']?.toString() != id;
      }).toList();
      await prefs.setStringList('local_admin_events', updatedJson);
    } catch (_) {}

    ref.invalidate(localEventsProvider);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Evento eliminado correctamente.')),
      );
    }
    _loadEvents();
  }

  void _showAddEventDialog({LocalEvent? eventToEdit}) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _AddEventBottomSheet(
        eventToEdit: eventToEdit,
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
        onPressed: () => _showAddEventDialog(),
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
                    trailing: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        IconButton(
                          icon: const Icon(Icons.edit_outlined, color: AppTheme.primary),
                          onPressed: () => _showAddEventDialog(eventToEdit: event),
                        ),
                        IconButton(
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
                      ],
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
  final LocalEvent? eventToEdit;
  final VoidCallback onEventCreated;
  const _AddEventBottomSheet({this.eventToEdit, required this.onEventCreated});

  @override
  ConsumerState<_AddEventBottomSheet> createState() => _AddEventBottomSheetState();
}

class _AddEventBottomSheetState extends ConsumerState<_AddEventBottomSheet> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _cityController = TextEditingController(text: 'Barranquilla');
  final _countryController = TextEditingController(text: 'Colombia');

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
  void initState() {
    super.initState();
    final event = widget.eventToEdit;
    if (event != null) {
      _titleController.text = event.title;
      _descriptionController.text = event.description;
      _cityController.text = event.city;
      _countryController.text = event.country.isNotEmpty ? event.country : 'Colombia';
      _category = event.category;
      _startsAt = event.startsAt;
      _endsAt = event.endsAt;
      _isMultiDay = event.endsAt != null;
      _startTime = TimeOfDay(hour: event.startsAt.hour, minute: event.startsAt.minute);
      if (event.endsAt != null) {
        _endTime = TimeOfDay(hour: event.endsAt!.hour, minute: event.endsAt!.minute);
      }
      _selectedLocation = event.location;
      if (event.imageUrl.isNotEmpty) {
        _localImageBase64 = event.imageUrl;
      }
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _cityController.dispose();
    _countryController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    try {
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 400,
        maxHeight: 400,
        imageQuality: 50,
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
        'name': _titleController.text.trim().isNotEmpty ? _titleController.text.trim() : 'Evento',
        'title': _titleController.text.trim().isNotEmpty ? _titleController.text.trim() : 'Evento',
        'description': _descriptionController.text.trim().isNotEmpty ? _descriptionController.text.trim() : 'Evento recomendado.',
        'country': _countryController.text.trim().isNotEmpty ? _countryController.text.trim() : 'Colombia',
        'city': _cityController.text.trim().isNotEmpty ? _cityController.text.trim() : 'Barranquilla',
        'category': _category.toLowerCase(),
        'start_date': startDateTime.toIso8601String(),
        'starts_at': startDateTime.toIso8601String(),
        'end_date': endDateTime.toIso8601String(),
        'ends_at': endDateTime.toIso8601String(),
        'latitude': _selectedLocation.latitude,
        'longitude': _selectedLocation.longitude,
        'image_url': finalImageUrl,
        'source': 'admin',
      };

      bool savedToSupabase = false;
      Object? supabaseError;
      final isEditing = widget.eventToEdit != null;

      Future<bool> trySend(Map<String, dynamic> data) async {
        try {
          if (isEditing) {
            await Supabase.instance.client
                .from('events')
                .update(data)
                .eq('id', widget.eventToEdit!.id);
          } else {
            await Supabase.instance.client.from('events').insert(data);
          }
          return true;
        } catch (e) {
          supabaseError = e;
          if (e.toString().contains('events_category_check') || e.toString().contains('23514')) {
            for (final catValue in ['cultural', 'Cultural', 'tourist', 'general', 'other']) {
              try {
                final retryData = Map<String, dynamic>.from(data)..['category'] = catValue;
                if (isEditing) {
                  await Supabase.instance.client
                      .from('events')
                      .update(retryData)
                      .eq('id', widget.eventToEdit!.id);
                } else {
                  await Supabase.instance.client.from('events').insert(retryData);
                }
                return true;
              } catch (_) {}
            }
          }
          return false;
        }
      }

      // Tier 1: Full payload satisfying all NOT NULL constraints
      savedToSupabase = await trySend(payload);

      // Tier 2: Remove 'starts_at' / 'ends_at' if DB schema only has 'start_date' / 'end_date'
      if (!savedToSupabase) {
        final p2 = Map<String, dynamic>.from(payload)
          ..remove('starts_at')
          ..remove('ends_at');
        savedToSupabase = await trySend(p2);
      }

      // Tier 3: Remove 'start_date' / 'end_date' if DB schema only has 'starts_at' / 'ends_at'
      if (!savedToSupabase) {
        final p3 = Map<String, dynamic>.from(payload)
          ..remove('start_date')
          ..remove('end_date');
        savedToSupabase = await trySend(p3);
      }

      // Tier 4: Remove 'title' if DB schema only has 'name'
      if (!savedToSupabase) {
        final p4 = Map<String, dynamic>.from(payload)..remove('title');
        savedToSupabase = await trySend(p4);
      }

      // Tier 5: With default image URL if image payload was too large
      if (!savedToSupabase) {
        final p5 = Map<String, dynamic>.from(payload)
          ..['image_url'] = 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600';
        savedToSupabase = await trySend(p5);
      }

      if (!savedToSupabase) {
        final prefs = await SharedPreferences.getInstance();
        final existingJson = prefs.getStringList('local_admin_events') ?? [];
        if (isEditing) {
          final updatedJson = existingJson.map((jsonStr) {
            final map = jsonDecode(jsonStr) as Map<String, dynamic>;
            if (map['id']?.toString() == widget.eventToEdit!.id) {
              final payloadWithId = Map<String, dynamic>.from(payload)
                ..['id'] = widget.eventToEdit!.id;
              return jsonEncode(payloadWithId);
            }
            return jsonStr;
          }).toList();
          await prefs.setStringList('local_admin_events', updatedJson);
        } else {
          final payloadWithId = Map<String, dynamic>.from(payload)
            ..['id'] = 'local-${DateTime.now().millisecondsSinceEpoch}';
          existingJson.add(jsonEncode(payloadWithId));
          await prefs.setStringList('local_admin_events', existingJson);
        }
      }

      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              savedToSupabase
                  ? (isEditing ? '¡Evento actualizado en la nube!' : '¡Evento guardado exitosamente en la nube!')
                  : 'Guardado localmente. Error en nube: ${supabaseError ?? 'desconocido'}',
            ),
            backgroundColor: savedToSupabase ? Colors.green.shade800 : Colors.orange.shade800,
          ),
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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    widget.eventToEdit != null ? 'Editar Evento' : 'Nuevo Evento Cultural',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                  ),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close_rounded),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(
                  labelText: 'Título del Evento',
                  hintText: 'Ej: Festival de la Leyenda Vallenata',
                  prefixIcon: Icon(Icons.title),
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'Ingresa un título' : null,
              ),
              const SizedBox(height: 14),
              TextFormField(
                controller: _descriptionController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Descripción del Evento',
                  alignLabelWithHint: true,
                  hintText: 'Explica de qué trata el evento, actividades o atracciones...',
                  prefixIcon: Padding(
                    padding: EdgeInsets.only(bottom: 40),
                    child: Icon(Icons.description_outlined),
                  ),
                  border: OutlineInputBorder(),
                ),
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
                    child: TextFormField(
                      controller: _countryController,
                      decoration: const InputDecoration(
                        labelText: 'País',
                        prefixIcon: Icon(Icons.public_rounded),
                        border: OutlineInputBorder(),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Ingresa el país' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
              DropdownButtonFormField<String>(
                isExpanded: true,
                initialValue: _category,
                decoration: const InputDecoration(
                  labelText: 'Categoría del Evento',
                  prefixIcon: Icon(Icons.category_outlined),
                  border: OutlineInputBorder(),
                ),
                items: _categories.map((c) => DropdownMenuItem(value: c, child: Text(c, overflow: TextOverflow.ellipsis))).toList(),
                onChanged: (val) {
                  if (val != null) setState(() => _category = val);
                },
              ),
              const SizedBox(height: 16),
              // Multi-day toggle with responsive Row
              Container(
                padding: const EdgeInsets.symmetric(vertical: 4),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('¿Evento de varios días?', style: TextStyle(fontWeight: FontWeight.bold)),
                          Text('Ej: parques, circos, ferias o exposiciones', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                        ],
                      ),
                    ),
                    Switch(
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
                  ],
                ),
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
                          firstDate: DateTime.now().subtract(const Duration(days: 365)),
                          lastDate: DateTime.now().add(const Duration(days: 365)),
                        );
                        if (date != null) {
                          setState(() {
                            _startsAt = date;
                            if (_endsAt == null || _endsAt!.isBefore(_startsAt)) {
                              _endsAt = _startsAt.add(const Duration(days: 1));
                            }
                          });
                        }
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
                          final minDate = _startsAt;
                          DateTime initial = _endsAt ?? _startsAt.add(const Duration(days: 1));
                          if (initial.isBefore(minDate)) {
                            initial = minDate;
                          }
                          final date = await showDatePicker(
                            context: context,
                            initialDate: initial,
                            firstDate: minDate,
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
