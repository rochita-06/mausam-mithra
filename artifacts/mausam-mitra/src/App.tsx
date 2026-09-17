import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Bell,
  CalendarDays,
  Check,
  ChevronRight,
  Cloud,
  CloudDrizzle,
  CloudLightning,
  CloudRain,
  CloudSun,
  Compass,
  Droplets,
  FileText,
  Gauge,
  HeartPulse,
  Globe2,
  GraduationCap,
  HardDriveDownload,
  LocateFixed,
  Map,
  MapPin,
  Menu,
  Mic,
  Navigation,
  Pause,
  Play,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  Sprout,
  Sun,
  Thermometer,
  Tractor,
  TrainFront,
  Volume2,
  Wind,
  type LucideIcon,
} from 'lucide-react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';

type Unit = 'celsius' | 'fahrenheit';
type Language = 'en' | 'hi' | 'bn' | 'mr' | 'ta' | 'te' | 'kn' | 'ml' | 'gu';
type WeatherProfile = 'farmer' | 'student' | 'driver' | 'fisherman' | 'tourist' | 'outdoor-worker' | 'disaster-manager';
type LocationPoint = { name: string; admin1?: string; latitude: number; longitude: number };
type ForecastDay = {
  date: string;
  weatherCode: number;
  max: number;
  min: number;
  rainChance: number;
  rain: number;
  uv: number;
  wind: number;
};
type WeatherSnapshot = {
  current: {
    temperature: number;
    feelsLike: number;
    humidity: number;
    weatherCode: number;
    wind: number;
    precipitation: number;
    rain: number;
    visibility: number;
  };
  days: ForecastDay[] & { 0: ForecastDay };
  timezone: string;
  fetchedAt: Date;
};
type ClimateSnapshot = { dates: string[]; temperatures: number[]; rainfall: number[]; fetchedAt: Date };
type SpeechRecognitionEventLike = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionInstance = {
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  start: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const queryClient = new QueryClient();
const DEFAULT_LOCATION: LocationPoint = {
  name: 'Pune',
  admin1: 'Maharashtra',
  latitude: 18.5204,
  longitude: 73.8567,
};
const LANGUAGES: { value: Language; label: string; native: string }[] = [
  { value: 'en', label: 'English', native: 'English' },
  { value: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { value: 'bn', label: 'Bengali', native: 'বাংলা' },
  { value: 'mr', label: 'Marathi', native: 'मराठी' },
  { value: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { value: 'te', label: 'Telugu', native: 'తెలుగు' },
  { value: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { value: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { value: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
];

const WEATHER_PROFILES: { value: WeatherProfile; label: string; description: string }[] = [
  { value: 'farmer', label: 'Farmer', description: 'Field work, irrigation, and spraying' },
  { value: 'student', label: 'Student', description: 'Classes, sports, and campus plans' },
  { value: 'driver', label: 'Driver', description: 'Road visibility and safer travel windows' },
  { value: 'fisherman', label: 'Fisherman', description: 'Wind and marine-safety awareness' },
  { value: 'tourist', label: 'Tourist', description: 'Outdoor comfort and changing conditions' },
  { value: 'outdoor-worker', label: 'Outdoor worker', description: 'Heat, hydration, and work timing' },
  { value: 'disaster-manager', label: 'Disaster manager', description: 'Early signals and preparedness checks' },
];

const copy: Record<Language, Record<string, string>> = {
  en: { overview: 'Overview', climate: 'Climate signals', advisories: 'Advisories', decision: 'Decision desk', settings: 'Settings', ask: 'Ask Mausam Mitra', today: 'Today', forecast: '7-day forecast', updated: 'Updated just now', useLocation: 'Use my location', search: 'Search a city in India', source: 'Source: Open-Meteo', noSignal: 'No severe weather signal', listen: 'Listen', stop: 'Stop' },
  hi: { overview: 'अवलोकन', climate: 'जलवायु संकेत', advisories: 'सलाह', settings: 'सेटिंग्स', ask: 'मौसम मित्र से पूछें', today: 'आज', forecast: '7 दिन का पूर्वानुमान', updated: 'अभी अपडेट हुआ', useLocation: 'मेरी लोकेशन लें', search: 'भारत में शहर खोजें', source: 'स्रोत: Open-Meteo', noSignal: 'गंभीर मौसम संकेत नहीं', listen: 'सुनें', stop: 'रोकें' },
  bn: { overview: 'সংক্ষিপ্তসার', climate: 'জলবায়ু সংকেত', advisories: 'সতর্কতা', settings: 'সেটিংস', ask: 'মৌসম মিত্রকে জিজ্ঞেস করুন', today: 'আজ', forecast: '৭ দিনের পূর্বাভাস', updated: 'এইমাত্র আপডেট', useLocation: 'আমার অবস্থান ব্যবহার করুন', search: 'ভারতে শহর খুঁজুন', source: 'উৎস: Open-Meteo', noSignal: 'তীব্র আবহাওয়ার সংকেত নেই', listen: 'শুনুন', stop: 'থামুন' },
  mr: { overview: 'आढावा', climate: 'हवामान संकेत', advisories: 'सल्ले', settings: 'सेटिंग्ज', ask: 'मौसम मित्राला विचारा', today: 'आज', forecast: '७ दिवसांचा अंदाज', updated: 'आत्ताच अपडेट', useLocation: 'माझे स्थान वापरा', search: 'भारतात शहर शोधा', source: 'स्रोत: Open-Meteo', noSignal: 'तीव्र हवामान संकेत नाही', listen: 'ऐका', stop: 'थांबा' },
  ta: { overview: 'கண்ணோட்டம்', climate: 'காலநிலை அறிகுறிகள்', advisories: 'ஆலோசனைகள்', settings: 'அமைப்புகள்', ask: 'மௌசம் மித்ராவிடம் கேளுங்கள்', today: 'இன்று', forecast: '7 நாள் முன்னறிவிப்பு', updated: 'இப்போது புதுப்பிக்கப்பட்டது', useLocation: 'என் இருப்பிடத்தைப் பயன்படுத்து', search: 'இந்திய நகரத்தைத் தேடுங்கள்', source: 'ஆதாரம்: Open-Meteo', noSignal: 'கடுமையான வானிலை அறிகுறி இல்லை', listen: 'கேளுங்கள்', stop: 'நிறுத்து' },
  te: { overview: 'అవలోకనం', climate: 'వాతావరణ సంకేతాలు', advisories: 'సూచనలు', settings: 'సెట్టింగ్‌లు', ask: 'మౌసం మిత్రను అడగండి', today: 'ఈ రోజు', forecast: '7 రోజుల సూచన', updated: 'ఇప్పుడే నవీకరించబడింది', useLocation: 'నా స్థానాన్ని ఉపయోగించు', search: 'భారత నగరం వెతకండి', source: 'మూలం: Open-Meteo', noSignal: 'తీవ్రమైన వాతావరణ సంకేతం లేదు', listen: 'వినండి', stop: 'ఆపండి' },
  kn: { overview: 'ಅವಲೋಕನ', climate: 'ಹವಾಮಾನ ಸೂಚನೆಗಳು', advisories: 'ಸಲಹೆಗಳು', settings: 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', ask: 'ಮೌಸಮ್ ಮಿತ್ರರನ್ನು ಕೇಳಿ', today: 'ಇಂದು', forecast: '7 ದಿನಗಳ ಮುನ್ಸೂಚನೆ', updated: 'ಈಗಷ್ಟೇ ನವೀಕರಿಸಲಾಗಿದೆ', useLocation: 'ನನ್ನ ಸ್ಥಳ ಬಳಸಿ', search: 'ಭಾರತದ ನಗರ ಹುಡುಕಿ', source: 'ಮೂಲ: Open-Meteo', noSignal: 'ತೀವ್ರ ಹವಾಮಾನ ಸೂಚನೆ ಇಲ್ಲ', listen: 'ಆಲಿಸಿ', stop: 'ನಿಲ್ಲಿಸಿ' },
  ml: { overview: 'അവലോകനം', climate: 'കാലാവസ്ഥാ സൂചനകൾ', advisories: 'മുന്നറിയിപ്പുകൾ', settings: 'ക്രമീകരണങ്ങൾ', ask: 'മൗസം മിത്രയോട് ചോദിക്കൂ', today: 'ഇന്ന്', forecast: '7 ദിവസത്തെ പ്രവചനം', updated: 'ഇപ്പോൾ അപ്‌ഡേറ്റ് ചെയ്തു', useLocation: 'എന്റെ സ്ഥാനം ഉപയോഗിക്കുക', search: 'ഇന്ത്യയിലെ നഗരം തിരയുക', source: 'ഉറവിടം: Open-Meteo', noSignal: 'തീവ്ര കാലാവസ്ഥാ സൂചനയില്ല', listen: 'കേൾക്കുക', stop: 'നിർത്തുക' },
  gu: { overview: 'ઝાંખી', climate: 'આબોહવા સંકેતો', advisories: 'સલાહ', settings: 'સેટિંગ્સ', ask: 'મૌસમ મિત્રને પૂછો', today: 'આજે', forecast: '7 દિવસની આગાહી', updated: 'હમણાં અપડેટ', useLocation: 'મારું સ્થાન વાપરો', search: 'ભારતમાં શહેર શોધો', source: 'સ્ત્રોત: Open-Meteo', noSignal: 'તીવ્ર હવામાન સંકેત નથી', listen: 'સાંભળો', stop: 'બંધ કરો' },
};

const weatherMeta = (code: number): { label: string; Icon: LucideIcon; color: string } => {
  if (code === 0) return { label: 'Clear sky', Icon: Sun, color: '#e88c2f' };
  if (code <= 3) return { label: 'Partly cloudy', Icon: CloudSun, color: '#6fa9a1' };
  if (code <= 48) return { label: 'Misty', Icon: Cloud, color: '#789399' };
  if (code <= 57) return { label: 'Drizzle', Icon: CloudDrizzle, color: '#4c8f9d' };
  if (code <= 67 || code >= 80) return { label: 'Rain showers', Icon: CloudRain, color: '#347c91' };
  if (code <= 77) return { label: 'Snow', Icon: Cloud, color: '#7c9ba7' };
  if (code <= 82) return { label: 'Rain showers', Icon: CloudRain, color: '#347c91' };
  return { label: 'Thunderstorm', Icon: CloudRain, color: '#b85b4a' };
};

const formatTemp = (value: number, unit: Unit) => `${Math.round(unit === 'celsius' ? value : value * 9 / 5 + 32)}°`;
const formatDate = (date: string, options: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('en-IN', options).format(new Date(`${date}T12:00:00`));
const todayLabel = () => new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date());

function weatherRisk(data: WeatherSnapshot) {
  const today = data.days[0];
  const drivers: string[] = [];
  let score = 8;
  if (today.rainChance >= 70) { score += 28; drivers.push('high rain probability'); }
  else if (today.rainChance >= 40) { score += 14; drivers.push('showery conditions'); }
  if (today.rain >= 20) { score += 18; drivers.push('heavy rainfall potential'); }
  if (today.wind >= 45) { score += 22; drivers.push('strong winds'); }
  else if (today.wind >= 30) { score += 10; drivers.push('gusty winds'); }
  if (today.max >= 40) { score += 22; drivers.push('extreme heat'); }
  else if (today.max >= 35) { score += 10; drivers.push('high afternoon heat'); }
  if (data.current.visibility < 5000) { score += 12; drivers.push('reduced visibility'); }
  const normalized = Math.min(100, score);
  return {
    score: normalized,
    level: normalized >= 70 ? 'Severe' : normalized >= 40 ? 'Moderate' : 'Low',
    drivers: drivers.length ? drivers : ['no major hazard thresholds'],
  };
}

function personalizedAdvice(data: WeatherSnapshot, profile: WeatherProfile, prompt: string, unit: Unit) {
  const today = data.days[0];
  const rainy = today.rainChance >= 60 || today.rain >= 12;
  const windy = today.wind >= 35;
  const hot = today.max >= 35 || data.current.temperature >= 35;
  const lower = prompt.toLowerCase();
  const rainLine = `${today.rainChance}% rain chance and up to ${today.rain.toFixed(1)} mm expected`;
  if (profile === 'farmer' || lower.includes('spray') || lower.includes('pesticide') || lower.includes('irrigat')) {
    return rainy
      ? { level: 'CAUTION', title: 'Wait for a drier field window', detail: `Rain is the deciding factor today: ${rainLine}. Spraying now can wash treatment away and heavy irrigation may be unnecessary.`, action: 'Check the next low-rain, lower-wind window before starting.' }
      : { level: 'GO', title: 'A workable window for field tasks', detail: `No strong rain signal is showing. Keep spraying to the cooler, lower-wind part of the day and check soil moisture before irrigating.`, action: `Wind may reach ${Math.round(today.wind)} km/h; avoid spraying if it rises.` };
  }
  if (profile === 'driver' || lower.includes('commute') || lower.includes('travel') || lower.includes('drive')) {
    return rainy || windy
      ? { level: 'WATCH', title: 'Build extra time into the journey', detail: `${rainLine}${windy ? `, with wind up to ${Math.round(today.wind)} km/h` : ''}. Roads can slow quickly when visibility and grip change.`, action: 'Prefer the morning window, avoid low-lying routes, and keep a rain layer in the vehicle.' }
      : { level: 'GO', title: 'No major road-weather signal', detail: `Conditions look manageable for a normal trip. Visibility and rainfall are not currently pointing to a disruption window.`, action: 'Check again before departure because local showers can still vary.' };
  }
  if (profile === 'student') {
    return rainy || windy
      ? { level: 'WATCH', title: 'Keep an indoor backup for campus plans', detail: `Outdoor classes, sports, or events may be interrupted by ${rainy ? 'showers' : 'gusty winds'}.`, action: 'Carry rain protection and confirm any outdoor schedule before leaving.' }
      : { level: 'GO', title: 'A good day for campus plans', detail: 'No major rain or wind disruption is showing in the forecast.', action: hot ? 'Plan outdoor activity earlier and carry water.' : 'Normal outdoor plans look reasonable.' };
  }
  if (profile === 'fisherman') {
    return windy
      ? { level: 'CAUTION', title: 'Wind needs a marine-safety check', detail: `Winds may reach ${Math.round(today.wind)} km/h. This app does not provide wave or official marine-warning data.`, action: 'Check IMD marine bulletins and local harbour guidance before departure.' }
      : { level: 'CHECK', title: 'No strong wind signal in this forecast', detail: 'A calm-looking land forecast is not a substitute for wave, tide, or marine-warning information.', action: 'Confirm the official marine bulletin before going out.' };
  }
  if (profile === 'tourist') {
    return rainy || windy
      ? { level: 'WATCH', title: 'Keep the itinerary flexible', detail: `Rain and changing conditions may affect outdoor sightseeing today.`, action: 'Put indoor stops first and carry light rain protection.' }
      : { level: 'GO', title: 'Comfortable for exploring', detail: `The forecast is relatively open for outdoor plans${hot ? ', but afternoon heat will build' : ''}.`, action: hot ? `Start earlier and carry water; temperatures may reach ${formatTemp(today.max, unit)}.` : 'A normal outdoor itinerary looks reasonable.' };
  }
  if (profile === 'disaster-manager') {
    return rainy || windy || hot
      ? { level: 'WATCH', title: 'Review local preparedness checks', detail: `The forecast has a planning signal: ${rainy ? rainLine : ''}${windy ? ` wind up to ${Math.round(today.wind)} km/h` : ''}${hot ? ` heat up to ${formatTemp(today.max, unit)}` : ''}.`, action: 'Compare this model signal with official district and IMD alerts before escalating.' }
      : { level: 'CLEAR', title: 'No major threshold signal', detail: 'The current forecast does not cross the app’s rain, wind, or heat thresholds.', action: 'Keep monitoring official alerts and confirm local reports.' };
  }
  return hot
    ? { level: 'CAUTION', title: 'Move demanding work earlier', detail: `Afternoon heat may reach ${formatTemp(today.max, unit)}. Heat load will be highest after late morning.`, action: 'Hydrate before you feel thirsty and schedule breaks in shade.' }
    : { level: 'GO', title: 'A manageable outdoor work window', detail: 'No major heat, rain, or wind signal is showing for the day.', action: 'Keep checking conditions if your work extends into the afternoon.' };
}

async function geocodeCity(query: string): Promise<LocationPoint[]> {
  if (!query.trim()) return [];
  const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=6&language=en&format=json&countryCode=IN`);
  if (!response.ok) throw new Error('Could not search locations.');
  const json = await response.json() as { results?: { name: string; admin1?: string; latitude: number; longitude: number }[] };
  return (json.results ?? []).map((item) => ({ name: item.name, admin1: item.admin1, latitude: item.latitude, longitude: item.longitude }));
}

async function fetchWeather(location: LocationPoint, signal: AbortSignal): Promise<WeatherSnapshot> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m,precipitation,rain,visibility&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,rain_sum,uv_index_max,wind_speed_10m_max&forecast_days=7&timezone=auto`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Weather service is not responding.');
  const json = await response.json();
  return {
    current: {
      temperature: json.current.temperature_2m,
      feelsLike: json.current.apparent_temperature,
      humidity: json.current.relative_humidity_2m,
      weatherCode: json.current.weather_code,
      wind: json.current.wind_speed_10m,
      precipitation: json.current.precipitation,
      rain: json.current.rain,
      visibility: json.current.visibility ?? 10000,
    },
    days: json.daily.time.map((date: string, index: number) => ({
      date,
      weatherCode: json.daily.weather_code[index],
      max: json.daily.temperature_2m_max[index],
      min: json.daily.temperature_2m_min[index],
      rainChance: json.daily.precipitation_probability_max[index] ?? 0,
      rain: json.daily.rain_sum[index] ?? 0,
      uv: json.daily.uv_index_max[index] ?? 0,
      wind: json.daily.wind_speed_10m_max[index] ?? 0,
    })) as ForecastDay[] & { 0: ForecastDay },
    timezone: json.timezone,
    fetchedAt: new Date(),
  };
}

const weatherCacheKey = (location: LocationPoint) => `mausam-mitra-weather-${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}`;

function readCachedWeather(location: LocationPoint): WeatherSnapshot | null {
  try {
    const cached = JSON.parse(localStorage.getItem(weatherCacheKey(location)) ?? 'null');
    if (!cached?.current || !cached?.days) return null;
    return { ...cached, fetchedAt: new Date(cached.fetchedAt) } as WeatherSnapshot;
  } catch {
    return null;
  }
}

async function fetchClimate(location: LocationPoint, signal: AbortSignal): Promise<ClimateSnapshot> {
  const end = new Date();
  end.setDate(end.getDate() - 8);
  const start = new Date(end);
  start.setFullYear(end.getFullYear() - 5);
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${location.latitude}&longitude=${location.longitude}&start_date=${iso(start)}&end_date=${iso(end)}&daily=temperature_2m_mean,precipitation_sum&timezone=auto`;
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Historical climate service is not responding.');
  const json = await response.json();
  return { dates: json.daily.time, temperatures: json.daily.temperature_2m_mean, rainfall: json.daily.precipitation_sum, fetchedAt: new Date() };
}

function useWeather(location: LocationPoint) {
  const [data, setData] = useState<WeatherSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchWeather(location, controller.signal).then((snapshot) => {
      setData(snapshot);
      setOffline(false);
      try { localStorage.setItem(weatherCacheKey(location), JSON.stringify(snapshot)); } catch { /* cache is best effort */ }
    }).catch((err: Error) => {
      if (err.name !== 'AbortError') {
        const cached = readCachedWeather(location);
        if (cached) { setData(cached); setOffline(true); setError('Showing your last saved forecast.'); }
        else setError(err.message);
      }
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [location.latitude, location.longitude, reload]);
  return { data: data as WeatherSnapshot, loading, error, offline, refresh: () => setReload((value) => value + 1) };
}

function useClimate(location: LocationPoint) {
  const [data, setData] = useState<ClimateSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchClimate(location, controller.signal).then(setData).catch((err: Error) => {
      if (err.name !== 'AbortError') setError(err.message);
    }).finally(() => setLoading(false));
    return () => controller.abort();
  }, [location.latitude, location.longitude]);
  return { data, loading, error };
}

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-[hsl(var(--muted))] ${className}`} />;
}

function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-2xl border border-[#d7a99c] bg-[#fbebe5] p-5 text-[#713d35]" data-testid="state-error">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold">Live data could not be loaded</p>
          <p className="mt-1 text-sm opacity-85">{message} Check your connection and try again.</p>
        </div>
        {onRetry && <button className="inline-flex items-center gap-2 rounded-lg border border-[#c98677] px-3 py-2 text-xs font-bold transition hover:bg-[#f5d8cf]" onClick={onRetry} data-testid="button-retry"><RefreshCw className="h-3.5 w-3.5" /> Retry</button>}
      </div>
    </div>
  );
}

function BrandMark() {
  return <div className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-xl bg-[#173e47] text-[#f7f2e7]"><span className="font-display text-2xl">M</span><span className="absolute bottom-1.5 right-1 h-1.5 w-1.5 rounded-full bg-[#e88c2f]" /></div>;
}

function LocationSearch({ location, onSelect, compact = false }: { location: LocationPoint; onSelect: (item: LocationPoint) => void; compact?: boolean }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationPoint[]>([]);
  const [searching, setSearching] = useState(false);
  const [show, setShow] = useState(false);
  const search = async () => {
    if (!query.trim()) return;
    setSearching(true);
    try { setResults(await geocodeCity(query)); setShow(true); } catch { setResults([]); setShow(true); } finally { setSearching(false); }
  };
  const useBrowserLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => onSelect({ name: 'Your location', admin1: 'India', latitude: position.coords.latitude, longitude: position.coords.longitude }));
  };
  return (
    <div className={`relative ${compact ? 'w-full max-w-[300px]' : 'w-full'}`}>
      <div className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2.5 shadow-[0_5px_18px_rgba(17,42,53,.05)]">
        <Search className="h-4 w-4 text-[hsl(var(--muted-foreground))]" />
        <input value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') search(); }} onFocus={() => query && setShow(true)} placeholder={location.name || 'Search city'} className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[hsl(var(--muted-foreground))]" data-testid="input-location-search" />
        {searching ? <RefreshCw className="h-4 w-4 animate-spin text-[hsl(var(--muted-foreground))]" /> : <button onClick={search} className="rounded-lg p-1.5 text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--muted))]" aria-label="Search locations" data-testid="button-search-location"><ArrowRight className="h-4 w-4" /></button>}
      </div>
      {show && (
        <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-20 overflow-hidden rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1.5 shadow-[0_16px_45px_rgba(17,42,53,.15)]">
          {results.length > 0 ? results.map((item, index) => <button key={`${item.latitude}-${index}`} onClick={() => { onSelect(item); setQuery(''); setShow(false); }} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-[hsl(var(--muted))]" data-testid={`button-location-result-${index}`}><MapPin className="h-4 w-4 text-[hsl(var(--accent))]" /><span><strong className="block text-sm">{item.name}</strong><span className="text-xs text-[hsl(var(--muted-foreground))]">{item.admin1 ?? 'India'}</span></span></button>) : <p className="p-3 text-sm text-[hsl(var(--muted-foreground))]">No Indian city found. Try another spelling.</p>}
          <button onClick={useBrowserLocation} className="mt-1 flex w-full items-center gap-2 rounded-lg border-t border-[hsl(var(--border))] px-3 py-3 text-left text-xs font-bold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--muted))]" data-testid="button-use-location"><LocateFixed className="h-4 w-4" /> Use my browser location</button>
        </div>
      )}
    </div>
  );
}

function VoiceButton({ onText, lang, label }: { onText: (text: string) => void; lang: Language; label: string }) {
  const [listening, setListening] = useState(false);
  const supported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const start = () => {
    if (!supported) return;
    const SpeechRecognition = (window as Window & { SpeechRecognition?: SpeechRecognitionConstructor; webkitSpeechRecognition?: SpeechRecognitionConstructor }).SpeechRecognition ?? (window as Window & { webkitSpeechRecognition?: SpeechRecognitionConstructor }).webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.lang = lang === 'en' ? 'en-IN' : `${lang}-IN`;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.onresult = (event) => onText(event.results[0][0].transcript);
    recognition.start();
  };
  return <button onClick={start} disabled={!supported} title={supported ? label : 'Voice input is not supported in this browser'} className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition ${listening ? 'border-[#c65b47] bg-[#fbebe5] text-[#c65b47]' : 'border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--primary))] hover:bg-[hsl(var(--muted))]'} disabled:cursor-not-allowed disabled:opacity-40`} data-testid="button-voice-input"><Mic className={`h-5 w-5 ${listening ? 'animate-pulse' : ''}`} /></button>;
}

function SpeakButton({ text, lang, label }: { text: string; lang: Language; label: string }) {
  const [speaking, setSpeaking] = useState(false);
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const toggle = () => {
    if (!supported) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === 'en' ? 'en-IN' : `${lang}-IN`;
    utterance.onend = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  };
  return <button onClick={toggle} disabled={!supported} className="inline-flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--muted))] disabled:opacity-40" data-testid="button-speak-answer">{speaking ? <Pause className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}{speaking ? 'Stop' : label}</button>;
}

function Shell({ children, location, setLocation, language, setLanguage }: { children: ReactNode; location: LocationPoint; setLocation: (location: LocationPoint) => void; language: Language; setLanguage: (language: Language) => void }) {
  const [path] = useLocation();
  const t = copy[language];
  const [mobileNav, setMobileNav] = useState(false);
  const nav = [
    { href: '/', label: t.overview, icon: Compass, exact: true },
    { href: '/climate', label: t.climate, icon: BarChart3 },
    { href: '/advisories', label: t.advisories, icon: ShieldAlert },
    { href: '/decision-desk', label: t.decision ?? 'Decision desk', icon: Tractor },
    { href: '/settings', label: t.settings, icon: Settings2 },
  ];
  return (
    <div className="app-shell grain min-h-[100dvh]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[250px] flex-col border-r border-[hsl(var(--border))] bg-[#eef0e5]/90 px-5 py-6 backdrop-blur md:flex">
        <Link href="/" className="flex items-center gap-3" data-testid="link-brand"><BrandMark /><span><span className="font-display block text-[1.3rem] leading-none text-[#173e47]">Mausam Mitra</span><span className="mt-1 block font-data text-[9px] uppercase tracking-[.18em] text-[#688080]">weather companion</span></span></Link>
        <div className="mt-12"><p className="mb-3 px-3 font-data text-[9px] font-bold uppercase tracking-[.2em] text-[#80928e]">Navigate</p><nav className="space-y-1.5">{nav.map((item) => { const Icon = item.icon; const active = item.exact ? path === '/' : path.startsWith(item.href); return <Link key={item.href} href={item.href} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-[#173e47] text-[#f7f2e7] shadow-[0_8px_20px_rgba(23,62,71,.15)]' : 'text-[#4d676b] hover:bg-[#e0e7dc] hover:text-[#173e47]'}`} data-testid={`link-nav-${item.href.slice(1) || 'overview'}`}><Icon className="h-[18px] w-[18px]" />{item.label}{item.href === '/advisories' && <span className="ml-auto h-2 w-2 rounded-full bg-[#c65b47]" />}</Link>; })}</nav></div>
        <div className="mt-auto rounded-2xl border border-[#c5d3c9] bg-[#dae8df] p-4"><div className="flex items-center gap-2 text-[#173e47]"><span className="pulse-dot h-2 w-2 rounded-full bg-[#4e8b68]" /><span className="font-data text-[10px] font-bold uppercase tracking-[.14em]">Live data</span></div><p className="mt-2 text-xs leading-relaxed text-[#47686a]">Forecasts refresh from Open-Meteo. No sign-in or API key required.</p></div>
        <p className="mt-5 text-[10px] text-[#8a9994]">Built for Indian skies · v1.0</p>
      </aside>
      <div className="md:ml-[250px]">
        <header className="sticky top-0 z-30 border-b border-[hsl(var(--border))] bg-[hsl(var(--background))]/90 px-4 py-3 backdrop-blur md:px-8">
          <div className="mx-auto flex max-w-[1280px] items-center gap-3">
            <button className="rounded-lg p-2 text-[hsl(var(--primary))] md:hidden" onClick={() => setMobileNav((value) => !value)} aria-label="Open navigation" data-testid="button-mobile-menu"><Menu className="h-5 w-5" /></button>
            <div className="hidden items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] sm:flex"><MapPin className="h-4 w-4 text-[hsl(var(--accent))]" /><span className="font-semibold text-[hsl(var(--foreground))]">{location.name}</span><span className="hidden text-xs lg:inline">{location.admin1 ? `· ${location.admin1}` : '· your coordinates'}</span></div>
            <div className="ml-auto flex items-center gap-2"><div className="hidden sm:block"><LocationSearch location={location} onSelect={setLocation} compact /></div><select value={language} onChange={(event) => setLanguage(event.target.value as Language)} className="h-10 max-w-[104px] rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-2 text-xs font-bold text-[hsl(var(--primary))]" aria-label="Language" data-testid="select-language-header">{LANGUAGES.map((item) => <option key={item.value} value={item.value}>{item.native}</option>)}</select><Link href="/settings" className="hidden h-10 w-10 items-center justify-center rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--muted))] sm:flex" aria-label="Settings" data-testid="link-settings-header"><Settings2 className="h-4 w-4" /></Link></div>
          </div>
         {mobileNav && <div className="mt-3 grid grid-cols-5 gap-1 border-t border-[hsl(var(--border))] pt-3 md:hidden">{nav.map((item) => { const Icon = item.icon; return <Link key={item.href} href={item.href} onClick={() => setMobileNav(false)} className={`flex flex-col items-center gap-1 rounded-lg px-1 py-2 text-[10px] font-bold ${path === item.href ? 'bg-[#173e47] text-[#f7f2e7]' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`link-mobile-nav-${item.href.slice(1) || 'overview'}`}><Icon className="h-4 w-4" />{item.label}</Link>; })}</div>}
        </header>
        <main className="mx-auto max-w-[1280px] px-4 py-7 sm:px-6 md:px-8 lg:py-10">{children}</main>
      </div>
    </div>
  );
}

function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-wrap items-end justify-between gap-4"><div><p className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">{eyebrow}</p><h1 className="mt-2 font-display text-4xl leading-[1.05] tracking-[-.025em] text-[hsl(var(--foreground))] sm:text-5xl">{title}</h1>{description && <p className="mt-3 max-w-xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{description}</p>}</div>{action}</div>;
}

function HomePage({ location, language, unit }: { location: LocationPoint; language: Language; unit: Unit }) {
  const { data, loading, error, offline, refresh } = useWeather(location);
  const t = copy[language];
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const meta = data ? weatherMeta(data.current.weatherCode) : weatherMeta(2);
  const risk = data ? weatherRisk(data) : null;
  const quickQuestions = ['Will rain affect my commute today?', 'Is it safe to spray my crop tomorrow?', 'When is the coolest hour today?'];
  const ask = (prompt = question) => {
    if (!prompt.trim()) return;
    if (!data) { setAnswer('I need a live forecast before I can answer that. Please try again in a moment.'); return; }
    const rainy = data.days[0].rainChance >= 50;
    const hot = data.current.temperature >= 35;
    const lower = prompt.toLowerCase();
    if (lower.includes('commute') || lower.includes('travel')) setAnswer(rainy ? `Plan a little buffer: rain is likely today, with a ${data.days[0].rainChance}% chance. Carry a rain layer and watch for slower roads.` : `Your commute looks manageable. Skies should stay ${meta.label.toLowerCase()} with only a ${data.days[0].rainChance}% chance of rain.`);
    else if (lower.includes('crop') || lower.includes('spray') || lower.includes('farm')) setAnswer(rainy ? 'Hold off on spraying today. Moisture and showers can wash treatment away; the next drier window is worth checking before you start.' : `A reasonable window today: rain risk is ${data.days[0].rainChance}%. Avoid the warmest part of the afternoon and keep an eye on wind at ${Math.round(data.current.wind)} km/h.`);
    else if (lower.includes('cool') || lower.includes('temperature') || lower.includes('hot')) setAnswer(`It is ${formatTemp(data.current.temperature, unit)} now and feels like ${formatTemp(data.current.feelsLike, unit)}. The cooler part of the day will be around sunrise, before temperatures rise toward ${formatTemp(data.days[0].max, unit)}.`);
    else setAnswer(`For ${location.name}: ${meta.label.toLowerCase()}, ${formatTemp(data.current.temperature, unit)} now, ${data.current.humidity}% humidity and ${Math.round(data.current.wind)} km/h wind. ${rainy ? 'Rain is the main thing to plan around today.' : 'No meaningful rain signal is showing today.'}`);
    setQuestion('');
  };
  const speakText = answer || `Weather in ${location.name}: ${meta.label}, ${formatTemp(data?.current.temperature ?? 0, unit)}.`;
  return <div className="space-y-9">
    <div className="flex items-start justify-between gap-4"><div><p className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">MONSOON SIGNAL / {todayLabel()}</p><h1 className="mt-3 max-w-2xl font-display text-5xl leading-[.96] tracking-[-.035em] text-[hsl(var(--foreground))] sm:text-6xl">Clear answers for changing skies.</h1><p className="mt-4 max-w-xl text-base leading-relaxed text-[hsl(var(--muted-foreground))]">Ask what the forecast means for your field, your road, or your neighbourhood. Mausam Mitra turns live weather into the next sensible action.</p></div><div className="hidden rounded-full border border-[#c8d5ce] bg-[#e3eee6] px-3 py-2 text-xs font-bold text-[#38705c] sm:flex sm:items-center sm:gap-2"><span className="pulse-dot h-2 w-2 rounded-full bg-[#4e8b68]" /> Live for {location.name}</div></div>
     {offline && data && <div className="flex items-center gap-2 rounded-xl border border-[#d5aa76] bg-[#f4ead8] px-4 py-3 text-xs font-semibold text-[#7c6245]"><HardDriveDownload className="h-4 w-4" /> Showing the last saved forecast while you are offline. Refresh when connected.</div>}
     <section className="grid gap-5 lg:grid-cols-[minmax(0,1.38fr)_minmax(320px,.62fr)]">
      <div className="relative overflow-hidden rounded-[1.6rem] bg-[#173e47] p-6 text-[#f7f2e7] shadow-[0_18px_45px_rgba(23,62,71,.18)] sm:p-8">
        <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[#6e9f98]/30 sm:h-72 sm:w-72" /><div className="absolute -right-5 -top-9 h-40 w-40 rounded-full border border-dashed border-[#e88c2f]/50 sm:h-52 sm:w-52" />
        <div className="relative flex items-start justify-between gap-5"><div><p className="font-data text-[10px] uppercase tracking-[.18em] text-[#a5c7bd]">CURRENT CONDITIONS</p><div className="mt-3 flex items-baseline gap-2"><span className="font-display text-7xl leading-none sm:text-8xl">{loading ? '—' : formatTemp(data?.current.temperature ?? 0, unit)}</span><span className="text-sm text-[#a5c7bd]">{unit === 'celsius' ? 'Celsius' : 'Fahrenheit'}</span></div><p className="mt-3 text-lg font-semibold">{loading ? 'Reading the sky…' : meta.label}</p><p className="mt-1 text-sm text-[#a5c7bd]">Feels like {loading ? '—' : formatTemp(data?.current.feelsLike ?? 0, unit)} · {location.name}</p></div><div className="grid h-20 w-20 place-items-center rounded-2xl border border-[#77a69d]/35 bg-[#2c5960]"><meta.Icon className="h-12 w-12" style={{ color: meta.color }} /></div></div>
        <div className="relative mt-9 grid grid-cols-3 border-t border-[#6e9f98]/35 pt-4">{[['Humidity', loading ? '—' : `${data?.current.humidity}%`, Droplets], ['Wind', loading ? '—' : `${Math.round(data?.current.wind ?? 0)} km/h`, Wind], ['Rain now', loading ? '—' : `${data?.current.rain.toFixed(1)} mm`, CloudRain]].map(([label, value, Icon]) => { const DetailIcon = Icon as LucideIcon; return <div key={label as string} className="flex items-center gap-2 border-r border-[#6e9f98]/25 px-2 last:border-0 sm:px-4"><DetailIcon className="hidden h-4 w-4 text-[#e88c2f] sm:block" /><div><p className="font-data text-[9px] uppercase tracking-wider text-[#a5c7bd]">{label as string}</p><p className="mt-1 text-sm font-bold">{value as string}</p></div></div>; })}</div>
        <p className="relative mt-6 flex flex-wrap items-center gap-2 font-data text-[10px] text-[#a5c7bd]"><span className="h-1.5 w-1.5 rounded-full bg-[#e88c2f]" />{t.source} · {data ? data.timezone : 'local time'} · {data ? `Updated ${data.fetchedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : 'Updating'} · <button onClick={refresh} className="underline decoration-[#e88c2f] underline-offset-2" data-testid="button-refresh-weather">Refresh</button></p>
      </div>
       <div className="rounded-[1.6rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6 shadow-[0_12px_35px_rgba(17,42,53,.05)]"><div className="flex items-center gap-2 text-[hsl(var(--accent))]"><Navigation className="h-4 w-4" /><span className="font-data text-[10px] font-bold uppercase tracking-[.18em]">Next useful move</span></div><h2 className="mt-4 font-display text-3xl leading-tight">Know before you step out.</h2><p className="mt-3 text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{loading ? 'Looking for the one thing that matters most today…' : data?.days[0].rainChance && data.days[0].rainChance >= 50 ? 'Rain is the main signal today. Keep a little time in hand and protect anything that cannot get wet.' : 'No major disruption is showing today. The day is open for your usual plans.'}</p><div className="mt-6 flex items-end justify-between border-t border-[hsl(var(--border))] pt-4"><div><p className="font-data text-[10px] uppercase tracking-[.18em] text-[hsl(var(--muted-foreground))]">WEATHER RISK</p><p className="mt-1 font-display text-3xl">{risk ? risk.score : '—'}<span className="ml-1 text-sm font-sans font-normal text-[hsl(var(--muted-foreground))]">/ 100</span></p></div><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${risk?.level === 'Severe' ? 'bg-[#fbebe5] text-[#b04d42]' : risk?.level === 'Moderate' ? 'bg-[#f4ead8] text-[#80643e]' : 'bg-[#e7f0e6] text-[#38705c]'}`}>{risk?.level ?? 'Reading'}</span></div><Link href="/decision-desk" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[hsl(var(--primary))] transition hover:gap-3" data-testid="link-decision-desk">Open decision desk <ArrowRight className="h-4 w-4" /></Link></div>
    </section>
    <section className="rounded-[1.6rem] border border-[hsl(var(--card-border))] bg-[#f4ead8] p-5 sm:p-6"><div className="flex items-center gap-2"><div className="grid h-9 w-9 place-items-center rounded-xl bg-[#e88c2f] text-[#173e47]"><Search className="h-4 w-4" /></div><div><h2 className="font-display text-2xl">Ask in your own words</h2><p className="text-xs text-[#657b78]">Try a plan, not just a place.</p></div></div><div className="mt-4 flex gap-2"><input value={question} onChange={(event) => setQuestion(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') ask(); }} placeholder="Will rain affect my commute?" className="min-w-0 flex-1 rounded-xl border border-[#d7c8ae] bg-[#fcf7ed] px-4 py-3 text-sm outline-none transition placeholder:text-[#8d9a91] focus:border-[#6e9f98]" data-testid="input-weather-question" /><VoiceButton onText={setQuestion} lang={language} label="Speak your question" /><button onClick={() => ask()} className="inline-flex items-center gap-2 rounded-xl bg-[#173e47] px-4 py-3 text-sm font-bold text-[#f7f2e7] transition hover:bg-[#245662]" data-testid="button-ask-weather">Ask <ArrowRight className="h-4 w-4" /></button></div><div className="mt-3 flex flex-wrap gap-2">{quickQuestions.map((item, index) => <button key={item} onClick={() => { setQuestion(item); ask(item); }} className="rounded-full border border-[#d7c8ae] bg-[#fbf4e8] px-3 py-2 text-left text-xs text-[#55706f] transition hover:border-[#8caaa0] hover:bg-[#f8edda]" data-testid={`button-quick-question-${index}`}>{item}</button>)}</div>{answer && <div className="mt-5 flex items-start justify-between gap-4 rounded-xl border border-[#c7d7cd] bg-[#e7f0e6] p-4 text-sm leading-relaxed text-[#31595a]" data-testid="text-weather-answer"><p><strong className="mr-1 text-[#173e47]">Mausam Mitra:</strong>{answer}</p><SpeakButton text={answer} lang={language} label={t.listen} /></div>}</section>
     {error && !data ? <ErrorState message={error} onRetry={refresh} /> : <section><div className="mb-4 flex items-end justify-between"><div><p className="font-data text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--accent))]">LOOK AHEAD</p><h2 className="mt-1 font-display text-3xl">{t.forecast}</h2></div><span className="hidden items-center gap-1.5 text-xs text-[hsl(var(--muted-foreground))] sm:flex"><CalendarDays className="h-4 w-4" /> Local time</span></div><div className="grid gap-2 sm:grid-cols-4 lg:grid-cols-7">{loading ? Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-36" />) : data?.days.map((day, index) => { const dayMeta = weatherMeta(day.weatherCode); return <div key={day.date} className={`rounded-2xl border p-4 transition hover:-translate-y-1 ${index === 0 ? 'border-[#d5aa76] bg-[#f4ead8]' : 'border-[hsl(var(--card-border))] bg-[hsl(var(--card))]'}`} data-testid={`card-forecast-${day.date}`}><p className="font-data text-[10px] font-bold uppercase tracking-wider text-[hsl(var(--muted-foreground))]">{index === 0 ? t.today : formatDate(day.date, { weekday: 'short' })}</p><dayMeta.Icon className="my-4 h-7 w-7" style={{ color: dayMeta.color }} /><p className="text-sm font-bold">{formatTemp(day.max, unit)} <span className="font-normal text-[hsl(var(--muted-foreground))]">{formatTemp(day.min, unit)}</span></p><div className="mt-3 flex items-center gap-1 text-xs text-[#39788a]"><Droplets className="h-3.5 w-3.5" />{day.rainChance}%</div></div>; })}</div></section>}
  </div>;
}

function ClimatePage({ location, language }: { location: LocationPoint; language: Language }) {
  const { data, loading, error } = useClimate(location);
  const t = copy[language];
  const summary = useMemo(() => {
    if (!data || !data.temperatures.length) return null;
    const valid = data.temperatures.filter((value: number | null) => value !== null) as number[];
    const rain = data.rainfall.filter((value: number | null) => value !== null) as number[];
    const average = valid.reduce((sum, value) => sum + value, 0) / valid.length;
    const first = valid.slice(0, Math.floor(valid.length / 2)).reduce((sum, value) => sum + value, 0) / Math.max(1, Math.floor(valid.length / 2));
    const second = valid.slice(Math.floor(valid.length / 2)).reduce((sum, value) => sum + value, 0) / Math.max(1, valid.length - Math.floor(valid.length / 2));
    return { average, change: second - first, rain: rain.reduce((sum, value) => sum + value, 0) / Math.max(1, rain.length) };
  }, [data]);
  const monthly = useMemo(() => {
    if (!data) return [];
    const groups = Array.from({ length: 12 }, () => ({ temps: [] as number[], rain: 0 }));
    data.dates.forEach((date, index) => { const month = new Date(`${date}T12:00:00`).getMonth(); if (data.temperatures[index] !== null) groups[month].temps.push(data.temperatures[index]); groups[month].rain += data.rainfall[index] ?? 0; });
    return groups.map((group, index) => ({ month: new Intl.DateTimeFormat('en-IN', { month: 'short' }).format(new Date(2024, index, 1)), temp: group.temps.length ? group.temps.reduce((sum, value) => sum + value, 0) / group.temps.length : 0, rain: group.rain }));
  }, [data]);
  const maxRain = Math.max(...monthly.map((item) => item.rain), 1);
  return <div className="space-y-8"><SectionHeading eyebrow="CLIMATE DESK / FIVE-YEAR VIEW" title={`The pattern behind ${location.name}.`} description="Historical signals help you prepare for the season, without pretending the weather follows a script." action={<div className="flex items-center gap-2 rounded-full border border-[#c8d5ce] bg-[#e3eee6] px-3 py-2 text-xs font-bold text-[#38705c]"><Globe2 className="h-3.5 w-3.5" /> India · local time</div>} />{error ? <ErrorState message={error} /> : loading ? <div className="grid gap-5 lg:grid-cols-[1.3fr_.7fr]"><Skeleton className="h-[360px]" /><Skeleton className="h-[360px]" /></div> : <><section className="grid gap-4 sm:grid-cols-3">{[['Average temperature', `${summary?.average.toFixed(1)}°C`, Thermometer], ['Temperature signal', `${(summary?.change ?? 0) >= 0 ? '+' : ''}${summary?.change.toFixed(1)}°C`, BarChart3], ['Daily rainfall average', `${summary?.rain.toFixed(1)} mm`, Droplets]].map(([label, value, Icon], index) => { const MetricIcon = Icon as LucideIcon; return <div key={label as string} className={`rounded-2xl border p-5 ${index === 1 ? 'border-[#d5aa76] bg-[#f4ead8]' : 'border-[hsl(var(--card-border))] bg-[hsl(var(--card))]'}`}><MetricIcon className="h-5 w-5 text-[hsl(var(--accent))]" /><p className="mt-5 text-xs font-semibold text-[hsl(var(--muted-foreground))]">{label as string}</p><p className="mt-1 font-display text-4xl">{value as string}</p><p className="mt-2 text-xs text-[hsl(var(--muted-foreground))]">{index === 1 ? 'first half vs second half of period' : 'based on daily archive data'}</p></div>; })}</section><section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]"><div className="rounded-[1.5rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6"><div className="flex items-start justify-between"><div><p className="font-data text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--accent))]">SEASONAL RHYTHM</p><h2 className="mt-2 font-display text-3xl">Rain arrives in chapters.</h2></div><span className="font-data text-[10px] text-[hsl(var(--muted-foreground))]">mm / month</span></div><div className="mt-8 flex h-52 items-end gap-2 border-b border-l border-[hsl(var(--border))] px-2 pb-0 sm:gap-3">{monthly.map((item) => <div className="group flex h-full flex-1 flex-col justify-end" key={item.month} data-testid={`bar-rain-${item.month}`}><div className="relative w-full rounded-t-md bg-[#6fa9a1] transition group-hover:bg-[#e88c2f]" style={{ height: `${Math.max(5, item.rain / maxRain * 100)}%` }}><span className="absolute -top-6 left-1/2 hidden -translate-x-1/2 rounded bg-[#173e47] px-1.5 py-1 font-data text-[9px] text-[#f7f2e7] group-hover:block">{Math.round(item.rain)}</span></div><span className="mt-3 text-center font-data text-[9px] text-[hsl(var(--muted-foreground))]">{item.month}</span></div>)}</div><div className="mt-5 flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><span className="h-2.5 w-2.5 rounded-sm bg-[#6fa9a1]" /> Total rainfall by calendar month from the Open-Meteo archive</div></div><div className="rounded-[1.5rem] bg-[#173e47] p-6 text-[#f7f2e7]"><div className="flex items-center gap-2 text-[#e88c2f]"><Gauge className="h-4 w-4" /><span className="font-data text-[10px] font-bold uppercase tracking-[.18em]">READ THE SIGNAL</span></div><h2 className="mt-5 font-display text-3xl">Useful, not certain.</h2><p className="mt-3 text-sm leading-relaxed text-[#b2cbc2]">A warmer or wetter signal is context for planning—not a promise about a particular day. Pair this view with the live forecast before acting.</p><div className="mt-8 border-t border-[#6e9f98]/35 pt-4"><p className="font-data text-[10px] uppercase tracking-wider text-[#a5c7bd]">ARCHIVE WINDOW</p><p className="mt-1 text-sm font-bold">{data?.dates[0]} — {data?.dates[data.dates.length - 1]}</p></div></div></section></>}</div>;
}

function AdvisoryPage({ location, unit, language }: { location: LocationPoint; unit: Unit; language: Language }) {
  const { data, loading, error, refresh } = useWeather(location);
  const t = copy[language];
  const advisories = useMemo(() => {
    if (!data) return [];
    const items: { level: string; title: string; detail: string; action: string; Icon: LucideIcon }[] = [];
    const today = data.days[0];
    if (today.rainChance >= 90 || today.rain >= 40) items.push({ level: 'SEVERE', title: 'Heavy rain may disrupt movement', detail: `${today.rainChance}% chance of rain today with up to ${today.rain.toFixed(1)} mm expected. Low-lying roads can change quickly.`, action: 'Avoid flood-prone routes, protect tools and documents, and follow local authority updates.', Icon: CloudLightning });
    else if (today.rainChance >= 70) items.push({ level: 'WATCH', title: 'Rain may disrupt movement', detail: `${today.rainChance}% chance of rain today with up to ${today.rain.toFixed(1)} mm expected. Low-lying roads can change quickly.`, action: 'Leave a little earlier; protect tools, documents and electronics.', Icon: CloudRain });
    if (today.wind >= 55) items.push({ level: 'SEVERE', title: 'Strong winds need caution', detail: `Wind may reach ${Math.round(today.wind)} km/h. Loose structures, exposed branches, and two-wheelers need attention.`, action: 'Secure light objects and avoid unnecessary travel until the strongest winds pass.', Icon: Wind });
    else if (today.wind >= 35) items.push({ level: 'WATCH', title: 'Gusty winds possible', detail: `Wind may reach ${Math.round(today.wind)} km/h. Loose structures and exposed branches need attention.`, action: 'Secure light objects and avoid standing beneath old trees.', Icon: Wind });
    if (today.max >= 42) items.push({ level: 'SEVERE', title: 'Extreme heat stress window', detail: `The afternoon high may reach ${formatTemp(today.max, unit)}. Heat load will be highest in the early afternoon.`, action: 'Avoid strenuous work in peak heat, hydrate regularly, and check on vulnerable people.', Icon: Sun });
    else if (today.max >= 38) items.push({ level: 'CAUTION', title: 'Heat stress window', detail: `The afternoon high may reach ${formatTemp(today.max, unit)}. Heat load will be highest in the early afternoon.`, action: 'Shift heavy work to morning; drink water before you feel thirsty.', Icon: Sun });
    if (!items.length) items.push({ level: 'CLEAR', title: t.noSignal, detail: 'No severe rain, heat or wind threshold is showing in the current seven-day model guidance.', action: 'Continue normal plans and check again before a weather-sensitive task.', Icon: Check });
    return items;
  }, [data, t.noSignal, unit]);
  return <div className="space-y-8"><SectionHeading eyebrow="FIELD NOTES / ACTION FIRST" title="What needs your attention?" description={`Practical guidance for ${location.name}, built from the latest live forecast. Thresholds are deliberately conservative.`} action={<button onClick={refresh} className="inline-flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-2.5 text-sm font-bold text-[hsl(var(--primary))] transition hover:bg-[hsl(var(--muted))]" data-testid="button-refresh-advisories"><RefreshCw className="h-4 w-4" /> Refresh</button>} />{error ? <ErrorState message={error} onRetry={refresh} /> : loading ? <div className="space-y-3"><Skeleton className="h-32" /><Skeleton className="h-32" /></div> : <><div className="rounded-2xl border border-[#d5aa76] bg-[#f4ead8] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#e88c2f] text-[#173e47]"><Bell className="h-5 w-5" /></div><div><p className="font-data text-[10px] font-bold uppercase tracking-[.18em] text-[#7c6245]">TODAY / {location.name}</p><p className="mt-1 text-sm font-bold text-[#4d4a3b]">{advisories.length === 1 && advisories[0].level === 'CLEAR' ? 'A relatively open weather window' : `${advisories.length} signal${advisories.length > 1 ? 's' : ''} worth planning around`}</p></div></div><span className="rounded-full bg-[#fbf1df] px-3 py-1.5 font-data text-[10px] font-bold text-[#80643e]">Issued {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span></div></div><div className="space-y-3">{advisories.map((item, index) => <article key={item.title} className={`rounded-2xl border p-5 sm:p-6 ${item.level === 'CLEAR' ? 'border-[#c7d7cd] bg-[#e7f0e6]' : 'border-[hsl(var(--card-border))] bg-[hsl(var(--card))]'}`} data-testid={`card-advisory-${index}`}><div className="flex flex-col gap-5 sm:flex-row sm:items-start"><div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${item.level === 'CLEAR' ? 'bg-[#c7d7cd] text-[#31595a]' : 'bg-[#fbebe5] text-[#b04d42]'}`}><item.Icon className="h-5 w-5" /></div><div className="flex-1"><div className="flex flex-wrap items-center gap-2"><span className={`font-data text-[10px] font-bold tracking-[.18em] ${item.level === 'CLEAR' ? 'text-[#38705c]' : 'text-[#b04d42]'}`}>{item.level}</span><span className="text-xs text-[hsl(var(--muted-foreground))]">· {formatDate(data?.days[0].date ?? new Date().toISOString().slice(0, 10), { weekday: 'long', month: 'short', day: 'numeric' })}</span></div><h2 className="mt-2 font-display text-2xl">{item.title}</h2><p className="mt-2 max-w-2xl text-sm leading-relaxed text-[hsl(var(--muted-foreground))]">{item.detail}</p><div className="mt-4 flex items-start gap-2 rounded-xl bg-[hsl(var(--muted))] p-3 text-sm font-semibold text-[hsl(var(--foreground))]"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[hsl(var(--accent))]" />{item.action}</div></div></div></article>)}</div><p className="flex items-center gap-2 text-xs text-[hsl(var(--muted-foreground))]"><ShieldAlert className="h-4 w-4" /> Guidance is informational, not an official emergency warning. For urgent events, follow local district and IMD alerts.</p></>}</div>;
}

function DecisionPage({ location, language, unit }: { location: LocationPoint; language: Language; unit: Unit }) {
  const { data, loading, error, refresh } = useWeather(location);
  const risk = data ? weatherRisk(data) : null;
  const firstDay = data?.days[0];
  return <div className="space-y-8"><SectionHeading eyebrow="DECISION DESK / CONTEXTUAL GUIDANCE" title="Make the next move with more confidence." description="Choose an activity and Mausam Mitra translates the live forecast into a practical decision." action={<div className="rounded-full border border-[#c8d5ce] bg-[#e3eee6] px-3 py-2 text-xs font-bold text-[#38705c]">{risk ? `${risk.score}/100 risk` : 'Reading risk'}</div>} />{error ? <ErrorState message={error} onRetry={refresh} /> : loading ? <Skeleton className="h-80" /> : <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]"><div className="rounded-[1.5rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center gap-3"><Tractor className="h-6 w-6 text-[hsl(var(--accent))]" /><div><p className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">FARMER MODE</p><h2 className="mt-2 font-display text-3xl">What should I do today?</h2></div></div><p className="mt-6 rounded-xl bg-[#e7f0e6] p-4 text-sm leading-relaxed text-[#31595a]">{firstDay?.rainChance >= 60 ? 'Delay spraying and avoid heavy irrigation. Moisture is already likely to arrive from the sky; use the next drier window instead.' : firstDay?.max !== undefined && firstDay.max >= 35 ? 'Prefer irrigation and field work before late morning. Avoid spraying in the hottest hours and check wind before applying treatment.' : 'A generally workable field day. Check soil moisture before irrigating and use the lower-wind window for spraying.'}</p><div className="mt-7"><div className="flex items-end justify-between"><div><p className="font-data text-[10px] font-bold uppercase tracking-[.18em] text-[hsl(var(--accent))]">CROP WEATHER CALENDAR</p><p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">Seven-day work windows for {location.name}</p></div><Sprout className="h-5 w-5 text-[#6fa9a1]" /></div><div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">{data?.days.map((day) => { const score = Math.max(0, Math.round(100 - day.rainChance * 0.7 - Math.max(0, day.wind - 18) * 1.1)); return <div key={day.date} className="rounded-xl border border-[hsl(var(--border))] p-2.5 text-center"><p className="font-data text-[10px] text-[hsl(var(--muted-foreground))]">{formatDate(day.date, { weekday: 'short' })}</p><p className="my-3 font-display text-2xl">{score}</p><p className="text-[10px] leading-tight text-[hsl(var(--muted-foreground))]">{day.rainChance >= 60 ? 'Avoid spray' : day.wind >= 28 ? 'Wind watch' : 'Good window'}</p></div>; })}</div></div></div><aside className="rounded-[1.5rem] bg-[#173e47] p-6 text-[#f7f2e7]"><div className="flex items-center gap-2 text-[#e88c2f]"><ShieldAlert className="h-4 w-4" /><span className="font-data text-[10px] font-bold uppercase tracking-[.18em]">WEATHER RISK SCORE</span></div><div className="mt-5 flex items-end gap-2"><span className="font-display text-7xl">{risk?.score ?? '—'}</span><span className="mb-3 text-sm text-[#a5c7bd]">out of 100</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#2c5960]"><div className="h-full rounded-full bg-[#e88c2f]" style={{ width: `${risk?.score ?? 0}%` }} /></div><p className="mt-3 text-sm font-bold">{risk?.level} planning risk</p><p className="mt-2 text-sm leading-relaxed text-[#b2cbc2]">Weighted from rainfall probability, rainfall amount, wind, heat, and visibility. Use it to decide what to check next.</p><div className="mt-7 border-t border-[#6e9f98]/35 pt-5"><p className="font-data text-[10px] uppercase tracking-[.18em] text-[#a5c7bd]">MAIN DRIVERS</p><div className="mt-3 space-y-2">{risk?.drivers.map((driver) => <div key={driver} className="flex items-start gap-2 text-sm"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#e88c2f]" />{driver}</div>)}</div></div><p className="mt-7 text-xs leading-relaxed text-[#a5c7bd]">For severe weather, follow official IMD and local disaster-management alerts.</p></aside></div>}</div>;
}

function WeatherTwinPage({ location, language, unit }: { location: LocationPoint; language: Language; unit: Unit }) {
  const { data, loading, error, refresh } = useWeather(location);
  const [profile, setProfile] = useState<WeatherProfile>(() => {
    try {
      return JSON.parse(localStorage.getItem('mausam-mitra-profile') ?? '"farmer"') as WeatherProfile;
    } catch {
      return 'farmer';
    }
  });
  const [prompt, setPrompt] = useState('');
  const [submittedPrompt, setSubmittedPrompt] = useState('');
  const advice = data ? personalizedAdvice(data, profile, submittedPrompt, unit) : null;
  const risk = data ? weatherRisk(data) : null;
  const selectedProfile = WEATHER_PROFILES.find((item) => item.value === profile) ?? WEATHER_PROFILES[0];
  const quickPrompts = profile === 'farmer'
    ? ['Should I spray pesticide tomorrow?', 'Should I irrigate today?']
    : profile === 'driver'
      ? ['Is it safe to drive this afternoon?', 'Will rain affect my commute?']
      : ['Should I plan an outdoor activity today?', 'What should I watch before I leave?'];
  const chooseProfile = (value: WeatherProfile) => {
    setProfile(value);
    setSubmittedPrompt('');
    try { localStorage.setItem('mausam-mitra-profile', JSON.stringify(value)); } catch { /* preference is best effort */ }
  };
  const ask = (value = prompt) => {
    setSubmittedPrompt(value);
    setPrompt('');
  };
  return <div className="space-y-8">
    <SectionHeading eyebrow="WEATHER TWIN / ACTION-FIRST GUIDANCE" title="What should I do?" description={`The same forecast means different things to a farmer, driver, student, or visitor. Pick a profile and Mausam Mitra will explain the next sensible action for ${location.name}.`} action={<div className="rounded-full border border-[#c8d5ce] bg-[#e3eee6] px-3 py-2 text-xs font-bold text-[#38705c]">{risk ? `${risk.score}/100 planning risk` : 'Reading forecast'}</div>} />
    {error && !data ? <ErrorState message={error} onRetry={refresh} /> : <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
      <div className="rounded-[1.5rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><p className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">PERSONALIZED WEATHER TWIN</p><h2 className="mt-2 font-display text-3xl">Who are you planning for?</h2></div><HeartPulse className="h-6 w-6 text-[hsl(var(--accent))]" /></div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">{WEATHER_PROFILES.map((item) => <button key={item.value} onClick={() => chooseProfile(item.value)} className={`rounded-xl border p-3 text-left transition ${profile === item.value ? 'border-[#6e9f98] bg-[#e3eee6] shadow-sm' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'}`}><span className="block text-sm font-bold text-[hsl(var(--foreground))]">{item.label}</span><span className="mt-1 block text-xs leading-relaxed text-[hsl(var(--muted-foreground))]">{item.description}</span></button>)}</div>
        <div className="mt-6 rounded-xl bg-[#f4ead8] p-4"><p className="font-data text-[10px] font-bold uppercase tracking-[.18em] text-[#7c6245]">CURRENT MODE / {selectedProfile.label.toUpperCase()}</p><p className="mt-2 text-sm leading-relaxed text-[#4d4a3b]">{selectedProfile.description}. Guidance stays explainable: it uses the live forecast signals shown below, not a hidden score.</p></div>
      </div>
      <div className="rounded-[1.5rem] bg-[#173e47] p-5 text-[#f7f2e7] sm:p-6">
        <div className="flex items-center gap-2 text-[#e88c2f]"><Navigation className="h-4 w-4" /><span className="font-data text-[10px] font-bold uppercase tracking-[.2em]">NEXT ACTION</span></div>
        {loading ? <Skeleton className="mt-6 h-48 bg-[#2c5960]" /> : advice ? <><div className="mt-5 flex items-center justify-between gap-3"><span className={`rounded-full px-2.5 py-1 font-data text-[10px] font-bold tracking-[.14em] ${advice.level === 'GO' || advice.level === 'CLEAR' ? 'bg-[#d8ebde] text-[#31595a]' : advice.level === 'CAUTION' ? 'bg-[#f7d6c9] text-[#7c3f36]' : 'bg-[#f4ead8] text-[#80643e]'}`}>{advice.level}</span><span className="font-data text-[10px] text-[#a5c7bd]">LIVE FORECAST</span></div><h2 className="mt-4 font-display text-3xl leading-tight">{advice.title}</h2><p className="mt-3 text-sm leading-relaxed text-[#b2cbc2]">{advice.detail}</p><div className="mt-5 flex items-start gap-2 rounded-xl bg-[#2c5960] p-3 text-sm font-semibold"><ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-[#e88c2f]" />{advice.action}</div></> : <p className="mt-6 text-sm text-[#b2cbc2]">Reading the latest forecast before making a recommendation.</p>}
        <div className="mt-6 border-t border-[#6e9f98]/35 pt-5"><p className="font-data text-[10px] uppercase tracking-[.18em] text-[#a5c7bd]">ASK A SPECIFIC QUESTION</p><div className="mt-3 flex gap-2"><input value={prompt} onChange={(event) => setPrompt(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') ask(); }} placeholder="Is it safe to travel tomorrow?" className="min-w-0 flex-1 rounded-xl border border-[#6e9f98]/45 bg-[#214d55] px-3 py-2.5 text-sm text-[#f7f2e7] outline-none placeholder:text-[#a5c7bd] focus:border-[#e88c2f]" /><VoiceButton onText={setPrompt} lang={language} label="Speak your question" /><button onClick={() => ask()} className="rounded-xl bg-[#e88c2f] px-3 py-2.5 text-sm font-bold text-[#173e47] transition hover:bg-[#f0aa52]" data-testid="button-ask-decision">Ask</button></div><div className="mt-3 flex flex-wrap gap-2">{quickPrompts.map((item) => <button key={item} onClick={() => ask(item)} className="rounded-full border border-[#6e9f98]/45 px-3 py-1.5 text-left text-xs text-[#b2cbc2] transition hover:border-[#e88c2f] hover:text-[#f7f2e7]">{item}</button>)}</div></div>
      </div>
    </section>}
    {!error && <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
      <div className="rounded-[1.5rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-5 sm:p-6"><div className="flex items-end justify-between"><div><p className="font-data text-[10px] font-bold uppercase tracking-[.2em] text-[hsl(var(--accent))]">EXPLAINABLE SIGNALS</p><h2 className="mt-2 font-display text-3xl">What the advice is based on.</h2></div><Sprout className="h-5 w-5 text-[#6fa9a1]" /></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">{data ? [['Rain', `${data.days[0].rainChance}%`, data.days[0].rain >= 12 ? 'watch' : 'open'], ['Wind', `${Math.round(data.days[0].wind)} km/h`, data.days[0].wind >= 35 ? 'watch' : 'open'], ['High', formatTemp(data.days[0].max, unit), data.days[0].max >= 35 ? 'watch' : 'open'], ['Visibility', `${(data.current.visibility / 1000).toFixed(1)} km`, data.current.visibility < 5000 ? 'watch' : 'open']].map(([label, value, state]) => <div key={label} className="rounded-xl border border-[hsl(var(--border))] p-3"><p className="text-xs text-[hsl(var(--muted-foreground))]">{label}</p><p className="mt-2 font-display text-2xl">{value}</p><p className={`mt-1 text-[10px] font-bold uppercase tracking-wider ${state === 'watch' ? 'text-[#b04d42]' : 'text-[#38705c]'}`}>{state}</p></div>) : Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24" />)}</div></div>
      <div className="rounded-[1.5rem] border border-[#d5aa76] bg-[#f4ead8] p-5 sm:p-6"><div className="flex items-center gap-2 text-[#7c6245]"><ShieldAlert className="h-4 w-4" /><span className="font-data text-[10px] font-bold uppercase tracking-[.2em]">SAFETY NOTE</span></div><h2 className="mt-4 font-display text-2xl">Action, not an official warning.</h2><p className="mt-3 text-sm leading-relaxed text-[#5f5947]">Use this mode to decide what to check next. For emergencies, marine travel, flood-prone routes, or severe weather, follow IMD and local disaster-management alerts.</p><button onClick={refresh} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#7c6245] underline underline-offset-4"><RefreshCw className="h-4 w-4" /> Refresh live signals</button></div>
    </section>}
  </div>;
}

function SettingsPage({ location, setLocation, language, setLanguage, unit, setUnit }: { location: LocationPoint; setLocation: (location: LocationPoint) => void; language: Language; setLanguage: (language: Language) => void; unit: Unit; setUnit: (unit: Unit) => void }) {
  const [saved, setSaved] = useState(false);
  const save = () => { localStorage.setItem('mausam-mitra-settings', JSON.stringify({ language, unit, location })); setSaved(true); window.setTimeout(() => setSaved(false), 2200); };
  const setBrowser = () => { if (!navigator.geolocation) return; navigator.geolocation.getCurrentPosition((position) => setLocation({ name: 'Your location', admin1: 'India', latitude: position.coords.latitude, longitude: position.coords.longitude })); };
  return <div className="space-y-8"><SectionHeading eyebrow="YOUR COMPANION / PREFERENCES" title="Set it up your way." description="Mausam Mitra keeps these preferences in this browser. No account required." /><div className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]"><div className="space-y-5"><section className="rounded-[1.5rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#dae8df] text-[#31595a]"><Globe2 className="h-5 w-5" /></div><div><h2 className="font-display text-2xl">Language</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">Use the language that feels clearest.</p></div></div><div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">{LANGUAGES.map((item) => <button key={item.value} onClick={() => setLanguage(item.value)} className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left text-sm transition ${language === item.value ? 'border-[#6e9f98] bg-[#e3eee6] font-bold text-[#31595a]' : 'border-[hsl(var(--border))] hover:bg-[hsl(var(--muted))]'}`} data-testid={`button-language-${item.value}`}><span>{item.native}</span>{language === item.value && <Check className="h-4 w-4" />}</button>)}</div></section><section className="rounded-[1.5rem] border border-[hsl(var(--card-border))] bg-[hsl(var(--card))] p-6"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4ead8] text-[#8b642e]"><Thermometer className="h-5 w-5" /></div><div><h2 className="font-display text-2xl">Temperature units</h2><p className="text-xs text-[hsl(var(--muted-foreground))]">Choose how daily temperatures are shown.</p></div></div><div className="mt-5 flex gap-2 rounded-xl bg-[hsl(var(--muted))] p-1">{(['celsius', 'fahrenheit'] as Unit[]).map((item) => <button key={item} onClick={() => setUnit(item)} className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition ${unit === item ? 'bg-[hsl(var(--card))] text-[hsl(var(--primary))] shadow-sm' : 'text-[hsl(var(--muted-foreground))]'}`} data-testid={`button-unit-${item}`}>{item === 'celsius' ? 'Celsius (°C)' : 'Fahrenheit (°F)'}</button>)}</div></section></div><div className="space-y-5"><section className="rounded-[1.5rem] bg-[#173e47] p-6 text-[#f7f2e7]"><div className="flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#2c5960] text-[#e88c2f]"><MapPin className="h-5 w-5" /></div><div><h2 className="font-display text-2xl">Primary location</h2><p className="text-xs text-[#a5c7bd]">Forecasts and climate context follow this place.</p></div></div><div className="mt-6 rounded-xl border border-[#6e9f98]/35 bg-[#2c5960] p-4"><p className="font-data text-[10px] uppercase tracking-[.18em] text-[#a5c7bd]">CURRENTLY FOLLOWING</p><p className="mt-2 text-lg font-bold">{location.name}</p><p className="text-xs text-[#b2cbc2]">{location.admin1 ?? 'India'} · {location.latitude.toFixed(3)}, {location.longitude.toFixed(3)}</p></div><div className="mt-4"><LocationSearch location={location} onSelect={setLocation} /><button onClick={setBrowser} className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-[#f4c373] transition hover:text-[#f7f2e7]" data-testid="button-settings-location"><LocateFixed className="h-4 w-4" /> Use browser location</button></div></section><button onClick={save} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#e88c2f] px-4 py-3.5 text-sm font-bold text-[#173e47] transition hover:bg-[#f0aa52]" data-testid="button-save-settings">{saved ? <Check className="h-4 w-4" /> : null}{saved ? 'Preferences saved' : 'Save preferences'}</button><p className="text-center text-xs text-[hsl(var(--muted-foreground))]">Browser voice input and read-aloud work when your device supports Web Speech API.</p></div></div></div>;
}

function NotFoundPage() {
  return <div className="grid min-h-[70vh] place-items-center text-center"><div><BrandMark /><h1 className="mt-6 font-display text-5xl">That page moved with the wind.</h1><p className="mt-3 text-sm text-[hsl(var(--muted-foreground))]">The place you are looking for is not part of this forecast.</p><Link href="/" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#173e47] px-4 py-3 text-sm font-bold text-[#f7f2e7]" data-testid="link-return-home">Return to overview <ArrowRight className="h-4 w-4" /></Link></div></div>;
}

function Router({ location, setLocation, language, setLanguage, unit, setUnit }: { location: LocationPoint; setLocation: (location: LocationPoint) => void; language: Language; setLanguage: (language: Language) => void; unit: Unit; setUnit: (unit: Unit) => void }) {
  return <Shell location={location} setLocation={setLocation} language={language} setLanguage={setLanguage}><Switch><Route path="/"><HomePage location={location} language={language} unit={unit} /></Route><Route path="/climate"><ClimatePage location={location} language={language} /></Route><Route path="/advisories"><AdvisoryPage location={location} language={language} unit={unit} /></Route><Route path="/decision-desk"><WeatherTwinPage location={location} language={language} unit={unit} /></Route><Route path="/settings"><SettingsPage location={location} setLocation={setLocation} language={language} setLanguage={setLanguage} unit={unit} setUnit={setUnit} /></Route><Route component={NotFoundPage} /></Switch></Shell>;
}

function App() {
  const [location, setLocation] = useState<LocationPoint>(() => {
    try { const saved = JSON.parse(localStorage.getItem('mausam-mitra-settings') ?? 'null'); return saved?.location ?? DEFAULT_LOCATION; } catch { return DEFAULT_LOCATION; }
  });
  const [language, setLanguage] = useState<Language>(() => {
    try { const saved = JSON.parse(localStorage.getItem('mausam-mitra-settings') ?? 'null'); return saved?.language ?? 'en'; } catch { return 'en'; }
  });
  const [unit, setUnit] = useState<Unit>(() => {
    try { const saved = JSON.parse(localStorage.getItem('mausam-mitra-settings') ?? 'null'); return saved?.unit ?? 'celsius'; } catch { return 'celsius'; }
  });
  return <QueryClientProvider client={queryClient}><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><SwitchRouter><Router location={location} setLocation={setLocation} language={language} setLanguage={setLanguage} unit={unit} setUnit={setUnit} /></SwitchRouter></WouterRouter><Toaster /></QueryClientProvider>;
}

function SwitchRouter({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

export default App;