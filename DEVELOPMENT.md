# 개발 상태

2026-11-11 오전. AI 싱글 전용, 실제 돈·구매·현금 보상 없음. 개발판이며 최종 완성판으로 분류하지 않습니다.

## 구현과 검사

- 12인 오리지널 초상, 단계별12종 배경, 익숙한 일반 화투 색과 도상으로 수정한48장 화투. 패의 보라 네온·등급별 색 테두리 미사용. 제작 시트·접촉표·실제 작은 화면을 직접 검사. 초상과 별도로12인 전신 일러스트를 제작하고 모든 원본을 직접 검사했습니다. 고수 열전에 전신 이미지·짧은 설정·이전/다음 탐색을 넣었습니다.
- 실제8인 토너먼트3라운드·대진별3판2승·탈락·트로피. 완료한 판까지 대진·승수·나가리 이월을 자동 저장하고 타이틀에서 이어할 수 있습니다. 진행 중인 한 판의 손패는 저장하지 않습니다.
- 시나리오 잠금·연속 해금, 최종 상대 승리 후 엔딩, 저장 데이터 검증 및 구형 데이터 이관.
- 320/390 세로·844 가로·1280 데스크톱 검사. 320 손패는 약56×83px. 필요한 상황에는 판 내부 스크롤을 씁니다. 모든 실제 휴대기기에서 검사했다는 뜻은 아닙니다.
- 소리는 상단에서 끌 수 있습니다. 사용자 조작 전 자동 재생은 브라우저가 막을 수 있습니다. 배경음악은 처음에는 꺼져 있으며 타이틀에서 직접 켭니다. CC0 tension and distress를 낮은 음량으로 반복하며 숨은 탭·전체 소리 끔에서 정지합니다. 청취 검토는 남았습니다.
- CC0 Card Game sounds/HaelDB, UI Audio·Particle Pack/Kenney 적용. GPL 후보 미사용.
- 카드 이동 보조 애니메이션(공개된 패만 표시, 움직임 줄이기에서는 생성하지 않음), 고/스톱에서 지금 스톱할 때의 정산 점수·남은 더미·고박 경고를 표시합니다. 숙련/달인 AI는 마지막 뒤집기 뒤 고로 확정승리를 나가리로 바꾸지 않게 수정했습니다.
- 먹은 패 확대·원점수 보기, 내 차례 표시, 선택·고/스톱·정산 키보드 포커스 제한. 특수 효과는 화면 갱신과 분리해 유지하며 실제 뻑 효과 캡처 확인.
- 내 차례에 확인 후 대국 나가기, 취소·Escape 복귀, 저장된 기록 보존. 시나리오·자유·토너먼트에서 검사했습니다. 조작하지 않는 바닥패를 키보드 버튼에서 제외하고 손패 포커스·마우스에서 같은 월 위치를 표시합니다. 고/스톱 팝업에서는 진행 중 효과를 지워 숫자가 겹치지 않게 했습니다.
- 게임 방법·도감·기록·크레딧 화면. 키보드 카드 선택과 스테이지·대사 조작 지원. 전 접근성 감사 완료는 아닙니다.

## 채택 규칙

화투48장, 손패10·바닥8, 7점 고/스톱. 광5·열끗9·띠10·피24, 11·12월 쌍피 및9월 국진. 1고마다+1점,3고부터×2씩. 피박은 패자0~7피단위 포함. 총통·3뻑은 기본7점 고정승리(이월만 적용). 마지막 뒤집기 쪽·따닥·쓸에는 피를 뺏지 않습니다. 국진은 대국 중 원점수, 정산 시7점 조건을 유지하면서 최종 점수를 높이는 쪽으로 자동 계산합니다. 패자는 피박을 피할 수 있으면 국진을 쌍피로 계산합니다. 피 뺏기는 일반 피 우선이며 국진을 자동으로 빼앗지 않습니다. 시나리오 나가리 이월은최대8배, 토너먼트는 같은 대진 안에서만 이월, 자유 대국은 한 판으로 끝납니다.

근거: https://moamoang.co.kr/gostop-rules/ 및 https://mgostop.hangame.com/guide/combine/02_03_rule.html . 세부는 위의 게임 채택안입니다.

## 테스트 한계

