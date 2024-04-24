const util = require("./util.js");

const { SerialPort } = require("serialport");
const { ReadlineParser } = require("@serialport/parser-readline");
const port = new SerialPort({ path: "/dev/serial0", baudRate: 9600 });
const parser = port.pipe(new ReadlineParser({ delimiter: "\r\n" }));

const regexPattern =
  /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/.{1,2})(\/\d+\.\d+)(\/\d+)\/\/,-?\d+,\d+$/;

port.on("open", () => {
  console.log("시리얼 포트가 열렸습니다.");

  parser.on("data", (data) => {
    let { hhmmss } = util.getDate();
    let loraData = data.toString();
    console.log(`[${hhmmss}] ${loraData}`);
    console.log("regexPattern vaild 결과 : ", regexPattern.test(loraData));

    if (regexPattern.test(loraData)) {
      const loraContent = util.extractLoraContentFromLoraData(loraData);
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
    }
  });
});

port.on("error", (err) => {
  console.error("시리얼 통신 에러:", err);
});
