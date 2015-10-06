HTML5 の Web Audio API の存在をご存知でしょうか？
購読してる専門誌でも紹介されてるのを見かけた記憶がなかったのでよく知らなかったのですが、検索してみると興味深い記事が結構目につきます。
CANVAS や WebGL など見た目系機能が注目されがちな HTML5 ですが、音声方面も面白いかなという事で、今回調べたことをまとめがてら紹介してみたいと思います。

<!--more-->

## モジュラールーティング

Web Audio API を扱う上で「モジュラールーティング」という思想の理解が大事になります。

簡単に言うと「音の発生源」「音の加工」「音の出力」をモジュール単位で管理し、それらをお好みのパターンで接続しあい音を出力させることができます。
楽器で例えると、エレキギター → エフェクター → アンプの接続のような関係です。例えばエフェクターを使いたくなければ直接アンプに繋いでも良いですし、エレキギター２本を１つのエフェクターに繋いでも良いといった感じです。

ちなみに音階の調整は「音の発生源」で行い、ボリュームの調整は「音の加工」で行う、といったようにそれぞれの領域でできる事が異なります。

## 音を鳴らしてみる

では次のモジュールを使用して実際に音を鳴らしてみます。

- 音の発生源 … OsciillatorNode オブジェクト
    - 特定の周期的波形を作り出すことができデフォルトでは 440Hz の正弦波を作り出します。
- 音の出力 … AudioDestinationNode オブジェクト
    - 音の発生源を AudioDestinationNode に接続させることで音を出力することができます。

Web Audio API を扱う際は、最初に AudioContext オブジェクトを生成し、生成した AudioContext を経由し必要なオブジェクトの生成／参照を行うことになります。

以下の RUN をクリックすると音が鳴り、３秒後に停止します。
（互換対応と書かれてるところは、ブラウザ間の実装の違いを吸収するための処理です。）

#### code demo noAuto

##### script

    //各ノードを生成するためのベースとなるオブジェクト
    window.AudioContext = window.AudioContext||window.webkitAudioContext; //互換対応
    var audioContext = new AudioContext();

    //音の発生源
    var osciillatorNode = audioContext.createOscillator();

    //音の出力
    var audioDestinationNode = audioContext.destination;

    //音の発生源を音の出力装置に接続！
    osciillatorNode.connect(audioDestinationNode);

    //音を鳴らす
    osciillatorNode.start = osciillatorNode.start || osciillatorNode.noteOn; //互換対応
    osciillatorNode.start();

    //音を止める
    setTimeout(function(){
        osciillatorNode.stop();
    },3000);



## 音を加工してみる

次は「音の発生源」と「音の出力」の間に「音の加工」を行う GainNode オブジェクトを挟んで音質をソフトにしてみます。
また、「音の発生源」である OsciillatorNode オブジェクトの周波数を変更することで音程をコントロールしてみます。
実行するとドレミファソファミレドと鳴ります。

#### code demo noAuto

##### script

    window.AudioContext = window.AudioContext||window.webkitAudioContext;
    var audioContext = new AudioContext();
    var note = {};
    ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'].forEach(function(v, i){
        note[v] = i;
    });
    var play = function(noteId){
        var osciillatorNode = audioContext.createOscillator();
        osciillatorNode.start = osciillatorNode.start || osciillatorNode.noteOn;

        //音程を設定
        var frequency = parseInt(440 * Math.pow(Math.pow(2,1/12), (3-12) + note[noteId]), 10);
        osciillatorNode.frequency.value = frequency;

        //音量を少しづつ下げ音色をソフトにする
        var gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0, play.count);
        gainNode.gain.linearRampToValueAtTime(1.0, play.count + 0.01);
        gainNode.gain.linearRampToValueAtTime(0.7, play.count + 0.20);
        gainNode.gain.linearRampToValueAtTime(0.4, play.count + 0.40);
        gainNode.gain.linearRampToValueAtTime(0.0, play.count + 0.80);

        //接続（発生源 → 加工）
        osciillatorNode.connect(gainNode);

        //接続（加工 → 出力）
        gainNode.connect(audioContext.destination);

        //再生開始時間を指定する
        osciillatorNode.start(play.count || 0);

        play.count = play.count + .8;
        return play;
    }
    play.count = 0;

    //ドレミファソファミレド
    play('C')('D')('E')('F')('G')('F')('E')('D')('C');

