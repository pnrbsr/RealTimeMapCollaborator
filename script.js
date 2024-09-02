// Import Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase configuration (replace with your own configuration)
const firebaseConfig = {
    apiKey: "YAIzaSyCamUurreThom4SOUYUnMu3SgyIA_znYxQ",
    authDomain: "real-time-map-collaborator.firebaseapp.com",
    projectId: "real-time-map-collaborator",
    storageBucket: "real-time-map-collaborator.appspot.com",
    messagingSenderId: "679509207836",
    appId: "1:679509207836:web:f4eaaef3cd6a640541a8d9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map centered on Turkey
    const map = L.map('map').setView([39.9334, 32.8597], 5);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Prompt user for their name (simple implementation for demonstration)
    const userName = prompt("Enter your name:");

    // Function to add a marker to the map and Firestore
    const addMarker = (lat, lng) => {
        // Add marker to the map
        L.marker([lat, lng]).addTo(map);

        // Add marker data to Firestore with user info
        addDoc(collection(db, "markers"), {
            lat: lat,
            lng: lng,
            user: userName
        }).catch((error) => {
            console.error("Error adding document: ", error);
        });
    };

    // Event listener to add a marker on map click
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        addMarker(lat, lng);
    });

    // Initialize the dashboard container
    const dashboard = document.getElementById('dashboard');
    
    // Function to update the dashboard
    const updateDashboard = (userCounts) => {
        dashboard.innerHTML = '<h3>User Dashboard</h3>';
        Object.keys(userCounts).forEach(user => {
            dashboard.innerHTML += `<p>${user}: ${userCounts[user]} cities</p>`;
        });
    };

    // Real-time listener to track markers and update the dashboard
    onSnapshot(collection(db, "markers"), (snapshot) => {
        const userCounts = {};

        snapshot.forEach(doc => {
            const user = doc.data().user;
            if (userCounts[user]) {
                userCounts[user] += 1;
            } else {
                userCounts[user] = 1;
            }
        });

        updateDashboard(userCounts);

        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const { lat, lng } = change.doc.data();
                L.marker([lat, lng]).addTo(map);
            }
        });
    });
});