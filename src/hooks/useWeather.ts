import { useState, useEffect } from "react";

interface WeatherData {
  temperature: number;
  weatherCode: number;
  description: string;
  suggestion: "hot" | "warm" | "cool" | "cold";
}

const WEATHER_CODES: Record<number, string> = {
  0: "Clear sky",
  1: "Mainly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Depositing rime fog",
  51: "Light drizzle",
  53: "Moderate drizzle",
  55: "Dense drizzle",
  61: "Slight rain",
  63: "Moderate rain",
  65: "Heavy rain",
  71: "Slight snow",
  73: "Moderate snow",
  75: "Heavy snow",
  80: "Rain showers",
  81: "Moderate rain showers",
  82: "Violent rain showers",
  95: "Thunderstorm",
};

function getSuggestion(temp: number): WeatherData["suggestion"] {
  if (temp >= 30) return "hot";
  if (temp >= 20) return "warm";
  if (temp >= 10) return "cool";
  return "cold";
}

export function useWeather() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Try to get user's location
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation not supported"));
            return;
          }
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        });

        const { latitude, longitude } = position.coords;

        // Use Open-Meteo (free, no API key needed)
        const response = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
        );

        if (!response.ok) throw new Error("Weather fetch failed");

        const data = await response.json();
        const temp = data.current_weather.temperature;
        const code = data.current_weather.weathercode;

        setWeather({
          temperature: Math.round(temp),
          weatherCode: code,
          description: WEATHER_CODES[code] || "Unknown",
          suggestion: getSuggestion(temp),
        });
      } catch (e: any) {
        // Fallback: use a default warm weather
        setError(e.message);
        setWeather({
          temperature: 25,
          weatherCode: 0,
          description: "Clear sky",
          suggestion: "warm",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, []);

  return { weather, loading, error };
}
