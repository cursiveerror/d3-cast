<div align="center">
  <img src="assets/banner.svg" alt="D3 Cast Architecture" width="100%">
</div>

<br>

<div align="center">
  <a href="https://github.com/cursiveerror/d3-cast/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/LICENSE-MIT-000000?style=for-the-badge&logo=opensourceinitiative&logoColor=FFFFFF" alt="License" />
  </a>
  <a href="https://cursiveerror.github.io/d3-cast/">
    <img src="https://img.shields.io/badge/DEPLOYMENT-LIVE-000000?style=for-the-badge&logo=vercel&logoColor=FFFFFF" alt="Deployment" />
  </a>
  <a href="https://open-meteo.com/">
    <img src="https://img.shields.io/badge/DATA-OPEN_METEO-000000?style=for-the-badge&logo=json&logoColor=FFFFFF" alt="API" />
  </a>
</div>

<br><br>

## ARCHITECTURE OVERVIEW

**D3 Cast** is a strictly client-side weather dashboard designed for absolute minimal latency and zero computational overhead. The application bypasses modern heavy JavaScript frameworks, relying entirely on native browser APIs and Vanilla JavaScript to deliver real-time meteorological data.

It utilizes the Open-Meteo API for raw data ingestion and dynamically recalculates the UI color palette based on current environmental conditions and temporal states (day/night cycles).

---

## CORE SPECIFICATIONS

| Component | Implementation Detail |
| :--- | :--- |
| **Runtime** | Browser Native (Vanilla JS, CSS3, HTML5) |
| **Data Provider** | Open-Meteo API |
| **State Management** | Local Storage API |
| **Notification Engine**| Service Worker + Notifications API |
| **Distribution** | Progressive Web App (PWA) Standard |

---

## TECHNICAL FEATURES

- **Dynamic Environment Rendering:** The UI matrix automatically adjusts its hex-color palette corresponding to real-time weather codes (clear, rain, storm, snow) and local timezone calculations.
- **Zero-Dependency Core:** 0 bytes of external UI libraries or NPM dependencies. Native CSS variables drive the entire state transformation.
- **Background Processes:** Localized push notifications execute via the browser's native API, prompting data refresh intervals according to user-defined parameters.
- **Data Persistence:** All configurations (imperial/metric units, stored geographical coordinates, UI preferences) are sandboxed securely within the client's `localStorage`. No remote telemetry is collected.