単音を連続して鳴らす場合は、osciillatorNode.start( time ) で音を再生するタイミングを設定します。
また、osciillatorNode.stop( time ) で発音を停止する時間を設定することもできます。

## 音声ファイルを再生してみる

wav や mp3 のような音声ファイルを読み込んで再生することもできます。

音声ファイルを再生するには responseType に arraybuffer を指定し XMLHttpRequest で音声ファイルを取得した後、decodeAudioData() メソッドでデータ形式を変更する必要があります。

音声ファイルの取得処理を何度も行うような場合は、以下のように Promise オブジェクトベースのファイル取得処理を定義しておくと便利です。

#### code demo

##### script

    window.AudioHelper = function(){}
    AudioHelper.loadAudioBuffer = function(audioContext, url){
        var _decodeAudioData = function(audioFile, cb){
                audioContext.decodeAudioData(
                    audioFile,
                    function(buffer) {
                        if (!buffer) {
                            alert('error decoding file data: ' + url);
                            return;
                        }
                        cb(buffer);
                    },
                    function(error) {
                        alert('decodeAudioData error', error);
                    }
                );
        }
        var _requestFile = function(cb){
            var _xhr = new XMLHttpRequest();
            _xhr.open("GET", url, true);
            _xhr.responseType = "arraybuffer";
            _xhr.onload = function(){
                cb(_xhr.response);
            };
            _xhr.send();
        }
        return new Promise(function(resolve, reject){
            _requestFile(function(response){
                _decodeAudioData(response, function(buffer){
                    resolve(buffer);
                });
            });
        });
    }

以下の様に使います。

    var audioContext = new AudioContext();

    //音声ファイルを１つだけ取得してから処理する場合
    AudioHelper.loadAudioBuffer(audioContext, 'music/jazz.wav').then(function(buffer){
        ・・・
    })
    //複数の音声ファイルを取得した後、処理する場合
    Promise.all([
        'music/jazz.wav',
        'music/blues.wav'
    ].map(function(url){
        return AudioHelper.loadAudioBuffer(audioContext, url);
    })).then(function(buffer){
        ・・・
    })

.then(function(buffer){  }) はファイルの取得が完了すると実行され、buffer には decodeAudioData() により変換されたデータが引き渡されます。

音声ファイルを再生する場合は OsciillatorNode のではなく BufferSourceNode を使用します。BufferSourceNode を「音の発生源」とし、buffer 属性に取得した buffer をセットすることで音声ファイルの再生が可能になります。

#### code demo noAuto

##### html

    <button class="stop"></button>

##### script

    var btn = $DEMO[0].querySelector('.stop');
    btn.textContent = 'now loading ...';
    var audioContext = new AudioContext();
    var bufferSource;
    AudioHelper.loadAudioBuffer(audioContext, '/sozai/music/acoustic10.mp3').then(function(buffer){
        btn.textContent = 'STOP';
        bufferSource = audioContext.createBufferSource();
        bufferSource.buffer = buffer;
        bufferSource.connect(audioContext.destination);
        bufferSource.start(audioContext.currentTime + 0.100);
    });
    btn.addEventListener('click', function(){
        !bufferSource || bufferSource.stop();
    }, false);


## 簡易的なサウンドプレイヤーを作ってみる

音量調整や再生／停止ボタン付きの簡易的なサウンドプレイヤーを作ってみます。
サウンドプレイヤーでは複数の音声ファイルを扱うため、再生したい曲を切り替えた際、取得済みの音声ファイルの再取得をしないように汎用処理側でキャッシュするようにしてみます。

#### code demo