유닛·상태 테스트,1,000시드AI완주, 실제 UI 자동 플레이를 사용합니다. 테스트 통과가 모든 룰과 모든 기기 환경의 완전한 검증은 아닙니다. 최종 엔딩 단독 테스트는 앞11단계를 준비한 뒤 최종 상대를 이겼고, 이후 별도 새 저장 상태에서16판(12승3패1무)을 실제UI로 진행해12단계 연속 해금·엔딩·칭호 저장까지 확인했습니다. 중간4·8단계 뒤 리로드 검사도 포함합니다.

## 자동 AI 비교

2,000시드씩, 선후공을 번갈아 총6,000판을 비교했습니다. 입문 대 숙련665승/1,201승/134무, 입문 대 달인653승/1,245승/102무, 숙련 대 달인948승/1,021승/31무. 특수 시작 승리를 포함한 재현 가능한 자동 대국 결과이며 사람에게 느껴지는 난이도나 정교한 균형 조정을 검증한 것은 아닙니다. 같은 난이도는 공통 AI 정책을 쓰며 캐릭터 배경은 이야기 설정입니다. `test/balance.ts`를 esbuild로 번들해 실행합니다.

## 외부 게시

GitHub main 소스 업로드와 gh-pages 빌드 업로드를 확인했습니다. https://sigco3111.github.io/gostop2026/ 에서18:33 실제 플레이8판, 시나리오 저장·리로드·토너먼트 우승·자유 대국,28개 반응형 화면을 검사했습니다. 비밀정보는 저장소에 포함하지 않습니다.

## 11월 11일 아침 재개 작업

토너먼트 판 사이 자동 저장·이어하기를 추가했습니다. 버전·참가자 ID·대진 연결·승수·이월을 검증하며 종료한 대회는 이어하기에서 제거합니다. 58개 유닛 테스트와 실제 UI 2판(첫 판 완료→새로고침→대진 복원→진행 중 판 나가기→같은 체크포인트→다음 판 완료), 320/390/1280 화면을 검사했습니다. 밤사이 추가 개발은 없었으며 06:50부터 재개한 변경입니다.

## 남은 점검

- 실제 기기 수동 플레이와 장시간 균형 조정, 접근성·소리 청취 검토
- 추가 룰 회귀와 다양한 시드의 시나리오·AI균형 검토
- 배경음악 실제 청취·더 세밀한 카드 이동 연출
- 개선 배포마다 원격 커밋과 실제 공개 URL 재검증

## 11월 11일 06:53 새 우선순위

사용자 요청에 따라 토너먼트 이어하기 공개를 보류하고 화투패 선택을 먼저 진행했습니다. 기존 패는 그대로 보존하고 클래식·코믹·심플 각48장을 오리지널 벡터로 제작했습니다. 단순 색 변경이 아니라 그림 배치·선·도상 크기·표정·여백을 다르게 구성했습니다. 기존 그림을 제외한144장의 SVG와 WebP, 재생성 스크립트를 포함합니다. 설정 화면의48장 미리보기·사용하기·저장·재접속과 실제 손패 적용을4종 모두 검사했습니다.320/390/1280설정·타이틀과390대국의 실제 픽셀을 검사했습니다. 기본값은 기존 패 유지이며 사용자 플레이 후 선택을 기다립니다. 이 아트는 첫 구현판이며 친숙함·가독성에 대한 사용자 플레이 검토가 남았습니다.

## 2026-11-11 화투패 설정
- 기존 기본값 유지. 한국식 클래식/코믹/심플48장씩 추가, 설정 미리보기/선택/저장.
- 클래식은 사용자가 지정한 한국식 참고에 맞는 공개라이선스 도안. 별도 출처/CC BY-SA4.0 표시, 장식 추가 없이 변환.
- 62자동 테스트,4덱48이미지 로딩/선택/재시작/실제손패 검사,320/390/1280설정/타이틀 레이아웃.
- 실제기기/스피커/사람대상 밸런스 미검증.

## Keyboard and mobile access (2026-11-11)
- Removed viewport zoom restrictions. Real-device pinch and screen-reader listening still need human verification; headless Chrome validates the viewport declaration and 2x emulated page scale, not physical pinch.
- Keyboard screen transitions focus the heading or dialogue. Dialogue accessible names include the current speaker and line.
- Hand focus returns after the AI turn; Left/Right and Home/End move between current hand cards. Mouse/touch play does not force this keyboard focus.
- `test/keyboard-round.mjs` completes a keyboard-driven scenario round, including capture dialog, choice dialog, go/stop, result and saved progress. `test/mobile-accessibility.mjs` checks focus/dialogue at 320/390/1280 and emulated 2x zoom.

