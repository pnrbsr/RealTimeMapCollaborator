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

// Function to get user's IP address using ipify
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Error fetching IP address:', error);
        return null;
    }
}

// Function to check if the user can create an account based on IP
async function canCreateAccount(ip) {
    const docRef = doc(db, "ipAddresses", ip);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.accountCount >= 5) { // Limit set to 5 accounts per IP
            alert("You have reached the limit of accounts that can be created from this IP address.");
            return false;
        } else {
            // Update the account count for this IP
            await updateDoc(docRef, {
                accountCount: data.accountCount + 1
            });
            return true;
        }
    } else {
        // If IP address is not in the database, add it with accountCount set to 1
        await setDoc(docRef, {
            accountCount: 1
        });
        return true;
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    // Initialize the map centered on Turkey
    const map = L.map('map').setView([39.9334, 32.8597], 5);

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // Array to store references to map markers
    let mapMarkers = [];
    let userName = null;
    let userIP = await getUserIP();

    // Function to prompt the user for their name and check IP restriction
    const promptUserName = async () => {
        if (!userName) {
            const canCreate = await canCreateAccount(userIP);
            if (canCreate) {
                userName = prompt("Enter your name:");
                if (!userName) {
                    alert("You need to enter a name to add markers.");
                }
            }
        }
    };

    // Function to add a marker to the map and Firestore
    const addMarker = (lat, lng) => {
        if (!userName) {
            promptUserName();
        }
        if (userName) {
            // Add marker to the map
            const marker = L.marker([lat, lng]).addTo(map);
            mapMarkers.push(marker);

            // Add marker data to Firestore
            addDoc(collection(db, "markers"), {
                lat: lat,
                lng: lng,
                user: userName
            }).catch((error) => {
                console.error("Error adding document: ", error);
            });
        }
    };

    // Event listener to add a marker on map click
    map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        addMarker(lat, lng);
    });

    // Function to update the dashboard with the top 10 users
    const updateDashboard = async () => {
        // Query to get the top 10 users by number of markers
        const q = query(collection(db, "markers"), orderBy("user"), limit(10));
        const querySnapshot = await getDocs(q);
        const userCounts = {};

        // Count the number of markers for each user
        querySnapshot.forEach(doc => {
            const user = doc.data().user;
            if (userCounts[user]) {
                userCounts[user] += 1;
            } else {
                userCounts[user] = 1;
            }
        });

        // Sort users by the number of places visited (descending order)
        const sortedUsers = Object.keys(userCounts).sort((a, b) => userCounts[b] - userCounts[a]).slice(0, 10);

        // Update the dashboard UI
        const dashboard = document.getElementById('dashboard');
        dashboard.innerHTML = '<h3>User Dashboard - Top 10 Users</h3>';
        sortedUsers.forEach(user => {
            dashboard.innerHTML += `<p>${user}: ${userCounts[user]} places</p>`;
        });
    };

    // Real-time listener to track markers and update the dashboard
    onSnapshot(collection(db, "markers"), (snapshot) => {
        snapshot.docChanges().forEach((change) => {
            if (change.type === "added") {
                const { lat, lng } = change.doc.data();
                L.marker([lat, lng]).addTo(map);
            }
        });
        updateDashboard();
    });

    // Function to reset the board
    const resetBoard = async () => {
        // Remove all markers from Firestore
        const querySnapshot = await getDocs(collection(db, "markers"));
        querySnapshot.forEach((doc) => {
            deleteDoc(doc.ref);
        });

        // Remove all markers from the map
        mapMarkers.forEach(marker => map.removeLayer(marker));
        mapMarkers = [];
        updateDashboard();
    };

    // Add event listener to the reset button
    document.getElementById('resetBoard').addEventListener('click', () => {
        resetBoard();
    });
});
