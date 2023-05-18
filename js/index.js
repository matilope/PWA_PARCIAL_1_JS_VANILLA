const APIKEY = "9323fbb11b79b22968f41dcbf8180673";
const form = document.querySelector("form");

let mainSelector = document.querySelector("main");
let historial;

Date.prototype.fecha = function () {
    let months = [
        "Enero",
        "Febrero",
        "Marzo",
        "Abril",
        "Mayo",
        "Junio",
        "Julio",
        "Agosto",
        "Septiembre",
        "Octubre",
        "Noviembre",
        "Diciembre"
    ];
    return `${this.getDate()} de ${months[this.getMonth()]}`;
};

function localStorageData() {
    const busquedasStorage = JSON.parse(localStorage.getItem("busquedas_realizadas"));
    if (!busquedasStorage || !busquedasStorage.length) {
        localStorage.setItem("busquedas_realizadas", JSON.stringify([]));
        return [];
    }
    creacionGrafico(busquedasStorage[0]);
    return busquedasStorage;
}

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = document.querySelector("input").value;
    try {
        const data = await (await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${value}&units=metric&appid=${APIKEY}`)).json();

        /* Fixed de la data */
        data.main.temp = data.main.temp.toFixed(1);
        data.main.temp_min = data.main.temp_min.toFixed(1);
        data.main.temp_max = data.main.temp_max.toFixed(1);
        data.main.feels_like = data.main.feels_like.toFixed(1);
        data.wind.speed = (data.wind.speed * 3.6).toFixed(0);

        /* Funciones */
        unshiftData(data);
        historialBusqueda();
        creacionGrafico(data);
        busquedaRealizada(data.name, data.coord);

        /* Vacio el input y remuevo el loader */
        document.querySelector(".data-loader")?.remove();
        e.target.children[0].children[1].value = "";
    }
    catch (error) {
        alertMessage();
        console.log(error);
    }
});

function unshiftData(data) {
    const busquedasStorage = localStorageData();
    if (data) {
        data.date = new Date().fecha();
        busquedasStorage.unshift(data);
        localStorage.setItem("busquedas_realizadas", JSON.stringify(busquedasStorage));
    }
}

function busquedaRealizada(name, coordenadas) {
    let selectorMapa = document.querySelector(".map");
    selectorMapa?.remove();
    let section = document.createElement("section");
    let h2 = document.createElement("h2");
    let map = document.createElement("div");
    mainSelector.insertBefore(section, historial);
    section.append(h2, map);
    section.classList.add("map", "my-5");
    map.id = "map";
    h2.textContent = `La ubicación en ${name}`;
    const mapInstance = tt.map({
        key: 'N4kGFtFTIrZG6KfCiubQTzkfPSgk84DP',
        container: 'map',
        dragPan: !isMobileOrTablet(),
        center: { lng: coordenadas.lon, lat: coordenadas.lat },
        zoom: 6,
    });
    mapInstance.addControl(new tt.NavigationControl({ showCompass: false }));
    mapInstance.on('load', () => {
        new tt.Marker().setLngLat({ lng: coordenadas.lon, lat: coordenadas.lat }).addTo(mapInstance);
    });
}

function historialBusqueda() {
    const busquedasStorage = localStorageData();
    if (!busquedasStorage.length) return;

    document.querySelector(".pagination")?.parentElement.remove();

    historial = document.querySelector(".historial");
    let tableResponsive = document.querySelector(".table-responsive");

    if (historial) {
        let tableRows = historial.children[1].children[0].children[1].children;
        Array.from(tableRows).forEach(tr => tr.remove());
    } else {
        historial = document.createElement("section");
        historial.classList.add("row", "my-5", "historial");

        let h2 = document.createElement("h2");
        h2.classList.add("my-3");
        h2.textContent = "Historial de busqueda";

        mainSelector.appendChild(historial);
        historial.appendChild(h2);
    }

    if (!tableResponsive) {
        tableResponsive = document.createElement("div");
        let table = document.createElement("table");
        let thead = document.createElement("thead");
        let trHead = document.createElement("tr");
        let thDate = document.createElement("th");
        let thPais = document.createElement("th");
        let thTemperatura = document.createElement("th");
        let thHumedad = document.createElement("th");
        let thViento = document.createElement("th");
        let tbody = document.createElement("tbody");

        tableResponsive.classList.add("table-responsive");
        table.classList.add(...["table", "table-striped"]);

        historial.appendChild(tableResponsive);
        tableResponsive.appendChild(table);
        table.append(thead, tbody);
        thead.appendChild(trHead);
        trHead.append(thDate, thPais, thTemperatura, thHumedad, thViento);

        [thDate, thPais, thTemperatura, thHumedad, thViento].forEach(th => th.setAttribute("scope", "col"));

        thDate.textContent = "Fecha";
        thPais.textContent = "Pais";
        thTemperatura.textContent = "Temperatura";
        thHumedad.textContent = "Humedad";
        thViento.textContent = "Viento";
    }

    let nav = document.createElement("nav");
    let ul = document.createElement("ul");
    ul.classList.add("pagination", "justify-content-center");
    historial.append(nav);
    nav.append(ul);

    let pagina = Math.ceil(busquedasStorage.length / 5);
    const primerValor = pagina / pagina - 1;
    const segundoValor = pagina * 5 / pagina;
    const resultado = busquedasStorage.slice(primerValor, segundoValor);
    resultados(resultado);

    if (pagina >= 5) {
        busquedasStorage.splice(20);
        localStorage.setItem("busquedas_realizadas", JSON.stringify(busquedasStorage));
        pagina = 4;
    }

    for (let i = 0; i < pagina; i++) {
        let li = document.createElement("li");
        let a = document.createElement("a");
        ul.appendChild(li);
        li.appendChild(a);
        li.classList.add("page-item");
        a.classList.add("page-link");
        a.textContent = i + 1;
        a.setAttribute("data-min", i * 5);
        a.setAttribute("data-max", (i + 1) * 5);
    }

    const evento = document.querySelectorAll(".page-link");
    evento.forEach(link => {
        link.addEventListener('click', (e) => {
            const valorMin = parseInt(e.target.getAttribute('data-min'));
            const valorMax = parseInt(e.target.getAttribute('data-max'));
            let tableRows = historial.children[1].children[0].children[1].children;
            Array.from(tableRows).forEach(tr => tr.remove());
            let resultado = busquedasStorage.slice(valorMin, valorMax);
            resultados(resultado);
        });
    })
}

function creacionGrafico(data) {
    const { main, weather, wind, name, date } = data;
    const { temp, temp_max, temp_min, feels_like, humidity, pressure } = main;
    const { icon } = weather[0];
    const { speed } = wind;

    document.querySelector(".container-alert")?.remove();
    document.querySelector("#result")?.parentElement.remove();

    let h2 = document.createElement("h2");
    let section = document.createElement("section");
    let result = document.createElement("div");
    let h3 = document.createElement("h3");
    let timeSpan = document.createElement("span");
    let container = document.createElement("div");
    let divFirst = document.createElement("div");
    let divSecond = document.createElement("div");
    let img = document.createElement("img");
    let extraInfo = document.createElement("div");
    let temperatureSpan = document.createElement("span");
    let minMax = document.createElement("span");
    let feelsLikeSpan = document.createElement("span");
    let humiditySpan = document.createElement("span");
    let pressureSpan = document.createElement("span");
    let windSpan = document.createElement("span");

    let hrFirst = document.createElement("hr");
    let hrSecond = document.createElement("hr");
    let hrThird = document.createElement("hr");

    result.id = "result";
    result.style = `background-color: ${icon[2] === "d" ? '#0081A7;' : '#052934;'}`;
    timeSpan.classList.add("time");
    container.classList.add("search-container");
    divFirst.classList.add("icon-temps-container");
    divSecond.classList.add("temps-container");
    img.classList.add("img-fluid")
    extraInfo.classList.add("extra-info");

    mainSelector.insertBefore(section, historial);
    section.append(h2, result);
    result.append(h3, timeSpan, container);
    container.append(divFirst, extraInfo);
    divFirst.append(img, divSecond);
    divSecond.append(temperatureSpan, minMax);
    extraInfo.append(feelsLikeSpan, hrFirst, humiditySpan, hrSecond, pressureSpan, hrThird, windSpan);

    h2.textContent = `El clima en ${name}`;
    img.src = `https://openweathermap.org/img/wn/${icon}@4x.png`;
    h3.textContent = name;
    timeSpan.textContent = date;
    temperatureSpan.textContent = `${temp}°C`;
    minMax.textContent = `${temp_min}°C / ${temp_max}°C`;
    feelsLikeSpan.textContent = `Sensación térmica ${feels_like}°C`;
    humiditySpan.textContent = `Humedad ${humidity}%`;
    pressureSpan.textContent = `Presión atmosférica ${pressure} hPa`;
    windSpan.textContent = `Vientos ${speed} km/h`;
}

function resultados(resultado) {
    for (let i = 0; i < resultado.length; i++) {
        let tbody = document.querySelector("tbody");
        let trBody = document.createElement("tr");
        let thDate = document.createElement("th");
        let tdPais = document.createElement("td");
        let tdTemperatura = document.createElement("td");
        let tdHumedad = document.createElement("td");
        let tdViento = document.createElement("td");

        tbody.appendChild(trBody);
        thDate.setAttribute("scope", "row");
        trBody.append(thDate, tdPais, tdTemperatura, tdHumedad, tdViento);

        thDate.textContent = resultado[i].date;
        tdPais.textContent = resultado[i].name;
        tdTemperatura.textContent = `${resultado[i].main.temp}°C`;
        tdHumedad.textContent = `${resultado[i].main.humidity}%`;
        tdViento.textContent = `${resultado[i].wind.speed}km/h`;
    }
}

function alertMessage() {
    let alertSelector = document.querySelector(".alert");
    if (!alertSelector) {
        let div = document.createElement("div");
        let alert = document.createElement("div");
        div.classList.add("container-alert");
        alert.classList.add("alert", "alert-danger");
        alert.setAttribute("role", "alert");
        alert.textContent = "No se ha encontrado lo solicitado";
        div.appendChild(alert);
        document.querySelector(".buscador").appendChild(div);
    }
}


function noDataLoading() {
    if (!localStorageData().length) {
        let section = document.createElement("section");
        section.classList.add("data-loader");
        mainSelector.appendChild(section);
        section.innerHTML = `
        <h2 class="titles-no-results">El tiempo en...</h2>
        <span class="d-block mb-3 lead">Todavía no se han realizado búsquedas en la página</span>
        <div id="result" class="placerholder-customize">
                <h3 class="placeholder-glow">
                <span class="placeholder col-3"></span>
                </h3>
            <div class="placeholder-glow">
                <span class="placeholder col-3"></span>
                <div class="d-flex gap-3">
                    <div class="my-3 placeholder col-6" style="height: 200px;"></div>
                    <div class="my-3 placeholder col-6" style="height: 200px;"></div>
                </div>
            </div>
        </div>
        `;
    }
}

// Llamo a las funciones
localStorageData();
historialBusqueda();
noDataLoading();