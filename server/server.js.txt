const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Game rooms storage
const rooms = new Map();
const playerStats = new Map();

// Enhanced question bank with categories, difficulties, and explanations
const questionBank = {
  general: {
    easy: [
      {
        question: "What does ROI stand for?",
        options: ["Return on Investment", "Rate of Interest", "Risk of Investment", "Revenue of Income"],
        correctAnswer: 0,
        explanation: "ROI (Return on Investment) measures the efficiency of an investment by comparing the gain or loss relative to its cost."
      },
      {
        question: "What is a stakeholder?",
        options: ["Only company shareholders", "Anyone affected by business decisions", "Only employees", "Only customers"],
        correctAnswer: 1,
        explanation: "Stakeholders include anyone who has an interest in or is affected by a company's activities - employees, customers, suppliers, shareholders, and the community."
      },
      {
        question: "What does B2B stand for?",
        options: ["Business to Business", "Back to Basics", "Buy to Build", "Brand to Brand"],
        correctAnswer: 0,
        explanation: "B2B (Business to Business) refers to transactions and relationships between companies rather than between companies and individual consumers."
      }
    ],
    medium: [
      {
        question: "In SWOT analysis, what does the 'T' represent?",
        options: ["Targets", "Threats", "Trends", "Tactics"],
        correctAnswer: 1,
        explanation: "SWOT stands for Strengths, Weaknesses, Opportunities, and Threats. It's a strategic planning framework for evaluating these four elements."
      },
      {
        question: "What is market segmentation?",
        options: ["Dividing markets into distinct groups", "Combining all markets", "Setting market prices", "Market research methods"],
        correctAnswer: 0,
        explanation: "Market segmentation involves dividing a broad target market into smaller, more specific groups of consumers with similar needs or characteristics."
      },
      {
        question: "What is a USP in marketing?",
        options: ["Universal Sales Process", "Unique Selling Proposition", "United States Patent", "User Service Platform"],
        correctAnswer: 1,
        explanation: "A USP (Unique Selling Proposition) is what makes your product or service different from and better than competitors in the minds of customers."
      }
    ],
    hard: [
      {
        question: "What is the difference between working capital and net working capital?",
        options: ["No difference", "Working capital includes all assets", "Net working capital subtracts current liabilities", "Working capital is always negative"],
        correctAnswer: 2,
        explanation: "Working capital is current assets minus current liabilities, while net working capital specifically refers to this calculation. The terms are often used interchangeably."
      },
      {
        question: "In financial analysis, what does EBITDA stand for?",
        options: ["Earnings Before Interest, Taxes, Depreciation, Amortization", "Estimated Business Income and Tax Analysis", "European Business Investment Data", "Earnings Based on International Trade Agreements"],
        correctAnswer: 0,
        explanation: "EBITDA is a measure of a company's overall financial performance, excluding certain non-cash and non-operating expenses to focus on operational profitability."
      }
    ]
  },
  finance: {
    easy: [
      {
        question: "What is cash flow?",
        options: ["Money coming in and going out", "Only money coming in", "Only money going out", "Total company assets"],
        correctAnswer: 0,
        explanation: "Cash flow is the movement of money in and out of a business, crucial for understanding financial health and liquidity."
      },
      {
        question: "What does break-even point mean?",
        options: ["Maximum profit point", "Point where costs equal revenue", "Minimum sales target", "End of fiscal year"],
        correctAnswer: 1,
        explanation: "The break-even point is where total costs equal total revenue, meaning the business neither makes a profit nor a loss."
      }
    ],
    medium: [
      {
        question: "What is the purpose of a budget variance analysis?",
        options: ["To increase budgets", "To compare actual vs planned performance", "To reduce expenses", "To forecast future sales"],
        correctAnswer: 1,
        explanation: "Budget variance analysis compares actual financial performance against budgeted figures to identify differences and understand their causes."
      },
      {
        question: "What is depreciation in accounting?",
        options: ["Increase in asset value", "Decrease in asset value over time", "Tax payment", "Interest expense"],
        correctAnswer: 1,
        explanation: "Depreciation is the systematic allocation of an asset's cost over its useful life, reflecting how assets lose value due to use, wear, or obsolescence."
      }
    ],
    hard: [
      {
        question: "What is the weighted average cost of capital (WACC)?",
        options: ["Average interest rate", "Cost of equity only", "Blended cost of debt and equity financing", "Total company expenses"],
        correctAnswer: 2,
        explanation: "WACC represents the average cost of capital from all sources (debt and equity), weighted by their respective proportions in the company's capital structure."
      }
    ]
  },
  marketing: {
    easy: [
      {
        question: "What are the 4 Ps of marketing?",
        options: ["Price, Product, Place, Promotion", "People, Process, Product, Price", "Profit, Product, Place, Price", "Product, Price, Performance, Place"],
        correctAnswer: 0,
        explanation: "The 4 Ps are the fundamental elements of the marketing mix: Product (what you sell), Price (how much), Place (where you sell), and Promotion (how you advertise)."
      },
      {
        question: "What is a target market?",
        options: ["All potential customers", "Specific group of potential customers", "Competitors", "Sales team"],
        correctAnswer: 1,
        explanation: "A target market is a specific group of consumers most likely to buy your product or service, identified through demographic, psychographic, and behavioral characteristics."
      }
    ],
    medium: [
      {
        question: "What is customer lifetime value (CLV)?",
        options: ["One-time purchase amount", "Total value of customer relationship", "Monthly subscription fee", "Customer satisfaction score"],
        correctAnswer: 1,
        explanation: "CLV predicts the total revenue a business can expect from a single customer throughout their entire relationship with the company."
      },
      {
        question: "What is the conversion rate in digital marketing?",
        options: ["Website loading speed", "Percentage of visitors who take desired action", "Number of website views", "Social media followers"],
        correctAnswer: 1,
        explanation: "Conversion rate is the percentage of website visitors or leads who complete a desired action, such as making a purchase or signing up for a newsletter."
      }
    ],
    hard: [
      {
        question: "What is attribution modeling in digital marketing?",
        options: ["Giving credit to team members", "Assigning value to touchpoints in customer journey", "Creating customer personas", "Setting marketing budgets"],
        correctAnswer: 1,
        explanation: "Attribution modeling determines how credit for conversions is assigned to different touchpoints in the customer journey, helping marketers understand which channels drive results."
      }
    ]
  },
  strategy: {
    easy: [
      {
        question: "What is a competitive advantage?",
        options: ["Having more employees", "Something that gives you an edge over competitors", "Higher prices", "Larger office space"],
        correctAnswer: 1,
        explanation: "Competitive advantage is any factor that allows a company to differentiate its products or services from competitors and attract customers more effectively."
      }
    ],
    medium: [
      {
        question: "What is Porter's Five Forces model used for?",
        options: ["Employee management", "Analyzing industry competition", "Financial planning", "Product development"],
        correctAnswer: 1,
        explanation: "Porter's Five Forces analyzes the competitive environment by examining: supplier power, buyer power, competitive rivalry, threat of substitution, and threat of new entry."
      },
      {
        question: "What is a blue ocean strategy?",
        options: ["Ocean conservation efforts", "Creating uncontested market space", "Naval business operations", "Water industry strategies"],
        correctAnswer: 1,
        explanation: "Blue ocean strategy involves creating new market space where competition is irrelevant, rather than competing in existing markets (red oceans)."
      }
    ],
    hard: [
      {
        question: "What is the BCG Growth-Share Matrix used for?",
        options: ["Employee performance", "Portfolio analysis of business units", "Financial forecasting", "Market research"],
        correctAnswer: 1,
        explanation: "The BCG Matrix categorizes business units as Stars, Cash Cows, Question Marks, or Dogs based on market growth rate and relative market share to guide investment decisions."
      }
    ]
  },
  operations: {
    easy: [
      {
        question: "What is supply chain management?",
        options: ["Managing only suppliers", "Coordinating entire flow from raw materials to customers", "Managing only inventory", "Managing only delivery"],
        correctAnswer: 1,
        explanation: "Supply chain management involves coordinating and optimizing the entire flow of goods, services, and information from raw materials to end customers."
      }
    ],
    medium: [
      {
        question: "What is Just-in-Time (JIT) inventory?",
        options: ["Always having excess inventory", "Receiving inventory only when needed", "Annual inventory orders", "Random inventory timing"],
        correctAnswer: 1,
        explanation: "JIT is an inventory strategy where materials and products are received only when needed in the production process, reducing carrying costs and waste."
      },
      {
        question: "What is Six Sigma?",
        options: ["Six-step process", "Quality improvement methodology", "Six-month planning", "Six-person team"],
        correctAnswer: 1,
        explanation: "Six Sigma is a data-driven methodology for eliminating defects and improving processes by reducing variation and achieving near-perfect quality (99.99966% defect-free)."
      }
    ],
    hard: [
      {
        question: "What is the Theory of Constraints (TOC)?",
        options: ["Legal restrictions", "Methodology focusing on the weakest link", "Employee limitations", "Budget constraints"],
        correctAnswer: 1,
        explanation: "TOC is a methodology that identifies the most important limiting factor (constraint) in achieving a goal and systematically improves that constraint until it's no longer the limiting factor."
      }
    ]
  }
};

