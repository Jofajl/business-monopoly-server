// Replace your entire <script> section with this fixed version

// ====== GAME CLASSES AND MODULES ======

class SoundManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.initializeSounds();
    }

    initializeSounds() {
        // Create audio context for sound effects
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio context not supported');
            this.audioContext = null;
        }
        
        // Simple sound effect generation
        this.sounds = {
            diceRoll: () => this.playTone(440, 0.1),
            propertyPurchase: () => this.playTone(523, 0.2),
            correctAnswer: () => this.playMelody([523, 659, 784], 0.15),
            wrongAnswer: () => this.playTone(196, 0.3),
            cardDraw: () => this.playTone(349, 0.1),
            achievement: () => this.playMelody([523, 659, 784, 1047], 0.2),
            playerMove: () => this.playTone(294, 0.05)
        };
    }

    playTone(frequency, duration) {
        if (this.muted || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (e) {
            console.warn('Audio playback failed');
        }
    }

    playMelody(frequencies, noteDuration) {
        if (this.muted || !this.audioContext) return;
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                this.playTone(freq, noteDuration);
            }, index * noteDuration * 1000);
        });
    }

    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName]();
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}

class LearningAnalytics {
    constructor() {
        this.data = {
            questionsAnswered: 0,
            correctAnswers: 0,
            currentStreak: 0,
            maxStreak: 0,
            totalTime: 0,
            topicScores: {},
            achievements: [],
            difficultyProgression: 'easy'
        };
        this.loadData();
    }

    saveData() {
        try {
            // Use temporary storage during session
            window.tempLearningData = this.data;
        } catch (e) {
            console.warn('Could not save learning data');
        }
    }

    loadData() {
        try {
            if (window.tempLearningData) {
                this.data = { ...this.data, ...window.tempLearningData };
            }
        } catch (e) {
            console.warn('Could not load learning data');
        }
    }

    recordAnswer(correct, topic = 'general', timeTaken = 0) {
        this.data.questionsAnswered++;
        this.data.totalTime += timeTaken;
        
        if (correct) {
            this.data.correctAnswers++;
            this.data.currentStreak++;
            this.data.maxStreak = Math.max(this.data.maxStreak, this.data.currentStreak);
        } else {
            this.data.currentStreak = 0;
        }

        // Track topic performance
        if (!this.data.topicScores[topic]) {
            this.data.topicScores[topic] = { correct: 0, total: 0 };
        }
        this.data.topicScores[topic].total++;
        if (correct) {
            this.data.topicScores[topic].correct++;
        }

        this.saveData();
        this.updateDifficulty();
        this.checkAchievements();
    }

    updateDifficulty() {
        const accuracy = this.getAccuracy();
        if (accuracy >= 80 && this.data.questionsAnswered >= 5) {
            this.data.difficultyProgression = 'hard';
        } else if (accuracy >= 60 && this.data.questionsAnswered >= 3) {
            this.data.difficultyProgression = 'medium';
        } else {
            this.data.difficultyProgression = 'easy';
        }
    }

    checkAchievements() {
        const achievements = [
            { id: 'first_correct', name: 'First Success', icon: '🎯', condition: () => this.data.correctAnswers >= 1 },
            { id: 'streak_5', name: 'Learning Streak', icon: '🔥', condition: () => this.data.currentStreak >= 5 },
            { id: 'accuracy_master', name: 'Accuracy Master', icon: '🎖️', condition: () => this.getAccuracy() >= 90 && this.data.questionsAnswered >= 10 },
            { id: 'question_veteran', name: 'Question Veteran', icon: '📚', condition: () => this.data.questionsAnswered >= 25 },
            { id: 'streak_master', name: 'Streak Master', icon: '⚡', condition: () => this.data.maxStreak >= 10 }
        ];

        achievements.forEach(achievement => {
            if (!this.data.achievements.includes(achievement.id) && achievement.condition()) {
                this.data.achievements.push(achievement.id);
                this.showAchievement(achievement);
            }
        });
    }

