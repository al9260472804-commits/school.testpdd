// Основные элементы DOM игры
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Элементы интерфейса игры
const menuScreen = document.getElementById('menu-screen');
const pauseScreen = document.getElementById('pause-screen');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resumeBtn = document.getElementById('resume-btn');
const restartBtn = document.getElementById('restart-btn');
const menuBtn = document.getElementById('menu-btn');
const scoreElement = document.getElementById('score');
const highScoreElement = document.getElementById('high-score');
const menuHighScoreElement = document.getElementById('menu-high-score');
const pauseScoreElement = document.getElementById('pause-score');

// Модальное окно игры
const gameModal = document.getElementById('game-modal');
const closeGameBtn = document.getElementById('close-game-btn');
const launchGameBtn = document.getElementById('launch-game-btn');

// Игровые настройки
const GAME_CONFIG = {
    INITIAL_SPEED: 4,
    SPEED_INCREASE: 0.001,
    MIN_SPAWN_INTERVAL: 600
};

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
    width: 44,
    height: 47,
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.6,
    jumpPower: -12,
    groundY: 0
};

// Препятствия
let obstaclesArray = [];
let clouds = [];
let groundOffset = 0;

// Настройки игры
const gameSettings = {
    currentSpeed: GAME_CONFIG.INITIAL_SPEED,
    spawnTimer: 0,
    spawnInterval: 1000,
    minGap: 150
};

// ========================================
// ИНИЦИАЛИЗАЦИЯ ИГРЫ
// ========================================
function initGame() {
    console.log('🎮 Инициализация игры...');
    
    // Убедимся что canvas существует
    if (!canvas) {
        console.error('Canvas не найден!');
        return;
    }
    
    // Устанавливаем размеры canvas
    const container = document.querySelector('.game-container');
    if (container) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight || 400;
    } else {
        canvas.width = 500;
        canvas.height = 400;
    }
    
    // Сброс состояния игрока
    player.groundY = canvas.height - player.height - 10;
    player.y = player.groundY;
    player.jumping = false;
    player.ducking = false;
    player.velocity = 0;
    
    // Загрузка рекорда
    highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
    if (highScoreElement) highScoreElement.textContent = `Рекорд: ${highScore}`;
    if (menuHighScoreElement) menuHighScoreElement.textContent = highScore;
    
    // Сброс настроек игры
    gameSettings.currentSpeed = GAME_CONFIG.INITIAL_SPEED;
    gameSettings.spawnTimer = 0;
    
    // Очистка массивов
    obstaclesArray = [];
    clouds = [];
    score = 0;
    if (scoreElement) scoreElement.textContent = 0;
    
    // Создание облаков
    for (let i = 0; i < 3; i++) {
        clouds.push({
            x: Math.random() * canvas.width * 2,
            y: 30 + Math.random() * 100,
            width: 40 + Math.random() * 60,
            speed: 0.5 + Math.random() * 1
        });
    }
    
    // Показ меню
    if (menuScreen) menuScreen.classList.remove('hidden');
    if (pauseScreen) pauseScreen.classList.remove('show');
    
    // Отрисовка меню
    drawMenuScreen();
    
    // Настройка обработчиков
    setupGameEventListeners();
    
    console.log('✅ Игра инициализирована');
}

// ========================================
// РИСОВАНИЕ МЕНЮ
// ========================================
function drawMenuScreen() {
    if (!ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a365d');
    gradient.addColorStop(1, '#2d3748');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Заголовок
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Бегущий динозавр', canvas.width / 2, 80);
    
    // Рекорд
    ctx.font = '20px Arial';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`🏆 Рекорд: ${highScore}`, canvas.width / 2, 140);
    
    // Инструкции
    ctx.font = '14px Arial';
    ctx.fillStyle = '#cbd5e0';
    ctx.fillText('ПРОБЕЛ или СТРЕЛКА ↑ - Прыжок', canvas.width / 2, 200);
    ctx.fillText('СТРЕЛКА ↓ - Пригнуться', canvas.width / 2, 230);
    ctx.fillText('P - Пауза', canvas.width / 2, 260);
    
    // Земля
    ctx.fillStyle = '#2a4365';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
}

