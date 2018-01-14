var areCrossesEnabled = false;

var nextWaveTimeout = 1;
var baseTowerInfo = {
    range: 75,
    attack: 2,
    price: 100
};
baseTowerInfo.size = baseTowerInfo.range * 0.32;

var baseEnemyInfo = {};
baseEnemyInfo.margin = 20;
baseEnemyInfo.size = 20;
baseEnemyInfo.speed = 2400 / (0.8 * baseEnemyInfo.size);
baseEnemyInfo.hp = 5 * baseEnemyInfo.size;
baseEnemyInfo.focusable = true;
var enemyN = 0;

var r = 1, R = 3; // dot radiuses

function initCastle() {
    var castle = game.add.sprite(wayPoints[wayPoints.length - 1].x, wayPoints[wayPoints.length - 1].y, textures.castle);
    castle.anchor.set(0.5);

    game.physics.enable(castle, Phaser.Physics.ARCADE);
    var hp = 1000;
    Object.defineProperty(castle, 'hp', {
        get: function () {
            return hp;
        },
        set: function (value) {
            hp = value;
            this.HPText.setText("Castle HP:" + this.hp.toFixed());
        }
    });
    TD.castle = castle;

}

function initTowers() {

    var towers = game.add.group();
    var towerN = 0;

    for (var i = 0; i < 2; i++) {
        var newTower = game.add.sprite(wayPoints[0].x + (styles.wayWidth / 2 + baseTowerInfo.size / 2), 150 + i * 250, textures.tower);
        newTower.anchor.set(0.5);
        game.physics.enable(newTower, Phaser.Physics.ARCADE);
        newTower.name = 'Tower ' + towerN++;
        Object.assign(newTower, baseTowerInfo);

        if (areCrossesEnabled) {
            var cross = game.add.sprite(newTower.x, newTower.y, textures.cross);
            cross.anchor.set(0.5);
            newTower.tcross = cross;
        }
        towers.add(newTower);
    }
    TD.towers = towers;
}

function setWayPoints() {
    wayPoints.push(new Phaser.Point(styles.sidebarWidth + styles.worldPadding, styles.worldPadding));
    wayPoints.push(new Phaser.Point(styles.sidebarWidth + styles.worldPadding, game.world.height - styles.worldPadding));
    wayPoints.push(new Phaser.Point(styles.sidebarWidth / 2 + game.world.centerX, game.world.height - styles.worldPadding));
    wayPoints.push(new Phaser.Point(styles.sidebarWidth / 2 + game.world.centerX, styles.worldPadding));
    wayPoints.push(new Phaser.Point(game.world.width - styles.worldPadding, styles.worldPadding));
    wayPoints.push(new Phaser.Point(game.world.width - styles.worldPadding, game.world.height - styles.worldPadding));
}

function initWay() {
    game.add.sprite(0, 0, textures.way);
}

function initSidebar() {
    game.add.sprite(0, 0, textures.sidebar);
    var row = 0;

    var fontO = {font: '18px Arial', fill: 'rgba(76,178,255,1)'};

    var gameName = game.add.text(styles.sidebarWidth / 2, styles.sidebarPadding, 'TowerDefence', fontO);
    row++;
    gameName.anchor.set(0.5);

    TD.waveText = addText('Wave: ' + TD.wave);
    TD.castle.HPText = addText('Castle HP: ' + TD.castle.hp);

    game.add.sprite(styles.sidebarPadding, styles.sidebarPadding + row * 18 * 2.5 - 4, textures.gold).anchor.set(0, 0.5);
    TD.goldText = addText('0', textures.coinSize * 1.2);

    game.add.button(styles.sidebarPadding, styles.sidebarPadding + row * 18 * 2.5, textures.towerSq, buyTower).anchor.set(0, 0.5);
    addGoldString(baseTowerInfo.price, styles.sidebarPadding + baseTowerInfo.size * 1.2, styles.sidebarPadding + row * 18 * 2.5);

    function addText(string, x) {
        x = x === undefined ? 0 : x;
        var text = game.add.text(styles.sidebarPadding + x, styles.sidebarPadding + row * 18 * 2.5, string, fontO);
        row++;
        text.anchor.set(0, 0.5);
        return text;
    }

    function addGoldString(goldAmount, x, y) {
        game.add.sprite(x, y - 4, textures.gold).anchor.set(0, 0.5);
        var text = game.add.text(x + textures.coinSize * 1.2, y, goldAmount, fontO);
        text.anchor.set(0, 0.5);
        return text;
    }
}

