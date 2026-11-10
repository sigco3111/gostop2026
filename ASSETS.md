# gostop2026 에셋 선정 노트 (game-asset-catalog 기준, 2026-11-10 조사)

출처 카탈로그: https://github.com/sigco3111/game-asset-catalog (catalog.csv 1735팩)
선정 기준: 라이선스 CC0만 채택(귀속 의무·카피레프트 회피), 누아르/카드 게임 적합성.
GPL 3.0인 Whoosh 1/2(bart)는 제외.

## 효과음 (sigco3111/assets-audio)
| 용도 | 팩 | 라이선스 | 제작 | 경로 |
| --- | --- | --- | --- | --- |
| 패 내기/뒤집기/먹기 | Card Game sounds (wav 10) | CC0 | HaelDB (원본 페이지 대조, 카탈로그 작가 오류 정정) | releases/download/v6.12/card-game-sounds.zip |
| 칩·정산·잡음 | 54 Casino sound effects (ogg 55) | CC0 | hc | releases/download/v6.2/54-casino-sound-effects-cards-dice-chips.zip |
| 버튼/UI | UI Audio (ogg 52) | CC0 | Kenney | releases/download/v2.0/kenney_uiaudio.zip |
| 승리 징글 | Win sound effect (wav 1) | CC0 | Snabisch | releases/download/v6.20/win-sound-effect.zip |

## 2D 이펙트 (sigco3111/assets-2d-pixel)
| 용도 | 팩 | 라이선스 | 제작 | 경로 |
| --- | --- | --- | --- | --- |
| 카드 글로우·연기·스파크 파티클 | Particle Pack (PNG 193) | CC0 | Kenney | releases/download/v2.0/particle-pack.zip |
| 흔들기/폭탄/고 선언 특수 이펙트 | 5x Special Effects - 2D (PNG 57) | CC0 | rubberduck | releases/download/v6.1/5x-special-effects-2d.zip |

## 배경음악 (sigco3111/assets-audio)
| 용도 | 팩 | 라이선스 | 제작 |
| --- | --- | --- | --- |
| 대국 중 긴장감 루프 | tension and distress | CC0 | allen yatsura |
| 타이틀/메뉴 후보(미사용) | Tragic ambient main menu | CC0 선택 가능 | brandon75689 (HaelDB 제출), 원본 대조로 댓글 작성자 Pompei2 오기 정정 |

## 캐릭터/배경/키아트/화투패
- 프로젝트 고유 아트: Instinct가 생성한 오리지널 일러스트(외부 팩 미사용).
- 화투패 48장(18:16 일반 화투 색 요청 반영, `assets/card-sheets/classic/` 및 `scripts/compose-classic-deck.py`): 월별 4장씩 등급 도상을 분리해 생성한 제작 시트에서 개별 이미지로 잘라 사용. 월·등급 manifest를 엔진과 대조하고 제작 시트를 직접 검토. 자동 대조만으로 전 그림의 정확성을 보장하지 않음.

## 라이선스 메모
- CC0: 귀속 불필요(선택적 크레딧은 게임 내 크레딧 화면에 표기).
- 팩 적용 시 각 팩의 LICENSE-SOURCE.txt / License.txt를 리포지토리에 함께 보관.

## 실제 적용 상태
2026-11-10: Card Game sounds의 playcard/draw/shuffle WAV, Kenney UI Audio의 click4 OGG 채택. CC0 원본 페이지 및 팩 License.txt 확인. 작가 오기 수정(HaelDB). Particle Pack의 투명 spark/star PNG를 흔들기·고·쪽·따닥 등 특수 상황의 방사형 효과에 적용. 시스템의 움직임 줄이기 설정에서는 표시하지 않음. 나머지 후보는 미적용.

2026-11-10 저녁: 장소8종을 추가 생성하여 단계별 배경12종으로 분리. 12종 접촉표와 실제 화면에서 검토. 캐릭터 원본은 초상 중심이며 기획의 전신 일러스트 목표와는 구분.

18:30: tension and distress / allen yatsura 원본 페이지의 CC0 표기 대조 후 OGG로 변환, 낮은 음량의 선택형 루프로 적용. 처음에는 끔, 사용자가 켤 때만 재생, 백그라운드 탭·전체 소리 끔에서 정지. 청취 취향·실제 기기 음량 점검은 남음.