// Helper functions
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function getRandomQuestion(difficulty, category) {
  const questions = questionBank[category]?.[difficulty] || questionBank.general[difficulty];
  if (!questions || questions.length === 0) {
    return questionBank.general.medium[0]; // Fallback
  }
  const randomIndex = Math.floor(Math.random() * questions.length);
  return {
    ...questions[randomIndex],
    difficulty,
    category,
    timeLimit: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 30 : 20
  };
}

function initializePlayerStats(playerName) {
  if (!playerStats.has(playerName)) {
    playerStats.set(playerName, {
      questionsAnswered: 0,
      correctAnswers: 0,
      accuracy: 0,
      totalEarnings: 0,
      totalTime: 0,
      averageTime: 0
    });
  }
}

function updatePlayerStats(playerName, isCorrect, timeToAnswer) {
  const stats = playerStats.get(playerName);
  if (stats) {
    stats.questionsAnswered++;
    if (isCorrect) {
      stats.correctAnswers++;
      stats.totalEarnings += 100;
    }
    stats.totalTime += timeToAnswer;
    stats.accuracy = Math.round((stats.correctAnswers / stats.questionsAnswered) * 100);
    stats.averageTime = Math.round(stats.totalTime / stats.questionsAnswered);
    playerStats.set(playerName, stats);
  }
}