    showAchievement(achievement) {
        if (window.soundManager) {
            window.soundManager.play('achievement');
        }
        
        const popup = document.createElement('div');
        popup.className = 'achievement-popup';
        popup.innerHTML = `
            <div class="achievement-icon">${achievement.icon}</div>
            <div class="achievement-title">Achievement Unlocked!</div>
            <div class="achievement-description">${achievement.name}</div>
        `;
        
        document.body.appendChild(popup);
        
        setTimeout(() => {
            popup.style.animation = 'achievementSlide 0.5s ease-out reverse';
            setTimeout(() => popup.remove(), 500);
        }, 3000);
    }

    getAccuracy() {
        return this.data.questionsAnswered > 0 ? 
            Math.round((this.data.correctAnswers / this.data.questionsAnswered) * 100) : 0;
    }

    getAverageTime() {
        return this.data.questionsAnswered > 0 ? 
            Math.round(this.data.totalTime / this.data.questionsAnswered) : 0;
    }

    getDifficulty() {
        return this.data.difficultyProgression;
    }

    updateDisplay() {
        const questionsEl = document.getElementById('questions-answered');
        const accuracyEl = document.getElementById('accuracy-rate');
        const streakEl = document.getElementById('learning-streak');
        const achievementsEl = document.getElementById('achievements-count');
        const progressEl = document.getElementById('learning-progress');
        
        if (questionsEl) questionsEl.textContent = this.data.questionsAnswered;
        if (accuracyEl) accuracyEl.textContent = `${this.getAccuracy()}%`;
        if (streakEl) streakEl.textContent = this.data.currentStreak;
        if (achievementsEl) achievementsEl.textContent = this.data.achievements.length;
        
        if (progressEl) {
            const progress = Math.min(100, (this.data.questionsAnswered / 50) * 100);
            progressEl.style.width = `${progress}%`;
        }
    }
}

class PropertyManager {
    constructor() {
        this.properties = this.initializeProperties();
    }

