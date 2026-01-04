// ==========================================
// SUMWORDS GAME - MAIN JAVASCRIPT
// ==========================================

// ==========================================
// THEME MANAGEMENT
// ==========================================

/**
 * Initialize theme based on:
 * 1. Saved preference in localStorage
 * 2. System preference (prefers-color-scheme)
 * 3. Default to light mode
 */
function initializeTheme() {
  const savedTheme = localStorage.getItem('sumwords_landing_theme');
  const systemPrefersDark = window.matchMedia(
    '(prefers-color-scheme: dark)'
  ).matches;

  // Priority: saved preference > system preference > light default
  const theme = savedTheme || (systemPrefersDark ? 'dark' : 'light');

  applyTheme(theme);
}

/**
 * Apply theme to the document
 * @param {string} theme - 'light' or 'dark'
 */
function applyTheme(theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  } else {
    document.documentElement.removeAttribute('data-theme');
  }
  localStorage.setItem('sumwords_landing_theme', theme);
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme');
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  applyTheme(newTheme);
}

// Initialize theme on page load (before DOM content loads to prevent flash)
initializeTheme();

// ==========================================
// QUESTION LIBRARY
// ==========================================

const testPuzzle = {
  id: 'puzzle_001',
  category: 'Sports',
  difficulty: 'Easy',
  numberPool: [1, 1, 2, 3, 4, 5, 6, 7, 11, 13],
  columnTargets: {
    column1: 36,
    column2: 17,
  },
  equations: [
    {
      id: 1,
      question: 'Super Bowls won by Tom Brady',
      answer: 7,
      operator: '+',
      solution: { operand1: 6, operand2: 1, result: 7 },
    },
    {
      id: 2,
      question: 'Players on a basketball team',
      answer: 5,
      operator: '+',
      solution: { operand1: 2, operand2: 3, result: 5 },
    },
    {
      id: 3,
      question: 'Innings in a baseball game',
      answer: 9,
      operator: '+',
      solution: { operand1: 4, operand2: 5, result: 9 },
    },
    {
      id: 4,
      question: 'Points for an NFL touchdown',
      answer: 6,
      operator: '-',
      solution: { operand1: 13, operand2: 7, result: 6 },
    },
    {
      id: 5,
      question: 'Frames in a game of bowling',
      answer: 10,
      operator: '-',
      solution: { operand1: 11, operand2: 1, result: 10 },
    },
  ],
};

/* ===================================
   QUESTION BANKS 
   =================================== */

