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

// ========================================
// СИСТЕМА УДАЛЕНИЯ ФОНА ИЗ ВИДЕО
// ========================================
// Создаем скрытый canvas для обработки видео
const videoCanvas = document.createElement('canvas');
const videoCtx = videoCanvas.getContext('2d');

// Создаем видео элемент
const playerVideo = document.createElement('video');
playerVideo.src = 'lv_0_20260125005509.mp4'; // Твое видео
playerVideo.loop = true;
playerVideo.muted = true;
playerVideo.playsInline = true;
playerVideo.preload = 'auto';

let videoLoaded = false;
playerVideo.addEventListener('loadeddata', () => {
    console.log('✅ Видео загружено');
    videoLoaded = true;
    
    // Устанавливаем размеры canvas для видео
    videoCanvas.width = playerVideo.videoWidth;
    videoCanvas.height = playerVideo.videoHeight;
});

// Функция для удаления черного фона
function removeBlackBackground(sourceCanvas, threshold = 50) {
    const imageData = videoCtx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
    const data = imageData.data;
    
    // Проходим по всем пикселям
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Если пиксель близок к черному (низкая яркость), делаем его прозрачным
        const brightness = (r + g + b) / 3;
        if (brightness < threshold) {
            data[i + 3] = 0; // Устанавливаем полную прозрачность
        }
    }
    
    return imageData;
}

// Функция для рисования обработанного видео
function drawProcessedVideo() {
    if (!videoLoaded || playerVideo.readyState < 2) return false;
    
    try {
        // Рисуем видео на скрытом canvas
        videoCtx.clearRect(0, 0, videoCanvas.width, videoCanvas.height);
        videoCtx.drawImage(playerVideo, 0, 0, videoCanvas.width, videoCanvas.height);
        
        // Удаляем черный фон
        const processedImage = removeBlackBackground(videoCanvas, 40); // Порог 40
        
        // Сохраняем состояние основного canvas
        ctx.save();
        
        // Рисуем обработанное изображение на основном canvas
        const scale = 0.15; // Масштаб видео
        const width = videoCanvas.width * scale;
        const height = videoCanvas.height * scale;
        
        // Создаем временный canvas для масштабирования
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = width;
        tempCanvas.height = height;
        
        // Масштабируем обработанное изображение
        tempCtx.putImageData(processedImage, 0, 0, 0, 0, 
                            videoCanvas.width, videoCanvas.height);
        
        // Рисуем на основном canvas
        if (player.ducking) {
            ctx.drawImage(tempCanvas, player.x, player.y + 30, width, height * 0.6);
        } else {
            ctx.drawImage(tempCanvas, player.x, player.y, width, height);
        }
        
        ctx.restore();
        return true;
    } catch (error) {
        console.log('Ошибка обработки видео:', error);
        return false;
    }
}

// ========================================
// ИГРОК (упрощенный)
// ========================================
const player = {
    x: 50,
    y: 0,
    width: 80,  // Увеличил размер для видео
    height: 120,
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.15,      // ОЧЕНЬ МЕДЛЕННАЯ гравитация
    jumpPower: -14,     // ВЫСОКИЙ прыжок
    groundY: 0,
    jumpBoost: 1.5      // Бонус к прыжку
};

// Массивы объектов
let obstacles = [];
let clouds = [];
let groundOffset = 0;

// Настройки сложности (СДЕЛАЛ ОЧЕНЬ ЛЕГКО)
const gameSettings = {
    obstacleSpeed: 1,           // МЕДЛЕННАЯ начальная скорость
    spawnChance: 0.0015,       // РЕДКИЕ препятствия
    speedIncrease: 0.0001,     // ОЧЕНЬ медленное увеличение сложности
    minGap: 300,               // БОЛЬШОЙ разрыв между препятствиями
    lastObstacleX: 0          // Позиция последнего препятствия
};

