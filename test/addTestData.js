const { addLoraDataToFirestore } = require("../func.js");
const util = require("../util.js");

const yyyyMM = "2024-01";
const dayStart = 1;
const dayEnd = 1;
const hourStart = 0;
const hourEnd = 23;
const periodInHour = 4;

for (let i = dayStart; i <= dayEnd; i++) {
  // 일
  const day = util.generateDayDD(i);
  for (let j = hourStart; j <= hourEnd; j++) {
    // 시간
    const hhmmss = util.generateRandomTime(j);
    for (let k = 1; k <= periodInHour; k++) {
      // 시간 당 빈도수
      // Todo
      // 1. make random data
      // 2. addData
    }
  }
}