// Placeholder question banks - will expand later
const questionBanks = {
  sports: [
    { question: 'Super Bowls won by Tom Brady', answer: 7 },
    { question: 'Innings in a baseball game', answer: 9 },
    { question: 'Points for an NFL touchdown', answer: 6 },
    { question: 'Frames in a game of bowling', answer: 10 },
    { question: 'Holes on a golf course', answer: 18 },
    { question: 'Feet from pitcher to home plate', answer: 60 },
    { question: 'Yards for a first down (NFL)', answer: 10 },
    { question: 'Regulation NBA quarters', answer: 4 },
    { question: 'Players on a baseball field (defense)', answer: 9 },
    { question: 'Points for a field goal (NFL)', answer: 3 },
    { question: 'Regulation periods in hockey', answer: 3 },
    { question: 'Bases on a baseball diamond', answer: 4 },
    { question: 'Sets to win a tennis match (men)', answer: 3 },
    { question: 'Points for a free throw (basketball)', answer: 1 },
    { question: 'Strikes for a strikeout', answer: 3 },
    { question: 'Balls for a walk (baseball)', answer: 4 },
    { question: 'Outs per inning (baseball)', answer: 3 },
    { question: 'Downs to get first down (football)', answer: 4 },
    // YOUR ADDITIONS (merged, duplicates removed)
    { question: 'Minutes in a standard soccer match', answer: 90 },
    { question: 'Players on a basketball team on the court', answer: 5 },
    { question: 'Points for a touchdown including extra point', answer: 7 },
    { question: 'Olympic rings', answer: 5 },
    { question: 'Grand Slam tennis tournaments each year', answer: 4 },
    { question: 'Players on a volleyball team on the court', answer: 6 },
    { question: 'Halves in a rugby match', answer: 2 },
    { question: 'Players on a soccer team on the field', answer: 11 },
    { question: 'Referees on the field in an NFL game', answer: 7 },
    { question: 'Seconds on a basketball shot clock', answer: 24 },
    { question: 'Lanes on a standard running track', answer: 8 },
    { question: 'Periods in a basketball game', answer: 4 },
    { question: 'Players per side in doubles tennis', answer: 2 },
    { question: 'Teams in the NBA playoffs', answer: 16 },
    { question: 'Rounds in Olympic boxing', answer: 3 },
    { question: 'Points for a safety in football', answer: 2 },
    { question: 'Players on an ice hockey team on ice', answer: 6 },
    { question: 'Yards in American football field length', answer: 100 },
    { question: 'Events in a triathlon', answer: 3 },
    { question: 'Wheels on a bicycle', answer: 2 },
    { question: 'Points for a 3-pointer in basketball', answer: 3 },
    { question: 'Arrows in an Olympic archery end', answer: 3 },
    { question: 'Players on a water polo team in pool', answer: 7 },
    { question: 'Timeouts per half in NFL', answer: 3 },
    { question: 'Fencers in an épée bout', answer: 2 },
    { question: 'Games in a tennis set (minimum)', answer: 6 },
    { question: 'Skaters in figure skating pairs', answer: 2 },
    { question: 'Events in Olympic gymnastics (women)', answer: 4 },
    { question: 'Bocce balls per team', answer: 4 },
    { question: 'Players on a curling team', answer: 4 },
    { question: 'Attempts in long jump finals', answer: 6 },
    { question: 'Relay runners on a team', answer: 4 },
  ],
  history: [
    { question: 'Original U.S. colonies', answer: 13 },
    { question: 'Apollo moon landing mission number', answer: 11 },
    { question: 'U.S. Presidents on Mount Rushmore', answer: 4 },
    { question: 'Years in a decade', answer: 10 },
    { question: 'Amendments in Bill of Rights', answer: 10 },
    { question: 'Stripes on U.S. flag', answer: 13 },
    { question: 'Stars on U.S. flag', answer: 50 },
    { question: 'World Wars in 20th century', answer: 2 },
    { question: 'Branches of U.S. government', answer: 3 },
    { question: 'Continents on Earth', answer: 7 },
    { question: 'Years in a century', answer: 100 },
    { question: 'Musketeers in Dumas novel', answer: 3 },
    { question: 'Days Julius Caesar was warned about', answer: 15 },
    { question: 'Ring of power in Tolkien', answer: 1 },
    { question: 'Horsemen of the Apocalypse', answer: 4 },
    { question: 'Wars of the Roses roses (colors)', answer: 2 },
    { question: 'Plagues of Egypt', answer: 10 },
    { question: 'Labors of Hercules', answer: 12 },
    { question: 'Hills of Rome', answer: 7 },
    { question: 'Wives of Henry VIII', answer: 6 },
    // YOUR ADDITIONS (merged, duplicates removed)
    { question: 'Amendments in the US Constitution', answer: 27 },
    { question: 'Years of World War II', answer: 6 },
    { question: 'Days of the Battle of Gettysburg', answer: 3 },
    { question: 'Years of the American Civil War', answer: 4 },
    { question: 'Books in the New Testament', answer: 27 },
    { question: 'Pyramids of Giza', answer: 3 },
    { question: 'Signers of the US Declaration of Independence', answer: 56 },
    { question: 'Crusades traditionally numbered', answer: 9 },
    { question: 'Years between Olympic Games', answer: 4 },
    { question: 'Dynasties in ancient Egypt', answer: 31 },
    { question: 'Days in the French Revolutionary week', answer: 10 },
    { question: 'Years of the Vietnam War for the US', answer: 20 },
    { question: 'Ancient Wonders of the World', answer: 7 },
    { question: 'Years of the First Punic War', answer: 23 },
    { question: 'Months in the Gregorian calendar', answer: 12 },
    { question: 'Years of the Cold War', answer: 44 },
    { question: 'Republics in the Soviet Union', answer: 15 },
    { question: 'Commandments in the Bible', answer: 10 },
    { question: 'Stations of the Cross', answer: 14 },
    { question: 'Articles in the US Constitution', answer: 7 },
    { question: 'Deadly sins', answer: 7 },
    { question: 'Heavenly virtues', answer: 7 },
    { question: 'Sacraments in Catholic Church', answer: 7 },
    { question: 'Days in the week named after Norse gods', answer: 4 },
    { question: 'Founding fathers at Constitutional Convention', answer: 55 },
    { question: 'Minutes of hate in 1984', answer: 2 },
    { question: 'Prophets in Islam (major)', answer: 5 },
    { question: 'Pillars of Islam', answer: 5 },
    { question: 'Noble Truths in Buddhism', answer: 4 },
    { question: 'Seals broken in Book of Revelation', answer: 7 },
  ],
  geography: [
    { question: 'Great Lakes in North America', answer: 5 },
    { question: 'Time zones in continental U.S.', answer: 4 },
    { question: 'Oceans on Earth', answer: 5 },
    { question: 'Provinces in Canada', answer: 10 },
    { question: 'States in New England', answer: 6 },
    { question: 'Boroughs in New York City', answer: 5 },
    { question: 'Countries in United Kingdom', answer: 4 },
    { question: 'Wonders of Ancient World', answer: 7 },
    { question: 'Territories in Australia', answer: 8 },
    { question: 'Countries in Scandinavia', answer: 3 },
    { question: 'U.S. states that border Mexico', answer: 4 },
    { question: 'U.S. states that border Canada', answer: 13 },
    { question: 'Outlying U.S. territories', answer: 5 },
    { question: 'Stripes on the Greek flag', answer: 9 },
    { question: 'Points on Canadian maple leaf', answer: 11 },
    { question: 'Stars on Australian flag', answer: 6 },
    { question: 'U.S. states with Pacific coastline', answer: 5 },
    { question: 'Countries that share border with France', answer: 8 },
    { question: 'Rays on Statue of Liberty crown', answer: 7 },
    { question: 'Peaks over 8000m (8-thousanders)', answer: 14 },
    // YOUR ADDITIONS (merged, duplicates removed)
    { question: 'Continents on Earth', answer: 7 },
    { question: 'US states', answer: 50 },
    { question: 'Hemispheres of Earth', answer: 2 },
    { question: 'Major lines of latitude', answer: 5 },
    { question: 'Major deserts of the world', answer: 7 },
    { question: 'Letters in the word Mississippi', answer: 11 },
    { question: 'Countries crossed by the Equator', answer: 13 },
    { question: 'Capital cities of South Africa', answer: 3 },
    { question: 'Degrees in a full circle', answer: 360 },
    { question: 'US states with no coastline', answer: 27 },
    { question: 'Countries in North America', answer: 23 },
    { question: 'Fingers on one hand', answer: 5 },
    { question: 'Toes on one foot', answer: 5 },
    { question: 'Legs on a tripod', answer: 3 },
    { question: 'Sides on a square', answer: 4 },
    { question: 'Points on a compass (cardinal)', answer: 4 },
    { question: 'Wheels on a tricycle', answer: 3 },
    { question: 'Seasons in a year', answer: 4 },
    { question: 'Weeks in a year', answer: 52 },
    { question: 'Days in February (leap year)', answer: 29 },
    { question: 'Days in February (normal year)', answer: 28 },
    { question: 'Zeros in one million', answer: 6 },
    { question: 'Zeros in one billion', answer: 9 },
    { question: 'Faces on a cube', answer: 6 },
    { question: 'Vertices on a cube', answer: 8 },
    { question: 'Edges on a cube', answer: 12 },
    { question: 'Inches in a foot', answer: 12 },
    { question: 'Feet in a yard', answer: 3 },
    { question: 'Centimeters in a meter', answer: 100 },
    { question: 'Millimeters in a centimeter', answer: 10 },
  ],
  popculture: [
    { question: 'Dwarfs in Snow White', answer: 7 },
    { question: 'Harry Potter books', answer: 7 },
    { question: 'Lord of the Rings films', answer: 3 },
    { question: 'Fast and Furious main films', answer: 10 },
    { question: 'Infinity Stones in MCU', answer: 6 },
    { question: 'Original Star Wars trilogy films', answer: 3 },
    { question: 'Avengers in original team', answer: 6 },
    { question: 'Strings on a standard guitar', answer: 6 },
    { question: 'Piano keys in an octave', answer: 12 },
    { question: 'Beatles members', answer: 4 },
    { question: 'Rings in Olympic symbol', answer: 5 },
    { question: 'Ghostbusters in original film', answer: 4 },
    { question: 'Teenage Mutant Ninja Turtles', answer: 4 },
    { question: 'Spice Girls members', answer: 5 },
    { question: 'Friends main characters', answer: 6 },
    { question: 'Toy Story films (main series)', answer: 4 },
    { question: 'Horcruxes in Harry Potter', answer: 7 },
    { question: 'Simpsons family members', answer: 5 },
    { question: 'Dragon balls in Dragon Ball', answer: 7 },
    { question: 'Kingdoms in Game of Thrones (start)', answer: 7 },
    // YOUR ADDITIONS (merged, duplicates removed)
    { question: 'Hobbits in the Fellowship of the Ring', answer: 4 },
    { question: 'Seasons of the TV show Friends', answer: 10 },
    { question: 'Movies in the Back to the Future trilogy', answer: 3 },
    { question: 'Primary colors', answer: 3 },
    { question: 'Letters in the Hollywood sign', answer: 9 },
    { question: 'Houses at Hogwarts', answer: 4 },
    { question: 'Main characters in Scooby-Doo', answer: 5 },
    { question: 'Teletubbies', answer: 4 },
    { question: 'Jurassic Park films in the original trilogy', answer: 3 },
    { question: 'Dice sides on a standard die', answer: 6 },
    { question: "Members of Destiny's Child classic lineup", answer: 3 }, // escaped
    { question: 'Books in the Hunger Games series', answer: 4 },
    { question: 'Letters in the word Pokémon', answer: 7 },
    { question: 'Hobbits in The Hobbit (main group)', answer: 1 },
    { question: "Musketeers plus D'Artagnan", answer: 4 },
    { question: 'Horsemen of Notre Dame', answer: 4 },
    { question: 'Stages of grief', answer: 5 },
    { question: 'Tenets of Mission Impossible', answer: 7 },
    { question: 'Samurai in Seven Samurai', answer: 7 },
    { question: 'Brides for Seven Brothers', answer: 7 },
    { question: 'Voyages of Star Trek original series', answer: 5 },
    { question: 'Men in The Magnificent Seven', answer: 7 },
    { question: 'Dalmatians in the Disney film', answer: 101 },
    { question: 'Candles on a menorah', answer: 9 },
    { question: 'Points on a Star of David', answer: 6 },
    { question: 'Strings on a violin', answer: 4 },
    { question: 'Valves on a trumpet', answer: 3 },
    { question: 'Black keys on a piano octave', answer: 5 },
    { question: 'White keys on a piano octave', answer: 7 },
    { question: 'Positions in tic-tac-toe', answer: 9 },
  ],
  science: [
    { question: 'Planets in our solar system', answer: 8 },
    { question: 'Legs on a spider', answer: 8 },
    { question: 'Sides on a stop sign', answer: 8 },
    { question: 'Bones in adult human body (rounded)', answer: 206 },
    { question: 'Degrees in a right angle', answer: 90 },
    { question: 'Degrees Fahrenheit water freezes', answer: 32 },
    { question: 'Teeth in adult human', answer: 32 },
    { question: 'Sides on a hexagon', answer: 6 },
    { question: 'Pairs of chromosomes in humans', answer: 23 },
    { question: 'Chemical elements in water (H2O)', answer: 2 },
    { question: 'Sides on a pentagon', answer: 5 },
    { question: 'Legs on an insect', answer: 6 },
    { question: 'Chambers in human heart', answer: 4 },
    { question: 'Degrees in a triangle (total)', answer: 180 },
    { question: 'Days in a lunar month', answer: 29 },
    { question: 'Valence electrons in carbon', answer: 4 },
    { question: 'Noble gases in periodic table', answer: 6 },
    { question: 'Bones in human skull', answer: 22 },
    { question: 'Cervical vertebrae in humans', answer: 7 },
    { question: 'Phases of the moon', answer: 8 },
    // YOUR ADDITIONS (merged, duplicates removed)
    { question: 'Elements in the periodic table', answer: 118 },
    { question: 'States of matter commonly taught', answer: 4 },
    { question: 'DNA strands in a double helix', answer: 2 },
    { question: 'Chromosomes in a human cell', answer: 46 },
    { question: 'Blood types in the ABO system', answer: 4 },
    { question: "Newton's laws of motion", answer: 3 },
    { question: 'Wings on a typical insect', answer: 4 },
    { question: 'Seconds in a minute', answer: 60 },
    { question: 'Minutes in an hour', answer: 60 },
    { question: 'Layers of Earth', answer: 4 },
    { question: 'Human senses traditionally taught', answer: 5 },
    { question: 'Valence electrons in a full outer shell', answer: 8 },
    { question: 'Eyes on most spiders', answer: 8 },
    { question: "Degrees Celsius at water's boiling point", answer: 100 },
    { question: 'Digits in the binary system', answer: 2 },
    { question: 'Pairs of ribs in the human body', answer: 12 },
    { question: 'Planets visible to the naked eye', answer: 5 },
    { question: 'Atomic number of carbon', answer: 6 },
    { question: 'Atomic number of oxygen', answer: 8 },
    { question: 'Atomic number of nitrogen', answer: 7 },
    { question: 'Atomic number of hydrogen', answer: 1 },
    { question: 'Atomic number of helium', answer: 2 },
    { question: 'Moons of Mars', answer: 2 },
    { question: 'Permanent teeth in adult human', answer: 32 },
    { question: 'Wisdom teeth', answer: 4 },
    { question: 'Baby teeth in children', answer: 20 },
    { question: 'Lungs in human body', answer: 2 },
    { question: 'Kidneys in human body', answer: 2 },
    { question: 'Chambers in insect heart', answer: 1 },
    { question: 'Wings on a bee', answer: 4 },
  ],
  moviestv: [
    { question: 'How many Academy Awards did Titanic win?', answer: 11 },
    { question: 'How many seasons of Friends were there?', answer: 10 },
    {
      question: 'How many movies are in the original Star Wars trilogy?',
      answer: 3,
    },
    {
      question:
        'How many Infinity Stones are there in the Marvel Cinematic Universe?',
      answer: 6,
    },
    {
      question: 'How many episodes are in a typical season of Game of Thrones?',
      answer: 10,
    },
    { question: 'How many Oscars has Meryl Streep won?', answer: 3 },
    {
      question:
        'How many main characters are in the TV show The Big Bang Theory?',
      answer: 7,
    },
    { question: 'How many Harry Potter movies were released?', answer: 8 },
    { question: 'How many seasons of Breaking Bad were there?', answer: 5 },
    {
      question: 'How many films are in the Lord of the Rings trilogy?',
      answer: 3,
    },
    { question: 'How many seasons of The Office (US) were there?', answer: 9 },
    { question: 'How many Toy Story movies have been released?', answer: 4 },
    { question: 'How many seasons of Stranger Things have aired?', answer: 4 },
    {
      question:
        'How many main characters were in the original Star Trek series?',
      answer: 7,
    },
    {
      question: 'How many Batman actors appeared in major films before 2020?',
      answer: 8,
    },
    { question: 'How many seasons of Mad Men were there?', answer: 7 },
    {
      question: 'How many actors have played James Bond in official films?',
      answer: 6,
    },
    {
      question: 'How many Fast and Furious main series films exist?',
      answer: 10,
    },
    { question: 'How many seasons of The Sopranos were there?', answer: 6 },
    {
      question: 'How many Jurassic Park/World movies have been released?',
      answer: 6,
    },
    { question: 'How many seasons of The Crown have aired?', answer: 6 },
    {
      question: 'How many Pirates of the Caribbean movies were made?',
      answer: 5,
    },
    { question: 'How many seasons of The Wire were there?', answer: 5 },
    {
      question: 'How many Mission Impossible movies have been released?',
      answer: 7,
    },
    { question: 'How many Avengers movies are in the MCU?', answer: 4 },
    { question: 'How many Avengers movies are in the MCU?', answer: 4 },
    { question: 'How many seasons of Seinfeld were there?', answer: 9 },
    {
      question: 'How many seasons of The Simpsons aired in the 1990s?',
      answer: 11,
    },
    {
      question: 'How many Rocky movies feature Sylvester Stallone?',
      answer: 6,
    },
    {
      question: 'How many seasons of Parks and Recreation were there?',
      answer: 7,
    },
    { question: 'How many Godfather movies were made?', answer: 3 },
    { question: 'How many seasons of Lost were there?', answer: 6 },
    { question: 'How many Matrix movies have been released?', answer: 4 },
    {
      question: 'How many Indiana Jones movies were released before 2020?',
      answer: 4,
    },
    { question: 'How many Bourne movies feature Matt Damon?', answer: 4 },
    { question: 'How many seasons of Community were there?', answer: 6 },
    {
      question: 'How many X-Men movies were in the original trilogy?',
      answer: 3,
    },
    { question: 'How many seasons of 30 Rock were there?', answer: 7 },
    {
      question: 'How many Terminator movies were released before 2020?',
      answer: 6,
    },
    { question: 'How many main Hunger Games movies were made?', answer: 4 },
    {
      question: 'How many seasons of Arrested Development (original run)?',
      answer: 3,
    },
    { question: 'How many Back to the Future movies were made?', answer: 3 },
    {
      question: 'How many seasons of How I Met Your Mother were there?',
      answer: 9,
    },
    { question: 'How many Shrek movies were made?', answer: 4 },
    {
      question: 'How many seasons of Dexter (original series) were there?',
      answer: 8,
    },
    {
      question: 'How many Ghostbusters movies were made before 2020?',
      answer: 3,
    },
    { question: 'How many seasons of Frasier were there?', answer: 11 },
    { question: 'How many Alien movies feature Sigourney Weaver?', answer: 4 },
    { question: 'How many seasons of Scrubs were there?', answer: 9 },
    { question: 'How many Men in Black movies were made?', answer: 4 },
    {
      question: 'How many seasons of Twin Peaks (both runs combined)?',
      answer: 3,
    },
  ],
  fooddrink: [
    { question: 'How many tablespoons are in one cup?', answer: 16 },
    { question: 'How many teaspoons are in one tablespoon?', answer: 3 },
    { question: 'How many ounces are in a standard can of soda?', answer: 12 },
    { question: 'How many fluid ounces are in a pint?', answer: 16 },
    { question: 'How many calories are in one gram of fat?', answer: 9 },
    {
      question: "How many herbs and spices are in KFC's original recipe?",
      answer: 11,
    },
    {
      question: 'How many varieties of Heinz products does the company claim?',
      answer: 57,
    },
    { question: 'How many eggs are in a dozen?', answer: 12 },
    { question: "How many chambers does a cow's stomach have?", answer: 4 },
    {
      question: 'How many ingredients are in a traditional margarita?',
      answer: 3,
    },
    { question: 'How many quarts are in one gallon?', answer: 4 },
    { question: 'How many grams are in one ounce?', answer: 28 },
    {
      question: 'How many cups of coffee can one pound of beans make?',
      answer: 48,
    },
    { question: 'How many slices are in a typical large pizza?', answer: 8 },
    {
      question: 'How many donuts are in a standard Krispy Kreme dozen?',
      answer: 12,
    },
    { question: 'How many pieces are in a standard sushi roll?', answer: 8 },
    {
      question: 'How many shots of espresso are in a traditional cappuccino?',
      answer: 2,
    },
    {
      question: 'How many main ingredients are in traditional hummus?',
      answer: 5,
    },
    {
      question: 'How many Michelin stars can a restaurant receive maximum?',
      answer: 3,
    },
    {
      question: 'How many fluid ounces are in a standard coffee mug?',
      answer: 12,
    },
    {
      question: 'How many wings are typically in a restaurant wing order?',
      answer: 10,
    },
    {
      question: 'How many fluid ounces are in a standard shot glass?',
      answer: 2,
    },
    {
      question: 'How many rings are on the Olympic symbol on Coca-Cola cans?',
      answer: 5,
    },
    { question: 'How many main food groups are there?', answer: 5 },
    { question: 'How manyounces are in a pound?', answer: 16 },
    { question: 'How many ounces are in a pound?', answer: 16 },
    { question: 'How many cups are in one quart?', answer: 4 },
    { question: 'How many pints are in one gallon?', answer: 8 },
    { question: 'How many tablespoons are in one stick of butter?', answer: 8 },
    { question: 'How many fluid ounces are in a cup?', answer: 8 },
    {
      question: 'How many slices are typically in a loaf of bread?',
      answer: 20,
    },
    { question: 'How many grams of protein are in one egg?', answer: 6 },
    {
      question: 'How many varieties of Baskin-Robbins ice cream flavors?',
      answer: 31,
    },
    {
      question: 'How many kernels of corn are typically on one cob?',
      answer: 800,
    },
    { question: 'How many calories are in one gram of protein?', answer: 4 },
    {
      question: 'How many calories are in one gram of carbohydrate?',
      answer: 4,
    },
    { question: 'How many teaspoons of sugar in one tablespoon?', answer: 3 },
    { question: 'How many ounces in a standard stick of butter?', answer: 4 },
    { question: 'How many cups are in one pint?', answer: 2 },
    {
      question: 'How many cloves are typically in one head of garlic?',
      answer: 10,
    },
    {
      question: 'How many standard drinks are in a bottle of wine?',
      answer: 5,
    },
    {
      question: 'How many crackers are typically in a sleeve of saltines?',
      answer: 40,
    },
    {
      question: 'How many cookies are in a standard Oreo package?',
      answer: 36,
    },
    { question: 'How many hot dogs are in a standard package?', answer: 8 },
    { question: 'How many hot dog buns are in a standard package?', answer: 8 },
    {
      question: "How many chicken nuggets are in a McDonald's 20-piece?",
      answer: 20,
    },
    { question: 'How many grams are in one kilogram?', answer: 1000 },
    { question: 'How many milliliters are in one liter?', answer: 1000 },
    {
      question: 'How many regions are recognized for French wine?',
      answer: 12,
    },
    { question: 'How many major types of pasta shapes exist?', answer: 350 },
  ],
  technology: [
    { question: 'How many bits are in one byte?', answer: 8 },
    {
      question: 'How many keys are on a standard QWERTY keyboard?',
      answer: 104,
    },
    { question: 'How many generations of USB connectors exist?', answer: 3 },
    { question: 'How many pins does a VGA connector have?', answer: 15 },
    { question: 'How many bits are in an IPv4 address?', answer: 32 },
    {
      question: 'How many cores does a standard quad-core processor have?',
      answer: 4,
    },
    { question: 'How many layers are in the OSI network model?', answer: 7 },
    {
      question: 'How many pins does a standard HDMI connector have?',
      answer: 19,
    },
    {
      question: 'How many function keys are on a standard PC keyboard?',
      answer: 12,
    },
    { question: 'How many megabytes are in one gigabyte?', answer: 1024 },
    {
      question: 'How many pins does a standard Ethernet RJ45 connector have?',
      answer: 8,
    },
    { question: 'How many bits are in a nibble?', answer: 4 },
    {
      question:
        'How many main components are in a typical computer (CPU, RAM, Storage, etc)?',
      answer: 5,
    },
    { question: 'How many sides does a hex nut have?', answer: 6 },
    { question: 'How many legs does a USB Type-A connector have?', answer: 4 },
    {
      question: 'How many buttons are on a standard computer mouse?',
      answer: 3,
    },
    { question: 'How many pins does a standard serial port have?', answer: 9 },
    { question: 'How many tracks are on a standard CD?', answer: 99 },
    { question: 'How many cores does a dual-core processor have?', answer: 2 },
    {
      question: 'How many primary colors are used in RGB displays?',
      answer: 3,
    },
    { question: 'How many number keys are on a phone keypad?', answer: 10 },
    { question: 'How many arrow keys are on a keyboard?', answer: 4 },
    {
      question:
        'How many generations of Wi-Fi standards exist (up to Wi-Fi 6)?',
      answer: 6,
    },
    {
      question: 'How many pins does a standard PS/2 connector have?',
      answer: 6,
    },
    { question: 'How many cells are in a standard 9V battery?', answer: 6 },
    { question: 'How many cells are in a standard 9V battery?', answer: 6 },
    { question: 'How many pins does a DVI connector have?', answer: 24 },
    { question: 'How many contacts are in a USB-C connector?', answer: 24 },
    { question: 'How many bits are in a kilobit?', answer: 1024 },
    {
      question: 'How many processor cores does an octa-core chip have?',
      answer: 8,
    },
    {
      question: 'How many pins does a parallel printer port have?',
      answer: 25,
    },
    {
      question: 'How many sides does a standard computer die (for games) have?',
      answer: 6,
    },
    {
      question: 'How many keys does a standard piano keyboard have?',
      answer: 88,
    },
    { question: 'How many strings does a standard guitar have?', answer: 6 },
    { question: 'How many frets are on a standard guitar?', answer: 20 },
    { question: 'How many volts is a standard AA battery?', answer: 2 },
    {
      question: 'How many poles does a standard electrical outlet have in US?',
      answer: 3,
    },
    {
      question: 'How many pins does a FireWire 400 connector have?',
      answer: 6,
    },
    {
      question: 'How many conductor wires are in a standard phone cable?',
      answer: 4,
    },
    {
      question: 'How many pins does a standard IDE connector have?',
      answer: 40,
    },
    {
      question: 'How many pixels wide is 4K resolution (rounded to thousands)?',
      answer: 4,
    },
    {
      question:
        'How many pixels wide is Full HD resolution (rounded to thousands)?',
      answer: 2,
    },
    { question: 'How many channels does stereo audio have?', answer: 2 },
    { question: 'How many channels does surround sound 5.1 have?', answer: 6 },
    {
      question: 'How many RAM slots does a typical desktop motherboard have?',
      answer: 4,
    },
    { question: 'How many USB ports does a typical laptop have?', answer: 3 },
    { question: 'How many speakers are in a typical soundbar?', answer: 3 },
    {
      question: 'How many cameras does a typical modern smartphone have?',
      answer: 3,
    },
    { question: 'How many transistors are in a binary digit?', answer: 2 },
    { question: 'How many base states does binary use?', answer: 2 },
  ],
  gamesliterature: [
    {
      question: 'How many cards are in a standard deck excluding Jokers?',
      answer: 52,
    },
    { question: 'How many properties are on a Monopoly board?', answer: 28 },
    {
      question: 'How many pieces does each player start with in chess?',
      answer: 16,
    },
    {
      question: 'How many points is the letter Z worth in Scrabble?',
      answer: 10,
    },
    { question: 'How many books are in the Harry Potter series?', answer: 7 },
    {
      question: 'How many dominoes are in a standard double-six set?',
      answer: 28,
    },
    { question: 'How many rooms are in the board game Clue?', answer: 9 },
    { question: 'How many letters are in the English alphabet?', answer: 26 },
    {
      question: 'How many cards does each player start with in Uno?',
      answer: 7,
    },
    {
      question: 'How many books are in The Lord of the Rings trilogy?',
      answer: 3,
    },
    { question: 'How many railroads are on a Monopoly board?', answer: 4 },
    { question: 'How many chapters are in the novel 1984?', answer: 23 },
    { question: 'How many novels did Jane Austen complete?', answer: 6 },
    {
      question: 'How many squares are on a standard checkerboard?',
      answer: 64,
    },
    {
      question: 'How many books are in A Song of Ice and Fire (published)?',
      answer: 5,
    },
    { question: 'How many dots are on a standard die?', answer: 21 },
    { question: 'How many plays did William Shakespeare write?', answer: 37 },
    {
      question: 'How many spaces are on a standard Backgammon board?',
      answer: 24,
    },
    { question: 'How many books are in The Chronicles of Narnia?', answer: 7 },
    { question: 'How many suits are in a standard deck of cards?', answer: 4 },
    { question: 'How many sonnets did Shakespeare write?', answer: 154 },
    { question: 'How many territories are on a Risk game board?', answer: 42 },
    { question: 'How many face cards are in a standard deck?', answer: 12 },
    {
      question: 'How many letter tiles does each Scrabble player start with?',
      answer: 7,
    },
    {
      question: 'How many pawns does each chess player start with?',
      answer: 8,
    },
    {
      question: 'How many pawns does each chess player start with?',
      answer: 8,
    },
    { question: 'How many hours are in a Monopoly game property?', answer: 22 },
    {
      question: "How many cards are dealt in a game of poker (Texas Hold'em)?",
      answer: 2,
    },
    {
      question:
        'How many property spaces are in each Monopoly color group (typical)?',
      answer: 3,
    },
    { question: 'How many red cards are in a standard deck?', answer: 26 },
    { question: 'How many black cards are in a standard deck?', answer: 26 },
    {
      question: 'How many novels are in the original Foundation trilogy?',
      answer: 3,
    },
    {
      question:
        'How many books are in the Dune original series by Frank Herbert?',
      answer: 6,
    },
    {
      question: 'How many Sherlock Holmes novels did Arthur Conan Doyle write?',
      answer: 4,
    },
    {
      question: "How many novels are in the Hitchhiker's Guide trilogy?",
      answer: 5,
    },
    { question: 'How many books are in the Twilight saga?', answer: 4 },
    {
      question: 'How many main books are in the Percy Jackson series?',
      answer: 5,
    },
    {
      question: 'How many Wheel of Time books did Robert Jordan complete?',
      answer: 11,
    },
    { question: 'How many points is a king worth in Blackjack?', answer: 10 },
    {
      question: 'How many points is an ace worth in Blackjack (high value)?',
      answer: 11,
    },
    {
      question: 'How many tiles does each player start with in Scrabble?',
      answer: 7,
    },
    { question: 'How many dice are used in Yahtzee?', answer: 5 },
    {
      question: 'How many chips does each player start with in checkers?',
      answer: 12,
    },
    {
      question: 'How many cards are dealt to each player in Go Fish?',
      answer: 7,
    },
    {
      question:
        'How many balls are used in a game of pool (including cue ball)?',
      answer: 16,
    },
    {
      question: 'How many balls are pocketed in a perfect game of pool?',
      answer: 15,
    },
    {
      question: 'How many Jokers are in a standard deck with Jokers?',
      answer: 2,
    },
    {
      question:
        'How many spaces forward can a pawn move on its first move in chess?',
      answer: 2,
    },
    {
      question: 'How many spaces can a knight move in total in chess?',
      answer: 3,
    },
    { question: 'How many corner squares are on a chess board?', answer: 4 },
  ],
  animalsnature: [
    { question: 'How many hearts does an octopus have?', answer: 3 },
    {
      question: 'How many days is the gestation period of a giant panda?',
      answer: 135,
    },
    { question: 'How many legs does a spider have?', answer: 8 },
    { question: 'How many humps does a Bactrian camel have?', answer: 2 },
    { question: 'How many bones do sharks have?', answer: 0 },
    { question: 'How many eyes does a honeybee have?', answer: 5 },
    { question: 'How many legs does a lobster have?', answer: 10 },
    { question: 'How many chambers does a human heart have?', answer: 4 },
    { question: 'How many teeth does an adult human have?', answer: 32 },
    { question: 'How many wings does a dragonfly have?', answer: 4 },
    { question: 'How many bones are in the human body?', answer: 206 },
    { question: 'How many arms does a starfish typically have?', answer: 5 },
    { question: 'How many tentacles does a squid have?', answer: 10 },
    { question: 'How many pairs of chromosomes do humans have?', answer: 23 },
    { question: 'How many stomachs does a cow have?', answer: 4 },
    { question: 'How many stripes does a typical zebra have?', answer: 25 },
    { question: 'How many species of penguins exist?', answer: 18 },
    {
      question: "How many months is an elephant's gestation period?",
      answer: 22,
    },
    { question: 'How many legs does an insect have?', answer: 6 },
    { question: 'How many eyes does a typical spider have?', answer: 8 },
    { question: 'How many continents are there on Earth?', answer: 7 },
    { question: 'How many planets are in our solar system?', answer: 8 },
    { question: 'How many legs does a typical millipede have?', answer: 80 },
    { question: 'How many neck vertebrae does a giraffe have?', answer: 7 },
    { question: 'How many toes does a cat have on its front paws?', answer: 5 },
    { question: 'How many toes does a cat have on its front paws?', answer: 5 },
    { question: 'How many toes does a cat have on its back paws?', answer: 4 },
    { question: 'How many toes does a dog have on each paw?', answer: 5 },
    { question: 'How many humps does a dromedary camel have?', answer: 1 },
    { question: 'How many legs does a butterfly have?', answer: 6 },
    {
      question: 'How many legs does a centipede have per body segment?',
      answer: 2,
    },
    { question: 'How many teeth does a cat have?', answer: 30 },
    { question: 'How many teeth does a dog have?', answer: 42 },
    { question: 'How many arms does a squid have (not tentacles)?', answer: 8 },
    {
      question: 'How many brain cells does a honeybee have (in thousands)?',
      answer: 960,
    },
    { question: "How many days is a cat's gestation period?", answer: 63 },
    { question: "How many days is a dog's gestation period?", answer: 63 },
    { question: "How many days is a rabbit's gestation period?", answer: 31 },
    { question: 'How many eggs can a queen bee lay per day?', answer: 2000 },
    { question: 'How many antennae does an insect have?', answer: 2 },
    { question: 'How many body segments does an insect have?', answer: 3 },
    { question: 'How many wings does a mosquito have?', answer: 2 },
    { question: 'How many wings does a housefly have?', answer: 2 },
    { question: 'How many legs does a crab have?', answer: 10 },
    { question: 'How many legs does a shrimp have?', answer: 10 },
    { question: 'How many eyes does a common housefly have?', answer: 5 },
    { question: 'How many nostrils does a dolphin have?', answer: 1 },
    { question: 'How many toes does a horse have on each foot?', answer: 1 },
    { question: 'How many toes does a pig have on each foot?', answer: 4 },
    { question: 'How many toes does a chicken have?', answer: 4 },
    { question: 'How many moons does Earth have?', answer: 1 },
  ],
};

