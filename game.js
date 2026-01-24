// Основные элементы DOM игры
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Элементы интерфейса игры
const menuScreen = document.getElementById('menu-screen');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const menuHighScoreElement = document.getElementById('menu-high-score');

// Модальное окно игры
const gameModal = document.getElementById('game-modal');
const closeGameBtn = document.getElementById('close-game-btn');
const launchGameBtn = document.getElementById('launch-game-btn');

// Состояние игры
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('dinoHighScore')) || 0;
let lastTime = 0;
let animationId;

// Динозавр
const dino = {
    x: 50,
    y: 0,
    width: 60,
    height: 80,
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.5,
    jumpPower: -15,
    groundY: 0,
    color: '#2d3748'
};

// Массивы объектов
let obstacles = [];
let clouds = [];
let groundOffset = 0;

// Инициализация игры
function initGame() {
    console.log('Инициализация игры...');
    
    // Устанавливаем размеры canvas
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Настраиваем динозавра
    dino.groundY = canvas.height - dino.height - 60;
    dino.y = dino.groundY;
    
    // Загружаем рекорд
    highScoreElement.textContent = `Рекорд: ${highScore}`;
    menuHighScoreElement.textContent = highScore;
    
    // Создаем облака
    clouds = [];
    for (let i = 0; i < 4; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 150,
            width: 50 + Math.random() * 50,
            speed: 0.2 + Math.random() * 0.5
        });
    }
    
    // Настраиваем обработчики событий игры
    setupGameEventListeners();
    
    // Рисуем начальный экран
    drawMenuScreen();
    
    console.log('Игра готова!');
}

// Рисуем экран меню игры
function drawMenuScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1e3c72');
    gradient.addColorStop(1, '#2a5298');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Заголовок
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 30px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🦖 Бегущий динозавр', canvas.width / 2, 80);
    
    // Подзаголовок
    ctx.font = '16px Arial';
    ctx.fillText('Избегайте препятствий!', canvas.width / 2, 120);
    
    // Рекорд
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#f6e05e';
    ctx.fillText(`Рекорд: ${highScore}`, canvas.width / 2, 180);
    
    // Управление
    ctx.fillStyle = '#cbd5e0';
    ctx.font = '14px Arial';
    ctx.fillText('👆 Правая часть экрана - Прыжок', canvas.width / 2, 240);
    ctx.fillText('👇 Левая часть экрана - Пригнуться', canvas.width / 2, 270);
}

// Настройка обработчиков событий игры
function setupGameEventListeners() {
    // Кнопка старта игры
    startBtn.addEventListener('click', startGame);
    
    // Кнопка паузы
    pauseBtn.addEventListener('click', pauseGame);
    
    // Кнопки в меню паузы
    document.getElementById('resume-btn').addEventListener('click', pauseGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('menu-btn').addEventListener('click', returnToGameMenu);
}

// Запуск игры
function startGame() {
    console.log('Запуск игры...');
    
    if (gameRunning) return;
    
    // Скрываем меню
    menuScreen.classList.add('hidden');
    
    // Сбрасываем состояние
    gameRunning = true;
    gamePaused = false;
    score = 0;
    obstacles = [];
    scoreElement.textContent = score;
    
    // Сбрасываем динозавра
    dino.jumping = false;
    dino.ducking = false;
    dino.y = dino.groundY;
    dino.height = 80;
    dino.velocity = 0;
    
    // Запускаем игровой цикл
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

// Пауза игры
function pauseGame() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    const pauseScreen = document.getElementById('pause-screen');
    pauseScreen.classList.toggle('show');
    document.getElementById('pause-score').textContent = score;
    
    if (gamePaused) {
        cancelAnimationFrame(animationId);
    } else {
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        pauseScreen.classList.remove('show');
    }
}

// Перезапуск игры
function restartGame() {
    document.getElementById('pause-screen').classList.remove('show');
    startGame();
}

// Возврат в меню игры
function returnToGameMenu() {
    document.getElementById('pause-screen').classList.remove('show');
    menuScreen.classList.remove('hidden');
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    localStorage.setItem('dinoHighScore', highScore);
}

// Игровой цикл
function gameLoop(currentTime) {
    if (!gameRunning || gamePaused) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    updateGame(deltaTime);
    drawGame();
    
    animationId = requestAnimationFrame(gameLoop);
}

// Обновление состояния игры
function updateGame(deltaTime) {
    // Обновляем счет
    score += Math.floor(deltaTime * 0.01);
    scoreElement.textContent = score;
    
    // Обновляем скорость игры
    const gameSpeed = 5 + Math.floor(score / 1000);
    
    // Обновляем динозавра
    updateDino();
    
    // Обновляем препятствия
    updateObstacles(gameSpeed, deltaTime);
    
    // Обновляем облака
    updateClouds();
    
    // Обновляем смещение земли
    groundOffset = (groundOffset - gameSpeed * 0.5) % 50;
    
    // Проверяем столкновения
    checkCollisions();
    
    // Проверяем рекорд
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = `Рекорд: ${highScore}`;
        menuHighScoreElement.textContent = highScore;
        
        // Показываем сообщение о новом рекорде
        if (score > 0 && score % 500 === 0) {
            showNewRecord();
        }
    }
}

