import React, { useEffect, useState, useCallback } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Image, Alert, ScrollView, Dimensions, Platform } from "react-native";
import * as Location from "expo-location";
import axios from "axios";
import Constants from "expo-constants";
import { Ionicons } from '@expo/vector-icons';
import moment from 'moment-timezone'; // 날짜/시간 포맷을 위해 moment-timezone 라이브러리 (이미 설치되어 있을 것임)

// Dimensions는 여전히 필요
const { width, height } = Dimensions.get('window');

export default function Home() {
  const [weather, setWeather] = useState<any>(null);
  const [uvIndex, setUvIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<string>(''); // 현재 시간 상태 추가

  const OPEN_WEATHER_API_KEY = Constants.expoConfig?.extra?.OPEN_WEATHER_API_KEY;
  const UV_INDEX_API_KEY = Constants.expoConfig?.extra?.UV_INDEX_API_KEY || OPEN_WEATHER_API_KEY;

  const fetchWeatherAndUV = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!OPEN_WEATHER_API_KEY) {
        Alert.alert("API 키 오류", "OpenWeather API 키가 설정되지 않았습니다. .env 파일 및 app.config.js 설정을 확인해주세요.");
        setError("OpenWeather API 키 오류");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("위치 접근 권한 필요", "날씨 정보를 불러오려면 위치 접근 권한이 필요해요!");
        setError("위치 권한 거부됨");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = loc.coords;

      // 1. 현재 날씨 데이터 가져오기
      const weatherResponse = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPEN_WEATHER_API_KEY}&units=metric&lang=kr`
      );
      setWeather(weatherResponse.data);

      // 2. UV Index 데이터 가져오기
      try {
        const uvResponse = await axios.get(
            `https://api.openweathermap.org/data/2.5/uvi?lat=${latitude}&lon=${longitude}&appid=${UV_INDEX_API_KEY}`
        );
        setUvIndex(uvResponse.data.value);
      } catch (uvErr) {
        console.warn("UV Index 정보를 불러오는 중 오류 발생 (API 만료 또는 접근 불가):", uvErr);
        setUvIndex(null);
      }


    } catch (err: any) {
      console.error("날씨 정보를 불러오는 중 오류 발생:", err);
      setError(err.message || "날씨 정보를 불러오지 못했어요. 인터넷 연결 또는 API 키를 확인해주세요.");
      Alert.alert("날씨 정보 오류", err.message || "알 수 없는 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }, [OPEN_WEATHER_API_KEY, UV_INDEX_API_KEY]);

  // 현재 시간 업데이트 로직
  useEffect(() => {
    const updateCurrentTime = () => {
      // weather 데이터가 로드되면 해당 지역의 시간대를 사용하여 시간을 표시
      if (weather && weather.timezone) {
        const localMoment = moment().utcOffset(weather.timezone / 60);
        setCurrentTime(localMoment.format('A h:mm:ss')); // 오전/오후 h:mm:ss
      } else {
        // weather 데이터가 없으면 기기의 로컬 시간을 사용
        setCurrentTime(moment().format('A h:mm:ss'));
      }
    };

    // 1초마다 시간 업데이트
    const intervalId = setInterval(updateCurrentTime, 1000);
    updateCurrentTime(); // 컴포넌트 마운트 시 즉시 업데이트

    return () => clearInterval(intervalId); // 컴포넌트 언마운트 시 인터벌 정리
  }, [weather]); // weather 데이터가 변경될 때 시간대 업데이트


  useEffect(() => {
    fetchWeatherAndUV();
  }, [fetchWeatherAndUV]);

  // UV Index 값에 따른 지수 텍스트 반환
  const getUvIndexText = (uv: number | null) => {
    if (uv === null) return '정보 없음';
    if (uv <= 2) return '낮음';
    if (uv <= 5) return '보통';
    if (uv <= 7) return '높음';
    if (uv <= 10) return '매우 높음';
    return '위험';
  };

  // 일출/일몰 시간 포맷팅 (동일)
  const formatTime = (timestamp: number, timezoneOffsetSeconds: number) => {
    return moment.unix(timestamp).utcOffset(timezoneOffsetSeconds / 60).format('A h:mm');
  };

  // 날씨 상태에 따른 배경색 설정 (동일)
  const getBackgroundColor = (weatherId: number) => {
    if (weatherId >= 200 && weatherId < 300) return '#a2a8d3'; // Thunderstorm
    if (weatherId >= 300 && weatherId < 400) return '#c8d8e4'; // Drizzle
    if (weatherId >= 500 && weatherId < 600) return '#8aa8c1'; // Rain
    if (weatherId >= 600 && weather < 700) return '#e0eaf6'; // Snow
    if (weatherId >= 700 && weather < 800) return '#b0c4de'; // Atmosphere (Mist, Smoke, Haze etc.)
    if (weatherId === 800) return '#87ceeb'; // Clear
    if (weatherId > 800 && weatherId < 900) return '#b0d9e4'; // Clouds
    return '#cce5ff'; // Default
  };

  const dynamicBackgroundColor = weather ? getBackgroundColor(weather.weather[0].id) : '#e0f2f7';


  if (loading) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007bff" />
          <Text style={styles.loadingText}>날씨 정보를 불러오는 중...</Text>
        </View>
    );
  }

  if (error) {
    return (
        <View style={styles.container}>
          <Text style={styles.errorText}>
            <Ionicons name="warning-outline" size={24} color="#d9534f" />
            {"\n"}에러: {error}
          </Text>
          <Text style={styles.retryText} onPress={fetchWeatherAndUV}>다시 시도하기</Text>
        </View>
    );
  }

  if (!weather) {
    return (
        <View style={styles.container}>
          <Text style={styles.errorText}>
            <Ionicons name="cloud-offline-outline" size={24} color="#d9534f" />
            {"\n"}날씨 정보를 가져올 수 없어요 😥
          </Text>
          <Text style={styles.retryText} onPress={fetchWeatherAndUV}>다시 시도하기</Text>
        </View>
    );
  }

  return (
      <ScrollView contentContainerStyle={[styles.container, { backgroundColor: dynamicBackgroundColor }]}>
        <View style={styles.header}>
          <Text style={styles.city}>
            <Ionicons name="location-outline" size={28} color="#333" /> {weather.name}
          </Text>
          <Text style={styles.date}>{new Date().toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long',
          })}</Text>
          {/* 현재 시간 표시 */}
          <Text style={styles.currentTime}>
            <Ionicons name="time-outline" size={20} color="#555" /> 현재: {currentTime}
          </Text>
        </View>

        <View style={styles.mainInfo}>
          <Image
              source={{
                uri: `https://openweathermap.org/img/wn/${weather.weather[0].icon}@4x.png`,
              }}
              style={styles.icon}
          />
          <Text style={styles.temp}>{Math.round(weather.main.temp)}°C</Text>
          <Text style={styles.feelsLike}>체감 온도: {Math.round(weather.main.feels_like)}°C</Text>
          <Text style={styles.description}>{weather.weather[0].description}</Text>
        </View>

        <View style={styles.detailGrid}>
          <View style={styles.detailItem}>
            <Ionicons name="thermometer-outline" size={28} color="#666" />
            <Text style={styles.detailLabel}>최저/최고</Text>
            <Text style={styles.detailValue}>
              {Math.round(weather.main.temp_min)}°C / {Math.round(weather.main.temp_max)}°C
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="water-outline" size={28} color="#666" />
            <Text style={styles.detailLabel}>습도</Text>
            <Text style={styles.detailValue}>{weather.main.humidity}%</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="leaf-outline" size={28} color="#666" />
            <Text style={styles.detailLabel}>풍속</Text>
            <Text style={styles.detailValue}>{weather.wind.speed} m/s</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="speedometer-outline" size={28} color="#666" />
            <Text style={styles.detailLabel}>기압</Text>
            <Text style={styles.detailValue}>{weather.main.pressure} hPa</Text>
          </View>
          <View style={styles.detailItem}>
            <Ionicons name="cloud-outline" size={28} color="#666" />
            <Text style={styles.detailLabel}>구름</Text>
            <Text style={styles.detailValue}>{weather.clouds.all}%</Text>
          </View>

          <View style={styles.detailItem}>
            <Ionicons name="sunny-outline" size={28} color="#666" />
            <Text style={styles.detailLabel}>자외선 지수</Text>
            <Text style={styles.detailValue}>
              {uvIndex !== null ? `${uvIndex} (${getUvIndexText(uvIndex)})` : '정보 없음'}
            </Text>
          </View>

          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>일출</Text>
            <Text style={styles.detailValue}>
              {formatTime(weather.sys.sunrise, weather.timezone)}
            </Text>
          </View>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>일몰</Text>
            <Text style={styles.detailValue}>
              {formatTime(weather.sys.sunset, weather.timezone)}
            </Text>
          </View>

          {weather.rain && (
              <View style={styles.detailItem}>
                <Ionicons name="umbrella-outline" size={28} color="#666" />
                <Text style={styles.detailLabel}>강수량(1h)</Text>
                <Text style={styles.detailValue}>{weather.rain['1h']} mm</Text>
              </View>
          )}
          {weather.snow && (
              <View style={styles.detailItem}>
                <Ionicons name="snow-outline" size={28} color="#666" />
                <Text style={styles.detailLabel}>적설량(1h)</Text>
                <Text style={styles.detailValue}>{weather.snow['1h']} mm</Text>
              </View>
          )}
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    paddingVertical: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0f2f7",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 18,
    color: "#333",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 20,
    color: "#d9534f",
    textAlign: "center",
    paddingHorizontal: 20,
    lineHeight: 30,
    fontWeight: "bold",
  },
  retryText: {
    marginTop: 20,
    fontSize: 16,
    color: "#007bff",
    textDecorationLine: "underline",
  },
  header: {
    width: '90%',
    alignItems: 'center',
    marginBottom: 30,
  },
  city: {
    fontSize: 38,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    fontSize: 16,
    color: "#555",
  },
  // 현재 시간 스타일 추가
  currentTime: {
    fontSize: 18,
    color: "#555",
    marginTop: 5,
    fontWeight: 'bold',
    flexDirection: 'row',
    alignItems: 'center',
  },
  mainInfo: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  icon: {
    width: 150,
    height: 150,
    marginBottom: 5,
  },
  temp: {
    fontSize: 70,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 5,
  },
  feelsLike: {
    fontSize: 20,
    color: "#666",
    marginBottom: 10,
    fontWeight: '500',
  },
  description: {
    fontSize: 24,
    color: "#444",
    marginBottom: 10,
    textAlign: "center",
    fontWeight: '600',
  },
  detailGrid: {
    width: '90%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 15,
  },
  detailItem: {
    width: '45%',
    backgroundColor: 'rgba(255,255,255,0.4)',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  detailLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 5,
    marginBottom: 3,
    fontWeight: 'bold',
  },
  detailValue: {
    fontSize: 17,
    color: "#333",
    fontWeight: '600',
  }
});