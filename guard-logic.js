import { auth, authenticatedFetch } from "./app.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const API_BASE = "https://unloving-limit-ferry.ngrok-free.dev/api";
let assignedSociety = "";

window.closeModal = () => { document.getElementById('customModal').style.display = 'none'; };
window.showModal = (msg) => {
    document.getElementById('modalMessage').innerText = msg;
    document.getElementById('customModal').style.display = 'flex'; 
};

async function initializeGuardPortal(email) {
    try {
        const res = await authenticatedFetch(`${API_BASE}/guards?email=${encodeURIComponent(email)}`);
        const guardsList = await res.json();
        
        if (guardsList.length === 0) {
            await signOut(auth);
            window.showModal("Not Registered as Security Guard");
            return;
        }
        
        assignedSociety = guardsList[0].society; 
        
        const societyRes = await authenticatedFetch(`${API_BASE}/guards?society=${encodeURIComponent(assignedSociety)}`);
        const societyGuards = await societyRes.json();
        const select = document.getElementById('guardSelect');
        
        if (select) {
            select.innerHTML = "";
            societyGuards.forEach(data => {
                select.innerHTML += `<option value="${data.name}" data-phone="${data.phone}">${data.name}</option>`;
            });
        }
        
        document.getElementById('login-section').style.display = 'none';
        document.getElementById('portalSection').style.display = 'block';
        document.getElementById('logoutBtn').style.display = 'block';
    } catch (e) { 
        window.showModal("Error loading portal profile data.");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    onAuthStateChanged(auth, async (user) => {
        if (user) await initializeGuardPortal(user.email);
    });
});

document.getElementById('loginBtn')?.addEventListener('click', async () => {
    const email = document.getElementById('email')?.value.trim();
    const pass = document.getElementById('pass')?.value.trim();
    if (!email || !pass) return window.showModal("Please enter email and password.");
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);
        window.showModal("Login successful!");
    } catch (e) {
        window.showModal("Invalid Credentials");
    }
});

document.getElementById('activateBtn')?.addEventListener('click', async () => {
    const select = document.getElementById('guardSelect');
    if (!select || !assignedSociety) return;
    
    try {
        const selectedOption = select.options[select.selectedIndex];
        await authenticatedFetch(`${API_BASE}/societies/${encodeURIComponent(assignedSociety)}/active-guard`, {
            method: 'PATCH',
            body: JSON.stringify({ activeGuardName: select.value, activeGuardPhone: selectedOption ? selectedOption.dataset.phone : "" })
        });
        window.showModal("Duty activated successfully for " + assignedSociety);
    } catch (e) {
        window.showModal("Failed to activate duty.");
    }
});

document.getElementById('searchBtn')?.addEventListener('click', async () => {
    const vNum = document.getElementById('vSearch').value.trim().toUpperCase();
    if (!vNum) return window.showModal("Enter a valid vehicle number.");

    try {
        const res = await authenticatedFetch(`${API_BASE}/vehicles?societyName=${encodeURIComponent(assignedSociety)}&vehicleNumber=${encodeURIComponent(vNum)}`);
        const vehicles = await res.json();
        const resultDiv = document.getElementById('result');
        
        if (vehicles.length > 0) {
            const d = vehicles[0];
            resultDiv.innerHTML = `<div style="font-family: sans-serif;">Flat/Name: <b>${d.flatNumber}</b><br><a href="tel:${d.mobileNumber}">📞 Call: ${d.mobileNumber}</a></div>`;
        } else {
            window.showModal("No vehicle found for this society.");
            resultDiv.innerHTML = "";
        }
    } catch (e) {
        window.showModal("Search error.");
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => { 
    await signOut(auth);
    location.reload(); 
});
