// const loraData = "+RCV=5,32,5/51/22/30/36/41/0.03/S/0.0091/85//,-16,10";

// const regexPattern =
//   /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/.{1,2})(\/\d+)(\/\d+\.\d+)\/\/,-?\d+,\d+$/;

const loraData = "+RCV=5,32,5/51/22/30/36/0.03/S/0.91/85//,-16,10";
const regexPattern =
  /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/.{1,2})(\/\d+\.\d+)(\/\d+)\/\/,-?\d+,\d+$/;

console.log("regexPattern vaild 결과 : ", regexPattern.test(loraData));
