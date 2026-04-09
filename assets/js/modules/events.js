import { state, elements } from './state.js';
import { saveItemsToLocalStorage } from './storage.js';
import { calculateCurrentSpending } from './utils.js';
import { 
    renderItems, renderRooms, updateDashboard, 
    populateCategorySelects, populateCategoryFilters,
    closeAddItemModal, openAddItemModal,
    closeAddRoomModal, openAddRoomModal,
    closeAddCategoryModal,
    openLogoutModal, closeLogoutModal,
    openDeleteConfirmModal, closeDeleteConfirmModal,
    openShareModal, showAlert, showConfirm
} from './ui.js';
import { cloudService } from '../classes/CloudService.js';

export async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    try {
        await cloudService.signUp(email, password);
        await showAlert('Conta criada com sucesso!', 'Sucesso');
    } catch (error) { showAlert('Erro ao criar conta: ' + error.message, 'Erro', 'error'); }
}

export async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    try {
        await cloudService.login(email, password);
    } catch (error) { showAlert('Erro ao entrar: ' + error.message, 'Erro', 'error'); }
}

export async function handleLogout() { openLogoutModal(); }

export async function confirmLogout() {
    closeLogoutModal();
    const isDeep = window.location.pathname.includes('/items/') || window.location.pathname.includes('/rooms/');
    const isDashboard = window.location.pathname.includes('/dashboard/');
    
    let path = '';
    if (isDeep) path = '../../auth/logout/index.html';
    else if (isDashboard) path = '../auth/logout/index.html';
    else path = 'auth/logout/index.html';
    
    window.location.href = path;
}

// CATEGORIAS
export async function addNewCategory() {
    const name = elements.newCategoryName?.value.trim();
    if (name && !state.categories.includes(name)) {
        state.categories.push(name);
        populateCategorySelects();
        saveItemsToLocalStorage();
        await cloudService.saveSettings({ totalBudget: state.totalBudget, categories: state.categories });
        closeAddCategoryModal();
    } else if (state.categories.includes(name)) { 
        showAlert('Esta categoria já existe!'); 
    }
}

export async function fetchLinkData() {
    const linkInput = document.getElementById('itemLink');
    const fetchBtn = document.getElementById('fetchLinkDataBtn');
    const url = linkInput?.value.trim();

    if (!url) { showAlert('Insira um link primeiro!'); return; }

    try {
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = '<i class="fas fa-spinner animate-spin"></i>';

        // Chamada com parâmetros extras para tentar capturar metadados de preço
        const response = await fetch(`https://api.microlink.io?url=${encodeURIComponent(url)}&data.price.selector=meta[property="product:price:amount"], meta[property="og:price:amount"], .a-price-whole, [itemprop="price"]`);
        const result = await response.json();

        if (result.status === 'success' && result.data) {
            let { title, description, price } = result.data;
            
            // 1. Tentar capturar o preço de várias fontes (Título, Descrição ou Campo Price da API)
            // Regex suporta: R$ 1.234,56 | R$1234,56 | 1234.56 | R$ 12,9
            const priceRegex = /(?:R\$|BRL|Price:?|por)?\s?(\d{1,3}(?:\.\d{3})*(?:,\d{1,2}))/i;
            const priceMatch = title?.match(priceRegex) || description?.match(priceRegex);
            
            // 2. Preencher Nome com limpeza profunda
            if (title && elements.itemName) {
                let cleanName = title.split(' - ')[0].split(' | ')[0].split(': ')[0]; // Pega a primeira parte mais relevante
                
                const junkTerms = [/Magazine Luiza/gi, /no Magalu/gi, /Amazon\.com\.br/gi, /Shopee Brasil/gi, /Netshoes/gi, /Oferta/gi, /Promoção/gi];
                junkTerms.forEach(term => cleanName = cleanName.replace(term, ''));
                
                elements.itemName.value = cleanName.trim();
            }

            // 3. Preencher Preço (Lógica de mineração universal)
            if (price) {
                // Se a API já trouxe um campo price (comum em Netshoes/Shopee se o meta tag existir)
                let p = typeof price === 'string' ? parseFloat(price.replace(/[^\d.,]/g, '').replace(',', '.')) : price;
                elements.itemPrice.value = p;
            } else if (priceMatch) {
                // Se encontramos via Regex no texto (comum em Amazon/Mercado Livre)
                let numericStr = priceMatch[1].replace(/\./g, '').replace(',', '.');
                elements.itemPrice.value = parseFloat(numericStr);
            }

            if (!title) showAlert('Link lido, mas não consegui extrair o nome automaticamente.');
        } else {
            const errorMsg = result.message || 'O site não permitiu a leitura automática.';
            throw new Error(errorMsg);
        }
    } catch (error) {
        console.error('Erro detalhado:', error);
        showAlert('Não foi possível ler este link automaticamente (Bloqueio do site). Você pode preencher os campos manualmente.');
    } finally {
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = '<i class="fas fa-magic"></i>';
    }
}

