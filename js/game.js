class PlayScene extends Phaser.Scene {
  constructor() {
    super('PlayScene');
    this.currentPlayer = 0;
    this.angle = 45;
    this.power = 50;
    this.canFire = true;
  }

  create() {
    this.add.rectangle(400, 300, 800, 600, 0x87CEEB).setOrigin(0);

    this.ground = this.add.image(400, 400, 'terrain').setOrigin(0.5);
    this.ground.displayWidth = 800;
    this.ground.displayHeight = 200;

    this.maskGraphics = this.make.graphics();
    this.maskGraphics.fillStyle(0xffffff);
    this.maskGraphics.fillRect(0, 0, 800, 600);
    this.maskGraphics.generateTexture('mask', 800, 600);
    this.maskImage = this.add.image(400, 300, 'mask').setOrigin(0.5);
    this.ground.mask = new Phaser.Display.Masks.BitmapMask(this, this.maskImage);

    this.worms = [
      this.physics.add.sprite(150, 300, 'worm'),
      this.physics.add.sprite(650, 300, 'worm')
    ];
    this.worms.forEach(w => {
      w.setOrigin(0.5, 0.8);
      w.setScale(1.5);
      w.body.setAllowGravity(false);
    });

    this.bullet = this.physics.add.sprite(0, 0, 'bullet');
    this.bullet.setCircle(6);
    this.bullet.setVisible(false);
    this.bullet.body.setAllowGravity(true);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.fireBtn = document.getElementById('fire-btn');
    this.fireBtn.onclick = () => this.fire();

    this.input.keyboard.on('keydown-Q', () => this.angle = Phaser.Math.Clamp(this.angle - 5, 0, 180));
    this.input.keyboard.on('keydown-E', () => this.angle = Phaser.Math.Clamp(this.angle + 5, 0, 180));
    this.input.keyboard.on('keydown-Z', () => this.power = Phaser.Math.Clamp(this.power - 5, 10, 100));
    this.input.keyboard.on('keydown-X', () => this.power = Phaser.Math.Clamp(this.power + 5, 10, 100));

    this.updateUI();

    this.physics.add.collider(this.bullet, {}, (bullet) => {
      if (bullet.active) {
        this.explode(bullet.x, bullet.y, 30);
        bullet.setVisible(false).setActive(false);
        this.time.delayedCall(1000, () => this.nextTurn());
      }
    });
  }

  update() {
    this.updateUI();
    const worm = this.worms[this.currentPlayer];
    if (!this.bullet.active && this.canFire) {
      worm.setVelocity(0);
      if (this.cursors.left.isDown && worm.x > 50) worm.setVelocityX(-50);
      if (this.cursors.right.isDown && worm.x < 750) worm.setVelocityX(50);
    }
  }

  fire() {
    if (!this.canFire || this.bullet.active) return;

    const worm = this.worms[this.currentPlayer];
    this.bullet.setPosition(worm.x, worm.y - 10);
    this.bullet.setVisible(true);
    this.bullet.setActive(true);

    const rad = Phaser.Math.DegToRad(this.angle);
    const vx = Math.cos(rad) * this.power;
    const vy = -Math.sin(rad) * this.power;

    this.bullet.setVelocity(vx, vy);
    this.bullet.setGravityY(300);

    this.canFire = false;
  }

  explode(x, y, radius) {
    this.maskGraphics.fillCircle(x, y, radius);
    this.maskImage.setTexture(this.maskGraphics.generateTexture());

    this.worms.forEach((w, i) => {
      if (Phaser.Math.Distance.Between(x, y, w.x, w.y) < radius + 20) {
        w.y -= 50;
        if (w.y < 300) {
          this.add.text(w.x, w.y, 'ПОТРАЧЕНО!', { color: '#f00', fontSize: '20px' }).setOrigin(0.5);
          w.disableBody(true, true);
        }
      }
    });

    const boom = this.add.circle(x, y, 10, 0xf00).setOrigin(0.5);
    this.tweens.add({
      targets: boom,
      radius: 40,
      alpha: 0,
      duration: 500,
      onComplete: () => boom.destroy()
    });
  }

  nextTurn() {
    this.currentPlayer = (this.currentPlayer + 1) % 2;
    this.canFire = true;
    this.updateUI();
  }

  updateUI() {
    document.getElementById('angle').textContent = `${this.angle}°`;
    document.getElementById('power').textContent = this.power;
    document.getElementById('turn').textContent = `Ход: Игрок ${this.currentPlayer + 1}`;
  }
}

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: {
    preload: preload,
    create: function () {
      this.scene.add('PlayScene', PlayScene, true);
    }
  }
};

const game = new Phaser.Game(config);
