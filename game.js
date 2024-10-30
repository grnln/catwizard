/*
 * Cat Wizard
 * by Guillermo R.N.
 * 
 * 2024
 */

/* Backend (not in the web-dev sense) */
const canvas = document.getElementById("gameCanvas");
const canvasContext = canvas.getContext("2d");

/* Resource-related */
const resources = {};
const resourceHeaders = [
    {name: "catSprite", path: "res/catwizard.png", type: "spr"},
    {name: "moonSprite", path: "res/moon.png", type: "spr"},
    {name: "cloudsSprite", path: "res/clouds.png", type: "spr"},
    {name: "ghostSprite", path: "res/ghost.png", type: "spr"},
    {name: "pumpkinSprite", path: "res/pumpkin.png", type: "spr"},
    {name: "pumpkinSfx", path: "res/pumpkin.wav", type: "sfx"},
    {name: "ghostSfx", path: "res/ghost.wav", type: "sfx"},
    {name: "overSfx", path: "res/over.wav", type: "sfx"}
];

/* Protagonist */
const cat = {
    x: (canvas.width - 64),
    y: ((canvas.height / 2) - (64 / 2)),
    w: 64,
    h: 64,
    health: 100,
    hitTime: 0,
    score: 0,
    speed: 1,
    leftPress: false,
    rightPress: false,
    upPress: false,
    downPress: false
};

/* For a starry sky */
const stars = [];

/* Enemies */
const ghosts = [];

/* Health boosts */
const pumpkins = [];

/* Enemy-related */
let ghostTime = 0.0;
let ghostSpeed = 0.5;
let maxGhosts = 8;

/* Possible values: "wait", "play", "dead" */
let state = "wait";

const loadAssets = async () => {
    for (header of resourceHeaders) {
        switch (header.type) {
            default:
                break;

            case "spr":
                resources[header.name] = new Image();
                resources[header.name].src = header.path;
                break;

            case "sfx":
                resources[header.name] = new Audio(header.path);
                break;
        }
    }
    await Promise.all(
        Array.from(resources).map((resource) => {
                new Promise((resolve) => resource.addEventListener("load", resolve))
            }
        )
    );
};

const init = () => {
    loadAssets();

    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    
    const playBtn = document.getElementById("playBtn");
    playBtn.addEventListener("click", playClickHandler)

    setInterval(update, 10);
    setInterval(updateScore, 1000);
    
    document.getElementById("healthText").innerHTML = cat.health;
    document.getElementById("scoreText").innerHTML = cat.score;

    /* Generate 32 random stars */
    for (let i = 0; i < 32; i++) {
        stars.push({
            x: Math.floor(Math.random() * canvas.width),
            y: Math.floor(Math.random() * canvas.height)
        });
    }

    /* Generate 64 random ghosts (only 8 will initially show) */
    for (let i = 0; i < 64; i++) {
        ghosts.push({
            x: 16 * Math.floor(Math.random() * (canvas.width / 16)) - canvas.width,
            y: 32 * Math.floor(Math.random() * (canvas.height / 32)),
            spr: Math.floor(Math.random() * 8),
            phase: (Math.random() * Math.PI)
        });
    }

    /* Generate 4 random pumpkins */
    for (let i = 0; i < 4; i++) {
        pumpkins.push({
            x: 16 * Math.floor(Math.random() * (canvas.width / 16)) - canvas.width,
            y: 16 * Math.floor(Math.random() * (canvas.height / 16)) 
        });
    }
};

const keyDownHandler = (e) => {
    if (e.key === "Left" || e.key === "ArrowLeft") {
        cat.leftPress = true;
    } else if (e.key === "Right" || e.key === "ArrowRight") {
        cat.rightPress = true;
    } else if (e.key === "Up" || e.key === "ArrowUp") {
        cat.upPress = true;
    } else if (e.key === "Down" || e.key === "ArrowDown") {
        cat.downPress = true;
    }
}

const keyUpHandler = (e) => {
    if (e.key === "Left" || e.key === "ArrowLeft") {
        cat.leftPress = false;
    } else if (e.key === "Right" || e.key === "ArrowRight") {
        cat.rightPress = false;
    } else if (e.key === "Up" || e.key === "ArrowUp") {
        cat.upPress = false;
    } else if (e.key === "Down" || e.key === "ArrowDown") {
        cat.downPress = false;
    }
}

const playClickHandler = (e) => {
    if (state === "dead") {
        cat.health = 100;
        cat.score = 0;
        cat.hitTime = 0;

        cat.x = (canvas.width - 64),
        cat.y = ((canvas.height / 2) - (64 / 2)),

        ghostSpeed = 0.5;
        maxGhosts = 8;
        
        ghosts.forEach((ghost) => {ghost.x -= canvas.width});
        pumpkins.forEach((pumpkin) => {pumpkin.x -= canvas.width});
    }
    state = "play";
}

const rectCollision = (a, b) => {
    return ((a.x + a.w) >= b.x && a.x <= (b.x + b.w) && (a.y + a.h) >= b.y && a.y <= (b.y + b.h));
}