function getPlayerStatsForRoom(roomPlayers) {
  const roomStats = {};
  roomPlayers.forEach(player => {
    roomStats[player.name] = playerStats.get(player.name) || {
      questionsAnswered: 0,
      correctAnswers: 0,
      accuracy: 0,
      totalEarnings: 0,
      averageTime: 0
    };
  });
  return roomStats;
}

// Timer management
const timers = new Map();

function startQuestionTimer(roomCode, timeLimit) {
  if (timers.has(roomCode)) {
    clearInterval(timers.get(roomCode));
  }

  let timeLeft = timeLimit;
  const timer = setInterval(() => {
    timeLeft--;
    io.to(roomCode).emit('timerTick', timeLeft);
    
    if (timeLeft <= 0) {
      clearInterval(timer);
      timers.delete(roomCode);
      // Auto-submit if no answer given
      const room = rooms.get(roomCode);
      if (room && room.waitingForAnswer) {
        handleQuestionTimeout(roomCode);
      }
    }
  }, 1000);
  
  timers.set(roomCode, timer);
}

function handleQuestionTimeout(roomCode) {
  const room = rooms.get(roomCode);
  if (!room) return;

  const currentPlayer = room.players[room.currentPlayer];
  const question = room.currentQuestion;
  
  // Update stats for timeout (incorrect answer)
  updatePlayerStats(currentPlayer.name, false, question.timeLimit);
  
  io.to(roomCode).emit('answerResult', {
    correct: false,
    explanation: "Time's up! " + (question.explanation || ""),
    playerName: currentPlayer.name,
    timedOut: true
  });

  setTimeout(() => {
    room.waitingForAnswer = false;
    room.currentQuestion = null;
    room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
    io.to(roomCode).emit('gameUpdated', room);
    io.to(roomCode).emit('statsUpdated', getPlayerStatsForRoom(room.players));
  }, 3000);
}

