import { state, elements } from './state.js';
import { getRoomColor, formatCurrency, getTotalEffectiveBudget } from './utils.js';

export function injectCommonModals() {
    // Evita injetar duplicado
    if (document.getElementById('shareModal')) return;

    const modalContainer = document.createElement('div');
    modalContainer.id = 'common-modals-container';
    modalContainer.innerHTML = `
        <!-- Share Modal -->
        <div id="shareModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-purple-900/20 backdrop-blur-sm modal modal-hidden px-4">
            <div class="bg-white rounded-[2rem] w-full max-w-md p-8 card-shadow custom-scrollbar">
                <div class="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-users text-purple-600 text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-purple-900 text-center mb-2">Compartilhar Lista</h3>
                <p class="text-gray-500 text-center mb-6 text-sm">O casal pode acessar a mesma lista usando o código abaixo.</p>
                
                <div class="space-y-6">
                    <div class="space-y-3">
                        <button id="copyProjectIdBtn" class="w-full text-left bg-purple-50 p-4 rounded-2xl border border-purple-100 hover:bg-purple-100 transition group">
                            <label class="text-[10px] font-bold text-purple-400 uppercase tracking-widest ml-1 cursor-pointer">Seu Código de Acesso</label>
                            <div class="flex items-center justify-between mt-1">
                                <span id="displayProjectId" class="font-mono font-bold text-purple-900">Carregando...</span>
                                <div class="text-purple-600 group-hover:scale-110 transition p-2">
                                    <i class="fas fa-copy"></i>
                                </div>
                            </div>
                        </button>
                        
                        <button id="shareWhatsappBtn" class="w-full flex items-center justify-center space-x-2 py-3 bg-green-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-100 hover:bg-green-600 transition">
                            <i class="fab fa-whatsapp text-lg"></i>
                            <span>Enviar via WhatsApp</span>
                        </button>
                    </div>

                    <div class="relative">
                        <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-gray-100"></div></div>
                        <div class="relative flex justify-center text-xs uppercase"><span class="bg-white px-2 text-gray-300 font-bold">OU</span></div>
                    </div>

                    <div>
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Entrar em outra lista</label>
                        <div class="flex space-x-2 mt-1">
                            <input type="text" id="joinProjectIdInput" placeholder="Cole o código do parceiro" class="flex-1 px-4 py-3 rounded-xl bg-gray-50 border-none outline-none focus:ring-2 focus:ring-purple-200 text-sm">
                            <button id="confirmJoinProjectBtn" class="px-4 bg-purple-600 text-white rounded-xl font-bold text-sm hover:bg-purple-700 transition">Conectar</button>
                        </div>
                    </div>

                    <div id="projectMembersSection" class="pt-4 border-t border-purple-50">
                        <label class="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Membros Conectados</label>
                        <div id="projectMembersList" class="mt-2 space-y-2"></div>
                    </div>
                </div>

                <div class="mt-8">
                    <button id="closeShareModalBtn" class="w-full py-3 text-gray-400 font-bold text-sm hover:bg-gray-50 rounded-2xl transition">Fechar</button>
                </div>
            </div>
        </div>

        <!-- Message Modal (Alert/Confirm) -->
        <div id="messageModal" class="fixed inset-0 z-[200] flex items-center justify-center bg-purple-900/20 backdrop-blur-sm modal modal-hidden px-4">
            <div class="bg-white rounded-[2rem] w-full max-w-sm p-8 card-shadow text-center">
                <div id="messageIconContainer" class="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6">
                    <i id="messageIcon" class="fas fa-info-circle text-purple-600 text-2xl"></i>
                </div>
                <h3 id="messageTitle" class="text-xl font-bold text-purple-900 mb-2">Aviso</h3>
                <p id="messageContent" class="text-gray-500 mb-8 leading-relaxed">Mensagem aqui...</p>
                <div id="messageActions" class="flex space-x-3">
                    <button id="messageCancelBtn" class="hidden flex-1 py-3 text-gray-400 font-bold text-sm hover:bg-gray-50 rounded-2xl transition">Cancelar</button>
                    <button id="messageConfirmBtn" class="flex-1 py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 transition">Entendi</button>
                </div>
            </div>
        </div>

        <!-- Logout Modal -->
        <div id="logoutModal" class="fixed inset-0 z-[100] flex items-center justify-center bg-purple-900/20 backdrop-blur-sm modal modal-hidden px-4">
            <div class="bg-white rounded-[2rem] w-full max-w-sm p-8 card-shadow custom-scrollbar">
                <div class="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
                    <i class="fas fa-sign-out-alt text-red-500 text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-purple-900 text-center mb-2">Já vai embora?</h3>
                <p class="text-gray-500 text-center mb-8 leading-relaxed">Sua lista e cores ficarão salvas com segurança na nuvem para quando você voltar.</p>
                <div class="flex space-x-3">
                    <button id="cancelLogoutBtn" class="flex-1 py-3 text-gray-400 font-bold text-sm hover:bg-gray-50 rounded-2xl transition">Ficar</button>
                    <button id="confirmLogoutBtn" class="flex-1 py-3 bg-red-50 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-600 transition text-center">Sair</button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modalContainer);
}

export function updateDashboard() {
    // Verificar se estamos em uma página que tem os elementos do dashboard
    const currentSpendingEl = document.getElementById('currentSpending');
    if (!currentSpendingEl) return;

    // 1. Atualizar Totais Financeiros
    currentSpendingEl.textContent = formatCurrency(state.currentSpending);
    
    const totalEstimatedEl = document.getElementById('totalEstimated');
    if (totalEstimatedEl) {
        totalEstimatedEl.textContent = formatCurrency(state.totalEstimated);
    }

    const totalBudget = getTotalEffectiveBudget(); // Soma Base + Cofrinho
    const totalBudgetInput = document.getElementById('totalBudget');
    if (totalBudgetInput) {
        // Se for um input, atualiza o valor. Se for apenas texto, atualiza o textContent.
        if (totalBudgetInput.tagName === 'INPUT') {
            totalBudgetInput.value = formatCurrency(totalBudget);
        } else {
            totalBudgetInput.textContent = formatCurrency(totalBudget);
        }
    }

    const percentageUsed = totalBudget > 0 ? (state.currentSpending / totalBudget) * 100 : 0;
    
    const percentageUsedEl = document.getElementById('percentageUsed');
    if (percentageUsedEl) {
        percentageUsedEl.textContent = `${percentageUsed.toFixed(1)}% usado`;
    }
   
    const remainingBudget = totalBudget - state.currentSpending;
    const remainingBudgetEl = document.getElementById('remainingBudget');
    if (remainingBudgetEl) {
        // Ajustar cores e texto conforme o saldo
        if (remainingBudget > 0) {
            remainingBudgetEl.textContent = `${formatCurrency(remainingBudget)} restantes`;
            remainingBudgetEl.classList.remove('text-gray-400', 'text-red-600');
            remainingBudgetEl.classList.add('text-green-600');
        } else if (remainingBudget < 0) {
            // Remove o sinal negativo usando Math.abs e muda o texto
            remainingBudgetEl.textContent = `${formatCurrency(Math.abs(remainingBudget))} ultrapassados`;
            remainingBudgetEl.classList.remove('text-gray-400', 'text-green-600');
            remainingBudgetEl.classList.add('text-red-600');
        } else {
            remainingBudgetEl.textContent = `${formatCurrency(0)} restantes`;
            remainingBudgetEl.classList.remove('text-green-600', 'text-red-600');
            remainingBudgetEl.classList.add('text-gray-400');
        }
    }

    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = `${Math.min(percentageUsed, 100)}%`;
    }

    // 2. Atualizar Estatísticas Quantitativas
    const purchasedItemsEl = document.getElementById('purchasedItems');
    if (purchasedItemsEl) {
        purchasedItemsEl.textContent = state.items.filter(item => item.purchased).length;
    }

    const highPriorityItemsEl = document.getElementById('highPriorityItems');
    if (highPriorityItemsEl) {
        highPriorityItemsEl.textContent = state.items.filter(item => item.priority === 'high' && !item.purchased).length;
    }

    const mediumPriorityItemsEl = document.getElementById('mediumPriorityItems');
    if (mediumPriorityItemsEl) {
        mediumPriorityItemsEl.textContent = state.items.filter(item => item.priority === 'medium' && !item.purchased).length;
    }

    const lowPriorityItemsEl = document.getElementById('lowPriorityItems');
    if (lowPriorityItemsEl) {
        lowPriorityItemsEl.textContent = state.items.filter(item => item.priority === 'low' && !item.purchased).length;
    }

    const totalCategoriesEl = document.getElementById('totalCategories');
    if (totalCategoriesEl) {
        const uniqueCategories = [...new Set(state.items.map(item => item.category))];
        totalCategoriesEl.textContent = uniqueCategories.length;
    }
}

export function renderItems() {
    const tableBody = document.getElementById('itemsTableBody');
    if (!tableBody) return;
    
    tableBody.innerHTML = '';
    
    const categoryFilter = document.getElementById('filterCategory')?.value || '';
    const priorityFilter = document.getElementById('filterPriority')?.value || '';
    const statusFilter = document.getElementById('filterStatus')?.value || '';
    
    let filteredItems = [...state.items];
    
    if (categoryFilter) filteredItems = filteredItems.filter(item => item.category === categoryFilter);
    if (priorityFilter) filteredItems = filteredItems.filter(item => item.priority === priorityFilter);
    if (statusFilter === 'purchased') filteredItems = filteredItems.filter(item => item.purchased);
    else if (statusFilter === 'not-purchased') filteredItems = filteredItems.filter(item => !item.purchased);
    
    const emptyState = document.getElementById('emptyState');
    if (filteredItems.length === 0) {
        emptyState?.classList.remove('hidden');
        return;
    }
    
    emptyState?.classList.add('hidden');
    
    filteredItems.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[b.priority] !== priorityOrder[a.priority]) return priorityOrder[b.priority] - priorityOrder[a.priority];
        return a.name.localeCompare(b.name);
    });
    
    filteredItems.forEach(item => {
        const row = document.createElement('tr');
        row.className = 'hover:bg-purple-50 transition'; // Removi cursor-pointer da linha
        row.dataset.id = item.id;
        
        const statusBadge = item.purchased 
            ? `<span class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-lg shadow-sm border border-green-200 cursor-pointer hover:bg-green-200 transition toggle-status-badge">Comprado</span>`
            : `<span class="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-lg shadow-sm border border-amber-200 cursor-pointer hover:bg-amber-200 transition toggle-status-badge">Pendente</span>`;

        row.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap" data-label="Status">
                ${statusBadge}
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Item"><div class="text-sm font-bold text-purple-900">${item.name}</div></td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Cômodo"><div class="text-sm text-gray-500">${item.category}</div></td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Prioridade">
                <span class="px-2 py-1 inline-flex text-[10px] font-black uppercase rounded-lg ${item.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' : item.priority === 'medium' ? 'bg-yellow-50 text-yellow-600 border border-yellow-100' : 'bg-green-50 text-green-600 border border-green-100'}">
                    ${item.priority === 'high' ? 'Alta Prioridade' : item.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Preço"><div class="text-sm font-mono font-bold text-purple-600">${formatCurrency(parseFloat(item.price))}</div></td>
            <td class="px-6 py-4 whitespace-nowrap" data-label="Link">${item.link ? `<a href="${item.link}" target="_blank" class="p-2 text-purple-400 hover:text-purple-600"><i class="fas fa-external-link-alt text-xs"></i></a>` : '<span class="text-xs text-gray-300">-</span>'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium" data-label="Ações">
                <button onclick="editItem('${item.id}')" class="text-purple-600 hover:text-purple-900 mr-3"><i class="fas fa-edit"></i></button>
                <button onclick="deleteItem('${item.id}')" class="text-red-600 hover:text-red-900"><i class="fas fa-trash-alt"></i></button>
            </td>`;
        
        // Adicionar evento apenas no badge de status
        const badge = row.querySelector('.toggle-status-badge');
        if (badge) {
            badge.onclick = (e) => {
                e.stopPropagation();
                togglePurchasedStatus(item.id);
            };
        }

        tableBody.appendChild(row);
    });
}

export function renderRooms() {
    const container = document.getElementById('roomsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    const emptyRoomsState = document.getElementById('emptyRoomsState');
    
    if (state.rooms.length === 0) {
        emptyRoomsState?.classList.remove('hidden');
        return;
    }
    
    emptyRoomsState?.classList.add('hidden');
    
    state.rooms.forEach(room => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-[2rem] overflow-hidden card-shadow hover:translate-y-[-4px] transition-all duration-300 group cursor-pointer flex flex-col h-full';
        
        // Criar colagem de imagens (Topo do Card)
        const images = room.referenceImages || [];
        let collageHtml = '';
        
        if (images.length > 0) {
            const gridClass = images.length === 1 ? 'grid-cols-1' : (images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2');
            collageHtml = `<div class="grid ${gridClass} gap-0.5 h-40 bg-purple-50 shrink-0 overflow-hidden border-b border-purple-50">
                ${images.map(img => `<img src="${img}" class="w-full h-full object-cover">`).join('')}
            </div>`;
        } else {
            collageHtml = `<div class="h-40 bg-purple-50 flex items-center justify-center shrink-0 border-b border-purple-50">
                <i class="fas fa-palette text-purple-200 text-3xl"></i>
            </div>`;
        }

        card.onclick = () => window.location.href = `detail.html?id=${room.id}`;

        card.innerHTML = `
            ${collageHtml}
            <div class="p-5 flex-1 flex flex-col bg-white">
                <div class="flex justify-between items-start mb-3 gap-2">
                    <div class="min-w-0 flex-1">
                        <h3 class="font-bold text-purple-900 group-hover:text-purple-600 transition truncate text-sm leading-tight">${room.name}</h3>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">${state.items.filter(i => i.category === room.name).length} itens</p>
                    </div>
                    <div class="flex space-x-1 shrink-0">
                        <button onclick="event.stopPropagation(); editRoom('${room.id}')" class="p-2 text-gray-400 hover:text-purple-600 transition"><i class="fas fa-edit text-xs"></i></button>
                        <button onclick="event.stopPropagation(); deleteRoom('${room.id}')" class="p-2 text-gray-400 hover:text-red-500 transition"><i class="fas fa-trash-alt text-xs"></i></button>
                    </div>
                </div>
                
                <div class="mt-auto pt-3 border-t border-purple-50/50 flex items-center space-x-2">
                    <div class="w-5 h-5 rounded-lg shadow-sm border border-white" style="background-color: ${room.primaryColor}"></div>
                    <div class="w-5 h-5 rounded-lg shadow-sm border border-white" style="background-color: ${room.secondaryColor}"></div>
                    <div class="w-5 h-5 rounded-lg shadow-sm border border-white" style="background-color: ${room.accentColor}"></div>
                    <div class="w-5 h-5 rounded-lg shadow-sm border border-white" style="background-color: ${room.neutralColor}"></div>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderRoomDetail(roomId) {
    const room = state.rooms.find(r => r.id === roomId);
    if (!room) {
        window.location.href = 'index.html';
        return;
    }

    // Título e Nome
    const nameEl = document.getElementById('roomDetailName');
    if (nameEl) nameEl.textContent = room.name;

    // Moodboard (Collage)
    const collageContainer = document.getElementById('roomDetailCollage');
    if (collageContainer) {
        const images = room.referenceImages || [];
        if (images.length > 0) {
            const gridClass = images.length === 1 ? 'grid-cols-1' : (images.length === 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2');
            collageContainer.className = `grid ${gridClass} gap-2 aspect-square rounded-2xl overflow-hidden bg-purple-50`;
            collageContainer.innerHTML = images.map(img => `<img src="${img}" class="w-full h-full object-cover">`).join('');
        } else {
            collageContainer.innerHTML = `<div class="col-span-2 flex flex-col items-center justify-center text-purple-200 p-8 text-center">
                <i class="fas fa-images text-4xl mb-2"></i>
                <p class="text-[10px] font-bold uppercase tracking-widest">Sem imagens de referência</p>
            </div>`;
        }
    }

    // Cores
    const colors = [
        { id: 'color1', val: room.primaryColor },
        { id: 'color2', val: room.secondaryColor },
        { id: 'color3', val: room.accentColor },
        { id: 'color4', val: room.neutralColor }
    ];
    colors.forEach(c => {
        const el = document.getElementById(c.id);
        if (el) el.style.backgroundColor = c.val;
    });

    // Lista de Itens do Cômodo
    const itemsList = document.getElementById('roomItemsList');
    const emptyState = document.getElementById('emptyRoomItemsState');
    const totalEl = document.getElementById('roomDetailTotal');
    
    if (itemsList) {
        itemsList.innerHTML = '';
        const roomItems = state.items.filter(i => i.category === room.name);
        
        if (roomItems.length === 0) {
            emptyState?.classList.remove('hidden');
            totalEl.textContent = formatCurrency(0);
        } else {
            emptyState?.classList.add('hidden');
            let total = 0;
            
            roomItems.forEach(item => {
                total += parseFloat(item.price);
                const row = document.createElement('tr');
                row.className = 'hover:bg-purple-50 transition cursor-pointer';
                row.onclick = (e) => {
            // Se clicar em um botão ou link, não alterna o status
            if (e.target.closest('button') || e.target.closest('a')) return;
            togglePurchasedStatus(item.id);
        };

                const statusBadge = item.purchased 
                    ? '<span class="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase rounded-lg shadow-sm border border-green-200">Comprado</span>'
                    : '<span class="px-2 py-1 bg-amber-100 text-amber-700 text-[10px] font-black uppercase rounded-lg shadow-sm border border-amber-200">Pendente</span>';

                row.innerHTML = `
                    <td class="py-4" data-label="Status">
                        ${statusBadge}
                    </td>
                    <td class="py-4" data-label="Item">
                        <div class="flex flex-col">
                            <span class="text-sm font-bold text-purple-900">${item.name}</span>
                            <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${item.priority === 'high' ? 'Alta Prioridade' : (item.priority === 'medium' ? 'Média Prioridade' : 'Baixa Prioridade')}</span>
                        </div>
                    </td>
                    <td class="py-4 text-sm font-mono font-bold text-purple-600" data-label="Preço">${formatCurrency(item.price)}</td>
                    <td class="py-4 text-right" data-label="Ações">
                        <div class="flex justify-end space-x-1">
                            ${item.link ? `<a href="${item.link}" target="_blank" class="p-2 text-purple-400 hover:text-purple-600"><i class="fas fa-external-link-alt text-xs"></i></a>` : ''}
                            <button onclick="editItem('${item.id}')" class="p-2 text-gray-300 hover:text-purple-600"><i class="fas fa-edit text-xs"></i></button>
                        </div>
                    </td>
                `;
                itemsList.appendChild(row);
            });
            totalEl.textContent = formatCurrency(total);
        }
    }
}

export function populateCategorySelects() {
    const select = document.getElementById('itemCategory');
    if (!select) return;
    
    select.innerHTML = '<option value="">Selecione um cômodo</option>';
    state.rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.name;
        option.textContent = room.name;
        select.appendChild(option);
    });
}

export function populateCategoryFilters() {
    const filter = document.getElementById('filterCategory');
    if (!filter) return;
    
    const currentVal = filter.value;
    filter.innerHTML = '<option value="">Todas Categorias</option>';
    state.rooms.forEach(room => {
        const option = document.createElement('option');
        option.value = room.name;
        option.textContent = room.name;
        filter.appendChild(option);
    });
    filter.value = currentVal;
}

// Modais Genéricos
const toggleModal = (id, show) => {
    const modal = document.getElementById(id);
    if (!modal) return;
    if (show) modal.classList.remove('modal-hidden');
    else modal.classList.add('modal-hidden');
};

export function openAddItemModal() { toggleModal('addItemModal', true); }
export function closeAddItemModal() { 
    toggleModal('addItemModal', false); 
    document.getElementById('itemForm')?.reset(); 
    const editId = document.getElementById('editItemId');
    if (editId) editId.value = ''; 
}

export function openAddRoomModal() { toggleModal('addRoomModal', true); }
export function closeAddRoomModal() { 
    toggleModal('addRoomModal', false); 
    document.getElementById('roomForm')?.reset(); 
    const editId = document.getElementById('editRoomId');
    if (editId) editId.value = ''; 
    
    // Limpar imagens de preview (Apenas nos slots corretos)
    const imageLabels = document.querySelectorAll('.room-image-slot');
    imageLabels.forEach(label => {
        label.innerHTML = `<i class="fas fa-plus text-xs"></i><input type="file" class="hidden room-image-input" accept="image/*">`;
    });
}

export function openAddCategoryModal() { toggleModal('addCategoryModal', true); }
export function closeAddCategoryModal() { toggleModal('addCategoryModal', false); document.getElementById('categoryForm')?.reset(); }

export function openLogoutModal() { toggleModal('logoutModal', true); }
export function closeLogoutModal() { toggleModal('logoutModal', false); }

export function openShareModal(projectId) {
    const displayEl = document.getElementById('displayProjectId');
    if (displayEl) displayEl.textContent = projectId;
    toggleModal('shareModal', true);
}
export function closeShareModal() { toggleModal('shareModal', false); }

export function openDeleteConfirmModal(type) { 
    const id = type === 'item' ? 'deleteItemModal' : 'deleteRoomModal';
    toggleModal(id, true); 
}
export function closeDeleteConfirmModal(type) { 
    const id = type === 'item' ? 'deleteItemModal' : 'deleteRoomModal';
    toggleModal(id, false); 
}

export function switchTab(tabName) {
    const itemsTabBtn = document.getElementById('itemsTabBtn');
    const colorsTabBtn = document.getElementById('colorsTabBtn');
    const itemsTabContent = document.getElementById('itemsTabContent');
    const colorsTabContent = document.getElementById('colorsTabContent');

    if (tabName === 'items') {
        itemsTabBtn?.classList.add('active');
        colorsTabBtn?.classList.remove('active');
        itemsTabContent?.classList.remove('hidden');
        colorsTabContent?.classList.add('hidden');
    } else {
        itemsTabBtn?.classList.remove('active');
        colorsTabBtn?.classList.add('active');
        itemsTabContent?.classList.add('hidden');
        colorsTabContent?.classList.remove('hidden');
    }
}

export function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    sidebar?.classList.toggle('active');
    overlay?.classList.toggle('active');
}

export function closeAllModals() {
    closeAddItemModal();
    closeAddRoomModal();
    closeAddCategoryModal();
    closeLogoutModal();
    closeShareModal();
    closeDeleteConfirmModal('item');
    closeDeleteConfirmModal('room');
    closeRoomsSummaryModal();
    closePurchasedItemsModal();
    closeHighPriorityModal();
    closeCategoriesSummaryModal();
    toggleModal('messageModal', false);
    
    // Fechar sidebar se estiver aberta no mobile
    const sidebar = document.getElementById('sidebar');
    const overlay = document.querySelector('.sidebar-overlay');
    if (sidebar?.classList.contains('active')) {
        sidebar.classList.remove('active');
        overlay?.classList.remove('active');
    }
}

export function showAlert(message, title = 'Aviso', type = 'info', timeout = 0) {
    return new Promise((resolve) => {
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('messageTitle');
        const contentEl = document.getElementById('messageContent');
        const confirmBtn = document.getElementById('messageConfirmBtn');
        const cancelBtn = document.getElementById('messageCancelBtn');
        const icon = document.getElementById('messageIcon');
        const iconContainer = document.getElementById('messageIconContainer');

        if (!modal) { console.warn("Modal de mensagem não encontrado"); resolve(); return; }

        titleEl.textContent = title;
        contentEl.textContent = message;
        cancelBtn.classList.add('hidden');
        confirmBtn.textContent = 'Entendi';
        confirmBtn.classList.remove('hidden');
        
        // Estilo baseado no tipo
        if (type === 'error') {
            icon.className = 'fas fa-exclamation-circle text-red-500 text-2xl';
            iconContainer.className = 'w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6';
            confirmBtn.className = 'flex-1 py-3 bg-red-500 text-white rounded-2xl font-bold text-sm shadow-lg shadow-red-200 hover:bg-red-600 transition';
        } else if (type === 'success') {
            icon.className = 'fas fa-check-circle text-green-500 text-2xl';
            iconContainer.className = 'w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-6';
            confirmBtn.className = 'flex-1 py-3 bg-green-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-green-200 hover:bg-green-700 transition';
        } else {
            icon.className = 'fas fa-info-circle text-purple-600 text-2xl';
            iconContainer.className = 'w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6';
            confirmBtn.className = 'flex-1 py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 transition';
        }

        const handleConfirm = () => {
            if (autoCloseTimeout) clearTimeout(autoCloseTimeout);
            toggleModal('messageModal', false);
            confirmBtn.removeEventListener('click', handleConfirm);
            resolve();
        };

        confirmBtn.addEventListener('click', handleConfirm);
        toggleModal('messageModal', true);

        // Fechamento automático se timeout for definido
        let autoCloseTimeout = null;
        if (timeout > 0) {
            confirmBtn.classList.add('hidden'); // Esconde o botão se for auto-close
            autoCloseTimeout = setTimeout(handleConfirm, timeout);
        }
    });
}

export function showConfirm(message, title = 'Confirmar', confirmText = 'Sim, continuar') {
    return new Promise((resolve) => {
        const modal = document.getElementById('messageModal');
        const titleEl = document.getElementById('messageTitle');
        const contentEl = document.getElementById('messageContent');
        const confirmBtn = document.getElementById('messageConfirmBtn');
        const cancelBtn = document.getElementById('messageCancelBtn');
        const icon = document.getElementById('messageIcon');
        const iconContainer = document.getElementById('messageIconContainer');

        if (!modal) { resolve(false); return; }

        titleEl.textContent = title;
        contentEl.textContent = message;
        cancelBtn.classList.remove('hidden');
        confirmBtn.textContent = confirmText;
        
        icon.className = 'fas fa-question-circle text-purple-600 text-2xl';
        iconContainer.className = 'w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center mx-auto mb-6';
        confirmBtn.className = 'flex-1 py-3 bg-purple-600 text-white rounded-2xl font-bold text-sm shadow-lg shadow-purple-200 hover:bg-purple-700 transition';

        const onConfirm = () => { cleanup(); resolve(true); };
        const onCancel = () => { cleanup(); resolve(false); };

        const cleanup = () => {
            toggleModal('messageModal', false);
            confirmBtn.removeEventListener('click', onConfirm);
            cancelBtn.removeEventListener('click', onCancel);
        };

        confirmBtn.addEventListener('click', onConfirm);
        cancelBtn.addEventListener('click', onCancel);
        toggleModal('messageModal', true);
    });
}

export function openRoomsSummaryModal() {
    renderRoomsSummary();
    toggleModal('roomsSummaryModal', true);
}

export function closeRoomsSummaryModal() {
    toggleModal('roomsSummaryModal', false);
}

export function renderRoomsSummary() {
    const container = document.getElementById('roomsSummaryContainer');
    const totalEl = document.getElementById('roomsSummaryTotal');
    if (!container || !totalEl) return;

    container.innerHTML = '';
    
    if (state.rooms.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum cômodo cadastrado.</p>';
        totalEl.textContent = formatCurrency(0);
        return;
    }

    let grandTotal = 0;

    state.rooms.forEach(room => {
        const roomTotal = parseFloat(room.totalEstimated || 0);
        grandTotal += roomTotal;

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-4 rounded-2xl bg-purple-50/50 border border-purple-100 cursor-pointer hover:bg-purple-100 transition';
        row.onclick = () => window.location.href = `rooms/detail.html?id=${room.id}`;
        row.innerHTML = `
            <div class="flex items-center space-x-3">
                <div class="w-3 h-3 rounded-full" style="background-color: ${room.primaryColor}"></div>
                <span class="font-bold text-purple-900">${room.name}</span>
            </div>
            <span class="font-mono font-bold text-purple-600">${formatCurrency(roomTotal)}</span>
        `;
        container.appendChild(row);
    });

    totalEl.textContent = formatCurrency(grandTotal);
}

export function openPurchasedItemsModal() {
    renderPurchasedItemsSummary();
    toggleModal('purchasedItemsModal', true);
}

export function closePurchasedItemsModal() {
    toggleModal('purchasedItemsModal', false);
}

export function renderPurchasedItemsSummary() {
    const container = document.getElementById('purchasedItemsContainer');
    const totalEl = document.getElementById('purchasedItemsTotal');
    if (!container || !totalEl) return;

    container.innerHTML = '';
    
    const purchasedItems = state.items.filter(item => item.purchased);
    
    if (purchasedItems.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum item comprado ainda.</p>';
        totalEl.textContent = formatCurrency(0);
        return;
    }

    let totalGasto = 0;

    purchasedItems.forEach(item => {
        const price = parseFloat(item.price || 0);
        totalGasto += price;

        const room = state.rooms.find(r => r.name === item.category);
        const color = room ? room.primaryColor : '#E2E8F0';

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 rounded-xl bg-green-50/30 border border-green-100/50';
        row.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-sm">${item.name}</span>
                <span class="text-[10px] text-gray-400 font-bold uppercase flex items-center">
                    <span class="w-2 h-2 rounded-full mr-1" style="background-color: ${color}"></span>
                    ${item.category} • Média Prioridade
                </span>
            </div>
            <span class="font-mono font-bold text-green-600 text-sm">${formatCurrency(price)}</span>
        `;
        container.appendChild(row);
    });

    totalEl.textContent = formatCurrency(totalGasto);
}

export function openHighPriorityModal() {
    renderHighPriorityItems();
    toggleModal('highPriorityModal', true);
}

export function closeHighPriorityModal() {
    toggleModal('highPriorityModal', false);
}

export function renderHighPriorityItems() {
    const container = document.getElementById('highPriorityContainer');
    if (!container) return;

    container.innerHTML = '';
    
    const highPriorityItems = state.items.filter(item => item.priority === 'high' && !item.purchased);
    
    if (highPriorityItems.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum item pendente de alta prioridade.</p>';
        return;
    }

    highPriorityItems.forEach(item => {
        const room = state.rooms.find(r => r.name === item.category);
        const color = room ? room.primaryColor : '#E2E8F0';

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 rounded-xl bg-orange-50/30 border border-orange-100/50';
        row.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-sm">${item.name}</span>
                <span class="text-[10px] text-gray-400 font-bold uppercase flex items-center">
                    <span class="w-2 h-2 rounded-full mr-1" style="background-color: ${color}"></span>
                    ${item.category} • Média Prioridade
                </span>
            </div>
            <span class="font-mono font-bold text-orange-600 text-sm">${formatCurrency(parseFloat(item.price))}</span>
        `;
        container.appendChild(row);
    });
}

export function openMediumPriorityModal() {
    renderMediumPriorityItems();
    toggleModal('mediumPriorityModal', true);
}

export function closeMediumPriorityModal() {
    toggleModal('mediumPriorityModal', false);
}

export function renderMediumPriorityItems() {
    const container = document.getElementById('mediumPriorityContainer');
    if (!container) return;

    container.innerHTML = '';
    
    const items = state.items.filter(item => item.priority === 'medium' && !item.purchased);
    
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum item pendente de média prioridade.</p>';
        return;
    }

    items.forEach(item => {
        const room = state.rooms.find(r => r.name === item.category);
        const color = room ? room.primaryColor : '#E2E8F0';

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 rounded-xl bg-amber-50/30 border border-amber-100/50';
        row.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-sm">${item.name}</span>
                <span class="text-[10px] text-gray-400 font-bold uppercase flex items-center">
                    <span class="w-2 h-2 rounded-full mr-1" style="background-color: ${color}"></span>
                    ${item.category} • Média Prioridade
                </span>
            </div>
            <span class="font-mono font-bold text-amber-600 text-sm">${formatCurrency(parseFloat(item.price))}</span>
        `;
        container.appendChild(row);
    });
}

export function openLowPriorityModal() {
    renderLowPriorityItems();
    toggleModal('lowPriorityModal', true);
}

export function closeLowPriorityModal() {
    toggleModal('lowPriorityModal', false);
}

export function renderLowPriorityItems() {
    const container = document.getElementById('lowPriorityContainer');
    if (!container) return;

    container.innerHTML = '';
    
    const items = state.items.filter(item => item.priority === 'low' && !item.purchased);
    
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhum item pendente de baixa prioridade.</p>';
        return;
    }

    items.forEach(item => {
        const room = state.rooms.find(r => r.name === item.category);
        const color = room ? room.primaryColor : '#E2E8F0';

        const row = document.createElement('div');
        row.className = 'flex items-center justify-between p-3 rounded-xl bg-blue-50/30 border border-blue-100/50';
        row.innerHTML = `
            <div class="flex flex-col">
                <span class="font-bold text-gray-800 text-sm">${item.name}</span>
                <span class="text-[10px] text-gray-400 font-bold uppercase flex items-center">
                    <span class="w-2 h-2 rounded-full mr-1" style="background-color: ${color}"></span>
                    ${item.category} • Média Prioridade
                </span>
            </div>
            <span class="font-mono font-bold text-blue-600 text-sm">${formatCurrency(parseFloat(item.price))}</span>
        `;
        container.appendChild(row);
    });
}

export function openCategoriesSummaryModal() {
    renderCategoriesSummary();
    toggleModal('categoriesSummaryModal', true);
}

export function closeCategoriesSummaryModal() {
    toggleModal('categoriesSummaryModal', false);
}

export function renderCategoriesSummary() {
    const container = document.getElementById('categoriesSummaryContainer');
    if (!container) return;

    container.innerHTML = '';
    
    if (state.rooms.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-400 py-8">Nenhuma categoria (cômodo) cadastrada.</p>';
        return;
    }

    state.rooms.forEach(room => {
        const itemCount = state.items.filter(i => i.category === room.name).length;
        const purchasedCount = state.items.filter(i => i.category === room.name && i.purchased).length;
        const progress = itemCount > 0 ? (purchasedCount / itemCount) * 100 : 0;

        const card = document.createElement('div');
        card.className = 'p-4 rounded-2xl bg-purple-50/50 border border-purple-100 cursor-pointer hover:bg-purple-100 transition';
        card.onclick = () => window.location.href = `rooms/detail.html?id=${room.id}`;
        card.innerHTML = `
            <div class="flex justify-between items-center mb-2">
                <div class="flex items-center space-x-3">
                    <div class="w-3 h-3 rounded-full" style="background-color: ${room.primaryColor}"></div>
                    <span class="font-bold text-purple-900">${room.name}</span>
                </div>
                <span class="text-[10px] font-bold text-purple-400 uppercase">${purchasedCount}/${itemCount} itens</span>
            </div>
            <div class="w-full bg-purple-100 h-1.5 rounded-full overflow-hidden">
                <div class="bg-purple-600 h-full transition-all duration-500" style="width: ${progress}%"></div>
            </div>
        `;
        container.appendChild(card);
    });
}

export function renderSavingsGrid() {
    const setupSection = document.getElementById('savingsSetup');
    const container = document.getElementById('savingsContainer');
    const gridContainer = document.getElementById('savingsGrid');
    const summarySection = document.getElementById('savingsSummary');
    
    if (!setupSection || !container) return;

    // Se não tiver meta definida, mostra o setup
    if (!state.savingsTarget || state.savingsTarget <= 0) {
        setupSection.classList.remove('hidden');
        container.classList.add('hidden');
        if (summarySection) summarySection.classList.add('hidden');
        return;
    }

    // Se tiver meta, mostra o tabuleiro
    setupSection.classList.add('hidden');
    container.classList.remove('hidden');
    if (summarySection) summarySection.classList.remove('hidden');

    // Atualizar Cabeçalho
    const targetEl = document.getElementById('displaySavingsTarget');
    const dateEl = document.getElementById('displaySavingsDate');
    if (targetEl) targetEl.textContent = formatCurrency(state.savingsTarget);
    if (dateEl && state.savingsDate) dateEl.textContent = `${state.savingsDate.month}/${state.savingsDate.year}`;

    if (gridContainer) {
        gridContainer.innerHTML = '';
        let totalSaved = 0;
        
        state.savingsGrid.forEach((cell, index) => {
            totalSaved += cell.value;
            const cellEl = document.createElement('div');
            cellEl.className = `savings-cell completed cursor-pointer group relative`;
            cellEl.dataset.index = index;
            
            // Formatar a data (ex: 17/04)
            const date = cell.timestamp ? new Date(cell.timestamp) : new Date();
            const formattedDate = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;

            cellEl.innerHTML = `
                <span class="text-xs font-black leading-tight">${formatCurrency(cell.value)}</span>
                <div class="flex flex-col items-center mt-1">
                    <span class="savings-author-tag">${cell.author || 'Alguém'}</span>
                    <span class="text-[7px] text-purple-400 font-bold mt-0.5 opacity-70">${formattedDate}</span>
                </div>
                <div class="absolute inset-0 bg-red-500/90 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-2xl transition-opacity z-10">
                    <i class="fas fa-trash-alt text-sm"></i>
                </div>
            `;
            gridContainer.appendChild(cellEl);
        });

        // Atualizar Resumos
        const totalSavedEl = document.getElementById('totalSavedDisplay');
        const progressEl = document.getElementById('savingsProgressDisplay');
        const remainingEl = document.getElementById('remainingToSaveDisplay');

        if (totalSavedEl) totalSavedEl.textContent = formatCurrency(totalSaved);
        if (progressEl) {
            const perc = state.savingsTarget > 0 ? (totalSaved / state.savingsTarget) * 100 : 0;
            progressEl.textContent = `${Math.min(100, perc).toFixed(1)}%`;
        }
        if (remainingEl) {
            const rem = state.savingsTarget - totalSaved;
            remainingEl.textContent = formatCurrency(Math.max(0, rem));
        }

        // Mostrar/Esconder Empty State do Grid
        const emptyGrid = document.getElementById('emptyGridState');
        if (emptyGrid) {
            if (state.savingsGrid.length === 0) emptyGrid.classList.remove('hidden');
            else emptyGrid.classList.add('hidden');
        }
    }
}

export function renderProjectMembers(members, currentUserEmail) {
    const listContainer = document.getElementById('projectMembersList');
    if (!listContainer) return;

    listContainer.innerHTML = '';
    
    if (members.length === 0) {
        listContainer.innerHTML = '<p class="text-[10px] text-gray-400 italic">Nenhum membro encontrado.</p>';
        return;
    }

    members.forEach(member => {
        const isMe = member.email === currentUserEmail;
        const memberEl = document.createElement('div');
        memberEl.className = 'flex items-center space-x-3 p-3 rounded-2xl bg-purple-50/50 border border-purple-100/30 hover:bg-purple-100/50 transition';
        
        const photoContent = member.photoURL 
            ? `<img src="${member.photoURL}" class="w-full h-full object-cover rounded-full">`
            : `<i class="fas fa-user text-purple-600 text-xs"></i>`;

        memberEl.innerHTML = `
            <div class="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center shrink-0 overflow-hidden border-2 border-white shadow-sm">
                ${photoContent}
            </div>
            <div class="min-w-0 flex-1">
                <p class="text-xs font-bold text-purple-900 truncate">${member.name || 'Sem nome'}</p>
                <p class="text-[10px] text-purple-400 font-medium truncate">${member.email}</p>
            </div>
            <div class="shrink-0 text-right">
                <span class="px-2 py-1 bg-white rounded-lg text-[8px] font-black uppercase tracking-wider text-purple-400 border border-purple-100 shadow-sm">
                    ${isMe ? 'Você' : (member.role === 'owner' ? 'Dono' : 'Parceiro')}
                </span>
            </div>
        `;
        listContainer.appendChild(memberEl);
    });
}