function initEnemy(x, y, info) {
    var bmpD;
    setSize();
    var key = info.type + "_" + info.size;
    if (textures.enemies[key])
        bmpD = textures.enemies[key];
    else {
        var color = 'rgba(255,157,13,1)';
        bmpD = game.add.bitmapData(info.size, info.size);
        bmpD.circle(info.size / 2, info.size / 2, info.size / 2, color);
        textures.enemies[key] = bmpD;
    }

    var sprite = game.add.sprite(x, y, bmpD);
    sprite.anchor.set(0.5);
    Object.assign(sprite, info);
    sprite.name = "Enemy " + TD.wave + '.' + enemyN++;
    return sprite;

    function setSize() {
        var size = math.floor(baseEnemyInfo.size * math.sqrt(info.hp / baseEnemyInfo.hp));
        if (isOdd(size))
            size++;
        info.size = size;

        function isOdd(x) {
            return math.mod(x, 2) != 0;
        }
    }
}

function createTextures() {
    // Waypoints
    var color = 'rgba(0,0,0,0.5)';
    textures.way = game.add.bitmapData(game.world.width, game.world.height);
    for (var i = 0; i < wayPoints.length - 1; i++)
        lineDots(wayPoints[i], wayPoints[i + 1], gcd(), r, R);

    function lineDots(p1, p2, dL, r, R) {
        var a = math.atan2(p2.y - p1.y, p2.x - p1.x);
        textures.way.circle(p1.x, p1.y, R, color);
        for (var i = 1; i < Math.round(game.physics.arcade.distanceBetween(p1, p2)) / dL; i++) {
            textures.way.circle(p1.x + i * dL * math.cos(a), p1.y + i * dL * math.sin(a), r, color);
        }
    }

    function gcd() {
        var lengthsBetweenWayPoints = [];
        for (var i = 0; i < wayPoints.length - 1; i++) {
            lengthsBetweenWayPoints[i] = Math.round(game.physics.arcade.distanceBetween(wayPoints[i], wayPoints[i + 1]));
        }
        return math.gcd.apply(null, lengthsBetweenWayPoints);

    }

    // Castle
    var castleColor = '#132C40';
    var castleRadius = 20;
    textures.castle = game.add.bitmapData(castleRadius * 2, castleRadius * 2);
    textures.castle.circle(castleRadius, castleRadius, castleRadius, castleColor);

    // Tower
    textures.towerSq = game.add.bitmapData(baseTowerInfo.size, baseTowerInfo.size);
    textures.towerSq.rect(0, 0, baseTowerInfo.size, baseTowerInfo.size, 'rgba(76,178,255,1)');
    // Tower (area)
    textures.tower = game.add.bitmapData(baseTowerInfo.range * 2, baseTowerInfo.range * 2);
    textures.tower.circle(baseTowerInfo.range, baseTowerInfo.range, baseTowerInfo.range, 'rgba(76,178,255,0.1)');
    textures.tower.circle(baseTowerInfo.range, baseTowerInfo.range, baseTowerInfo.size / 2, 'rgba(76,178,255,1)');

    // GoldCoin
    textures.coinSize = 15;
    var goldColor = "#ffcf40";
    textures.gold = game.add.bitmapData(textures.coinSize, textures.coinSize);
    textures.gold.circle(textures.coinSize / 2, textures.coinSize / 2, textures.coinSize / 2, goldColor);

    // Lifebar
    /*color = '#38bc00';
    textures.lifebar = game.add.bitmapData(styles.lifebarWidth, styles.lifebarHeight);
    textures.lifebar.rect(0, 0, styles.lifebarWidth, styles.lifebarHeight,
     color);*/
    color = '#e8720c';
    textures.lifebar = game.add.bitmapData(256, 256);
    textures.lifebar.circle(128, 128, 128, color);

    // Cross
    color = '#000';
    textures.cross = game.add.bitmapData(styles.crossSize, styles.crossSize);
    textures.cross.circle(styles.crossSize / 2, styles.crossSize / 2, styles.crossSize / 2, color);

    // Sidebar
    textures.sidebar = game.add.bitmapData(styles.sidebarWidth, game.world.height);
    color = '#fff';
    textures.sidebar.rect(0, 0, styles.sidebarWidth, game.world.height, color);

    // Enemies
    textures.enemies = {};
}