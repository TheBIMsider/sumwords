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

// Game version shown at the bottom of the game. Change it only here.
const GAME_VERSION = '1.1.0';

/**
 * Show the game version in the footer label
 */
function showGameVersion() {
  const versionLabel = document.getElementById('game-version');
  if (versionLabel) {
    versionLabel.textContent = `Sumwords v${GAME_VERSION}`;
  }
}

// ==========================================
// QUESTION LIBRARY
// ==========================================

/* ===================================
   QUESTION BANKS 
   =================================== */

const questionBanks = {
  sports: [
    { question: 'Super Bowls won by Tom Brady', answer: 7 },
    { question: 'Innings in a baseball game', answer: 9 },
    { question: 'Points for an NFL touchdown', answer: 6 },
    { question: 'Frames in a game of bowling', answer: 10 },
    { question: 'Holes on a golf course', answer: 18 },
    {
      question:
        "Feet from the pitcher's rubber to home plate (ignore the extra 6 inches)",
      answer: 60,
    },
    { question: 'Yards for a first down (NFL)', answer: 10 },
    { question: 'Regulation NBA quarters', answer: 4 },
    { question: 'Players on a baseball field (defense)', answer: 9 },
    { question: 'Points for a field goal (NFL)', answer: 3 },
    { question: 'Regulation periods in hockey', answer: 3 },
    { question: 'Bases on a baseball diamond', answer: 4 },
    { question: 'Sets a man must win to take a Grand Slam match', answer: 3 },
    { question: 'Players on a rugby union team on the field', answer: 15 },
    { question: 'Strikes for a strikeout', answer: 3 },
    { question: 'Balls for a walk (baseball)', answer: 4 },
    { question: 'Outs per inning (baseball)', answer: 3 },
    { question: 'Downs per set in American football', answer: 4 },
    // YOUR ADDITIONS (merged, duplicates removed)
    { question: 'Minutes in a standard soccer match', answer: 90 },
    { question: 'Players on a basketball team on the court', answer: 5 },
    { question: 'Teams in the NFL', answer: 32 },
    { question: 'Olympic rings', answer: 5 },
    { question: 'Grand Slam tennis tournaments each year', answer: 4 },
    { question: 'Players on a volleyball team on the court', answer: 6 },
    { question: 'Halves in a rugby match', answer: 2 },
    { question: 'Players on a soccer team on the field', answer: 11 },
    { question: 'Clubs allowed in a golf bag', answer: 14 },
    { question: 'Seconds on a basketball shot clock', answer: 24 },
    { question: 'Lanes on a standard running track', answer: 8 },
    { question: 'Teams in the NBA', answer: 30 },
    { question: 'Players per side in doubles tennis', answer: 2 },
    { question: 'Minutes in an NFL quarter', answer: 15 },
    { question: 'Rounds in Olympic boxing', answer: 3 },
    { question: 'Points for a safety in football', answer: 2 },
    { question: 'Players on an ice hockey team on ice', answer: 6 },
    { question: 'Yards in American football field length', answer: 100 },
    { question: 'Events in a triathlon', answer: 3 },
    { question: 'Wheels on a bicycle', answer: 2 },
    { question: 'Points for a 3-pointer in basketball', answer: 3 },
    { question: 'Feet high is a basketball hoop', answer: 10 },
    { question: 'Players on a water polo team in pool', answer: 7 },
    { question: 'Timeouts per half in NFL', answer: 3 },
    { question: 'Fencers in an épée bout', answer: 2 },
    { question: 'Games in a tennis set (minimum)', answer: 6 },
    { question: 'Skaters in figure skating pairs', answer: 2 },
    { question: 'Events in Olympic gymnastics (women)', answer: 4 },
    { question: 'Laps in the Indianapolis 500', answer: 200 },
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
    { question: 'Permanent members of the UN Security Council', answer: 5 },
    { question: 'Years in a century', answer: 100 },
    { question: 'Musketeers in Dumas novel', answer: 3 },
    { question: "Years of the Hundred Years' War", answer: 116 },
    { question: "Ships on Columbus's first voyage", answer: 3 },
    { question: 'Horsemen of the Apocalypse', answer: 4 },
    { question: 'Rose colors in the Wars of the Roses', answer: 2 },
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
    { question: 'Great Pyramids of Giza', answer: 3 },
    { question: 'Signers of the US Declaration of Independence', answer: 56 },
    { question: 'U.S. Presidents assassinated in office', answer: 4 },
    { question: 'Years between Olympic Games', answer: 4 },
    { question: 'Justices on the U.S. Supreme Court', answer: 9 },
    { question: 'Days in the French Republican calendar week', answer: 10 },
    { question: "Years of the Thirty Years' War", answer: 30 },
    { question: 'Ancient Wonders of the World', answer: 7 },
    { question: 'Years of the First Punic War', answer: 23 },
    { question: 'Months in the Gregorian calendar', answer: 12 },
    { question: 'Years of Prohibition in the United States', answer: 13 },
    { question: 'Republics in the Soviet Union', answer: 15 },
    { question: 'Commandments given to Moses', answer: 10 },
    { question: 'Stations of the Cross', answer: 14 },
    { question: 'Articles in the US Constitution', answer: 7 },
    { question: 'Deadly sins', answer: 7 },
    { question: 'Heavenly virtues', answer: 7 },
    { question: 'Sacraments in Catholic Church', answer: 7 },
    { question: 'Days in the week named after Norse gods', answer: 4 },
    {
      question: 'Delegates who attended the Constitutional Convention',
      answer: 55,
    },
    { question: 'Length in minutes of the daily Hate in 1984', answer: 2 },
    { question: 'Days of the Cuban Missile Crisis', answer: 13 },
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
    { question: 'Countries in South America', answer: 12 },
    { question: 'States and mainland territories of Australia', answer: 8 },
    { question: 'Countries in Scandinavia', answer: 3 },
    { question: 'U.S. states that border Mexico', answer: 4 },
    { question: 'U.S. states that border Canada', answer: 13 },
    { question: 'Inhabited U.S. territories', answer: 5 },
    { question: 'Stripes on the Greek flag', answer: 9 },
    { question: 'Points on Canadian maple leaf', answer: 11 },
    { question: 'Stars on Australian flag', answer: 6 },
    { question: 'U.S. states with Pacific coastline', answer: 5 },
    { question: 'Countries bordering mainland France', answer: 8 },
    { question: 'Rays on Statue of Liberty crown', answer: 7 },
    { question: 'Peaks over 8000m (8-thousanders)', answer: 14 },
    // YOUR ADDITIONS (merged, duplicates removed)
    { question: 'Continents on Earth', answer: 7 },
    { question: 'US states', answer: 50 },
    { question: 'Member countries of the European Union', answer: 27 },
    { question: 'Major circles of latitude', answer: 5 },
    { question: 'Countries in Central America', answer: 7 },
    { question: 'Letters in the word Mississippi', answer: 11 },
    { question: 'Countries crossed by the Equator', answer: 13 },
    { question: 'Capital cities of South Africa', answer: 3 },
    { question: 'Degrees in a full circle', answer: 360 },
    { question: 'Stars on the flag of the European Union', answer: 12 },
    { question: 'Time zones in Russia', answer: 11 },
    { question: 'Fingers on one hand', answer: 5 },
    { question: 'Toes on one foot', answer: 5 },
    { question: 'Legs on a tripod', answer: 3 },
    { question: 'Sides on a square', answer: 4 },
    { question: 'Points on a compass (cardinal)', answer: 4 },
    { question: 'Wheels on a tricycle', answer: 3 },
    { question: 'Seasons in a year', answer: 4 },
    { question: 'Weeks in a year', answer: 52 },
    { question: 'Days in February (leap year)', answer: 29 },
    { question: 'Main islands in the Hawaiian chain', answer: 8 },
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
    { question: 'Members of ABBA', answer: 4 },
    { question: 'Members of Nirvana', answer: 3 },
    { question: 'Members of Queen', answer: 4 },
    { question: 'Dwarves in the party in The Hobbit', answer: 13 },
    { question: 'Avengers in the first Avengers film (2012)', answer: 6 },
    { question: 'Strings on a standard guitar', answer: 6 },
    { question: 'Pokémon in the original Kanto Pokédex', answer: 151 },
    { question: 'Beatles members', answer: 4 },
    { question: 'Seasons of Game of Thrones', answer: 8 },
    { question: 'Ghostbusters in original film', answer: 4 },
    { question: 'Teenage Mutant Ninja Turtles', answer: 4 },
    { question: 'Spice Girls members', answer: 5 },
    { question: 'Friends main characters', answer: 6 },
    { question: "Colors on a standard Rubik's Cube", answer: 6 },
    { question: 'Members of the Jackson 5', answer: 5 },
    { question: 'Simpsons family members', answer: 5 },
    { question: 'Dragon balls in Dragon Ball', answer: 7 },
    { question: 'Kingdoms in Game of Thrones (start)', answer: 7 },
    // YOUR ADDITIONS (merged, duplicates removed)
    { question: 'Hobbits in the Fellowship of the Ring', answer: 4 },
    { question: 'Members of One Direction', answer: 5 },
    { question: 'Members of BTS', answer: 7 },
    { question: 'Primary colors', answer: 3 },
    { question: 'Letters in the Hollywood sign', answer: 9 },
    { question: 'Houses at Hogwarts', answer: 4 },
    { question: 'Main characters in Scooby-Doo', answer: 5 },
    { question: 'Teletubbies', answer: 4 },
    { question: 'Jurassic Park films in the original trilogy', answer: 3 },
    { question: 'Dice sides on a standard die', answer: 6 },
    { question: "Members of Destiny's Child classic lineup", answer: 3 }, // escaped
    { question: 'Strings on a standard ukulele', answer: 4 },
    { question: 'Letters in the word Pokémon', answer: 7 },
    { question: 'Members of the Fellowship of the Ring', answer: 9 },
    { question: 'Blocks in a standard Jenga set', answer: 54 },
    { question: 'Cards in a standard Uno deck', answer: 108 },
    { question: 'Stages of grief', answer: 5 },
    { question: 'Tributes in each Hunger Games', answer: 24 },
    { question: 'Samurai in Seven Samurai', answer: 7 },
    { question: 'Brides for Seven Brothers', answer: 7 },
    {
      question: 'Companions who travel with Dorothy in The Wizard of Oz',
      answer: 3,
    },
    { question: 'Men in The Magnificent Seven', answer: 7 },
    { question: 'Chipmunks in Alvin and the Chipmunks', answer: 3 },
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
    { question: 'Bones in the adult human body', answer: 206 },
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
    { question: 'Standard amino acids in proteins', answer: 20 },
    { question: 'Valence electrons in carbon', answer: 4 },
    { question: 'Naturally occurring noble gases', answer: 6 },
    { question: 'Bones in human skull', answer: 22 },
    { question: 'Cervical vertebrae in humans', answer: 7 },
    { question: 'Phases of the moon', answer: 8 },
    // YOUR ADDITIONS (merged, duplicates removed)
    { question: 'Elements in the periodic table', answer: 118 },
    { question: 'Classical states of matter, including plasma', answer: 4 },
    { question: 'DNA strands in a double helix', answer: 2 },
    { question: 'Bones in one human middle ear', answer: 3 },
    { question: 'Blood types in the ABO system', answer: 4 },
    { question: "Newton's laws of motion", answer: 3 },
    { question: 'Degrees Fahrenheit water boils at sea level', answer: 212 },
    { question: 'Seconds in a minute', answer: 60 },
    { question: 'Minutes in an hour', answer: 60 },
    { question: 'Layers of Earth', answer: 4 },
    { question: 'Human senses traditionally taught', answer: 5 },
    { question: 'Electrons in a full outer shell (octet rule)', answer: 8 },
    { question: 'Eyes on most spiders', answer: 8 },
    { question: "Degrees Celsius at water's boiling point", answer: 100 },
    { question: 'Digits in the binary system', answer: 2 },
    { question: 'Pairs of ribs in the human body', answer: 12 },
    { question: 'Planets visible to the naked eye', answer: 5 },
    { question: 'Atomic number of carbon', answer: 6 },
    { question: 'Atomic number of oxygen', answer: 8 },
    { question: 'Atomic number of nitrogen', answer: 7 },
    { question: 'Colors in a rainbow (traditional)', answer: 7 },
    { question: 'Atomic number of helium', answer: 2 },
    { question: 'Moons of Mars', answer: 2 },
    { question: 'Atomic number of neon', answer: 10 },
    { question: 'Wisdom teeth', answer: 4 },
    { question: 'Baby teeth in children', answer: 20 },
    { question: 'Lungs in human body', answer: 2 },
    { question: 'Kidneys in human body', answer: 2 },
    { question: 'Days in a leap year', answer: 366 },
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
      question:
        "How many episodes were in each of Game of Thrones' first six seasons?",
      answer: 10,
    },
    { question: 'How many Oscars has Meryl Streep won?', answer: 3 },
    {
      question: 'How many Best Actor Oscars has Daniel Day-Lewis won?',
      answer: 3,
    },
    { question: 'How many Harry Potter movies were released?', answer: 8 },
    { question: 'How many seasons of Breaking Bad were there?', answer: 5 },
    {
      question: 'How many films are in the Lord of the Rings trilogy?',
      answer: 3,
    },
    { question: 'How many seasons of The Office (US) were there?', answer: 9 },
    { question: 'How many Toy Story movies have been released?', answer: 4 },
    { question: 'How many seasons of Stranger Things have aired?', answer: 5 },
    {
      question: 'How many Academy Awards did The Return of the King win?',
      answer: 11,
    },
    {
      question: 'How many films are in the Star Wars Skywalker Saga?',
      answer: 9,
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
      answer: 7,
    },
    { question: 'How many seasons of The Crown have aired?', answer: 6 },
    {
      question: 'How many Pirates of the Caribbean movies were made?',
      answer: 5,
    },
    { question: 'How many seasons of The Wire were there?', answer: 5 },
    {
      question: 'How many Mission Impossible movies have been released?',
      answer: 8,
    },
    { question: 'How many Avengers movies are in the MCU?', answer: 4 },
    { question: 'How many seasons of Seinfeld were there?', answer: 9 },
    {
      question:
        'How many official Eon-produced James Bond films have been released?',
      answer: 25,
    },
    {
      question:
        'How many films are in the original Rocky series (before Creed)?',
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
    { question: 'How many Oscars did Oppenheimer win?', answer: 7 },
    {
      question: 'How many Terminator movies were released before 2020?',
      answer: 6,
    },
    { question: 'How many main Hunger Games movies were made?', answer: 4 },
    {
      question: 'How many Cars movies have been released as a trilogy?',
      answer: 3,
    },
    { question: 'How many Back to the Future movies were made?', answer: 3 },
    {
      question: 'How many seasons of How I Met Your Mother were there?',
      answer: 9,
    },
    { question: 'How many Shrek movies were made?', answer: 4 },
    { question: 'How many Oscars did Parasite win?', answer: 4 },
    {
      question: 'How many Ghostbusters movies were made before 2020?',
      answer: 3,
    },
    { question: 'How many seasons of Frasier were there?', answer: 11 },
    { question: 'How many Alien movies feature Sigourney Weaver?', answer: 4 },
    { question: 'How many Hobbit movies were made?', answer: 3 },
    { question: 'How many Men in Black movies were made?', answer: 4 },
    { question: 'How many Oscars did La La Land win?', answer: 6 },
  ],
  fooddrink: [
    { question: 'How many tablespoons are in one cup?', answer: 16 },
    { question: 'How many teaspoons are in one tablespoon?', answer: 3 },
    {
      question: 'How many fluid ounces are in a standard US can of soda?',
      answer: 12,
    },
    { question: 'How many fluid ounces are in a pint?', answer: 16 },
    { question: 'How many calories are in one gram of fat?', answer: 9 },
    {
      question: "How many herbs and spices are in KFC's original recipe?",
      answer: 11,
    },
    {
      question: 'How many varieties does the Heinz slogan advertise?',
      answer: 57,
    },
    { question: 'How many eggs are in a dozen?', answer: 12 },
    { question: "How many chambers does a cow's stomach have?", answer: 4 },
    {
      question: 'How many ingredients are in a traditional margarita?',
      answer: 3,
    },
    { question: 'How many quarts are in one gallon?', answer: 4 },
    { question: 'How many grams are in one ounce (rounded down)?', answer: 28 },
    {
      question: 'How many slices of bread are in a classic club sandwich?',
      answer: 3,
    },
    {
      question: 'How many months is Parmigiano-Reggiano aged at minimum?',
      answer: 12,
    },
    { question: 'How many flavors are in Neapolitan ice cream?', answer: 3 },
    {
      question:
        'How many milliliters are in one teaspoon (nutrition labeling)?',
      answer: 5,
    },
    { question: 'How many teaspoons are in one fluid ounce?', answer: 6 },
    {
      question:
        'How many basic tastes are traditionally recognized (including umami)?',
      answer: 5,
    },
    {
      question: 'How many Michelin stars can a restaurant receive maximum?',
      answer: 3,
    },
    {
      question: 'How many mother sauces are there in French cuisine?',
      answer: 5,
    },
    {
      question: 'How many vegetables make up the Cajun holy trinity?',
      answer: 3,
    },
    { question: 'How many original flavors of Skittles are there?', answer: 5 },
    {
      question:
        'How many degrees Fahrenheit must chicken reach to be safely cooked?',
      answer: 165,
    },
    { question: 'How many food groups are on the USDA MyPlate?', answer: 5 },
    { question: 'How many teaspoons are in one cup?', answer: 48 },
    { question: 'How many ounces are in a pound?', answer: 16 },
    { question: 'How many cups are in one quart?', answer: 4 },
    { question: 'How many pints are in one gallon?', answer: 8 },
    { question: 'How many tablespoons are in one stick of butter?', answer: 8 },
    { question: 'How many fluid ounces are in a cup?', answer: 8 },
    {
      question:
        'How many degrees Fahrenheit must ground beef reach to be safely cooked?',
      answer: 160,
    },
    { question: 'How many grams of protein are in one large egg?', answer: 6 },
    { question: 'How many flavors is Baskin-Robbins famous for?', answer: 31 },
    {
      question: 'How many cups are in one gallon?',
      answer: 16,
    },
    { question: 'How many calories are in one gram of protein?', answer: 4 },
    {
      question: 'How many calories are in one gram of carbohydrate?',
      answer: 4,
    },
    { question: 'How many grams of sugar are in one teaspoon?', answer: 4 },
    { question: 'How many ounces in a standard stick of butter?', answer: 4 },
    { question: 'How many cups are in one pint?', answer: 2 },
    {
      question:
        'How many hours can perishable food safely sit out at room temperature?',
      answer: 2,
    },
    {
      question: 'How many US standard drinks are in a 750 ml bottle of wine?',
      answer: 5,
    },
    { question: 'How many tablespoons are in a quarter cup?', answer: 4 },
    { question: 'How many pints are in a half gallon?', answer: 4 },
    {
      question: 'How many fluid ounces are in a six-pack of 12-ounce cans?',
      answer: 72,
    },
    { question: 'How many sticks of butter are in a pound?', answer: 4 },
    {
      question: "How many chicken nuggets are in a McDonald's 20-piece?",
      answer: 20,
    },
    { question: 'How many fluid ounces are in a quart?', answer: 32 },
    { question: 'How many fluid ounces are in a gallon?', answer: 128 },
    { question: 'How many cups are in a half gallon?', answer: 8 },
    { question: 'How many calories are in one gram of alcohol?', answer: 7 },
  ],
  technology: [
    { question: 'How many bits are in one byte?', answer: 8 },
    {
      question: 'How many keys are on a standard US QWERTY keyboard?',
      answer: 104,
    },
    { question: 'How many bits are in a standard ASCII character?', answer: 7 },
    { question: 'How many pins does a VGA connector have?', answer: 15 },
    { question: 'How many bits are in an IPv4 address?', answer: 32 },
    {
      question: 'How many cores does a standard quad-core processor have?',
      answer: 4,
    },
    { question: 'How many layers are in the OSI network model?', answer: 7 },
    {
      question: 'How many pins does a Type-A HDMI connector have?',
      answer: 19,
    },
    {
      question: 'How many function keys are on a standard PC keyboard?',
      answer: 12,
    },
    { question: 'How many ink colors are in the CMYK printing model?', answer: 4 },
    {
      question: 'How many pins does a standard Ethernet RJ45 connector have?',
      answer: 8,
    },
    { question: 'How many bits are in a nibble?', answer: 4 },
    {
      question: 'How many bits make up one pixel in "true color"?',
      answer: 24,
    },
    { question: 'How many sides does a hex nut have?', answer: 6 },
    {
      question: 'How many pins does a USB 2.0 Type-A connector have?',
      answer: 4,
    },
    {
      question: 'How many pins does a DisplayPort connector have?',
      answer: 20,
    },
    {
      question: 'How many pins does a standard DE-9 serial port have?',
      answer: 9,
    },
    {
      question: 'How many tracks can a standard audio CD hold at most?',
      answer: 99,
    },
    {
      question: 'How many characters are in the standard ASCII set?',
      answer: 128,
    },
    {
      question: 'How many primary colors are used in RGB displays?',
      answer: 3,
    },
    { question: 'How many number keys are on a phone keypad?', answer: 10 },
    { question: 'How many arrow keys are on a keyboard?', answer: 4 },
    { question: 'How many bits are in an Ethernet MAC address?', answer: 48 },
    {
      question: 'How many pins does a standard PS/2 connector have?',
      answer: 6,
    },
    { question: 'How many cells are in a standard 9V battery?', answer: 6 },
    { question: 'How many bits are in a standard IPv6 address?', answer: 128 },
    { question: 'What TCP port does HTTP use by default?', answer: 80 },
    { question: 'How many contacts are in a USB-C connector?', answer: 24 },
    { question: 'How many symbols does the hexadecimal system use?', answer: 16 },
    {
      question: 'How many processor cores does an octa-core chip have?',
      answer: 8,
    },
    {
      question: 'How many pins does a parallel printer port have?',
      answer: 25,
    },
    { question: 'What TCP port does SSH use by default?', answer: 22 },
    {
      question: 'How many keys does a standard piano keyboard have?',
      answer: 88,
    },
    {
      question: 'What TCP port does FTP use for control by default?',
      answer: 21,
    },
    {
      question: 'What is the decimal value of the hexadecimal number FF?',
      answer: 255,
    },
    { question: 'How many different values can one byte store?', answer: 256 },
    { question: 'How many pins does a Lightning connector have?', answer: 8 },
    { question: 'How many pins does a SATA data connector have?', answer: 7 },
    {
      question: 'How many characters were allowed in an original tweet?',
      answer: 140,
    },
    {
      question: 'How many pins does a standard IDE connector have?',
      answer: 40,
    },
    {
      question: 'How many bits are in two bytes?',
      answer: 16,
    },
    {
      question: 'How many keys are on a standard full-size numeric keypad?',
      answer: 17,
    },
    { question: 'How many channels does stereo audio have?', answer: 2 },
    { question: 'How many channels does surround sound 5.1 have?', answer: 6 },
    { question: 'How many bits per sample does CD audio use?', answer: 16 },
    {
      question: 'How many conductors does a 3.5 mm TRS audio plug have?',
      answer: 3,
    },
    {
      question: 'How many contacts does a USB 3.0 Type-A connector have?',
      answer: 9,
    },
    { question: 'How many modules wide is a Version 1 QR code?', answer: 21 },
    { question: 'What HTTP status code means OK?', answer: 200 },
    {
      question:
        'How many characters are in a standard UUID string, including hyphens?',
      answer: 36,
    },
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
    { question: 'How many houses are in a standard Monopoly set?', answer: 32 },
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
    { question: 'How many cards are in the tarot major arcana?', answer: 22 },
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
    {
      question: 'How many ghosts chase Pac-Man in the original arcade game?',
      answer: 4,
    },
    {
      question: 'How many points are on a standard backgammon board?',
      answer: 24,
    },
    { question: 'How many books are in The Chronicles of Narnia?', answer: 7 },
    { question: 'How many suits are in a standard deck of cards?', answer: 4 },
    { question: 'How many sonnets did Shakespeare write?', answer: 154 },
    { question: 'How many territories are on a Risk game board?', answer: 42 },
    { question: 'How many face cards are in a standard deck?', answer: 12 },
    { question: 'How many sections are on a standard dartboard?', answer: 20 },
    {
      question: 'How many pawns does each chess player start with?',
      answer: 8,
    },
    {
      question: 'How many tiles are in a standard Scrabble set?',
      answer: 100,
    },
    { question: 'How many squares are on a Monopoly board?', answer: 40 },
    {
      question: "How many hole cards does each Texas Hold'em player get?",
      answer: 2,
    },
    { question: "How many books are in Homer's Iliad?", answer: 24 },
    { question: 'How many red cards are in a standard deck?', answer: 26 },
    { question: "How many circles of Hell are in Dante's Inferno?", answer: 9 },
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
      question: "How many novels are in The Hitchhiker's Guide \"trilogy\"?",
      answer: 5,
    },
    {
      question: 'How many main-series novels are in the Twilight saga?',
      answer: 4,
    },
    {
      question: 'How many main books are in the Percy Jackson series?',
      answer: 5,
    },
    { question: 'How many syllables are in a traditional haiku?', answer: 17 },
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
      question: 'How many pieces does each player start with in checkers?',
      answer: 12,
    },
    { question: 'How many lines are in a sonnet?', answer: 14 },
    {
      question:
        'How many balls are used in a game of pool (including cue ball)?',
      answer: 16,
    },
    { question: 'What is the maximum score with three darts?', answer: 180 },
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
    { question: 'How many chambers does a fish heart have?', answer: 2 },
    { question: 'How many chambers does a frog heart have?', answer: 3 },
    { question: 'How many humps does a Bactrian camel have?', answer: 2 },
    { question: 'How many legs does a scorpion have?', answer: 8 },
    { question: 'How many eyes does a honeybee have?', answer: 5 },
    { question: 'How many legs does a lobster have?', answer: 10 },
    { question: 'How many sides does a honeycomb cell have?', answer: 6 },
    {
      question: 'How many species are in the big cat genus Panthera?',
      answer: 5,
    },
    { question: 'How many wings does a dragonfly have?', answer: 4 },
    {
      question: 'How many weeks does a full-term human pregnancy last?',
      answer: 40,
    },
    { question: 'How many arms does a starfish typically have?', answer: 5 },
    { question: 'How many tentacles does a squid have?', answer: 2 },
    { question: 'How many teeth does an adult rabbit have?', answer: 28 },
    { question: 'How many teeth does a mouse have?', answer: 16 },
    { question: 'How many bones are in one human foot?', answer: 26 },
    { question: 'How many toes does an emu have on each foot?', answer: 3 },
    {
      question: "How many months is an elephant's gestation period?",
      answer: 22,
    },
    { question: 'How many pairs of chromosomes does a dog have?', answer: 39 },
    {
      question: 'How many pairs of chromosomes does a chimpanzee have?',
      answer: 24,
    },
    { question: 'How many chambers does a crocodile heart have?', answer: 4 },
    { question: 'How many living species of rhinoceros exist?', answer: 5 },
    { question: 'How many living species of bear exist?', answer: 8 },
    { question: 'How many neck vertebrae does a giraffe have?', answer: 7 },
    { question: 'How many toes does a cat have on its front paws?', answer: 5 },
    { question: 'How many toes does a cat have on its back paws?', answer: 4 },
    {
      question: 'How many pairs of legs does a house centipede have?',
      answer: 15,
    },
    { question: 'How many days does a chicken egg take to hatch?', answer: 21 },
    { question: 'How many legs does a butterfly have?', answer: 6 },
    {
      question: 'How many legs does a centipede have per body segment?',
      answer: 2,
    },
    { question: 'How many teeth does a cat have?', answer: 30 },
    { question: 'How many teeth does a dog have?', answer: 42 },
    { question: 'How many arms does a squid have (not tentacles)?', answer: 8 },
    {
      question: 'How many bones are in one human hand (including the wrist)?',
      answer: 27,
    },
    { question: "How many days is a cat's gestation period?", answer: 63 },
    { question: "How many days is a dog's gestation period?", answer: 63 },
    { question: "How many days is a rabbit's gestation period?", answer: 31 },
    { question: 'How many arms does an octopus have?', answer: 8 },
    { question: 'How many antennae does an insect have?', answer: 2 },
    { question: 'How many body segments does an insect have?', answer: 3 },
    { question: 'How many wings does a mosquito have?', answer: 2 },
    { question: 'How many wings does a housefly have?', answer: 2 },
    { question: 'How many legs does a crab have?', answer: 10 },
    { question: 'How many wings does a butterfly have?', answer: 4 },
    { question: 'How many teeth does an adult pig have?', answer: 44 },
    { question: 'How many toes does an ostrich have on each foot?', answer: 2 },
    { question: "How many chambers does a bird's heart have?", answer: 4 },
    { question: 'How many toes does a pig have on each foot?', answer: 4 },
    { question: 'How many toes does a chicken have?', answer: 4 },
    { question: 'How many legs does a horse have?', answer: 4 },
  ],
};

