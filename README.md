# Micro Measurable Raspberry PI 4 Gateway

<br>

## 1. 프로젝트 소개

- 한동대학교 전산전자공학부 2024-1 캡스톤 디자인2 프로젝트로 구현한 대기환경 모니터링 시스템(Micro Measurable)의 RPI Gateway 코드입니다.
- RPI Gateway는 24시간 구동되며 수개의 센서노드에서 전송되는 로라 데이터를 수신
합니다. 모든 센서노드는 Lora 모듈을 통해 단위시간마다 RPI Gateway로 데이터를 전송
하게 된다.
- RPI Gateway는 수신된 데이터를 핸들링하고 이를 바탕으로 데이터베이스에 데이터를 저장한다.

[참고 영상](https://www.youtube.com/watch?v=nm_seyMrYFw&feature=youtu.be)

<br>

## 2. 주요 기능
- 수신된 로라 데이터의 에러 여부를 확인하고 데이터를 파싱하여 DB에 저장합니다
- 노드별로 가장 최근 데이터 수신시간을 추적합니다. 이를 통해 특정 노드에서 데이터가 들어오지 않는 경우 에러로 판단하고 에러 데이터를 만들어 Database에 저장합니다.

<br>

## 3. 전체 시스템 구조
<img src="https://github.com/LeeShinwon/micro_measurable_admin/blob/main/structure.png" alt="Example Image" width="1000" height="180">