// Socket connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createRoom', ({ playerName, difficulty = 'medium', category = 'general' }) => {
    const roomCode = generateRoomCode();
    const player = {
      id: socket.id,
      name: playerName,
      money: 1500,
      position: 0,
      properties: [],
      isHost: true
    };

    initializePlayerStats(playerName);

    const room = {
      code: roomCode,
      players: [player],
      gameStarted: false,
      currentPlayer: 0,
      difficulty,
      category,
      waitingForAnswer: false,
      currentQuestion: null,
      questionStartTime: null
    };

    rooms.set(roomCode, room);
    socket.join(roomCode);
    socket.emit('roomCreated', roomCode);
  });

  socket.on('joinRoom', ({ roomCode, playerName }) => {
    const room = rooms.get(roomCode);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.players.length >= 6) {
      socket.emit('error', 'Room is full');
      return;
    }

    if (room.gameStarted) {
      socket.emit('error', 'Game already started');
      return;
    }

    const player = {
      id: socket.id,
      name: playerName,
      money: 1500,
      position: 0,
      properties: [],
      isHost: false
    };

    initializePlayerStats(playerName);
    room.players.push(player);
    socket.join(roomCode);
    
    socket.emit('roomJoined', { roomCode, players: room.players });
    io.to(roomCode).emit('playersUpdated', room.players);
  });

  socket.on('changeDifficulty', ({ roomCode, difficulty }) => {
    const room = rooms.get(roomCode);
    if (room && !room.gameStarted) {
      room.difficulty = difficulty;
      io.to(roomCode).emit('settingsUpdated', { difficulty, category: room.category });
    }
  });

  socket.on('changeCategory', ({ roomCode, category }) => {
    const room = rooms.get(roomCode);
    if (room && !room.gameStarted) {
      room.category = category;
      io.to(roomCode).emit('settingsUpdated', { difficulty: room.difficulty, category });
    }
  });

  socket.on('startGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.gameStarted || room.players.length < 2) {
      return;
    }

    room.gameStarted = true;
    room.currentPlayer = 0;
    
    io.to(roomCode).emit('gameStarted', room);
    io.to(roomCode).emit('statsUpdated', getPlayerStatsForRoom(room.players));
  });

  socket.on('rollDice', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameStarted || room.waitingForAnswer) {
      return;
    }

    const currentPlayer = room.players[room.currentPlayer];
    if (currentPlayer.id !== socket.id) {
      return;
    }

    // Send question before allowing movement
    const question = getRandomQuestion(room.difficulty, room.category);
    room.currentQuestion = question;
    room.waitingForAnswer = true;
    room.questionStartTime = Date.now();

    io.to(roomCode).emit('questionReceived', question);
    startQuestionTimer(roomCode, question.timeLimit);
  });

  socket.on('answerQuestion', ({ roomCode, answerIndex }) => {
    const room = rooms.get(roomCode);
    if (!room || !room.waitingForAnswer || !room.currentQuestion) {
      return;
    }

    const currentPlayer = room.players[room.currentPlayer];
    if (currentPlayer.id !== socket.id) {
      return;
    }

    // Clear timer
    if (timers.has(roomCode)) {
      clearInterval(timers.get(roomCode));
      timers.delete(roomCode);
    }

    const question = room.currentQuestion;
    const isCorrect = answerIndex === question.correctAnswer;
    const timeToAnswer = Math.round((Date.now() - room.questionStartTime) / 1000);

    // Update player stats
    updatePlayerStats(currentPlayer.name, isCorrect, timeToAnswer);

    if (isCorrect) {
      currentPlayer.money += 100;
      
      // Roll dice and move
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const totalRoll = dice1 + dice2;
      
      currentPlayer.position = (currentPlayer.position + totalRoll) % 40;
      
      io.to(roomCode).emit('answerResult', {
        correct: true,
        explanation: question.explanation,
        playerName: currentPlayer.name,
        diceRoll: totalRoll,
        newPosition: currentPlayer.position
      });
    } else {
      io.to(roomCode).emit('answerResult', {
        correct: false,
        explanation: question.explanation,
        playerName: currentPlayer.name
      });
    }

    // Move to next player after showing results
    setTimeout(() => {
      room.waitingForAnswer = false;
      room.currentQuestion = null;
      room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
      io.to(roomCode).emit('gameUpdated', room);
      io.to(roomCode).emit('statsUpdated', getPlayerStatsForRoom(room.players));
    }, 3000);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find and update rooms where this player was present
    for (const [roomCode, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          // Clean up empty room
          if (timers.has(roomCode)) {
            clearInterval(timers.get(roomCode));
            timers.delete(roomCode);
          }
          rooms.delete(roomCode);
        } else {
          // Assign new host if needed
          if (room.players.length > 0 && !room.players.find(p => p.isHost)) {
            room.players[0].isHost = true;
          }
          
          // Adjust current player if needed
          if (room.currentPlayer >= room.players.length) {
            room.currentPlayer = 0;
          }
          
          io.to(roomCode).emit('playersUpdated', room.players);
          if (room.gameStarted) {
            io.to(roomCode).emit('gameUpdated', room);
          }
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});