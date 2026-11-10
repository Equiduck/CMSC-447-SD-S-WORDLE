const monthYearElement = document.getElementById('month-year');
const datesElement = document.getElementById('calendar-dates');
const prevButton = document.getElementById('prev-month');
const nextButton = document.getElementById('next-month');
const calendarElement = document.getElementById('calendar');
const calendarReturnButton = document.getElementById('calendarReturn');
const gameHistory = document.getElementById('gameHistoryPopup')


let currentDate = new Date();

function updateCalendar() {

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDay = new Date(year, month, 0);
  const lastDay = new Date(year, month + 1, 0);
  const totalDays = lastDay.getDate();
  const firstDayIndex = firstDay.getDay();
  const lastDayIndex = lastDay.getDay();

  const monthYearString = currentDate.toLocaleString('default', {month: 'long', year: 'numeric'});
  monthYearElement.textContent = monthYearString;

  let datesHTML = '';

  for (let i = firstDayIndex; i > 0; i--) {

    const previousDate = new Date(year, month, 0 - i + 1);
    datesHTML += `<div class="date inactive">${previousDate.getDate()}</div>`;

  }

  for (let i = 1; i <= totalDays; i++) {

    const date = new Date(year, month, i);
    const activeClass = date.toDateString() === new Date().toDateString() ? 'active' : '';
    datesHTML += `<div class="date ${activeClass}">${i}</div>`;


  }

  for (let i = 1; i <= 7 - lastDayIndex; i++) {

    const nextDate = new Date(year, month + 1, i);
    datesHTML += `<div class="date inactive">${nextDate.getDate()}</div>`;

  }

  datesElement.innerHTML = datesHTML;

}

prevButton.addEventListener("click", () => {

    currentDate.setMonth(currentDate.getMonth() - 1);
    updateCalendar();

})

nextButton.addEventListener("click", () => {

    currentDate.setMonth(currentDate.getMonth() + 1);
    updateCalendar();

})

const delay = ms => new Promise(res => setTimeout(res, ms));

const calendarToggle = async() => {

    calendarElement.classList.toggle('active');

    calendarReturnButton.classList.toggle('active');

    gameHistory.classList.toggle('active');

}

datesElement.addEventListener('click', calendarToggle);
calendarReturnButton.addEventListener('click', calendarToggle);

updateCalendar();

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
