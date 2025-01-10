import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Scissors, ArrowDown, TrendingUp, DollarSign } from 'lucide-react';

const generateRandomName = () => {
  const names = ['Alex', 'Jamie', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 
                 'Quinn', 'Avery', 'Blake', 'Drew', 'Eden', 'Finn', 'Gray', 'Haven'];
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD', 
                 '#D4A5A5', '#9B6B9D', '#77A1D3', '#FFBE0B', '#6BCB77'];
  
  return {
    name: names[Math.floor(Math.random() * names.length)],
    color: colors[Math.floor(Math.random() * colors.length)]
  };
};

const WaitingGame = () => {
  const [position, setPosition] = useState(50);
  const [cash, setCash] = useState(0);
  const [level, setLevel] = useState(1);
  const [xp, setXp] = useState(0);
  const [timeAtFront, setTimeAtFront] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [cutsMade, setCutsMade] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  const [players, setPlayers] = useState([]);
  
  // Initialize line of players
  useEffect(() => {
    if (gameStarted && players.length === 0) {
      const initialPlayers = Array(50).fill(null).map(() => generateRandomName());
      // Insert player at position 50
      initialPlayers[49] = { name: 'You', color: '#4CAF50' };
      setPlayers(initialPlayers);
    }
  }, [gameStarted]);

  const getEarningRate = (pos) => {
    const baseRate = 500 * Math.pow(1.28, (50 - pos));
    const levelBonus = 1 + (level - 1) * 0.0025;
    return baseRate * levelBonus;
  };

  const getCutCost = (currentPos, targetPos) => {
    const positionsToSkip = currentPos - targetPos;
    const baseCost = Math.pow(1.5, positionsToSkip) * 10000;
    return baseCost * Math.pow(1.35, cutsMade);
  };

  useEffect(() => {
    if (!gameStarted) return;

    const interval = setInterval(() => {
      setCash(prev => prev + getEarningRate(position) / 10);

      if (position === 1) {
        setTimeAtFront(prev => {
          if (prev >= 100) {
            setXp(prevXp => {
              const newXp = prevXp + 100;
              if (newXp >= level * 100) {
                setLevel(prevLevel => prevLevel + 1);
                return newXp - (level * 100);
              }
              return newXp;
            });
            setIsMoving(true);
            
            // Move to back of line
            setTimeout(() => {
              setPlayers(prevPlayers => {
                const newPlayers = [...prevPlayers];
                const you = newPlayers[0];
                newPlayers.shift();
                newPlayers.push(you);
                return newPlayers;
              });
              setPosition(50);
              setCutsMade(0);
              setIsMoving(false);
            }, 500);
            return 0;
          }
          return prev + 1;
        });
      }
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted, position, level]);

  const cutLine = () => {
    if (position <= 1) return;
    const cost = getCutCost(position, position - 1);
    
    if (cash >= cost) {
      setIsMoving(true);
      setCash(prev => prev - cost);
      
      // Swap positions with person in front
      setPlayers(prevPlayers => {
        const newPlayers = [...prevPlayers];
        const playerIndex = position - 1;
        const targetIndex = playerIndex - 1;
        [newPlayers[playerIndex], newPlayers[targetIndex]] = 
        [newPlayers[targetIndex], newPlayers[playerIndex]];
        return newPlayers;
      });
      
      setTimeout(() => {
        setPosition(prev => prev - 1);
        setCutsMade(prev => prev + 1);
        setIsMoving(false);
      }, 500);
    }
  };

  const concede = () => {
    if (position >= 50) return;
    setIsMoving(true);
    
    // Swap positions with person behind
    setPlayers(prevPlayers => {
      const newPlayers = [...prevPlayers];
      const playerIndex = position - 1;
      const targetIndex = playerIndex + 1;
      [newPlayers[playerIndex], newPlayers[targetIndex]] = 
      [newPlayers[targetIndex], newPlayers[playerIndex]];
      return newPlayers;
    });
    
    setTimeout(() => {
      setPosition(prev => prev + 1);
      setIsMoving(false);
    }, 500);
  };

  const formatNumber = (num) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const LineVisualization = () => {
    if (players.length === 0) return null;
    
    // Show 2 positions behind and 2 positions ahead
    const getVisiblePlayers = () => {
      const playerIndex = position - 1;
      const start = Math.max(0, playerIndex - 2);
      const end = Math.min(49, playerIndex + 2);
      return players.slice(start, end + 1).map((player, i) => ({
        ...player,
        position: start + i + 1
      }));
    };

    const visiblePlayers = getVisiblePlayers();

    return (
      <svg viewBox="0 0 800 200" className="w-full h-40">
        <line x1="50" y1="150" x2="750" y2="150" stroke="#ccc" strokeWidth="2"/>
        {visiblePlayers.map((player, index) => {
          const baseX = 400;
          const spacing = 100;
          const offset = (player.position - position) * spacing;
          const x = baseX + offset;
          
          return (
            <g 
              key={player.position} 
              transform={`translate(${x},90)`}
              style={{
                transition: 'transform 0.5s ease-in-out',
                opacity: isMoving ? 0.7 : 1
              }}
            >
              <circle cx="0" cy="0" r="20" fill={player.color}/>
              <rect x="-10" y="20" width="20" height="40" rx="5" fill={player.color}/>
              <text x="0" y="-30" textAnchor="middle" fill="#333" fontSize="12">
                {`${player.name}(${player.position})`}
              </text>
            </g>
          );
        })}
        
        {position > 3 && <text x="100" y="140" textAnchor="middle">←</text>}
        {position < 48 && <text x="700" y="140" textAnchor="middle">→</text>}
        
        <text x="400" y="190" textAnchor="middle" fill="#666" fontSize="14">
          Line Position →
        </text>
      </svg>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Waiting in Line Game</CardTitle>
      </CardHeader>
      <CardContent>
        {!gameStarted ? (
          <div className="text-center">
            <Button 
              className="px-8 py-4 text-lg"
              onClick={() => setGameStarted(true)}
            >
              Join Line
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <LineVisualization />
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <span>Position: {position}/50</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                <span>Cash: ${formatNumber(cash)}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                <span>Level: {level} ({xp}/{level * 100} XP)</span>
              </div>
              <div>
                Earning: ${formatNumber(getEarningRate(position))}/s
              </div>
              <div>
                Cuts Made: {cutsMade}
              </div>
            </div>

            {position === 1 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${timeAtFront}%` }}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Button
                onClick={cutLine}
                disabled={cash < getCutCost(position, position - 1) || position <= 1 || isMoving}
                className="flex items-center gap-2"
              >
                <Scissors className="w-4 h-4" />
                Cut Next (${formatNumber(getCutCost(position, position - 1))})
              </Button>
              <Button
                onClick={concede}
                disabled={position >= 50 || isMoving}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowDown className="w-4 h-4" />
                Concede Position
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WaitingGame;
