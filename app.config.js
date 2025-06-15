import 'dotenv/config'; // 항상 파일 맨 위에 위치

export default {
    expo: {
        schema: "myweatherapp",
        name: "MyWeatherApp",
        slug: "MyWeatherApp",
        version: "1.0.0",
        orientation: "portrait",
        icon: "./assets/images/icon.png",
        userInterfaceStyle: "light",
        splash: {
            image: "./assets/images/splash-icon.png",
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
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },
            config: {
                googleMaps: {
                    apiKey: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
                },
            },
        },
        web: {
            favicon: "./assets/images/favicon.png",
        },
        extra: {
            OPEN_WEATHER_API_KEY: process.env.OPEN_WEATHER_API_KEY,
            GOOGLE_MAPS_API_KEY_IOS: process.env.GOOGLE_MAPS_API_KEY_IOS,
            GOOGLE_MAPS_API_KEY_ANDROID: process.env.GOOGLE_MAPS_API_KEY_ANDROID,
            // 아래 라인은 한국 공공데이터포털 미세먼지 API 키를 위한 것입니다.
            KOREA_DATA_PORTAL_FINE_DUST_API_KEY: process.env.KOREA_DATA_PORTAL_FINE_DUST_API_KEY,
        },
    },
};
