import 'dotenv/config'; // 이 줄은 파일의 가장 위에 있어야 합니다.

export default {
    expo: {
        name: "WeatherApp",
        slug: "weather-app",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff"
        },
        assetBundlePatterns: [
            "**/*"
        ],
        ios: {
            supportsTablet: true,
            // iOS Google Maps API 키 설정을 여기에 추가
            config: {
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS, // .env 파일에서 iOS용 Google Maps API 키를 불러옵니다.
            }
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff"
            }
            // Android Google Maps API 키 설정은 요청에 따라 변경하지 않았습니다.
            // 필요하다면 이곳에 "config": { "googleMaps": { "apiKey": process.env.GOOGLE_MAPS_API_KEY_ANDROID } } 를 추가하세요.
        },
        web: {
            favicon: "./assets/favicon.png"
        },
        extra: {
            OPEN_WEATHER_API_KEY: process.env.OPEN_WEATHER_API_KEY,
            // iOS Google Maps API 키를 extra 필드에 추가합니다.
            GOOGLE_MAPS_API_KEY_IOS: process.env.GOOGLE_MAPS_API_KEY_IOS,
            // 다른 API 키 (예: AIR_KOREA_API_KEY)도 필요하다면 여기에 추가하세요.
        }
    }
};