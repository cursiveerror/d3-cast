<div align="center">
  <img src="assets/banner.svg" alt="D3 Cast Banner" width="100%">
  <br><br>
  
  **Стильний, швидкий та повністю відкритий дашборд погоди у стилі Metro UI.**

  [![GitHub license](https://img.shields.io/github/license/cursiveerror/d3-cast?style=for-the-badge&color=00ABA9)](https://github.com/cursiveerror/d3-cast/blob/main/LICENSE)
  [![GitHub stars](https://img.shields.io/github/stars/cursiveerror/d3-cast?style=for-the-badge&color=E3A21A)](https://github.com/cursiveerror/d3-cast/stargazers)
  [![PWA Ready](https://img.shields.io/badge/PWA-Ready-2D89EF?style=for-the-badge&logo=pwa)](https://cursiveerror.github.io/d3-cast/)
  [![Open-Meteo](https://img.shields.io/badge/API-Open--Meteo-00A300?style=for-the-badge)](https://open-meteo.com/)
  <br><br>
  [![Відкрити дашборд](https://img.shields.io/badge/Відкрити_Сайт-2D89EF?style=for-the-badge&logo=google-chrome&logoColor=white)](https://cursiveerror.github.io/d3-cast/)
</div>

<hr>

## 🌟 Про проєкт

**D3 Cast** — це некомерційний, повністю відкритий дашборд для зручного та швидкого перегляду погоди. Ніякої реклами, трекерів чи зайвого шуму. Лише чисті дані, загорнуті у плитковий дизайн (Metro UI), що динамічно реагує на погодні умови за вікном.

## ✨ Головні фішки

- 🎨 **Динамічний Metro UI**: Кольорова тема сайту та головної плитки автоматично змінюється залежно від погоди (сонячно, дощ, сніг, похмуро тощо).
- 📱 **PWA (Progressive Web App)**: Додавай дашборд на головний екран свого смартфона чи ПК. Він працює як повноцінний нативний додаток без зайвих панелей браузера!
- 🔔 **Розумні Push-сповіщення**: Налаштуй щоденні нагадування перевірити погоду. Дашборд сам надішле тобі пуш-сповіщення у вказаний час.
- ⚙️ **Гнучкі формати даних**: Перемикайся між Цельсіями, Фаренгейтами та Кельвінами. Налаштовуй швидкість вітру (км/год, м/с, mph) та тиск (hPa або mmHg). 
- 💾 **Автозбереження**: Сайт автоматично запам'ятовує обране тобою місто та всі налаштування (через `localStorage`).
- ⚡ **Швидкість**: Побудовано на чистому HTML, CSS (Vanilla) та JavaScript без важких фреймворків.

## 📡 Джерела даних (API)

Проєкт використовує відкриті та безкоштовні API від **Open-Meteo**, яким не потрібні ключі доступу (API keys):
- [Weather Forecast API](https://open-meteo.com/en/docs)
- [Geocoding API](https://open-meteo.com/en/docs/geocoding-api)

## 🛠 Технологічний стек

- **HTML5** 
- **CSS3** (CSS Grid, Flexbox, CSS Variables, Animations)
- **Vanilla JavaScript** (ES6+, Fetch API, LocalStorage, Service Workers, Notifications API)

## 🚀 Встановлення локально

Якщо хочеш запустити проєкт локально або зробити свій форк:

1. Клонуй репозиторій:
   ```bash
   git clone https://github.com/cursiveerror/d3-cast.git
   ```
2. Відкрий папку проєкту:
   ```bash
   cd d3-cast
   ```
3. Запусти через будь-який локальний сервер (наприклад, Live Server у VS Code або через Python):
   ```bash
   python -m http.server 8000
   ```
4. Відкрий у браузері `http://localhost:8000` (порт може відрізнятися).

## 🤝 Контрибуція

D3 Cast — це проєкт з відкритим вихідним кодом. Запрошую всіх охочих приєднуватися! Роби форк, створюй Pull Request або відкривай Issue, якщо знайшов баг. 

<div align="center">
  <br>
  <sub>Створено з ❤️ у стилі Metro UI.</sub>
</div>