    initializeProperties() {
        return {
            1: { name: 'Old Kent Road', price: 60, rent: [2, 10, 30, 90, 160, 250], color: 'dark-purple', houses: 0, owner: null },
            3: { name: 'Whitechapel Road', price: 60, rent: [4, 20, 60, 180, 320, 450], color: 'dark-purple', houses: 0, owner: null },
            6: { name: 'The Angel Islington', price: 100, rent: [6, 30, 90, 270, 400, 550], color: 'light-blue', houses: 0, owner: null },
            8: { name: 'Euston Road', price: 100, rent: [6, 30, 90, 270, 400, 550], color: 'light-blue', houses: 0, owner: null },
            9: { name: 'Pentonville Road', price: 120, rent: [8, 40, 100, 300, 450, 600], color: 'light-blue', houses: 0, owner: null },
            11: { name: 'Pall Mall', price: 140, rent: [10, 50, 150, 450, 625, 750], color: 'purple', houses: 0, owner: null },
            13: { name: 'Whitehall', price: 140, rent: [10, 50, 150, 450, 625, 750], color: 'purple', houses: 0, owner: null },
            14: { name: 'Northumberland Avenue', price: 160, rent: [12, 60, 180, 500, 700, 900], color: 'purple', houses: 0, owner: null },
            16: { name: 'Bow Street', price: 180, rent: [14, 70, 200, 550, 750, 950], color: 'orange', houses: 0, owner: null },
            18: { name: 'Marlborough Street', price: 180, rent: [14, 70, 200, 550, 750, 950], color: 'orange', houses: 0, owner: null },
            19: { name: 'Vine Street', price: 200, rent: [16, 80, 220, 600, 800, 1000], color: 'orange', houses: 0, owner: null },
            21: { name: 'The Strand', price: 220, rent: [18, 90, 250, 700, 875, 1050], color: 'red', houses: 0, owner: null },
            23: { name: 'Fleet Street', price: 220, rent: [18, 90, 250, 700, 875, 1050], color: 'red', houses: 0, owner: null },
            24: { name: 'Trafalgar Square', price: 240, rent: [20, 100, 300, 750, 925, 1100], color: 'red', houses: 0, owner: null },
            26: { name: 'Leicester Square', price: 260, rent: [22, 110, 330, 800, 975, 1150], color: 'yellow', houses: 0, owner: null },
            27: { name: 'Coventry Street', price: 260, rent: [22, 110, 330, 800, 975, 1150], color: 'yellow', houses: 0, owner: null },
            29: { name: 'Piccadilly', price: 280, rent: [24, 120, 360, 850, 1025, 1200], color: 'yellow', houses: 0, owner: null },
            31: { name: 'Regent Street', price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: 'green', houses: 0, owner: null },
            32: { name: 'Oxford Street', price: 300, rent: [26, 130, 390, 900, 1100, 1275], color: 'green', houses: 0, owner: null },
            34: { name: 'Bond Street', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], color: 'green', houses: 0, owner: null },
            37: { name: 'Park Lane', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], color: 'dark-blue', houses: 0, owner: null },
            39: { name: 'Mayfair', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], color: 'dark-blue', houses: 0, owner: null },
            // Railroads and Utilities
            5: { name: "King's Cross Station", price: 200, rent: [25, 50, 100, 200], type: 'railroad', owner: null },
            15: { name: 'Marylebone Station', price: 200, rent: [25, 50, 100, 200], type: 'railroad', owner: null },
            25: { name: 'Fenchurch Street Station', price: 200, rent: [25, 50, 100, 200], type: 'railroad', owner: null },
            35: { name: 'Liverpool Street Station', price: 200, rent: [25, 50, 100, 200], type: 'railroad', owner: null },
            12: { name: 'Electric Company', price: 150, rent: [4, 10], type: 'utility', owner: null },
            28: { name: 'Water Works', price: 150, rent: [4, 10], type: 'utility', owner: null }
        };
    }

    getProperty(index) {
        return this.properties[index] || null;
    }

    buyProperty(index, playerId) {
        if (this.properties[index] && !this.properties[index].owner) {
            this.properties[index].owner = playerId;
            return true;
        }
        return false;
    }

    developProperty(index) {
        const property = this.properties[index];
        if (property && property.houses < 5 && property.type !== 'railroad' && property.type !== 'utility') {
            property.houses++;
            return true;
        }
        return false;
    }

    calculateRent(index, diceRoll = 0) {
        const property = this.properties[index];
        if (!property || !property.owner) return 0;

        if (property.type === 'railroad') {
            const ownedRailroads = Object.values(this.properties)
                .filter(p => p.type === 'railroad' && p.owner === property.owner).length;
            return property.rent[ownedRailroads - 1] || 0;
        }

        if (property.type === 'utility') {
            const ownedUtilities = Object.values(this.properties)
                .filter(p => p.type === 'utility' && p.owner === property.owner).length;
            const multiplier = ownedUtilities === 1 ? 4 : 10;
            return diceRoll * multiplier;
        }

        return property.rent[property.houses] || property.rent[0];
    }

    updatePropertyDisplay(index) {
        const property = this.properties[index];
        const element = document.querySelector(`[data-index="${index}"]`);
        if (!element || !property) return;

        // Add ownership styling
        if (property.owner !== null) {
            element.classList.add('owned');
        }

        // Add development indicator
        const indicator = element.querySelector('.development-indicator');
        if (indicator && property.houses > 0) {
            indicator.innerHTML = '';
            for (let i = 0; i < Math.min(property.houses, 4); i++) {
                const house = document.createElement('div');
                house.className = 'development-house';
                indicator.appendChild(house);
            }
            if (property.houses === 5) {
                indicator.innerHTML = '<div class="development-hotel"></div>';
            }
            element.classList.add('developed');
        }
    }

    getPlayerProperties(playerId) {
        return Object.entries(this.properties)
            .filter(([index, property]) => property.owner === playerId)
            .map(([index, property]) => ({ index: parseInt(index), ...property }));
    }

    canDevelop(playerId, propertyIndex) {
        const property = this.properties[propertyIndex];
        if (!property || property.owner !== playerId || property.houses >= 5) return false;
        if (property.type === 'railroad' || property.type === 'utility') return false;

        // Check if player owns all properties in the color group
        const colorGroup = Object.entries(this.properties)
            .filter(([index, prop]) => prop.color === property.color && prop.color);
        
        const allOwned = colorGroup.every(([index, prop]) => prop.owner === playerId);
        return allOwned;
    }
}