/* ===================================
   PUZZLE GENERATOR
   =================================== */

/**
 * Generate a random puzzle for given category and difficulty
 * @param {string} category - Category name (sports, history, geography, popculture, science)
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {object} Complete puzzle object ready for gameplay
 */
function generatePuzzle(category, difficulty = 'easy') {
  // Handle random difficulty selection
  let actualDifficulty = difficulty;
  if (difficulty === 'random') {
    const difficulties = ['easy', 'medium', 'hard'];
    actualDifficulty =
      difficulties[Math.floor(Math.random() * difficulties.length)];
    gameState.assignedDifficulty = actualDifficulty;
    console.log(`Random difficulty assigned: ${actualDifficulty}`);
  } else {
    gameState.assignedDifficulty = null;
    gameState.hintMode = false; // Reset hint mode
  }

  console.log(
    `Generating ${actualDifficulty} puzzle for category: ${category}`
  );

  // Step 1: Get questions from selected category
  let questions;
  if (category.toLowerCase() === 'everything') {
    // Combine all categories for maximum variety
    questions = [
      ...questionBanks.sports,
      ...questionBanks.history,
      ...questionBanks.geography,
      ...questionBanks.popculture,
      ...questionBanks.science,
    ];
    console.log(
      `Everything category: ${questions.length} total questions available`
    );
  } else {
    // Single category
    questions = questionBanks[category.toLowerCase()];
    if (!questions || questions.length < 5) {
      console.error(`Not enough questions in category: ${category}`);
      return null;
    }
  }

  // Step 2: Select 5 random questions (no duplicates)
  const selectedQuestions = selectRandomQuestions(questions, 5);

  // Step 3: Generate equations for selected difficulty
  const equations = [];
  const numberPool = [];
  let puzzleId = `${category}_${Date.now()}`;

  selectedQuestions.forEach((q, index) => {
    const eqId = index + 1;
    const answer = q.answer;

    // Choose operator based on difficulty
    let operator;
    if (actualDifficulty === 'hard') {
      // Hard: all 4 operators
      const operators = ['+', '-', 'Ã—', 'Ã·'];
      operator = operators[Math.floor(Math.random() * operators.length)];
    } else {
      // Easy/Medium: only + and -
      operator = Math.random() < 0.5 ? '+' : '-';
    }

    // Generate valid operand pair (pass difficulty for range limits)
    const operands = generateOperands(answer, operator, actualDifficulty);

    // Store equation
    equations.push({
      id: eqId,
      question: q.question,
      answer: answer,
      operator: operator,
      solution: {
        operand1: operands.op1,
        operand2: operands.op2,
        result: answer,
      },
    });

    // Add operands to number pool
    numberPool.push(operands.op1, operands.op2);
  });

  // Step 4: Calculate column targets from generated operands
  let column1Total = 0;
  let column2Total = 0;

  equations.forEach((eq) => {
    column1Total += eq.solution.operand1;
    column2Total += eq.solution.operand2;
  });

  // Step 5: Add decoy numbers based on difficulty
  const decoyCount =
    actualDifficulty === 'medium' ? 2 : actualDifficulty === 'hard' ? 6 : 0;

  if (decoyCount > 0) {
    const maxOperand = actualDifficulty === 'medium' ? 100 : 200;

    for (let i = 0; i < decoyCount; i++) {
      // Generate random decoy in valid range
      const decoy = randomInt(1, maxOperand);
      numberPool.push(decoy);
    }
  }

  // Step 6: Build puzzle object
  const puzzle = {
    id: puzzleId,
    category: category.charAt(0).toUpperCase() + category.slice(1),
    difficulty:
      actualDifficulty.charAt(0).toUpperCase() + actualDifficulty.slice(1),
    numberPool: numberPool,
    columnTargets: {
      column1: column1Total,
      column2: column2Total,
    },
    equations: equations,
  };

  console.log('Generated puzzle:', puzzle);
  return puzzle;
}

