import { cloudService } from './classes/CloudService.js';
import { showAlert } from './modules/ui.js';
import { translateFirebaseError } from './modules/utils.js';

const loginForm = document.getElementById('loginForm');
const forgotPasswordBtn = document.getElementById('forgotPasswordBtn');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fas fa-spinner animate-spin mr-2"></i> Entrando...';

            await cloudService.login(email, password);
            window.location.href = '../../dashboard/index.html';
        } catch (error) {
            showAlert(translateFirebaseError(error), 'Erro ao Entrar', 'error');
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    });
}

if (forgotPasswordBtn) {
    forgotPasswordBtn.addEventListener('click', async () => {
        const email = document.getElementById('loginEmail').value;
        if (!email) {
            showAlert('Por favor, digite seu e-mail para recuperar a senha.', 'Aviso');
            document.getElementById('loginEmail').focus();
            return;
        }

        try {
            await cloudService.resetPassword(email);
            showAlert('E-mail de recuperação enviado! Verifique sua caixa de entrada.', 'Sucesso', 'success');
        } catch (error) {
            showAlert('Erro ao enviar e-mail de recuperação: ' + error.message, 'Erro', 'error');
        }
    });
}

cloudService.onAuthChange((user) => {
    if (user) {
        window.location.href = '../../dashboard/index.html';
    }
});