
//Date code
const month = ["January","February","March","April","May","June","July","August","September","October","November","December"];

const date = new Date();

let monthName = month[date.getMonth()];

document.getElementById("month").innerHTML = date;

//Pop up code
/*
let popup = document.getElementById("popup");

function openPopup() {

    popup.classList.add("open-popup");
}

function closePopup() {

    popup.classList.remove("open-popup")

}
*/

const container = document.querySelector('.container');
const popup = document.querySelector('.popup');
const playButton = document.getElementById('playButton');
const exitButton = document.getElementById('exitButton');


const toggle = () => {
    container.classList.toggle('active');
    popup.classList.toggle('active');
};

playButton.addEventListener('click', toggle);
exitButton.addEventListener('click', toggle);