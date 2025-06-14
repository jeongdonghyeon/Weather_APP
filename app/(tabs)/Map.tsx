import React, { useEffect, useState, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Dimensions,
    TouchableOpacity,
} from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import * as Location from 'expo-location';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const MAP_HEIGHT = height * 0.65;

export default function Map() {
    const mapRef = useRef<MapView>(null);

    const [currentLocation, setCurrentLocation] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [googleMapsApiKeyError, setGoogleMapsApiKeyError] = useState(false);
    const [openWeatherKeyMissing, setOpenWeatherKeyMissing] = useState(false);

    const OPEN_WEATHER_API_KEY = Constants.expoConfig?.extra?.OPEN_WEATHER_API_KEY;

    useEffect(() => {
        const checkApiKeys = () => {
            const iosKey = Constants.expoConfig?.ios?.config?.googleMapsApiKey;
            const androidKey = Constants.expoConfig?.android?.config?.googleMaps?.apiKey;

            const googleMissing = !iosKey && !androidKey;
            const weatherMissing = !OPEN_WEATHER_API_KEY;

            if (googleMissing) {
                setGoogleMapsApiKeyError(true);
            }

            if (weatherMissing) {
                setOpenWeatherKeyMissing(true);
            }

            if (googleMissing || weatherMissing) {
                Alert.alert(
                    'API 키 설정 필요',
                    `${googleMissing ? 'Google Maps API 키' : ''}${googleMissing && weatherMissing ? '와 ' : ''}${weatherMissing ? 'OpenWeather API 키' : ''}가 설정되지 않았습니다.\n일부 기능이 작동하지 않을 수 있습니다.`
                );
            }
        };

        const fetchLocation = async () => {
            setLoading(true);
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert(
                        '위치 권한 필요',
                        '지도를 사용하려면 위치 접근 권한이 필요합니다.'
                    );
                    setLoading(false); // 권한 거부 시 로딩 중단
                    return;
                }

                const loc = await Location.getCurrentPositionAsync({});
                if (loc && loc.coords) {
                    setCurrentLocation({
                        latitude: loc.coords.latitude,
                        longitude: loc.coords.longitude,
                        latitudeDelta: 0.0922,
                        longitudeDelta: 0.0421,
                    });
                } else {
                    throw new Error('위치 정보가 없습니다.');
                }
            } catch (error) {
                console.error('위치 오류:', error);
                Alert.alert('위치 오류', '현재 위치를 불러오지 못했습니다.');
            } finally {
                setLoading(false);
            }
        };

        checkApiKeys();
        fetchLocation();
    }, [OPEN_WEATHER_API_KEY]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4285F4" />
                <Text style={styles.loadingText}>위치와 지도 데이터를 불러오는 중...</Text>
            </View>
        );
    }

    if (!currentLocation) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>
                    <Ionicons name="alert-circle-outline" size={24} color="#d9534f" />
                    {"\n"}지도를 표시할 수 없습니다. 위치 권한 및 GPS 설정을 확인해주세요.
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 50 }}>
                <Ionicons name="rainy-outline" size={30} color="#0056b3" />
                <Text style={styles.title}>강수량 지도</Text>
            </View>

            {googleMapsApiKeyError && (
                <Text style={styles.warningText}>
                    Google Maps API 키가 설정되지 않았습니다. 지도가 제대로 표시되지 않을 수 있습니다.
                </Text>
            )}
            {openWeatherKeyMissing && (
                <Text style={styles.warningText}>
                    OpenWeather API 키가 없습니다. 강수량 정보가 표시되지 않습니다.
                </Text>
            )}

            <View style={styles.mapContainer}>
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    initialRegion={currentLocation}
                    showsUserLocation
                    followsUserLocation
                    onRegionChangeComplete={(region) =>
                        console.log('Map region changed:', region)
                    }
                    provider="google"
                >
                    {OPEN_WEATHER_API_KEY && (
                        <UrlTile
                            urlTemplate={`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${OPEN_WEATHER_API_KEY}`}
                            zIndex={-1}
                            maximumZ={10}
                            minimumZ={0}
                        />
                    )}

                    <Marker
                        coordinate={{
                            latitude: currentLocation.latitude,
                            longitude: currentLocation.longitude,
                        }}
                        title="현재 위치"
                        description="여기에 있습니다"
                        pinColor="#007bff"
                    />
                </MapView>

                {/* 현위치로 돌아가기 버튼 */}
                <TouchableOpacity
                    style={styles.myLocationButton}
                    onPress={() => {
                        if (mapRef.current && currentLocation) {
                            mapRef.current.animateToRegion(currentLocation, 1000);
                        }
                    }}
                >
                    <Ionicons name="locate-outline" size={28} color="#007bff" />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#e6f7ff',
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
        color: '#e74c3c',
        textAlign: 'center',
        marginBottom: 10,
        paddingHorizontal: 15,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#0056b3',
        marginLeft: 10,
    },
    mapContainer: {
        width: width * 0.9,
        height: MAP_HEIGHT,
        borderRadius: 20,
        overflow: 'hidden',
        marginTop: 25,
        marginBottom: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 15,
        elevation: 12,
        borderWidth: 1,
        borderColor: '#b3e0ff',
    },
    map: {
        flex: 1,
    },
    myLocationButton: {
        position: 'absolute',
        bottom: 25,
        right: 25,
        backgroundColor: '#fff',
        borderRadius: 30,
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 7,
    },
});
