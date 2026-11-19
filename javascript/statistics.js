//temporary mock data for tetsing graph
const mockStats = {
    gamesPlayed: 100,
    winRate: 65,
    currentStreak: 3,
    maxStreak: 8,
    guessDistribution: [5,12,25,15,6,2],
    totalWins: 65,
    totalLosses: 35
};
//display mock data
updateStatistics(mockStats);

//updates the statistics page using data
function updateStatistics(stats){

    //update player statistics
    document.getElementById("games-played").textContent = stats.gamesPlayed;

    document.getElementById("win-rate").textContent = stats.winRate + "%";

    document.getElementById("current-streak").textContent = stats.currentStreak;

    document.getElementById("max-streak").textContent = stats.maxStreak;

    document.getElementById("total-wins").textContent = stats.totalWins;

    document.getElementById("total-losses").textContent = stats.totalLosses;

    //update guess distribution 
    updateGuessDistribution(stats.guessDistribution);
}

//creates the guess graph
function updateGuessDistribution(distribution){

    const chart = document.getElementById("guess-chart");

    //remove any previous bars before updating
    chart.innerHTML = "";

    //find the largest count for scaling bar heights 
    const maxCount = Math.max(1,...distribution);

    for(let i=0; i<6;i++){

        const count = distribution[i] ?? 0;

        //create column
        const column = document.createElement("div");
        column.className = "guess-column";

        //create bar
        const bar = document.createElement("div");
        bar.className = "guess-bar";

        //set hieght based on number of guesses
        bar.style.height = (35 + (count / maxCount) * 260) + "px";
        bar.textContent = count;

        //create guess number label 
        const label = document.createElement("span");
        label.textContent = i + 1;

        //add all info to the graph
        column.appendChild(bar);
        column.appendChild(label);
        chart.appendChild(column);
    }
}

//Options Popup

//Create variables for popup
const container = document.querySelector('.container');
const popup = document.querySelector('.optionsPopup');
const playButton = document.getElementById('optionsButton');
const exitButton = document.getElementById('optionsExitButton');
const OPTION_KEYS = {
    darkMode: "shared-wordle-dark-mode",
    highContrast: "shared-wordle-high-contrast"
};

function readOption(key) {
    try {
        return localStorage.getItem(key);
    } catch (error) {
        return null;
    }
}

function saveOption(key, enabled) {
    try {
        localStorage.setItem(key, enabled ? "true" : "false");
    } catch (error) {
        //Keep the option active for this page if storage is unavailable.
    }
}

//Allow popup to appear
const toggle = () => {
    container.classList.toggle('active');
    popup.classList.toggle('active');
    calendarReturnButton.classList.toggle('blur');
    gameHistory.classList.toggle('blur');
};

//Let button presses function
playButton.addEventListener('click', toggle);
exitButton.addEventListener('click', toggle);

//Function to activate dark mode when checked
function darkMode() {

    var checkbox = document.getElementById("darkTheme");
    document.documentElement.dataset.theme = checkbox.checked ? "dark" : "light";

    if (checkbox.checked == true) {
    
        document.body.classList.add("dark-mode");

    }
    else {
        document.body.classList.remove("dark-mode");
       
    }

    saveOption(OPTION_KEYS.darkMode, checkbox.checked);
}

//Function to activate high contrast mode when checked
function highContrastMode() {

    var checkbox = document.getElementById("highContrast");

    if (checkbox.checked == true) {

        document.body.classList.add("high-contrast-mode");
    }
    else {
        document.body.classList.remove("high-contrast-mode");
    }

    saveOption(OPTION_KEYS.highContrast, checkbox.checked);
}

var savedDarkMode = readOption(OPTION_KEYS.darkMode);
var savedHighContrast = readOption(OPTION_KEYS.highContrast);

if (savedDarkMode !== null) {
    document.getElementById("darkTheme").checked = savedDarkMode === "true";
    darkMode();
}
if (savedHighContrast !== null) {
    document.getElementById("highContrast").checked = savedHighContrast === "true";
    highContrastMode();
}
