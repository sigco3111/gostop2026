# 맞고2026 : 패담

12인의 오리지널 고수와 겨루는 AI 싱글 맞고의 첫 완성 후보입니다. 실제 돈·구매·현금 보상은 없습니다.

## 플레이

https://sigco3111.github.io/gostop2026/

2026-11-11 08:53 공개 빌드의 핵심 모드 자동 검수를 마쳤습니다. 첫 완성 후보이며 사람의 실제 기기 플레이와 소리·화면낭독기 청취 검토는 아직 하지 않았습니다. 아래 검증 범위와 한계를 참고하세요.

## 실행

Node.js 20 이상, npm 사용.

```sh
npm ci
npm run dev
npm run build
npm run preview
npm test
```

Vite 기본 경로는 `/gostop2026/`입니다. `dist/`를 해당 경로에서 정적으로 제공하면 됩니다. 다른 경로를 사용할 때에는 `vite.config.ts`의 `base`를 바꾸고 다시 빌드하세요. 파일을 직접 더블클릭하는 방식은 지원하지 않습니다.

## 현재 구성

- 화투48장, 2인 맞고, 7점 고/스톱. 보너스패 없음
- 시나리오12단계, 단계별 대사·배경, 마지막 승리 후 엔딩
- 8인 토너먼트:8강→4강→결승, 각 대진3판2승. 다른 AI 대진은 결과 계산
- 자유 대국:상대별 난이도1~3
- 브라우저 진행 저장, 칭호·트로피, 게임 방법·48장 도감·에셋 크레딧
- 토너먼트는 완료한 판까지 대진·승수·이월을 저장하며 타이틀에서 이어합니다. 진행 중 손패는 저장하지 않습니다. 저장은 이 브라우저에만 있으며 탭을 동시에 진행하면 충돌할 수 있으므로 한 탭을 권장합니다.
- 효과음·특수 상황 파티클, 기본OFF 선택형 배경음악. 움직임 줄이기 설정 지원
- 고수 열전:12인 전신 일러스트·설정집, 키보드·작은 화면 탐색

세부 채택 규칙은 게임 내 안내와 `DEVELOPMENT.md`를 참고하세요. 서비스마다 다른 규칙을 하나의 공식 표준이라고 주장하지 않습니다.

## 검증

`npm test`는 덱/족보·배수/상태 전이/AI/토너먼트/저장 데이터를 검사합니다. 3,000개 시드의 모든 상태 전이 검사도 포함하지만 규칙 전체의 무결성을 증명하지는 않습니다.

Chrome이 설치된 환경에서 아래 시각·브라우저 테스트를 실행할 수 있습니다. 각 스크립트 상단의 브라우저 실행 경로와 출력 경로를 환경에 맞춰 조정하세요. 먼저 `npm run build`를 실행합니다.

```sh
node test/journey.mjs
node test/polish.mjs
node test/finale.mjs
node test/full-story.mjs
node test/rivals.mjs
```

- journey: 실제 패 선택·고/스톱·정산, 시나리오 저장·리로드, 토너먼트 우승, 자유 대국
- polish:320/390 세로,844 가로,1280 데스크톱 화면. 안내·도감·기록·대국·손패
- rivals:320/390/1280 설정집·전신12인 로딩·전환·포커스·Escape 검사
- full-story: 새 진행 상태에서12단계를 실제UI플레이로 순차 돌파,4·8단계 뒤 리로드 후 계속
- finale: 앞11단계를 테스트 데이터로 준비한 뒤 최종 상대를 실제로 이겨 엔딩 연결을 확인. 12단계 연속 완주 테스트와는 다름

브라우저 테스트는 재현성을 위해 난수 시드와 애니메이션 대기만 줄입니다. 승패나 점수를 강제로 바꾸지 않습니다. 단독 로컬 게임에는 진단용 `window.__game` 상태가 있습니다. 서버·멀티플레이·결제와 연결되지 않습니다.

## 배포 상태

