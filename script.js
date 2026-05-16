/* 
    DOODLE FUEL Core Logic
    Handling Global Project Synchronization & Admin Interactivity
*/

let projects = [];
let isUnlocked = false;
let activeTab = 'dashboard';

const STORAGE_KEY = 'studio_dev_projects_v1';
const PIN_KEY = 'studio_dev_admin_pin_v1';
const DEFAULT_PIN = 'BHHB';

document.addEventListener('DOMContentLoaded', async () => {
    await initData();
    initAdminTabs();
    renderContent();
});

// --- DATA LAYER ---
async function initData() {
    // 1. Try to fetch the global projects file from GitHub/Server
    try {
        const response = await fetch('projects.json?t=' + Date.now());
        if (response.ok) {
            const globalData = await response.json();
            // If we have global data, and no local "drafts", use global
            if (!localStorage.getItem(STORAGE_KEY)) {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(globalData));
            }
            projects = globalData;
        }
    } catch (e) {
        console.log("No global projects.json found, using local storage.");
    }

    // 2. Load the current working version (Draft) from LocalStorage
    const localData = localStorage.getItem(STORAGE_KEY);
    if (localData) {
        projects = JSON.parse(localData);
    }
}

function getProjects() {
    return projects;
}

function saveProject(project) {
    projects.unshift(project);
    syncLocal();
    renderContent();
}

function deleteProject(id) {
    projects = projects.filter(p => p.id !== id);
    syncLocal();
    renderContent();
}

function syncLocal() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

// --- RENDERING ENGINE ---
function renderContent() {
    renderProjectGrid();
    renderAdminView();
}

function renderProjectGrid() {
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    grid.innerHTML = projects.map((p, index) => `
        <div onclick="${p.link ? `window.open('${p.link}', '_blank')` : ''}" class="group cursor-pointer ${index % 2 !== 0 ? 'md:mt-40' : ''}">
            <div class="aspect-[16/10] bg-surface-container-low overflow-hidden relative border border-outline-variant/30">
                <img src="${p.image}" alt="${p.title}" class="w-full h-full object-cover grayscale group-hover:scale-110 group-hover:grayscale-0 transition-all duration-[1.5s]">
                <div class="absolute inset-0 bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span class="px-8 py-3 bg-white text-black font-label-caps text-[10px] tracking-widest uppercase">View Project</span>
                </div>
            </div>
            <div class="mt-10 flex justify-between items-start">
                <div class="space-y-2">
                    <h3 class="text-3xl font-light">${p.title}</h3>
                    <div class="flex gap-4">
                        ${(p.tags || []).map(t => `<span class="font-label-caps text-[10px] text-outline uppercase tracking-widest">${t}</span>`).join('')}
                    </div>
                </div>
                <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors group-hover:translate-x-1 group-hover:-translate-y-1">arrow_outward</span>
            </div>
        </div>
    `).join('');
}

// --- ADMIN PANEL LOGIC ---
function initAdminTabs() {
    const btns = document.querySelectorAll('.admin-tab-btn');
    btns.forEach(btn => {
        btn.addEventListener('click', () => {
            if (!isUnlocked) return;
            btns.forEach(b => b.classList.remove('active', 'text-white'));
            btns.forEach(b => b.classList.add('text-outline'));
            btn.classList.add('active', 'text-white');
            btn.classList.remove('text-outline');
            activeTab = btn.dataset.tab;
            renderAdminView();
        });
    });

    window.addEventListener('keydown', (e) => {
        if (e.shiftKey && (e.key === 'A' || e.key === 'a')) {
            const overlay = document.getElementById('adminOverlay');
            if (overlay) {
                e.preventDefault();
                document.body.classList.toggle('admin-active');
                if (document.body.classList.contains('admin-active')) {
                    renderAdminView();
                }
            }
        }
    });
}

function renderAdminView() {
    const content = document.getElementById('admin-content');
    const sidebar = document.querySelector('.admin-panel aside');
    if (!content) return;

    if (!isUnlocked) {
        if (sidebar) sidebar.style.display = 'none';
        renderLockScreen(content);
        return;
    }

    if (sidebar) sidebar.style.display = 'block';
    
    if (activeTab === 'dashboard') {
        renderDashboard(content);
    } else if (activeTab === 'projects') {
        renderProjectsManager(content);
    } else if (activeTab === 'settings') {
        renderSettings(content);
    }
}