// ========================================
// НАСТРОЙКА ОБРАБОТЧИКОВ
// ========================================
function setupGameEventListeners() {
    // Удаляем старые обработчики
    const oldStartBtn = document.getElementById('start-btn');
    const oldPauseBtn = document.getElementById('pause-btn');
    const oldResumeBtn = document.getElementById('resume-btn');
    const oldRestartBtn = document.getElementById('restart-btn');
    const oldMenuBtn = document.getElementById('menu-btn');
    
    // Добавляем новые обработчики
    if (startBtn) {
        startBtn.onclick = startGame;
    }
    
    if (pauseBtn) {
        pauseBtn.onclick = togglePause;
    }
    
    if (resumeBtn) {
        resumeBtn.onclick = togglePause;
    }
    
    if (restartBtn) {
        restartBtn.onclick = restartGame;
    }
    
    if (menuBtn) {
        menuBtn.onclick = returnToMenu;
    }
    
    // Обработчики клавиатуры
    document.onkeydown = handleKeyDown;
    document.onkeyup = handleKeyUp;
    
    // Обработчики мыши
    canvas.onclick = function(e) {
        if (!gameRunning || gamePaused) return;
        const rect = canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        
        if (clickX > canvas.width / 2) {
            jump();
        } else {
            duck(true);
            setTimeout(() => duck(false), 300);
        }
    };
}

// ========================================
// УПРАВЛЕНИЕ ИГРОЙ
// ========================================
function handleKeyDown(e) {
    if (e.code === 'KeyP' || e.code === 'Escape') {
        togglePause();
        return;
    }
    
    if (!gameRunning || gamePaused) return;
    
    if (e.code === 'Space' || e.code === 'ArrowUp') {
        jump();
        e.preventDefault();
    } else if (e.code === 'ArrowDown') {
        duck(true);
        e.preventDefault();
    }
}

function handleKeyUp(e) {
    if (e.code === 'ArrowDown') {
        duck(false);
    }
}

function jump() {
    if (!player.jumping && gameRunning && !gamePaused) {
        player.jumping = true;
        player.velocity = player.jumpPower;
        player.ducking = false;
        // playSound('jump');
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
    
    if (menuScreen) menuScreen.classList.add('hidden');
    gameRunning = true;
    gamePaused = false;
    score = 0;
    obstaclesArray = [];
    if (scoreElement) scoreElement.textContent = 0;
    
    player.jumping = false;
    player.ducking = false;
    player.y = player.groundY;
    player.velocity = 0;
    
    gameSettings.currentSpeed = GAME_CONFIG.INITIAL_SPEED;
    gameSettings.spawnTimer = 0;
    
    // playSound('click');
    
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

// ========================================
// ПАУЗА ИГРЫ
// ========================================
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        cancelAnimationFrame(animationId);
        if (pauseScreen) {
            pauseScreen.classList.add('show');
            if (pauseScoreElement) pauseScoreElement.textContent = Math.floor(score);
        }
        // playSound('click');
    } else {
        if (pauseScreen) pauseScreen.classList.remove('show');
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        // playSound('click');
    }
}

// ========================================
// ПЕРЕЗАПУСК ИГРЫ
// ========================================
function restartGame() {
    if (pauseScreen) pauseScreen.classList.remove('show');
    // playSound('click');
    startGame();
}

// ========================================
// ВОЗВРАТ В МЕНЮ
// ========================================
function returnToMenu() {
    if (pauseScreen) pauseScreen.classList.remove('show');
    gameRunning = false;
    gamePaused = false;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
    }
    
    // playSound('click');
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
    // Обновление счета
    score += gameSettings.currentSpeed * 0.1;
    if (scoreElement) scoreElement.textContent = Math.floor(score);
    
    // Увеличение скорости
    gameSettings.currentSpeed += GAME_CONFIG.SPEED_INCREASE;
    
    // Обновление игрока
    updatePlayer(deltaTime);
    
    // Обновление препятствий
    updateObstacles(deltaTime);
    
    // Обновление облаков
    updateClouds();
    
    // Анимация земли
    groundOffset = (groundOffset - gameSettings.currentSpeed) % 24;
    
    // Проверка столкновений
    checkCollisions();
    
    // Обновление рекорда
    if (score > highScore) {
        highScore = Math.floor(score);
        if (highScoreElement) highScoreElement.textContent = `Рекорд: ${highScore}`;
        if (menuHighScoreElement) menuHighScoreElement.textContent = highScore;
    }
}

function updatePlayer(deltaTime) {
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
        player.height = 25;
        player.y = player.groundY + 22;
    } else if (!player.jumping) {
        player.height = 47;
        player.y = player.groundY;
    }
}

