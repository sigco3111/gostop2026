# 개발 상태

2026-11-11 오전. AI 싱글 전용, 실제 돈·구매·현금 보상 없음. 08:53 핵심 모드 검수를 마친 첫 완성 후보입니다. 최종 품질 보증이나 사람 플레이 검수 완료로 분류하지 않습니다.

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

## Public-card accessible descriptions and event log (2026-11-11)
- Card names no longer repeat the month and grade (for example `1월 1월 송학 광 광`). Descriptions name 홍단/청단/초단, 고도리, 비광 and 국진's automatic dual scoring from canonical card flags. Hand, floor, deck and opponent face-down hand now expose public counts as named groups/images. No opponent card identity is disclosed before it is played/revealed.
- A polite accessible log stays mounted while the visual board redraws. It announces public plays, placements, captures, pi steals and special declarations, retaining only12recent entries. It clears when leaving the game. This is ARIA wiring verified through DOM mutations and keyboard play, not actual screen-reader listening or certification; speech pacing and real-device usability still need a human review.
- Three description tests bring the suite to80. `test/card-accessibility.mjs` completes a keyboard round, verifies log-node identity across board renders, initial empty log, public action additions,12-entry bound, cleanup after result and saved progress after reload.320/390/1280 board pixels and39automated accessibility states checked; ordinary8-round journey and tournament-conflict fixture still pass.

## Audio, reduced-motion and repeated-input regression (2026-11-11)
- Seven audio unit tests cover opt-in music, mute/persistence, one shared music object, background-tab pause/resume, blocked storage and caught autoplay rejection. `test/audio-controls.mjs` fetches and decodes all five deployed assets into nonempty browser audio buffers, checks keyboard-toggle labels/focus and independent sound/music preference reload. This is decoding/control verification, not speaker listening.
- `REDUCED_MOTION=1 RAPID_INPUT=1 node test/card-accessibility.mjs` reuses the round driver with reduced motion and12synchronous clicks for every hand play. A complete local and public keyboard/choice/go-stop round retained48unique cards, emitted no card-flight/burst nodes and had no active animations under reduced motion. Save/reload and log cleanup still pass. It is a specific repeated-input regression, not proof that every possible input sequence is safe.
- Added a separate paired-seat AI sample:1000identical seeded deals per matchup, each played with both seat assignments,6000rounds total, zero stalls. Level2won1155vs706against level1(139draws);level3won1199vs706against level1(95draws), and1023vs946against level2(31draws). Different method/seeds from the earlier alternating-seed comparison above, not an update to those counts. The level3/level2 gap is modest; no human-difficulty conclusion or balance retuning was made. Same-level characters still share their policy.
-88unit tests/build pass. This batch changes QA and corrects stale README default/resume wording only. Runtime JS/CSS hashes are unchanged, so it does not require a new Pages build. Physical-device, speaker listening and actual screen-reader speech review remain open.

## Pending in-memory carry after storage failure (2026-11-11)
- Reproduced a scenario defect with an explicitly injected terminal-draw fixture and failed localStorage writes: the dialogue promised next-hand×2, but screen navigation refreshed the older stored carry and started the next hand at×1. This fixture is not a naturally played full draw and does not certify rule handling.
- Screen refresh now preserves pending in-memory carry/reset while the last write failed. More advanced stored stages and higher trophy totals still merge in; after a successful write, same-stage updates in another tab continue to refresh. The save warning remains visible. This is session-only recovery, not successful persistence: reloads can still lose unsaved data.
- Five unit tests cover draw carry, loss reset, advanced remote-local progress, ordinary tab refresh and blocked reads. `test/storage-failure-carry.mjs` verifies failed-write draw dialogue→scenario→title→scenario→next hand preserves×2 and keeps the warning;320/390/1280warning pixels inspected. Ordinary8-round journey, tournament conflict guard and39automated accessibility states pass.94tests/build pass, including one new150-round/all3levels/public-phase hidden-state permutation check for AI decisions. That test preserves hand sizes/public cards and changes only hidden opponent identities/deck order, not a human difficulty assessment.


## First-complete candidate acceptance checkpoint (2026-11-11 08:53 KST)

The first candidate closes the approved single-player feature scope, not every possible future enhancement. Human/device/audio/screen-reader listening and long-term balance remain explicitly unverified. The candidate does not wait indefinitely for that external review.

