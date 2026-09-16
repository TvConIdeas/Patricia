const games = [
    { name: "Sweet Bonanza 1000", image: "img/Sweet-Bonanza-1000.jpg" },
    { name: "Great Rhino", image: "img/Great-Rhino.jpg" },
    { name: "5 Lions Gold", image: "img/5-Lions-Gold.jpg" },
    { name: "Fire Portals", image: "img/Fire-Portals.jpg" }
];

const canvas = document.getElementById('rouletteCanvas');
const ctx = canvas.getContext('2d');
const spinBtn = document.getElementById('spinBtn');

const modal = document.getElementById('resultModal');
const modalGameText = document.getElementById('modalGameText');
const modalGameImg = document.getElementById('modalGameImg');
const closeModalBtn = document.getElementById('closeModalBtn');

const numSegments = games.length;
const arcSize = (2 * Math.PI) / numSegments;
let currentAngle = 0;
let isSpinning = false;
let idleAnimationId = null;

/* (--- Pre-carga de Imágenes ---) */
const loadedImages = [];
let imagesLoadedCount = 0;

games.forEach((game, index) => {
    const img = new Image();
    img.src = game.image;
    img.onload = () => handleImageLoad();
    img.onerror = () => handleImageLoad();
    loadedImages[index] = img;
});

function handleImageLoad() {
    imagesLoadedCount++;
    if (imagesLoadedCount === numSegments) {
        startIdleSpin();
    }
}

/* (--- Giro Pasivo / Idle ---) */
function startIdleSpin() {
    if (isSpinning) return;
    currentAngle += 0.003;
    drawRoulette();
    idleAnimationId = requestAnimationFrame(startIdleSpin);
}

/* (--- Renderizado de la Ruleta ---) */
function drawRoulette() {
    const radius = canvas.width / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const angle = currentAngle + i * arcSize;
        const isRed = i % 2 === 0;
        
        // Alternancia de colores de fondo por gajo
        ctx.fillStyle = isRed ? '#d32f2f' : '#fbc02d';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, angle, angle + arcSize);
        ctx.lineTo(radius, radius);
        ctx.fill();
        ctx.stroke();

        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle + arcSize / 2);
        
        const img = loadedImages[i];
        
        // Cuadro más grande centrado en la sección (sin texto)
        const boxSize = 56;
        const boxX = radius * 0.45;
        const boxY = -boxSize / 2;

        if (img && img.complete && img.naturalWidth !== 0) {
            // Dibujar imagen recortada con bordes redondeados
            ctx.save();
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxSize, boxSize, 8);
            ctx.clip();
            ctx.drawImage(img, boxX, boxY, boxSize, boxSize);
            ctx.restore();

            // Borde blanco decorativo alrededor del cuadrito
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(boxX, boxY, boxSize, boxSize, 8);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

/* (--- Animación de Giro ---) */
function spin() {
    if (isSpinning) return;
    
    if (idleAnimationId) {
        cancelAnimationFrame(idleAnimationId);
        idleAnimationId = null;
    }
    
    isSpinning = true;

    const startAngle = currentAngle;
    const windUpDistance = 0.25;
    const windUpDuration = 600;

    const spinRounds = 3 + Math.floor(Math.random() * 3);
    const randomOffset = Math.random() * 2 * Math.PI;
    const mainSpinDistance = spinRounds * 2 * Math.PI + randomOffset;
    const mainSpinDuration = 5500;

    let startTime = null;

    function animateWindUp(now) {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / windUpDuration, 1);
        
        const easeWindUp = Math.sin((progress * Math.PI) / 2);
        currentAngle = startAngle - (windUpDistance * easeWindUp);
        
        drawRoulette();

        if (progress < 1) {
            requestAnimationFrame(animateWindUp);
        } else {
            startTime = null;
            requestAnimationFrame(animateMainSpin);
        }
    }

    function animateMainSpin(now) {
        if (!startTime) startTime = now;
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / mainSpinDuration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentAngle = (startAngle - windUpDistance) + (mainSpinDistance + windUpDistance) * easeOut;
        
        drawRoulette();

        if (progress < 1) {
            requestAnimationFrame(animateMainSpin);
        } else {
            isSpinning = false;
            calculateResult();
        }
    }

    requestAnimationFrame(animateWindUp);
}

/* (--- Cálculo Exacto del Resultado ---) */
function calculateResult() {
    const pointerAngle = (3 * Math.PI) / 2;
    const normalizedAngle = (currentAngle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    
    let relativeAngle = (pointerAngle - normalizedAngle) % (2 * Math.PI);
    if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

    const selectedIndex = Math.floor(relativeAngle / arcSize) % numSegments;
    const selectedGame = games[selectedIndex];

    modalGameText.textContent = selectedGame.name;
    modalGameImg.src = selectedGame.image;
    modalGameImg.alt = selectedGame.name;
    modal.classList.add('active');
}

/* (--- Event Listeners ---) */
spinBtn.addEventListener('click', spin);
closeModalBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    startIdleSpin();
});