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
const newRecordElement = document.getElementById('new-record');

// Модальное окно игры
const gameModal = document.getElementById('game-modal');
const closeGameBtn = document.getElementById('close-game-btn');
const launchGameBtn = document.getElementById('launch-game-btn');

// Состояние игры
let gameRunning = false;
let gamePaused = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
let lastTime = 0;
let animationId;

// Создаем видео элемент для игрока
const playerVideo = document.createElement('video');
playerVideo.src = 'lv_0_20260125005509.mp4'; // Твое видео
playerVideo.loop = true;
playerVideo.muted = true;
playerVideo.playsInline = true;
playerVideo.preload = 'auto';

// Проверяем загрузку видео
let videoLoaded = false;
playerVideo.addEventListener('loadeddata', () => {
    console.log('✅ Видео загружено');
    videoLoaded = true;
});

playerVideo.addEventListener('error', (e) => {
    console.log('❌ Ошибка загрузки видео:', e);
    videoLoaded = false;
});

// Игрок
const player = {
    x: 50,
    y: 0,
    width: 60,
    height: 80,
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.2,      // МЕДЛЕННАЯ гравитация
    jumpPower: -8,     // МЕДЛЕННЫЙ прыжок
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
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Настраиваем игрока
    player.groundY = canvas.height - player.height - 50;
    player.y = player.groundY;
    
    // Загружаем рекорд
    highScoreElement.textContent = `Рекорд: ${highScore}`;
    menuHighScoreElement.textContent = highScore;
    
    // Создаем облака (МЕДЛЕННЫЕ)
    clouds = [];
    for (let i = 0; i < 3; i++) {
        clouds.push({
            x: Math.random() * canvas.width,
            y: Math.random() * 150,
            width: 50 + Math.random() * 50,
            speed: 0.05 + Math.random() * 0.1  // ОЧЕНЬ МЕДЛЕННО
        });
    }
    
    // Очищаем препятствия
    obstacles = [];
    
    // Сбрасываем счет
    score = 0;
    scoreElement.textContent = 0;
    
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
    ctx.fillText('Пробел или Стрелка ↑ - Прыжок', canvas.width / 2, 300);
    ctx.fillText('Стрелка ↓ - Пригнуться', canvas.width / 2, 330);
}

// ========================================
// НАСТРОЙКА ОБРАБОТЧИКОВ
// ========================================
function setupGameEventListeners() {
    // Управление кнопками
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    resumeBtn.addEventListener('click', resumeGame);
    restartBtn.addEventListener('click', restartGame);
    menuBtn.addEventListener('click', returnToMenu);
    
    // Управление игрой
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// ========================================
// УПРАВЛЕНИЕ ИГРОЙ
// ========================================
function handleCanvasClick(e) {
    if (!gameRunning || gamePaused) return;
    
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    if (clickX > canvas.width / 2) {
        jump();
    } else {
        duck(true);
        setTimeout(() => duck(false), 300);
    }
}

function handleTouchStart(e) {
    if (!gameRunning || gamePaused) return;
    
    e.preventDefault();
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    const touchX = touch.clientX - rect.left;
    
    if (touchX > canvas.width / 2) {
        jump();
    } else {
        duck(true);
        setTimeout(() => duck(false), 300);
    }
}

function handleKeyDown(e) {
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
        console.log('Прыжок!');
    }
}

function duck(start) {
    if (gameRunning && !gamePaused) {
        player.ducking = start;
        console.log(start ? 'Пригнулся' : 'Встал');
    }
}

// ========================================
// ЗАПУСК ИГРЫ
// ========================================
function startGame() {
    if (gameRunning) return;
    
    console.log('Начало игры');
    
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
    
    // Запуск видео
    if (videoLoaded) {
        playerVideo.currentTime = 0;
        playerVideo.play().catch(e => {
            console.log('Не удалось запустить видео:', e);
        });
    }
    
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
        pauseScoreElement.textContent = score;
        
        // Пауза видео
        playerVideo.pause();
    } else {
        pauseScreen.classList.remove('show');
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        
        // Возобновление видео
        if (videoLoaded) {
            playerVideo.play().catch(e => {
                console.log('Не удалось возобновить видео:', e);
            });
        }
    }
}

function resumeGame() {
    pauseGame();
}

// ========================================
// ПЕРЕЗАПУСК ИГРЫ
// ========================================
function restartGame() {
    console.log('Перезапуск игры');
    
    pauseScreen.classList.remove('show');
    startGame();
}