/* ===================================
   PUZZLE GENERATOR
   =================================== */

/**
 * Where the generator gets its random numbers. Normal play uses Math.random.
 * A daily build swaps in a seeded generator and always puts Math.random back.
 */
let random = Math.random;

// Fixed salt mixed into every daily seed. Changing it changes every daily.
const DAILY_SALT = 'sumwords-daily';

// The daily series. Bump it by hand (and set a new DAILY_EPOCH) whenever a
// change alters the dailies: adding or editing questions, or a generator
// change. The pinned-date test in tests/daily.test.js fails when that happens.
// Dailies are numbered "series-day", for example #1-1, then #2-1 after a bump.
const DAILY_SERIES = 1;

// Day 1 of the current series: its first daily's local calendar date (YYYY-MM-DD)
const DAILY_EPOCH = '2026-11-17';

// Fixed settings for every daily, so all players compare the same puzzle
const DAILY_CATEGORY = 'everything';
const DAILY_DIFFICULTY = 'medium';

/**
 * FNV-1a 32-bit hash of a string (a small, readable hash for the daily seed)
 * @param {string} text - Any string
 * @returns {number} Unsigned 32-bit integer
 */
function fnv1a(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

/**
 * mulberry32: a small seeded generator returning floats in [0, 1)
 * @param {number} seed - Unsigned 32-bit seed
 * @returns {function(): number} Next random number each time it is called
 */
function mulberry32(seed) {
  let state = seed >>> 0;
  return function () {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Build the daily puzzle for a date. Same date in, same puzzle out.
 * Uses the normal generator (Everything, Medium) with a seeded random source.
 * Math.random is restored even if generation throws.
 * @param {string} dateString - Local calendar date, YYYY-MM-DD
 * @returns {object|null} Puzzle object, or null if generation failed
 */
function generateDailyPuzzle(dateString) {
  try {
    random = mulberry32(fnv1a(`${DAILY_SALT}|${DAILY_SERIES}|${dateString}`));
    const puzzle = generatePuzzle(DAILY_CATEGORY, DAILY_DIFFICULTY);
    if (puzzle) puzzle.id = `daily_${DAILY_SERIES}_${dateString}`;
    return puzzle;
  } finally {
    random = Math.random;
  }
}

/**
 * Today's local calendar date from the browser clock
 * @param {Date} [now=new Date()] - Clock to read (injectable for tests)
 * @returns {string} YYYY-MM-DD
 */
function getDailyDate(now = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Daily number: days since DAILY_EPOCH, where the epoch itself is 1.
 * Counted from calendar dates in UTC so daylight-saving changes cannot shift it.
 * @param {string} dateString - YYYY-MM-DD
 * @returns {number} Daily number, never below 1
 */
function getDailyNumber(dateString) {
  const toUtcDay = (ymd) => {
    const [y, m, d] = ymd.split('-').map(Number);
    return Date.UTC(y, m - 1, d) / 86400000;
  };
  const days = Math.round(toUtcDay(dateString) - toUtcDay(DAILY_EPOCH));
  return Math.max(1, days + 1);
}

/**
 * The daily's displayed number: series and day, for example "1-12"
 * @param {string} dateString - YYYY-MM-DD
 * @returns {string} "series-day"
 */
function getDailyLabel(dateString) {
  return `${DAILY_SERIES}-${getDailyNumber(dateString)}`;
}

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
    actualDifficulty = difficulties[Math.floor(random() * difficulties.length)];
    gameState.assignedDifficulty = actualDifficulty;
  } else {
    gameState.assignedDifficulty = null;
  }

  // Step 1: Get questions from selected category
  let questions;
  if (category.toLowerCase() === 'everything') {
    // Combine all categories for maximum variety
    questions = Object.values(questionBanks).flat();
  } else {
    // Single category
    questions = questionBanks[category.toLowerCase()];
  }
  if (!questions || questions.length < 5) {
    console.error(`Not enough questions in category: ${category}`);
    return null;
  }

  // Step 2: Remove repeated question text (the same question can sit in two banks)
  questions = removeDuplicateQuestions(questions);

  // Step 3: Build 5 equations. Each slot takes the next shuffled question that
  // can be built with the chosen operator inside the range cap.
  const equations = [];
  const numberPool = [];
  let puzzleId = `${category}_${Date.now()}`;

  const shuffled = shuffleArray(questions);
  const operators = getOperatorsForDifficulty(actualDifficulty);
  let nextQuestion = 0;

  // First pass: one random operator per question, skip questions that do not fit
  while (equations.length < 5 && nextQuestion < shuffled.length) {
    const q = shuffled[nextQuestion++];
    const operator = operators[Math.floor(random() * operators.length)];
    const operands = generateOperands(q.answer, operator, actualDifficulty);
    if (operands) {
      equations.push(buildEquation(equations.length + 1, q, operator, operands));
    }
  }

  // Fallback (very unlikely): try every operator on every unused question
  for (
    let i = 0;
    equations.length < 5 && i < shuffled.length;
    i++
  ) {
    const q = shuffled[i];
    if (equations.some((eq) => eq.question === q.question)) continue;
    for (const operator of shuffleArray(operators)) {
      const operands = generateOperands(q.answer, operator, actualDifficulty);
      if (operands) {
        equations.push(
          buildEquation(equations.length + 1, q, operator, operands)
        );
        break;
      }
    }
  }

  if (equations.length < 5) {
    console.error(`Could not build a solvable puzzle for: ${category}`);
    return null;
  }

  equations.forEach((eq) => {
    numberPool.push(eq.solution.operand1, eq.solution.operand2);
  });

  // Step 4: Calculate column targets from generated operands
  let column1Total = 0;
  let column2Total = 0;

  equations.forEach((eq) => {
    column1Total += eq.solution.operand1;
    column2Total += eq.solution.operand2;
  });

  // Step 5: Add decoy numbers based on difficulty
  const { decoys: decoyCount, maxOperand } = DIFFICULTY_CONFIG[actualDifficulty];

  for (let i = 0; i < decoyCount; i++) {
    // Generate random decoy in valid range
    numberPool.push(randomInt(1, maxOperand));
  }

  // Step 6: Build puzzle object
  return {
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
}

/**
 * Everything that differs between difficulty levels, in one place.
 * maxOperand: largest operand (and decoy) value
 * decoys: extra pool numbers that belong to no equation
 * operators: operators the generator may use (all are shown to the player)
 */
const DIFFICULTY_CONFIG = {
  easy: { maxOperand: 50, decoys: 0, operators: ['+', '-'] },
  medium: { maxOperand: 100, decoys: 2, operators: ['+', '-'] },
  hard: { maxOperand: 200, decoys: 6, operators: ['+', '-', '×', '÷'] },
};

/**
 * Operators allowed for a difficulty
 * @param {string} difficulty - easy, medium or hard
 * @returns {array} Operator characters
 */
function getOperatorsForDifficulty(difficulty) {
  return DIFFICULTY_CONFIG[difficulty].operators;
}

/**
 * Build one equation object
 * @param {number} id - Equation number (1-5)
 * @param {object} q - Question { question, answer }
 * @param {string} operator - Operator shown on the equation
 * @param {object} operands - { op1, op2 }
 * @returns {object} Equation
 */
function buildEquation(id, q, operator, operands) {
  return {
    id: id,
    question: q.question,
    answer: q.answer,
    operator: operator,
    solution: {
      operand1: operands.op1,
      operand2: operands.op2,
      result: q.answer,
    },
  };
}

/**
 * Remove questions whose text repeats (case-insensitive)
 * @param {array} questions - Source question array
 * @returns {array} Questions with unique text
 */
function removeDuplicateQuestions(questions) {
  const seen = new Set();
  return questions.filter((q) => {
    const key = q.question.trim().toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Fisher-Yates shuffle (returns a new array)
 * @param {array} items - Source array
 * @returns {array} Shuffled copy
 */
function shuffleArray(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Select N random questions from array without duplicates
 * @param {array} questions - Source question array
 * @param {number} count - Number of questions to select
 * @returns {array} Selected questions
 */
function selectRandomQuestions(questions, count) {
  return shuffleArray(questions).slice(0, count);
}

/**
 * Generate a valid operand pair for the given answer and operator.
 * Both operands are whole numbers from 1 to the difficulty's range cap.
 * The pair is also unambiguous: no OTHER operator allowed at this difficulty
 * gives the same answer with it (so 2 + 2 = 2 × 2 is never built), which keeps
 * every equation tied to a single operator.
 * @param {number} answer - The equation result
 * @param {string} operator - '+', '-', '×' or '÷'
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {object|null} { op1, op2 }, or null if this answer cannot be built
 *   with this operator inside the range (the caller picks another question)
 */
function generateOperands(answer, operator, difficulty = 'easy') {
  // A random pair is only occasionally ambiguous, so a few tries is plenty
  for (let attempt = 0; attempt < 20; attempt++) {
    const operands = pickOperands(answer, operator, difficulty);
    if (!operands) return null;
    if (!hasOtherOperatorThatWorks(operands, answer, operator, difficulty)) {
      return operands;
    }
  }
  return null;
}

/**
 * Picks ONE random operand pair for the answer and operator. It does not
 * check for ambiguity; generateOperands does that and retries.
 * @param {number} answer - The equation result
 * @param {string} operator - '+', '-', '×' or '÷'
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {object|null} { op1, op2 }, or null if none fits the range
 */
function pickOperands(answer, operator, difficulty) {
  const maxOperand = DIFFICULTY_CONFIG[difficulty].maxOperand;

  // Answers must be whole numbers of at least 1
  if (!Number.isInteger(answer) || answer < 1) return null;

  if (operator === '+') {
    // op1 + op2 = answer, both between 1 and maxOperand
    const minOp1 = Math.max(1, answer - maxOperand);
    const maxOp1 = Math.min(answer - 1, maxOperand);
    if (minOp1 > maxOp1) return null;

    const op1 = randomInt(minOp1, maxOp1);
    return { op1, op2: answer - op1 };
  }

  if (operator === '-') {
    // op1 - op2 = answer, op1 up to maxOperand and op2 at least 1
    const minOp1 = answer + 1;
    if (minOp1 > maxOperand) return null;

    const op1 = randomInt(minOp1, maxOperand);
    return { op1, op2: op1 - answer };
  }

  if (operator === '×') {
    // op1 × op2 = answer: collect factor pairs that fit in range
    const factors = [];
    for (let i = 1; i <= Math.min(answer, maxOperand); i++) {
      const other = answer / i;
      if (Number.isInteger(other) && other <= maxOperand) {
        factors.push([i, other]);
      }
    }
    if (factors.length === 0) return null;

    const [op1, op2] = factors[Math.floor(random() * factors.length)];
    return { op1, op2 };
  }

  if (operator === '÷') {
    // op1 ÷ op2 = answer, so op1 = answer × op2 (op2 of at least 2)
    const validDivisors = [];
    for (let divisor = 2; answer * divisor <= maxOperand; divisor++) {
      validDivisors.push(divisor);
    }
    if (validDivisors.length === 0) return null;

    const op2 = validDivisors[Math.floor(random() * validDivisors.length)];
    return { op1: answer * op2, op2 };
  }

  // Unknown operator: never guess
  return null;
}

/**
 * Generate random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function randomInt(min, max) {
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Does one equation's maths: a [operator] b.
 * Shared by the generator (ambiguity check) and Submit validation.
 *
 * @param {string} operator - '+', '-', '×' or '÷'
 * @param {number} a - First operand
 * @param {number} b - Second operand
 * @returns {number|undefined} The result, or undefined for an unknown operator
 */
function applyOperator(operator, a, b) {
  if (operator === '+') return a + b;
  if (operator === '-') return a - b;
  if (operator === '×') return a * b;
  if (operator === '÷') return a / b;
  return undefined;
}

/**
 * True when some OTHER operator allowed at this difficulty also turns the
 * operand pair into the answer (e.g. 2 + 2 and 2 × 2 are both 4).
 *
 * @param {object} operands - { op1, op2 }
 * @param {number} answer - The equation result
 * @param {string} operator - The operator the equation was built with
 * @param {string} difficulty - Difficulty level (easy, medium, hard)
 * @returns {boolean} True if the pair is ambiguous
 */
function hasOtherOperatorThatWorks(operands, answer, operator, difficulty) {
  return getOperatorsForDifficulty(difficulty).some(
    (other) =>
      other !== operator &&
      applyOperator(other, operands.op1, operands.op2) === answer
  );
}

const gameState = {
  selectedNumber: null,
  selectedNumberElement: null,
  selectedBlank: null, // Selected blank waiting for pool number
  userInputs: {}, // Will store: { '0-0': 5, '0-1': 2, 'sol-0': 7, etc. }
  poolNumbersUsed: [], // Array of used numbers
  attempts: 0,
  completed: false,
  currentCategory: 'sports', // Currently selected category
  currentDifficulty: 'easy', // Currently selected difficulty
  hintsUsed: 0, // Number of hints used
  hintedEquations: {}, // Object: { equationId: ['?', '#'] } tracks hint types used
  assignedDifficulty: null, // Stores actual difficulty when "random" is selected
  attemptHistory: [], // One entry per Submit press, used for the share result
  mode: 'normal', // 'normal' or 'daily'
  dailyDate: null, // YYYY-MM-DD of the daily being played (daily mode only)
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
      }
    });

    const puzzleState = {
      puzzle: currentPuzzle,
      gameState: {
        userInputs: gameState.userInputs,
        poolNumbersUsed: gameState.poolNumbersUsed,
        attempts: gameState.attempts,
        hintsUsed: gameState.hintsUsed,
        hintedEquations: gameState.hintedEquations,
        hintRevealedInputs: hintRevealedInputs, // NEW: Track which elements were hint-revealed
        currentCategory: gameState.currentCategory,
        currentDifficulty: gameState.currentDifficulty,
        assignedDifficulty: gameState.assignedDifficulty,
        attemptHistory: gameState.attemptHistory,
        mode: gameState.mode,
        dailyDate: gameState.dailyDate,
        dailySeries: gameState.mode === 'daily' ? DAILY_SERIES : null,
      },
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem('sumwords_currentPuzzle', JSON.stringify(puzzleState));
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
  } catch (error) {
    console.error('Failed to clear puzzle state:', error);
  }
}

/**
 * Save a finished daily. Kept under its own key because handleWin clears the
 * current puzzle, and the finished result must survive a refresh.
 * @param {{date: string, number: number, attempts: number, hints: number, history: object[]}} result
 */
function saveDailyResult(result) {
  try {
    localStorage.setItem('sumwords_daily', JSON.stringify(result));
  } catch (error) {
    console.error('Failed to save daily result:', error);
  }
}

/**
 * Load the finished daily, if any
 * @returns {object|null} The saved result, or null when none exists or it cannot be read
 */
function loadDailyResult() {
  try {
    const saved = localStorage.getItem('sumwords_daily');
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.error('Failed to load daily result:', error);
    return null;
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
    daily: {
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
  } catch (error) {
    console.error('Failed to save statistics:', error);
  }
}

/**
 * Update statistics when puzzle is completed
 * @param {string} difficulty - Difficulty level (easy/medium/hard) - the ACTUAL difficulty played
 * @param {number} attempts - Number of attempts taken
 * @param {number} hints - Number of hints used
 * @param {boolean} [isDaily=false] - True for a daily puzzle: it counts as a normal win of its difficulty AND in the daily totals
 */
function updateStatistics(difficulty, attempts, hints, isDaily = false) {
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

  // A daily is ALSO tracked on its own (saves from before the daily have no bucket)
  if (isDaily) {
    stats.daily = stats.daily || getDefaultStats().daily;
    stats.daily.completed++;
    stats.daily.attempts += attempts;
    stats.daily.hints += hints;
    if (isPerfect) stats.daily.perfectGames++;
  }

  saveStatistics(stats);
}

/**
 * Reset current win streak (called when user gives up or resets)
 */
function resetStreak() {
  const stats = loadStatistics();
  stats.overall.currentStreak = 0;
  saveStatistics(stats);
}

/* ===================================
  INITIALIZATION
  =================================== */

// Current puzzle (will be set by generator)
let currentPuzzle = null;

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
  initializeGame();
});

function initializeGame() {
  showGameVersion();

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
  } else {
    // Use default values from dropdowns
    gameState.currentCategory = categorySelect.value;
    gameState.currentDifficulty = difficultySelect.value;
  }

  // Set up event listeners FIRST (before showing any modals)
  setupEventListeners();
  setupStatsModalListeners();
  refreshDailyUi();

  // Check for saved puzzle state
  const savedPuzzle = loadPuzzleState();

  if (savedPuzzle && isStaleDaily(savedPuzzle)) {
    // A daily from an earlier date is discarded; today's is started from the Daily button
    clearPuzzleState();
    startNewGame();
    showFeedback(
      `Your daily puzzle from ${savedPuzzle.gameState.dailyDate} was discarded. Press Daily for today's puzzle.`,
      'success'
    );
  } else if (savedPuzzle && hasMeaningfulProgress(savedPuzzle)) {
    // Show resume modal only if user made progress
    showResumeModal(savedPuzzle);
  } else {
    // No saved puzzle or no progress - start fresh
    if (savedPuzzle) {
      clearPuzzleState(); // Clear the empty saved puzzle
    }
    startNewGame();
  }
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
    modal.classList.add('hidden');
    resumeSavedGame(savedPuzzle);
  };

  // New game button handler
  newGameBtn.onclick = () => {
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
}

/**
 * Resume a saved game
 * @param {object} savedPuzzle - The saved puzzle state
 */
function resumeSavedGame(savedPuzzle) {
  const saved = savedPuzzle.gameState;

  // Restore puzzle data
  currentPuzzle = savedPuzzle.puzzle;

  gameState.currentCategory = saved.currentCategory;
  gameState.currentDifficulty = saved.currentDifficulty;
  gameState.assignedDifficulty = saved.assignedDifficulty || null; // Read by loadPuzzle for "Playing: ..."

  // Update dropdowns to match saved puzzle
  document.getElementById('category-select').value = gameState.currentCategory;
  document.getElementById('difficulty-select').value =
    gameState.currentDifficulty;

  // Load puzzle into UI. This resets gameState, so the saved progress is
  // restored after it below.
  loadPuzzle(currentPuzzle);

  gameState.poolNumbersUsed = saved.poolNumbersUsed || [];
  gameState.attempts = saved.attempts || 0;
  gameState.hintsUsed = saved.hintsUsed || 0;
  gameState.hintedEquations = withoutOperatorMarkers(saved.hintedEquations);
  gameState.attemptHistory = Array.isArray(saved.attemptHistory)
    ? saved.attemptHistory
    : []; // Saves from before share results have no history
  // Saves from before the Daily puzzle have no mode, so they resume as normal
  gameState.mode = saved.mode === 'daily' ? 'daily' : 'normal';
  gameState.dailyDate = saved.mode === 'daily' ? saved.dailyDate || null : null;
  refreshDailyUi(); // Locks the selectors and shows the banner for a daily

  // Restore user inputs to UI (also sets gameState.userInputs)
  restoreUserInputs(saved);

  // Update counters
  document.getElementById('attempt-count').textContent = gameState.attempts;
  document.getElementById('hint-count').textContent = gameState.hintsUsed;

  showFeedback('Puzzle resumed!', 'success');
}

/**
 * Drop the old '*' (Operator hint) marker from saved hint markers, so a save
 * made before the Operator hint was removed does not show a stale marker.
 * @param {object} hinted - Saved { equationId: ['?', '#', '*'] } (may be missing)
 * @returns {object} Same shape without '*' (equations left with no markers are dropped)
 */
function withoutOperatorMarkers(hinted) {
  const clean = {};
  Object.keys(hinted || {}).forEach((equationId) => {
    const markers = (hinted[equationId] || []).filter((m) => m !== '*');
    // An equation whose only hint was the Operator hint is no longer hinted
    if (markers.length > 0) clean[equationId] = markers;
  });
  return clean;
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

  // Restore hinted equations and hint markers
  Object.keys(savedGameState.hintedEquations || {}).forEach((equationId) => {
    const equation = document.querySelector(`[data-equation="${equationId}"]`);
    if (equation) {
      equation.classList.add('hinted');
    }
  });
  updateHintControls();

  // Restore hint-revealed styling
  (savedGameState.hintRevealedInputs || []).forEach((position) => {
    // Operand or solution (old 'operator-N' entries match nothing and are skipped)
    const element = document.querySelector(`[data-position="${position}"]`);
    if (element) {
      element.classList.add('hint-revealed');
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
  hideWinPanel(); // Every new or resumed puzzle starts without the win panel

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
  puzzle.equations.forEach((eq) => {
    const equationDiv = document.querySelector(`[data-equation="${eq.id}"]`);
    equationDiv.querySelector('.question').textContent = eq.question;

    // Every level shows the operator as plain text
    const visibleOperator = equationDiv.querySelector(
      '.operator-container .operator'
    );
    visibleOperator.textContent = eq.operator;
  });

  // Clear any previous state
  resetGameState();

  // Populate number pool
  renderNumberPool(puzzle);

  // Update column totals (initially 0)
  updateColumnTotals();
}

/**
 * Reset game state for new puzzle
 */
function resetGameState() {
  gameState.selectedNumber = null;
  gameState.selectedNumberElement = null;
  gameState.selectedBlank = null; // Avoid a stale selection surviving a new puzzle
  gameState.userInputs = {};
  gameState.poolNumbersUsed = [];
  gameState.attempts = 0;
  gameState.completed = false;
  gameState.hintsUsed = 0;
  gameState.hintedEquations = {}; // Reset to empty object
  gameState.assignedDifficulty = null;
  gameState.attemptHistory = [];

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

  // Clear UI - equations
  document.querySelectorAll('.equation').forEach((eq) => {
    eq.classList.remove('error', 'hinted');
  });

  // Reset counters
  document.getElementById('attempt-count').textContent = '0';
  document.getElementById('hint-count').textContent = '0';

  // Reset buttons
  document.getElementById('submit-btn').disabled = false;
  document.getElementById('reset-btn').disabled = false;
  closeHintChoices();
  updateHintControls();

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

/**
 * Mobile header menu: toggle button opens a dropdown panel of header actions.
 * Closes on item click, outside click, Escape, or when the screen grows past 600px.
 */
function setupHeaderMenu() {
  const toggle = document.getElementById('menu-toggle');
  const panel = document.getElementById('header-controls');
  const wideScreen = window.matchMedia('(min-width: 601px)');

  function setMenuOpen(open) {
    panel.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  }

  toggle.addEventListener('click', () => {
    const open = !panel.classList.contains('open');
    setMenuOpen(open);
    if (open) panel.querySelector('.btn-header').focus();
  });

  // Running an item closes the menu
  panel.addEventListener('click', (event) => {
    if (event.target.closest('.btn-header')) setMenuOpen(false);
  });

  // Outside click closes it
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.header-menu')) setMenuOpen(false);
  });

  // Escape closes it and returns focus to the toggle
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && panel.classList.contains('open')) {
      setMenuOpen(false);
      toggle.focus();
    }
  });

  // Growing past the mobile breakpoint resets the menu
  wideScreen.addEventListener('change', (event) => {
    if (event.matches) setMenuOpen(false);
  });
}

function setupEventListeners() {
  setupHeaderMenu();

  // Number pool clicks
  document
    .getElementById('number-pool')
    .addEventListener('click', handlePoolClick);

  // Operand blank clicks
  document.querySelectorAll('.blank.operand').forEach((blank) => {
    blank.addEventListener('click', handleOperandClick);
  });

  // Solution input changes (with validation)
  document.querySelectorAll('.blank.solution').forEach((input) => {
    input.addEventListener('input', validateSolutionInput);
    input.addEventListener('keydown', handleSolutionKeydown);
  });

  // Submit button
  document.getElementById('submit-btn').addEventListener('click', handleSubmit);

  // Header buttons
  document
    .getElementById('stats-btn')
    .addEventListener('click', showStatsModal);
  document
    .getElementById('daily-btn')
    .addEventListener('click', handleDailyClick);
  document
    .getElementById('new-puzzle-btn')
    .addEventListener('click', handleNewPuzzle);
  document.getElementById('reset-btn').addEventListener('click', handleReset);

  // Win panel
  document.getElementById('share-btn').addEventListener('click', handleShare);
  document
    .getElementById('win-new-puzzle-btn')
    .addEventListener('click', handleNewPuzzle);

  // Category and difficulty selectors
  document
    .getElementById('category-select')
    .addEventListener('change', handleCategoryChange);
  document
    .getElementById('difficulty-select')
    .addEventListener('change', handleDifficultyChange);

  // Hints: one delegated listener for every equation's Hint button and choices
  document
    .querySelector('.equations-container')
    .addEventListener('click', handleHintClick);
  document.addEventListener('keydown', handleHintKeydown);
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

    // Place in blank (this also moves the selection to the next empty blank)
    placeNumberInBlank(blank, position);

    return;
  }

  // Deselect previous pool selection
  deselectPoolNumber();

  // Select this number
  clickedNumber.classList.add('selected');
  gameState.selectedNumber = parseInt(clickedNumber.dataset.number);
  gameState.selectedNumberElement = clickedNumber;
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
  const blank = event.currentTarget;
  const position = blank.dataset.position;

  // If blank is filled, return number to pool
  if (blank.classList.contains('filled')) {
    returnNumberToPool(blank, position);
    // The player is fixing this number: the next tile goes back into this blank,
    // not into the blank auto-advance had selected
    if (gameState.selectedNumber === null) selectBlankForPlacement(blank);
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

  // Deselect pool number, blank, and update totals
  deselectPoolNumber();
  selectNextEmptyBlank(position); // Clears this blank's selection, then auto-advances
  updateColumnTotals();
  savePuzzleState(); // AUTO-SAVE after number placement
}

/**
 * Select the next empty operand blank after `fromPosition` (wraps around).
 * Selects nothing when every blank is filled. The selection is not saved.
 * @param {string} fromPosition - Position of the blank just filled
 */
function selectNextEmptyBlank(fromPosition) {
  const blanks = Array.from(document.querySelectorAll('.blank.operand'));
  const nextPosition = findNextEmptyPosition(
    blanks.map((b) => b.dataset.position),
    gameState.userInputs,
    fromPosition
  );
  deselectBlank();
  if (nextPosition === null) return;

  const nextBlank = blanks.find((b) => b.dataset.position === nextPosition);
  selectBlankForPlacement(nextBlank);
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

  updateColumnTotals();
  savePuzzleState(); // AUTO-SAVE after returning number
}

/* ===================================
  COLUMN TOTALS UPDATE
  =================================== */

/**
 * Adds up one column of placed operands.
 * Loops over the puzzle's own equations so the count is never hardcoded.
 * Empty blanks add nothing; a real 0 still counts.
 *
 * @param {string} prefix - 'op1' for column 1 (first operands), 'op2' for column 2
 * @returns {number} Sum of the operands currently placed in that column
 */
function sumColumn(prefix) {
  let total = 0;
  currentPuzzle.equations.forEach((eq) => {
    const value = gameState.userInputs[`${prefix}-${eq.id}`];
    if (!isBlank(value)) {
      total += value;
    }
  });
  return total;
}

function updateColumnTotals() {
  const col1Total = sumColumn('op1');
  const col2Total = sumColumn('op2');

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

  // Record this attempt for the share result (before validating, which only highlights)
  gameState.attemptHistory.push(
    buildAttemptEntry(
      currentPuzzle.equations,
      currentPuzzle.columnTargets,
      gameState.userInputs,
      gameState.hintedEquations
    )
  );

  // Validate all conditions
  const validation = validatePuzzle();

  if (validation.success) {
    handleWin();
  } else {
    handleErrors(validation.errors);
  }
}

/**
 * True when a blank has nothing usable placed in it.
 * Checks explicitly, because 0 is a real value (a plain `!value` check would
 * wrongly treat 0 as empty). NaN can only come from a damaged saved puzzle,
 * so it counts as empty rather than poisoning the column totals.
 *
 * @param {number|undefined|null} value - The blank's value from gameState.userInputs
 * @returns {boolean} True if nothing usable is placed
 */
function isBlank(value) {
  return value === undefined || value === null || Number.isNaN(value);
}

/**
 * Builds a plain-English label for one or more equation numbers.
 *
 * @param {number[]} ids - Equation ids, e.g. [2] or [2, 4]
 * @returns {string} "Equation 2" or "Equations 2, 4"
 */
function equationLabel(ids) {
  return ids.length === 1
    ? `Equation ${ids[0]}`
    : `Equations ${ids.join(', ')}`;
}

/**
 * Sorts every equation that isn't right yet into one of two groups, so
 * Submit can tell the player what kind of problem each one has.
 * The operator is part of the puzzle and always shown, so only the numbers
 * are checked, against the equation's own operator.
 *
 * @returns {{incompleteEquations: number[], wrongNumberEquations: number[], badEquationIds: number[]}}
 *   Equation ids: still has an empty blank, or has numbers that don't work
 *   out. badEquationIds lists every problem equation once.
 */
function findBadEquations() {
  const incompleteEquations = [];
  const wrongNumberEquations = [];

  currentPuzzle.equations.forEach((eq) => {
    const op1 = gameState.userInputs[`op1-${eq.id}`];
    const op2 = gameState.userInputs[`op2-${eq.id}`];
    const sol = gameState.userInputs[`sol-${eq.id}`];

    if (isBlank(op1) || isBlank(op2) || isBlank(sol)) {
      incompleteEquations.push(eq.id);
      return;
    }

    if (applyOperator(eq.operator, op1, op2) !== sol) {
      wrongNumberEquations.push(eq.id);
    }
  });

  // Every equation with any problem (once each), for highlighting
  const badEquationIds = [
    ...new Set([...incompleteEquations, ...wrongNumberEquations]),
  ];

  return { incompleteEquations, wrongNumberEquations, badEquationIds };
}

/**
 * Checks the whole puzzle and collects plain-English errors for Submit.
 * Each check is reported separately so the player knows what to fix.
 *
 * @returns {{success: boolean, errors: string[]}} Result and list of messages
 */
function validatePuzzle() {
  const errors = [];

  // Check 1: Every operand blank is filled from the pool. Decoys are never
  // placed, so the count needed is 2 per equation, not the whole pool size.
  const numbersNeeded = currentPuzzle.equations.length * 2;
  if (gameState.poolNumbersUsed.length !== numbersNeeded) {
    errors.push(
      `Only ${gameState.poolNumbersUsed.length}/${numbersNeeded} pool numbers used`
    );
  }

  // Check 2: Column 1 total correct
  const col1Total = sumColumn('op1');
  if (col1Total !== currentPuzzle.columnTargets.column1) {
    errors.push(
      `Column 1 total is ${col1Total}, should be ${currentPuzzle.columnTargets.column1}`
    );
  }

  // Check 3: Column 2 total correct
  const col2Total = sumColumn('op2');
  if (col2Total !== currentPuzzle.columnTargets.column2) {
    errors.push(
      `Column 2 total is ${col2Total}, should be ${currentPuzzle.columnTargets.column2}`
    );
  }

  // Check 4: Every equation is complete and works.
  const { incompleteEquations, wrongNumberEquations, badEquationIds } =
    findBadEquations();

  if (incompleteEquations.length > 0) {
    errors.push(
      `${equationLabel(incompleteEquations)}: a number is missing`
    );
  }
  if (wrongNumberEquations.length > 0) {
    errors.push(
      `${equationLabel(wrongNumberEquations)}: the numbers do not give the answer`
    );
  }

  if (badEquationIds.length > 0) {
    // Highlight incorrect equations
    badEquationIds.forEach((id) => {
      document.querySelector(`[data-equation="${id}"]`).classList.add('error');
    });
  } else {
    // Clear error highlighting
    document
      .querySelectorAll('.equation')
      .forEach((eq) => eq.classList.remove('error'));
  }

  // Check 5: Solutions match trivia answers.
  // An empty solution is already reported by Check 4, so skip it here.
  currentPuzzle.equations.forEach((eq) => {
    const userAnswer = gameState.userInputs[`sol-${eq.id}`];
    if (!isBlank(userAnswer) && userAnswer !== eq.answer) {
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
  closeHintChoices();

  // Update statistics
  updateStatistics(
    gameState.currentDifficulty,
    gameState.attempts,
    gameState.hintsUsed,
    gameState.mode === 'daily'
  );

  // A finished daily is remembered under its own key (see saveDailyResult)
  if (gameState.mode === 'daily') {
    saveDailyResult({
      series: DAILY_SERIES,
      date: gameState.dailyDate,
      number: getDailyNumber(gameState.dailyDate),
      attempts: gameState.attempts,
      hints: gameState.hintsUsed,
      history: gameState.attemptHistory,
    });
    document.getElementById('reset-btn').disabled = true; // No replaying the daily
  }

  // Clear saved puzzle (completed)
  clearPuzzleState();

  // Show the win panel in place of the one-line message
  showWinPanel();

  // Trigger confetti
  triggerConfetti();
}

function handleErrors(errors) {
  const message = 'Not quite right:\n' + errors.join('\n');
  showFeedback(message, 'error');
}

function showFeedback(message, type) {
  const feedback = document.getElementById('feedback');
  feedback.textContent = message;
  feedback.className = `feedback ${type}`;
}

/* ===================================
  SHARE RESULTS
  =================================== */

const SHARE_URL = 'https://thebimsider.github.io/sumwords/V01/';
const SHARE_MAX_ROWS = 8; // Grid shows only the last rows of a very long game
const SHARE_SQUARES = { correct: '🟩', hinted: '🟨', wrong: '🟥', empty: '⬜' };
let shareLabelTimer = null;

/**
 * Records one Submit press as a spoiler-free result: each equation's status
 * and whether each column matches its target. Reads only its arguments.
 * An equation is 'correct' when its numbers work out AND the solution matches
 * the trivia answer, 'empty' when any blank is unfilled, otherwise 'wrong'.
 * A column is true only when all its blanks are filled and the total matches.
 * `hinted` is a snapshot: true for each equation with any hint used on it at
 * the moment of this Submit, so later hints do not change earlier rows.
 *
 * @param {object[]} equations - currentPuzzle.equations
 * @param {{column1: number, column2: number}} columnTargets - currentPuzzle.columnTargets
 * @param {object} userInputs - gameState.userInputs
 * @param {object} [hintedEquations={}] - gameState.hintedEquations ({ equationId: ['?', '#'] })
 * @returns {{equations: string[], columns: boolean[], hinted: boolean[]}} One attempt's result
 */
function buildAttemptEntry(equations, columnTargets, userInputs, hintedEquations = {}) {
  const equationResults = equations.map((eq) => {
    const op1 = userInputs[`op1-${eq.id}`];
    const op2 = userInputs[`op2-${eq.id}`];
    const sol = userInputs[`sol-${eq.id}`];
    if (isBlank(op1) || isBlank(op2) || isBlank(sol)) return 'empty';

    const numbersWork = applyOperator(eq.operator, op1, op2) === sol;
    return numbersWork && sol === eq.answer ? 'correct' : 'wrong';
  });

  const columnComplete = (prefix, target) => {
    const values = equations.map((eq) => userInputs[`${prefix}-${eq.id}`]);
    if (values.some(isBlank)) return false;
    return values.reduce((total, value) => total + value, 0) === target;
  };

  return {
    equations: equationResults,
    columns: [
      columnComplete('op1', columnTargets.column1),
      columnComplete('op2', columnTargets.column2),
    ],
    hinted: equations.map((eq) => (hintedEquations[eq.id] || []).length > 0),
  };
}

/**
 * Builds the text copied by "Share result". Pure: no page or game globals.
 *
 * @param {object} result
 * @param {string} result.version - GAME_VERSION
 * @param {string} result.url - Game link shown on the last line
 * @param {string} result.currentDifficulty - 'easy', 'medium', 'hard' or 'random'
 * @param {string|null} result.assignedDifficulty - Actual level when random was chosen
 * @param {number} result.attempts - True attempt count (may exceed history length)
 * @param {number} result.hints - Hints used
 * @param {{equations: string[], columns: boolean[], hinted?: boolean[]}[]} result.history - One entry per Submit (hinted is absent in older saves)
 * @param {number|string} [result.dailyNumber] - Daily puzzle number (the "series-day" label, for example "1-12"). When present the header shows it instead of the difficulty
 * @returns {string} Share text with no trivia or puzzle numbers
 */
function buildShareText({
  version,
  url,
  currentDifficulty,
  assignedDifficulty,
  attempts,
  hints,
  history,
  dailyNumber,
}) {
  const difficultyKey = assignedDifficulty || currentDifficulty;
  const difficulty =
    difficultyKey.charAt(0).toUpperCase() + difficultyKey.slice(1);
  const perfect = attempts === 1 && hints === 0;
  // A daily is always Medium, so its header names the daily number instead
  const header = dailyNumber
    ? `Sumwords v${version} · Daily #${dailyNumber}`
    : `Sumwords v${version} · ${difficulty}`;

  const lines = [
    header,
    `${countWord(attempts, 'attempt')} · ${countWord(hints, 'hint')}${perfect ? ' ⭐' : ''}`,
    '',
  ];

  history.slice(-SHARE_MAX_ROWS).forEach((entry) => {
    // Yellow only replaces green: a wrong or empty hinted equation keeps its square.
    // Entries saved before `hinted` existed have no flags, so they render as before.
    const equationRow = entry.equations
      .map((status, i) => {
        if (status === 'correct' && entry.hinted && entry.hinted[i]) {
          return SHARE_SQUARES.hinted;
        }
        return SHARE_SQUARES[status] || SHARE_SQUARES.empty;
      })
      .join('');
    const columnRow = entry.columns
      .map((ok) => (ok ? SHARE_SQUARES.correct : SHARE_SQUARES.wrong))
      .join('');
    lines.push(`${equationRow} ${columnRow}`);
  });

  lines.push('', url);
  return lines.join('\n');
}

/**
 * "1 attempt", "3 attempts", "1 hint", "2 hints"
 * @param {number} count
 * @param {string} word - Singular noun
 * @returns {string}
 */
function countWord(count, word) {
  return `${count} ${word}${count === 1 ? '' : 's'}`;
}

/**
 * Show the win panel in place of the one-line success message.
 * Call after updateStatistics so the streak is up to date.
 */
function showWinPanel() {
  document.getElementById('win-attempts').textContent = countWord(
    gameState.attempts,
    'attempt'
  );
  document.getElementById('win-hints').textContent = countWord(
    gameState.hintsUsed,
    'hint'
  );
  document.getElementById('win-streak').textContent =
    loadStatistics().overall.currentStreak;

  document.getElementById('win-next-daily').hidden =
    gameState.mode !== 'daily';
  document.getElementById('feedback').hidden = true;
  document.getElementById('win-panel').hidden = false;
}

/**
 * Hide the win panel and bring back the message line. Safe to call anytime.
 */
function hideWinPanel() {
  clearTimeout(shareLabelTimer);
  shareLabelTimer = null;
  document.getElementById('share-btn').textContent = 'Share result';
  document.getElementById('share-fallback').hidden = true;
  document.getElementById('share-fallback-text').value = '';

  document.getElementById('win-panel').hidden = true;
  document.getElementById('win-next-daily').hidden = true;
  document.getElementById('feedback').hidden = false;
}

/**
 * Copy the share text. If the clipboard is unavailable (for example a
 * file:// page or permission denied), show the text in a box to copy by hand.
 */
async function handleShare() {
  const text = buildShareText({
    version: GAME_VERSION,
    url: SHARE_URL,
    currentDifficulty: gameState.currentDifficulty,
    assignedDifficulty: gameState.assignedDifficulty,
    attempts: gameState.attempts,
    hints: gameState.hintsUsed,
    history: gameState.attemptHistory,
    dailyNumber:
      gameState.mode === 'daily'
        ? getDailyLabel(gameState.dailyDate)
        : undefined,
  });

  try {
    await navigator.clipboard.writeText(text);
    showShareCopied();
  } catch (error) {
    showShareFallback(text);
  }
}

/**
 * Tell the player the result was copied: the button reads "Copied!" for
 * two seconds, then goes back to "Share result".
 */
function showShareCopied() {
  const button = document.getElementById('share-btn');
  document.getElementById('share-fallback').hidden = true;
  button.textContent = 'Copied!';

  clearTimeout(shareLabelTimer);
  shareLabelTimer = setTimeout(() => {
    button.textContent = 'Share result';
    shareLabelTimer = null;
  }, 2000);
}

/**
 * Show the result in a read-only text box, selected, so the player can copy
 * it by hand when the clipboard is blocked (for example on a file:// page).
 * @param {string} text - The share text to show
 */
function showShareFallback(text) {
  const box = document.getElementById('share-fallback-text');
  box.value = text;
  document.getElementById('share-fallback').hidden = false;
  box.focus();
  box.select();
}

/* ===================================
  NEW PUZZLE & RESET HANDLERS
  =================================== */

/**
 * True if the player has made a Submit or used a hint on a puzzle they have not
 * solved yet (breaks the win streak on Reset). A solved puzzle never counts:
 * its win is already recorded.
 */
function hasPlayed() {
  return (
    !gameState.completed && (gameState.attempts > 0 || gameState.hintsUsed > 0)
  );
}

/**
 * True if the player has progress that a new puzzle or reset would discard.
 * A solved puzzle has nothing left to lose.
 */
function hasProgress() {
  return (
    !gameState.completed &&
    (hasPlayed() ||
      gameState.poolNumbersUsed.length > 0 ||
      Object.keys(gameState.userInputs).some((key) => key.startsWith('sol')))
  );
}

/**
 * Find the next empty operand position after `fromPosition`, wrapping around
 * @param {string[]} positions - Operand positions in play order (op1-1, op2-1, op1-2, ...)
 * @param {object} userInputs - gameState.userInputs
 * @param {string} fromPosition - Position just filled
 * @returns {string|null} Next empty position, or null if every blank is filled
 */
function findNextEmptyPosition(positions, userInputs, fromPosition) {
  const start = positions.indexOf(fromPosition);
  for (let i = 1; i <= positions.length; i++) {
    const candidate = positions[(start + i) % positions.length];
    if (userInputs[candidate] === undefined) return candidate;
  }
  return null;
}

/**
 * Ask before discarding progress. Returns true when there is nothing to lose or the player confirms.
 * @param {string} message - Confirmation text
 * @returns {boolean}
 */
function confirmDiscardProgress(message) {
  if (!hasProgress()) return true;
  return confirm(message);
}

/* ===================================
  DAILY PUZZLE
  =================================== */

/**
 * True when a saved puzzle is a daily that is no longer today's: from another
 * date, or from an earlier series (the dailies were changed since)
 * @param {object} puzzleState - Saved puzzle state
 * @returns {boolean}
 */
function isStaleDaily(puzzleState) {
  const saved = puzzleState.gameState;
  return (
    !!saved &&
    saved.mode === 'daily' &&
    (saved.dailyDate !== getDailyDate() || saved.dailySeries !== DAILY_SERIES)
  );
}

/**
 * Daily button: start today's daily. Does nothing while today's daily is
 * already loaded, so the current progress is never replaced by accident.
 */
function handleDailyClick() {
  const today = getDailyDate();
  if (gameState.mode === 'daily' && gameState.dailyDate === today) return;

  if (
    !confirmDiscardProgress(
      "Start today's daily puzzle? Your progress on this one will be lost."
    )
  ) {
    return;
  }

  // Already won today: show the saved result instead of a new puzzle
  const finished = loadDailyResult();
  if (finished && finished.date === today && finished.series === DAILY_SERIES) {
    showFinishedDaily(finished);
  } else {
    startDailyPuzzle(today);
  }
}

/**
 * Show a finished daily: today's board with the win panel, the saved
 * attempts and hints, Share result and "Next puzzle tomorrow". The daily
 * cannot be played again, so Submit and the hints are turned off.
 * @param {{date: string, attempts: number, hints: number, history: object[]}} result - From loadDailyResult
 */
function showFinishedDaily(result) {
  if (!loadDailyBoard(result.date)) return;

  gameState.attempts = result.attempts || 0;
  gameState.hintsUsed = result.hints || 0;
  gameState.attemptHistory = Array.isArray(result.history) ? result.history : [];
  gameState.completed = true;
  document.getElementById('attempt-count').textContent = gameState.attempts;
  document.getElementById('hint-count').textContent = gameState.hintsUsed;
  document.getElementById('submit-btn').disabled = true;
  document.getElementById('reset-btn').disabled = true;
  document.querySelectorAll('.btn-hint-equation').forEach((button) => {
    button.disabled = true;
  });

  clearPuzzleState(); // Nothing to resume: the daily is done
  showWinPanel();
}

/**
 * Start today's (unfinished) daily
 * @param {string} dateString - Local calendar date, YYYY-MM-DD
 */
function startDailyPuzzle(dateString) {
  if (!loadDailyBoard(dateString)) return;

  showFeedback(
    `Daily puzzle #${getDailyLabel(dateString)} loaded!`,
    'success'
  );
  savePuzzleState();
}

/**
 * Load the daily puzzle for a date onto the board and switch the game into
 * daily mode (selectors locked, banner shown)
 * @param {string} dateString - Local calendar date, YYYY-MM-DD
 * @returns {boolean} False if the puzzle could not be generated
 */
function loadDailyBoard(dateString) {
  const puzzle = generateDailyPuzzle(dateString);
  if (!puzzle) {
    showFeedback('Failed to generate puzzle. Please try again.', 'error');
    return false;
  }

  currentPuzzle = puzzle;
  gameState.currentCategory = DAILY_CATEGORY;
  gameState.currentDifficulty = DAILY_DIFFICULTY;
  gameState.mode = 'daily';
  gameState.dailyDate = dateString;
  document.getElementById('category-select').value = DAILY_CATEGORY;
  document.getElementById('difficulty-select').value = DAILY_DIFFICULTY;

  loadPuzzle(currentPuzzle); // Resets the play state; mode and date are kept
  refreshDailyUi();
  return true;
}

/**
 * Leave daily mode: restore the player's own category and difficulty and
 * re-enable the selectors. Does nothing outside daily mode.
 */
function leaveDaily() {
  if (gameState.mode !== 'daily') return;

  const prefs = loadPreferences() || {
    category: 'sports',
    difficulty: 'random',
  }; // Same defaults as the first dropdown options
  gameState.mode = 'normal';
  gameState.dailyDate = null;
  gameState.currentCategory = prefs.category;
  gameState.currentDifficulty = prefs.difficulty;
  document.getElementById('category-select').value = prefs.category;
  document.getElementById('difficulty-select').value = prefs.difficulty;
  refreshDailyUi();
}

/**
 * Show the daily state in the header and banner: the Daily button label,
 * the daily banner, and the category and difficulty selectors (locked in daily mode)
 */
function refreshDailyUi() {
  const inDaily = gameState.mode === 'daily';

  document.getElementById('category-select').disabled = inDaily;
  document.getElementById('difficulty-select').disabled = inDaily;
  document.getElementById('daily-btn').textContent = `📅 Daily #${getDailyLabel(
    getDailyDate()
  )}`;

  const banner = document.getElementById('daily-banner');
  if (inDaily) {
    banner.textContent = `Daily puzzle #${getDailyLabel(
      gameState.dailyDate
    )} · Medium · Everything`;
    banner.style.display = 'block';
  } else {
    banner.style.display = 'none';
  }
}

/**
 * Generate and load a completely new puzzle
 */
function handleNewPuzzle() {
  if (
    !confirmDiscardProgress(
      'Start a new puzzle? Your progress on this one will be lost.'
    )
  ) {
    return;
  }

  leaveDaily(); // New Puzzle always leaves daily mode

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
  // A finished daily cannot be replayed, so there is nothing to reset
  if (gameState.mode === 'daily' && gameState.completed) return;

  // Only a played puzzle (Submit or hint) breaks the win streak
  const breaksStreak = hasPlayed();

  if (hasProgress()) {
    const streak = loadStatistics().overall.currentStreak;
    const streakNote =
      breaksStreak && streak > 0 ? ' Your win streak will be reset.' : '';
    const message = `Reset this puzzle? Your blanks and hints will be cleared.${streakNote}`;
    if (!confirm(message)) return;
  }

  // Clear all user inputs
  gameState.userInputs = {};
  gameState.poolNumbersUsed = [];
  gameState.selectedNumber = null;
  gameState.selectedNumberElement = null;
  gameState.selectedBlank = null;
  gameState.attempts = 0;
  gameState.completed = false;
  gameState.hintsUsed = 0;
  gameState.hintedEquations = {}; // Reset to empty object
  gameState.attemptHistory = [];
  hideWinPanel();

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

  // Clear UI - equations
  document.querySelectorAll('.equation').forEach((eq) => {
    eq.classList.remove('error', 'hinted');
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
  closeHintChoices();
  updateHintControls();

  // Clear feedback
  document.getElementById('feedback').textContent = '';
  document.getElementById('feedback').className = 'feedback';

  // Update column totals to 0
  updateColumnTotals();

  showFeedback('Puzzle reset. Try again!', 'warning');

  // Reset streak only if the player had played this puzzle
  if (breaksStreak) {
    resetStreak();
  }

  // Clear saved state and save fresh reset state
  clearPuzzleState();
  savePuzzleState();
}

/**
 * Handle category selection change
 */
function handleCategoryChange(event) {
  if (
    !confirmDiscardProgress(
      'Change category? Your progress on this puzzle will be lost.'
    )
  ) {
    event.target.value = gameState.currentCategory; // Snap back to the loaded category
    return;
  }

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

  savePreferences(); // Save category preference
  clearPuzzleState(); // Clear old puzzle
  savePuzzleState(); // Save new puzzle
}

/**
 * Handle difficulty selection change
 */
function handleDifficultyChange(event) {
  if (
    !confirmDiscardProgress(
      'Change difficulty? Your progress on this puzzle will be lost.'
    )
  ) {
    event.target.value = gameState.currentDifficulty; // Snap back to the loaded difficulty
    return;
  }

  gameState.currentDifficulty = event.target.value;

  // Generate new puzzle with selected difficulty
  currentPuzzle = generatePuzzle(
    gameState.currentCategory,
    gameState.currentDifficulty
  );

  if (!currentPuzzle) {
    showFeedback('Failed to generate puzzle. Please try again.', 'error');
    return;
  }

  loadPuzzle(currentPuzzle);
  showFeedback(`New ${gameState.currentDifficulty} puzzle loaded!`, 'success');

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

  // Third digit typed: move on (fewer digits never advance, so the answer's
  // length is not revealed). The last input stays focused.
  if (value.length === 3) focusNextSolutionInput(input, false);
}

/**
 * Enter moves to the next solution input; Enter on the last one focuses Submit
 * @param {KeyboardEvent} event
 */
function handleSolutionKeydown(event) {
  if (event.key !== 'Enter') return;
  event.preventDefault();
  focusNextSolutionInput(event.target, true);
}

/**
 * Focus the solution input after `input`, selecting its text so typing replaces it
 * @param {HTMLInputElement} input - Current solution input
 * @param {boolean} submitAtEnd - Focus the Submit button when there is no next input
 */
function focusNextSolutionInput(input, submitAtEnd) {
  const inputs = Array.from(document.querySelectorAll('.blank.solution'));
  const next = inputs[inputs.indexOf(input) + 1];
  if (next) {
    next.focus();
    next.select();
  } else if (submitAtEnd) {
    document.getElementById('submit-btn').focus();
  }
}

/* ===================================
  HINT SYSTEM
  =================================== */

/**
 * Has this hint type already been used on the equation?
 * @param {number} equationId - ID of equation
 * @param {string} markerType - '?' (answer) or '#' (numbers)
 */
function hasHint(equationId, markerType) {
  return (gameState.hintedEquations[equationId] || []).includes(markerType);
}

/**
 * Delegated click handler for every equation's Hint button and choice row
 */
function handleHintClick(event) {
  const toggle = event.target.closest('.btn-hint-equation');
  if (toggle) {
    if (gameState.completed) return;
    const row = document.getElementById(`hint-choices-${toggle.dataset.equation}`);
    if (row.hidden) {
      openHintChoices(parseInt(toggle.dataset.equation));
    } else {
      closeHintChoices(true);
    }
    return;
  }

  const choice = event.target.closest('.btn-hint-choice');
  if (choice) {
    const equationId = parseInt(choice.dataset.equation);
    if (choice.dataset.hint === 'answer') revealAnswer(equationId);
    if (choice.dataset.hint === 'numbers') revealNumbers(equationId);
    updateHintControls();
    closeHintChoices(true);
    return;
  }

  // Tapping a blank closes any open choice row (the blank still does its job)
  if (event.target.closest('.blank')) closeHintChoices();
}

/**
 * Escape closes the open choice row and returns focus to its Hint button
 */
function handleHintKeydown(event) {
  if (event.key !== 'Escape') return;
  if (document.querySelector('.hint-choices:not([hidden])')) {
    closeHintChoices(true);
  }
}

/**
 * Open one equation's choice row (closing any other) and focus its first choice
 * @param {number} equationId - ID of equation
 */
function openHintChoices(equationId) {
  closeHintChoices();
  const row = document.getElementById(`hint-choices-${equationId}`);
  const toggle = document.querySelector(
    `.btn-hint-equation[data-equation="${equationId}"]`
  );
  if (!row || !toggle) return;
  row.hidden = false;
  toggle.setAttribute('aria-expanded', 'true');
  const first = row.querySelector('.btn-hint-choice:not(:disabled)');
  if (first) first.focus();
}

/**
 * Close every choice row
 * @param {boolean} returnFocus - Move focus back to the Hint button that was open
 */
function closeHintChoices(returnFocus = false) {
  // Only one row is ever open; its Hint button points at it via aria-controls
  const openRow = document.querySelector('.hint-choices:not([hidden])');
  const toggle =
    openRow && document.querySelector(`[aria-controls="${openRow.id}"]`);

  if (openRow) openRow.hidden = true;
  document.querySelectorAll('.btn-hint-equation').forEach((button) => {
    button.setAttribute('aria-expanded', 'false');
  });
  if (returnFocus && toggle && !toggle.disabled) toggle.focus();
}

/**
 * Sync every Hint button and choice with the hints used so far: a used choice
 * is disabled, and an equation with both hints used shows "Hinted"
 */
function updateHintControls() {
  document.querySelectorAll('.btn-hint-equation').forEach((toggle) => {
    const id = parseInt(toggle.dataset.equation);
    const answerUsed = hasHint(id, '?');
    const numbersUsed = hasHint(id, '#');
    const row = document.getElementById(`hint-choices-${id}`);
    row.querySelector('[data-hint="answer"]').disabled = answerUsed;
    row.querySelector('[data-hint="numbers"]').disabled = numbersUsed;
    toggle.disabled = answerUsed && numbersUsed;
    toggle.textContent = toggle.disabled ? 'Hinted' : 'Hint';
  });
}

/**
 * Reveal the answer (solution) for an equation
 * @param {number} equationId - ID of equation
 */
function revealAnswer(equationId) {
  if (hasHint(equationId, '?')) return;

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
}

/**
 * Reveal both numbers (operands) for an equation
 * @param {number} equationId - ID of equation
 */
function revealNumbers(equationId) {
  if (hasHint(equationId, '#')) return;

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

    // Leave a blank the player already filled alone. Its pool tile was
    // marked when it was placed, so counting it again would double count.
    if (gameState.userInputs[position] !== undefined) return;

    // Fill the blank
    blank.textContent = number;
    blank.classList.add('filled', 'hint-revealed');

    // Mark one unused pool tile with this value. Duplicate values each have
    // their own tile, so every revealed operand takes one tile.
    const poolNumbers = document.querySelectorAll('.pool-number');
    for (let poolNum of poolNumbers) {
      if (
        parseInt(poolNum.dataset.number) === number &&
        !poolNum.classList.contains('used')
      ) {
        poolNum.classList.add('used');
        gameState.poolNumbersUsed.push(number);
        break;
      }
    }

    // Store in userInputs (using the HTML position format)
    gameState.userInputs[position] = number;
  });

  // If the hint filled the selected blank, move the selection on
  const selected = gameState.selectedBlank;
  if (selected && selected.classList.contains('filled')) {
    selectNextEmptyBlank(selected.dataset.position);
  }

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
}

/**
 * Record which hint types were used on an equation (the 💡 is drawn by CSS)
 * @param {number} equationId - ID of equation
 * @param {string} markerType - Type of hint ('?' or '#')
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

  // Update Daily stats
  updateDifficultyStats('daily', stats.daily);

  // Show modal
  modal.classList.remove('hidden');
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
