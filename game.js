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

        // Sound Effects
        const SOUNDS = {
            FOOTSTEP: new Audio('assets/audio/taking_step.mp3'),
            ATTACK: new Audio('assets/audio/sound_of_a_single_sw.mp3'),
            // ENEMY_HIT: new Audio('assets/audio/enemy-hit.mp3'),
            // PLAYER_HIT: new Audio('assets/audio/player-hit.mp3'),
            CAMP: new Audio('assets/audio/crackling_campfire.mp3'),
            LEVEL_UP: new Audio('assets/audio/victory.mp3'),
            // RUN: new Audio('assets/audio/run-away.mp3')
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

        function playLevelUpSequence() {
            BACKGROUND_MUSIC.pause();
            BATTLE_MUSIC.pause();
            BACKGROUND_MUSIC.currentTime = 0;
            
            // 2. Wait a brief moment before playing level up sound
            setTimeout(() => {
                const levelUpSound = SOUNDS['LEVEL_UP'];
                levelUpSound.currentTime = 0;
                
                levelUpSound.onended = () => {
                    // Wait a brief moment before resuming background music
                    setTimeout(() => {
                        transitionMusic(false);
                    }, 100);
                };
                console.log('hitting play');
                levelUpSound.volume = 1;
                levelUpSound.play()
                    .catch(error => console.log('Level up sound failed:', error));
            }, 100);
        }

        class Sprite {
            constructor(type = 'basic', color = '#f00', secondaryColor = '#f66') {
                this.canvas = document.createElement('canvas');
                this.canvas.width = TILE_SIZE;
                this.canvas.height = TILE_SIZE;
                this.ctx = this.canvas.getContext('2d');
                this.type = type;
                this.color = color;
                this.secondaryColor = secondaryColor;
                this.animationOffset = 0;
                this.isStatic = type === 'basic'; // Flag for static sprites
                this.generate();  // Generate immediately for static sprites
            }

            generate() {
                this.ctx.clearRect(0, 0, TILE_SIZE, TILE_SIZE);
                
                if (this.isStatic) {
                    // Draw terrain with textures
                    switch (this.color) {
                        case '#3a3': // grass
                            this.drawGrass();
                            break;
                        case '#696': // hills
                            this.drawHills();
                            break;
                        case '#ca6': // desert
                            this.drawDesert();
                            break;
                        case '#39f': // water
                            this.drawWater();
                            break;
                        case '#666': // mountains
                            this.drawMountains();
                            break;
                        default:
                            this.ctx.fillStyle = this.color;
                            this.ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
                    }
                    return;
                }

                switch (this.type) {
                    case 'Slime':
                        this.drawSlime();
                        break;
                    case 'Goblin':
                        this.drawGoblin();
                        break;
                    case 'Bat':
                        this.drawBat();
                        break;
                    case 'Ghost':
                        this.drawGhost();
                        break;
                    case 'Spider':
                        this.drawSpider();
                        break;
                    case 'Orc':
                        this.drawOrc();
                        break;
                    case 'Zombie':
                        this.drawZombie();
                        break;
                    case 'Rat':
                        this.drawRat();
                        break;
                    case 'Skeleton':
                        this.drawSkeleton();
                        break;
                    case 'Imp':
                        this.drawImp();
                        break;
                    case 'hero':
                        this.drawHero();
                        break;
                    default:
                        this.drawBasicShape();
                }
            }

            drawGrass() {
                const ctx = this.ctx;
                ctx.fillStyle = '#3a3';
                ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
                
                // Add grass texture
                ctx.fillStyle = '#4b4';
                for (let i = 0; i < 8; i++) {
                    const x = Math.random() * TILE_SIZE;
                    const y = Math.random() * TILE_SIZE;
                    ctx.fillRect(x, y, 2, 4);
                }
            }

            drawHills() {
                const ctx = this.ctx;
                ctx.fillStyle = '#696';
                ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
                
                // Add hill curves
                ctx.strokeStyle = '#7a7';
                ctx.beginPath();
                ctx.moveTo(0, TILE_SIZE * 0.7);
                ctx.quadraticCurveTo(TILE_SIZE * 0.5, TILE_SIZE * 0.4, TILE_SIZE, TILE_SIZE * 0.6);
                ctx.stroke();
            }

            drawDesert() {
                const ctx = this.ctx;
                ctx.fillStyle = '#ca6';
                ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
                
                // Add sand dune texture
                ctx.fillStyle = '#db7';
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * TILE_SIZE;
                    const y = Math.random() * TILE_SIZE;
                    ctx.beginPath();
                    ctx.arc(x, y, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            drawWater() {
                const ctx = this.ctx;
                ctx.fillStyle = '#39f';
                ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
                
                // Add wave lines
                ctx.strokeStyle = '#4af';
                ctx.beginPath();
                for (let y = 4; y < TILE_SIZE; y += 8) {
                    ctx.moveTo(0, y);
                    ctx.quadraticCurveTo(TILE_SIZE/2, y + 4, TILE_SIZE, y);
                }
                ctx.stroke();
            }

            drawMountains() {
                const ctx = this.ctx;
                ctx.fillStyle = '#666';
                ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
                
                // Draw mountain peaks
                ctx.fillStyle = '#777';
                ctx.beginPath();
                ctx.moveTo(0, TILE_SIZE);
                ctx.lineTo(TILE_SIZE * 0.3, TILE_SIZE * 0.3);
                ctx.lineTo(TILE_SIZE * 0.5, TILE_SIZE * 0.5);
                ctx.lineTo(TILE_SIZE * 0.7, TILE_SIZE * 0.2);
                ctx.lineTo(TILE_SIZE, TILE_SIZE * 0.4);
                ctx.lineTo(TILE_SIZE, TILE_SIZE);
                ctx.fill();
                
                // Add snow caps
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE * 0.3, TILE_SIZE * 0.3);
                ctx.lineTo(TILE_SIZE * 0.4, TILE_SIZE * 0.35);
                ctx.lineTo(TILE_SIZE * 0.5, TILE_SIZE * 0.5);
                ctx.lineTo(TILE_SIZE * 0.6, TILE_SIZE * 0.35);
                ctx.lineTo(TILE_SIZE * 0.7, TILE_SIZE * 0.2);
                ctx.fill();
            }

            drawSlime() {
                const ctx = this.ctx;
                const bounce = Math.sin(this.animationOffset) * 2;
                
                // Body
                ctx.fillStyle = '#4af';
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2, 
                    TILE_SIZE/2 + 5 + bounce, 
                    TILE_SIZE/2 - 4, 
                    TILE_SIZE/3 - bounce, 
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Eyes
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2 - 5, TILE_SIZE/2 + bounce, 3, 3, 0, 0, Math.PI * 2);
                ctx.ellipse(TILE_SIZE/2 + 5, TILE_SIZE/2 + bounce, 3, 3, 0, 0, Math.PI * 2);
                ctx.fill();

                // Pupils
                ctx.fillStyle = 'black';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2 - 5, TILE_SIZE/2 + bounce, 1, 1, 0, 0, Math.PI * 2);
                ctx.ellipse(TILE_SIZE/2 + 5, TILE_SIZE/2 + bounce, 1, 1, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            drawGoblin() {
                const ctx = this.ctx;
                
                // Head
                ctx.fillStyle = '#6a6';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2, TILE_SIZE/2 - 4, 8, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                // Ears
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 8, TILE_SIZE/2 - 4);
                ctx.lineTo(TILE_SIZE/2 - 12, TILE_SIZE/2 - 8);
                ctx.lineTo(TILE_SIZE/2 - 8, TILE_SIZE/2 - 12);
                ctx.moveTo(TILE_SIZE/2 + 8, TILE_SIZE/2 - 4);
                ctx.lineTo(TILE_SIZE/2 + 12, TILE_SIZE/2 - 8);
                ctx.lineTo(TILE_SIZE/2 + 8, TILE_SIZE/2 - 12);
                ctx.stroke();

                // Eyes
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2 - 3, TILE_SIZE/2 - 5, 2, 2, 0, 0, Math.PI * 2);
                ctx.ellipse(TILE_SIZE/2 + 3, TILE_SIZE/2 - 5, 2, 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Body
                ctx.fillStyle = '#696';
                ctx.fillRect(TILE_SIZE/2 - 6, TILE_SIZE/2 + 4, 12, 12);
            }

            drawBat() {
                const ctx = this.ctx;
                const wingOffset = Math.sin(this.animationOffset) * 5;
                
                // Wings
                ctx.fillStyle = '#444';
                ctx.beginPath();
                // Left wing
                ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2 - 8, 
                    TILE_SIZE/2 - wingOffset,
                    TILE_SIZE/2 - 12, 
                    TILE_SIZE/2 + 4
                );
                // Right wing
                ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2 + 8, 
                    TILE_SIZE/2 - wingOffset,
                    TILE_SIZE/2 + 12, 
                    TILE_SIZE/2 + 4
                );
                ctx.fill();

                // Body
                ctx.fillStyle = '#666';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2, TILE_SIZE/2, 4, 6, 0, 0, Math.PI * 2);
                ctx.fill();

                // Eyes
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2 - 2, TILE_SIZE/2 - 1, 1, 1, 0, 0, Math.PI * 2);
                ctx.ellipse(TILE_SIZE/2 + 2, TILE_SIZE/2 - 1, 1, 1, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            drawGhost() {
                const ctx = this.ctx;
                const float = Math.sin(this.animationOffset) * 2;
                
                // Body
                ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 8, TILE_SIZE/2 - 8 + float);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2, TILE_SIZE/2 - 12 + float,
                    TILE_SIZE/2 + 8, TILE_SIZE/2 - 8 + float
                );
                ctx.lineTo(TILE_SIZE/2 + 8, TILE_SIZE/2 + 8 + float);
                
                // Wavy bottom
                for (let i = 0; i < 4; i++) {
                    ctx.quadraticCurveTo(
                        TILE_SIZE/2 + 4 - i * 8, TILE_SIZE/2 + 12 + float + (i % 2 * 4),
                        TILE_SIZE/2 - 8 + i * 8, TILE_SIZE/2 + 8 + float
                    );
                }
                ctx.fill();

                // Eyes
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2 - 3, TILE_SIZE/2 - 4 + float, 2, 2, 0, 0, Math.PI * 2);
                ctx.ellipse(TILE_SIZE/2 + 3, TILE_SIZE/2 - 4 + float, 2, 2, 0, 0, Math.PI * 2);
                ctx.fill();
            }

            drawSpider() {
                const ctx = this.ctx;
                const legOffset = Math.sin(this.animationOffset) * 2;
                
                // Body
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2, TILE_SIZE/2, 6, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                // Legs
                ctx.strokeStyle = '#000';
                ctx.lineWidth = 1;
                for (let i = 0; i < 8; i++) {
                    const angle = (i * Math.PI / 4) + (i % 2 ? legOffset : -legOffset);
                    ctx.beginPath();
                    ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2);
                    const x = TILE_SIZE/2 + Math.cos(angle) * 12;
                    const y = TILE_SIZE/2 + Math.sin(angle) * 12;
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }

                // Eyes
                ctx.fillStyle = 'red';
                for (let i = 0; i < 6; i++) {
                    const x = TILE_SIZE/2 - 3 + (i % 3) * 3;
                    const y = TILE_SIZE/2 - 2 + Math.floor(i / 3) * 2;
                    ctx.beginPath();
                    ctx.ellipse(x, y, 1, 1, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            drawHero() {
                const ctx = this.ctx;
                const breathe = Math.sin(this.animationOffset) * 1.5;
                const swordFloat = Math.sin(this.animationOffset * 0.8) * 2;
                
                // Shield (behind body)
                ctx.fillStyle = '#444';
                ctx.strokeStyle = '#666';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 - 6,
                    TILE_SIZE/2 + 2,
                    6,
                    8,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
                ctx.stroke();

                // Shield emblem
                ctx.strokeStyle = '#dd0';
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 8, TILE_SIZE/2 + 2);
                ctx.lineTo(TILE_SIZE/2 - 4, TILE_SIZE/2 + 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 6, TILE_SIZE/2);
                ctx.lineTo(TILE_SIZE/2 - 6, TILE_SIZE/2 + 4);
                ctx.stroke();

                // Body armor
                ctx.fillStyle = '#667';  // Steel blue-grey
                ctx.fillRect(TILE_SIZE/2 - 6, TILE_SIZE/2 - 2 + breathe, 12, 14);
                
                // Chest plate details
                ctx.strokeStyle = '#99a';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 4, TILE_SIZE/2 + breathe);
                ctx.lineTo(TILE_SIZE/2 + 4, TILE_SIZE/2 + breathe);
                ctx.moveTo(TILE_SIZE/2 - 3, TILE_SIZE/2 + 4 + breathe);
                ctx.lineTo(TILE_SIZE/2 + 3, TILE_SIZE/2 + 4 + breathe);
                ctx.stroke();

                // Cape
                ctx.fillStyle = '#c22';  // Deep red
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 5, TILE_SIZE/2 - 4);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2 - 8 + Math.sin(this.animationOffset) * 1.5,
                    TILE_SIZE/2 + 6,
                    TILE_SIZE/2 - 6,
                    TILE_SIZE/2 + 14
                );
                ctx.lineTo(TILE_SIZE/2 + 6, TILE_SIZE/2 + 14);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2 + 8 + Math.sin(this.animationOffset) * 1.5,
                    TILE_SIZE/2 + 6,
                    TILE_SIZE/2 + 5,
                    TILE_SIZE/2 - 4
                );
                ctx.fill();

                // Head with helmet
                ctx.fillStyle = '#667';  // Steel blue-grey
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2,
                    TILE_SIZE/2 - 8 + breathe,
                    6,
                    6,
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Helmet details
                ctx.strokeStyle = '#99a';
                ctx.lineWidth = 1;
                // Visor
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 4, TILE_SIZE/2 - 8 + breathe);
                ctx.lineTo(TILE_SIZE/2 + 4, TILE_SIZE/2 - 8 + breathe);
                ctx.stroke();
                // Plume/crest
                ctx.fillStyle = '#e33';
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2 - 14 + breathe);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2 + 4,
                    TILE_SIZE/2 - 10 + breathe,
                    TILE_SIZE/2 + 8,
                    TILE_SIZE/2 - 8 + breathe
                );
                ctx.fill();

                // Sword (glowing)
                ctx.strokeStyle = '#aaa';  // Blade
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 6, TILE_SIZE/2 - 4 + swordFloat);
                ctx.lineTo(TILE_SIZE/2 + 14, TILE_SIZE/2 - 12 + swordFloat);
                ctx.stroke();
                
                // Sword glow effect
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 6, TILE_SIZE/2 - 4 + swordFloat);
                ctx.lineTo(TILE_SIZE/2 + 14, TILE_SIZE/2 - 12 + swordFloat);
                ctx.stroke();

                // Sword handle
                ctx.strokeStyle = '#960';  // Gold crossguard
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 8, TILE_SIZE/2 - 6 + swordFloat);
                ctx.lineTo(TILE_SIZE/2 + 12, TILE_SIZE/2 - 6 + swordFloat);
                ctx.stroke();
                
                // Sword grip
                ctx.strokeStyle = '#542';  // Brown grip
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 10, TILE_SIZE/2 - 5 + swordFloat);
                ctx.lineTo(TILE_SIZE/2 + 10, TILE_SIZE/2 - 7 + swordFloat);
                ctx.stroke();

                // Gauntlet (sword hand)
                ctx.fillStyle = '#556';
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 + 6,
                    TILE_SIZE/2 - 4 + swordFloat,
                    3,
                    3,
                    0, 0, Math.PI * 2
                );
                ctx.fill();
            }

            drawBasicShape() {
                const ctx = this.ctx;
                
                // Main color fill
                ctx.fillStyle = this.color;
                ctx.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
                
                // Add some texture/variation
                ctx.fillStyle = this.secondaryColor;
                
                // Draw random dots/patches
                for (let i = 0; i < 5; i++) {
                    const x = Math.random() * TILE_SIZE;
                    const y = Math.random() * TILE_SIZE;
                    const size = Math.random() * 6 + 2;
                    
                    ctx.beginPath();
                    ctx.ellipse(x, y, size, size, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            drawOrc() {
                const ctx = this.ctx;
                const bounce = Math.sin(this.animationOffset) * 2;
                
                // Body
                ctx.fillStyle = '#4a4';  // Dark green
                ctx.fillRect(TILE_SIZE/2 - 8, TILE_SIZE/2 - 2, 16, 16);

                // Head
                ctx.fillStyle = '#5b5';  // Lighter green
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2, TILE_SIZE/2 - 8, 8, 8, 0, 0, Math.PI * 2);
                ctx.fill();

                // Tusks
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                // Left tusk
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 4, TILE_SIZE/2 - 4);
                ctx.lineTo(TILE_SIZE/2 - 6, TILE_SIZE/2);
                ctx.stroke();
                // Right tusk
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 4, TILE_SIZE/2 - 4);
                ctx.lineTo(TILE_SIZE/2 + 6, TILE_SIZE/2);
                ctx.stroke();

                // Eyes
                ctx.fillStyle = 'red';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2 - 4, TILE_SIZE/2 - 8, 2, 2, 0, 0, Math.PI * 2);
                ctx.ellipse(TILE_SIZE/2 + 4, TILE_SIZE/2 - 8, 2, 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Armor
                ctx.fillStyle = '#666';
                ctx.fillRect(TILE_SIZE/2 - 6, TILE_SIZE/2 + 4, 12, 6);

                // Weapon (axe)
                ctx.strokeStyle = '#8b4513';  // Brown handle
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 8, TILE_SIZE/2 - 4);
                ctx.lineTo(TILE_SIZE/2 + 16, TILE_SIZE/2 - 12);
                ctx.stroke();

                // Axe head
                ctx.fillStyle = '#aaa';
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 14, TILE_SIZE/2 - 14);
                ctx.lineTo(TILE_SIZE/2 + 18, TILE_SIZE/2 - 12);
                ctx.lineTo(TILE_SIZE/2 + 16, TILE_SIZE/2 - 10);
                ctx.fill();
            }

            drawZombie() {
                const ctx = this.ctx;
                const shamble = Math.sin(this.animationOffset) * 2;
                
                // Tattered clothes
                ctx.fillStyle = '#2a4';  // Dark, moldy green
                ctx.fillRect(TILE_SIZE/2 - 6, TILE_SIZE/2 - 2, 12, 14);
                
                // Torn edges on clothes
                ctx.fillStyle = '#183';  // Darker green for tears
                for (let i = 0; i < 4; i++) {
                    const x = TILE_SIZE/2 - 6 + Math.random() * 12;
                    const y = TILE_SIZE/2 + Math.random() * 10;
                    ctx.fillRect(x, y, 3, 4);
                }

                // Head (sickly green)
                ctx.fillStyle = '#9b9';
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 + shamble/2, 
                    TILE_SIZE/2 - 8, 
                    7, 7, 
                    shamble/10, 0, Math.PI * 2
                );
                ctx.fill();

                // Exposed brain detail
                ctx.fillStyle = '#faa';
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 + shamble/2, 
                    TILE_SIZE/2 - 12, 
                    4, 2, 
                    0, 0, Math.PI
                );
                ctx.fill();

                // Glowing eyes
                ctx.fillStyle = '#ff0';  // Glowing yellow
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2 - 3 + shamble/2, TILE_SIZE/2 - 8, 2, 2, 0, 0, Math.PI * 2);
                ctx.ellipse(TILE_SIZE/2 + 3 + shamble/2, TILE_SIZE/2 - 8, 2, 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Hanging arm
                ctx.strokeStyle = '#9b9';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 6, TILE_SIZE/2);
                ctx.lineTo(
                    TILE_SIZE/2 - 8 + Math.sin(this.animationOffset * 1.5) * 2, 
                    TILE_SIZE/2 + 8
                );
                ctx.stroke();

                // Dragging leg
                ctx.strokeStyle = '#2a4';
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 3, TILE_SIZE/2 + 12);
                ctx.lineTo(
                    TILE_SIZE/2 - 5 + Math.sin(this.animationOffset * 0.5) * 3, 
                    TILE_SIZE/2 + 16
                );
                ctx.stroke();

                // Blood stains
                ctx.fillStyle = '#a00';
                for (let i = 0; i < 3; i++) {
                    const x = TILE_SIZE/2 - 6 + Math.random() * 12;
                    const y = TILE_SIZE/2 - 2 + Math.random() * 14;
                    ctx.beginPath();
                    ctx.ellipse(x, y, 2, 1, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            drawRat() {
                const ctx = this.ctx;
                const scurry = Math.sin(this.animationOffset * 2) * 2; // Faster animation
                
                // Body
                ctx.fillStyle = '#644'; // Dark brown
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2, 
                    TILE_SIZE/2 + 4, 
                    8, 6, 
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Head
                ctx.fillStyle = '#755'; // Lighter brown
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 + 6, 
                    TILE_SIZE/2 + 2, 
                    5, 4, 
                    -0.3, 0, Math.PI * 2
                );
                ctx.fill();

                // Ears
                ctx.fillStyle = '#866'; // Even lighter brown
                // Left ear
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 + 4, 
                    TILE_SIZE/2 - 1, 
                    2, 3, 
                    -0.5, 0, Math.PI * 2
                );
                ctx.fill();
                // Right ear
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 + 7, 
                    TILE_SIZE/2 - 1, 
                    2, 3, 
                    0.5, 0, Math.PI * 2
                );
                ctx.fill();

                // Eyes
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 + 7, 
                    TILE_SIZE/2 + 1, 
                    1, 1, 
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Nose
                ctx.fillStyle = '#pink';
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 + 10, 
                    TILE_SIZE/2 + 2, 
                    1, 1, 
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Tail
                ctx.strokeStyle = '#644';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 8, TILE_SIZE/2 + 4);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2 - 12,
                    TILE_SIZE/2 + 8 + scurry,
                    TILE_SIZE/2 - 16,
                    TILE_SIZE/2 + 6
                );
                ctx.stroke();

                // Legs (animated)
                ctx.strokeStyle = '#644';
                ctx.lineWidth = 1;
                // Front legs
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 4, TILE_SIZE/2 + 6);
                ctx.lineTo(TILE_SIZE/2 + 4, TILE_SIZE/2 + 10 + Math.abs(scurry));
                ctx.moveTo(TILE_SIZE/2 + 4, TILE_SIZE/2 + 10 + Math.abs(scurry));
                ctx.lineTo(TILE_SIZE/2 + 4, TILE_SIZE/2 + 14 + Math.abs(scurry));
                ctx.stroke();
                // Back legs
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 4, TILE_SIZE/2 + 14 + Math.abs(scurry));
                ctx.lineTo(TILE_SIZE/2 + 4, TILE_SIZE/2 + 18 + Math.abs(scurry));
                ctx.stroke();
            }

            drawSkeleton() {
                const ctx = this.ctx;
                const rattle = Math.sin(this.animationOffset * 2) * 1.5;
                
                // Skull
                ctx.fillStyle = '#eee';
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 + rattle/2, 
                    TILE_SIZE/2 - 8, 
                    6, 7, 
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Eye sockets
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.ellipse(TILE_SIZE/2 - 2 + rattle/2, TILE_SIZE/2 - 8, 2, 2, 0, 0, Math.PI * 2);
                ctx.ellipse(TILE_SIZE/2 + 2 + rattle/2, TILE_SIZE/2 - 8, 2, 2, 0, 0, Math.PI * 2);
                ctx.fill();

                // Jaw
                ctx.strokeStyle = '#eee';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 4 + rattle/2, TILE_SIZE/2 - 4);
                ctx.lineTo(TILE_SIZE/2 + 4 + rattle/2, TILE_SIZE/2 - 4);
                ctx.stroke();

                // Ribcage
                ctx.lineWidth = 2;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    ctx.moveTo(TILE_SIZE/2 - 6, TILE_SIZE/2 + i * 4);
                    ctx.quadraticCurveTo(
                        TILE_SIZE/2 + rattle, 
                        TILE_SIZE/2 + 2 + i * 4, 
                        TILE_SIZE/2 + 6, 
                        TILE_SIZE/2 + i * 4
                    );
                    ctx.stroke();
                }

                // Spine
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2);
                ctx.lineTo(TILE_SIZE/2, TILE_SIZE/2 + 12);
                ctx.stroke();

                // Arms (with joints)
                ctx.lineWidth = 2;
                // Left arm
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 6, TILE_SIZE/2 + 2);
                ctx.lineTo(TILE_SIZE/2 - 8 + rattle, TILE_SIZE/2 + 6);
                ctx.lineTo(TILE_SIZE/2 - 10 - rattle, TILE_SIZE/2 + 12);
                ctx.stroke();
                // Right arm
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 6, TILE_SIZE/2 + 2);
                ctx.lineTo(TILE_SIZE/2 + 8 - rattle, TILE_SIZE/2 + 6);
                ctx.lineTo(TILE_SIZE/2 + 10 + rattle, TILE_SIZE/2 + 12);
                ctx.stroke();

                // Legs
                // Left leg
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2 + 12);
                ctx.lineTo(TILE_SIZE/2 - 2 + rattle, TILE_SIZE/2 + 16);
                ctx.lineTo(TILE_SIZE/2 - 4, TILE_SIZE/2 + 20);
                ctx.stroke();
                // Right leg
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2 + 12);
                ctx.lineTo(TILE_SIZE/2 + 2 - rattle, TILE_SIZE/2 + 16);
                ctx.lineTo(TILE_SIZE/2 + 4, TILE_SIZE/2 + 20);
                ctx.stroke();

                // Weapon (rusty sword)
                ctx.strokeStyle = '#963';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 10 + rattle, TILE_SIZE/2 + 12);
                ctx.lineTo(TILE_SIZE/2 + 16 + rattle, TILE_SIZE/2 + 4);
                ctx.stroke();
                
                // Sword guard
                ctx.strokeStyle = '#741';
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 14 + rattle, TILE_SIZE/2 + 6);
                ctx.lineTo(TILE_SIZE/2 + 12 + rattle, TILE_SIZE/2 + 6);
                ctx.stroke();
            }

            drawImp() {
                const ctx = this.ctx;
                const float = Math.sin(this.animationOffset) * 2;
                const wingFlap = Math.abs(Math.sin(this.animationOffset * 2)) * 4;
                
                // Wings
                ctx.fillStyle = '#800';  // Dark red
                // Left wing
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 4, TILE_SIZE/2);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2 - 8 - wingFlap,
                    TILE_SIZE/2 - 4 + float,
                    TILE_SIZE/2 - 12,
                    TILE_SIZE/2 + 8
                );
                ctx.lineTo(TILE_SIZE/2 - 4, TILE_SIZE/2 + 4);
                ctx.fill();
                
                // Right wing
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 4, TILE_SIZE/2);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2 + 8 + wingFlap,
                    TILE_SIZE/2 - 4 + float,
                    TILE_SIZE/2 + 12,
                    TILE_SIZE/2 + 8
                );
                ctx.lineTo(TILE_SIZE/2 + 4, TILE_SIZE/2 + 4);
                ctx.fill();

                // Body
                ctx.fillStyle = '#c00';  // Bright red
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2,
                    TILE_SIZE/2 + float,
                    6,
                    8,
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Head
                ctx.fillStyle = '#c00';
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2,
                    TILE_SIZE/2 - 6 + float,
                    5,
                    5,
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Horns
                ctx.fillStyle = '#800';
                // Left horn
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 4, TILE_SIZE/2 - 8 + float);
                ctx.lineTo(TILE_SIZE/2 - 6, TILE_SIZE/2 - 12 + float);
                ctx.lineTo(TILE_SIZE/2 - 3, TILE_SIZE/2 - 9 + float);
                ctx.fill();
                // Right horn
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 + 4, TILE_SIZE/2 - 8 + float);
                ctx.lineTo(TILE_SIZE/2 + 6, TILE_SIZE/2 - 12 + float);
                ctx.lineTo(TILE_SIZE/2 + 3, TILE_SIZE/2 - 9 + float);
                ctx.fill();

                // Eyes (glowing)
                ctx.fillStyle = '#ff0';  // Bright yellow
                ctx.beginPath();
                ctx.ellipse(
                    TILE_SIZE/2 - 2,
                    TILE_SIZE/2 - 6 + float,
                    1.5,
                    1.5,
                    0, 0, Math.PI * 2
                );
                ctx.ellipse(
                    TILE_SIZE/2 + 2,
                    TILE_SIZE/2 - 6 + float,
                    1.5,
                    1.5,
                    0, 0, Math.PI * 2
                );
                ctx.fill();

                // Mischievous grin
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2 - 3, TILE_SIZE/2 - 4 + float);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2,
                    TILE_SIZE/2 - 2 + float,
                    TILE_SIZE/2 + 3,
                    TILE_SIZE/2 - 4 + float
                );
                ctx.stroke();

                // Tail
                ctx.strokeStyle = '#c00';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(TILE_SIZE/2, TILE_SIZE/2 + 8 + float);
                ctx.quadraticCurveTo(
                    TILE_SIZE/2 + Math.sin(this.animationOffset * 2) * 4,
                    TILE_SIZE/2 + 12 + float,
                    TILE_SIZE/2 + Math.cos(this.animationOffset) * 4,
                    TILE_SIZE/2 + 16 + float
                );
                ctx.stroke();

                // Tail tip (spade shape)
                ctx.fillStyle = '#800';
                ctx.beginPath();
                ctx.moveTo(
                    TILE_SIZE/2 + Math.cos(this.animationOffset) * 4,
                    TILE_SIZE/2 + 14 + float
                );
                ctx.lineTo(
                    TILE_SIZE/2 + Math.cos(this.animationOffset) * 4 - 3,
                    TILE_SIZE/2 + 18 + float
                );
                ctx.lineTo(
                    TILE_SIZE/2 + Math.cos(this.animationOffset) * 4 + 3,
                    TILE_SIZE/2 + 18 + float
                );
                ctx.fill();
            }

            update(deltaTime) {
                if (!this.isStatic) {  // Only update animated sprites
                    this.animationOffset += deltaTime * 0.005;
                    this.generate();
                }
            }
        }

        // Update sprite creation with simple colors
        const sprites = {
            grass: new Sprite('basic', '#3a3'),
            hills: new Sprite('basic', '#696'),
            desert: new Sprite('basic', '#ca6'),
            water: new Sprite('basic', '#39f'),
            mountains: new Sprite('basic', '#666'),
            hero: new Sprite('hero'),
        };

        // Create enemy sprites with their specific types
        const enemySprites = ENEMY_TYPES.map(type => new Sprite(type));

        Object.values(sprites).forEach(sprite => sprite.generate());
        enemySprites.forEach(sprite => sprite.generate());

        class Player {
            constructor(name) {
                this.name = name;
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
                } else {
                    playSound('FOOTSTEP');
                }
            }

            gainXp(amount) {
                this.xp += amount;
                if (this.xp >= this.level * 100) {
                    this.levelUp();
                } else {
                    transitionMusic(false);
                }
            }

            levelUp() {
                this.level++;
                this.maxHp += 10;
                this.hp = this.maxHp;
                this.attack += 2;
                this.defense += 1;
                
                // Call the standalone function
                playLevelUpSequence();
                
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
            const BATTLE_SPRITE_SIZE = 128; // Large size for battle sprites
            
            // Get the terrain the player is standing on
            const currentTerrain = getTileAt(player.x, player.y - 1);
            
            // Draw the background image
            const backgroundImg = battleBackgroundImages[currentTerrain];
            if (backgroundImg && backgroundImg.complete) {
                ctx.drawImage(backgroundImg, 0, 0, canvas.width, canvas.height);
            } else {
                // Fallback to black background if image isn't loaded
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            
            // Move sprites up by adjusting Y position
            const heroY = canvas.height - BATTLE_SPRITE_SIZE - 80; // Increased padding from bottom
            const enemyY = heroY; // Keep them at same height
            
            // Draw hero on left side
            ctx.save();
            ctx.imageSmoothingEnabled = false; // Keep pixel art sharp when scaling
            ctx.drawImage(
                sprites.hero.canvas,
                50, // X position
                heroY,
                BATTLE_SPRITE_SIZE,
                BATTLE_SPRITE_SIZE
            );

            // Draw enemy on right side
            const enemySprite = enemySprites[ENEMY_TYPES.indexOf(currentEnemy.name)];
            ctx.drawImage(
                enemySprite.canvas,
                canvas.width - BATTLE_SPRITE_SIZE - 50,
                enemyY,
                BATTLE_SPRITE_SIZE,
                BATTLE_SPRITE_SIZE
            );
            ctx.restore();
            
            // Draw battle UI
            ctx.fillStyle = '#fff';
            ctx.font = '24px monospace';
            
            // Move HP text up to top of screen
            const topPadding = 30;
            ctx.fillText(`${player.name} HP: ${player.hp}/${player.maxHp}`, 50, topPadding);
            ctx.fillText(`${currentEnemy.name} HP: ${currentEnemy.hp}`, canvas.width - 300, topPadding);
            
            // Draw HP bars just below the text
            drawHealthBar(50, topPadding + 10, player.hp, player.maxHp, 200);
            drawHealthBar(canvas.width - 250, topPadding + 10, currentEnemy.hp, 100, 200);
        }

        // Add this helper function for health bars
        function drawHealthBar(x, y, current, max, width) {
            const height = 20;
            const percentage = current / max;
            
            // Draw background
            ctx.fillStyle = '#600';
            ctx.fillRect(x, y, width, height);
            
            // Draw health
            ctx.fillStyle = '#f00';
            ctx.fillRect(x, y, width * percentage, height);
            
            // Draw border
            ctx.strokeStyle = '#fff';
            ctx.strokeRect(x, y, width, height);
        }

        function battle(action) {
            if (action === 'attack') {
                playSound('ATTACK');
                const damage = Math.max(1, player.attack - currentEnemy.defense);
                currentEnemy.hp -= damage;
                
                setTimeout(() => {
                    // Check if enemy still exists before accessing properties
                    if (currentEnemy) {
                        updateGameInfo(`You dealt ${damage} damage to the ${currentEnemy.name}`);
                        
                        if (currentEnemy.hp <= 0) {
                            const defeatedEnemyName = currentEnemy.name;  // Store name before nulling
                            const goldGained = currentEnemy.gold;
                            const xpGained = currentEnemy.xp;
                            
                            player.gold += goldGained;
                            player.gainXp(xpGained);
                            
                            currentEnemy = null;  // Clear the enemy
                            drawMap();
                            
                            updateGameInfo(`You defeated the ${defeatedEnemyName}! Gained ${goldGained} gold and ${xpGained} XP`);
                            return;
                        }
                        
                        // Enemy attack
                        setTimeout(() => {
                            if (currentEnemy) {  // Check again before enemy attacks
                                const enemyDamage = Math.max(1, currentEnemy.attack - player.defense);
                                player.hp -= enemyDamage;
                                
                                setTimeout(() => {
                                    if (currentEnemy) {  // Final check
                                        updateGameInfo(`The ${currentEnemy.name} dealt ${enemyDamage} damage to you`);
                                        
                                        if (player.hp <= 0) {
                                            updateGameInfo('Game Over! You have been defeated.');
                                            currentEnemy = null;
                                            return;
                                        }
                                        drawBattleScene();
                                    }
                                }, 100);
                            }
                        }, 500);
                    }
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
            player = new Player('Mike');
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
            if (sound) {
                // Clone and play the sound to allow overlapping
                const soundClone = sound.cloneNode();
                soundClone.play().catch(error => console.log('Sound play failed:', error));
            }
        }

        let lastTime = 0;

        function gameLoop(timestamp) {
            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;
            
            // Only update enemy sprites
            enemySprites.forEach(sprite => sprite.update(deltaTime));
            sprites.hero.update(deltaTime);
            
            // Redraw the game
            if (!currentEnemy) {
                drawMap();
            } else {
                drawBattleScene();
            }
            
            requestAnimationFrame(gameLoop);
        }

        requestAnimationFrame(gameLoop);

        init();