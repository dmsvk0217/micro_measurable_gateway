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
  getDate
} = require("./util.js");

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const port = new SerialPort({ path: "/dev/serial0", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

const numberOfNode = 15;
const packetTimeIntervalMin = 1;

port.on("open", () => {
  console.log("시리얼 포트가 열렸습니다.");

  parser.on("data", (data) => {
    let { hhmmss } = getDate();
    console.log(`[${hhmmss}] ${data.toString()}`);
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
  const regexPattern = /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/\d+){2}\/\/,-?\d+,\d+$/;
  // +RCV=4,20,9/20/9/13/0.04/0/6//,0,10
  // temperature/humidity/pm1.0/pm2.5/pm10/ch2o/wind-direction/wind-speed//

  /*
      베터리 잔량 추가되는 경우 다음으로 수정
      const regexPattern = /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/\d+){3}\/\/,-?\d+,\d+$/;
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
    // addRawData({
    //   nodeAddress: nodeAddress,
    //   nodeSubstancesArray: nodeSubstancesArray,
    // });
  }
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

