// Инициализация Telegram Mini App
const tg = window.Telegram.WebApp;

// Инициализация приложения
function initTelegramApp() {
    // Расширяем на весь экран
    tg.expand();
    
    // Включаем подтверждение закрытия
    tg.enableClosingConfirmation();
    
    // Показываем кнопку "Назад"
    tg.BackButton.show();
    tg.BackButton.onClick(() => {
        const activeScreen = document.querySelector('.screen.active').id;
        if (activeScreen !== 'mainScreen') {
            showScreen('main');
        } else {
            tg.close();
        }
    });
    
    // Инициализируем пользователя
    initUser();
    
    // Загружаем данные
    loadGameData();
    loadTopPlayers();
    updateOnlinePlayers();
    
    // Обновляем онлайн игроков каждые 30 секунд
    setInterval(updateOnlinePlayers, 30000);
    
    console.log('Telegram Mini App инициализирован');
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
    registrationDate: '01.01.2024'
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

// Инициализация пользователя
function initUser() {
    if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
        const tgUser = tg.initDataUnsafe.user;
        userData.id = tgUser.id;
        userData.name = tgUser.first_name || 'Игрок';
        
        // Устанавливаем аватар
        if (tgUser.photo_url) {
            document.getElementById('userAvatar').innerHTML = `<img src="${tgUser.photo_url}" alt="Avatar">`;
            document.getElementById('profileAvatarLarge').innerHTML = `<img src="${tgUser.photo_url}" alt="Avatar">`;
        }
    }
    
    // Обновляем отображение
    document.getElementById('userName').textContent = userData.name;
    document.getElementById('userId').textContent = userData.id ? userData.id.toString().slice(-4) : '0000';
    document.getElementById('profileName').textContent = userData.name;
    document.getElementById('profileId').textContent = userData.id ? userData.id.toString().slice(-4) : '0000';
    document.getElementById('profileBalance').textContent = userData.balance.toFixed(2);
    document.getElementById('totalDeposited').textContent = userData.totalDeposited.toFixed(2);
    document.getElementById('totalWithdrawn').textContent = userData.totalWithdrawn.toFixed(2);
    document.getElementById('totalGames').textContent = userData.totalGames;
    document.getElementById('totalWon').textContent = userData.totalWon.toFixed(2);
    document.getElementById('winRate').textContent = userData.winRate + '%';
    document.getElementById('recordMultiplier').textContent = userData.recordMultiplier.toFixed(2) + 'x';
    document.getElementById('regDate').textContent = userData.registrationDate;
    document.getElementById('balance').textContent = userData.balance.toFixed(2);
}

