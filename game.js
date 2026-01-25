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

// Настройки звука
let soundEnabled = true;
let musicEnabled = true;

// Звуковые элементы
const jumpSound = document.getElementById('jump-sound');
const collisionSound = document.getElementById('collision-sound');
const gameOverSound = document.getElementById('game-over-sound');
const bgMusic = document.getElementById('bg-music');
const clickSound = document.getElementById('click-sound');
const bgVideo = document.getElementById('bg-video');

// ========================================
// ФОТОГРАФИИ (ИСПОЛЬЗУЕМ РАБОЧИЕ ССЫЛКИ)
// ========================================
const playerImg = new Image();
playerImg.src = 'https://files.catbox.moe/tmzfb5.mp4'; // Пикачу

const obstacleImg1 = new Image();
obstacleImg1.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/74.png'; // Геодуд

const obstacleImg2 = new Image();
obstacleImg2.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/95.png'; // Онакс

const obstacleImg3 = new Image();
obstacleImg3.src = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/76.png'; // Голем

// Проверка загрузки изображений
let imagesLoaded = {
    player: false,
    obstacle1: false,
    obstacle2: false,
    obstacle3: false
};

playerImg.onload = () => {
    imagesLoaded.player = true;
    console.log('✅ Фото персонажа загружено');
};

playerImg.onerror = () => {
    console.log('❌ Ошибка загрузки фото персонажа');
    imagesLoaded.player = false;
};

obstacleImg1.onload = () => {
    imagesLoaded.obstacle1 = true;
    console.log('✅ Фото препятствия 1 загружено');
};

obstacleImg1.onerror = () => {
    console.log('❌ Ошибка загрузки фото препятствия 1');
    imagesLoaded.obstacle1 = false;
};

obstacleImg2.onload = () => {
    imagesLoaded.obstacle2 = true;
    console.log('✅ Фото препятствия 2 загружено');
};

obstacleImg2.onerror = () => {
    console.log('❌ Ошибка загрузки фото препятствия 2');
    imagesLoaded.obstacle2 = false;
};

obstacleImg3.onload = () => {
    imagesLoaded.obstacle3 = true;
    console.log('✅ Фото препятствия 3 загружено');
};

obstacleImg3.onerror = () => {
    console.log('❌ Ошибка загрузки фото препятствия 3');
    imagesLoaded.obstacle3 = false;
};

// ========================================
// ИГРОК
// ========================================
const player = {
    x: 50,
    y: 0,
    width: 60,
    height: 80,
    jumping: false,
    ducking: false,
    velocity: 0,
    gravity: 0.3,    // Меньше гравитация
    jumpPower: -10,  // Меньше прыжок
    groundY: 0
};

// Массивы объектов
let obstacles = [];
let clouds = [];
let groundOffset = 0;

// ========================================
// ФУНКЦИИ ДЛЯ ЗВУКА
// ========================================
function playSound(soundElement) {
    if (!soundEnabled) return;
    
    try {
        soundElement.currentTime = 0;
        soundElement.play().catch(e => {
            console.log('Звук не воспроизведен:', e);
        });
    } catch (error) {
        console.log('Ошибка воспроизведения звука:', error);
    }
}

function toggleSound() {
    soundEnabled = !soundEnabled;
    const soundBtn = document.getElementById('sound-btn');
    if (soundBtn) {
        soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
        playSound(clickSound);
    }
}

function toggleMusic() {
    musicEnabled = !musicEnabled;
    const musicBtn = document.getElementById('music-btn');
    if (musicBtn) {
        musicBtn.textContent = musicEnabled ? '🎵' : '🔇';
        playSound(clickSound);
        
        if (musicEnabled && gameRunning && !gamePaused) {
            bgMusic.play().catch(e => console.log('Музыка не запущена:', e));
        } else {
            bgMusic.pause();
        }
    }
}

// ========================================
// ИНИЦИАЛИЗАЦИЯ ИГРЫ
// ========================================
function initGame() {
    console.log('🔄 Инициализация игры...');
    
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
    
    // Добавляем кнопки звука
    addSoundButtons();
    
    // Настраиваем обработчики событий
    setupGameEventListeners();
    
    // Рисуем меню
    drawMenuScreen();
    
    console.log('✅ Игра готова!');
}

