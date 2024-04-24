const {
  addRawData,
  addErrData,
  updateNodeBattery,
  getCurrentNodeInfoByNodeAddress,
} = require("./func.js");
const { extractLoraContentFromLoraData, getLoraErrTypeFromLoraData } = require("./util.js");

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const port = new SerialPort({ path: "/dev/serial0", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

port.on("open", () => {
  console.log("시리얼 포트가 열렸습니다.");

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
  const regexPattern =
    /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/.{1,2})(\/\d+\.\d+)(\/\d+)\/\/,-?\d+,\d+$/;

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
    let battery;

    for (const [index, value] of splitedLoraContent.entries()) {
      let result;
      const temp = parseInt(value);
      if (index == 9 && !isNaN(temp)) battery = parseInt(value, 10);

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

    updateNodeBattery({
      nodeAddress: nodeAddress,
      battery: battery,
    });
    addRawData({
      nodeAddress: nodeAddress,
      nodeSubstancesArray: nodeSubstancesArray,
    });
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
