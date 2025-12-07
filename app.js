// app.js
const btnGet = document.getElementById('btn-get');
const btnRefresh = document.getElementById('btn-refresh');
const statusEl = document.getElementById('status');
const resultEl = document.getElementById('result');
const coordsEl = document.getElementById('coords');
const tempEl = document.getElementById('temp');
const windEl = document.getElementById('wind');
const timeEl = document.getElementById('time');

let lastCoords = null;

btnGet.addEventListener('click', getLocationAndWeather);
btnRefresh.addEventListener('click', () => {
  if (lastCoords) fetchWeather(lastCoords.latitude, lastCoords.longitude);
});

function setStatus(text) {
  statusEl.textContent = text;
}

function getLocationAndWeather() {
  if (!('geolocation' in navigator)) {
    setStatus('Geolocalização não suportada no navegador.');
    return;
  }
  setStatus('Solicitando permissão para localização...');
  navigator.geolocation.getCurrentPosition(success, geoError, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000
  });
}

function success(position) {
  const { latitude, longitude } = position.coords;
  lastCoords = { latitude, longitude };
  coordsEl.textContent = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  setStatus('Localização obtida. Buscando clima...');
  fetchWeather(latitude, longitude);
  btnRefresh.disabled = false;
}

function geoError(err) {
  console.warn('Erro geolocation', err);
  if (err.code === 1) {
    setStatus('Permissão negada. Ative a localização e tente novamente.');
  } else if (err.code === 2) {
    setStatus('Posição indisponível.');
  } else {
    setStatus('Erro ao obter localização: ' + err.message);
  }
}

async function fetchWeather(lat, lon) {
  // API pública sem chave: Open-Meteo (atual_weather)
  // Documentação: https://open-meteo.com (não precisa de chave)
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=UTC`;
  try {
    setStatus('Consultando API de clima...');
    const resp = await fetch(url);
    if (!resp.ok) throw new Error('Resposta da API não OK: ' + resp.status);
    const data = await resp.json();

    if (!data.current_weather) {
      setStatus('API não retornou dados de clima para esta posição.');
      return;
    }
    const cw = data.current_weather;
    tempEl.textContent = cw.temperature;
    windEl.textContent = cw.windspeed;
    timeEl.textContent = cw.time;

    resultEl.classList.remove('hidden');
    setStatus('Clima carregado com sucesso.');
  } catch (error) {
    console.error('Erro ao buscar clima', error);
    setStatus('Erro ao consultar API de clima: ' + error.message);
  }
}
