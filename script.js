// ===== ОСНОВНЫЕ ИСПРАВЛЕНИЯ =====
const tg = window.Telegram.WebApp;

// Инициализация приложения с исправлениями
function initTelegramApp() {
    // Полноэкранный режим
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Настройка кнопки "Назад" Telegram
    tg.BackButton.onClick(() => {
        const activeScreen = document.querySelector('.screen.active').id;
        switch(activeScreen) {
            case 'mainScreen':
                tg.close();
                break;
            case 'topScreen':
            case 'profileScreen':
            case 'depositScreen':
                showScreen('main');
                break;
        }
    });
    
    // Запрет скроллинга на iOS
    document.addEventListener('touchmove', function(e) {
        // Разрешаем скролл только в определенных элементах
        const allowedScrollElements = document.querySelectorAll('.screen-content');
        let canScroll = false;
        
        allowedScrollElements.forEach(element => {
            if (element.contains(e.target)) {
                canScroll = true;
            }
        });
        
        if (!canScroll) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, { passive: false });
    
    // Запрет горизонтального скролла
    document.addEventListener('wheel', function(e) {
        if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Инициализация пользователя
    initUser();
    
    // Загрузка данных
    loadGameData();
    loadTopPlayers();
    updateOnlinePlayers();
    
    // Обновление онлайн игроков
    setInterval(updateOnlinePlayers, 30000);
    
    // Применение CSS запретов скроллинга
    applyScrollLock();
}

// Применение запретов скроллинга
function applyScrollLock() {
    // Добавляем классы для запрета скроллинга
    document.body.classList.add('no-scroll');
    
    // Для iOS
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
}

// Данные пользователя
let userData = {
    id: null,
    name: 'Игрок',
    balance: 50.00,
    totalGames: 0,
    totalWon: 0,
    totalDeposited: 50.00,
    totalWithdrawn: 0,
    winRate: 0,
    recordMultiplier: 0,
    registrationDate: new Date().toLocaleDateString('ru-RU')
};

// Игровые данные
let gameState = {
    isRunning: false,
    currentMultiplier: 1.00,
    currentBet: null,
    betAmount: 0.20,
    autoCashout: 2.00,
    crashPoint: null,
    gameInterval: null,
    history: [],
    topPlayers: [],
    onlinePlayers: 0
};

// Инициализация пользователя с исправлениями
function initUser() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const tgUser = tg.initDataUnsafe.user;
        userData.id = tgUser.id;
        userData.name = tgUser.first_name || 'Игрок';
        
        // Исправление аватара
        if (tgUser.photo_url) {
            const avatarImg = `<img src="${tgUser.photo_url}" alt="Avatar" class="no-drag" onerror="this.style.display='none'; this.parentElement.innerHTML='👤';">`;
            document.getElementById('userAvatar').innerHTML = avatarImg;
            document.getElementById('profileAvatarLarge').innerHTML = avatarImg;
        } else {
            document.getElementById('userAvatar').innerHTML = '👤';
            document.getElementById('profileAvatarLarge').innerHTML = '👤';
        }
    }
    
    // Обновление отображения
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userId').textContent = userData.id ? userData.id.toString().slice(-4) : '0000';
    document.getElementById('profileName').textContent = userData.name;
    document.getElementById('profileId').textContent = userData.id ? userData.id.toString().slice(-4) : '0000';
    document.getElementById('miniBalance').textContent = userData.balance.toFixed(2);
    updateUserStats();
}

// Управление экранами с исправлениями
function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Обновляем активную кнопку в навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Управление кнопкой "Назад" Telegram
    switch(screenId) {
        case 'main':
            tg.BackButton.hide();
            document.querySelectorAll('.nav-item')[1].classList.add('active');
            break;
        case 'top':
            tg.BackButton.show();
            document.querySelectorAll('.nav-item')[0].classList.add('active');
            break;
        case 'profile':
            tg.BackButton.show();
            document.querySelectorAll('.nav-item')[2].classList.add('active');
            break;
        case 'deposit':
            tg.BackButton.show();
            break;
    }
    
    // Показываем выбранный экран
    let screenElement;
    switch(screenId) {
        case 'main':
            screenElement = document.getElementById('mainScreen');
            break;
        case 'top':
            screenElement = document.getElementById('topScreen');
            break;
        case 'profile':
            screenElement = document.getElementById('profileScreen');
            break;
        case 'deposit':
            screenElement = document.getElementById('depositScreen');
            break;
        default:
            screenElement = document.getElementById('mainScreen');
    }
    
    if (screenElement) {
        screenElement.classList.add('active');
        // Прокручиваем в начало
        const content = screenElement.querySelector('.screen-content');
        if (content) {
            content.scrollTop = 0;
        }
    }
}

