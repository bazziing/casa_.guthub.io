import { cloudService } from './classes/CloudService.js';

const signupForm = document.getElementById('signupForm');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        
        try {
            await cloudService.signUp(email, password);
            alert('Conta criada com sucesso!');
            window.location.href = '../../dashboard/index.html';
        } catch (error) {
            alert('Erro ao criar conta: ' + error.message);
        }
    });
}

cloudService.onAuthChange((user) => {
    if (user) {
        window.location.href = '../../dashboard/index.html';
    }
});