
const form = document.getElementById("memory-form");
const memoryList = document.getElementById("memory-list");
const memoryCount = document.getElementById("memory-count");

let memories = JSON.parse(
    localStorage.getItem("echoMemories") || "[]"
);

// Save memories
function saveMemories() {
    localStorage.setItem(
        "echoMemories",
        JSON.stringify(memories)
    );
}

// Initialize map
let map;
let markersLayer;

if (
    document.getElementById("memory-map") &&
    typeof L !== "undefined"
) {
    map = L.map("memory-map").setView([26.8467, 80.9462], 12);

    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {
            attribution: '&copy; OpenStreetMap contributors'
        }
    ).addTo(map);

    markersLayer = L.layerGroup().addTo(map);

    setTimeout(() => map.invalidateSize(), 300);
}

// Find location coordinates
async function findCoordinates(location) {
    try {
        const url =
            "https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" +
            encodeURIComponent(location + ", Uttar Pradesh, India");

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Location search failed");
        }

        const data = await response.json();

        if (data.length > 0) {
            return {
                lat: Number(data[0].lat),
                lon: Number(data[0].lon)
            };
        }

        return null;

    } catch (error) {
        console.error("Location error:", error);
        return null;
    }
}

// Display clickable memory pins with beautiful popup
function displayMemoryMarkers() {
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    const bounds = [];

    memories.forEach(memory => {
        if (
            typeof memory.lat !== "number" ||
            typeof memory.lon !== "number"
        ) {
            return;
        }

        const purpleIcon = L.divIcon({
            className: "",
            html: `
                <div class="custom-memory-pin">
                    ✦
                </div>
            `,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -38]
        });

        const marker = L.marker(
            [memory.lat, memory.lon],
            { icon: purpleIcon }
        );

        const popup = document.createElement("div");
        popup.className = "echo-memory-popup";

        if (memory.photo) {
            const photo = document.createElement("img");
            photo.src = memory.photo;
            photo.alt = memory.title;
            photo.className = "popup-memory-photo";
            popup.appendChild(photo);
        }

        const heading = document.createElement("h3");
        heading.textContent = "✦ " + memory.title;

        const place = document.createElement("p");
        place.textContent = "📍 " + memory.location;

        const date = document.createElement("p");
        date.textContent = "📅 " + memory.date;

        const story = document.createElement("p");
        story.textContent = memory.description;
        story.className = "popup-memory-story";

        popup.append(
            heading,
            place,
            date,
            story
        );

        marker.bindPopup(popup, {
            maxWidth: 280,
            className: "echo-popup"
        });

        marker.addTo(markersLayer);

        bounds.push([memory.lat, memory.lon]);
    });

    if (bounds.length > 0) {
        map.fitBounds(bounds, {
            padding: [40, 40],
            maxZoom: 13
        });
    }
}

// Display memory cards
function displayMemories() {
    memoryList.innerHTML = "";

    memories.forEach((memory, index) => {
        const card = document.createElement("div");
        card.className = "memory-card";

        if (memory.photo) {
            const img = document.createElement("img");
            img.src = memory.photo;
            img.alt = memory.title;
            card.appendChild(img);
        }

        const title = document.createElement("h3");
        title.textContent = memory.title;

        const place = document.createElement("p");
        place.textContent = "📍 " + memory.location;

        const description = document.createElement("p");
        description.textContent = memory.description;

        const date = document.createElement("p");
        date.textContent = memory.date;

        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete memory";

        deleteButton.addEventListener("click", () => {
            memories.splice(index, 1);
            saveMemories();
            displayMemories();
        });

        card.append(
            title,
            place,
            description,
            date,
            deleteButton
        );

        memoryList.appendChild(card);
    });

    memoryCount.textContent = memories.length;

    displayMemoryMarkers();
}

// Read uploaded photo
function readPhoto(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;

        reader.readAsDataURL(file);
    });
}

// Save new memory
form.addEventListener("submit", async function(event) {
    event.preventDefault();

    const title = document.getElementById("title").value.trim();
    const location = document.getElementById("location").value.trim();
    const description = document.getElementById("description").value.trim();
    const date = document.getElementById("memory-date").value;

    const photoFile =
        document.getElementById("memory-photo").files[0];

    if (!title || !location || !description || !date) {
        alert("Please fill all memory details!");
        return;
    }

    const submitButton = form.querySelector(
        'button[type="submit"]'
    );

    if (submitButton) {
        submitButton.disabled = true;
    }

    try {
        const photo = await readPhoto(photoFile);

        const coordinates = await findCoordinates(location);

        const newMemory = {
            title,
            location,
            description,
            date,
            photo,
            lat: coordinates ? coordinates.lat : null,
            lon: coordinates ? coordinates.lon : null
        };

        memories.push(newMemory);

        saveMemories();
        displayMemories();

        form.reset();

        if (coordinates) {
            alert("Memory and location pin saved! ✨");
        } else {
            alert("Memory saved, but location pin was not found.");
        }

    } catch (error) {
        console.error("Save error:", error);
        alert("Something went wrong while saving!");
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
        }
    }
});

// Find locations for old memories
async function updateOldMemoryLocations() {
    for (const memory of memories) {
        if (
            typeof memory.lat === "number" &&
            typeof memory.lon === "number"
        ) {
            continue;
        }

        console.log("Searching:", memory.location);

        const coordinates = await findCoordinates(memory.location);

        if (coordinates) {
            memory.lat = coordinates.lat;
            memory.lon = coordinates.lon;

            saveMemories();
            displayMemoryMarkers();

            console.log("Location found:", memory.location);
        } else {
            console.log("Location not found:", memory.location);
        }

        await new Promise(resolve =>
            setTimeout(resolve, 1200)
        );
    }
}

// Initial display
displayMemories();
updateOldMemoryLocations();
