import { cloudService } from './classes/CloudService.js';

const loginForm = document.getElementById('loginForm');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            await cloudService.login(email, password);
            window.location.href = '../../dashboard/index.html';
        } catch (error) {
            alert('Erro ao entrar: ' + error.message);
        }
    });
}

cloudService.onAuthChange((user) => {
    if (user) {
        window.location.href = '../../dashboard/index.html';
    }
});