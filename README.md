박태준 프로젝트 소스코드
========

nodeJS, Angular 코드 및 
K8s helm chart로 구성

# Contents of Project

## EWP
동서발전, 발전제어 모니터링 개발 사업
### interface
  * bumun_writer : 부문위협시스템 인터페이스
  * event_writer : 이상행위탐지시스템 인터페이스
  * high_migration : 상위시스템(부문) 연계 인터페이스
  * lgsys_writer : 로그분석시스템 인터페이스
  * opertate_writer : 운영정보변환시스템 인터페이스
  
### web
단위위협시스템 웹 소스코드 (nodeJS - bk, Angular - fe)


## Packaging
### kubernetes
  * dti.service_infra : 제품 dti 설치 Helm chart
### web
패키징 제품, dti 웹 소스코드 (nodeJS - bk, Angular - fe)