##### script

    window.AudioHelper = function(audioContext){
        this.config = {
            audioContext: audioContext,
            audioBuffers: {}
        }
    };
    AudioHelper.prototype.loadAudioBuffer = function(id, url){
        var o = this, c = o.config;
        return new Promise(function(resolve){
            //キャッシュがあった場合それを返す
            if(c.audioBuffers[id]){
                resolve(c.audioBuffers[id]);
            }
            else{
                return AudioHelper.loadAudioBuffer(c.audioContext, url).then(function(buffer){
                    //初めて取得した場合はキャッシュする
                    c.audioBuffers[id] = buffer;
                    resolve(buffer);
                })
            }
        });
    }
    AudioHelper.loadAudioBuffer = function(audioContext, url){
        //・・・
    }

##### script noCode

    AudioHelper.loadAudioBuffer = function(audioContext, url){
        var _decodeAudioData = function(audioFile, cb){
                audioContext.decodeAudioData(
                    audioFile,
                    function(buffer) {
                        if (!buffer) {
                            alert('error decoding file data: ' + url);
                            return;
                        }
                        cb(buffer);
                    },
                    function(error) {
                        alert('decodeAudioData error', error);
                    }
                );
        }
        var _requestFile = function(cb){
            var _xhr = new XMLHttpRequest();
            _xhr.open("GET", url, true);
            _xhr.responseType = "arraybuffer";
            _xhr.onload = function(){
                cb(_xhr.response);
            };
            _xhr.send();
        }
        return new Promise(function(resolve, reject){
            _requestFile(function(response){
                _decodeAudioData(response, function(buffer){
                    resolve(buffer);
                });
            });
        });
    }



キャッシュを効かす場合は、AudioHelper をインスタンス化し、音声ファイル取得時はそのファイルを一意に特定するための ID を指定します。

    var audioContext = new AudioContext();
    var audioHelper = new AudioHelper(audioContext);
    audioHelper.loadAudioBuffer('jazz', 'music/jazz.wav').then(function(buffer){
        buffer // 最初は XHR で取得したデータ
    });
    audioHelper.loadAudioBuffer('jazz', 'music/jazz.wav').then(function(buffer){
        buffer // 二度目はキャッシュしたデータ
    });

<br/>
以下のような仕様で実装してみました。

- 操作は再生、停止、音量調整、再生する曲の選択のみ
- 再生する曲を変更した場合は自動的に再生する

#### code demo

##### css

    .audioPlayer{
        position: relative;
        display: inline-block;
        padding:32px;
        background:#f8f8f8;
        border-radius: 4px;
        border: solid 1px #eee;
    }
    .audioPlayer__controller > *{
        display: inline-block;
        vertical-align: middle;
    }
    .audioPlayer__status{
        padding: 2px 16px;
        position: absolute;
        bottom: 0;
        right: 0;
        color: #aaa;
    }

##### html

    <div class="audioPlayer">
        <div class="audioPlayer__controller">
            <select class="music">
                <option value="/sozai/music/acoustic10.mp3">funcy music</option>
                <option value="/sozai/music/acoustic07.mp3">acoustic music</option>
            </select>
            <button class="play">play</button>
            <button class="stop">stop</button>
            vol: <input class="volume" type="range" min="0" max="1" value="1" step="0.1"/>
        </div>
        <div class="audioPlayer__status">
            <span class="status"></span>
        </div>
    </div>



