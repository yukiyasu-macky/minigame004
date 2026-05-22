import { useMemo, useRef, useState } from "react";
import "./App.css";

const BOARD_SIZE = 6;
const PIECE_TYPES = [
  { id: "ruby", label: "R", color: "#ef4444" },
  { id: "coin", label: "G", color: "#f59e0b" },
  { id: "aqua", label: "B", color: "#06b6d4" },
  { id: "jade", label: "J", color: "#22c55e" },
  { id: "violet", label: "V", color: "#8b5cf6" },
];

const MAX_DEBT = 5000;
const PLAYER_MAX_HP = 260;

const BALANCE = {
  enemyMultiplier: 10,
  contractMultiplier: 1,
  debtRiskMultiplier: 1,
  contractDebtMultiplier: 1,
  attackMultiplier: 0.2,
};

const STAGES = [
  { name: "通常戦1", type: "通常戦", hp: 300, attack: 20 },
  { name: "小ボス", type: "利息10%", hp: 600, attack: 35, interestRate: 0.1 },
  { name: "通常戦2", type: "通常戦", hp: 500, attack: 30 },
  { name: "中ボス", type: "利息25%", hp: 1000, attack: 50, interestRate: 0.25 },
  { name: "通常戦3", type: "通常戦", hp: 800, attack: 45 },
  { name: "ラスボス", type: "最終精算", hp: 1800, attack: 70, final: true },
];

const CHARACTERS = {
  greed: {
    name: "強欲",
    description: "利益 +30% / 借金 +20%",
    profitMultiplier: 1.3,
    debtMultiplier: 1.2,
  },
};

const CONTRACTS = [
  {
    id: "loanShark",
    name: "高利貸し",
    text: "利益 +50% / 借金 +30%",
  },
  {
    id: "runawayMana",
    name: "暴走魔力",
    text: "借金80%以上で利益 +100%",
  },
  {
    id: "lifeCut",
    name: "命削り",
    text: "毎ターンHP -5 / 利益 +50%",
  },
  {
    id: "interestRefund",
    name: "利息還元",
    text: "支払利息の20%を利益に変換",
  },
  {
    id: "lazyDeal",
    name: "怠惰契約",
    text: "5チェイン以下で利益 +50%",
  },
  {
    id: "darkFinance",
    name: "闇金融",
    text: "借金4000以上でダメージ +200%",
  },
];

const makePiece = () => PIECE_TYPES[Math.floor(Math.random() * PIECE_TYPES.length)].id;

const makeBoard = () => {
  const board = Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => makePiece())
  );
  const guaranteedPiece = makePiece();
  board[0][0] = guaranteedPiece;
  board[0][1] = guaranteedPiece;
  board[0][2] = guaranteedPiece;

  return board;
};

const getPieceMeta = (id) => PIECE_TYPES.find((piece) => piece.id === id);

const coordKey = ({ row, col }) => `${row}-${col}`;

const areNeighbors = (a, b) =>
  Math.max(Math.abs(a.row - b.row), Math.abs(a.col - b.col)) === 1;

const getDebtState = (debt) => {
  const ratio = Math.min(1, Math.max(0, debt / MAX_DEBT));

  if (ratio > 0.8) {
    return {
      id: "black",
      label: "黒",
      color: "#111827",
      description: "利益2倍 / 利息+50%",
      profitMultiplier: 2,
      interestMultiplier: 1.5,
      enemyAttackMultiplier: 1,
    };
  }

  if (ratio > 0.5) {
    return {
      id: "red",
      label: "赤",
      color: "#dc2626",
      description: "敵攻撃+20%",
      profitMultiplier: 1,
      interestMultiplier: 1,
      enemyAttackMultiplier: 1.2,
    };
  }

  if (ratio > 0.25) {
    return {
      id: "yellow",
      label: "黄",
      color: "#facc15",
      description: "利息+10%",
      profitMultiplier: 1,
      interestMultiplier: 1.1,
      enemyAttackMultiplier: 1,
    };
  }

  return {
    id: "blue",
    label: "青",
    color: "#2563eb",
    description: "通常",
    profitMultiplier: 1,
    interestMultiplier: 1,
    enemyAttackMultiplier: 1,
  };
};

const getThresholdBonus = (chain) => {
  if (chain >= 12) return 2.8;
  if (chain >= 10) return 2;
  if (chain >= 8) return 1.6;
  if (chain >= 6) return 1.3;
  return 1;
};