Consolidated the successful fresh-public QA drivers into `npm run test:acceptance`: five isolated Chrome profiles, configurable `GAME_URL`, `CHROME_PATH` and `QA_OUT`, JSON evidence and PNG captures. No seed stage clears, forced wins or trophy injection in story/championship flows. The resume flow deliberately adds malformed storage and blocked writes after its real two-hand checkpoint journey. Captures were directly inspected:390ending/championship/classic hand and320settings; full bracket scrolls normally below the viewport.

The canonical scripts passed against the unchanged public bundle at08:51–08:53:17story rounds/12stages with reloads4&8;12freeplay rounds/12opponents/progress unchanged;8round story/championship/freeplay journey including six played tournament wins, champion/trophy1 and checkpoint removal;2resume hands/reload/unfinished exit/malformed fallback/write warning;4×48decoded card assets/selection/reload/hand application/3203901280settings.0runtime errors. Fresh94unit tests, TypeScript/Vite build and npm audit0findings pass. Literal runtime asset references also resolve in public assets. New QA/docs do not alter JS/CSS hashes and do not require a new Pages build.

Acceptance source: https://github.com/sigco3111/gostop2026/commit/2b340fb34b2f8c08dfe5d7a2846789e7c5b00ef4 ; deployed build: https://github.com/sigco3111/gostop2026/actions/runs/42923737258 . Public play: https://sigco3111.github.io/gostop2026/ . These are automated seeded UI runs, not user-owned save data or a claim of human tournament wins. Earlier per-batch counts and fixture descriptions above are historical and must not be added together as unique games.

## Settings card descriptions and stable save feedback (2026-11-11)

Post-candidate usability fix, separate from the08:55candidate milestone. Reproduced on the public settings screen: card previews read raw engine tokens such as `gwang`/`tti`/`pi` and repeated the light grade; saving replaced the entire live-status node. Settings now reuse the same Korean canonical month/motif/grade/ribbon/godori/rain/gukjin descriptions as the board. Applying a saved selection updates only the usage badges and text, preserving the button/focus and status node. Failed storage keeps the previous applied badge and displays the warning.

`node test/settings-accessibility.mjs` checks all4×48descriptions, save-status/button node identity, keyboard focus, current badge and blocked-storage feedback. `GAME_URL`, `CHROME_PATH`, `QA_OUT` are configurable.320/390/1280actual pixels inspected,94unit tests/build,39automated accessibility states and an actual keyboard round pass. This verifies DOM semantics, not actual screen-reader speech or physical-device use. No scoring, opponent policy or save-format change.

## Current-score explanation (post-candidate, 2026-11-11)

The existing captured-card panel showed a total and card counts, but not which combinations contributed points or how 국진 was currently counted. Added the actual engine contribution list (for example 열끗2+피6=8), explicit0-point state and current 국진 designation. The note distinguishes current raw score from final settlement, which can choose another designation for the multipliers/7-point condition. Final settlement shares the same positive contribution list; scoring logic, AI and saves do not change.

Four pure tests check zero points, separate ribbon-set/count contributions, every deck prefix in all three 국진 modes summing to the engine total, rain light/godori and unchanged card metadata.98unit tests/build pass. `test/captured-score-detail.mjs` deliberately prepares public-capture fixtures for 쌍피/열끗/zero states, not naturally earned progress, and checks four viewport sizes,4automated accessibility scans, Escape/focus return and runtime errors.320/390/844×320/1280actual pixels inspected. A separate naturally played keyboard round still completes choice/go-stop/settlement/save/reload with0errors. Human/device/speech validation remains open.

The compact table stacks also use the engine's current 국진 designation: a 국진 counted as double pi is shown in the pi stack and contributes two units, not one yeol. Previously the compact table still grouped by printed category, so its counts could disagree with the score panel (열끗7·피13 versus 열끗6·피15). Four more pure tests verify both designations, all48prefixes/modes preserving each physical card once, ordinary double pi and zero.102unit tests/build pass. The same deliberate public-capture fixture now checks the compact stacks and full panel agree; no scoring rule changes.

## Name confirmed (2026-11-11 09:29 KST)

The user selected exactly `맞고2026 : 패담`. Applied the spelling and spaces to the title screen, browser title, README and planning page; removed the old subtitle from earned display titles. Existing browser save keys, stage/trophy/carry values, tournament checkpoints, repository and deployment URL remain unchanged. Existing completion milestones still derive their renamed display titles on load. Name availability and trademark checks were not requested or performed. No repository/URL migration.

