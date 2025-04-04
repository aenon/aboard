const STOCK_API_KEY = 'KNZAPTG1B0M1B1RE';
const STOCKS_TO_TRACK = [
    'SPY',  // S&P 500 ETF
    'AAPL', // Apple
    'MSFT', // Microsoft
    'GOOGL', // Alphabet
    'AMZN', // Amazon
    'NVDA', // NVIDIA
    'META', // Meta Platforms
    'BRK.B', // Berkshire Hathaway
    'LLY',  // Eli Lilly
    'TSM',  // TSMC
    'V'     // Visa
];

class Dashboard {
    constructor() {
        this.initializeTime();
        this.initializeWeather();
        this.initializeStocks();
    }

    async initializeTime() {
        const updateTime = async () => {
            const now = new Date();
            const localTimeStr = now.toLocaleString('zh-CN', { hour12: false, dateStyle: 'medium', timeStyle: 'short' });
            const localWeekday = now.toLocaleDateString('zh-CN', { weekday: 'long' });
            const localDate = now.toLocaleDateString('zh-CN', { dateStyle: 'medium' });
            
            let cityName = 'Local';
            try {
                const position = await this.getCurrentPosition();
                const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`);
                const data = await response.json();
                cityName = data.address.city || data.address.town || data.address.village || 'Local';
            } catch (error) {
                console.error('获取城市名称失败:', error);
            }
            
            // Show Beijing time
            const beijingTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
            const beijingTimeStr = beijingTime.toLocaleString('zh-CN', { hour12: false, timeStyle: 'short' });
            const beijingWeekday = beijingTime.toLocaleDateString('zh-CN', { weekday: 'long' });
            const beijingDate = beijingTime.toLocaleDateString('zh-CN', { dateStyle: 'medium' });

            document.getElementById('localTime').innerHTML = `${cityName} ${localWeekday} ${localTimeStr}`;
            
            // Compare dates and adjust Beijing time display
            let beijingDisplay = `北京 ${beijingTimeStr}`;
            if (beijingDate !== localDate) {
                const dayDiff = Math.round((beijingTime - now) / (1000 * 60 * 60 * 24));
                if (dayDiff === 1) {
                    beijingDisplay += ' 明天';
                }
            }
            document.getElementById('secondaryTime').innerHTML = beijingDisplay;
        };

        updateTime();
        setInterval(updateTime, 60000);
    }

    async initializeWeather() {
        try {
            let position;
            try {
                // Get user's location
                console.log('正在获取地理位置...');
                position = await this.getCurrentPosition();
                console.log('地理位置获取成功:', position.coords);
            } catch (error) {
                console.log('使用默认位置（San Jose）');
                position = {
                    coords: {
                        latitude: 37.3382,
                        longitude: -121.8863
                    }
                };
            }
            
            console.log('正在获取天气数据...');
            const response = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&current=temperature_2m,weather_code,relative_humidity_2m&daily=temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,relative_humidity_2m_min&timezone=auto&forecast_days=2`
            );
            const data = await response.json();
            console.log('天气数据获取成功:', data);
            
            // Convert weather code to description
            const weatherDescription = this.getWeatherDescription(data.current.weather_code);
            
            document.getElementById('weather').innerHTML = `
                <h2>Weather</h2>
                <p>${data.current.temperature_2m}°C ${data.current.relative_humidity_2m}% ${weatherDescription}</p>
                <p>${data.daily.temperature_2m_min[0]}°C ~ ${data.daily.temperature_2m_max[0]}°C </p>
                <p>${data.daily.relative_humidity_2m_min[0]}% ~ ${data.daily.relative_humidity_2m_max[0]}%</p>
                <h3>Tomorrow</h3>
                <p>${data.daily.temperature_2m_min[1]}°C ~ ${data.daily.temperature_2m_max[1]}°C</p>
                <p>${data.daily.relative_humidity_2m_min[1]}% ~ ${data.daily.relative_humidity_2m_max[1]}%</p>
            `;
        } catch (error) {
            console.error('天气数据获取失败:', error);
            document.getElementById('weather').innerHTML = '天气数据获取失败，请稍后再试';
        }
    }

    getWeatherDescription(code) {
        const weatherCodes = {
            0: 'Clear sky',
            1: 'Mainly clear',
            2: 'Partly cloudy',
            3: 'Overcast',
            45: 'Foggy',
            48: 'Depositing rime fog',
            51: 'Light drizzle',
            53: 'Moderate drizzle',
            55: 'Dense drizzle',
            61: 'Slight rain',
            63: 'Moderate rain',
            65: 'Heavy rain',
            71: 'Slight snow',
            73: 'Moderate snow',
            75: 'Heavy snow',
            95: 'Thunderstorm',
            96: 'Thunderstorm with slight hail',
            99: 'Thunderstorm with heavy hail'
        };
        return weatherCodes[code] || 'Unknown';
    }

    async initializeStocks() {
        try {
            const stocksContainer = document.getElementById('stocks');
            stocksContainer.innerHTML = '<h2>Stock Prices</h2>';

            for (const symbol of STOCKS_TO_TRACK) {
                const response = await fetch(
                    `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${STOCK_API_KEY}`
                );
                const data = await response.json();
                const quote = data['Global Quote'];
                const price = Number(quote['05. price']);
                const change = Number(quote['09. change']);
                const changePercent = quote['10. change percent'].replace('%', '');
                
                const changeClass = change >= 0 ? 'positive' : 'negative';
                const changeSign = change >= 0 ? '+' : '';
                
                if (symbol === 'SPY') {
                    stocksContainer.innerHTML += `
                        <div class="index-section">
                            <h3>S&P 500 Index</h3>
                            <p class="price">$${price.toFixed(2)}</p>
                            <p class="${changeClass}">${changeSign}${change.toFixed(2)} (${changeSign}${changePercent}%)</p>
                        </div>
                        <h3>Top 10 US Stocks</h3>
                    `;
                } else {
                    stocksContainer.innerHTML += `
                        <div class="stock-item">
                            <span class="symbol">${symbol}</span>
                            <span class="price">$${price.toFixed(2)}</span>
                            <span class="${changeClass}">${changeSign}${change.toFixed(2)} (${changeSign}${changePercent}%)</span>
                        </div>
                    `;
                }

            }
        } catch (error) {
            console.error('Stocks error:', error);
            document.getElementById('stocks').innerHTML = 'Stock data unavailable';
        }
    }

    getCurrentPosition() {
        const options = {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 0
        };

        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by this browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                position => {
                    console.log('地理位置获取成功');
                    resolve(position);
                },
                error => {
                    console.error('地理位置获取失败:', error.message);
                    reject(error);
                },
                options
            );
        });
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Dashboard();
});