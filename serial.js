const { SerialPort } = require('serialport')
const { ReadlineParser } = require('@serialport/parser-readline')
const port = new SerialPort({ path: '/dev/serial0', baudRate: 9600 })

const parser = port.pipe(new ReadlineParser({ delimiter: '\r\n' }))

port.on('open', () => {
  console.log('시리얼 포트가 열렸습니다.');

  parser.on('data', (data) => {
    console.log(data.toString());
  });
});

port.on('error', (err) => {
  console.error('시리얼 통신 에러:', err);
});