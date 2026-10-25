<img width="500" height="250" alt="Sumwords_Logo" src="https://github.com/user-attachments/assets/69c496db-0b85-48b8-8596-52d1aa6e609e" />

# Sumwords

[![Release](https://img.shields.io/github/v/release/thebimsider/sumwords?display_name=tag&sort=semver)](https://github.com/thebimsider/sumwords/releases/latest)
[![License](https://img.shields.io/github/license/thebimsider/sumwords)](https://github.com/thebimsider/sumwords/blob/main/LICENSE)
[![Open Source](https://img.shields.io/badge/Open%20Source-Yes-brightgreen)](LICENSE)
![Tech](https://img.shields.io/badge/Tech-HTML%20%7C%20CSS%20%7C%20JavaScript-informational)
[![GitHub Pages](https://img.shields.io/badge/Hosted_on-GitHub_Pages-brightgreen)](https://thebimsider.github.io/sumwords/)

**"Know the Facts, Do the Math"**

A constraint-based math puzzle game that combines trivia knowledge with equation solving. Answer trivia questions by placing numbers from a limited pool into mathematical equations while satisfying column sum constraints.

**Landing Page:** [🏠 Home of Sumwords](https://thebimsider.github.io/sumwords/landing/)

## 🎮 Play Now

**Sumwords:** [🎲 Play Game](https://thebimsider.github.io/sumwords/V01/)

<p align="center">
  <img width="837" height="893" alt="Sumwords_in_Action" src="https://github.com/user-attachments/assets/e41bede5-2c7f-4498-8a6c-b3973879f29b" />
  <br />
  <em>Sumwords in action</em>
</p>

## ✨ Features

### Core Gameplay

- **Three Difficulty Levels**
  - **Easy:** Addition/subtraction with 10 numbers
  - **Medium:** Addition/subtraction with hidden operators, 12 numbers and 2 decoys
  - **Hard:** All four operators (+, −, ×, ÷) with 16 numbers and 6 decoys
- **Random Difficulty Mode:** Game randomly selects difficulty for variety
- **500 Trivia Questions** across 10 diverse categories
- **Constraint-Based Puzzles:** Numbers must satisfy both equations AND column totals

### Categories

1. Sports
2. History
3. Geography
4. Pop Culture
5. Science
6. Movies & TV
7. Food & Drink
8. Technology
9. Games & Literature
10. Animals & Nature

Plus an **"Everything"** category that combines all questions for maximum variety.

### Game Features

- **Interactive Tutorial:** First-time users see a helpful tutorial explaining gameplay with a "Don't show again" option
- **Dark Mode:** Toggle between light and dark themes with persistent preference
- **Hint System:** Three types of hints available
  - Reveal the answer to the trivia question
  - Reveal which numbers to place in the equation
  - Reveal the operator (Medium/Hard only)
- **Smart Resume:** Automatically saves progress and offers to resume unfinished puzzles
- **Statistics Tracking:** Track completed puzzles, attempts, hints used, perfect games, and win streaks
- **Mobile-Optimized:** Fully responsive design works great on phones and tablets
- **Persistent Storage:** Game state, preferences, stats, and theme saved locally

### Visual Polish

- Professional logo and branding
- Dark mode with smooth theme transitions
- Confetti animation on puzzle completion
- Color-coded validation feedback
- Emoji markers show which hints have been used
- Clean, modern interface

## 🎯 How to Play

### Goal

Place numbers from the number pool into the equation blanks to make valid equations. The sum of each column must match the target shown at the bottom.

### Rules

1. **Answer the trivia question** to learn which number is the solution
2. **Place numbers** from the pool into equation blanks by clicking the pool number, then clicking a blank
3. **Select operators** (Medium/Hard) from dropdowns between operands
4. **Satisfy constraints:**
   - Each equation must be mathematically correct
   - Column totals must match the targets at the bottom
5. **Submit** when all blanks are filled to check your solution

### Tips

- Start by placing the answer to the trivia question
- Work backwards from column totals to narrow down number choices
- Use hints strategically if you get stuck
- Each number can only be used once

## 🛠️ Technology Stack

- **HTML5** - Semantic structure
- **CSS3** - Responsive design with CSS custom properties for theming
- **Vanilla JavaScript** - No frameworks or dependencies
- **localStorage API** - Persistent data storage for game state and preferences

## 📦 Installation (Local Development)

1. **Clone the repository**

```bash
   git clone https://github.com/TheBIMsider/sumwords.git
   cd sumwords
```

2. **Open in browser**

```bash
   # Simply open index.html in your web browser
   # No build process or dependencies required
```

3. **Optional: Use a local server**

```bash
   # Python 3
   python -m http.server 8000

   # Python 2
   python -m SimpleHTTPServer 8000

   # Node.js (if you have http-server installed)
   npx http-server
```

Then navigate to `http://localhost:8000`

## 📁 Project Structure

```
sumwords/
├── V01/
│   ├── index.html          # Game HTML structure
│   ├── styles.css          # Game styling with dark mode
│   ├── game.js             # Game logic and 500 trivia questions
│   └── Sumwords_Logo.png   # Game logo
├── landing/
│   ├── index.html          # Landing page HTML
│   ├── styles.css          # Landing page styling with dark mode
│   └── script.js           # Landing page theme switcher
├── README.md               # This file
└── LICENSE                 # BSD 3-Clause License
```

## 🎲 Game Design

### Puzzle Generation

- Questions are randomly selected from the chosen category
- Equations are generated using a "from" approach (targets calculated from equations)
- Number pools include the correct answer plus additional numbers
- Decoy numbers (Medium/Hard) add strategic complexity

### Difficulty Scaling

- **Easy:** 5 equations, 10 numbers, 5×2 grid, addition/subtraction only
- **Medium:** 6 equations, 12 numbers (2 decoys), 6×2 grid (3×4 mobile), hidden operators (+ or −)
- **Hard:** 8 equations, 16 numbers (6 decoys), 8×2 grid (4×4 mobile), all operators (+, −, ×, ÷)

## 📊 Statistics

The game tracks comprehensive statistics including:

- Total puzzles completed
- Total attempts
- Hints used
- Perfect games (no hints)
- Current and best win streaks
- Per-difficulty breakdowns

## 🤝 Contributing

Contributions are welcome! This is a personal learning project, but feel free to:

- Report bugs via GitHub Issues
- Suggest new features
- Submit pull requests for improvements
- Add new trivia questions

### Adding Trivia Questions

Questions are stored in `V01/game.js` in the `questionBanks` object, one array per category (`sports`, `history`, `geography`, `popculture`, `science`, `moviestv`, `fooddrink`, `technology`, `gamesliterature`, `animalsnature`). Each question needs:

- `question`: The trivia question text
- `answer`: Numeric answer (whole number, 0-2000 range works best)

Add it to the array for its category. Example, added to `science`:

```javascript
{ question: 'Bones in the adult human body', answer: 206 },
```

## 📄 License

This project is licensed under the **BSD 3-Clause License** - see the [LICENSE](LICENSE) file for details.

## 👤 Author (Vibe Coder)

**Carl Storms (The BIMsider)** With the help of his AI Buddy 🤖 **Claude AI: Sonnet 4.5**

- Role: Technical Success Manager, AECO Software
- Experience: 25+ years in AECO technology and BIM
- Project Start: December 25, 2025

## 🙏 Acknowledgments

- Inspired by constraint-based puzzle games
- Built with vanilla JavaScript for maximum maintainability
- Designed mobile-first for modern web users
- 21 development sessions documented from concept to deployment

## 📝 Development

This project was developed (Vibe Coded) over 21 documented sessions with comprehensive planning:

- Session recaps track all development decisions
- Roadmap documents evolution from concept to launch
- Beginner-friendly code for long-term maintainability
- Systematic testing and bug fixes
- CSS variable architecture for maintainable theming

## 🚀 Roadmap

### Completed ✅

- Core game mechanics
- Three difficulty levels plus random mode
- 500 trivia questions across 10 categories
- Hint system with three hint types
- localStorage persistence
- Statistics tracking
- Mobile-responsive design
- Cross-browser compatibility
- Professional logo and branding
- Dark mode with theme toggle
- Landing page with animations
- Interactive tutorial for first-time users

### Potential Future Enhancements

- Keyboard navigation support
- Daily puzzle mode
- Social sharing (Wordle-style score sharing)
- Sound effects (optional)
- Additional question categories
- Leaderboards
- Progressive Web App (PWA) support
- Advanced tutorial with interactive walkthrough

---

**Enjoy playing Sumwords!** 🎮🧮

If you find a bug or have suggestions, please open an issue on GitHub.
