import { useMemo, useRef, useState } from "react";
import "./App.css";

const BOARD_SIZE = 6;
const MAX_DEBT = 5000;
const PLAYER_MAX_HP = 100;

const BALANCE = {
  enemyMultiplier: 10,
  riskMultiplier: 1,
  attackMultiplier: 0.2,
  finalInterestRate: 0,
};

const PIECES = [
  { id: "red", label: "赤", color: "#FF5C5C" },
  { id: "blue", label: "青", color: "#4DA6FF" },
  { id: "green", label: "緑", color: "#35D889" },
  { id: "yellow", label: "黄", color: "#FFD24A" },
  { id: "purple", label: "紫", color: "#9B6BFF" },
  { id: "curse", label: "滞", color: "#1A1A1A", curse: true },
];

const CHARACTERS = [
  { id: "greed", name: "強欲", en: "GREED", style: "利益最大化型", tone: "#FFD24A", risk: "高リスク・高リターン", difficulty: 3, text: "利益+30% / 借金+20%", lead: "もっと、もっと欲しくなる。借金を力に変え、利益を限界まで引き上げる。" },
  { id: "wrath", name: "憤怒", en: "WRATH", style: "暴走火力", tone: "#FF5C5C", risk: "中リスク・火力特化", difficulty: 3, text: "借金50%以上でダメージ+50%", lead: "危険域に踏み込むほど、怒りが火力に変わる。" },
  { id: "sloth", name: "怠惰", en: "SLOTH", style: "安定型", tone: "#6EE58A", risk: "低リスク・堅実", difficulty: 2, text: "5チェイン以下で利益+50%", lead: "深追いしない者だけが、静かに利益を残す。" },
  { id: "gluttony", name: "暴食", en: "GLUTTONY", style: "借金吸収", tone: "#FF9D38", risk: "中リスク・回復型", difficulty: 2, text: "借金増加量の10%をHP回復", lead: "増えた借金すら喰らい、次の一手に変える。" },
  { id: "envy", name: "嫉妬", en: "ENVY", style: "コピー型", tone: "#35DDE2", risk: "変則・契約依存", difficulty: 4, text: "最初の契約効果をコピー", lead: "他者の契約を羨み、最初の力を二重に奪う。" },
  { id: "lust", name: "色欲", en: "LUST", style: "ロングチェイン型", tone: "#B56BFF", risk: "高リスク・連鎖型", difficulty: 4, text: "10チェイン以上で次ターン利益+100%", lead: "長いチェインの快楽が、次の欲望をさらに増幅する。" },
  { id: "pride", name: "傲慢", en: "PRIDE", style: "ノーダメ高倍率", tone: "#F4E7BE", risk: "高難度・爆発型", difficulty: 5, text: "ノーダメ3ターン継続で利益+200%", lead: "傷を受けぬ者だけが、傲慢な倍率を手にする。" },
];

const STAGES = [
  { name: "通常戦1", hp: 100, attack: 5 },
  { name: "通常戦2", hp: 150, attack: 7 },
  { name: "税務執行者", type: "小ボス", hp: 500, attack: 15, interestRate: 0.1 },
  { name: "通常戦4", hp: 220, attack: 10 },
  { name: "通常戦5", hp: 300, attack: 12 },
  { name: "回収監査官", type: "中ボス", hp: 1200, attack: 25, interestRate: 0.25 },
  { name: "通常戦7", hp: 500, attack: 18 },
  { name: "通常戦8", hp: 700, attack: 22 },
  { name: "徴収王", type: "ラスボス", hp: 3000, attack: 40, final: true },
];

const CONTRACTS = [
  { id: "loanShark", name: "高利貸し", icon: "高", text: "利益+50% / 借金+30%" },
  { id: "runawayMana", name: "暴走魔力", icon: "暴", text: "借金80%以上で利益+100%" },
  { id: "lateAwakening", name: "延滞覚醒", icon: "延", text: "延滞中、利益+150%" },
  { id: "lifeCut", name: "命削り", icon: "命", text: "毎ターンHP-5 / 利益+50%" },
  { id: "interestRefund", name: "利息還元", icon: "還", text: "支払利息20%を利益変換" },
  { id: "toxicAsset", name: "毒資産", icon: "毒", text: "毎ターン利益+20" },
  { id: "greedDeal", name: "強欲契約", icon: "欲", text: "最終利益+30%" },
  { id: "lazyDeal", name: "怠惰契約", icon: "怠", text: "5チェイン以下で利益+50%" },
  { id: "wrathDeal", name: "憤怒契約", icon: "怒", text: "黒状態でダメージ+100%" },
  { id: "darkFinance", name: "闇金融", icon: "闇", text: "借金4000以上でダメージ+200%" },
];

const getPiece = (id) => PIECES.find((piece) => piece.id === id);
const randomPiece = () => PIECES[Math.floor(Math.random() * (PIECES.length - 1))].id;
const keyOf = ({ row, col }) => `${row}-${col}`;
const isNeighbor = (a, b) => Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;
const formatMoney = (value) => Math.round(value).toLocaleString("ja-JP");
const countContract = (contracts, id) => contracts.filter((contract) => contract.id === id).length;

const makeBoard = () => {
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => randomPiece())
  );
  const seed = randomPiece();
  board[0][0] = seed;
  board[0][1] = seed;
  board[0][2] = seed;
  return board;
};

const getDebtState = (debt) => {
  const ratio = Math.max(0, Math.min(1, debt / MAX_DEBT));
  if (ratio > 0.8) return { id: "black", label: "黒", text: "利益+100% / 利息+50%", color: "#1A1A1A" };
  if (ratio > 0.5) return { id: "red", label: "赤", text: "敵攻撃+20%", color: "#FF5C5C" };
  if (ratio > 0.25) return { id: "yellow", label: "黄", text: "利息+10%", color: "#FFD24A" };
  return { id: "blue", label: "青", text: "通常", color: "#4DA6FF" };
};

const getThresholdBonus = (chain) => {
  if (chain >= 12) return 2.8;
  if (chain >= 10) return 2;
  if (chain >= 8) return 1.6;
  if (chain >= 6) return 1.3;
  return 1;
};

const nextThreshold = (chain) => [6, 8, 10, 12].find((value) => chain < value);

const effectiveContracts = (game) => {
  if (game.characterId !== "envy" || game.contracts.length === 0) return game.contracts;
  return [...game.contracts, game.contracts[0]];
};

