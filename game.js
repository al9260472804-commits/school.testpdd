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
const pauseScreen = document.getElementById('pause-screen');

// Состояние игры
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
let lastTime = 0;
let animationId;

// Игрок
const player = {
    x: 50,
    y: 0,
    width: 60,
    height: 80,
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.5,
    jumpPower: -12,
    groundY: 0
};

// Массивы объектов
let obstacles = [];
let clouds = [];
let groundOffset = 0;

// ========================================
// ИНИЦИАЛИЗАЦИЯ ИГРЫ
// ========================================
function initGame() {
    console.log('Инициализация игры...');
    
    // Устанавливаем размеры canvas
    const container = document.querySelector('.game-container');
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Настраиваем игрока
    player.groundY = canvas.height - player.height - 50;
    player.y = player.groundY;
    
    // Загружаем рекорд
    highScoreElement.textContent = `Рекорд: ${highScore}`;
    menuHighScoreElement.textContent = highScore;
    
    // Создаем облака
    clouds = [];
    for (let i = 0; i < 3; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 150,
            width: 50 + Math.random() * 50,
            speed: 0.1 + Math.random() * 0.3
        });
    }
    
    // Очищаем препятствия
    obstacles = [];
    
    // Показываем меню
    menuScreen.classList.remove('hidden');
    pauseScreen.classList.remove('show');
    
    // Рисуем меню
    drawMenuScreen();
    
    // Настраиваем обработчики событий
    setupGameEventListeners();
}

// ========================================
// РИСОВАНИЕ МЕНЮ
// ========================================
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
    ctx.fillText('🏃 Бегущий динозавр', canvas.width / 2, 80);
    
    // Подзаголовок
    ctx.font = '16px Arial';
    ctx.fillText('Избегай препятствия', canvas.width / 2, 120);
    
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

// ========================================
// НАСТРОЙКА ОБРАБОТЧИКОВ
// ========================================
function setupGameEventListeners() {
    // Удаляем старые обработчики
    startBtn.removeEventListener('click', startGameHandler);
    pauseBtn.removeEventListener('click', pauseGameHandler);
    
    // Добавляем новые обработчики
    startBtn.addEventListener('click', startGameHandler);
    pauseBtn.addEventListener('click', pauseGameHandler);
    
    // Обработчики для паузы
    document.getElementById('resume-btn').addEventListener('click', resumeGameHandler);
    document.getElementById('restart-btn').addEventListener('click', restartGameHandler);
    document.getElementById('menu-btn').addEventListener('click', menuGameHandler);
    
    // Управление
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('keydown', handleKeyDown);
}

function startGameHandler() {
    console.log('Начало игры');
    startGame();
}

function pauseGameHandler() {
    console.log('Пауза игры');
    pauseGame();
}

function resumeGameHandler() {
    console.log('Продолжить игру');
    pauseGame();
}

function restartGameHandler() {
    console.log('Перезапуск игры');
    restartGame();
}

function menuGameHandler() {
    console.log('Возврат в меню');
    returnToMenu();
}

// ========================================
// ОБРАБОТКА УПРАВЛЕНИЯ
// ========================================
function handleCanvasClick(e) {
    if (!gameRunning || gamePaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    if (clickX > canvas.width / 2) {
        jump();
    } else {
        duck(true);
        setTimeout(() => duck(false), 500);
    }
}

function handleTouchStart(e) {
    if (!gameRunning || gamePaused) return;
    
    e.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const touchX = e.touches[0].clientX - rect.left;
    
    if (touchX > canvas.width / 2) {
        jump();
    } else {
        duck(true);
        setTimeout(() => duck(false), 500);
    }
}

function handleKeyDown(e) {
    if (!gameRunning || gamePaused) return;
    
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
    } else if (e.code === 'ArrowDown') {
        duck(true);
        setTimeout(() => duck(false), 500);
    }
}

function jump() {
    if (!player.jumping && gameRunning && !gamePaused) {
        player.jumping = true;
        player.velocity = player.jumpPower;
        player.ducking = false;
    }
}

function duck(start) {
    if (gameRunning && !gamePaused) {
        player.ducking = start;
    }
}

// ========================================
// ЗАПУСК ИГРЫ
// ========================================
function startGame() {
    if (gameRunning) return;
    
    menuScreen.classList.add('hidden');
    gameRunning = true;
    gamePaused = false;
    score = 0;
    obstacles = [];
    scoreElement.textContent = 0;
    
    // Сброс игрока
    player.jumping = false;
    player.ducking = false;
    player.y = player.groundY;
    player.velocity = 0;
    
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

// ========================================
// ПАУЗА ИГРЫ
// ========================================
function pauseGame() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        cancelAnimationFrame(animationId);
        pauseScreen.classList.add('show');
        document.getElementById('pause-score').textContent = score;
    } else {
        pauseScreen.classList.remove('show');
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
    }
}

// ========================================
// ПЕРЕЗАПУСК ИГРЫ
// ========================================
function restartGame() {
    pauseScreen.classList.remove('show');
    startGame();
}

// ========================================
// ВОЗВРАТ В МЕНЮ
// ========================================
function returnToMenu() {
    pauseScreen.classList.remove('show');
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
    // Сохраняем рекорд
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('gameHighScore', highScore);
    }
    
    // Сбрасываем игру
    initGame();
}

