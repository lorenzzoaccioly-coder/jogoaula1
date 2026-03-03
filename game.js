const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const hpEl = document.getElementById('hp');
const startMenu = document.getElementById('start-menu');
const gameOverMenu = document.getElementById('game-over-menu');
const finalScoreVal = document.getElementById('final-score-val');
const startBtn = document.getElementById('start-btn');
const restartBtn = document.getElementById('restart-btn');

// --- GAME STATE ---
let gameState = 'MENU'; // MENU, PLAYING, GAMEOVER
let score = 0;
let hp = 100;
let lastTime = 0;
let enemies = [];
let bullets = [];
let particles = [];
let stars = [];
let enemySpawnTimer = 0;
let mouseX = 0;
let mouseY = 0;
let keys = {};

// --- CONFIG ---
const PLAYER_SIZE = 40;
const BULLET_SPEED = 10;
const ENEMY_SPEED_BASE = 2;
let enemySpeed = ENEMY_SPEED_BASE;

// --- INITIALIZATION ---
function init() {
    resize();
    createStars();
    mouseX = canvas.width / 2;
    mouseY = canvas.height - 100;
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
    if (e.touches.length > 0) {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
    }
});

window.addEventListener('keydown', (e) => keys[e.code] = true);
window.addEventListener('keyup', (e) => keys[e.code] = false);

// Click/Touch to shoot
window.addEventListener('mousedown', () => {
    if (gameState === 'PLAYING') player.fire();
});
window.addEventListener('touchstart', (e) => {
    if (gameState === 'PLAYING') {
        mouseX = e.touches[0].clientX;
        mouseY = e.touches[0].clientY;
        player.fire();
    }
});

// --- CLASSES ---

class Player {
    constructor() {
        this.x = canvas.width / 2;
        this.y = canvas.height - 100;
        this.size = PLAYER_SIZE;
        this.color = '#00ffff';
        this.trail = [];
    }

    update(dt) {
        // Smooth follow mouse - Slower (0.05)
        let dx = mouseX - this.x;
        let dy = mouseY - this.y;
        this.x += dx * 0.05;
        this.y += dy * 0.05;

        // Keep inside bounds
        this.x = Math.max(this.size, Math.min(canvas.width - this.size, this.x));
        this.y = Math.max(this.size, Math.min(canvas.height - this.size, this.y));

        // Auto-fire Disabled
        /*
        if (gameState === 'PLAYING') {
            this.fireTimer = (this.fireTimer || 0) + dt;
            if (this.fireTimer > 150) {
                this.fire();
                this.fireTimer = 0;
            }
        }
        */
    }