main에는 소스, gh-pages에는 실행 빌드를 게시합니다. 2026-11-10 공개 사이트에서8판의 UI 여정과28개 반응형 화면을 검사했습니다. 실제 휴대기기 수동 검사나 전체 품질 보증을 뜻하지 않습니다. 이후 변경 때도 빌드·자동 검사와 공개 사이트를 따로 확인해야 합니다.

## 에셋

프로젝트 전용 생성 아트는 `assets/`, 실행용 최적화 파일은 `public/assets/`에 있습니다. 원본 외부 팩과 실제 적용 항목은 `ASSETS.md`, 라이선스 원문은 `licenses/`에 있습니다. 최소 소스 배포본에는 실행용 에셋과 라이선스만 포함하며, 대용량 제작 원본은 별도 보관할 수 있습니다.

## 화투패 선택 (2026-11-11)

타이틀 → 설정에서 누아르(기존), 클래식(한국식), 코믹, 심플을 선택합니다. 48장 미리보기와 선택 저장을 지원합니다. 새 브라우저의 기본값은 클래식입니다. 이전에 직접 저장한 패 선택은 그대로 유지합니다. 그림만 바뀌며 점수와 규칙은 같습니다.

클래식 도안은 Marcus Richert/Louie Mantia Jr.의 한국식 화투를 사용합니다. Wikimedia 최적화는 Spenĉjo가 했습니다. CC BY-SA 4.0이며, 출처·조건·변환 내용은 [ATTRIBUTION](assets/licensed/hwatu/ATTRIBUTION.md)에 있습니다. 해당 이미지의 라이선스는 게임 코드와 별개입니다. 코믹/심플은 이 프로젝트용으로 새로 만든 그림입니다.

## 추가 회귀 검사 (2026-11-11)

```sh
node test/card-accessibility.mjs
REDUCED_MOTION=1 RAPID_INPUT=1 QA_OUT=/downloads/input-reduced-motion node test/card-accessibility.mjs
node test/audio-controls.mjs
```

`card-accessibility`는 로컬 빌드를 실행합니다. `GAME_URL`을 지정하면 해당 공개 빌드를 검사합니다. 움직임 줄이기 모드에서는 카드 비행·파티클 생성0건과 실제 애니메이션0건을 확인하고, 손패 입력을 매번12회 연속 발생시켜 한 판 정산 뒤48장 보존을 확인합니다. `audio-controls`는 기본 공개 URL에서5개 소리를 실제 브라우저 오디오 버퍼로 해독하고 키보드 설정·저장을 검사합니다. `GAME_URL`로 검사 대상을 바꿀 수 있습니다. 실제 스피커 청취나 스크린리더 음성 품질을 검증한 것은 아닙니다.

자동 AI 비교는 봇끼리의 재현 시험입니다. 같은 시드의 배치를 선후공을 바꾸어 비교해도, 사람에게 느껴지는 난이도나12명 각각의 독립 AI 성격을 입증하지 않습니다. 같은 난이도의 캐릭터는 공통 정책을 씁니다.

## 첫 완성 후보 검수 (2026-11-11 08:53 KST)

이 후보는 기존 승인 범위인 싱글 맞고48장·12상대·시나리오·토너먼트·자유 대국·아트·반응형·소스와 공개 플레이를 묶은 기준점입니다. 이후 고도화와 사람 피드백은 별도 작업으로 이어집니다. 실제 돈·계정·결제·멀티플레이는 없습니다.

```sh
npm run test:acceptance
# 다른 공개/로컬 빌드 및 Chrome 경로를 쓰려면:
GAME_URL=http://localhost:4173/gostop2026/ CHROME_PATH=/path/to/chrome QA_OUT=/tmp/my-acceptance npm run test:acceptance
```

기본 대상은 위 공개 URL입니다. 실행에는 Chrome과 네트워크가 필요하며 몇 분 걸립니다. `GAME_URL`로 로컬 URL을 지정할 때에는 별도로 `npm run preview`를 실행하세요. 다섯 흐름은 각자 새로운 비공개 브라우저 프로필에서 돌아가므로 개인 플레이 기록에 접근하지 않습니다. 기본 출력은 `/tmp/gostop-acceptance/{story,freeplay,championship,resume,decks}`의JSON·PNG입니다. 이미지 생성만으로 시각 검수를 통과하지 않으므로 실행 후 실제 이미지를 열어 보세요.

