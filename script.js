// Firebase Configuration (Yahan apni details bhariye)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

let currentUser = JSON.parse(localStorage.getItem('bazaarUser')) || null;

// --- LOGIN CHECK ---
window.onload = () => { checkLogin(); };

function checkLogin() {
    if(currentUser) {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        updateUserUI();
        fetchPosts(); // Cloud se data layein
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
    }
}

// --- POST SUBMIT (CLOUD PAR SAVE KARNA) ---
productForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const pImg = await toBase64(document.getElementById('prodImage').files[0] || new Blob());

    const newPostData = {
        name: document.getElementById('prodName').value,
        price: document.getElementById('prodPrice').value,
        quantity: parseInt(document.getElementById('prodQty').value),
        address: document.getElementById('prodAddress').value,
        sellerName: currentUser.name,
        sellerImg: currentUser.image,
        sellerId: currentUser.name + currentUser.image.slice(-10), // Unique ID
        image: pImg,
        comments: [],
        soldItems: []
    };

    const postsRef = ref(db, 'posts/');
    const newPostRef = push(postsRef);
    set(newPostRef, newPostData);

    productForm.reset();
    alert("Post Live Ho Gaya!");
    showSection('marketSection');
});

// --- DATA FETCH (SABKE LIYE) ---
function fetchPosts() {
    const postsRef = ref(db, 'posts/');
    onValue(postsRef, (snapshot) => {
        const data = snapshot.val();
        const postsArray = data ? Object.keys(data).map(key => ({ id: key, ...data[key] })) : [];
        renderCards(postsArray);
    });
}

function renderCards(postsArray) {
    const container = document.getElementById('postContainer');
    container.innerHTML = '';

    postsArray.forEach(post => {
        const isMyPost = post.sellerName === currentUser.name; // Check agar mera post hai
        const remainingStock = post.quantity - (post.comments ? Object.keys(post.comments).length : 0);

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <img src="${post.sellerImg}" style="width:30px; height:30px; border-radius:50%;">
                <small><b>${post.sellerName} ${isMyPost ? '(Aapka Post)' : ''}</b></small>
            </div>
            <img src="${post.image}" style="width:100%; height:150px; object-fit:cover; border-radius:5px;">
            <h3>${post.name}</h3>
            <p>₹${post.price}</p>
            <p>Stock: ${remainingStock}</p>
            
            ${isMyPost 
                ? `<p style="color:orange; font-size:12px;">Aap apne post par reply nahi kar sakte.</p>` 
                : `<button onclick="addReply('${post.id}')" ${remainingStock <= 0 ? 'disabled' : ''} 
                    style="width:100%; background:#27ae60; color:white; border:none; padding:10px; cursor:pointer;">
                    ${remainingStock <= 0 ? 'Sold Out' : 'Interest Dikhaein'}
                </button>`
            }
        `;
        container.appendChild(card);
    });
}

// --- REPLY LOGIC (SABKO DIKHEGA) ---
function addReply(postId) {
    const addr = prompt("Apna Pata/Time likhein:");
    if(!addr) return;

    const replyRef = ref(db, `posts/${postId}/comments/`);
    push(replyRef, {
        buyerName: currentUser.name,
        msg: addr
    });
    alert("Reply bhej diya gaya!");
}
