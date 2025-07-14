const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [
      "https://business-monopoly-client-pzb9.vercel.app",  // 
      "http://localhost:3000",                     // For local testing
      "http://localhost:5173"                      // Common Vite port
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

app.use(cors({
  origin: [
    "https://business-monopoly-client-pzb9.vercel.app",  // 
    "http://localhost:3000",
    "http://localhost:5173"
  ],
  credentials: true
}));
app.use(express.json());

// Game rooms storage
const rooms = new Map();
const playerStats = new Map();

// Monopoly board properties
const boardSpaces = [
  { name: 'GO', type: 'corner', color: '', price: 0, rent: [0], group: '' },
  { name: 'Old Kent Road', type: 'property', color: 'brown', price: 60, rent: [2, 10, 30, 90, 160, 250], group: 'brown' },
  { name: 'Community Chest', type: 'chest', color: '', price: 0, rent: [0], group: '' },
  { name: 'Whitechapel Road', type: 'property', color: 'brown', price: 60, rent: [4, 20, 60, 180, 320, 450], group: 'brown' },
  { name: 'Income Tax', type: 'tax', color: '', price: 0, rent: [200], group: '' },
  { name: "King's Cross Station", type: 'station', color: 'black', price: 200, rent: [25, 50, 100, 200], group: 'station' },
  { name: 'The Angel Islington', type: 'property', color: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue' },
  { name: 'Chance', type: 'chance', color: '', price: 0, rent: [0], group: '' },
  { name: 'Euston Road', type: 'property', color: 'lightblue', price: 100, rent: [6, 30, 90, 270, 400, 550], group: 'lightblue' },
  { name: 'Pentonville Road', type: 'property', color: 'lightblue', price: 120, rent: [8, 40, 100, 300, 450, 600], group: 'lightblue' },
  { name: 'Jail', type: 'corner', color: '', price: 0, rent: [0], group: '' },
  { name: 'Pall Mall', type: 'property', color: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink' },
  { name: 'Electric Company', type: 'utility', color: 'yellow', price: 150, rent: [0], group: 'utility' },
  { name: 'Whitehall', type: 'property', color: 'pink', price: 140, rent: [10, 50, 150, 450, 625, 750], group: 'pink' },
  { name: 'Northumberland Avenue', type: 'property', color: 'pink', price: 160, rent: [12, 60, 180, 500, 700, 900], group: 'pink' },
  { name: 'Marylebone Station', type: 'station', color: 'black', price: 200, rent: [25, 50, 100, 200], group: 'station' },
  { name: 'Bow Street', type: 'property', color: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange' },
  { name: 'Community Chest', type: 'chest', color: '', price: 0, rent: [0], group: '' },
  { name: 'Marlborough Street', type: 'property', color: 'orange', price: 180, rent: [14, 70, 200, 550, 750, 950], group: 'orange' },
  { name: 'Vine Street', type: 'property', color: 'orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], group: 'orange' },
  { name: 'Free Parking', type: 'corner', color: '', price: 0, rent: [0], group: '' },
  { name: 'The Strand', type: 'property', color: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red' },
  { name: 'Chance', type: 'chance', color: '', price: 0, rent: [0], group: '' },
  { name: 'Fleet Street', type: 'property', color: 'red', price: 220, rent: [18, 90, 250, 700, 875, 1050], group: 'red' },
  { name: 'Trafalgar Square', type: 'property', color: 'red', price: 240, rent: [20, 100, 300, 750, 925, 1100], group: 'red' },
  { name: 'Fenchurch St Station', type: 'station', color: 'black', price: 200, rent: [25, 50, 100, 200], group: 'station' },
  { name: 'Leicester Square', type: 'property', color: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow' },
  { name: 'Coventry Street', type: 'property', color: 'yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], group: 'yellow' },
  { name: 'Water Works', type: 'utility', color: 'yellow', price: 150, rent: [0], group: 'utility' },
  { name: 'Piccadilly', type: 'property', color: 'yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], group: 'yellow' },
  { name: 'Go To Jail', type: 'corner', color: '', price: 0, rent: [0], group: '' },
  { name: 'Regent Street', type: 'property', color: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green' },
  { name: 'Oxford Street', type: 'property', color: 'green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], group: 'green' },
  { name: 'Community Chest', type: 'chest', color: '', price: 0, rent: [0], group: '' },
  { name: 'Bond Street', type: 'property', color: 'green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], group: 'green' },
  { name: 'Liverpool St Station', type: 'station', color: 'black', price: 200, rent: [25, 50, 100, 200], group: 'station' },
  { name: 'Chance', type: 'chance', color: '', price: 0, rent: [0], group: '' },
  { name: 'Park Lane', type: 'property', color: 'blue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], group: 'blue' },
  { name: 'Super Tax', type: 'tax', color: '', price: 0, rent: [100], group: '' },
  { name: 'Mayfair', type: 'property', color: 'blue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], group: 'blue' }
];

// Enhanced question bank with categories, difficulties, and explanations based on T Level textbook
const questionBank = {
  // Change Management Questions
  change_management: {
    easy: [
      {
        question: "What are the two main types of drivers for organizational change?",
        options: ["Internal and external", "Planned and unplanned", "Financial and operational", "Strategic and tactical"],
        correctAnswer: 0,
        explanation: "Organizational change can be driven by internal factors (within the company) or external factors (outside the company's control) such as government policy or market changes."
      },
      {
        question: "What does SWOT analysis stand for?",
        options: ["Systems, Work, Operations, Technology", "Strengths, Weaknesses, Opportunities, Threats", "Strategic, Workplace, Organizational, Teams", "Skills, Workforce, Objectives, Tasks"],
        correctAnswer: 1,
        explanation: "SWOT analysis is a strategic planning tool that examines internal Strengths and Weaknesses, and external Opportunities and Threats."
      },
      {
        question: "What is resistance to change?",
        options: ["When employees welcome new ideas", "When people are reluctant to accept changes", "When management implements changes quickly", "When changes are successful"],
        correctAnswer: 1,
        explanation: "Resistance to change occurs when individuals or groups are reluctant to accept or adapt to new ways of working, often due to fear of the unknown."
      }
    ],
    medium: [
      {
        question: "According to Kotter's 8-Step Model, what is the first step in change management?",
        options: ["Build the team", "Develop the vision", "Increase urgency", "Communicate for buy-in"],
        correctAnswer: 2,
        explanation: "Kotter's first step is to 'Increase urgency' by identifying potential threats and exploring opportunities for action to create a sense of urgency for change."
      },
      {
        question: "In PESTLE analysis, what does the 'E' represent?",
        options: ["Economic and Environmental", "External and Ethical", "Economic only", "Environmental only"],
        correctAnswer: 0,
        explanation: "PESTLE analysis examines Political, Economic, Social, Technological, Legal, and Environmental factors. The 'E' covers both Economic and Environmental factors."
      },
      {
        question: "What are the three phases in Lewin's Change Management Model?",
        options: ["Plan, Do, Review", "Unfreeze, Change, Refreeze", "Initiate, Implement, Evaluate", "Analyze, Act, Assess"],
        correctAnswer: 1,
        explanation: "Lewin's model involves Unfreezing (preparing for change), Change (implementing the change), and Refreezing (establishing the new way as normal)."
      }
    ],
    hard: [
      {
        question: "What does the ADKAR model focus on?",
        options: ["Organizational systems", "Individual change journey", "Financial planning", "Strategic planning"],
        correctAnswer: 1,
        explanation: "ADKAR focuses on how individuals travel through change: Awareness, Desire, Knowledge, Ability, and Reinforcement, emphasizing the human side of change."
      },
      {
        question: "In the McKinsey 7-S Model, which elements are considered 'soft' elements?",
        options: ["Strategy, Structure, Systems", "Shared values, Skills, Style, Staff", "All seven elements equally", "Only shared values"],
        correctAnswer: 1,
        explanation: "The McKinsey 7-S Model divides elements into hard (Strategy, Structure, Systems) and soft (Shared values, Skills, Style, Staff) elements."
      }
    ]
  },

  // Project Management Questions
  project_management: {
    easy: [
      {
        question: "What are the four stages of the project lifecycle?",
        options: ["Plan, Build, Test, Deploy", "Initiation, Planning, Execution, Closure", "Research, Design, Develop, Deliver", "Start, Middle, End, Review"],
        correctAnswer: 1,
        explanation: "The project lifecycle consists of Initiation (starting the project), Planning (detailed planning), Execution (doing the work), and Closure (completing and reviewing)."
      },
      {
        question: "What does PRINCE stand for in project management?",
        options: ["Projects in Controlled Environments", "Primary Resource in Creative Enterprises", "Planned Resources in Corporate Environments", "Professional Resource Integration"],
        correctAnswer: 0,
        explanation: "PRINCE stands for PRojects IN Controlled Environments, a structured project management methodology used worldwide."
      },
      {
        question: "What is a milestone in project management?",
        options: ["A long task", "A checkpoint marking significant progress", "The project budget", "A team member"],
        correctAnswer: 1,
        explanation: "A milestone is a checkpoint that highlights significant progress, achievement, or event toward the project goal, helping track progress."
      }
    ],
    medium: [
      {
        question: "What is the main focus of Six Sigma methodology?",
        options: ["Increasing revenue", "Improving processes and reducing errors", "Hiring more staff", "Expanding markets"],
        correctAnswer: 1,
        explanation: "Six Sigma aims to improve business processes, reduce waste and errors, and increase customer satisfaction through data-driven analysis."
      },
      {
        question: "In Agile project management, what are 'sprints'?",
        options: ["Long-term goals", "Short development cycles", "Budget reviews", "Team meetings"],
        correctAnswer: 1,
        explanation: "Sprints are short, time-boxed iterations (usually 2 weeks) where teams work to complete specific goals in Agile methodology."
      },
      {
        question: "What is Critical Path Analysis (CPA) used for?",
        options: ["Managing budgets", "Identifying the longest sequence of tasks", "Hiring staff", "Marketing products"],
        correctAnswer: 1,
        explanation: "CPA identifies the critical path - the longest sequence of dependent tasks that determines the minimum project duration."
      }
    ],
    hard: [
      {
        question: "What is the Pareto Principle in project management?",
        options: ["All tasks are equally important", "80% of consequences come from 20% of causes", "Projects should take 80% of available time", "Teams should be 80% efficient"],
        correctAnswer: 1,
        explanation: "The Pareto Principle (80/20 rule) suggests that 80% of problems typically come from 20% of causes, helping teams focus on the most impactful issues."
      },
      {
        question: "In SCRUM methodology, what is the role of the SCRUM Master?",
        options: ["Makes all project decisions", "Facilitates the process and removes obstacles", "Writes all the code", "Manages the budget"],
        correctAnswer: 1,
        explanation: "The SCRUM Master facilitates the SCRUM process, helps remove obstacles, keeps the team on track, and coaches team members when needed."
      }
    ]
  },

  // Business Research Questions
  business_research: {
    easy: [
      {
        question: "What is primary research?",
        options: ["Research done by universities", "Original research conducted for a specific purpose", "Research that's most important", "Research done first"],
        correctAnswer: 1,
        explanation: "Primary research is original research conducted by a business for their specific needs, such as surveys, interviews, or observations."
      },
      {
        question: "What is the difference between qualitative and quantitative data?",
        options: ["No difference", "Qualitative is opinions, quantitative is numbers", "Qualitative is faster to collect", "Quantitative is always better"],
        correctAnswer: 1,
        explanation: "Qualitative data includes opinions, views, and thoughts, while quantitative data involves numbers and statistical information."
      },
      {
        question: "What is market research used for?",
        options: ["Only to increase prices", "To understand customer needs and wants", "To reduce staff", "To close businesses"],
        correctAnswer: 1,
        explanation: "Market research helps businesses understand customer needs, wants, and preferences to make informed decisions about products and services."
      }
    ],
    medium: [
      {
        question: "What is a focus group?",
        options: ["A large survey", "A small group discussing specific topics", "Individual interviews", "Online research"],
        correctAnswer: 1,
        explanation: "A focus group is a small group of people brought together to discuss and provide feedback on specific topics, products, or services."
      },
      {
        question: "What are the advantages of secondary research?",
        options: ["More expensive than primary", "Quick and readily available", "Always up to date", "Only available to large companies"],
        correctAnswer: 1,
        explanation: "Secondary research uses existing data and information, making it quick to access, readily available, and typically less expensive than primary research."
      },
      {
        question: "What is web analytics used for?",
        options: ["Creating websites", "Measuring website performance and user behavior", "Designing graphics", "Writing content"],
        correctAnswer: 1,
        explanation: "Web analytics involves collecting, measuring, and analyzing web data to understand website usage, visitor behavior, and effectiveness."
      }
    ],
    hard: [
      {
        question: "How can validity and reliability be ensured in research?",
        options: ["By using only primary research", "By asking relevant, unbiased questions and using appropriate methods", "By collecting as much data as possible", "By using only quantitative methods"],
        correctAnswer: 1,
        explanation: "Validity and reliability are ensured by using appropriate research methods, asking relevant and unbiased questions, and ensuring data is suitable for its intended purpose."
      },
      {
        question: "What is triangulation in research?",
        options: ["Using three researchers", "Using multiple methods to validate findings", "Conducting research in three locations", "Taking three months to complete"],
        correctAnswer: 1,
        explanation: "Triangulation involves using multiple research methods or sources to validate findings and increase the reliability and validity of research results."
      }
    ]
  },

  // Innovation and Improvement Questions
  innovation_improvement: {
    easy: [
      {
        question: "What is continuous improvement?",
        options: ["Making one big change", "Constantly looking for ways to improve", "Changing everything at once", "Avoiding any changes"],
        correctAnswer: 1,
        explanation: "Continuous improvement involves constantly seeking ways to enhance business processes, products, and services to remain competitive and efficient."
      },
      {
        question: "What is Kaizen?",
        options: ["A Japanese car company", "A continuous improvement philosophy", "A type of technology", "A management style"],
        correctAnswer: 1,
        explanation: "Kaizen is a Japanese business philosophy focusing on gradual, continuous improvement involving all employees from management to workers."
      },
      {
        question: "Why is innovation important for businesses?",
        options: ["It's not important", "It helps businesses stay competitive", "It's only for tech companies", "It's too expensive"],
        correctAnswer: 1,
        explanation: "Innovation helps businesses adapt to changing markets, stay competitive, improve efficiency, and meet evolving customer needs."
      }
    ],
    medium: [
      {
        question: "What is the difference between sustaining and disruptive innovation?",
        options: ["No difference", "Sustaining improves existing products, disruptive creates new markets", "Sustaining is cheaper", "Disruptive is always better"],
        correctAnswer: 1,
        explanation: "Sustaining innovation improves existing products for current customers, while disruptive innovation creates new markets or business models."
      },
      {
        question: "What are the benefits of Total Quality Management (TQM)?",
        options: ["Higher costs", "Improved quality and customer satisfaction", "More complexity", "Slower processes"],
        correctAnswer: 1,
        explanation: "TQM focuses on improving quality, reducing errors, increasing customer satisfaction, and involving all employees in quality improvement."
      }
    ],
    hard: [
      {
        question: "How can businesses create a culture of continuous improvement?",
        options: ["By avoiding change", "By encouraging employee involvement and learning from mistakes", "By punishing errors", "By focusing only on profits"],
        correctAnswer: 1,
        explanation: "A culture of continuous improvement requires encouraging employee involvement, learning from mistakes, celebrating improvements, and supporting innovation."
      }
    ]
  },

  // CHAPTER 3 - Quality and compliance
  quality_compliance: {
    easy: [
      {
        question: "What is the difference between maintaining quality and improving quality?",
        options: ["No difference", "Maintaining keeps current standards, improving raises them", "Improving is cheaper", "Maintaining is only for large companies"],
        correctAnswer: 1,
        explanation: "Maintaining quality ensures current standards don't deteriorate, while improving quality involves planned efforts to raise standards beyond current levels."
      },
      {
        question: "What does BSI stand for?",
        options: ["British Safety Institute", "British Standards Institution", "Business Standards International", "Basic Safety Instructions"],
        correctAnswer: 1,
        explanation: "BSI stands for British Standards Institution, the UK's national standards body founded in 1901."
      },
      {
        question: "What is quality assurance?",
        options: ["A one-time check", "A process to ensure quality standards are maintained", "Only for manufacturing", "A type of insurance"],
        correctAnswer: 1,
        explanation: "Quality assurance is a process or system followed to ensure the quality of services or products is maintained and meets quality standards."
      },
      {
        question: "What does the BSI Kitemark represent?",
        options: ["A company logo", "Proof of quality standards", "A safety warning", "A price guarantee"],
        correctAnswer: 1,
        explanation: "The BSI Kitemark is a symbol that confirms a product or service meets the standard set by the British Standards Institution."
      },
      {
        question: "How many types of quality audits are there?",
        options: ["Two", "Three", "Four", "Five"],
        correctAnswer: 1,
        explanation: "There are three types of quality audits: first-party (internal), second-party (customer), and third-party (independent)."
      },
      {
        question: "What does ISO stand for?",
        options: ["International Safety Organization", "International Standards Organization", "Internal Systems Operation", "Industrial Safety Office"],
        correctAnswer: 1,
        explanation: "ISO stands for International Organization for Standardization, an independent, non-governmental international organization."
      },
      {
        question: "What is a process checklist used for?",
        options: ["Shopping lists", "Ensuring all steps are followed correctly", "Employee schedules", "Budget planning"],
        correctAnswer: 1,
        explanation: "Process checklists provide evidence that each step in a process is followed and completed in the correct order."
      },
      {
        question: "What does PDSA stand for?",
        options: ["Plan-Do-Study-Act", "Plan-Develop-Study-Analyze", "Prepare-Do-See-Act", "Plan-Design-Study-Apply"],
        correctAnswer: 0,
        explanation: "PDSA stands for Plan-Do-Study-Act, a cyclical method for quality improvement based on the Kaizen method."
      }
    ],
    medium: [
      {
        question: "What are the key differences between public and private sector quality approaches in terms of budgeting?",
        options: ["No differences", "Private sector can move money between departments more easily", "Public sector has unlimited budgets", "Private sector doesn't need budgets"],
        correctAnswer: 1,
        explanation: "Private sector organizations can move money between departments if there's a case for increasing quality activities, while public sector budgets are more constrained by government allocation."
      },
      {
        question: "Which of the following is NOT a benefit of quality improvement?",
        options: ["Increased customer satisfaction", "Reduced costs", "Higher employee turnover", "Enhanced reputation"],
        correctAnswer: 2,
        explanation: "Higher employee turnover is not a benefit of quality improvement. Quality improvement typically leads to increased customer satisfaction, reduced costs, and enhanced reputation."
      },
      {
        question: "What is the purpose of documentary standards?",
        options: ["To create documents", "To ensure standard interpretation of terms", "To store files", "To print papers"],
        correctAnswer: 1,
        explanation: "Documentary standards ensure there is a standard interpretation of terms, components, definitions, and materials across industries."
      },
      {
        question: "What does EFQM focus on?",
        options: ["Setting mandatory standards", "Business excellence through self-assessment", "Government regulations", "Financial auditing"],
        correctAnswer: 1,
        explanation: "EFQM focuses on business excellence and provides a framework for organizations to assess their performance and manage change, rather than setting mandatory standards."
      },
      {
        question: "What is the main purpose of regulatory bodies?",
        options: ["Make profits", "Set and monitor compliance with standards", "Provide training", "Sell products"],
        correctAnswer: 1,
        explanation: "Regulatory bodies are appointed by governments to set standards that organizations must meet and monitor compliance through inspections and audits."
      },
      {
        question: "What can happen if an organization fails to comply with regulatory requirements?",
        options: ["Nothing happens", "Criminal proceedings, fines, or business closure", "Just a warning", "Only paperwork issues"],
        correctAnswer: 1,
        explanation: "Failure to comply with regulatory requirements can result in serious consequences including criminal proceedings, large fines, or inability to operate."
      },
      {
        question: "What is benchmarking in quality management?",
        options: ["Setting up furniture", "Comparing performance against competitors or best practices", "Making benchmarks", "Creating standards"],
        correctAnswer: 1,
        explanation: "Benchmarking involves comparing an organization's performance against competitors or industry best practices to identify areas for improvement."
      },
      {
        question: "What is the primary purpose of cause and effect analysis?",
        options: ["To assign blame", "To visually identify problem causes and solutions", "To create diagrams", "To eliminate employees"],
        correctAnswer: 1,
        explanation: "Cause and effect analysis uses visual representation to help identify the root causes of problems and develop appropriate solutions."
      }
    ],
    hard: [
      {
        question: "How does accountability in quality management differ between public and private sectors?",
        options: ["No difference", "Private sector has clearer accountability lines due to simpler structures", "Public sector is always more accountable", "Private sector has no accountability"],
        correctAnswer: 1,
        explanation: "Private sector organizations typically have clearer accountability lines due to simpler organizational structures and common purpose, while public sector accountability can be complex due to multiple stakeholders and reporting lines."
      },
      {
        question: "What is the relationship between ISO 9001 and BS 5750?",
        options: ["They are unrelated", "ISO 9001 was based on the BSI standard BS 5750", "BS 5750 copied ISO 9001", "They are identical"],
        correctAnswer: 1,
        explanation: "The first version of ISO 9001 Quality Management was based on the BSI standard BS 5750, demonstrating how national standards can become templates for international standards."
      },
      {
        question: "What powers do regulatory authorities typically have?",
        options: ["Only advisory powers", "Prohibition notices, closure, and suspension", "Just recommendation powers", "No enforcement powers"],
        correctAnswer: 1,
        explanation: "Regulatory authorities have significant enforcement powers including issuing prohibition notices, ordering closures, and suspending operations when organizations fail to comply with standards."
      },
      {
        question: "How does the EFQM Excellence Model differ from BSI and ISO approaches?",
        options: ["No difference", "EFQM provides a framework for assessment rather than setting specific standards", "EFQM only works in Europe", "EFQM is mandatory"],
        correctAnswer: 1,
        explanation: "Unlike BSI and ISO which set specific standards, EFQM provides a framework that organizations can use to assess their performance and manage change, focusing on business excellence rather than compliance."
      },
      {
        question: "What is the significance of the fishbone diagram in quality management?",
        options: ["It's just decorative", "It provides visual analysis of root causes and their relationships", "It's only for fish processing", "It replaces all other quality tools"],
        correctAnswer: 1,
        explanation: "The fishbone diagram is a cause and effect analysis tool that visually represents problems and their potential causes, helping teams systematically identify root causes and solutions."
      },
      {
        question: "How do first-party, second-party, and third-party audits differ in their objectivity and purpose?",
        options: ["They are all the same", "First-party is internal self-assessment, second-party is customer-driven, third-party is independent", "Only third-party audits matter", "First-party is most objective"],
        correctAnswer: 1,
        explanation: "First-party audits are internal self-assessments, second-party audits are conducted by or for customers, and third-party audits are independent assessments, each serving different purposes with varying levels of objectivity."
      }
    ]
  },

  // CHAPTER 5 - Policies and procedures
  policies_procedures: {
    easy: [
      {
        question: "What is the difference between a policy and a procedure?",
        options: ["No difference", "Policy sets direction, procedure gives specific steps", "Procedures are more important", "Policies are always longer"],
        correctAnswer: 1,
        explanation: "A policy provides formal guidance on what should be done to achieve aims and objectives, while procedures outline the specific steps employees must follow."
      },
      {
        question: "What does KPI stand for?",
        options: ["Key Performance Indicator", "Key Process Information", "Key Policy Implementation", "Key Personnel Index"],
        correctAnswer: 0,
        explanation: "KPI stands for Key Performance Indicator, which measures performance over time for specific objectives."
      },
      {
        question: "What are the three main sectors of the economy?",
        options: ["Big, medium, small", "Public, private, not-for-profit", "Local, national, international", "Manufacturing, service, retail"],
        correctAnswer: 1,
        explanation: "The three main sectors are public sector (government-funded), private sector (profit-making), and not-for-profit organizations."
      },
      {
        question: "What is workflow?",
        options: ["Employee schedules", "The order work passes through from start to finish", "Water flow in offices", "Computer programs"],
        correctAnswer: 1,
        explanation: "Workflow is the order in which a piece of work passes through from the start of a procedure to its completion."
      },
      {
        question: "What does RAG rating stand for?",
        options: ["Red-Amber-Green", "Risk Assessment Guide", "Rapid Action Group", "Regional Analysis Grid"],
        correctAnswer: 0,
        explanation: "RAG rating stands for Red-Amber-Green, a traffic light system for assessing performance against targets."
      },
      {
        question: "What is the purpose of version control in policies?",
        options: ["To confuse people", "To track changes and updates", "To make documents longer", "To increase costs"],
        correctAnswer: 1,
        explanation: "Version control tracks changes and updates to policies and procedures, ensuring everyone uses the current version."
      },
      {
        question: "What is cascading in the context of KPIs?",
        options: ["Water falling", "Passing information from one level to another", "Deleting information", "Creating confusion"],
        correctAnswer: 1,
        explanation: "Cascading is the process of passing information from one organizational level to another until everyone who needs it has received it."
      },
      {
        question: "What is a stakeholder?",
        options: ["Someone who owns stakes", "Anyone with an interest in the company", "Only shareholders", "Only employees"],
        correctAnswer: 1,
        explanation: "A stakeholder is any individual or group with an interest in the company, including employees, customers, suppliers, and shareholders."
      }
    ],
    medium: [
      {
        question: "What are the key characteristics that a good policy should have?",
        options: ["Long and complex", "Clear, understandable, concise, and up-to-date", "Vague and flexible", "Technical and confusing"],
        correctAnswer: 1,
        explanation: "Good policies should be written in plain language, be concise, reflect current legal requirements, and provide clear understanding of what is and isn't allowed."
      },
      {
        question: "What is the difference between flexible and inflexible policies?",
        options: ["Flexible policies can be adjusted by management, inflexible ones cannot", "No difference", "Inflexible policies are better", "Flexible policies are illegal"],
        correctAnswer: 0,
        explanation: "Flexible policies can be reviewed and adjusted when needed by senior management, while inflexible policies must be adhered to without change, often due to legal or regulatory requirements."
      },
      {
        question: "What are the three main types of KPIs mentioned in the text?",
        options: ["Easy, medium, hard", "Strategic, financial, operational", "Internal, external, mixed", "Daily, weekly, monthly"],
        correctAnswer: 1,
        explanation: "The three main types of KPIs are strategic (overall success), financial (monetary terms), and operational (day-to-day work activities)."
      },
      {
        question: "What is the purpose of competitive market analysis?",
        options: ["To copy competitors", "To research competitors' products, marketing, and sales to improve performance", "To sabotage competitors", "To merge with competitors"],
        correctAnswer: 1,
        explanation: "Competitive market analysis involves researching competitors to identify where they outperform you and where you can improve your own products and methods."
      },
      {
        question: "What should be included in the layout of policies and procedures?",
        options: ["Only the title", "Title, purpose, scope, roles and responsibilities, and version control", "Just the procedures", "Only legal requirements"],
        correctAnswer: 1,
        explanation: "Policies and procedures should include title, purpose, scope, roles and responsibilities, steps, and version control as minimum requirements."
      },
      {
        question: "What is the difference between quantitative and qualitative KPIs?",
        options: ["No difference", "Quantitative uses numbers, qualitative uses opinions/experience", "Qualitative is better", "Quantitative is only for finance"],
        correctAnswer: 1,
        explanation: "Quantitative KPIs measure numbers and countable data, while qualitative KPIs are based on opinions, experience, and subjective assessments."
      },
      {
        question: "What are the main steps in developing a policy?",
        options: ["Just write it", "Identify need, justify, assign responsibility, consult stakeholders, research", "Copy from competitors", "Ask employees only"],
        correctAnswer: 1,
        explanation: "Policy development involves identifying the need, justifying it, assigning responsibility, consulting with stakeholders and end users, and researching best practices."
      },
      {
        question: "What is the difference between lagging and leading KPIs?",
        options: ["No difference", "Lagging measures past results, leading predicts future outcomes", "Leading is always better", "Lagging is for large companies only"],
        correctAnswer: 1,
        explanation: "Lagging KPIs measure whether past events or changes resulted in improvement, while leading KPIs predict or forecast likely outcomes from changes."
      }
    ],
    hard: [
      {
        question: "How do mandatory and non-mandatory policies differ in their legal implications and organizational flexibility?",
        options: ["They are identical", "Mandatory policies have legal/regulatory requirements and less flexibility, non-mandatory can be changed more easily", "Non-mandatory policies are always better", "Only large companies need mandatory policies"],
        correctAnswer: 1,
        explanation: "Mandatory policies are required by law or regulation with serious consequences for non-compliance and limited flexibility, while non-mandatory policies can be adapted by organizations as needed."
      },
      {
        question: "What is the relationship between cost-effect analysis, process flow analysis, and logic models in KPI measurement?",
        options: ["They are unrelated", "They are different models for indirectly measuring KPIs when direct measurement isn't possible", "Only cost-effect analysis matters", "They replace KPIs entirely"],
        correctAnswer: 1,
        explanation: "These are different analytical models used when KPIs cannot be measured directly, each providing different approaches to obtain data through indirect measurement methods."
      },
      {
        question: "How do the policy development processes differ between for-profit, not-for-profit, and social enterprise organizations?",
        options: ["No differences", "Each type has different priorities and stakeholder considerations affecting policy focus", "Only for-profit organizations need policies", "All organizations use identical policies"],
        correctAnswer: 1,
        explanation: "Different organization types have varying purposes (profit vs. social benefit), stakeholders, and regulatory requirements, leading to different policy priorities and development approaches."
      },
      {
        question: "What is the significance of performance monitoring processes in validating KPI effectiveness?",
        options: ["Performance monitoring is unnecessary", "It ensures KPIs actually measure what they're supposed to and remain relevant", "It only applies to employee performance", "It's just paperwork"],
        correctAnswer: 1,
        explanation: "Performance monitoring processes validate that KPIs are achieving expected outcomes, measuring relevant aspects, and remaining current with organizational needs."
      },
      {
        question: "How do inputs, process, and outputs KPIs work together to provide comprehensive performance measurement?",
        options: ["They work independently", "They provide a complete view by measuring resources, activities, and results respectively", "Only outputs matter", "They measure the same things"],
        correctAnswer: 1,
        explanation: "Input KPIs measure resources needed, process KPIs monitor performance of activities, and output KPIs measure results, providing comprehensive coverage of the entire process."
      },
      {
        question: "What are the potential negative impacts of poorly designed policies and procedures on both staff and organizations?",
        options: ["No negative impacts", "Can cause confusion, delays, legal issues, employee dissatisfaction, and regulatory non-compliance", "Only affects small companies", "Only impacts are positive"],
        correctAnswer: 1,
        explanation: "Poorly designed policies can lead to staff confusion, delays, mistakes, dissatisfaction, legal non-compliance, fines, reputational damage, and loss of customers or employees."
      },
      {
        question: "How does the updating and maintenance cycle of policies and procedures ensure continuous organizational effectiveness?",
        options: ["It doesn't matter", "Regular review identifies issues, incorporates changes, and maintains relevance to current needs", "Policies should never change", "Only yearly updates are needed"],
        correctAnswer: 1,
        explanation: "Regular review and maintenance ensures policies remain effective, incorporate internal and external changes, address emerging issues, and continue to support organizational objectives."
      }
    ]
  },

  // General Business Questions
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
      }
    ],
    medium: [
      {
        question: "What is sustainability in business?",
        options: ["Making quick profits", "Meeting present needs without compromising future generations", "Expanding rapidly", "Reducing workforce"],
        correctAnswer: 1,
        explanation: "Business sustainability involves operating in ways that meet current needs while preserving resources and opportunities for future generations."
      }
    ],
    hard: [
      {
        question: "How do external factors influence business strategy?",
        options: ["They don't influence strategy", "They require businesses to adapt and respond to maintain competitiveness", "They only affect large companies", "They are easy to control"],
        correctAnswer: 1,
        explanation: "External factors like economic conditions, regulations, and market changes require businesses to adapt their strategies to remain competitive and viable."
      }
    ]
  }
};

// Helper functions
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

function getRandomQuestion() {
  // Flatten all questions from all categories and difficulties into one array
  const allQuestions = [];
  
  Object.keys(questionBank).forEach(category => {
    Object.keys(questionBank[category]).forEach(difficulty => {
      questionBank[category][difficulty].forEach(question => {
        allQuestions.push({
          ...question,
          category,
          difficulty,
          timeLimit: difficulty === 'easy' ? 45 : difficulty === 'medium' ? 30 : 20
        });
      });
    });
  });
  
  if (allQuestions.length === 0) {
    // Fallback question if no questions are available
    return {
      question: "What does ROI stand for?",
      options: ["Return on Investment", "Rate of Interest", "Risk of Investment", "Revenue of Income"],
      correctAnswer: 0,
      explanation: "ROI (Return on Investment) measures the efficiency of an investment by comparing the gain or loss relative to its cost.",
      category: 'general',
      difficulty: 'medium',
      timeLimit: 30
    };
  }
  
  const randomIndex = Math.floor(Math.random() * allQuestions.length);
  return allQuestions[randomIndex];
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

function calculateRent(propertyIndex, owner, properties, diceTotal = 0) {
  const space = boardSpaces[propertyIndex];
  const property = properties.find(p => p.index === propertyIndex);
  
  if (!property || !owner) return 0;
  
  if (space.type === 'utility') {
    const utilityCount = properties.filter(p => 
      boardSpaces[p.index].group === 'utility' && p.owner === owner
    ).length;
    return utilityCount === 1 ? diceTotal * 4 : diceTotal * 10;
  }
  
  if (space.type === 'station') {
    const stationCount = properties.filter(p => 
      boardSpaces[p.index].group === 'station' && p.owner === owner
    ).length;
    return space.rent[stationCount - 1] || 0;
  }
  
  if (space.type === 'property') {
    const groupProperties = properties.filter(p => 
      boardSpaces[p.index].group === space.group && p.owner === owner
    );
    const groupSize = boardSpaces.filter(s => s.group === space.group).length;
    const ownsFullGroup = groupProperties.length === groupSize;
    
    if (property.hotel) return space.rent[5];
    if (property.houses > 0) return space.rent[property.houses];
    if (ownsFullGroup) return space.rent[1]; // Double rent for full group
    return space.rent[0]; // Base rent
  }
  
  return 0;
}

function canBuildHouses(propertyIndex, owner, properties) {
  const space = boardSpaces[propertyIndex];
  if (space.type !== 'property') return false;
  
  const groupProperties = properties.filter(p => 
    boardSpaces[p.index].group === space.group && p.owner === owner
  );
  const groupSize = boardSpaces.filter(s => s.group === space.group).length;
  
  return groupProperties.length === groupSize; // Must own full color group
}

function initializeProperties() {
  return boardSpaces.map((space, index) => ({
    index,
    owner: null,
    houses: 0,
    hotel: false,
    mortgaged: false
  }));
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

  socket.on('createRoom', ({ playerName }) => {
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
      waitingForAnswer: false,
      currentQuestion: null,
      questionStartTime: null,
      properties: initializeProperties(),
      gamePhase: 'question'
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

  socket.on('startGame', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.gameStarted || room.players.length < 2) {
      return;
    }

    room.gameStarted = true;
    room.currentPlayer = 0;
    room.gamePhase = 'question';
    
    io.to(roomCode).emit('gameStarted', room);
    io.to(roomCode).emit('statsUpdated', getPlayerStatsForRoom(room.players));
  });

  socket.on('startTurn', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameStarted || room.waitingForAnswer) {
      return;
    }

    const currentPlayer = room.players[room.currentPlayer];
    if (currentPlayer.id !== socket.id) {
      return;
    }

    const question = getRandomQuestion();
    room.currentQuestion = question;
    room.waitingForAnswer = true;
    room.questionStartTime = Date.now();
    room.gamePhase = 'question';

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

    if (timers.has(roomCode)) {
      clearInterval(timers.get(roomCode));
      timers.delete(roomCode);
    }

    const question = room.currentQuestion;
    const isCorrect = answerIndex === question.correctAnswer;
    const timeToAnswer = Math.round((Date.now() - room.questionStartTime) / 1000);

    updatePlayerStats(currentPlayer.name, isCorrect, timeToAnswer);

    if (isCorrect) {
      currentPlayer.money += 100;
      room.gamePhase = 'dice';
    }

    io.to(roomCode).emit('answerResult', {
      correct: isCorrect,
      explanation: question.explanation,
      playerName: currentPlayer.name
    });

    room.waitingForAnswer = false;
    room.currentQuestion = null;

    if (!isCorrect) {
      setTimeout(() => {
        room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
        room.gamePhase = 'question';
        io.to(roomCode).emit('gameUpdated', room);
      }, 3000);
    }

    io.to(roomCode).emit('gameUpdated', room);
    io.to(roomCode).emit('statsUpdated', getPlayerStatsForRoom(room.players));
  });

  socket.on('rollDice', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || !room.gameStarted || room.gamePhase !== 'dice') {
      return;
    }

    const currentPlayer = room.players[room.currentPlayer];
    if (currentPlayer.id !== socket.id) {
      return;
    }

    const dice1 = Math.floor(Math.random() * 6) + 1;
    const dice2 = Math.floor(Math.random() * 6) + 1;
    const totalRoll = dice1 + dice2;

    const oldPosition = currentPlayer.position;
    const newPosition = (oldPosition + totalRoll) % 40;
    currentPlayer.position = newPosition;

    // Check for passing GO
    if (newPosition < oldPosition) {
      currentPlayer.money += 200;
    }

    const landedSpace = boardSpaces[newPosition];
    const property = room.properties[newPosition];

    // Handle landing on different spaces
    let canBuyProperty = false;
    let rentOwed = 0;

    if (landedSpace.type === 'property' || landedSpace.type === 'station' || landedSpace.type === 'utility') {
      if (!property.owner) {
        canBuyProperty = true;
      } else if (property.owner !== currentPlayer.name) {
        rentOwed = calculateRent(newPosition, property.owner, room.properties, totalRoll);
      }
    }

    if (landedSpace.type === 'tax') {
      currentPlayer.money -= landedSpace.rent[0];
    }

    // Handle rent payment
    if (rentOwed > 0) {
      currentPlayer.money -= rentOwed;
      const owner = room.players.find(p => p.name === property.owner);
      if (owner) {
        owner.money += rentOwed;
      }
    }

    io.to(roomCode).emit('diceRolled', {
      dice: [dice1, dice2],
      newPosition,
      canBuyProperty,
      rentOwed,
      passedGo: newPosition < oldPosition
    });

    room.gamePhase = canBuyProperty ? 'property' : 'endTurn';
    io.to(roomCode).emit('gameUpdated', room);
  });

  socket.on('buyProperty', ({ roomCode, propertyIndex }) => {
    const room = rooms.get(roomCode);
    if (!room || room.gamePhase !== 'property') {
      return;
    }

    const currentPlayer = room.players[room.currentPlayer];
    if (currentPlayer.id !== socket.id) {
      return;
    }

    const space = boardSpaces[propertyIndex];
    const property = room.properties[propertyIndex];

    if (currentPlayer.money >= space.price && !property.owner) {
      currentPlayer.money -= space.price;
      property.owner = currentPlayer.name;
      currentPlayer.properties.push(propertyIndex);

      room.gamePhase = 'endTurn';
      
      io.to(roomCode).emit('propertyPurchased', {
        playerName: currentPlayer.name,
        propertyName: space.name,
        price: space.price,
        gameData: room
      });
    }
  });

  socket.on('endTurn', (roomCode) => {
    const room = rooms.get(roomCode);
    if (!room || room.gamePhase !== 'endTurn') {
      return;
    }

    const currentPlayer = room.players[room.currentPlayer];
    if (currentPlayer.id !== socket.id) {
      return;
    }

    room.currentPlayer = (room.currentPlayer + 1) % room.players.length;
    room.gamePhase = 'question';
    
    io.to(roomCode).emit('gameUpdated', room);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    for (const [roomCode, room] of rooms.entries()) {
      const playerIndex = room.players.findIndex(p => p.id === socket.id);
      if (playerIndex !== -1) {
        room.players.splice(playerIndex, 1);
        
        if (room.players.length === 0) {
          if (timers.has(roomCode)) {
            clearInterval(timers.get(roomCode));
            timers.delete(roomCode);
          }
          rooms.delete(roomCode);
        } else {
          if (room.players.length > 0 && !room.players.find(p => p.isHost)) {
            room.players[0].isHost = true;
          }
          
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