- 새 진행으로12단계 순차 해금·엔딩·칭호 저장:17판,4·8단계 뒤 리로드. 단계나 승리를 주입하지 않았습니다.
- 자유 대국12상대 각 한 판:12판, 시나리오·트로피 저장 불변.
- 시나리오/자유 대국을 포함한8판 여정에서 실제8강→4강→결승 각2승·우승·트로피1개, 종료한 대진 저장 제거. 다른 AI대진은 게임 규칙대로 계산됩니다.
- 토너먼트2판, 리로드 복원·중도 나가기의 완료 판 체크포인트 보존. 별도 잘못된 저장/저장 실패를 주입해 복구·경고 검사.
- 4종×48장 이미지 해독, 선택 저장·리로드·실제 손패 적용,320/390/1280배치.

08:51~08:53에 위 다섯 흐름을 같은 공개 빌드에서 통과했고 실행 오류0건이었습니다.94단위 테스트·빌드·의존성 취약점 검사0건도 다시 확인했습니다. 검수 대상 소스와 Pages배포 증거:
- https://github.com/sigco3111/gostop2026/commit/2b340fb34b2f8c08dfe5d7a2846789e7c5b00ef4
- https://github.com/sigco3111/gostop2026/actions/runs/42923737258
- 실행 번들 `index-CNQRqC6B.js`, 스타일 `index-BR1msioX.css`

위 시험은 시드와 대기 시간을 조정한 자동 UI플레이입니다. 사람 플레이, 모든 규칙 조합, 실제 휴대기기 터치·핀치, 소리 청취, 화면낭독기 발화 품질이나 장시간 균형을 보증하지 않습니다. 같은 난이도는3종 공통 정책 중 하나를 쓰며12명 각각의 독립 AI가 아닙니다. 저장은 로컬이며 진행 중 손패는 복구하지 않습니다. 저장 경고가 뜨면 새로고침 전에도 미저장 기록을 잃을 수 있으니 한 탭에서 사용하세요. 세부 한계는 `DEVELOPMENT.md`에 있습니다.

설정 화면의48장 미리보기도 대국판과 같은 한국어 월·도상·족보 설명을 사용합니다. 선택 저장 때 상태 안내와 버튼·키보드 초점을 유지합니다. `node test/settings-accessibility.mjs`로4종 설명·저장 성공/실패·초점·320/390/1280배치를 검사할 수 있습니다. 실제 화면낭독기 음성 품질의 검증은 아닙니다.

먹은 패·점수에는 현재 원점수의 족보별 기여와 국진의 현재 집계 방식이 표시됩니다. 최종 정산의 배수·7점 조건에 따른 국진 선택과 구분합니다. `node test/captured-score-detail.mjs`는 공개 먹은 패를 의도적으로 준비한 화면 검수이며 자연 플레이나 사용자 저장 기록이 아닙니다.

### Card image request failure (2026-11-11)
Failed public-card pictures now show a high-contrast text face with the month,
scoring type, ribbon set, godori or gukjin where applicable, and "그림 없음".
Normal downloaded artwork and the default classic deck are unchanged. The same
fallback follows moving cards, and is removed if that image later loads. Compact
capture stacks retain their alt descriptions; the detailed capture dialog uses
the full text face. No opponent hand is revealed.

`node test/card-image-fallback.mjs` compares all four decks with normal and blocked
card-image requests. Each case uses unchanged production timers and two actual
single-card UI turns, then compares the full game state, capture dialog, progress,
image recovery and axe results. Blocked images are a deliberate network fault,
not evidence of a current public outage. The 320/390/568-landscape/1280 layout
matrix is not physical-phone or full-round coverage.

`node test/card-failure-round.mjs` adds a separate public normal-timer story-round
comparison: with the same fixed shuffle and no progress/result injection, normal
and failed-image conditions each made 8 single-card plays, 2 capture choices and
1 stop decision, earned 16 points and saved the first stage. Inputs, boundary
game states, settlement, saved values and records agreed, including after reload.
This is one fixed-shuffle browser case per condition, not physical-device or
all-opponent coverage. Production code and deployment do not change for this QA.

