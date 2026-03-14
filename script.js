let posts = JSON.parse(localStorage.getItem('marketplacePosts')) || [];
let currentUser = JSON.parse(localStorage.getItem('bazaarUser')) || null;

const productForm = document.getElementById('productForm');
const postContainer = document.getElementById('postContainer');
const leadsContainer = document.getElementById('leadsContainer');
const soldContainer = document.getElementById('soldContainer');
const postBtn = document.getElementById('postBtn');
const editIdField = document.getElementById('editId');

window.onload = () => { checkLogin(); };

// --- LOGIN LOGIC ---
async function handleLogin() {
    const name = document.getElementById('loginName').value;
    const imgFile = document.getElementById('loginImg').files[0];
    if(!name) return alert("Naam likhna zaroori hai!");

    let profilePic = 'https://via.placeholder.com/50';
    if(imgFile) {
        profilePic = await toBase64(imgFile);
    }
    currentUser = { name, image: profilePic };
    localStorage.setItem('bazaarUser', JSON.stringify(currentUser));
    checkLogin();
}

function checkLogin() {
    if(currentUser) {
        document.getElementById('loginOverlay').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        updateUserUI();
        showSection('marketSection');
    } else {
        document.getElementById('loginOverlay').style.display = 'flex';
    }
}

function updateUserUI() {
    document.getElementById('userProfileNav').innerHTML = `
        <img src="${currentUser.image}">
        <span>Hi, ${currentUser.name}</span>`;
}

function logout() {
    localStorage.removeItem('bazaarUser');
    location.reload();
}

// --- CORE LOGIC ---
function showSection(sectionId) {
    document.querySelectorAll('.content-section').forEach(sec => sec.style.display = 'none');
    document.getElementById(sectionId).style.display = 'block';
    if (sectionId === 'marketSection') displayMarketplace();
    if (sectionId === 'leadsSection') displayLeads();
    if (sectionId === 'soldSection') displaySoldItems();
}

const toBase64 = file => new Promise((resolve) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
});

productForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const id = editIdField.value;
    const data = {
        name: document.getElementById('prodName').value,
        price: document.getElementById('prodPrice').value,
        quantity: parseInt(document.getElementById('prodQty').value),
        desc: document.getElementById('prodDesc').value,
        address: document.getElementById('prodAddress').value,
        sellerName: currentUser.name,
        sellerImg: currentUser.image
    };

    const pImg = await toBase64(document.getElementById('prodImage').files[0] || new Blob());

    if (id) {
        const index = posts.findIndex(p => p.id == id);
        posts[index] = { ...posts[index], ...data };
        if (pImg.length > 100) posts[index].image = pImg;
    } else {
        posts.push({ id: Date.now(), ...data, image: pImg, comments: [], soldItems: [] });
    }
    saveAndReset();
});

function renderCards(data, container, mode) {
    container.innerHTML = '';
    data.forEach((post) => {
        const remainingStock = post.quantity - post.comments.length;
        const isOutOfStock = remainingStock <= 0;

        const card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px; margin-bottom:10px;">
                <img src="${post.sellerImg}" style="width:30px; height:30px; border-radius:50%;">
                <small><b>${post.sellerName}</b></small>
                <div style="margin-left:auto;">
                    ${mode==='market' && post.sellerName===currentUser.name ? `<button onclick="editPost(${post.id})">✏️</button>` : ''}
                </div>
            </div>
            <img src="${post.image}" style="width:100%; height:150px; object-fit:cover; border-radius:5px;">
            <h3>${post.name}</h3>
            <p style="color:#27ae60; font-weight:bold; margin:0;">₹${post.price}</p>
            <p style="font-size:12px;">Stock: ${isOutOfStock ? 'SOLD OUT' : remainingStock}</p>
        `;

        if (mode === 'market') {
            card.innerHTML += `
                <button onclick="addReply(${post.id})" ${isOutOfStock ? 'disabled' : ''} 
                    style="width:100%; background:${isOutOfStock?'#ccc':'#27ae60'}; color:white; border:none; padding:10px; border-radius:5px; margin-top:10px; cursor:pointer;">
                    ${isOutOfStock ? 'Stock Khatam' : 'Interest Dikhaein'}
                </button>`;
        } else if (mode === 'leads') {
            card.innerHTML += post.comments.map((c, i) => `
                <div style="background:#f1f1f1; padding:8px; margin-top:5px; border-radius:4px; font-size:12px;">
                    <b>${c.buyerName}</b> wants this!
                    ${c.isRated ? '✅ Rated' : `<button onclick="openRatingForm(${post.id}, ${i})" style="float:right; background:#f39c12; color:white; border:none; padding:2px 5px; border-radius:3px;">Mark & Rate</button>`}
                </div>`).join('');
        } else if (mode === 'sold') {
            card.innerHTML += post.soldItems.map(si => `
                <div style="border-top:1px solid #eee; margin-top:10px; padding-top:5px;">
                    <small>Buyer: ${si.buyerName}</small><br>
                    <span style="color:#f1c40f;">${'★'.repeat(si.rating)}</span>
                    <p style="font-size:11px; margin:0;">"${si.review}"</p>
                </div>`).join('');
        }
        container.appendChild(card);
    });
}

function addReply(postId) {
    const index = posts.findIndex(p => p.id == postId);
    const post = posts[index];
    if (post.comments.length >= post.quantity) return alert("Sold Out!");
    
    const addr = prompt("Apna Pickup Pata/Time bhariye:", "Main kal 2 baje aaunga");
    if(!addr) return;

    posts[index].comments.push({ buyerName: currentUser.name, buyerImg: currentUser.image, msg: addr, isRated: false });
    localStorage.setItem('marketplacePosts', JSON.stringify(posts));
    alert("Seller ko aapka naam bhej diya gaya hai!");
    displayMarketplace();
}

function openRatingForm(postId, cIndex) {
    const index = posts.findIndex(p => p.id == postId);
    const buyer = posts[index].comments[cIndex];
    const rating = prompt(`Rate ${buyer.buyerName} (1-5):`, "5");
    const review = prompt(`Review:`, "Good buyer!");
    
    posts[index].comments[cIndex].isRated = true;
    posts[index].soldItems.push({ buyerName: buyer.buyerName, rating: parseInt(rating), review });
    localStorage.setItem('marketplacePosts', JSON.stringify(posts));
    showSection('soldSection');
}

function displayMarketplace() { renderCards(posts, postContainer, 'market'); }
function displayLeads() { renderCards(posts.filter(p => p.comments.length > 0), leadsContainer, 'leads'); }
function displaySoldItems() { renderCards(posts.filter(p => p.soldItems.length > 0), soldContainer, 'sold'); }

function editPost(id) {
    const post = posts.find(p => p.id == id);
    document.getElementById('prodName').value = post.name;
    document.getElementById('prodPrice').value = post.price;
    document.getElementById('prodQty').value = post.quantity;
    document.getElementById('prodAddress').value = post.address;
    editIdField.value = post.id;
    postBtn.innerText = "Update Karein";
    showSection('sellSection');
}

function saveAndReset() {
    localStorage.setItem('marketplacePosts', JSON.stringify(posts));
    productForm.reset();
    editIdField.value = "";
    postBtn.innerText = "Post Karein";
    showSection('marketSection');
}