const getNextThreshold = (chain) => [6, 8, 10, 12].find((value) => chain < value);

const hasContract = (contracts, id) => contracts.some((contract) => contract.id === id);

const calculateTurn = ({ chain, totalDebt, contracts }) => {
  if (chain < 3) {
    return { profit: 0, debtGain: 0, damage: 0, thresholdBonus: 1 };
  }

  const debtState = getDebtState(totalDebt);
  const character = CHARACTERS.greed;
  const thresholdBonus = getThresholdBonus(chain);
  let profitMultiplier =
    BALANCE.contractMultiplier *
    debtState.profitMultiplier *
    character.profitMultiplier *
    thresholdBonus;
  let debtMultiplier =
    BALANCE.debtRiskMultiplier *
    BALANCE.contractDebtMultiplier *
    character.debtMultiplier;
  let attackMultiplier = BALANCE.attackMultiplier;

  if (hasContract(contracts, "loanShark")) {
    profitMultiplier *= 1.5;
    debtMultiplier *= 1.3;
  }

  if (hasContract(contracts, "runawayMana") && totalDebt >= MAX_DEBT * 0.8) {
    profitMultiplier *= 2;
  }

  if (hasContract(contracts, "lifeCut")) {
    profitMultiplier *= 1.5;
  }

  if (hasContract(contracts, "lazyDeal") && chain <= 5) {
    profitMultiplier *= 1.5;
  }

  if (hasContract(contracts, "darkFinance") && totalDebt >= 4000) {
    attackMultiplier *= 3;
  }

  const profit = Math.round(chain ** 2 * BALANCE.enemyMultiplier * profitMultiplier);
  const debtGain = Math.round(chain ** 3 * debtMultiplier);
  const damage = Math.round(profit * attackMultiplier);

  return { profit, debtGain, damage, thresholdBonus };
};

const applyGravity = (board, path) => {
  const removeSet = new Set(path.map(coordKey));
  const nextBoard = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

  for (let col = 0; col < BOARD_SIZE; col += 1) {
    const kept = [];

    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      if (!removeSet.has(`${row}-${col}`)) {
        kept.push(board[row][col]);
      }
    }

    for (let row = BOARD_SIZE - 1; row >= 0; row -= 1) {
      nextBoard[row][col] = kept[BOARD_SIZE - 1 - row] || makePiece();
    }
  }

  return nextBoard;
};

const chooseContracts = (ownedContracts) => {
  const ownedIds = new Set(ownedContracts.map((contract) => contract.id));
  const pool = CONTRACTS.filter((contract) => !ownedIds.has(contract.id));
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
};

const formatMoney = (value) => value.toLocaleString("ja-JP");

const initialGame = () => ({
  board: makeBoard(),
  selectedPath: [],
  isDragging: false,
  stageIndex: 0,
  enemyHp: STAGES[0].hp,
  playerHp: PLAYER_MAX_HP,
  totalProfit: 0,
  totalDebt: 0,
  contracts: [],
  contractChoices: [],
  phase: "battle",
  message: "同じ色を3つ以上なぞって利益を出そう。",
  lastTurn: null,
  settlement: null,
});