### Short-screen title navigation (2026-11-11)
The title content now uses an auto top margin instead of unsafe end alignment:
on tall screens it stays low as before, but on short screens it starts at a
reachable scroll origin. Every title-menu button is at least 44px high, and the
background shade stays over the viewport while scrolling. Menu order, artwork,
preferences, game rules and save format are unchanged.

`node test/title-navigation.mjs` checks five viewports (320/390 portrait,
568/844 landscape and 1280), title visibility, all six menu target sizes and
scroll reachability, scenario/freeplay/settings/guide return paths, music toggle
and reload, keyboard traversal, preserved fixture progress/deck selection and
axe. The progress fixture tests preservation only; it is not an earned win or
physical-phone test.

When the progress-storage warning is present, the title menu now leaves at least
42px below its final button so the fixed warning cannot cover part of the touch
target. `FAIL_STORAGE=1 node test/title-navigation.mjs` repeats all five title
viewports with deliberate progress-write failure and checks that the last menu
button and notice do not overlap. This does not simulate a real device failure.
Normal storage retains the existing layout.

### Settings image-load stability (2026-11-11)
The settings column reserves its full available width (up to the existing 880px
limit) before card images load. Loading images no longer moves the title-return
button sideways. No option, game rule, AI or save format changes.
`test/settings-cold-layout.mjs` deliberately holds card requests, scrolls the
return button into view, then releases the images and confirms identical button
coordinates plus a successful tap at the original point across five viewports.
Set GAME_URL for a public build, or run Vite preview on port 4178 for local QA.
This is a controlled browser load test, not a physical-device network test.

`test/settings-loading-input.mjs` holds card requests while choosing Comic cards,
applying them, choosing effect C and returning to the title before requests
finish. Across five sizes, normal writes survive reload as Comic/C, while
injected preference-write failures show deck feedback and reload as Classic/A.
Progress remains unchanged; axe and runtime errors are checked. This is a
controlled test browser and does not alter the user's progress or prove a real
network/storage/device failure. GAME_URL and QA_OUT select the target/output.

`test/rotation-round.mjs` compares one fixed-shuffle, normal-timer story round
with an identical run that changes viewport sizes during both capture choices,
capture browsing, Go/Stop and settlement. Five sizes at each of five boundaries
check unchanged game/save/choice state and reachable 44px-or-larger targets.
Both runs must have identical inputs, all input-boundary states, settlement,
final state and earned progress/records after reload. Axe runs only after the
round so its random draws cannot contaminate the seeded AI stream. These are
emulated viewport changes, not physical-device rotation or a balance verdict.
Set GAME_URL and QA_OUT for the target and output directory.

`test/motion-rotation-round.mjs` changes size during all eight player card-play
animations in one fixed-shuffle story round, after observing one moving card and
input lock. It compares every subsequent input boundary, full final state,
settlement and earned/reloaded progress with an unchanged-size run, using normal
production timers. The check proves turn/input recovery for that case, not every
intermediate animation coordinate, phone sensor rotation or all opponents.

`test/motion-background-round.mjs` opens a separate blank browser tab for 1.2
seconds during each of eight player card-play animations and verifies actual
hidden/visible transitions on return. The paired normal-timer, fixed-shuffle
round must preserve all input boundaries, final state, settlement and earned
progress after reload. It does not test phone app switching, OS memory reclaim,
or a long background session.

`test/repeat-touch-round.mjs` makes four extra touchscreen taps at the played
card's position while the board is input-locked, on every player play. Its
normal-timer paired round must preserve inputs, all boundary states, settlement,
final state and saved/reloaded progress. This is browser touch emulation, not
physical-device latency testing. Neither test injects wins or saved progress.

