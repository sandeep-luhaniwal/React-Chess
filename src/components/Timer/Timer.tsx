// src/components/Timer/Timer.tsx
import React, { useEffect, useState } from "react";
import { TeamType } from "../../Types";
import "./Timer.css";

interface Props {
  team: TeamType;
  isActive: boolean;
  initialTime: number; // in seconds
  onTimeOut: () => void;
}

export default function Timer({ team, isActive, initialTime, onTimeOut }: Props) {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  
  useEffect(() => {
    setTimeLeft(initialTime);
  }, [initialTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft <= 0) {
      onTimeOut();
    }
    
    return () => clearInterval(interval);
  }, [isActive, timeLeft, onTimeOut]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`timer ${team === TeamType.OUR ? 'white-timer' : 'black-timer'} ${isActive ? 'active' : ''}`}>
      <div className="timer-label">{team === TeamType.OUR ? 'White' : 'Black'}</div>
      <div className="timer-display">{formatTime(timeLeft)}</div>
    </div>
  );
}