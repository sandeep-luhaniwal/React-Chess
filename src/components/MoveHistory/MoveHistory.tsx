// src/components/MoveHistory/MoveHistory.tsx
import React from "react";
import { PieceType, TeamType } from "../../Types";
import "./MoveHistory.css";

interface Move {
  piece: PieceType;
  team: TeamType;
  from: string;
  to: string;
  captured?: PieceType;
}

interface Props {
  moves: Move[];
}

export default function MoveHistory({ moves }: Props) {
  const getPieceSymbol = (piece: PieceType) => {
    switch (piece) {
      case PieceType.KING: return "K";
      case PieceType.QUEEN: return "Q";
      case PieceType.ROOK: return "R";
      case PieceType.BISHOP: return "B";
      case PieceType.KNIGHT: return "N";
      case PieceType.PAWN: return "";
      default: return "";
    }
  };

  return (
    <div className="move-history">
      <h3>Move History</h3>
      <div className="moves-container">
        {moves.map((move, index) => (
          <div key={index} className="move">
            {index % 2 === 0 && <span className="move-number">{(index / 2) + 1}.</span>}
            <span className={`move-text ${move.team === TeamType.OUR ? 'white-move' : 'black-move'}`}>
              {getPieceSymbol(move.piece)}{move.from}-{move.to}
              {move.captured && "x"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}