import { useEffect, useRef } from 'react';
import Phaser from 'phaser';

type ArcadeShooterProps = {
  questions: any[];
  config: any;
  ruleset: any;
  onScoreUpdate: (score: number) => void;
  onGameEnd: (result: any) => void;
};

export default function ArcadeShooter({ questions, config, ruleset, onScoreUpdate, onGameEnd }: ArcadeShooterProps) {
  const gameRef = useRef<HTMLDivElement>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!gameRef.current || questions.length === 0) return;

    // Phaser game configuration
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
      backgroundColor: config?.colors?.background || '#1a1a2e',
    };

    let player: Phaser.Physics.Arcade.Sprite;
    let enemies: Phaser.Physics.Arcade.Group;
    let bullets: Phaser.Physics.Arcade.Group;
    let score = 0;
    let currentQuestion = 0;
    let questionText: Phaser.GameObjects.Text;
    let optionsText: Phaser.GameObjects.Text[] = [];

    function preload(this: Phaser.Scene) {
      // Create simple sprites (colored rectangles)
      this.add.rectangle(0, 0, 40, 40, 0x00ff00).setDisplaySize(40, 40);
      this.textures.addCanvas('player', this.add.rectangle(0, 0, 40, 40, 0x00ff00).canvas);
      this.textures.addCanvas('enemy', this.add.rectangle(0, 0, 30, 30, 0xff0000).canvas);
      this.textures.addCanvas('bullet', this.add.rectangle(0, 0, 10, 10, 0xffff00).canvas);
    }

    function create(this: Phaser.Scene) {
      // Create player
      player = this.physics.add.sprite(400, 550, 'player');
      player.setCollideWorldBounds(true);

      // Create groups
      enemies = this.physics.add.group();
      bullets = this.physics.add.group();

      // Question text
      questionText = this.add.text(400, 50, '', {
        fontSize: '20px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 750 },
      }).setOrigin(0.5);

      // Score display
      this.add.text(20, 20, 'Score: 0', {
        fontSize: '18px',
        color: '#ffffff',
      }).setName('scoreText');

      // Controls
      const cursors = this.input.keyboard?.createCursorKeys();
      
      // Shooting
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const bullet = bullets.create(player.x, player.y, 'bullet');
        this.physics.moveTo(bullet, pointer.x, pointer.y, 400);
      });

      // Collision detection
      this.physics.add.overlap(bullets, enemies, hitEnemy, undefined, this);

      // Show first question
      showQuestion.call(this);

      // Spawn enemies
      this.time.addEvent({
        delay: 2000,
        callback: spawnEnemy,
        callbackScope: this,
        loop: true,
      });
    }

    function update(this: Phaser.Scene) {
      // Player movement
      const cursors = this.input.keyboard?.createCursorKeys();
      
      if (cursors?.left.isDown) {
        player.setVelocityX(-300);
      } else if (cursors?.right.isDown) {
        player.setVelocityX(300);
      } else {
        player.setVelocityX(0);
      }

      // Clean up bullets off-screen
      bullets.children.entries.forEach((bullet: any) => {
        if (bullet.y < 0) bullet.destroy();
      });

      // Clean up enemies off-screen
      enemies.children.entries.forEach((enemy: any) => {
        if (enemy.y > 620) {
          enemy.destroy();
          // Lose life
        }
      });
    }

    function spawnEnemy(this: Phaser.Scene) {
      if (currentQuestion >= questions.length) return;

      const x = Phaser.Math.Between(50, 750);
      const enemy = enemies.create(x, -30, 'enemy');
      this.physics.moveToObject(enemy, player, 100);
    }

    function showQuestion(this: Phaser.Scene) {
      if (currentQuestion >= questions.length) {
        endGame.call(this);
        return;
      }

      const q = questions[currentQuestion];
      questionText.setText(q.question);

      // Clear previous options
      optionsText.forEach(t => t.destroy());
      optionsText = [];

      // Show options
      if (q.options) {
        q.options.forEach((opt: string, i: number) => {
          const text = this.add.text(400, 100 + i * 40, opt, {
            fontSize: '16px',
            color: '#ffffff',
            backgroundColor: '#333333',
            padding: { x: 10, y: 5 },
          }).setOrigin(0.5).setInteractive();

          text.on('pointerdown', () => {
            checkAnswer.call(this, opt);
          });

          optionsText.push(text);
        });
      }
    }

    function checkAnswer(this: Phaser.Scene, answer: string) {
      const q = questions[currentQuestion];
      const correct = answer === q.correct_answer;

      if (correct) {
        score += q.points || 10;
        onScoreUpdate(score);
      }

      currentQuestion++;
      showQuestion.call(this);
    }

    function hitEnemy(bullet: any, enemy: any) {
      bullet.destroy();
      enemy.destroy();
      score += 5;
      onScoreUpdate(score);
    }

    function endGame(this: Phaser.Scene) {
      onGameEnd({
        score,
        totalTime: Math.floor((Date.now() - Date.now()) / 1000),
        passed: score >= (ruleset.passing_score || 70),
        questionsAnswered: currentQuestion,
      });
    }

    // Create Phaser game
    phaserGameRef.current = new Phaser.Game(gameConfig);

    return () => {
      phaserGameRef.current?.destroy(true);
    };
  }, [questions, config, ruleset]);

  return <div ref={gameRef} className="w-full h-full" />;
}