const updateCat = () => {
    if (cat.leftPress) {
        cat.x -= cat.speed;
    }
    
    if (cat.rightPress) {
        cat.x += cat.speed;
    }
    
    if (cat.upPress) {
        cat.y -= cat.speed;
    }
    
    if (cat.downPress) {
        cat.y += cat.speed;
    }
    
    if (cat.x > (canvas.width - cat.w)) {
        cat.x = canvas.width - cat.w;
    } else if (cat.x < 0) {
        cat.x = 0;
    }

    if (cat.y > (canvas.height - (cat.h / 2))) {
        cat.y = canvas.height - (cat.h / 2);
    } else if (cat.y < -(cat.h / 2)) {
        cat.y = -(cat.h / 2);
    }

    if (cat.health <= 0) {
        resources["overSfx"].play();

        cat.health = 0;
        state = "dead";
    }

    if (cat.hitTime > 0) {
        cat.hitTime++;

        if (cat.hitTime >= 75) {
            cat.hitTime = 0;
        }
    }
    document.getElementById("healthText").innerHTML = cat.health;
    document.getElementById("scoreText").innerHTML = cat.score;
}

const clearScreen = () => {
    canvasContext.clearRect(0, 0, canvas.width, canvas.height);
}

const renderCat = () => {
    if (cat.hitTime <= 0 || (cat.hitTime > 0 && cat.hitTime % 8 === 0)) {
        canvasContext.drawImage(resources["catSprite"], cat.x, cat.y);
    }
}

const renderMoon = () => {
    canvasContext.drawImage(resources["moonSprite"], (canvas.width / 2) - 32, (canvas.height / 2) - 32);
}

const updateStars = () => {
    stars.forEach((star) => {
        star.x += (0.75 * cat.speed);

        if (star.x > canvas.width) {
            star.x = 0;
        }
    });
}

const renderStars = () => {
    stars.forEach((star) => {
        canvasContext.beginPath();
        canvasContext.rect(star.x, star.y, 1, 1);
        canvasContext.fillStyle = "#fabe7d";
        canvasContext.fill();
        canvasContext.closePath();
    });
}

const updateGhosts = () => {
    for (let i = 0; i < maxGhosts; i++) {
        ghosts[i].x += ghostSpeed;
        
        if (ghosts[i].x > canvas.width) {
            ghosts[i].x = 16 * Math.floor(Math.random() * (canvas.width / 16)) - canvas.width;
            ghosts[i].y = 32 * Math.floor(Math.random() * (canvas.height / 32));
        }

        if (cat.hitTime <= 0
        && rectCollision({x: ghosts[i].x + 2, y: ghosts[i].y + 2, w: 11, h: 26}, {x: cat.x + 16, y: cat.y + 20, w: 24, h: 24})) {
            resources["ghostSfx"].play();

            cat.health -= 10;
            cat.hitTime++;
        }
    }
    ghostTime += 0.1;
    
    if (ghostTime > 2.0 * Math.PI) {
        ghostTime = 0.0;
    }
}

const renderGhosts = () => {
    for (let i = 0; i < maxGhosts; i++) {
        canvasContext.drawImage(
            resources["ghostSprite"],
            ghosts[i].spr * 15,
            0,
            15,
            30,
            ghosts[i].x,
            ghosts[i].y + Math.sin(ghostTime + ghosts[i].phase),
            15,
            30
        );
    }
}

const updatePumpkins = () => {
    pumpkins.forEach((pumpkin) => {
        pumpkin.x += ghostSpeed;

        if (pumpkin.x > canvas.width) {
            pumpkin.x = 16 * Math.floor(Math.random() * (canvas.width / 16)) - canvas.width;
            pumpkin.y = 16 * Math.floor(Math.random() * (canvas.height / 16));
        }

        if (rectCollision({x: pumpkin.x - 2, y: pumpkin.y - 2, w: 19, h: 19}, {x: cat.x + 16, y: cat.y + 20, w: 24, h: 24})) {
            resources["pumpkinSfx"].play();
            
            pumpkin.x = 16 * Math.floor(Math.random() * (canvas.width / 16)) - canvas.width;
            pumpkin.y = 16 * Math.floor(Math.random() * (canvas.height / 16));
            
            cat.health += 10;

            if (cat.health > 100) {
                cat.health = 100;
            }
        }
    });
}

const renderPumpkins = () => {
    pumpkins.forEach((pumpkin) => {
        canvasContext.drawImage(resources["pumpkinSprite"], pumpkin.x, pumpkin.y);
    });
}

const renderGameOver = () => {
    canvasContext.beginPath();
    canvasContext.rect(0, 0, canvas.width, canvas.height);
    canvasContext.fillStyle = "#00000080";
    canvasContext.fill();
    canvasContext.closePath();

    canvasContext.font = "20px Pixolletta";
    canvasContext.textRendering = "geometricPrecision";
    canvasContext.fillStyle = "#ffffff";
    canvasContext.textAlign = "center";
    canvasContext.fillText("Game Over", 160, 80);
}

const update = () => {
    /* Update */
    if (state === "play") {
        updateStars();
        updateGhosts();
        updatePumpkins();
        updateCat();
    }
    
    /* Render */
    clearScreen();
    renderMoon();
    renderStars();
    renderCat();
    renderPumpkins();
    renderGhosts();

    if (state === "dead") {
        renderGameOver();
    }
};

const updateScore = () => {
    if (state === "play") {
        cat.score++;
        
        if (cat.score % 10 === 0) {
            maxGhosts++;
            ghostSpeed += 0.1;

            if (maxGhosts > 64) {
                maxGhosts = 64;
            }
        }
    }
}

/* Start program */
init();