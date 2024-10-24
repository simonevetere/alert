map = L.map('map').setView([44.700724, 8.035779], 13);

var old_zoom = 13;

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

function getCoordinates(custom = "") {
    var city = document.getElementById('cityInput').value;
    
    if(custom != ""){
        city = custom;
    }

    // Nominatim API endpoint for city search
    var url = 'https://nominatim.openstreetmap.org/search?q=' + city + '&format=json';

    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                var lat = data[0].lat;
                var lng = data[0].lon;

                document.getElementById('lat').value = lat;
                document.getElementById('lng').value = lng;

                // Update map view if already created
                if (map) {
                    map.setView([lat, lng], 13);
                } else {
                    // Create map only the first time
                    map = L.map('map').setView([lat, lng], 13);
                    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }).addTo(map);
                }

                // Remove existing marker (if any)
                map.eachLayer(function(layer) {
                    if (layer instanceof L.Marker) {
                        map.removeLayer(layer);
                    }
                });

                getEvents();

                var marker = L.marker([lat, lng]).addTo(map);
                marker.bindPopup(city).openPopup();
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function getEvents() {
    // Replace with your actual API endpoint and authentication (if needed)
    var url = 'https://db.casasmart.me/select';
    
    let filterData = document.getElementById('filterData').value;
    let filterCategory = document.getElementById('filterCategory').value;
    let filterName = document.getElementById('filterName').value;

    var data = {
        'nome': filterName,
        'categoria': filterCategory,
        'inizio': filterData,
        'fine': filterData
    };


    // Remove existing marker (if any)
    map.eachLayer(function(layer) {
        if (layer instanceof L.Circle) {
            map.removeLayer(layer);
        }
    });

    fetch(url, {
        method: 'POST', // Adjust to match API's requirement (GET/POST)
        headers: {
            'Content-Type': 'application/json' // Adjust content type if necessary
        },
        body: JSON.stringify(data)
    })
        .then(response => response.json())
        .then(data => {
            if (data.length > 0) {
                // Extract the array element from the string
                for (var i = 0; i < data.length; i++) {
                    var event = data[i];
                    var lat = event.coordinate.split(',')[0].trim(); // Extract latitude from coordinate string
                    var lng = event.coordinate.split(',')[1].trim(); // Extract longitude from coordinate string
                                    
                    var category = event.categoria; // Ottieni la categoria dell'evento

                    var circleColor;
                    switch (category) {
                      case "evento_pubblico":
                        circleColor = 'blue';
                        break;
                      case "festa_privata":
                        circleColor = 'green';
                        break;
                      case "allerta":
                        circleColor = 'red';
                        break;
                      default:
                        circleColor = 'black'; // Colore predefinito per categorie non riconosciute
                    }

                    var circle = L.circle([lat, lng], {
                        radius: event.km,
                        color: circleColor,
                        fillColor: circleColor,
                        fillOpacity: 0.1
                    }).addTo(map);

                    circle.bindPopup(
                        `<b>${event.nome}</b><br>
                         Inizio: ${event.inizio}<br>
                         Fine: ${event.fine}<br>
                         Categoria: ${event.categoria}` // Display event details in popup
                    );

                    // Create event list item
                    var eventItem = document.createElement('div');
                    eventItem.className = 'event-item';
                    eventItem.innerHTML = `<b>${event.nome}</b><br> Inizio: ${event.inizio}<br> Fine: ${event.fine}<br> Categoria: ${event.categoria}`;
                    eventList.appendChild(eventItem);
                }
            } else {
                console.log('No events found.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });
}


// Funzione per aprire il popup del form
function openEventForm() {
    document.getElementById('eventFormPopup').style.display = 'block';
}

// Funzione per chiudere il popup del form
function closeEventForm() {
    document.getElementById('eventFormPopup').style.display = 'none';
}

// Funzione per aggiungere un nuovo evento
function addEvent() {

    // Ottieni i valori dal form
    const eventName = document.getElementById('eventName').value;
    const eventStart = document.getElementById('eventStart').value;
    const eventEnd = document.getElementById('eventEnd').value;
    const eventCategory = document.getElementById('eventCategory').value;
    const eventCoordinates = document.getElementById('eventCoordinates').value;
    const myRange = document.getElementById('myRange').value;
    const lat = parseFloat(eventCoordinates[0]);
    const lng = parseFloat(eventCoordinates[1]);

    let datediff = Math.floor((Date.parse(eventEnd) - Date.parse(eventStart)) / (1000*60*60*24))
    
    var today = new Date();
    var dd = String(today.getDate()).padStart(2, '0');
    var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = today.getFullYear();

    today = mm + '/' + dd + '/' + yyyy;
    
    let datedifftoday = Math.floor((Date.parse(eventStart) - Date.parse(today)) / (1000*60*60*24))

    if(datedifftoday < 0){
        alert('l\'evento può iniziare da oggi - The event can start from today');

        document.getElementById('eventStart').value = "";

        return false;
    }

    if(datediff < 0 || datediff > 4){
        alert('l\'evento può durare 3 giorni - The event can last 3 days');

        document.getElementById('eventStart').value = "";
        document.getElementById('eventEnd').value = "";

        return false;
    }

    // Crea un nuovo oggetto evento
    const coordinate = `'${lat}, ${lng}'`;
    // Invia una richiesta POST al tuo endpoint per aggiungere l'evento
    var url = 'https://db.casasmart.me/insert';
    var data = {
        'nome': eventName,
        'coordinate': eventCoordinates,
        'categoria': eventCategory,
        'inizio': eventStart,
        'fine': eventEnd,
        'km': myRange * 1000
    };
    fetch(url, {
        method: 'POST', // Adjust to match API's requirement (GET/POST)
        headers: {
            'Content-Type': 'application/json' // Adjust content type if necessary
        },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        console.log('Evento aggiunto:', data);
        
        // Aggiorna la mappa con il nuovo evento (se necessario)
        getEvents();
    })
    .catch(error => {
        console.error('Errore nell\'aggiunta dell\'evento:', error);
    });

    //closeEventForm(); // Chiudi il popup
}

// Call the function to fetch events on page load
getEvents();

// popolare le coordinate
function popolaCoordinates() {
    var input = document.getElementById('cityInput');
    input.focus();
    input.select();
    let address = document.getElementById('cityInput').value;
    getCoordinates(address);
    setTimeout(() => popolaselect(), 2000);
}

function popolaselect(){

    let lat = document.getElementById('lat').value;
    let lng = document.getElementById('lng').value;
    let coordinate = "Not found";
    document.getElementById('eventCoordinates').value = "";

    if(lat != undefined){
        let coordinate = lat.toString() + ", " + lng.toString();

        document.getElementById('eventCoordinates').value = coordinate;
    }
}

function checkcoodinate(){
 if(document.getElementById('eventCoordinates').value == ""){
    alert("prima popolare le coordinate - first populate the coordinates");
 }
}

function showmap(){
    document.getElementById('eventName').style.display = 'none';
    document.getElementById('eventStart').style.display = 'none';
    document.getElementById('eventEnd').style.display = 'none';
    document.getElementById('eventCategory').style.display = 'none';
    document.getElementById('eventCoordinates').style.display = 'none';
    document.getElementById('salva').style.display = 'none';
    document.getElementById('myRange').style.display = 'none';
    document.getElementById('rangeLabel').style.display = 'none';
    document.getElementById('eventFormPopup').style.background = 'transparent';
    document.getElementById('confermaposizione').style.background = 'transparent';
    document.getElementById('popupinsevent').style.background = 'transparent';
    document.getElementById('confermaposizione').style.display = 'block';
    document.getElementById('confermaposizione').style.background = '';
    document.getElementById('annullaposizione').style.display = 'block';
    document.getElementById('annullaposizione').style.background = '';
    document.getElementById('scegliposizione').style.display = 'block';
    document.getElementById('scegliposizione').style.background = '';
    document.getElementById('popupinsevent').style.border = '0px';
}

function resetcss(){
    document.getElementById('eventName').style.display = 'block';
    document.getElementById('eventStart').style.display = 'block';
    document.getElementById('eventEnd').style.display = 'block';
    document.getElementById('eventCategory').style.display = 'block';
    document.getElementById('eventCoordinates').style.display = 'block';
    document.getElementById('salva').style.display = 'block';
    document.getElementById('myRange').style.display = 'block';
    document.getElementById('rangeLabel').style.display = 'block';
    document.getElementById('eventFormPopup').style.background = 'rgba(0, 0, 0, 0.5)';
    document.getElementById('popupinsevent').style.background = '#fefefe';
    document.getElementById('confermaposizione').style.display = 'none';
    document.getElementById('confermaposizione').style.background = 'transparent';
    document.getElementById('annullaposizione').style.display = 'none';
    document.getElementById('annullaposizione').style.background = 'transparent';;
    document.getElementById('scegliposizione').style.display = 'none';
    document.getElementById('scegliposizione').style.background = 'transparent';
    document.getElementById('popupinsevent').style.border = '0px';
}

document.addEventListener('DOMContentLoaded', (event) => {
    const rangeInput = document.getElementById('myRange');
    const rangeValue = document.getElementById('rangeLabel');

    rangeInput.addEventListener('input', () => {
        rangeValue.innerText = 'range : ' + rangeInput.value + " Km";
    });
});


function updateRange(){
    let km = document.getElementById('myRange').value;
    console.log(km);
    document.getElementById('rangeLabel').value = km + " km";

}

map.on('click', function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;

    // Remove existing marker (if any)
    map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    document.getElementById('lat').value = lat;
    document.getElementById('lng').value = lng;


    if(lat != undefined){
        let coordinate = lat.toString() + ", " + lng.toString();

        document.getElementById('eventCoordinates').value = coordinate;
    }

    console.log('You clicked at:', lat, lng);

    // Do something with the coordinates, e.g., display them on the map
    L.marker([lat, lng]).addTo(map);
});

function openEventForm() {
    document.getElementById('eventFormPopup').style.display = 'block';
}

function closeEventForm() {
    document.getElementById('eventFormPopup').style.display = 'none';
}

function openFilterForm() {
    document.getElementById('filterFormPopup').style.display = 'block';
}

function closeFilterForm() {
    document.getElementById('filterFormPopup').style.display = 'none';
}

function filterEvents(event) {
    event.preventDefault();
    
    getEvents();

    // Close the filter form after submitting
    closeFilterForm();

}

function showmap_() { 
  let map = document.getElementById('map');
  let cityInput = document.getElementById('cityInput');
  cityInput.style = "z-index : 1000";
  if (map.style.display === 'none') {
    map.style.display = 'block';
  } else {
    map.style.display = 'none';
  }

  let eventList = document.getElementById('eventList');
  console.log(eventList.style.display);
  if (eventList.style.display === 'block') {
    eventList.style.display = 'none';
  } else {
    eventList.style.display = 'block';
  }
}

function mostraricerca() { 
    let ricerca = document.getElementById('ricerca');
    
    ricerca.style.display = 'block';
    ricerca.style.position = 'fixed';
}

function togliricerca() { 
    let ricerca = document.getElementById('ricerca');
    
    ricerca.style.display = 'none';
    ricerca.style.position = '';
}
