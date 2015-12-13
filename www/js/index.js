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

        // Define a div tag with id="map_canvas"
        var mapDiv = document.getElementById("map_canvas");

        // Initialize the map plugin
        var map = plugin.google.maps.Map.getMap(mapDiv, {
            'controls': {
                'compass': true,
                'myLocationButton': true,
                'indoorPicker': true,
                'zoom': true
            }
        });

        // マップのカメラを初期位置に移動したか
        var initializedCameraPosition = false;

        // 表示コンテンツを管理する連想配列
        var contentsMap = new Object();

        // Twitter API利用のための初期化処理
        var consumerKey    = "oDYBiFlyMdlEjGZv6d8DKQ1DF";
        var consumerSecret = "Q5lXboEPseBpaIKnKkMLNHZmOnEM5wIs755bg0jv0fhUCCGnDE";
        var bearerToken;
        var codeBird = new Codebird;
        codeBird.setConsumerKey(consumerKey, consumerSecret);

        // OAuth2.0認証でTwitterAPIからBearerトークンを取得する
        codeBird.__call(
            "oauth2_token",
            {},
            function (reply, err) {
                if (err) {
                    alert("error response or timeout exceeded" + err.error);
                }
                if (reply) {
                    bearerToken = reply.access_token;
                    codeBird.setBearerToken(bearerToken);
                }
            }
        );

        // onSuccess Callback
        // This method accepts a Position object, which contains the
        // current GPS coordinates
        //
        var onSuccess = function(position) {
            var element = document.getElementById('geolocation');
            element.innerHTML = 'Latitude: '  + position.coords.latitude      + '<br>' +
                                'Longitude: ' + position.coords.longitude     + '<br>' +
                                'Accuracy: '  + position.coords.accuracy      + '<br>' +
                                'Timestamp: ' + position.timestamp            + '<br>';

            if (!initializedCameraPosition) {
                var targetPosition = new plugin.google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                map.moveCamera({
                    'target': targetPosition,
                    'zoom': 17
                });
                initializedCameraPosition = true;
            }

            // Tweet検索関数の呼び出し
            getTweets(position.coords.latitude, position.coords.longitude);

            // ぐるなび検索関数の呼び出し
            getGurunabi(position.coords.latitude, position.coords.longitude);

            // コンテンツを表示する
            for (key in contentsMap ){
                addContents(contentsMap[key]);
            }
        };

        // onError Callback receives a PositionError object
        //
        var onError = function(error) {
            alert('code: '    + error.code    + '\n' +
                  'message: ' + error.message + '\n');
        };

        var watchID = navigator.geolocation.watchPosition(onSuccess, onError, { maximumAge: 3000, timeout: 27000, enableHighAccuracy: true });

        var count = 10; // 表示する件数

        // UIの更新
        function updateGurunabiList(result) {
            for ( var i in result.rest ){
                var id = result.rest[i].id;

                // 既に入っているものは無視
                if(id in contentsMap) {
                    return;
                }

                // 新しいものを連想配列に追加する
                contentsMap[id] = {
                    id: id,
                    name: result.rest[i].name, // 店舗名称
                    icon: 'http://pbs.twimg.com/profile_images/548048770592550913/C0PVdzHi_normal.jpeg', //
                    text: result.rest[i].url, // サイトURL
                    time: result.rest[i].update_date, // 情報更新日時,
                    lat: result.rest[i].latitude,
                    lng: result.rest[i].longitude
                };
            }
        }

        function getGurunabi(lat, lng) {
            var url = 'http://api.gnavi.co.jp/RestSearchAPI/20150630/?';

            // 検索するパラメータ
            var params = {
                keyid: 'd9e0f9d2f4b8c8f75673a4a43bf09479',
                format: 'json',
                latitude: lat,
                longitude: lng,
                range: 2,
                input_coordinates_mode: 1
            };

            $.getJSON(url, params, function(result){
                updateGurunabiList(result);
            });
        }

        function updateTweetList(data){ // 引数(data)に取得したデータが入ってくる
            var result = data.statuses; // 取得したデータから、メソッドチェーンで必要なものを取得
            for( var i = 0; i < result.length; i++ ) {
                var id = result[i].id;
                // 既に入っているものは無視
                if(id in contentsMap) {
                    return;
                }

                // 新しいものを連想配列に追加する
                contentsMap[id] = {
                    id: id,
                    name: result[i].user.name, // ツイートした人の名前
                    icon: result[i].user.profile_image_url, // ツイートした人のプロフィール画像
                    text: result[i].text, // ツイートの内容
                    time: result[i].created_at, // ツイートした時間,
                    lat: result[i].geo.coordinates[0],
                    lng: result[i].geo.coordinates[1]
                };
            }
        }

        // Twitter APIを使用してTweetを取得する部分
        function getTweets(latitude, longitude) {
            // 初期化していなければ何もしない
            if(bearerToken == null) {
                return;
            }

            // 検索するパラメータ
            var params = {
                q: "geocode:" + latitude + ',' + longitude + ',' + "1km" + " -I'm", // 検索するキーワード
                lang: "ja", // 日本語に設定
                result_type: "recent" // 最新の情報を取得するように設定
            };

            //　Twitterから検索
            codeBird.__call(
                "search_tweets",
                params,
                function (reply) {
                    updateTweetList(reply);
                }
            );
        }

        // 表示コンテンツを追加する（上から追加する）
        function addContents(contents) {

            // 既に表示しているコンテンツは無視する
            if($("#" + contents.id).length != 0) {
                return;
            }

            var id = contents.id;
            var lat = contents.lat;
            var lng = contents.lng;
            var text = contents.text;
            var icon = contents.icon;
            var time = contents.time;
            
            // リスト先頭にコンテンツを追加する
            $(".placeline").prepend('<li class="item" id=' + id + '>' +
                    '<div class="tweet_body">' +
                        '<div class="icon_image"><img src="' + icon +'" /></div>' +
                        '<div class="tweet_content">' +
                            '<div class="tweet_row">' +
                                // '<div class="user_name">' +
                                //     '<span class="full_name">' + contents.name + '</span>' +
                                //     '<span class="screen_name">' + @foo + '</span>' + 
                                // '</div>' +
                                '<div class="time_stamp">' + time + '</div>' +
                            '</div>' +
                            '<div class="tweet_text">' +
                                text + 
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</li>');

            // 地図にアイコンを追加する
            map.addMarker({
                'position': new plugin.google.maps.LatLng(lat, lng),
                'title': text,
                'icon': {
                    url: icon
                }
            }, function(marker) {
                marker.showInfoWindow();
            });
        }

        // 指定されたコンテンツを削除する
        function removeContents(contents) {
            // 指定されたIDのリストを削除する
            $(".TweetList").find("#" + contents.id).remove();

            // 地図のアイコンを削除する
            // TODO
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
    }
};

app.initialize();
