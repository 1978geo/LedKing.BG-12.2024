
const store = {
    ledPixels: [],
    videoDurations: [],
    locations: []
}

// Configure the forms

registerLocationsHandler('campaign-city', 'campaign-location')

function registerLocationsHandler(cityId, locationId) {
    let city = document.getElementById(cityId);
    let location = document.getElementById(locationId);
    if (location) {
        city.addEventListener('change', () => {
            renderDynamicHtml(
                loadLocationsByCity(city.value),
                locationId,
                '<option value="{{value0}}">{{value0}}</option>',
                ["АДРЕСИ"]
            );
        })
    }
}

const menuItems = document.querySelectorAll('.menu-item');
const forms = document.querySelectorAll('.form');

menuItems.forEach(item => {
    item.addEventListener('click', () => {
        // Remove 'active' class from all menu items and forms
        menuItems.forEach(i => i.classList.remove('active'));
        forms.forEach(f => f.classList.remove('active'));

        // Add 'active' class to the clicked menu item and corresponding form
        item.classList.add('active');
        const formId = item.id.replace('menu-', '');
        let form = document.getElementById(formId);
        form.classList.add('active');

        let homeVideo = document.getElementById("home-video");
        // load the dynamic data for the form
        if (formId === 'campaign') {
            homeVideo.pause();
            renderDynamicSelect(
                loadVideoDurations(),
                'video-duration',
                ["Продължителност на видео клип [сек]"]
            );
            renderDynamicSelect(
                loadCities(),
                'campaign-city',
                ["ГРАДОВЕ"]
            );
        }
        else if (formId === 'buy-led') {
            homeVideo.pause();
            renderDynamicSelect(
                loadPixels(),
                'buy-led-pixel_pitch',
                ["Разстояние между пикселите"]
            );
        }
        else if (formId === 'rent-led') {
            homeVideo.pause();
            renderDynamicSelect(
                loadPixels(),
                'rent-led-pixel_pitch',
                ["Разстояние между пикселите"]
            );
            renderDynamicSelect(
                loadCities(),
                'rent-led-city',
                ["ГРАДОВЕ"]
            );
        }
        else if (formId === 'support-led') {
            homeVideo.pause();
            renderDynamicSelect(
                loadCities(),
                'support-led-city',
                ["ГРАДОВЕ"]
            );
        } else {
            homeVideo.play();
        }
    });
});

// load the CSVs
async function loadCSVToObject(url) {
    try {
        // Fetch the CSV file from the given URL
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('Failed to fetch the CSV file.');
        }

        const csvText = await response.text();

        // Parse the CSV to a JavaScript object
        const rows = csvText.trim().split('\n'); // Split into rows
        const headers = rows[0].split(','); // Use the first row as headers

        const data = rows.slice(1).map(row => {
            const values = row.split(',');
            const obj = {};

            // Map each value to corresponding header
            headers.forEach((header, index) => {
                obj[header] = values[index];
            });

            return obj;
        });

        return data;
    } catch (error) {
        console.error('Error loading or parsing the CSV:', error);
        return null;
    }
}
//
async function loadPixels() {
    if (store.ledPixels.length > 0) {
        return Promise.resolve(store.ledPixels);
    }
    const urlPixels = 'static/ledking.bg-led-pixels.csv'; // Replace with the remote CSV URL
    return loadCSVToObject(urlPixels).then(data => {
        store.ledPixels = data;
        console.log(data);
        return data;
    });
}
//loadUrlPixels();
//
async function loadLocations() {
    if (store.locations.length > 0) {
        return Promise.resolve(store.locations);
    }
    const urlLocations = 'static/ledking.bg-locations.csv'; // Replace with the remote CSV URL
    return loadCSVToObject(urlLocations).then(data => {
        store.locations = data;
        console.log(data);
        return data;
    });
}

async function loadCities() {
    return loadLocations().then(data => uniqueItemsByField(data, "ГРАДОВЕ"));
}

async function loadLocationsByCity(city) {
    return loadLocations().then(data => data.filter(d => d["ГРАДОВЕ"] === city ));
}
//loadLocations()
//
async function loadVideoDurations() {
    if (store.videoDurations.length > 0) {
        return Promise.resolve(store.videoDurations);
    }
    const urlVideoDurations = 'static/ledking.bg-video-durations.csv'; // Replace with the remote CSV URL
    return loadCSVToObject(urlVideoDurations).then(data => {
        store.videoDurations = data;
        console.log(data);
        return data;
    });
}

const uniqueItemsByField = (array, field) => {
    const map = new Map(); // Create a Map to track unique field values
    return array.filter(item => {
        if (!map.has(item[field])) {  // Keep if field not already in Map
            map.set(item[field], true);
            return true; // Include this item
        }
        return false; // Skip this duplicate
    });
};

async function renderDynamicHtml(dataPromise, elementId, htmlTemplate, valueKeys) {
    return dataPromise.then(data => {
        let durations = document.getElementById(elementId);
        durations.innerHTML = ""
        data.forEach(d => {
            let resolvedHtml = htmlTemplate;
            valueKeys.forEach((key, index) => {
                let value = d[key];
                let textKey = `{{value${index}}}`
                resolvedHtml = resolvedHtml.replaceAll(textKey, value);
//                console.log(textKey, value, resolvedHtml)
            })
            durations.innerHTML += resolvedHtml
        });
    })
}

async function renderDynamicSelect(dataPromise, elementId, valueKeys) {
    let template = '<option value="{{value0}}">{{value0}}</option>'
    return renderDynamicHtml(dataPromise, elementId, template, valueKeys)
        .then(v => {
            let select = document.getElementById(elementId);
            select.value = select.options[0].value;
            select.dispatchEvent(new Event('change'));
        })
}

