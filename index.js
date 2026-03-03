/**
 * NEBULA ODYSSEY - FINAL PREMIUM VERSION
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const hpBar = document.getElementById('hp-bar');
const startMenu = document.getElementById('start-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const finalScoreVal = document.getElementById('final-score-val');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');
const gameContainer = document.getElementById('game-container');

// --- GAME STATE ---
let gameState = 'MENU';
let score = 0;
let hp = 100;
let lastTime = 0;
let enemies = [];
let bullets = [];
let particles = [];
let powerups = [];
let stars = [];
let enemySpawnTimer = 0;
let difficultyMultiplier = 1;
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight - 150;
let screenShake = 0;

// --- CONFIG ---
const PLAYER_SIZE = 45;
const BULLET_SPEED = 12;
const ENEMY_TYPES = [
    { name: 'Drone', hp: 1, speed: 2.5, color: '#f87171', score: 100, size: 25 },
    { name: 'Interceptor', hp: 2, speed: 4.5, color: '#fcd34d', score: 250, size: 20 },
    { name: 'Destroyer', hp: 5, speed: 1.5, color: '#c084fc', score: 1000, size: 45 }
];

// --- INITIALIZATION ---
function init() {
    resize();
    createStars();
    requestAnimationFrame(update);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);

// --- INPUTS ---
window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
});

window.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }
}, { passive: false });

// Click/Touch to shoot
window.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') player.fire();
});

window.addEventListener('touchstart', (e) => {
    if (gameState === 'PLAYING') {
        // Update position before firing if it's the first touch
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        player.fire();
    }
});

// --- UTILS ---
function createStars() {
    stars = [];
    const counts = [80, 50, 20]; // 3 layers
    const speeds = [0.2, 0.8, 2.5];
    const sizes = [1, 2, 3];

    for (let layer = 0; layer < 3; layer++) {
        for (let i = 0; i < counts[layer]; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: sizes[layer],
                speed: speeds[layer],
                layer: layer,
                opacity: 0.2 + Math.random() * 0.5
            });
        }
    }
}

function shakeScreen(amt) {
    screenShake = amt;
}

function showScorePopup(x, y, text) {
    const el = document.createElement('div');
    el.className = 'score-popup';
    el.innerText = '+' + text;
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    gameContainer.appendChild(el);
    setTimeout(() => el.remove(), 1000);
}

// --- CLASSES ---

class Particle {
    constructor(x, y, color, vx, vy, size = 3) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.life = 1.0;
        this.decay = 0.01 + Math.random() * 0.02;
        this.size = Math.random() * size + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        this.vx *= 0.98;
        this.vy *= 0.98;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 150;
        this.targetX = this.x;
        this.targetY = this.y;
        this.size = PLAYER_SIZE;
        this.color = '#22d3ee';
        this.fireTimer = 0;
        this.tilt = 0;
    }

    update(dt) {
        // Smooth movement - Slower response (modified from 0.15 to 0.05)
        let prevX = this.x;
        this.x += (mouseX - this.x) * 0.05;
        this.y += (mouseY - this.y) * 0.05;

        // Visual tilt based on movement
        this.tilt = (this.x - prevX) * 0.8;
        this.tilt = Math.max(-0.5, Math.min(0.5, this.tilt));

        // Bounds
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));

        // Engine Particles
        if (Math.random() > 0.3) {
            particles.push(new Particle(this.x, this.y + 25, '#c084fc', (Math.random() - 0.5) * 2, 5 + Math.random() * 3));
        }

        // Auto Fire Disabled (Moved to click/touch events)
        /*
        if (gameState === 'PLAYING') {
            this.fireTimer += dt;
            const fireRate = 180;
            if (this.fireTimer > fireRate) {
                this.fire();
                this.fireTimer = 0;
            }
        }
        */
    }

    fire() {
        bullets.push(new Bullet(this.x, this.y - 15));
        // Recoil particles
        for (let i = 0; i < 2; i++) {
            particles.push(new Particle(this.x, this.y - 10, this.color, (Math.random() - 0.5) * 4, -2));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.tilt);

        // Ship Outer Glow
        ctx.shadowBlur = 25;
        ctx.shadowColor = this.color;

        // Ship Body
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.moveTo(0, -25);
        ctx.lineTo(20, 15);
        ctx.lineTo(-20, 15);
        ctx.closePath();
        ctx.fill();

        // Details
        ctx.fillStyle = this.color;
        ctx.fillRect(-5, -5, 10, 15);

        // Wings
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(-15, 0); ctx.lineTo(-30, 10);
        ctx.moveTo(15, 0); ctx.lineTo(30, 10);
        ctx.stroke();

        ctx.restore();
    }
}

class Enemy {
    constructor() {
        const typeIndex = Math.random() < 0.7 ? 0 : (Math.random() < 0.9 ? 1 : 2);
        const type = ENEMY_TYPES[typeIndex];

        this.name = type.name;
        this.x = Math.random() * (canvas.width - 60) + 30;
        this.y = -50;
        this.speed = type.speed * (1 + (difficultyMultiplier - 1) * 0.2);
        this.maxHp = type.hp;
        this.hp = type.hp;
        this.color = type.color;
        this.size = type.size;
        this.scoreValue = type.score;
        this.active = true;
        this.sinOffset = Math.random() * Math.PI * 2;
    }