function renderLockScreen(container) {
    container.innerHTML = `
        <div class="flex flex-col items-center justify-center h-full space-y-8">
            <div class="text-center">
                <span class="material-symbols-outlined text-6xl text-primary mb-4 animate-pulse">lock</span>
                <h2 class="text-2xl font-mono tracking-widest uppercase">Encrypted Access</h2>
                <p class="text-[10px] text-outline uppercase tracking-[0.3em] mt-2">Enter 4-Digit Encryption Key</p>
            </div>
            <div class="flex gap-4">
                <input type="password" maxlength="4" id="pin-input" autofocus
                    class="bg-background border border-outline-variant text-center text-4xl w-48 py-4 focus:outline-none focus:border-primary font-mono tracking-[1em]">
            </div>
            <div id="pin-error" class="text-error text-[10px] uppercase tracking-widest h-4"></div>
            <button onclick="handleUnlock()" class="px-12 py-3 border border-outline-variant hover:bg-white hover:text-black transition-all font-bold text-[10px] tracking-widest uppercase">Decrypt System</button>
        </div>
    `;
    const input = document.getElementById('pin-input');
    input.addEventListener('keypress', (e) => { if(e.key === 'Enter') handleUnlock(); });
}

window.handleUnlock = function() {
    const input = document.getElementById('pin-input');
    const error = document.getElementById('pin-error');
    const savedPin = localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
    
    if (input.value.toUpperCase() === savedPin.replace(/\s/g, '').toUpperCase()) {
        isUnlocked = true;
        renderAdminView();
    } else {
        error.innerText = "ACCESS DENIED // INVALID KEY";
        input.value = "";
        setTimeout(() => { error.innerText = ""; }, 2000);
    }
};

function renderDashboard(container) {
    container.innerHTML = `
        <header class="flex justify-between items-end">
            <div>
                <h2 class="text-3xl font-light mb-2">Production Core</h2>
                <p class="text-outline text-sm">Active pipelines and infrastructure health.</p>
            </div>
            <button class="bg-white text-black px-6 py-2 text-[10px] font-bold tracking-widest uppercase" onclick="switchTab('projects')">New Project</button>
        </header>
        <div class="grid grid-cols-3 gap-6">
            <div class="p-6 border border-outline-variant bg-surface-container">
                <span class="text-[10px] font-label-caps text-outline block mb-4">TOTAL PROJECTS</span>
                <span class="text-3xl font-mono">${projects.length}</span>
            </div>
            <div class="p-6 border border-outline-variant bg-surface-container">
                <span class="text-[10px] font-label-caps text-outline block mb-4">SYSTEM STATUS</span>
                <span class="text-3xl font-mono">STABLE</span>
            </div>
            <div class="p-6 border border-outline-variant bg-surface-container">
                <span class="text-[10px] font-label-caps text-outline block mb-4">UPTIME</span>
                <span class="text-3xl font-mono">99.9%</span>
            </div>
        </div>

        <div class="p-8 border border-primary/30 bg-primary/5 space-y-6">
            <div>
                <h3 class="text-lg font-light mb-2 text-primary">Global Deployment</h3>
                <p class="text-sm text-outline">To make your changes visible to the world, click the button below to download your updated project file. Then, simply upload it to your GitHub repository.</p>
            </div>
            <button onclick="publishToGitHub()" class="flex items-center gap-4 bg-primary text-background px-8 py-4 text-[10px] font-bold tracking-widest uppercase hover:opacity-90 transition-opacity">
                <span class="material-symbols-outlined">publish</span>
                Publish Changes to World
            </button>
        </div>

        <div class="border border-outline-variant">
            <div class="bg-surface-container p-4 border-b border-outline-variant flex justify-between items-center">
                <span class="text-[10px] font-label-caps uppercase tracking-widest">Active Jobs</span>
                <span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            </div>
            <div class="divide-y divide-outline-variant">
                ${projects.map(p => `
                    <div class="p-6 flex justify-between items-center">
                        <div class="space-y-1">
                            <div class="text-sm font-mono text-white">${p.title.toUpperCase().replace(/\s+/g, '_')}</div>
                            <div class="text-[10px] text-outline">${p.status || 'STABLE DEPLOYMENT'}</div>
                        </div>
                        <div class="text-[10px] font-mono text-primary">LIVE NOW</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function renderProjectsManager(container) {
    container.innerHTML = `
        <header class="mb-12">
            <h2 class="text-3xl font-light mb-2">Project Manager</h2>
            <p class="text-outline text-sm">Create and manage your case studies.</p>
        </header>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div class="space-y-6 p-8 border border-outline-variant bg-surface-container-low">
                <h3 class="font-label-caps text-[10px] tracking-widest uppercase text-primary">Add New Project</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] text-outline uppercase tracking-widest mb-2">Project Title</label>
                        <input type="text" id="new-title" class="w-full bg-background border border-outline-variant p-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. Phoenix Dashboard">
                    </div>
                    <div>
                        <label class="block text-[10px] text-outline uppercase tracking-widest mb-2">Image URL</label>
                        <input type="text" id="new-image" class="w-full bg-background border border-outline-variant p-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="https://images.unsplash.com/...">
                    </div>
                    <div>
                        <label class="block text-[10px] text-outline uppercase tracking-widest mb-2">Project URL (Deployed Link)</label>
                        <input type="text" id="new-link" class="w-full bg-background border border-outline-variant p-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="https://doodlefuel.com/project">
                    </div>
                    <div>
                        <label class="block text-[10px] text-outline uppercase tracking-widest mb-2">Tags (Comma separated)</label>
                        <input type="text" id="new-tags" class="w-full bg-background border border-outline-variant p-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="UI/UX, Backend, AI">
                    </div>
                    <button onclick="handleAddProject()" class="w-full bg-white text-black py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-primary transition-colors mt-4">Initialize Deployment</button>
                </div>
            </div>

            <div class="space-y-4">
                <h3 class="font-label-caps text-[10px] tracking-widest uppercase text-outline">Registry</h3>
                <div class="divide-y divide-outline-variant border border-outline-variant">
                    ${projects.map(p => `
                        <div class="p-4 flex justify-between items-center bg-surface-container-lowest">
                            <span class="text-sm font-mono">${p.title}</span>
                            <button onclick="deleteProject('${p.id}')" class="text-error hover:text-white transition-colors">
                                <span class="material-symbols-outlined text-sm">delete</span>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

window.handleAddProject = function() {
    const title = document.getElementById('new-title').value;
    const image = document.getElementById('new-image').value;
    const link = document.getElementById('new-link').value;
    const tags = document.getElementById('new-tags').value.split(',').map(t => t.trim()).filter(t => t);

    if (!title || !image) return alert('Title and Image are required.');

    saveProject({
        id: Date.now().toString(),
        title,
        image,
        link,
        tags,
        status: 'NEW_DEPLOYMENT // SYNC_SUCCESS'
    });
};

window.publishToGitHub = function() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projects, null, 4));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href",     dataStr);
    downloadAnchorNode.setAttribute("download", "projects.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    alert("Project data downloaded! Now upload this 'projects.json' file to your GitHub repository to update the website for everyone.");
};

