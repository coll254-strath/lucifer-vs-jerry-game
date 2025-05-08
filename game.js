const CELL_SIZE = 20;
        const GRID_WIDTH = 600 / CELL_SIZE;
        const GRID_HEIGHT = 480 / CELL_SIZE;
        const INITIAL_SNAKE_LENGTH = 5;
        const INITIAL_RAT_COUNT = 4;
        const POWER_PELLET_DURATION = 10000; // 10 seconds
        const LEVEL_UP_SCORE = 500;
        
        // Game state
        let snake = [];
        let direction = 'right';
        let nextDirection = 'right';
        let rats = [];
        let walls = [];
        let pellets = [];
        let powerPellets = [];
        let score = 0;
        let level = 1;
        let lives = 3;
        let gameRunning = false;
        let gamePaused = false;
        let gameInterval;
        let powerMode = false;
        let powerModeTimer = null;
        let gameSpeed = 150; // milliseconds
        
        // DOM elements
        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const scoreDisplay = document.getElementById('score');
        const levelDisplay = document.getElementById('level');
        const livesDisplay = document.getElementById('lives');
        const startBtn = document.getElementById('startBtn');
        const pauseBtn = document.getElementById('pauseBtn');
        const gameOverScreen = document.getElementById('gameOver');
        const finalScoreDisplay = document.getElementById('finalScore');
        const restartBtn = document.getElementById('restartBtn');
        
        // Colors
        const colors = {
            snake: '#00ff00',
            snakeHead: '#00aa00',
            rat: '#ff6666',
            wall: '#3333ff',
            pellet: '#ffff66',
            powerPellet: '#ff00ff',
            powerSnake: '#00ffff',
        };
        
        // Event listeners
        startBtn.addEventListener('click', startGame);
        pauseBtn.addEventListener('click', togglePause);
        restartBtn.addEventListener('click', startGame);
        document.addEventListener('keydown', handleKeyPress);
        
        // Initialize the game
        function init() {
            // Clear previous game state
            snake = [];
            rats = [];
            walls = [];
            pellets = [];
            powerPellets = [];
            direction = 'right';
            nextDirection = 'right';
            score = 0;
            level = 1;
            lives = 3;
            gameSpeed = 150;
            powerMode = false;
            if (powerModeTimer) clearTimeout(powerModeTimer);
            
            // Update displays
            scoreDisplay.textContent = score;
            levelDisplay.textContent = level;
            livesDisplay.textContent = lives;
            
            // Create snake
            for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
                snake.unshift({ x: INITIAL_SNAKE_LENGTH - i, y: Math.floor(GRID_HEIGHT / 2) });
            }
            
            // Create maze layout
            createMaze();
            
            // Spawn initial rats
            spawnRats(INITIAL_RAT_COUNT);
            
            // Spawn pellets and power pellets
            spawnPellets();
            
            // Hide game over screen
            gameOverScreen.style.display = 'none';
            
            // Draw initial state
            draw();
        }
        
        // Create maze layout
        function createMaze() {
            // Border walls
            for (let x = 0; x < GRID_WIDTH; x++) {
                walls.push({ x: x, y: 0 });
                walls.push({ x: x, y: GRID_HEIGHT - 1 });
            }
            for (let y = 0; y < GRID_HEIGHT; y++) {
                walls.push({ x: 0, y: y });
                walls.push({ x: GRID_WIDTH - 1, y: y });
            }
            
            // Inner maze structures based on level
            if (level === 1) {
                // Simple maze for level 1
                // Horizontal barriers
                for (let x = 5; x < 10; x++) {
                    walls.push({ x: x, y: 5 });
                    walls.push({ x: x + 15, y: 5 });
                }
                for (let x = 5; x < 25; x++) {
                    walls.push({ x: x, y: 10 });
                }
                for (let x = 5; x < 10; x++) {
                    walls.push({ x: x, y: 15 });
                    walls.push({ x: x + 15, y: 15 });
                }
                
                // Vertical barriers
                for (let y = 5; y < 10; y++) {
                    walls.push({ x: 10, y: y });
                    walls.push({ x: 20, y: y });
                }
                for (let y = 11; y < 16; y++) {
                    walls.push({ x: 10, y: y });
                    walls.push({ x: 20, y: y });
                }
            } else {
                // More complex maze for higher levels
                // Create some random inner walls
                for (let i = 0; i < 10 + level * 2; i++) {
                    const wallLength = Math.floor(Math.random() * 5) + 3;
                    const isHorizontal = Math.random() > 0.5;
                    const startX = Math.floor(Math.random() * (GRID_WIDTH - wallLength - 2)) + 1;
                    const startY = Math.floor(Math.random() * (GRID_HEIGHT - wallLength - 2)) + 1;
                    
                    // Avoid placing walls on the snake's initial position
                    const snakeCenterY = Math.floor(GRID_HEIGHT / 2);
                    if (isHorizontal && startY >= snakeCenterY - 1 && startY <= snakeCenterY + 1) {
                        continue;
                    }
                    
                    if (isHorizontal) {
                        for (let x = startX; x < startX + wallLength; x++) {
                            walls.push({ x: x, y: startY });
                        }
                    } else {
                        for (let y = startY; y < startY + wallLength; y++) {
                            walls.push({ x: startX, y: y });
                        }
                    }
                }
            }
        }
        
        // Spawn rats around the maze
        function spawnRats(count) {
            for (let i = 0; i < count; i++) {
                let position = getRandomEmptyPosition();
                rats.push({
                    x: position.x,
                    y: position.y,
                    direction: getRandomDirection(),
                    moveCounter: 0
                });
            }
        }
        
        // Spawn pellets and power pellets
        function spawnPellets() {
            // Regular pellets
            const pelletCount = 50 + level * 10;
            for (let i = 0; i < pelletCount; i++) {
                let position = getRandomEmptyPosition();
                pellets.push({ x: position.x, y: position.y });
            }
            
            // Power pellets (fewer)
            const powerPelletCount = 3 + Math.floor(level / 2);
            for (let i = 0; i < powerPelletCount; i++) {
                let position = getRandomEmptyPosition();
                powerPellets.push({ x: position.x, y: position.y });
            }
        }
        
        // Get a random empty position on the grid
        function getRandomEmptyPosition() {
            let position;
            let isOccupied;
            
            do {
                position = {
                    x: Math.floor(Math.random() * (GRID_WIDTH - 2)) + 1,
                    y: Math.floor(Math.random() * (GRID_HEIGHT - 2)) + 1
                };
                
                isOccupied = snake.some(segment => segment.x === position.x && segment.y === position.y) ||
                    rats.some(rat => rat.x === position.x && rat.y === position.y) ||
                    walls.some(wall => wall.x === position.x && wall.y === position.y) ||
                    pellets.some(pellet => pellet.x === position.x && pellet.y === position.y) ||
                    powerPellets.some(pp => pp.x === position.x && pp.y === position.y);
                    
            } while (isOccupied);
            
            return position;
        }
        
        // Get a random direction for rats
        function getRandomDirection() {
            const directions = ['up', 'down', 'left', 'right'];
            return directions[Math.floor(Math.random() * directions.length)];
        }
        
        // Start the game
        function startGame() {
            init();
            gameRunning = true;
            gamePaused = false;
            if (gameInterval) clearInterval(gameInterval);
            gameInterval = setInterval(update, gameSpeed);
        }
        
        // Toggle pause state
        function togglePause() {
            if (!gameRunning) return;
            
            gamePaused = !gamePaused;
            pauseBtn.textContent = gamePaused ? 'Resume' : 'Pause';
            
            if (gamePaused) {
                clearInterval(gameInterval);
            } else {
                gameInterval = setInterval(update, gameSpeed);
            }
        }
        
        // Handle key presses for snake movement
        function handleKeyPress(e) {
            if (!gameRunning || gamePaused) return;
            
            switch(e.key) {
                case 'ArrowUp':
                case 'w':
                    if (direction !== 'down') nextDirection = 'up';
                    break;
                case 'ArrowDown':
                case 's':
                    if (direction !== 'up') nextDirection = 'down';
                    break;
                case 'ArrowLeft':
                case 'a':
                    if (direction !== 'right') nextDirection = 'left';
                    break;
                case 'ArrowRight':
                case 'd':
                    if (direction !== 'left') nextDirection = 'right';
                    break;
                case ' ':
                    togglePause();
                    break;
            }
        }
        
        // Main update function (called each game tick)
        function update() {
            // Update snake direction
            direction = nextDirection;
            
            // Calculate new head position
            const head = { ...snake[0] };
            switch(direction) {
                case 'up':
                    head.y--;
                    break;
                case 'down':
                    head.y++;
                    break;
                case 'left':
                    head.x--;
                    break;
                case 'right':
                    head.x++;
                    break;
            }
            
            // Check for collisions
            if (checkCollision(head)) {
                handleDeath();
                return;
            }
            
            // Move the snake
            snake.unshift(head);
            
            // Check for rat consumption
            let ratEaten = false;
            for (let i = rats.length - 1; i >= 0; i--) {
                if (rats[i].x === head.x && rats[i].y === head.y) {
                    // Remove the rat and increase score
                    rats.splice(i, 1);
                    score += 100;
                    scoreDisplay.textContent = score;
                    ratEaten = true;
                    
                    // Spawn a new rat
                    spawnRats(1);
                    
                    // Check for level up
                    if (score >= level * LEVEL_UP_SCORE) {
                        levelUp();
                    }
                    
                    break;
                }
            }
            
            // Check for pellet collection
            for (let i = pellets.length - 1; i >= 0; i--) {
                if (pellets[i].x === head.x && pellets[i].y === head.y) {
                    // Remove the pellet and increase score
                    pellets.splice(i, 1);
                    score += 10;
                    scoreDisplay.textContent = score;
                    break;
                }
            }
            
            // Check for power pellet collection
            for (let i = powerPellets.length - 1; i >= 0; i--) {
                if (powerPellets[i].x === head.x && powerPellets[i].y === head.y) {
                    // Remove the power pellet and activate power mode
                    powerPellets.splice(i, 1);
                    score += 50;
                    scoreDisplay.textContent = score;
                    activatePowerMode();
                    break;
                }
            }
            
            // If no rat eaten, remove the tail segment
            if (!ratEaten) {
                snake.pop();
            }
            
            // Update rat positions
            updateRats();
            
            // If all pellets are collected, spawn new ones
            if (pellets.length === 0 && powerPellets.length === 0) {
                spawnPellets();
            }
            
            // Draw the updated game state
            draw();
        }
        
        // Check for collisions with walls, snake body, or maze
        function checkCollision(position) {
            // Check for wall or maze collision
            if (walls.some(wall => wall.x === position.x && wall.y === position.y)) {
                return true;
            }
            
            // Check for collision with self (except when in power mode)
            if (!powerMode && snake.some((segment, index) => index > 0 && segment.x === position.x && segment.y === position.y)) {
                return true;
            }
            
            return false;
        }
        
        // Handle snake death
        function handleDeath() {
            lives--;
            livesDisplay.textContent = lives;
            
            if (lives <= 0) {
                // Game over
                gameOver();
            } else {
                // Reset snake position but keep score and level
                resetSnakePosition();
                
                // Briefly pause the game
                clearInterval(gameInterval);
                setTimeout(() => {
                    if (gameRunning && !gamePaused) {
                        gameInterval = setInterval(update, gameSpeed);
                    }
                }, 1000);
            }
        }
        
        // Reset snake position after death
        function resetSnakePosition() {
            snake = [];
            direction = 'right';
            nextDirection = 'right';
            
            // Create snake in the center
            for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
                snake.unshift({ x: INITIAL_SNAKE_LENGTH - i, y: Math.floor(GRID_HEIGHT / 2) });
            }
            
            // Disable power mode if active
            if (powerMode) {
                powerMode = false;
                if (powerModeTimer) clearTimeout(powerModeTimer);
            }
            
            // Draw updated state
            draw();
        }
        
        // Level up
        function levelUp() {
            level++;
            levelDisplay.textContent = level;
            
            // Speed up the game
            gameSpeed = Math.max(50, 150 - (level - 1) * 10);
            clearInterval(gameInterval);
            gameInterval = setInterval(update, gameSpeed);
            
            // Create new maze
            walls = [];
            createMaze();
            
            // Add more rats based on level
            spawnRats(Math.min(2 + level, 8) - rats.length);
            
            // Spawn new pellets
            pellets = [];
            powerPellets = [];
            spawnPellets();
        }
        
        // Activate power mode
        function activatePowerMode() {
            powerMode = true;
            
            // Clear previous timer if exists
            if (powerModeTimer) clearTimeout(powerModeTimer);
            
            // Set timer to deactivate power mode
            powerModeTimer = setTimeout(() => {
                powerMode = false;
                draw(); // Update visuals
            }, POWER_PELLET_DURATION);
        }
        
        // Update rat positions
        function updateRats() {
            rats.forEach(rat => {
                rat.moveCounter++;
                
                // Only move rats every few frames to make them slower than the snake
                if (rat.moveCounter >= 3) {
                    rat.moveCounter = 0;
                    
                    // Calculate potential new position
                    const newPosition = { ...rat };
                    switch(rat.direction) {
                        case 'up':
                            newPosition.y--;
                            break;
                        case 'down':
                            newPosition.y++;
                            break;
                        case 'left':
                            newPosition.x--;
                            break;
                        case 'right':
                            newPosition.x++;
                            break;
                    }
                    
                    // Check if new position is valid
                    if (walls.some(wall => wall.x === newPosition.x && wall.y === newPosition.y) ||
                        rats.some(otherRat => otherRat !== rat && otherRat.x === newPosition.x && otherRat.y === newPosition.y)) {
                        
                        // If invalid, choose a new random direction
                        rat.direction = getRandomDirection();
                    } else {
                        // If valid, update position
                        rat.x = newPosition.x;
                        rat.y = newPosition.y;
                        
                        // Occasionally change direction randomly
                        if (Math.random() < 0.2) {
                            rat.direction = getRandomDirection();
                        }
                    }
                }
            });
        }
        
        // Game over
        function gameOver() {
            gameRunning = false;
            clearInterval(gameInterval);
            finalScoreDisplay.textContent = score;
            gameOverScreen.style.display = 'flex';
        }
        
        // Draw the game state
        function draw() {
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Draw pellets
            ctx.fillStyle = colors.pellet;
            pellets.forEach(pellet => {
                ctx.beginPath();
                ctx.arc(pellet.x * CELL_SIZE + CELL_SIZE / 2, pellet.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 6, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Draw power pellets (pulsating)
            ctx.fillStyle = colors.powerPellet;
            const pulsateSize = 1 + 0.2 * Math.sin(Date.now() / 200);
            powerPellets.forEach(pp => {
                ctx.beginPath();
                ctx.arc(pp.x * CELL_SIZE + CELL_SIZE / 2, pp.y * CELL_SIZE + CELL_SIZE / 2, CELL_SIZE / 3 * pulsateSize, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Draw walls
            ctx.fillStyle = colors.wall;
            walls.forEach(wall => {
                ctx.fillRect(wall.x * CELL_SIZE, wall.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
            });
            
            // Draw snake
            snake.forEach((segment, index) => {
                if (index === 0) {
                    // Head
                    ctx.fillStyle = powerMode ? colors.powerSnake : colors.snakeHead;
                } else {
                    // Body
                    ctx.fillStyle = powerMode ? colors.powerSnake : colors.snake;
                }
                
                ctx.fillRect(segment.x * CELL_SIZE, segment.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                // Draw eyes on head
                if (index === 0) {
                    ctx.fillStyle = 'white';
                    
                    // Position eyes based on direction
                    let eyePositions = [];
                    switch(direction) {
                        case 'up':
                            eyePositions = [
                                { x: segment.x * CELL_SIZE + CELL_SIZE / 4, y: segment.y * CELL_SIZE + CELL_SIZE / 4 },
                                { x: segment.x * CELL_SIZE + CELL_SIZE * 3/4, y: segment.y * CELL_SIZE + CELL_SIZE / 4 }
                            ];
                            break;
                        case 'down':
                            eyePositions = [
                                { x: segment.x * CELL_SIZE + CELL_SIZE / 4, y: segment.y * CELL_SIZE + CELL_SIZE * 3/4 },
                                { x: segment.x * CELL_SIZE + CELL_SIZE * 3/4, y: segment.y * CELL_SIZE + CELL_SIZE * 3/4 }
                            ];
                            break;
                        case 'left':
                            eyePositions = [
                                { x: segment.x * CELL_SIZE + CELL_SIZE / 4, y: segment.y * CELL_SIZE + CELL_SIZE / 4 },
                                { x: segment.x * CELL_SIZE + CELL_SIZE / 4, y: segment.y * CELL_SIZE + CELL_SIZE * 3/4 }
                            ];
                            break;
                        case 'right':
                            eyePositions = [
                                { x: segment.x * CELL_SIZE + CELL_SIZE * 3/4, y: segment.y * CELL_SIZE + CELL_SIZE / 4 },
                                { x: segment.x * CELL_SIZE + CELL_SIZE * 3/4, y: segment.y * CELL_SIZE + CELL_SIZE * 3/4 }
                            ];
                            break;
                    }
                    
                    // Draw eyes
                    eyePositions.forEach(pos => {
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, CELL_SIZE / 6, 0, Math.PI * 2);
                        ctx.fill();
                        
                        // Draw pupils
                        ctx.fillStyle = 'black';
                        ctx.beginPath();
                        ctx.arc(pos.x, pos.y, CELL_SIZE / 10, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }
            });
            
            // Draw rats
            ctx.fillStyle = colors.rat;
            rats.forEach(rat => {
                // Body
                ctx.fillRect(rat.x * CELL_SIZE, rat.y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
                
                // Eyes
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(rat.x * CELL_SIZE + CELL_SIZE / 3, rat.y * CELL_SIZE + CELL_SIZE / 3, CELL_SIZE / 6, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(rat.x * CELL_SIZE + CELL_SIZE * 2/3, rat.y * CELL_SIZE + CELL_SIZE / 3, CELL_SIZE / 6, 0, Math.PI * 2);
                ctx.fill();
                
                // Nose
                ctx.fillStyle = 'pink';
                ctx.beginPath();
                ctx.arc(rat.x * CELL_SIZE + CELL_SIZE / 2, rat.y * CELL_SIZE + CELL_SIZE * 2/3, CELL_SIZE / 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Whiskers
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 1;
                // Left whiskers
                ctx.beginPath();
                ctx.moveTo(rat.x * CELL_SIZE + CELL_SIZE / 2, rat.y * CELL_SIZE + CELL_SIZE * 2/3);
                ctx.lineTo(rat.x * CELL_SIZE, rat.y * CELL_SIZE + CELL_SIZE / 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(rat.x * CELL_SIZE + CELL_SIZE / 2, rat.y * CELL_SIZE + CELL_SIZE * 2/3);
                ctx.lineTo(rat.x * CELL_SIZE, rat.y * CELL_SIZE + CELL_SIZE * 3/4);
                ctx.stroke();
                // Right whiskers
                ctx.beginPath();
                ctx.moveTo(rat.x * CELL_SIZE + CELL_SIZE / 2, rat.y * CELL_SIZE + CELL_SIZE * 2/3);
                ctx.lineTo(rat.x * CELL_SIZE + CELL_SIZE, rat.y * CELL_SIZE + CELL_SIZE / 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(rat.x * CELL_SIZE + CELL_SIZE / 2, rat.y * CELL_SIZE + CELL_SIZE * 2/3);
                ctx.lineTo(rat.x * CELL_SIZE + CELL_SIZE, rat.y * CELL_SIZE + CELL_SIZE * 3/4);
                ctx.stroke();
            });
        }
        
        // Initialize the game when page loads
        init();
