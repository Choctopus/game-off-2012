SongView = Backbone.View.extend({

  template: _.template($('#song-template').html()),

  className: 'song',

  events: {
    'click #pause .return-main-menu' : 'backToMenu',
    'click .choose' : 'backToChoose',
    'click .retry' : 'retry',
  },

  initialize: function(){
    this.render();
    this.score = 0;
    this.combo = 0;
    this.gameOver = false;
    this.finished = false;
    this.sprites = new Array();
    this.queues = [];
    this.queues[0] = _.clone(this.model.get('queues')[0]);
    this.queues[1] = _.clone(this.model.get('queues')[1]);
    this.queues[2] = _.clone(this.model.get('queues')[2]);
    this.queues[3] = _.clone(this.model.get('queues')[3]);
    this.active   = [[],[],[],[]];
    this.inactive = [[],[],[],[]];
    this.missed   = [[],[],[],[]];
    this.canvas = this.$el.find('canvas')[0];
    this.canvas.width  = 640;
    this.canvas.height = 480;
    this.audio = this.$el.find('audio')[0];
    game.audio.current_track = this.audio;
    this.audio.setAttribute('src', 'audio/songs/' + this.model.get('filename') + '.mp3');
    this.audio.load();
    if(game.muted){this.audio.muted = true}
    if(localStorage[this.model.get('filename')] === undefined){
      localStorage[this.model.get('filename')] = 0;
    }
    this.context = this.canvas.getContext('2d');
    _.bindAll(this, 'handleKeyDown', 'handleKeyUp', 'animate', 'getNext', 'moveMarkers');
    $(document).bind('keydown', this.handleKeyDown);
    $(document).bind('keyup', this.handleKeyUp);
    this.nextInterval = window.setInterval(this.getNext, 10);
    this.moveInterval = window.setInterval(this.moveMarkers, 1000/224);
    this.endInterval = window.setInterval(_.bind(this.checkEnd, this), 1000);
    this.animate();
    window.setTimeout(_.bind(function(){
      this.$el.find('#ready').hide();
      this.$el.find('#go').show();
      this.audio.play();
    }, this), 1500);
    window.setTimeout(_.bind(function(){
      this.$el.find('#go').hide();
    }, this), 2000);
  },

  retry: function () {
    game.loadSong(this.model);
  },

  backToChoose: function () {
    game.events.trigger('start');
  },

  backToMenu: function () {
    game.events.trigger('menu');
  },

  render: function () { 
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  },

  getTime: function () {
    return Math.floor(this.audio.currentTime * 1000);
  },

  getNext: function () {
    $('#time').html(this.getTime());
    $('#score').html(this.score);
    $('#combo').html(this.combo);
    if(!this.audio.paused){
      _.each(this.queues, function(queue, i){
          if (queue[0] <= (this.getTime() + 1000)){
            queue.shift();
            this.active[i].push({top:-66, type:i});
          }
      }, this);
    }
  },

  clearAllIntervals: function() {
    window.clearInterval(this.nextInterval);
    window.clearInterval(this.moveInterval);
    window.clearInterval(this.endInterval);
  },

  checkGameOver: function () {
    if (this.score <= -2500){
      this.gameOver = true;
      this.audio.pause();
      this.clearAllIntervals();
      this.$el.find('#game-over').show();
    }
  },

  checkEnd: function () {
    if(this.score >= 0 && this.score < 5000){
      sprites.octo_face.set('current_frame', 0);
    }
    if(this.score > 5000 && this.score < 10000){
      sprites.octo_face.set('current_frame', 2);
    }
    if(this.score > 10000){
      sprites.octo_face.set('current_frame', 1);
    }
    if(this.score < 0){
      sprites.octo_face.set('current_frame', 3);
    }

    if (this.getTime() >= this.model.get('end')){
      this.finished = true;
      this.audio.pause();
      this.clearAllIntervals();

      if(this.score > localStorage[this.model.get('filename')]){
        localStorage[this.model.get('filename')] = this.score;
        this.$el.find('#clear').append('<div id="new-highscore">New high score!</div>');
      }

      this.$el.find('#clear').show();
    }
  },

  moveMarkers: function () {
    if(!this.audio.paused){
      _.each(this.active, function(queue){
        _.each(queue, function(marker, i){
          if(marker.top > 440){
            this.missed.push(queue.splice(i, 1));
            this.displayStatus('Missed');
            this.score -= 500;
            this.checkGameOver();
            this.combo = 0;
          }else{
            marker.top += 2;
          }
        }, this);
      }, this);

      _.each(this.inactive, function(queue){
        _.each(queue, function(marker, i){
          if(marker.top > this.canvas.height){
            queue.splice(i, 1);
          }else{
            marker.top += 2;
          }
        }, this);
      }, this);

      _.each(this.missed, function(queue){
        _.each(queue, function(marker, i){
          if(marker.top > this.canvas.height){
            queue.splice(i, 1);
          }else{
            marker.top += 2;
          }
        }, this);
      }, this);
    }
  },

  displayActionText: function (queue) {
    switch (queue) {
      case 0: this.$el.find("#forked").show().delay(250).fadeOut('fast');
        break;
      case 1: this.$el.find("#pushed").show().delay(250).fadeOut('fast');
        break;
      case 2: this.$el.find("#pulled").show().delay(250).fadeOut('fast');
        break;
      case 3: this.$el.find("#cloned").show().delay(250).fadeOut('fast');
        break;
    }
  },

  displayStatus: function (text) {
    this.$el.find("#status").html(text).show().delay(250).fadeOut('fast');
  },

  check: function (queue) {
    if(this.active[queue].length > 0 && 
      this.active[queue][0].top < 334){
      this.displayStatus('Early');
      this.score -= 500;
      this.checkGameOver();
      this.combo = 0;
    }else if(this.active[queue].length > 0 && 
      this.active[queue][0].top > 366 &&
      this.active[queue][0].top < 381){
      this.inactive[queue].push(this.active[queue].shift());
      this.displayActionText(queue);
      this.displayStatus('Ok');
      this.score += 500;
      this.combo += 1;
    }else if(this.active[queue].length > 0 &&
      this.active[queue][0].top > 381 &&
      this.active[queue][0].top < 440){
      this.inactive[queue].push(this.active[queue].shift());
      this.displayActionText(queue);
      this.displayStatus('Perfect!');
      this.score += 1000;
      this.combo += 1;
    }
  },

  pause: function () {
    if(!this.gameOver && !this.finished){
      this.$el.find('#pause').toggle();
      if(this.audio.paused){
        this.audio.play();
      }else{
        this.audio.pause();
      }
    }
  },

  clear: function () {
    this.context.clearRect(0, 0,
      this.canvas.width, this.canvas.height);
  },

  renderMarker: function (type, color) {
    this.context.fillStyle = color;
    _.each(type, function(queues){
      _.each(queues, function(marker){
        this.context.drawImage(markers[marker.type].img,
          (marker.type * 100 + 44), marker.top);
      }, this)
    }, this);
  },

  animate: function() {
    if(!this.gameOver && !this.finished){
      requestAnimationFrame(this.animate);

      this.clear();

      _.each(sprites, function(sprite){
        sprite.render(this.context);
      }, this)

      if(!this.audio.paused){    
        this.renderMarker(this.active, 'green');
        //this.renderMarker(this.inactive, 'darkgray');
        this.renderMarker(this.missed, 'red');
      }

      _.each(foreground, function(sprite){
        sprite.render(this.context);
      }, this)
    }
  },

  handleKeyDown: function(event) {
    switch (event.keyCode) {
      case 70: this.check(0);
               sprites.octo_fork.set('current_frame', 1);
        break;
      case 71: this.check(1);
               sprites.octo_push.set('current_frame', 1);
        break;
      case 72: this.check(2);
               sprites.octo_pull.set('current_frame', 1);
        break;
      case 74: this.check(3);
               sprites.octo_clone.set('current_frame', 1);
        break;
      case 80: this.pause();
        break;
      case 27: this.pause();
        break;
    }
  },

  handleKeyUp: function(event) {
    switch (event.keyCode) {
      case 70: sprites.octo_fork.set('current_frame', 0);
        break;
      case 71: sprites.octo_push.set('current_frame', 0);
        break;
      case 72: sprites.octo_pull.set('current_frame', 0);
        break;
      case 74: sprites.octo_clone.set('current_frame', 0);
        break;
    }
  },

  destroy: function() {
    $(document).unbind('keydown');
    $(document).unbind('keyup');
    this.finished = true;
    this.unbind();
    this.clearAllIntervals();
  }

});