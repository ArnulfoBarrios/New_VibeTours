import '../domain/models.dart';

class CityBlueprint {
  const CityBlueprint({
    required this.city,
    required this.country,
    required this.cover,
    required this.stops,
    required this.tourCount,
  });

  final String city;
  final String country;
  final String cover;
  final List<StopBlueprint> stops;
  final int tourCount;
}

class StopBlueprint {
  const StopBlueprint(this.name, this.lat, this.lng, this.image);

  final String name;
  final double lat;
  final double lng;
  final String image;
}

const _profiles = [
  (
    type: TourType.cultural,
    title: 'Museos, arte y memoria',
    focus: 'arte, identidad local y patrimonio vivo',
    stops: [1, 6, 7, 4, 3],
  ),
  (
    type: TourType.historical,
    title: 'Historia esencial',
    focus: 'origenes, arquitectura y memoria historica',
    stops: [6, 7, 4, 2, 8],
  ),
  (
    type: TourType.gastronomic,
    title: 'Sabores locales',
    focus: 'mercados, cocina tipica y zonas de encuentro',
    stops: [5, 8, 0, 4, 9],
  ),
  (
    type: TourType.urban,
    title: 'Ritmo urbano',
    focus: 'barrios caminables, miradores y vida cotidiana',
    stops: [0, 3, 5, 4, 8],
  ),
  (
    type: TourType.ecological,
    title: 'Naturaleza cercana',
    focus: 'paisaje, aire libre y pausas tranquilas',
    stops: [2, 0, 3, 5, 4],
  ),
  (
    type: TourType.family,
    title: 'Plan familiar',
    focus: 'paradas seguras, ritmo suave y actividades para todos',
    stops: [0, 3, 1, 5, 7],
  ),
];