class GameController {
    constructor() {
        this.socket = io('https://business-monopoly-server.onrender.com');
        this.currentRoom = null;
        this.currentPlayer = null;
        this.selectedPiece = null;
        this.takenPieces = [];
        this.gameData = null;
        this.canBuyProperty = false;
        this.propertyToBuy = null;
        this.isPlayerMoving = false;
        this.initializeSocketEvents();
        this.initializeKeyboardNavigation();
    }

    getPieceIcon(piece) {
        const pieces = {
            'car': '🚗',
            'dog': '🐕',
            'hat': '🎩',
            'boot': '👠',
            'ship': '⛵',
            'plane': '✈️',
            'cat': '🐱',
            'rocket': '🚀'
        };
        return pieces[piece] || '🎯';
    }

    updatePieceAvailability(takenPieces) {
        this.takenPieces = takenPieces || [];
        
        document.querySelectorAll('.piece-option').forEach(option => {
            const piece = option.dataset.piece;
            
            if (this.takenPieces.includes(piece)) {
                option.classList.add('taken');
                option.classList.remove('selected');
                option.onclick = null;
            } else {
                option.classList.remove('taken');
                option.onclick = () => window.selectPiece(piece);
            }
        });

        this.validateRoomActions();
    }

    validateRoomActions() {
        const playerName = document.getElementById('playerName').value.trim();
        const createBtn = document.getElementById('create-room-btn');
        const joinBtn = document.getElementById('join-room-btn');
        const roomCode = document.getElementById('roomCode').value.trim();

        const isValid = playerName && this.selectedPiece;
        
        if (createBtn) createBtn.disabled = !isValid;
        if (joinBtn) joinBtn.disabled = !(isValid && roomCode);
    }

    initializeSocketEvents() {
        this.socket.on('connect', () => {
            console.log('✅ Connected to server');
        });

        this.socket.on('disconnect', () => {
            console.log('❌ Disconnected from server');
            this.showReconnectMessage();
        });

        this.socket.on('roomCreated', (data) => {
            this.currentRoom = data.roomCode;
            this.currentPlayer = document.getElementById('playerName').value.trim();
            document.getElementById('room-code').textContent = data.roomCode;
            document.getElementById('room-created').classList.remove('hidden');
            
            // Update piece availability
            if (data.takenPieces) {
                this.updatePieceAvailability(data.takenPieces);
            }
        });

        this.socket.on('roomJoined', (data) => {
            this.currentRoom = data.roomCode;
            this.currentPlayer = document.getElementById('playerName').value.trim();
            document.getElementById('room-setup').classList.add('hidden');
            document.getElementById('game-container').classList.remove('hidden');
            this.updatePlayersDisplay(data.players);
            
            // Update piece availability for new room
            const takenPieces = data.players.map(p => p.selectedPiece).filter(p => p);
            this.updatePieceAvailability(takenPieces);
        });

        this.socket.on('playersUpdated', (data) => {
            this.updatePlayersDisplay(data.players);
            
            // Update piece availability
            const takenPieces = data.players.map(p => p.selectedPiece).filter(p => p);
            this.updatePieceAvailability(takenPieces);
            
            if (this.currentRoom && data.players.length >= 2) {
                const hostPlayer = data.players.find(p => p.isHost);
                if (hostPlayer && hostPlayer.name === this.currentPlayer) {
                    document.getElementById('start-game-btn').classList.remove('hidden');
                }
            }
        });

        this.socket.on('error', (message) => {
            this.showMessage('Error: ' + message, 'error');
            
            // If piece was taken, refresh piece selection
            if (message.includes('piece') || message.includes('taken')) {
                // Reset piece selection
                this.selectedPiece = null;
                document.querySelectorAll('.piece-option').forEach(option => {
                    option.classList.remove('selected');
                });
                document.getElementById('selected-piece-info').classList.add('hidden');
                this.validateRoomActions();
            }
        });

        // Add other socket events here...
        // (I'll continue with more events in the next part due to length)
    }

    initializeKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return;

