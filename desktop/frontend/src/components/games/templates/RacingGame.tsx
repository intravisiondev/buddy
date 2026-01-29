import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

type RacingGameProps = {
  questions: any[];
  config: any;
  ruleset: any;
  onScoreUpdate: (score: number) => void;
  onGameEnd: (result: any) => void;
};

export default function RacingGame({ questions, config, ruleset, onScoreUpdate, onGameEnd }: RacingGameProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || questions.length === 0) return;

    const gameConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      width: 800,
      height: 600,
      parent: gameRef.current,
      physics: {
        default: 'arcade',
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
      backgroundColor: config?.colors?.background || '#222222',
    };

    let player: Phaser.Physics.Arcade.Sprite;
    let opponents: Phaser.Physics.Arcade.Group;
    let speed = 0;
    let score = 0;
    let currentQuestion = 0;
    let distance = 0;
    let questionUI: Phaser.GameObjects.Container;

    function preload(this: Phaser.Scene) {
      this.textures.addCanvas('car', this.add.rectangle(0, 0, 50, 80, 0x0088ff).canvas);
      this.textures.addCanvas('opponent', this.add.rectangle(0, 0, 50, 80, 0xff0000).canvas);
    }

    function create(this: Phaser.Scene) {
      // Create track with physics
      const track = this.add.rectangle(400, 300, 400, 600, 0x555555);
      this.physics.add.existing(track, true);

      // Create player car with proper physics
      player = this.physics.add.sprite(400, 500, 'car');
      player.setCollideWorldBounds(true);
      player.setMaxVelocity(300, 500);
      player.setDrag(50);
      player.body?.setSize(50, 80);

      // Create opponents with collision
      opponents = this.physics.add.group({
        defaultKey: 'opponent',
        maxSize: 10,
      });
      
      // Enable collision
      this.physics.add.collider(player, opponents, handleCollision, undefined, this);

      // Distance display
      this.add.text(20, 20, 'Distance: 0m', {
        fontSize: '18px',
        color: '#ffffff',
      }).setName('distanceText');

      // Speed display
      this.add.text(20, 50, 'Speed: 0 km/h', {
        fontSize: '18px',
        color: '#ffffff',
      }).setName('speedText');

      // Question UI
      createQuestionUI.call(this);

      // Spawn opponents
      this.time.addEvent({
        delay: 3000,
        callback: spawnOpponent,
        callbackScope: this,
        loop: true,
      });
    }

    function update(this: Phaser.Scene, time: number, delta: number) {
      // Apply speed to player movement (visual effect)
      if (speed > 0) {
        distance += speed * (delta / 1000);
        const distanceText: any = this.children.getByName('distanceText');
        if (distanceText) {
          distanceText.setText(`Distance: ${Math.floor(distance)}m`);
        }
      }

      // Update speed display
      const speedText: any = this.children.getByName('speedText');
      if (speedText) {
        speedText.setText(`Speed: ${Math.floor(speed)} km/h`);
      }

      // Decelerate naturally
      if (speed > 0) {
        speed = Math.max(0, speed - 0.5);
      }

      // Move opponents with physics
      opponents.children.entries.forEach((opp: any) => {
        if (opp.active) {
          opp.setVelocityY(200 + speed * 0.5);
          if (opp.y > 650) {
            opp.destroy();
          }
        }
      });

      // Lane switching
      const cursors = this.input.keyboard?.createCursorKeys();
      if (cursors?.left.isDown && player.x > 250) {
        player.setVelocityX(-200);
      } else if (cursors?.right.isDown && player.x < 550) {
        player.setVelocityX(200);
      } else {
        player.setVelocityX(0);
      }
    }

    function handleCollision(player: any, opponent: any) {
      // Slow down on collision
      speed = Math.max(0, speed - 30);
      opponent.destroy();
      
      // Visual feedback
      player.setTint(0xff0000);
      setTimeout(() => player.clearTint(), 300);
    }

    function createQuestionUI(this: Phaser.Scene) {
      if (currentQuestion >= questions.length) {
        endGame.call(this);
        return;
      }

      // Clear previous UI
      if (questionUI) questionUI.destroy();

      const q = questions[currentQuestion];
      
      // Create UI container
      const bg = this.add.rectangle(400, 300, 600, 300, 0x000000, 0.8);
      const qText = this.add.text(400, 200, q.question, {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 550 },
      }).setOrigin(0.5);

      const buttons: Phaser.GameObjects.Text[] = [];

      if (q.options) {
        q.options.forEach((opt: string, i: number) => {
          const btn = this.add.text(400, 280 + i * 50, opt, {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 20, y: 10 },
          }).setOrigin(0.5).setInteractive();

          btn.on('pointerdown', () => {
            const correct = opt === q.correct_answer;
            
            if (correct) {
              speed += 50; // Speed boost
              score += q.points || 10;
              
              // Visual feedback
              const boostText = this.add.text(400, 300, '⚡ SPEED BOOST!', {
                fontSize: '32px',
                color: '#10B981',
              }).setOrigin(0.5);
              
              this.tweens.add({
                targets: boostText,
                alpha: 0,
                scale: 1.5,
                duration: 1000,
                onComplete: () => boostText.destroy(),
              });
              
              onScoreUpdate(score);
            } else {
              speed = Math.max(0, speed - 20); // Penalty
              
              const penaltyText = this.add.text(400, 300, '✗ SLOW DOWN!', {
                fontSize: '32px',
                color: '#EF4444',
              }).setOrigin(0.5);
              
              this.tweens.add({
                targets: penaltyText,
                alpha: 0,
                y: 350,
                duration: 1000,
                onComplete: () => penaltyText.destroy(),
              });
            }
            
            currentQuestion++;
            createQuestionUI.call(this);
          });

          btn.on('pointerover', () => {
            btn.setBackgroundColor('#666666');
          });

          btn.on('pointerout', () => {
            btn.setBackgroundColor('#444444');
          });

          buttons.push(btn);
        });
      }

      questionUI = this.add.container(0, 0, [bg, qText, ...buttons]);
    }

    function spawnOpponent(this: Phaser.Scene) {
      const lane = Phaser.Math.Between(0, 2);
      const x = 250 + lane * 150;
      const opp = opponents.create(x, -80, 'opponent') as Phaser.Physics.Arcade.Sprite;
      
      if (opp) {
        opp.setVelocityY(150);
        opp.body?.setSize(50, 80);
      }
    }

    function endGame(this: Phaser.Scene) {
      onGameEnd({
        score,
        totalTime: Math.floor((Date.now() - Date.now()) / 1000),
        passed: score >= (ruleset.passing_score || 70),
        questionsAnswered: currentQuestion,
        distance: Math.floor(distance),
      });
    }

    phaserGameRef.current = new Phaser.Game(gameConfig);

    return () => {
      phaserGameRef.current?.destroy(true);
    };
  }, [questions, config, ruleset]);

  return <div ref={gameRef} className="w-full h-full" />;
}
