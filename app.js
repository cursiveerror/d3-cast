const searchSection = document.getElementById('search-section');
const weatherSection = document.getElementById('weather-section');
const notificationsSection = document.getElementById('notifications-section');
const formatSection = document.getElementById('format-section');
const aboutSection = document.getElementById('about-section');
const weatherContainer = document.getElementById('weather-container');
const locationInput = document.getElementById('location-input');
const searchBtn = document.getElementById('search-btn');
const searchResults = document.getElementById('search-results');
const searchError = document.getElementById('search-error');
const changeLocationBtn = document.getElementById('change-location-btn');

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
    notificationsSection.classList.add('hidden');
    formatSection.classList.add('hidden');
    aboutSection.classList.add('hidden');
    changeLocationBtn.classList.add('hidden');

    document.getElementById(sectionId).classList.remove('hidden');

    if (sectionId === 'weather-section' || sectionId === 'notifications-section' || sectionId === 'about-section' || sectionId === 'format-section') {
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
        const li = document.createElement('li');
        const nameSpan = document.createElement('span');
        nameSpan.className = 'result-name';
        nameSpan.textContent = item.name;

        const adminSpan = document.createElement('span');
        adminSpan.className = 'result-admin';

        // Виправляємо "Чернігівська" на "Чернігівська область"
        let admin1 = item.admin1;
        if (admin1 && admin1.endsWith('ська') && !admin1.toLowerCase().includes('область')) {
            admin1 += ' область';
        }

        const adminParts = [admin1, item.admin2].filter(Boolean);
        adminSpan.textContent = adminParts.length > 0 ? adminParts.join(', ') : 'Україна';

        li.appendChild(nameSpan);
        li.appendChild(adminSpan);

        li.addEventListener('click', () => {
            const subtitle = adminParts.length > 0 ? adminParts.join(', ') : 'Україна';
            const locationData = {
                name: item.name,
                latitude: item.latitude,
                longitude: item.longitude,
                admin: adminParts.length > 0 ? adminParts[0] : 'Україна',
                subtitle: subtitle
            };
            saveLocationAndFetchWeather(locationData);
        });

        searchResults.appendChild(li);
    });
}

function saveLocationAndFetchWeather(location) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
    showSection('weather-section');
    fetchWeather(location);
}

// --- Weather Fetch & Render ---
async function fetchWeather(location) {
    try {
        weatherContainer.innerHTML = `
            <div class="loader-wrapper">
                <div class="metro-loader">
                    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
                </div>
                <h2>Отримання даних</h2>
            </div>`;

        let formatSettings = { temp: 'celsius', wind: 'kmh', pressure: 'hpa' };
        const savedFormat = localStorage.getItem(FORMAT_STORAGE_KEY);
        if (savedFormat) formatSettings = JSON.parse(savedFormat);

        const params = new URLSearchParams({
            latitude: location.latitude,
            longitude: location.longitude,
            current: 'temperature_2m,apparent_temperature,wind_speed_10m,relative_humidity_2m,pressure_msl,weather_code,is_day',
            hourly: 'temperature_2m',
            timezone: 'auto',
            forecast_days: 2,
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
        body.classList.add('weather-clear'); // фолбек
    }

    // Нічний режим: додаємо додатковий клас, який перекриє кольори найтемнішими варіантами
    if (isDay === 0) {
        body.classList.add('is-night');
    }
}

function renderWeather(location, data) {
    const { current, hourly } = data;

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
    const humidity = current.relative_humidity_2m;

    let pressure = current.pressure_msl;
    let pressureUnit = 'hPa';
    if (formatSettings.pressure === 'mmhg') {
        pressure = Math.round(pressure * 0.750062);
        pressureUnit = 'mmHg';
    } else {
        pressure = Math.round(pressure);
    }

    let windUnitLabel = 'км/год';
    if (formatSettings.wind === 'ms') windUnitLabel = 'м/с';
    if (formatSettings.wind === 'mph') windUnitLabel = 'mph';

    // Hourly
    const now = new Date();
    let startIndex = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        const hourTime = new Date(hourly.time[i]);
        if (hourTime >= now || Math.abs(hourTime - now) < 3600000) {
            startIndex = i;
            break;
        }
    }

    const hourlyHtmlArray = [];
    for (let i = startIndex; i < startIndex + 12 && i < hourly.time.length; i++) {
        const timeObj = new Date(hourly.time[i]);
        const hours = timeObj.getHours().toString().padStart(2, '0');
        let tempVal = hourly.temperature_2m[i];
        if (formatSettings.temp === 'kelvin') tempVal += 273.15;
        const temp = Math.round(tempVal);
        const displayTime = (i === startIndex) ? 'Зараз' : `${hours}:00`;
        hourlyHtmlArray.push(`
            <div class="hour-tile">
                <span class="hour-time">${displayTime}</span>
                <span class="hour-temp">${temp}${tempSymbol}</span>
            </div>
        `);
    }

    // Build Tiles
    // Використовуємо збережений повний підпис (якщо є), або fallback на старий admin
    const locationSubtitle = location.subtitle || location.admin || 'Україна';

    const condition = getWeatherCondition(current.weather_code);

    // Main tile has front (temp) and back (humidity/pressure)
    const html = `
        <!-- Main Live Tile -->
        <div class="tile tile-large ${condition.bgClass} live" id="main-live-tile">
            <div class="tile-inner">
                <div class="tile-front">
                    <span class="tile-label">поточна погода</span>
                    <div class="city-name">${location.name}</div>
                    <div class="temp-huge">${currentTemp}${tempSymbol}</div>
                    <div style="margin-top: 10px; opacity: 0.8;">${locationSubtitle}</div>
                </div>
                <div class="tile-back">
                    <span class="tile-label">додатково</span>
                    <div style="font-size: 1.2rem; margin-bottom: 10px;">Вологість: <b>${humidity}%</b></div>
                    <div style="font-size: 1.2rem;">Тиск: <b>${pressure} ${pressureUnit}</b></div>
                </div>
            </div>
        </div>
        
        <!-- Wind Tile -->
        <div class="tile tile-tall tile-teal">
            <span class="tile-label">вітер</span>
            <div style="margin-top: auto; margin-bottom: auto;">
                <div class="data-value">${windSpeed}</div>
                <div class="data-unit">${windUnitLabel}</div>
            </div>
        </div>
        
        <!-- Feels Like Tile -->
        <div class="tile tile-tall tile-orange">
            <span class="tile-label">відчувається як</span>
            <div style="margin-top: auto; margin-bottom: auto;">
                <div class="data-value">${feelsLikeTemp}${tempSymbol}</div>
                <div class="data-unit">${tempUnitLabel}</div>
            </div>
        </div>
        
        <!-- Hourly Forecast Tile -->
        <div class="tile tile-full tile-purple" style="padding: 0;">
            <div style="padding: 16px 16px 8px 16px; font-weight: 600; font-size: 0.85rem; text-transform: lowercase;">прогноз на 12 годин</div>
            <div class="hourly-container">
                ${hourlyHtmlArray.join('')}
            </div>
        </div>
    `;

    weatherContainer.innerHTML = html;
}

function startLiveTiles() {
    clearInterval(liveTileInterval);
    const mainTile = document.getElementById('main-live-tile');

    if (mainTile) {
        mainTile.style.cursor = 'pointer';
        mainTile.addEventListener('click', () => {
            mainTile.classList.toggle('flipped');
        });
    }
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
