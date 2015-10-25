/* GCompris - hangman.js
 *
 *   Copyright (C) 2015 Rajdeep Kaur <rajdeep1994@gmail.com>
 *
 *    Authors:
 *    Bruno Coudoin <bruno.coudoin@gcompris.net> (GTK+ version)
 *    Rajdeep kaur <rajdeep51994@gmail.com> (Qt Quick port)
 *
 *   This program is free software; you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation; either version 3 of the License, or
 *   (at your option) any later version.
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program; if not, see <http://www.gnu.org/licenses/>.
 */

.pragma library
.import QtQuick 2.0 as Quick 
.import GCompris 1.0 as GCompris 
.import "qrc:/gcompris/src/core/core.js" as Core
.import "qrc:/gcompris/src/activities/lang/lang_api.js" as Lang

var currentLevel
var currentSubLevel
var maxLevel
var maxSubLevel
var items

var currentWord
var sp ="_ "
var dataset = null
var lessons
var wordList
var subLevelsLeft
var alreadyTypedLetters

// js strings are immutable, can't replace letter like that...
// http://stackoverflow.com/questions/1431094/how-do-i-replace-a-character-at-a-particular-index-in-javascript
String.prototype.replaceAt = function(index, character) {
    return this.substr(0, index) + character + this.substr(index+character.length);
}

function start(items_) {
    items = items_
    currentLevel = 0;
    currentSubLevel = 0;
    items.remainingLife = 6;
    
    var locale = GCompris.ApplicationInfo.getVoicesLocale(items.locale)

    var resourceUrl = "qrc:/gcompris/src/activities/lang/resource/"

    // register the voices for the locale
    GCompris.DownloadManager.updateResource(
                GCompris.DownloadManager.getVoicesResourceForLocale(locale))
    
    dataset = Lang.load(items.parser, resourceUrl, "words.json",
                        "content-"+ locale +".json")

    // If dataset is empty, we try to load from short locale
    // and if not present again, we switch to default one
    var localeUnderscoreIndex = locale.indexOf('_')
    if(!dataset) {
        var localeShort;
        // We will first look again for locale xx (without _XX if exist)
        if(localeUnderscoreIndex > 0) {
            localeShort = locale.substring(0, localeUnderscoreIndex)
        } else {
            localeShort = locale;
        }
        dataset = Lang.load(items.parser, resourceUrl, "words.json",
                            "content-"+localeShort+ ".json")
    }

    // If still dataset is empty then fallback to english
    if(!dataset) {
        // English fallback
        items.background.englishFallback = true
        dataset = Lang.load(items.parser, resourceUrl, "words.json",
                            "content-en.json")
    } else {
        items.background.englishFallback = false
    }

    lessons = Lang.getAllLessons(dataset)
    maxLevel = lessons.length
    initLevel();
    
}

function stop() {

}

function initLevel() {
    items.bar.level = currentLevel + 1;
    var currentLesson = lessons[currentLevel];
    wordList = Lang.getLessonWords(dataset, currentLesson);
    Core.shuffle(wordList);

    maxSubLevel = wordList.length;
    items.score.numberOfSubLevels = maxSubLevel;
    items.score.visible = true;

    subLevelsLeft = []
    for(var i in wordList)
        subLevelsLeft.push(i)

    initSubLevel();
    {
        //to set the layout...populate
        var letters = new Array();
        items.keyboard.shiftKey = false;
        for (var i = 0; i < wordList.length; i++) {
            var word = wordList[i].translatedTxt;
            for (var j = 0; j < word.length; j++) {
                var letter = word.charAt(j);
                var isUpper = (letter == letter.toLocaleUpperCase());
                if (isUpper && letters.indexOf(letter.toLocaleLowerCase()) !== -1)
                    items.keyboard.shiftKey = true;
                else if (!isUpper && letters.indexOf(letter.toLocaleUpperCase()) !== -1)
                    items.keyboard.shiftKey = true;
                else if (letters.indexOf(letter) === -1)
                    letters.push(word.charAt(j));
            }
        }
        letters.sort();
        // Remove space character if in list
        var indexOfSpace = letters.indexOf(' ')
        if(indexOfSpace > -1)
            letters.splice(indexOfSpace, 1)
        // generate layout from letter map
        var layout = new Array();
        var row = 0;
        var offset = 0;
        while (offset < letters.length-1) {
            var cols = letters.length <= 10
                    ? letters.length : (Math.ceil((letters.length-offset) / (3 - row)));
            layout[row] = new Array();
            for (var j = 0; j < cols; j++)
                layout[row][j] = { label: letters[j+offset] };
            offset += j;
            row++;
        }
    }
    items.keyboard.layout = layout;

}



function processKeyPress(text) {
    // Check if the character has already been typed
    if(alreadyTypedLetters.indexOf(text) !== -1) {
        // Character already typed, do nothing
        return;
    }
    // Add the character to the already typed characters
    alreadyTypedLetters.push(text);

    // Get all the indices of this letter in the word
    var indices = [];
    for(var i = 0 ; i < currentWord.length ; i ++) {
        if (currentWord[i] === text) {
            indices.push(i);
        }
    }

    if(indices.length == 0) {
        // The letter is not in the word to find
        items.remainingLife --;
        // If no more life, we display the good word and show the bonus
        if(items.remainingLife == 0) {
            items.hidden.text = items.goodWord.translatedTxt;
            items.bonus.bad("lion");
            return;
        }
    } else {
        // For all the indices found, we replace the "_" by the letter
        for(var index = 0 ; index < indices.length ; index ++) {
            // Characters in the word displayed are separated by spaces, this is why we do 2*index
            items.hidden.text = items.hidden.text.replaceAt(2*indices[index], text);
        }
    }

    // If no more '_' in the word to find, we have found all letters, show bonus
    if(items.hidden.text.indexOf("_") === -1) {
        items.bonus.good("lion");
    }
}

function nextLevel() {
    if(maxLevel <= ++currentLevel) {
        currentLevel = 0
    }
    currentSubLevel = 0;
    initLevel();
}


function previousLevel() {
    if(--currentLevel < 0) {
        currentLevel = maxLevel - 1
    }
    currentSubLevel = 0;
    initLevel();
}

function initSubLevel() {
    // initialize sublevel
    if(items.score.currentSubLevel < items.score.numberOfSubLevels)
        items.score.currentSubLevel = currentSubLevel + 1;
    else
        items.score.visible = false
    items.goodWordIndex = subLevelsLeft.pop()
    items.ok.visible = false
    items.goodWord = wordList[items.goodWordIndex]
    items.wordImage.changeSource("qrc:/gcompris/data/" + items.goodWord.image);
    items.remainingLife = 6;
    alreadyTypedLetters = new Array();
    currentWord = items.goodWord.translatedTxt;
    items.hidden.text = ""
    for(var i = 0; i < currentWord.length ; ++ i) {
        if(currentWord[i] == " ") {
            items.hidden.text = items.hidden.text + " " + " "
        } else {
            items.hidden.text = items.hidden.text + sp;
        }
    }
}

function nextSubLevel() {
    if( ++currentSubLevel >= maxSubLevel) {
        currentSubLevel = 0;
        nextLevel();
    } else {
        initSubLevel();
    }
}

function focusTextInput() {
    if (!GCompris.ApplicationInfo.isMobile && items && items.textinput)
        items.textinput.forceActiveFocus();
}