    update(dt) {
        this.y += this.speed;

        // Interceptors zig-zag
        if (this.name === 'Interceptor') {
            this.x += Math.sin(Date.now() / 200 + this.sinOffset) * 4;
        }

        if (this.y > canvas.height + 50) {
            this.active = false;
            // Penalidade por deixar escapar
            hp -= 10;
            shakeScreen(10);
            if (hp <= 0) endGame();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        if (this.name === 'Destroyer') {
            ctx.beginPath();
            ctx.moveTo(0, this.size);
            ctx.lineTo(this.size, 0);
            ctx.lineTo(0, -this.size);
            ctx.lineTo(-this.size, 0);
            ctx.closePath();
            ctx.fill();
        } else {
            ctx.beginPath();
            ctx.moveTo(0, this.size);
            ctx.lineTo(this.size, -this.size);
            ctx.lineTo(-this.size, -this.size);
            ctx.closePath();
            ctx.fill();
        }

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.speed = BULLET_SPEED;
        this.active = true;
    }

    update() {
        this.y -= this.speed;
        if (this.y < -50) this.active = false;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#22d3ee';
        ctx.fillStyle = '#fff';
        ctx.fillRect(this.x - 2, this.y - 12, 4, 15);
        ctx.restore();
    }
}

const player = new Player();

// --- GAME LOOP ---
function update(time) {
    const dt = time - lastTime;
    lastTime = time;

    // Reset transform and Clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply Screen Shake
    if (screenShake > 0) {
        const sx = (Math.random() - 0.5) * screenShake;
        const sy = (Math.random() - 0.5) * screenShake;
        ctx.translate(sx, sy);
        screenShake *= 0.9; // Decay
        if (screenShake < 0.1) screenShake = 0;
    }

    // DRAW BACKGROUND (STARS)
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        ctx.globalAlpha = star.opacity;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    if (gameState === 'PLAYING') {
        player.update(dt);
        player.draw();

        // Spawn logic - Spawns faster over time
        enemySpawnTimer += dt;
        // Base interval is 1200ms, reduced significantly by difficultyMultiplier
        const currentSpawnInterval = 1200 / (difficultyMultiplier * 1.5);
        if (enemySpawnTimer > Math.max(200, currentSpawnInterval)) {
            enemies.push(new Enemy());
            enemySpawnTimer = 0;
            // difficultyMultiplier increases every frame, making spawns faster
            difficultyMultiplier += 0.008;
        }

        // Update Projectiles
        bullets = bullets.filter(b => b.active);
        bullets.forEach(b => {
            b.update();
            b.draw();
        });

        // Update Enemies
        enemies = enemies.filter(e => e.active);
        enemies.forEach(e => {
            e.update(dt);
            e.draw();

            // Collision with Player
            const distP = Math.hypot(e.x - player.x, e.y - player.y);
            if (distP < player.size / 2 + e.size) {
                e.active = false;
                hp -= 20;
                shakeScreen(15);
                spawnExplosion(e.x, e.y, e.color, 20);
                if (hp <= 0) endGame();
            }

            // Collision with Bullets
            bullets.forEach(b => {
                const distB = Math.hypot(e.x - b.x, e.y - b.y);
                if (distB < e.size + 10) {
                    e.hp--;
                    b.active = false;
                    score += 50;
                    if (e.hp <= 0) {
                        e.active = false;
                        score += e.scoreValue;
                        showScorePopup(e.x, e.y, e.scoreValue);
                        spawnExplosion(e.x, e.y, e.color, 30);
                        shakeScreen(5);
                    } else {
                        // Flash/Spark on hit
                        spawnExplosion(b.x, b.y, '#fff', 5, 2);
                    }
                }
            });
        });

        // Update UI
        scoreEl.innerText = score.toLocaleString();
        hpBar.style.width = hp + '%';
        if (hp < 30) hpBar.style.background = '#ef4444';
        else if (hp < 60) hpBar.style.background = '#f59e0b';
        else hpBar.style.background = 'linear-gradient(90deg, var(--accent), var(--primary))';
    }

    // Update Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(update);
}

function spawnExplosion(x, y, color, count, size = 5) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const spd = Math.random() * 6;
        particles.push(new Particle(x, y, color, Math.cos(angle) * spd, Math.sin(angle) * spd, size));
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    gameOverMenu.classList.add('active');
    finalScoreVal.innerText = score.toLocaleString();
}

function resetGame() {
    score = 0;
    hp = 100;
    enemies = [];
    bullets = [];
    particles = [];
    difficultyMultiplier = 1;
    gameState = 'PLAYING';
    startMenu.classList.remove('active');
    gameOverMenu.classList.remove('active');
}

startBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', resetGame);

// START
init();