### Card identity while pictures load (2026-11-11)
Public card faces show month, scoring identity and a loading note while their
picture request is pending, then return to the selected deck's normal art on
load. Failed requests retain the existing distinct missing-picture note. Hidden
opponent hands remain backs. Rules, AI, one-tap input and save format do not change.
`test/card-loading.mjs` holds then releases card requests across four decks and
four sizes, checking public identities, hidden-hand privacy, placeholder cleanup,
unchanged game/save state and axe/runtime errors. These are controlled requests,
not evidence of a real service outage or a physical-device network test.

`test/card-loading-round.mjs` holds every card-image request pending throughout
one 320px, fixed-shuffle story round and compares it with an ordinary-image run.
Both use normal production timers and real input, without injected state, wins
or progress. Inputs, every input-boundary state, final state, settlement and
saved/reloaded records must agree. Images are released after settlement; normal
art must return without changing the settled game. This covers controlled browser
requests, not a real network incident, physical phone or every opponent.

### Audio preference save feedback (2026-11-11)
If a sound or music preference cannot be saved, the title/game shows which choice
is temporary and warns that reload restores the previous choice. The current tab
still honors it. A successful write clears only that preference's warning. Music
also updates in place instead of rebuilding the title screen. Progress, game
rules, AI, audio files and playback levels are unchanged.
`test/audio-save-feedback.mjs` checks normal, failed and recovered audio writes
at five viewports, title identity, current choices, warning placement and turn
survival, unchanged progress, reload, axe and runtime errors. Failures are injected
in an isolated browser; this does not prove a real storage outage or speaker sound.

`test/capture-touch-round.mjs` compares a normal story round with the same inputs
interrupted by browsing at least 12 naturally earned captured cards. At 320x568,
390x844 and 568x320, it sends upward/downward emulated touch swipes, waits for
scroll momentum to settle, checks both player jumps and the reachable return
button, and returns by touch with focus restored. Game/save state must not change
while browsing. Both normal-timer, fixed-shuffle rounds must have identical input
boundaries, final state, settlement and earned/reloaded records. No captures,
wins or progress are injected. This does not test taps during momentum, a physical
phone, all opponents or human balance. GAME_URL and QA_OUT select target/output.

### Menu copy matches the destination (2026-11-11)
Free play states that all 12 opponents are available separately from story
progress. The final-scene return button names the story list it actually opens.
Only wording changes. `test/menu-copy.mjs` checks both at five sizes, enters the
last free-play opponent without changing progress, and verifies the ending return
destination. The ending uses a deliberate isolated test completion fixture, not a
naturally earned win or user progress. Axe/runtime errors and overflow are checked.

### Current story opponent shortcut (2026-11-11)
After at least one cleared stage, the sticky story navigation names the next
unlocked opponent and jumps to that card without starting the match or changing
progress. Keyboard focus follows the jump; Enter on the card opens its dialogue.
After all 12 stages it points to the final opponent for replay. Fresh games retain
the simple navigation. `test/scenario-jump.mjs` checks five viewport sizes across
0/1/5/11/12 cleared-stage fixtures: unlocks, touch targets, visible focused target,
keyboard dialogue, reload, progress invariance, overflow and axe/runtime checks.
These isolated fixtures do not establish naturally earned wins or phone usability.

### Month lookup in the 48-card guide (2026-11-11)
The deck tab adds a pinned, labelled month selector and a separate Move button.
Changing selection alone does not jump. Move scrolls to that month's heading and
moves keyboard focus without changing the month order, 48 cards or saved progress.
Other guide tabs hide these controls. `test/deck-month-navigation.mjs` checks all
12 months at five viewport sizes, touch targets, target visibility, keyboard
activation, tab changes, reload/save invariance, overflow and axe/runtime checks.
Browser emulation is not a physical-phone or screen-reader speech test.

### Visible scoring labels in the card guide (2026-11-11)
Only the guide adds captions below its 48 card images: scoring kind, ribbon set,
godori membership, and gukjin's yeol/pi designation. Captions come from the same
public card definitions as failed-image labels. Pictures and in-game cards are
unchanged. Accessible image names retain the full description without repeating
the visible caption. `test/deck-captions.mjs` checks all 48 labels at five sizes,
uncropped image proportions, caption placement, reachable short-landscape text,
progress invariance, overflow and axe/runtime checks. A 320px-tall screen scrolls
to see captions below the card images.