// ITENS
export async function togglePurchasedStatus(itemId, isPurchased) {
    const item = state.items.find(i => i.id === itemId);
    if (item) {
        item.purchased = isPurchased;
        saveItemsToLocalStorage();
        const room = state.rooms.find(r => r.name === item.category);
        if (room) await cloudService.saveItem(room.id, item);
        calculateCurrentSpending();
        // Salvar totais no documento pai
        await cloudService.saveSettings({ 
            totalBudget: state.totalBudget, 
            categories: state.categories,
            totalEstimated: state.totalEstimated,
            currentSpending: state.currentSpending
        });
        updateDashboard();
    }
}

export async function addOrUpdateItem(e) {
    e.preventDefault();
    const name = elements.itemName?.value.trim();
    const category = elements.itemCategory?.value;
    const priority = elements.itemPriority?.value;
    const price = parseFloat(elements.itemPrice?.value);
    const link = elements.itemLink?.value.trim();

    if (!name || !category || isNaN(price)) return;

    if (price < 0) {
        showAlert("O preço do item não pode ser negativo.", "Erro de Valor", "error");
        return;
    }

    const room = state.rooms.find(r => r.name === category);
    if (!room) { showAlert("Escolha um cômodo válido!"); return; }

    let item;
    if (elements.editItemId?.value) {
        const index = state.items.findIndex(i => i.id === elements.editItemId.value);
        state.items[index] = { ...state.items[index], name, category, priority, price, link: link || null };
        item = state.items[index];
    } else {
        item = { id: Date.now().toString() + Math.random().toString(36).substr(2, 9), name, category, priority, price, purchased: false, link: link || null };
        state.items.push(item);
    }

    saveItemsToLocalStorage();
    await cloudService.saveItem(room.id, item);
    calculateCurrentSpending();
    // Salvar totais consolidados no documento pai
    await cloudService.saveSettings({ 
        totalBudget: state.totalBudget, 
        categories: state.categories,
        totalEstimated: state.totalEstimated,
        currentSpending: state.currentSpending
    });
    renderItems();
    updateDashboard();
    closeAddItemModal();
}

export async function deleteItem(itemId) {
    state.itemToDelete = itemId;
    openDeleteConfirmModal('item');
}

export async function confirmDeleteItem() {
    const itemId = state.itemToDelete;
    if (!itemId) return;

    const item = state.items.find(i => i.id === itemId);
    const room = state.rooms.find(r => r.name === item.category);
    state.items = state.items.filter(i => i.id !== itemId);
    saveItemsToLocalStorage();
    
    if (room) await cloudService.deleteItem(room.id, itemId);
    
    calculateCurrentSpending();
    await cloudService.saveSettings({ 
        totalBudget: state.totalBudget, 
        categories: state.categories,
        totalEstimated: state.totalEstimated,
        currentSpending: state.currentSpending
    });
    
    renderItems();
    updateDashboard();
    closeDeleteConfirmModal('item');
    state.itemToDelete = null;
}

