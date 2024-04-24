// const loraData = "+RCV=5,32,5/51/22/30/36/41/0.03/S/0.0091/85//,-16,10";

// const regexPattern =
//   /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/.{1,2})(\/\d+)(\/\d+\.\d+)\/\/,-?\d+,\d+$/;

const loraData = "+RCV=5,31,50/22/4/11/15/0.07/SE/0.00/88//,-28,11";

const regexPattern =
  /^\+RCV=\d+,\d+,(-?\d+\/){5}\d+\.\d+(\/.{1,2})(\/\d+\.\d+)(\/\d+)\/\/,-?\d+,\d+$/;

console.log("regexPattern vaild 결과 : ", regexPattern.test(loraData));
