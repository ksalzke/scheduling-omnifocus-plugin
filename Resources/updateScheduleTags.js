var _ = (function() {
  var action = new PlugIn.Action(function(selection, sender) {
    // get details of current date
    now = new Date();
    //now.setDate(9);
    currentYear = now.getFullYear(); // 4 digit number
    month = now.toLocaleDateString("en-US", { month: "long" }); // full month name as a string
    date = now.getDate(); // as a number (1-31)
    weekday = now.toLocaleDateString("en-US", { weekday: "long" }); // full weekday name as a string
    quarter = getQuarter(now); // quarter in format Q4 2019
    week = getWeek(now); // week in format Week X (MMM D-D)

    console.log(year, month, date, weekday, quarter, week); // log current date details

    function schedulingFlattenedTags() {
      schedulingTag = tagNamed("Scheduled");
      let schedulingTags = [];
      schedulingTag.apply(tag => schedulingTags.push(tag));
      return schedulingTags;
    }

    // TIDY UP FROM PAST DATES
    // First, deal with dates that have passed.
    schedulingFlattenedTags().forEach(
      tag => {
        // -- If This Year/Next Year has passed, move all tasks in subtags to 'Today'
        let tagYear = tag.name.match(/(?:This|Next) Year \((\d{4})\)/);
        if (tagYear !== null && Number(tagYear[1]) < currentYear) {
          console.log(tag.name);
        }
      }
      // -- If This Quarter/Next Quarter has passed, move all tasks in subtags to 'Today'
      // -- If This Month/Next Month has passed, move all tasks in subtags to 'Today'
      // -- If This Week/Next Week has passed, move all tasks in subtags to 'Today'
      // -- Check all subtags of 'This Week' and 'Next Week', and if the dates have passed, move all tasks to 'Today' and delete tag.
    );
    // Next, deal with periods that have started but not finished yet.
    // -- If Next Week is current week, move tasks from 'Sometime Next Week' to 'Sometime This Week' and move all other tags to be subtags of 'This Week'.
    // -- Otherwise, check remaining week tags. If current week, move all tasks to 'Sometime This Week' and delete original week tag.
    // -- If Next Month is current month, move tasks to 'Sometime This Month'.
    // -- Otherwise, check remaining month tags. If current month, move all tasks to 'Sometime This Month' and delete original month tag.
    // -- If Next Quarter is current quarter, move tasks from 'Sometime Next Quarter' to 'Sometime This Quarter' and move all other tags to be subtags of 'This Quarter'.
    // -- If Next Year is current year, move tasks from 'Sometime Next Year' to 'Sometime This Year' and move all other tags to be subtags of 'This Year'.
    //
    // RENAME RE-USED TAGS
    // Rename 'This Year (YYYY)' tag to current year
    // Rename 'This Quarter (QX YYYY)' tag to current year
    // Rename 'This Month (MMMMMMMM YYYY)' tag to current month
    // Rename 'This Week (DD-DD MMM YYYY)' tag to current week
    // Rename 'Today (D/M/YY)' tag to current day (or create tag if no 'Today' tag exists)
    // Rename 'Tomorrow (D/M/YY)' tag to tomorrow's day (or create tag if no 'Tomorrow' tag exists)
    // Rename 'Next Week' tag to next week
    // Rename 'Next Month' tag to next month
    // Rename 'Next Quarter' tag to next quarter
    // Rename 'Next Year' tag to next year
    //
    // CREATE OTHER TAGS AS NEEDED
    // Ensure all daily tags are created for this week
    // Ensure all daily tags are created for next week (if in this month)
    // Ensure all daily tags are created for next week (if in next month)
    // Ensure all week tags (and 'sometime' tag) are created for this month
    // Ensure tag has been created for next month (if in this quarter)
    // Ensure all month tags (and 'sometime' tag) are created for next quarter
    // Ensure all quarter tags (with monthly subtags & 'sometime' subtag) are created for next year
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