// ========================================
// ВОЗВРАТ В МЕНЮ
// ========================================
function returnToMenu() {
    console.log('Возврат в меню');
    
    pauseScreen.classList.remove('show');
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
    // Сохраняем рекорд
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('gameHighScore', highScore);
    }
    
    // Пауза видео
    playerVideo.pause();
    
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
    // Очень медленное увеличение счета
    score += 0.1;
    scoreElement.textContent = Math.floor(score);
    
    // Обновляем игрока
    updatePlayer();
    
    // Обновляем препятствия
    updateObstacles();
    
    // Обновляем облака
    updateClouds();
    
    // МЕДЛЕННОЕ движение земли
    groundOffset = (groundOffset - 0.5) % 50;
    
    // Проверка столкновений
    checkCollisions();
    
    // Обновляем рекорд
    if (score > highScore) {
        highScore = Math.floor(score);
        highScoreElement.textContent = `Рекорд: ${highScore}`;
        menuHighScoreElement.textContent = highScore;
        
        // Показываем сообщение о новом рекорде
        if (Math.floor(score) % 100 === 0 && score > 0) {
            showNewRecord();
        }
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
    // ОЧЕНЬ МЕДЛЕННОЕ создание препятствий
    if (Math.random() < 0.002) {  // Очень низкая вероятность
        const height = 40 + Math.random() * 40;
        obstacles.push({
            x: canvas.width,
            y: canvas.height - height - 50,
            width: 30,
            height: height,
            speed: 1 + Math.random() * 1  // ОЧЕНЬ МЕДЛЕННО
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
    console.log('Конец игры');
    
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Сохраняем рекорд
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
    }
    
    // Пауза видео
    playerVideo.pause();
    
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
    drawSun();
    
    // Облака
    drawClouds();
    
    // Земля
    drawGround();
    
    // Дорожная разметка
    drawRoadLines();
    
    // Препятствия
    drawObstacles();
    
    // Игрок (видео)
    drawPlayer();
}

function drawSun() {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 60, 30, 0, Math.PI * 2);
    ctx.fill();
    
    // Лучи солнца
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 3;
    for (let i = 0; i < 12; i++) {
        const angle = (i * Math.PI) / 6;
        const x1 = canvas.width - 60 + Math.cos(angle) * 35;
        const y1 = 60 + Math.sin(angle) * 35;
        const x2 = canvas.width - 60 + Math.cos(angle) * 45;
        const y2 = 60 + Math.sin(angle) * 45;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let cloud of clouds) {
        drawCloud(cloud.x, cloud.y, cloud.width);
    }
}

function drawCloud(x, y, width) {
    const height = width * 0.5;
    ctx.beginPath();
    ctx.arc(x + width * 0.2, y + height * 0.5, height * 0.4, 0, Math.PI * 2);
    ctx.arc(x + width * 0.5, y + height * 0.3, height * 0.5, 0, Math.PI * 2);
    ctx.arc(x + width * 0.8, y + height * 0.5, height * 0.4, 0, Math.PI * 2);
    ctx.fill();
}

function drawGround() {
    // Земля
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
    
    // Трава
    ctx.fillStyle = '#228B22';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, 10);
    
    // Камни
    ctx.fillStyle = '#696969';
    for (let i = 0; i < 5; i++) {
        const stoneX = (i * 100 + groundOffset / 2) % canvas.width;
        const stoneY = canvas.height * 0.7 + 5;
        const stoneSize = 10 + Math.random() * 10;
        
        ctx.beginPath();
        ctx.arc(stoneX, stoneY, stoneSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawRoadLines() {
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < canvas.width; i += 100) {
        ctx.fillRect(i + groundOffset, canvas.height - 30, 50, 5);
    }
}

function drawObstacles() {
    ctx.fillStyle = '#8B0000';
    for (let obstacle of obstacles) {
        // Основное тело препятствия
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Детали препятствия
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 3);
        ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 8, obstacle.width - 10, 3);
        ctx.fillStyle = '#8B0000';
        
        // Глаза препятствия
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(obstacle.x + 10, obstacle.y + 15, 5, 0, Math.PI * 2);
        ctx.arc(obstacle.x + obstacle.width - 10, obstacle.y + 15, 5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(obstacle.x + 10, obstacle.y + 15, 2, 0, Math.PI * 2);
        ctx.arc(obstacle.x + obstacle.width - 10, obstacle.y + 15, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Улыбка
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(obstacle.x + obstacle.width / 2, obstacle.y + 25, 8, 0, Math.PI);
        ctx.stroke();
    }
}

function drawPlayer() {
    // Пытаемся нарисовать видео
    if (videoLoaded && playerVideo.readyState >= 2) {
        try {
            // Сохраняем состояние контекста
            ctx.save();
            
            // Если пригнулся, рисуем видео меньше
            if (player.ducking) {
                ctx.drawImage(playerVideo, player.x, player.y + 30, player.width, 50);
            } else {
                ctx.drawImage(playerVideo, player.x, player.y, player.width, player.height);
            }
            
            // Восстанавливаем состояние контекста
            ctx.restore();
            return;
        } catch (error) {
            console.log('Ошибка рисования видео:', error);
            videoLoaded = false;
        }
    }
    
    // Запасной вариант - рисуем прямоугольник
    drawPlayerFallback();
}

function drawPlayerFallback() {
    // Тело игрока (запасной вариант)
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
    
    // Надпись "Видео"
    ctx.fillStyle = '#FF0000';
    ctx.font = '10px Arial';
    ctx.fillText('ВИДЕО', player.x + 10, player.y + 40);
}

// ========================================
// НОВЫЙ РЕКОРД
// ========================================
function showNewRecord() {
    newRecordElement.classList.add('show');
    
    setTimeout(() => {
        newRecordElement.classList.remove('show');
    }, 2000);
}

// ========================================
// УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ
// ========================================
function setupModalControls() {
    if (launchGameBtn) {
        launchGameBtn.addEventListener('click', function() {
            console.log('Запуск игры');
            gameModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            initGame();
        });
    }
    
    if (closeGameBtn) {
        closeGameBtn.addEventListener('click', function() {
            console.log('Закрытие игры');
            gameModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            // Останавливаем игру
            gameRunning = false;
            gamePaused = false;
            cancelAnimationFrame(animationId);
            
            // Пауза видео
            playerVideo.pause();
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
                
                // Пауза видео
                playerVideo.pause();
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
    
    // Предзагрузка видео
    playerVideo.load();
    
    console.log('✅ Игра готова!');
    console.log('🐢 Игра настроена на МЕДЛЕННУЮ скорость');
    console.log('🎬 Используется видео вместо изображения');
});

// Отладка
console.log('Версия игры: 2.0 (Медленная версия)');
