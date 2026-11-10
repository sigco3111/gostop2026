// 시나리오 고수 12인 로스터 (전원 오리지널). 타짜 분위기, 다크 웹툰 화풍.
export interface Opponent {
  id: string;
  stage: number;
  name: string;        // 통칭
  title: string;       // 칭호
  difficulty: 1 | 2 | 3;
  portrait: string;    // assets 경로
  background: string;
  intro: string[];     // 대국 전 대사
  win: string[];       // 상대가 이겼을 때
  lose: string[];      // 상대가 졌을 때
}

export const OPPONENTS: Opponent[] = [
  {
    id: 'binpae', stage: 1, name: '빈패', title: '골목의 허세꾼', difficulty: 1,
    portrait: 'assets/characters/opp-01.webp', background: 'assets/backgrounds/bg-alley.webp',
    intro: ['어디서 굴러먹던 놈이 기어 들어왔네.', '패나 제대로 쥘 줄 알고?'],
    win: ['하, 재수 없게 졌다. 다음 판엔 안 봐준다.'],
    lose: ['이 판은 이쯤에서 접어 주지. 자, 다음 판을 찾아가 봐.'],
  },
  {
    id: 'baeksuhak', stage: 2, name: '백수학', title: '계산기', difficulty: 2,
    portrait: 'assets/characters/opp-02.webp', background: 'assets/backgrounds/bg-alley.webp',
    intro: ['확률은 거짓말을 안 해요. 당신이 이길 확률도요.'],
    win: ['계산대로네요.'],
    lose: ['...계산이 틀렸어. 다시 해야겠어요.'],
  },
  {
    id: 'sonbadak', stage: 3, name: '손바닥', title: '기술자', difficulty: 2,
    portrait: 'assets/characters/opp-03.webp', background: 'assets/backgrounds/bg-office.webp',
    intro: ['손이 눈보다 빠르다는 말, 들어봤어?'],
    win: ['기술은 배신하지 않아.'],
    lose: ['...네 눈이 내 손보다 빠르군.'],
  },
  {
    id: 'pado', stage: 4, name: '파도', title: '항구의 거구', difficulty: 2,
    portrait: 'assets/characters/opp-04.webp', background: 'assets/backgrounds/bg-harbor.webp',
    intro: ['파도는 한 번에 모든 걸 쓸어가지.'],
    win: ['밀물이었다, 이번 판은.'],
    lose: ['썰물이 빠져나가는 기분이 이런 건가.'],
  },
  {
    id: 'doksa', stage: 5, name: '독사', title: '심리전의 달인', difficulty: 3,
    portrait: 'assets/characters/opp-05.webp', background: 'assets/backgrounds/bg-office.webp',
    intro: ['네 손패가 아니라, 네 눈을 읽을 거야.'],
    win: ['읽힌 패는 못 이겨.'],
    lose: ['...네 눈은 안 읽히네. 처음이야.'],
  },
  {
    id: 'jipsa', stage: 6, name: '집사', title: '하우스의 관리인', difficulty: 2,
    portrait: 'assets/characters/opp-06.webp', background: 'assets/backgrounds/bg-office.webp',
    intro: ['하우스에 오신 것을 환영합니다. 패는 정중히, 결과는 냉정하게.'],
    win: ['예의는 지켰습니다만, 판은 제 것입니다.'],
    lose: ['...실례했습니다. 위로 올라가시지요.'],
  },
  {
    id: 'bulkkot', stage: 7, name: '불꽃', title: '공격적인 도박사', difficulty: 3,
    portrait: 'assets/characters/opp-07.webp', background: 'assets/backgrounds/bg-harbor.webp',
    intro: ['고! 고! 또 고! 그게 내 방식이야.'],
    win: ['타오르는 판이었지?'],
    lose: ['불꽃이 꺼지다니... 재미있는 놈이네.'],
  },
  {
    id: 'geoul', stage: 8, name: '거울', title: '무표정의 독심술사', difficulty: 3,
    portrait: 'assets/characters/opp-08.webp', background: 'assets/backgrounds/bg-office.webp',
    intro: ['......(그녀는 아무 말 없이 당신을 바라본다)'],
    win: ['...거울은 거짓말을 하지 않아요.'],
    lose: ['...거울에 금이 갔네.'],
  },
  {
    id: 'nakoja', stage: 9, name: '낙오자', title: '몰락한 챔피언', difficulty: 3,
    portrait: 'assets/characters/opp-09.webp', background: 'assets/backgrounds/bg-alley.webp',
    intro: ['나도 한때는 정점에 있었어. 다시 올라가려면 널 밟아야지.'],
    win: ['역시... 난 아직 죽지 않았어.'],
    lose: ['...이번엔 네 차례야. 정점이 얼마나 차가운지 보고 와.'],
  },
  {
    id: 'kaljabi', stage: 10, name: '칼잡이', title: '보스의 오른팔', difficulty: 3,
    portrait: 'assets/characters/opp-10.webp', background: 'assets/backgrounds/bg-suite.webp',
    intro: ['여기서부터는 내가 상대한다. 여왕님 앞에 설 자격을 증명해 봐.'],
    win: ['자격 미달이야. 돌아가.'],
    lose: ['...인정한다. 여왕님께 안내하지.'],
  },
  {
    id: 'yeowang', stage: 11, name: '여왕', title: '하우스 보스', difficulty: 3,
    portrait: 'assets/characters/opp-11.webp', background: 'assets/backgrounds/bg-suite.webp',
    intro: ['이 하우스에서 나를 이긴 사람은 없어. 너도 예외는 아니야.'],
    win: ['하우스는 항상 이기는 법이지.'],
    lose: ['...대단해. 마지막 판은 그분이 상대하실 거야.'],
  },
  {
    id: 'jeonseol', stage: 12, name: '전설', title: '지지 않는 남자', difficulty: 3,
    portrait: 'assets/characters/opp-12.webp', background: 'assets/backgrounds/bg-suite.webp',
    intro: ['십 년째 이 자리를 지키고 있지.', '전설이란 건, 만들어지는 게 아니라 남는 거야.'],
    win: ['전설은 오늘도 이어진다.'],
    lose: ['...이제 전설은 네 이름으로 불리겠군.'],
  },
];
