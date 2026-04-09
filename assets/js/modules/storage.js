import { state, elements } from './state.js';
import { formatCurrency } from './utils.js';

export function loadItemsFromLocalStorage() {
    const savedItems = localStorage.getItem('weddingHomeItems');
    const savedCategories = localStorage.getItem('weddingHomeCategories');
    const savedRooms = localStorage.getItem('weddingHomeRooms');
    const savedBudget = localStorage.getItem('weddingHomeBudget');
    const savedSavingsTarget = localStorage.getItem('weddingHomeSavingsTarget');
    const savedSavingsDate = localStorage.getItem('weddingHomeSavingsDate');
    const savedSavingsFrequency = localStorage.getItem('weddingHomeSavingsFrequency');
    const savedSavingsGrid = localStorage.getItem('weddingHomeSavingsGrid');
   
    if (savedItems) {
        state.items = JSON.parse(savedItems);
    }
   
    if (savedCategories) {
        state.categories = JSON.parse(savedCategories);
    }
   
    if (savedRooms) {
        state.rooms = JSON.parse(savedRooms);
    }
   
    if (savedBudget) {
        state.totalBudget = parseFloat(savedBudget);
        if (elements.totalBudget) {
            elements.totalBudget.value = formatCurrency(state.totalBudget);
        }
    }
    
    if (savedSavingsTarget) state.savingsTarget = parseFloat(savedSavingsTarget);
    if (savedSavingsDate) state.savingsDate = savedSavingsDate;
    if (savedSavingsFrequency) state.savingsFrequency = savedSavingsFrequency;
    if (savedSavingsGrid) state.savingsGrid = JSON.parse(savedSavingsGrid);
}

export function saveItemsToLocalStorage() {
    localStorage.setItem('weddingHomeItems', JSON.stringify(state.items));
    localStorage.setItem('weddingHomeCategories', JSON.stringify(state.categories));
    localStorage.setItem('weddingHomeRooms', JSON.stringify(state.rooms));
    localStorage.setItem('weddingHomeBudget', state.totalBudget.toString());
    
    localStorage.setItem('weddingHomeSavingsTarget', state.savingsTarget.toString());
    localStorage.setItem('weddingHomeSavingsDate', state.savingsDate || '');
    localStorage.setItem('weddingHomeSavingsFrequency', state.savingsFrequency || '');
    localStorage.setItem('weddingHomeSavingsGrid', JSON.stringify(state.savingsGrid || []));
}