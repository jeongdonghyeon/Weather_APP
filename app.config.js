import 'dotenv/config';

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
            bundleIdentifier: "com.yourcompany.myweatherapp",
            config: {
                googleMapsApiKey: process.env.Maps_API_KEY_IOS,
            },
        },
        android: {
            adaptiveIcon: {
                foregroundImage: "./assets/images/adaptive-icon.png",
                backgroundColor: "#ffffff",
            },

            package: "com.DH.myweatherapp.test",
            config: {
                googleMaps: {
                    apiKey: process.env.Maps_API_KEY_ANDROID,
                },
            },
        },
        web: {
            favicon: "./assets/images/favicon.png",
        },
        updates: {
            url: "https://u.expo.dev/124a2ef0-3dad-41eb-b693-237abf0e4de7",
        },
        runtimeVersion: {
            policy: "appVersion",
        },
        extra: {
            OPEN_WEATHER_API_KEY: process.env.OPEN_WEATHER_API_KEY,
            Maps_API_KEY_IOS: process.env.Maps_API_KEY_IOS,
            Maps_API_KEY_ANDROID: process.env.Maps_API_KEY_ANDROID,
            KOREA_DATA_PORTAL_FINE_DUST_API_KEY: process.env.KOREA_DATA_PORTAL_FINE_DUST_API_KEY,
            eas: {
                projectId: "124a2ef0-3dad-41eb-b693-237abf0e4de7",
            },
        },
    },
};