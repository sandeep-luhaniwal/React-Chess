// src/components/Referee/Referee.tsx
import { useEffect, useRef, useState } from "react";
import { initialBoard } from "../../Constants";
import { Piece, Position } from "../../models";
import { Board } from "../../models/Board";
import { Pawn } from "../../models/Pawn";
import {
  bishopMove,
  getPossibleBishopMoves,
  getPossibleKingMoves,
  getPossibleKnightMoves,
  getPossiblePawnMoves,
  getPossibleQueenMoves,
  getPossibleRookMoves,
  kingMove,
  knightMove,
  pawnMove,
  queenMove,
  rookMove,
} from "../../referee/rules";
import { PieceType, TeamType } from "../../Types";
import Chessboard from "../Chessboard/Chessboard";
import MoveHistory from "../MoveHistory/MoveHistory";
import Timer from "../Timer/Timer";
import CapturedPieces from "../CapturedPieces/CapturedPieces";

interface Move {
  piece: PieceType;
  team: TeamType;
  from: string;
  to: string;
  captured?: PieceType;
}

export default function Referee() {
  const [board, setBoard] = useState<Board>(initialBoard.clone());
  const [promotionPawn, setPromotionPawn] = useState<Piece>();
  const [moves, setMoves] = useState<Move[]>([]);
  const [whiteCaptured, setWhiteCaptured] = useState<PieceType[]>([]);
  const [blackCaptured, setBlackCaptured] = useState<PieceType[]>([]);
  const [whiteTime, setWhiteTime] = useState(600);
  const [blackTime, setBlackTime] = useState(600);

  const modalRef = useRef<HTMLDivElement>(null);
  const checkmateModalRef = useRef<HTMLDivElement>(null);

  const positionToNotation = (position: Position) => {
    const x = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'][position.x];
    const y = 8 - position.y;
    return `${x}${y}`;
  };

  function playMove(playedPiece: Piece, destination: Position): boolean {
    if (playedPiece.possibleMoves === undefined) return false;

    if (playedPiece.team === TeamType.OUR && board.totalTurns % 2 !== 1)
      return false;
    if (playedPiece.team === TeamType.OPPONENT && board.totalTurns % 2 !== 0)
      return false;

    const validMove = playedPiece.possibleMoves?.some((m) =>
      m.samePosition(destination)
    );
    if (!validMove) return false;

    const enPassantMove = isEnPassantMove(
      playedPiece.position,
      destination,
      playedPiece.type,
      playedPiece.team
    );

    let capturedPiece: Piece | undefined = board.pieces.find(p =>
      p.position.x === destination.x &&
      p.position.y === destination.y &&
      p.team !== playedPiece.team
    );

    if (enPassantMove) {
      const pawnDirection = playedPiece.team === TeamType.OUR ? 1 : -1;
      capturedPiece = board.pieces.find(p =>
        p.position.x === destination.x &&
        p.position.y === destination.y - pawnDirection &&
        p.team !== playedPiece.team
      );
    }

    setBoard(() => {
      const clonedBoard = board.clone();
      clonedBoard.totalTurns += 1;

      const playedMoveIsValid = clonedBoard.playMove(
        enPassantMove,
        validMove,
        playedPiece,
        destination
      );

      if (playedMoveIsValid) {
        const newMove: Move = {
          piece: playedPiece.type,
          team: playedPiece.team,
          from: positionToNotation(playedPiece.position),
          to: positionToNotation(destination),
          captured: capturedPiece?.type
        };
        setMoves(prev => [...prev, newMove]);

        if (capturedPiece) {
          if (capturedPiece.team === TeamType.OUR) {
            setWhiteCaptured(prev => [...prev, capturedPiece!.type]);
          } else {
            setBlackCaptured(prev => [...prev, capturedPiece!.type]);
          }
        }
      }

      if (clonedBoard.winningTeam !== undefined) {
        checkmateModalRef.current?.classList.remove("hidden");
      }

      return clonedBoard;
    });

    let promotionRow = playedPiece.team === TeamType.OUR ? 7 : 0;
    if (destination.y === promotionRow && playedPiece.isPawn) {
      modalRef.current?.classList.remove("hidden");
      setPromotionPawn(() => {
        const clonedPlayedPiece = playedPiece.clone();
        clonedPlayedPiece.position = destination.clone();
        return clonedPlayedPiece;
      });
    }

    return true;
  }

  function isEnPassantMove(
    initialPosition: Position,
    desiredPosition: Position,
    type: PieceType,
    team: TeamType
  ) {
    const pawnDirection = team === TeamType.OUR ? 1 : -1;
    if (type === PieceType.PAWN) {
      if (
        (desiredPosition.x - initialPosition.x === -1 ||
          desiredPosition.x - initialPosition.x === 1) &&
        desiredPosition.y - initialPosition.y === pawnDirection
      ) {
        const piece = board.pieces.find(
          (p) =>
            p.position.x === desiredPosition.x &&
            p.position.y === desiredPosition.y - pawnDirection &&
            p.isPawn &&
            (p as Pawn).enPassant
        );
        if (piece) return true;
      }
    }
    return false;
  }

  function promotePawn(pieceType: PieceType) {
    if (!promotionPawn) return;

    setBoard(() => {
      const clonedBoard = board.clone();
      clonedBoard.pieces = clonedBoard.pieces.reduce((results, piece) => {
        if (piece.samePiecePosition(promotionPawn)) {
          results.push(
            new Piece(piece.position.clone(), pieceType, piece.team, true)
          );
        } else {
          results.push(piece);
        }
        return results;
      }, [] as Piece[]);
      clonedBoard.calculateAllMoves();
      return clonedBoard;
    });

    modalRef.current?.classList.add("hidden");
  }

  function promotionTeamType() {
    return promotionPawn?.team === TeamType.OUR ? "w" : "b";
  }

  function restartGame() {
    checkmateModalRef.current?.classList.add("hidden");
    setBoard(initialBoard.clone());
    setMoves([]);
    setWhiteCaptured([]);
    setBlackCaptured([]);
    setWhiteTime(600);
    setBlackTime(600);
  }

  return (
    <div className="game-container">
      <div className="abcd">
        <div className="game-sidebar left-sidebar">
          <Timer
            team={TeamType.OPPONENT}
            isActive={board.totalTurns % 2 === 0}
            initialTime={blackTime}
            onTimeOut={() => setBoard(prev => {
              const newBoard = prev.clone();
              newBoard.winningTeam = TeamType.OUR;
              return newBoard;
            })}
          />
          <CapturedPieces team={TeamType.OUR} capturedPieces={blackCaptured} />
        </div>


        <div className="game-center ">
          <p style={{ color: "white", fontSize: "24px", textAlign: "center" }}>
            Total turns: {board.totalTurns}
          </p>
          <Chessboard playMove={playMove} pieces={board.pieces} />
        </div>

        <div className="game-sidebar right-sidebar">
          <Timer
            team={TeamType.OUR}
            isActive={board.totalTurns % 2 === 1}
            initialTime={whiteTime}
            onTimeOut={() => setBoard(prev => {
              const newBoard = prev.clone();
              newBoard.winningTeam = TeamType.OPPONENT;
              return newBoard;
            })}
          />
          <CapturedPieces team={TeamType.OPPONENT} capturedPieces={whiteCaptured} />
          <MoveHistory moves={moves} />
        </div>

        <div className="modal hidden" ref={modalRef}>
          <div className="modal-body">
            <img onClick={() => promotePawn(PieceType.ROOK)} src={`/assets/images/rook_${promotionTeamType()}.png`} />
            <img onClick={() => promotePawn(PieceType.BISHOP)} src={`/assets/images/bishop_${promotionTeamType()}.png`} />
            <img onClick={() => promotePawn(PieceType.KNIGHT)} src={`/assets/images/knight_${promotionTeamType()}.png`} />
            <img onClick={() => promotePawn(PieceType.QUEEN)} src={`/assets/images/queen_${promotionTeamType()}.png`} />
          </div>
        </div>
      </div>

      <div className="modal hidden" ref={checkmateModalRef}>
        <div className="modal-body">
          <div className="checkmate-body">
            <span>
              The winning team is {board.winningTeam === TeamType.OUR ? "white" : "black"}!
            </span>
            <button onClick={restartGame}>Play again</button>
          </div>
        </div>
      </div>
    </div>
  );
}