export default function App() {
  const [game, setGame] = useState(() => initialGame());
  const boardRef = useRef(null);
  const currentStage = STAGES[game.stageIndex];
  const debtState = getDebtState(game.totalDebt);
  const preview = calculateTurn({
    chain: game.selectedPath.length,
    totalDebt: game.totalDebt,
    contracts: game.contracts,
  });
  const predictedDebt = game.totalDebt + preview.debtGain;
  const predictedDebtState = getDebtState(predictedDebt);
  const nextThreshold = getNextThreshold(game.selectedPath.length);
  const chainPiece = game.selectedPath[0]
    ? getPieceMeta(game.board[game.selectedPath[0].row][game.selectedPath[0].col])
    : null;

  const contractSummary = useMemo(
    () => game.contracts.map((contract) => contract.name).join(" / ") || "なし",
    [game.contracts]
  );

  const resetGame = () => setGame(initialGame());

  const getCellFromPoint = (clientX, clientY) => {
    const board = boardRef.current;
    if (!board) return null;

    const element = document.elementFromPoint(clientX, clientY);
    const cell = element?.closest?.("[data-row][data-col]");

    if (!cell || !board.contains(cell)) return null;

    return {
      row: Number(cell.dataset.row),
      col: Number(cell.dataset.col),
    };
  };

  const addCellToPath = (cell) => {
    if (!cell || game.phase !== "battle") return;

    setGame((current) => {
      const piece = current.board[cell.row][cell.col];
      const path = current.selectedPath;
      const alreadySelected = path.some((selected) => coordKey(selected) === coordKey(cell));

      if (alreadySelected) return current;

      if (path.length === 0) {
        return { ...current, selectedPath: [cell], isDragging: true };
      }

      const firstPiece = current.board[path[0].row][path[0].col];
      const lastCell = path[path.length - 1];

      if (piece !== firstPiece || !areNeighbors(lastCell, cell)) {
        return current;
      }

      return { ...current, selectedPath: [...path, cell], isDragging: true };
    });
  };

  const resolveEnemyDefeat = (current, nextEnemyHp, nextProfit, nextDebt, turnResult) => {
    const stage = STAGES[current.stageIndex];

    if (nextEnemyHp > 0) {
      const attack = Math.round(stage.attack * getDebtState(nextDebt).enemyAttackMultiplier);
      const lifeCost = hasContract(current.contracts, "lifeCut") ? 5 : 0;
      const nextPlayerHp = Math.max(0, current.playerHp - attack - lifeCost);

      if (nextPlayerHp <= 0) {
        return {
          ...current,
          board: applyGravity(current.board, current.selectedPath),
          selectedPath: [],
          isDragging: false,
          enemyHp: nextEnemyHp,
          playerHp: 0,
          totalProfit: nextProfit,
          totalDebt: nextDebt,
          lastTurn: { ...turnResult, enemyAttack: attack, lifeCost },
          phase: "defeat",
          message: `敵の攻撃 ${attack} と契約代償 ${lifeCost}。HPが尽きた。`,
        };
      }

      return {
        ...current,
        board: applyGravity(current.board, current.selectedPath),
        selectedPath: [],
        isDragging: false,
        enemyHp: nextEnemyHp,
        playerHp: nextPlayerHp,
        totalProfit: nextProfit,
        totalDebt: nextDebt,
        lastTurn: { ...turnResult, enemyAttack: attack, lifeCost },
        message: `利益 ${formatMoney(turnResult.profit)} / 借金 +${formatMoney(turnResult.debtGain)}。敵の反撃 ${attack}。`,
      };
    }

    if (stage.final) {
      const finalInterest = Math.round(nextDebt * 0.35 * getDebtState(nextDebt).interestMultiplier);
      const finalProfit = nextProfit - finalInterest - nextDebt;

      return {
        ...current,
        board: applyGravity(current.board, current.selectedPath),
        selectedPath: [],
        isDragging: false,
        enemyHp: 0,
        totalProfit: nextProfit,
        totalDebt: nextDebt,
        lastTurn: turnResult,
        phase: "settlement",
        settlement: {
          grossProfit: nextProfit,
          finalInterest,
          totalDebt: nextDebt,
          finalProfit,
        },
        message: "ラスボス撃破。最終精算へ。",
      };
    }

    let interest = 0;
    let refund = 0;
    let message = `${stage.name}を撃破。契約を1つ選べる。`;

    if (stage.interestRate) {
      interest = Math.round(nextDebt * stage.interestRate * getDebtState(nextDebt).interestMultiplier);
      refund = hasContract(current.contracts, "interestRefund") ? Math.round(interest * 0.2) : 0;
      nextProfit = nextProfit - interest + refund;
      message = `${stage.name}撃破。利息 ${formatMoney(interest)} 徴収${refund ? ` / 還元 ${formatMoney(refund)}` : ""}。`;
    }

    return {
      ...current,
      board: applyGravity(current.board, current.selectedPath),
      selectedPath: [],
      isDragging: false,
      enemyHp: 0,
      totalProfit: nextProfit,
      totalDebt: nextDebt,
      lastTurn: { ...turnResult, interest, refund },
      phase: "contract",
      contractChoices: chooseContracts(current.contracts),
      message,
    };
  };

  const finishChain = () => {
    setGame((current) => {
      if (current.phase !== "battle" || current.selectedPath.length < 3) {
        return {
          ...current,
          selectedPath: [],
          isDragging: false,
          message: "3個以上つなぐと成立。もう一度狙おう。",
        };
      }

      const result = calculateTurn({
        chain: current.selectedPath.length,
        totalDebt: current.totalDebt,
        contracts: current.contracts,
      });
      const nextProfit = current.totalProfit + result.profit;
      const nextDebt = Math.min(MAX_DEBT, current.totalDebt + result.debtGain);
      const nextEnemyHp = Math.max(0, current.enemyHp - result.damage);

      return resolveEnemyDefeat(current, nextEnemyHp, nextProfit, nextDebt, {
        ...result,
        chain: current.selectedPath.length,
      });
    });
  };

  const handlePointerDown = (event) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    addCellToPath({ row: Number(event.currentTarget.dataset.row), col: Number(event.currentTarget.dataset.col) });
  };

  const handlePointerMove = (event) => {
    if (!game.isDragging) return;
    event.preventDefault();
    addCellToPath(getCellFromPoint(event.clientX, event.clientY));
  };

  const handlePointerUp = (event) => {
    finishChain();
  };

  const chooseContract = (contract) => {
    setGame((current) => {
      const nextStageIndex = current.stageIndex + 1;
      const nextStage = STAGES[nextStageIndex];

      return {
        ...current,
        stageIndex: nextStageIndex,
        enemyHp: nextStage.hp,
        contracts: [...current.contracts, contract],
        contractChoices: [],
        phase: "battle",
        message: `${contract.name}を契約。${nextStage.name}へ進行。`,
      };
    });
  };

  const skipContract = () => {
    setGame((current) => {
      const nextStageIndex = current.stageIndex + 1;
      const nextStage = STAGES[nextStageIndex];

      return {
        ...current,
        stageIndex: nextStageIndex,
        enemyHp: nextStage.hp,
        contractChoices: [],
        phase: "battle",
        message: `${nextStage.name}へ進行。`,
      };
    });
  };

  const selectedKeys = new Set(game.selectedPath.map(coordKey));
  const debtPercent = Math.min(100, (game.totalDebt / MAX_DEBT) * 100);
  const predictedDebtPercent = Math.min(100, (predictedDebt / MAX_DEBT) * 100);
  const enemyHpPercent = Math.max(0, (game.enemyHp / currentStage.hp) * 100);
  const playerHpPercent = Math.max(0, (game.playerHp / PLAYER_MAX_HP) * 100);

  return (
    <main className={`app debt-${debtState.id}`}>
      <section className="phone">
        <header className="topHud">
          <div>
            <p className="eyebrow">STAGE {game.stageIndex + 1}/6</p>
            <h1>{currentStage.name}</h1>
            <p className="enemyType">{currentStage.type}</p>
          </div>
          <div className="statusBars">
            <div className="barBlock">
              <span>敵HP {game.enemyHp}/{currentStage.hp}</span>
              <div className="hpTrack">
                <div className="enemyHp" style={{ width: `${enemyHpPercent}%` }} />
              </div>
            </div>
            <div className="barBlock">
              <span>HP {game.playerHp}/{PLAYER_MAX_HP}</span>
              <div className="hpTrack">
                <div className="playerHp" style={{ width: `${playerHpPercent}%` }} />
              </div>
            </div>
          </div>
        </header>

        <section className="greedPanel">
          <div>
            <span className="chainPiece" style={{ background: chainPiece?.color || "#334155" }}>
              {chainPiece?.label || "?"}
            </span>
            <strong>{game.selectedPath.length}</strong>
            <small>現在チェイン</small>
          </div>
          <div>
            <strong className="profitText">+{formatMoney(preview.profit)}</strong>
            <small>離した時の利益</small>
          </div>
          <div>
            <strong className="debtText">+{formatMoney(preview.debtGain)}</strong>
            <small>借金増加</small>
          </div>
        </section>

        <div className="thresholdCallout">
          {game.selectedPath.length < 3 && "3チェインで成立。まずは同色をつなぐ。"}
          {game.selectedPath.length >= 3 && nextThreshold && (
            <>あと{nextThreshold - game.selectedPath.length}個で{nextThreshold}チェインボーナス！</>
          )}
          {game.selectedPath.length >= 12 && "12チェイン到達。利益2.8倍、でも借金は跳ね上がる。"}
        </div>

        <section
          className="board"
          ref={boardRef}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {game.board.map((row, rowIndex) =>
            row.map((piece, colIndex) => {
              const meta = getPieceMeta(piece);
              const key = `${rowIndex}-${colIndex}`;
              const order = game.selectedPath.findIndex((cell) => coordKey(cell) === key);

              return (
                <button
                  className={`piece ${selectedKeys.has(key) ? "selected" : ""}`}
                  data-row={rowIndex}
                  data-col={colIndex}
                  key={key}
                  onPointerDown={handlePointerDown}
                  style={{ "--piece-color": meta.color }}
                  type="button"
                  disabled={game.phase !== "battle"}
                >
                  <span>{meta.label}</span>
                  {order >= 0 && <em>{order + 1}</em>}
                </button>
              );
            })
          )}
        </section>

        <section className="bottomHud">
          <div className="totals">
            <div>
              <span>総利益</span>
              <strong className="profitText">{formatMoney(game.totalProfit)}</strong>
            </div>
            <div>
              <span>総借金</span>
              <strong className="debtText">{formatMoney(game.totalDebt)}</strong>
            </div>
            <div>
              <span>ダメージ</span>
              <strong>{formatMoney(preview.damage)}</strong>
            </div>
          </div>

          <div className="debtGauge">
            <div className="gaugeLabels">
              <strong>借金状態：{debtState.label}</strong>
              <span>{debtState.description}</span>
            </div>
            <div className="gaugeTrack">
              <div className="gaugeFill" style={{ width: `${debtPercent}%`, background: debtState.color }} />
              {game.selectedPath.length >= 3 && (
                <div className="gaugePreview" style={{ left: `${predictedDebtPercent}%` }}>
                  {predictedDebtState.label}
                </div>
              )}
            </div>
          </div>

          <div className="contractLine">
            <span>所持契約</span>
            <strong>{contractSummary}</strong>
          </div>

          <div className="message">{game.message}</div>

          {game.lastTurn && (
            <div className="lastTurn">
              前回: {game.lastTurn.chain}チェイン / 利益 {formatMoney(game.lastTurn.profit)} / 借金 +
              {formatMoney(game.lastTurn.debtGain)}
            </div>
          )}
        </section>

        {game.phase === "contract" && (
          <div className="overlay">
            <div className="modal">
              <p className="eyebrow">CONTRACT</p>
              <h2>契約を選ぶ</h2>
              <p className="modalLead">{game.message}</p>
              <div className="contractChoices">
                {game.contractChoices.map((contract) => (
                  <button key={contract.id} type="button" onClick={() => chooseContract(contract)}>
                    <strong>{contract.name}</strong>
                    <span>{contract.text}</span>
                  </button>
                ))}
              </div>
              <button className="ghostButton" type="button" onClick={skipContract}>
                契約せず次へ
              </button>
            </div>
          </div>
        )}

        {game.phase === "settlement" && (
          <div className="overlay">
            <div className={`modal settlement ${game.settlement.finalProfit > 0 ? "clear" : "bankrupt"}`}>
              <p className="eyebrow">FINAL SETTLEMENT</p>
              <h2>{game.settlement.finalProfit > 0 ? "黒字クリア" : "破産敗北"}</h2>
              <ol className="settlementList">
                <li>
                  <span>1. 総利益</span>
                  <strong>{formatMoney(game.settlement.grossProfit)}</strong>
                </li>
                <li>
                  <span>2. 利息徴収</span>
                  <strong>-{formatMoney(game.settlement.finalInterest)}</strong>
                </li>
                <li>
                  <span>3. 借金徴収</span>
                  <strong>-{formatMoney(game.settlement.totalDebt)}</strong>
                </li>
                <li>
                  <span>4. 最終利益</span>
                  <strong>{formatMoney(game.settlement.finalProfit)}</strong>
                </li>
              </ol>
              <button className="primaryButton" type="button" onClick={resetGame}>
                リスタート
              </button>
            </div>
          </div>
        )}

        {game.phase === "defeat" && (
          <div className="overlay">
            <div className="modal bankrupt">
              <p className="eyebrow">DEFEAT</p>
              <h2>戦闘敗北</h2>
              <p className="modalLead">HPが尽きた。欲張りすぎた代償は重い。</p>
              <button className="primaryButton" type="button" onClick={resetGame}>
                リスタート
              </button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
