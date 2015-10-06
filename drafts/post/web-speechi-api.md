HTML5 の Web Speech API をご存知でしょうか？
ブラウザベースで音声認識とテキストの読み上げを実現する API です。
今回はこの Web Speech API について試したことをまとめてみました。
ちなみに少し前の Chrome では Speech Input API という INPUT 要素に x-webkit-speech という属性を記述するのみで、手軽に音声認識を実現できるという機能がありましたが現バージョンでは廃止されてるようです・・・  
Web Speech API の対応ブラウザは [Can I Use](http://caniuse.com/#feat=web-speech) よりご確認ください。

<!--more-->



## テキストの読み上げを行う Speech Synthesis API

Speech Synthesis API を使用すると、指定したテキストを PC に読み上げさせることできます。
使い方は非常に簡単で、new SpeechSynthesisUtterance( 読み上げテキスト ) で得たオブジェクトを speechSynthesis.speak() メソッドに渡すのみです。
RUN をクリックすると読み上げが行われます。

#### code demo noAuto

##### script

    speechSynthesis.speak(
        new SpeechSynthesisUtterance("No Programming, No Life")
    );

<br/>
以下のよう各種パラメータを指定することもできます。パラメータの詳細は [Web Speech API Specification | W3C](https://dvcs.w3.org/hg/speech-api/raw-file/tip/speechapi.html) をご参照ください。

#### code demo noAuto

##### script

    var synthes = new SpeechSynthesisUtterance();
    synthes.voiceURI = 'native';
    synthes.volume = 1;
    synthes.rate = 1;
    synthes.pitch = 2;
    synthes.text = 'No Programming, No Life';
    synthes.lang = 'en-US';
    synthes.onend = function(e) {
        alert('Finished in ' + event.elapsedTime + ' seconds.');
    };
    speechSynthesis.speak(synthes);

### 日本語テキストを認識させてみる

日本語のテキストを認識させるには lang 属性に ja-JP を指定します。


#### code demo noAuto

##### script

    var synthes = new SpeechSynthesisUtterance(
        '日本語のテキストを認識させるには、lang 属性に ja-JP を指定します。'
    );
    synthes.lang = "ja-JP"
    speechSynthesis.speak( synthes );

### 指定した音声で読み上げを行う

SpeechSynthesisUtterance オブジェクトの voice 属性に任意の SpeechSynthesisVoice オブジェクトを指定することで音声を変更することができます。
SpeechSynthesisVoice オブジェクトは speechSynthesis.getVoices() により得られる音声リストの中に保持されますので、利用したい音声をそこから選ぶ事になります。
例えばイタリア人風に読み上げを行う場合は以下のように記述します。

#### code demo

##### html

    <button>イタリア人風に読み上げる</button>

##### script

    var speakBtn = $DEMO[0].querySelector('button');
    speakBtn.addEventListener('click', function(){
        var synthes = new SpeechSynthesisUtterance('No Programming, No Life');
        var voices = speechSynthesis.getVoices();
        voices.forEach(function(v, i){
            //イタリア人風
            if(v.name == 'Google Italiano') synthes.voice = v;
        });
        speechSynthesis.speak(synthes);
    }, false);

ちなみにページロード直後に speechSynthesis.getVoices() を実行しても音声リストが取得できないというバグ？があるようなので、getVoice() を行うタイミングには注意が必要です。上記例ではボタンクリック時に取得してます。

- [javascript events - Getting the list of voices in speechSynthesis of Chrome (Web Speech API) - Stack Overflow](http://stackoverflow.com/questions/21513706/getting-the-list-of-voices-in-speechsynthesis-of-chrome-web-speech-api)
- [Issue 340160:getVoices on page load | chromium](https://code.google.com/p/chromium/issues/detail?id=340160)

### 指定可能な音声を調べる

前述のとおり speechSynthesis.getVoices() により音声リストが取得できるので、この中身を参照することで利用可能な音声を調べることができます。
ちなみに MAC と Windows では取得できる音声の数が大きく異なり、Windows は MAC の一部の音声しか利用できません。（MAC のみの音声はネット非接続環境でも利用できることから内蔵音声かと思われます）


#### code demo

##### html

    <button class="loadVoiceBtn">Show Voice List</button>
    <ul></ul>

##### script

    var loadVoiceBtn = $DEMO[0].querySelector('.loadVoiceBtn')
    loadVoiceBtn.addEventListener('click', function(){
        var voices = speechSynthesis.getVoices();
        Array.prototype.forEach.call(voices, function(v, i){
            var li = document.createElement('li');
            li.textContent = v.name;
            $DEMO[0].querySelector('ul').appendChild(li);
        });
        this.remove();
    }, false);


### いろいろな音声で読み上げを行う

では、利用可能な音声の種類分の再生ボタンを生成し、任意の音声による読み上げができるようにしてみます。

#### code demo

##### html

    <button class="getVoiceBtn">Get Voice</button>  

##### script

    var Speech = {
        voices: null,
        synthes: null,
        init: function(){
            var o = this;
            o.loadVoices();
            o.synthes = new SpeechSynthesisUtterance();
        },
        loadVoices: function(){
            var o = this;
                o.voices = window.speechSynthesis.getVoices();
        },
        say: function(msgText, voiceName){
            var o = this;
            o.synthes.voice = null;
            if(voiceName){
                    for (var i = 0; i < o.voices.length; i++){
                        if (o.voices[i].name == voiceName)
                            o.synthes.voice = o.voices[i];
                    }
            }
            o.sayStop();
            o.synthes.text = msgText;
                speechSynthesis.speak(o.synthes);
        },
        sayStop: function(){
                speechSynthesis.cancel();
        }
    }
    var View = {
        getVoiceButtons : function(voices){
            var buttons = document.createElement('div');
                for (var i = 0; i < voices.length; i++){
                var voice = voices[i];
                var button = document.createElement('button');
                button.textContent = voice.name;
                buttons.appendChild(button);
                }
            return buttons;
        }
    }
    var App = {
        el: {
            getVoiceBtn : $DEMO[0].querySelector('.getVoiceBtn')
        },
        init: function(){
            var o = this;
            Speech.init();
            o.el.getVoiceBtn.addEventListener('click', function(){
                o.showVoiceButtons();
                this.remove();
            }, false);
        },
        showVoiceButtons : function(){
            Speech.loadVoices();
            var buttons = View.getVoiceButtons(Speech.voices)
            buttons.addEventListener('click', function(evt){
                Speech.say(
                    'No Programming, No Life',
                    evt.target.textContent
                );
            }, false);
            $DEMO[0].appendChild(buttons);
        }
    }
    App.init();

## 音声認識を行う Speech Recognition API

Speech Recognition API を使用すると、PC 接続されたマイクからの入力音声を解析し、テキスト変換させることができます。

下記コードを実行するとマイクデバイスへのアクセス許可を求められるので、許可を選択してみてください。
録音状態であることを示すアイコンがタブ脇に一定時間表示されるので、その間に適当な言葉を喋ってみてください。
録音状態が終了するとテキスト変換された文字列が表示されます。

#### code demo noAuto

##### script

    window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
    var recognition = new webkitSpeechRecognition();
    recognition.lang = 'ja';

    // 録音終了時トリガー
    recognition.addEventListener('result', function(event){
        alert(event.results.item(0).item(0).transcript)
    }, false);

    // 録音開始
    recognition.start();

<br/>
変換されたテキストの表示処理部分をみると、.item(0).item(0).. と、なにやら配列の入れ子のようなデータを表示してます。

    alert(event.results.item(0).item(0).transcript)

<br/>
配列の中身を全て走査するようにすると、以下のような記述になります。

    //配列１
    var results = event.results;
    for(var i = 0; i < results.length; i++){
        //配列２
        var result = results.item(i);
        for(var j = 0; j < result.length; j++){
            var alternative = result.item(j);
            alert(alternative.transcript)
        }
    }

results とその子である result の２つの配列で構成されてます。

まず１つ目の resutls ですが、ここには認識した音声の音節単位の解析結果が格納されます。
例えば、文章を音声入力した場合、発音の区切り目から複数の音節から構成されていると解釈され、音節単位に区切られた形で配列に格納されます。
このような**連続音節認識**をさせる場合は、continuous パラメータ（後述）に true を指定し録音を行います。

次に ２つ目の result ですが、ここには変換候補リストが格納されます。
例えば「javascript」と発音すると、解析結果として「javascript」「ジャバスクリプト」「java script」などが候補として挙げれられ、配列に格納されます。
このように複数の**変換候補リスト**を求める場合は、maxAlternatives パラメータ（後述）に要求する候補数を指定します。


### 複数の変換候補を求める

では、入力音声に対する変換候補を複数表示させるため、recognition オブジェクトの maxAlternatives 属性に変換候補数を指定し試してみます。

#### code demo noAuto

##### script

    window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
    var recognition = new SpeechRecognition();
    recognition.lang = 'ja';

    //変換候補数を指定
    recognition.maxAlternatives = 3;

    // 録音終了時トリガー
    recognition.addEventListener('result', function(event){
        var results = event.results;
        for(var i = 0; i < results.length; i++){
            var result = results.item(i);
            for(var j = 0; j < result.length; j++){
                var alternavive = result.item(j);
                alert(
                    alternavive.transcript + 
                    '(' + alternavive.confidence + ')'
                )
            }
        }

    }, false);

    // 録音開始
    recognition.start();

いかがでしょうか？変換候補が複数表示されましたでしょうか？
かっこ内の数値は候補の信頼度を表しています。

### 連続音節認識で文章の変換を行う

次に recognition オブジェクトの continuous 属性に true を指定し、連続音節認識も試してみます。
連続音節認識の場合、音声入力待ち状態が長いので、任意のタイミングでコントロールできるよう以下サンプルでは録音の開始／停止を行うトグルボタンを用意しました。
また、音声認識で得られたテキストを Speech Synthesis API により読み上げるようにしています。


#### code demo

##### html

    <div class="recPlayer">
        <div class="recPlayer__tools">
            <button class="recPlayer__recBtn">録音</button>
        </div>
        <div class="recPlayer__results">
            <ul></ul>
        </div>
    </div>

##### script

    window.SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition;
    var Recorder = {
        recognition : null,
        init: function(){
            var o = this;
            o.recognition = new SpeechRecognition();
            o.recognition.lang = 'ja';
            o.recognition.continuous = true;
        },
        recStart: function(){
            var o = this;
            o.recognition.start();
        },
        recStop: function(){
            var o = this;
            o.recognition.stop();
        },
        getRecText: function(results, resultIndex){
            var text;
            for(var i = resultIndex; i < results.length; i++){
                        var result = results.item(i);
                        if(result.final === true || result.isFinal === true){
                    text = result.item(0).transcript;
                }
                }
            return text;
        }
    }
    var Speeker = {
        synthes: null,
        init: function(){
            var o = this;
            o.synthes = new SpeechSynthesisUtterance();
            o.synthes.lang = "ja-JP"
        },
        say: function(msgText){
            var o = this;
            o.synthes.text = msgText;
                speechSynthesis.speak(o.synthes);
        }
    }
    var View = {
        getResultItem: function(text){
            var el = document.createElement('li');
            el.textContent = text;
            return el;
        }
    }
    var App = {
        el: {
            recBtn: $DEMO[0].querySelector('.recPlayer__recBtn'),
            resultList: $DEMO[0].querySelector('.recPlayer__results ul')
        },
        status: {
            nowRec: false,
            recorderText: ''
        },
        init: function(){
            var o = this;
            Recorder.init();
            Speeker.init();
            Recorder.recognition.addEventListener('start', function(){
                o.status.nowRec = true;
                o.el.recBtn.textContent = '停止';
            });
            Recorder.recognition.addEventListener('end', function(){
                o.status.nowRec = false;
                o.el.recBtn.textContent = '録音';
            });
            Recorder.recognition.addEventListener('result', function(event){
                var text = Recorder.getRecText(event.results, event.resultIndex);
                o.el.resultList.insertBefore(
                    View.getResultItem(text),
                    o.el.resultList.firstChild
                );
                Speeker.say(text);
            });
            o.el.recBtn.addEventListener('click', function(){
                if(o.status.nowRec){
                    Recorder.recStop();
                }
                else{
                    Recorder.recStart();
                }
            });
        }
    }
    App.init();

## 最後に

いかがだったでしょうか？
日本語はイマイチなとこもありますが、英語の音声再生の出来はすごいですね。
英会話を勉強されてる方向けに、英語サイトで選択範囲を英語で音声再生させるなんてゆう Chrome エクステンションを作ってみたらおもしろいかもしれませんね。
