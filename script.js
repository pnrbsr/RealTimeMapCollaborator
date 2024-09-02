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
        // Add marker data to Firestore with user info
        addDoc(collection(db, "markers"), {
            lat: lat,
            lng: lng,
            user: userName
        }).catch((error) => {
            console.error("Error adding document: ", error);
        });
    };

    // Function to remove a marker from Firestore and the map
    const removeMarker = (marker, docId) => {
        // Remove the marker from the map
        map.removeLayer(marker);

        // Remove the marker document from Firestore
        deleteDoc(doc(db, "markers", docId)).catch((error) => {
            console.error("Error removing document: ", error);
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

        snapshot.docChanges().forEach((change) => {
            const docId = change.doc.id;
            const { lat, lng, user } = change.doc.data();

            if (change.type === "added") {
                // Add marker to the map
                const marker = L.marker([lat, lng]).addTo(map);

                // Add click event listener for marker removal
                marker.on('click', () => {
                    if (confirm("Do you want to remove this marker?")) {
                        removeMarker(marker, docId);
                    }
                });

                // Update user count
                if (userCounts[user]) {
                    userCounts[user] += 1;
                } else {
                    userCounts[user] = 1;
                }
            } else if (change.type === "removed") {
                // Update user count on removal (not implemented in this example)
            }
        });

        updateDashboard(userCounts);
    });
});