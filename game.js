const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');
        const gameInfo = document.getElementById('gameInfo');
        const battleTransition = document.getElementById('battleTransition');

        const TILE_SIZE = 32;
        const MAP_WIDTH = 20;
        const MAP_HEIGHT = 15;
        const TERRAIN_TYPES = ['grass', 'hills', 'desert', 'water', 'mountains'];
        const ENEMY_TYPES = [
            'Slime', 'Goblin', 'Bat', 'Skeleton', 'Ghost',
            'Orc', 'Spider', 'Rat', 'Zombie', 'Imp'
        ];

        const CHUNK_SIZE = 10; // Size of map chunks to generate at once
        const RENDER_PADDING = 5; // Extra tiles to render beyond visible area
        let mapChunks = new Map(); // Store generated chunks
        let viewportX = 0; // Viewport top-left position
        let viewportY = 0;

        let gameMap;
        let player;
        let currentEnemy = null;

        let mapOffset = { x: 0, y: 0 }; // Track total map movement

        const BACKGROUND_MUSIC = new Audio('assets/audio/Journey Through Realms(Travel).mp3');
        const BATTLE_MUSIC = new Audio('assets/audio/Pixelated Battle.mp3');
        BACKGROUND_MUSIC.loop = true;
        BATTLE_MUSIC.loop = true;
        console.log('Audio source:', BACKGROUND_MUSIC.src);

        // Sound Effects
        const SOUNDS = {
            // FOOTSTEP: new Audio('assets/audio/taking_step.mp3'),
            ATTACK: new Audio('assets/audio/sound_of_a_single_sw.mp3'),
            // ENEMY_HIT: new Audio('assets/audio/enemy-hit.mp3'),
            // PLAYER_HIT: new Audio('assets/audio/player-hit.mp3'),
            CAMP: new Audio('assets/audio/crackling_campfire.mp3'),
            LEVEL_UP: new Audio('assets/audio/level-up.mp3'),
            RUN: new Audio('assets/audio/run-away.mp3')
        };

        // Set volume for sound effects (adjust these values as needed)
        Object.values(SOUNDS).forEach(sound => {
            sound.volume = 0.4;  // 40% volume for sound effects
        });

        // Add this function to handle starting the music
        function startBackgroundMusic() {
            BACKGROUND_MUSIC.play().then(() => {
                // Remove the event listeners once music starts
                document.removeEventListener('click', startBackgroundMusic);
                document.removeEventListener('keydown', startBackgroundMusic);
            }).catch(error => {
                console.log('Audio play failed:', error);
            });
        }

        class Sprite {
            constructor(color, secondaryColor) {
                this.canvas = document.createElement('canvas');
                this.canvas.width = TILE_SIZE;
                this.canvas.height = TILE_SIZE;
                this.ctx = this.canvas.getContext('2d');
                this.color = color;
                this.secondaryColor = secondaryColor;
            }

            generate() {
                this.ctx.fillStyle = this.color;
                this.ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
                this.ctx.fillStyle = this.secondaryColor;
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * TILE_SIZE;
                    const y = Math.random() * TILE_SIZE;
                    const size = Math.random() * 6 + 2;
                    this.ctx.fillRect(x, y, size, size);
                }
            }
        }

        const sprites = {
            grass: new Sprite('#3a3', '#4b4'),
            hills: new Sprite('#696', '#7a7'),
            desert: new Sprite('#ca6', '#db7'),
            water: new Sprite('#39f', '#4af'),
            mountains: new Sprite('#666', '#777'),
            hero: new Sprite('#f00', '#f66'),
        };

        const enemySprites = ENEMY_TYPES.map(() => new Sprite(
            `hsl(${Math.random() * 360}, 70%, 50%)`,
            `hsl(${Math.random() * 360}, 70%, 70%)`
        ));

        Object.values(sprites).forEach(sprite => sprite.generate());
        enemySprites.forEach(sprite => sprite.generate());

        class Player {
            constructor() {
                this.x = Math.floor(MAP_WIDTH / 2);
                this.y = Math.floor(MAP_HEIGHT / 2);
                this.hp = 100;
                this.maxHp = 100;
                this.attack = 10;
                this.defense = 5;
                this.gold = 0;
                this.xp = 0;
                this.level = 1;
            }

            move(dx, dy) {
                const newX = this.x + dx;
                const newY = this.y + dy;
                
                const terrain = gameMap[newY - 1][newX];
                
                if (terrain !== 'mountains' && terrain !== 'water') {
                    this.x = newX;
                    this.y = newY;
                    // playSound('FOOTSTEP');
                    
                    // Generate new columns when moving right
                    if (dx > 0 && this.x >= gameMap[0].length - Math.floor(MAP_WIDTH/2)) {
                        const currentWidth = gameMap[0].length;
                        for (let y = 0; y < gameMap.length; y++) {
                            const neighbors = getNeighborsForNewTile(currentWidth - 1, y);
                            gameMap[y].push(generateTerrainBasedOnNeighbors(neighbors));
                        }
                    }
                    // Generate new columns when moving left
                    else if (dx < 0 && this.x <= Math.floor(MAP_WIDTH/2)) {
                        for (let y = 0; y < gameMap.length; y++) {
                            gameMap[y].unshift(generateTerrainBasedOnNeighbors(getNeighborsForNewTile(-1, y)));
                        }
                        this.x++;
                    }
                    
                    // Generate new rows when moving down
                    if (dy > 0 && this.y >= gameMap.length - Math.floor(MAP_HEIGHT/2)) {
                        const newRow = Array(gameMap[0].length).fill(null).map((_, x) => 
                            generateTerrainBasedOnNeighbors(getNeighborsForNewTile(x, gameMap.length)));
                        gameMap.push(newRow);
                    }
                    // Generate new rows when moving up
                    else if (dy < 0 && this.y <= Math.floor(MAP_HEIGHT/2)) {
                        const newRow = Array(gameMap[0].length).fill(null).map((_, x) => 
                            generateTerrainBasedOnNeighbors(getNeighborsForNewTile(x, -1)));
                        gameMap.unshift(newRow);
                        this.y++;
                    }
                    
                    if (Math.random() < 0.1) {
                        startBattle();
                    }
                }
            }

            gainXp(amount) {
                this.xp += amount;
                if (this.xp >= this.level * 100) {
                    this.levelUp();
                }
            }

            levelUp() {
                this.level++;
                this.maxHp += 10;
                this.hp = this.maxHp;
                this.attack += 2;
                this.defense += 1;
                playSound('LEVEL_UP');
                updateGameInfo(`Level up! You are now level ${this.level}`);
            }

            camp() {
                const healAmount = Math.floor(this.maxHp * 0.5);
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
                playSound('CAMP');
                updateGameInfo(`You set up camp and restored ${healAmount} HP.`);
            }
        }

        class Enemy {
            constructor(name) {
                this.name = name;
                this.hp = Math.floor(Math.random() * 31) + 20;
                this.attack = Math.floor(Math.random() * 11) + 5;
                this.defense = Math.floor(Math.random() * 5) + 1;
                this.gold = Math.floor(Math.random() * 21) + 10;
                this.xp = Math.floor(Math.random() * 31) + 20;
            }
        }

        function generateMap() {
            // Initialize empty map
            let map = Array.from({ length: MAP_HEIGHT }, () =>
                Array.from({ length: MAP_WIDTH }, () => 'grass')
            );
            
            // Helper function to count terrain percentage
            const getTerrainPercentage = (terrain) => {
                let count = 0;
                map.forEach(row => row.forEach(tile => {
                    if (tile === terrain) count++;
                }));
                return count / (MAP_WIDTH * MAP_HEIGHT);
            };
            
            // Helper function to get neighboring tiles
            const getNeighbors = (x, y) => {
                const neighbors = [];
                for (let dx = -1; dx <= 1; dx++) {
                    for (let dy = -1; dy <= 1; dy++) {
                        if (dx === 0 && dy === 0) continue;
                        const newX = x + dx;
                        const newY = y + dy;
                        if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
                            neighbors.push(map[newY][newX]);
                        }
                    }
                }
                return neighbors;
            };
            
            // Generate terrain in chunks
            for (let terrain of TERRAIN_TYPES) {
                // Skip grass as it's the default
                if (terrain === 'grass') continue;
                
                // Set maximum percentage for mountains and water combined
                if ((terrain === 'mountains' || terrain === 'water') && 
                    (getTerrainPercentage('mountains') + getTerrainPercentage('water')) >= 0.25) {
                    continue;
                }
                
                // Create several "seed" points for each terrain type
                const numSeeds = Math.floor(Math.random() * 3) + 2;
                for (let i = 0; i < numSeeds; i++) {
                    let x = Math.floor(Math.random() * MAP_WIDTH);
                    let y = Math.floor(Math.random() * MAP_HEIGHT);
                    
                    // Expand from seed point
                    const expansionSize = Math.floor(Math.random() * 15) + 10;
                    for (let j = 0; j < expansionSize; j++) {
                        if (Math.random() < 0.7) { // 70% chance to expand near existing same terrain
                            const neighbors = getNeighbors(x, y);
                            if (neighbors.includes(terrain)) {
                                map[y][x] = terrain;
                            }
                        }
                        
                        // Move to adjacent tile
                        x += Math.floor(Math.random() * 3) - 1;
                        y += Math.floor(Math.random() * 3) - 1;
                        x = Math.max(0, Math.min(x, MAP_WIDTH - 1));
                        y = Math.max(0, Math.min(y, MAP_HEIGHT - 1));
                        
                        map[y][x] = terrain;
                    }
                }
            }
            
            return map;
        }

        function drawMap() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Calculate viewport offset to keep player centered
            const offsetX = Math.floor(player.x - MAP_WIDTH/2);
            const offsetY = Math.floor(player.y - MAP_HEIGHT/2);
            
            // Draw visible portion of the map
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    const mapX = x + offsetX;
                    const mapY = y + offsetY;
                    const terrain = getTileAt(mapX, mapY);
                    
                    // Ensure we have a valid sprite before drawing
                    if (sprites[terrain] && sprites[terrain].canvas) {
                        ctx.drawImage(sprites[terrain].canvas, x * TILE_SIZE, y * TILE_SIZE);
                    }
                }
            }
            
            // Draw player in center
            ctx.drawImage(sprites.hero.canvas, 
                Math.floor(MAP_WIDTH/2) * TILE_SIZE, 
                Math.floor(MAP_HEIGHT/2) * TILE_SIZE);
        }

        function updateGameInfo(message) {
            gameInfo.innerHTML = `
                HP: ${player.hp}/${player.maxHp} | Gold: ${player.gold} | XP: ${player.xp} | Level: ${player.level}
                <br>${message || ''}
            `;
        }

        function startBattle() {
            currentEnemy = new Enemy(ENEMY_TYPES[Math.floor(Math.random() * ENEMY_TYPES.length)]);
            updateGameInfo(`A wild ${currentEnemy.name} appears!`);
            
            // Trigger battle transition and music
            battleTransition.style.opacity = '1';
            transitionMusic(true);
            
            setTimeout(() => {
                drawBattleScene();
                battleTransition.style.opacity = '0';
            }, 500);
        }

        // Add after ENEMY_TYPES array
        const BATTLE_BACKGROUNDS = {
            grass: 'assets/images/Medow Battle Background.webp',
            hills: 'assets/images/Forest background for battle cropped.jpg',
            desert: 'assets/images/Desert Battle Background.webp',
        };

        // Load battle background images
        const battleBackgroundImages = {};
        for (const [terrain, path] of Object.entries(BATTLE_BACKGROUNDS)) {
            battleBackgroundImages[terrain] = new Image();
            battleBackgroundImages[terrain].src = path;
        }

        // Update the drawBattleScene function
        function drawBattleScene() {
            // Get the terrain the player is standing on
            const currentTerrain = getTileAt(player.x, player.y);
            
            // Draw the background image
            const backgroundImg = battleBackgroundImages[currentTerrain];
            if (backgroundImg && backgroundImg.complete) {
                ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
            } else {
                // Fallback to black background if image isn't loaded
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Draw characters and UI on top
            ctx.drawImage(sprites.hero.canvas, 100, 300);
            ctx.drawImage(enemySprites[ENEMY_TYPES.indexOf(currentEnemy.name)].canvas, 500, 300);
            
            ctx.fillStyle = '#fff';
            ctx.font = '20px monospace';
            ctx.fillText(`${player.name} HP: ${player.hp}/${player.maxHp}`, 50, 50);
            ctx.fillText(`${currentEnemy.name} HP: ${currentEnemy.hp}`, 450, 50);
            
            ctx.fillText('Press A to attack or R to run', 200, 450);
        }

        function battle(action) {
            if (action === 'attack') {
                playSound('ATTACK');
                const damage = Math.max(1, player.attack - currentEnemy.defense);
                currentEnemy.hp -= damage;
                
                setTimeout(() => {
                    // playSound('ENEMY_HIT');
                    updateGameInfo(`You dealt ${damage} damage to the ${currentEnemy.name}`);
                    
                    if (currentEnemy.hp <= 0) {
                        player.gold += currentEnemy.gold;
                        player.gainXp(currentEnemy.xp);
                        updateGameInfo(`You defeated the ${currentEnemy.name}! Gained ${currentEnemy.gold} gold and ${currentEnemy.xp} XP`);
                        currentEnemy = null;
                        transitionMusic(false);
                        drawMap();
                        return;
                    }
                    
                    // Enemy attack
                    setTimeout(() => {
                        // playSound('ATTACK');
                        const enemyDamage = Math.max(1, currentEnemy.attack - player.defense);
                        player.hp -= enemyDamage;
                        
                        setTimeout(() => {
                            // playSound('PLAYER_HIT');
                            updateGameInfo(`The ${currentEnemy.name} dealt ${enemyDamage} damage to you`);
                            
                            if (player.hp <= 0) {
                                updateGameInfo('Game Over! You have been defeated.');
                                currentEnemy = null;
                                return;
                            }
                            drawBattleScene();
                        }, 100);
                    }, 500);
                }, 100);
                
            } else if (action === 'run') {
                playSound('RUN');
                if (Math.random() < 0.5) {
                    updateGameInfo('You successfully ran away!');
                    currentEnemy = null;
                    transitionMusic(false);
                    drawMap();
                    return;
                }
                // ... rest of run code ...
            }
        }

        function init() {
            player = new Player();
            gameMap = generateMap();
            drawMap();
            updateGameInfo();
            setupTouchControls();
            setupKeyboardControls();
            
            // Try to autoplay first
            BACKGROUND_MUSIC.play().catch(error => {
                console.log('Audio autoplay failed:', error);
                // If autoplay fails, listen for either mouse or keyboard interaction
                document.addEventListener('click', startBackgroundMusic);
                document.addEventListener('keydown', startBackgroundMusic);
            });
        }

        function setupTouchControls() {
    const dpadButtons = ['up', 'down', 'left', 'right'];
    dpadButtons.forEach(direction => {
        const button = document.getElementById(direction);
        // Add both touch and mouse events
        ['touchstart', 'mousedown'].forEach(eventType => {
            button.addEventListener(eventType, (e) => {
                e.preventDefault();
                handleMove(direction);
            });
        });
    });

    // Add both touch and mouse events for action buttons
    ['attackButton', 'runButton', 'campButton'].forEach(buttonId => {
        const button = document.getElementById(buttonId);
        ['touchstart', 'mousedown'].forEach(eventType => {
            button.addEventListener(eventType, (e) => {
                e.preventDefault();
                if (buttonId === 'attackButton' && currentEnemy) battle('attack');
                if (buttonId === 'runButton' && currentEnemy) battle('run');
                if (buttonId === 'campButton' && !currentEnemy) {
                    player.camp();
                    drawMap();
                    updateGameInfo();
                }
            });
        });
    });
}

        function handleMove(direction) {
            if (currentEnemy) return;
            switch (direction) {
                case 'up': player.move(0, -1); break;
                case 'down': player.move(0, 1); break;
                case 'left': player.move(-1, 0); break;
                case 'right': player.move(1, 0); break;
            }
            drawMap();
            updateGameInfo();
        }

        function setupKeyboardControls() {
            document.addEventListener('keydown', (e) => {
                switch (e.key) {
                    case 'ArrowUp': if (!currentEnemy) handleMove('up'); break;
                    case 'ArrowDown': if (!currentEnemy) handleMove('down'); break;
                    case 'ArrowLeft': if (!currentEnemy) handleMove('left'); break;
                    case 'ArrowRight': if (!currentEnemy) handleMove('right'); break;
                    case 'a':
                        if (currentEnemy) battle('attack');
                        break;
                    case 'r':
                        if (currentEnemy) battle('run');
                        break;
                    case 'c':
                        if (!currentEnemy) {
                            player.camp();
                            drawMap();
                            updateGameInfo();
                        }
                        break;
                }
                updateGameInfo();
            });
        }

        function getChunkKey(chunkX, chunkY) {
            return `${chunkX},${chunkY}`;
        }

        function generateChunk(chunkX, chunkY) {
            const chunk = Array.from({ length: CHUNK_SIZE }, () =>
                Array.from({ length: CHUNK_SIZE }, () => 'grass')
            );
            
            // Use existing terrain generation logic, but scaled to chunk size
            for (let terrain of TERRAIN_TYPES) {
                if (terrain === 'grass') continue;
                
                if ((terrain === 'mountains' || terrain === 'water')) {
                    const numSeeds = Math.floor(Math.random() * 2) + 1;
                    for (let i = 0; i < numSeeds; i++) {
                        let x = Math.floor(Math.random() * CHUNK_SIZE);
                        let y = Math.floor(Math.random() * CHUNK_SIZE);
                        
                        const expansionSize = Math.floor(Math.random() * 8) + 4;
                        for (let j = 0; j < expansionSize; j++) {
                            chunk[y][x] = terrain;
                            x += Math.floor(Math.random() * 3) - 1;
                            y += Math.floor(Math.random() * 3) - 1;
                            x = Math.max(0, Math.min(x, CHUNK_SIZE - 1));
                            y = Math.max(0, Math.min(y, CHUNK_SIZE - 1));
                        }
                    }
                }
            }
            
            return chunk;
        }

        function generateNewChunks() {
            // Calculate which chunks should be visible
            const minChunkX = Math.floor(viewportX / CHUNK_SIZE) - 1;
            const maxChunkX = Math.ceil((viewportX + MAP_WIDTH) / CHUNK_SIZE) + 1;
            const minChunkY = Math.floor(viewportY / CHUNK_SIZE) - 1;
            const maxChunkY = Math.ceil((viewportY + MAP_HEIGHT) / CHUNK_SIZE) + 1;
            
            // Generate missing chunks
            for (let chunkY = minChunkY; chunkY <= maxChunkY; chunkY++) {
                for (let chunkX = minChunkX; chunkX <= maxChunkX; chunkX++) {
                    const key = getChunkKey(chunkX, chunkY);
                    if (!mapChunks.has(key)) {
                        mapChunks.set(key, generateChunk(chunkX, chunkY));
                    }
                }
            }
        }

        function getTileAt(x, y) {
            // Ensure we have valid gameMap data
            if (!gameMap || !gameMap.length || !gameMap[0]) {
                return 'grass';
            }
            
            // Ensure coordinates are within bounds
            if (y >= 0 && y < gameMap.length && x >= 0 && x < gameMap[0].length) {
                const terrain = gameMap[y][x];
                // Verify we got a valid terrain type
                return TERRAIN_TYPES.includes(terrain) ? terrain : 'grass';
            }
            return 'grass';
        }

        function getNeighborsForNewTile(x, y) {
            const neighbors = [];
            // Check a larger area around the tile (2 tiles in each direction)
            for (let dy = -2; dy <= 2; dy++) {
                for (let dx = -2; dx <= 2; dx++) {
                    const newX = x + dx;
                    const newY = y + dy;
                    if (newY >= 0 && newY < gameMap.length && newX >= 0 && newX < gameMap[0].length) {
                        neighbors.push(gameMap[newY][newX]);
                    }
                }
            }
            return neighbors;
        }

        function generateTerrainBasedOnNeighbors(neighbors) {
            if (neighbors.length === 0) return 'grass';
            
            // Count frequency of each terrain type in neighbors
            const terrainCounts = {};
            neighbors.forEach(terrain => {
                terrainCounts[terrain] = (terrainCounts[terrain] || 0) + 1;
            });
            
            // Get the most common terrain and its ratio
            const mostCommonTerrain = Object.entries(terrainCounts)
                .reduce((a, b) => (a[1] > b[1] ? a : b))[0];
            const mostCommonCount = terrainCounts[mostCommonTerrain] || 0;
            const dominanceRatio = mostCommonCount / neighbors.length;
            
            // If terrain is extremely dominant (over 75%), force some variation
            if (dominanceRatio > 0.75) {
                // 70% chance to still match the dominant terrain
                if (Math.random() < 0.7) {
                    return mostCommonTerrain;
                }
                
                // 30% chance to introduce variation
                const basicTerrains = ['grass', 'hills', 'desert'].filter(t => t !== mostCommonTerrain);
                return basicTerrains[Math.floor(Math.random() * basicTerrains.length)];
            }
            
            // Normal terrain generation
            if (Math.random() < 0.7) {  // 70% chance to match common neighbor
                return mostCommonTerrain;
            } else {  // 30% chance for variation
                // Prefer adjacent terrain types (e.g., grass->hills->desert)
                const terrainIndex = TERRAIN_TYPES.indexOf(mostCommonTerrain);
                const variation = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                const newIndex = (terrainIndex + variation + TERRAIN_TYPES.length) % TERRAIN_TYPES.length;
                
                // 90% chance to use adjacent terrain, 10% chance for completely random
                return Math.random() < 0.9 ? 
                    TERRAIN_TYPES[newIndex] : 
                    TERRAIN_TYPES[Math.floor(Math.random() * TERRAIN_TYPES.length)];
            }
        }

        function transitionMusic(toBattle) {
            const fadeOutDuration = 1000; // 1 second fade
            const fadeInDuration = 1000;
            const steps = 20;
            const fadeOutStep = 1 / steps;
            
            const currentMusic = toBattle ? BACKGROUND_MUSIC : BATTLE_MUSIC;
            const newMusic = toBattle ? BATTLE_MUSIC : BACKGROUND_MUSIC;
            
            // Fade out current music
            let fadeOutInterval = setInterval(() => {
                if (currentMusic.volume > 0) {
                    currentMusic.volume = Math.max(0, currentMusic.volume - fadeOutStep);
                } else {
                    clearInterval(fadeOutInterval);
                    currentMusic.pause();
                    currentMusic.volume = 1;
                    
                    // Start new music
                    newMusic.volume = 0;
                    newMusic.play().then(() => {
                        // Fade in new music
                        let fadeInInterval = setInterval(() => {
                            if (newMusic.volume < 1) {
                                newMusic.volume = Math.min(1, newMusic.volume + fadeOutStep);
                            } else {
                                clearInterval(fadeInInterval);
                            }
                        }, fadeInDuration / steps);
                    });
                }
            }, fadeOutDuration / steps);
        }

        function playSound(soundName) {
            const sound = SOUNDS[soundName];
            console.log(sound);
            if (sound) {
                // Clone and play the sound to allow overlapping
                const soundClone = sound.cloneNode();
                soundClone.play().catch(error => console.log('Sound play failed:', error));
            }
        }

        init();