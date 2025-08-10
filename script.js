const apiKey = "27dbddea8d63d0fc43b3c30d32c4168c";

const weatherStatIcons = {
  FeelsLike: "https://img.icons8.com/ios-filled/50/3368d0/temperature--v1.png",
  Wind: "https://img.icons8.com/ios-filled/50/3368d0/wind.png",
  Humidity: "https://img.icons8.com/ios-filled/50/3368d0/humidity.png",
  Pressure: "https://img.icons8.com/ios-filled/50/3368d0/barometer.png",
  Sunrise: "https://img.icons8.com/ios-filled/50/3368d0/sunrise.png",
  Sunset: "https://img.icons8.com/ios-filled/50/3368d0/sunset.png",
};

const searchBtn = document.getElementById('searchBtn');
const cityInput = document.getElementById('cityInput');

searchBtn.onclick = searchCity;
cityInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') searchCity();
});

function searchCity() {
  const city = cityInput.value.trim();
  if (!city) return;
  fetchAndRender(city);
}

async function fetchAndRender(city) {
  hideAll();

  try {
    // Geocode city
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${apiKey}`
    );
    const geo = await geoRes.json();
    if (!geo || !geo[0]) throw new Error("City not found");
    const { lat, lon } = geo[0];

    // Current weather
    const curRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    const curr = await curRes.json();
    if (curr.cod !== 200) throw new Error(curr.message);

    // Forecast
    const foreRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`
    );
    const fore = await foreRes.json();

    displayMainWeather(curr);
    displayTempChart(fore.list);
    renderFiveDayForecast(fore);
    renderHourlyForecast(fore);
  } catch (e) {
    showError(e.message);
  }
}

function hideAll() {
  document.getElementById('mainWeather').classList.add('hide');
  document.getElementById('chartSection').classList.add('hide');
  document.getElementById('fiveDayForecast').classList.add('hide');
  document.getElementById('hourlyForecast').classList.add('hide');
  document.getElementById('mainWeather').innerHTML = '';
  document.getElementById('fiveDayList').innerHTML = '';
  document.getElementById('hourlyList').innerHTML = '';
  if (window.chart) {
    window.chart.destroy();
    window.chart = null;
  }
}

function displayMainWeather(curr) {
  const main = curr.main;
  const weatherObj = curr.weather[0];
  const iconUrl = `https://openweathermap.org/img/wn/${weatherObj.icon}@2x.png`;

  const html = `
    <img src="${iconUrl}" class="weather-icon-img" alt="${weatherObj.main}" />
    <div class="weather-desc">${weatherObj.main}</div>
    <div class="main-temp">${Math.round(main.temp)}°C</div>
    <div class="weather-stats">
      <span><img src="${weatherStatIcons.FeelsLike}" alt="Feels Like" />Feels: ${Math.round(main.feels_like)}°C</span>
      <span><img src="${weatherStatIcons.Wind}" alt="Wind" />Wind: ${curr.wind.speed}m/s</span>
      <span><img src="${weatherStatIcons.Humidity}" alt="Humidity" />Humidity: ${main.humidity}%</span>
      <span><img src="${weatherStatIcons.Pressure}" alt="Pressure" />Pressure: ${main.pressure} hPa</span>
      <span><img src="${weatherStatIcons.Sunrise}" alt="Sunrise" />Sunrise: ${unixToTime(curr.sys.sunrise, curr.timezone)}</span>
      <span><img src="${weatherStatIcons.Sunset}" alt="Sunset" />Sunset: ${unixToTime(curr.sys.sunset, curr.timezone)}</span>
    </div>`;

  const mainWeatherDiv = document.getElementById('mainWeather');
  mainWeatherDiv.innerHTML = html;
  mainWeatherDiv.classList.remove('hide');
}

function displayTempChart(list) {
  const ctx = document.getElementById('tempChart').getContext('2d');

  // Prepare data
  const labels = list.map((l) => l.dt_txt.split(' ')[1].slice(0, 5));
  const temps = list.map((l) => l.main.temp);

  if (window.chart) {
    window.chart.destroy();
  }
  window.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [
        {
          label: 'Temperature (°C)',
          data: temps,
          fill: true,
          borderColor: '#3487fa',
          backgroundColor: 'rgba(52,135,250,0.15)',
          pointRadius: 3,
          pointBackgroundColor: '#3368d0',
          tension: 0.4,
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          display: true,
          title: { display: true, text: 'Time' },
        },
        y: {
          display: true,
          title: { display: true, text: '°C' },
          beginAtZero: false,
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      elements: {
        line: { borderWidth: 3 },
      },
    },
  });

  document.getElementById('chartSection').style.height = '270px';
  document.getElementById('chartSection').classList.remove('hide');
}

function renderFiveDayForecast(forecastData) {
  const fiveDayList = document.getElementById('fiveDayList');
  fiveDayList.innerHTML = '';

  const dayMap = {};
  forecastData.list.forEach((item) => {
    const date = item.dt_txt.split(' ')[0];
    if (!dayMap[date] || item.dt_txt.includes('12:00:00')) {
      dayMap[date] = item;
    }
  });

  const days = Object.values(dayMap).slice(0, 5);

  days.forEach((item) => {
    const dt = new Date(item.dt * 1000);
    const dayName = dt.toLocaleDateString(undefined, { weekday: 'short' });
    const monthDay = dt.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
    const temp = Math.round(item.main.temp);

    const forecastItem = document.createElement('div');
    forecastItem.className = 'forecast-item';
    forecastItem.innerHTML = `
      <div class="date">${dayName}</div>
      <div class="time">${monthDay}</div>
      <img src="${iconUrl}" alt="${item.weather[0].description}" />
      <div class="temp">${temp}°C</div>
    `;
    fiveDayList.appendChild(forecastItem);
  });

  document.getElementById('fiveDayForecast').classList.remove('hide');
}

function renderHourlyForecast(forecastData) {
  const hourlyList = document.getElementById('hourlyList');
  hourlyList.innerHTML = '';

  const todayDateStr = new Date().toISOString().split('T')[0];
  const todayHours = forecastData.list.filter((item) => item.dt_txt.startsWith(todayDateStr));

  const nextHours = todayHours.slice(0, 8);

  nextHours.forEach((item) => {
    const timeStr = item.dt_txt.split(' ')[1].slice(0, 5);
    const iconUrl = `https://openweathermap.org/img/wn/${item.weather[0].icon}@2x.png`;
    const temp = Math.round(item.main.temp);

    const hourlyItem = document.createElement('div');
    hourlyItem.className = 'forecast-item';
    hourlyItem.innerHTML = `
      <div class="time">${timeStr}</div>
      <img src="${iconUrl}" alt="${item.weather[0].description}" />
      <div class="temp">${temp}°C</div>
    `;
    hourlyList.appendChild(hourlyItem);
  });

  document.getElementById('hourlyForecast').classList.remove('hide');
}

function showError(message) {
  hideAll();
  const mainWeatherDiv = document.getElementById('mainWeather');
  mainWeatherDiv.innerHTML = `<span style="font-size:1.2em;color:#e44d2c">${message}</span>`;
  mainWeatherDiv.classList.remove('hide');
}

function unixToTime(ut, tzoffsetS = 0) {
  const d = new Date((ut + tzoffsetS) * 1000);
  let hr = d.getUTCHours(),
    min = d.getUTCMinutes();
  if (hr < 10) hr = '0' + hr;
  if (min < 10) min = '0' + min;
  return `${hr}:${min}`;
}