function updateObstacles(deltaTime) {
    gameSettings.spawnTimer += deltaTime;
    
    if (gameSettings.spawnTimer > gameSettings.spawnInterval) {
        gameSettings.spawnTimer = 0;
        
        const obstacleTypes = [
            { width: 20, height: 40, color: '#2d3748' },
            { width: 30, height: 50, color: '#4a5568' },
            { width: 44, height: 44, color: '#2c5282' }
        ];
        
        const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
        const isBird = type.width === 44;
        
        obstaclesArray.push({
            x: canvas.width,
            y: isBird ? canvas.height - type.height - 70 : canvas.height - type.height - 10,
            width: type.width,
            height: type.height,
            color: type.color,
            speed: gameSettings.currentSpeed,
            isBird: isBird
        });
        
        gameSettings.spawnInterval = Math.max(GAME_CONFIG.MIN_SPAWN_INTERVAL, 1000 - Math.floor(score / 100) * 40);
    }
    
    for (let i = obstaclesArray.length - 1; i >= 0; i--) {
        obstaclesArray[i].x -= obstaclesArray[i].speed;
        
        if (obstaclesArray[i].x + obstaclesArray[i].width < 0) {
            obstaclesArray.splice(i, 1);
        }
    }
}

function updateClouds() {
    for (let cloud of clouds) {
        cloud.x -= cloud.speed;
        
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
            cloud.y = 30 + Math.random() * 100;
        }
    }
}

function checkCollisions() {
    for (let obstacle of obstaclesArray) {
        if (player.x + player.width > obstacle.x &&
            player.x < obstacle.x + obstacle.width &&
            player.y + player.height > obstacle.y &&
            player.y < obstacle.y + obstacle.height) {
            
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
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
    }
    
    // playSound('collision');
    
    setTimeout(() => {
        if (menuScreen) {
            menuScreen.classList.remove('hidden');
            if (menuHighScoreElement) menuHighScoreElement.textContent = highScore;
        }
    }, 1000);
}

// ========================================
// ОТРИСОВКА ИГРЫ
// ========================================
function drawGame() {
    if (!ctx) return;
    
    // Очистка canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Фон
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#1a365d');
    gradient.addColorStop(1, '#2d3748');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Облака
    drawClouds();
    
    // Земля
    drawGround();
    
    // Препятствия
    drawObstacles();
    
    // Игрок
    drawPlayer();
}

function drawClouds() {
    for (let cloud of clouds) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width * 0.15, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 5, cloud.width * 0.2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.width * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawGround() {
    // Основа земли
    ctx.fillStyle = '#2a4365';
    ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
    
    // Трава
    ctx.fillStyle = '#38bdf8';
    for (let i = 0; i < canvas.width; i += 24) {
        ctx.fillRect(i + groundOffset, canvas.height - 10, 12, 3);
    }
}

function drawObstacles() {
    for (let obstacle of obstaclesArray) {
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        if (obstacle.isBird) {
            // Глаза птицы
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(obstacle.x + obstacle.width/2 - 5, obstacle.y + obstacle.height/2 - 5, 3, 0, Math.PI * 2);
            ctx.arc(obstacle.x + obstacle.width/2 + 5, obstacle.y + obstacle.height/2 - 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

function drawPlayer() {
    // Тело динозавра
    ctx.fillStyle = '#374151';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Ноги
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(player.x + 5, player.y + player.height - 5, 8, 10);
    ctx.fillRect(player.x + player.width - 13, player.y + player.height - 5, 8, 10);
    
    // Голова
    ctx.fillRect(player.x + player.width - 10, player.y, 12, 15);
    
    // Глаз
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 3, player.y + 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Зрачок
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 3, player.y + 5, 1, 0, Math.PI * 2);
    ctx.fill();
}

// ========================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ
// ========================================
function setupModalControls() {
    if (launchGameBtn) {
        launchGameBtn.addEventListener('click', function() {
            if (gameModal) {
                gameModal.classList.add('show');
                document.body.style.overflow = 'hidden';
                initGame();
            }
        });
    }
    
    if (closeGameBtn) {
        closeGameBtn.addEventListener('click', function() {
            if (gameModal) {
                gameModal.classList.remove('show');
                document.body.style.overflow = 'auto';
                
                gameRunning = false;
                gamePaused = false;
                
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }
        });
    }
    
    if (gameModal) {
        gameModal.addEventListener('click', function(e) {
            if (e.target === gameModal) {
                gameModal.classList.remove('show');
                document.body.style.overflow = 'auto';
                
                gameRunning = false;
                gamePaused = false;
                
                if (animationId) {
                    cancelAnimationFrame(animationId);
                }
            }
        });
    }
}

// ========================================
// ЗАГРУЗКА СТРАНИЦЫ
// ========================================
window.addEventListener('load', function() {
    console.log('Страница загружена');
    
    // Настройка управления модальным окном
    setupModalControls();
    
    // Установка текущего года
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
});