// COMPARTILHAMENTO
export function openShare() {
    openShareModal(cloudService.projectId);
}

export async function confirmJoinProject() {
    const targetId = document.getElementById('joinProjectIdInput')?.value.trim();
    if (!targetId) return;

    // Bloqueio preventivo no Front
    if (targetId === cloudService.projectId) {
        showAlert('Este é o seu próprio código. Você só pode se unir a listas de outras pessoas.', 'Ação Inválida');
        return;
    }

    const confirmed = await showConfirm('Deseja se unir a esta lista? Seus dados atuais serão substituídos pelos da nova lista.', 'Conectar Lista', 'Sim, Conectar');
    if (confirmed) {
        try {
            await cloudService.joinProject(targetId);
            await showAlert('Conectado com sucesso!', 'Sucesso');
            window.location.reload(); // Recarrega para aplicar as mudanças
        } catch (e) {
            showAlert('Erro ao conectar: ' + e.message, 'Erro', 'error');
        }
    }
}

export function copyProjectId() {
    const id = cloudService.projectId;
    if (!id) return;

    try {
        // Método Universal (Fallback) - Funciona em todos os navegadores e contextos (HTTP/HTTPS)
        const textArea = document.createElement("textarea");
        textArea.value = id;
        
        // Esconder o elemento
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        textArea.style.top = "0";
        textArea.style.opacity = "0";
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);

        if (successful) {
            showAlert('Código copiado para a área de transferência!', 'Copiado', 'success', 2000);
        } else {
            throw new Error("Comando de cópia falhou");
        }
    } catch (err) {
        console.error('Erro ao copiar:', err);
        // Fallback final: Mostrar o código para cópia manual
        showAlert('Não foi possível copiar automaticamente. O código é: ' + id, 'Copia Manual');
    }
}

export function shareViaWhatsapp() {
    const id = cloudService.projectId;
    if (!id) return;

    const message = encodeURIComponent(`Oi! Este é o código da nossa Casa dos Sonhos no app: ${id}`);
    window.open(`https://wa.me/?text=${message}`, '_blank');
}

// CÔMODOS
export async function addNewRoom() {
    const name = elements.roomName?.value.trim();
    if (!name) return;

    const room = {
        id: elements.editRoomId?.value || Date.now().toString(),
        name,
        primaryColor: document.getElementById('primaryColorHex')?.value || '#8B5CF6',
        secondaryColor: document.getElementById('secondaryColorHex')?.value || '#2DD4BF',
        accentColor: document.getElementById('accentColorHex')?.value || '#FACC15',
        neutralColor: document.getElementById('neutralColorHex')?.value || '#FFFFFF'
    };

    if (elements.editRoomId?.value) {
        const index = state.rooms.findIndex(r => r.id === room.id);
        state.rooms[index] = room;
    } else {
        state.rooms.push(room);
        if (!state.categories.includes(name)) state.categories.push(name);
    }

    saveItemsToLocalStorage();
    await cloudService.saveRoom(room);
    await cloudService.saveSettings({ totalBudget: state.totalBudget, categories: state.categories });
    
    renderRooms();
    populateCategoryFilters();
    closeAddRoomModal();
}

export async function deleteRoom(roomId) {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) return;
    
    const hasItems = state.items.some(i => i.category === room.name);
    if (hasItems) {
        showAlert('Este cômodo possui itens associados. Remova os itens antes de excluí-lo.', 'Ação Bloqueada', 'error');
        return;
    }

    state.roomToDelete = roomId;
    openDeleteConfirmModal('room');
}

