// Инициализация Telegram WebApp
const tg = window.Telegram.WebApp;
tg.expand(); // Развернуть на весь экран

// Данные пользователя
let user = {
    id: tg.initDataUnsafe.user?.id || 0,
    name: tg.initDataUnsafe.user?.first_name || 'Игрок',
    avatar: tg.initDataUnsafe.user?.photo_url || 'https://i.pravatar.cc/150?img=' + Math.floor(Math.random() * 70)
};

// Игровые переменные
let balance = 10.00; // Начальный баланс в звёздах
let currentMultiplier = 1.00;
let isGameRunning = false;
let betAmount = 0.20;
let autoCashout = 2.00;
let currentBet = null;
let gameHistory = [1.25, 2.10, 0.85, 3.45, 1.12]; // Пример истории

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    showUserData();
    updateBalanceDisplay();
    updateHistoryDisplay();
    drawChart();
});

// Показать данные пользователя
function showUserData() {
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userAvatar').src = user.avatar;
    document.getElementById('profileName').textContent = user.name;
    document.getElementById('profileAvatar').src = user.avatar;
}

// Обновить отображение баланса
function updateBalanceDisplay() {
    document.getElementById('balance').textContent = balance.toFixed(2);
}

// Установить сумму ставки
function setBet(amount) {
    betAmount = amount;
    document.getElementById('betAmount').value = amount.toFixed(2);
    document.getElementById('betAmountDisplay').textContent = amount.toFixed(2);
}

// Сделать ставку
function placeBet() {
    if (isGameRunning) {
        alert('Игра уже запущена!');
        return;
    }
    if (betAmount > balance) {
        alert('Недостаточно звёзд! Пополните баланс.');
        return;
    }
    
    // Спишем ставку
    balance -= betAmount;
    updateBalanceDisplay();
    
    // Запуск игры
    currentBet = {
        amount: betAmount,
        cashoutAt: autoCashout,
        placedAt: Date.now()
    };
    
    document.getElementById('placeBetBtn').style.display = 'none';
    document.getElementById('activeBetSection').style.display = 'block';
    document.getElementById('activeBetAmount').textContent = betAmount.toFixed(2);
    
    startGame();
}

// Запуск игры (краш)
function startGame() {
    isGameRunning = true;
    currentMultiplier = 1.00;
    const rocket = document.getElementById('rocket');
    const multiplierDisplay = document.getElementById('currentMultiplier');
    
    // Случайное время "краша" от 1 до 10 секунд
    const crashTime = Math.random() * 9000 + 1000; // от 1 до 10 секунд
    const crashMultiplier = (Math.random() * 5 + 1).toFixed(2); // Множитель краша от 1x до 6x
    
    let startTime = Date.now();
    
    const gameInterval = setInterval(() => {
        if (!isGameRunning) {
            clearInterval(gameInterval);
            return;
        }
        
        const elapsed = Date.now() - startTime;
        currentMultiplier = 1 + (elapsed / 1000) * 0.5; // Рост множителя
        
        // Анимация ракеты
        const rocketHeight = Math.min(100, (elapsed / crashTime) * 100);
        rocket.style.transform = `translateY(-${rocketHeight}px)`;
        
        multiplierDisplay.textContent = currentMultiplier.toFixed(2) + 'x';
        document.getElementById('cashoutMultiplier').textContent = currentMultiplier.toFixed(2);
        
        // Авто-вывод
        if (currentBet && currentMultiplier >= currentBet.cashoutAt) {
            cashOut();
        }
        
        // Краш
        if (elapsed >= crashTime) {
            clearInterval(gameInterval);
            gameOver(crashMultiplier);
        }
    }, 50);
    
    // Записать время краша для отладки
    setTimeout(() => {
        if (isGameRunning) {
            console.log('Краш на множителе:', crashMultiplier);
        }
    }, crashTime);
}