### Repeatable keyboard browsing in the rival dossier (2026-11-11)
After moving to a previous or next rival, focus stays on that same navigation
button. Repeated Enter/Space browses the twelve rivals rather than accidentally
activating Close. Initial opening still focuses Close; Escape or Close restores
the originating gallery card. `test/rival-navigation.mjs` checks 12 forward and
12 backward keyboard moves, wrapping, touch navigation, modal focus boundaries,
background isolation, 44px visible controls, save invariance and axe at five sizes.

### Rival controls remain reachable after reading (2026-11-11)
The dossier's previous/next/close controls stay pinned at every width, including
844×320 landscape. `test/rival-scroll-controls.mjs` reads the bottom of all twelve
profiles at five sizes, checks the complete final quote and all 44px controls,
then uses Next and Close without scrolling back to the top. Navigation focus,
wrapping, origin focus and progress storage remain unchanged.

### Held keys are one decision (2026-11-11)
Holding Enter or Space no longer plays more cards when the next turn restores
focus. The game ignores activation-key repeat events, including across choice
and go/stop controls; releasing and pressing again still works normally.
`test/held-key.mjs` checks both keys at three sizes. `test/held-decision-round.mjs`
compares a normal touch round with Enter and Space rounds, holding each at the
first hand play, first two-card choice and Stop. The full decision-boundary state,
settlement, saved progress and reloaded record must match the touch baseline.
The optional `GO_FIRST=1` run chooses Go at the first prompt, then Stop at the
next prompt. This checks that a held Go key does not play the returned hand or
answer the next prompt. Its touch/Enter/Space runs must still match in full.

`node test/special-action-input.mjs` compares emulated touch with held Enter and
Space on naturally dealt shake (seed 8) and bomb (seed 49) actions at 320×568
and 568×320. It checks 44px/reachable action buttons, one declaration, hand and
bomb-pass counts, whole-state equality, unchanged save, and axe. Bomb cases
also use one of the two earned blank passes, retaining seven hand cards and
one remaining pass. Production timers stay enabled. This is an input-boundary
check, not a full-round or hardware-keyboard test. `SPECIAL_ONLY=bomb` limits
the run to bomb and blank-pass cases; `GAME_URL` and `QA_OUT` override the public
URL and output directory. Empty captured-panel jumps were separately inspected
at 320, 568 and 844 widths; no defect was found.

`node test/header-go-layout.mjs` checks header-only display fixtures for all
12 rivals at 320/360/390/568 widths, with Go 0/1/5, raw score 0/12/29 and both
sound labels (288 combinations). The fixture changes only displayed text,
not game state or saved progress. It checks intact labels, reachable sound,
no horizontal overflow and state/save equality. This does not claim those Go
and score combinations were earned in real play. Header CSS keeps narrow Go
and sound labels intact; Go badges use a lighter red for dark-surface contrast.

The active turn hint is a 44px hand shortcut. It only scrolls/focuses the hand
group, never plays a card. Tab then enters the first card; End still reaches
the last card. `node test/hand-jump.mjs` checks five viewport sizes with touch,
held Enter and held Space, state/save invariance, capture-dialog return,
next-turn availability and axe. `HAND_JUMP=1 node test/capture-touch-round.mjs`
also uses the shortcut at each ordinary turn in the touch-inspection run,
which must match the baseline through settlement, saved progress and records.

When shake, bomb or earned blank-pass actions are available, the same turn
shortcut names that action and focuses/scrolls the action group first. This
keeps the special-action button out from behind the fixed header in short
landscape. Hand cards remain below and can be scrolled into view. The shortcut
never declares the action or changes game/save state. `TURN_JUMP=1 node
test/special-action-input.mjs` checks these boundaries, Tab into the action,
and normal held-key action/earned-pass behavior. Ordinary turns retain the
hand shortcut. This is not a promise that actions and every hand card fit
simultaneously on short screens.

