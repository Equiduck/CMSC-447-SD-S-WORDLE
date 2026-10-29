
//Create variables for popup
const container = document.querySelector('.container');
const popup = document.querySelector('.popup');
const playButton = document.getElementById('playButton');
const exitButton = document.getElementById('exitButton');

//Allow popup to appear
const toggle = () => {
    container.classList.toggle('active');
    popup.classList.toggle('active');
};

//Let button presses function
playButton.addEventListener('click', toggle);
exitButton.addEventListener('click', toggle);


//Create variables to display date
const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const today = new Date();
const year = today.getFullYear();
const day = today.getDate();

//Convert month number to month title
let monthName = months[today.getMonth()];

//Format current day
if (day < 10) {

    day = '0' + day;

}

//Format entire date
const formattedDate = monthName + ' ' + day + ', ' + year;

//Bring date to html
document.getElementById("currentDate").innerHTML = formattedDate;