// ========================================
// ИНИЦИАЛИЗАЦИЯ ИГРЫ
// ========================================
function initGame() {
    console.log('🎮 Инициализация игры...');
    
    // Устанавливаем размеры canvas
    const container = document.querySelector('.game-container');
    if (!container) return;
    
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    
    // Настраиваем игрока
    player.groundY = canvas.height - player.height - 50;
    player.y = player.groundY;
    
    // Загружаем рекорд
    highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
    highScoreElement.textContent = `Рекорд: ${highScore}`;
    menuHighScoreElement.textContent = highScore;
    
    // Сбрасываем настройки
    gameSettings.obstacleSpeed = 1;
    gameSettings.spawnChance = 0.0015;
    gameSettings.lastObstacleX = canvas.width;
    
    // Создаем облака
    clouds = [];
    for (let i = 0; i < 5; i++) {
        clouds.push({
            x: Math.random() * canvas.width * 2,
            y: Math.random() * 150,
            width: 60 + Math.random() * 70,
            speed: 0.05 + Math.random() * 0.08
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
    
    // Красивый градиентный фон
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#0f3460');
    gradient.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Звезды
    drawStars();
    
    // Заголовок с тенью
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎮 Бегущий динозавр', canvas.width / 2, 80);
    ctx.shadowBlur = 0;
    
    // Подзаголовок
    ctx.font = '18px Arial';
    ctx.fillStyle = '#b8c1ec';
    ctx.fillText('Избегай препятствий и ставь рекорды!', canvas.width / 2, 120);
    
    // Рекорд с подсветкой
    ctx.fillStyle = '#f6e05e';
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`🏆 Рекорд: ${highScore}`, canvas.width / 2, 180);
    
    // Управление в стиле игры
    ctx.fillStyle = '#a5b4fc';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    
    const controls = [
        '👆 Правый клик/тап - ПРЫЖОК',
        '👇 Левый клик/тап - ПРИГНУТЬСЯ',
        '⬆️ Пробел или Стрелка вверх - ПРЫЖОК',
        '⬇️ Стрелка вниз - ПРИГНУТЬСЯ',
        '⏸️ P - Пауза'
    ];
    
    controls.forEach((text, index) => {
        ctx.fillText(text, canvas.width / 2, 240 + index * 25);
    });
    
    // Подсказка
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 12px Arial';
    ctx.fillText('🎯 Цель: набрать 1000+ очков!', canvas.width / 2, 380);
}

function drawStars() {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height * 0.7;
        const size = Math.random() * 2;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========================================
// НАСТРОЙКА ОБРАБОТЧИКОВ
// ========================================
function setupGameEventListeners() {
    // Управление кнопками
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', togglePause);
    resumeBtn.addEventListener('click', togglePause);
    restartBtn.addEventListener('click', restartGame);
    menuBtn.addEventListener('click', returnToMenu);
    
    // Управление игрой
    canvas.addEventListener('click', handleCanvasClick);
    canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
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
    if (e.code === 'KeyP') {
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
        player.velocity = player.jumpPower * player.jumpBoost;
        player.ducking = false;
        console.log('🦘 Прыжок!');
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
    
    console.log('🚀 Начало игры');
    
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
    player.jumpBoost = 1.5; // Бонус к прыжку
    
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
function togglePause() {
    if (!gameRunning) return;
    
    gamePaused = !gamePaused;
    
    if (gamePaused) {
        cancelAnimationFrame(animationId);
        pauseScreen.classList.add('show');
        pauseScoreElement.textContent = Math.floor(score);
        
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

// ========================================
// ПЕРЕЗАПУСК ИГРЫ
// ========================================
function restartGame() {
    console.log('🔄 Перезапуск игры');
    
    pauseScreen.classList.remove('show');
    startGame();
}

// ========================================
// ВОЗВРАТ В МЕНЮ
// ========================================
function returnToMenu() {
    console.log('🏠 Возврат в меню');
    
    pauseScreen.classList.remove('show');
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    
    // Сохраняем рекорд
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
        console.log(`🎉 Новый рекорд: ${highScore}!`);
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
// ОБНОВЛЕНИЕ ИГРЫ (СДЕЛАЛ ОЧЕНЬ ЛЕГКОЙ)
// ========================================
function updateGame(deltaTime) {
    // Медленное увеличение счета
    score += 0.2; // Быстрее чем 0.1, но все равно медленно
    scoreElement.textContent = Math.floor(score);
    
    // Очень медленное увеличение сложности
    if (score % 100 === 0) {
        gameSettings.obstacleSpeed += 0.05;
        gameSettings.spawnChance += 0.0001;
    }
    
    // Обновляем игрока
    updatePlayer();
    
    // Обновляем препятствия
    updateObstacles();
    
    // Обновляем облака
    updateClouds();
    
    // Медленное движение земли
    groundOffset = (groundOffset - 0.3) % 50;
    
    // Проверка столкновений
    checkCollisions();
    
    // Обновляем рекорд
    if (score > highScore) {
        highScore = Math.floor(score);
        highScoreElement.textContent = `Рекорд: ${highScore}`;
        menuHighScoreElement.textContent = highScore;
        
        // Показываем сообщение о новом рекорде каждые 100 очков
        if (Math.floor(score) % 100 === 0 && score > 0) {
            showNewRecord();
        }
    }
    
    // Бонус к прыжку каждые 200 очков
    if (Math.floor(score) % 200 === 0 && score > 0) {
        player.jumpBoost = Math.min(2.0, 1.5 + score / 1000);
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
        player.height = 70;
        player.y = player.groundY + 50;
    } else if (!player.jumping) {
        player.height = 120;
        player.y = player.groundY;
    }
}

function updateObstacles() {
    // ОЧЕНЬ РЕДКОЕ создание препятствий
    const canSpawn = canvas.width - gameSettings.lastObstacleX > gameSettings.minGap;
    
    if (canSpawn && Math.random() < gameSettings.spawnChance) {
        const types = [
            { height: 40, width: 40, color: '#8B0000' },
            { height: 60, width: 30, color: '#006400' },
            { height: 50, width: 50, color: '#4B0082' }
        ];
        
        const type = types[Math.floor(Math.random() * types.length)];
        
        obstacles.push({
            x: canvas.width,
            y: canvas.height - type.height - 50,
            width: type.width,
            height: type.height,
            color: type.color,
            speed: gameSettings.obstacleSpeed + Math.random() * 0.5
        });
        
        gameSettings.lastObstacleX = canvas.width;
    }
    
    // Двигаем препятствия
    for (let i = obstacles.length - 1; i >= 0; i--) {
        obstacles[i].x -= obstacles[i].speed;
        
        if (obstacles[i].x + obstacles[i].width < 0) {
            obstacles.splice(i, 1);
            gameSettings.lastObstacleX = 0;
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
    const playerPadding = 15; // Отступ для более легкого прохождения
    
    for (let obstacle of obstacles) {
        if (player.x + playerPadding < obstacle.x + obstacle.width - 10 &&
            player.x + player.width - playerPadding > obstacle.x + 10 &&
            player.y + playerPadding < obstacle.y + obstacle.height - 10 &&
            player.y + player.height - playerPadding > obstacle.y + 10) {
            
            gameOver();
            return;
        }
    }
}

// ========================================
// КОНЕЦ ИГРЫ
// ========================================
function gameOver() {
    console.log('💀 Конец игры. Счет:', Math.floor(score));
    
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    // Сохраняем рекорд
    if (score > highScore) {
        highScore = Math.floor(score);
        localStorage.setItem('gameHighScore', highScore);
        console.log(`🎉 Установлен новый рекорд: ${highScore}!`);
    }
    
    // Пауза видео
    playerVideo.pause();
    
    // Показываем меню через секунду
    setTimeout(() => {
        menuScreen.classList.remove('hidden');
        menuHighScoreElement.textContent = highScore;
    }, 1000);
}

// ========================================
// ОТРИСОВКА ИГРЫ
// ========================================
function drawGame() {
    // Очищаем экран
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Красивый градиент неба
    const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.7);
    skyGradient.addColorStop(0, '#0c2461');
    skyGradient.addColorStop(0.5, '#1e3799');
    skyGradient.addColorStop(1, '#4a69bd');
    ctx.fillStyle = skyGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height * 0.7);
    
    // Солнце
    drawSun();
    
    // Облака
    drawClouds();
    
    // Земля с градиентом
    const groundGradient = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height);
    groundGradient.addColorStop(0, '#3c6382');
    groundGradient.addColorStop(1, '#0a3d62');
    ctx.fillStyle = groundGradient;
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
    
    // Трава
    ctx.fillStyle = '#38ada9';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, 15);
    
    // Дорожная разметка
    drawRoadLines();
    
    // Препятствия
    drawObstacles();
    
    // Игрок (видео с удаленным фоном)
    drawPlayer();
    
    // Эффекты
    drawEffects();
}

function drawSun() {
    // Солнце
    ctx.fillStyle = '#f6b93b';
    ctx.beginPath();
    ctx.arc(canvas.width - 70, 70, 35, 0, Math.PI * 2);
    ctx.fill();
    
    // Лучи
    ctx.strokeStyle = '#f6b93b';
    ctx.lineWidth = 4;
    for (let i = 0; i < 16; i++) {
        const angle = (i * Math.PI) / 8;
        const x1 = canvas.width - 70 + Math.cos(angle) * 40;
        const y1 = 70 + Math.sin(angle) * 40;
        const x2 = canvas.width - 70 + Math.cos(angle) * 55;
        const y2 = 70 + Math.sin(angle) * 55;
        
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

function drawClouds() {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    for (let cloud of clouds) {
        // Плавные облака
        ctx.beginPath();
        ctx.arc(cloud.x, cloud.y, cloud.width * 0.2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.3, cloud.y - 10, cloud.width * 0.25, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.6, cloud.y, cloud.width * 0.2, 0, Math.PI * 2);
        ctx.arc(cloud.x + cloud.width * 0.8, cloud.y + 5, cloud.width * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawRoadLines() {
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < canvas.width; i += 120) {
        ctx.fillRect(i + groundOffset, canvas.height - 35, 80, 8);
    }
}

function drawObstacles() {
    for (let obstacle of obstacles) {
        // Основное тело с тенью
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 10;
        ctx.shadowOffsetY = 3;
        
        ctx.fillStyle = obstacle.color;
        ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        
        // Сброс тени
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // Детали
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 4);
        ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 9, obstacle.width - 10, 4);
        
        // Глаза
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(obstacle.x + 12, obstacle.y + 18, 6, 0, Math.PI * 2);
        ctx.arc(obstacle.x + obstacle.width - 12, obstacle.y + 18, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000000';
        ctx.beginPath();
        ctx.arc(obstacle.x + 12, obstacle.y + 18, 3, 0, Math.PI * 2);
        ctx.arc(obstacle.x + obstacle.width - 12, obstacle.y + 18, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawPlayer() {
    // Пытаемся нарисовать обработанное видео
    const videoDrawn = drawProcessedVideo();
    
    // Если видео не нарисовалось, рисуем запасной вариант
    if (!videoDrawn) {
        drawPlayerFallback();
    }
    
    // Добавляем тень под игроком
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(player.x + player.width/2, player.groundY + player.height + 5, 
                player.width/2, 10, 0, 0, Math.PI * 2);
    ctx.fill();
}

function drawPlayerFallback() {
    // Тело игрока
    ctx.fillStyle = '#4a69bd';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Голова
    ctx.fillStyle = '#6a89cc';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 15, player.y + 20, 15, 0, Math.PI * 2);
    ctx.fill();
    
    // Глаз
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 8, player.y + 16, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Зрачок
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(player.x + player.width - 7, player.y + 16, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Улыбка
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(player.x + player.width - 15, player.y + 25, 8, 0, Math.PI);
    ctx.stroke();
    
    // Полоски на теле
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 4; i++) {
        ctx.fillRect(player.x + 10, player.y + 20 + i * 20, player.width - 20, 4);
    }
}

function drawEffects() {
    // Эффект скорости при высоком счете
    if (score > 500) {
        ctx.fillStyle = `rgba(255, 215, 0, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('⚡ СКОРОСТЬ!', canvas.width - 20, 40);
    }
    
    // Бонус к прыжку
    if (player.jumpBoost > 1.5) {
        ctx.fillStyle = `rgba(50, 205, 50, ${0.5 + Math.sin(Date.now() / 300) * 0.3})`;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`▲ ПРЫЖОК x${player.jumpBoost.toFixed(1)}`, canvas.width - 20, 60);
    }
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
            console.log('🎮 Запуск игры');
            gameModal.classList.add('show');
            document.body.style.overflow = 'hidden';
            initGame();
        });
    }
    
    if (closeGameBtn) {
        closeGameBtn.addEventListener('click', function() {
            console.log('❌ Закрытие игры');
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
    console.log('✅ Страница загружена');
    
    // Настраиваем управление модальным окном
    setupModalControls();
    
    // Предзагрузка видео
    playerVideo.load();
    
    console.log('🎮 Игра готова!');
    console.log('🐢 Настроена на ЛЕГКУЮ сложность');
    console.log('🎬 Система удаления черного фона активирована');
    console.log('🎯 Цель: 1000+ очков легко достижима!');
});

// Отладка
console.log('🔥 Версия игры: 3.0 (Супер-легкая с удалением фона)');
