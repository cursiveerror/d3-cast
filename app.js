const searchSection = document.getElementById('search-section');
const weatherSection = document.getElementById('weather-section');
const favoritesSection = document.getElementById('favorites-section');
const notificationsSection = document.getElementById('notifications-section');
const formatSection = document.getElementById('format-section');
const aboutSection = document.getElementById('about-section');
const weatherContainer = document.getElementById('weather-container');
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const searchError = document.getElementById('search-error');
const changeLocationBtn = document.getElementById('change-location-btn');
const favoritesList = document.getElementById('favorites-list');
const historyList = document.getElementById('history-list');
const favoritesEmpty = document.getElementById('favorites-empty');
const historyEmpty = document.getElementById('history-empty');

// Sidebar Elements
const burgerBtn = document.getElementById('burger-btn');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const navItems = document.querySelectorAll('.nav-item');

// Notification Elements
const notifMode = document.getElementById('notif-mode');
const notifTimeGroup = document.getElementById('notif-time-group');
const notifTime = document.getElementById('notif-time');
const saveNotifBtn = document.getElementById('save-notif-btn');
const permissionToast = document.getElementById('permission-toast');

// Format Elements
const formatTemp = document.getElementById('format-temp');
const formatWind = document.getElementById('format-wind');
const formatPressure = document.getElementById('format-pressure');
const saveFormatBtn = document.getElementById('save-format-btn');

// --- Constants ---
const STORAGE_KEY = 'metro_weather_location';
const NOTIF_STORAGE_KEY = 'metro_weather_notif';
const FORMAT_STORAGE_KEY = 'metro_data_format';
const HISTORY_STORAGE_KEY = 'metro_weather_history';
const FAVORITES_STORAGE_KEY = 'metro_weather_favorites';

// Global variables for live tiles & notifications
let liveTileInterval;
let notificationInterval;

// --- Initialization ---
function init() {
    setupNavigation();
    setupNotifications();
    setupFormatSettings();

    const savedLocation = localStorage.getItem(STORAGE_KEY);
    if (savedLocation) {
        const locationData = JSON.parse(savedLocation);
        showSection('weather-section');
        fetchWeather(locationData);
    } else {
        showSection('search-section');
    }
}

// --- Navigation & Sidebar Logic ---
function setupNavigation() {
    const toggleSidebar = () => {
        sidebar.classList.toggle('open');
        sidebarOverlay.classList.toggle('hidden');
    };

    burgerBtn.addEventListener('click', toggleSidebar);
    closeSidebarBtn.addEventListener('click', toggleSidebar);
    sidebarOverlay.addEventListener('click', toggleSidebar);

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Update active state
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');

            // Navigate
            const target = item.getAttribute('data-target');
            if (target === 'weather-section') {
                const savedLocation = localStorage.getItem(STORAGE_KEY);
                if (savedLocation) {
                    showSection('weather-section');
                    // Refresh data
                    fetchWeather(JSON.parse(savedLocation));
                } else {
                    showSection('search-section');
                }
            } else if (target === 'favorites-section') {
                renderFavoritesSection();
                showSection(target);
            } else {
                showSection(target);
            }

            toggleSidebar();
        });
    });

    changeLocationBtn.addEventListener('click', () => {
        showSection('search-section');
        locationInput.value = '';
        searchResults.innerHTML = '';
        locationInput.focus();
    });
}

function showSection(sectionId) {
    searchSection.classList.add('hidden');
    weatherSection.classList.add('hidden');
    favoritesSection.classList.add('hidden');
    notificationsSection.classList.add('hidden');
    formatSection.classList.add('hidden');
    aboutSection.classList.add('hidden');
    changeLocationBtn.classList.add('hidden');

    document.getElementById(sectionId).classList.remove('hidden');

    if (sectionId === 'weather-section' || sectionId === 'notifications-section' || sectionId === 'about-section' || sectionId === 'format-section' || sectionId === 'favorites-section') {
        changeLocationBtn.classList.remove('hidden');
    }
}

