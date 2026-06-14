const { api } = window;

let currentPhone = null;
let currentBalance = 0;
let timerInterval = null;
let secondsLeft = 0;
let activeChannel = null;
let isPaused = false;
let settings = { price_per_second: 1, bonus_percent: 5 };

// Загрузка настроек
async function loadSettings() {
    settings = await api.getSettings();
}

// Вход по телефону
document.getElementById('loginBtn').onclick = async () => {
    const phone = document.getElementById('phone').value;
    if (!phone) return alert('Введите номер');
    const res = await api.login(phone);
    if (res.success) {
        currentPhone = phone;
        currentBalance = res.bonus_balance || 0;
        document.getElementById('bonus').innerText = `💰 Бонусы: ${currentBalance} руб`;
        alert('Вход выполнен');
    }
};

// Выбор времени (рубли -> секунды)
document.querySelectorAll('.time-presets button').forEach(btn => {
    btn.onclick = () => {
        const rubles = parseInt(btn.dataset.seconds) / 60 * settings.price_per_second;
        // Здесь должна быть оплата...
    };
});

// Управление реле (только один активный канал)
document.querySelectorAll('.services button').forEach(btn => {
    btn.onclick = async () => {
        if (secondsLeft <= 0) return alert('Пополните баланс');
        const channel = parseInt(btn.dataset.channel);
        if (activeChannel === channel) return;
        if (activeChannel) await api.relayCommand(activeChannel, 'off');
        await api.relayCommand(channel, 'on');
        activeChannel = channel;
        playSound(btn.innerText.includes('Вода') ? 'вода' : btn.innerText.includes('Пена') ? 'пена' : 'воск');
    };
});

// Пауза
document.getElementById('pauseBtn').onclick = () => {
    isPaused = !isPaused;
    document.getElementById('pauseBtn').innerText = isPaused ? '▶️ Продолжить' : '⏸ Пауза';
};

// Остановка
document.getElementById('stopBtn').onclick = async () => {
    if (activeChannel) await api.relayCommand(activeChannel, 'off');
    if (timerInterval) clearInterval(timerInterval);
    if (currentPhone && secondsLeft > 0) {
        const bonusEarn = Math.floor(secondsLeft * settings.price_per_second * settings.bonus_percent / 100);
        await api.addBonus(currentPhone, bonusEarn);
    }
    resetWash();
};

function resetWash() {
    secondsLeft = 0;
    activeChannel = null;
    isPaused = false;
    document.getElementById('timer-display').innerText = '00:00';
}

function playSound(type) {
    // Заглушка: в реальности через HTML5 Audio
    console.log(`Play sound: ${type}`);
}

loadSettings();