// ========================================
// ДОБАВЛЕНИЕ КНОПОК ЗВУКА
// ========================================
function addSoundButtons() {
    // Проверяем, есть ли уже кнопки
    if (!document.getElementById('sound-btn')) {
        const gameUI = document.getElementById('game-ui');
        if (gameUI) {
            const soundControls = document.createElement('div');
            soundControls.style.cssText = `
                display: flex;
                gap: 5px;
                position: absolute;
                top: 15px;
                right: 70px;
            `;
            
            const soundBtn = document.createElement('button');
            soundBtn.id = 'sound-btn';
            soundBtn.textContent = soundEnabled ? '🔊' : '🔇';
            soundBtn.title = 'Вкл/Выкл звуки';
            soundBtn.style.cssText = `
                background: rgba(26, 32, 44, 0.9);
                border: 2px solid #4a5568;
                border-radius: 50%;
                width: 35px;
                height: 35px;
                font-size: 1rem;
                color: #fff;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            const musicBtn = document.createElement('button');
            musicBtn.id = 'music-btn';
            musicBtn.textContent = musicEnabled ? '🎵' : '🔇';
            musicBtn.title = 'Вкл/Выкл музыку';
            musicBtn.style.cssText = soundBtn.style.cssText;
            
            soundControls.appendChild(soundBtn);
            soundControls.appendChild(musicBtn);
            gameUI.appendChild(soundControls);
            
            soundBtn.addEventListener('click', toggleSound);
            musicBtn.addEventListener('click', toggleMusic);
        }
    }
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
    
    // Звук
    ctx.fillText('🔊 Настрой звук в правом верхнем углу', canvas.width / 2, 320);
}

// ========================================
// НАСТРОЙКА ОБРАБОТЧИКОВ
// ========================================
function setupGameEventListeners() {
    startBtn.addEventListener('click', function() {
        playSound(clickSound);
        startGame();
    });
    
    pauseBtn.addEventListener('click', function() {
        playSound(clickSound);
        pauseGame();
    });
    
    document.getElementById('resume-btn').addEventListener('click', function() {
        playSound(clickSound);
        pauseGame();
    });
    
    document.getElementById('restart-btn').addEventListener('click', function() {
        playSound(clickSound);
        restartGame();
    });
    
    document.getElementById('menu-btn').addEventListener('click', function() {
        playSound(clickSound);
        returnToGameMenu();
    });
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
    
    player.jumping = false;
    player.ducking = false;
    player.y = player.groundY;
    player.height = 80;
    player.velocity = 0;
    
    // Запускаем музыку
    if (musicEnabled) {
        bgMusic.currentTime = 0;
        bgMusic.volume = 0.3;
        bgMusic.play().catch(e => console.log('Не удалось запустить музыку:', e));
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
    const pauseScreen = document.getElementById('pause-screen');
    pauseScreen.classList.toggle('show');
    document.getElementById('pause-score').textContent = score;
    
    if (gamePaused) {
        cancelAnimationFrame(animationId);
        bgMusic.pause();
    } else {
        lastTime = performance.now();
        animationId = requestAnimationFrame(gameLoop);
        pauseScreen.classList.remove('show');
        
        if (musicEnabled) {
            bgMusic.play().catch(e => console.log('Не удалось возобновить музыку:', e));
        }
    }
}

// ========================================
// ПЕРЕЗАПУСК ИГРЫ
// ========================================
function restartGame() {
    document.getElementById('pause-screen').classList.remove('show');
    startGame();
}

// ========================================
// ВОЗВРАТ В МЕНЮ
// ========================================
function returnToGameMenu() {
    document.getElementById('pause-screen').classList.remove('show');
    menuScreen.classList.remove('hidden');
    gameRunning = false;
    gamePaused = false;
    cancelAnimationFrame(animationId);
    localStorage.setItem('gameHighScore', highScore);
    
    bgMusic.pause();
    bgMusic.currentTime = 0;
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
    // СЧЕТ: +1 за каждый кадр
    score += 1;
    scoreElement.textContent = score;
    
    // СКОРОСТЬ ИГРЫ: медленный рост
    const gameSpeed = 2 + Math.floor(score / 2000);
    
    // Обновляем игрока
    updatePlayer();
    
    // Обновляем препятствия
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
        
        if (score > 0 && score % 500 === 0) {
            showNewRecord();
        }
    }
}

// ========================================
// ОБНОВЛЕНИЕ ИГРОКА
// ========================================
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

// ========================================
// ОБНОВЛЕНИЕ ПРЕПЯТСТВИЙ
// ========================================
function updateObstacles(gameSpeed) {
    // МЕДЛЕННОЕ появление препятствий
    if (Math.random() < 0.0015) {
        const types = [
            { width: 50, height: 60, img: obstacleImg1, imgIndex: 1 },
            { width: 60, height: 50, img: obstacleImg2, imgIndex: 2 },
            { width: 70, height: 40, img: obstacleImg3, imgIndex: 3 }
        ];
        
        const type = Math.floor(Math.random() * types.length);
        obstacles.push({
            x: canvas.width,
            y: canvas.height - types[type].height - 50,
            width: types[type].width,
            height: types[type].height,
            img: types[type].img,
            imgIndex: types[type].imgIndex,
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

// ========================================
// ОБНОВЛЕНИЕ ОБЛАКОВ
// ========================================
function updateClouds() {
    for (let cloud of clouds) {
        cloud.x -= cloud.speed;
        
        if (cloud.x + cloud.width < 0) {
            cloud.x = canvas.width;
            cloud.y = Math.random() * 150;
        }
    }
}

// ========================================
// ПРОВЕРКА СТОЛКНОВЕНИЙ
// ========================================
function checkCollisions() {
    for (let obstacle of obstacles) {
        // Упрощенная проверка столкновения
        const playerRight = player.x + player.width * 0.7;
        const playerLeft = player.x + player.width * 0.3;
        const playerBottom = player.y + player.height * 0.7;
        const playerTop = player.y + player.height * 0.3;
        
        const obstacleRight = obstacle.x + obstacle.width * 0.7;
        const obstacleLeft = obstacle.x + obstacle.width * 0.3;
        const obstacleBottom = obstacle.y + obstacle.height * 0.7;
        const obstacleTop = obstacle.y + obstacle.height * 0.3;
        
        if (playerRight > obstacleLeft &&
            playerLeft < obstacleRight &&
            playerBottom > obstacleTop &&
            playerTop < obstacleBottom) {
            
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
    
    // Проигрываем звуки
    playSound(collisionSound);
    setTimeout(() => playSound(gameOverSound), 300);
    
    localStorage.setItem('gameHighScore', highScore);
    
    // Останавливаем музыку
    bgMusic.pause();
    bgMusic.currentTime = 0;
    
    // Показываем меню
    setTimeout(() => {
        menuScreen.classList.remove('hidden');
    }, 800);
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
    
    // Дорога
    drawRoad();
    
    // Разметка
    drawRoadLines();
    
    // Препятствия
    drawObstacles();
    
    // Игрок
    drawPlayer();
}

// ========================================
// РИСОВАНИЕ СОЛНЦА
// ========================================
function drawSun() {
    ctx.fillStyle = '#FFD700';
    ctx.beginPath();
    ctx.arc(canvas.width - 60, 60, 30, 0, Math.PI * 2);
    ctx.fill();
}

// ========================================
// РИСОВАНИЕ ОБЛАКОВ
// ========================================
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

// ========================================
// РИСОВАНИЕ ДОРОГИ
// ========================================
function drawRoad() {
    ctx.fillStyle = '#696969';
    ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3);
}

// ========================================
// РИСОВАНИЕ РАЗМЕТКИ
// ========================================
function drawRoadLines() {
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < canvas.width; i += 100) {
        ctx.fillRect(i + groundOffset, canvas.height - 30, 50, 5);
    }
}

// ========================================
// РИСОВАНИЕ ПРЕПЯТСТВИЙ
// ========================================
function drawObstacles() {
    for (let obstacle of obstacles) {
        // Проверяем, загрузилось ли изображение
        let canDrawImage = false;
        if (obstacle.imgIndex === 1 && imagesLoaded.obstacle1 && obstacle.img.complete) {
            canDrawImage = true;
        } else if (obstacle.imgIndex === 2 && imagesLoaded.obstacle2 && obstacle.img.complete) {
            canDrawImage = true;
        } else if (obstacle.imgIndex === 3 && imagesLoaded.obstacle3 && obstacle.img.complete) {
            canDrawImage = true;
        }
        
        if (canDrawImage) {
            try {
                ctx.drawImage(obstacle.img, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
            } catch (error) {
                drawObstacleFallback(obstacle);
            }
        } else {
            drawObstacleFallback(obstacle);
        }
    }
}

function drawObstacleFallback(obstacle) {
    // Запасной вариант
    ctx.fillStyle = '#8B0000';
    ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(obstacle.x + 5, obstacle.y + 5, obstacle.width - 10, 3);
    ctx.fillRect(obstacle.x + 5, obstacle.y + obstacle.height - 8, obstacle.width - 10, 3);
}

// ========================================
// РИСОВАНИЕ ИГРОКА
// ========================================
function drawPlayer() {
    // Проверяем, загрузилось ли изображение
    if (imagesLoaded.player && playerImg.complete) {
        try {
            if (player.ducking && !player.jumping) {
                ctx.drawImage(playerImg, player.x, player.y + 30, player.width, 50);
            } else {
                ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
            }
            return;
        } catch (error) {
            console.log('Ошибка рисования игрока:', error);
        }
    }
    
    // Запасной вариант
    drawPlayerFallback();
}

function drawPlayerFallback() {
    ctx.fillStyle = '#4169E1';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(player.x + player.width - 20, player.y + 15, 10, 10);
    ctx.fillStyle = '#000000';
    ctx.fillRect(player.x + player.width - 18, player.y + 17, 6, 6);
    
    ctx.beginPath();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.arc(player.x + player.width - 30, player.y + 30, 10, 0, Math.PI);
    ctx.stroke();
    
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(player.x + 5, player.y + 10, player.width - 10, 5);
    ctx.fillRect(player.x + 5, player.y + 25, player.width - 10, 5);
}

// ========================================
// НОВЫЙ РЕКОРД
// ========================================
function showNewRecord() {
    const recordEl = document.getElementById('new-record');
    recordEl.classList.add('show');
    
    setTimeout(() => {
        recordEl.classList.remove('show');
    }, 1500);
}

// ========================================
// УПРАВЛЕНИЕ ИГРОЙ
// ========================================
function jump() {
    if (!player.jumping && gameRunning && !gamePaused) {
        player.jumping = true;
        player.velocity = player.jumpPower;
        player.ducking = false;
        playSound(jumpSound); // Звук прыжка
    }
}

function duck(start) {
    if (gameRunning && !gamePaused) {
        player.ducking = start;
    }
}

// ========================================
// ОБРАБОТКА КАСАНИЙ
// ========================================
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

// ========================================
// ОБРАБОТКА МЫШИ
// ========================================
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

// ========================================
// ОБРАБОТКА КЛАВИАТУРЫ
// ========================================
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

// ========================================
// НАСТРОЙКА МОДАЛЬНОГО ОКНА
// ========================================
function setupModalControls() {
    launchGameBtn.addEventListener('click', function() {
        playSound(clickSound);
        gameModal.classList.add('show');
        document.body.style.overflow = 'hidden';
        initGame();
    });
    
    closeGameBtn.addEventListener('click', function() {
        playSound(clickSound);
        gameModal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        gameRunning = false;
        gamePaused = false;
        cancelAnimationFrame(animationId);
        
        bgMusic.pause();
        bgMusic.currentTime = 0;
    });
    
    gameModal.addEventListener('click', function(e) {
        if (e.target === gameModal) {
            gameModal.classList.remove('show');
            document.body.style.overflow = 'auto';
            
            gameRunning = false;
            gamePaused = false;
            cancelAnimationFrame(animationId);
            
            bgMusic.pause();
            bgMusic.currentTime = 0;
        }
    });
    
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
}

// ========================================
// ЗАГРУЗКА СТРАНИЦЫ
// ========================================
window.addEventListener('load', function() {
    setupModalControls();
    
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    
    console.log('✅ Игра с звуком готова!');
    console.log('🔊 Звук включен по умолчанию');
    console.log('🎵 Музыка включена по умолчанию');
});
