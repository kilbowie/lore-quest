import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Location, UserLocation } from '../types';
import { calculateDistance } from '../utils/geoUtils';
import { toast } from '@/components/ui/sonner';
import { Compass, Map } from 'lucide-react';

interface MapComponentProps {
  userLocation: UserLocation | null;
  discoveredLocations: Location[];
  onLocationDiscovered: (location: Location) => void;
  apiKey: string;
}

const DISCOVERY_THRESHOLD = 0.5; // miles

const MapComponent: React.FC<MapComponentProps> = ({ 
  userLocation, 
  discoveredLocations, 
  onLocationDiscovered, 
  apiKey 
}) => {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const hasMovedMapRef = useRef<boolean>(false);
  
  // UK locations - Continent = UK, Realm = Countries, Territory = Cities
  const cityLocations: Location[] = [
    // England - Adding all the requested cities
    {
      id: '1',
      name: 'London',
      territory: 'London',
      latitude: 51.5074,
      longitude: -0.1278,
      radius: 2.5,
      discovered: false,
      realm: 'England',
      description: 'The capital city, home to ancient towers and mystical artifacts'
    },
    {
      id: '2',
      name: 'Manchester',
      territory: 'Manchester',
      latitude: 53.4808,
      longitude: -2.2426,
      radius: 2,
      discovered: false,
      realm: 'England',
      description: 'A city of industry and innovation, where steam and magic meet'
    },
    {
      id: '3',
      name: 'Liverpool',
      territory: 'Liverpool',
      latitude: 53.4084,
      longitude: -2.9916,
      radius: 2,
      discovered: false,
      realm: 'England',
      description: 'A port city with tales of seafaring adventures and hidden treasures'
    },
    {
      id: '25',
      name: 'Bath',
      territory: 'Bath',
      latitude: 51.3751,
      longitude: -2.3618,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'An ancient spa city where healing waters flow with magical properties'
    },
    {
      id: '26',
      name: 'Birmingham',
      territory: 'Birmingham',
      latitude: 52.4862,
      longitude: -1.8904,
      radius: 2,
      discovered: false,
      realm: 'England',
      description: 'The heart of the Midlands, where fire and metal forge magical artifacts'
    },
    {
      id: '27',
      name: 'Bradford',
      territory: 'Bradford',
      latitude: 53.7960,
      longitude: -1.7594,
      radius: 1.8,
      discovered: false,
      realm: 'England',
      description: 'City of wool and textile magic, where enchanted fabrics are woven'
    },
    {
      id: '28',
      name: 'Brighton & Hove',
      territory: 'Brighton & Hove',
      latitude: 50.8225,
      longitude: -0.1372,
      radius: 1.8,
      discovered: false,
      realm: 'England',
      description: 'A seaside sanctuary where merfolk are rumored to gather beneath the pier'
    },
    {
      id: '29',
      name: 'Bristol',
      territory: 'Bristol',
      latitude: 51.4545,
      longitude: -2.5879,
      radius: 1.8,
      discovered: false,
      realm: 'England',
      description: 'A harbor city where pirates and merchants exchange exotic magical goods'
    },
    {
      id: '30',
      name: 'Cambridge',
      territory: 'Cambridge',
      latitude: 52.2053,
      longitude: 0.1218,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Where ancient tomes hold the secrets of magical formulas and incantations'
    },
    {
      id: '31',
      name: 'Canterbury',
      territory: 'Canterbury',
      latitude: 51.2798,
      longitude: 1.0828,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'A pilgrimage site where mystical bells toll and ancient spirits wander'
    },
    {
      id: '32',
      name: 'Carlisle',
      territory: 'Carlisle',
      latitude: 54.8924,
      longitude: -2.9405,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Border fortress where enchanted walls have held back invaders for centuries'
    },
    {
      id: '33',
      name: 'Chelmsford',
      territory: 'Chelmsford',
      latitude: 51.7355,
      longitude: 0.4738,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'A city of hidden bridges and gateways to mysterious other realms'
    },
    {
      id: '34',
      name: 'Chester',
      territory: 'Chester',
      latitude: 53.1903,
      longitude: -2.8916,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Roman stronghold where ancient legions still march along the enchanted walls'
    },
    {
      id: '35',
      name: 'Chichester',
      territory: 'Chichester',
      latitude: 50.8365,
      longitude: -0.7792,
      radius: 1.4,
      discovered: false,
      realm: 'England',
      description: 'Cathedral city where stained glass windows reveal glimpses of other worlds'
    },
    {
      id: '36',
      name: 'Colchester',
      territory: 'Colchester',
      latitude: 51.8959,
      longitude: 0.8918,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Oldest recorded town, where ancient Celtic magic still flows beneath the streets'
    },
    {
      id: '37',
      name: 'Coventry',
      territory: 'Coventry',
      latitude: 52.4068,
      longitude: -1.5197,
      radius: 1.8,
      discovered: false,
      realm: 'England',
      description: 'City reborn from fire where phoenix magic infuses the air'
    },
    {
      id: '38',
      name: 'Derby',
      territory: 'Derby',
      latitude: 52.9216,
      longitude: -1.4763,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'Industrial heart where clockwork and steam contraptions come alive'
    },
    {
      id: '39',
      name: 'Doncaster',
      territory: 'Doncaster',
      latitude: 53.5228,
      longitude: -1.1280,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'An ancient marketplace where magical traders have gathered for centuries'
    },
    {
      id: '40',
      name: 'Durham',
      territory: 'Durham',
      latitude: 54.7766,
      longitude: -1.5774,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'City of the prince-bishops, where a magical cathedral hovers between realms'
    },
    {
      id: '41',
      name: 'Ely',
      territory: 'Ely',
      latitude: 52.3980,
      longitude: 0.2626,
      radius: 1.4,
      discovered: false,
      realm: 'England',
      description: 'Island cathedral city once surrounded by mystical waters and protective fens'
    },
    {
      id: '42',
      name: 'Exeter',
      territory: 'Exeter',
      latitude: 50.7266,
      longitude: -3.5277,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Western stronghold where underground passages hide secret mystic chambers'
    },
    {
      id: '43',
      name: 'Gloucester',
      territory: 'Gloucester',
      latitude: 51.8642,
      longitude: -2.2380,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Cathedral city where magical choirs sing songs that shape reality'
    },
    {
      id: '44',
      name: 'Hereford',
      territory: 'Hereford',
      latitude: 52.0567,
      longitude: -2.7139,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Border realm where ancient maps show the paths between worlds'
    },
    {
      id: '45',
      name: 'Kingston-upon-Hull',
      territory: 'Kingston-upon-Hull',
      latitude: 53.7456,
      longitude: -0.3367,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'Maritime city where whispering tide-gates reveal secrets of the deep'
    },
    {
      id: '46',
      name: 'Lancaster',
      territory: 'Lancaster',
      latitude: 54.0466,
      longitude: -2.7976,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Castle city where royal enchantments have protected the realm for centuries'
    },
    {
      id: '47',
      name: 'Leeds',
      territory: 'Leeds',
      latitude: 53.8008,
      longitude: -1.5491,
      radius: 1.8,
      discovered: false,
      realm: 'England',
      description: 'A northern stronghold where ancient guilds still practice forgotten arts'
    },
    {
      id: '48',
      name: 'Leicester',
      territory: 'Leicester',
      latitude: 52.6369,
      longitude: -1.1398,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'City of lost kings where astral alignments reveal hidden pathways'
    },
    {
      id: '49',
      name: 'Lichfield',
      territory: 'Lichfield',
      latitude: 52.6812,
      longitude: -1.8271,
      radius: 1.4,
      discovered: false,
      realm: 'England',
      description: 'Three-spired sanctuary where magical light illuminates ancient mysteries'
    },
    {
      id: '50',
      name: 'Lincoln',
      territory: 'Lincoln',
      latitude: 53.2307,
      longitude: -0.5406,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Hilltop citadel where wind-magic carries messages across the realm'
    },
    {
      id: '51',
      name: 'Milton Keynes',
      territory: 'Milton Keynes',
      latitude: 52.0406,
      longitude: -0.7594,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'A planned city aligned with ley lines and mystical geometric patterns'
    },
    {
      id: '52',
      name: 'Newcastle-upon-Tyne',
      territory: 'Newcastle-upon-Tyne',
      latitude: 54.9783,
      longitude: -1.6178,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'Northern sentinel with ancient walls that guard against magical threats'
    },
    {
      id: '53',
      name: 'Norwich',
      territory: 'Norwich',
      latitude: 52.6309,
      longitude: 1.2974,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'City of stories where every cobblestone holds tales of magical encounters'
    },
    {
      id: '54',
      name: 'Nottingham',
      territory: 'Nottingham',
      latitude: 52.9548,
      longitude: -1.1581,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'Forest city where outlaws and archers practice woodland magic'
    },
    {
      id: '55',
      name: 'Oxford',
      territory: 'Oxford',
      latitude: 51.7520,
      longitude: -1.2577,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'City of dreaming spires, where arcane knowledge is studied and protected'
    },
    {
      id: '56',
      name: 'Peterborough',
      territory: 'Peterborough',
      latitude: 52.5694,
      longitude: -0.2425,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Cathedral city where stone angels guard portals to ethereal dimensions'
    },
    {
      id: '57',
      name: 'Plymouth',
      territory: 'Plymouth',
      latitude: 50.3755,
      longitude: -4.1427,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'Naval stronghold where sea-bound enchantments protect maritime vessels'
    },
    {
      id: '58',
      name: 'Portsmouth',
      territory: 'Portsmouth',
      latitude: 50.8198,
      longitude: -1.0880,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'Harbor fortress where naval enchantments guard the southern waters'
    },
    {
      id: '59',
      name: 'Preston',
      territory: 'Preston',
      latitude: 53.7632,
      longitude: -2.7031,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Guild city where ancient trade secrets are protected by mystical oaths'
    },
    {
      id: '60',
      name: 'Ripon',
      territory: 'Ripon',
      latitude: 54.1318,
      longitude: -1.5219,
      radius: 1.4,
      discovered: false,
      realm: 'England',
      description: 'Ancient market city where horns sound to ward off malevolent spirits'
    },
    {
      id: '61',
      name: 'Salford',
      territory: 'Salford',
      latitude: 53.4872,
      longitude: -2.2901,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Waterway city where dockside magic transforms mundane into extraordinary'
    },
    {
      id: '62',
      name: 'Salisbury',
      territory: 'Salisbury',
      latitude: 51.0689,
      longitude: -1.7957,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Spire city near ancient stone circles with powerful earth magic'
    },
    {
      id: '63',
      name: 'Sheffield',
      territory: 'Sheffield',
      latitude: 53.3811,
      longitude: -1.4701,
      radius: 1.8,
      discovered: false,
      realm: 'England',
      description: 'City of steel and shadows, where metalworkers craft enchanted blades'
    },
    {
      id: '64',
      name: 'Southampton',
      territory: 'Southampton',
      latitude: 50.9097,
      longitude: -1.4044,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'Port city where dimensional gateways allow trade with distant realms'
    },
    {
      id: '65',
      name: 'Southend-on-Sea',
      territory: 'Southend-on-Sea',
      latitude: 51.5386,
      longitude: 0.7139,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Pier town where tide magic reveals hidden treasures and ancient shipwrecks'
    },
    {
      id: '66',
      name: 'St Albans',
      territory: 'St Albans',
      latitude: 51.7554,
      longitude: -0.3365,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Roman-British settlement where martyrs and saints still walk unseen'
    },
    {
      id: '67',
      name: 'Stoke on Trent',
      territory: 'Stoke on Trent',
      latitude: 53.0027,
      longitude: -2.1794,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'Pottery city where clay vessels can trap spirits and store magical essences'
    },
    {
      id: '68',
      name: 'Sunderland',
      territory: 'Sunderland',
      latitude: 54.9069,
      longitude: -1.3834,
      radius: 1.7,
      discovered: false,
      realm: 'England',
      description: 'Shipbuilding haven where vessels are blessed with protective enchantments'
    },
    {
      id: '69',
      name: 'Truro',
      territory: 'Truro',
      latitude: 50.2632,
      longitude: -5.0515,
      radius: 1.4,
      discovered: false,
      realm: 'England',
      description: 'Cornwall\'s city where fairy folk still secretly trade in the markets'
    },
    {
      id: '70',
      name: 'Wakefield',
      territory: 'Wakefield',
      latitude: 53.6830,
      longitude: -1.4977,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Battle-touched city where echoes of historic conflicts still resonate'
    },
    {
      id: '71',
      name: 'Wells',
      territory: 'Wells',
      latitude: 51.2094,
      longitude: -2.6493,
      radius: 1.4,
      discovered: false,
      realm: 'England',
      description: 'England\'s smallest city, blessed with sacred springs and healing waters'
    },
    {
      id: '72',
      name: 'Westminster',
      territory: 'Westminster',
      latitude: 51.4975,
      longitude: -0.1357,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Seat of power where ancient parliamentary magic shapes the realm\'s fate'
    },
    {
      id: '73',
      name: 'Winchester',
      territory: 'Winchester',
      latitude: 51.0632,
      longitude: -1.3081,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Ancient capital where Arthurian legends and round table magic endure'
    },
    {
      id: '74',
      name: 'Wolverhampton',
      territory: 'Wolverhampton',
      latitude: 52.5870,
      longitude: -2.1288,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Industrial stronghold where metal and fire magic create powerful artifacts'
    },
    {
      id: '75',
      name: 'Worcester',
      territory: 'Worcester',
      latitude: 52.1936,
      longitude: -2.2215,
      radius: 1.5,
      discovered: false,
      realm: 'England',
      description: 'Cathedral city where the river serves as a boundary between realms'
    },
    {
      id: '76',
      name: 'York',
      territory: 'York',
      latitude: 53.9599,
      longitude: -1.0873,
      radius: 1.6,
      discovered: false,
      realm: 'England',
      description: 'Ancient walled city where ghostly legions still march through misty streets'
    },
    
    // Scotland - Adding the additional territories
    {
      id: '4',
      name: 'Edinburgh',
      territory: 'Edinburgh',
      latitude: 55.9533,
      longitude: -3.1883,
      radius: 2,
      discovered: false,
      realm: 'Scotland',
      description: 'The ancient seat of Scottish kings, where legends echo through the cobbled streets'
    },
    {
      id: '5',
      name: 'Glasgow',
      territory: 'Glasgow',
      latitude: 55.8642,
      longitude: -4.2518,
      radius: 2,
      discovered: false,
      realm: 'Scotland',
      description: 'A city of resilience and magic, where ancient clans once gathered'
    },
    {
      id: '10',
      name: 'Perth',
      territory: 'Perth',
      latitude: 56.3950,
      longitude: -3.4308,
      radius: 1.5,
      discovered: false,
      realm: 'Scotland',
      description: 'The ancient capital of Scotland, nestled between rolling hills and mystical rivers'
    },
    {
      id: '11',
      name: 'Aberdeen',
      territory: 'Aberdeen',
      latitude: 57.1497,
      longitude: -2.0943,
      radius: 1.8,
      discovered: false,
      realm: 'Scotland',
      description: 'The Silver City by the Sea, guardian of the eastern shores'
    },
    {
      id: '12',
      name: 'Inverness',
      territory: 'Inverness',
      latitude: 57.4778,
      longitude: -4.2247,
      radius: 1.6,
      discovered: false,
      realm: 'Scotland',
      description: 'Gateway to the Highlands, where the Loch Ness monster still lurks in deep waters'
    },
    {
      id: '13',
      name: 'Stirling',
      territory: 'Stirling',
      latitude: 56.1165,
      longitude: -3.9369,
      radius: 1.5,
      discovered: false,
      realm: 'Scotland',
      description: 'The key to the kingdom, where battles determined the fate of nations'
    },
    {
      id: '14',
      name: 'Dundee',
      territory: 'Dundee',
      latitude: 56.4620,
      longitude: -2.9707,
      radius: 1.7,
      discovered: false,
      realm: 'Scotland',
      description: 'City of discovery, where inventors and explorers changed the world'
    },
    {
      id: '15',
      name: 'Dunfermline',
      territory: 'Dunfermline',
      latitude: 56.0719,
      longitude: -3.4319,
      radius: 1.5,
      discovered: false,
      realm: 'Scotland',
      description: 'Ancient capital of Scotland, birthplace of kings and heroes'
    },
    
    // Wales - Adding the additional territories
    {
      id: '6',
      name: 'Cardiff',
      territory: 'Cardiff',
      latitude: 51.4816,
      longitude: -3.1791,
      radius: 1.8,
      discovered: false,
      realm: 'Wales',
      description: 'A coastal stronghold where dragons are said to still roam the mountains'
    },
    {
      id: '7',
      name: 'Swansea',
      territory: 'Swansea',
      latitude: 51.6214,
      longitude: -3.9436,
      radius: 1.8,
      discovered: false,
      realm: 'Wales',
      description: 'Where the sea brings both fortune and ancient curses'
    },
    {
      id: '16',
      name: 'Newport',
      territory: 'Newport',
      latitude: 51.5842,
      longitude: -2.9977,
      radius: 1.6,
      discovered: false,
      realm: 'Wales',
      description: 'The gateway to Wales, where ancient rivers meet the bustling sea'
    },
    {
      id: '17',
      name: 'Wrexham',
      territory: 'Wrexham',
      latitude: 53.0428,
      longitude: -2.9926,
      radius: 1.5,
      discovered: false,
      realm: 'Wales',
      description: 'The northern sentinel of Wales, guarding ancient wisdom and crafts'
    },
    {
      id: '18',
      name: 'Bangor',
      territory: 'Bangor',
      latitude: 53.2263,
      longitude: -4.1283,
      radius: 1.4,
      discovered: false,
      realm: 'Wales',
      description: 'The city of lore, where druids once gathered to share ancient knowledge'
    },
    {
      id: '19',
      name: 'St Asaph',
      territory: 'St Asaph',
      latitude: 53.2580,
      longitude: -3.4433,
      radius: 1.2,
      discovered: false,
      realm: 'Wales',
      description: 'The smallest city in Wales, blessed with sacred springs and healing waters'
    },
    {
      id: '20',
      name: 'St Davids',
      territory: 'St Davids',
      latitude: 51.8827,
      longitude: -5.2660,
      radius: 1.2,
      discovered: false,
      realm: 'Wales',
      description: 'The westernmost sanctuary, where pilgrims sought spiritual enlightenment'
    },
    
    // Northern Ireland - Adding the additional territories
    {
      id: '8',
      name: 'Belfast',
      territory: 'Belfast',
      latitude: 54.5973,
      longitude: -5.9301,
      radius: 2,
      discovered: false,
      realm: 'Northern Ireland',
      description: 'A city of walls and whispers, where the veil between worlds is thin'
    },
    {
      id: '9',
      name: 'Derry',
      territory: 'Derry',
      latitude: 54.9966,
      longitude: -7.3086,
      radius: 1.5,
      discovered: false,
      realm: 'Northern Ireland',
      description: 'Ancient stone circles mark this land of myth and mystery'
    },
    {
      id: '21',
      name: 'Armagh',
      territory: 'Armagh',
      latitude: 54.3503,
      longitude: -6.6528,
      radius: 1.4,
      discovered: false,
      realm: 'Northern Ireland',
      description: 'Spiritual capital of Ireland, where saints and scholars shared ancient wisdom'
    },
    {
      id: '22',
      name: 'Newry',
      territory: 'Newry',
      latitude: 54.1753,
      longitude: -6.3402,
      radius: 1.4,
      discovered: false,
      realm: 'Northern Ireland',
      description: 'The gateway between worlds, where mountains meet the sea'
    },
    {
      id: '23',
      name: 'Lisburn',
      territory: 'Lisburn',
      latitude: 54.5162,
      longitude: -6.0578,
      radius: 1.5,
      discovered: false,
      realm: 'Northern Ireland',
      description: 'City of light and linen, where skilled artisans crafted magical garments'
    },
    {
      id: '24',
      name: 'Bangor',
      territory: 'Bangor',
      latitude: 54.6573,
      longitude: -5.6697,
      radius: 1.4,
      discovered: false,
      realm: 'Northern Ireland',
      description: 'A seaside haven where merfolk are said to visit on moonlit nights'
    },
    
    // Ireland - Adding as a new continent with Irish cities as territories
    {
      id: '77',
      name: 'Dublin',
      territory: 'Dublin',
      latitude: 53.3498,
      longitude: -6.2603,
      radius: 2.0,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'The ancient capital where Celtic myths come alive in bustling streets'
    },
    {
      id: '78',
      name: 'Galway',
      territory: 'Galway',
      latitude: 53.2707,
      longitude: -9.0568,
      radius: 1.7,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'A coastal haven where music and magic flow through cobbled streets'
    },
    {
      id: '79',
      name: 'Limerick',
      territory: 'Limerick',
      latitude: 52.6638,
      longitude: -8.6267,
      radius: 1.7,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'River city of verse and rhyme where words hold ancient power'
    },
    {
      id: '80',
      name: 'Kilkenny',
      territory: 'Kilkenny',
      latitude: 52.6541,
      longitude: -7.2448,
      radius: 1.5,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'Medieval stronghold with enchanted castle walls and secret passages'
    },
    {
      id: '81',
      name: 'Cork',
      territory: 'Cork',
      latitude: 51.8979,
      longitude: -8.4706,
      radius: 1.8,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'Southern harbor city where rebel spirits and sea magic intertwine'
    },
    {
      id: '82',
      name: 'Killarney',
      territory: 'Killarney',
      latitude: 52.0599,
      longitude: -9.5044,
      radius: 1.6,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'Lakeside sanctuary surrounded by mystical forests and fairy circles'
    },
    {
      id: '83',
      name: 'Kinsale',
      territory: 'Kinsale',
      latitude: 51.7064,
      longitude: -8.5307,
      radius: 1.4,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'Colorful harbor where seafarers trade tales of merfolk and treasure'
    },
    {
      id: '84',
      name: 'Dingle',
      territory: 'Dingle',
      latitude: 52.1408,
      longitude: -10.2686,
      radius: 1.4,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'Westernmost settlement where dolphins guide ships with ancient wisdom'
    },
    {
      id: '85',
      name: 'Westport',
      territory: 'Westport',
      latitude: 53.8026,
      longitude: -9.5148,
      radius: 1.5,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'A coastal gem nestled beneath a sacred mountain of legend'
    },
    {
      id: '86',
      name: 'Waterford',
      territory: 'Waterford',
      latitude: 52.2593,
      longitude: -7.1128,
      radius: 1.6,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'Crystal city where glass-crafters capture moonlight in their wares'
    },
    {
      id: '87',
      name: 'Tralee',
      territory: 'Tralee',
      latitude: 52.2704,
      longitude: -9.7026,
      radius: 1.6,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'Kingdom\'s capital where ancient royalty still walks in twilight hours'
    },
    {
      id: '88',
      name: 'Athlone',
      territory: 'Athlone',
      latitude: 53.4233,
      longitude: -7.9406,
      radius: 1.5,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'River fortress at Ireland\'s heart where east and west magics converge'
    },
    {
      id: '89',
      name: 'Clifden',
      territory: 'Clifden',
      latitude: 53.4889,
      longitude: -10.0204,
      radius: 1.4,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'Sky road settlement where the veil between worlds grows thin at dusk'
    },
    {
      id: '90',
      name: 'Sligo',
      territory: 'Sligo',
      latitude: 54.2697,
      longitude: -8.4748,
      radius: 1.6,
      discovered: false,
      realm: 'Ireland',
      continent: 'Ireland',
      description: 'Yeats\' inspiration where poetry and supernatural beings dance together'
    }
  ];

  // Initialize map
  useEffect(() => {
    if (mapContainer.current && !map.current) {
      if (!apiKey) {
        console.error("Mapbox API key is required");
        return;
      }
      
      mapboxgl.accessToken = apiKey;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/dark-v11', // Dark style for fantasy feel
        center: userLocation ? [userLocation.longitude, userLocation.latitude] : [-98.5795, 39.8283], // US center
        zoom: userLocation ? 10 : 3,
        pitch: 45,
        attributionControl: false,
        antialias: true
      });

      // Apply custom fantasy styling
      map.current.on('load', () => {
        if (!map.current) return;
        
        // Add fog effect for more fantasy atmosphere
        map.current.setFog({
          'color': 'rgb(13, 17, 23)', // Dark blue from brand colors
          'high-color': 'rgb(36, 92, 223)',
          'horizon-blend': 0.2,
          'space-color': 'rgb(11, 11, 25)',
          'star-intensity': 0.8
        });

        // Custom styling for land and water
        if (map.current.getLayer('land')) {
          map.current.setPaintProperty('land', 'background-color', '#252D3A');
        }
        
        if (map.current.getLayer('water')) {
          map.current.setPaintProperty('water', 'fill-color', '#263A54');
        }
        
        // Add city markers for all locations
        cityLocations.forEach(city => {
          const isDiscovered = discoveredLocations.some(loc => loc.id === city.id);
          
          // Create fantasy-themed markers
          const el = document.createElement('div');
          el.className = `h-5 w-5 rounded-full flex items-center justify-center 
            ${isDiscovered 
              ? 'bg-lorequest-gold animate-pulse-glow border border-white'
              : 'bg-lorequest-dark border border-lorequest-gold opacity-50'}`;
          
          // Add tower icon inside marker for discovered locations
          if (isDiscovered) {
            const iconSvg = `
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-lorequest-dark">
                <path d="M19 6v14"></path><path d="M19 10h-7"></path><path d="M19 14h-8"></path><path d="M19 18H6"></path>
                <path d="M8 6h11"></path><path d="M5 10v8"></path><path d="M5 6a4 4 0 0 1 4-4c2 0 3 1 4 2 1-1 2-2 4-2a4 4 0 0 1 4 4"></path>
              </svg>
            `;
            el.innerHTML = iconSvg;
            el.classList.add('animate-float');
          }
          
          // Add the marker to the map with a custom popup
          new mapboxgl.Marker(el)
            .setLngLat([city.longitude, city.latitude])
            .setPopup(
              new mapboxgl.Popup({ offset: 25, closeButton: false, className: 'bg-lorequest-dark border border-lorequest-gold' })
                .setHTML(`
                  <div class="p-2 text-center">
                    <h3 class="font-bold text-lorequest-gold text-sm">${city.name}</h3>
                    <div class="fantasy-divider my-1"></div>
                    <p class="text-xs text-lorequest-parchment">${isDiscovered ? 'Discovered' : 'Undiscovered Territory'}</p>
                  </div>
                `)
            )
            .addTo(map.current);
        });
        
        // Add user position marker with a fantasy theme
        if (userLocation) {
          const el = document.createElement('div');
          el.className = 'h-6 w-6 rounded-full player-marker flex items-center justify-center';
          
          // Add compass icon inside marker
          el.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-lorequest-dark">
              <circle cx="12" cy="12" r="10"></circle>
              <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
            </svg>
          `;
          
          userMarkerRef.current = new mapboxgl.Marker(el)
            .setLngLat([userLocation.longitude, userLocation.latitude])
            .addTo(map.current);
        }
        
        setIsMapInitialized(true);
      });

      // Add a fantasy-styled compass control
      const navControl = new mapboxgl.NavigationControl({
        visualizePitch: true,
        showCompass: true
      });
      map.current.addControl(navControl, 'bottom-right');

      // Add a custom attribution
      map.current.addControl(
        new mapboxgl.AttributionControl({
          customAttribution: 'Lore Quest | Real-World Adventures'
        })
      );
    }
    
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [apiKey]);

  // Update user position and check for discoveries
  useEffect(() => {
    if (!map.current || !isMapInitialized || !userLocation) return;

    // Update user marker position
    if (userMarkerRef.current) {
      userMarkerRef.current.setLngLat([userLocation.longitude, userLocation.latitude]);
    } else {
      const el = document.createElement('div');
      el.className = 'h-6 w-6 rounded-full player-marker flex items-center justify-center';
      
      el.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-lorequest-dark">
          <circle cx="12" cy="12" r="10"></circle>
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></polygon>
        </svg>
      `;
      
      userMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map.current);
    }

    // Center map on user - Set a UK-centered view when first loaded
    if (!hasMovedMapRef.current) {
      map.current.flyTo({
        center: [-2.5, 54.0], // Centered on UK
        essential: true,
        zoom: 5.5
      });
      hasMovedMapRef.current = true;
    }

    // Check for new discoveries
    cityLocations.forEach(city => {
      // Skip already discovered locations
      if (discoveredLocations.some(loc => loc.id === city.id)) {
        return;
      }
      
      const distance = calculateDistance(
        userLocation.latitude,
        userLocation.longitude,
        city.latitude,
        city.longitude
      );
      
      if (distance <= DISCOVERY_THRESHOLD) {
        onLocationDiscovered({...city, discovered: true});
        
        toast(`🏰 You discovered ${city.territory}!`, {
          description: `${city.name} in the Realm of ${city.realm}`,
          duration: 5000,
          className: "bg-lorequest-dark border border-lorequest-gold text-lorequest-gold"
        });
      }
    });
  }, [userLocation, isMapInitialized, discoveredLocations, onLocationDiscovered]);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border-2 border-lorequest-gold/30">
      <div ref={mapContainer} className="map-container" />
      
      {/* Fantasy-themed fog of war overlay */}
      {isMapInitialized && (
        <div className="fog-of-war">
          {discoveredLocations.map(location => (
            <div 
              key={location.id} 
              className="absolute rounded-full discovered-area"
              style={{
                width: `${location.radius * 40}vw`,
                height: `${location.radius * 40}vw`,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'transparent',
                boxShadow: '0 0 0 100vmax rgba(13, 17, 23, 0.6)',
                clipPath: 'circle(50%)',
                border: '2px solid rgba(212, 175, 55, 0.3)'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Legend */}
      <div className="absolute bottom-3 left-3 bg-lorequest-dark/80 backdrop-blur-sm p-2 rounded border border-lorequest-gold/50 text-xs">
        <div className="flex items-center gap-2 text-lorequest-gold">
          <Map size={14} />
          <span>United Kingdom & Ireland</span>
        </div>
      </div>
    </div>
  );
};

export default MapComponent;