// Обновление динозавра
function updateDino() {
    if (dino.jumping) {
        dino.velocity += dino.gravity;
        dino.y += dino.velocity;
        
        if (dino.y >= dino.groundY) {
            dino.y = dino.groundY;
            dino.jumping = false;
            dino.velocity = 0;
        }
    }
    
    if (dino.ducking && !dino.jumping) {
        dino.height = 50;
        dino.y = dino.groundY + 30;
    } else if (!dino.jumping) {
        dino.height = 80;
        dino.y = dino.groundY;
    }
}

// Обновление препятствий
function updateObstacles(gameSpeed, deltaTime) {
    // Случайно генерируем новые препятствия
    if (Math.random() < 0.005) {
        const obstacleTypes = [
            { width: 40, height: 40, color: '#e53e3e' },
            { width: 60, height: 30, color: '#f6e05e' },
            { width: 50, height: 50, color: '#3182ce' }
        ];
        
        const type = Math.floor(Math.random() * obstacleTypes.length);
        obstacles.push({
            x: canvas.width,
            y: canvas.height - obstacleTypes[type].height - 60,
            width: obstacleTypes[type].width,
            height: obstacleTypes[type].height,
            color: obstacleTypes[type].color
        });
    }
    
    // Двигаем препятствия
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= gameSpeed;
        
        // Удаляем препятствия за пределами экрана
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

// Обновление облака
function updateClouds() {
    for (let cloud of clouds) {
        cloud.x -= cloud.speed;
        
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
            cloud.y = Math.random() * 150;
        }
    }
}

// Проверка столкновений
function checkCollisions() {
    for (let obstacle of obstacles) {
        if (dino.x < obstacle.x + obstacle.width &&
            dino.x + dino.width > obstacle.x &&
            dino.y < obstacle.y + obstacle.height &&
            dino.y + dino.height > obstacle.y) {
            
            // Столкновение - конец игры
            gameOver();
            return;
        }
    }
}

// Конец игры
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Сохраняем рекорд
    localStorage.setItem('dinoHighScore', highScore);
    
    // Показываем меню через секунду
    setTimeout(() => {
        menuScreen.classList.remove('hidden');
    }, 1000);
}

// Отрисовка игры
function drawGame() {
    // Очищаем canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Рисуем небо
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    skyGradient.addColorStop(0, '#1e3c72');
    skyGradient.addColorStop(1, '#2a5298');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
    
    // Рисуем солнце
    drawSun();
    
    // Рисуем облака
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let cloud of clouds) {
        drawCloud(cloud.x, cloud.y, cloud.width);
    }
    
    // Рисуем дорогу
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
    
    // Рисуем разметку
    ctx.fillStyle = '#f7fafc';
    for (let i = 0; i < canvas.width; i += 50) {
        ctx.fillRect(i + groundOffset, canvas.height - 25, 30, 5);
    }
    
    // Рисуем препятствия
    for (let obstacle of obstacles) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Белые полосы на препятствиях
        ctx.fillStyle = '#f7fafc';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 5);
    }
    
    // Рисуем динозавра
    drawDino();
}