// Загрузка игровых данных
function loadGameData() {
    // Загрузка истории из localStorage
    const savedHistory = localStorage.getItem('crashHistory');
    if (savedHistory) {
        gameState.history = JSON.parse(savedHistory);
    } else {
        // Начальная история
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
    
    // Загрузка статистики пользователя
    const savedStats = localStorage.getItem('userStats');
    if (savedStats) {
        const stats = JSON.parse(savedStats);
        Object.assign(userData, stats);
    }
    
    // Обновление отображения
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
    
    gameState.history.slice(0, 10).forEach(game => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-multiplier ${game.win ? 'win' : 'loss'}">${game.multiplier.toFixed(2)}x</div>
            <div class="history-time">${game.time}</div>
        `;
        historyList.appendChild(historyItem);
    });
}

// Обновление статистики пользователя
function updateUserStats() {
    document.getElementById('totalGames').textContent = userData.totalGames;
    document.getElementById('totalWon').textContent = userData.totalWon.toFixed(2);
    document.getElementById('winRate').textContent = userData.winRate + '%';
    document.getElementById('recordMultiplier').textContent = userData.recordMultiplier.toFixed(2) + 'x';
    document.getElementById('profileBalance').textContent = userData.balance.toFixed(2);
    document.getElementById('balance').textContent = userData.balance.toFixed(2);
}

// Обновление онлайн игроков
function updateOnlinePlayers() {
    // Генерация случайного числа онлайн игроков (в реальном приложении получать с сервера)
    gameState.onlinePlayers = Math.floor(Math.random() * 100) + 50;
    document.getElementById('onlinePlayers').textContent = gameState.onlinePlayers;
}

// Загрузка топа игроков
function loadTopPlayers(period = 'day') {
    // Генерация тестовых данных (в реальном приложении получать с сервера)
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
    
    // Обновление отображения
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
    
    // Обновление позиции пользователя
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

// Размещение ставки
function placeBet() {
    if (gameState.isRunning) {
        showNotification('Игра уже запущена!', 'error');
        return;
    }
    
    if (gameState.betAmount > userData.balance) {
        showNotification('Недостаточно звёзд! Пополните баланс.', 'error');
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

// Генерация точки краша
function generateCrashPoint() {
    const random = Math.random();
    
    // Вероятности согласно требованиям:
    // Часто падает на 1.1-1.5x
    // Иногда взлетает до 5x
    // Редко выше 5x
    
    if (random < 0.6) {
        // 60% - падает на 1.1-1.5x
        gameState.crashPoint = 1.1 + Math.random() * 0.4;
    } else if (random < 0.9) {
        // 30% - падает на 1.5-2.5x
        gameState.crashPoint = 1.5 + Math.random() * 1.0;
    } else if (random < 0.98) {
        // 8% - взлетает до 5x
        gameState.crashPoint = 2.5 + Math.random() * 2.5;
    } else {
        // 2% - большой выигрыш
        gameState.crashPoint = 5 + Math.random() * 10;
    }
    
    // Обновление отображения
    document.getElementById('crashPoint').querySelector('span').textContent = gameState.crashPoint.toFixed(2);
}

// Запуск анимации игры
function startGameAnimation() {
    const rocket = document.getElementById('rocket');
    const multiplierDisplay = document.getElementById('currentMultiplier');
    const cashoutMultiplier = document.getElementById('cashoutMultiplier');
    
    let currentMultiplier = 1.00;
    let height = 0;
    let rotation = 0;
    let speed = 0.01;
    
    // Сброс позиции
    rocket.style.bottom = '30px';
    rocket.style.transform = 'translateX(-50%) rotate(0deg)';
    rocket.classList.remove('exploding');
    
    // Запуск игрового цикла
    gameState.gameInterval = setInterval(() => {
        if (!gameState.isRunning) {
            clearInterval(gameState.gameInterval);
            return;
        }
        
        // Увеличение множителя
        currentMultiplier += speed;
        gameState.currentMultiplier = currentMultiplier;
        
        // Увеличение скорости со временем
        speed *= 1.005;
        
        // Анимация ракеты
        height += 0.5;
        rotation = Math.sin(Date.now() / 100) * 15;
        
        rocket.style.bottom = `${30 + height}px`;
        rocket.style.transform = `translateX(-50%) rotate(${rotation}deg)`;
        
        // Обновление отображения множителя
        multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x';
        cashoutMultiplier.textContent = currentMultiplier.toFixed(2);
        
        // Автоматический вывод
        if (gameState.currentBet && currentMultiplier >= gameState.currentBet.cashoutAt) {
            cashOut();
        }
        
        // Проверка на краш
        if (currentMultiplier >= gameState.crashPoint) {
            crashGame();
        }
        
        // Ограничение высоты
        if (height > 150) {
            rocket.style.bottom = '30px';
            height = 0;
        }
    }, 50);
}

// Вывод средств
function cashOut() {
    if (!gameState.isRunning || !gameState.currentBet) return;
    
    clearInterval(gameState.gameInterval);
    
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
    rocket.classList.add('launching');
    
    // Сброс состояния игры
    setTimeout(() => {
        endGame(`Успешно! Вы выиграли ${winAmount.toFixed(2)} ★`);
        rocket.classList.remove('launching');
    }, 1000);
    
    showNotification(`Выигрыш: ${winAmount.toFixed(2)} ★!`, 'success');
}

// Краш игры
function crashGame() {
    if (!gameState.isRunning) return;
    
    clearInterval(gameState.gameInterval);
    
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
    
    // Анимация взрыва
    const rocket = document.getElementById('rocket');
    rocket.classList.add('exploding');
    
    // Обновление отображения
    updateHistoryDisplay();
    updateUserStats();
    
    // Сброс состояния игры
    setTimeout(() => {
        endGame(`Краш на ${gameState.crashPoint.toFixed(2)}x! Вы проиграли ${gameState.currentBet.amount.toFixed(2)} ★`);
        rocket.classList.remove('exploding');
        rocket.style.bottom = '30px';
        rocket.style.transform = 'translateX(-50%) rotate(0deg)';
    }, 500);
    
    showNotification(`Краш на ${gameState.crashPoint.toFixed(2)}x`, 'error');
}

// Завершение игры
function endGame(message) {
    gameState.isRunning = false;
    gameState.currentBet = null;
    gameState.currentMultiplier = 1.00;
    
    document.getElementById('placeBetBtn').style.display = 'flex';
    document.getElementById('cashoutBtn').style.display = 'none';
    document.getElementById('currentMultiplier').textContent = '1.00x';
    
    // Сохранение данных
    saveGameData();
    
    // Можно показать сообщение
    if (message) {
        console.log(message);
    }
}

// Управление экранами
function showScreen(screenId) {
    // Скрываем все экраны
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    // Скрываем все активные кнопки навигации
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Показываем выбранный экран
    let screenElement;
    switch (screenId) {
        case 'main':
            screenElement = document.getElementById('mainScreen');
            document.querySelectorAll('.nav-item')[1].classList.add('active');
            tg.BackButton.hide();
            break;
        case 'top':
            screenElement = document.getElementById('topScreen');
            document.querySelectorAll('.nav-item')[0].classList.add('active');
            tg.BackButton.show();
            break;
        case 'profile':
            screenElement = document.getElementById('profileScreen');
            document.querySelectorAll('.nav-item')[2].classList.add('active');
            tg.BackButton.show();
            break;
        case 'deposit':
            screenElement = document.getElementById('depositScreen');
            tg.BackButton.show();
            break;
        default:
            screenElement = document.getElementById('mainScreen');
    }
    
    if (screenElement) {
        screenElement.classList.add('active');
    }
}

// Пополнение баланса
function setDepositAmount(amount) {
    document.getElementById('depositStars').value = amount;
    updateDepositAmount();
    
    // Активируем пресет
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
    
    // Показываем модальное окно оплаты
    document.getElementById('paymentModal').classList.add('show');
    
    // Имитация процесса оплаты
    setTimeout(() => {
        // Успешная оплата
        userData.balance += stars;
        userData.totalDeposited += stars;
        
        // Обновление отображения
        updateUserStats();
        
        // Закрытие модального окна
        closePaymentModal();
        
        // Показ уведомления
        showNotification(`Баланс пополнен на ${stars} ★!`, 'success');
        
        // Добавление в историю пополнений
        addDepositToHistory(stars);
        
        // В реальном приложении здесь будет вызов Telegram Payments API:
        // tg.sendInvoice({
        //     title: 'Пополнение баланса',
        //     description: `${stars} Telegram Stars`,
        //     payload: 'deposit_' + stars,
        //     currency: 'XTR',
        //     prices: [{ label: 'Stars', amount: stars * 100 }]
        // });
        
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
    
    // Ограничиваем историю 10 записями
    if (historyContainer.children.length > 10) {
        historyContainer.removeChild(historyContainer.lastChild);
    }
}

// Вспомогательные функции
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    const notificationText = notification.querySelector('.notification-text');
    const notificationIcon = notification.querySelector('.notification-icon i');
    
    // Устанавливаем сообщение и иконку
    notificationText.textContent = message;
    
    if (type === 'success') {
        notificationIcon.className = 'fas fa-check-circle';
        notification.style.borderLeftColor = '#00ff00';
    } else {
        notificationIcon.className = 'fas fa-exclamation-circle';
        notification.style.borderLeftColor = '#ff6b6b';
    }
    
    // Показываем уведомление
    notification.classList.add('show');
    
    // Скрываем через 3 секунды
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

function showWithdraw() {
    showNotification('Вывод средств в разработке', 'info');
}

function showReferrals() {
    showNotification('Реферальная система в разработке', 'info');
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
    
    // Инициализация пресетов пополнения
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