const calculateTurn = (game, chain) => {
  if (chain < 3) {
    return { profit: 0, debtGain: 0, damage: 0, heal: 0, lifeCost: 0, bonus: 1 };
  }

  const debtState = getDebtState(game.totalDebt);
  const contracts = effectiveContracts(game);
  let profitMultiplier = getThresholdBonus(chain);
  let debtMultiplier = BALANCE.riskMultiplier;
  let damageMultiplier = BALANCE.attackMultiplier;

  if (debtState.id === "black") profitMultiplier *= 2;
  if (game.nextProfitBoost) profitMultiplier *= 2;
  if (game.characterId === "greed") {
    profitMultiplier *= 1.3;
    debtMultiplier *= 1.2;
  }
  if (game.characterId === "sloth" && chain <= 5) profitMultiplier *= 1.5;
  if (game.characterId === "wrath" && game.totalDebt >= MAX_DEBT * 0.5) damageMultiplier *= 1.5;
  if (game.characterId === "pride" && game.noDamageTurns >= 3) profitMultiplier *= 3;

  contracts.forEach((contract) => {
    if (contract.id === "loanShark") {
      profitMultiplier *= 1.5;
      debtMultiplier *= 1.3;
    }
    if (contract.id === "runawayMana" && game.totalDebt >= MAX_DEBT * 0.8) profitMultiplier *= 2;
    if (contract.id === "lateAwakening" && game.overdue) profitMultiplier *= 2.5;
    if (contract.id === "lifeCut") profitMultiplier *= 1.5;
    if (contract.id === "lazyDeal" && chain <= 5) profitMultiplier *= 1.5;
  });

  const baseProfit = chain ** 2 * BALANCE.enemyMultiplier;
  const passiveProfit = countContract(contracts, "toxicAsset") * 20;
  const profit = Math.round(baseProfit * profitMultiplier + passiveProfit);
  const debtGain = Math.round(chain ** 3 * debtMultiplier);

  if (game.totalDebt >= 4000) {
    damageMultiplier *= 1 + countContract(contracts, "darkFinance") * 2;
  }
  if (debtState.id === "black") {
    damageMultiplier *= 1 + countContract(contracts, "wrathDeal");
  }

  const damage = Math.round(profit * damageMultiplier);
  const heal = game.characterId === "gluttony" ? Math.round(debtGain * 0.1) : 0;
  const lifeCost = countContract(contracts, "lifeCut") * 5;

  return { profit, debtGain, damage, heal, lifeCost, bonus: getThresholdBonus(chain) };
};

const applyGravity = (board, path) => {
  const removed = new Set(path.map(keyOf));
  const next = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));
  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const kept = [];
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      if (!removed.has(`${row}-${col}`)) kept.push(board[row][col]);
    }
    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      next[row][col] = kept[BOARD_SIZE - 1 - row] || randomPiece();
    }
  }
  return next;
};

const addCursePieces = (board, count) => {
  const next = board.map((row) => [...row]);
  const candidates = [];
  next.forEach((row, rowIndex) => {
    row.forEach((piece, colIndex) => {
      if (piece !== "curse") candidates.push({ row: rowIndex, col: colIndex });
    });
  });
  [...candidates].sort(() => Math.random() - 0.5).slice(0, count).forEach(({ row, col }) => {
    next[row][col] = "curse";
  });
  return next;
};

const randomRewards = () => [...CONTRACTS].sort(() => Math.random() - 0.5).slice(0, 3);

const initialGame = () => ({
  screen: "home",
  characterId: "greed",
  board: makeBoard(),
  path: [],
  dragging: false,
  stageIndex: 0,
  enemyHp: STAGES[0].hp,
  hp: PLAYER_MAX_HP,
  totalProfit: 0,
  totalDebt: 0,
  totalInterest: 0,
  maxDebt: 0,
  maxChain: 0,
  turn: 1,
  contracts: [],
  rewards: [],
  overdue: false,
  interestPenalty: 0,
  curseCount: 0,
  nextProfitBoost: false,
  noDamageTurns: 0,
  message: "欲張るほど気持ちいい。どこで指を離す？",
  lastTurn: null,
  settlement: null,
  result: null,
});

function TitleScreen({ onStart }) {
  return (
    <section className="homeScreen">
      <div className="homeSparkles" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
        <span />
      </div>
      <div className="comicLogo" aria-label="貸した魔力はリボ払いで強制徴収">
        <span className="logoSplash" />
        <span className="logoLine">貸した魔力は</span>
        <strong>
          <mark>リボ払い</mark>
          <span>で</span>
          <b>強制徴収</b>
        </strong>
        <em>借金で快楽を前借りするローグライク</em>
      </div>
      <div className="heroVisual" aria-hidden="true">
        <div className="magicRing" />
        <div className="magicRing innerRing" />
        <div className="chainLine chainLeft" />
        <div className="chainLine chainRight" />
        <div className="greedFigure"><i /><b /><em /><strong /></div>
        <div className="contractCard cardOne"><small>契約書</small><span>利息は全て<br />あなたのものに<br />なります……</span></div>
        <div className="contractCard cardTwo"><small>魔力契約</small><span>返済不能時<br />追加徴収</span></div>
        <div className="contractCard cardThree"><small>魔力印</small></div>
        <span className="magicOrb orbOne" />
        <span className="magicOrb orbTwo" />
        <span className="magicOrb orbThree" />
      </div>
      <p className="catchCopy">あと1チェインだけ…！ 助かった…！！</p>
      <button className="startButton" type="button" onClick={onStart}>START <span>→</span></button>
      <div className="rulePanel" aria-label="ルールはカンタン">
        <strong>ルールはカンタン！</strong>
        <div className="ruleCards">
          <div><span>🔗</span><b>パズルをつなげて<br />魔力を回収！</b></div>
          <div><span>🪙</span><b>利益を増やして<br />もっと借りる！</b></div>
          <div><span>⚖</span><b>最後に利息を払って<br />黒字を目指せ！</b></div>
        </div>
        <p>貸した魔力には、必ず利息がつきます。</p>
      </div>
      <footer className="titleFooter">
        <button type="button">メニュー</button>
        <button type="button">遊び方</button>
        <button type="button">実績</button>
        <span>Ver.0.2.0</span>
      </footer>
    </section>
  );
}