            switch(e.key) {
                case ' ': // Spacebar
                    e.preventDefault();
                    const rollBtn = document.getElementById('roll-dice-btn');
                    if (rollBtn && !rollBtn.classList.contains('hidden')) {
                        this.rollDice();
                    }
                    break;
                case 'Enter':
                    e.preventDefault();
                    const startBtn = document.getElementById('start-turn-btn');
                    if (startBtn && !startBtn.classList.contains('hidden')) {
                        this.startTurn();
                    }
                    break;
            }
        });
    }

    createRoom() {
        const playerName = document.getElementById('playerName').value.trim();
        if (!playerName) {
            this.showMessage('Please enter your name', 'error');
            return;
        }
        
        if (!this.selectedPiece) {
            this.showMessage('Please select a game piece', 'error');
            return;
        }
        
        this.socket.emit('createRoom', { 
            playerName: playerName,
            selectedPiece: this.selectedPiece
        });
    }

    showJoinForm() {
        document.getElementById('join-form').classList.remove('hidden');
        this.validateRoomActions();
    }

    joinRoom() {
        const playerName = document.getElementById('playerName').value.trim();
        const roomCode = document.getElementById('roomCode').value.trim().toUpperCase();
        
        if (!playerName || !roomCode) {
            this.showMessage('Please enter your name and room code', 'error');
            return;
        }
        
        if (!this.selectedPiece) {
            this.showMessage('Please select a game piece', 'error');
            return;
        }
        
        this.socket.emit('joinRoom', { 
            roomCode: roomCode, 
            playerName: playerName,
            selectedPiece: this.selectedPiece
        });
    }

    startGame() {
        this.socket.emit('startGame', this.currentRoom);
    }

    startTurn() {
        this.socket.emit('startTurn', this.currentRoom);
    }

    rollDice() {
        if (window.soundManager) {
            window.soundManager.play('diceRoll');
        }
        this.socket.emit('rollDice', this.currentRoom);
    }

    buyProperty() {
        if (this.canBuyProperty && this.propertyToBuy !== null) {
            const currentPlayerData = this.gameData.players[this.gameData.currentPlayer];
            const propertyIndex = currentPlayerData.position;
            this.socket.emit('buyProperty', { roomCode: this.currentRoom, propertyIndex: propertyIndex });
        }
    }

    endTurn() {
        this.socket.emit('endTurn', this.currentRoom);
    }

    updatePlayersDisplay(players) {
        const playersList = document.getElementById('players-list');
        if (!playersList) return;
        
        playersList.innerHTML = '';
        
        players.forEach((player, index) => {
            const playerItem = document.createElement('div');
            playerItem.className = `player-item ${this.gameData && this.gameData.currentPlayer === index ? 'current' : ''}`;
            
            const pieceIcon = player.selectedPiece ? this.getPieceIcon(player.selectedPiece) : player.name.charAt(0).toUpperCase();
            
            playerItem.innerHTML = `
                <div>
                    <div style="font-weight: bold;">
                        <span style="font-size: 16px; margin-right: 8px;">${pieceIcon}</span>
                        ${player.name} ${player.isHost ? '👑' : ''}
                    </div>
                    <div style="font-size: 10px; color: #666;">${player.properties.length} properties</div>
                </div>
                <div class="player-money">£${player.money}</div>
            `;
            playersList.appendChild(playerItem);
        });
    }

    showMessage(text, type = 'success') {
        const messageDiv = document.createElement('div');
        const bgColor = type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1';
        const textColor = type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460';
        const borderColor = type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb';
        
        messageDiv.style.cssText = `
            position: fixed; top: 16px; right: 16px; 
            background: ${bgColor}; color: ${textColor};
            padding: 12px; border-radius: 8px; 
            max-width: 235px; z-index: 1001;
            border: 2px solid ${borderColor};
            font-size: 11px; text-transform: none;
            box-shadow: 0 3px 9px rgba(0,0,0,0.2);
        `;
        messageDiv.textContent = text;
        document.body.appendChild(messageDiv);
        
        setTimeout(() => messageDiv.remove(), 5000);
    }

    showReconnectMessage() {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8); display: flex; align-items: center;
            justify-content: center; z-index: 2000;
        `;
        overlay.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 15px; text-align: center;">
                <h3>Connection Lost</h3>
                <p>Attempting to reconnect...</p>
                <div style="animation: spin 1s linear infinite;">🔄</div>
            </div>
        `;
        document.body.appendChild(overlay);

        // Remove overlay when reconnected
        this.socket.on('connect', () => {
            overlay.remove();
        });
    }
}

// ====== GLOBAL FUNCTIONS ======