// ===== НОВАЯ АНИМАЦИЯ РАКЕТКИ =====
let rocketAnimationInterval = null;

function startGameAnimation() {
    const rocket = document.getElementById('rocket');
    const fire = document.getElementById('rocketFire');
    const multiplierDisplay = document.getElementById('currentMultiplier');
    const cashoutMultiplier = document.getElementById('cashoutMultiplier');
    const crashPointElement = document.getElementById('crashPoint');
    
    // Сброс состояния
    rocket.style.transform = 'translateY(0) rotate(0deg)';
    rocket.classList.remove('rocket-flying', 'rocket-exploding');
    fire.style.display = 'none';
    
    // Показываем точку краша
    crashPointElement.style.display = 'block';
    crashPointElement.querySelector('span').textContent = gameState.crashPoint.toFixed(2);
    
    let currentMultiplier = 1.00;
    let animationStep = 0;
    
    // Запускаем анимацию
    rocket.classList.add('rocket-flying');
    fire.style.display = 'block';
    
    // Очищаем предыдущий интервал
    if (rocketAnimationInterval) {
        clearInterval(rocketAnimationInterval);
    }
    
    rocketAnimationInterval = setInterval(() => {
        if (!gameState.isRunning) {
            clearInterval(rocketAnimationInterval);
            return;
        }
        
        // Увеличиваем множитель
        animationStep += 0.02;
        currentMultiplier = 1 + animationStep;
        gameState.currentMultiplier = currentMultiplier;
        
        // Обновляем отображение
        multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x';
        cashoutMultiplier.textContent = currentMultiplier.toFixed(2);
        
        // Автовывод
        if (gameState.currentBet && currentMultiplier >= gameState.currentBet.cashoutAt) {
            cashOut();
        }
        
        // Проверка на краш
        if (currentMultiplier >= gameState.crashPoint) {
            crashGame();
        }
        
        // Эффект дрожания при приближении к крашу
        if (gameState.crashPoint - currentMultiplier < 0.5) {
            const shake = (Math.random() - 0.5) * 4;
            rocket.style.transform = `translateY(${shake}px) rotate(${shake * 2}deg)`;
        }
    }, 100);
}

function crashGame() {
    if (!gameState.isRunning) return;
    
    clearInterval(rocketAnimationInterval);
    
    const rocket = document.getElementById('rocket');
    const fire = document.getElementById('rocketFire');
    
    // Анимация взрыва
    rocket.classList.remove('rocket-flying');
    rocket.classList.add('rocket-exploding');
    fire.style.display = 'none';
    
    // Добавление в историю
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    gameState.history.unshift({
        multiplier: parseFloat(gameState.crashPoint.toFixed(2)),
        win: false,
        time: time
    });
    
    userData.totalGames++;
    userData.winRate = Math.round((userData.totalGames > 0 ? 
        (userData.totalGames - (userData.totalGames * 0.4)) / userData.totalGames * 100 : 0));
    
    // Обновление отображения
    updateHistoryDisplay();
    updateUserStats();
    
    // Сброс состояния игры
    setTimeout(() => {
        endGame(`Краш на ${gameState.crashPoint.toFixed(2)}x!`);
        rocket.classList.remove('rocket-exploding');
        rocket.style.transform = 'translateY(0) rotate(0deg)';
    }, 500);
    
    showNotification(`Краш на ${gameState.crashPoint.toFixed(2)}x`, 'error');
}

function cashOut() {
    if (!gameState.isRunning || !gameState.currentBet) return;
    
    clearInterval(rocketAnimationInterval);
    
    const winAmount = gameState.currentBet.amount * gameState.currentMultiplier;
    
    // Начисление выигрыша
    userData.balance += winAmount;
    userData.totalWon += winAmount - gameState.currentBet.amount;
    userData.totalGames++;
    
    // Обновление рекорда
    if (gameState.currentMultiplier > userData.recordMultiplier) {
        userData.recordMultiplier = gameState.currentMultiplier;
    }
    
    // Обновление win rate
    userData.winRate = Math.round((userData.totalGames > 0 ? 
        (userData.totalGames - (userData.totalGames * 0.4)) / userData.totalGames * 100 : 0));
    
    // Добавление в историю
    const now = new Date();
    const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    gameState.history.unshift({
        multiplier: parseFloat(gameState.currentMultiplier.toFixed(2)),
        win: true,
        time: time
    });
    
    // Обновление отображения
    updateHistoryDisplay();
    updateUserStats();
    
    // Анимация успешного вывода
    const rocket = document.getElementById('rocket');
    rocket.classList.remove('rocket-flying');
    
    // Сброс состояния игры
    setTimeout(() => {
        endGame(`Успешно! Выигрыш: ${winAmount.toFixed(2)} ★`);
        rocket.style.transform = 'translateY(0) rotate(0deg)';
    }, 300);
    
    showNotification(`Выигрыш: ${winAmount.toFixed(2)} ★!`, 'success');
}

