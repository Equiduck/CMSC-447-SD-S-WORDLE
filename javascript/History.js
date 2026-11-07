const monthYearElement = document.getElementById('month-year');
const datesElement = document.getElementById('calendar-dates');
const prevButton = document.getElementById('prev-month');
const nextButton = document.getElementById('next-month');

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

updateCalendar();