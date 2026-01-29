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
      // Create player with physics body
      player = this.physics.add.sprite(400, 550, 'player');
      player.setCollideWorldBounds(true);
      player.setDamping(true);
      player.setDrag(0.99);
      player.setMaxVelocity(400, 0);

      // Create groups with physics
      enemies = this.physics.add.group({
        defaultKey: 'enemy',
        maxSize: 20,
      });
      
      bullets = this.physics.add.group({
        defaultKey: 'bullet',
        maxSize: 50,
      });

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
      
      // Shooting with proper physics
      this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        const bullet = bullets.create(player.x, player.y - 20, 'bullet') as Phaser.Physics.Arcade.Sprite;
        if (bullet) {
          bullet.setVelocity(0, -600);
          bullet.body?.setSize(10, 10);
        }
      });

      // Collision detection
      this.physics.add.overlap(bullets, enemies, hitEnemy, undefined, this);
      this.physics.add.overlap(player, enemies, playerHit, undefined, this);

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
        player.setAccelerationX(-600);
      } else if (cursors?.right.isDown) {
        player.setAccelerationX(600);
      } else {
        player.setAccelerationX(0);
      }

      // Clean up bullets off-screen
      bullets.children.entries.forEach((bullet: any) => {
        if (bullet.y < -50) bullet.destroy();
      });

      // Update enemy labels and clean up off-screen
      enemies.children.entries.forEach((enemy: any) => {
        const label = enemy.getData('label');
        if (label) {
          label.setPosition(enemy.x, enemy.y - 30);
        }
        
        if (enemy.y > 620) {
          if (label) label.destroy();
          enemy.destroy();
          // Lose life when enemy escapes
          // (handled in playerHit or separate logic)
        }
      });
    }

    function playerHit(player: any, enemy: any) {
      const label = enemy.getData('label');
      if (label) label.destroy();
      enemy.destroy();
      
      // Lose life
      // Flash player red
      player.setTint(0xff0000);
      setTimeout(() => player.clearTint(), 200);
    }

    function spawnEnemy(this: Phaser.Scene) {
      if (currentQuestion >= questions.length) return;

      const x = Phaser.Math.Between(50, 750);
      const enemy = enemies.create(x, -30, 'enemy') as Phaser.Physics.Arcade.Sprite;
      
      if (enemy) {
        const q = questions[currentQuestion];
        enemy.setData('question', q);
        enemy.setData('questionIndex', currentQuestion);
        
        // Set velocity based on difficulty
        const speed = 100;
        enemy.setVelocityY(speed);
        enemy.body?.setSize(30, 30);
        
        // Show question label
        const label = this.add.text(x, -60, q.question.substring(0, 20) + '...', {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#000000',
          padding: { x: 4, y: 2 },
        }).setOrigin(0.5);
        enemy.setData('label', label);
      }
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
      
      const questionData = enemy.getData('question');
      const label = enemy.getData('label');
      
      if (label) label.destroy();
      
      // Pause physics
      this.physics.pause();
      
      // Show question modal
      showQuestionModal.call(this, questionData, enemy);
    }

    function showQuestionModal(this: Phaser.Scene, question: any, enemy: any) {
      // Create modal overlay
      const overlay = this.add.rectangle(400, 300, 800, 600, 0x000000, 0.8);
      const bg = this.add.rectangle(400, 300, 600, 400, 0x222222);
      const qText = this.add.text(400, 200, question.question, {
        fontSize: '18px',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: 550 },
      }).setOrigin(0.5);

      const buttons: Phaser.GameObjects.Text[] = [];

      question.options?.forEach((opt: string, i: number) => {
        const btn = this.add.text(400, 280 + i * 50, opt, {
          fontSize: '16px',
          color: '#ffffff',
          backgroundColor: '#444444',
          padding: { x: 20, y: 10 },
        }).setOrigin(0.5).setInteractive();

        btn.on('pointerdown', () => {
          const correct = opt === question.correct_answer;
          
          if (correct) {
            score += question.points || 10;
            enemy.destroy();
            
            // Visual feedback
            const successText = this.add.text(400, 300, '✓ Correct!', {
              fontSize: '32px',
              color: '#10B981',
            }).setOrigin(0.5);
            
            this.tweens.add({
              targets: successText,
              alpha: 0,
              y: 250,
              duration: 1000,
              onComplete: () => successText.destroy(),
            });
          } else {
            // Wrong answer - enemy survives
            const wrongText = this.add.text(400, 300, '✗ Wrong!', {
              fontSize: '32px',
              color: '#EF4444',
            }).setOrigin(0.5);
            
            this.tweens.add({
              targets: wrongText,
              alpha: 0,
              y: 350,
              duration: 1000,
              onComplete: () => wrongText.destroy(),
            });
          }
          
          // Cleanup modal
          overlay.destroy();
          bg.destroy();
          qText.destroy();
          buttons.forEach(b => b.destroy());
          
          // Resume physics
          this.physics.resume();
          
          onScoreUpdate(score);
          currentQuestion++;
        });

        btn.on('pointerover', () => btn.setBackgroundColor('#666666'));
        btn.on('pointerout', () => btn.setBackgroundColor('#444444'));

        buttons.push(btn);
      });
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
