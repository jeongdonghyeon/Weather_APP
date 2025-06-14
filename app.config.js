import 'dotenv/config'; // 항상 파일 맨 위에 위치

export default {
    expo: {
        schema: "MyWeatherApp",
        name: "WeatherApp",
        slug: "weather-app",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/splash.png",
            resizeMode: "contain",
            backgroundColor: "#ffffff",
        },
        assetBundlePatterns: ["**/*"],
        ios: {
            supportsTablet: true,
            config: {
                googleMapsApiKey: process.env.GOOGLE_MAPS_API_KEY_IOS,
            },
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
                },
            },
        },
        web: {
            favicon: "./assets/favicon.png",
        },
        extra: {
            OPEN_WEATHER_API_KEY: process.env.OPEN_WEATHER_API_KEY,
            GOOGLE_MAPS_API_KEY_IOS: process.env.GOOGLE_MAPS_API_KEY_IOS,
            GOOGLE_MAPS_API_KEY_ANDROID: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
            // 필요하면 여기에 다른 API 키 추가 가능
        },
    },
};
