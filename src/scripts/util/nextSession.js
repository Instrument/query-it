function standardizeSession(session) {
  if (session) {
    const nearestHours = session.getHours();
    const nearestMinutes = session.getMinutes() === 0 ? '00' : session.getMinutes();
    const sessionSuffix = ':' + nearestMinutes;
    const nearestSessionStandard = nearestHours >= 13 ? ((nearestHours - 12) + sessionSuffix) : (nearestHours + sessionSuffix);
    return nearestSessionStandard;
  }
}

function standardizeDay(session) {
  if (session) {
    let nearestDay = session.getDay();
    if (nearestDay === 0) {
      nearestDay = 'Sunday';
    } else if (nearestDay === 1) {
      nearestDay = 'Monday';
    } else if (nearestDay === 2) {
      nearestDay = 'Tuesday';
    } else if (nearestDay === 3) {
      nearestDay = 'Wednesday';
    } else if (nearestDay === 4) {
      nearestDay = 'Thursday';
    } else if (nearestDay === 5) {
      nearestDay = 'Friday';
    } else if (nearestDay === 6) {
      nearestDay = 'Saturday';
    }

    return nearestDay;
  }
}

module.exports = {
  getNextSession(dates) {
    const currentTime = new Date();
    const startTime = +currentTime;
    let sessionLocation = '';
    let nearestDate = 0;
    let nearestDay = 0;
    let nearestDiff = Infinity;
    for (let i = 0; i < dates.length; ++i) {
      const diff = +dates[i].time - startTime;
      if (diff > 0 && diff < nearestDiff) {
        nearestDiff = diff;
        nearestDate = dates[i].time;
        sessionLocation = dates[i].location;
      }
    }
    return {
      time: standardizeSession(nearestDate),
      day: standardizeDay(nearestDate),
      location: sessionLocation
    }
  }
};