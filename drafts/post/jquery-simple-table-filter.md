ちょっと業務で必要になったので、jQuery によるテーブルフィルタリング処理の実装を考えてみます。  
まずはなるべくシンプルで、フィルタ条件の入力フィールドとかもプラグインが勝手に生成するんじゃなくて、利用者側が準備する仕様にしたいと思います。

<!--more-->

## 仕様

*   フィルタ条件の入力フィールドは、プラグイン利用者側が書く
*   どの条件入力フィールドがどの列に対応するかは、プラグイン実行時に利用者が指定する
*   条件入力フィールドはラジオボタン、プルダウンメニューにも対応
*   条件入力フィールドにキー入力、値変更が発生したら、自動的にフィルタリングが行われる
*   オプションでフィルタリングの自動実行が抑止でき、プラグイン利用者の任意のタイミングでフィルタリングを行うことができる

## プラグインの実行方法

以下のような感じで実行できるようにしてみます。

### フィルタ条件の入力フィールド

とりあえずテキストフィールド、ラジオボタン、プルダウンメニューに対応させます。

<pre>&lt;h2&gt;Filter&lt;/h2&gt;
&lt;dl class="filters"&gt;
    &lt;dt&gt;Class：&lt;/dt&gt;
    &lt;dd&gt;
        &lt;input name="class-filter" type="radio" value="" checked/&gt;all
        &lt;input name="class-filter" type="radio" value="core"/&gt;core
        &lt;input name="class-filter" type="radio" value="ui"/&gt;ui
    &lt;/dd&gt;
    &lt;dt&gt;Category：&lt;/dt&gt;
    &lt;dd&gt;
        &lt;input id="category-filter"/&gt;
    &lt;/dd&gt;
    &lt;dt&gt;Qty：&lt;/dt&gt;
    &lt;dd&gt;
        &lt;select id="qty-filter"&gt;
            &lt;option&gt;hoge&lt;/option&gt;
            &lt;option&gt;fuga&lt;/option&gt;
        &lt;/select&gt;
    &lt;/dd&gt;
&lt;/dl&gt;
</pre>

### データテーブル

ヘッダは thead、データは tbody に記述します。

<pre>&lt;h2&gt;Data&lt;/h2&gt;
&lt;table id="data"&gt;
    &lt;thead&gt;
        &lt;tr&gt;
            &lt;th&gt;No&lt;/th&gt;
            &lt;th&gt;Class&lt;/th&gt;
            &lt;th&gt;Category&lt;/th&gt;
            &lt;th&gt;Qty&lt;/th&gt;
        &lt;/tr&gt;
    &lt;/thead&gt;
    &lt;tbody&gt;
        &lt;tr&gt;
            &lt;td&gt;1&lt;/td&gt;
            &lt;td&gt;core&lt;/td&gt;
            &lt;td&gt;Ajax&lt;/td&gt;
            &lt;td&gt;203&lt;/td&gt;
        &lt;/tr&gt;
        &lt;tr&gt;
            ……
        &lt;/tr&gt;
    &lt;/tbody&gt;
&lt;/table&gt;
</pre>

### JavaScript

列番号とフィルタ入力フィールドの対応を指定してプラグインを実行します。

    $('table').simpleTableFilter({
        filters : {
            1 : 'input[name=class-filter]',
            2 : '#category-filter',
            3 : '#qty-filter'
        }
    });
    

## プラグインの構造

たまには prototype ベースオブジェクトとか使わずだらだら書いてみます。

    $.fn.simpleTableFilter = function(option){
    
        //オプション設定
        option = $.extend({
            autoFiltering : true
        },option);
    
        return this.each(function(){
    
            //table 要素の取得
            var target = $(this);
    
            //--------------------------------------------------------------
            //フィルタリング処理の実装とテーブルへのバインド
            //--------------------------------------------------------------
    
            //--------------------------------------------------------------
            //条件入力フィールドに変更があったらフィルタリング処理を起動する
            //--------------------------------------------------------------
        });
    }
    

「フィルタリング処理の実装とテーブルへのバインド」を行った後、「条件入力フィールドに変更があったらフィルタリング処理を起動する」実装をします。

## フィルタリング処理の実装とテーブルへのバインド