function CharacterSelect({ selectedId, onSelect, onNext }) {
  const selected = CHARACTERS.find((character) => character.id === selectedId) || CHARACTERS[0];

  return (
    <section className="characterScreen">
      <header className="selectHeader">
        <button className="backButton" type="button" aria-label="戻る">‹</button>
        <div>
          <h1>キャラ選択</h1>
          <p>プレイするキャラクターを選んでください</p>
        </div>
      </header>
      <div className="characterGrid">
        {CHARACTERS.map((character) => (
          <button
            className={`characterCard ${selectedId === character.id ? "active" : ""}`}
            key={character.id}
            onClick={() => onSelect(character.id)}
            style={{ "--character-color": character.tone }}
            type="button"
          >
            <span className="cardFigure" />
            <span className="sinSigil">{character.en.slice(0, 1)}</span>
            <strong>{character.name}</strong>
            <small>{character.en}</small>
            {selectedId === character.id && <em>SELECTED</em>}
          </button>
        ))}
      </div>
      <section className="characterDetail" style={{ "--character-color": selected.tone }}>
        <div className="detailIdentity">
          <span className="detailSigil">{selected.en.slice(0, 1)}</span>
          <h2>{selected.name}</h2>
          <strong>{selected.en}</strong>
          <dl>
            <div><dt>難易度</dt><dd>{"★".repeat(selected.difficulty)}{"☆".repeat(5 - selected.difficulty)}</dd></div>
            <div><dt>リスク傾向</dt><dd>{selected.risk}</dd></div>
            <div><dt>プレイスタイル</dt><dd>{selected.style}</dd></div>
          </dl>
        </div>
        <div className="detailText">
          <p>{selected.lead}</p>
          <div className="effectBox">
            <h3>初期効果</h3>
            <ul>
              <li>{selected.text}</li>
              <li>チェインボーナス +10%</li>
              <li>借金ゲージを攻める</li>
            </ul>
          </div>
          <div className="styleBox">
            <h3>おすすめプレイスタイル</h3>
            <ul>
              <li>長いチェインを狙う</li>
              <li>借金ゲージを攻める</li>
              <li>一気に利益を伸ばす</li>
            </ul>
          </div>
          <div className="initialContracts">
            {CONTRACTS.slice(0, 3).map((contract) => (
              <span key={contract.id}><b>{contract.icon}</b>{contract.name}</span>
            ))}
          </div>
        </div>
      </section>
      <button className="decideButton" type="button" onClick={onNext}>このキャラで決定</button>
      <footer className="selectFooter">
        <button type="button">キャラ詳細</button>
        <button type="button">おすすめ編成</button>
      </footer>
    </section>
  );
}

