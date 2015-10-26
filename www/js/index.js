/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.receivedEvent('deviceready');
        // onSuccess Callback
        // This method accepts a Position object, which contains the
        // current GPS coordinates
        //
        var onSuccess = function(position) {
            // alert('Latitude: '          + position.coords.latitude          + '\n' +
            //       'Longitude: '         + position.coords.longitude         + '\n' +
            //       'Altitude: '          + position.coords.altitude          + '\n' +
            //       'Accuracy: '          + position.coords.accuracy          + '\n' +
            //       'Altitude Accuracy: ' + position.coords.altitudeAccuracy  + '\n' +
            //       'Heading: '           + position.coords.heading           + '\n' +
            //       'Speed: '             + position.coords.speed             + '\n' +
            //       'Timestamp: '         + position.timestamp                + '\n');

            // リクエスト先のURL
            var url = "https://api.twitter.com/1.1/search/tweets.json";

            // Tweet検索関数の呼び出し
            getTweets(url, position.coords.latitude, position.coords.longitude);
        };

        // onError Callback receives a PositionError object
        //
        function onError(error) {
            alert('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
        }

        var watchID = navigator.geolocation.watchPosition(onSuccess, onError, { maximumAge: 10000, timeout: 20000, enableHighAccuracy: true });

        var consumerKey    = "oDYBiFlyMdlEjGZv6d8DKQ1DF";
        var consumerSecret = "Q5lXboEPseBpaIKnKkMLNHZmOnEM5wIs755bg0jv0fhUCCGnDE";
        var accessToken    = "3838308979-RSBMMC6L1HjI23gZ8EXMiMBGiwv99yeMaUok0ef";
        var tokenSecret    = "88omD7pr8GuTpLlVqhTbsSjXmB5hsLQk0zy0UnrNlDMCu";

        var count = 10; // 表示する件数

        // UIの更新
        function updateTweetList(data){ // 引数(data)に取得したデータが入ってくる
            $(".TweetList").empty(); // 表示エリアを空にする
            var result = data.statuses; // 取得したデータから、メソッドチェーンで必要なものを取得
            for( var i = 0; i < result.length; i++ ) {
                var name = result[i].user.name; // ツイートした人の名前
                var imgsrc = result[i].user.profile_image_url; // ツイートした人のプロフィール画像
                var content = result[i].text; // ツイートの内容
                var updated = result[i].created_at; // ツイートした時間
                var time = "";
                // Tweet表示エリアに取得したデータを追加していく
                $(".TweetList").append('<img src="'+imgsrc+'" />' + '<p>' + name + ' | ' + content + ' | ' + updated + '</p>');
            }
        }

        // Twitter APIを使用してTweetを取得する部分
        function getTweets(action, latitude, longitude) {

            var accessor = {
                consumerSecret: consumerSecret,
                tokenSecret: tokenSecret
            };

            // 送信するパラメータを連想配列で作成
            var message = {
                method: "GET", // リクエストの種類
                action: action,
                parameters: {
                    oauth_version: "1.0",
                    oauth_signature_method: "HMAC-SHA1",
                    oauth_consumer_key: consumerKey, // コンシューマーキー
                    oauth_token: accessToken, // アクセストークン
                    count: count, // 取得する件数
                    "q": "geocode:" + latitude + ',' + longitude + ',' + "0.1km" + " -\"I'm at\"", // 検索するキーワード
                    "lang": "ja", // 日本語に設定
                    "result_type": "recent" // 最新の情報を取得するように設定
                }
            };

            // OAuth認証関係
            OAuth.setTimestampAndNonce(message);
            OAuth.SignatureMethod.sign(message, accessor);
            var url = OAuth.addToURL(message.action, message.parameters);

            // ajaxによる通信
            $.ajax({
                type: message.method,
                url: url, // リクエスト先のURL
                cache: true,
            }).done(function(data){
                updateTweetList(data);
            }).fail(function(xhr, ajaxOptions, thrownError){
                alert(ajaxOptions);
                alert(thrownError);
            });
        }
        
        // (デバッグ用)idに検索ボタンと指定されている button要素にクリックイベントを設定
        document.getElementById("searchButton").addEventListener("click", function(){
            // idにキーワード入力欄と指定されている input要素に入力されている値を取得
            var keywords = document.getElementById("keywordInput").value;
            // keywordsに何も入力されていなかった場合の処理
            if (keywords == "") {
                alert("何も入力されていないようです。"); // メッセージを表示
                return; // 処理を中断
            }
            else{
                // alert(keywords + "　が入力されています。");
            }

            // リクエスト先のURL
            var url = "https://api.twitter.com/1.1/search/tweets.json";

            // Tweet検索関数の呼び出し
            getTweets(url, "35.691322", "139.709101");
        });
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    }
};

app.initialize();