    fire() {
        // Tiro duplo ao atingir 3000 pontos
        if (score >= 3000) {
            bullets.push(new Bullet(this.x - 10, this.y - 20, -1));
            bullets.push(new Bullet(this.x + 10, this.y - 20, -1));
        } else {
            bullets.push(new Bullet(this.x, this.y - 20, -1));
        }

        // Add recoil effect to particles
        for (let i = 0; i < 3; i++) {
            particles.push(new Particle(this.x, this.y + 10, this.color, (Math.random() - 0.5) * 2, 2 + Math.random() * 2));
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        // Glow effect
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;

        // Player Body (Procedural Space Ship)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.moveTo(0, -20);
        ctx.lineTo(15, 10);
        ctx.lineTo(-15, 10);
        ctx.closePath();
        ctx.fill();

        // Wings
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-15, 5);
        ctx.lineTo(-25, 15);
        ctx.moveTo(15, 5);
        ctx.lineTo(25, 15);
        ctx.stroke();

        // Engine Flame
        const engineGlow = ctx.createRadialGradient(0, 15, 0, 0, 15, 15);
        engineGlow.addColorStop(0, '#ff00ff');
        engineGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = engineGlow;
        ctx.beginPath();
        ctx.arc(0, 15, 8 + Math.random() * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Enemy {
    constructor() {
        this.x = Math.random() * (canvas.width - 40) + 20;
        this.y = -50;
        this.size = 30;
        this.speed = enemySpeed + Math.random() * 2;
        this.hp = 2;
        this.color = '#ff4444';
    }

    update() {
        this.y += this.speed;
        if (this.y > canvas.height + 50) {
            this.active = false;
            // Penalidade por deixar escapar (GAME OVER se acumular)
            hp -= 10;
            if (hp <= 0) endGame();
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        // Enemy shape
        ctx.beginPath();
        ctx.moveTo(0, 20);
        ctx.lineTo(20, -10);
        ctx.lineTo(-20, -10);
        ctx.closePath();
        ctx.fill();

        // Inner core
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

class Bullet {
    constructor(x, y, dir) {
        this.x = x;
        this.y = y;
        this.speed = BULLET_SPEED * dir;
        this.active = true;
    }

    update() {
        this.y += this.speed;
        if (this.y < -10 || this.y > canvas.height + 10) this.active = false;
    }

    draw() {
        ctx.save();
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#00ffff';
        ctx.fillStyle = '#00ffff';
        ctx.fillRect(this.x - 2, this.y - 10, 4, 15);
        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, vx, vy) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.life = 1.0;
        this.decay = 0.02 + Math.random() * 0.02;
        this.size = 2 + Math.random() * 3;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
    }

    draw() {
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}

function createStars() {
    stars = [];
    for (let i = 0; i < 150; i++) {
        stars.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 2,
            speed: 0.5 + Math.random() * 1.5
        });
    }
}

const player = new Player();

// --- GAME LOOP ---
function update(time) {
    const dt = time - lastTime;
    lastTime = time;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Starfield Background
    ctx.fillStyle = '#ffffff';
    stars.forEach(star => {
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
        ctx.globalAlpha = 0.3 + Math.random() * 0.4;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    if (gameState === 'PLAYING') {
        player.update(dt);
        player.draw();

        // Spawn enemies - Frequency increases over time, but reduced base quantity
        enemySpawnTimer += dt;
        // Adjusted: Base interval 1500ms (was 1000ms) for fewer enemies
        const spawnInterval = 1500 / (enemySpeed / ENEMY_SPEED_BASE);
        if (enemySpawnTimer > Math.max(350, spawnInterval)) {
            enemies.push(new Enemy());
            enemySpawnTimer = 0;
            enemySpeed += 0.06; // Slower scaling
        }

        // Update Bullets
        bullets = bullets.filter(b => b.active);
        bullets.forEach(b => {
            b.update();
            b.draw();
        });

        // Update Enemies
        enemies = enemies.filter(e => e.active !== false);
        enemies.forEach(e => {
            e.update();
            e.draw();

            // Collision with Player
            let dx = e.x - player.x;
            let dy = e.y - player.y;
            let dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < player.size / 2 + e.size / 2) {
                hp -= 20;
                e.active = false;
                spawnExplosion(e.x, e.y, e.color);
                if (hp <= 0) endGame();
            }

            // Collision with Bullets
            bullets.forEach(b => {
                let bdx = e.x - b.x;
                let bdy = e.y - b.y;
                let bdist = Math.sqrt(bdx * bdx + bdy * bdy);
                if (bdist < e.size / 2 + 5) {
                    e.hp--;
                    b.active = false;
                    score += 10;
                    if (e.hp <= 0) {
                        e.active = false;
                        score += 50;

                        // Regeneração a cada 1000 pontos
                        if (score % 1000 < 50 && hp < 100) {
                            hp = Math.min(100, hp + 10);
                        }

                        spawnExplosion(e.x, e.y, e.color);
                    }
                }
            });
        });

        // Update HUD
        scoreEl.innerText = score;
        hpEl.innerText = hp;
        hpEl.style.color = hp < 30 ? '#ff0000' : (hp < 60 ? '#ffff00' : '#00ffff');
    }

    // Update Particles
    particles = particles.filter(p => p.life > 0);
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(update);
}

function spawnExplosion(x, y, color) {
    for (let i = 0; i < 15; i++) {
        const vx = (Math.random() - 0.5) * 8;
        const vy = (Math.random() - 0.5) * 8;
        particles.push(new Particle(x, y, color, vx, vy));
    }
}

function endGame() {
    gameState = 'GAMEOVER';
    gameOverMenu.classList.add('active');
    finalScoreVal.innerText = score;
}

function resetGame() {
    score = 0;
    hp = 100;
    enemies = [];
    bullets = [];
    particles = [];
    enemySpeed = ENEMY_SPEED_BASE;
    gameState = 'PLAYING';
    startMenu.classList.remove('active');
    gameOverMenu.classList.remove('active');
}

startBtn.addEventListener('click', resetGame);
restartBtn.addEventListener('click', resetGame);

// Start Loop
init();
requestAnimationFrame(update);