// --- Search Logic ---
let searchTimeout;
locationInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    const query = e.target.value.trim();
    if (query.length < 2) {
        searchResults.innerHTML = '';
        return;
    }
    searchTimeout = setTimeout(() => {
        searchLocation(query);
    }, 500);
});

searchBtn.addEventListener('click', () => {
    const query = locationInput.value.trim();
    if (query.length >= 2) searchLocation(query);
});

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = locationInput.value.trim();
        if (query.length >= 2) searchLocation(query);
    }
});

async function searchLocation(query) {
    try {
        hideError();
        searchResults.innerHTML = `
            <li style="justify-content: center; background: transparent; cursor: default;">
                <div class="metro-loader" style="margin:0;">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
            </li>`;

        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=10&language=uk&format=json`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('Network error');

        const data = await response.json();
        const results = data.results || [];
        const ukraineResults = results.filter(item =>
            item.country === 'Ukraine' || item.country_code === 'UA' || item.country_code === 'ua'
        );
        renderSearchResults(ukraineResults);
    } catch (error) {
        console.error(error);
        showError('Помилка з\'єднання. Не вдалося виконати пошук.');
        searchResults.innerHTML = '';
    }
}

function renderSearchResults(results) {
    searchResults.innerHTML = '';
    if (results.length === 0) {
        showError('Локацію не знайдено.');
        return;
    }

    results.forEach(item => {
        let admin1 = item.admin1;
        if (admin1 && admin1.endsWith('ська') && !admin1.toLowerCase().includes('область')) {
            admin1 += ' область';
        }
        const adminParts = [admin1, item.admin2].filter(Boolean);
        const locationData = {
            name: item.name,
            latitude: item.latitude,
            longitude: item.longitude,
            admin: adminParts.length > 0 ? adminParts[0] : 'Україна',
            subtitle: adminParts.length > 0 ? adminParts.join(', ') : 'Україна'
        };

        const li = createLocationListItem(locationData);
        searchResults.appendChild(li);
    });
}

function saveLocationAndFetchWeather(location) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    addToHistory(location);
    showSection('weather-section');
    fetchWeather(location);
}

// --- Favorites and History Logic ---
function getFavorites() {
    return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)) || [];
}

function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
}

function toggleFavorite(locationData) {
    let favorites = getFavorites();
    const index = favorites.findIndex(f => f.latitude === locationData.latitude && f.longitude === locationData.longitude);
    if (index > -1) {
        favorites.splice(index, 1);
    } else {
        favorites.push(locationData);
    }
    saveFavorites(favorites);
}

function isFavorite(locationData) {
    const favorites = getFavorites();
    return favorites.some(f => f.latitude === locationData.latitude && f.longitude === locationData.longitude);
}

function getHistory() {
    return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY)) || [];
}

function addToHistory(locationData) {
    let history = getHistory();
    history = history.filter(h => h.latitude !== locationData.latitude || h.longitude !== locationData.longitude);
    history.unshift(locationData);
    if (history.length > 10) history = history.slice(0, 10);
    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
}

function createLocationListItem(locationData) {
    const li = document.createElement('li');
    
    const infoDiv = document.createElement('div');
    infoDiv.className = 'result-info';
    
    const nameSpan = document.createElement('span');
    nameSpan.className = 'result-name';
    nameSpan.textContent = locationData.name;

    const adminSpan = document.createElement('span');
    adminSpan.className = 'result-admin';
    adminSpan.textContent = locationData.subtitle;
    
    infoDiv.appendChild(nameSpan);
    infoDiv.appendChild(adminSpan);

    const starBtn = document.createElement('button');
    starBtn.className = 'star-btn';
    if (isFavorite(locationData)) starBtn.classList.add('active');
    
    const starSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${isFavorite(locationData) ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>`;
    starBtn.innerHTML = starSvg;
    
    starBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleFavorite(locationData);
        
        // Оновлюємо вигляд кнопки
        const isFav = isFavorite(locationData);
        starBtn.classList.toggle('active', isFav);
        starBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>`;
        
        // Якщо ми знаходимося на вкладці Обраних, потрібно перемалювати списки
        if (!favoritesSection.classList.contains('hidden')) {
            renderFavoritesSection();
        }
    });

    li.appendChild(infoDiv);
    li.appendChild(starBtn);

    li.addEventListener('click', () => {
        saveLocationAndFetchWeather(locationData);
    });
    
    return li;
}

function renderFavoritesSection() {
    favoritesList.innerHTML = '';
    historyList.innerHTML = '';
    
    const favorites = getFavorites();
    const history = getHistory();
    
    if (favorites.length === 0) {
        favoritesEmpty.classList.remove('hidden');
    } else {
        favoritesEmpty.classList.add('hidden');
        favorites.forEach(loc => favoritesList.appendChild(createLocationListItem(loc)));
    }
    
    if (history.length === 0) {
        historyEmpty.classList.remove('hidden');
    } else {
        historyEmpty.classList.add('hidden');
        history.forEach(loc => historyList.appendChild(createLocationListItem(loc)));
    }
}

// --- Weather Fetch & Render ---
async function fetchWeather(location) {
    try {
        weatherContainer.innerHTML = `
            <div class="loader-wrapper">
                <div class="metro-loader">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
                <h2>Отримання метеоданих</h2>
            </div>`;

        let formatSettings = { temp: 'celsius', wind: 'kmh', pressure: 'hpa' };
        const savedFormat = localStorage.getItem(FORMAT_STORAGE_KEY);
        if (savedFormat) formatSettings = JSON.parse(savedFormat);

        const params = new URLSearchParams({
            latitude: location.latitude,
            longitude: location.longitude,
            current: 'temperature_2m,apparent_temperature,wind_speed_10m,wind_direction_10m,wind_gusts_10m,relative_humidity_2m,pressure_msl,weather_code,is_day,precipitation,uv_index',
            hourly: 'temperature_2m,weather_code,is_day,precipitation_probability',
            daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,precipitation_sum',
            timezone: 'auto',
            forecast_days: 7,
            temperature_unit: formatSettings.temp === 'fahrenheit' ? 'fahrenheit' : 'celsius',
            wind_speed_unit: formatSettings.wind
        });

        const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error('API Error');

        const data = await response.json();

        setWeatherTheme(data.current.weather_code, data.current.is_day);
        renderWeather(location, data);
        startLiveTiles();

    } catch (error) {
        console.error(error);
        weatherContainer.innerHTML = `
            <div class="tile tile-large tile-red">
                <h2 style="font-weight: 300; margin-bottom: 20px;">Помилка завантаження</h2>
                <p>Не вдалося отримати дані про погоду.</p>
                <button class="tile-btn" id="retry-btn" style="margin-top: auto; align-self: flex-start;">Спробувати знову</button>
            </div>`;
        document.getElementById('retry-btn').addEventListener('click', () => fetchWeather(location));
    }
}

function setWeatherTheme(weathercode, isDay) {
    const body = document.body;

    // Очищаємо попередні класи
    body.classList.remove('weather-clear', 'weather-cloudy', 'weather-rain', 'weather-storm', 'weather-snow', 'is-night');

    // Мапінг кодів WMO (World Meteorological Organization)
    if (weathercode === 0 || weathercode === 1) {
        body.classList.add('weather-clear');
    } else if (weathercode === 2 || weathercode === 3 || weathercode === 45 || weathercode === 48) {
        body.classList.add('weather-cloudy');
    } else if ((weathercode >= 51 && weathercode <= 67) || (weathercode >= 80 && weathercode <= 82)) {
        body.classList.add('weather-rain');
    } else if ((weathercode >= 71 && weathercode <= 77) || weathercode === 85 || weathercode === 86) {
        body.classList.add('weather-snow');
    } else if (weathercode >= 95 && weathercode <= 99) {
        body.classList.add('weather-storm');
    } else {
        body.classList.add('weather-clear');
    }

    if (isDay === 0) {
        body.classList.add('is-night');
    }
}

function renderWeather(location, data) {
    const { current, daily, hourly } = data;

    let formatSettings = { temp: 'celsius', wind: 'kmh', pressure: 'hpa' };
    const savedFormat = localStorage.getItem(FORMAT_STORAGE_KEY);
    if (savedFormat) formatSettings = JSON.parse(savedFormat);

    let currentTempRaw = current.temperature_2m;
    let feelsLikeTempRaw = current.apparent_temperature;

    let tempSymbol = '°';
    let tempUnitLabel = 'Цельсія';

    if (formatSettings.temp === 'kelvin') {
        currentTempRaw += 273.15;
        feelsLikeTempRaw += 273.15;
        tempSymbol = 'K';
        tempUnitLabel = 'Кельвіна';
    } else if (formatSettings.temp === 'fahrenheit') {
        tempUnitLabel = 'Фаренгейта';
    }

    const currentTemp = Math.round(currentTempRaw);
    const feelsLikeTemp = Math.round(feelsLikeTempRaw);

    const windSpeed = current.wind_speed_10m.toFixed(1);
    const windGusts = current.wind_gusts_10m ? current.wind_gusts_10m.toFixed(1) : null;
    const windDirectionDeg = current.wind_direction_10m || 0;
    const windDirectionText = getWindDirection(windDirectionDeg);

    const humidity = current.relative_humidity_2m;
    const humidityStatus = getHumidityDescription(humidity);

    let pressure = current.pressure_msl || 1013;
    let pressureUnit = 'hPa';
    if (formatSettings.pressure === 'mmhg') {
        pressure = Math.round(pressure * 0.750062);
        pressureUnit = 'mmHg';
    } else {
        pressure = Math.round(pressure);
    }
    const pressureStatus = getPressureDescription(current.pressure_msl || 1013);

    let windUnitLabel = 'км/год';
    if (formatSettings.wind === 'ms') windUnitLabel = 'м/с';
    if (formatSettings.wind === 'mph') windUnitLabel = 'mph';

    // UV index
    const uvVal = current.uv_index !== undefined ? current.uv_index : (daily.uv_index_max ? daily.uv_index_max[0] : 0);
    const uvInfo = getUvDescription(Math.round(uvVal));

    // Sun cycle
    const sunriseTime = daily.sunrise && daily.sunrise[0] ? formatTimeShort(daily.sunrise[0]) : '--:--';
    const sunsetTime = daily.sunset && daily.sunset[0] ? formatTimeShort(daily.sunset[0]) : '--:--';

    // Today min/max
    let todayMaxRaw = daily.temperature_2m_max[0];
    let todayMinRaw = daily.temperature_2m_min[0];
    if (formatSettings.temp === 'kelvin') {
        todayMaxRaw += 273.15;
        todayMinRaw += 273.15;
    }
    const todayMax = Math.round(todayMaxRaw);
    const todayMin = Math.round(todayMinRaw);

    // Hourly Forecast (next 16 hours)
    const hourlyHtmlArray = [];
    if (hourly && hourly.time) {
        const nowHourStr = new Date().toISOString().slice(0, 13);
        let startIdx = hourly.time.findIndex(t => t.startsWith(nowHourStr));
        if (startIdx === -1) startIdx = 0;
        const endIdx = Math.min(startIdx + 16, hourly.time.length);

        for (let i = startIdx; i < endIdx; i++) {
            const t = new Date(hourly.time[i]);
            const hourLabel = i === startIdx ? 'Зараз' : `${t.getHours().toString().padStart(2, '0')}:00`;
            let hTempRaw = hourly.temperature_2m[i];
            if (formatSettings.temp === 'kelvin') hTempRaw += 273.15;
            const hTemp = Math.round(hTempRaw);
            const hCode = hourly.weather_code[i];
            const hIsDay = hourly.is_day ? hourly.is_day[i] : 1;
            const hPop = hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0;

            hourlyHtmlArray.push(`
                <div class="hourly-item ${i === startIdx ? 'hourly-current' : ''}">
                    <span class="hourly-time">${hourLabel}</span>
                    <div class="hourly-icon">${getWeatherIconSvg(hCode, hIsDay, 24)}</div>
                    <span class="hourly-temp">${hTemp}${tempSymbol}</span>
                    ${hPop >= 15 ? `<span class="hourly-pop">💧${hPop}%</span>` : `<span class="hourly-pop empty"></span>`}
                </div>
            `);
        }
    }

    // Daily 7-Day Forecast
    const dailyHtmlArray = [];
    const daysOfWeek = ['Нд', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

    for (let i = 0; i < daily.time.length; i++) {
        const dateObj = new Date(daily.time[i]);
        let dayName = daysOfWeek[dateObj.getDay()];
        if (i === 0) dayName = 'Сьогодні';
        else if (i === 1) dayName = 'Завтра';

        let maxTempRaw = daily.temperature_2m_max[i];
        let minTempRaw = daily.temperature_2m_min[i];

        if (formatSettings.temp === 'kelvin') {
            maxTempRaw += 273.15;
            minTempRaw += 273.15;
        }

        const maxTemp = Math.round(maxTempRaw);
        const minTemp = Math.round(minTempRaw);
        const code = daily.weather_code[i];
        const desc = getWeatherDescriptionText(code);
        const pop = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;

        dailyHtmlArray.push(`
            <div class="day-tile">
                <span class="day-name">${dayName}</span>
                <div class="day-icon">${getWeatherIconSvg(code, 1, 26)}</div>
                <span class="day-desc">${desc}</span>
                <div class="day-temps">
                    <span class="day-max">${maxTemp}${tempSymbol}</span>
                    <span class="day-min">${minTemp}${tempSymbol}</span>
                </div>
                ${pop >= 20 ? `<span class="day-pop">💧 ${pop}%</span>` : `<span class="day-pop empty"></span>`}
            </div>
        `);
    }

    const locationSubtitle = location.subtitle || location.admin || 'Україна';
    const condition = getWeatherCondition(current.weather_code);
    const currentConditionText = getWeatherDescriptionText(current.weather_code);
    const weatherIcon = getWeatherIconSvg(current.weather_code, current.is_day, 42);

    // Build Complete Grid
    const html = `
        <!-- Main Hero Tile (2x2) -->
        <div class="tile tile-large ${condition.bgClass}">
            <div class="hero-header">
                <div class="hero-location">
                    <div class="city-name">${location.name}</div>
                    <div class="location-sub">${locationSubtitle}</div>
                </div>
                <div class="hero-weather-icon">${weatherIcon}</div>
            </div>
            <div class="hero-body">
                <div class="hero-condition">${currentConditionText}</div>
                <div class="temp-huge">${currentTemp}${tempSymbol}</div>
            </div>
            <div class="hero-footer">
                <div class="temp-range">Макс: <b>${todayMax}${tempSymbol}</b> &nbsp;|&nbsp; Мін: <b>${todayMin}${tempSymbol}</b></div>
                <span class="tile-label">поточна погода</span>
            </div>
        </div>
        
        <!-- Hourly Forecast Tile (Wide 2x1) -->
        <div class="tile tile-wide tile-dark hourly-tile" style="padding: 0;">
            <div class="tile-header-bar">
                <span>погодинний прогноз</span>
                <span style="font-size: 0.75rem; opacity: 0.7;">на 16 годин</span>
            </div>
            <div class="hourly-container">
                ${hourlyHtmlArray.join('')}
            </div>
        </div>
        
        <!-- Wind Tile (1x1) -->
        <div class="tile tile-square tile-teal">
            <div class="tile-content">
                <div class="wind-content">
                    <div class="wind-speed-box">
                        <div class="data-value">${windSpeed}</div>
                        <div class="data-unit">${windUnitLabel}</div>
                        ${windGusts ? `<div class="wind-gusts">пориви до ${windGusts}</div>` : ''}
                    </div>
                    <div class="compass-box">
                        <div class="compass-icon" style="transform: rotate(${windDirectionDeg}deg);" title="Напрямок: ${windDirectionDeg}°">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>
                        </div>
                        <div class="compass-dir">${windDirectionText}</div>
                    </div>
                </div>
            </div>
            <span class="tile-label">вітер</span>
        </div>
        
        <!-- Feels Like Tile (1x1) -->
        <div class="tile tile-square tile-orange">
            <div class="tile-content">
                <div class="data-value">${feelsLikeTemp}${tempSymbol}</div>
                <div class="data-unit">${tempUnitLabel}</div>
                <div class="metric-subtitle">
                    ${feelsLikeTemp === currentTemp ? 'Відповідає температурі' : (feelsLikeTemp < currentTemp ? `На ${Math.abs(currentTemp - feelsLikeTemp)}° нижче через вітер` : `На ${feelsLikeTemp - currentTemp}° тепліше`)}
                </div>
            </div>
            <span class="tile-label">відчувається як</span>
        </div>
        
        <!-- Sun & Day Cycle Tile (1x1) -->
        <div class="tile tile-square tile-dark">
            <div class="tile-content">
                <div class="sun-cycle-content">
                    <div class="sun-row">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFB300" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.95 16A6 6 0 0 0 8.05 16"/><path d="M2 16h20"/></svg>
                            Схід
                        </span>
                        <span>${sunriseTime}</span>
                    </div>
                    <div class="sun-row">
                        <span>
                            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF7043" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10V2"/><path d="m4.93 10.93 1.41-1.41"/><path d="M2 18h20"/><path d="M20 18a8 8 0 0 0-16 0"/><path d="m19.07 10.93-1.41-1.41"/></svg>
                            Захід
                        </span>
                        <span>${sunsetTime}</span>
                    </div>
                </div>
            </div>
            <span class="tile-label">сонце та день</span>
        </div>

        <!-- UV Index Tile (1x1) -->
        <div class="tile tile-square tile-purple">
            <div class="tile-content">
                <div class="data-value">${Math.round(uvVal)}</div>
                <div class="badge-tag">${uvInfo.text}</div>
                <div class="metric-subtitle">${uvInfo.desc}</div>
            </div>
            <span class="tile-label">уф-індекс</span>
        </div>

        <!-- Humidity Tile (1x1) -->
        <div class="tile tile-square tile-blue">
            <div class="tile-content">
                <div class="data-value">${humidity}%</div>
                <div class="metric-subtitle">${humidityStatus}</div>
            </div>
            <span class="tile-label">вологість</span>
        </div>

        <!-- Pressure Tile (1x1) -->
        <div class="tile tile-square tile-teal">
            <div class="tile-content">
                <div class="data-value" style="font-size: 2.1rem;">${pressure}</div>
                <div class="data-unit">${pressureUnit}</div>
                <div class="metric-subtitle">${pressureStatus}</div>
            </div>
            <span class="tile-label">тиск</span>
        </div>
        
        <!-- Daily 7-Day Forecast Tile (Full 4x1) -->
        <div class="tile tile-full tile-dark" style="padding: 0;">
            <div class="tile-header-bar">
                <span>прогноз на 7 днів</span>
                <span style="font-size: 0.75rem; opacity: 0.7;">детальний тижневий огляд</span>
            </div>
            <div class="daily-container">
                ${dailyHtmlArray.join('')}
            </div>
        </div>
    `;

    weatherContainer.innerHTML = html;
}

function startLiveTiles() {
    clearInterval(liveTileInterval);
}

// --- Notifications Logic ---
function setupNotifications() {
    // UI Logic
    notifMode.addEventListener('change', (e) => {
        if (e.target.value === 'daily') {
            notifTimeGroup.classList.remove('hidden');
        } else {
            notifTimeGroup.classList.add('hidden');
        }
    });

    // Load saved settings
    const savedNotif = localStorage.getItem(NOTIF_STORAGE_KEY);
    if (savedNotif) {
        const { mode, time } = JSON.parse(savedNotif);
        notifMode.value = mode;
        if (mode === 'daily') {
            notifTimeGroup.classList.remove('hidden');
            notifTime.value = time;
        }
    }

    // Save Settings
    saveNotifBtn.addEventListener('click', async () => {
        const mode = notifMode.value;
        const time = notifTime.value;

        if (mode === 'daily' && !time) {
            alert('Будь ласка, оберіть час сповіщення.');
            return;
        }

        localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify({ mode, time, lastNotifiedDate: null }));

        // Request Permissions
        if (mode !== 'none') {
            if (!("Notification" in window)) {
                alert("Ваш браузер не підтримує сповіщення.");
            } else if (Notification.permission !== "granted" && Notification.permission !== "denied") {
                const permission = await Notification.requestPermission();
                if (permission === "granted") {
                    showToast('Налаштування збережено. Сповіщення активовано.');
                }
            } else if (Notification.permission === "granted") {
                showToast('Налаштування збережено.');
            } else {
                showToast('Ви заблокували сповіщення у налаштуваннях браузера.');
            }
        } else {
            showToast('Налаштування збережено. Сповіщення вимкнено.');
        }

        startNotificationChecker();
    });

    startNotificationChecker();
}

function startNotificationChecker() {
    clearInterval(notificationInterval);

    notificationInterval = setInterval(() => {
        const savedNotif = localStorage.getItem(NOTIF_STORAGE_KEY);
        if (!savedNotif) return;

        let notifData = JSON.parse(savedNotif);
        if (notifData.mode === 'none' || !notifData.time) return;

        const now = new Date();
        const currentHours = now.getHours().toString().padStart(2, '0');
        const currentMinutes = now.getMinutes().toString().padStart(2, '0');
        const currentTimeString = `${currentHours}:${currentMinutes}`;
        const currentDateString = now.toDateString();

        // Check if time matches and we haven't notified today
        if (currentTimeString === notifData.time && notifData.lastNotifiedDate !== currentDateString) {
            sendPushNotification();
            // Update last notified
            notifData.lastNotifiedDate = currentDateString;
            localStorage.setItem(NOTIF_STORAGE_KEY, JSON.stringify(notifData));
        }
    }, 30000); // Check every 30 seconds
}

function sendPushNotification() {
    if ("Notification" in window && Notification.permission === "granted") {
        const savedLocation = localStorage.getItem(STORAGE_KEY);
        let city = "вашому місті";
        if (savedLocation) {
            city = JSON.parse(savedLocation).name;
        }

        new Notification("D3 Cast", {
            body: `Час перевірити погоду у ${city}!`,
            icon: "https://cdn-icons-png.flaticon.com/512/3222/3222800.png"
        });
    }
}

// --- Format Settings Logic ---
function setupFormatSettings() {
    const savedFormat = localStorage.getItem(FORMAT_STORAGE_KEY);
    if (savedFormat) {
        const { temp, wind, pressure } = JSON.parse(savedFormat);
        if (formatTemp) formatTemp.value = temp;
        if (formatWind) formatWind.value = wind;
        if (formatPressure) formatPressure.value = pressure;
    }

    if (saveFormatBtn) {
        saveFormatBtn.addEventListener('click', () => {
            const temp = formatTemp.value;
            const wind = formatWind.value;
            const pressure = formatPressure.value;

            localStorage.setItem(FORMAT_STORAGE_KEY, JSON.stringify({ temp, wind, pressure }));
            showToast('Формат даних збережено.');

            // Reload weather if available
            const savedLocation = localStorage.getItem(STORAGE_KEY);
            if (savedLocation) {
                fetchWeather(JSON.parse(savedLocation));
            }
        });
    }
}

// --- Helpers ---
function getWeatherCondition(code) {
    if (code === 0 || code === 1) return { bgClass: 'tile-orange' };
    if (code === 2 || code === 3 || code === 45 || code === 48) return { bgClass: 'tile-purple' };
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return { bgClass: 'tile-blue' };
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { bgClass: 'tile-blue' };
    if (code >= 95 && code <= 99) return { bgClass: 'tile-dark' };
    return { bgClass: 'tile-blue' };
}

function getWeatherDescriptionText(code) {
    if (code === 0) return 'Ясно';
    if (code === 1) return 'Переважно ясно';
    if (code === 2) return 'Мінлива хмарність';
    if (code === 3) return 'Похмуро';
    if (code === 45 || code === 48) return 'Туман';
    if (code >= 51 && code <= 55) return 'Мряка';
    if (code >= 56 && code <= 57) return 'Крижана мряка';
    if (code >= 61 && code <= 65) return 'Дощ';
    if (code >= 66 && code <= 67) return 'Крижаний дощ';
    if (code >= 71 && code <= 77) return 'Снігопад';
    if (code >= 80 && code <= 82) return 'Злива';
    if (code === 85 || code === 86) return 'Сильний сніг';
    if (code >= 95 && code <= 99) return 'Гроза';
    return 'Невідомо';
}

function getWeatherIconSvg(code, isDay = 1, size = 24) {
    if (code === 0 || code === 1) {
        if (isDay) {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
        } else {
            return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
        }
    }
    if (code === 2 || code === 3) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>`;
    }
    if (code === 45 || code === 48) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 9h14M3 13h18M7 17h10"/></svg>`;
    }
    if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/></svg>`;
    }
    if ((code >= 71 && code <= 77) || code === 85 || code === 86) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m10 20-1.25-2.5L6 18l1.75-2.25L7 13.5l2.5 1.25L12 12l2.5 2.75 2.5-1.25-.75 2.25L18 18l-2.75-.5L14 20l-2-2.25Z"/><path d="M12 2v20"/><path d="m17 7-5 5-5-5"/><path d="m17 17-5-5-5 5"/></svg>`;
    }
    if (code >= 95 && code <= 99) {
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/><path d="m13 15-3 5h4l-2 5"/></svg>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/></svg>`;
}

function getWindDirection(deg) {
    const directions = ['Пн', 'Пн-Сх', 'Сх', 'Пд-Сх', 'Пд', 'Пд-Зх', 'Зх', 'Пн-Зх'];
    const index = Math.round(((deg %= 360) < 0 ? deg + 360 : deg) / 45) % 8;
    return directions[index];
}

function getUvDescription(uv) {
    if (uv <= 2) return { text: 'Низький', desc: 'Захист не потрібен' };
    if (uv <= 5) return { text: 'Помірний', desc: 'Бажано головний убір' };
    if (uv <= 7) return { text: 'Високий', desc: 'Використовуйте SPF' };
    if (uv <= 10) return { text: 'Дуже вис.', desc: 'Уникайте сонця в полудень' };
    return { text: 'Екстрем.', desc: 'Залишайтеся в тіні' };
}

function getHumidityDescription(hum) {
    if (hum < 35) return 'Сухе повітря';
    if (hum <= 65) return 'Комфортна вологість';
    if (hum <= 80) return 'Підвищена вологість';
    return 'Дуже сиро';
}

function getPressureDescription(hpa) {
    if (hpa < 1008) return 'Знижений тиск';
    if (hpa <= 1018) return 'Нормальний тиск';
    return 'Підвищений тиск';
}

function formatTimeShort(isoString) {
    if (!isoString) return '--:--';
    const date = new Date(isoString);
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
}

function showError(message) {
    searchError.textContent = message;
    searchError.classList.remove('hidden');
}

function hideError() {
    searchError.classList.add('hidden');
    searchError.textContent = '';
}

function showToast(message) {
    permissionToast.textContent = message;
    permissionToast.classList.remove('hidden');
    setTimeout(() => {
        permissionToast.classList.add('hidden');
    }, 4000);
}

// Start
document.addEventListener('DOMContentLoaded', init);

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}