// Забрать выигрыш
function cashOut() {
    if (!currentBet || !isGameRunning) return;
    
    const winAmount = currentBet.amount * currentMultiplier;
    balance += winAmount;
    
    // Добавить в историю
    gameHistory.unshift(parseFloat(currentMultiplier.toFixed(2)));
    if (gameHistory.length > 10) gameHistory.pop();
    
    updateBalanceDisplay();
    updateHistoryDisplay();
    drawChart();
    
    endGame(`Вы успешно забрали ${winAmount.toFixed(2)} ★!`);
}

// Окончание игры (краш)
function gameOver(crashMultiplier) {
    if (!currentBet) return;
    
    // Добавить множитель краша в историю
    gameHistory.unshift(parseFloat(crashMultiplier));
    if (gameHistory.length > 10) gameHistory.pop();
    
    updateHistoryDisplay();
    drawChart();
    
    endGame(`Ракета разбилась на ${crashMultiplier}x! Вы проиграли ${currentBet.amount.toFixed(2)} ★.`);
}

// Сброс игры
function endGame(message) {
    isGameRunning = false;
    currentBet = null;
    
    alert(message);
    
    document.getElementById('placeBetBtn').style.display = 'block';
    document.getElementById('activeBetSection').style.display = 'none';
    
    // Сброс ракеты
    document.getElementById('rocket').style.transform = 'translateY(0)';
    document.getElementById('currentMultiplier').textContent = '1.00x';
}

// Обновить историю
function updateHistoryDisplay() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '';
    
    gameHistory.forEach(mult => {
        const li = document.createElement('li');
        li.textContent = mult + 'x';
        li.style.color = mult >= 2 ? '#00ff00' : mult >= 1 ? '#ffff00' : '#ff4444';
        historyList.appendChild(li);
    });
}

// Нарисовать график
function drawChart() {
    const canvas = document.getElementById('crashChart');
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    ctx.clearRect(0, 0, width, height);
    
    // Простой график из истории
    if (gameHistory.length < 2) return;
    
    ctx.beginPath();
    ctx.moveTo(0, height - gameHistory[0] * 20);
    
    for (let i = 1; i < gameHistory.length; i++) {
        ctx.lineTo(
            (i / (gameHistory.length - 1)) * width,
            height - gameHistory[i] * 20
        );
    }
    
    ctx.strokeStyle = '#00c6ff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

// Покупка звёзд через Telegram Stars
function buyStars(amount) {
    if (!tg.initDataUnsafe) {
        alert('Оплата доступна только в Telegram.');
        return;
    }
    
    // Инициация платежа через Telegram
    tg.showPopup({
        title: 'Покупка звёзд',
        message: `Вы покупаете ${amount} ★ за ≈${amount * 10} ₽`,
        buttons: [
            { type: 'ok', text: 'Купить' },
            { type: 'cancel', text: 'Отмена' }
        ]
    }, function(buttonId) {
        if (buttonId === 'ok') {
            // В реальном приложении здесь вызов Telegram Payments API
            // Для демо просто добавим звёзды
            balance += amount;
            updateBalanceDisplay();
            tg.HapticFeedback.notificationOccurred('success');
            alert(`Успешно! Баланс пополнен на ${amount} ★`);
        }
    });
}

// Переключение экранов
function switchScreen(screen) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    if (screen === 'crash') {
        document.getElementById('mainScreen').classList.add('active');
        document.querySelectorAll('.nav-btn')[1].classList.add('active');
    } else if (screen === 'top') {
        alert('Топ игроков в разработке');
        switchScreen('crash');
    } else if (screen === 'profile') {
        document.getElementById('profileScreen').classList.add('active');
    }
}

function showDeposit() {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('depositScreen').classList.add('active');
}

function showMain() {
    switchScreen('crash');
}

// Обновление поля ставки при ручном вводе
document.getElementById('betAmount').addEventListener('input', function() {
    betAmount = parseFloat(this.value) || 0.20;
    document.getElementById('betAmountDisplay').textContent = betAmount.toFixed(2);
});