// ===== ИСПРАВЛЕННЫЕ ФУНКЦИИ =====

// Обновление статистики пользователя
function updateUserStats() {
    document.getElementById('totalGames').textContent = userData.totalGames;
    document.getElementById('totalWon').textContent = userData.totalWon.toFixed(2);
    document.getElementById('winRate').textContent = userData.winRate + '%';
    document.getElementById('recordMultiplier').textContent = userData.recordMultiplier.toFixed(2) + 'x';
    document.getElementById('profileBalance').textContent = userData.balance.toFixed(2);
    document.getElementById('balance').textContent = userData.balance.toFixed(2);
    document.getElementById('miniBalance').textContent = userData.balance.toFixed(2);
}

// Генерация точки краша с правильными вероятностями
function generateCrashPoint() {
    const random = Math.random();
    
    if (random < 0.4) {
        // 40% - падает на 1.1-1.5x (часто)
        gameState.crashPoint = 1.1 + Math.random() * 0.4;
    } else if (random < 0.8) {
        // 40% - падает на 1.5-2.0x
        gameState.crashPoint = 1.5 + Math.random() * 0.5;
    } else if (random < 0.95) {
        // 15% - взлетает до 3.0x
        gameState.crashPoint = 2.0 + Math.random() * 1.0;
    } else {
        // 5% - большой выигрыш 3.0-5.0x
        gameState.crashPoint = 3.0 + Math.random() * 2.0;
    }
    
    // Ограничение максимального множителя
    if (gameState.crashPoint > 5.0) {
        gameState.crashPoint = 5.0;
    }
}

// Размещение ставки
function placeBet() {
    if (gameState.isRunning) {
        showNotification('Игра уже запущена!', 'error');
        return;
    }
    
    if (gameState.betAmount > userData.balance) {
        showNotification('Недостаточно звёзд!', 'error');
        return;
    }
    
    // Списываем ставку
    userData.balance -= gameState.betAmount;
    updateUserStats();
    
    // Начинаем игру
    gameState.isRunning = true;
    gameState.currentBet = {
        amount: gameState.betAmount,
        cashoutAt: gameState.autoCashout
    };
    
    // Скрываем кнопку ставки, показываем кнопку вывода
    document.getElementById('placeBetBtn').style.display = 'none';
    document.getElementById('cashoutBtn').style.display = 'flex';
    
    // Генерация точки краша
    generateCrashPoint();
    
    // Запуск анимации
    startGameAnimation();
    
    showNotification('Ставка принята! Удачи!', 'success');
}

// Завершение игры
function endGame(message) {
    gameState.isRunning = false;
    gameState.currentBet = null;
    gameState.currentMultiplier = 1.00;
    
    document.getElementById('placeBetBtn').style.display = 'flex';
    document.getElementById('cashoutBtn').style.display = 'none';
    document.getElementById('currentMultiplier').textContent = '1.00x';
    document.getElementById('crashPoint').style.display = 'none';
    
    // Останавливаем огонь
    document.getElementById('rocketFire').style.display = 'none';
    
    // Сохранение данных
    saveGameData();
}

// ===== ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений, но с исправлениями) =====

// Загрузка игровых данных
function loadGameData() {
    const savedHistory = localStorage.getItem('crashHistory');
    if (savedHistory) {
        gameState.history = JSON.parse(savedHistory);
    } else {
        gameState.history = [
            { multiplier: 1.25, win: true, time: '12:30' },
            { multiplier: 2.10, win: true, time: '12:28' },
            { multiplier: 0.85, win: false, time: '12:25' },
            { multiplier: 3.45, win: true, time: '12:22' },
            { multiplier: 1.12, win: true, time: '12:20' },
            { multiplier: 5.20, win: true, time: '12:18' },
            { multiplier: 1.75, win: true, time: '12:15' },
            { multiplier: 0.95, win: false, time: '12:12' },
            { multiplier: 2.80, win: true, time: '12:10' },
            { multiplier: 1.50, win: true, time: '12:08' }
        ];
    }
    
    const savedStats = localStorage.getItem('userStats');
    if (savedStats) {
        const stats = JSON.parse(savedStats);
        Object.assign(userData, stats);
    }
    
    updateHistoryDisplay();
    updateUserStats();
}

