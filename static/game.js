const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

let score = 0;
let gameState = 'playing';
let baseMeteorCount = 8;

// Загрузка изображений
const spaceshipImg = new Image();
spaceshipImg.src = '/static/spaceship.png';
const squareMeteorImg = new Image();
squareMeteorImg.src = '/static/square_meteor.png';
const circleMeteorImg = new Image();
circleMeteorImg.src = '/static/circle_meteor.png';
const triangleMeteorImg = new Image();
triangleMeteorImg.src = '/static/triangle_meteor.png';

// Проверка загрузки изображений
let imagesLoaded = 0;
const totalImages = 4;
function imageLoaded() {
    imagesLoaded++;
    if (imagesLoaded === totalImages) {
        gameLoop();
    }
}
spaceshipImg.onload = imageLoaded;
squareMeteorImg.onload = imageLoaded;
circleMeteorImg.onload = imageLoaded;
triangleMeteorImg.onload = imageLoaded;

spaceshipImg.onerror = () => console.log("Ошибка загрузки spaceship.png");
squareMeteorImg.onerror = () => console.log("Ошибка загрузки square_meteor.png");
circleMeteorImg.onerror = () => console.log("Ошибка загрузки circle_meteor.png");
triangleMeteorImg.onerror = () => console.log("Ошибка загрузки triangle_meteor.png");

class Player {
    constructor() {
        this.width = 50;
        this.height = 30;
        this.x = WIDTH / 2 - this.width / 2;
        this.y = HEIGHT - 50;
        this.hasExplosive = false;
        this.explosiveTimer = 0;
        this.lastShot = 0;
    }

    update(mouseX, mouseY, isMousePressed) {
        if (isMousePressed) {
            this.x = mouseX - this.width / 2;
            this.y = mouseY - this.height / 2;

            if (this.x < 0) this.x = 0;
            if (this.x + this.width > WIDTH) this.x = WIDTH - this.width;
            if (this.y < 0) this.y = 0;
            if (this.y + this.height > HEIGHT) this.y = HEIGHT - this.height;

            const currentTime = Date.now();
            if (currentTime - this.lastShot >= 200) {
                bullets.push(new Bullet(this.x + this.width / 2, this.y, this.hasExplosive));
                this.lastShot = currentTime;
            }
        }

        if (this.hasExplosive && Date.now() - this.explosiveTimer > 5000) {
            this.hasExplosive = false;
        }
    }

    draw() {
        if (spaceshipImg.complete && spaceshipImg.naturalWidth !== 0) {
            ctx.drawImage(spaceshipImg, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = 'white';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
    }
}

class Bullet {
    constructor(x, y, explosive) {
        this.x = x;
        this.y = y;
        this.width = explosive ? 10 : 5;
        this.height = explosive ? 20 : 10;
        this.speed = -10;
        this.explosive = explosive;
        this.explosionRadius = explosive ? 200 : 0;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = this.explosive ? 'orange' : 'red';
        ctx.fillRect(this.x - this.width / 2, this.y, this.width, this.height);
    }
}

class Meteor {
    constructor(type) {
        this.type = type;
        this.size = type === 'square' ? 30 : type === 'circle' ? 40 : 50;
        this.x = Math.random() * (WIDTH - this.size);
        this.y = -this.size - Math.random() * 100;
        this.speed = 1 + Math.log(1 + score) / Math.LN2;
        this.time = Math.random() * 2 * Math.PI;
        this.amplitude = 20 + Math.random() * 30;
        this.angle = 0;
        this.explosionRadius = type === 'triangle' ? 200 : 0;
        this.img = type === 'square' ? squareMeteorImg : type === 'circle' ? circleMeteorImg : triangleMeteorImg;
    }

    update() {
        this.speed = 1 + Math.log(1 + score) / Math.LN2;
        this.time += 0.05;
        this.x += Math.sin(this.time) * this.amplitude * 0.1;
        this.y += this.speed;
        this.angle = (this.angle + 2) % 360;

        if (this.x < 0) this.x = 0;
        if (this.x + this.size > WIDTH) this.x = WIDTH - this.size;
        if (this.y > HEIGHT) {
            this.reset();
        }
    }

    reset() {
        this.y = -this.size - Math.random() * 100;
        this.x = Math.random() * (WIDTH - this.size);
        this.time = Math.random() * 2 * Math.PI;
    }

    draw() {
        ctx.save();
        ctx.translate(this.x + this.size / 2, this.y + this.size / 2);
        ctx.rotate(this.angle * Math.PI / 180);
        if (this.img.complete && this.img.naturalWidth !== 0) {
            ctx.drawImage(this.img, -this.size / 2, -this.size / 2, this.size, this.size);
        } else {
            ctx.fillStyle = this.type === 'triangle' ? 'green' : 'white';
            if (this.type === 'square') {
                ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
            } else if (this.type === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, this.size / 2, 0, 2 * Math.PI);
                ctx.fill();
            } else if (this.type === 'triangle') {
                ctx.beginPath();
                ctx.moveTo(0, -this.size / 2);
                ctx.lineTo(-this.size / 2, this.size / 2);
                ctx.lineTo(this.size / 2, this.size / 2);
                ctx.closePath();
                ctx.fill();
            }
        }
        ctx.restore();
    }
}

class PowerUp {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 20;
        this.speed = 2;
    }

