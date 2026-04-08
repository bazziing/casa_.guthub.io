import { cloudService } from './classes/CloudService.js';

cloudService.onAuthChange((user) => {
    if (user) {
        window.location.href = 'dashboard/index.html';
    }
});