// ========================================
// ИГРОВОЙ ЦИКЛ
// ========================================
function gameLoop(currentTime) {
    if (!gameRunning || gamePaused) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    updateGame(deltaTime);
    drawGame();
    
    animationId = requestAnimationFrame(gameLoop);
}

// ========================================
// ОБНОВЛЕНИЕ ИГРЫ
// ========================================
function updateGame(deltaTime) {
    // Обновляем счет
    score += 1;
    scoreElement.textContent = score;
    
    // Обновляем игрока
    updatePlayer();
    
    // Обновляем препятствия
    updateObstacles();
    
    // Обновляем облака
    updateClouds();
    
    // Движение земли
    groundOffset = (groundOffset - 2) % 50;
    
    // Проверка столкновений
    checkCollisions();
    
    // Обновляем рекорд
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = `Рекорд: ${highScore}`;
        menuHighScoreElement.textContent = highScore;
    }
}

function updatePlayer() {
    if (player.jumping) {
        player.velocity += player.gravity;
        player.y += player.velocity;
        
        if (player.y >= player.groundY) {
            player.y = player.groundY;
            player.jumping = false;
            player.velocity = 0;
        }
    }
    
    if (player.ducking && !player.jumping) {
        player.height = 50;
        player.y = player.groundY + 30;
    } else if (!player.jumping) {
        player.height = 80;
        player.y = player.groundY;
    }
}

function updateObstacles() {
    // Создаем препятствия
    if (Math.random() < 0.005) {
        const height = 40 + Math.random() * 40;
        obstacles.push({
            x: canvas.width,
            y: canvas.height - height - 50,
            width: 30,
            height: height,
            speed: 3 + Math.random() * 2
        });
    }
    
    // Двигаем препятствия
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacles[i].speed;
        
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
        }
    }
}

function updateClouds() {
    for (let cloud of clouds) {
        cloud.x -= cloud.speed;
        
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
            cloud.y = Math.random() * 150;
        }
    }
}

function checkCollisions() {
    for (let obstacle of obstacles) {
        if (player.x < obstacle.x + obstacle.width &&
            player.x + player.width > obstacle.x &&
            player.y < obstacle.y + obstacle.height &&
            player.y + player.height > obstacle.y) {
            gameOver();
            return;
        }
    }
}

// ========================================
// КОНЕЦ ИГРЫ
// ========================================
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Сохраняем рекорд
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('gameHighScore', highScore);
    }
    
    // Показываем меню через секунду
    setTimeout(() => {
        menuScreen.classList.remove('hidden');
    }, 1000);
}

// ========================================
// ОТРИСОВКА ИГРЫ
// ========================================
function drawGame() {
    // Очищаем экран
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Небо
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    skyGradient.addColorStop(0, '#87CEEB');
    skyGradient.addColorStop(1, '#E0F7FF');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
    
    // Солнце
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 60, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Облака
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let cloud of clouds) {
        drawCloud(cloud.x, cloud.y, cloud.width);
    }
    
    // Земля
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
    
    // Трава
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, 10);
    
    // Дорожная разметка
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < canvas.width; i += 100) {
        ctx.fillRect(i + groundOffset, canvas.height - 30, 50, 5);
    }
    
    // Препятствия
    ctx.fillStyle = '#8B0000';
    for (let obstacle of obstacles) {
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Полоски на препятствии
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 3);
        ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 8, obstacle.width - 10, 3);
        ctx.fillStyle = '#8B0000';
    }
    
    // Игрок
    drawPlayer();
}

function drawCloud(x, y, width) {
    const height = width * 0.5;
    ctx.beginPath();
    ctx.arc(x + width * 0.2, y + height * 0.5, height * 0.4, 0, Math.PI * 2);
    ctx.arc(x + width * 0.5, y + height * 0.3, height * 0.5, 0, Math.PI * 2);
    ctx.arc(x + width * 0.8, y + height * 0.5, height * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawPlayer() {
    // Тело игрока
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Голова
    ctx.fillStyle = '#FF6347';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 10, player.y + 15, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаз
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 5, player.y + 12, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Рот
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + player.width - 12, player.y + 20, 5, 0, Math.PI);
    ctx.stroke();
    
    // Полоски на теле
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 3; i++) {
        ctx.fillRect(player.x + 5, player.y + 15 + i * 15, player.width - 10, 3);
    }
}

// ========================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ
// ========================================
function setupModalControls() {
    const gameModal = document.getElementById('game-modal');
    const closeGameBtn = document.getElementById('close-game-btn');
    const launchGameBtn = document.getElementById('launch-game-btn');
    
    if (launchGameBtn) {
        launchGameBtn.addEventListener('click', function() {
            gameModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            initGame();
        });
    }
    
    if (closeGameBtn) {
        closeGameBtn.addEventListener('click', function() {
            gameModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Останавливаем игру
            gameRunning = false;
            gamePaused = false;
            cancelAnimationFrame(animationId);
        });
    }
    
    if (gameModal) {
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
    }
}

// ========================================
// ЗАГРУЗКА СТРАНИЦЫ
// ========================================
window.addEventListener('load', function() {
    console.log('Страница загружена');
    
    // Настраиваем управление модальным окном
    setupModalControls();
    
    // Обновляем год в футере
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    // Инициализируем игру при первом открытии
    const gameModal = document.getElementById('game-modal');
    if (gameModal && gameModal.classList.contains('show')) {
        initGame();
    }
});
