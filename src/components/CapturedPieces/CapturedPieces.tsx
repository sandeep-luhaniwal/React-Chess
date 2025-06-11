// src/components/CapturedPieces/CapturedPieces.tsx
import React from "react";
import { PieceType, TeamType } from "../../Types";
import "./CapturedPieces.css";

interface Props {
  team: TeamType;
  capturedPieces: PieceType[];
}

export default function CapturedPieces({ team, capturedPieces }: Props) {
  const getPieceImage = (piece: PieceType) => {
    return `assets/images/${piece}_${team === TeamType.OUR ? 'b' : 'w'}.png`;
  };

  return (
    <div className={`captured-pieces ${team === TeamType.OUR ? 'white-captured' : 'black-captured'}`}>
      <h4>Captured by {team === TeamType.OUR ? 'White' : 'Black'}</h4>
      <div className="pieces-container">
        {capturedPieces.map((piece, index) => (
          <img 
            key={index} 
            src={getPieceImage(piece)} 
            alt={piece} 
            className="captured-piece" 
          />
        ))}
      </div>
    </div>
  );
}