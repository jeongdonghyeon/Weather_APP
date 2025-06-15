import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView, Platform } from 'react-native';
import Constants from 'expo-constants'; // Constants를 import 합니다.

// 미세먼지 데이터 타입을 정의합니다. (API 응답에 따라 필드 변경 가능)
interface FineDustData {
    stationName: string;
    dataTime: string;
    pm10Value: string; // 미세먼지 농도
    pm25Value: string; // 초미세먼지 농도
    o3Value: string;   // 오존 농도
    coValue: string;   // 일산화탄소 농도
    so2Value: string;  // 아황산가스 농도
    no2Value: string;  // 이산화질소 농도
    khaiValue: string; // 통합대기환경지수

    pm10Grade?: string;
    pm25Grade?: string;
    khaiGrade?: string;
}

const DustScreen: React.FC = () => {
    const [dustData, setDustData] = useState<FineDustData[] | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);


    const API_KEY = Constants.expoConfig?.extra?.KOREA_DATA_PORTAL_FINE_DUST_API_KEY;

    // 헬퍼 함수
    const getGrade = (value: string | number, type: 'pm10' | 'pm25' | 'khai'): string => {
        const numValue = Number(value);
        if (isNaN(numValue)) return '알 수 없음';

        switch (type) {
            case 'pm10': // 미세먼지 (PM10) 기준
                if (numValue <= 30) return '좋음';
                if (numValue <= 80) return '보통';
                if (numValue <= 150) return '나쁨';
                return '매우 나쁨';
            case 'pm25': // 초미세먼지 (PM2.5) 기준
                if (numValue <= 15) return '좋음';
                if (numValue <= 35) return '보통';
                if (numValue <= 75) return '나쁨';
                return '매우 나쁨';
            case 'khai': // 통합대기환경지수 기준
                if (numValue <= 50) return '좋음';
                if (numValue <= 100) return '보통';
                if (numValue <= 250) return '나쁨';
                return '매우 나쁨';
            default:
                return '알 수 없음';
        }
    };

    // 등급에 따른 색상 반환 헬퍼 함수
    const getGradeColor = (grade: string): string => {
        switch (grade) {
            case '좋음': return '#2ecc71'; // 에메랄드 그린
            case '보통': return '#3498db'; // 피터 리버 블루
            case '나쁨': return '#e67e22'; // 당근 오렌지
            case '매우 나쁨': return '#e74c3c'; // 앨리저린 레드
            default: return '#95a5a6'; // 회색
        }
    };

    useEffect(() => {
        // API 키가 유효한지 확인
        if (!API_KEY) {
            setError("API Key for Korea Data Portal Fine Dust not found. Please check your .env and app.config.js.");
            setLoading(false);
            console.error("API Key Missing: Please ensure KOREA_DATA_PORTAL_FINE_DUST_API_KEY is set in .env and app.config.js extra field.");
            return;
        }

        const fetchDustData = async () => {
            let rawResponseText: string | null = null; // 원본 응답 텍스트를 저장할 변수

            try {
                const stationName = '둔산동';
                const dataTerm = 'DAILY';
                const pageNo = 1;
                const numOfRows = 1;
                const ver = '1.3';

                const url = `https://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty?serviceKey=${API_KEY}&returnType=json&numOfRows=${numOfRows}&pageNo=${pageNo}&stationName=${encodeURIComponent(stationName)}&dataTerm=${dataTerm}&ver=${ver}`;

                console.log("Fetching data from URL:", url);
                const response = await fetch(url);


                rawResponseText = await response.text();
                console.log("Raw API Response Text (Full):", rawResponseText); // 전체 응답 텍스트 출력


                if (!response.ok) {
                    console.error("HTTP Error Status:", response.status); // HTTP 상태 코드 출력

                    const contentType = response.headers.get('Content-Type');
                    if (contentType && contentType.includes('application/xml')) {
                        // XML 에러 메시지 파싱 시도 (간단한 정규식 사용)
                        const resultMsgMatch = rawResponseText.match(/<resultMsg>(.*?)<\/resultMsg>/);
                        const resultCodeMatch = rawResponseText.match(/<resultCode>(.*?)<\/resultCode>/);
                        const resultMsg = resultMsgMatch ? resultMsgMatch[1] : '알 수 없는 XML 오류';
                        const resultCode = resultCodeMatch ? resultCodeMatch[1] : 'N/A';
                        throw new Error(`API 오류 [${resultCode}]: ${resultMsg}. 원본: ${rawResponseText.substring(0, 100)}...`);
                    } else {
                        throw new Error(`HTTP 오류! 상태: ${response.status}. 응답: ${rawResponseText.substring(0, 100)}...`);
                    }
                }


                let parsedData: any = null;
                let isJson = false;

                try {
                    parsedData = JSON.parse(rawResponseText);
                    isJson = true;
                    console.log("Parsed as JSON:", parsedData);
                } catch (jsonParseError) {
                    console.warn("Failed to parse as JSON, attempting XML parsing.");
                    isJson = false;
                }

                if (!isJson) {

                    const extractXmlValue = (xml: string, tagName: string) => {
                        const match = xml.match(new RegExp(`<${tagName}>(.*?)</${tagName}>`));
                        return match ? match[1] : '-';
                    };

                    const stationNameXml = extractXmlValue(rawResponseText, 'stationName');
                    const dataTimeXml = extractXmlValue(rawResponseText, 'dataTime');
                    const pm10ValueXml = extractXmlValue(rawResponseText, 'pm10Value');
                    const pm25ValueXml = extractXmlValue(rawResponseText, 'pm25Value');
                    const o3ValueXml = extractXmlValue(rawResponseText, 'o3Value');
                    const coValueXml = extractXmlValue(rawResponseText, 'coValue');
                    const so2ValueXml = extractXmlValue(rawResponseText, 'so2Value');
                    const no2ValueXml = extractXmlValue(rawResponseText, 'no2Value');
                    const khaiValueXml = extractXmlValue(rawResponseText, 'khaiValue');
                    const resultCodeXml = extractXmlValue(rawResponseText, 'resultCode');
                    const resultMsgXml = extractXmlValue(rawResponseText, 'resultMsg');
                    const totalCountXml = extractXmlValue(rawResponseText, 'totalCount');


                    if (resultCodeXml === '00' && Number(totalCountXml) > 0) {

                        const processedData: FineDustData = {
                            stationName: stationNameXml || stationName,
                            dataTime: dataTimeXml || '알 수 없음',
                            pm10Value: pm10ValueXml || '-',
                            pm25Value: pm25ValueXml || '-',
                            o3Value: o3ValueXml || '-',
                            coValue: coValueXml || '-',
                            so2Value: so2ValueXml || '-',
                            no2Value: no2ValueXml || '-',
                            khaiValue: khaiValueXml || '-',
                            pm10Grade: getGrade(pm10ValueXml, 'pm10'),
                            pm25Grade: getGrade(pm25ValueXml, 'pm25'),
                            khaiGrade: getGrade(khaiValueXml, 'khai'),
                        };
                        setDustData([processedData]);
                        console.log("Successfully processed dust data from XML:", processedData);
                    } else {
                        setError(`API 응답 데이터 없음 (XML). 코드: ${resultCodeXml}, 메시지: ${resultMsgXml}.`);
                        console.log("API 응답 데이터 (XML, 비어있거나 문제):", rawResponseText);
                    }
                } else {
                    if (parsedData?.response?.body?.items && parsedData.response.body.items.length > 0) {
                        const rawData = parsedData.response.body.items[0];

                        const processedData: FineDustData = {
                            stationName: rawData.stationName || stationName,
                            dataTime: rawData.dataTime || '알 수 없음',
                            pm10Value: rawData.pm10Value || '-',
                            pm25Value: rawData.pm25Value || '-',
                            o3Value: rawData.o3Value || '-',
                            coValue: rawData.coValue || '-',
                            so2Value: rawData.so2Value || '-',
                            no2Value: rawData.no2Value || '-',
                            khaiValue: rawData.khaiValue || '-',
                            pm10Grade: getGrade(rawData.pm10Value, 'pm10'),
                            pm25Grade: getGrade(rawData.pm25Value, 'pm25'),
                            khaiGrade: getGrade(rawData.khaiValue, 'khai'),
                        };
                        setDustData([processedData]);
                        console.log("Successfully processed dust data from JSON:", processedData);
                    } else {
                        setError("미세먼지 데이터를 찾을 수 없거나 데이터 구조가 예상과 다릅니다. 콘솔에서 API 응답을 확인하세요.");
                        console.log("API 응답 데이터 (JSON, 파싱되었으나 비어있거나 예상 구조 다름):", parsedData);
                    }
                }
            } catch (e: any) {
                setError(`미세먼지 데이터를 가져오는 데 실패했습니다: ${e.message}`);
                console.error("API 호출 오류 발생:", e);
                if (rawResponseText) {
                    console.error("문제가 된 원본 응답 텍스트:", rawResponseText);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchDustData().catch(err => {
            console.error("fetchDustData에서 처리되지 않은 프로미스 거부:", err);
        });

    }, [API_KEY]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>미세먼지 데이터를 불러오는 중...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>데이터 로드 중 오류가 발생했습니다.</Text>
                <Text style={styles.errorText}>오류: {error}</Text>
                <Text style={styles.errorText}>`.env` 파일과 `app.config.js`의 API 키 설정을 확인하고, 개발자 도구 콘솔 로그를 확인해주세요.</Text>
                {Platform.OS === 'web' && <Text style={styles.errorText}>웹 환경에서는 CORS 문제로 API 호출이 제한될 수 있습니다.</Text>}
            </View>
        );
    }

    const currentDust = dustData ? dustData[0] : null;

    return (
        <ScrollView style={styles.scrollView}>
            <View style={styles.container}>
                <Text style={styles.title}>미세먼지 실시간 정보</Text>

                {currentDust ? (
                    <View style={[styles.card, { backgroundColor: getGradeColor(currentDust.khaiGrade || '') }]}>
                        <Text style={styles.cardStationName}>{currentDust.stationName} 측정소</Text>
                        <Text style={styles.cardTime}>측정 시간: {currentDust.dataTime}</Text>
                        <Text style={styles.gradeDisplay}>{currentDust.khaiGrade} 😷</Text>
                        <Text style={styles.valueDisplay}>통합대기환경지수: {currentDust.khaiValue}</Text>

                        <View style={styles.detailsRow}>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>PM10 (미세먼지)</Text>
                                <Text style={styles.detailValue}>{currentDust.pm10Value} µg/m³</Text>
                                <Text style={[styles.detailGrade, { color: getGradeColor(currentDust.pm10Grade || '') }]}>({currentDust.pm10Grade})</Text>
                            </View>
                            <View style={styles.detailItem}>
                                <Text style={styles.detailLabel}>PM2.5 (초미세먼지)</Text>
                                <Text style={styles.detailValue}>{currentDust.pm25Value} µg/m³</Text>
                                <Text style={[styles.detailGrade, { color: getGradeColor(currentDust.pm25Grade || '') }]}>({currentDust.pm25Grade})</Text>
                            </View>
                        </View>

                        <View style={styles.otherPollutants}>
                            <Text style={styles.otherPollutantText}>오존(O3): {currentDust.o3Value} ppm</Text>
                            <Text style={styles.otherPollutantText}>일산화탄소(CO): {currentDust.coValue} ppm</Text>
                            <Text style={styles.otherPollutantText}>아황산가스(SO2): {currentDust.so2Value} ppm</Text>
                            <Text style={styles.otherPollutantText}>이산화질소(NO2): {currentDust.no2Value} ppm</Text>
                        </View>
                    </View>
                ) : (
                    <Text style={styles.noDataText}>현재 미세먼지 데이터를 불러올 수 없습니다.</Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    scrollView: {
        flex: 1,
        backgroundColor: '#eef2f5',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#eef2f5',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 25,
        textAlign: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#eef2f5',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#555',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#eef2f5',
    },
    errorText: {
        color: '#d63031',
        textAlign: 'center',
        fontSize: 16,
        marginBottom: 5,
    },
    card: {
        width: '100%',
        borderRadius: 20,
        padding: 25,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
        alignItems: 'center',
        marginBottom: 20,
    },
    cardStationName: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 5,
    },
    cardTime: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 15,
    },
    gradeDisplay: {
        fontSize: 48,
        fontWeight: '900',
        color: '#fff',
        marginBottom: 10,
        textShadowColor: 'rgba(0,0,0,0.2)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    valueDisplay: {
        fontSize: 20,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 20,
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 20,
    },
    detailItem: {
        alignItems: 'center',
        flex: 1,
        paddingHorizontal: 5,
    },
    detailLabel: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
        marginBottom: 3,
    },
    detailValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#fff',
    },
    detailGrade: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 2,
    },
    otherPollutants: {
        width: '100%',
        backgroundColor: 'rgba(0,0,0,0.1)',
        borderRadius: 10,
        padding: 15,
    },
    otherPollutantText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        marginBottom: 5,
    },
    noDataText: {
        fontSize: 16,
        color: '#666',
        marginTop: 50,
    },
});

export default DustScreen;
