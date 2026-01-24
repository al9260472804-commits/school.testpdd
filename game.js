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
let highScore = parseInt(localStorage.getItem('gameHighScore')) || 0;
let lastTime = 0;
let animationId;

// ЗАГРУЗКА ФОТОГРАФИЙ
// ⚠️ ЗАМЕНИТЕ ЭТИ ССЫЛКИ НА СВОИ ФОТО!
const playerImg = new Image();
playerImg.src = 'https://i.imgur.com/ваше_фото_персонажа.jpg'; // ФОТО ПЕРСОНАЖА

const obstacleImg1 = new Image();
obstacleImg1.src = 'https://i.imgur.com/ваше_препятствие1.jpg'; // ПРЕПЯТСТВИЕ 1

const obstacleImg2 = new Image();
obstacleImg2.src = 'https://i.imgur.com/ваше_препятствие2.jpg'; // ПРЕПЯТСТВИЕ 2

const obstacleImg3 = new Image();
obstacleImg3.src = 'https://i.imgur.com/ваше_препятствие3.jpg'; // ПРЕПЯТСТВИЕ 3

// Игрок
const player = {
    x: 50,
    y: 0,
    width: 70,  // Ширина персонажа
    height: 90, // Высота персонажа
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.3,    // МЕНЬШЕ гравитация = плавнее
    jumpPower: -10,  // МЕНЬШЕ высота прыжка
    groundY: 0
};

// Массивы объектов
let obstacles = [];
let clouds = [];
let groundOffset = 0;

// Инициализация игры
function initGame() {
    console.log('Запуск игры...');
    
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
    
    // Настраиваем обработчики событий
    setupGameEventListeners();
    
    // Рисуем меню
    drawMenuScreen();
}

// Рисуем меню
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
    ctx.fillText('🏃 Беги и Прыгай!', canvas.width / 2, 80);
    
    // Подзаголовок
    ctx.font = '16px Arial';
    ctx.fillText('Избегай препятствий', canvas.width / 2, 120);
    
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

// Настройка обработчиков
function setupGameEventListeners() {
    startBtn.addEventListener('click', startGame);
    pauseBtn.addEventListener('click', pauseGame);
    document.getElementById('resume-btn').addEventListener('click', pauseGame);
    document.getElementById('restart-btn').addEventListener('click', restartGame);
    document.getElementById('menu-btn').addEventListener('click', returnToGameMenu);
}

// Запуск игры
function startGame() {
    if (gameRunning) return;
    
    menuScreen.classList.add('hidden');
    gameRunning = true;
    gamePaused = false;
    score = 0;
    obstacles = [];
    scoreElement.textContent = 0;
    
    player.jumping = false;
    player.ducking = false;
    player.y = player.groundY;
    player.height = 90;
    player.velocity = 0;
    
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

// Пауза
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

// Перезапуск
function restartGame() {
    document.getElementById('pause-screen').classList.remove('show');
    startGame();
}

// Возврат в меню
function returnToGameMenu() {
    document.getElementById('pause-screen').classList.remove('show');
    menuScreen.classList.remove('hidden');
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    localStorage.setItem('gameHighScore', highScore);
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

// Обновление игры
function updateGame(deltaTime) {
    // СЧЕТ: +1 за каждый кадр
    score += 1;
    scoreElement.textContent = score;
    
    // СКОРОСТЬ ИГРЫ: медленный рост
    const gameSpeed = 2 + Math.floor(score / 2000);
    
    // Обновляем игрока
    updatePlayer();
    
    // Обновляем препятствия (медленнее)
    updateObstacles(gameSpeed);
    
    // Обновляем облака
    updateClouds();
    
    // Движение земли
    groundOffset = (groundOffset - gameSpeed * 0.2) % 50;
    
    // Проверка столкновений
    checkCollisions();
    
    // Рекорд
    if (score > highScore) {
        highScore = score;
        highScoreElement.textContent = `Рекорд: ${highScore}`;
        menuHighScoreElement.textContent = highScore;
        
        if (score > 0 && score % 100 === 0) {
            showNewRecord();
        }
    }
}

// Обновление игрока
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
        player.height = 60;
        player.y = player.groundY + 30;
    } else if (!player.jumping) {
        player.height = 90;
        player.y = player.groundY;
    }
}

// Обновление препятствий
function updateObstacles(gameSpeed) {
    // РЕЖЕ появляются препятствия
    if (Math.random() < 0.0015) {
        const types = [
            { width: 50, height: 80, img: obstacleImg1 },
            { width: 70, height: 60, img: obstacleImg2 },
            { width: 90, height: 40, img: obstacleImg3 }
        ];
        
        const type = Math.floor(Math.random() * types.length);
        obstacles.push({
            x: canvas.width,
            y: canvas.height - types[type].height - 50,
            width: types[type].width,
            height: types[type].height,
            img: types[type].img,
            speed: 1.5 + Math.random() * 1.5  // МЕДЛЕННАЯ СКОРОСТЬ
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

// Обновление облаков
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
        // Простая проверка столкновения
        if (player.x + player.width * 0.7 > obstacle.x &&
            player.x < obstacle.x + obstacle.width * 0.7 &&
            player.y + player.height * 0.7 > obstacle.y &&
            player.y < obstacle.y + obstacle.height * 0.7) {
            
            gameOver();
            return;
        }
    }
}

// Конец игры
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    localStorage.setItem('gameHighScore', highScore);
    
    setTimeout(() => {
        menuScreen.classList.remove('hidden');
    }, 800);
}

// Отрисовка игры
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
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    for (let cloud of clouds) {
        drawCloud(cloud.x, cloud.y, cloud.width);
    }
    
    // Дорога
    ctx.fillStyle = '#696969';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
    
    // Разметка
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < canvas.width; i += 100) {
        ctx.fillRect(i + groundOffset, canvas.height - 30, 50, 5);
    }
    
    // Препятствия
    for (let obstacle of obstacles) {
        if (obstacle.img.complete) {
            ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        } else {
            ctx.fillStyle = '#8B0000';
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
    }
    
    // Игрок
    drawPlayer();
}

// Рисование игрока
function drawPlayer() {
    if (playerImg.complete) {
        if (player.ducking && !player.jumping) {
            ctx.drawImage(playerImg, player.x, player.y + 30, player.width, 60);
        } else {
            ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
        }
    } else {
        // Запасной вариант
        ctx.fillStyle = '#4169E1';
        ctx.fillRect(player.x, player.y, player.width, player.height);
    }
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
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 60, 30, 0, Math.PI * 2);
    ctx.fill();
}

// Новый рекорд
function showNewRecord() {
    const recordEl = document.getElementById('new-record');
    recordEl.classList.add('show');
    
    setTimeout(() => {
        recordEl.classList.remove('show');
    }, 1500);
}

// Управление
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

// Обработка касаний
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

// Настройка модального окна
function setupModalControls() {
    launchGameBtn.addEventListener('click', function() {
        gameModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        initGame();
    });
    
    closeGameBtn.addEventListener('click', function() {
        gameModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        gameRunning = false;
        gamePaused = false;
        cancelAnimationFrame(animationId);
    });
    
    gameModal.addEventListener('click', function(e) {
        if (e.target === gameModal) {
            gameModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            gameRunning = false;
            gamePaused = false;
            cancelAnimationFrame(animationId);
        }
    });
    
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// Загрузка страницы
window.addEventListener('load', function() {
    setupModalControls();
    
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    console.log('✅ Игра готова!');
    console.log('⚠️ Замените ссылки на фото в начале файла');
});
