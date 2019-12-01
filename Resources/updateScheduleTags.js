var _ = (function() {
  var action = new PlugIn.Action(function(selection, sender) {
    // get details of current date
    now = new Date();
    //now.setDate(9);
    year = now.getFullYear(); // 4 digit number
    month = now.toLocaleDateString("en-US", { month: "long" }); // full month name as a string
    date = now.getDate(); // as a number (1-31)
    weekday = now.toLocaleDateString("en-US", { weekday: "long" }); // full weekday name as a string
    quarter = getQuarter(now); // quarter in format Q4 2019
    week = getWeek(now); // week in format Week X (MMM D-D)

    console.log(year, month, date, weekday, quarter, week); // log current date details

    // rename 'This Year (YYYY)' tag to current year
    // rename 'This Quarter (QX YYYY)' tag to current year
    // rename 'This Month (MMMMMMMM YYYY)' tag to current month
    // rename
  });

  action.validate = function(selection, sender) {
    return true;
  };

  return action;
})();
_;

/* returns the quarter containing the given date in the format Q4 2019 */
function getQuarter(date) {
  let monthnum =
    date.getMonth() + 1; /* get the current month of the year (1-12) */
  let quarter = Math.ceil(
    monthnum / 3
  ); /* divide by 3 and round up to nearest number to get the current quarter (1-4) */

  return `Q${quarter} ${date.getFullYear()}`;
}

/* returns the week containing the given date in the format Week X (MMM D-D) - based on week starting on Monday */
function getWeek(date) {
  /* get the current week number of the date in the month */
  let firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  let firstWeekdayOfMonth = firstDayOfMonth.getDay(); // gets day of week 0-6 Sun-Sat
  let currentDate = date.getDate();

  if (firstWeekdayOfMonth == 0) {
    firstWeekdayOfMonth = 7;
  } // shift weekday so 1-7 Mon-Sun
  let offset = firstWeekdayOfMonth - 1;

  let weekNumber = Math.ceil((currentDate + offset) / 7);

  /* get the first date of the week */
  let firstDateOfWeek;
  if (weekNumber === 1) {
    firstDateOfWeek = 1;
  } else {
    firstDateOfWeek = (weekNumber - 1) * 7 + 1 - offset;
  }

  /* get the last date of the week */
  let testDate = new Date(date.getFullYear(), date.getMonth(), firstDateOfWeek);
  while (testDate.getDay() !== 0) {
    testDate.setDate(testDate.getDate() + 1);
  }
  let lastDateOfWeek = testDate.getDate();

  /* get short month string */
  let month = date.toLocaleDateString("en-US", { month: "short" });

  if (firstDateOfWeek == lastDateOfWeek) {
    return `Week ${weekNumber} (${month} ${firstDateOfWeek} ${month})`;
  } else {
    return `Week ${weekNumber} (${month} ${firstDateOfWeek}-${lastDateOfWeek})`;
  }
}
