import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, Dimensions } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps'; // UrlTile 임포트 추가
import * as Location from 'expo-location';
import Constants from 'expo-constants'; // Google Maps API 키를 위해 추가
import { Ionicons } from '@expo/vector-icons'; // 아이콘 사용을 위해 임포트

// 화면 높이와 너비를 가져와 반응형 디자인에 활용
const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.65; // 지도 높이 비율 조정

export default function Map() {
    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [googleMapsApiKeyError, setGoogleMapsApiKeyError] = useState<boolean>(false);
    // OpenWeatherMap API 키 (강수량 타일용)
    const OPEN_WEATHER_API_KEY = Constants.expoConfig?.extra?.OPEN_WEATHER_API_KEY;

    useEffect(() => {
        const checkApiKeys = () => {
            const iosKey = Constants.expoConfig?.ios?.config?.googleMapsApiKey;
            const androidKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey; // Android 키도 다시 확인하도록 추가

            if (!iosKey && !androidKey) { // iOS 또는 Android 키 둘 다 없으면 경고
                setGoogleMapsApiKeyError(true);
                Alert.alert(
                    "Google Maps API 키 필요",
                    "iOS 또는 Android Google Maps API 키가 app.config.js에 설정되지 않았습니다. 지도가 제대로 표시되지 않을 수 있습니다."
                );
            }

            if (!OPEN_WEATHER_API_KEY) {
                Alert.alert("API 키 오류", "OpenWeather API 키가 설정되지 않았습니다. 강수량 정보를 불러올 수 없습니다.");
            }
        };
        checkApiKeys();

        const fetchLocation = async () => {
            setLoading(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('위치 접근 권한 필요', '지도를 표시하려면 위치 접근 권한이 필요해요!');
                    setLoading(false);
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({});
                setCurrentLocation({
                    latitude: loc.coords.latitude,
                    longitude: loc.coords.longitude,
                    latitudeDelta: 0.0922, // 맵 확대 레벨
                    longitudeDelta: 0.0421,
                });
            } catch (error) {
                console.error('위치 불러오는 중 오류:', error);
                Alert.alert('위치 오류', '현재 위치를 불러오지 못했어요.');
            } finally {
                setLoading(false);
            }
        };

        fetchLocation();
    }, [OPEN_WEATHER_API_KEY]); // OpenWeather API 키도 의존성에 추가

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" /> {/* 구글 블루 계열 색상 */}
                <Text style={styles.loadingText}>위치와 지도 데이터를 불러오는 중...</Text>
            </View>
        );
    }

    if (!currentLocation) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>
                    <Ionicons name="alert-circle-outline" size={24} color="#d9534f" />
                    {"\n"}지도를 표시할 수 없어요! 위치 권한과 GPS 설정을 확인해주세요.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                <Ionicons name="rainy-outline" size={30} color="#0056b3" /> 강수량 지도
            </Text>
            {googleMapsApiKeyError && (
                <Text style={styles.warningText}>Google Maps API 키가 없어 지도가 제대로 표시되지 않을 수 있습니다.</Text>
            )}
            {!OPEN_WEATHER_API_KEY && (
                <Text style={styles.warningText}>OpenWeather API 키가 없어 강수량 타일이 표시되지 않을 수 있습니다.</Text>
            )}

            <View style={styles.mapContainer}>
                <MapView
                    style={styles.map}
                    initialRegion={currentLocation}
                    showsUserLocation={true}
                    followsUserLocation={true}
                    onRegionChangeComplete={(region) => console.log('Map region changed:', region)}
                    // Google Maps 명시적 사용 (Android에서만 필요, iOS는 MapKit 기본)
                    provider="google"
                >
                    {/* OpenWeatherMap 강수량 타일 레이어 추가 (API 키 필요!) */}
                    {OPEN_WEATHER_API_KEY && (
                        <UrlTile
                            urlTemplate={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPEN_WEATHER_API_KEY}`}
                            zIndex={-1} // 기본 지도 레이어 위에 표시 (높은 숫자일수록 위)
                            maximumZ={10} // 최대 줌 레벨
                            minimumZ={0}  // 최소 줌 레벨
                        />
                    )}

                    {currentLocation && (
                        <Marker
                            coordinate={{ latitude: currentLocation.latitude, longitude: currentLocation.longitude }}
                            title="현재 위치"
                            description="여기에 있습니다"
                            pinColor="#007bff" // 마커 색상 변경
                        />
                    )}
                </MapView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e6f7ff', // 더 밝고 부드러운 하늘색 배경
        paddingVertical: 25,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e6f7ff',
    },
    loadingText: {
        marginTop: 15,
        fontSize: 17,
        color: '#555',
        fontWeight: '500',
    },
    errorText: {
        fontSize: 19,
        color: '#d9534f',
        textAlign: 'center',
        paddingHorizontal: 20,
        lineHeight: 28,
        fontWeight: 'bold',
    },
    warningText: {
        fontSize: 13,
        color: '#e74c3c', // 경고 메시지 색상
        textAlign: 'center',
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 50,
        color: '#0056b3', // 진한 파란색 제목
        flexDirection: 'row', // 아이콘과 텍스트를 나란히
        alignItems: 'center',
    },
    mapContainer: {
        width: width * 0.90, // 화면 너비의 95% 사용
        height: MAP_HEIGHT,
        borderRadius: 20, // 더 둥근 모서리
        overflow: 'hidden', // 지도 바깥으로 나가는 그림자/테두리 처리
        marginTop: 25,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 }, // 그림자 깊이 증가
        shadowOpacity: 0.25,
        shadowRadius: 15, // 그림자 부드럽게
        elevation: 12, // Android 그림자
        borderWidth: 1,
        borderColor: '#b3e0ff', // 연한 파란색 테두리
    },
    map: {
        flex: 1, // 컨테이너에 맞춰 채움
    },
    description: {
        fontSize: 15,
        color: '#666',
        textAlign: 'center',
        marginTop: 10,
        paddingHorizontal: 20,
        lineHeight: 22,
    },
});