The screenshot check for captured scores now waits for decoded images and fonts and rejects failed images, rather than accepting blank placeholders. A delayed-image check and explicit failed-image check verify this QA guard. This changes the QA driver, not the game runtime.

### Stop-decision explanation, Nov11 09:42
The existing stop preview now shows its exact settlement base, go addition, each applied multiplier and the current final gukjin designation. It describes the existing `settle` result rather than recalculating rules. No scoring, policy, save format, or mode changed. While the go/stop dialog is open the underlying board is inert; answering redraws an interactive board.106 unit tests pass. `node test/stop-preview.mjs` checks a natural seeded keyboard round at320/390/844×320/1280, preview/result equality, modal accessibility and focus, scroll-reachable buttons and saved progress. `CONTINUE_GO=1` verifies continued play then a later stop. `MULTIPLIER_FIXTURE=1` deliberately sets5go/2shakes/carry8/opponent-go counters to stress long explanations, not natural play or user records. Physical screen-reader voice and touch remain unverified.

### Modal background isolation, Nov11 09:52
Public exit/capture/choice/result/rival dialogs trapped Tab but did not mark background controls inert for assistive navigation. The shared dialog helper now preserves each sibling's inert state, makes background siblings inert while open and restores those states and the origin focus when removed. Go/stop uses the same helper instead of its special-case isolation. Layout/rules/save format unchanged. `node test/modal-background.mjs` exercises exit cancellation, both physical-card choices, captured-card dismissal, go/stop, settlement and a naturally played keyboard round/save reload. `node test/modal-guide.mjs` exercises rival next/previous, Escape and close button, focus return, existing inert state preservation and320/390/1280 accessibility.106 unit tests/build and existing39screen accessibility regression passed. These DOM/keyboard checks are not actual screen-reader voice certification.

### Pending record visibility, Nov11 10:02
A failed save kept the newly cleared stage in the active session but the records guide reread only disk and incorrectly showed old progress. The guide now receives the same refreshed session snapshot as the title/scenario screen and labels unsaved latest records with an explicit reload-loss warning. Persisted records, keys, merge rules and game rules are unchanged. `node test/pending-records.mjs` uses a naturally completed seeded keyboard round with a deliberately rejected save, verifies session stage1 in records at320/390/1280 with zero axe findings, then reloads to verify the unsaved stage is not falsely retained. This is injected storage failure in a fresh QA profile, not real user data. Normal saved milestone migration,106unit tests/build and39screen accessibility regression pass.

### Ordered card-action feel, Nov11 10:14
The first implementation of requested flip/match/capture impact replaces simultaneous generic flights with an ordered hand placement(190ms), deck back-to-face reveal(280ms), matched-pair outline/count(110ms) and collection(300ms). The previous board remains visible while public events play; only then is the engine's authoritative final state rendered. Empty capture groups use an on-table destination rather than accidentally flying toward the viewport origin. No card art, scoring, AI, storage keys or progression rules changed. The engine emits one public `flipped` event for the actual drawn card; future cards remain hidden. Four focused event tests plus the existing suite bring the total to110passing tests. Natural keyboard/save/settlement rounds, rapid click rejection, reduced-motion(no spatial nodes), modal focus and39screen accessibility regressions pass. Captured320/390/1280 staged frames and inspected a real-time390sequence, about2.6seconds for a natural player+opponent turn including existing AI wait in the QA browser. This is not actual-device, speaker, screen-reader voice or subjective human feel certification. Stage snapshots intentionally slow just the effect timers for inspection; production timings remain short. Input is inert/aria-busy during transitions and the status names the active action. Reduced-motion resolves without spatial effects. Existing conventional card art and sound toggle behavior are retained.

## Bomb capture origins (post-candidate, 2026-11-11)

A legal seeded opening bomb exposed a gap in the first ordered-motion pass: three own-hand cards remained visible while copies appeared from the floor. Capture motion now starts from the actual visible hand cards, hides the old copies without collapsing their layout, and fans cards only at the destination. An opponent bomb starts from the visible face-down hand slots after the public bomb event. No hidden card identity is exposed early; scoring, AI, timing, art and save format are unchanged.