function MapScreen({ game, onNext }) {
  const debtState = getDebtState(game.totalDebt);
  const debtPercent = Math.round(Math.min(100, (game.totalDebt / MAX_DEBT) * 100));
  const cash = game.totalProfit - game.totalDebt - game.totalInterest;
  const character = CHARACTERS.find((item) => item.id === game.characterId) || CHARACTERS[0];
  const mapMenus = ["契約一覧", "ミッション", "ショップ", "図鑑", "設定"];

  return (
    <section className="mapScreen">
      <header className="mapHeader">
        <div className="mapLogo">
          <span>貸した魔力は</span>
          <strong>リボ払いで強制徴収</strong>
          <em>借金で快楽を前借りするローグライク</em>
        </div>
        <div className="mapStats">
          <div><span>総利益</span><strong className="profitText">{formatMoney(game.totalProfit)}</strong></div>
          <div><span>総借金</span><strong className="debtText">{formatMoney(game.totalDebt)}</strong></div>
          <div><span>所持金</span><strong>{formatMoney(cash)}</strong></div>
          <div className="mapDebtMeter">
            <span>借金ゲージ</span>
            <div className="segmentedGauge">
              <span className="segmentBlue" />
              <span className="segmentYellow" />
              <span className="segmentRed" />
              <span className="segmentBlack" />
              <em style={{ left: `${debtPercent}%` }} />
            </div>
            <strong>現在の状態：{debtState.label}（{debtState.text}）</strong>
          </div>
        </div>
      </header>

      <aside className="mapPlayerPanel">
        <div className="mapPortrait"><span>{character.name}</span></div>
        <div className="mapInfoCard"><small>プレイヤーHP</small><strong>❤️ {game.hp}<em>/ {PLAYER_MAX_HP}</em></strong></div>
        <div className="mapInfoCard"><small>現在ステージ</small><strong>⚑ {game.stageIndex + 1}<em>/ 9</em></strong></div>
        <div className="mapContracts">
          <small>所持契約</small>
          <div>
            {(game.contracts.length ? game.contracts : CONTRACTS.slice(0, 8)).slice(0, 8).map((contract, index) => (
              <span key={`${contract.id}-${index}`}>{contract.icon}</span>
            ))}
          </div>
        </div>
      </aside>

      <nav className="mapSideMenu" aria-label="マップメニュー">
        {mapMenus.map((item, index) => (
          <button key={item} type="button">
            <span>{["▱", "☑", "🛒", "▤", "⚙"][index]}</span>
            {item}
            {index === 1 && <em>!</em>}
          </button>
        ))}
      </nav>

      <div className="mapRail">
        {STAGES.map((stageItem, index) => {
          const isBoss = stageItem.type;
          return (
            <div
              className={`mapNode ${index === game.stageIndex ? "current" : ""} ${index < game.stageIndex ? "done" : ""} ${isBoss ? "boss" : ""} ${stageItem.final ? "final" : ""}`}
              key={stageItem.name}
            >
              <i>{index + 1}</i>
              <span className="nodeSigil">{stageItem.final ? "♛" : isBoss ? "▣" : "⚔"}</span>
              <div>
                <strong>{stageItem.name}</strong>
                <small>{stageItem.type || "通常戦"} / 推奨レベル {5 + index * 3}</small>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mapDecor decorContract">魔力契約書<br />利息は全てあなたのものになります</div>
      <div className="mapDecor decorInvoice">請求書<br />元金 利息 延滞損害金</div>

      <footer className="mapFooter">
        <button className="backButton" type="button" aria-label="戻る">‹</button>
        <button className="prepareButton" type="button" onClick={onNext}>⚔ 次ノード選択 <span>{STAGES[game.stageIndex].name}へ進みます</span></button>
      </footer>
    </section>
  );
}

function DebtGauge({ debt, previewDebt = debt }) {
  const state = getDebtState(debt);
  const marker = Math.min(100, (previewDebt / MAX_DEBT) * 100);
  return (
    <div className="debtBox">
      <div className="gaugeHead">
        <strong>借金危険度：{state.label}</strong>
        <span>{state.text}</span>
      </div>
      <div className="segmentedGauge">
        <span className="segmentBlue" />
        <span className="segmentYellow" />
        <span className="segmentRed" />
        <span className="segmentBlack" />
        <em style={{ left: `${marker}%` }} />
      </div>
    </div>
  );
}

function RewardScreen({ game, onChoose }) {
  const stage = STAGES[game.stageIndex];
  const debtState = getDebtState(game.totalDebt);
  const debtPercent = Math.min(100, (game.totalDebt / MAX_DEBT) * 100);
  const projectedFinal = game.totalProfit - game.totalDebt - game.totalInterest;
  const rewardStyles = [
    { rarity: "SSR", title: "高利の錬金術", tone: "gold", synergy: "相性：◎ 連鎖効果が大幅強化！" },
    { rarity: "SR", title: "暴走魔力の契約", tone: "purple", synergy: "相性：○ チェイン特化ビルドに最適！" },
    { rarity: "R", title: "利息先送り契約", tone: "blue", synergy: "相性：○ 生存重視の堅実ビルド！" },
  ];
  const ownedContracts = game.contracts.length ? game.contracts : CONTRACTS.slice(0, 5);

  return (
    <section className="rewardScreen">
      <header className="rewardTop">
        <div className="stageStack">
          <div><span>STAGE</span><strong>{game.stageIndex + 1}<em>/9</em></strong></div>
          <div><span>TURN</span><strong>{game.turn}</strong></div>
        </div>
        <div className="enemyPanel">
          <h1><span>{stage.type || "通常戦"}</span>{stage.name}</h1>
          <div className="enemyBar"><i style={{ width: `${Math.max(0, (game.enemyHp / stage.hp) * 100)}%` }} /></div>
          <strong>{formatMoney(game.enemyHp)} <em>/ {formatMoney(stage.hp)}</em></strong>
        </div>
        <div className="rewardHp">
          <span>PLAYER HP</span>
          <strong>{game.hp}<em>/ {PLAYER_MAX_HP}</em></strong>
          <div className="hpBar"><i style={{ width: `${Math.max(0, (game.hp / PLAYER_MAX_HP) * 100)}%` }} /></div>
        </div>
      </header>

      <section className="rewardTitle">
        <i />
        <h2>契約を選び取れ</h2>
        <p>この選択が、君の未来を決める。</p>
      </section>

      <section className="rewardCards">
        {game.rewards.map((contract, index) => {
          const style = rewardStyles[index] || rewardStyles[2];
          const parts = contract.text.split(" / ");
          return (
            <button className={`rewardCard ${style.tone}`} key={`${contract.id}-${index}`} type="button" onClick={() => onChoose(contract)}>
              <span className="newBadge">新規契約</span>
              <b>{style.rarity}</b>
              <div className="rewardIcon">{contract.icon}</div>
              <h3>{index === 0 ? style.title : contract.name}</h3>
              <p>{contract.text}</p>
              <dl>
                <div><dt>{parts[0] || "契約効果"}</dt><dd>{index === 2 ? "-30%" : "+40%"}</dd></div>
                <div><dt>{parts[1] || "追加効果"}</dt><dd>{index === 2 ? "+50%" : index === 1 ? "+15%" : "+25%"}</dd></div>
              </dl>
              <div className="synergy">
                {ownedContracts.slice(0, 2).map((owned, ownedIndex) => (
                  <span key={`${owned.id}-${ownedIndex}`}><i>{owned.icon}</i>{owned.name}</span>
                ))}
              </div>
              <small>{style.synergy}</small>
            </button>
          );
        })}
      </section>

      <section className="rewardQuestion">
        <strong>どの契約を選ぶ？</strong>
        <button type="button" onClick={() => onChoose(null)}>≫ スキップする <span>報酬を放棄する</span></button>
      </section>

      <section className="rewardBuild">
        <div className="contractShelf">
          <span>現在の契約シナジー</span>
          <div>
            {ownedContracts.slice(0, 5).map((contract, index) => (
              <i key={`${contract.id}-${index}`}><b>{contract.icon}</b>{contract.name}</i>
            ))}
          </div>
        </div>
        <div className="buildRadar">
          <span>現在のビルド傾向</span>
          <div className="radarShape" />
          <p>利益力 B / リスク S / 爆発力 B+</p>
        </div>
      </section>

      <section className="battleTotals rewardTotals">
        <div><span>現在利益</span><strong className="profitText">¥{formatMoney(game.totalProfit)}</strong><em>累積利益</em></div>
        <div><span>現在借金</span><strong className="debtText">¥{formatMoney(game.totalDebt)}</strong><em>返済予定</em></div>
        <div><span>予測最終利益</span><strong className={projectedFinal > 0 ? "profitText" : "debtText"}>¥{formatMoney(projectedFinal)}</strong><em>利益 - 借金 - 利息</em></div>
      </section>

      <section className="battleDebtRow rewardDebt">
        <div className="wideGauge">
          <strong>借金ゲージ</strong>
          <div className="segmentedGauge">
            <span className="segmentBlue" />
            <span className="segmentYellow" />
            <span className="segmentRed" />
            <span className="segmentBlack" />
            <em style={{ left: `${debtPercent}%` }} />
          </div>
          <div className="gaugeLabels"><span>安全</span><span>警戒</span><span>危険</span><span>限界</span></div>
        </div>
        <div className="interestRate"><span>状態</span><strong>{debtState.label}</strong><em>{debtState.text}</em></div>
      </section>
    </section>
  );
}

function InterimReportScreen({ game, onNext }) {
  const stage = STAGES[game.stageIndex];
  const debtState = getDebtState(game.totalDebt);
  const predictedFinal = game.totalProfit - game.totalDebt - game.totalInterest;
  const lastTurn = game.lastTurn || { profit: 0, debtGain: 0, damage: 0, enemyAttack: 0 };
  const isBossCollection = Boolean(stage.interestRate);
  const title = isBossCollection ? (stage.type === "中ボス" ? "中間徴収" : "利息徴収") : "中間精算予測";

  return (
    <section className="interimScreen">
      <header className="interimHero">
        <span>戦闘結果</span>
        <h2>{stage.name} 撃破</h2>
        <p>{isBossCollection ? "徴収は終わった。だが、未来の返済はまだ増えている。" : "勝った直後こそ、破産までの距離を見ろ。"}</p>
      </header>

      <section className="turnResultCards">
        <div><span>獲得利益</span><strong className="profitText">+ ¥{formatMoney(lastTurn.profit)}</strong></div>
        <div><span>増加借金</span><strong className="debtText">+ ¥{formatMoney(lastTurn.debtGain)}</strong></div>
        <div><span>与ダメージ</span><strong>{formatMoney(lastTurn.damage)}</strong></div>
      </section>

      <section className="interimLedger">
        <h3>{title}</h3>
        <div><span>現在利益</span><strong className="profitText">¥ {formatMoney(game.totalProfit)}</strong></div>
        <div><span>現在借金</span><strong className="debtText">¥ {formatMoney(game.totalDebt)}</strong></div>
        <div><span>現在利息</span><strong className="debtText">¥ {formatMoney(game.totalInterest)}</strong></div>
        <div><span>予測最終利益</span><strong className={predictedFinal > 0 ? "profitText" : "debtText"}>{predictedFinal < 0 ? "- " : ""}¥ {formatMoney(Math.abs(predictedFinal))}</strong></div>
      </section>

      <section className="interimDebt">
        <div className="wideGauge">
          <strong>借金危険度：{debtState.label}</strong>
          <div className="segmentedGauge">
            <span className="segmentBlue" />
            <span className="segmentYellow" />
            <span className="segmentRed" />
            <span className="segmentBlack" />
            <em style={{ left: `${Math.min(100, (game.totalDebt / MAX_DEBT) * 100)}%` }} />
          </div>
          <div className="gaugeLabels"><span>安全</span><span>警戒</span><span>危険</span><span>限界</span></div>
        </div>
        <p>今どれだけ破産へ近づいているか。次の契約で、まだ「あと1回」を買えるか？</p>
      </section>

      <footer className="interimActions">
        <button type="button" onClick={onNext}>契約を選ぶ <span>報酬3択へ進む</span></button>
      </footer>
    </section>
  );
}

function SettlementScreen({ settlement, onResult }) {
  const rawFinal = settlement.totalProfit - settlement.totalDebt - settlement.totalInterest;
  const contractBonus = settlement.finalProfit - rawFinal;
  const isClear = settlement.finalProfit > 0;
  const rows = [
    { label: "総利益", detail: "これまでに得た利益の合計", value: settlement.totalProfit, icon: "益", tone: "profit", sign: "" },
    { label: "利息徴収", detail: "借金に対する利息を徴収", value: -settlement.totalInterest, icon: "％", tone: "debt", sign: "-" },
    { label: "借金徴収", detail: "元本の返済を強制徴収", value: -settlement.totalDebt, icon: "徴", tone: "debt", sign: "-" },
    { label: "契約ボーナス", detail: "契約効果による精算ボーナス", value: contractBonus, icon: "契", tone: "bonus", sign: contractBonus >= 0 ? "+" : "-" },
  ];

  return (
    <section className={`settlementScreen ${isClear ? "isClear" : "isBankrupt"}`}>
      <div className="settlementDecor decorPaperLeft">魔力契約書<br />利息は全てあなたのものに</div>
      <div className="settlementDecor decorPaperRight">請求明細書<br />元本 / 利息 / 契約精算</div>

      <header className="settlementHero">
        <div className="settlementRing" />
        <h2>最終精算</h2>
        <p>さあ、魔力の借金を清算しよう。</p>
      </header>

      <section className="settlementLedger">
        {rows.map((row) => (
          <div className={`ledgerRow ${row.tone}`} key={row.label}>
            <i>{row.icon}</i>
            <div>
              <strong>{row.label}</strong>
              <span>{row.detail}</span>
            </div>
            <b>{row.sign}{row.value < 0 ? `¥ ${formatMoney(Math.abs(row.value))}` : `¥ ${formatMoney(row.value)}`}</b>
          </div>
        ))}
        <div className="finalProfitBox">
          <div>
            <strong>最終利益</strong>
            <span>すべてを精算した君の手元に残る金額</span>
          </div>
          <b>{settlement.finalProfit < 0 ? "- " : ""}¥ {formatMoney(Math.abs(settlement.finalProfit))}</b>
          <em>{isClear ? "生き残れた…！" : "返済不能…"}</em>
        </div>
      </section>

      <section className="judgementCards">
        <div className={`judgementCard clearCard ${isClear ? "active" : ""}`}>
          <strong>CLEAR</strong>
          <span>生還成功！</span>
          <i>♕</i>
        </div>
        <div className={`judgementCard bankruptCard ${!isClear ? "active" : ""}`}>
          <strong>BANKRUPT</strong>
          <span>完全破産…</span>
          <i>✕</i>
        </div>
      </section>

      <p className="settlementTagline">
        魔力は貸すもの、返すのは未来のあなた。<br />
        <b>次は、もっと欲張ってみる？</b>
      </p>

      <footer className="settlementActions singleAction">
        <button className="retryAction" type="button" onClick={onResult}>リザルトへ進む</button>
      </footer>
    </section>
  );
}

function ResultScreen({ game, onRetry, onTitle }) {
  const character = CHARACTERS.find((item) => item.id === game.characterId) || CHARACTERS[0];
  const finalProfit = game.settlement?.finalProfit ?? (game.totalProfit - game.totalDebt - game.totalInterest);
  const isClear = game.result === "clear";
  const reachedStage = Math.min(STAGES.length, game.stageIndex + 1);
  const summaryRows = [
    ["総利益", `+ ¥${formatMoney(game.settlement?.totalProfit ?? game.totalProfit)}`],
    ["利息徴収", `- ¥${formatMoney(game.settlement?.totalInterest ?? game.totalInterest)}`],
    ["借金徴収", `- ¥${formatMoney(game.settlement?.totalDebt ?? game.totalDebt)}`],
    ["契約ボーナス", `+ ¥${formatMoney(Math.max(0, finalProfit - ((game.settlement?.totalProfit ?? game.totalProfit) - (game.settlement?.totalDebt ?? game.totalDebt) - (game.settlement?.totalInterest ?? game.totalInterest))))}`],
  ];
  const displayedContracts = game.contracts.length ? game.contracts : CONTRACTS.slice(0, 6);

  return (
    <section className={`resultScreen ${isClear ? "isClear" : "isBankrupt"}`}>
      <header className="resultHero">
        <div className="resultFigure" />
        <div className="resultTitle">
          <h2>RESULT</h2>
          <p>今回の精算結果</p>
        </div>
        <div className="resultProfitCard">
          <span>最終利益</span>
          <strong>{finalProfit < 0 ? "- " : ""}¥ {formatMoney(Math.abs(finalProfit))}</strong>
          <em>{isClear ? "生還成功！" : game.result === "battleDefeat" ? "戦闘敗北…" : "完全破産…"}</em>
        </div>
        <div className="resultCharacter">
          <small>使用キャラ</small>
          <strong>{character.name}<em>{character.en}</em></strong>
          <span>{character.risk}</span>
        </div>
      </header>

      <section className="recordCards">
        <div>
          <span>最大チェイン</span>
          <strong>{game.maxChain}<em>CHAIN</em></strong>
          <b>NEW RECORD!</b>
        </div>
        <div className="debtRecord">
          <span>最大借金</span>
          <strong>¥ {formatMoney(game.maxDebt)}</strong>
          <b>NEW RECORD!</b>
        </div>
        <div>
          <span>到達ステージ</span>
          <strong>{reachedStage}<em>/ 9</em></strong>
          <b>{reachedStage >= 9 ? "COMPLETE!" : "TRY AGAIN!"}</b>
        </div>
      </section>

      <section className="resultContracts">
        <h3>契約一覧</h3>
        <div>
          {displayedContracts.slice(0, 10).map((contract, index) => (
            <span key={`${contract.id}-${index}`}><i>{contract.icon}</i>{contract.name}<b>Lv.{(index % 4) + 1}</b></span>
          ))}
        </div>
      </section>

      <section className="routePanel">
        <h3>到達ルート</h3>
        <div>
          {STAGES.map((stageItem, index) => (
            <span className={`${index <= game.stageIndex ? "reached" : ""} ${stageItem.final ? "final" : ""}`} key={stageItem.name}>
              <i>{index + 1}</i>
              <b>{stageItem.name}</b>
            </span>
          ))}
        </div>
      </section>

      <section className="resultBottom">
        <div className="resultSummary">
          <h3>精算サマリー</h3>
          {summaryRows.map(([label, value]) => (
            <p key={label}><span>{label}</span><strong>{value}</strong></p>
          ))}
          <p><span>結果</span><strong>{isClear ? "クリア" : game.result === "battleDefeat" ? "戦闘敗北" : "破産"}</strong></p>
          <p><span>契約数</span><strong>{game.contracts.length}</strong></p>
          <p><span>使用キャラ</span><strong>{character.name}</strong></p>
          <b>最終利益 <em>{finalProfit < 0 ? "- " : ""}¥ {formatMoney(Math.abs(finalProfit))}</em></b>
        </div>
        <div className="rewardBox">
          <h3>獲得報酬</h3>
          <div>
            <span>◇<b>×320</b></span>
            <span>￥<b>×{formatMoney(Math.max(0, game.totalProfit))}</b></span>
            <span>契<b>×{game.contracts.length}</b></span>
            <span>冠<b>×{isClear ? 1 : 0}</b></span>
          </div>
        </div>
      </section>

      <footer className="resultActions">
        <button type="button">リザルト詳細</button>
        <button className="retryAction" type="button" onClick={onRetry}>再挑戦する</button>
        <button type="button" onClick={onTitle}>タイトルに戻る</button>
      </footer>

      <p className="resultTagline">借金は、コントロールするほど力になる。次は、<b>もっと欲張ろう！</b></p>
    </section>
  );
}

export default function App() {
  const [game, setGame] = useState(() => initialGame());
  const boardRef = useRef(null);
  const stage = STAGES[game.stageIndex];
  const selectedKeys = new Set(game.path.map(keyOf));
  const preview = calculateTurn(game, game.path.length);
  const previewDebt = Math.min(MAX_DEBT, game.totalDebt + preview.debtGain);
  const projectedFinal = game.totalProfit + preview.profit - previewDebt - game.totalInterest;
  const character = CHARACTERS.find((item) => item.id === game.characterId);
  const contractList = useMemo(() => {
    if (game.contracts.length === 0) return "なし";
    return game.contracts.map((contract) => contract.name).join(" / ");
  }, [game.contracts]);

  const reset = () => setGame(initialGame());
  const retry = () => setGame({ ...initialGame(), screen: "character" });

  const moveToCell = (clientX, clientY) => {
    const board = boardRef.current;
    if (!board) return null;
    const element = document.elementFromPoint(clientX, clientY);
    const cell = element?.closest?.("[data-row][data-col]");
    if (!cell || !board.contains(cell)) return null;
    return { row: Number(cell.dataset.row), col: Number(cell.dataset.col) };
  };

  const addCell = (cell) => {
    if (!cell) return;
    setGame((current) => {
      if (current.screen !== "battle") return current;
      const piece = current.board[cell.row][cell.col];
      if (piece === "curse") return current;
      const exists = current.path.some((item) => keyOf(item) === keyOf(cell));
      if (exists) return current;
      if (current.path.length === 0) return { ...current, path: [cell], dragging: true };
      const first = current.board[current.path[0].row][current.path[0].col];
      const last = current.path[current.path.length - 1];
      if (piece !== first || !isNeighbor(last, cell)) return current;
      return { ...current, path: [...current.path, cell], dragging: true };
    });
  };

  const processInterest = (current, board, profit, debt, rate) => {
    const debtState = getDebtState(debt);
    const stateMultiplier = debtState.id === "black" ? 1.5 : debtState.id === "yellow" ? 1.1 : 1;
    const interest = Math.round(debt * (rate + current.interestPenalty) * stateMultiplier);
    const refund = Math.round(interest * 0.2 * countContract(effectiveContracts(current), "interestRefund"));
    let nextProfit = profit - interest + refund;
    let nextDebt = debt;
    let overdue = current.overdue;
    let penalty = current.interestPenalty;
    let nextBoard = board;
    let curseCount = current.curseCount;
    let note = `利息 ${formatMoney(interest)} 徴収。`;

    if (profit < interest) {
      const shortage = interest - profit;
      nextProfit = refund;
      nextDebt = Math.min(MAX_DEBT, debt + shortage);
      overdue = true;
      penalty += 0.1;
      curseCount += 3;
      nextBoard = addCursePieces(board, 3);
      note = `延滞。利息不足 ${formatMoney(shortage)} を借金化、呪いピース追加。`;
    }

    return { profit: nextProfit, debt: nextDebt, interest, overdue, penalty, board: nextBoard, curseCount, note };
  };

  const finishChain = () => {
    setGame((current) => {
      if (current.screen !== "battle" || current.path.length < 3) {
        return { ...current, path: [], dragging: false, message: "3個以上で成立。もう少し欲張れる。" };
      }

      const result = calculateTurn(current, current.path.length);
      const clearedBoard = applyGravity(current.board, current.path);
      let totalProfit = current.totalProfit + result.profit;
      let totalDebt = Math.min(MAX_DEBT, current.totalDebt + result.debtGain);
      let hp = Math.min(PLAYER_MAX_HP, current.hp + result.heal - result.lifeCost);
      const enemyHp = Math.max(0, current.enemyHp - result.damage);
      const maxChain = Math.max(current.maxChain, current.path.length);
      let nextProfitBoost = false;
      let message = `${current.path.length}チェイン。利益 ${formatMoney(result.profit)}、借金 +${formatMoney(result.debtGain)}。`;

      if (current.characterId === "lust" && current.path.length >= 10) {
        nextProfitBoost = true;
        message += " 色欲が次ターン利益を倍化。";
      }

      if (enemyHp <= 0) {
        if (stage.final) {
          const finalMultiplier = 1 + countContract(effectiveContracts(current), "greedDeal") * 0.3;
          const finalProfit = Math.round((totalProfit - totalDebt - current.totalInterest) * finalMultiplier);
          return {
            ...current,
            board: clearedBoard,
            path: [],
            dragging: false,
            enemyHp: 0,
            hp,
            totalProfit,
            totalDebt,
            maxDebt: Math.max(current.maxDebt, totalDebt),
            maxChain,
            nextProfitBoost: false,
            screen: "settlement",
            settlement: { totalProfit, totalDebt, totalInterest: current.totalInterest, finalProfit },
            result: finalProfit > 0 ? "clear" : "bankrupt",
            lastTurn: result,
            message: "徴収王撃破。未来に押し付けた欲望の答え合わせ。",
          };
        }

        let interestResult = null;
        let nextBoard = clearedBoard;
        let totalInterest = current.totalInterest;
        let overdue = current.overdue;
        let interestPenalty = current.interestPenalty;
        let curseCount = current.curseCount;

        if (stage.interestRate) {
          interestResult = processInterest(current, clearedBoard, totalProfit, totalDebt, stage.interestRate);
          totalProfit = interestResult.profit;
          totalDebt = interestResult.debt;
          totalInterest += interestResult.interest;
          overdue = interestResult.overdue;
          interestPenalty = interestResult.penalty;
          nextBoard = interestResult.board;
          curseCount = interestResult.curseCount;
          message = interestResult.note;
        }

        return {
          ...current,
          board: nextBoard,
          path: [],
          dragging: false,
          enemyHp: 0,
          hp,
          totalProfit,
          totalDebt,
          totalInterest,
          maxDebt: Math.max(current.maxDebt, totalDebt),
          maxChain,
          overdue,
          interestPenalty,
          curseCount,
          nextProfitBoost,
          screen: "interim",
          rewards: randomRewards(),
          lastTurn: result,
          message: `${stage.name}を撃破。${message}`,
        };
      }

      const debtState = getDebtState(totalDebt);
      const enemyAttack = Math.round(stage.attack * (debtState.id === "red" ? 1.2 : 1));
      hp = Math.max(0, hp - enemyAttack);
      const noDamageTurns = enemyAttack > 0 ? 0 : current.noDamageTurns + 1;

      if (hp <= 0) {
        return {
          ...current,
          board: clearedBoard,
          path: [],
          dragging: false,
          hp: 0,
          enemyHp,
          totalProfit,
          totalDebt,
          maxDebt: Math.max(current.maxDebt, totalDebt),
          maxChain,
          screen: "result",
          result: "battleDefeat",
          lastTurn: result,
          message: "欲張り切る前に倒れた。",
        };
      }

      return {
        ...current,
        board: clearedBoard,
        path: [],
        dragging: false,
        hp,
        enemyHp,
        totalProfit,
        totalDebt,
        maxDebt: Math.max(current.maxDebt, totalDebt),
        maxChain,
        turn: current.turn + 1,
        nextProfitBoost,
        noDamageTurns,
        lastTurn: { ...result, enemyAttack },
        message: `${message} 敵攻撃 ${enemyAttack}。まだ助かる。`,
      };
    });
  };

  const chooseReward = (contract) => {
    setGame((current) => {
      const nextStageIndex = current.stageIndex + 1;
      return {
        ...current,
        contracts: contract ? [...current.contracts, contract] : current.contracts,
        stageIndex: nextStageIndex,
        enemyHp: STAGES[nextStageIndex].hp,
        rewards: [],
        screen: "map",
        message: contract ? `${contract.name}を契約。今回だけは行ける。` : "契約を見送った。身軽だが、上振れも逃した。",
      };
    });
  };

  const debtState = getDebtState(game.totalDebt);
  const chainPiece = game.path[0] ? getPiece(game.board[game.path[0].row][game.path[0].col]) : null;
  const threshold = nextThreshold(game.path.length);
  const enemyHpPercent = Math.max(0, (game.enemyHp / stage.hp) * 100);
  const hpPercent = Math.max(0, (game.hp / PLAYER_MAX_HP) * 100);
  const debtPercent = Math.min(100, (game.totalDebt / MAX_DEBT) * 100);
  const dangerLabel = debtState.id === "blue" ? "安全" : debtState.id === "yellow" ? "警戒" : debtState.id === "red" ? "危険域" : "限界";
  const nextThresholdLabel = threshold ? `${threshold}チェイン` : "上限到達";
  const bonusRows = [
    { label: "3〜5", multiplier: "× 1.0", active: game.path.length >= 3 && game.path.length <= 5 },
    { label: "6〜7", multiplier: "× 1.3", active: game.path.length >= 6 && game.path.length <= 7 },
    { label: "8〜9", multiplier: "× 1.6", active: game.path.length >= 8 && game.path.length <= 9 },
    { label: "10〜11", multiplier: "× 2.0", active: game.path.length >= 10 && game.path.length <= 11 },
    { label: "12〜", multiplier: "× 2.8", active: game.path.length >= 12 },
  ];

  return (
    <main className={`app debt-${debtState.id}`}>
      <section className="phone">
        {game.screen === "home" && <TitleScreen onStart={() => setGame((current) => ({ ...current, screen: "character" }))} />}
        {game.screen === "character" && (
          <CharacterSelect
            selectedId={game.characterId}
            onSelect={(characterId) => setGame((current) => ({ ...current, characterId }))}
            onNext={() => setGame((current) => ({ ...current, screen: "map" }))}
          />
        )}
        {game.screen === "map" && <MapScreen game={game} onNext={() => setGame((current) => ({ ...current, screen: "battle" }))} />}

        {game.screen === "battle" && (
          <section className="battleScreen">
            <header className="battleHeader">
              <div className="stageStack">
                <div><span>STAGE</span><strong>{game.stageIndex + 1}<em>/9</em></strong></div>
                <div><span>TURN</span><strong>{game.turn}</strong></div>
              </div>
              <div className="enemyPanel">
                <h1><span>{stage.type || "通常戦"}</span>{stage.name}</h1>
                <div className="enemyBar"><i style={{ width: `${enemyHpPercent}%` }} /></div>
                <strong>{formatMoney(game.enemyHp)} <em>/ {formatMoney(stage.hp)}</em></strong>
              </div>
              <div className="playerPanel">
                <button type="button">☰ メニュー</button>
                <span>PLAYER HP</span>
                <strong>{game.hp}<em>/ {PLAYER_MAX_HP}</em></strong>
                <div className="hpBar"><i style={{ width: `${hpPercent}%` }} /></div>
              </div>
            </header>

            <section className="battleHero">
              <DebtGauge debt={game.totalDebt} previewDebt={previewDebt} />
              <div className="battleFigure" aria-hidden="true">
                <span />
                <i />
              </div>
              <div className="speechBubble">もっと借りて、<br />もっと強くなろうぜ？</div>
              <div className="temptationCard">
                <small>{threshold ? `あと ${threshold - game.path.length} 個で` : "快楽上限"}</small>
                <strong>{threshold ? `${threshold}チェイン` : "12チェイン超え"}</strong>
                <span>{threshold ? "ボーナス！" : "未来が燃える。"}</span>
              </div>
              <div className="previewCard">
                <span>予測チェイン</span>
                <strong>{game.path.length}<em>CHAIN</em></strong>
                <dl>
                  <div><dt>予測利益</dt><dd className="profitText">+{formatMoney(preview.profit)}</dd></div>
                  <div><dt>予測借金</dt><dd className="debtText">+{formatMoney(preview.debtGain)}</dd></div>
                  <div><dt>予測最終利益</dt><dd className={projectedFinal > 0 ? "profitText" : "debtText"}>{formatMoney(projectedFinal)}</dd></div>
                </dl>
              </div>
            </section>

            <section className="puzzleZone">
              <aside className="bonusLadder">
                <strong>チェイン<br />ボーナス</strong>
                {bonusRows.map((row) => (
                  <span className={row.active ? "active" : ""} key={row.label}>{row.label}<b>{row.multiplier}</b></span>
                ))}
              </aside>
              <section className="board" ref={boardRef} onPointerMove={(event) => game.dragging && addCell(moveToCell(event.clientX, event.clientY))} onPointerUp={finishChain} onPointerCancel={finishChain}>
                {game.board.map((row, rowIndex) =>
                  row.map((piece, colIndex) => {
                    const meta = getPiece(piece);
                    const key = `${rowIndex}-${colIndex}`;
                    const order = game.path.findIndex((cell) => keyOf(cell) === key);
                    return (
                      <button
                        className={`piece ${piece === "curse" ? "curse" : ""} ${selectedKeys.has(key) ? "selected" : ""}`}
                        data-row={rowIndex}
                        data-col={colIndex}
                        key={key}
                        onPointerDown={(event) => {
                          event.preventDefault();
                          event.currentTarget.setPointerCapture?.(event.pointerId);
                          addCell({ row: rowIndex, col: colIndex });
                        }}
                        style={{ "--piece-color": meta.color }}
                        type="button"
                      >
                        <span>{meta.label}</span>
                        {order >= 0 && <em>{order + 1}</em>}
                      </button>
                    );
                  })
                )}
              </section>
              <aside className="chainSide">
                <div><span>次の閾値</span><strong>{nextThresholdLabel}</strong></div>
                <div><span>現在チェイン</span><strong>{game.path.length}<em>CHAIN</em></strong></div>
                <button type="button" onClick={reset}>↻ リセット</button>
              </aside>
            </section>

            <section className="battleTotals">
              <div><span>現在利益</span><strong className="profitText">¥{formatMoney(game.totalProfit)}</strong><em>+{formatMoney(preview.profit)}</em></div>
              <div><span>現在借金</span><strong className="debtText">¥{formatMoney(game.totalDebt)}</strong><em>+{formatMoney(preview.debtGain)}</em></div>
              <div><span>予測最終利益</span><strong className={projectedFinal > 0 ? "profitText" : "debtText"}>¥{formatMoney(projectedFinal)}</strong><em>利益 {formatMoney(game.totalProfit)} - 借金 {formatMoney(game.totalDebt)}</em></div>
            </section>

            <section className="battleDebtRow">
              <div className="wideGauge">
                <strong>借金ゲージ</strong>
                <div className="segmentedGauge">
                  <span className="segmentBlue" />
                  <span className="segmentYellow" />
                  <span className="segmentRed" />
                  <span className="segmentBlack" />
                  <em style={{ left: `${Math.min(100, (previewDebt / MAX_DEBT) * 100)}%` }} />
                </div>
                <div className="gaugeLabels"><span>安全</span><span>警戒</span><span>危険</span><span>限界</span></div>
              </div>
              <div className="interestRate"><span>危険度</span><strong>{dangerLabel}</strong><em>{debtPercent.toFixed(0)}%</em></div>
            </section>

            <footer className="battleFooter">
              <div className="contractShelf">
                <span>所持契約</span>
                <div>
                  {(game.contracts.length ? game.contracts : CONTRACTS.slice(0, 6)).slice(0, 6).map((contract, index) => (
                    <i key={`${contract.id}-${index}`}><b>{contract.icon}</b>{contract.name}</i>
                  ))}
                </div>
              </div>
              <button className="endTurnButton" type="button" onClick={finishChain}>⚔ ターン終了 <span>チェイン確定</span></button>
            </footer>
            <div className="battleMessage">{game.message}</div>
          </section>
        )}

        {game.screen === "interim" && <InterimReportScreen game={game} onNext={() => setGame((current) => ({ ...current, screen: "reward" }))} />}
        {game.screen === "reward" && <RewardScreen game={game} onChoose={chooseReward} />}
        {game.screen === "settlement" && <SettlementScreen settlement={game.settlement} onResult={() => setGame((current) => ({ ...current, screen: "result" }))} />}
        {game.screen === "result" && <ResultScreen game={game} onRetry={retry} onTitle={reset} />}
      </section>
    </main>
  );
}