function selectPiece(piece) {
    console.log('selectPiece called with:', piece);
    
    // Don't allow selection of taken pieces
    if (window.gameController && window.gameController.takenPieces.includes(piece)) {
        console.log('Piece is taken, aborting selection');
        return;
    }

    // Remove previous selection
    document.querySelectorAll('.piece-option').forEach(option => {
        option.classList.remove('selected');
    });

    // Select new piece
    const selectedOption = document.querySelector(`[data-piece="${piece}"]`);
    if (selectedOption && window.gameController) {
        selectedOption.classList.add('selected');
        window.gameController.selectedPiece = piece;
        console.log('Piece selected:', window.gameController.selectedPiece);

        // Show selection info
        const selectedInfo = document.getElementById('selected-piece-info');
        const selectedName = document.getElementById('selected-piece-name');
        
        const pieceNames = {
            'car': '🚗 Car',
            'dog': '🐕 Dog',
            'hat': '🎩 Top Hat',
            'boot': '👠 Boot',
            'ship': '⛵ Ship',
            'plane': '✈️ Plane',
            'cat': '🐱 Cat',
            'rocket': '🚀 Rocket'
        };

        if (selectedName) selectedName.textContent = pieceNames[piece];
        if (selectedInfo) selectedInfo.classList.remove('hidden');

        // Update button states
        window.gameController.validateRoomActions();
    } else {
        console.error('Could not find piece option element or gameController for:', piece);
    }
}

function showPropertyInfo(propertyIndex) {
    if (!window.propertyManager) return;
    
    const property = window.propertyManager.getProperty(propertyIndex);
    if (!property) return;

    // Implementation for showing property info modal would go here
    console.log('Property info for:', property);
}

function hidePropertyModal() {
    const modal = document.getElementById('property-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
}

function confirmPurchaseProperty() {
    if (window.gameController) {
        window.gameController.buyProperty();
        window.gameController.hidePropertyPurchaseModal();
    }
}

function declineProperty() {
    if (window.gameController) {
        window.gameController.hidePropertyPurchaseModal();
        window.gameController.showMessage('Property purchase declined', 'info');
    }
}

// Accessibility Functions
function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    const btn = document.querySelector('.accessibility-controls .accessibility-btn');
    if (btn) btn.classList.toggle('active');
}

function toggleHighContrast() {
    document.body.classList.toggle('high-contrast');
    if (event && event.target) event.target.classList.toggle('active');
}

function adjustFontSize() {
    const currentSize = parseInt(getComputedStyle(document.body).fontSize);
    const newSize = currentSize >= 14 ? 10 : currentSize + 1;
    document.body.style.fontSize = newSize + 'px';
}

function toggleSound() {
    if (window.soundManager) {
        const muted = window.soundManager.toggleMute();
        const btn = document.querySelector('.sound-btn');
        if (btn) {
            btn.textContent = muted ? '🔇' : '🔊';
            btn.classList.toggle('muted', muted);
        }
    }
}

// ====== INITIALIZATION ======

// Initialize global instances
window.soundManager = new SoundManager();
window.learningAnalytics = new LearningAnalytics();
window.propertyManager = new PropertyManager();
window.gameController = new GameController();

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing game...');
    
    // Setup keyboard listeners
    const playerNameInput = document.getElementById('playerName');
    if (playerNameInput) {
        playerNameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && window.gameController) {
                window.gameController.createRoom();
            }
        });

        // Setup form validation
        playerNameInput.addEventListener('input', () => {
            if (window.gameController) {
                window.gameController.validateRoomActions();
            }
        });
    }

    const roomCodeInput = document.getElementById('roomCode');
    if (roomCodeInput) {
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && window.gameController) {
                window.gameController.joinRoom();
            }
        });

        roomCodeInput.addEventListener('input', () => {
            if (window.gameController) {
                window.gameController.validateRoomActions();
            }
        });
    }

    // Initialize learning analytics display
    if (window.learningAnalytics) {
        window.learningAnalytics.updateDisplay();
    }

    // Initial validation
    setTimeout(() => {
        if (window.gameController) {
            window.gameController.validateRoomActions();
        }
    }, 100);

    console.log('🎮 Game initialized successfully!');
});
