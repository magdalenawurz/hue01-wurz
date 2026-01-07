// Geocoding API (Nominatim)
const geocodingApiUrl = "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=";
const geocodingCityPlzApiUrl = "https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1";
// Wetter API (Open-Meteo)
const weatherApiUrl = "https://api.open-meteo.com/v1/forecast?current_weather=true&";

class WeatherData {
    #temperature;
    #weatherCode;
    #raw;

    constructor({temperature = null, weatherCode = null, raw = null} = {}) {
        this.#temperature = temperature;
        this.#weatherCode = weatherCode;
        this.#raw = raw;
    }

    getTemperature() {
        return this.#temperature;
    }

    getWeatherCode() {
        return this.#weatherCode;
    }

    getRaw() {
        return this.#raw;
    }

    setTemperature(value) {
        this.#temperature = value;
    }

    setWeatherCode(value) {
        this.#weatherCode = value;
    }

    setRaw(value) {
        this.#raw = value;
    }
}

class LocationData {
    #latitude;
    #longitude;
    #cityName;
    #countryName;
    #stateName;
    #plz;

    constructor({
                    latitude = null,
                    longitude = null,
                    cityName = null,
                    countryName = null,
                    stateName = null,
                    plz = null
                } = {}) {
        this.#latitude = latitude;
        this.#longitude = longitude;
        this.#cityName = cityName;
        this.#countryName = countryName;
        this.#stateName = stateName;
        this.#plz = plz;
    }

    getLatitude() {
        return this.#latitude;
    }

    getLongitude() {
        return this.#longitude;
    }

    getCityName() {
        return this.#cityName;
    }

    getCountryName() {
        return this.#countryName;
    }

    getStateName() {
        return this.#stateName;
    }

    getPlz() {
        return this.#plz;
    }

    setLatitude(value) {
        this.#latitude = value;
    }

    setLongitude(value) {
        this.#longitude = value;
    }

    setCityName(value) {
        this.#cityName = value;
    }

    setCountryName(value) {
        this.#countryName = value;
    }

    setStateName(value) {
        this.#stateName = value;
    }

    setPlz(value) {
        this.#plz = value;
    }
}

const cityInput = document.getElementById("cityInput");
const zipInput = document.getElementById("zipInput");
const searchBtn = document.getElementById("searchBtn");

// Speichert die zuletzt geladene Location für die Anzeige
let lastLocationData = null;

// Wird vom Button oder HTML aufgerufen
async function searchWeather() {
    const city = cityInput ? cityInput.value.trim() : "";
    const plz = zipInput ? zipInput.value.trim() : "";
    try {
        const locationData = await getCoordinates(city, plz);
        // zuletzt gefundene Location merken
        lastLocationData = locationData;
        const weatherData = await fetchWeatherData(locationData);
        updateWeatherData(weatherData);
    } catch (error) {
        console.error("Fehler beim Abfragen des Wetters:", error);
        // TODO: Fehleranzeige in der UI
        const tempEl = document.getElementById("temperature");
        if (tempEl) tempEl.innerText = "-";
        const locEl = document.getElementById("location");
        if (locEl) locEl.innerText = "-";
    }
}

function updateWeatherData(weatherData) {
    // Location anzeigen (z.B. "Linz, Oberösterreich, Österreich")
    const locEl = document.getElementById("location");
    if (locEl) {
        if (lastLocationData) {
            const parts = [];
            const city = lastLocationData.getCityName();
            const state = lastLocationData.getStateName();
            const country = lastLocationData.getCountryName();
            if (city) parts.push(city);
            if (state) parts.push(state);
            if (country) parts.push(country);
            locEl.innerText = parts.length ? parts.join(", ") : "-";
        } else {
            locEl.innerText = "-";
        }
    }

    const tempEl = document.getElementById("temperature");
    if (tempEl) {
        const t = weatherData ? weatherData.getTemperature() : null;
        tempEl.innerText = t != null ? `${t} °C` : "-";
    }

    const iconEl = document.getElementById("weatherIcon");
    const descEl = document.getElementById("weatherDescription");
    if (iconEl && descEl) {
        const code = weatherData ? weatherData.getWeatherCode() : null;
        iconEl.innerHTML = code != null ? getWeatherIcon(code) : "";
        descEl.innerText = code != null ? getWeatherDescription(code) : "";
    }
}