window.switchTab = function(tab) {
    const btn = document.querySelector(`.admin-tab-btn[data-tab="${tab}"]`);
    if (btn) btn.click();
};

function renderSettings(container) {
    const currentPin = localStorage.getItem(PIN_KEY) || DEFAULT_PIN;
    container.innerHTML = `
        <header class="mb-12">
            <h2 class="text-3xl font-light mb-2">System Settings</h2>
            <p class="text-outline text-sm">Configure security and environment variables.</p>
        </header>
        <div class="max-w-md space-y-8">
            <div class="p-8 border border-outline-variant bg-surface-container-low">
                <h3 class="font-label-caps text-[10px] tracking-widest uppercase text-primary mb-6">Security Override</h3>
                <div class="space-y-4">
                    <div>
                        <label class="block text-[10px] text-outline uppercase tracking-widest mb-2">Current PIN</label>
                        <input type="text" value="${currentPin}" disabled class="w-full bg-background/50 border border-outline-variant/30 p-3 text-sm opacity-50 cursor-not-allowed">
                    </div>
                    <div>
                        <label class="block text-[10px] text-outline uppercase tracking-widest mb-2">New 4-Digit PIN</label>
                        <input type="text" id="new-pin" maxlength="4" class="w-full bg-background border border-outline-variant p-3 text-sm focus:outline-none focus:border-primary transition-colors" placeholder="e.g. 1234">
                    </div>
                    <button onclick="updatePin()" class="w-full bg-white text-black py-4 text-[10px] font-bold tracking-widest uppercase hover:bg-primary transition-colors mt-4">Update Encryption Key</button>
                </div>
            </div>
        </div>
    `;
}

window.updatePin = function() {
    const newPin = document.getElementById('new-pin').value;
    if (newPin.length !== 4) return alert('PIN must be exactly 4 characters.');
    localStorage.setItem(PIN_KEY, newPin.toUpperCase());
    alert('Encryption Key Updated Successfully.');
    renderAdminView();
};
