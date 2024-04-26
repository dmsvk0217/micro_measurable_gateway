const { addRawData, addErrData, getCurrentNodeInfoByNodeAddress } = require("./func.js");
const { extractLoraContentFromLoraData, getLoraErrTypeFromLoraData } = require("./util.js");

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const port = new SerialPort({ path: "/dev/serial0", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

const numberOfNode = 8;
const packetTimeIntervalMin = 30;
const checkTimeIntervalMills = 1000 * 60 * 30; // 1초 * 60 * 30 = 30분
let timeTrace = Array.from({ length: numberOfNode + 1 }, () => new Date());

port.on("open", () => {
  console.log("시리얼 포트가 열렸습니다.");
  setInterval(onTimeTrace, checkTimeIntervalMills);

  parser.on("data", (data) => {
    console.log(data.toString());
    loraHandler(data.toString());
  });
});

port.on("error", (err) => {
  console.error("시리얼 통신 에러:", err);
});

function loraHandler(loraData) {
  if (loraData.startsWith("+RCV=")) rcvHandler(loraData);
  else if (loraData.startsWith("+ERR=")) errHandler(loraData);
  else elseHandler(loraData);
}

function rcvHandler(loraData) {
  console.log("----------------[rcvHandler]---------------");

  const nodeAddress = getNodeAddressFromLaraData(loraData);
  const regexPattern = /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/.{1,2})(\/\d+\.\d+)\/\/,-?\d+,-?\d+$/;

  console.log("regexPattern vaild 결과 : ", regexPattern.test(loraData));

  // ERR Case: lora regexPattern invaild (센서값오류로 추정)
  if (!regexPattern.test(loraData)) {
    addErrData({ loraContent: loraData, nodeInfo: null, errMsg: "lora regexPattern invaild" });
  }
  // Vaild Case
  else {
    const loraContent = extractLoraContentFromLoraData(loraData);
    const splitedLoraContent = loraContent.split("/");
    const nodeSubstancesArray = [];

    for (const [index, value] of splitedLoraContent.entries()) {
      let result;
      const temp = parseInt(value);

      if (value.includes(".")) {
        result = parseFloat(value);
      } else if (!isNaN(temp)) {
        result = parseInt(value, 10);
      } else {
        result = value;
      }
      nodeSubstancesArray.push(result);
    }
    console.log("🚀 ~ rcvHandler ~ nodeSubstancesArray:", nodeSubstancesArray);

    addRawData({
      loraContent: loraContent,
      nodeAddress: nodeAddress,
      nodeSubstancesArray: nodeSubstancesArray,
    });
  }

  updateTimeTraceByNodeaddress(nodeAddress);
  console.log("-------------------------------------------\n");
  return;
}

async function errHandler(loraData) {
  console.log("----------------[errHandler]---------------");

  const errMsg = getLoraErrTypeFromLoraData(loraData);

  let errDataObject = {
    loraContent: loraData,
    errMsg: errMsg,
  };
  addErrData(errDataObject);

  console.log("-------------------------------------------\n");
  return;
}

function elseHandler(loraData) {
  console.log("----------------[elseHandler]---------------");

  let errDataObject = {
    loraContent: loraData,
  };
  addErrData(errDataObject);

  console.log("-------------------------------------------\n");
  return;
}

async function onTimeTrace() {
  console.log("----------------[onTimeTrace]--------------");

  for (let index = 1; index <= numberOfNode; index++) {
    const selectedTime = timeTrace[index];
    const timeDifference = calculateTimeDifferenceFromNow(selectedTime);

    const recentHHMMSS = getTimeInHHMMSSFormat(selectedTime);
    const currentHHMMSS = getCurrentTimeInHHMMSSFormat();

    console.log(
      `[onTimeTrace ${currentHHMMSS}] ${index}번 노드의 ${packetTimeIntervalMin}분 초과여부: ${
        timeDifference >= packetTimeIntervalMin
      } / 최근 수신시간: ${recentHHMMSS}  / 초과한 시간: ${timeDifference}분`
    );

    if (timeDifference >= packetTimeIntervalMin) {
      const nodeInfo = await getCurrentNodeInfoByNodeAddress(String(index));
      addErrData({
        nodeInfo: nodeInfo,
        errMsg: "로라 패킷 수신불가",
      });
      updateTimeTraceByNodeaddress(index);
    }
  }
  console.log("-------------------------------------------\n");
  return;
}

function calculateTimeDifferenceFromNow(timeObj) {
  var currentTime = new Date();
  var differenceInMilliseconds = currentTime.getTime() - timeObj.getTime();
  var differenceInMinutes = (differenceInMilliseconds / (1000 * 60)).toFixed(2);

  return differenceInMinutes;
}

function updateTimeTraceByNodeaddress(nodeAddress) {
  timeTrace[nodeAddress] = new Date();

  const time = getTimeInHHMMSSFormat(timeTrace[nodeAddress]);
  console.log(`[Receive from Node${nodeAddress}] : ${time}`);
  return;
}

function printTimeTrace() {
  for (let index = 1; index <= numberOfNode; index++) {
    const selectedTime = timeTrace[index];
    const time = getTimeInHHMMSSFormat(selectedTime);
    console.log(`[Node${index} TraceTime] : ${time}`);
  }
}

function getNodeAddressFromLaraData(loraData) {
  var regex = /\+RCV=(\d+),/;
  var match = loraData.match(regex);

  if (match && match.length > 1) {
    return parseInt(match[1]); // 정수형으로 변환하여 반환합니다.
  } else {
    return null; // 매치된 결과가 없는 경우 null을 반환합니다.
  }
}

function getTimeInHHMMSSFormat(selectedTime) {
  var hours = selectedTime.getHours();
  var minutes = selectedTime.getMinutes();
  var seconds = selectedTime.getSeconds();

  hours = padZero(hours);
  minutes = padZero(minutes);
  seconds = padZero(seconds);

  return hours + ":" + minutes + ":" + seconds;
}

function padZero(num) {
  return (num < 10 ? "0" : "") + num;
}

function getCurrentTimeInHHMMSSFormat() {
  var now = new Date();
  var hours = now.getHours();
  var minutes = now.getMinutes();
  var seconds = now.getSeconds();

  hours = padZero(hours);
  minutes = padZero(minutes);
  seconds = padZero(seconds);

  return hours + ":" + minutes + ":" + seconds;
}

/* 
    ----------------LORA FORMAT----------------
    +RCV=<Address>,<Length>,<Data>,<RSSI>,<SNR>
      EX. +RCV=10,26,10/9/20/9/13/0.04/0/6/37//,-18,11
      <Address> Transmitter Address ID
      <Length> Data Length
      <Data> ASCll Format Data : 노드번호/온도/습도/pm25/pm10/ch2o/풍향/풍속/베터리
      <RSSI> Received Signal Strength Indicator : 시그널 세기
      <SNR> Signal-to-noise ratio : 노이즈 비율
*/