「フィルタリング処理の実装とテーブルへのバインド」を行います。  
これにより trigger() メソッドを使用することで、利用者が任意のタイミングでフィルタリング処理を起動できるようになります。

    $.fn.simpleTableFilter = function(option){
    
        //オプション設定
        option = $.extend({
            autoFiltering : true
        },option);
    
        return this.each(function(){
    
            //table 要素の取得
            var target = $(this);
    
            //--------------------------------------------------------------
            //フィルタリング処理の実装とテーブルへのバインド
            //--------------------------------------------------------------
            target.on('table-filtering',function(){
    
                //tr でループ
                $(this).find('&gt; tbody &gt; tr').each(function(){
    
                    //一旦 tr を表示状態にする
                    var tr = $(this).show();
    
                    //td でループ
                    $(this).find('&gt; *').each(function(index){
    
                        //対応するフィルタを取得
                        var filter = option.filters[index];
    
                        //フィルタの割り当てられてるか？
                        if(filter){
    
                            //jQuery オブジェクト化
                            filter = $(filter);
    
                            //td の値を小文字化して取得
                            var data = $(this).text().toLowerCase();
    
                            //フィルタの値を小文字化して取得
                            var filter_val = filter.val().toLowerCase();
    
                            //ラジオボタンの場合は選択された要素から値を取得
                            if(filter.prop('type') == 'radio'){
                                filter_val = filter.filter(':checked').val().toLowerCase();
                            }
    
                            //フィルタの値が td の値に含まれてなかったら
                            if(data.indexOf(filter_val) &lt; 0){
    
                                //tr を非表示にして
                                tr.hide();
    
                                //td のループを抜ける
                                return false;
                            }
                        }
                    });
                });
            });
    
            //--------------------------------------------------------------
            //条件入力フィールドに変更があったらフィルタリング処理を起動する
            //--------------------------------------------------------------
        });
    }
    

ロジックとしては、単純に tr 、td の入れ子でループし対応するフィルタ条件の値が td に含まれて無かったら、tr を非表示にするといったものです。

利用者が任意のタイミングでフィルタリング処理を起動したい場合、例えばフィルタリング実行ボタンをクリックした時にフィルタリングを行いたい場合は以下のように書きます。

    $('button#filtering').on('click',function(){
    
        //フィルタリング処理の起動
        $('table').trigger('table-filtering');
    
    });
    

## 条件入力フィールドに変更があったらフィルタリング処理を起動する

条件入力フィールドにキー入力や変更が発生する都度、自動的にフィルタリングが行われるようにします。

    $.fn.simpleTableFilter = function(option){
    
        //オプション設定
        option = $.extend({
            autoFiltering : true
        },option);
    
        return this.each(function(){
            //table 要素の取得
            var target = $(this);
    
            //--------------------------------------------------------------
            //フィルタリング処理の実装とテーブルへのバインド
            //--------------------------------------------------------------
    
            ……
    
            //--------------------------------------------------------------
            //条件入力フィールドに変更があったらフィルタリング処理を起動する
            //--------------------------------------------------------------
    
            //自動フィルタリングオプションが有効の場合のみバインドする
            if(option.autoFiltering){
    
                //条件入力フィールドでループ
                for(var i in option.filters){
    
                    //キー入力後のフィルタリング処理を遅延実行させるためのタイマー変数
                    var timer;
    
                    //フィルタ条件入力時
                    $(option.filters[i]).on('keydown change',function(){
    
                        //直近のキー入力による実行待ちのフィルタリング処理をキャンセル
                        if(timer) clearTimeout(timer);
    
                        //300ms 後のフィルタリング実行を予約
                        timer = setTimeout(function(){
                            target.trigger('table-filtering');
                        },300);
                    });
                }
    
                //フィルタリングの実行
                target.trigger('table-filtering');
            }
        });
    }
    

setTimeout を使って 300ms 以内のキー操作は一回のアクションとみなして、フィルタリング処理を実行するようにしています。

フィルタリングの自動実行をしたくない場合は以下のように autoFiltering に false を指定してプラグインを実行します。

    $('table').simpleTableFilter({
        autoFiltering : false,
        filters : {
            1 : 'input[name=class-filter]',
            2 : '#category-filter',
            3 : '#qty-filter'
        }
    });
    

## (簡単ですが)とりあえず完成

![][1]

 [1]: http://lh4.googleusercontent.com/-NsvxI0QTyoA/USJQJ3pe1BI/AAAAAAAAEMM/uS-lnLvvyZc/s400/Simple%2520Table%2520Filter.png

*   [Demo][2]
*   [jQuery Simple Table Filter - Gist][3]

 [2]: http://dl.dropbox.com/u/1735908/demo/jquery/simpletablefilter/index.html
 [3]: https://gist.github.com/cyokodog/4978338

必要最低限な機能しかないので、次は以下を考慮したバージョンも作ろうかと思います。

*   条件入力フィールドにチェックボックスを指定可にする
*   前方一致、後方一致、ワイルドカード一致等の一致条件を指定できるようにする
*   入力フィールド以外もフィルタとして指定できるようにする（function、正規表現、真偽値）
*   フィルタリング開始終了時、フィルタリング中のコールバック関数を指定できるようにする
*   フィルタリング中の値参照等、各種 API を使用できるようにする

上記のソースに付け加えると確実に見通しが悪くなると思うので、次回は prototype ベースで作ります。