##### script

    //Audio 関連オブジェクト
    var audioContext = new AudioContext();
    var gainNode = audioContext.createGain();
    var audioHelper = new AudioHelper(audioContext);

    //選択中の Audio データ
    var selectionAudio = {
        buffer: '',
        bufferSource: ''
    }

    //エレメントとトリガー定義
    var el = new function(){
        var o = this;
        o.player = document.querySelector('.audioPlayer'); 
        o.music = o.player.querySelector('.music');
        o.play = o.player.querySelector('.play');
        o.stop = o.player.querySelector('.stop');
        o.status = o.player.querySelector('.status');
        o.valume = o.player.querySelector('.volume');
        o.status = o.player.querySelector('.status');
        o.play.addEventListener('click', function(){
            action.play();
        }, false);
        o.stop.addEventListener('click', function(){
            action.stop();
        }, false);
        o.valume.addEventListener('change', function(){
            action.volume(this.value);
        }, false);
        o.music.addEventListener('change', function(){
            action.selectionMusic().then(function(){
                action.play();
            });
        }, false);
    }

    //プレイヤーの機能
    var action = {
        play : function(){
            if(!selectionAudio.buffer) return;
            action.stop();
            var bufferSource = audioContext.createBufferSource();
            bufferSource.buffer = selectionAudio.buffer;
            bufferSource.connect(gainNode);
            bufferSource.start(audioContext.currentTime + 0.100);
            selectionAudio.bufferSource = bufferSource;
        },
        stop : function(){
            if(!selectionAudio.bufferSource) return;
            selectionAudio.bufferSource.stop();
            selectionAudio.bufferSource.disconnect();
            selectionAudio.bufferSource = '';
        },
        volume : function(valume){
            gainNode.gain.value = valume;
        },
        selectionMusic : function(){
            el.status.textContent = 'now loading...';
            return new Promise(function(resolve){
                var key = el.music.options[el.music.selectedIndex].textContent;
                var url = el.music.value;
                return audioHelper.loadAudioBuffer(key, url).then(function(buffer){
                    el.status.textContent = 'music loaded !';
                    selectionAudio.buffer = buffer;
                    resolve();
                });
            })
        }
    }

    //接続
    gainNode.connect(audioContext.destination);

    //デフォルトファイルの取得
    action.selectionMusic();

## 音声ファイルを音源とした作曲向けライブラリを作ってみる

OsciillatorNode オブジェクトの周波数を変えることで音階を鳴らすことができましたが、音声ファイルに対しても同様のことができます。
この特性を利用して簡易的な作曲向けライブラリを作ってみます。
作曲という視点で考えると OsciillatorNode ベースの音階再生とは異なり下記の点も考慮する必要性があります。

- 複数の音源ファイルの利用と同時再生
- オクターブを超えた音域の指定
- 音長を考慮した再生タイミング  
- 同一演奏パターンの繰り返し指定

これらを直感的に指定できる API を持つ ScorePlay クラスの実装を考えてみます。

#### code demo

##### script

    window.ScorePlay = function(audioContext ){
        var o = this, c = o.config = {
            audioContext: audioContext,
            score : {},
            bufferSourceSet: []
        } 
        c.audioHelper = new AudioHelper(audioContext);
    }
    ScorePlay.scaleKey = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    ScorePlay.scale = {};
    ScorePlay.scaleKey.forEach(function(v, i){
        ScorePlay.scale[v] = i;
        ScorePlay.scale[v+'+'] = i+12;
        ScorePlay.scale[v+'-'] = i-12;
    });

    ScorePlay.prototype.loadSound = function(soundData){
        var o = this, c = o.config;
        return Promise.all(soundData.map(function(obj) {
            return c.audioHelper.loadAudioBuffer(obj.id, obj.url);
        }));
    }
    ScorePlay.prototype.play = function(tone, count, scale){
        var o = this, c = o.config;
        var startTime = c.audioContext.currentTime + 0.100;
        scale.split('|').forEach(function(scale){
            var buffer = c.audioHelper.config.audioBuffers[tone] || '';
            var scaleVal = ScorePlay.scale[scale];
            if(scaleVal != undefined){
                var bufferSource = c.audioContext.createBufferSource();
                c.bufferSourceSet.push(bufferSource);
                bufferSource.buffer = buffer;
                var gainNode = c.audioContext.createGain();
                bufferSource.connect(gainNode);
                gainNode.connect(c.audioContext.destination);
                bufferSource.playbackRate.value = 1 * Math.pow(Math.pow(2,1/12), scaleVal||0) || 1;
                bufferSource.start(startTime + count);
            }
        });
    }

    ScorePlay.prototype.addScore = function(partId, partSet){
        var o = this, c = o.config;
        c.score[partId] = partSet;
    }
    ScorePlay.prototype.start = function(){
        var o = this, c = o.config;
        o.stop();
        for(var i in c.score){
            c.score[i].forEach(function(part){
                part.count = 0;
                var play = function(score){
                    var note = score.split(' ');
                        note.forEach(function(v){
                            o.play(part.sound, part.count, v);
                            part.count = part.count + 1/note.length;
                        })
                }
                var parse = function(score, parentLoop){
                    var loop = 1;
                    if(score instanceof Array){
                        score.forEach(function(v, i){
                            if(typeof v == 'number')　loop = v;
                            else{
                                for(var i = 0; i < loop; i++){
                                    parse(v, loop);
                                }
                            }
                        });
                    }
                    else{
                        play(score, 1)
                    }
                }
                parse(part.score, 1);
            });
        }
    }
    ScorePlay.prototype.stop = function(){
        var o = this, c = o.config;
        c.bufferSourceSet.forEach(function(bufferSource){
            bufferSource.stop();
        });
    }