### Captured-card category jumps (2026-11-12)
The existing category counts in each player's captured panel are now 44px jump
buttons. A count jumps to that category heading below the pinned player/close
controls, without scoring or changing any card. Empty categories stay visible
as disabled counts. Gukjin uses its current scoring group, as before. No extra
pinned row was added. `captured-score-detail.mjs` checks deliberate captured-card
fixtures (not earned play), all category jumps, both players, empty categories,
Gukjin pi/yeol, focus/close and axe at five sizes. `KIND_JUMP=1 node
test/capture-touch-round.mjs` compares a natural normal-speed round with one
that browses each earned category, swipes and returns. Whole decision states,
settlement, saved progress and reload records must match.

`turn-shortcut-options.mjs` checks naturally dealt seed51(two shakes) and
seed95(bomb plus shake) at320/568 widths with touch and held activation keys.
Both special actions stay reachable; Tab visits both actions then the hand.
Browsing alone must leave whole game state and saved progress unchanged.

The first rules section now separates controls into seven labeled instructions,
replacing the long mixed paragraph. Existing control behavior and rule text are
unchanged. `guide-controls-copy.mjs` checks every instruction's heading and
start of its description remains reachable below the pinned navigation at
320/390/568/1280 widths, with no horizontal overflow or progress changes.

Story and roster keyboard activation now ignores held-key repeat events, just
like card play: entering a story while holding Enter/Space keeps its first line,
and each fresh press advances one line. Result-dialogue return cannot let a
held key start the highlighted roster card. `story-key-repeat.mjs` checks both
keys at320/568/1280 widths,30repeats at each boundary, fresh-press continuation,
cancel/exit, and unchanged progress. `RESULT_HOLD=1 capture-touch-round.mjs`
checks the result return after a naturally completed paired normal-speed round.

`story-readability.mjs` opens all12 introductions using an isolated unlocked
navigation fixture (not12 earned wins), checks all14 actual lines at320x568,
568x240 and568x320, decodes portraits/backgrounds, checks visible dialogue
bounds/no horizontal overflow/axe0 and unchanged fixture progress. The story
repeat harness also decodes CSS backgrounds and fixes seed23 to avoid random
instant-ending deals when testing cancel/exit, without changing production.

`motion-preference-round.mjs` compares normal play with turning on the OS
reduced-motion preference during the first card flight, using production timers
and naturally earned progress. Later reduced plays emit no motion nodes and
settlement has no running animations. `missing-impact-round.mjs` blocks all
three impact-sprite downloads in isolated sessions selecting A/B/C. Both checks
compare complete decision-boundary game state, earned saves and records with a
normal round, check reload continuity and axe0. Network failures are deliberate
fixtures, not evidence of an actual public outage.

`free-roster-key-boundary.mjs` covers all12 freely available rivals at320/568/1280
widths with touch/Enter/Space (108 entries). A held roster key must not play a
card when focus moves into the game; cancel preserves the full state, confirmed
exit returns to title and preserves progress. This is entry/exit coverage, not
108 completed rounds or a human difficulty evaluation.

`pending-records-normal-timers.mjs` naturally earns one win with production
animation timers while an isolated progress-write failure is installed. At
four sizes, section browsing keeps the unsaved1/12 record and warning. Reload
must show the actual persisted0/12 instead of false success. `RECOVER_SAVE=1`
restores writes without reloading, naturally wins against the second rival,
and requires both stages to persist together, the warning to clear and reload
to retain2/12. It never injects wins/cards/progress. This simulates storage
failure and recovery, not a real public outage or user-record loss.

`decision-background-round.mjs` compares a baseline with a production-timer
natural round that backgrounds the page at both capture choices, the captured
panel, Go/Stop and settlement. At each interruption it observes hidden/visible,
changes to568x240 then returns to320x568, checks unchanged whole game/save state
and dialog focus/Tab containment, and verifies scroll access to the title and
44px action target. Short-height panels can require scrolling between their
heading and buttons; they need not fit together. Both rounds must have identical
inputs, boundary states, result, earned save, reload and records, with axe0.
This is desktop-browser tab/viewport simulation, not phone app suspension.