// Рисование динозавра
function drawDino() {
    // Тело
    ctx.fillStyle = '#3182ce';
    ctx.fillRect(dino.x, dino.y, dino.width, dino.height);
    
    // Полосы безопасности
    ctx.fillStyle = '#f6e05e';
    ctx.fillRect(dino.x + 5, dino.y + 10, dino.width - 10, 5);
    ctx.fillRect(dino.x + 5, dino.y + 25, dino.width - 10, 5);
    
    // Глаза
    ctx.fillStyle = 'white';
    ctx.fillRect(dino.x + dino.width - 20, dino.y + 15, 10, 10);
    ctx.fillStyle = '#1a202c';
    ctx.fillRect(dino.x + dino.width - 18, dino.y + 17, 6, 6);
    
    // Улыбка
    ctx.beginPath();
    ctx.strokeStyle = '#1a202c';
    ctx.lineWidth = 2;
    ctx.arc(dino.x + dino.width - 30, dino.y + 30, 10, 0, Math.PI);
    ctx.stroke();
    
    // Спинные пластины
    for (let i = 0; i < 5; i++) {
        ctx.fillStyle = '#38a169';
        ctx.beginPath();
        ctx.moveTo(dino.x + 10 + i * 10, dino.y);
        ctx.lineTo(dino.x + 15 + i * 10, dino.y - 20);
        ctx.lineTo(dino.x + 20 + i * 10, dino.y);
        ctx.fill();
    }
    
    // Ноги
    ctx.fillStyle = '#2d3748';
    const legOffset = dino.ducking ? 10 : 0;
    ctx.fillRect(dino.x + 10, dino.y + dino.height - 10, 15, 20 + legOffset);
    ctx.fillRect(dino.x + dino.width - 25, dino.y + dino.height - 10, 15, 20 + legOffset);
    
    // Полосы на ногах
    ctx.fillStyle = '#f6e05e';
    ctx.fillRect(dino.x + 12, dino.y + dino.height - 5, 11, 3);
    ctx.fillRect(dino.x + dino.width - 23, dino.y + dino.height - 5, 11, 3);
    
    // Тень
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(dino.x + dino.width/2, canvas.height - 45, dino.width/2, 8, 0, 0, Math.PI * 2);
    ctx.fill();
}

// Рисование облака
function drawCloud(x, y, width) {
    const height = width * 0.5;
    ctx.beginPath();
    ctx.arc(x + width * 0.2, y + height * 0.5, height * 0.4, 0, Math.PI * 2);
    ctx.arc(x + width * 0.5, y + height * 0.3, height * 0.5, 0, Math.PI * 2);
    ctx.arc(x + width * 0.8, y + height * 0.5, height * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

// Рисование солнца
function drawSun() {
    ctx.fillStyle = '#f6e05e';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 60, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Лучи солнца
    ctx.strokeStyle = '#f6e05e';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const rayLength = 40;
        ctx.beginPath();
        ctx.moveTo(
            canvas.width - 60 + Math.cos(angle) * 30,
            60 + Math.sin(angle) * 30
        );
        ctx.lineTo(
            canvas.width - 60 + Math.cos(angle) * rayLength,
            60 + Math.sin(angle) * rayLength
        );
        ctx.stroke();
    }
}

// Показать новый рекорд
function showNewRecord() {
    const recordEl = document.getElementById('new-record');
    recordEl.classList.add('show');
    
    setTimeout(() => {
        recordEl.classList.remove('show');
    }, 2000);
}

// Управление игрой
function jump() {
    if (!dino.jumping && gameRunning && !gamePaused) {
        dino.jumping = true;
        dino.velocity = dino.jumpPower;
        dino.ducking = false;
    }
}

function duck(start) {
    if (gameRunning && !gamePaused) {
        dino.ducking = start;
    }
}

// Обработка сенсорного ввода
function handleTouchStart(e) {
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    if (touchX > canvas.width / 2) {
        jump();
    } else {
        duck(true);
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    duck(false);
}

// Обработка мыши
function handleMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    if (mouseX > canvas.width / 2) {
        jump();
    } else {
        duck(true);
    }
}

function handleMouseUp(e) {
    duck(false);
}

// Обработка клавиатуры
function handleKeyDown(e) {
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
    } else if (e.code === 'ArrowDown') {
        duck(true);
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowDown') {
        duck(false);
    }
}

// Управление модальным окном игры
function setupModalControls() {
    // Кнопка открытия игры
    launchGameBtn.addEventListener('click', function() {
        gameModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        initGame();
    });
    
    // Кнопка закрытия игры
    closeGameBtn.addEventListener('click', function() {
        gameModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // Останавливаем игру
        gameRunning = false;
        gamePaused = false;
        cancelAnimationFrame(animationId);
    });
    
    // Закрытие по клику вне окна
    gameModal.addEventListener('click', function(e) {
        if (e.target === gameModal) {
            gameModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Останавливаем игру
            gameRunning = false;
            gamePaused = false;
            cancelAnimationFrame(animationId);
        }
    });
    
    // Управление игрой на canvas
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    // Управление клавиатурой
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// Инициализация при загрузке страницы
window.addEventListener('load', function() {
    setupModalControls();
    console.log('Система готова! Нажмите кнопку "Выполнить" для запуска игры.');
    
    // Обновляем год в футере
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});
