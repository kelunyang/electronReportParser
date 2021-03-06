# JavaScript 分時段統計器

## 功能
 1. 當你需要分析大量單筆的資料（例如：伺服器瀏覽紀錄），並且需要按照時段將資料拆開時，就可以使用他
 2. 分時累計功能提供一些簡單的統計，例如時段排名（前N名），以及按照時段變化的摺線圖
 3. 或許本程式可以幫你節省一些在Excel上思考該怎麼下公式的時間
 4. 採用Web Worker進行統計，也就是說資料筆數就算過大時，主UI也不會卡頓
 5. 本程式基本上就是計算一個欄位的，做類似SQL的GourpBy，計算出現頻率，並按照時間排序，不過考慮某些特殊需求，也可以加掛一個資料欄位，也就是說，最高支援3個欄位（不過實際上1個欄位就可以動了）

## 備註
 1. 採用Vue 2.0 + electron 設計
 2. 時間欄位採用moment.js，在自訂時間欄位格式時請參考程式內提供的時間格式
 3. 名稱欄位採用regular expression，請自行測試
 4. callback功能可以針對資料欄位做再次運算，修改前請自行測試

**本程式僅作為練習electron和webworker的作品，如有任何建議歡迎聯絡我**

[Kelunyang@outlook.com](mailto:kelunyang@outlook.com) @ 2021