/**
 * Select N random questions from array without duplicates
 * @param {array} questions - Source question array
 * @param {number} count - Number of questions to select
 * @returns {array} Selected questions
 */
function selectRandomQuestions(questions, count) {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

/**
 * Generate valid operand pair for given answer and operator
 * @param {number} answer - The equation result
 * @param {string} operator - Either '+', '-', '×', or '÷'
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {object} { op1, op2 } operand pair
 */
function generateOperands(answer, operator, difficulty = 'easy') {
  // Determine max operand value based on difficulty
  const maxOperand =
    difficulty === 'easy' ? 50 : difficulty === 'medium' ? 100 : 200;

  // Normalize operator to handle different character encodings
  // Check for addition
  if (operator === '+' || operator === 'plus') {
    // For addition: op1 + op2 = answer
    const maxOp1 = Math.min(answer - 1, maxOperand);
    const minOp1 = Math.max(1, answer - maxOperand);

    const op1 = randomInt(minOp1, maxOp1);
    const op2 = answer - op1;

    return { op1, op2 };
  }

  // Check for subtraction
  else if (operator === '-' || operator === 'minus') {
    // For subtraction: op1 - op2 = answer
    const minOp1 = answer + 1;
    const maxOp1 = maxOperand;

    // Check if answer is too large for this difficulty
    if (answer >= maxOperand) {
      console.warn(
        `Answer ${answer} too large for subtraction in range 1-${maxOperand}, using addition instead`
      );

      // Fall back to addition
      const maxOp1 = Math.min(answer - 1, maxOperand);
      const minOp1 = Math.max(1, answer - maxOperand);
      const op1 = randomInt(minOp1, maxOp1);
      const op2 = answer - op1;

      return { op1, op2 };
    }

    const op1 = randomInt(minOp1, maxOp1);
    const op2 = op1 - answer;

    return { op1, op2 };
  }

  // Check for multiplication (handle multiple character formats)
  else if (
    operator === 'Ã—' ||
    operator === '×' ||
    operator === '*' ||
    operator === 'multiply'
  ) {
    // For multiplication: op1 Ã— op2 = answer
    // Find factors of answer that fit in range
    const factors = [];

    for (let i = 1; i <= Math.min(answer, maxOperand); i++) {
      if (answer % i === 0) {
        const other = answer / i;
        if (other >= 1 && other <= maxOperand) {
          factors.push([i, other]);
        }
      }
    }

    // If no valid factors found, fall back to addition
    if (factors.length === 0) {
      console.warn(
        `Answer ${answer} has no valid factors in range 1-${maxOperand}, using addition instead`
      );

      const maxOp1 = Math.min(answer - 1, maxOperand);
      const minOp1 = Math.max(1, answer - maxOperand);
      const op1 = randomInt(minOp1, maxOp1);
      const op2 = answer - op1;

      return { op1, op2 };
    }

    // Pick random factor pair
    const [op1, op2] = factors[Math.floor(Math.random() * factors.length)];
    return { op1, op2 };
  }

  // Check for division (handle multiple character formats)
  else if (
    operator === 'Ã·' ||
    operator === '÷' ||
    operator === '/' ||
    operator === 'divide'
  ) {
    // For division: op1 Ã· op2 = answer
    // op1 = answer Ã— op2, where op2 is a random divisor

    // Find valid divisors (op2) where result (op1) stays in range
    const validDivisors = [];

    for (let divisor = 2; divisor <= maxOperand; divisor++) {
      const op1 = answer * divisor;
      if (op1 >= 1 && op1 <= maxOperand) {
        validDivisors.push(divisor);
      }
    }

    // If no valid divisors found, fall back to addition
    if (validDivisors.length === 0) {
      console.warn(
        `Answer ${answer} has no valid divisors in range 1-${maxOperand}, using addition instead`
      );

      const maxOp1 = Math.min(answer - 1, maxOperand);
      const minOp1 = Math.max(1, answer - maxOperand);
      const op1 = randomInt(minOp1, maxOp1);
      const op2 = answer - op1;

      return { op1, op2 };
    }

    // Pick random divisor
    const op2 = validDivisors[Math.floor(Math.random() * validDivisors.length)];
    const op1 = answer * op2;

    return { op1, op2 };
  }

  // Fallback: if operator not recognized, use addition
  console.warn(`Unknown operator: "${operator}", falling back to addition`);
  const maxOp1 = Math.min(answer - 1, maxOperand);
  const minOp1 = Math.max(1, answer - maxOperand);
  const op1 = randomInt(minOp1, maxOp1);
  const op2 = answer - op1;
  return { op1, op2 };
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const gameState = {
  selectedNumber: null,
  selectedNumberElement: null,
  selectedBlank: null, // Selected blank waiting for pool number
  userInputs: {}, // Will store: { '0-0': 5, '0-1': 2, 'sol-0': 7, etc. }
  userOperators: {}, // Will store: { '0': '+', '1': '-', etc. }
  poolNumbersUsed: [], // Array of used numbers
  attempts: 0,
  completed: false,
  currentCategory: 'sports', // Currently selected category
  currentDifficulty: 'easy', // Currently selected difficulty
  hintsUsed: 0, // Number of hints used
  selectedEquationForHint: null, // Currently selected equation for hint
  hintedEquations: {}, // Object: { equationId: ['?', '#', '*'] } tracks hint types used
  assignedDifficulty: null, // Stores actual difficulty when "random" is selected
};

/* ===================================
  LOCAL STORAGE FUNCTIONS
  =================================== */

/**
 * Save current puzzle state to localStorage
 */
function savePuzzleState() {
  if (!currentPuzzle) return;

  try {
    // Collect hint-revealed elements for restoration
    const hintRevealedInputs = [];
    document.querySelectorAll('.hint-revealed').forEach((el) => {
      if (el.classList.contains('solution')) {
        hintRevealedInputs.push(el.dataset.position);
      } else if (el.classList.contains('operand')) {
        hintRevealedInputs.push(el.dataset.position);
      } else if (el.classList.contains('operator-select')) {
        const container = el.closest('.operator-container');
        if (container) {
          hintRevealedInputs.push(`operator-${container.dataset.equation}`);
        }
      }
    });

    const puzzleState = {
      puzzle: currentPuzzle,
      gameState: {
        userInputs: gameState.userInputs,
        userOperators: gameState.userOperators,
        poolNumbersUsed: gameState.poolNumbersUsed,
        attempts: gameState.attempts,
        hintsUsed: gameState.hintsUsed,
        hintedEquations: gameState.hintedEquations,
        hintRevealedInputs: hintRevealedInputs, // NEW: Track which elements were hint-revealed
        currentCategory: gameState.currentCategory,
        currentDifficulty: gameState.currentDifficulty,
        assignedDifficulty: gameState.assignedDifficulty,
      },
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('sumwords_currentPuzzle', JSON.stringify(puzzleState));
    console.log('Puzzle state saved to localStorage');
  } catch (error) {
    console.error('Failed to save puzzle state:', error);
    // Game continues to work even if save fails
  }
}

/**
 * Load puzzle state from localStorage
 * @returns {object|null} Saved puzzle state or null if none exists
 */
function loadPuzzleState() {
  try {
    const saved = localStorage.getItem('sumwords_currentPuzzle');
    if (!saved) return null;

    const puzzleState = JSON.parse(saved);
    console.log('Puzzle state loaded from localStorage');
    return puzzleState;
  } catch (error) {
    console.error('Failed to load puzzle state:', error);
    // Clear corrupted data
    localStorage.removeItem('sumwords_currentPuzzle');
    return null;
  }
}

/**
 * Check if saved puzzle has meaningful progress
 * @param {object} puzzleState - Saved puzzle state
 * @returns {boolean} True if user made at least one move
 */
function hasMeaningfulProgress(puzzleState) {
  if (!puzzleState || !puzzleState.gameState) return false;

  const state = puzzleState.gameState;

  // Check if any numbers were placed from pool
  if (state.poolNumbersUsed && state.poolNumbersUsed.length > 0) {
    return true;
  }

  // Check if any solutions were entered
  if (state.userInputs) {
    const hasAnswers = Object.keys(state.userInputs).some(
      (key) => key.startsWith('sol') && state.userInputs[key] !== undefined
    );
    if (hasAnswers) return true;
  }

  // Check if any operators were selected (Medium/Hard)
  if (state.userOperators && Object.keys(state.userOperators).length > 0) {
    return true;
  }

  // Check if any hints were used
  if (state.hintsUsed && state.hintsUsed > 0) {
    return true;
  }

  // Check if any attempts were made
  if (state.attempts && state.attempts > 0) {
    return true;
  }

  // No meaningful progress
  return false;
}

/**
 * Clear saved puzzle from localStorage
 */
function clearPuzzleState() {
  try {
    localStorage.removeItem('sumwords_currentPuzzle');
    console.log('Puzzle state cleared from localStorage');
  } catch (error) {
    console.error('Failed to clear puzzle state:', error);
  }
}

/**
 * Save user preferences (category, difficulty)
 */
function savePreferences() {
  try {
    const preferences = {
      category: gameState.currentCategory,
      difficulty: gameState.currentDifficulty,
    };

    localStorage.setItem('sumwords_preferences', JSON.stringify(preferences));
    console.log('Preferences saved:', preferences);
  } catch (error) {
    console.error('Failed to save preferences:', error);
  }
}

/**
 * Load user preferences
 * @returns {object|null} Saved preferences or null
 */
function loadPreferences() {
  try {
    const saved = localStorage.getItem('sumwords_preferences');
    if (!saved) return null;

    const preferences = JSON.parse(saved);
    console.log('Preferences loaded:', preferences);
    return preferences;
  } catch (error) {
    console.error('Failed to load preferences:', error);
    localStorage.removeItem('sumwords_preferences');
    return null;
  }
}

/**
 * Initialize statistics object with default values
 * @returns {object} Default statistics structure
 */
function getDefaultStats() {
  return {
    overall: {
      totalCompleted: 0,
      totalAttempts: 0,
      totalHints: 0,
      perfectGames: 0,
      currentStreak: 0,
      bestStreak: 0,
    },
    easy: {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    },
    medium: {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    },
    hard: {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    },
    random: {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    },
  };
}

/**
 * Load statistics from localStorage
 * @returns {object} Statistics object
 */
function loadStatistics() {
  try {
    const saved = localStorage.getItem('sumwords_statistics');
    if (!saved) return getDefaultStats();

    const stats = JSON.parse(saved);
    console.log('Statistics loaded:', stats);
    return stats;
  } catch (error) {
    console.error('Failed to load statistics:', error);
    localStorage.removeItem('sumwords_statistics');
    return getDefaultStats();
  }
}

/**
 * Save statistics to localStorage
 * @param {object} stats - Statistics object to save
 */
function saveStatistics(stats) {
  try {
    localStorage.setItem('sumwords_statistics', JSON.stringify(stats));
    console.log('Statistics saved:', stats);
  } catch (error) {
    console.error('Failed to save statistics:', error);
  }
}

/**
 * Update statistics when puzzle is completed
 * @param {string} difficulty - Difficulty level (easy/medium/hard) - the ACTUAL difficulty played
 * @param {number} attempts - Number of attempts taken
 * @param {number} hints - Number of hints used
 */
function updateStatistics(difficulty, attempts, hints) {
  const stats = loadStatistics();
  const isPerfect = attempts === 1 && hints === 0;
  const selectedDifficulty = gameState.currentDifficulty; // This might be "random"

  // Update overall stats
  stats.overall.totalCompleted++;
  stats.overall.totalAttempts += attempts;
  stats.overall.totalHints += hints;
  if (isPerfect) stats.overall.perfectGames++;

  // Update streak
  stats.overall.currentStreak++;
  if (stats.overall.currentStreak > stats.overall.bestStreak) {
    stats.overall.bestStreak = stats.overall.currentStreak;
  }

  // Update difficulty-specific stats (always track by actual difficulty played)
  if (!stats[difficulty]) {
    stats[difficulty] = {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    };
  }
  stats[difficulty].completed++;
  stats[difficulty].attempts += attempts;
  stats[difficulty].hints += hints;
  if (isPerfect) stats[difficulty].perfectGames++;

  // If user selected "random", ALSO track in random category
  if (selectedDifficulty === 'random') {
    if (!stats.random) {
      stats.random = {
        completed: 0,
        attempts: 0,
        hints: 0,
        perfectGames: 0,
      };
    }
    stats.random.completed++;
    stats.random.attempts += attempts;
    stats.random.hints += hints;
    if (isPerfect) stats.random.perfectGames++;
  }

  saveStatistics(stats);
  console.log(`Statistics updated for ${difficulty} difficulty:`, stats);
  if (selectedDifficulty === 'random') {
    console.log('Also tracked in random category');
  }
}

/**
 * Reset current win streak (called when user gives up or resets)
 */
function resetStreak() {
  const stats = loadStatistics();
  stats.overall.currentStreak = 0;
  saveStatistics(stats);
  console.log('Win streak reset');
}

/* ===================================
  INITIALIZATION
  =================================== */

// Current puzzle (will be set by generator)
let currentPuzzle = null;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
  console.log('========================================');
  console.log('DOM CONTENT LOADED - INITIALIZING GAME');
  console.log('========================================');
  initializeGame();
});

function initializeGame() {
  console.log('========================================');
  console.log('INITIALIZE GAME FUNCTION CALLED');
  console.log('========================================');

  // Load saved preferences
  const savedPreferences = loadPreferences();
  const categorySelect = document.getElementById('category-select');
  const difficultySelect = document.getElementById('difficulty-select');

  if (!categorySelect || !difficultySelect) {
    console.error('ERROR: Could not find dropdown elements');
    return;
  }

  if (savedPreferences) {
    categorySelect.value = savedPreferences.category;
    difficultySelect.value = savedPreferences.difficulty;
    gameState.currentCategory = savedPreferences.category;
    gameState.currentDifficulty = savedPreferences.difficulty;
    console.log('Loaded saved preferences:', savedPreferences);
  } else {
    // Use default values from dropdowns
    gameState.currentCategory = categorySelect.value;
    gameState.currentDifficulty = difficultySelect.value;
  }

  console.log('Selected category:', gameState.currentCategory);
  console.log('Selected difficulty:', gameState.currentDifficulty);

  // Set up event listeners FIRST (before showing any modals)
  setupEventListeners();
  setupStatsModalListeners();

  // Check for saved puzzle state
  const savedPuzzle = loadPuzzleState();

  if (savedPuzzle && hasMeaningfulProgress(savedPuzzle)) {
    // Show resume modal only if user made progress
    showResumeModal(savedPuzzle);
  } else {
    // No saved puzzle or no progress - start fresh
    if (savedPuzzle) {
      clearPuzzleState(); // Clear the empty saved puzzle
    }
    startNewGame();
  }

  console.log('Game initialized');
}

/**
 * Show the resume modal
 * @param {object} savedPuzzle - The saved puzzle state
 */
function showResumeModal(savedPuzzle) {
  const modal = document.getElementById('resume-modal');
  const resumeBtn = document.getElementById('resume-btn');
  const newGameBtn = document.getElementById('new-game-btn');

  // Show modal
  modal.classList.remove('hidden');

  // Resume button handler
  resumeBtn.onclick = () => {
    console.log('User chose to resume puzzle');
    modal.classList.add('hidden');
    resumeSavedGame(savedPuzzle);
  };

  // New game button handler
  newGameBtn.onclick = () => {
    console.log('User chose to start new puzzle');
    modal.classList.add('hidden');
    clearPuzzleState();
    startNewGame();
  };
}

/**
 * Start a new game
 */
function startNewGame() {
  // Generate a new puzzle
  currentPuzzle = generatePuzzle(
    gameState.currentCategory,
    gameState.currentDifficulty
  );

  if (!currentPuzzle) {
    console.error('Failed to generate puzzle');
    showFeedback(
      'Failed to generate puzzle. Please refresh the page.',
      'error'
    );
    return;
  }

  // Load puzzle into UI
  loadPuzzle(currentPuzzle);

  // Save the new puzzle state
  savePuzzleState();

  console.log('New game started:', currentPuzzle);
}

/**
 * Resume a saved game
 * @param {object} savedPuzzle - The saved puzzle state
 */
function resumeSavedGame(savedPuzzle) {
  // Restore puzzle data
  currentPuzzle = savedPuzzle.puzzle;

  // Restore game state
  gameState.userInputs = savedPuzzle.gameState.userInputs || {}; // FIXED: was userAnswers
  gameState.userOperators = savedPuzzle.gameState.userOperators || {};
  gameState.poolNumbersUsed = savedPuzzle.gameState.poolNumbersUsed || [];
  gameState.attempts = savedPuzzle.gameState.attempts || 0;
  gameState.hintsUsed = savedPuzzle.gameState.hintsUsed || 0;
  gameState.hintedEquations = savedPuzzle.gameState.hintedEquations || {};
  gameState.currentCategory = savedPuzzle.gameState.currentCategory;
  gameState.currentDifficulty = savedPuzzle.gameState.currentDifficulty;
  gameState.assignedDifficulty =
    savedPuzzle.gameState.assignedDifficulty || null;

  // Update dropdowns to match saved puzzle
  document.getElementById('category-select').value = gameState.currentCategory;
  document.getElementById('difficulty-select').value =
    gameState.currentDifficulty;

  // Load puzzle into UI
  loadPuzzle(currentPuzzle);

  // Restore user inputs to UI
  restoreUserInputs(savedPuzzle.gameState);

  // Update counters
  document.getElementById('attempt-count').textContent = gameState.attempts;
  document.getElementById('hint-count').textContent = gameState.hintsUsed;

  showFeedback('Puzzle resumed!', 'success');
  console.log('Game resumed from saved state');
}

/**
 * Restore user inputs to the UI
 * @param {object} savedGameState - The saved game state
 */
function restoreUserInputs(savedGameState) {
  // IMPORTANT: Restore userInputs to gameState FIRST (needed for updateColumnTotals)
  gameState.userInputs = savedGameState.userInputs || {};

  // Restore operand blanks (userInputs contains both operands and solutions)
  Object.keys(savedGameState.userInputs || {}).forEach((position) => {
    const value = savedGameState.userInputs[position];

    if (position.startsWith('op')) {
      // Operand blank
      const blank = document.querySelector(`[data-position="${position}"]`);
      if (blank) {
        blank.textContent = value;
        blank.classList.add('filled');
      }
    } else if (position.startsWith('sol')) {
      // Solution input
      const input = document.querySelector(`[data-position="${position}"]`);
      if (input) {
        input.value = value;
      }
    }
  });

  // Mark used pool numbers
  savedGameState.poolNumbersUsed.forEach((number) => {
    const poolNumbers = document.querySelectorAll('.pool-number');
    let marked = false;

    poolNumbers.forEach((poolNum) => {
      if (
        !marked &&
        parseInt(poolNum.dataset.number) === number &&
        !poolNum.classList.contains('used')
      ) {
        poolNum.classList.add('used');
        marked = true;
      }
    });
  });

  // Restore operator selections (Medium/Hard)
  Object.keys(savedGameState.userOperators || {}).forEach((equationId) => {
    const operator = savedGameState.userOperators[equationId];
    const select = document.querySelector(
      `[data-equation="${equationId}"] .operator-select`
    );
    if (select) {
      select.value = operator;
    }
  });

  // Restore hinted equations and hint markers
  Object.keys(savedGameState.hintedEquations || {}).forEach((equationId) => {
    const equation = document.querySelector(`[data-equation="${equationId}"]`);
    if (equation) {
      equation.classList.add('hinted');

      // Restore hint marker emojis
      const markers = savedGameState.hintedEquations[equationId] || [];
      if (markers.length > 0) {
        const equationNumber = equation.querySelector('.equation-number');
        if (equationNumber) {
          const baseNumber = parseInt(equationId) + 1;
          equationNumber.textContent = `${baseNumber}. ${markers.join(' ')}`;
        }
      }
    }
  });

  // Restore hint-revealed styling
  (savedGameState.hintRevealedInputs || []).forEach((position) => {
    if (position.startsWith('operator-')) {
      // Operator dropdown
      const equationId = position.replace('operator-', '');
      const select = document.querySelector(
        `[data-equation="${equationId}"] .operator-select`
      );
      if (select) {
        select.classList.add('hint-revealed');
      }
    } else {
      // Operand or solution
      const element = document.querySelector(`[data-position="${position}"]`);
      if (element) {
        element.classList.add('hint-revealed');
      }
    }
  });

  // Update column totals
  updateColumnTotals();
}

/**
 * Load a puzzle into the game UI
 * @param {object} puzzle - Puzzle object to load
 */
function loadPuzzle(puzzle) {
  console.log('=== LOAD PUZZLE START ===');
  console.log('Puzzle object:', puzzle);
  console.log('Puzzle difficulty:', puzzle?.difficulty);
  console.log('Number of equations:', puzzle?.equations?.length);

  // Show assigned difficulty if random was selected
  const assignedDifficultyEl = document.getElementById('assigned-difficulty');
  if (gameState.assignedDifficulty) {
    const difficultyName =
      gameState.assignedDifficulty.charAt(0).toUpperCase() +
      gameState.assignedDifficulty.slice(1);
    assignedDifficultyEl.textContent = `Playing: ${difficultyName}`;
    assignedDifficultyEl.style.display = 'block';
  } else {
    assignedDifficultyEl.style.display = 'none';
  }

  // Header dropdowns already show category/difficulty, no need to update

  // Update column targets
  document.getElementById('col1-goal').textContent =
    puzzle.columnTargets.column1;
  document.getElementById('col2-goal').textContent =
    puzzle.columnTargets.column2;

  // Update equation questions and operators
  console.log('=== UPDATING EQUATIONS ===');
  puzzle.equations.forEach((eq) => {
    console.log(`Processing equation ${eq.id}`);
    const equationDiv = document.querySelector(`[data-equation="${eq.id}"]`);
    equationDiv.querySelector('.question').textContent = eq.question;

    // Handle operator display based on difficulty
    const operatorContainer = equationDiv.querySelector('.operator-container');
    console.log(
      `  Operator container found:`,
      operatorContainer ? 'YES' : 'NO'
    );

    const visibleOperator = operatorContainer.querySelector('.operator');
    console.log(
      `  Static operator element found:`,
      visibleOperator ? 'YES' : 'NO'
    );

    const operatorSelect = operatorContainer.querySelector('.operator-select');
    console.log(`  Operator dropdown found:`, operatorSelect ? 'YES' : 'NO');

    console.log(`  Puzzle difficulty check: '${puzzle.difficulty}'`);

    if (puzzle.difficulty === 'Easy') {
      console.log('  Setting EASY visibility');
      // Easy: show operator, hide select
      visibleOperator.textContent = eq.operator;
      visibleOperator.classList.remove('hidden');
      visibleOperator.classList.add('visible');
      operatorSelect.classList.remove('visible');
      operatorSelect.classList.add('hidden');
    } else {
      console.log('  Setting MEDIUM/HARD visibility');
      // Medium/Hard: hide operator, show select
      visibleOperator.classList.remove('visible');
      visibleOperator.classList.add('hidden');
      operatorSelect.classList.remove('hidden');
      operatorSelect.classList.add('visible');

      // Limit options based on difficulty
      const options = operatorSelect.querySelectorAll('option');
      if (puzzle.difficulty === 'Medium') {
        // Medium: only + and -
        options.forEach((opt) => {
          if (opt.value === '×' || opt.value === '÷') {
            opt.style.display = 'none';
          } else {
            opt.style.display = '';
          }
        });
      } else {
        // Hard: all operators
        options.forEach((opt) => {
          opt.style.display = '';
        });
      }

      // Reset to placeholder
      operatorSelect.value = '';
    }
  });

  // Clear any previous state
  console.log('Calling resetGameState...');
  resetGameState();

  // Populate number pool
  console.log('Calling renderNumberPool...');
  renderNumberPool(puzzle);

  // Update column totals (initially 0)
  console.log('Calling updateColumnTotals...');
  updateColumnTotals();

  // Initialize hint button states (disabled until equation selected)
  updateHintButtonStates();

  console.log('=== LOAD PUZZLE END ===');
}

/**
 * Reset game state for new puzzle
 */
function resetGameState() {
  gameState.selectedNumber = null;
  gameState.selectedNumberElement = null;
  gameState.userInputs = {};
  gameState.userOperators = {};
  gameState.poolNumbersUsed = [];
  gameState.attempts = 0;
  gameState.completed = false;
  gameState.hintsUsed = 0;
  gameState.selectedEquationForHint = null;
  gameState.hintedEquations = {}; // Reset to empty object
  gameState.assignedDifficulty = null;

  // Clear UI - operand blanks
  document.querySelectorAll('.blank.operand').forEach((blank) => {
    blank.textContent = '';
    blank.classList.remove('filled', 'selected', 'hint-revealed');
  });

  // Clear UI - solution inputs
  document.querySelectorAll('.blank.solution').forEach((input) => {
    input.value = '';
    input.classList.remove('hint-revealed');
  });

  // Clear UI - operator selections
  document.querySelectorAll('.operator-select').forEach((select) => {
    select.value = '';
    select.classList.remove('hint-revealed');
  });

  // Clear UI - equations
  document.querySelectorAll('.equation').forEach((eq) => {
    eq.classList.remove('error', 'hinted', 'selected-for-hint');

    // Reset equation numbers (remove hint markers)
    const equationNumber = eq.querySelector('.equation-number');
    if (equationNumber) {
      const equationId = parseInt(eq.dataset.equation);
      equationNumber.textContent = `${equationId + 1}.`;
    }
  });

  // Reset counters
  document.getElementById('attempt-count').textContent = '0';
  document.getElementById('hint-count').textContent = '0';

  // Reset buttons
  document.getElementById('submit-btn').disabled = false;
  updateHintButtonStates(); // Disable hint buttons (no equation selected)

  // Clear feedback
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';
}

/* ===================================
  RENDER NUMBER POOL
  =================================== */

function renderNumberPool(puzzle) {
  const poolContainer = document.getElementById('number-pool');
  poolContainer.innerHTML = ''; // Clear existing

  const poolToRender = puzzle || currentPuzzle;

  // Set difficulty attribute for grid sizing
  poolContainer.setAttribute(
    'data-difficulty',
    poolToRender.difficulty.toLowerCase()
  );

  // Shuffle the number pool for random display order
  const shuffledPool = [...poolToRender.numberPool].sort(
    () => Math.random() - 0.5
  );

  shuffledPool.forEach((number, index) => {
    const button = document.createElement('button');
    button.className = 'pool-number';
    button.textContent = number;
    button.dataset.number = number;
    button.dataset.index = index;

    poolContainer.appendChild(button);
  });
}

/* ===================================
  EVENT LISTENERS
  =================================== */

function setupEventListeners() {
  // Number pool clicks
  document
    .getElementById('number-pool')
    .addEventListener('click', handlePoolClick);

  // Operand blank clicks
  document.querySelectorAll('.blank.operand').forEach((blank) => {
    blank.addEventListener('click', handleOperandClick);
  });

  // Solution input changes (with validation)
  document.querySelectorAll('.blank.solution').forEach((input, index) => {
    input.addEventListener('input', validateSolutionInput);
    input.addEventListener('input', handleSolutionInput); // For logging
  });

  // Submit button
  document.getElementById('submit-btn').addEventListener('click', handleSubmit);

  // Header buttons
  document
    .getElementById('stats-btn')
    .addEventListener('click', showStatsModal);
  document
    .getElementById('new-puzzle-btn')
    .addEventListener('click', handleNewPuzzle);
  document.getElementById('reset-btn').addEventListener('click', handleReset);

  // Category and difficulty selectors
  document
    .getElementById('category-select')
    .addEventListener('change', handleCategoryChange);
  document
    .getElementById('difficulty-select')
    .addEventListener('change', handleDifficultyChange);

  // Hint system - three separate reveal buttons
  document
    .getElementById('reveal-answer-btn')
    .addEventListener('click', revealAnswer);
  document
    .getElementById('reveal-numbers-btn')
    .addEventListener('click', revealNumbers);
  document
    .getElementById('reveal-operator-btn')
    .addEventListener('click', revealOperator);

  // Operator selection for Medium/Hard
  document.querySelectorAll('.operator-select').forEach((select) => {
    select.addEventListener('change', handleOperatorSelect);
  });

  // Equation selection for hints
  document.querySelectorAll('.equation').forEach((equation) => {
    equation.addEventListener('click', handleEquationSelect);
  });

  console.log('========================================');
  console.log('EVENT LISTENERS SET UP COMPLETE');
  console.log(
    'Difficulty select listener attached to:',
    document.getElementById('difficulty-select')
  );
  console.log('========================================');
}
/* ===================================
  POOL NUMBER CLICK HANDLER
  =================================== */

function handlePoolClick(event) {
  const clickedNumber = event.target.closest('.pool-number');
  if (!clickedNumber) return;

  // Ignore if already used
  if (clickedNumber.classList.contains('used')) return;

  // If clicking already selected number, deselect it
  if (clickedNumber.classList.contains('selected')) {
    deselectPoolNumber();
    return;
  }

  // If a blank is selected, place this number in it immediately
  if (gameState.selectedBlank) {
    const blank = gameState.selectedBlank;
    const position = blank.dataset.position;

    // Set up selected number state temporarily
    gameState.selectedNumber = parseInt(clickedNumber.dataset.number);
    gameState.selectedNumberElement = clickedNumber;

    // Place in blank
    placeNumberInBlank(blank, position);

    // Deselect blank
    deselectBlank();

    return;
  }

  // Deselect previous pool selection
  deselectPoolNumber();

  // Select this number
  clickedNumber.classList.add('selected');
  gameState.selectedNumber = parseInt(clickedNumber.dataset.number);
  gameState.selectedNumberElement = clickedNumber;

  console.log('Selected pool number:', gameState.selectedNumber);
}

function deselectPoolNumber() {
  if (gameState.selectedNumberElement) {
    gameState.selectedNumberElement.classList.remove('selected');
  }
  gameState.selectedNumber = null;
  gameState.selectedNumberElement = null;
}

/* ===================================
  OPERAND BLANK CLICK HANDLER
  =================================== */

function handleOperandClick(event) {
  // HINT MODE: Reveal the correct number for this blank
  if (gameState.hintMode) {
    const blank = event.target;
    const position = blank.dataset.position;

    // Parse position to get equation and operand index (e.g., "op1-3" -> equation 3, operand 1)
    const matches = position.match(/op(\d)-(\d)/);
    if (!matches) return;

    const operandNum = parseInt(matches[1]);
    const equationId = parseInt(matches[2]);
    const operandIndex = operandNum - 1; // Convert to 0-based index

    // Find the correct number for this blank
    const equation = currentPuzzle.equations.find((eq) => eq.id === equationId);
    if (!equation) return;

    const correctNumber = equation.solution[`operand${operandNum}`];

    // Set the correct number in gameState
    gameState.userInputs[position] = correctNumber;

    // Update visual
    blank.textContent = correctNumber;
    blank.classList.add('filled', 'hint-revealed');

    // Track hint usage
    gameState.hintsUsed++;
    if (!gameState.hintedEquations.includes(equationId)) {
      gameState.hintedEquations.push(equationId);
    }

    // Update hint counter display
    document.getElementById('hint-count').textContent = gameState.hintsUsed;

    // Mark equation as hinted
    const equationElement = document.querySelector(
      `[data-equation="${equationId}"]`
    );
    equationElement.classList.add('hinted');

    updateColumnTotals();
    savePuzzleState();

    // Exit hint mode
    exitHintMode();
    showFeedback('Blank revealed!', 'success');
    return; // Exit early, don't do normal operand click behavior
  }
  const blank = event.currentTarget;
  const position = blank.dataset.position;

  // If blank is filled, return number to pool
  if (blank.classList.contains('filled')) {
    returnNumberToPool(blank, position);
    return;
  }

  // If no number selected, select this blank to receive next pool click
  if (gameState.selectedNumber === null) {
    selectBlankForPlacement(blank);
    return;
  }

  // Place selected number in blank
  placeNumberInBlank(blank, position);
}

/**
 * Select a blank to receive the next pool number clicked
 */
function selectBlankForPlacement(blank) {
  // Deselect any previously selected blank
  document.querySelectorAll('.blank.operand.selected').forEach((b) => {
    b.classList.remove('selected');
  });

  // Select this blank
  blank.classList.add('selected');
  gameState.selectedBlank = blank;

  console.log('Blank selected, click a pool number to place it here');
}

/**
 * Deselect the selected blank
 */
function deselectBlank() {
  if (gameState.selectedBlank) {
    gameState.selectedBlank.classList.remove('selected');
  }
  gameState.selectedBlank = null;
}

function placeNumberInBlank(blank, position) {
  // Set blank value and styling
  blank.textContent = gameState.selectedNumber;
  blank.classList.add('filled');

  // Store in game state
  gameState.userInputs[position] = gameState.selectedNumber;

  // Mark pool number as used
  gameState.selectedNumberElement.classList.add('used');
  gameState.poolNumbersUsed.push(gameState.selectedNumber);

  console.log(`Placed ${gameState.selectedNumber} in ${position}`);

  // Deselect pool number, blank, and update totals
  deselectPoolNumber();
  deselectBlank();
  updateColumnTotals();
  savePuzzleState(); // AUTO-SAVE after number placement
}

function returnNumberToPool(blank, position) {
  const numberValue = gameState.userInputs[position];

  // Clear blank
  blank.textContent = '';
  blank.classList.remove('filled');

  // Remove from game state
  delete gameState.userInputs[position];

  // Find and restore the FIRST 'used' pool number with this value
  const poolNumbers = document.querySelectorAll('.pool-number');
  let restored = false;

  poolNumbers.forEach((poolNum) => {
    if (
      !restored &&
      parseInt(poolNum.dataset.number) === numberValue &&
      poolNum.classList.contains('used')
    ) {
      poolNum.classList.remove('used');
      restored = true;

      // Remove ONE instance from used array
      const index = gameState.poolNumbersUsed.indexOf(numberValue);
      if (index > -1) {
        gameState.poolNumbersUsed.splice(index, 1);
      }
    }
  });

  console.log(`Returned ${numberValue} from ${position} to pool`);
  updateColumnTotals();
  savePuzzleState(); // AUTO-SAVE after returning number
}

/* ===================================
  SOLUTION INPUT HANDLER
  =================================== */

function handleSolutionInput(event) {
  // Validation is now handled by validateSolutionInput()
  // This function can be removed or kept for logging
  const position = event.target.dataset.position;
  const value = gameState.userInputs[position];

  console.log(`Solution entered for ${position}:`, value);
}

/* ===================================
  COLUMN TOTALS UPDATE
  =================================== */

function updateColumnTotals() {
  let col1Total = 0;
  let col2Total = 0;

  // Sum column 1 (first operands: op1-1, op1-2, op1-3, op1-4, op1-5)
  for (let i = 1; i <= 5; i++) {
    const key = `op1-${i}`;
    if (gameState.userInputs[key]) {
      col1Total += gameState.userInputs[key];
    }
  }

  // Sum column 2 (second operands: op2-1, op2-2, op2-3, op2-4, op2-5)
  for (let i = 1; i <= 5; i++) {
    const key = `op2-${i}`;
    if (gameState.userInputs[key]) {
      col2Total += gameState.userInputs[key];
    }
  }

  // Update display
  document.getElementById('col1-current').textContent = col1Total;
  document.getElementById('col2-current').textContent = col2Total;

  // Update visual status using current puzzle targets
  updateColumnStatus('col1', col1Total, currentPuzzle.columnTargets.column1);
  updateColumnStatus('col2', col2Total, currentPuzzle.columnTargets.column2);
}

function updateColumnStatus(columnId, current, target) {
  const targetElement = document.querySelector(
    `.target:nth-child(${columnId === 'col1' ? 1 : 2})`
  );

  // Remove existing status classes
  targetElement.classList.remove('correct', 'incorrect', 'incomplete');

  // Add appropriate class
  if (current === 0) {
    // No class when empty
  } else if (current === target) {
    targetElement.classList.add('correct');
  } else {
    targetElement.classList.add('incorrect');
  }
}

/* ===================================
  SUBMIT & VALIDATION
  =================================== */

function handleSubmit() {
  if (gameState.completed) {
    showFeedback('You already completed this puzzle!', 'warning');
    return;
  }

  // Increment attempts
  gameState.attempts++;
  document.getElementById('attempt-count').textContent = gameState.attempts;

  // Validate all conditions
  const validation = validatePuzzle();

  if (validation.success) {
    handleWin();
  } else {
    handleErrors(validation.errors);
  }
}

function validatePuzzle() {
  const errors = [];

  // Check 1: All pool numbers used
  if (gameState.poolNumbersUsed.length !== currentPuzzle.numberPool.length) {
    errors.push(
      `Only ${gameState.poolNumbersUsed.length}/10 pool numbers used`
    );
  }

  // Check 2: Column 1 total correct
  let col1Total = 0;
  for (let i = 1; i <= 5; i++) {
    col1Total += gameState.userInputs[`op1-${i}`] || 0;
  }
  if (col1Total !== currentPuzzle.columnTargets.column1) {
    errors.push(
      `Column 1 total is ${col1Total}, should be ${currentPuzzle.columnTargets.column1}`
    );
  }

  // Check 3: Column 2 total correct
  let col2Total = 0;
  for (let i = 1; i <= 5; i++) {
    col2Total += gameState.userInputs[`op2-${i}`] || 0;
  }
  if (col2Total !== currentPuzzle.columnTargets.column2) {
    errors.push(
      `Column 2 total is ${col2Total}, should be ${currentPuzzle.columnTargets.column2}`
    );
  }

  // Check 4: All equations mathematically valid
  const invalidEquations = [];
  currentPuzzle.equations.forEach((eq) => {
    const op1 = gameState.userInputs[`op1-${eq.id}`];
    const op2 = gameState.userInputs[`op2-${eq.id}`];
    const sol = gameState.userInputs[`sol-${eq.id}`];

    if (!op1 || !op2 || !sol) {
      invalidEquations.push(eq.id);
      return;
    }

    // Get operator - either from puzzle (Easy) or user selection (Medium/Hard)
    let operator;
    if (currentPuzzle.difficulty === 'Easy') {
      operator = eq.operator;
    } else {
      operator = gameState.userOperators[eq.id];

      // Check if operator selected
      if (!operator) {
        invalidEquations.push(eq.id);
        return;
      }
    }

    // Calculate result based on operator
    let result;
    if (operator === '+') {
      result = op1 + op2;
    } else if (operator === '-') {
      result = op1 - op2;
    } else if (operator === '×') {
      result = op1 * op2;
    } else if (operator === '÷') {
      result = op1 / op2;
    }

    // Check if result matches solution AND correct operator chosen
    if (
      result !== sol ||
      (currentPuzzle.difficulty !== 'Easy' && operator !== eq.operator)
    ) {
      invalidEquations.push(eq.id);
    }
  });

  if (invalidEquations.length > 0) {
    errors.push(`Equations ${invalidEquations.join(', ')} are incorrect`);

    // Highlight incorrect equations
    invalidEquations.forEach((id) => {
      document.querySelector(`[data-equation="${id}"]`).classList.add('error');
    });
  } else {
    // Clear error highlighting
    document
      .querySelectorAll('.equation')
      .forEach((eq) => eq.classList.remove('error'));
  }

  // Check 5: Solutions match trivia answers
  currentPuzzle.equations.forEach((eq) => {
    const userAnswer = gameState.userInputs[`sol-${eq.id}`];
    if (userAnswer !== eq.answer) {
      errors.push(
        `Question ${eq.id} answer is ${userAnswer}, should be ${eq.answer}`
      );
    }
  });

  return {
    success: errors.length === 0,
    errors: errors,
  };
}

function handleWin() {
  gameState.completed = true;

  // Update statistics
  updateStatistics(
    gameState.currentDifficulty,
    gameState.attempts,
    gameState.hintsUsed
  );

  // Clear saved puzzle (completed)
  clearPuzzleState();

  // Show win message
  showFeedback(
    `🎉 Puzzle Complete! Attempts: ${gameState.attempts}, Hints: ${gameState.hintsUsed}`,
    'success'
  );

  // Trigger confetti
  triggerConfetti();

  console.log('Puzzle completed! Statistics updated.');
}

function handleErrors(errors) {
  const message = 'Not quite right:\n' + errors.join('\n');
  showFeedback(message, 'error');

  console.log('Validation errors:', errors);
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

/* ===================================
  NEW PUZZLE & RESET HANDLERS
  =================================== */

/**
 * Generate and load a completely new puzzle
 */
function handleNewPuzzle() {
  console.log('New puzzle requested');

  // Generate new puzzle
  currentPuzzle = generatePuzzle(
    gameState.currentCategory,
    gameState.currentDifficulty
  );

  if (!currentPuzzle) {
    showFeedback('Failed to generate puzzle. Please try again.', 'error');
    return;
  }

  loadPuzzle(currentPuzzle);
  showFeedback('New puzzle loaded!', 'success');

  clearPuzzleState(); // Clear old saved puzzle
  savePuzzleState(); // Save the fresh puzzle
}

/**
 * Reset current puzzle (clear all inputs, keep same puzzle)
 */
function handleReset() {
  // Clear all user inputs
  gameState.userInputs = {};
  gameState.userOperators = {};
  gameState.poolNumbersUsed = [];
  gameState.selectedNumber = null;
  gameState.selectedNumberElement = null;
  gameState.selectedBlank = null;
  gameState.attempts = 0;
  gameState.completed = false;
  gameState.hintsUsed = 0;
  gameState.selectedEquationForHint = null;
  gameState.hintedEquations = {}; // Reset to empty object

  // Clear UI - operand blanks
  document.querySelectorAll('.blank.operand').forEach((blank) => {
    blank.textContent = '';
    blank.classList.remove('filled', 'selected', 'hint-revealed');
  });

  // Clear UI - solution inputs
  document.querySelectorAll('.blank.solution').forEach((input) => {
    input.value = '';
    input.classList.remove('hint-revealed');
  });

  // Clear UI - operator selections
  document.querySelectorAll('.operator-select').forEach((select) => {
    select.value = '';
    select.classList.remove('hint-revealed');
  });

  // Clear UI - equations
  document.querySelectorAll('.equation').forEach((eq) => {
    eq.classList.remove('error', 'hinted', 'selected-for-hint');

    // Reset equation numbers (remove hint markers)
    const equationNumber = eq.querySelector('.equation-number');
    if (equationNumber) {
      const equationId = parseInt(eq.dataset.equation);
      equationNumber.textContent = `${equationId + 1}.`;
    }
  });

  // Clear UI - pool numbers
  document.querySelectorAll('.pool-number').forEach((num) => {
    num.classList.remove('used', 'selected');
  });

  // Reset counters
  document.getElementById('attempt-count').textContent = '0';
  document.getElementById('hint-count').textContent = '0';

  // Reset buttons
  document.getElementById('submit-btn').disabled = false;
  updateHintButtonStates(); // Disable hint buttons (no equation selected)

  // Clear feedback
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';

  // Update column totals to 0
  updateColumnTotals();

  showFeedback('Puzzle reset. Try again!', 'warning');

  console.log('Puzzle reset');

  // Reset streak (user gave up on this puzzle)
  resetStreak();

  // Clear saved state and save fresh reset state
  clearPuzzleState();
  savePuzzleState();
}

/**
 * Handle category selection change
 */
function handleCategoryChange(event) {
  gameState.currentCategory = event.target.value;

  // Generate new puzzle with selected category
  currentPuzzle = generatePuzzle(
    gameState.currentCategory,
    gameState.currentDifficulty
  );

  if (!currentPuzzle) {
    showFeedback('Failed to generate puzzle. Please try again.', 'error');
    return;
  }

  loadPuzzle(currentPuzzle);
  showFeedback(`New ${gameState.currentCategory} puzzle loaded!`, 'success');

  console.log('Category changed to:', gameState.currentCategory);
  savePreferences(); // Save category preference
  clearPuzzleState(); // Clear old puzzle
  savePuzzleState(); // Save new puzzle
}

/**
 * Handle difficulty selection change
 */
function handleDifficultyChange(event) {
  console.log('=== DIFFICULTY CHANGE START ===');
  gameState.currentDifficulty = event.target.value;
  console.log('Selected difficulty:', gameState.currentDifficulty);

  // Generate new puzzle with selected difficulty
  console.log('Calling generatePuzzle...');
  currentPuzzle = generatePuzzle(
    gameState.currentCategory,
    gameState.currentDifficulty
  );

  if (!currentPuzzle) {
    console.log('ERROR: generatePuzzle returned null/undefined');
    showFeedback('Failed to generate puzzle. Please try again.', 'error');
    return;
  }

  console.log('Puzzle generated successfully:', currentPuzzle);
  console.log('Calling loadPuzzle...');
  loadPuzzle(currentPuzzle);
  showFeedback(`New ${gameState.currentDifficulty} puzzle loaded!`, 'success');

  console.log('=== DIFFICULTY CHANGE END ===');
  savePreferences(); // Save difficulty preference
  clearPuzzleState(); // Clear old puzzle
  savePuzzleState(); // Save new puzzle
}

/* ===================================
  INPUT VALIDATION
  =================================== */

/**
 * Validate and sanitize solution input (integers only, 0-999)
 * @param {Event} event - Input event
 */
function validateSolutionInput(event) {
  const input = event.target;
  let value = input.value;

  // Remove all non-digit characters
  value = value.replace(/[^0-9]/g, '');

  // Limit to 3 digits (0-999)
  if (value.length > 3) {
    value = value.substring(0, 3);
  }

  // Convert to number and ensure it's within range
  if (value !== '') {
    const numValue = parseInt(value, 10);
    if (numValue > 999) {
      value = '999';
    }
  }

  // Update input with sanitized value
  input.value = value;

  // Update gameState with parsed integer or delete if empty
  const position = input.dataset.position;
  if (value !== '') {
    gameState.userInputs[position] = parseInt(value, 10);
  } else {
    delete gameState.userInputs[position];
  }

  savePuzzleState(); // AUTO-SAVE after solution input
}

/* ===================================
  HINT SYSTEM
  =================================== */

/**
 * Handle equation selection for hint
 */
function handleEquationSelect(event) {
  const equation = event.currentTarget;
  const equationId = parseInt(equation.dataset.equation);

  // If clicking already selected equation, deselect it
  if (gameState.selectedEquationForHint === equationId) {
    deselectEquation();
    updateHintButtonStates(); // Update button states after deselection
    return;
  }

  // Deselect previous selection
  deselectEquation();

  // Select this equation
  equation.classList.add('selected-for-hint');
  gameState.selectedEquationForHint = equationId;

  // Update hint button states (enable buttons)
  updateHintButtonStates();

  console.log('Selected equation for hint:', equationId);
}

/**
 * Deselect equation for hint
 */
function deselectEquation() {
  if (gameState.selectedEquationForHint !== null) {
    const equationElement = document.querySelector(
      `[data-equation="${gameState.selectedEquationForHint}"]`
    );
    if (equationElement) {
      equationElement.classList.remove('selected-for-hint');
    }
  }
  gameState.selectedEquationForHint = null;
}

/**
 * Reveal the answer (solution) for the selected equation
 */
function revealAnswer() {
  if (gameState.selectedEquationForHint === null) {
    showFeedback('Please select an equation first (click on it)', 'warning');
    return;
  }

  const equationId = gameState.selectedEquationForHint;
  const equation = currentPuzzle.equations.find((eq) => eq.id === equationId);

  if (!equation) return;

  // Find the solution input for this equation
  // Note: HTML uses sol-1, sol-2, etc (1-based, not 0-based)
  const solutionInput = document.querySelector(
    `.blank.solution[data-position="sol-${equationId}"]`
  );

  if (!solutionInput) {
    console.warn(`Could not find solution input for equation ${equationId}`);
    return;
  }

  // Reveal the answer
  solutionInput.value = equation.answer.toString();
  solutionInput.classList.add('hint-revealed');

  // Update gameState (using the HTML position format)
  gameState.userInputs[`sol-${equationId}`] = equation.answer;
  gameState.hintsUsed++;

  // Add hint marker emoji
  addHintMarker(equationId, '?');

  // Update displays
  updateHintCounter();
  markEquationAsHinted(equationId);

  // Save state
  savePuzzleState();

  showFeedback('Answer revealed!', 'success');
  console.log(`Revealed answer: ${equation.answer} for equation ${equationId}`);
}

/**
 * Reveal both numbers (operands) for the selected equation
 */
function revealNumbers() {
  if (gameState.selectedEquationForHint === null) {
    showFeedback('Please select an equation first (click on it)', 'warning');
    return;
  }

  const equationId = gameState.selectedEquationForHint;
  const equation = currentPuzzle.equations.find((eq) => eq.id === equationId);

  if (!equation) return;

  // Get operands from solution object
  const operands = [equation.solution.operand1, equation.solution.operand2];

  // Reveal both operands
  // Note: HTML uses op1-1, op1-2 etc (not 0-based positions)
  operands.forEach((number, index) => {
    const operandNum = index + 1; // Convert to 1-based (op1 or op2)
    const position = `op${operandNum}-${equationId}`;
    const blank = document.querySelector(
      `.blank.operand[data-position="${position}"]`
    );

    if (!blank) {
      console.warn(`Could not find blank for position: ${position}`);
      return;
    }

    // Fill the blank
    blank.textContent = number;
    blank.classList.add('filled', 'hint-revealed');

    // Mark number as used in pool
    if (!gameState.poolNumbersUsed.includes(number)) {
      gameState.poolNumbersUsed.push(number);

      // Find and mark the first matching unused pool number
      const poolNumbers = document.querySelectorAll('.pool-number');
      for (let poolNum of poolNumbers) {
        if (
          parseInt(poolNum.dataset.number) === number &&
          !poolNum.classList.contains('used')
        ) {
          poolNum.classList.add('used');
          break;
        }
      }
    }

    // Store in userInputs (using the HTML position format)
    gameState.userInputs[position] = number;
  });

  // Update column totals
  updateColumnTotals();

  // Track hint usage
  gameState.hintsUsed++;
  addHintMarker(equationId, '#');

  // Update displays
  updateHintCounter();
  markEquationAsHinted(equationId);

  // Save state
  savePuzzleState();

  showFeedback('Numbers revealed!', 'success');
  console.log(
    `Revealed numbers: ${operands[0]}, ${operands[1]} for equation ${equationId}`
  );
}

/**
 * Reveal the operator for the selected equation
 */
function revealOperator() {
  console.log('=== REVEAL OPERATOR START ===');

  if (gameState.selectedEquationForHint === null) {
    showFeedback('Please select an equation first (click on it)', 'warning');
    return;
  }

  const equationId = gameState.selectedEquationForHint;
  console.log('Selected equation ID:', equationId);

  const equation = currentPuzzle.equations.find((eq) => eq.id === equationId);
  console.log('Found equation:', equation);

  if (!equation) {
    console.warn('Equation not found in puzzle!');
    return;
  }

  console.log('Equation operator:', equation.operator);

  // Find the operator container for this equation
  const operatorContainer = document.querySelector(
    `.operator-container[data-equation="${equationId}"]`
  );

  console.log('Operator container:', operatorContainer);

  if (!operatorContainer) {
    console.warn(
      `Could not find operator container for equation ${equationId}`
    );
    return;
  }

  const operatorSelect = operatorContainer.querySelector('.operator-select');
  console.log('Operator select element:', operatorSelect);
  console.log(
    'Operator select visible?',
    operatorSelect ? window.getComputedStyle(operatorSelect).display : 'N/A'
  );

  if (!operatorSelect) {
    showFeedback('No operator to reveal for this difficulty', 'warning');
    return;
  }

  // Set the operator
  console.log(`Setting operator value to: ${equation.operator}`);
  operatorSelect.value = equation.operator;
  operatorSelect.classList.add('hint-revealed');

  // Store in userOperators
  gameState.userOperators[equationId] = equation.operator;
  console.log('Updated gameState.userOperators:', gameState.userOperators);

  // Track hint usage
  gameState.hintsUsed++;
  addHintMarker(equationId, '*');

  // Update displays
  updateHintCounter();
  markEquationAsHinted(equationId);

  // Save state
  savePuzzleState();

  showFeedback('Operator revealed!', 'success');
  console.log('=== REVEAL OPERATOR END ===');
}

/**
 * Add hint marker emoji to equation number
 * @param {number} equationId - ID of equation
 * @param {string} markerType - Type of hint ('?', '#', or '*')
 */
function addHintMarker(equationId, markerType) {
  // Initialize array for this equation if needed
  if (!gameState.hintedEquations[equationId]) {
    gameState.hintedEquations[equationId] = [];
  }

  // Add marker if not already present
  if (!gameState.hintedEquations[equationId].includes(markerType)) {
    gameState.hintedEquations[equationId].push(markerType);
  }

  // Update visual marker in equation number
  const equationElement = document.querySelector(
    `.equation[data-equation="${equationId}"]`
  );

  if (equationElement) {
    const equationNumber = equationElement.querySelector('.equation-number');
    if (equationNumber) {
      const markers = gameState.hintedEquations[equationId].join(' ');
      // Note: HTML equation numbers are already 1-based (1., 2., 3., etc)
      // equationId from puzzle is also 1-based (1, 2, 3, 4, 5)
      equationNumber.textContent = `${equationId}. ${markers}`;
    }
  }
}

/**
 * Mark equation as hinted (visual state)
 * @param {number} equationId - ID of equation
 */
function markEquationAsHinted(equationId) {
  const equationElement = document.querySelector(
    `.equation[data-equation="${equationId}"]`
  );

  if (equationElement) {
    equationElement.classList.add('hinted');
  }
}

/**
 * Update hint counter display
 */
function updateHintCounter() {
  const hintCountElement = document.getElementById('hint-count');
  if (hintCountElement) {
    hintCountElement.textContent = gameState.hintsUsed;
  }
}

/**
 * Enable or disable hint buttons based on game state
 */
function updateHintButtonStates() {
  const revealAnswerBtn = document.getElementById('reveal-answer-btn');
  const revealNumbersBtn = document.getElementById('reveal-numbers-btn');
  const revealOperatorBtn = document.getElementById('reveal-operator-btn');

  const hasSelection = gameState.selectedEquationForHint !== null;
  const difficulty = currentPuzzle ? currentPuzzle.difficulty : null;

  // Enable answer and numbers buttons if equation is selected
  if (revealAnswerBtn) {
    revealAnswerBtn.disabled = !hasSelection;
  }
  if (revealNumbersBtn) {
    revealNumbersBtn.disabled = !hasSelection;
  }

  // Enable operator button only for Medium/Hard difficulty AND equation selected
  // Note: Difficulty is capitalized ('Medium', 'Hard', 'Easy')
  if (revealOperatorBtn) {
    const canRevealOperator =
      hasSelection && (difficulty === 'Medium' || difficulty === 'Hard');
    revealOperatorBtn.disabled = !canRevealOperator;
  }
}

/**
 * Exit hint mode and remove visual indicators
 */
function exitHintMode() {
  gameState.hintMode = false;
  document.getElementById('hint-btn').classList.remove('hint-mode-active');
}

/**
 * Handle operator selection for Medium/Hard difficulties
 */
function handleOperatorSelect(event) {
  const select = event.target;
  const operatorContainer = select.closest('.operator-container');
  const equationId = parseInt(operatorContainer.dataset.equation);
  const selectedOperator = select.value;

  if (selectedOperator) {
    gameState.userOperators[equationId] = selectedOperator;
    console.log(
      `Operator selected for equation ${equationId}:`,
      selectedOperator
    );
  } else {
    delete gameState.userOperators[equationId];
  }

  savePuzzleState(); // AUTO-SAVE after operator selection
}

/* ===================================
  WIN ANIMATION
  =================================== */

/**
 * Trigger confetti animation
 */
function triggerConfetti() {
  const container = document.getElementById('confetti-container');

  // Clear any existing confetti
  container.innerHTML = '';

  // Create 50 confetti pieces
  for (let i = 0; i < 50; i++) {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';

    // Random horizontal position
    confetti.style.left = Math.random() * 100 + '%';

    // Random delay (stagger the confetti)
    confetti.style.animationDelay = Math.random() * 0.5 + 's';

    // Random duration (between 2-4 seconds)
    confetti.style.animationDuration = Math.random() * 2 + 2 + 's';

    // Random size
    const size = Math.random() * 6 + 6; // 6-12px
    confetti.style.width = size + 'px';
    confetti.style.height = size + 'px';

    container.appendChild(confetti);
  }

  // Remove confetti after animation completes
  setTimeout(() => {
    container.innerHTML = '';
  }, 4000);
}

/* ===================================
  STATISTICS MODAL
  =================================== */

/**
 * Show the statistics modal
 */
function showStatsModal() {
  const modal = document.getElementById('stats-modal');
  const stats = loadStatistics();

  // Update overall stats
  document.getElementById('total-completed').textContent =
    stats.overall.totalCompleted;
  document.getElementById('total-attempts').textContent =
    stats.overall.totalAttempts;
  document.getElementById('total-hints').textContent = stats.overall.totalHints;
  document.getElementById('perfect-games').textContent =
    stats.overall.perfectGames;
  document.getElementById('current-streak').textContent =
    stats.overall.currentStreak;
  document.getElementById('best-streak').textContent = stats.overall.bestStreak;

  // Update Easy stats
  updateDifficultyStats('easy', stats.easy);

  // Update Medium stats
  updateDifficultyStats('medium', stats.medium);

  // Update Hard stats
  updateDifficultyStats('hard', stats.hard);

  // Update Random stats
  updateDifficultyStats('random', stats.random);

  // Show modal
  modal.classList.remove('hidden');

  console.log('Statistics modal opened');
}

/**
 * Update difficulty-specific stats in the modal
 * @param {string} difficulty - Difficulty level (easy/medium/hard)
 * @param {object} stats - Stats object for this difficulty
 */
function updateDifficultyStats(difficulty, stats) {
  // Safety check - if stats doesn't exist, use default values
  if (!stats) {
    stats = {
      completed: 0,
      attempts: 0,
      hints: 0,
      perfectGames: 0,
    };
  }

  document.getElementById(`${difficulty}-completed`).textContent =
    stats.completed;
  document.getElementById(`${difficulty}-attempts`).textContent =
    stats.attempts;
  document.getElementById(`${difficulty}-hints`).textContent = stats.hints;
  document.getElementById(`${difficulty}-perfect`).textContent =
    stats.perfectGames;

  // Calculate average attempts (avoid division by zero)
  const avgAttempts =
    stats.completed > 0 ? (stats.attempts / stats.completed).toFixed(1) : '0.0';
  document.getElementById(`${difficulty}-avg`).textContent = avgAttempts;
}

/**
 * Close the statistics modal
 */
function closeStatsModal() {
  const modal = document.getElementById('stats-modal');
  modal.classList.add('hidden');
  console.log('Statistics modal closed');
}

/**
 * Reset all statistics (with confirmation)
 */
function handleResetStats() {
  const confirmed = confirm(
    'Are you sure you want to reset all statistics? This cannot be undone.'
  );

  if (confirmed) {
    // Clear statistics from localStorage
    localStorage.removeItem('sumwords_statistics');

    // Also reset tutorial flag so user can see it again if they want
    localStorage.removeItem('sumwords_tutorial_seen');

    // Reload the stats modal to show zeros
    showStatsModal();

    showFeedback(
      'Statistics reset successfully. Tutorial will show on next page load.',
      'success'
    );
    console.log('Statistics reset');
  }
}

/**
 * Set up statistics modal event listeners
 */
function setupStatsModalListeners() {
  // Close button
  document
    .getElementById('close-stats-btn')
    .addEventListener('click', closeStatsModal);

  // Reset stats button
  document
    .getElementById('reset-stats-btn')
    .addEventListener('click', handleResetStats);

  // Click outside modal to close
  document.getElementById('stats-modal').addEventListener('click', (event) => {
    if (event.target.id === 'stats-modal') {
      closeStatsModal();
    }
  });
}

/* ===================================
  INITIALIZATION - COMBINED LISTENERS
  =================================== */

// Note: Main game initialization happens at line 1526
// This listener handles additional setup after DOM loads
document.addEventListener('DOMContentLoaded', () => {
  // Theme toggle button event listener
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Initialize hint button states
  updateHintButtonStates();

  // Tutorial system
  showTutorialIfFirstVisit();
});

// ===================================
// TUTORIAL SYSTEM
// ===================================

/**
 * Shows tutorial overlay on first visit
 * Uses localStorage to track if user has seen it
 */
function showTutorialIfFirstVisit() {
  const tutorialSeen = localStorage.getItem('sumwords_tutorial_seen');

  // If tutorial hasn't been seen, show it
  if (!tutorialSeen) {
    const tutorialOverlay = document.getElementById('tutorial-overlay');
    if (tutorialOverlay) {
      tutorialOverlay.classList.remove('hidden');
    }
  }

  // Setup tutorial close button
  const tutorialClose = document.getElementById('tutorial-close');
  if (tutorialClose) {
    tutorialClose.addEventListener('click', closeTutorial);
  }

  // Setup tutorial overlay click (close on background click)
  const tutorialOverlay = document.getElementById('tutorial-overlay');
  if (tutorialOverlay) {
    tutorialOverlay.addEventListener('click', function (e) {
      if (e.target === tutorialOverlay) {
        closeTutorial();
      }
    });
  }
}

/**
 * Closes tutorial and optionally saves preference
 */
function closeTutorial() {
  const tutorialOverlay = document.getElementById('tutorial-overlay');
  const dontShowCheckbox = document.getElementById('tutorial-dont-show');

  // Hide the overlay
  if (tutorialOverlay) {
    tutorialOverlay.classList.add('hidden');
  }

  // Save preference if checkbox is checked
  if (dontShowCheckbox && dontShowCheckbox.checked) {
    localStorage.setItem('sumwords_tutorial_seen', 'true');
  }
}
