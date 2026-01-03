# Sumwords

**"Know the Facts, Do the Math"**

A constraint-based math puzzle game that combines trivia knowledge with equation solving. Answer trivia questions by placing numbers from a limited pool into mathematical equations while satisfying column sum constraints.

## 🎮 Play Now

**Landing Page:** [Sumwords Home](https://thebimsider.github.io/sumwords/landing/)  
**Play Game:** [Launch Game](https://thebimsider.github.io/sumwords/V01/)

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

1. Sports & Olympics
2. US History & Government
3. World Geography & Travel
4. Pop Culture & Entertainment
5. Science & Technology
6. Movies & TV
7. Food & Drink
8. Technology & Computing
9. Games & Literature
10. Animals & Nature

Plus an **"Everything"** category that combines all questions for maximum variety.

### Game Features

- **Hint System:** Three types of hints available
  - Reveal the answer to the trivia question
  - Reveal which numbers to place in the equation
  - Reveal the operator (Medium/Hard only)
- **Smart Resume:** Automatically saves progress and offers to resume unfinished puzzles
- **Statistics Tracking:** Track completed puzzles, attempts, hints used, perfect games, and win streaks
- **Mobile-Optimized:** Fully responsive design works great on phones and tablets
- **Persistent Storage:** Game state, preferences, and stats saved locally

### Visual Polish

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
- **CSS3** - Responsive design with mobile-first approach
- **Vanilla JavaScript** - No frameworks or dependencies
- **localStorage API** - Persistent data storage

## 📦 Installation (Local Development)

1. **Clone the repository**

```bash
   git clone https://github.com/BIMsider/sumwords.git
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
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── game.js             # Game logic and 500 trivia questions
├── README.md           # This file
└── LICENSE             # BSD 3-Clause License
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

Questions are stored in `game.js` in the `triviaQuestions` object. Each question needs:

- `question`: The trivia question text
- `answer`: Numeric answer (whole number, 0-2000 range works best)
- `category`: One of the 10 existing categories

Example:

```javascript
{
  question: "How many keys are on a standard piano?",
  answer: 88,
  category: "Music & Arts"
}
```

## 📄 License

This project is licensed under the **BSD 3-Clause License** - see the [LICENSE](LICENSE) file for details.

## 👤 Author

**Carl Storms (BIMsider)**

- Role: Technical Success Manager, AECO Software
- Experience: 25+ years in AECO technology and BIM
- Project Start: December 25, 2024

## 🙏 Acknowledgments

- Inspired by constraint-based puzzle games
- Built with vanilla JavaScript for maximum maintainability
- Designed mobile-first for modern web users
- 14 development sessions documented from concept to deployment

## 📝 Development

This project was developed over 14 documented sessions with comprehensive planning:

- Session recaps track all development decisions
- Roadmap documents evolution from concept to launch
- Beginner-friendly code for long-term maintainability
- Systematic testing and bug fixes

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

### Potential Future Enhancements

- Tutorial/onboarding for new players
- Keyboard navigation support
- Daily puzzle mode
- Social sharing (Wordle-style score sharing)
- Sound effects (optional)
- Dark mode theme
- Additional question categories
- Leaderboards

---

**Enjoy playing Sumwords!** 🎮🧮

If you find a bug or have suggestions, please open an issue on GitHub.