## 현재 배포 기준 (2026-11-11 아침)
위의 날짜별 기록 중 기본값 유지·이어하기 보류는 이전 상태입니다. 현재 기본 패는 클래식이며, 직접 저장한4종 패 선택은 유지합니다. 판 사이 토너먼트 이어하기는07:30공개 검증했습니다. 진행 중 손패는 저장하지 않습니다. 전체65유닛테스트와 공개UI리로드·중도나가기·다음판완료를 검사했습니다.

## Short-viewport and transition audit (2026-11-11)
- Long result panels now scroll at every screen width, including landscape phones. Exit and go/stop panels also stay within the viewport. Previously the result scroll limit applied only below651px width.
- `test/short-dialogs.mjs` rotates a real keyboard-driven round through844×390,844×320,568×320,390×320 and1280×844, checks choice/go-stop/exit/result panels and confirms the result button is reachable. Its long-result layout stress case deliberately repeats rows; that image is not a real scoring result.
- `test/transition-invariants.test.ts` audits every transition in3,000 seeded mixed-difficulty rounds:48-card conservation including pending selections, canonical card data, prompts, three-card piles, bomb-pass/turn accounting, invalid-action atomicity and terminal actions. All66 unit tests pass. This is regression coverage, not human balance or device certification.

## Automated accessibility and dependency audit (2026-11-11)
- Fixed dark-background link contrast in the classic-card attribution. Stage and sound controls now use their visible text for accessible names; dialogue names include all visible speaker/title/text/advance words, plus the keyboard instruction.
- Pinned axe-core4.14.0 for repeatable `npm run test:a11y`. Automated WCAG2A/AA and2.1A/AA checks report0definite violations on13states at320/390/1280. An actual keyboard round also checks choice/go-stop/capture/result and post-result dialogue. Image/gradient contrast and symbolic labels still produce manual-review items. This is not a full accessibility certification or a substitute for real screen-reader/voice-control use.
- npm audit found6 pre-existing development-tool dependency findings (including high/critical classifications), not evidence of an attack or a flaw in the deployed static-game bundle. Updated Vite5→6.4.6 and Vitest2→4.1.12, explicitly included Node test types, and verified a normal clean `npm ci` with0reported vulnerabilities. No runtime package or account permission was added. Build,66unit tests and full UI regressions pass after the upgrade.

## Stale-tab save protection (2026-11-11)
- Reproduced a real defect: merely opening a screen in an old tab overwrote newer stored stage/trophy/carry progress. Screen navigation no longer writes saves. Title/scenario screens refresh their data, and actual writes keep the higher completed-stage/trophy totals. Carry follows the relevant stage; a result at the same stage can intentionally reset or raise it.
- Championship awards refresh the stored total before adding this trophy. Six new save-merge/atomic-failure tests bring the suite to72. A two-tab fixture preserves stage2/trophies3/carry4; another real8-round UI journey injects a5-trophy stored fixture just before the championship and checks the new trophy raises it to6. The seeded trophies are test setup, not six played championship wins.
- This is local-browser protection, not cloud sync or a transaction across simultaneous active games. Sequential checkpoint changes in another tournament tab are now detected by the session guard below; use one active tournament tab. Browser data deletion/device changes still lose local-only saves.


## Tournament-tab checkpoint conflict guard (2026-11-11)
- Each tournament view remembers the exact saved checkpoint it loaded or wrote. Before starting a hand and before recording its result, a changed/deleted checkpoint sends the older view to a readable recovery screen instead of overwriting the newer bracket or awarding a stale championship trophy. Recovery reloads the latest bracket, or starts a new one if the other tournament finished.
- Five new unit tests bring the suite to77. An isolated two-page UI fixture changes storage before start and during an actual hand, then deletes it during an actual winning final hand. The newer checkpoint stays intact, the deleted checkpoint is not resurrected, and no conflicting trophy is awarded. The fixture sets the final bracket deliberately; it does not represent playing all preceding rounds. Ordinary8-round story/tournament/freeplay, reload and unfinished-hand exit regressions still pass.
- Conflict recovery checked at320/390/1280, with keyboard heading→button focus and automated WCAG checks. This is optimistic stale-state detection, not an atomic transaction or cross-device/cloud sync. Truly simultaneous localStorage writes and identical-state changes are not guaranteed to be distinguished. Keep one active tournament tab.