以下のように使用します。

    //AudioContext の生成
    var audioContext = new AudioContext();

    //ScorePlay オブジェクトの生成
    var scorePlay = new ScorePlay(audioContext);

    //音源ファイルのロード
    scorePlay.loadSound([
        {id:'音源を一意に特定するID', url:'音源ファイルのURL'},
        {id:'音源を一意に特定するID', url:'音源ファイルのURL'},
        ・・・
    ]).then(function(){

        //譜面の登録
        scorePlay.addScore( 'パートを一意に特定するID' ,[
            {
                sound: 'loadSound()で指定したID',
                score: [
                    [繰り返し回数, 'スコア'],
                    [繰り返し回数, [繰り返し回数, 'スコア']], //入れ子の指定も可
                    ...
                ]
            },
            {
                sound: 'loadSound()で指定したID',
                score: [
                    [繰り返し回数, 'スコア'],
                    [繰り返し回数, [繰り返し回数, 'スコア']], //入れ子の指定も可
                    ...
                ]
            },
            ...
        ]);
    });

<br/>
ピアノとドラムのパートを適当に演奏させてみます。

#### code demo edit

##### html

    <button class="play" disabled>再生</button>
    <button class="stop" disabled>停止</button>

##### script

    var el = new function(){
        var o = this;
        o.play = $DEMO[0].querySelector('.play')
        o.stop = $DEMO[0].querySelector('.stop')
        o.play.addEventListener('click', function(){
            scorePlay.start();
        }, false)
        o.stop.addEventListener('click', function(){
            scorePlay.stop();
        }, false)
    }

    var audioContext = new AudioContext();
    var scorePlay = new ScorePlay(audioContext);
    scorePlay.loadSound([
        {id:'piano', url:'/sozai/sound/piano_c.wav'},
        {id:'snare', url:'/sozai/sound/snare.wav'},
        {id:'hihat', url:'/sozai/sound/hihat.wav'},
        {id:'kick', url:'/sozai/sound/kick.wav'}
    ]).then(function(){
        el.play.disabled = false;
        el.stop.disabled = false;
    });

    //ピアノ
    scorePlay.addScore('piano' ,[
        {
            sound: 'piano',
            score: [
                    [8, '.'],
                    [
                        4,
                        [
                            [1,'G-|C|Eb|G'],
                            [2,'.'],
                            [1,'G-|C|G . Bb .'],
                            [1,'F-|C|F . . C'],
                            [1,'. . G .'],
                            [1,'.'],
                            [1,'F-|C|Eb . F .']
                        ]
                    ]
            ]
        },
    ]);

    //ドラム
    scorePlay.addScore('drum' ,[
        {
            sound: 'snare',
            score: [32, '. . C .']
        },
        {
            sound: 'hihat',
            score: [32, 'C C C C']
        },  
        {
            sound: 'kick',
            score: [16, [
                [1, 'C . . . . . . .'],
                [1, 'C . C . . . . .']
            ]]
        }
    ]);

スコアの記述ルールは、「.」が無音、「C|E|G」のように | で区切った場合は和音、「+」が１オクターブ上、「-」が１オクターブ下になります。
各パート毎のボリュームの変更や、テンポの変更など機能不足な面はありますが、CANVAS なんかを使って譜面を書き起こせる UI と連動させて、作曲ツールを作ってみたら面白いかもしれませんね。


## 最後に

いかがだったでしょうか？既にご存知の機能だったでしょうか？
この記事では Web Audio API で遊ぶ上での最低限の機能しか紹介できてませんが、再生終了時に実行されるコールバック関数や、ループ再生等、実用的な機能がほかにもいろいろありますので興味がありましたらぜひ調べてみてください。
