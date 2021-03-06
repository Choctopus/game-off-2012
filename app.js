window.game = {};
game.events = _.clone(Backbone.Events);
game.audio = {
  click : $('audio.click')[0],
  whip  : $('audio.whip')[0],
  music  : $('audio.menu-music')[0],
  current_track : false
};

var Router = Backbone.Router.extend({

  routes: {
    "" : "choctopus",
    "choose_song" : "choose_song",
    "song/:name"    : "song",
    "howto"        : "howto",
    "highscores"   : "highscores",
    "credits"      : "credits",
    "menu"         : "menu",
    "choctopus"    : "choctopus"
  },

  choose_song: function() {
    game.chooseSong();
  },

  howto: function() {
    game.howTo();
  },

  highscores: function() {
    game.highScores();
  },

  credits: function() {
    game.credits();
  },

  menu: function() {
    game.menu();
  },

  song: function(name) {
    game.loadSong(songs.where({filename: name})[0]);
  },

  choctopus: function() {
    game.choctopus();
  }

});

game.router = new Router;
game.muted = false;

game.refreshView = function(view) {
  $('.container').html(game.activeView.$el);
};

game.chooseSong = function() {
  game.playIfPaused();
  game.router.navigate("choose_song");
  if(game.activeView) game.activeView.destroy();
  game.activeView = new SongsView({
    collection: songs
  });
  game.refreshView();
};

game.howTo = function() {
  game.playIfPaused();
  game.router.navigate("howto");
  if(game.activeView) game.activeView.destroy();
  game.activeView = new HowtoView();
  game.refreshView();
};

game.highScores = function() {
  game.playIfPaused();
  game.router.navigate("highscores");
  if(game.activeView) game.activeView.destroy();
  game.activeView = new HighScoreView({
    collection : songs
  });
  game.refreshView();
};

game.credits = function() {
  game.playIfPaused();
  game.router.navigate("credits");
  if(game.activeView) game.activeView.destroy();
  game.activeView = new CreditsView({
    collection: songs
  });
  game.refreshView();
};

game.choctopus = function() {
  if(game.activeView) game.activeView.destroy();
  game.activeView = new ChoctopusView();
  game.refreshView();
  window.setTimeout(game.menu, 1750);
};

game.menu = function() {
  game.playIfPaused();
  game.router.navigate("menu");
  if(game.activeView) game.activeView.destroy();
  game.activeView = new MenuView();
  game.refreshView();
  game.events.trigger('playSound', 'whip');
};

game.loadSong = function(song) {
  game.audio.music.pause();
  if(game.activeView) game.activeView.destroy();
  game.activeView = new SongView({
    model : song
  });
  game.router.navigate("song/" + song.get('filename'));
  game.refreshView();
};

game.playIfPaused = function(){
  if(!game.muted && game.audio.music.paused){
    game.audio.music.play();
  }
};

game.mute = function(){
  _.each(game.audio, function(track){
    track.muted = true;
  });
  game.muted = true;
  $("#mute").html('Un-mute');
};

game.unmute = function(){
  _.each(game.audio, function(track){
    track.muted = false;
  })
  game.muted = false;
  $('#mute').html('Mute');
};

game.muteToggle = function(){
  if(game.muted){
    game.unmute();
  }else{
    game.mute();
  }
}

$('#mute').click(function() {
  game.muteToggle();
});

game.events.on("start", function() {
  game.chooseSong();
});

game.events.on("howto", function() {
  game.howTo();
});

game.events.on("highscores", function() {
  game.highScores();
});

game.events.on("credits", function() {
  game.credits();
});

game.events.on("menu", function() {
  game.menu();
});

game.events.on("loadSong", function(song) {
  game.loadSong(song);
});

game.events.on("choctopus", function() {
  game.choctopus();
});

game.events.on("playSound", function(sound) {
  if(!game.muted){
    game.audio[sound].play();
  }
});

function handleVisibilityChange() {
  if (document.webkitHidden) {
    $('audio.menu-music')[0].muted = true
    if(game.audio.current_track){
      game.audio.current_track.muted = true
    }
  } else {
    if(!game.muted){
      $('audio.menu-music')[0].muted = false
      if(game.audio.current_track){
        game.audio.current_track.muted = false
      }
    }
  }
}

document.addEventListener("webkitvisibilitychange", handleVisibilityChange, false);

Backbone.history.start();