export async function confirmDeleteRoom() {
    const roomId = state.roomToDelete;
    if (!roomId) return;

    const room = state.rooms.find(r => r.id === roomId);
    state.rooms = state.rooms.filter(r => r.id !== roomId);
    state.categories = state.categories.filter(c => state.rooms.some(r => r.name === c));

    saveItemsToLocalStorage();
    await cloudService.deleteRoom(roomId);
    await cloudService.saveSettings({ totalBudget: state.totalBudget, categories: state.categories });
    
    populateCategorySelects();
    renderRooms();
    closeDeleteConfirmModal('room');
    state.roomToDelete = null;
}

let pickrInstances = {};

export function syncColorInputs() {
    const pickers = [
        {id: 'primaryColorPicker', hexId: 'primaryColorHex', default: '#8B5CF6'},
        {id: 'secondaryColorPicker', hexId: 'secondaryColorHex', default: '#2DD4BF'},
        {id: 'accentColorPicker', hexId: 'accentColorHex', default: '#FACC15'},
        {id: 'neutralColorPicker', hexId: 'neutralColorHex', default: '#FFFFFF'}
    ];

    pickers.forEach(p => {
        const el = document.getElementById(p.id);
        if (!el) return;

        // Limpar se já existir (evita duplicação ao mudar de aba)
        if (pickrInstances[p.id]) {
            try { pickrInstances[p.id].destroyAndRemove(); } catch(e) {}
        }

        const pickr = Pickr.create({
            el: `#${p.id}`,
            theme: 'nano',
            default: document.getElementById(p.hexId)?.value || p.default,
            swatches: [
                '#8B5CF6', '#2DD4BF', '#FACC15', '#FFFFFF',
                '#EF4444', '#10B981', '#3B82F6', '#F97316'
            ],
            components: {
                preview: true,
                opacity: false,
                hue: true,
                interaction: {
                    hex: false,
                    rgba: false,
                    hsla: false,
                    hsva: false,
                    cmyk: false,
                    input: true,
                    clear: false,
                    save: true
                }
            },
            i18n: {
                'btn:save': 'Definir',
                'btn:cancel': 'Cancelar'
            }
        });

        pickr.on('save', (color) => {
            const hex = color.toHEXA().toString();
            document.getElementById(p.hexId).value = hex.toUpperCase();
            pickr.hide();
        });

        const hexInput = document.getElementById(p.hexId);
        if (hexInput) {
            hexInput.oninput = () => {
                const val = hexInput.value;
                if (/^#[0-9A-F]{6}$/i.test(val)) {
                    pickr.setColor(val);
                }
            };
        }

        pickrInstances[p.id] = pickr;
    });
}

export function editItem(itemId) {
    const item = state.items.find(item => item.id === itemId);
    if (item) {
        if (elements.editItemId) elements.editItemId.value = item.id;
        if (elements.itemName) elements.itemName.value = item.name;
        if (elements.itemCategory) elements.itemCategory.value = item.category;
        if (elements.itemPriority) elements.itemPriority.value = item.priority;
        if (elements.itemPrice) elements.itemPrice.value = item.price;
        if (elements.itemLink) elements.itemLink.value = item.link || '';
        openAddItemModal();
    }
}

export function editRoom(roomId) {
    const room = state.rooms.find(r => r.id === roomId);
    if (room) {
        if (elements.editRoomId) elements.editRoomId.value = room.id;
        if (elements.roomName) elements.roomName.value = room.name;
        
        // Atualizar inputs de texto e pickrs
        const map = {
            'primaryColorPicker': { hexId: 'primaryColorHex', color: room.primaryColor },
            'secondaryColorPicker': { hexId: 'secondaryColorHex', color: room.secondaryColor },
            'accentColorPicker': { hexId: 'accentColorHex', color: room.accentColor },
            'neutralColorPicker': { hexId: 'neutralColorHex', color: room.neutralColor }
        };

        Object.keys(map).forEach(pId => {
            const hexEl = document.getElementById(map[pId].hexId);
            if (hexEl) hexEl.value = map[pId].color;
            if (pickrInstances[pId]) pickrInstances[pId].setColor(map[pId].color);
        });

        openAddRoomModal();
    }
}