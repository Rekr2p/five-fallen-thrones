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

        let gameMap;
        let player;
        let currentEnemy = null;

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
                if (newX >= 0 && newX < MAP_WIDTH && newY >= 0 && newY < MAP_HEIGHT) {
                    this.x = newX;
                    this.y = newY;
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
                updateGameInfo(`Level up! You are now level ${this.level}`);
            }

            camp() {
                const healAmount = Math.floor(this.maxHp * 0.5);
                this.hp = Math.min(this.maxHp, this.hp + healAmount);
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
            return Array.from({ length: MAP_HEIGHT }, () =>
                Array.from({ length: MAP_WIDTH }, () =>
                    TERRAIN_TYPES[Math.floor(Math.random() * TERRAIN_TYPES.length)]
                )
            );
        }

        function drawMap() {
            for (let y = 0; y < MAP_HEIGHT; y++) {
                for (let x = 0; x < MAP_WIDTH; x++) {
                    const terrain = gameMap[y][x];
                    ctx.drawImage(sprites[terrain].canvas, x * TILE_SIZE, y * TILE_SIZE);
                }
            }
            ctx.drawImage(sprites.hero.canvas, player.x * TILE_SIZE, player.y * TILE_SIZE);
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
            
            // Trigger battle transition
            battleTransition.style.opacity = '1';
            setTimeout(() => {
                drawBattleScene();
                battleTransition.style.opacity = '0';
            }, 500);
        }

        function drawBattleScene() {
            ctx.fillStyle = '#000';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
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
                const damage = Math.max(1, player.attack - currentEnemy.defense);
                currentEnemy.hp -= damage;
                updateGameInfo(`You dealt ${damage} damage to the ${currentEnemy.name}`);
                
                if (currentEnemy.hp <= 0) {
                    player.gold += currentEnemy.gold;
                    player.gainXp(currentEnemy.xp);
                    updateGameInfo(`You defeated the ${currentEnemy.name}! Gained ${currentEnemy.gold} gold and ${currentEnemy.xp} XP`);
                    currentEnemy = null;
                    drawMap();
                    return;
                }
                
                const enemyDamage = Math.max(1, currentEnemy.attack - player.defense);
                player.hp -= enemyDamage;
                updateGameInfo(`The ${currentEnemy.name} dealt ${enemyDamage} damage to you`);
                
                if (player.hp <= 0) {
                    updateGameInfo('Game Over! You have been defeated.');
                    currentEnemy = null;
                    return;
                }
            } else if (action === 'run') {
                if (Math.random() < 0.5) {
                    updateGameInfo('You successfully ran away!');
                    currentEnemy = null;
                    drawMap();
                    return;
                } else {
                    updateGameInfo('You failed to run away!');
                    const enemyDamage = Math.max(1, currentEnemy.attack - player.defense);
                    player.hp -= enemyDamage;
                    updateGameInfo(`The ${currentEnemy.name} dealt ${enemyDamage} damage to you`);
                }
            }
            
            drawBattleScene();
        }

        function init() {
            gameMap = generateMap();
            player = new Player();
            drawMap();
            updateGameInfo();
            setupTouchControls();
            setupKeyboardControls();
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

        init();