`test/bomb-motion.mjs` reproduces the original defect with seed49 and the real7월 bomb button, checks the three hand origins and48unique final cards at320/390/1280, and uses seed43/독사/one real player move to check the opponent's three face-down origins. These are reproducible deals and normal UI actions, not injected stage clears or user progress. Phase screenshots stretch110/300ms waits for inspection, not performance measurement. Ordinary ordered-motion/input-lock/reduced-motion, a complete16-point keyboard round with two choices and save/reload, reduced-motion repeated-input round,39automated accessibility states and110unit tests still pass locally. Physical touch, speaker/screen-reader voice and subjective impact remain unverified.

## Three selectable sprite impacts and normal-timer regression, Nov11 11:20

The published11:09 release adds A/Sinestesia(16frames,CC0), B/Inguz Media(64frames,CC0 chosen) and C/JoesAlotofthings(6frames,CC-BY4.0) as persistent settings. DefaultA, failed writes warn that the choice is session-only. Cropped/resized losslessWebP atlases, source/derived hashes and license notices ship with the game; the guide credits each source and modifications. The400ms sprite plays inside the existing capture wait, not after it. Reduced motion skips it, and unloaded/failed images never block gameplay. This is a global ordinary-capture choice; separate event-specific mappings remain future work.114unit tests/39screen axe checks pass, with public3effects×3width frame/persistence/input/bounds checks, bomb origins, reduced repeated input and cold network-failure completion. Normal player+opponent sequence observed about2.6seconds in the QA browser, not a phone-speed guarantee.

Two normal-timer keyboard-story runs initially timed out after stop. A bounded input trace established a driver defect: it attempted to focus an inert capture button after the game ended. Focus stayed on the settlement-confirm button, so Enter closed settlement before the driver checked for it. The game was already on victory dialogue, not stalled. The driver now skips disconnected/inert/disabled targets, verifies focus before Enter, and does not inspect captured cards after game-over. No game code changed for this diagnosis. `NORMAL_TIMERS=1` retains production waits; the default continues the older accelerated regression mode. Both modes are synthetic seeded UI tests in isolated profiles, never user-owned progress.

Reproduce the full normal-timer keyboard story/preview equality/save/reload check:

```sh
NORMAL_TIMERS=1 GAME_URL=https://sigco3111.github.io/gostop2026/ QA_OUT=/tmp/paedam-normal-story node test/stop-preview.mjs
REDUCED_MOTION=1 RAPID_INPUT=1 GAME_URL=https://sigco3111.github.io/gostop2026/ QA_OUT=/tmp/paedam-reduced-story node test/stop-preview.mjs
```

`test/natural-opponents.mjs` retains production timers, chooses using only the player's hand and public floor, verifies48unique settled cards (47while a played card awaits a choice), no stale motion nodes, all selected opponent settlements and unchanged progression storage. It reads the busy guard and invariants in one synchronous snapshot to avoid misclassifying a transition between separate reads. Start a local preview first, or supply `GAME_URL`; `QA_START`, `QA_END`, `QA_OUT` and `CHROME_PATH` select the range/output/browser. Defaults1..12 and localhost4173. No stage clears, wins or save values are injected. The completed11:14 audit covers1..10before sprites,11..12on the sprite release, with1retested on that release. It is not an all12opponent latest-build claim.

Physical touch, speaker/screen-reader listening, subjective feel and human difficulty review remain unverified. QA/docs-only follow-up does not change the deployed bundle and does not need another Pages release.

### Effect save feedback stability, Nov11 11:26
Reproduced on the public11:09build: choosing an impact replaced its live-status node and buttons; after a blocked write, changing the deck preview or reopening settings erased the warning while the unsaved effect choice remained active. The effect panel now updates aria-pressed/selection classes and status text in place. A session-only unsaved flag restores the warning when the panel is rebuilt, and a successful retry clears it. Reload still returns to the last saved effect, without carrying the stale warning. No save key/format, deck behavior, game timing, rule or policy change.

115unit tests include failed-write/successful-retry warning state. `test/effect-options.mjs` verifies status/button identity and keyboard focus, warning retention across three deck previews and reopening, reload fallback,320/390/1280visual/axe checks and unchanged attribution. Full39screen axe and a normal-timer keyboard story/16point preview=settlement/save-reload still pass. This is DOM announcement stability, not verified screen-reader speech.