// Сохранение данных
function saveGameData() {
    localStorage.setItem('crashHistory', JSON.stringify(gameState.history.slice(0, 50)));
    localStorage.setItem('userStats', JSON.stringify(userData));
}

// Обновление истории
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    gameState.history.slice(0, 8).forEach(game => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-multiplier ${game.win ? 'win' : 'loss'}">${game.multiplier.toFixed(2)}x</div>
            <div class="history-time">${game.time}</div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Обновление онлайн игроков
function updateOnlinePlayers() {
    gameState.onlinePlayers = Math.floor(Math.random() * 100) + 50;
    document.getElementById('onlinePlayers').textContent = gameState.onlinePlayers;
}

// Загрузка топа игроков
function loadTopPlayers(period = 'day') {
    gameState.topPlayers = [
        { id: 1, name: 'Алексей 🏆', profit: 150.50, avatar: '👑', games: 42 },
        { id: 2, name: 'Мария ⭐', profit: 120.75, avatar: '⭐', games: 38 },
        { id: 3, name: 'Дмитрий 🚀', profit: 98.20, avatar: '🚀', games: 45 },
        { id: 4, name: 'Анна 💎', profit: 87.30, avatar: '💎', games: 31 },
        { id: 5, name: 'Сергей 🎯', profit: 76.80, avatar: '🎯', games: 29 },
        { id: 6, name: 'Ольга ✨', profit: 65.40, avatar: '✨', games: 36 },
        { id: 7, name: 'Иван 🔥', profit: 54.90, avatar: '🔥', games: 41 },
        { id: 8, name: 'Екатерина 💫', profit: 43.20, avatar: '💫', games: 27 },
        { id: 9, name: 'Павел ⚡', profit: 32.10, avatar: '⚡', games: 33 },
        { id: 10, name: 'Наталья 🌟', profit: 21.50, avatar: '🌟', games: 25 }
    ];
    
    const topList = document.getElementById('topList');
    topList.innerHTML = '';
    
    gameState.topPlayers.forEach((player, index) => {
        const topPlayer = document.createElement('div');
        topPlayer.className = 'top-player';
        topPlayer.innerHTML = `
            <div class="top-rank">${index + 1}</div>
            <div class="player-avatar">${player.avatar}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-stats">
                    <span>${player.games} игр</span>
                    <span class="player-profit">+${player.profit.toFixed(2)} ★</span>
                </div>
            </div>
        `;
        topList.appendChild(topPlayer);
    });
    
    document.getElementById('userRank').textContent = Math.floor(Math.random() * 100) + 11;
    document.getElementById('userProfit').textContent = userData.totalWon.toFixed(2);
}

// Управление ставками
function setBetAmount(amount) {
    if (gameState.isRunning) return;
    
    gameState.betAmount = amount;
    document.getElementById('betAmount').value = amount.toFixed(2);
    document.getElementById('displayBetAmount').textContent = amount.toFixed(2);
    document.getElementById('currentBetAmount').textContent = amount.toFixed(2);
    
    updatePotentialWin();
}

function changeBet(amount) {
    if (gameState.isRunning) return;
    
    const current = parseFloat(document.getElementById('betAmount').value);
    const newAmount = Math.max(0.10, current + amount);
    setBetAmount(newAmount);
}

function updateBet() {
    const input = document.getElementById('betAmount');
    let amount = parseFloat(input.value);
    
    if (isNaN(amount) || amount < 0.10) {
        amount = 0.10;
        input.value = amount.toFixed(2);
    }
    
    setBetAmount(amount);
}

function updateAutoCashout() {
    const slider = document.getElementById('cashoutSlider');
    const value = parseFloat(slider.value);
    
    gameState.autoCashout = value;
    document.getElementById('cashoutValue').textContent = value.toFixed(2) + 'x';
    document.getElementById('autoCashoutValue').textContent = value.toFixed(2);
    
    updatePotentialWin();
}

function setAutoCashout(value) {
    gameState.autoCashout = value;
    document.getElementById('cashoutSlider').value = value;
    document.getElementById('cashoutValue').textContent = value.toFixed(2) + 'x';
    document.getElementById('autoCashoutValue').textContent = value.toFixed(2);
    
    updatePotentialWin();
}

function updatePotentialWin() {
    const potentialWin = gameState.betAmount * gameState.autoCashout;
    document.getElementById('potentialWin').textContent = potentialWin.toFixed(2);
}

// Пополнение баланса
function setDepositAmount(amount) {
    document.getElementById('depositStars').value = amount;
    updateDepositAmount();
    
    document.querySelectorAll('.amount-preset').forEach(preset => {
        preset.classList.remove('active');
        if (parseInt(preset.dataset.amount) === amount) {
            preset.classList.add('active');
        }
    });
}

function updateDepositAmount() {
    const stars = parseInt(document.getElementById('depositStars').value) || 10;
    const rub = stars * 10;
    
    document.getElementById('depositRub').textContent = rub;
    document.getElementById('payStars').textContent = stars;
    document.getElementById('modalStars').textContent = stars;
    document.getElementById('modalRub').textContent = rub;
}

function processPayment() {
    const stars = parseInt(document.getElementById('depositStars').value) || 10;
    
    document.getElementById('paymentModal').classList.add('show');
    
    setTimeout(() => {
        userData.balance += stars;
        userData.totalDeposited += stars;
        
        updateUserStats();
        closePaymentModal();
        showNotification(`Баланс пополнен на ${stars} ★!`, 'success');
        addDepositToHistory(stars);
    }, 2000);
}

function closePaymentModal() {
    document.getElementById('paymentModal').classList.remove('show');
}

function addDepositToHistory(amount) {
    const historyContainer = document.getElementById('depositHistory');
    const now = new Date();
    const date = `${now.getDate().toString().padStart(2, '0')}.${(now.getMonth() + 1).toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.innerHTML = `
        <div class="history-date">${date}</div>
        <div class="history-amount"><i class="fas fa-star"></i> ${amount}</div>
        <div class="history-status success">Успешно</div>
    `;
    
    historyContainer.insertBefore(historyItem, historyContainer.firstChild);
    
    if (historyContainer.children.length > 5) {
        historyContainer.removeChild(historyContainer.lastChild);
    }
}

// Вспомогательные функции
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = notification.querySelector('.notification-text');
    const notificationIcon = notification.querySelector('.notification-icon i');
    
    notificationText.textContent = message;
    
    if (type === 'success') {
        notificationIcon.className = 'fas fa-check-circle';
        notification.style.borderLeftColor = '#00ff00';
    } else if (type === 'error') {
        notificationIcon.className = 'fas fa-exclamation-circle';
        notification.style.borderLeftColor = '#ff6b6b';
    } else {
        notificationIcon.className = 'fas fa-info-circle';
        notification.style.borderLeftColor = '#00c6ff';
    }
    
    notification.classList.add('show');
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Заглушки для дополнительных функций
function showInventory() {
    showNotification('Инвентарь в разработке', 'info');
}

function showRewards() {
    showNotification('Награды в разработке', 'info');
}

function showTransactions() {
    showNotification('История операций в разработке', 'info');
}

function showSettings() {
    showNotification('Настройки в разработке', 'info');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    initTelegramApp();
    
    // Инициализация событий
    document.getElementById('betAmount').addEventListener('input', updateBet);
    document.getElementById('cashoutSlider').addEventListener('input', updateAutoCashout);
    document.getElementById('depositStars').addEventListener('input', updateDepositAmount);
    
    // Инициализация пресетов
    document.querySelectorAll('.top-tab').forEach(tab => {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.top-tab').forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            loadTopPlayers(this.dataset.period);
        });
    });
    
    // Инициализация пресетов сумм пополнения
    document.querySelectorAll('.amount-preset').forEach(preset => {
        preset.addEventListener('click', function() {
            const amount = parseInt(this.dataset.amount);
            setDepositAmount(amount);
        });
    });
    
    // Установка начальных значений
    updateAutoCashout();
    updateDepositAmount();
    updatePotentialWin();
});

// Обработка платежей через Telegram
tg.onEvent('invoiceClosed', function(eventData) {
    if (eventData.status === 'paid') {
        const stars = parseInt(eventData.payload.split('_')[1]);
        userData.balance += stars;
        userData.totalDeposited += stars;
        updateUserStats();
        showNotification(`Баланс пополнен на ${stars} ★!`, 'success');
        addDepositToHistory(stars);
    }
});