const {
  addRawData,
  addErrData,
  updateNodeBattery,
  getCurrentNodeInfoByNodeAddress,
} = require("./func.js");
const {
  generateTestRandomNodeData,
  extractLoraContentFromLoraData,
  getLoraErrTypeFromLoraData,
} = require("./util.js");

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const port = new SerialPort({ path: "/dev/serial0", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

const numberOfNode = 15;
const packetTimeIntervalMin = 1;
const checkTimeIntervalMills = 30000;

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

async function loraHandler(loraData) {
  if (loraData.startsWith("+RCV=")) rcvHandler(loraData);
  else if (loraData.startsWith("+ERR=")) errHandler(loraData);
  else elseHandler(loraData);
}

function rcvHandler(loraData) {
  console.log("----------------[rcvHandler]---------------");

  const nodeAddress = getNodeAddressFromLaraData(loraData);
  const regexPattern = /^\+RCV=\d+,\d+,(-?\d+\/){4}\d+\.\d+(\/\d+){2}\/\/,-?\d+,\d+$/;
  // +RCV=4,20,9/20/9/13/0.04/0/6//,0,10

  /*
      베터리 잔량 추가되는 경우 다음으로 수정
      const regexPattern = /^\+RCV=\d+,\d+,(-?\d+\/){4}\d+\.\d+(\/\d+){3}\/\/,-?\d+,\d+$/;
      //+RCV=10,26,9/20/9/13/0.04/0/6/39//,-18,11
  */

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
      nodeSubstancesArray.push(value.includes(".") ? parseFloat(value) : parseInt(value, 10));
    }
    console.log("🚀 ~ rcvHandler ~ nodeSubstancesArray:", nodeSubstancesArray);

    // await updateNodeBattery({
    //   nodeAddress: nodeAddress,
    //   loraContent: loraContent,
    // });
    addRawData({
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

  console.log("🚀 ~ errHandler ~ errDataObject:", errDataObject);
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
    const timeDifference = calculateTimeDifference(selectedTime);
    const recentHHMMSS = getTimeInHHMMSSFormat(selectedTime);
    const currentHHMMSS = getCurrentTimeInHHMMSSFormat();

    console.log(
      `[onTimeTrace ${currentHHMMSS}] ${index}번 노드의 ${packetTimeIntervalMin}분 초과여부: ${
        timeDifference >= packetTimeIntervalMin
      } / 최근 수신시간: ${recentHHMMSS}  / 초과한 시간: ${timeDifference}분`
    );

    if (timeDifference >= packetTimeIntervalMin) {
      const nodeInfo = await getCurrentNodeInfoByNodeAddress(String(index));
      console.log(nodeInfo);
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

function calculateTimeDifference(timeObj) {
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
      EX. +RCV=4,20,9/20/9/13/0.04/0/6//,0,10
      <Address> Transmitter Address ID
      <Length> Data Length
      <Data> ASCll Format Data : 온도/습도/pm25/pm10/ch2o/풍향/풍속
      <RSSI> Received Signal Strength Indicator : 시그널 세기
      <SNR> Signal-to-noise ratio : 노이즈 비율
*/
