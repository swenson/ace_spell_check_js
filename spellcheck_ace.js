// You also need to load in typo.js and jquery.js

// You should configure these classes.
var editor = "editor"; // This should be the id of your editor element.
var lang = "en_US";
var dicPath = "/static/js/lib/typo/dictionaries/en_US/en_US.dic";
var affPath = "/static/js/lib/typo/dictionaries/en_US/en_US.aff";

// Make red underline for gutter and words.
$("<style type='text/css'>.ace_marker-layer .misspelled { position: absolute; z-index: -2; border-bottom: 1px solid red; margin-bottom: -1px; }</style>").appendTo("head");
$("<style type='text/css'>.misspelled { border-bottom: 1px solid red; margin-bottom: -1px; }</style>").appendTo("head");

// Load the dictionary.
// We have to load the dictionary files sequentially to ensure 
var dictionary = null;
$.get(dicPath, function(data) {
	dicData = data;
}).done(function() {
  $.get(affPath, function(data) {
	  affData = data;
  }).done(function() {
  	console.log("Dictionary loaded");
    dictionary = new Typo(lang, affData, dicData);
    enable_spellcheck();
    spell_check();
  });
});

// Check the spelling of a line, and return [start, end]-pairs for misspelled words.
function misspelled(line) {
	var words = line.split(' ');
	var i = 0;
	var bads = [];
	for (word in words) {
	  var x = words[word] + "";
	  var checkWord = x.replace(/[^a-zA-Z']/g, '');
	  if (!dictionary.check(checkWord)) {
	    bads[bads.length] = [i, i + words[word].length];
	  }
	  i += words[word].length + 1;
  }
  return bads;
}

var maxMarkerId = 0;

var currently_spellchecking = false;

var last_checked = 0;

// Spell check the Ace editor contents.
function spell_check() {
  // Wait for the dictionary to be loaded.
  if (dictionary == null) {
    return;
  }
  if (currently_spellchecking) {
  	return;
  }

  var session = ace.edit(editor).getSession();

  // Clear the markers.
  for (var i = 0; i < maxMarkerId; i++) {
    session.removeMarker(i);
  }
  maxMarkerId = 0;

  var current = new Date().getTime();
  if (current - last_checked < 500) {
  	return;
  }
  last_checked = current;

  currently_spellchecking = true;
  try {
	  var Range = ace.require('ace/range').Range
	  var lines = session.getDocument().getAllLines();
	  for (var i in lines) {
	  	// Clear the gutter.
	    session.removeGutterDecoration(i, "misspelled");
	    // Check spelling of this line.
	    var misspellings = misspelled(lines[i]);
	    
	    // Add markers and gutter markings.
	    if (misspellings.length > 0) {
	      session.addGutterDecoration(i, "misspelled");
	    }
	    for (var j in misspellings) {
	      var range = new Range(i, misspellings[j][0], i, misspellings[j][1]);
	      session.addMarker(range, "misspelled", maxMarkerId++, true);
	    }
	  }
	} finally {
		currently_spellchecking = false;
	}
}

function enable_spellcheck() {
  ace.edit(editor).getSession().on('change', function(e) {
    spell_check();
	});
	spell_check();
}