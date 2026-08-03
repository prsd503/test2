import { auth, authenticatedFetch } from "./app.js";
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";[cite: 5]

const API_BASE = "https://unloving-limit-ferry.ngrok-free.dev/api";[cite: 5]
let assignedSociety = "";[cite: 5]

window.closeModal = () => { document.getElementById('customModal').style.display = 'none'; };[cite: 5]
window.showModal = (msg) => {[cite: 5]
    document.getElementById('modalMessage').innerText = msg;[cite: 5]
    document.getElementById('customModal').style.display = 'flex'; [cite: 5]
};

async function initializeGuardPortal(email) {[cite: 5]
    try {
        // Authenticated fetch sends the Bearer token required by the updated /api/guards endpoint[cite: 5]
        const res = await authenticatedFetch(`${API_BASE}/guards?email=${encodeURIComponent(email)}`);[cite: 5]
        const guardsList = await res.json();[cite: 5]
        
        if (guardsList.length === 0) {[cite: 5]
            await signOut(auth);[cite: 5]
            window.showModal("Not Registered as Security Guard");[cite: 5]
            return;[cite: 5]
        }
        
        assignedSociety = guardsList[0].society; [cite: 5]
        
        const societyRes = await authenticatedFetch(`${API_BASE}/guards?society=${encodeURIComponent(assignedSociety)}`);[cite: 5]
        const societyGuards = await societyRes.json();[cite: 5]
        const select = document.getElementById('guardSelect');[cite: 5]
        
        if (select) {[cite: 5]
            select.innerHTML = "";[cite: 5]
            societyGuards.forEach(data => {[cite: 5]
                select.innerHTML += `<option value="${data.name}" data-phone="${data.phone}">${data.name}</option>`;[cite: 5]
            });
        }
        
        document.getElementById('login-section').style.display = 'none';[cite: 5]
        document.getElementById('portalSection').style.display = 'block';[cite: 5]
        document.getElementById('logoutBtn').style.display = 'block';[cite: 5]
    } catch (e) { [cite: 5]
        console.error("Portal load error:", e);[cite: 5]
        window.showModal("Error loading portal profile data.");[cite: 5]
    }
}

// Listen to auth state changes to ensure Firebase has fully restored the user session and token[cite: 5]
onAuthStateChanged(auth, async (user) => {[cite: 5]
    if (user) {[cite: 5]
        await initializeGuardPortal(user.email);[cite: 5]
    } else {
        document.getElementById('login-section').style.display = 'block';[cite: 5]
        document.getElementById('portalSection').style.display = 'none';[cite: 5]
        document.getElementById('logoutBtn').style.display = 'none';[cite: 5]
    }
});

document.getElementById('loginBtn')?.addEventListener('click', async () => {[cite: 5]
    const email = document.getElementById('email')?.value.trim();[cite: 5]
    const pass = document.getElementById('pass')?.value.trim();[cite: 5]
    if (!email || !pass) return window.showModal("Please enter email and password.");[cite: 5]
    
    try {
        await signInWithEmailAndPassword(auth, email, pass);[cite: 5]
        window.showModal("Login successful!");[cite: 5]
    } catch (e) {
        window.showModal("Invalid Credentials");[cite: 5]
    }
});

document.getElementById('activateBtn')?.addEventListener('click', async () => {[cite: 5]
    const select = document.getElementById('guardSelect');[cite: 5]
    if (!select || !assignedSociety) return;[cite: 5]
    
    try {
        const selectedOption = select.options[select.selectedIndex];[cite: 5]
        
        await authenticatedFetch(`${API_BASE}/societies/${encodeURIComponent(assignedSociety)}/active-guard`, {[cite: 5]
            method: 'PATCH',[cite: 5]
            headers: {
                'Content-Type': 'application/json'[cite: 5]
            },
            body: JSON.stringify({ [cite: 5]
                activeGuardName: select.value, [cite: 5]
                activeGuardPhone: selectedOption ? selectedOption.dataset.phone : "" [cite: 5]
            })
        });
        
        window.showModal("Duty activated successfully for " + assignedSociety);[cite: 5]
    } catch (e) {[cite: 5]
        console.error("Activation error:", e);[cite: 5]
        window.showModal("Failed to activate duty.");[cite: 5]
    }
});

document.getElementById('searchBtn')?.addEventListener('click', async () => {[cite: 5]
    const vNum = document.getElementById('vSearch').value.trim().toUpperCase();[cite: 5]
    if (!vNum) return window.showModal("Enter a valid vehicle number.");[cite: 5]

    try {
        const res = await authenticatedFetch(`${API_BASE}/vehicles?societyName=${encodeURIComponent(assignedSociety)}&vehicleNumber=${encodeURIComponent(vNum)}`);[cite: 5]
        const vehicles = await res.json();[cite: 5]
        const resultDiv = document.getElementById('result');[cite: 5]
        
        if (vehicles.length > 0) {[cite: 5]
            const d = vehicles[0];[cite: 5]
            resultDiv.innerHTML = `<div style="font-family: sans-serif;">Flat/Name: <b>${d.flatNumber}</b><br><a href="tel:${d.mobileNumber}">📞 Call: ${d.mobileNumber}</a></div>`;[cite: 5]
        } else {
            window.showModal("No vehicle found for this society.");[cite: 5]
            resultDiv.innerHTML = "";[cite: 5]
        }
    } catch (e) {
        window.showModal("Search error.");[cite: 5]
    }
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => { [cite: 5]
    await signOut(auth);[cite: 5]
    location.reload(); [cite: 5]
});