    update() {
        this.y += this.speed;
    }

    draw() {
        ctx.fillStyle = 'orange';
        ctx.fillRect(this.x - this.size / 2, this.y - this.size / 2, this.size, this.size);
    }
}

class Explosion {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 10;
        this.frame = 0;
        this.maxFrames = 20;
    }

    update() {
        this.frame++;
        this.size += 2;
    }

    draw() {
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size / 2, 0, 2 * Math.PI);
        ctx.fill();
    }
}

let player = new Player();
let bullets = [];
let meteors = [];
let powerups = [];
let explosions = [];

function spawnMeteors(count) {
    for (let i = 0; i < count; i++) {
        const r = Math.random();
        const type = r < 0.7 ? 'square' : r < 0.9 ? 'circle' : 'triangle';
        meteors.push(new Meteor(type));
    }
}

spawnMeteors(baseMeteorCount);

let mouseX = 0;
let mouseY = 0;
let isMousePressed = false;

canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) isMousePressed = true;
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 0) isMousePressed = false;
});

function checkCollision(obj1, obj2) {
    return obj1.x < obj2.x + obj2.size &&
           obj1.x + obj1.width > obj2.x &&
           obj1.y < obj2.y + obj2.size &&
           obj1.y + obj1.height > obj2.y;
}

function gameLoop() {
    if (imagesLoaded < totalImages) return; // Ждем загрузки всех изображений

    if (gameState === 'playing') {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // Обновление и отрисовка фона
        background.update();
        background.draw(ctx);

        // Обновление и отрисовка игрока
        player.update(mouseX, mouseY, isMousePressed);
        player.draw();

        // Обновление и отрисовка пуль
        bullets.forEach((bullet, bIndex) => {
            bullet.update();
            bullet.draw();
            if (bullet.y < 0) bullets.splice(bIndex, 1);
        });

        // Обновление и отрисовка метеоритов
        const targetMeteorCount = baseMeteorCount + Math.floor(score / 10);
        if (meteors.length < targetMeteorCount) spawnMeteors(targetMeteorCount - meteors.length);

        meteors.forEach((meteor, mIndex) => {
            meteor.update();
            meteor.draw();

            // Столкновение пули с метеоритом
            bullets.forEach((bullet, bIndex) => {
                if (checkCollision(bullet, meteor)) {
                    score++;
                    explosions.push(new Explosion(meteor.x + meteor.size / 2, meteor.y + meteor.size / 2));
                    meteors.splice(mIndex, 1);
                    bullets.splice(bIndex, 1);

                    if (meteor.explosionRadius > 0 || bullet.explosive) {
                        const radius = meteor.explosionRadius > 0 ? meteor.explosionRadius : 200;
                        meteors.forEach((nearby, nIndex) => {
                            const dx = nearby.x + nearby.size / 2 - (meteor.x + meteor.size / 2);
                            const dy = nearby.y + nearby.size / 2 - (meteor.y + meteor.size / 2);
                            if (Math.hypot(dx, dy) < radius) {
                                score++;
                                explosions.push(new Explosion(nearby.x + nearby.size / 2, nearby.y + nearby.size / 2));
                                meteors.splice(nIndex, 1);
                            }
                        });
                    }

                    if (Math.random() < 0.1) {
                        powerups.push(new PowerUp(meteor.x + meteor.size / 2, meteor.y + meteor.size / 2));
                    }

                    const r = Math.random();
                    const type = r < 0.7 ? 'square' : r < 0.9 ? 'circle' : 'triangle';
                    meteors.push(new Meteor(type));
                }
            });

            // Столкновение игрока с метеоритом
            if (checkCollision(player, meteor)) {
                gameState = 'game_over';
            }
        });

        // Обновление и отрисовка PowerUp
        powerups.forEach((powerup, pIndex) => {
            powerup.update();
            powerup.draw();
            if (checkCollision(player, powerup)) {
                player.hasExplosive = true;
                player.explosiveTimer = Date.now();
                powerups.splice(pIndex, 1);
            }
            if (powerup.y > HEIGHT) powerups.splice(pIndex, 1);
        });

        // Обновление и отрисовка взрывов
        explosions.forEach((explosion, eIndex) => {
            explosion.update();
            explosion.draw();
            if (explosion.frame >= explosion.maxFrames) explosions.splice(eIndex, 1);
        });

        scoreDisplay.textContent = `Score: ${score}`;
    } else if (gameState === 'game_over') {
        ctx.fillStyle = 'white';
        ctx.font = '36px Arial';
        ctx.fillText('Game Over', WIDTH / 2 - 100, HEIGHT / 2 - 50);
        ctx.fillText(`Final Score: ${score}`, WIDTH / 2 - 130, HEIGHT / 2);
        setTimeout(() => { location.reload(); }, 3000);
    }

    requestAnimationFrame(gameLoop);
}

const background = {
    y: -HEIGHT,
    speed: 1,
    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, WIDTH, HEIGHT);
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * WIDTH;
            const y = (Math.random() * HEIGHT * 2 + this.y) % (HEIGHT * 2);
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(x, y, Math.random() * 3, 0, 2 * Math.PI);
            ctx.fill();
        }
    },
    update() {
        this.y += this.speed;
        if (this.y >= 0) this.y = -HEIGHT;
    }
};

gameLoop();