async function getCoordinates(city, zip) {
    if (!city && !zip) throw new Error("Kein Ort/PLZ angegeben");

    let url;
    if (zip) {
        const q = encodeURIComponent((zip + (city ? " " + city : "")).trim());
        url = `${geocodingCityPlzApiUrl}&q=${q}`;
    } else {
        url = `${geocodingApiUrl}${encodeURIComponent(city)}`;
    }

    const res = await fetch(url, {
        headers: {
            "User-Agent": "weather-app-example/1.0 (contact@example.com)"
        }
    });
    if (!res.ok) throw new Error("Geocoding-API Fehler");
    const arr = await res.json();
    if (!Array.isArray(arr) || arr.length === 0) throw new Error("Ortsdaten nicht gefunden");
    const first = arr[0];
    const lat = first.lat ? parseFloat(first.lat) : null;
    const lon = first.lon ? parseFloat(first.lon) : null;
    const address = first.address || {};
    const cityName = address.city || address.town || address.village || address.county || null;
    const countryName = address.country || null;
    const stateName = address.state || null;
    const plz = address.postcode || zip || null;

    return new LocationData({
        latitude: lat,
        longitude: lon,
        cityName,
        countryName,
        stateName,
        plz
    });
}

async function fetchWeatherData(locationData) {
    const latitude = locationData.getLatitude();
    const longitude = locationData.getLongitude();
    if (latitude == null || longitude == null) {
        throw new Error("Ungültige Koordinaten");
    }

    const url = `${weatherApiUrl}latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Wetter-API Fehler");
    const json = await res.json();
    const cw = json.current_weather || {};
    return new WeatherData({
        temperature: cw.temperature ?? null,
        weatherCode: cw.weathercode ?? null,
        raw: json
    });
}

// Icon & Beschreibung
function getWeatherIcon(weathercode) {
    let iconName;
    switch (weathercode) {
        case 0:
            iconName = "clear-day.svg";
            break;
        case 1:
        case 2:
        case 3:
            iconName = "partly-cloudy-day.svg";
            break;
        case 45:
        case 48:
            iconName = "fog.svg";
            break;
        case 51:
        case 53:
        case 55:
        case 56:
        case 57:
        case 61:
        case 63:
        case 65:
        case 66:
        case 67:
        case 80:
        case 81:
        case 82:
            iconName = "rain.svg";
            break;
        case 71:
        case 73:
        case 75:
        case 77:
        case 85:
        case 86:
            iconName = "snow.svg";
            break;
        case 95:
        case 96:
        case 99:
            iconName = "thunderstorms.svg";
            break;
        default:
            iconName = "unknown.svg";
    }
    return `<img src="icons/${iconName}" alt="Wetter Icon">`;
}

function getWeatherDescription(weathercode) {
    const weatherDescriptions = {
        0: "Klarer Himmel",
        1: "Leicht bewölkt",
        2: "Teilweise bewölkt",
        3: "Bewölkt",
        45: "Nebel",
        48: "Ablagerungsnebel",
        51: "Leichter Nieselregen",
        53: "Mäßiger Nieselregen",
        55: "Starker Nieselregen",
        56: "Leichter gefrierender Nieselregen",
        57: "Starker gefrierender Nieselregen",
        61: "Leichter Regen",
        63: "Mäßiger Regen",
        65: "Starker Regen",
        66: "Leichter gefrierender Regen",
        67: "Starker gefrierender Regen",
        71: "Leichter Schneefall",
        73: "Mäßiger Schneefall",
        75: "Starker Schneefall",
        77: "Schneeregen",
        80: "Leichte Regenschauer",
        81: "Mäßige Regenschauer",
        82: "Starke Regenschauer",
        85: "Leichte Schneeschauer",
        86: "Starke Schneeschauer",
        95: "Gewitter",
        96: "Gewitter mit Hagel",
        99: "Gewitter mit starkem Hagel"
    };
    return weatherDescriptions[weathercode] || "Unbekannt";
}

// Optional: Button-Handler registrieren, falls vorhanden
if (searchBtn) {
    searchBtn.addEventListener("click", (e) => {
        e.preventDefault();
        searchWeather();
    });
}