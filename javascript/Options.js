//Create variables for popup
const container = document.querySelector('.container');
const popup = document.querySelector('.optionsPopup');
const playButton = document.getElementById('optionsButton');
const exitButton = document.getElementById('optionsExitButton');
const OPTION_KEYS = {
    darkMode: "shared-wordle-dark-mode",
    highContrast: "shared-wordle-high-contrast",
    keyboardOnly: "shared-wordle-keyboard-only"
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

//Function to save onscreen keyboard input setting
function disableKeys() {
    var checkbox = document.getElementById("keyboardElement");
    saveOption(OPTION_KEYS.keyboardOnly, checkbox.checked);
}

var savedDarkMode = readOption(OPTION_KEYS.darkMode);
var savedHighContrast = readOption(OPTION_KEYS.highContrast);
var savedKeyboardOnly = readOption(OPTION_KEYS.keyboardOnly);

if (savedDarkMode !== null) {
    document.getElementById("darkTheme").checked = savedDarkMode === "true";
    darkMode();
}
if (savedHighContrast !== null) {
    document.getElementById("highContrast").checked = savedHighContrast === "true";
    highContrastMode();
}
if (savedKeyboardOnly !== null) {
    document.getElementById("keyboardElement").checked = savedKeyboardOnly === "true";
}
