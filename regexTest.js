const loraData = "+RCV=5,31,50/22/4/11/15/0.07/SE/0.00//,-28,11";

const regexPattern = /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/.{1,2})(\/\d+\.\d+)\/\/,-?\d+,\d+$/;

console.log("regexPattern vaild 결과 : ", regexPattern.test(loraData));

rcvHandler(loraData);

function rcvHandler(loraData) {
  console.log("----------------[rcvHandler]---------------");

  const nodeAddress = getNodeAddressFromLaraData(loraData);
  const regexPattern = /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/.{1,2})(\/\d+\.\d+)\/\/,-?\d+,\d+$/;

  console.log("regexPattern vaild 결과 : ", regexPattern.test(loraData));

  // Vaild Case
  const loraContent = extractLoraContentFromLoraData(loraData);
  const splitedLoraContent = loraContent.split("/");
  const nodeSubstancesArray = [];

  for (const [index, value] of splitedLoraContent.entries()) {
    console.log("🚀 ~ rcvHandler ~ value:", value);
    console.log(typeof value);
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

function extractLoraContentFromLoraData(loraData) {
  const secondCommaIndex = loraData.indexOf(",", loraData.indexOf(",") + 1);
  const extractedData = loraData.substring(
    secondCommaIndex + 1,
    loraData.indexOf("//", secondCommaIndex)
  );
  return extractedData;
}