const _colombiaCities = [
  CityBlueprint(
    city: 'Barranquilla',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1583422409516-2895a77efded?auto=format&fit=crop&w=1200&q=80',
    tourCount: 4,
    stops: [
      StopBlueprint(
        'Gran Malecon del Rio',
        11.0191,
        -74.8007,
        'https://upload.wikimedia.org/wikipedia/commons/4/49/Gran_Malecon_Barranquilla.jpg',
      ),
      StopBlueprint(
        'Museo del Caribe',
        10.9878,
        -74.7795,
        'https://upload.wikimedia.org/wikipedia/commons/0/03/Museo_del_Caribe_Barranquilla.jpg',
      ),
      StopBlueprint(
        'Castillo de Salgar',
        11.0307,
        -74.9277,
        'https://upload.wikimedia.org/wikipedia/commons/6/64/Castillo_de_Salgar.jpg',
      ),
      StopBlueprint(
        'Ventana al Mundo',
        11.0165,
        -74.8489,
        'https://upload.wikimedia.org/wikipedia/commons/f/f6/Ventana_al_Mundo_Barranquilla.jpg',
      ),
      StopBlueprint(
        'Barrio El Prado',
        10.9987,
        -74.8079,
        'https://upload.wikimedia.org/wikipedia/commons/8/89/El_Prado_Barranquilla.jpg',
      ),
      StopBlueprint(
        'Caiman del Rio',
        11.0201,
        -74.7948,
        'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=900&q=80',
      ),
      StopBlueprint(
        'Antigua Aduana',
        10.9917,
        -74.7804,
        'https://images.unsplash.com/photo-1518005020951-eccb494ad742?auto=format&fit=crop&w=900&q=80',
      ),
      StopBlueprint(
        'Catedral Metropolitana Maria Reina',
        10.9877,
        -74.7889,
        'https://images.unsplash.com/photo-1520637836862-4d197d17c86a?auto=format&fit=crop&w=900&q=80',
      ),
      StopBlueprint(
        'Paseo Bolivar',
        10.9829,
        -74.7847,
        'https://images.unsplash.com/photo-1519501025264-65ba15a82390?auto=format&fit=crop&w=900&q=80',
      ),
      StopBlueprint(
        'Mercado Barranquillita',
        10.9822,
        -74.7709,
        'https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=900&q=80',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Cartagena',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1583997052301-0042b33fc598?auto=format&fit=crop&w=1200&q=80',
    tourCount: 4,
    stops: [
      StopBlueprint(
        'Torre del Reloj',
        10.4236,
        -75.5501,
        'https://upload.wikimedia.org/wikipedia/commons/5/58/Torre_del_Reloj_Cartagena.jpg',
      ),
      StopBlueprint(
        'Castillo San Felipe',
        10.4229,
        -75.5392,
        'https://upload.wikimedia.org/wikipedia/commons/3/37/Castillo_San_Felipe_de_Barajas.jpg',
      ),
      StopBlueprint(
        'Plaza Santo Domingo',
        10.4242,
        -75.5519,
        'https://upload.wikimedia.org/wikipedia/commons/b/b2/Plaza_Santo_Domingo_Cartagena.jpg',
      ),
      StopBlueprint(
        'Getsemani',
        10.4214,
        -75.5447,
        'https://upload.wikimedia.org/wikipedia/commons/e/e5/Getsemani_Cartagena.jpg',
      ),
      StopBlueprint(
        'Las Bovedas',
        10.4291,
        -75.5487,
        'https://upload.wikimedia.org/wikipedia/commons/d/d6/Las_Bovedas_Cartagena.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Santa Marta',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1200&q=80',
    tourCount: 4,
    stops: [
      StopBlueprint(
        'Parque de los Novios',
        11.2408,
        -74.2122,
        'https://upload.wikimedia.org/wikipedia/commons/e/e7/Parque_de_los_Novios_Santa_Marta.jpg',
      ),
      StopBlueprint(
        'Quinta de San Pedro Alejandrino',
        11.2281,
        -74.1828,
        'https://upload.wikimedia.org/wikipedia/commons/b/b8/Quinta_de_San_Pedro_Alejandrino.jpg',
      ),
      StopBlueprint(
        'Bahia de Santa Marta',
        11.2439,
        -74.2145,
        'https://upload.wikimedia.org/wikipedia/commons/3/31/Bahia_de_Santa_Marta.jpg',
      ),
      StopBlueprint(
        'Taganga',
        11.2676,
        -74.1911,
        'https://upload.wikimedia.org/wikipedia/commons/1/11/Taganga_Colombia.jpg',
      ),
      StopBlueprint(
        'El Rodadero',
        11.2042,
        -74.2266,
        'https://upload.wikimedia.org/wikipedia/commons/1/16/Rodadero_Santa_Marta.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Bogota',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1568632234157-ce7aecd03d0d?auto=format&fit=crop&w=1200&q=80',
    tourCount: 4,
    stops: [
      StopBlueprint(
        'Monserrate',
        4.6059,
        -74.0550,
        'https://upload.wikimedia.org/wikipedia/commons/0/0c/Monserrate_Bogota.jpg',
      ),
      StopBlueprint(
        'Museo del Oro',
        4.6019,
        -74.0721,
        'https://upload.wikimedia.org/wikipedia/commons/9/9b/Museo_del_Oro_Bogota.jpg',
      ),
      StopBlueprint(
        'La Candelaria',
        4.5964,
        -74.0730,
        'https://upload.wikimedia.org/wikipedia/commons/2/2c/La_Candelaria_Bogota.jpg',
      ),
      StopBlueprint(
        'Plaza de Bolivar',
        4.5981,
        -74.0758,
        'https://upload.wikimedia.org/wikipedia/commons/a/a1/Plaza_de_Bolivar_Bogota.jpg',
      ),
      StopBlueprint(
        'Parque Simon Bolivar',
        4.6586,
        -74.0935,
        'https://upload.wikimedia.org/wikipedia/commons/3/3f/Parque_Simon_Bolivar_Bogota.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Medellin',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?auto=format&fit=crop&w=1200&q=80',
    tourCount: 4,
    stops: [
      StopBlueprint(
        'Plaza Botero',
        6.2526,
        -75.5683,
        'https://upload.wikimedia.org/wikipedia/commons/c/cb/Plaza_Botero_Medellin.jpg',
      ),
      StopBlueprint(
        'Comuna 13',
        6.2499,
        -75.6219,
        'https://upload.wikimedia.org/wikipedia/commons/b/bd/Comuna_13_Medellin.jpg',
      ),
      StopBlueprint(
        'Jardin Botanico',
        6.2705,
        -75.5653,
        'https://upload.wikimedia.org/wikipedia/commons/a/aa/Jardin_Botanico_Medellin.jpg',
      ),
      StopBlueprint(
        'Pueblito Paisa',
        6.2358,
        -75.5797,
        'https://upload.wikimedia.org/wikipedia/commons/a/a3/Pueblito_Paisa_Medellin.jpg',
      ),
      StopBlueprint(
        'Parque Arvi',
        6.2816,
        -75.5012,
        'https://upload.wikimedia.org/wikipedia/commons/8/86/Parque_Arvi.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Cali',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1598214886806-c87b84b7078b?auto=format&fit=crop&w=1200&q=80',
    tourCount: 3,
    stops: [
      StopBlueprint(
        'Cristo Rey',
        3.4358,
        -76.5656,
        'https://upload.wikimedia.org/wikipedia/commons/4/4c/Cristo_Rey_Cali.jpg',
      ),
      StopBlueprint(
        'San Antonio',
        3.4494,
        -76.5429,
        'https://upload.wikimedia.org/wikipedia/commons/b/bf/Barrio_San_Antonio_Cali.jpg',
      ),
      StopBlueprint(
        'Zoologico de Cali',
        3.4482,
        -76.5564,
        'https://upload.wikimedia.org/wikipedia/commons/c/c5/Zoologico_de_Cali.jpg',
      ),
      StopBlueprint(
        'Boulevard del Rio',
        3.4525,
        -76.5322,
        'https://upload.wikimedia.org/wikipedia/commons/e/e7/Boulevard_del_Rio_Cali.jpg',
      ),
      StopBlueprint(
        'Gato de Tejada',
        3.4521,
        -76.5455,
        'https://upload.wikimedia.org/wikipedia/commons/1/1d/Gato_de_Tejada_Cali.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Bucaramanga',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1200&q=80',
    tourCount: 3,
    stops: [
      StopBlueprint(
        'Parque del Agua',
        7.1288,
        -73.1198,
        'https://upload.wikimedia.org/wikipedia/commons/8/89/Parque_del_Agua_Bucaramanga.jpg',
      ),
      StopBlueprint(
        'Catedral Sagrada Familia',
        7.1193,
        -73.1227,
        'https://upload.wikimedia.org/wikipedia/commons/3/3d/Catedral_de_la_Sagrada_Familia_Bucaramanga.jpg',
      ),
      StopBlueprint(
        'Parque Garcia Rovira',
        7.1154,
        -73.1281,
        'https://upload.wikimedia.org/wikipedia/commons/0/06/Parque_Garcia_Rovira.jpg',
      ),
      StopBlueprint(
        'Ecoparque Cerro del Santisimo',
        7.0732,
        -73.0867,
        'https://upload.wikimedia.org/wikipedia/commons/1/18/Cerro_del_Santisimo.jpg',
      ),
      StopBlueprint(
        'Mesa de los Santos',
        6.8374,
        -73.0977,
        'https://upload.wikimedia.org/wikipedia/commons/0/0e/Mesa_de_los_Santos.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Villa de Leyva',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?auto=format&fit=crop&w=1200&q=80',
    tourCount: 3,
    stops: [
      StopBlueprint(
        'Plaza Mayor',
        5.6333,
        -73.5244,
        'https://upload.wikimedia.org/wikipedia/commons/1/1f/Villa_de_Leyva_Plaza_Mayor.jpg',
      ),
      StopBlueprint(
        'Casa Terracota',
        5.6387,
        -73.5337,
        'https://upload.wikimedia.org/wikipedia/commons/d/d5/Casa_Terracota.jpg',
      ),
      StopBlueprint(
        'Museo El Fosil',
        5.6544,
        -73.5297,
        'https://upload.wikimedia.org/wikipedia/commons/f/f2/Museo_El_Fosil.jpg',
      ),
      StopBlueprint(
        'Pozos Azules',
        5.6217,
        -73.5472,
        'https://upload.wikimedia.org/wikipedia/commons/0/04/Pozos_Azules_Villa_de_Leyva.jpg',
      ),
      StopBlueprint(
        'Convento Santo Ecce Homo',
        5.6927,
        -73.5407,
        'https://upload.wikimedia.org/wikipedia/commons/7/7e/Santo_Ecce_Homo.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'San Andres',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1611262588024-d12430b98920?auto=format&fit=crop&w=1200&q=80',
    tourCount: 3,
    stops: [
      StopBlueprint(
        'Johnny Cay',
        12.5992,
        -81.6897,
        'https://upload.wikimedia.org/wikipedia/commons/4/43/Johnny_Cay_San_Andres.jpg',
      ),
      StopBlueprint(
        'Hoyo Soplador',
        12.4832,
        -81.7297,
        'https://upload.wikimedia.org/wikipedia/commons/1/12/Hoyo_Soplador.jpg',
      ),
      StopBlueprint(
        'La Piscinita',
        12.5121,
        -81.7331,
        'https://upload.wikimedia.org/wikipedia/commons/7/75/La_Piscinita_San_Andres.jpg',
      ),
      StopBlueprint(
        'Cueva de Morgan',
        12.5473,
        -81.7216,
        'https://upload.wikimedia.org/wikipedia/commons/8/88/Cueva_de_Morgan.jpg',
      ),
      StopBlueprint(
        'San Luis',
        12.5282,
        -81.7114,
        'https://upload.wikimedia.org/wikipedia/commons/6/60/San_Luis_San_Andres.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Guatape',
    country: 'Colombia',
    cover:
        'https://images.unsplash.com/photo-1619995745882-f4128ac82ad6?auto=format&fit=crop&w=1200&q=80',
    tourCount: 3,
    stops: [
      StopBlueprint(
        'Piedra del Penol',
        6.2206,
        -75.1785,
        'https://upload.wikimedia.org/wikipedia/commons/b/bb/Piedra_del_Penol.jpg',
      ),
      StopBlueprint(
        'Malecon de Guatape',
        6.2326,
        -75.1586,
        'https://upload.wikimedia.org/wikipedia/commons/7/77/Guatape_Malecon.jpg',
      ),
      StopBlueprint(
        'Plazoleta de los Zocalos',
        6.2339,
        -75.1597,
        'https://upload.wikimedia.org/wikipedia/commons/e/e6/Guatape_Zocalos.jpg',
      ),
      StopBlueprint(
        'Represa de Guatape',
        6.2254,
        -75.1677,
        'https://upload.wikimedia.org/wikipedia/commons/5/5a/Embalse_Guatape.jpg',
      ),
      StopBlueprint(
        'Calle del Recuerdo',
        6.2341,
        -75.1605,
        'https://upload.wikimedia.org/wikipedia/commons/c/c7/Calle_del_Recuerdo_Guatape.jpg',
      ),
    ],
  ),
];

const _internationalCities = [
  CityBlueprint(
    city: 'Paris',
    country: 'Francia',
    cover:
        'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Torre Eiffel',
        48.8584,
        2.2945,
        'https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg',
      ),
      StopBlueprint(
        'Museo del Louvre',
        48.8606,
        2.3376,
        'https://upload.wikimedia.org/wikipedia/commons/a/af/Louvre_Museum_Wikimedia_Commons.jpg',
      ),
      StopBlueprint(
        'Notre-Dame',
        48.8530,
        2.3499,
        'https://upload.wikimedia.org/wikipedia/commons/a/a6/Notre_Dame_de_Paris_2013.jpg',
      ),
      StopBlueprint(
        'Montmartre',
        48.8867,
        2.3431,
        'https://upload.wikimedia.org/wikipedia/commons/6/6d/Montmartre_Paris.jpg',
      ),
      StopBlueprint(
        'Jardin de Luxemburgo',
        48.8462,
        2.3372,
        'https://upload.wikimedia.org/wikipedia/commons/2/2c/Jardin_du_Luxembourg_Paris.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Roma',
    country: 'Italia',
    cover:
        'https://images.unsplash.com/photo-1529260830199-42c24126f198?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Coliseo',
        41.8902,
        12.4922,
        'https://upload.wikimedia.org/wikipedia/commons/d/de/Colosseo_2020.jpg',
      ),
      StopBlueprint(
        'Foro Romano',
        41.8925,
        12.4853,
        'https://upload.wikimedia.org/wikipedia/commons/6/6a/Roman_Forum_Rome.jpg',
      ),
      StopBlueprint(
        'Fontana di Trevi',
        41.9009,
        12.4833,
        'https://upload.wikimedia.org/wikipedia/commons/f/fb/Trevi_Fountain_Rome.jpg',
      ),
      StopBlueprint(
        'Panteon',
        41.8986,
        12.4769,
        'https://upload.wikimedia.org/wikipedia/commons/4/44/Pantheon_Rome.jpg',
      ),
      StopBlueprint(
        'Piazza Navona',
        41.8992,
        12.4731,
        'https://upload.wikimedia.org/wikipedia/commons/0/03/Piazza_Navona_Rome.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Londres',
    country: 'Reino Unido',
    cover:
        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Big Ben',
        51.5007,
        -0.1246,
        'https://upload.wikimedia.org/wikipedia/commons/4/45/Elizabeth_Tower_June_2022.jpg',
      ),
      StopBlueprint(
        'London Eye',
        51.5033,
        -0.1195,
        'https://upload.wikimedia.org/wikipedia/commons/d/d6/London-Eye-2009.JPG',
      ),
      StopBlueprint(
        'Tower Bridge',
        51.5055,
        -0.0754,
        'https://upload.wikimedia.org/wikipedia/commons/6/63/Tower_Bridge_from_Shad_Thames.jpg',
      ),
      StopBlueprint(
        'British Museum',
        51.5194,
        -0.1270,
        'https://upload.wikimedia.org/wikipedia/commons/9/9a/British_Museum_from_NE_2.JPG',
      ),
      StopBlueprint(
        'Covent Garden',
        51.5117,
        -0.1240,
        'https://upload.wikimedia.org/wikipedia/commons/e/e7/Covent_Garden_Market.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Nueva York',
    country: 'Estados Unidos',
    cover:
        'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Times Square',
        40.7580,
        -73.9855,
        'https://upload.wikimedia.org/wikipedia/commons/a/a1/Times_Square_New_York_City_HDR.jpg',
      ),
      StopBlueprint(
        'Central Park',
        40.7829,
        -73.9654,
        'https://upload.wikimedia.org/wikipedia/commons/8/86/Central_Park_New_York_City_New_York_23.jpg',
      ),
      StopBlueprint(
        'Brooklyn Bridge',
        40.7061,
        -73.9969,
        'https://upload.wikimedia.org/wikipedia/commons/0/00/Brooklyn_Bridge_Manhattan.jpg',
      ),
      StopBlueprint(
        'Statue of Liberty',
        40.6892,
        -74.0445,
        'https://upload.wikimedia.org/wikipedia/commons/a/a1/Statue_of_Liberty_7.jpg',
      ),
      StopBlueprint(
        'High Line',
        40.7480,
        -74.0048,
        'https://upload.wikimedia.org/wikipedia/commons/1/1f/High_Line_20th_Street.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Tokio',
    country: 'Japon',
    cover:
        'https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Shibuya Crossing',
        35.6595,
        139.7005,
        'https://upload.wikimedia.org/wikipedia/commons/0/0f/Shibuya_Crossing_2023.jpg',
      ),
      StopBlueprint(
        'Senso-ji',
        35.7148,
        139.7967,
        'https://upload.wikimedia.org/wikipedia/commons/5/5d/Sensoji_Temple_2023.jpg',
      ),
      StopBlueprint(
        'Tokyo Skytree',
        35.7101,
        139.8107,
        'https://upload.wikimedia.org/wikipedia/commons/3/37/Tokyo_Skytree_2014.jpg',
      ),
      StopBlueprint(
        'Meiji Shrine',
        35.6764,
        139.6993,
        'https://upload.wikimedia.org/wikipedia/commons/e/e8/Meiji_Shrine_Torii.jpg',
      ),
      StopBlueprint(
        'Ueno Park',
        35.7156,
        139.7745,
        'https://upload.wikimedia.org/wikipedia/commons/e/e6/Ueno_Park_Tokyo.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Kioto',
    country: 'Japon',
    cover:
        'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Fushimi Inari',
        34.9671,
        135.7727,
        'https://upload.wikimedia.org/wikipedia/commons/9/9f/Fushimi_Inari-taisha_torii.jpg',
      ),
      StopBlueprint(
        'Kinkaku-ji',
        35.0394,
        135.7292,
        'https://upload.wikimedia.org/wikipedia/commons/0/0e/Kinkaku-ji_the_Golden_Pavilion_in_Kyoto_overlooking_the_lake_-_high_rez.JPG',
      ),
      StopBlueprint(
        'Arashiyama Bamboo Grove',
        35.0170,
        135.6718,
        'https://upload.wikimedia.org/wikipedia/commons/8/8b/Arashiyama_Bamboo_Grove.jpg',
      ),
      StopBlueprint(
        'Gion',
        35.0038,
        135.7785,
        'https://upload.wikimedia.org/wikipedia/commons/1/15/Gion_Kyoto.jpg',
      ),
      StopBlueprint(
        'Kiyomizu-dera',
        34.9949,
        135.7850,
        'https://upload.wikimedia.org/wikipedia/commons/1/1b/Kiyomizu-dera_in_Kyoto-r.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Seul',
    country: 'Corea del Sur',
    cover:
        'https://images.unsplash.com/photo-1538485399081-7c8edce058f1?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Gyeongbokgung',
        37.5796,
        126.9770,
        'https://upload.wikimedia.org/wikipedia/commons/3/32/Gyeongbokgung_palace.jpg',
      ),
      StopBlueprint(
        'Bukchon Hanok Village',
        37.5826,
        126.9836,
        'https://upload.wikimedia.org/wikipedia/commons/5/5d/Bukchon_Hanok_Village.jpg',
      ),
      StopBlueprint(
        'N Seoul Tower',
        37.5512,
        126.9882,
        'https://upload.wikimedia.org/wikipedia/commons/9/98/N_Seoul_Tower_2012.jpg',
      ),
      StopBlueprint(
        'Myeongdong',
        37.5637,
        126.9850,
        'https://upload.wikimedia.org/wikipedia/commons/f/f9/Myeongdong_Seoul.jpg',
      ),
      StopBlueprint(
        'Dongdaemun Design Plaza',
        37.5665,
        127.0094,
        'https://upload.wikimedia.org/wikipedia/commons/8/80/Dongdaemun_Design_Plaza_2014.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Ciudad de Mexico',
    country: 'Mexico',
    cover:
        'https://images.unsplash.com/photo-1518105779142-d975f22f1b0a?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Zocalo',
        19.4326,
        -99.1332,
        'https://upload.wikimedia.org/wikipedia/commons/c/c1/Zocalo_Mexico_City.jpg',
      ),
      StopBlueprint(
        'Palacio de Bellas Artes',
        19.4352,
        -99.1412,
        'https://upload.wikimedia.org/wikipedia/commons/6/6f/Palacio_de_Bellas_Artes_Mexico_City.jpg',
      ),
      StopBlueprint(
        'Templo Mayor',
        19.4346,
        -99.1314,
        'https://upload.wikimedia.org/wikipedia/commons/e/e0/Templo_Mayor_Mexico_City.jpg',
      ),
      StopBlueprint(
        'Chapultepec',
        19.4204,
        -99.1819,
        'https://upload.wikimedia.org/wikipedia/commons/2/24/Castillo_de_Chapultepec.jpg',
      ),
      StopBlueprint(
        'Coyoacan',
        19.3467,
        -99.1617,
        'https://upload.wikimedia.org/wikipedia/commons/e/e8/Coyoacan_Mexico_City.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Barcelona',
    country: 'Espana',
    cover:
        'https://images.unsplash.com/photo-1539037116277-4db20889f2d4?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Sagrada Familia',
        41.4036,
        2.1744,
        'https://upload.wikimedia.org/wikipedia/commons/2/24/Sagrada_Familia_01.jpg',
      ),
      StopBlueprint(
        'Park Guell',
        41.4145,
        2.1527,
        'https://upload.wikimedia.org/wikipedia/commons/9/98/Park_Guell_01.jpg',
      ),
      StopBlueprint(
        'Casa Batllo',
        41.3917,
        2.1649,
        'https://upload.wikimedia.org/wikipedia/commons/3/3d/Casa_Batllo_2022.jpg',
      ),
      StopBlueprint(
        'Barrio Gotico',
        41.3839,
        2.1763,
        'https://upload.wikimedia.org/wikipedia/commons/2/2e/Barri_Gotic_Barcelona.jpg',
      ),
      StopBlueprint(
        'La Rambla',
        41.3809,
        2.1730,
        'https://upload.wikimedia.org/wikipedia/commons/7/7f/La_Rambla_Barcelona.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Dubai',
    country: 'Emiratos Arabes Unidos',
    cover:
        'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Burj Khalifa',
        25.1972,
        55.2744,
        'https://upload.wikimedia.org/wikipedia/commons/9/93/Burj_Khalifa.jpg',
      ),
      StopBlueprint(
        'Dubai Mall',
        25.1985,
        55.2796,
        'https://upload.wikimedia.org/wikipedia/commons/e/e1/Dubai_Mall_2012.jpg',
      ),
      StopBlueprint(
        'Dubai Creek',
        25.2634,
        55.2972,
        'https://upload.wikimedia.org/wikipedia/commons/0/0b/Dubai_Creek.jpg',
      ),
      StopBlueprint(
        'Jumeirah Beach',
        25.2048,
        55.2252,
        'https://upload.wikimedia.org/wikipedia/commons/1/1d/Jumeirah_Beach_Dubai.jpg',
      ),
      StopBlueprint(
        'Al Fahidi',
        25.2633,
        55.2995,
        'https://upload.wikimedia.org/wikipedia/commons/8/8d/Al_Fahidi_Historical_Neighbourhood.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Estambul',
    country: 'Turquia',
    cover:
        'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Santa Sofia',
        41.0086,
        28.9802,
        'https://upload.wikimedia.org/wikipedia/commons/2/22/Hagia_Sophia_Mars_2013.jpg',
      ),
      StopBlueprint(
        'Mezquita Azul',
        41.0054,
        28.9768,
        'https://upload.wikimedia.org/wikipedia/commons/4/4f/Sultan_Ahmed_Mosque_Istanbul_Turkey_retouched.jpg',
      ),
      StopBlueprint(
        'Gran Bazar',
        41.0107,
        28.9680,
        'https://upload.wikimedia.org/wikipedia/commons/f/f5/Grand_Bazaar_Istanbul.jpg',
      ),
      StopBlueprint(
        'Palacio Topkapi',
        41.0115,
        28.9833,
        'https://upload.wikimedia.org/wikipedia/commons/5/52/Topkapi_Palace_Bosphorus.jpg',
      ),
      StopBlueprint(
        'Torre Galata',
        41.0256,
        28.9741,
        'https://upload.wikimedia.org/wikipedia/commons/1/16/Galata_Tower_Istanbul.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Bangkok',
    country: 'Tailandia',
    cover:
        'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Grand Palace',
        13.7500,
        100.4913,
        'https://upload.wikimedia.org/wikipedia/commons/5/5a/Grand_Palace_Bangkok.jpg',
      ),
      StopBlueprint(
        'Wat Arun',
        13.7437,
        100.4889,
        'https://upload.wikimedia.org/wikipedia/commons/0/0a/Wat_Arun_Bangkok.jpg',
      ),
      StopBlueprint(
        'Wat Pho',
        13.7465,
        100.4930,
        'https://upload.wikimedia.org/wikipedia/commons/2/2c/Wat_Pho_Bangkok.jpg',
      ),
      StopBlueprint(
        'Chatuchak Market',
        13.7999,
        100.5503,
        'https://upload.wikimedia.org/wikipedia/commons/a/a9/Chatuchak_Market_Bangkok.jpg',
      ),
      StopBlueprint(
        'Chao Phraya',
        13.7563,
        100.5018,
        'https://upload.wikimedia.org/wikipedia/commons/4/44/Chao_Phraya_River_Bangkok.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Singapur',
    country: 'Singapur',
    cover:
        'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Marina Bay Sands',
        1.2834,
        103.8607,
        'https://upload.wikimedia.org/wikipedia/commons/0/0d/Marina_Bay_Sands_from_Gardens_By_The_Bay.jpg',
      ),
      StopBlueprint(
        'Gardens by the Bay',
        1.2816,
        103.8636,
        'https://upload.wikimedia.org/wikipedia/commons/8/8f/Gardens_by_the_Bay_Supertree_Grove.jpg',
      ),
      StopBlueprint(
        'Merlion Park',
        1.2868,
        103.8545,
        'https://upload.wikimedia.org/wikipedia/commons/2/2b/Merlion_Park_Singapore.jpg',
      ),
      StopBlueprint(
        'Chinatown',
        1.2838,
        103.8437,
        'https://upload.wikimedia.org/wikipedia/commons/b/b4/Singapore_Chinatown.jpg',
      ),
      StopBlueprint(
        'Sentosa',
        1.2494,
        103.8303,
        'https://upload.wikimedia.org/wikipedia/commons/0/08/Sentosa_Island_Singapore.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Praga',
    country: 'Republica Checa',
    cover:
        'https://images.unsplash.com/photo-1541849546-216549ae216d?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Puente de Carlos',
        50.0865,
        14.4114,
        'https://upload.wikimedia.org/wikipedia/commons/e/e4/Charles_Bridge_Prague.jpg',
      ),
      StopBlueprint(
        'Castillo de Praga',
        50.0909,
        14.4005,
        'https://upload.wikimedia.org/wikipedia/commons/3/3b/Prague_Castle_2019.jpg',
      ),
      StopBlueprint(
        'Plaza Ciudad Vieja',
        50.0875,
        14.4213,
        'https://upload.wikimedia.org/wikipedia/commons/2/22/Old_Town_Square_Prague.jpg',
      ),
      StopBlueprint(
        'Reloj Astronomico',
        50.0870,
        14.4208,
        'https://upload.wikimedia.org/wikipedia/commons/6/6e/Prague_Orloj.jpg',
      ),
      StopBlueprint(
        'Malá Strana',
        50.0878,
        14.4046,
        'https://upload.wikimedia.org/wikipedia/commons/9/94/Mala_Strana_Prague.jpg',
      ),
    ],
  ),
  CityBlueprint(
    city: 'Sidney',
    country: 'Australia',
    cover:
        'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=1200&q=80',
    tourCount: 1,
    stops: [
      StopBlueprint(
        'Sydney Opera House',
        -33.8568,
        151.2153,
        'https://upload.wikimedia.org/wikipedia/commons/4/40/Sydney_Opera_House_Sails.jpg',
      ),
      StopBlueprint(
        'Harbour Bridge',
        -33.8523,
        151.2108,
        'https://upload.wikimedia.org/wikipedia/commons/8/8f/Sydney_Harbour_Bridge_from_Circular_Quay.jpg',
      ),
      StopBlueprint(
        'Bondi Beach',
        -33.8915,
        151.2767,
        'https://upload.wikimedia.org/wikipedia/commons/7/78/Bondi_Beach_Sydney.jpg',
      ),
      StopBlueprint(
        'The Rocks',
        -33.8599,
        151.2090,
        'https://upload.wikimedia.org/wikipedia/commons/6/6a/The_Rocks_Sydney.jpg',
      ),
      StopBlueprint(
        'Royal Botanic Garden',
        -33.8642,
        151.2166,
        'https://upload.wikimedia.org/wikipedia/commons/7/7e/Royal_Botanic_Garden_Sydney.jpg',
      ),
    ],
  ),
];

List<Tour> buildDemoTours() {
  final tours = <Tour>[];
  var index = 1;
  for (final city in [..._colombiaCities, ..._internationalCities]) {
    for (var i = 0; i < city.tourCount; i++) {
      final profile = _profiles[i % _profiles.length];
      final type = profile.type;
      final routeStops = _variantStops(city.stops, profile.stops);
      final stops = routeStops
          .asMap()
          .entries
          .map(
            (entry) => TourStop(
              id: 'stop-$index-${entry.key + 1}',
              name: entry.value.name,
              location: GeoPoint(
                latitude: entry.value.lat,
                longitude: entry.value.lng,
              ),
              imageUrl: entry.value.image,
              description:
                  '${entry.value.name} aporta a esta ruta ${tourTypeLabel(type).toLowerCase()} por su relacion con ${profile.focus} en ${city.city}.',
              activities: _activitiesFor(type),
              tips: _tipsFor(type),
              suggestedMinutes: 25 + entry.key * 8,
              order: entry.key,
            ),
          )
          .toList();
      tours.add(
        Tour(
          id: 'tour-${index.toString().padLeft(2, '0')}',
          title: _tourTitle(city.city, type, i),
          country: city.country,
          city: city.city,
          type: type,
          description:
              'Ruta ${tourTypeLabel(type).toLowerCase()} por ${city.city}, centrada en ${profile.focus}. El orden evita repeticiones y combina paradas principales con contexto local.',
          coverUrl: city.cover,
          gallery: [
            city.cover,
            ...routeStops.take(3).map((stop) => stop.image),
          ],
          durationHours: 2.7 + (i % 4) * 1.15 + stops.length * 0.18,
          distanceKm: 4.8 + (i * 1.1) + stops.length * 0.35,
          rating: 4.55 + (index % 5) * 0.08,
          reviewCount: 42 + index * 9,
          likes: 120 + index * 17,
          difficulty:
              TourDifficulty.values[index % TourDifficulty.values.length],
          language: index.isEven ? 'es' : 'en',
          tags: [tourTypeLabel(type), city.country, city.city, profile.focus],
          stops: stops,
        ),
      );
      index++;
    }
  }
  return tours;
}

String _tourTitle(String city, TourType type, int variant) {
  final profile = _profiles[variant % _profiles.length];
  return '$city: ${profile.title}';
}

List<StopBlueprint> _variantStops(
  List<StopBlueprint> stops,
  List<int> indexes,
) {
  final selected = <StopBlueprint>[];
  for (final index in indexes) {
    final stop = stops[index % stops.length];
    if (!selected.any((item) => item.name == stop.name)) {
      selected.add(stop);
    }
  }
  for (final stop in stops) {
    if (!selected.any((item) => item.name == stop.name)) {
      selected.add(stop);
    }
  }
  if (selected.isEmpty) return stops;
  return selected.take(stops.length < 6 ? stops.length : 6).toList();
}

List<String> _activitiesFor(TourType type) {
  return switch (type) {
    TourType.gastronomic => [
      'Probar sabores locales',
      'Explorar zonas de encuentro',
      'Guardar recomendaciones culinarias',
    ],
    TourType.historical => [
      'Recorrer hitos patrimoniales',
      'Comparar arquitectura',
      'Escuchar narracion guiada',
    ],
    TourType.ecological => [
      'Disfrutar espacios abiertos',
      'Observar paisaje',
      'Hacer pausas tranquilas',
    ],
    TourType.family => [
      'Recorrer sin afan',
      'Tomar fotos familiares',
      'Hacer descansos programados',
    ],
    _ => [
      'Explorar el entorno',
      'Tomar fotografias',
      'Escuchar narracion guiada',
    ],
  };
}

List<String> _tipsFor(TourType type) {
  return switch (type) {
    TourType.gastronomic => [
      'Pregunta por platos de temporada',
      'Lleva efectivo para compras pequenas',
    ],
    TourType.historical => [
      'Haz el recorrido con luz de dia',
      'Lleva calzado comodo',
    ],
    TourType.ecological => ['Revisa clima antes de salir', 'No dejes residuos'],
    TourType.family => ['Lleva agua y snacks', 'Planea una pausa cada hora'],
    _ => ['Lleva agua y bateria externa', 'Confirma horarios antes de llegar'],
  };
}

List<LocalEvent> buildDemoEvents() => [
  LocalEvent(
    id: 'event-1',
    title: 'Festival cultural de la ciudad',
    city: 'Barranquilla',
    category: 'Cultura',
    startsAt: DateTime.now().add(const Duration(days: 2)),
    imageUrl:
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
    location: const GeoPoint(latitude: 11.0191, longitude: -74.8007),
  ),
  LocalEvent(
    id: 'event-2',
    title: 'Ruta gastronomica nocturna',
    city: 'Cartagena',
    category: 'Gastronomia',
    startsAt: DateTime.now().add(const Duration(days: 4)),
    imageUrl:
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=900&q=80',
    location: const GeoPoint(latitude: 10.4236, longitude: -75.5501),
  ),
  LocalEvent(
    id: 'event-3',
    title: 'Concierto al aire libre',
    city: 'Medellin',
    category: 'Musica',
    startsAt: DateTime.now().add(const Duration(days: 6)),
    imageUrl:
        'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=900&q=80',
    location: const GeoPoint(latitude: 6.2526, longitude: -75.5683),
  ),
];
